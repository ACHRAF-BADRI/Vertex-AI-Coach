from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.models import gym_plan as gym_plan_model
from app.models import gym_profile as gym_profile_model
from app.services import gym_coach, translator
from app.utils.decorators import active_required

gym_bp = Blueprint("gym", __name__)


@gym_bp.get("/profile")
@active_required
def get_profile():
    profile = gym_profile_model.get_profile(get_jwt_identity())
    if not profile:
        return jsonify(None)
    return jsonify(gym_profile_model.to_public_dict(profile))


@gym_bp.put("/profile")
@active_required
def update_profile():
    data = request.get_json(silent=True) or {}
    goal = (data.get("goal") or "").strip()
    level = (data.get("level") or "").strip()
    equipment = (data.get("equipment") or "").strip()

    if not goal or not level or not equipment:
        return jsonify({"error": "objectif, niveau et équipement sont requis"}), 400

    profile = gym_profile_model.upsert_profile(
        user_id=get_jwt_identity(),
        goal=goal,
        level=level,
        equipment=equipment,
        dietary_notes=data.get("dietary_notes"),
    )
    return jsonify(gym_profile_model.to_public_dict(profile))


@gym_bp.post("/plan/generate")
@active_required
def generate_plan():
    user_id = get_jwt_identity()
    profile = gym_profile_model.get_profile(user_id)
    if not profile:
        return jsonify({"error": "complète d'abord ton profil gym"}), 400

    try:
        result = gym_coach.generate_plan(gym_profile_model.to_public_dict(profile))
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 502

    plan = gym_plan_model.save_plan(
        user_id,
        profile.get("goal"),
        result["workout_split"],
        result["nutrition"],
        result["supplements"],
        result.get("expected_results"),
    )
    return jsonify(gym_plan_model.to_public_dict(plan)), 201


@gym_bp.get("/plan/current")
@active_required
def current_plan():
    plan = gym_plan_model.get_current_plan(get_jwt_identity())
    if not plan:
        return jsonify(None)
    return jsonify(gym_plan_model.to_public_dict(plan))


@gym_bp.delete("/plan/current")
@active_required
def delete_current_plan():
    gym_plan_model.delete_current(get_jwt_identity())
    return "", 204


@gym_bp.post("/plan/translate")
@active_required
def translate_current_plan():
    data = request.get_json(silent=True) or {}
    lang = data.get("lang")
    if lang not in ("fr", "en"):
        return jsonify({"error": "langue invalide"}), 400

    plan = gym_plan_model.get_current_plan(get_jwt_identity())
    if not plan:
        return jsonify(None)

    payload = {
        "workout_split": plan.get("workout_split", []),
        "nutrition": plan.get("nutrition", {}),
        "supplements": plan.get("supplements", []),
        "expected_results": plan.get("expected_results"),
    }
    try:
        translated = translator.translate_json(payload, lang)
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 502

    result = gym_plan_model.to_public_dict(plan)
    result["workout_split"] = translated.get("workout_split", result["workout_split"])
    result["nutrition"] = translated.get("nutrition", result["nutrition"])
    result["supplements"] = translated.get("supplements", result["supplements"])
    result["expected_results"] = translated.get("expected_results", result["expected_results"])
    return jsonify(result)
