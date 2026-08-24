"""Persistence.

JSON files on disk today, deliberately behind a narrow interface so the same
calls can move to DynamoDB or Postgres without touching the tools.
"""

from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any

from agent.config import settings
from agent.schemas import Content, Creator, Run


def _read_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
    tmp.replace(path)


# ---------------------------------------------------------------------------
# Creator memory
# ---------------------------------------------------------------------------

def load_creator(creator_id: str) -> Creator:
    path = settings.creators_dir / f"{creator_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"No creator memory for {creator_id!r} at {path}")
    return Creator.model_validate(_read_json(path))


def save_creator(creator: Creator) -> None:
    path = settings.creators_dir / f"{creator.id}.json"
    _write_json(path, creator.model_dump(by_alias=True))


def list_creators() -> list[Creator]:
    if not settings.creators_dir.exists():
        return []
    return [load_creator(p.stem) for p in sorted(settings.creators_dir.glob("*.json"))]


# ---------------------------------------------------------------------------
# Content
# ---------------------------------------------------------------------------

def load_content(content_id: str) -> Content:
    path = settings.content_dir / f"{content_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"No content for {content_id!r} at {path}")
    return Content.model_validate(_read_json(path))


def save_content(content: Content) -> None:
    _write_json(settings.content_dir / f"{content.id}.json", content.model_dump(by_alias=True))


def list_content() -> list[Content]:
    if not settings.content_dir.exists():
        return []
    return [load_content(p.stem) for p in sorted(settings.content_dir.glob("*.json"))]


# ---------------------------------------------------------------------------
# Runs + approvals (in memory, mirrored to disk for inspection)
# ---------------------------------------------------------------------------

class RunStore:
    def __init__(self) -> None:
        self._runs: dict[str, Run] = {}
        self._approvals: dict[str, dict[str, str]] = {}
        self._lock = threading.Lock()

    def put(self, run: Run) -> None:
        with self._lock:
            self._runs[run.id] = run
        try:
            _write_json(settings.runs_dir / f"{run.id}.json", run.model_dump(by_alias=True))
        except OSError:
            pass  # disk mirroring is a convenience, never load-bearing

    def get(self, run_id: str) -> Run | None:
        with self._lock:
            return self._runs.get(run_id)

    def latest(self) -> Run | None:
        with self._lock:
            if not self._runs:
                return None
            return sorted(self._runs.values(), key=lambda r: r.started_at)[-1]

    def all(self) -> list[Run]:
        with self._lock:
            return list(self._runs.values())

    # -- approvals ----------------------------------------------------------
    def set_decision(self, run_id: str, asset_id: str, decision: str) -> None:
        with self._lock:
            self._approvals.setdefault(run_id, {})[asset_id] = decision

    def decision(self, run_id: str, asset_id: str) -> str | None:
        with self._lock:
            return self._approvals.get(run_id, {}).get(asset_id)

    def decisions(self, run_id: str) -> dict[str, str]:
        with self._lock:
            return dict(self._approvals.get(run_id, {}))


runs = RunStore()
