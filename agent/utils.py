"""Small shared helpers."""

from __future__ import annotations

import re


def stamp(seconds: float) -> str:
    """522 -> '08:42'."""
    total = int(seconds)
    return f"{total // 60:02d}:{total % 60:02d}"


def to_seconds(value: str) -> int:
    """'08:42' -> 522. Tolerates 'HH:MM:SS' and bare seconds."""
    value = value.strip()
    if re.fullmatch(r"\d+", value):
        return int(value)
    parts = [int(p) for p in value.split(":")]
    total = 0
    for part in parts:
        total = total * 60 + part
    return total


def slugify(value: str, *, max_length: int = 24) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return slug[:max_length] or "item"


def percentage(part: int, whole: int) -> int:
    return round((part / whole) * 100) if whole else 0
