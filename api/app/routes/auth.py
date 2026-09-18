from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity

from app.models import user as user_model
from app.utils.decorators import active_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    name = data.get("name", "").strip()
    goal = data.get("goal")

    if not email or not password or not name:
        return jsonify({"error": "email, password et name sont requis"}), 400
    if len(password) < 8:
        return jsonify({"error": "le mot de passe doit contenir au moins 8 caractères"}), 400
    if user_model.find_by_email(email):
        return jsonify({"error": "un compte existe déjà avec cet email"}), 409

    user = user_model.create_user(email=email, password=password, name=name, goal=goal)
    token = create_access_token(identity=str(user["_id"]))
    return jsonify({"token": token, "user": user_model.to_public_dict(user)}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")

    user = user_model.find_by_email(email)
    if not user or not user_model.verify_password(user, password):
        return jsonify({"error": "email ou mot de passe incorrect"}), 401

    if user.get("status") == "suspended":
        return jsonify({"error": "compte suspendu", "code": "account_suspended"}), 403

    token = create_access_token(identity=str(user["_id"]))
    return jsonify({"token": token, "user": user_model.to_public_dict(user)})


@auth_bp.get("/me")
@active_required
def me():
    user = user_model.find_by_id(get_jwt_identity())
    return jsonify(user_model.to_public_dict(user))


@auth_bp.patch("/me")
@active_required
def update_me():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    updates = {}

    if "name" in data:
        name = data["name"].strip()
        if not name:
            return jsonify({"error": "le nom ne peut pas être vide"}), 400
        updates["name"] = name

    if "goal" in data:
        updates["goal"] = data["goal"]

    if "weight_kg" in data:
        weight_kg = data["weight_kg"]
        if weight_kg is not None:
            try:
                weight_kg = float(weight_kg)
                if weight_kg <= 0 or weight_kg > 300:
                    raise ValueError
            except (TypeError, ValueError):
                return jsonify({"error": "poids invalide"}), 400
        updates["weight_kg"] = weight_kg

    if "height_cm" in data:
        height_cm = data["height_cm"]
        if height_cm is not None:
            try:
                height_cm = float(height_cm)
                if height_cm <= 0 or height_cm > 260:
                    raise ValueError
            except (TypeError, ValueError):
                return jsonify({"error": "taille invalide"}), 400
        updates["height_cm"] = height_cm

    if not updates:
        return jsonify({"error": "aucune modification fournie"}), 400

    updated = user_model.update_user(user_id, updates)
    return jsonify(user_model.to_public_dict(updated))


@auth_bp.post("/change-password")
@active_required
def change_password():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if len(new_password) < 8:
        return jsonify({"error": "le nouveau mot de passe doit contenir au moins 8 caractères"}), 400

    user = user_model.find_by_id(user_id)
    if not user_model.verify_password(user, current_password):
        return jsonify({"error": "mot de passe actuel incorrect"}), 401

    user_model.set_password(user_id, new_password)
    return jsonify({"success": True})
