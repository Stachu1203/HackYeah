"""ImpaktMałopolska — REST API (Flask + SQLite)."""

import base64
import binascii
import json
import re
import time
import uuid
from collections import defaultdict
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# Przed importem db/auth — one czytają zmienne środowiskowe przy imporcie.
load_dotenv(Path(__file__).resolve().parent / ".env")

from flask import Flask, Response, abort, g, jsonify, request  # noqa: E402

import auth  # noqa: E402
import db  # noqa: E402
import embeddings  # noqa: E402
import jev  # noqa: E402
import reports  # noqa: E402
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
MAX_IMAGES = 4
MAX_IMAGE_BYTES = 1_500_000
DATA_URL_RE = re.compile(r"^data:(image/(?:jpeg|png|webp|gif));base64,(.+)$", re.S)
# Sygnatury plików — zawartość musi zgadzać się z deklarowanym typem.
IMAGE_MAGIC = {
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/gif": (b"GIF87a", b"GIF89a"),
    "image/webp": (b"RIFF",),
}
PURGE_INTERVAL_S = 60

app = Flask(__name__)
app.config["SECRET_KEY"] = auth.load_secret_key()
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=30)
# 4 zdjęcia po 1,5 MB w base64 (+33%) i zapas na resztę formularza
app.config["MAX_CONTENT_LENGTH"] = 9 * 1024 * 1024
app.config["JSON_AS_ASCII"] = False
app.json.ensure_ascii = False
app.teardown_appcontext(db.close_db)
app.register_blueprint(auth.bp)
app.register_blueprint(reports.bp)

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
@app.errorhandler(422)
def json_error(err):
    return jsonify({"error": err.description}), err.code


def _get_issue_row(issue_id: str):
    row = db.get_db().execute(db.Q["get_issue"], {"id": issue_id}).fetchone()
    if row is None:
        abort(404, description="Nie znaleziono zgłoszenia")
    return row


def _my_vote(issue_id: str) -> int:
    if g.user is None:
        return 0
    row = db.get_db().execute(
        db.Q["get_vote"], {"id": issue_id, "user_id": g.user["id"]}
    ).fetchone()
    return row["value"] if row else 0


def _issue_response(issue_id: str):
    row = _get_issue_row(issue_id)
    image_ids = [
        r["id"] for r in db.get_db().execute(db.Q["issue_image_ids"], {"issue_id": issue_id})
    ]
    return jsonify(issue_to_json(row, _my_vote(issue_id), image_ids, g.user))


def _decode_images(raw) -> list[tuple[str, bytes]]:
    """Lista data URL-i z formularza → [(mime, bajty)]; max 4 zdjęcia po 1,5 MB."""
    if raw is None:
        return []
    if not isinstance(raw, list):
        abort(400, description="Zdjęcia muszą być listą")
    if len(raw) > MAX_IMAGES:
        abort(400, description=f"Możesz dodać najwyżej {MAX_IMAGES} zdjęcia")
    images = []
    for item in raw:
        match = DATA_URL_RE.match(item) if isinstance(item, str) else None
        if not match:
            abort(400, description="Zdjęcie musi być w formacie JPG, PNG, WebP albo GIF")
        try:
            data = base64.b64decode(match.group(2), validate=True)
        except (binascii.Error, ValueError):
            abort(400, description="Uszkodzone zdjęcie")
        if len(data) > MAX_IMAGE_BYTES:
            abort(413, description="Zdjęcie za duże (max 1,5 MB)")
        mime = match.group(1)
        if not data.startswith(IMAGE_MAGIC[mime]) or (mime == "image/webp" and data[8:12] != b"WEBP"):
            abort(400, description="Plik nie jest prawidłowym zdjęciem")
        images.append((mime, data))
    return images


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
    votes: dict[str, int] = {}
    if g.user is not None:
        votes = {
            r["issue_id"]: r["value"]
            for r in conn.execute(db.Q["user_votes"], {"user_id": g.user["id"]})
        }
    images: dict[str, list[str]] = defaultdict(list)
    for r in conn.execute(db.Q["list_image_ids"]):
        images[r["issue_id"]].append(r["id"])
    return jsonify([
        issue_to_json(r, votes.get(r["id"], 0), images[r["id"]], g.user) for r in rows
    ])


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
    images = _decode_images(data.get("images"))

    # JEV sprawdza post w chwili „Przypnij do tablicy” — nieodpowiedni nie zostanie opublikowany.
    verdict = jev.moderate_issue(title, description, location_name, images)
    if not verdict.allowed:
        abort(
            422,
            description="Zgłoszenie nie zostało zaakceptowane"
            + (f": {verdict.reason}" if verdict.reason else "")
            + ". Popraw treść i spróbuj ponownie.",
        )

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
            "author_name": g.user["display_name"],
            "author_id": g.user["id"],
            "keywords": keywords,
            "embedding": embeddings.embed_record(title, description, keywords),
        },
    )
    for position, (mime, blob) in enumerate(images):
        conn.execute(
            db.Q["insert_image"],
            {
                "id": f"img-{uuid.uuid4().hex[:12]}",
                "issue_id": issue_id,
                "position": position,
                "mime": mime,
                "data": blob,
            },
        )
    # Autor zgłoszenia oddaje pierwszy głos (upvotes = 1 przy wstawieniu).
    conn.execute(db.Q["upsert_vote"], {"id": issue_id, "user_id": g.user["id"], "value": 1})
    conn.commit()
    return _issue_response(issue_id), 201


@app.delete("/api/issues/<issue_id>")
@login_required
def delete_issue(issue_id):
    row = _get_issue_row(issue_id)
    if not issue_to_json(row, current_user=g.user)["canDelete"]:
        abort(403, description="Możesz usuwać tylko własne zgłoszenia")
    conn = db.get_db()
    conn.execute(db.Q["delete_issue"], {"id": issue_id})
    conn.commit()
    return jsonify({"ok": True})


@app.get("/api/images/<image_id>")
def get_image(image_id):
    row = db.get_db().execute(db.Q["get_image"], {"id": image_id}).fetchone()
    if row is None:
        abort(404, description="Nie znaleziono zdjęcia")
    response = Response(row["data"], mimetype=row["mime"])
    # Zdjęcia się nie zmieniają (nowe id przy każdym uploadzie).
    response.headers["Cache-Control"] = "public, max-age=604800, immutable"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.put("/api/issues/<issue_id>/vote")
@login_required
def vote_issue(issue_id):
    """Głos konta: 1 (za), -1 (przeciw), 0 (cofnij). Jeden głos na konto."""
    value = (request.get_json(silent=True) or {}).get("value")
    if value not in (1, -1, 0) or isinstance(value, bool):
        abort(400, description="Głos musi być równy 1, -1 albo 0")
    _get_issue_row(issue_id)
    conn = db.get_db()
    params = {"id": issue_id, "user_id": g.user["id"]}
    # BEGIN IMMEDIATE: odczyt starego głosu i zmiana liczników w jednej transakcji.
    conn.execute("BEGIN IMMEDIATE")
    try:
        old_row = conn.execute(db.Q["get_vote"], params).fetchone()
        old = old_row["value"] if old_row else 0
        if old != value:
            up_delta = (value == 1) - (old == 1)
            down_delta = (value == -1) - (old == -1)
            if value == 0:
                conn.execute(db.Q["remove_vote"], params)
            else:
                conn.execute(db.Q["upsert_vote"], {**params, "value": value})
            conn.execute(
                db.Q["adjust_vote_counts"],
                {"id": issue_id, "up_delta": up_delta, "down_delta": down_delta},
            )
            conn.execute(db.Q["refresh_status"], {"id": issue_id, "threshold": UPVOTE_THRESHOLD})
        conn.commit()
    except Exception:
        conn.rollback()
        raise
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
