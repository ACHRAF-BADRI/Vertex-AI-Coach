from collections import defaultdict
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from flask import current_app

from app import bcrypt

COLLECTION = "users"


def _collection():
    return current_app.db[COLLECTION]


DEFAULT_WEIGHT_KG = 70
DEFAULT_HEIGHT_CM = 170

def create_user(email, password, name, role="user", goal=None, weight_kg=None, height_cm=None):
    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    user = {
        "email": email.lower().strip(),
        "password_hash": hashed,
        "name": name,
        "role": role,
        "status": "active",
        "goal": goal,
        "weight_kg": weight_kg,
        "height_cm": height_cm,
        "created_at": datetime.now(timezone.utc),
    }
    result = _collection().insert_one(user)
    user["_id"] = result.inserted_id
    return user


def set_password(user_id, password):
    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    return update_user(user_id, {"password_hash": hashed})


def find_by_email(email):
    return _collection().find_one({"email": email.lower().strip()})


def find_by_id(user_id):
    try:
        return _collection().find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


def verify_password(user, password):
    return bcrypt.check_password_hash(user["password_hash"], password)


def list_paginated(page=1, limit=20, search=None, role=None):
    query = {}
    if search:
        regex = {"$regex": search, "$options": "i"}
        query["$or"] = [{"name": regex}, {"email": regex}]
    if role in ("user", "admin"):
        query["role"] = role

    skip = (page - 1) * limit
    users = list(_collection().find(query).sort("created_at", -1).skip(skip).limit(limit))
    total = _collection().count_documents(query)
    return users, total


def update_user(user_id, updates):
    _collection().update_one({"_id": ObjectId(user_id)}, {"$set": updates})
    return find_by_id(user_id)


def set_role(user_id, role):
    return update_user(user_id, {"role": role})


def delete_user(user_id):
    _collection().delete_one({"_id": ObjectId(user_id)})


def stats_overview():
    total = _collection().count_documents({})
    suspended = _collection().count_documents({"status": "suspended"})
    admins = _collection().count_documents({"role": "admin"})
    return {
        "total_users": total,
        "active_users": total - suspended,
        "suspended_users": suspended,
        "admin_count": admins,
    }


def signups_by_week():
    weekly = defaultdict(int)
    for u in _collection().find({}, {"created_at": 1}):
        created = u.get("created_at")
        if not created:
            continue
        week_start = (created.date() - timedelta(days=created.weekday())).isoformat()
        weekly[week_start] += 1
    return [{"week_start": week, "count": count} for week, count in sorted(weekly.items())]


def to_public_dict(user):
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "status": user.get("status", "active"),
        "goal": user.get("goal"),
        "weight_kg": user.get("weight_kg"),
        "height_cm": user.get("height_cm"),
        "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
    }
