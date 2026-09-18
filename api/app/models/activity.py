from datetime import datetime, timezone

from bson import ObjectId
from flask import current_app

COLLECTION = "activities"


def _collection():
    return current_app.db[COLLECTION]


def _compute_pace(distance_km, duration_min):
    if not distance_km:
        return None
    return round(duration_min / distance_km, 2)


def create_activity(user_id, date, distance_km, duration_min, feeling=None, notes=None):
    activity = {
        "user_id": ObjectId(user_id),
        "date": date,
        "distance_km": distance_km,
        "duration_min": duration_min,
        "pace": _compute_pace(distance_km, duration_min),
        "feeling": feeling,
        "notes": notes,
        "created_at": datetime.now(timezone.utc),
    }
    result = _collection().insert_one(activity)
    activity["_id"] = result.inserted_id
    return activity


def list_by_user(user_id):
    return list(_collection().find({"user_id": ObjectId(user_id)}).sort("date", -1))


def find_by_id(activity_id):
    try:
        return _collection().find_one({"_id": ObjectId(activity_id)})
    except Exception:
        return None


def update_activity(activity_id, updates):
    if "distance_km" in updates or "duration_min" in updates:
        activity = find_by_id(activity_id)
        distance_km = updates.get("distance_km", activity["distance_km"])
        duration_min = updates.get("duration_min", activity["duration_min"])
        updates["pace"] = _compute_pace(distance_km, duration_min)
    _collection().update_one({"_id": ObjectId(activity_id)}, {"$set": updates})
    return find_by_id(activity_id)


def delete_activity(activity_id):
    _collection().delete_one({"_id": ObjectId(activity_id)})


def to_public_dict(activity):
    return {
        "id": str(activity["_id"]),
        "date": activity["date"],
        "distance_km": activity["distance_km"],
        "duration_min": activity["duration_min"],
        "pace": activity.get("pace"),
        "feeling": activity.get("feeling"),
        "notes": activity.get("notes"),
    }
