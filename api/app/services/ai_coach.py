import json

import groq
from flask import current_app

MODEL = "openai/gpt-oss-120b"

SYSTEM_PROMPT = """Tu es un coach de course à pied expert. Tu génères des plans d'entraînement \
adaptatifs sur 4 semaines, structurés et réalistes, à partir du profil et de l'historique récent \
du coureur. Adapte le volume et l'intensité à sa charge d'entraînement actuelle : progression \
prudente si peu d'historique, maintien/surcharge progressive sinon.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte ni markdown autour, au format exact :
{
  "weeks": [
    {
      "week_number": 1,
      "focus": "reprise en douceur",
      "sessions": [
        {
          "day": "Lundi",
          "type": "footing",
          "distance_km": 5,
          "duration_min": 30,
          "intensity": "facile",
          "description": "Footing en aisance respiratoire"
        }
      ]
    }
  ]
}"""


def _format_activity(activity):
    parts = [f"{activity['date']}: {activity['distance_km']} km en {activity['duration_min']} min"]
    if activity.get("pace"):
        parts.append(f"allure {activity['pace']} min/km")
    if activity.get("feeling"):
        parts.append(f"ressenti {activity['feeling']}")
    return "- " + ", ".join(parts)


def _build_user_prompt(user, activities):
    goal = user.get("goal") or "non précisé"
    history = "\n".join(_format_activity(a) for a in activities[:10]) or "Aucune sortie enregistrée."

    return (
        f"Objectif du coureur : {goal}.\n"
        f"Historique récent (du plus récent au plus ancien) :\n{history}\n\n"
        "Génère un plan d'entraînement adaptatif sur 4 semaines pour ce coureur."
    )


def generate_plan(user, activities):
    api_key = current_app.config["GROQ_API_KEY"]
    if not api_key:
        raise RuntimeError("GROQ_API_KEY manquante côté serveur")

    client = groq.Groq(api_key=api_key)
    try:
        completion = client.chat.completions.create(
            model=MODEL,
            max_tokens=4000,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(user, activities)},
            ],
        )
    except groq.APIError as exc:
        raise RuntimeError("Le service IA est momentanément indisponible") from exc

    text = completion.choices[0].message.content
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError("Réponse IA invalide (JSON attendu)") from exc

    weeks = data.get("weeks") if isinstance(data, dict) else None
    if not isinstance(weeks, list) or not weeks:
        raise ValueError("Réponse IA invalide (plan incomplet), réessaie")
    for week in weeks:
        if not isinstance(week, dict) or not isinstance(week.get("sessions"), list):
            raise ValueError("Réponse IA invalide (plan incomplet), réessaie")
    return data
