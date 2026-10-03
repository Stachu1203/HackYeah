-- ImpaktMałopolska — zapytania używane przez backend.
-- Każde zapytanie poprzedza znacznik "-- name: <nazwa>"; backend ładuje je po nazwie.
-- Parametry nazwane w stylu SQLite (:param).

-- name: list_issues
SELECT id, title, description, category, latitude, longitude, location_name,
       upvotes, status, image_url, author_name, created_at, keywords
FROM issues
ORDER BY created_at DESC;

-- name: get_issue
SELECT id, title, description, category, latitude, longitude, location_name,
       upvotes, status, image_url, author_name, created_at, keywords, embedding
FROM issues
WHERE id = :id;

-- name: insert_issue
INSERT INTO issues (id, title, description, category, latitude, longitude,
                    location_name, upvotes, status, image_url, author_name,
                    author_id, created_at, keywords, embedding)
VALUES (:id, :title, :description, :category, :latitude, :longitude,
        :location_name, 1, 'DRAFT', :image_url, :author_name, :author_id,
        strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), :keywords, :embedding);

-- name: add_vote
INSERT OR IGNORE INTO votes (issue_id, user_id) VALUES (:id, :user_id);

-- name: remove_vote
DELETE FROM votes WHERE issue_id = :id AND user_id = :user_id;

-- name: has_vote
SELECT 1 FROM votes WHERE issue_id = :id AND user_id = :user_id;

-- name: voted_issue_ids
SELECT issue_id FROM votes WHERE user_id = :user_id;

-- name: upvote_issue
UPDATE issues
SET upvotes = upvotes + 1,
    status  = CASE
                  WHEN status = 'DRAFT' AND upvotes + 1 >= :threshold THEN 'READY_TO_SEND'
                  ELSE status
              END
WHERE id = :id;

-- name: downvote_issue
UPDATE issues
SET upvotes = MAX(upvotes - 1, 0),
    status  = CASE
                  WHEN status = 'READY_TO_SEND' AND upvotes - 1 < :threshold THEN 'DRAFT'
                  ELSE status
              END
WHERE id = :id;

-- name: mark_sent
UPDATE issues SET status = 'SENT' WHERE id = :id;

-- name: purge_old_issues
DELETE FROM issues
WHERE created_at < strftime('%Y-%m-%dT%H:%M:%SZ', 'now', :max_age);

-- name: list_innovations
SELECT id, title, source_municipality, description, category, keywords,
       grant_hint, embedding
FROM innovations;

-- name: get_innovation
SELECT id, title, source_municipality, description, category, keywords,
       grant_hint
FROM innovations
WHERE id = :id;

-- name: issues_missing_embedding
SELECT id, title, description, keywords FROM issues WHERE embedding IS NULL;

-- name: innovations_missing_embedding
SELECT id, title, description, keywords FROM innovations WHERE embedding IS NULL;

-- name: set_issue_embedding
UPDATE issues SET embedding = :embedding WHERE id = :id;

-- name: set_innovation_embedding
UPDATE innovations SET embedding = :embedding WHERE id = :id;

-- name: insert_user
INSERT INTO users (id, username, display_name, password_hash, role)
VALUES (:id, :username, :display_name, :password_hash, :role);

-- name: insert_user_if_missing
INSERT OR IGNORE INTO users (id, username, display_name, password_hash, role)
VALUES (:id, :username, :display_name, :password_hash, :role);

-- name: get_user_by_username
SELECT id, username, display_name, password_hash, role FROM users WHERE username = :username;

-- name: get_user_by_id
SELECT id, username, display_name, role FROM users WHERE id = :id;
