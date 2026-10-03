"""Zamiana wierszy SQLite na JSON w formacie oczekiwanym przez frontend (camelCase)."""

import json
import sqlite3


def issue_to_json(row: sqlite3.Row, voted: bool = False) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "category": row["category"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "locationName": row["location_name"],
        "upvotes": row["upvotes"],
        "status": row["status"],
        "imageUrl": row["image_url"],
        "authorName": row["author_name"],
        "createdAt": row["created_at"],
        "keywords": json.loads(row["keywords"]),
        "voted": voted,
        "commentsCount": row["comments_count"],
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
