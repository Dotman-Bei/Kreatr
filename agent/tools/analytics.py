"""Tools 5 and 9 — get_creator_analytics, analyze_performance.

Metrics are seeded for the demo. The interface is what matters: the agent asks
for numbers, compares them to a baseline, and turns the gap into a decision.
"""

from __future__ import annotations

import json

from strands import tool

from agent.context import current
from agent.fixtures import replay_performance
from agent.llm import analyse
from agent.schemas import NextRecommendation, PerformanceAnalysis

ANALYSIS_PROMPT = """You interpret how a published asset performed.

Say what happened in one sentence of plain numbers. Then give the likeliest
reason, grounded in the asset itself — its hook, topic or format — not in
generic engagement theory. Then recommend one concrete next action.

Finally write a single `learning`: a durable, reusable sentence about what works
for this creator. It must be specific enough to change a future ranking
decision. "Post more often" is useless. "Concrete pricing examples outperform
generic startup advice" is useful."""

RECOMMENDATION_PROMPT = """You recommend this creator's next piece of content.

Ground the recommendation in the performance evidence you are given and in the
creator's history. Give a title they could actually film, the format, an honest
confidence score, and evidence a sceptical creator would accept."""


@tool
def get_creator_analytics(creator_id: str = "") -> str:
    """Fetch the creator's historical baseline and recent asset performance.

    Call this before ranking moments — the baseline is what makes a score
    meaningful for this specific channel.

    Args:
        creator_id: Optional creator id; defaults to the current run's creator.

    Returns:
        JSON with the channel baseline, strong and weak topics, and any recent
        published-asset metrics.
    """
    ctx = current()
    ctx.tool_invocations += 1
    creator = ctx.creator
    if creator_id and creator_id != creator.id:
        from agent.store import load_creator

        creator = load_creator(creator_id)

    performance = replay_performance(ctx.content.id)
    payload = {
        "creatorId": creator.id,
        "audience": creator.audience,
        "baseline": creator.baseline.model_dump(by_alias=True),
        "strongTopics": creator.historical_patterns.strong_topics,
        "weakTopics": creator.historical_patterns.weak_topics,
        "learnings": creator.learnings,
        "recentAsset": performance.model_dump(by_alias=True) if performance else None,
    }
    ctx.log.tool(
        "get_creator_analytics",
        f"Loaded baseline for {creator.id} "
        f"(avg {creator.baseline.avg_short_views:,} views, {creator.baseline.avg_retention}% retention).",
    )
    return json.dumps(payload, indent=2)


@tool
def analyze_performance(asset_id: str) -> str:
    """Compare a published asset against the channel baseline and draw a lesson.

    Args:
        asset_id: The published asset to analyse.

    Returns:
        JSON with what happened, the likely reason, a recommended next action,
        a durable learning, and the next content recommendation.
    """
    ctx = current()
    ctx.tool_invocations += 1
    performance = replay_performance(ctx.content.id)
    if performance is None:
        return json.dumps({"error": "No performance data available for this content yet."})

    facts = (
        f"Asset: {performance.asset}\n"
        f"Views: {performance.views:,} (baseline {performance.baseline_views:,})\n"
        f"Retention: {performance.retention}% (baseline {performance.baseline_retention}%)\n"
        f"CTR: {performance.ctr}% (baseline {performance.baseline_ctr}%)\n"
        f"New subscribers: {performance.new_subscribers:,}\n"
        f"Creator audience: {ctx.creator.audience}\n"
        f"Strong topics: {', '.join(ctx.creator.historical_patterns.strong_topics)}"
    )

    analysis = analyse(
        facts,
        PerformanceAnalysis,
        system_prompt=ANALYSIS_PROMPT,
        fallback=PerformanceAnalysis(
            what_happened=(
                f"{performance.asset} reached {performance.views:,} views against a "
                f"{performance.baseline_views:,} baseline — {performance.multiple} the channel average."
            ),
            likely_reason=(
                "The hook states a concrete, surprising outcome in the first seconds and the "
                "topic matches what this audience already engages with."
            ),
            recommended_next_action="Produce a full-length follow-up on the same topic.",
            learning="Concrete pricing examples outperform generic startup advice.",
        ),
    )

    recommendation = analyse(
        f"{facts}\n\nAnalysis: {analysis.what_happened} {analysis.likely_reason}",
        NextRecommendation,
        system_prompt=RECOMMENDATION_PROMPT,
        fallback=NextRecommendation(
            title="How I Price My SaaS",
            format="Full-length video, 12-16 min",
            confidence=88,
            reason=analysis.likely_reason,
            evidence=[
                f"{performance.views:,} views against a {performance.baseline_views:,} baseline.",
                f"Retention held at {performance.retention}% versus a {performance.baseline_retention}% baseline.",
                "Pricing is already a top-3 historical topic for this channel.",
            ],
        ),
    )

    ctx.scratch["performance"] = performance
    ctx.scratch["next_recommendation"] = recommendation
    ctx.scratch["learning"] = analysis.learning

    ctx.log.learn("TOOL:analyze_performance", analysis.what_happened)
    ctx.log.learn("RECOMMENDATION", f"Next content: {recommendation.title}.")

    return json.dumps(
        {
            "analysis": analysis.model_dump(by_alias=True),
            "nextRecommendation": recommendation.model_dump(by_alias=True),
        },
        indent=2,
    )
