-- ImpaktMałopolska — zapytania używane przez backend.
-- Każde zapytanie poprzedza znacznik "-- name: <nazwa>"; backend ładuje je po nazwie.
-- Parametry nazwane w stylu SQLite (:param).

-- name: list_issues
SELECT id, title, description, category, latitude, longitude, location_name,
       upvotes, downvotes, status, author_name, author_id, created_at, keywords,
       (SELECT COUNT(*) FROM comments c WHERE c.issue_id = issues.id) AS comments_count
FROM issues
ORDER BY created_at DESC;

-- name: get_issue
SELECT id, title, description, category, latitude, longitude, location_name,
       upvotes, downvotes, status, author_name, author_id, created_at, keywords, embedding,
       (SELECT COUNT(*) FROM comments c WHERE c.issue_id = issues.id) AS comments_count
FROM issues
WHERE id = :id;

-- name: insert_issue
INSERT INTO issues (id, title, description, category, latitude, longitude,
                    location_name, upvotes, status, author_name,
                    author_id, created_at, keywords, embedding)
VALUES (:id, :title, :description, :category, :latitude, :longitude,
        :location_name, 1, 'DRAFT', :author_name, :author_id,
        strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), :keywords, :embedding);

-- name: delete_issue
DELETE FROM issues WHERE id = :id;

-- name: get_vote
SELECT value FROM votes WHERE issue_id = :id AND user_id = :user_id;

-- name: upsert_vote
INSERT INTO votes (issue_id, user_id, value) VALUES (:id, :user_id, :value)
ON CONFLICT (issue_id, user_id) DO UPDATE
SET value = excluded.value,
    created_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now');

-- name: remove_vote
DELETE FROM votes WHERE issue_id = :id AND user_id = :user_id;

-- name: user_votes
SELECT issue_id, value FROM votes WHERE user_id = :user_id;

-- name: adjust_vote_counts
UPDATE issues
SET upvotes   = MAX(upvotes + :up_delta, 0),
    downvotes = MAX(downvotes + :down_delta, 0)
WHERE id = :id;

-- name: refresh_status
-- Próg wniosku liczony od wyniku netto; wysłanych zgłoszeń nie cofamy.
UPDATE issues
SET status = CASE
                 WHEN status = 'SENT' THEN 'SENT'
                 WHEN upvotes - downvotes >= :threshold THEN 'READY_TO_SEND'
                 ELSE 'DRAFT'
             END
WHERE id = :id;

-- name: mark_sent
UPDATE issues SET status = 'SENT' WHERE id = :id;

-- name: purge_old_issues
DELETE FROM issues
WHERE created_at < strftime('%Y-%m-%dT%H:%M:%SZ', 'now', :max_age);

-- name: insert_image
INSERT INTO issue_images (id, issue_id, position, mime, data)
VALUES (:id, :issue_id, :position, :mime, :data);

-- name: list_image_ids
SELECT id, issue_id FROM issue_images ORDER BY issue_id, position;

-- name: issue_image_ids
SELECT id FROM issue_images WHERE issue_id = :issue_id ORDER BY position;

-- name: get_image
SELECT mime, data FROM issue_images WHERE id = :id;

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
INSERT INTO users (id, username, display_name, password_hash, role,
                   location_name, latitude, longitude)
VALUES (:id, :username, :display_name, :password_hash, :role,
        :location_name, :latitude, :longitude);

-- name: insert_user_if_missing
INSERT OR IGNORE INTO users (id, username, display_name, password_hash, role)
VALUES (:id, :username, :display_name, :password_hash, :role);

-- name: get_user_by_username
SELECT id, username, display_name, password_hash, role,
       location_name, latitude, longitude, banned_at, ban_reason
FROM users WHERE username = :username;

-- name: get_user_by_id
SELECT id, username, display_name, role,
       location_name, latitude, longitude, banned_at, ban_reason
FROM users WHERE id = :id;

-- name: update_user_location
UPDATE users
SET location_name = :location_name, latitude = :latitude, longitude = :longitude
WHERE id = :id;

-- name: ban_user
UPDATE users
SET banned_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), ban_reason = :reason
WHERE id = :id AND role <> 'admin';

-- name: unban_user
UPDATE users SET banned_at = NULL, ban_reason = NULL WHERE id = :id;

-- name: list_banned_users
SELECT id, username, display_name, banned_at, ban_reason
FROM users WHERE banned_at IS NOT NULL
ORDER BY banned_at DESC;

-- name: list_comments
SELECT c.id, c.issue_id, c.user_id, c.author_name, c.body, c.created_at,
       COALESCE(u.role, 'user') AS author_role
FROM comments c
LEFT JOIN users u ON u.id = c.user_id
WHERE c.issue_id = :issue_id
ORDER BY c.created_at ASC, c.rowid ASC;

-- name: get_comment
SELECT c.id, c.issue_id, c.user_id, c.author_name, c.body, c.created_at,
       COALESCE(u.role, 'user') AS author_role
FROM comments c
LEFT JOIN users u ON u.id = c.user_id
WHERE c.id = :id;

-- name: insert_comment
INSERT INTO comments (id, issue_id, user_id, author_name, body)
VALUES (:id, :issue_id, :user_id, :author_name, :body);

-- name: delete_comment
DELETE FROM comments WHERE id = :id;

-- name: insert_report
INSERT INTO reports (id, reporter_id, target_user_id, issue_id, comment_id, reason)
VALUES (:id, :reporter_id, :target_user_id, :issue_id, :comment_id, :reason);

-- name: has_open_report
SELECT 1 FROM reports
WHERE reporter_id = :reporter_id AND status = 'OPEN'
  AND issue_id IS :issue_id AND comment_id IS :comment_id;

-- name: list_open_reports
SELECT r.id, r.reason, r.created_at, r.issue_id, r.comment_id, r.target_user_id,
       rep.display_name AS reporter_name,
       tgt.display_name AS target_name, tgt.username AS target_username,
       tgt.banned_at AS target_banned_at,
       i.title AS issue_title,
       c.body AS comment_body, c.issue_id AS comment_issue_id
FROM reports r
JOIN users rep ON rep.id = r.reporter_id
LEFT JOIN users tgt ON tgt.id = r.target_user_id
LEFT JOIN issues i ON i.id = r.issue_id
LEFT JOIN comments c ON c.id = r.comment_id
WHERE r.status = 'OPEN'
ORDER BY r.created_at DESC;

-- name: set_report_status
UPDATE reports SET status = :status WHERE id = :id AND status = 'OPEN';

-- name: resolve_reports_for_user
UPDATE reports SET status = 'RESOLVED' WHERE target_user_id = :user_id AND status = 'OPEN';
