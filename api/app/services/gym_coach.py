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
générales, pas un avis médical. Pour chaque supplément, ajoute aussi "brands" : une liste de 2 à 3 \
marques réelles, connues et largement disponibles (ex. "Optimum Nutrition", "MyProtein", "Bulk"), \
à titre d'exemples seulement.

Tu inclus aussi une estimation réaliste et prudente du temps nécessaire pour voir des résultats \
en suivant ce programme avec régularité, sous forme de 3 à 4 jalons (semaines), chacun avec une \
description courte et concrète de ce qui devient visible à ce stade.

Pour chaque exercice, ajoute aussi "name_en" : le nom standard de cet exercice en anglais \
(ex. "Bench Press", "Back Squat", "Lat Pulldown"), utilisé uniquement pour rechercher une image \
illustrative — reste un terme générique et courant, pas une traduction littérale du nom français.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte ni markdown autour, au format exact :
{
  "workout_split": [
    {
      "day": "Lundi",
      "focus": "Haut du corps - Push",
      "exercises": [
        {
          "name": "Développé couché",
          "name_en": "Bench Press",
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
    {
      "name": "Whey protéine",
      "reason": "Atteindre l'apport en protéines",
      "timing": "Post-entraînement",
      "brands": ["Optimum Nutrition", "MyProtein", "Bulk"]
    }
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


def _call_json(system_prompt, user_content, max_tokens):
    api_key = current_app.config["GROQ_API_KEY"]
    if not api_key:
        raise RuntimeError("GROQ_API_KEY manquante côté serveur")

    client = groq.Groq(api_key=api_key)
    try:
        completion = client.chat.completions.create(
            model=MODEL,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        )
    except groq.APIError as exc:
        raise RuntimeError("Le service IA est momentanément indisponible") from exc

    text = completion.choices[0].message.content
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError("Réponse IA invalide (JSON attendu)") from exc

    if not isinstance(data, dict):
        raise ValueError("Réponse IA invalide (objet JSON attendu)")
    return data


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
    return _call_json(SYSTEM_PROMPT, _build_user_prompt(profile), max_tokens=4000)


ALTERNATIVES_SYSTEM_PROMPT = """Tu es un coach de musculation expert. On te donne un exercice et \
l'équipement disponible de la personne. Propose 4 exercices alternatifs qui ciblent le(s) même(s) \
groupe(s) musculaire(s) principal(aux) que l'exercice donné. Privilégie des alternatives réalisables \
avec l'équipement disponible ; si aucune bonne alternative n'existe avec cet équipement, propose-en \
une avec un équipement différent mais courant. Ne propose jamais l'exercice donné lui-même, ni de \
doublons entre les alternatives.

Pour chaque alternative, ajoute aussi "name_en" : le nom standard de cet exercice en anglais, \
utilisé uniquement pour rechercher une image illustrative.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte ni markdown autour, au format exact :
{
  "alternatives": [
    {
      "name": "Développé incliné haltères",
      "name_en": "Incline Dumbbell Press",
      "sets": 4,
      "reps": "8-10",
      "rest_sec": 90,
      "equipment": "Haltères, banc incliné",
      "notes": "Contrôle la descente"
    }
  ]
}"""


def suggest_alternatives(name, name_en, equipment):
    user_prompt = (
        f"Exercice actuel : {name}" + (f" ({name_en})" if name_en else "") + ".\n"
        f"Équipement disponible : {equipment or 'non précisé'}.\n"
        "Propose 4 exercices alternatifs qui ciblent le même groupe musculaire principal."
    )
    data = _call_json(ALTERNATIVES_SYSTEM_PROMPT, user_prompt, max_tokens=1200)
    if not isinstance(data.get("alternatives"), list):
        raise ValueError("Réponse IA invalide (objet JSON attendu)")
    return data["alternatives"]


SUPPLEMENT_ALTERNATIVES_SYSTEM_PROMPT = """Tu es un coach en nutrition sportive expert. On te donne \
un supplément et la raison pour laquelle il est recommandé. Propose 3 suppléments alternatifs \
courants et sans danger en vente libre qui visent un effet similaire. Jamais de dosage médical \
précis, jamais de substance nécessitant une prescription. Ne propose jamais le supplément donné \
lui-même, ni de doublons entre les alternatives. Pour chaque alternative, ajoute "brands" : une \
liste de 2 à 3 marques réelles, connues et largement disponibles, à titre d'exemples seulement.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte ni markdown autour, au format exact :
{
  "alternatives": [
    {
      "name": "Caséine micellaire",
      "reason": "Libération lente de protéines, idéal avant le coucher",
      "timing": "Avant le coucher",
      "brands": ["Optimum Nutrition", "MyProtein", "Bulk"]
    }
  ]
}"""


def suggest_supplement_alternatives(name, reason):
    user_prompt = (
        f"Supplément actuel : {name}.\n"
        f"Raison : {reason or 'non précisée'}.\n"
        "Propose 3 suppléments alternatifs visant un effet similaire."
    )
    data = _call_json(SUPPLEMENT_ALTERNATIVES_SYSTEM_PROMPT, user_prompt, max_tokens=800)
    if not isinstance(data.get("alternatives"), list):
        raise ValueError("Réponse IA invalide (objet JSON attendu)")
    return data["alternatives"]
