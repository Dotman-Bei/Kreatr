"""The Kreatr orchestrator.

One Strands agent with a registered tool set. It decides which tools to call and
in what order; this module owns setup, run bookkeeping and the metrics the UI
reads. The replay driver at the bottom runs the same tools without a model so
the system is demoable offline — it is a test double, not the agent.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

from strands import Agent

from agent.config import settings
from agent.context import RunContext, reset_context, set_context
from agent.events import ActivityLog, StrandsActivityHook
from agent.llm import build_model
from agent.schemas import Run, RunMetrics
from agent.store import load_content, load_creator, runs
from agent.tools import ALL_TOOLS
from agent.utils import percentage

PROMPT_PATH = Path(__file__).parent / "prompts" / "orchestrator.md"

#: Rough per-step manual cost, used only for the demo's time-saved comparison.
MANUAL_MINUTES_PER_VIDEO = 142


def system_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def build_agent(log: ActivityLog) -> Agent:
    """The orchestrator: model + tools + activity hook."""
    return Agent(
        model=build_model(),
        tools=ALL_TOOLS,
        system_prompt=system_prompt(),
        hooks=[StrandsActivityHook(log)],
        callback_handler=None,
    )


def _task(content_id: str) -> str:
    return (
        f"A new video is ready for post-production: content id {content_id}.\n\n"
        "Work the full loop. Read the transcript, load the creator's memory and "
        "baseline, find candidate moments, score every candidate, draft assets "
        "from the survivors, schedule them, attempt to publish, and verify what "
        "you publish. Stop and report when the remaining actions need the "
        "creator's approval."
    )


def run_workflow(content_id: str, creator_id: str | None = None) -> Run:
    """Execute one post-production run and return its recorded state."""
    content = load_content(content_id)
    creator = load_creator(creator_id or content.creator_id)

    run = Run(
        id=f"run_{uuid.uuid4().hex[:10]}",
        content_id=content.id,
        creator_id=creator.id,
        status="running",
        mode=settings.agent_mode,
        started_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
    )
    runs.put(run)

    log = ActivityLog()
    ctx = RunContext(run_id=run.id, creator=creator, content=content, log=log)
    token = set_context(ctx)

    log.ingest(
        f"Received {content.filename or content.id} ({content.duration}).",
        f"mode: {settings.agent_mode}",
    )

    try:
        if settings.is_replay:
            summary = _replay_driver(content.id)
        else:
            agent = build_agent(log)
            result = agent(_task(content.id))
            summary = str(result.message) if result.message else ""
        run.status = "awaiting_approval" if _has_pending(ctx) else "completed"
        run.error = None
    except Exception as exc:  # surfaced to the UI rather than swallowed
        run.status = "failed"
        run.error = f"{type(exc).__name__}: {exc}"
        log.error("ORCHESTRATOR", "Run failed.", run.error)
        summary = ""
    finally:
        reset_context(token)

    _finalise(run, ctx, log, summary)
    runs.put(run)
    return run


def _has_pending(ctx: RunContext) -> bool:
    return any(
        asset.action_class == "approval" and asset.status == "pending"
        for asset in ctx.scratch.get("assets", [])
    )


def _finalise(run: Run, ctx: RunContext, log: ActivityLog, summary: str) -> None:
    moments = list(ctx.moments.values())
    assets = list(ctx.scratch.get("assets", []))
    selected = [m for m in moments if m.status == "selected"]
    scored = [m for m in moments if m.status in ("selected", "rejected")]

    run.moments = moments
    run.assets = assets
    run.log = log.entries
    run.performance = ctx.scratch.get("performance")
    run.next_recommendation = ctx.scratch.get("next_recommendation")
    run.finished_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    pending = sum(1 for a in assets if a.status == "pending")
    verified = sum(1 for a in assets if a.status in ("published", "scheduled"))
    tool_calls = max(ctx.tool_invocations, log.tool_call_count)
    # Every scored moment and every drafted asset is a judgement the creator did
    # not have to make; the approvals we surface are the ones they still do.
    judgement_calls = len(scored) + len(assets)
    decisions_avoided = max(0, judgement_calls - pending)

    run.metrics = RunMetrics(
        candidate_moments=len(moments),
        analysed=len(scored),
        selected=len(selected),
        rejection_rate=percentage(len(scored) - len(selected), len(scored)),
        actions_planned=len(assets),
        actions_verified=verified,
        recoveries=ctx.recoveries,
        tool_calls=tool_calls,
        manual_minutes=MANUAL_MINUTES_PER_VIDEO,
        kreatr_minutes=32,
        saved_minutes=MANUAL_MINUTES_PER_VIDEO - 32,
        decisions_avoided=decisions_avoided,
        decision_reduction=percentage(decisions_avoided, judgement_calls or 1),
    )

    if summary:
        log.add("reasoning", "SUMMARY", summary.strip()[:600])
    if pending:
        log.gatekeeper(f"{pending} public actions require creator approval. Pausing execution.")

    run.log = log.entries


# ---------------------------------------------------------------------------
# Replay driver
# ---------------------------------------------------------------------------

def _replay_driver(content_id: str) -> str:
    """Run the tools in a fixed order, with no model in the loop.

    Exercises the same tool code paths the agent uses, so the API and UI can be
    developed offline. This is not the agent making decisions.
    """
    from agent.tools import (
        find_content_moments,
        generate_asset_plan,
        get_creator_analytics,
        get_creator_memory,
        get_transcript,
        publish_asset,
        schedule_asset,
        verify_publish_result,
    )
    from agent.context import current

    ctx = current()
    ctx.log.reasoning("Replay mode: running the tool sequence without a model.")

    get_transcript(content_id)
    get_creator_memory()
    get_creator_analytics()
    find_content_moments(content_id)

    from agent.tools.scoring import score_moment

    for moment_id in list(ctx.moments):
        score_moment(moment_id)

    generate_asset_plan()

    for asset in ctx.scratch.get("assets", []):
        if asset.scheduled_for:
            schedule_asset(asset.id, asset.scheduled_for)
        result = publish_asset(asset.id)
        if '"retryRecommended": true' in result:
            publish_asset(asset.id)  # the recovery attempt
            verify_publish_result(asset.id)
        elif '"ok": true' in result:
            verify_publish_result(asset.id)

    selected = len(ctx.selected)
    return (
        f"Replay complete: {len(ctx.moments)} candidates, {selected} selected, "
        f"{len(ctx.rejected)} rejected."
    )


if __name__ == "__main__":  # pragma: no cover - manual smoke test
    import json
    import sys

    target = sys.argv[1] if len(sys.argv) > 1 else "vid_100saas"
    completed = run_workflow(target)
    print(json.dumps(completed.model_dump(by_alias=True), indent=2)[:4000])
