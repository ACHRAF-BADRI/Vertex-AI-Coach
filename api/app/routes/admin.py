from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.models import activity as activity_model
from app.models import gym_plan as gym_plan_model
from app.models import gym_profile as gym_profile_model
from app.models import plan as plan_model
from app.models import user as user_model
from app.routes.stats import summary_for_user
from app.utils.decorators import role_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/stats")
@role_required("admin")
def admin_stats():
    overview = user_model.stats_overview()
    overview["signups_by_week"] = user_model.signups_by_week()
    return jsonify(overview)


@admin_bp.get("/users")
@role_required("admin")
def list_users():
    try:
        page = max(int(request.args.get("page", 1)), 1)
        limit = min(max(int(request.args.get("limit", 20)), 1), 100)
    except ValueError:
        return jsonify({"error": "page/limit invalides"}), 400

    search = request.args.get("search", "").strip() or None
    role = request.args.get("role") or None

    users, total = user_model.list_paginated(page=page, limit=limit, search=search, role=role)
    return jsonify(
        {
            "users": [user_model.to_public_dict(u) for u in users],
            "total": total,
            "page": page,
            "limit": limit,
        }
    )


@admin_bp.post("/users")
@role_required("admin")
def create_user():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    name = data.get("name", "").strip()
    role = data.get("role", "user")
    goal = data.get("goal")

    if not email or not password or not name:
        return jsonify({"error": "email, password et name sont requis"}), 400
    if len(password) < 8:
        return jsonify({"error": "le mot de passe doit contenir au moins 8 caractères"}), 400
    if role not in ("user", "admin"):
        return jsonify({"error": "rôle invalide"}), 400
    if user_model.find_by_email(email):
        return jsonify({"error": "un compte existe déjà avec cet email"}), 409

    user = user_model.create_user(email=email, password=password, name=name, role=role, goal=goal)
    return jsonify(user_model.to_public_dict(user)), 201


@admin_bp.patch("/users/<user_id>")
@role_required("admin")
def update_user(user_id):
    target = user_model.find_by_id(user_id)
    if not target:
        return jsonify({"error": "utilisateur introuvable"}), 404

    data = request.get_json(silent=True) or {}
    updates = {}

    if "name" in data:
        name = data["name"].strip()
        if not name:
            return jsonify({"error": "le nom ne peut pas être vide"}), 400
        updates["name"] = name

    if "email" in data:
        email = data["email"].strip().lower()
        if not email:
            return jsonify({"error": "l'email ne peut pas être vide"}), 400
        existing = user_model.find_by_email(email)
        if existing and str(existing["_id"]) != user_id:
            return jsonify({"error": "un compte existe déjà avec cet email"}), 409
        updates["email"] = email

    if "goal" in data:
        updates["goal"] = data["goal"]

    if "role" in data:
        role = data["role"]
        if role not in ("user", "admin"):
            return jsonify({"error": "rôle invalide"}), 400
        if user_id == get_jwt_identity() and role != "admin":
            return jsonify({"error": "impossible de te retirer tes propres droits admin"}), 400
        updates["role"] = role

    if "status" in data:
        status = data["status"]
        if status not in ("active", "suspended"):
            return jsonify({"error": "statut invalide"}), 400
        if user_id == get_jwt_identity() and status == "suspended":
            return jsonify({"error": "impossible de suspendre ton propre compte"}), 400
        updates["status"] = status

    if not updates:
        return jsonify({"error": "aucune modification fournie"}), 400

    updated = user_model.update_user(user_id, updates)
    return jsonify(user_model.to_public_dict(updated))


@admin_bp.delete("/users/<user_id>")
@role_required("admin")
def delete_user(user_id):
    if user_id == get_jwt_identity():
        return jsonify({"error": "impossible de supprimer ton propre compte"}), 400

    if not user_model.find_by_id(user_id):
        return jsonify({"error": "utilisateur introuvable"}), 404

    activity_model.delete_by_user(user_id)
    plan_model.delete_by_user(user_id)
    gym_plan_model.delete_by_user(user_id)
    gym_profile_model.delete_by_user(user_id)
    user_model.delete_user(user_id)
    return "", 204


@admin_bp.get("/users/<user_id>/activities")
@role_required("admin")
def user_activities(user_id):
    if not user_model.find_by_id(user_id):
        return jsonify({"error": "utilisateur introuvable"}), 404
    activities = activity_model.list_by_user(user_id)
    return jsonify([activity_model.to_public_dict(a) for a in activities])


@admin_bp.get("/users/<user_id>/stats")
@role_required("admin")
def user_stats(user_id):
    if not user_model.find_by_id(user_id):
        return jsonify({"error": "utilisateur introuvable"}), 404
    return jsonify(summary_for_user(user_id))
