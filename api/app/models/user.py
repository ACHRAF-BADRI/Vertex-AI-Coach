from datetime import datetime, timezone

from bson import ObjectId
from flask import current_app

from app import bcrypt

COLLECTION = "users"


def _collection():
    return current_app.db[COLLECTION]


def create_user(email, password, name, role="user", goal=None):
    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    user = {
        "email": email.lower().strip(),
        "password_hash": hashed,
        "name": name,
        "role": role,
        "goal": goal,
        "created_at": datetime.now(timezone.utc),
    }
    result = _collection().insert_one(user)
    user["_id"] = result.inserted_id
    return user


def find_by_email(email):
    return _collection().find_one({"email": email.lower().strip()})


def find_by_id(user_id):
    try:
        return _collection().find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


def verify_password(user, password):
    return bcrypt.check_password_hash(user["password_hash"], password)


def to_public_dict(user):
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "goal": user.get("goal"),
    }
