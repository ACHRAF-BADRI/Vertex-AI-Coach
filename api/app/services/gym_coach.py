import json

import groq
from flask import current_app

MODEL = "openai/gpt-oss-120b"

SYSTEM_PROMPT = """Tu es un coach de musculation et nutrition sportive expert. Tu génères un programme \
hebdomadaire complet (entraînement, nutrition, suppléments) adapté à l'objectif, au niveau et à \
l'équipement disponible de la personne.

Pour les suppléments : ne suggère que des compléments courants et sans danger en vente libre \
(protéine en poudre, créatine, multivitamine, oméga-3, etc.), jamais de dosage médical précis, \
jamais de substance nécessitant une prescription. Précise toujours que ce sont des suggestions \
générales, pas un avis médical.

Tu inclus aussi une estimation réaliste et prudente du temps nécessaire pour voir des résultats \
en suivant ce programme avec régularité, sous forme de 3 à 4 jalons (semaines), chacun avec une \
description courte et concrète de ce qui devient visible à ce stade.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte ni markdown autour, au format exact :
{
  "workout_split": [
    {
      "day": "Lundi",
      "focus": "Haut du corps - Push",
      "exercises": [
        {
          "name": "Développé couché",
          "sets": 4,
          "reps": "8-10",
          "rest_sec": 90,
          "equipment": "Barre",
          "notes": "Contrôle la descente"
        }
      ]
    }
  ],
  "nutrition": {
    "daily_calories": 2400,
    "macros": { "protein_g": 150, "carbs_g": 250, "fat_g": 70 },
    "meal_suggestions": ["Petit-déjeuner : ...", "Déjeuner : ...", "Dîner : ..."]
  },
  "supplements": [
    { "name": "Whey protéine", "reason": "Atteindre l'apport en protéines", "timing": "Post-entraînement" }
  ],
  "expected_results": {
    "weeks_to_see_results": 8,
    "milestones": [
      { "week": 2, "description": "Meilleure récupération, prise en main des mouvements" },
      { "week": 4, "description": "Premiers gains de force visibles" },
      { "week": 8, "description": "Changements de composition corporelle visibles" },
      { "week": 12, "description": "Résultats significatifs si suivi rigoureux" }
    ]
  }
}"""


def _build_user_prompt(profile):
    dietary = profile.get("dietary_notes") or "aucune restriction particulière"
    return (
        f"Objectif : {profile.get('goal')}.\n"
        f"Niveau : {profile.get('level')}.\n"
        f"Équipement disponible : {profile.get('equipment')}.\n"
        f"Restrictions alimentaires : {dietary}.\n\n"
        "Génère un programme hebdomadaire adapté (entraînement + nutrition + suppléments)."
    )


def generate_plan(profile):
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
                {"role": "user", "content": _build_user_prompt(profile)},
            ],
        )
    except groq.APIError as exc:
        raise RuntimeError("Le service IA est momentanément indisponible") from exc

    text = completion.choices[0].message.content
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError("Réponse IA invalide (JSON attendu)") from exc
