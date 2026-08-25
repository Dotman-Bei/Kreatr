"""find_content_moments' reporting when replay has no fixture to replay.

Replay fixtures are keyed by content id, so a freshly ingested video has none.
The tool then legitimately returns zero candidates, and the run has to say why —
otherwise it reads as a broken pipeline rather than a mode that cannot answer
the question.
"""

from __future__ import annotations

import dataclasses

import pytest

from agent import config
from agent.context import RunContext, reset_context, set_context
from agent.events import ActivityLog
from agent.schemas import Content, Creator
from agent.tools import moments


def _context() -> RunContext:
    creator = Creator(
        id="creator_test",
        name="Test Creator",
        audience="early-stage founders",
        tone=["direct"],
    )
    content = Content(
        id="vid_fresh_upload",
        creator_id=creator.id,
        title="Fresh Upload",
        duration="01:17",
        duration_seconds=77,
        transcript=[],
    )
    return RunContext(run_id="run_test", creator=creator, content=content, log=ActivityLog())


@pytest.fixture
def replay(monkeypatch):
    """Replay mode with no fixture available for this content.

    Settings is a frozen dataclass, so it is replaced rather than mutated, and
    the patch lands on the module attribute each caller reads.
    """
    replayed = dataclasses.replace(config.settings, agent_mode="replay")
    monkeypatch.setattr(config, "settings", replayed)
    monkeypatch.setattr(moments, "settings", replayed)

    ctx = _context()
    token = set_context(ctx)
    yield ctx
    reset_context(token)


def _messages(ctx: RunContext) -> list[str]:
    return [entry.message for entry in ctx.log.entries]


def test_missing_fixture_is_explained(replay):
    result = moments.find_content_moments("vid_fresh_upload")

    assert result.strip() == "[]"
    logged = " ".join(_messages(replay))
    assert "No replay fixture" in logged
    assert "vid_fresh_upload" in logged
    # The message has to name the way out, not merely state the problem.
    details = " ".join(e.detail or "" for e in replay.log.entries)
    assert "live" in details.lower()
    # The bare count would be misleading here, so it must not also be claimed.
    assert "Identified 0 raw candidate segments." not in _messages(replay)


def test_found_candidates_are_reported_normally(replay, monkeypatch):
    """A fixture that does resolve still reports a plain count."""
    from agent.schemas import CandidateList

    monkeypatch.setattr(
        moments,
        "analyse",
        lambda *args, **kwargs: CandidateList.model_validate(
            {
                "moments": [
                    {
                        "start": "00:10",
                        "end": "00:45",
                        "topic": "Pricing psychology",
                        "hook": "I tripled my price and nobody left.",
                        "transcript": "I tripled my price and nobody left.",
                    }
                ]
            }
        ),
    )

    moments.find_content_moments("vid_fresh_upload")

    assert "Identified 1 raw candidate segments." in _messages(replay)
    assert "No replay fixture" not in " ".join(_messages(replay))
