from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.models import step_session as step_session_model
from app.models import user as user_model
from app.utils.decorators import active_required

steps_bp = Blueprint("steps", __name__)


def _parse_path(raw):
    points = []
    if not isinstance(raw, list):
        return points
    for p in raw:
        try:
            points.append([round(float(p[0]), 6), round(float(p[1]), 6)])
        except (TypeError, ValueError, IndexError, KeyError):
            continue
    return points


@steps_bp.post("/sessions")
@active_required
def create_session():
    data = request.get_json(silent=True) or {}
    try:
        distance_km = float(data.get("distance_km"))
        duration_sec = float(data.get("duration_sec"))
    except (TypeError, ValueError):
        return jsonify({"error": "distance et durée invalides"}), 400
    if distance_km <= 0 or duration_sec <= 0:
        return jsonify({"error": "distance et durée doivent être positives"}), 400

    try:
        started_at = datetime.fromisoformat(str(data.get("started_at")).replace("Z", "+00:00"))
    except ValueError:
        started_at = datetime.now(timezone.utc)

    user_id = get_jwt_identity()
    user = user_model.find_by_id(user_id)
    session = step_session_model.create_session(
        user_id,
        started_at,
        distance_km,
        duration_sec,
        user.get("weight_kg") or user_model.DEFAULT_WEIGHT_KG,
        user.get("height_cm") or user_model.DEFAULT_HEIGHT_CM,
        _parse_path(data.get("path")),
    )
    return jsonify(step_session_model.to_public_dict(session)), 201


@steps_bp.get("/sessions")
@active_required
def list_sessions():
    sessions = step_session_model.list_by_user(get_jwt_identity())
    return jsonify([step_session_model.to_public_dict(s) for s in sessions])


@steps_bp.delete("/sessions/<session_id>")
@active_required
def delete_session(session_id):
    if not step_session_model.delete_session(get_jwt_identity(), session_id):
        return jsonify({"error": "session introuvable"}), 404
    return "", 204
