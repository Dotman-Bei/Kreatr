"""Per-run context made available to tools.

Strands tools are plain module-level functions, so the active run travels in a
ContextVar rather than through every signature.
"""

from __future__ import annotations

from contextvars import ContextVar
from dataclasses import dataclass, field
from typing import Any

from agent.events import ActivityLog
from agent.schemas import Content, Creator, Moment


@dataclass
class RunContext:
    run_id: str
    creator: Creator
    content: Content
    log: ActivityLog
    #: Moments accumulated across find_content_moments / score_moment calls.
    moments: dict[str, Moment] = field(default_factory=dict)
    #: Scratch space for tools that need to pass state between calls.
    scratch: dict[str, Any] = field(default_factory=dict)
    recoveries: int = 0
    #: Incremented by every tool entry point, so the count is right in both modes.
    tool_invocations: int = 0

    def upsert_moment(self, moment: Moment) -> None:
        self.moments[moment.id] = moment

    @property
    def selected(self) -> list[Moment]:
        return [m for m in self.moments.values() if m.status == "selected"]

    @property
    def rejected(self) -> list[Moment]:
        return [m for m in self.moments.values() if m.status == "rejected"]


_current: ContextVar[RunContext | None] = ContextVar("kreatr_run_context", default=None)


def set_context(ctx: RunContext):
    """Set the active run context; returns the token for resetting."""
    return _current.set(ctx)


def reset_context(token) -> None:
    _current.reset(token)


def current() -> RunContext:
    ctx = _current.get()
    if ctx is None:
        raise RuntimeError(
            "No active Kreatr run context. Tools must be invoked inside a run "
            "(see agent.main.run_workflow)."
        )
    return ctx
