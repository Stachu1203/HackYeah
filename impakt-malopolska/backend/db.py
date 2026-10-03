"""Dostęp do SQLite: połączenie, zapytania z database/queries.sql, inicjalizacja i sprzątanie."""

import os
import re
import sqlite3
from pathlib import Path

from flask import g
from werkzeug.security import generate_password_hash

import embeddings

ROOT = Path(__file__).resolve().parent.parent
SQL_DIR = ROOT / "database"
DB_PATH = Path(__file__).resolve().parent / "impakt.db"

# Zgłoszenia starsze niż tydzień są usuwane.
MAX_ISSUE_AGE = "-7 days"

# Konto urzędu tworzone przy starcie — dane logowania można nadpisać zmiennymi środowiskowymi.
ADMIN_ID = "usr-admin"
ADMIN_USERNAME = os.environ.get("IMPAKT_ADMIN_USERNAME", "meow")
ADMIN_PASSWORD = os.environ.get("IMPAKT_ADMIN_PASSWORD", "meow_meow")


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
    ensure_admin(conn)
    conn.commit()


def ensure_admin(conn: sqlite3.Connection) -> None:
    """Zakłada konto urzędu, jeśli jeszcze nie istnieje (istniejącego nie nadpisuje)."""
    conn.execute(
        Q["insert_user_if_missing"],
        {
            "id": ADMIN_ID,
            "username": ADMIN_USERNAME,
            "display_name": "Urząd Małopolska",
            "password_hash": generate_password_hash(ADMIN_PASSWORD),
            "role": "admin",
        },
    )


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
        # Tabela comments doszła najpóźniej — jej brak oznacza starą bazę do odtworzenia
        # (konta w tabeli users przeżywają odtworzenie).
        has_schema = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'comments'"
        ).fetchone()
        if not has_schema:
            reset_database(conn)
        else:
            fill_missing_embeddings(conn)
            ensure_admin(conn)
            conn.commit()
        purge_old_issues(conn)
    finally:
        conn.close()
