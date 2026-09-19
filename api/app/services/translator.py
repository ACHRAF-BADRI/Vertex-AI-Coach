import json

import groq
from flask import current_app

MODEL = "openai/gpt-oss-120b"

LANGUAGE_NAMES = {"fr": "français", "en": "anglais"}


def translate_json(data, target_lang):
    api_key = current_app.config["GROQ_API_KEY"]
    if not api_key:
        raise RuntimeError("GROQ_API_KEY manquante côté serveur")

    language_name = LANGUAGE_NAMES.get(target_lang, target_lang)
    system_prompt = (
        "Tu es un traducteur professionnel. Tu reçois un objet JSON et tu dois traduire TOUTES "
        f"les valeurs de type chaîne de caractères vers le {language_name}, sans jamais traduire "
        "les clés ni modifier la structure du JSON. Les nombres, booléens, valeurs nulles et la "
        "structure (listes, objets) doivent rester strictement identiques. "
        "Réponds UNIQUEMENT avec l'objet JSON traduit, sans texte ni markdown autour."
    )

    client = groq.Groq(api_key=api_key)
    try:
        completion = client.chat.completions.create(
            model=MODEL,
            max_tokens=4000,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(data, ensure_ascii=False)},
            ],
        )
    except groq.APIError as exc:
        raise RuntimeError("Le service IA est momentanément indisponible") from exc

    text = completion.choices[0].message.content
    try:
        result = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError("Réponse IA invalide (JSON attendu)") from exc

    if not isinstance(result, dict):
        raise ValueError("Réponse IA invalide (objet JSON attendu)")
    return result
