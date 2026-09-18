from datetime import datetime, timezone

from bson import ObjectId
from flask import current_app

COLLECTION = "gym_plans"


def _collection():
    return current_app.db[COLLECTION]


def save_plan(user_id, goal, workout_split, nutrition, supplements, expected_results=None):
    plan = {
        "user_id": ObjectId(user_id),
        "goal": goal,
        "workout_split": workout_split,
        "nutrition": nutrition,
        "supplements": supplements,
        "expected_results": expected_results,
        "generated_at": datetime.now(timezone.utc),
        "status": "active",
    }
    _collection().update_many(
        {"user_id": ObjectId(user_id), "status": "active"}, {"$set": {"status": "archived"}}
    )
    result = _collection().insert_one(plan)
    plan["_id"] = result.inserted_id
    return plan


def get_current_plan(user_id):
    return _collection().find_one(
        {"user_id": ObjectId(user_id), "status": "active"}, sort=[("generated_at", -1)]
    )


def delete_current(user_id):
    _collection().delete_one({"user_id": ObjectId(user_id), "status": "active"})


def delete_by_user(user_id):
    _collection().delete_many({"user_id": ObjectId(user_id)})


def to_public_dict(plan):
    return {
        "id": str(plan["_id"]),
        "goal": plan.get("goal"),
        "workout_split": plan.get("workout_split", []),
        "nutrition": plan.get("nutrition", {}),
        "supplements": plan.get("supplements", []),
        "expected_results": plan.get("expected_results"),
        "generated_at": plan["generated_at"].isoformat(),
        "status": plan.get("status"),
    }
