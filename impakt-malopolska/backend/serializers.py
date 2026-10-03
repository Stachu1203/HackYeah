"""Zamiana wierszy SQLite na JSON w formacie oczekiwanym przez frontend (camelCase)."""

import json
import sqlite3


def issue_to_json(
    row: sqlite3.Row,
    my_vote: int = 0,
    image_ids: list[str] | None = None,
    current_user: sqlite3.Row | None = None,
) -> dict:
    can_delete = current_user is not None and (
        current_user["role"] == "admin" or current_user["id"] == row["author_id"]
    )
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "category": row["category"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "locationName": row["location_name"],
        "upvotes": row["upvotes"],
        "downvotes": row["downvotes"],
        "score": row["upvotes"] - row["downvotes"],
        "status": row["status"],
        "images": [f"/api/images/{image_id}" for image_id in image_ids or []],
        "authorName": row["author_name"],
        "createdAt": row["created_at"],
        "keywords": json.loads(row["keywords"]),
        "myVote": my_vote,
        "commentsCount": row["comments_count"],
        "canDelete": can_delete,
    }


def comment_to_json(row: sqlite3.Row, current_user: sqlite3.Row | None) -> dict:
    can_delete = current_user is not None and (
        current_user["role"] == "admin" or current_user["id"] == row["user_id"]
    )
    return {
        "id": row["id"],
        "issueId": row["issue_id"],
        "authorName": row["author_name"],
        "authorRole": row["author_role"],
        "body": row["body"],
        "createdAt": row["created_at"],
        "canDelete": can_delete,
    }


def innovation_to_json(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "sourceMunicipality": row["source_municipality"],
        "description": row["description"],
        "category": row["category"],
        "keywords": json.loads(row["keywords"]),
        "grantHint": row["grant_hint"],
    }
