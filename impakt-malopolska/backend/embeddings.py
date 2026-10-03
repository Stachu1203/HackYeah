"""Lokalne embeddingi tekstu — bez modelu i bez klucza API.

Feature hashing: słowa + n-gramy znakowe (3–4) rzutowane na wektor o stałym wymiarze,
znormalizowany L2. N-gramy łapią polską fleksję („seniorzy” ≈ „seniorów”).
Interfejs `embed()` → bytes pozwala później podmienić to na prawdziwy model
bez zmian w bazie ani w API.
"""

import hashlib
import json
import math
import re
import unicodedata
from array import array

DIM = 512
_WORD_RE = re.compile(r"[a-z0-9]+")


def normalize(text: str) -> str:
    text = text.lower().replace("ł", "l")
    text = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in text if unicodedata.category(ch) != "Mn")


def tokenize(text: str) -> list[str]:
    return [w for w in _WORD_RE.findall(normalize(text)) if len(w) > 2]


def _features(text: str):
    for word in tokenize(text):
        yield f"w:{word}", 1.0
        padded = f"<{word}>"
        for n in (3, 4):
            for i in range(len(padded) - n + 1):
                yield f"g:{padded[i:i + n]}", 0.35


def _bucket(feature: str) -> tuple[int, float]:
    digest = hashlib.blake2b(feature.encode(), digest_size=8).digest()
    value = int.from_bytes(digest, "little")
    return value % DIM, (1.0 if value >> 63 else -1.0)


def embed_vector(text: str) -> list[float]:
    vec = [0.0] * DIM
    for feature, weight in _features(text):
        index, sign = _bucket(feature)
        vec[index] += sign * weight
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def embed(text: str) -> bytes:
    return array("f", embed_vector(text)).tobytes()


def embed_record(title: str, description: str, keywords_json: str) -> bytes:
    keywords = " ".join(json.loads(keywords_json or "[]"))
    return embed(f"{title} {title} {description} {keywords}")


def from_blob(blob: bytes | None) -> list[float] | None:
    if not blob:
        return None
    return array("f", blob).tolist()


def cosine(a: list[float], b: list[float]) -> float:
    # Wektory są znormalizowane, więc iloczyn skalarny = cosinus.
    return sum(x * y for x, y in zip(a, b))
