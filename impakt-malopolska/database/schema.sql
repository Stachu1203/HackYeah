-- ImpaktMałopolska — schemat bazy SQLite
-- Embeddingi przechowujemy jako BLOB (float32, little-endian); podobieństwo liczy backend.

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS innovations;

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
    status        TEXT NOT NULL DEFAULT 'DRAFT'
                      CHECK (status IN ('DRAFT', 'READY_TO_SEND', 'SENT')),
    image_url     TEXT,                               -- data URL zdjęcia
    author_name   TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    keywords      TEXT NOT NULL DEFAULT '[]',         -- tablica JSON
    embedding     BLOB
);

CREATE INDEX idx_issues_created_at ON issues (created_at);
CREATE INDEX idx_issues_category   ON issues (category);
