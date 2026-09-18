from collections import defaultdict
from datetime import datetime, timedelta

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity

from app.models import activity as activity_model
from app.utils.decorators import active_required

stats_bp = Blueprint("stats", __name__)


def _week_start(date_str):
    d = datetime.strptime(date_str, "%Y-%m-%d").date()
    return (d - timedelta(days=d.weekday())).isoformat()


def summary_for_user(user_id):
    activities = activity_model.list_by_user(user_id)

    total_distance = sum(a["distance_km"] for a in activities)
    total_duration = sum(a["duration_min"] for a in activities)
    total_calories = sum(a.get("calories") or 0 for a in activities)
    total_steps = sum(a.get("steps") or 0 for a in activities)
    avg_pace = round(total_duration / total_distance, 2) if total_distance else None

    weekly = defaultdict(float)
    for a in activities:
        weekly[_week_start(a["date"])] += a["distance_km"]
    weekly_volume = [
        {"week_start": week, "distance_km": round(distance, 2)} for week, distance in sorted(weekly.items())
    ]

    pace_trend = [
        {"date": a["date"], "pace": a["pace"]}
        for a in sorted(activities, key=lambda a: a["date"])
        if a.get("pace")
    ]

    return {
        "total_distance_km": round(total_distance, 2),
        "total_activities": len(activities),
        "total_calories": round(total_calories),
        "total_steps": total_steps,
        "avg_pace": avg_pace,
        "weekly_volume": weekly_volume,
        "pace_trend": pace_trend,
    }


@stats_bp.get("/summary")
@active_required
def summary():
    return jsonify(summary_for_user(get_jwt_identity()))
