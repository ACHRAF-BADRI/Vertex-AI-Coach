import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote_plus

import groq
from flask import current_app

MODEL = "openai/gpt-oss-120b"
HEADERS = {"User-Agent": "VertexAICoach/1.0 (portfolio project)"}
OEMBED_TIMEOUT = 4

SYSTEM_PROMPT = (
    'Tu réponds UNIQUEMENT avec un objet JSON valide au format '
    '{"videos": [{"id": 0, "youtube_url": "..."}]}, un élément par exercice reçu, '
    'en reprenant exactement le même "id". Pour chaque exercice, donne l\'URL d\'une '
    'vraie vidéo YouTube existante et pertinente qui montre comment l\'exécuter '
    'correctement. Si tu n\'es pas certain qu\'une vidéo précise existe réellement à '
    'cette adresse, mets "youtube_url": null plutôt que d\'inventer un lien.'
)


def _search_link(name):
    query = quote_plus(f"{name} exercise tutorial form")
    return f"https://www.youtube.com/results?search_query={query}"


def _extract_video_id(url):
    if not url:
        return None
    match = re.search(r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})", url)
    return match.group(1) if match else None


def _is_valid_video(video_id):
    try:
        request = urllib.request.Request(
            f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json",
            headers=HEADERS,
        )
        with urllib.request.urlopen(request, timeout=OEMBED_TIMEOUT) as response:
            return response.status == 200
    except Exception:
        return False


def _ask_groq_for_candidates(names):
    api_key = current_app.config.get("GROQ_API_KEY")
    if not api_key:
        return {}

    client = groq.Groq(api_key=api_key)
    payload = {"exercises": [{"id": i, "name": name} for i, name in enumerate(names)]}
    try:
        completion = client.chat.completions.create(
            model=MODEL,
            max_tokens=2000,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
            ],
        )
        data = json.loads(completion.choices[0].message.content)
    except Exception:
        return {}

    candidates = {}
    for item in data.get("videos", []):
        idx = item.get("id")
        if isinstance(idx, int):
            candidates[idx] = item.get("youtube_url")
    return candidates


def find_exercise_videos(names):
    """Best-effort resolution of a YouTube link per exercise name, keyed by index.
    Always returns a usable URL for every name (a verified video when Groq's
    suggestion checks out via YouTube's oEmbed endpoint, otherwise a YouTube
    search link) — never raises, never returns None for an entry."""
    names = list(names)
    if not names:
        return {}

    try:
        candidates = _ask_groq_for_candidates(names)
    except Exception:
        candidates = {}

    video_ids = {i: _extract_video_id(candidates.get(i)) for i in range(len(names))}
    to_verify = {i: vid for i, vid in video_ids.items() if vid}

    verified = {}
    if to_verify:
        with ThreadPoolExecutor(max_workers=min(8, len(to_verify))) as pool:
            results = pool.map(_is_valid_video, to_verify.values())
            verified = dict(zip(to_verify.keys(), results))

    result = {}
    for i, name in enumerate(names):
        if video_ids.get(i) and verified.get(i):
            result[i] = f"https://www.youtube.com/watch?v={video_ids[i]}"
        else:
            result[i] = _search_link(name)
    return result
