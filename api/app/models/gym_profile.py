from datetime import datetime, timezone

from bson import ObjectId
from flask import current_app

COLLECTION = "gym_profiles"


def _collection():
    return current_app.db[COLLECTION]


def get_profile(user_id):
    return _collection().find_one({"user_id": ObjectId(user_id)})


def upsert_profile(user_id, goal, level, equipment, dietary_notes=None):
    profile = {
        "user_id": ObjectId(user_id),
        "goal": goal,
        "level": level,
        "equipment": equipment,
        "dietary_notes": dietary_notes,
        "updated_at": datetime.now(timezone.utc),
    }
    _collection().update_one({"user_id": ObjectId(user_id)}, {"$set": profile}, upsert=True)
    return get_profile(user_id)


def delete_by_user(user_id):
    _collection().delete_many({"user_id": ObjectId(user_id)})


def to_public_dict(profile):
    return {
        "goal": profile.get("goal"),
        "level": profile.get("level"),
        "equipment": profile.get("equipment"),
        "dietary_notes": profile.get("dietary_notes"),
        "updated_at": profile["updated_at"].isoformat() if profile.get("updated_at") else None,
    }
