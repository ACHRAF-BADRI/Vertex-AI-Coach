from datetime import datetime, timezone

from bson import ObjectId
from flask import current_app

COLLECTION = "training_plans"


def _collection():
    return current_app.db[COLLECTION]


def save_plan(user_id, goal, weeks):
    plan = {
        "user_id": ObjectId(user_id),
        "goal": goal,
        "weeks": weeks,
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


def to_public_dict(plan):
    return {
        "id": str(plan["_id"]),
        "goal": plan.get("goal"),
        "weeks": plan.get("weeks", []),
        "generated_at": plan["generated_at"].isoformat(),
        "status": plan.get("status"),
    }
