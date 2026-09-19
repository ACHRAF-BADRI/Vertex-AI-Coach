from datetime import datetime, timezone

from bson import ObjectId
from flask import current_app

COLLECTION = "step_sessions"
RUNNING_SPEED_KMH = 7.5
WALKING_STRIDE_HEIGHT_FACTOR = 0.415
RUNNING_STRIDE_HEIGHT_FACTOR = 1.14
WALKING_CALORIES_PER_KG_PER_KM = 0.5
RUNNING_CALORIES_PER_KG_PER_KM = 1.036
MAX_PATH_POINTS = 300


def _collection():
    return current_app.db[COLLECTION]


def _downsample(path):
    if len(path) <= MAX_PATH_POINTS:
        return path
    step = len(path) / MAX_PATH_POINTS
    return [path[int(i * step)] for i in range(MAX_PATH_POINTS)]


def compute_metrics(distance_km, duration_sec, weight_kg, height_cm):
    hours = duration_sec / 3600 if duration_sec else 0
    speed_kmh = distance_km / hours if hours else 0
    running = speed_kmh >= RUNNING_SPEED_KMH
    stride_factor = RUNNING_STRIDE_HEIGHT_FACTOR if running else WALKING_STRIDE_HEIGHT_FACTOR
    stride_m = (height_cm / 100) * stride_factor
    steps = round((distance_km * 1000) / stride_m) if stride_m else 0
    per_km = RUNNING_CALORIES_PER_KG_PER_KM if running else WALKING_CALORIES_PER_KG_PER_KM
    calories = round(distance_km * weight_kg * per_km)
    return steps, calories, round(speed_kmh, 2)


def create_session(user_id, started_at, distance_km, duration_sec, weight_kg, height_cm, path):
    steps, calories, avg_speed = compute_metrics(distance_km, duration_sec, weight_kg, height_cm)
    doc = {
        "user_id": ObjectId(user_id),
        "started_at": started_at,
        "distance_km": round(distance_km, 3),
        "duration_sec": int(duration_sec),
        "steps": steps,
        "calories": calories,
        "avg_speed_kmh": avg_speed,
        "path": _downsample(path),
        "created_at": datetime.now(timezone.utc),
    }
    doc["_id"] = _collection().insert_one(doc).inserted_id
    return doc


def list_by_user(user_id):
    return list(_collection().find({"user_id": ObjectId(user_id)}).sort("started_at", -1))


def delete_session(user_id, session_id):
    try:
        result = _collection().delete_one({"_id": ObjectId(session_id), "user_id": ObjectId(user_id)})
        return result.deleted_count > 0
    except Exception:
        return False


def delete_by_user(user_id):
    _collection().delete_many({"user_id": ObjectId(user_id)})


def to_public_dict(doc):
    return {
        "id": str(doc["_id"]),
        "started_at": doc["started_at"].isoformat(),
        "distance_km": doc["distance_km"],
        "duration_sec": doc["duration_sec"],
        "steps": doc["steps"],
        "calories": doc["calories"],
        "avg_speed_kmh": doc["avg_speed_kmh"],
        "path": doc.get("path", []),
    }
