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


def replace_exercise(user_id, day_index, exercise_index, new_exercise):
    plan = get_current_plan(user_id)
    if not plan:
        return None
    workout_split = plan.get("workout_split", [])
    if not (0 <= day_index < len(workout_split)):
        return None
    exercises = workout_split[day_index].get("exercises", [])
    if not (0 <= exercise_index < len(exercises)):
        return None
    exercises[exercise_index] = new_exercise
    _collection().update_one({"_id": plan["_id"]}, {"$set": {"workout_split": workout_split}})
    plan["workout_split"] = workout_split
    return plan


def replace_supplement(user_id, supplement_index, new_supplement):
    plan = get_current_plan(user_id)
    if not plan:
        return None
    supplements = plan.get("supplements", [])
    if not (0 <= supplement_index < len(supplements)):
        return None
    supplements[supplement_index] = new_supplement
    _collection().update_one({"_id": plan["_id"]}, {"$set": {"supplements": supplements}})
    plan["supplements"] = supplements
    return plan


def save_named_plan(user_id, name, source_plan):
    doc = {
        "user_id": ObjectId(user_id),
        "name": name,
        "goal": source_plan.get("goal"),
        "workout_split": source_plan.get("workout_split", []),
        "nutrition": source_plan.get("nutrition", {}),
        "supplements": source_plan.get("supplements", []),
        "expected_results": source_plan.get("expected_results"),
        "is_saved": True,
        "saved_at": datetime.now(timezone.utc),
    }
    result = _collection().insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def count_saved_plans(user_id):
    return _collection().count_documents({"user_id": ObjectId(user_id), "is_saved": True})


def list_saved_plans(user_id):
    return list(_collection().find({"user_id": ObjectId(user_id), "is_saved": True}).sort("saved_at", -1))


def get_saved_plan(user_id, plan_id):
    try:
        return _collection().find_one({"_id": ObjectId(plan_id), "user_id": ObjectId(user_id), "is_saved": True})
    except Exception:
        return None


def delete_saved_plan(user_id, plan_id):
    try:
        result = _collection().delete_one(
            {"_id": ObjectId(plan_id), "user_id": ObjectId(user_id), "is_saved": True}
        )
        return result.deleted_count > 0
    except Exception:
        return False


def overwrite_saved_plan(user_id, plan_id, name, source_plan):
    doc = {
        "name": name,
        "goal": source_plan.get("goal"),
        "workout_split": source_plan.get("workout_split", []),
        "nutrition": source_plan.get("nutrition", {}),
        "supplements": source_plan.get("supplements", []),
        "expected_results": source_plan.get("expected_results"),
        "saved_at": datetime.now(timezone.utc),
    }
    try:
        result = _collection().update_one(
            {"_id": ObjectId(plan_id), "user_id": ObjectId(user_id), "is_saved": True}, {"$set": doc}
        )
        return result.matched_count > 0
    except Exception:
        return False


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


def to_saved_public_dict(plan):
    return {
        "id": str(plan["_id"]),
        "name": plan.get("name"),
        "goal": plan.get("goal"),
        "workout_split": plan.get("workout_split", []),
        "nutrition": plan.get("nutrition", {}),
        "supplements": plan.get("supplements", []),
        "expected_results": plan.get("expected_results"),
        "saved_at": plan["saved_at"].isoformat(),
    }
