from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.models import user as user_model


def _load_active_user():
    """Verifies the JWT and returns (user, None) or (None, error_response) if unauthenticated,
    unknown, or suspended."""
    verify_jwt_in_request()
    user = user_model.find_by_id(get_jwt_identity())
    if not user:
        return None, (jsonify({"error": "utilisateur introuvable"}), 404)
    if user.get("status") == "suspended":
        return None, (jsonify({"error": "compte suspendu", "code": "account_suspended"}), 403)
    return user, None


def active_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        _, error = _load_active_user()
        if error:
            return error
        return fn(*args, **kwargs)

    return wrapper


def role_required(role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user, error = _load_active_user()
            if error:
                return error
            if user.get("role") != role:
                return jsonify({"error": "accès refusé"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator
