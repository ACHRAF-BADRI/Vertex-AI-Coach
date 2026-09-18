from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from app.models import user as user_model

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

    token = create_access_token(identity=str(user["_id"]))
    return jsonify({"token": token, "user": user_model.to_public_dict(user)})


@auth_bp.get("/me")
@jwt_required()
def me():
    user = user_model.find_by_id(get_jwt_identity())
    if not user:
        return jsonify({"error": "utilisateur introuvable"}), 404
    return jsonify(user_model.to_public_dict(user))
