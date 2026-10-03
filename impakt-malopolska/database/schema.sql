-- ImpaktMałopolska — schemat bazy SQLite
-- Embeddingi przechowujemy jako BLOB (float32, little-endian); podobieństwo liczy backend.

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS issue_images;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS innovations;
-- Konta przeżywają reset danych demo — tabeli users nie usuwamy.

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    display_name  TEXT NOT NULL,
    password_hash TEXT NOT NULL,                      -- werkzeug (scrypt)
    role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    -- Miejsce zamieszkania: domyślny filtr tablicy. Starsze bazy dostają te kolumny przez migrację w db.py.
    location_name TEXT,
    latitude      REAL,
    longitude     REAL,
    banned_at     TEXT,                               -- NULL = konto aktywne
    ban_reason    TEXT
);

CREATE TABLE innovations (
    id                  TEXT PRIMARY KEY,
    title               TEXT NOT NULL,
    source_municipality TEXT NOT NULL,
    description         TEXT NOT NULL,
    category            TEXT NOT NULL CHECK (category IN (
                            'INFRASTRUCTURE', 'EDUCATION', 'SAFETY', 'SENIORS',
                            'ACCESSIBILITY', 'HEALTH', 'COMMUNITY')),
    keywords            TEXT NOT NULL DEFAULT '[]',   -- tablica JSON
    grant_hint          TEXT NOT NULL,
    embedding           BLOB                          -- NULL = do przeliczenia
);

CREATE TABLE issues (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL,
    category      TEXT NOT NULL CHECK (category IN (
                      'INFRASTRUCTURE', 'EDUCATION', 'SAFETY', 'SENIORS',
                      'ACCESSIBILITY', 'HEALTH', 'COMMUNITY')),
    latitude      REAL NOT NULL,
    longitude     REAL NOT NULL,
    location_name TEXT NOT NULL,
    upvotes       INTEGER NOT NULL DEFAULT 1 CHECK (upvotes >= 0),
    downvotes     INTEGER NOT NULL DEFAULT 0 CHECK (downvotes >= 0),
    status        TEXT NOT NULL DEFAULT 'DRAFT'
                      CHECK (status IN ('DRAFT', 'READY_TO_SEND', 'SENT')),
    author_name   TEXT NOT NULL,
    author_id     TEXT REFERENCES users (id) ON DELETE SET NULL,  -- NULL dla danych startowych
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    keywords      TEXT NOT NULL DEFAULT '[]',         -- tablica JSON
    embedding     BLOB
);

CREATE INDEX idx_issues_created_at ON issues (created_at);
CREATE INDEX idx_issues_category   ON issues (category);

-- Jeden głos na konto: +1 albo -1. Wynik zgłoszenia = upvotes - downvotes.
CREATE TABLE votes (
    issue_id   TEXT NOT NULL REFERENCES issues (id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    value      INTEGER NOT NULL CHECK (value IN (1, -1)),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    PRIMARY KEY (issue_id, user_id)
);

CREATE INDEX idx_votes_user ON votes (user_id);

CREATE TABLE comments (
    id          TEXT PRIMARY KEY,
    issue_id    TEXT NOT NULL REFERENCES issues (id) ON DELETE CASCADE,
    user_id     TEXT REFERENCES users (id) ON DELETE SET NULL,  -- NULL dla danych startowych
    author_name TEXT NOT NULL,
    body        TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_comments_issue ON comments (issue_id, created_at);

-- Zdjęcia zgłoszenia (do 4), trzymane jako bajty; serwowane pod /api/images/<id>.
CREATE TABLE issue_images (
    id       TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL REFERENCES issues (id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    mime     TEXT NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
    data     BLOB NOT NULL
);

CREATE INDEX idx_issue_images_issue ON issue_images (issue_id, position);

-- Zgłoszenia nadużyć (post albo komentarz) do przejrzenia przez urząd.
CREATE TABLE reports (
    id             TEXT PRIMARY KEY,
    reporter_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    target_user_id TEXT REFERENCES users (id) ON DELETE SET NULL,  -- NULL: autor z danych startowych
    issue_id       TEXT REFERENCES issues (id) ON DELETE CASCADE,
    comment_id     TEXT REFERENCES comments (id) ON DELETE CASCADE,
    reason         TEXT NOT NULL CHECK (length(reason) BETWEEN 1 AND 500),
    status         TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED')),
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CHECK (issue_id IS NOT NULL OR comment_id IS NOT NULL)
);

CREATE INDEX idx_reports_status ON reports (status, created_at);
