"""Tool 3 — score_moment.

The judgement step. This is where Kreatr earns its keep: most candidates are
rejected here, each with a reason the creator can read.
"""

from __future__ import annotations

import json

from strands import tool

from agent.config import settings
from agent.context import current
from agent.fixtures import replay_score
from agent.llm import analyse
from agent.schemas import MomentScore

SYSTEM_PROMPT = """You score one candidate moment for short-form repurposing.

Score five signals from 0-100:
- Hook strength      — does the first 8 seconds earn the next 8?
- Standalone context — can a stranger follow it with no prior context?
- Audience relevance — does it matter to THIS creator's stated audience?
- Novelty            — is the claim specific, or generic advice anyone could give?
- Historical fit     — does it match topics that have worked for this creator?

The overall score is your judgement, not a mean. A fatal weakness in hook
strength or standalone context should sink the moment even if other signals
are strong.

Then return a verdict:
- "select"   — worth producing. Also name the platforms it suits.
- "reject"   — not worth producing. Give a specific rejection_reason naming the
               actual flaw, and set rejection_class to "weak-hook" or
               "low-relevance".
- "escalate" — you cannot responsibly decide: sponsor or brand content,
               potentially controversial material, or missing context. Set
               rejection_class to "escalated".

Rejecting is the normal outcome. Do not soften a weak moment into a selection.
Reasons must be concrete and about this specific moment — never generic praise."""


@tool
def score_moment(moment_id: str) -> str:
    """Score one candidate moment and decide whether it is worth producing.

    Weighs hook strength, standalone context, audience relevance, novelty and
    the creator's historical performance, then returns a select/reject/escalate
    verdict with reasons.

    Args:
        moment_id: The candidate to score, from find_content_moments.

    Returns:
        JSON with score, signals, reasons and the verdict.
    """
    ctx = current()
    ctx.tool_invocations += 1
    moment = ctx.moments.get(moment_id)
    if moment is None:
        return json.dumps({"error": f"Unknown moment {moment_id!r}. Call find_content_moments first."})

    memory = ctx.creator.historical_patterns
    prompt = (
        f"Creator audience: {ctx.creator.audience}\n"
        f"Creator tone: {', '.join(ctx.creator.tone)}\n"
        f"Creator avoids: {', '.join(ctx.creator.avoid) or 'nothing stated'}\n"
        f"Historically strong topics: {', '.join(memory.strong_topics) or 'none recorded'}\n"
        f"Historically weak topics: {', '.join(memory.weak_topics) or 'none recorded'}\n"
        f"Learned observations: {'; '.join(ctx.creator.learnings) or 'none yet'}\n"
        f"Pass threshold: {settings.moment_score_threshold}\n\n"
        f"Moment {moment.start}-{moment.end} ({moment.length_seconds}s)\n"
        f"Topic: {moment.topic}\n"
        f"Hook: {moment.hook}\n"
        f"Transcript: {moment.transcript}"
    )
    scored = analyse(
        prompt,
        MomentScore,
        system_prompt=SYSTEM_PROMPT,
        fallback=replay_score(moment_id),
    )

    moment.score = scored.score
    moment.signals = scored.signals
    moment.reasons = scored.reasons
    moment.platforms = scored.platforms

    if scored.verdict == "select":
        moment.status = "selected"
        moment.rejection_reason = None
        moment.rejection_class = None
        ctx.log.reasoning(
            f"Selected {moment.id} ({moment.score}) — {moment.topic}.",
            "; ".join(moment.reasons[:2]) or None,
        )
    else:
        moment.status = "rejected"
        moment.rejection_reason = scored.rejection_reason or "Did not meet the selection bar."
        moment.rejection_class = scored.rejection_class or (
            "escalated" if scored.verdict == "escalate" else "weak-hook"
        )
        if scored.verdict == "escalate":
            ctx.log.escalate(
                f"{moment.id} escalated — {moment.rejection_reason}",
                f"score {moment.score}",
            )
        else:
            ctx.log.reasoning(
                f"Rejected {moment.id} ({moment.score}) — {moment.rejection_reason}"
            )

    ctx.upsert_moment(moment)
    return json.dumps(
        {
            "momentId": moment.id,
            "score": moment.score,
            "verdict": scored.verdict,
            "signals": [s.model_dump(by_alias=True) for s in moment.signals],
            "reasons": moment.reasons,
            "rejectionReason": moment.rejection_reason,
            "platforms": moment.platforms,
        },
        indent=2,
    )
