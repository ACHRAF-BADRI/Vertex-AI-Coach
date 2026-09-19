import difflib
import json
import re
import threading
import unicodedata
import urllib.request
from urllib.error import URLError

BASE_URL = "https://wger.de/api/v2"
LANGUAGE_ENGLISH = 2
LANGUAGE_FRENCH = 12
HEADERS = {"User-Agent": "VertexAICoach/1.0 (portfolio project)"}
REQUEST_TIMEOUT = 6

_index_lock = threading.Lock()
_index_cache = None
_image_cache = {}


def _normalize(text):
    if not text:
        return ""
    text = text.lower().strip()
    text = "".join(c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c))
    text = re.sub(r"[^a-z0-9 ]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _fetch_json(url):
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
        return json.loads(response.read().decode("utf-8"))


def _build_index():
    index = {LANGUAGE_ENGLISH: [], LANGUAGE_FRENCH: []}
    url = f"{BASE_URL}/exercise-translation/?limit=500&offset=0"
    while url:
        data = _fetch_json(url)
        for item in data.get("results", []):
            language = item.get("language")
            if language not in index:
                continue
            name = item.get("name")
            base_id = item.get("exercise")
            if not name or base_id is None:
                continue
            index[language].append((_normalize(name), name, base_id))
        url = data.get("next")
    return index


def _get_index():
    global _index_cache
    if _index_cache is not None:
        return _index_cache
    with _index_lock:
        if _index_cache is None:
            try:
                _index_cache = _build_index()
            except (URLError, TimeoutError, OSError, ValueError):
                _index_cache = {LANGUAGE_ENGLISH: [], LANGUAGE_FRENCH: []}
    return _index_cache


def _best_match(normalized_name, entries, cutoff=0.72):
    if not normalized_name or not entries:
        return None
    for norm, _original, base_id in entries:
        if norm == normalized_name:
            return base_id
    names = [entry[0] for entry in entries]
    closest = difflib.get_close_matches(normalized_name, names, n=1, cutoff=cutoff)
    if not closest:
        return None
    for norm, _original, base_id in entries:
        if norm == closest[0]:
            return base_id
    return None


def _image_for_base(base_id):
    if base_id in _image_cache:
        return _image_cache[base_id]
    try:
        data = _fetch_json(f"{BASE_URL}/exerciseimage/?exercise={base_id}&limit=5")
    except (URLError, TimeoutError, OSError, ValueError):
        _image_cache[base_id] = None
        return None

    results = data.get("results", [])
    if not results:
        _image_cache[base_id] = None
        return None

    main = next((r for r in results if r.get("is_main")), results[0])
    thumbnails = main.get("thumbnails") or {}
    image = {
        "image_url": main.get("image"),
        "thumbnail_url": thumbnails.get("medium") or thumbnails.get("small") or main.get("image"),
        "source_url": f"https://wger.de/en/exercise/{base_id}/view/",
    }
    _image_cache[base_id] = image
    return image


def find_exercise_image(name_en=None, name_fr=None):
    """Best-effort lookup of an illustrative image for an exercise via the wger.de API.
    Never raises — returns None on any lookup failure or when no match is found."""
    try:
        index = _get_index()
        base_id = _best_match(_normalize(name_en), index.get(LANGUAGE_ENGLISH, []))
        if base_id is None:
            base_id = _best_match(_normalize(name_fr), index.get(LANGUAGE_FRENCH, []))
        if base_id is None:
            return None
        return _image_for_base(base_id)
    except Exception:
        return None
