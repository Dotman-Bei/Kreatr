"""Tool 4 — generate_asset_plan."""

from __future__ import annotations

import json

from strands import tool

from agent.context import current
from agent.fixtures import replay_assets
from agent.llm import analyse
from agent.schemas import AssetPlan

SYSTEM_PROMPT = """You turn selected moments into platform-native assets.

Rules:
- Write for each platform, never one caption reused everywhere. A Short title is
  not an X hook is not a newsletter angle.
- Match the creator's stated tone. Respect their "avoid" list absolutely.
- Route by payoff, not by habit: a visual, punchy moment belongs in a Short; a
  structural or framework-shaped one reads better as an X thread or newsletter.
- Do not produce an asset for every moment if a moment does not suit any format.
- action_class must be:
    "auto"     for reversible, non-public work (draft metadata, chapters, tags)
    "approval" for anything the audience will see (Shorts, posts, newsletters)
    "escalate" when you are not confident enough to recommend publishing
- confidence is your honest read, 0-100. Do not inflate it.
- icon must be one of: youtube, x, mail, tag.
- rationale must say why THIS asset, for THIS creator — cite the scoring signals
  or their history, not generic marketing language."""


@tool
def generate_asset_plan() -> str:
    """Draft platform-native assets from the moments that survived scoring.

    Produces Shorts, X threads, newsletter angles and YouTube metadata, each
    with copy, scheduling, a confidence score and an action class.

    Returns:
        JSON array of the drafted assets.
    """
    ctx = current()
    ctx.tool_invocations += 1
    selected = ctx.selected
    if not selected:
        ctx.log.reasoning("No moments survived scoring. Nothing to draft.")
        return json.dumps({"assets": [], "note": "No moments met the selection bar."})

    moment_lines = "\n\n".join(
        f"id: {m.id}\n"
        f"span: {m.start}-{m.end} ({m.length_seconds}s)\n"
        f"topic: {m.topic}\n"
        f"hook: {m.hook}\n"
        f"score: {m.score}\n"
        f"suggested platforms: {', '.join(m.platforms) or 'unspecified'}\n"
        f"transcript: {m.transcript}"
        for m in selected
    )
    prompt = (
        f"Creator: {ctx.creator.name}\n"
        f"Audience: {ctx.creator.audience}\n"
        f"Tone: {', '.join(ctx.creator.tone)}\n"
        f"Avoid: {', '.join(ctx.creator.avoid) or 'nothing stated'}\n"
        f"Preferred formats: {', '.join(ctx.creator.preferred_formats)}\n"
        f"Source video: {ctx.content.title}\n\n"
        f"Selected moments:\n{moment_lines}\n\n"
        "Draft the asset plan. Include exactly one 'auto' class YouTube metadata "
        "asset covering chapters, description and tags for the source video."
    )
    plan = analyse(
        prompt,
        AssetPlan,
        system_prompt=SYSTEM_PROMPT,
        fallback=replay_assets(ctx.content.id),
    )

    known = set(ctx.moments)
    assets = []
    for asset in plan.assets:
        if asset.source_moment_id not in known:
            # Keep the plan anchored to moments that actually exist.
            asset.source_moment_id = selected[0].id
        asset.status = "pending" if asset.action_class == "approval" else "draft"
        assets.append(asset)

    ctx.scratch["assets"] = assets
    by_class: dict[str, int] = {}
    for asset in assets:
        by_class[asset.action_class] = by_class.get(asset.action_class, 0) + 1
    ctx.log.reasoning(
        f"Drafted {len(assets)} assets from {len(selected)} selected moments.",
        ", ".join(f"{count} {name}" for name, count in sorted(by_class.items())),
    )
    return json.dumps([a.model_dump(by_alias=True) for a in assets], indent=2)
