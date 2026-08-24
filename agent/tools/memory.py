"""Tool 10 — update_creator_memory (plus a read counterpart).

What separates the second run from the first: an observation written here
changes how score_moment ranks candidates next time.
"""

from __future__ import annotations

import json

from strands import tool

from agent.context import current
from agent.store import save_creator


@tool
def get_creator_memory() -> str:
    """Read the creator's persistent profile: audience, tone, topics, learnings.

    Consult this before judging any moment — it is what makes a recommendation
    specific to this creator rather than generic.

    Returns:
        JSON of the stored creator memory.
    """
    ctx = current()
    ctx.tool_invocations += 1
    ctx.log.memory(
        ctx.creator.id,
        "Loaded creator memory.",
        f"strong: {', '.join(ctx.creator.historical_patterns.strong_topics) or 'none'}; "
        f"weak: {', '.join(ctx.creator.historical_patterns.weak_topics) or 'none'}",
    )
    return json.dumps(ctx.creator.model_dump(by_alias=True), indent=2)


@tool
def update_creator_memory(
    learning: str,
    strong_topic: str = "",
    weak_topic: str = "",
) -> str:
    """Persist something learned about what works for this creator.

    Write one durable, specific observation — it will shape future rankings.
    Optionally promote a topic to the strong list or demote one to the weak list.

    Args:
        learning: A specific, reusable observation, e.g. "Concrete pricing
            examples outperform generic startup advice".
        strong_topic: Optional topic to record as historically strong.
        weak_topic: Optional topic to record as historically weak.

    Returns:
        JSON of the updated memory.
    """
    ctx = current()
    ctx.tool_invocations += 1
    creator = ctx.creator
    changes: list[str] = []

    learning = learning.strip()
    if learning and learning not in creator.learnings:
        creator.learnings.append(learning)
        changes.append("learning")

    patterns = creator.historical_patterns
    if strong_topic:
        topic = strong_topic.strip().lower()
        if topic and topic not in patterns.strong_topics:
            patterns.strong_topics.append(topic)
            changes.append(f"+strong:{topic}")
        if topic in patterns.weak_topics:
            patterns.weak_topics.remove(topic)
    if weak_topic:
        topic = weak_topic.strip().lower()
        if topic and topic not in patterns.weak_topics:
            patterns.weak_topics.append(topic)
            changes.append(f"+weak:{topic}")
        if topic in patterns.strong_topics:
            patterns.strong_topics.remove(topic)

    if not changes:
        return json.dumps({"updated": False, "reason": "Nothing new to record."})

    save_creator(creator)
    ctx.log.memory(creator.id, f"Wrote to memory: {learning or ', '.join(changes)}", ", ".join(changes))
    return json.dumps({"updated": True, "changes": changes, "learnings": creator.learnings}, indent=2)
