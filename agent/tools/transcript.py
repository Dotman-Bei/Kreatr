"""Tool 1 — get_transcript."""

from __future__ import annotations

from strands import tool

from agent.context import current
from agent.schemas import Content
from agent.store import load_content
from agent.utils import stamp


def format_transcript(content: Content) -> str:
    return "\n".join(
        f"[{stamp(line.start)} - {stamp(line.end)}] {line.text}" for line in content.transcript
    )


@tool
def get_transcript(content_id: str) -> str:
    """Fetch the timestamped transcript for a piece of source content.

    Call this first: every downstream decision is grounded in the transcript.

    Args:
        content_id: Identifier of the content to transcribe, e.g. "vid_100saas".

    Returns:
        The transcript as timestamped lines in "[MM:SS - MM:SS] text" form.
    """
    ctx = current()
    ctx.tool_invocations += 1
    content = ctx.content if ctx.content.id == content_id else load_content(content_id)
    ctx.log.ingest(
        f"Loaded transcript for {content.id} "
        f"({content.transcript_words:,} words, {len(content.transcript)} lines)."
    )
    return format_transcript(content)
