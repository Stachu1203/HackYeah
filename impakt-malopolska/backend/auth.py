"""Konta: rejestracja, logowanie, sesja w podpisanym ciasteczku Flaska."""

import os
import re
import secrets
import sqlite3
import uuid
from functools import wraps
from pathlib import Path

from flask import Blueprint, abort, g, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

import db

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

USERNAME_RE = re.compile(r"^[A-Za-z0-9_.-]{3,32}$")
MIN_PASSWORD_LEN = 8
SECRET_KEY_FILE = Path(__file__).resolve().parent / ".secret_key"

# Hash do porównania, gdy login nie istnieje — czas odpowiedzi nie zdradza, czy konto jest.
_DUMMY_HASH = generate_password_hash(secrets.token_hex(16))


def load_secret_key() -> str:
    """Klucz do podpisywania sesji: ze zmiennej środowiskowej albo z pliku (tworzony raz)."""
    key = os.environ.get("IMPAKT_SECRET_KEY")
    if key:
        return key
    if not SECRET_KEY_FILE.exists():
        SECRET_KEY_FILE.write_text(secrets.token_hex(32))
        SECRET_KEY_FILE.chmod(0o600)
    return SECRET_KEY_FILE.read_text().strip()


def user_to_json(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "username": row["username"],
        "displayName": row["display_name"],
        "role": row["role"],
    }


def load_current_user() -> None:
    g.user = None
    user_id = session.get("user_id")
    if user_id:
        g.user = db.get_db().execute(db.Q["get_user_by_id"], {"id": user_id}).fetchone()
        if g.user is None:
            session.clear()


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if g.user is None:
            abort(401, description="Zaloguj się, żeby to zrobić")
        return view(*args, **kwargs)

    return wrapped


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if g.user is None:
            abort(401, description="Zaloguj się, żeby to zrobić")
        if g.user["role"] != "admin":
            abort(403, description="Tylko dla urzędu")
        return view(*args, **kwargs)

    return wrapped


def _start_session(user_id: str) -> None:
    session.clear()
    session["user_id"] = user_id
    session.permanent = True


@bp.get("/me")
def me():
    return jsonify({"user": user_to_json(g.user) if g.user else None})


@bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))
    display_name = str(data.get("displayName") or "").strip()[:60] or username

    if not USERNAME_RE.match(username):
        abort(400, description="Login: 3–32 znaki, litery, cyfry, _ . -")
    if len(password) < MIN_PASSWORD_LEN:
        abort(400, description=f"Hasło musi mieć co najmniej {MIN_PASSWORD_LEN} znaków")

    conn = db.get_db()
    user_id = f"usr-{uuid.uuid4().hex[:12]}"
    try:
        conn.execute(
            db.Q["insert_user"],
            {
                "id": user_id,
                "username": username,
                "display_name": display_name,
                "password_hash": generate_password_hash(password),
                "role": "user",
            },
        )
    except sqlite3.IntegrityError:
        abort(409, description="Ten login jest już zajęty")
    conn.commit()

    _start_session(user_id)
    user = conn.execute(db.Q["get_user_by_id"], {"id": user_id}).fetchone()
    return jsonify({"user": user_to_json(user)}), 201


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))

    row = db.get_db().execute(db.Q["get_user_by_username"], {"username": username}).fetchone()
    password_hash = row["password_hash"] if row else _DUMMY_HASH
    if not check_password_hash(password_hash, password) or row is None:
        abort(401, description="Nieprawidłowy login lub hasło")

    _start_session(row["id"])
    return jsonify({"user": user_to_json(row)})


@bp.post("/logout")
def logout():
    session.clear()
    return jsonify({"ok": True})
