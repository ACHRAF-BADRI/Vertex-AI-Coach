from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import activity as activity_model

activities_bp = Blueprint("activities", __name__)


def _validate_payload(data, partial=False):
    errors = {}

    if (not partial or "date" in data) and not data.get("date"):
        errors["date"] = "requis"

    for field in ("distance_km", "duration_min"):
        if not partial or field in data:
            try:
                if float(data.get(field)) <= 0:
                    errors[field] = "doit être positif"
            except (TypeError, ValueError):
                errors[field] = "doit être un nombre"

    return errors


def _get_owned_activity(activity_id):
    activity = activity_model.find_by_id(activity_id)
    if not activity or str(activity["user_id"]) != get_jwt_identity():
        return None
    return activity


@activities_bp.get("")
@jwt_required()
def list_activities():
    activities = activity_model.list_by_user(get_jwt_identity())
    return jsonify([activity_model.to_public_dict(a) for a in activities])


@activities_bp.post("")
@jwt_required()
def create_activity():
    data = request.get_json(silent=True) or {}
    errors = _validate_payload(data)
    if errors:
        return jsonify({"error": "validation", "fields": errors}), 400

    activity = activity_model.create_activity(
        user_id=get_jwt_identity(),
        date=data["date"],
        distance_km=float(data["distance_km"]),
        duration_min=float(data["duration_min"]),
        feeling=data.get("feeling"),
        notes=data.get("notes"),
    )
    return jsonify(activity_model.to_public_dict(activity)), 201


@activities_bp.put("/<activity_id>")
@jwt_required()
def update_activity_route(activity_id):
    if not _get_owned_activity(activity_id):
        return jsonify({"error": "activité introuvable"}), 404

    data = request.get_json(silent=True) or {}
    errors = _validate_payload(data, partial=True)
    if errors:
        return jsonify({"error": "validation", "fields": errors}), 400

    updates = {field: data[field] for field in ("date", "feeling", "notes") if field in data}
    if "distance_km" in data:
        updates["distance_km"] = float(data["distance_km"])
    if "duration_min" in data:
        updates["duration_min"] = float(data["duration_min"])

    updated = activity_model.update_activity(activity_id, updates)
    return jsonify(activity_model.to_public_dict(updated))


@activities_bp.delete("/<activity_id>")
@jwt_required()
def delete_activity_route(activity_id):
    if not _get_owned_activity(activity_id):
        return jsonify({"error": "activité introuvable"}), 404
    activity_model.delete_activity(activity_id)
    return "", 204
