"""Replay fixtures.

Used only when KREATR_AGENT_MODE=replay, and as the last-resort fallback if a
model call returns nothing. They let the API, the UI and the tool wiring be
developed and demoed without AWS credentials.

A replay run is NOT the agent reasoning. Never present it as one.
"""

from __future__ import annotations

import functools
import json
from typing import Any

from agent.config import settings
from agent.schemas import (
    AssetPlan,
    CandidateList,
    MomentScore,
    Performance,
)


@functools.lru_cache(maxsize=8)
def _fixture(content_id: str) -> dict[str, Any]:
    path = settings.data_dir / "fixtures" / f"{content_id}.json"
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def replay_candidates(content_id: str) -> CandidateList:
    data = _fixture(content_id)
    return CandidateList.model_validate({"moments": data.get("candidates", [])})


def replay_score(moment_id: str) -> MomentScore:
    for data in (_fixture(cid) for cid in _known_content()):
        scores = data.get("scores", {})
        if moment_id in scores:
            return MomentScore.model_validate(scores[moment_id])
    # An unknown moment gets a neutral rejection rather than a fabricated pass.
    return MomentScore(
        score=0,
        signals=[],
        reasons=["No fixture score available for this moment in replay mode."],
        verdict="reject",
        rejection_reason="Unscored in replay mode.",
        rejection_class="weak-hook",
    )


def replay_assets(content_id: str) -> AssetPlan:
    data = _fixture(content_id)
    return AssetPlan.model_validate({"assets": data.get("assets", [])})


def replay_performance(content_id: str) -> Performance | None:
    data = _fixture(content_id)
    raw = data.get("performance")
    return Performance.model_validate(raw) if raw else None


def _known_content() -> list[str]:
    directory = settings.data_dir / "fixtures"
    if not directory.exists():
        return []
    return [p.stem for p in directory.glob("*.json")]
