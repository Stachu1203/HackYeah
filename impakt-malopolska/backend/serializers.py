"""Zamiana wierszy SQLite na JSON w formacie oczekiwanym przez frontend (camelCase)."""

import json
import sqlite3


def issue_to_json(row: sqlite3.Row) -> dict:
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
