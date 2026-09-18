from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import activity as activity_model
from app.models import plan as plan_model
from app.models import user as user_model
from app.services import ai_coach

plans_bp = Blueprint("plans", __name__)


@plans_bp.post("/generate")
@jwt_required()
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
@jwt_required()
def current_plan():
    plan = plan_model.get_current_plan(get_jwt_identity())
    if not plan:
        return jsonify(None)
    return jsonify(plan_model.to_public_dict(plan))
