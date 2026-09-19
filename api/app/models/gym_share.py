from datetime import datetime, timezone

from bson import ObjectId
from flask import current_app

COLLECTION = "gym_plan_shares"


def _collection():
    return current_app.db[COLLECTION]


def create_share(sender_id, sender_name, recipient_id, name, source_plan):
    doc = {
        "sender_id": ObjectId(sender_id),
        "sender_name": sender_name,
        "recipient_id": ObjectId(recipient_id),
        "name": name,
        "goal": source_plan.get("goal"),
        "workout_split": source_plan.get("workout_split", []),
        "nutrition": source_plan.get("nutrition", {}),
        "supplements": source_plan.get("supplements", []),
        "expected_results": source_plan.get("expected_results"),
        "created_at": datetime.now(timezone.utc),
    }
    result = _collection().insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def list_inbox(recipient_id):
    return list(_collection().find({"recipient_id": ObjectId(recipient_id)}).sort("created_at", -1))


def count_inbox(recipient_id):
    return _collection().count_documents({"recipient_id": ObjectId(recipient_id)})


def get_share(recipient_id, share_id):
    try:
        return _collection().find_one({"_id": ObjectId(share_id), "recipient_id": ObjectId(recipient_id)})
    except Exception:
        return None


def delete_share(recipient_id, share_id):
    try:
        result = _collection().delete_one({"_id": ObjectId(share_id), "recipient_id": ObjectId(recipient_id)})
        return result.deleted_count > 0
    except Exception:
        return False


def delete_by_user(user_id):
    _collection().delete_many({"$or": [{"sender_id": ObjectId(user_id)}, {"recipient_id": ObjectId(user_id)}]})


def to_public_dict(share):
    return {
        "id": str(share["_id"]),
        "sender_name": share.get("sender_name"),
        "name": share.get("name"),
        "goal": share.get("goal"),
        "workout_split": share.get("workout_split", []),
        "nutrition": share.get("nutrition", {}),
        "supplements": share.get("supplements", []),
        "expected_results": share.get("expected_results"),
        "created_at": share["created_at"].isoformat(),
    }
