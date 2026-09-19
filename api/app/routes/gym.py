from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.models import gym_plan as gym_plan_model
from app.models import gym_profile as gym_profile_model
from app.models import gym_share as gym_share_model
from app.models import user as user_model
from app.services import exercise_media, gym_coach, translator, youtube_media
from app.utils.decorators import active_required

gym_bp = Blueprint("gym", __name__)


def _flatten_exercises(workout_split):
    return [exercise for day in workout_split for exercise in day.get("exercises", [])]


def _attach_media_to_exercises(exercises):
    for exercise in exercises:
        media = exercise_media.find_exercise_image(exercise.get("name_en"), exercise.get("name"))
        exercise["image_url"] = media["thumbnail_url"] if media else None
        exercise["image_full_url"] = media["image_url"] if media else None

    names = [exercise.get("name_en") or exercise.get("name") for exercise in exercises]
    video_urls = youtube_media.find_exercise_videos(names)
    for i, exercise in enumerate(exercises):
        exercise["video_url"] = video_urls.get(i)


def _attach_exercise_media(workout_split):
    _attach_media_to_exercises(_flatten_exercises(workout_split))


def _restore_exercise_media(original_workout_split, translated_workout_split):
    for original_exercise, translated_exercise in zip(
        _flatten_exercises(original_workout_split), _flatten_exercises(translated_workout_split)
    ):
        translated_exercise["image_url"] = original_exercise.get("image_url")
        translated_exercise["image_full_url"] = original_exercise.get("image_full_url")
        translated_exercise["video_url"] = original_exercise.get("video_url")


@gym_bp.get("/profile")
@active_required
def get_profile():
    profile = gym_profile_model.get_profile(get_jwt_identity())
    if not profile:
        return jsonify(None)
    return jsonify(gym_profile_model.to_public_dict(profile))


@gym_bp.put("/profile")
@active_required
def update_profile():
    data = request.get_json(silent=True) or {}
    goal = (data.get("goal") or "").strip()
    level = (data.get("level") or "").strip()
    equipment = (data.get("equipment") or "").strip()

    if not goal or not level or not equipment:
        return jsonify({"error": "objectif, niveau et équipement sont requis"}), 400

    profile = gym_profile_model.upsert_profile(
        user_id=get_jwt_identity(),
        goal=goal,
        level=level,
        equipment=equipment,
        dietary_notes=data.get("dietary_notes"),
    )
    return jsonify(gym_profile_model.to_public_dict(profile))


@gym_bp.post("/plan/generate")
@active_required
def generate_plan():
    user_id = get_jwt_identity()
    profile = gym_profile_model.get_profile(user_id)
    if not profile:
        return jsonify({"error": "complète d'abord ton profil gym"}), 400

    try:
        result = gym_coach.generate_plan(gym_profile_model.to_public_dict(profile))
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 502

    _attach_exercise_media(result["workout_split"])

    plan = gym_plan_model.save_plan(
        user_id,
        profile.get("goal"),
        result["workout_split"],
        result["nutrition"],
        result["supplements"],
        result.get("expected_results"),
    )
    return jsonify(gym_plan_model.to_public_dict(plan)), 201


@gym_bp.get("/plan/current")
@active_required
def current_plan():
    plan = gym_plan_model.get_current_plan(get_jwt_identity())
    if not plan:
        return jsonify(None)
    return jsonify(gym_plan_model.to_public_dict(plan))


@gym_bp.delete("/plan/current")
@active_required
def delete_current_plan():
    gym_plan_model.delete_current(get_jwt_identity())
    return "", 204


@gym_bp.post("/plan/translate")
@active_required
def translate_current_plan():
    data = request.get_json(silent=True) or {}
    lang = data.get("lang")
    if lang not in ("fr", "en"):
        return jsonify({"error": "langue invalide"}), 400

    plan = gym_plan_model.get_current_plan(get_jwt_identity())
    if not plan:
        return jsonify(None)

    payload = {
        "workout_split": plan.get("workout_split", []),
        "nutrition": plan.get("nutrition", {}),
        "supplements": plan.get("supplements", []),
        "expected_results": plan.get("expected_results"),
    }
    try:
        translated = translator.translate_json(payload, lang)
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 502

    result = gym_plan_model.to_public_dict(plan)
    translated_workout_split = translated.get("workout_split", result["workout_split"])
    _restore_exercise_media(result["workout_split"], translated_workout_split)
    result["workout_split"] = translated_workout_split
    result["nutrition"] = translated.get("nutrition", result["nutrition"])
    result["supplements"] = translated.get("supplements", result["supplements"])
    result["expected_results"] = translated.get("expected_results", result["expected_results"])
    return jsonify(result)


@gym_bp.put("/plan/exercise")
@active_required
def replace_plan_exercise():
    data = request.get_json(silent=True) or {}
    day_index = data.get("day_index")
    exercise_index = data.get("exercise_index")
    exercise = data.get("exercise")
    if not isinstance(day_index, int) or not isinstance(exercise_index, int) or not isinstance(exercise, dict):
        return jsonify({"error": "paramètres invalides"}), 400

    plan = gym_plan_model.replace_exercise(get_jwt_identity(), day_index, exercise_index, exercise)
    if not plan:
        return jsonify({"error": "programme ou exercice introuvable"}), 404
    return jsonify(gym_plan_model.to_public_dict(plan))


@gym_bp.post("/exercise/alternatives")
@active_required
def exercise_alternatives():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "nom d'exercice requis"}), 400
    name_en = data.get("name_en")
    equipment = data.get("equipment")

    try:
        alternatives = gym_coach.suggest_alternatives(name, name_en, equipment)
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 502

    _attach_media_to_exercises(alternatives)
    return jsonify({"alternatives": alternatives})


@gym_bp.put("/plan/supplement")
@active_required
def replace_plan_supplement():
    data = request.get_json(silent=True) or {}
    supplement_index = data.get("supplement_index")
    supplement = data.get("supplement")
    if not isinstance(supplement_index, int) or not isinstance(supplement, dict):
        return jsonify({"error": "paramètres invalides"}), 400

    plan = gym_plan_model.replace_supplement(get_jwt_identity(), supplement_index, supplement)
    if not plan:
        return jsonify({"error": "programme ou supplément introuvable"}), 404
    return jsonify(gym_plan_model.to_public_dict(plan))


@gym_bp.post("/supplement/alternatives")
@active_required
def supplement_alternatives():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "nom de supplément requis"}), 400
    reason = data.get("reason")

    try:
        alternatives = gym_coach.suggest_supplement_alternatives(name, reason)
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify({"alternatives": alternatives})


@gym_bp.post("/plan/send")
@active_required
def send_plan():
    sender_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    name = (data.get("name") or "").strip()
    plan_id = data.get("plan_id")

    if not email or not name:
        return jsonify({"error": "email et nom sont requis"}), 400

    recipient = user_model.find_by_email(email)
    if not recipient:
        return jsonify({"error": "Aucun utilisateur n'existe avec cet email"}), 404

    recipient_id = str(recipient["_id"])
    if recipient_id == sender_id:
        return jsonify({"error": "Impossible de s'envoyer un programme à soi-même"}), 400

    if plan_id:
        source_plan = gym_plan_model.get_saved_plan(sender_id, plan_id)
        if not source_plan:
            return jsonify({"error": "sauvegarde introuvable"}), 404
    else:
        source_plan = gym_plan_model.get_current_plan(sender_id)
        if not source_plan:
            return jsonify({"error": "aucun programme actif à envoyer"}), 400

    sender = user_model.find_by_id(sender_id)
    gym_share_model.create_share(sender_id, sender.get("name"), recipient_id, name, source_plan)
    return jsonify({"status": "sent"}), 201


@gym_bp.get("/inbox")
@active_required
def list_inbox():
    shares = gym_share_model.list_inbox(get_jwt_identity())
    return jsonify([gym_share_model.to_public_dict(s) for s in shares])


@gym_bp.post("/inbox/<share_id>/accept")
@active_required
def accept_share(share_id):
    user_id = get_jwt_identity()
    share = gym_share_model.get_share(user_id, share_id)
    if not share:
        return jsonify({"error": "message introuvable"}), 404

    data = request.get_json(silent=True) or {}
    replace_id = data.get("replace_id")

    if replace_id:
        replaced = gym_plan_model.overwrite_saved_plan(user_id, replace_id, share.get("name"), share)
        if not replaced:
            return jsonify({"error": "sauvegarde à remplacer introuvable"}), 404
        gym_share_model.delete_share(user_id, share_id)
        return jsonify({"status": "replaced"}), 200

    user = user_model.find_by_id(user_id)
    limit = user_model.get_gym_saved_plan_limit(user)
    if gym_plan_model.count_saved_plans(user_id) >= limit:
        saved_plans = gym_plan_model.list_saved_plans(user_id)
        return (
            jsonify(
                {
                    "error": f"Tu as déjà {limit} programmes sauvegardés",
                    "code": "limit_reached",
                    "saved_plans": [{"id": str(p["_id"]), "name": p.get("name")} for p in saved_plans],
                }
            ),
            409,
        )

    gym_plan_model.save_named_plan(user_id, share.get("name"), share)
    gym_share_model.delete_share(user_id, share_id)
    return jsonify({"status": "saved"}), 201


@gym_bp.delete("/inbox/<share_id>")
@active_required
def decline_share(share_id):
    deleted = gym_share_model.delete_share(get_jwt_identity(), share_id)
    if not deleted:
        return jsonify({"error": "message introuvable"}), 404
    return "", 204


@gym_bp.post("/plan/save")
@active_required
def save_plan_as():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "un nom est requis"}), 400

    current = gym_plan_model.get_current_plan(user_id)
    if not current:
        return jsonify({"error": "aucun programme actif à sauvegarder"}), 400

    user = user_model.find_by_id(user_id)
    limit = user_model.get_gym_saved_plan_limit(user)
    if gym_plan_model.count_saved_plans(user_id) >= limit:
        return jsonify({"error": f"Limite de {limit} programmes sauvegardés atteinte"}), 400

    saved = gym_plan_model.save_named_plan(user_id, name, current)
    return jsonify(gym_plan_model.to_saved_public_dict(saved)), 201


@gym_bp.get("/plan/saved")
@active_required
def list_saved_plans():
    plans = gym_plan_model.list_saved_plans(get_jwt_identity())
    return jsonify([gym_plan_model.to_saved_public_dict(p) for p in plans])


@gym_bp.delete("/plan/saved/<plan_id>")
@active_required
def delete_saved_plan(plan_id):
    deleted = gym_plan_model.delete_saved_plan(get_jwt_identity(), plan_id)
    if not deleted:
        return jsonify({"error": "sauvegarde introuvable"}), 404
    return "", 204


@gym_bp.post("/plan/saved/<plan_id>/activate")
@active_required
def activate_saved_plan(plan_id):
    user_id = get_jwt_identity()
    saved = gym_plan_model.get_saved_plan(user_id, plan_id)
    if not saved:
        return jsonify({"error": "sauvegarde introuvable"}), 404

    plan = gym_plan_model.save_plan(
        user_id,
        saved.get("goal"),
        saved.get("workout_split", []),
        saved.get("nutrition", {}),
        saved.get("supplements", []),
        saved.get("expected_results"),
    )
    return jsonify(gym_plan_model.to_public_dict(plan)), 201
