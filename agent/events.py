"""Agent activity log.

Every entry the workspace's agent feed renders comes from here. The
`StrandsActivityHook` below is registered on the agent, so tool calls in the feed
are real executions reported by the SDK rather than narration written by hand.
"""

from __future__ import annotations

import threading
from datetime import datetime, timezone
from typing import Any, Callable

from strands.hooks import (
    AfterInvocationEvent,
    AfterModelCallEvent,
    AfterToolCallEvent,
    BeforeInvocationEvent,
    BeforeToolCallEvent,
    HookProvider,
    HookRegistry,
)

from agent.schemas import LogEntry, LogLevel

Listener = Callable[[LogEntry], None]

#: Tools whose completion should read as a verification step in the feed.
_VERIFY_TOOLS = {"verify_publish_result"}
_MEMORY_TOOLS = {"update_creator_memory", "get_creator_memory"}
_LEARN_TOOLS = {"analyze_performance", "get_creator_analytics"}


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%H:%M:%S")


class ActivityLog:
    """Thread-safe, append-only log with fan-out to live listeners (SSE)."""

    def __init__(self) -> None:
        self._entries: list[LogEntry] = []
        self._listeners: list[Listener] = []
        self._lock = threading.Lock()

    def add(
        self,
        level: LogLevel,
        tag: str,
        message: str,
        detail: str | None = None,
    ) -> LogEntry:
        entry = LogEntry(time=_now(), level=level, tag=tag, message=message, detail=detail)
        with self._lock:
            self._entries.append(entry)
            listeners = list(self._listeners)
        for listener in listeners:
            try:
                listener(entry)
            except Exception:  # a broken subscriber must not break the agent
                pass
        return entry

    # Convenience wrappers used throughout the tools ------------------------
    def ingest(self, message: str, detail: str | None = None) -> LogEntry:
        return self.add("ingest", "INGEST", message, detail)

    def reasoning(self, message: str, detail: str | None = None) -> LogEntry:
        return self.add("reasoning", "REASONING", message, detail)

    def memory(self, creator_id: str, message: str, detail: str | None = None) -> LogEntry:
        return self.add("memory", f"MEMORY:{creator_id}", message, detail)

    def gatekeeper(self, message: str, detail: str | None = None) -> LogEntry:
        return self.add("gatekeeper", "GATEKEEPER", message, detail)

    def escalate(self, message: str, detail: str | None = None) -> LogEntry:
        return self.add("gatekeeper", "ESCALATE", message, detail)

    def error(self, tag: str, message: str, detail: str | None = None) -> LogEntry:
        return self.add("error", tag, message, detail)

    def learn(self, tag: str, message: str, detail: str | None = None) -> LogEntry:
        return self.add("learn", tag, message, detail)

    def tool(self, name: str, message: str, detail: str | None = None) -> LogEntry:
        level: LogLevel = (
            "verify" if name in _VERIFY_TOOLS
            else "memory" if name in _MEMORY_TOOLS
            else "learn" if name in _LEARN_TOOLS
            else "tool"
        )
        return self.add(level, f"TOOL:{name}", message, detail)

    # Access ----------------------------------------------------------------
    @property
    def entries(self) -> list[LogEntry]:
        with self._lock:
            return list(self._entries)

    def subscribe(self, listener: Listener) -> Callable[[], None]:
        with self._lock:
            self._listeners.append(listener)

        def unsubscribe() -> None:
            with self._lock:
                if listener in self._listeners:
                    self._listeners.remove(listener)

        return unsubscribe

    @property
    def tool_call_count(self) -> int:
        return sum(1 for entry in self.entries if entry.tag.startswith("TOOL:"))


class StrandsActivityHook(HookProvider):
    """Bridges Strands lifecycle events into the activity log."""

    def __init__(self, log: ActivityLog) -> None:
        self.log = log
        self.model_calls = 0

    def register_hooks(self, registry: HookRegistry, **_: Any) -> None:
        registry.add_callback(BeforeInvocationEvent, self._on_start)
        registry.add_callback(BeforeToolCallEvent, self._on_tool_start)
        registry.add_callback(AfterToolCallEvent, self._on_tool_end)
        registry.add_callback(AfterModelCallEvent, self._on_model_end)
        registry.add_callback(AfterInvocationEvent, self._on_finish)

    # -- callbacks ----------------------------------------------------------
    def _on_start(self, _event: BeforeInvocationEvent) -> None:
        self.log.reasoning("Orchestrator started. Planning the post-production workflow.")

    def _on_tool_start(self, event: BeforeToolCallEvent) -> None:
        name = _tool_name(event.tool_use)
        args = _tool_args(event.tool_use)
        self.log.tool(name, f"Calling {name}({args}).")

    def _on_tool_end(self, event: AfterToolCallEvent) -> None:
        name = _tool_name(event.tool_use)
        if event.exception is not None:
            self.log.error(
                f"TOOL:{name}",
                f"{name} raised {type(event.exception).__name__}.",
                str(event.exception)[:300],
            )
            return
        duration = f"{event.duration:.2f}s" if getattr(event, "duration", None) else None
        self.log.tool(name, f"{name} returned.", duration)

    def _on_model_end(self, event: AfterModelCallEvent) -> None:
        self.model_calls += 1
        if event.exception is not None:
            self.log.error(
                "MODEL",
                f"Model call failed: {type(event.exception).__name__}.",
                str(event.exception)[:300],
            )

    def _on_finish(self, _event: AfterInvocationEvent) -> None:
        self.log.reasoning(
            f"Orchestrator finished. {self.model_calls} model calls, "
            f"{self.log.tool_call_count} tool calls."
        )


def _tool_name(tool_use: Any) -> str:
    if isinstance(tool_use, dict):
        return str(tool_use.get("name", "unknown"))
    return str(getattr(tool_use, "name", "unknown"))


def _tool_args(tool_use: Any) -> str:
    raw = tool_use.get("input") if isinstance(tool_use, dict) else getattr(tool_use, "input", None)
    if not isinstance(raw, dict) or not raw:
        return ""
    parts = []
    for key, value in list(raw.items())[:3]:
        text = str(value)
        if len(text) > 40:
            text = text[:37] + "..."
        parts.append(f"{key}={text}")
    return ", ".join(parts)
