"""Dostęp do SQLite: połączenie, zapytania z database/queries.sql, inicjalizacja i sprzątanie."""

import re
import sqlite3
from pathlib import Path

from flask import g

import embeddings

ROOT = Path(__file__).resolve().parent.parent
SQL_DIR = ROOT / "database"
DB_PATH = Path(__file__).resolve().parent / "impakt.db"

# Zgłoszenia starsze niż tydzień są usuwane.
MAX_ISSUE_AGE = "-7 days"


def _load_queries() -> dict[str, str]:
    text = (SQL_DIR / "queries.sql").read_text(encoding="utf-8")
    queries: dict[str, str] = {}
    for block in re.split(r"^-- name:\s*", text, flags=re.MULTILINE)[1:]:
        name, _, body = block.partition("\n")
        queries[name.strip()] = body.strip()
    return queries


Q = _load_queries()


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        g.db = connect()
    return g.db


def close_db(_exc=None) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def reset_database(conn: sqlite3.Connection) -> None:
    """Odtwarza schemat i wgrywa seed."""
    conn.executescript((SQL_DIR / "schema.sql").read_text(encoding="utf-8"))
    conn.executescript((SQL_DIR / "seed.sql").read_text(encoding="utf-8"))
    fill_missing_embeddings(conn)
    conn.commit()


def fill_missing_embeddings(conn: sqlite3.Connection) -> None:
    for query, setter in (
        ("issues_missing_embedding", "set_issue_embedding"),
        ("innovations_missing_embedding", "set_innovation_embedding"),
    ):
        for row in conn.execute(Q[query]).fetchall():
            vector = embeddings.embed_record(
                row["title"], row["description"], row["keywords"]
            )
            conn.execute(Q[setter], {"id": row["id"], "embedding": vector})


def purge_old_issues(conn: sqlite3.Connection) -> int:
    deleted = conn.execute(Q["purge_old_issues"], {"max_age": MAX_ISSUE_AGE}).rowcount
    conn.commit()
    return deleted


def init_if_needed() -> None:
    conn = connect()
    try:
        has_schema = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'issues'"
        ).fetchone()
        if not has_schema:
            reset_database(conn)
        else:
            fill_missing_embeddings(conn)
            conn.commit()
        purge_old_issues(conn)
    finally:
        conn.close()
