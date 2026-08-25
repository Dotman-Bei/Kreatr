"""Tool 2 — find_content_moments."""

from __future__ import annotations

import json

from strands import tool

from agent.config import settings
from agent.context import current
from agent.fixtures import replay_candidates
from agent.llm import analyse
from agent.schemas import CandidateList, Moment
from agent.tools.transcript import format_transcript
from agent.utils import slugify, to_seconds

SYSTEM_PROMPT = """You find short-form candidate moments inside a long-form transcript.

A candidate is a contiguous span, 25-60 seconds, that could stand alone for a
viewer who has not seen the source video. Be generous at this stage: return
everything plausible. A later scoring pass rejects the weak ones, so recall
matters more than precision here.

For each candidate give the start and end timestamps in MM:SS, a short topic
label, the opening line that would serve as the hook, and the transcript text
for the span. Never invent words that are not in the transcript."""


@tool
def find_content_moments(content_id: str, target_format: str = "short-form video") -> str:
    """Identify candidate moments in the transcript that could be repurposed.

    Returns raw candidates only. Nothing is selected or rejected here — call
    score_moment on each candidate to make that judgement.

    Args:
        content_id: The content to analyse.
        target_format: What the moments are being considered for, e.g.
            "short-form video", "X thread", "newsletter".

    Returns:
        A JSON array of candidates, each with id, start, end, topic, hook.
    """
    ctx = current()
    ctx.tool_invocations += 1
    transcript = format_transcript(ctx.content)

    prompt = (
        f"Creator audience: {ctx.creator.audience}\n"
        f"Creator tone: {', '.join(ctx.creator.tone)}\n"
        f"Target format: {target_format}\n\n"
        f"Transcript:\n{transcript}"
    )
    result = analyse(
        prompt,
        CandidateList,
        system_prompt=SYSTEM_PROMPT,
        fallback=replay_candidates(content_id),
    )

    payload = []
    for candidate in result.moments:
        start_s = to_seconds(candidate.start)
        end_s = to_seconds(candidate.end)
        moment = Moment(
            id=f"m_{slugify(candidate.topic)}",
            start=candidate.start,
            end=candidate.end,
            start_seconds=start_s,
            end_seconds=end_s,
            length_seconds=max(0, end_s - start_s),
            topic=candidate.topic,
            hook=candidate.hook,
            transcript=candidate.transcript,
            status="candidate",
        )
        ctx.upsert_moment(moment)
        payload.append(
            {
                "id": moment.id,
                "start": moment.start,
                "end": moment.end,
                "lengthSeconds": moment.length_seconds,
                "topic": moment.topic,
                "hook": moment.hook,
            }
        )

    ctx.scratch["candidate_count"] = len(payload)
    if payload or not settings.is_replay:
        # In live mode zero candidates is a real judgement, so it is reported plainly.
        ctx.log.reasoning(f"Identified {len(payload)} raw candidate segments.")
    else:
        # Replay fixtures are keyed by content id, so freshly ingested video has
        # none. Left unsaid, the run simply reports zero candidates and reads as
        # a broken pipeline rather than a mode that cannot answer this question.
        ctx.log.reasoning(
            f"No replay fixture exists for {content_id!r}, so there is nothing to replay.",
            "Newly ingested content can only be analysed with KREATR_AGENT_MODE=live.",
        )
    return json.dumps(payload, indent=2)
