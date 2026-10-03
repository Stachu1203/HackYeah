"""ImpaktMałopolska — REST API (Flask + SQLite)."""

import json
import time
import uuid

from flask import Flask, abort, jsonify, request

import db
import embeddings
from matching import find_best_matches
from petition import draft_petition
from serializers import innovation_to_json, issue_to_json

UPVOTE_THRESHOLD = 20
CATEGORIES = {
    "INFRASTRUCTURE", "EDUCATION", "SAFETY", "SENIORS",
    "ACCESSIBILITY", "HEALTH", "COMMUNITY",
}
MAX_IMAGE_CHARS = 2_100_000  # ~1.5 MB pliku po zakodowaniu base64
PURGE_INTERVAL_S = 60

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 3 * 1024 * 1024
app.config["JSON_AS_ASCII"] = False
app.json.ensure_ascii = False
app.teardown_appcontext(db.close_db)

_last_purge = 0.0


@app.before_request
def purge_week_old_issues():
    global _last_purge
    now = time.monotonic()
    if now - _last_purge >= PURGE_INTERVAL_S:
        _last_purge = now
        db.purge_old_issues(db.get_db())


@app.errorhandler(400)
@app.errorhandler(404)
@app.errorhandler(413)
def json_error(err):
    return jsonify({"error": err.description}), err.code


def _get_issue_row(issue_id: str):
    row = db.get_db().execute(db.Q["get_issue"], {"id": issue_id}).fetchone()
    if row is None:
        abort(404, description="Nie znaleziono zgłoszenia")
    return row


def _extract_keywords(description: str) -> list[str]:
    words = [w for w in description.lower().split() if len(w) > 4]
    return words[:8]


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/issues")
def list_issues():
    rows = db.get_db().execute(db.Q["list_issues"]).fetchall()
    return jsonify([issue_to_json(r) for r in rows])


@app.get("/api/issues/<issue_id>")
def get_issue(issue_id):
    return jsonify(issue_to_json(_get_issue_row(issue_id)))


@app.post("/api/issues")
def create_issue():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()[:140]
    description = str(data.get("description", "")).strip()[:2000]
    category = data.get("category")
    location_name = str(data.get("locationName", "")).strip()[:120] or "Małopolska"
    author_name = str(data.get("authorName") or "").strip()[:60] or "Anonim"
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
            "author_name": author_name,
            "keywords": keywords,
            "embedding": embeddings.embed_record(title, description, keywords),
        },
    )
    conn.commit()
    return jsonify(issue_to_json(_get_issue_row(issue_id))), 201


@app.post("/api/issues/<issue_id>/upvote")
def upvote_issue(issue_id):
    conn = db.get_db()
    cur = conn.execute(db.Q["upvote_issue"], {"id": issue_id, "threshold": UPVOTE_THRESHOLD})
    if cur.rowcount == 0:
        abort(404, description="Nie znaleziono zgłoszenia")
    conn.commit()
    return jsonify(issue_to_json(_get_issue_row(issue_id)))


@app.post("/api/issues/<issue_id>/sent")
def mark_sent(issue_id):
    conn = db.get_db()
    cur = conn.execute(db.Q["mark_sent"], {"id": issue_id})
    if cur.rowcount == 0:
        abort(404, description="Nie znaleziono zgłoszenia")
    conn.commit()
    return jsonify(issue_to_json(_get_issue_row(issue_id)))


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
