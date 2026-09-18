from datetime import datetime, timezone

from bson import ObjectId
from flask import current_app

COLLECTION = "activities"


def _collection():
    return current_app.db[COLLECTION]


CALORIES_PER_KG_PER_KM = 1.036
# Average running stride length is approximated as a multiple of height,
# a common estimate used by fitness trackers absent real stride sensor data.
STRIDE_LENGTH_HEIGHT_FACTOR = 1.14


def _compute_pace(distance_km, duration_min):
    if not distance_km:
        return None
    return round(duration_min / distance_km, 2)


def _compute_calories(distance_km, weight_kg):
    if not distance_km or not weight_kg:
        return None
    return round(distance_km * weight_kg * CALORIES_PER_KG_PER_KM)


def _compute_steps(distance_km, height_cm):
    if not distance_km or not height_cm:
        return None
    stride_length_m = (height_cm / 100) * STRIDE_LENGTH_HEIGHT_FACTOR
    return round((distance_km * 1000) / stride_length_m)


def create_activity(user_id, date, distance_km, duration_min, weight_kg, height_cm, feeling=None, notes=None):
    activity = {
        "user_id": ObjectId(user_id),
        "date": date,
        "distance_km": distance_km,
        "duration_min": duration_min,
        "pace": _compute_pace(distance_km, duration_min),
        "weight_kg": weight_kg,
        "height_cm": height_cm,
        "calories": _compute_calories(distance_km, weight_kg),
        "steps": _compute_steps(distance_km, height_cm),
        "feeling": feeling,
        "notes": notes,
        "created_at": datetime.now(timezone.utc),
    }
    result = _collection().insert_one(activity)
    activity["_id"] = result.inserted_id
    return activity


def list_by_user(user_id):
    return list(_collection().find({"user_id": ObjectId(user_id)}).sort("date", -1))


def delete_by_user(user_id):
    _collection().delete_many({"user_id": ObjectId(user_id)})


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
        updates["calories"] = _compute_calories(distance_km, activity.get("weight_kg"))
        updates["steps"] = _compute_steps(distance_km, activity.get("height_cm"))
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
        "calories": activity.get("calories"),
        "steps": activity.get("steps"),
        "feeling": activity.get("feeling"),
        "notes": activity.get("notes"),
    }
