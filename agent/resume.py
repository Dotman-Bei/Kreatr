"""Resuming a run after the creator has decided.

The orchestrator pauses at the approval gate. When decisions arrive through the
API, this executes what was approved: publish, retry on failure, verify, then
close the loop by reading performance and writing back to Creator Memory.
"""

from __future__ import annotations

from datetime import datetime, timezone

from agent.config import settings
from agent.context import RunContext, reset_context, set_context
from agent.events import ActivityLog
from agent.schemas import LogEntry, Run
from agent.store import load_content, load_creator, runs
from agent.tools.analytics import analyze_performance
from agent.tools.memory import update_creator_memory
from agent.tools.publishing import publish_asset, verify_publish_result


def resume_after_approval(run_id: str) -> Run:
    """Execute approved actions, then learn from the result."""
    run = runs.get(run_id)
    if run is None:
        raise KeyError(f"Unknown run {run_id!r}")

    creator = load_creator(run.creator_id)
    content = load_content(run.content_id)

    log = ActivityLog()
    ctx = RunContext(run_id=run.id, creator=creator, content=content, log=log)
    ctx.moments = {m.id: m for m in run.moments}
    ctx.scratch["assets"] = run.assets
    token = set_context(ctx)

    decisions = runs.decisions(run_id)
    approved = [a for a in run.assets if decisions.get(a.id) == "approved"]
    rejected = [a for a in run.assets if decisions.get(a.id) == "rejected"]

    log.gatekeeper(
        f"Creator decided: {len(approved)} approved, {len(rejected)} rejected.",
        ", ".join(f"{a.id}={decisions.get(a.id)}" for a in approved + rejected) or None,
    )

    try:
        for asset in rejected:
            asset.status = "rejected"
            log.reasoning(f"{asset.id} rejected by the creator. Not publishing.")

        for asset in approved:
            _publish_with_retry(asset.id, log)

        _close_the_loop(ctx, log, approved)

        run.status = "awaiting_approval" if _still_pending(run, decisions) else "completed"
    except Exception as exc:
        run.status = "failed"
        run.error = f"{type(exc).__name__}: {exc}"
        log.error("ORCHESTRATOR", "Resume failed.", run.error)
    finally:
        reset_context(token)

    run.assets = list(ctx.scratch.get("assets", run.assets))
    run.log = _merge_log(run.log, log.entries)
    run.metrics.actions_verified = sum(
        1 for a in run.assets if a.status in ("published", "scheduled")
    )
    run.metrics.recoveries = run.metrics.recoveries + ctx.recoveries
    run.metrics.tool_calls = run.metrics.tool_calls + ctx.tool_invocations
    run.performance = ctx.scratch.get("performance") or run.performance
    run.next_recommendation = ctx.scratch.get("next_recommendation") or run.next_recommendation
    run.finished_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    runs.put(run)
    return run


def _publish_with_retry(asset_id: str, log: ActivityLog) -> None:
    """Publish, and retry on a recoverable failure — the verify/recover loop."""
    for attempt in range(1, settings.max_tool_retries + 1):
        result = publish_asset(asset_id)
        if '"ok": true' in result:
            verify_publish_result(asset_id)
            return
        if '"retryRecommended": true' not in result:
            log.error("TOOL:publish_asset", f"{asset_id} failed and cannot be retried.")
            return
        log.reasoning(f"Retrying {asset_id} (attempt {attempt + 1} of {settings.max_tool_retries}).")
    log.error("TOOL:publish_asset", f"{asset_id} exhausted {settings.max_tool_retries} attempts.")


def _close_the_loop(ctx: RunContext, log: ActivityLog, approved: list) -> None:
    """Read performance, then write the lesson back into Creator Memory."""
    published = [a for a in approved if a.status == "published"]
    if not published:
        return

    analyze_performance(published[0].id)
    learning = ctx.scratch.get("learning")
    if learning:
        topic = _topic_for(ctx, published[0])
        update_creator_memory(learning=learning, strong_topic=topic)


def _topic_for(ctx: RunContext, asset) -> str:
    moment = ctx.moments.get(asset.source_moment_id)
    return moment.topic.split()[0].lower() if moment else ""


def _still_pending(run: Run, decisions: dict[str, str]) -> bool:
    return any(
        a.action_class == "approval" and a.id not in decisions and a.status == "pending"
        for a in run.assets
    )


def _merge_log(existing: list[LogEntry], new: list[LogEntry]) -> list[LogEntry]:
    return list(existing) + list(new)
