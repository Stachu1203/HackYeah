"""Matchmaking: zgłoszenie mieszkańca → podobne innowacje z innych gmin."""

import sqlite3

import embeddings
from db import Q
from serializers import innovation_to_json

CATEGORY_BONUS = 0.15
MIN_SIMILARITY = 0.10


def find_best_matches(conn: sqlite3.Connection, issue: sqlite3.Row, limit: int = 3):
    issue_vec = embeddings.from_blob(issue["embedding"])
    if issue_vec is None:
        issue_vec = embeddings.from_blob(
            embeddings.embed_record(issue["title"], issue["description"], issue["keywords"])
        )

    matches = []
    for row in conn.execute(Q["list_innovations"]).fetchall():
        inn_vec = embeddings.from_blob(row["embedding"])
        if inn_vec is None:
            continue
        similarity = embeddings.cosine(issue_vec, inn_vec)
        if similarity < MIN_SIMILARITY:
            continue
        bonus = CATEGORY_BONUS if row["category"] == issue["category"] else 0.0
        score = round(min(1.0, similarity + bonus) * 100)
        matches.append({"score": score, "innovation": innovation_to_json(row)})

    matches.sort(key=lambda m: m["score"], reverse=True)
    return matches[:limit]
