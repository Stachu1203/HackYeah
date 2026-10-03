"""ImpaktMałopolska — REST API (Flask + SQLite)."""

import json
import time
import uuid
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# Przed importem db/auth — one czytają zmienne środowiskowe przy imporcie.
load_dotenv(Path(__file__).resolve().parent / ".env")

from flask import Flask, abort, g, jsonify, request  # noqa: E402

import auth  # noqa: E402
import db  # noqa: E402
import embeddings  # noqa: E402
from auth import admin_required, login_required  # noqa: E402
from matching import find_best_matches  # noqa: E402
from petition import draft_petition  # noqa: E402
from serializers import comment_to_json, innovation_to_json, issue_to_json  # noqa: E402

UPVOTE_THRESHOLD = 20
CATEGORIES = {
    "INFRASTRUCTURE", "EDUCATION", "SAFETY", "SENIORS",
    "ACCESSIBILITY", "HEALTH", "COMMUNITY",
}
MAX_COMMENT_CHARS = 1000
MAX_IMAGE_CHARS = 2_100_000  # ~1.5 MB pliku po zakodowaniu base64
PURGE_INTERVAL_S = 60

app = Flask(__name__)
app.config["SECRET_KEY"] = auth.load_secret_key()
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=30)
app.config["MAX_CONTENT_LENGTH"] = 3 * 1024 * 1024
app.config["JSON_AS_ASCII"] = False
app.json.ensure_ascii = False
app.teardown_appcontext(db.close_db)
app.register_blueprint(auth.bp)

_last_purge = 0.0


@app.before_request
def purge_week_old_issues():
    global _last_purge
    now = time.monotonic()
    if now - _last_purge >= PURGE_INTERVAL_S:
        _last_purge = now
        db.purge_old_issues(db.get_db())


app.before_request(auth.load_current_user)


@app.errorhandler(400)
@app.errorhandler(401)
@app.errorhandler(403)
@app.errorhandler(404)
@app.errorhandler(409)
@app.errorhandler(413)
def json_error(err):
    return jsonify({"error": err.description}), err.code


def _get_issue_row(issue_id: str):
    row = db.get_db().execute(db.Q["get_issue"], {"id": issue_id}).fetchone()
    if row is None:
        abort(404, description="Nie znaleziono zgłoszenia")
    return row


def _has_voted(issue_id: str) -> bool:
    if g.user is None:
        return False
    row = db.get_db().execute(
        db.Q["has_vote"], {"id": issue_id, "user_id": g.user["id"]}
    ).fetchone()
    return row is not None


def _issue_response(issue_id: str):
    return jsonify(issue_to_json(_get_issue_row(issue_id), _has_voted(issue_id)))


def _extract_keywords(description: str) -> list[str]:
    words = [w for w in description.lower().split() if len(w) > 4]
    return words[:8]


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/issues")
def list_issues():
    conn = db.get_db()
    rows = conn.execute(db.Q["list_issues"]).fetchall()
    voted = set()
    if g.user is not None:
        voted = {
            r["issue_id"]
            for r in conn.execute(db.Q["voted_issue_ids"], {"user_id": g.user["id"]})
        }
    return jsonify([issue_to_json(r, r["id"] in voted) for r in rows])


@app.get("/api/issues/<issue_id>")
def get_issue(issue_id):
    return _issue_response(issue_id)


@app.post("/api/issues")
@login_required
def create_issue():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()[:140]
    description = str(data.get("description", "")).strip()[:2000]
    category = data.get("category")
    location_name = str(data.get("locationName", "")).strip()[:120] or "Małopolska"
    image_url = data.get("imageUrl")

    if not title or not description:
        abort(400, description="Tytuł i opis są wymagane")
    if category not in CATEGORIES:
        abort(400, description="Nieznana kategoria")
    try:
        latitude = float(data["latitude"])
        longitude = float(data["longitude"])
    except (KeyError, TypeError, ValueError):
        abort(400, description="Niepoprawna lokalizacja")
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        abort(400, description="Niepoprawna lokalizacja")
    if image_url is not None:
        if not isinstance(image_url, str) or not image_url.startswith("data:image/"):
            abort(400, description="Zdjęcie musi być obrazem")
        if len(image_url) > MAX_IMAGE_CHARS:
            abort(413, description="Zdjęcie za duże (max ~1.5 MB)")

    keywords = json.dumps(_extract_keywords(description), ensure_ascii=False)
    issue_id = f"iss-{uuid.uuid4().hex[:10]}"
    conn = db.get_db()
    conn.execute(
        db.Q["insert_issue"],
        {
            "id": issue_id,
            "title": title,
            "description": description,
            "category": category,
            "latitude": latitude,
            "longitude": longitude,
            "location_name": location_name,
            "image_url": image_url,
            "author_name": g.user["display_name"],
            "author_id": g.user["id"],
            "keywords": keywords,
            "embedding": embeddings.embed_record(title, description, keywords),
        },
    )
    # Autor zgłoszenia oddaje pierwszy głos (upvotes = 1 przy wstawieniu).
    conn.execute(db.Q["add_vote"], {"id": issue_id, "user_id": g.user["id"]})
    conn.commit()
    return _issue_response(issue_id), 201


@app.post("/api/issues/<issue_id>/upvote")
@login_required
def upvote_issue(issue_id):
    _get_issue_row(issue_id)
    conn = db.get_db()
    params = {"id": issue_id, "user_id": g.user["id"], "threshold": UPVOTE_THRESHOLD}
    # INSERT OR IGNORE jest atomowy: licznik rośnie tylko przy pierwszym głosie tego konta.
    if conn.execute(db.Q["add_vote"], params).rowcount == 1:
        conn.execute(db.Q["upvote_issue"], params)
    conn.commit()
    return _issue_response(issue_id)


@app.delete("/api/issues/<issue_id>/upvote")
@login_required
def remove_upvote(issue_id):
    _get_issue_row(issue_id)
    conn = db.get_db()
    params = {"id": issue_id, "user_id": g.user["id"], "threshold": UPVOTE_THRESHOLD}
    if conn.execute(db.Q["remove_vote"], params).rowcount == 1:
        conn.execute(db.Q["downvote_issue"], params)
    conn.commit()
    return _issue_response(issue_id)


@app.post("/api/issues/<issue_id>/sent")
@login_required
def mark_sent(issue_id):
    conn = db.get_db()
    cur = conn.execute(db.Q["mark_sent"], {"id": issue_id})
    if cur.rowcount == 0:
        abort(404, description="Nie znaleziono zgłoszenia")
    conn.commit()
    return _issue_response(issue_id)


@app.get("/api/issues/<issue_id>/comments")
def list_comments(issue_id):
    _get_issue_row(issue_id)
    rows = db.get_db().execute(db.Q["list_comments"], {"issue_id": issue_id}).fetchall()
    return jsonify([comment_to_json(r, g.user) for r in rows])


@app.post("/api/issues/<issue_id>/comments")
@login_required
def add_comment(issue_id):
    _get_issue_row(issue_id)
    data = request.get_json(silent=True) or {}
    body = str(data.get("body", "")).strip()
    if not body:
        abort(400, description="Komentarz nie może być pusty")
    if len(body) > MAX_COMMENT_CHARS:
        abort(400, description=f"Komentarz może mieć najwyżej {MAX_COMMENT_CHARS} znaków")

    comment_id = f"cmt-{uuid.uuid4().hex[:10]}"
    conn = db.get_db()
    conn.execute(
        db.Q["insert_comment"],
        {
            "id": comment_id,
            "issue_id": issue_id,
            "user_id": g.user["id"],
            "author_name": g.user["display_name"],
            "body": body,
        },
    )
    conn.commit()
    row = conn.execute(db.Q["get_comment"], {"id": comment_id}).fetchone()
    return jsonify(comment_to_json(row, g.user)), 201


@app.delete("/api/comments/<comment_id>")
@login_required
def delete_comment(comment_id):
    conn = db.get_db()
    row = conn.execute(db.Q["get_comment"], {"id": comment_id}).fetchone()
    if row is None:
        abort(404, description="Nie znaleziono komentarza")
    if not comment_to_json(row, g.user)["canDelete"]:
        abort(403, description="Możesz usuwać tylko własne komentarze")
    conn.execute(db.Q["delete_comment"], {"id": comment_id})
    conn.commit()
    return jsonify({"ok": True})


@app.get("/api/issues/<issue_id>/matches")
def issue_matches(issue_id):
    row = _get_issue_row(issue_id)
    matches = find_best_matches(db.get_db(), row, limit=3)
    return jsonify({"matches": matches, "best": matches[0] if matches else None})


@app.post("/api/issues/<issue_id>/petition")
def issue_petition(issue_id):
    conn = db.get_db()
    row = _get_issue_row(issue_id)
    data = request.get_json(silent=True) or {}

    matches = find_best_matches(conn, row, limit=1)
    best = matches[0] if matches else None
    innovation = best["innovation"] if best else None
    if data.get("innovationId"):
        inn_row = conn.execute(db.Q["get_innovation"], {"id": data["innovationId"]}).fetchone()
        innovation = innovation_to_json(inn_row) if inn_row else innovation

    petition = draft_petition(issue_to_json(row), innovation, best["score"] if best else 0)
    return jsonify({
        "petition": petition,
        "innovation": innovation,
        "demoNote": "Wniosek wygenerowany lokalnie (szablon + matchmaking na embeddingach). "
                    "Na demo „Wyślij” otwiera mailto — bez ePUAP.",
    })


@app.post("/api/reset")
@admin_required
def reset():
    db.reset_database(db.get_db())
    return {"ok": True}


@app.cli.command("init-db")
def init_db_command():
    """Odtwarza bazę ze schema.sql i seed.sql."""
    conn = db.connect()
    db.reset_database(conn)
    conn.close()
    print(f"Baza odtworzona: {db.DB_PATH}")


db.init_if_needed()

if __name__ == "__main__":
    app.run(port=5001, debug=True)
