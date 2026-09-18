from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.models import user as user_model


def role_required(role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = user_model.find_by_id(get_jwt_identity())
            if not user or user.get("role") != role:
                return jsonify({"error": "accès refusé"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator
