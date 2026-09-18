from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.models import activity as activity_model
from app.models import plan as plan_model
from app.models import user as user_model
from app.services import ai_coach, translator
from app.utils.decorators import active_required

plans_bp = Blueprint("plans", __name__)


@plans_bp.post("/generate")
@active_required
def generate_plan():
    user_id = get_jwt_identity()
    user = user_model.find_by_id(user_id)
    activities = activity_model.list_by_user(user_id)

    try:
        result = ai_coach.generate_plan(user, [activity_model.to_public_dict(a) for a in activities])
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 502

    plan = plan_model.save_plan(user_id, user.get("goal"), result["weeks"])
    return jsonify(plan_model.to_public_dict(plan)), 201


@plans_bp.get("/current")
@active_required
def current_plan():
    plan = plan_model.get_current_plan(get_jwt_identity())
    if not plan:
        return jsonify(None)
    return jsonify(plan_model.to_public_dict(plan))


@plans_bp.delete("/current")
@active_required
def delete_current_plan():
    plan_model.delete_current(get_jwt_identity())
    return "", 204


@plans_bp.post("/current/translate")
@active_required
def translate_current_plan():
    data = request.get_json(silent=True) or {}
    lang = data.get("lang")
    if lang not in ("fr", "en"):
        return jsonify({"error": "langue invalide"}), 400

    plan = plan_model.get_current_plan(get_jwt_identity())
    if not plan:
        return jsonify(None)

    try:
        translated = translator.translate_json({"weeks": plan.get("weeks", [])}, lang)
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 502

    result = plan_model.to_public_dict(plan)
    result["weeks"] = translated.get("weeks", result["weeks"])
    return jsonify(result)
