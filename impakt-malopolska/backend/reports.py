"""Zgłaszanie nadużyć (posty, komentarze) i blokowanie kont przez urząd."""

import uuid

from flask import Blueprint, abort, g, jsonify, request

import db
from auth import admin_required, login_required

bp = Blueprint("reports", __name__, url_prefix="/api")

MAX_REASON_CHARS = 500


def _report_to_json(row) -> dict:
    return {
        "id": row["id"],
        "reason": row["reason"],
        "createdAt": row["created_at"],
        "reporterName": row["reporter_name"],
        "issueId": row["issue_id"] or row["comment_issue_id"],
        "issueTitle": row["issue_title"],
        "commentId": row["comment_id"],
        "commentBody": row["comment_body"],
        "target": (
            {
                "id": row["target_user_id"],
                "displayName": row["target_name"],
                "username": row["target_username"],
                "banned": row["target_banned_at"] is not None,
            }
            if row["target_user_id"]
            else None
        ),
    }


@bp.post("/reports")
@login_required
def create_report():
    data = request.get_json(silent=True) or {}
    reason = str(data.get("reason", "")).strip()[:MAX_REASON_CHARS]
    issue_id = data.get("issueId") or None
    comment_id = data.get("commentId") or None
    if not reason:
        abort(400, description="Napisz, co jest nie tak")
    if bool(issue_id) == bool(comment_id):
        abort(400, description="Zgłoś albo post, albo komentarz")

    conn = db.get_db()
    if comment_id:
        row = conn.execute(db.Q["get_comment"], {"id": comment_id}).fetchone()
        if row is None:
            abort(404, description="Nie znaleziono komentarza")
        target_user_id = row["user_id"]
    else:
        row = conn.execute(db.Q["get_issue"], {"id": issue_id}).fetchone()
        if row is None:
            abort(404, description="Nie znaleziono zgłoszenia")
        target_user_id = row["author_id"]
    if target_user_id == g.user["id"]:
        abort(400, description="Nie możesz zgłosić własnej treści")

    params = {"reporter_id": g.user["id"], "issue_id": issue_id, "comment_id": comment_id}
    if conn.execute(db.Q["has_open_report"], params).fetchone():
        abort(409, description="Już to zgłosiłeś — urząd się tym zajmie")

    conn.execute(
        db.Q["insert_report"],
        {**params, "id": f"rep-{uuid.uuid4().hex[:10]}", "target_user_id": target_user_id, "reason": reason},
    )
    conn.commit()
    return jsonify({"ok": True}), 201


@bp.get("/admin/reports")
@admin_required
def list_reports():
    rows = db.get_db().execute(db.Q["list_open_reports"]).fetchall()
    return jsonify([_report_to_json(r) for r in rows])


@bp.post("/admin/reports/<report_id>/dismiss")
@admin_required
def dismiss_report(report_id):
    conn = db.get_db()
    if conn.execute(db.Q["set_report_status"], {"id": report_id, "status": "DISMISSED"}).rowcount == 0:
        abort(404, description="Nie ma takiego otwartego zgłoszenia")
    conn.commit()
    return jsonify({"ok": True})


@bp.post("/admin/reports/<report_id>/resolve")
@admin_required
def resolve_report(report_id):
    """Akcje: delete (usuń treść), ban (zablokuj autora) — można obie naraz."""
    data = request.get_json(silent=True) or {}
    delete_content = bool(data.get("deleteContent"))
    ban_author = bool(data.get("banAuthor"))
    ban_reason = str(data.get("banReason") or "").strip()[:MAX_REASON_CHARS] or None

    conn = db.get_db()
    report = next(
        (r for r in conn.execute(db.Q["list_open_reports"]).fetchall() if r["id"] == report_id),
        None,
    )
    if report is None:
        abort(404, description="Nie ma takiego otwartego zgłoszenia")

    if ban_author:
        if not report["target_user_id"]:
            abort(400, description="Autor tej treści nie ma konta — można tylko usunąć treść")
        conn.execute(db.Q["ban_user"], {"id": report["target_user_id"], "reason": ban_reason})
        conn.execute(db.Q["resolve_reports_for_user"], {"user_id": report["target_user_id"]})
    conn.execute(db.Q["set_report_status"], {"id": report_id, "status": "RESOLVED"})
    if delete_content:
        if report["comment_id"]:
            conn.execute(db.Q["delete_comment"], {"id": report["comment_id"]})
        elif report["issue_id"]:
            conn.execute(db.Q["delete_issue"], {"id": report["issue_id"]})
    conn.commit()
    return jsonify({"ok": True})


@bp.get("/admin/bans")
@admin_required
def list_bans():
    rows = db.get_db().execute(db.Q["list_banned_users"]).fetchall()
    return jsonify([
        {
            "id": r["id"],
            "username": r["username"],
            "displayName": r["display_name"],
            "bannedAt": r["banned_at"],
            "reason": r["ban_reason"],
        }
        for r in rows
    ])


@bp.post("/admin/users/<user_id>/unban")
@admin_required
def unban(user_id):
    conn = db.get_db()
    if conn.execute(db.Q["unban_user"], {"id": user_id}).rowcount == 0:
        abort(404, description="Nie ma takiego konta")
    conn.commit()
    return jsonify({"ok": True})
