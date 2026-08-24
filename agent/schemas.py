"""Shared schemas.

These are the contract between the agent, the API and the web app. Field names
serialise to camelCase so the Next.js client can consume them without a mapping
layer — they mirror the types already in `apps/web/lib/mockData.ts`.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


def _camel(name: str) -> str:
    head, *rest = name.split("_")
    return head + "".join(word.capitalize() for word in rest)


class Base(BaseModel):
    model_config = ConfigDict(alias_generator=_camel, populate_by_name=True)


# ---------------------------------------------------------------------------
# Creator memory
# ---------------------------------------------------------------------------

class HistoricalPatterns(Base):
    strong_topics: list[str] = Field(default_factory=list)
    weak_topics: list[str] = Field(default_factory=list)


class Baseline(Base):
    avg_short_views: int = 0
    avg_ctr: float = 0.0
    avg_retention: int = 0


class Creator(Base):
    id: str
    name: str
    handle: str = ""
    avatar: str = ""
    primary_platform: str = "YouTube"
    audience: str
    subscribers: str = ""
    tone: list[str] = Field(default_factory=list)
    preferred_formats: list[str] = Field(default_factory=list)
    avoid: list[str] = Field(default_factory=list)
    historical_patterns: HistoricalPatterns = Field(default_factory=HistoricalPatterns)
    baseline: Baseline = Field(default_factory=Baseline)
    #: Observations written back by `update_creator_memory`.
    learnings: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Content and moments
# ---------------------------------------------------------------------------

class TranscriptLine(Base):
    start: float
    end: float
    text: str


class Content(Base):
    id: str
    creator_id: str
    title: str
    filename: str = ""
    duration: str
    duration_seconds: int
    uploaded_at: str = ""
    transcript_words: int = 0
    poster: str = ""
    thumbnail: str = ""
    transcript: list[TranscriptLine] = Field(default_factory=list)


class Signal(Base):
    label: str
    value: int = Field(ge=0, le=100)


MomentStatus = Literal["selected", "rejected", "candidate"]
RejectionClass = Literal["weak-hook", "low-relevance", "escalated"]


class Moment(Base):
    id: str
    start: str
    end: str
    start_seconds: int
    end_seconds: int
    length_seconds: int
    topic: str
    hook: str
    status: MomentStatus = "candidate"
    score: int = Field(default=0, ge=0, le=100)
    platforms: list[str] = Field(default_factory=list)
    signals: list[Signal] = Field(default_factory=list)
    reasons: list[str] = Field(default_factory=list)
    transcript: str = ""
    rejection_reason: str | None = None
    rejection_class: RejectionClass | None = None


class CandidateMoment(Base):
    """What `find_content_moments` returns before scoring."""

    start: str
    end: str
    topic: str
    hook: str
    transcript: str


class CandidateList(Base):
    moments: list[CandidateMoment]


class MomentScore(Base):
    """What `score_moment` returns."""

    score: int = Field(ge=0, le=100)
    signals: list[Signal]
    reasons: list[str]
    verdict: Literal["select", "reject", "escalate"]
    rejection_reason: str | None = None
    rejection_class: RejectionClass | None = None
    platforms: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Assets
# ---------------------------------------------------------------------------

ActionClass = Literal["auto", "approval", "escalate"]
AssetStatus = Literal["draft", "pending", "scheduled", "published", "failed", "rejected"]


class MetaChip(Base):
    label: str
    value: str


class Asset(Base):
    id: str
    type: str
    platform: str
    icon: Literal["youtube", "x", "mail", "tag"] = "tag"
    source_moment_id: str
    confidence: int = Field(ge=0, le=100)
    action_class: ActionClass = "approval"
    status: AssetStatus = "draft"
    scheduled_for: str = ""
    title: str
    body: str
    meta: list[MetaChip] = Field(default_factory=list)
    rationale: list[str] = Field(default_factory=list)


class AssetPlan(Base):
    """What `generate_asset_plan` returns."""

    assets: list[Asset]


# ---------------------------------------------------------------------------
# Analytics and learning
# ---------------------------------------------------------------------------

class Performance(Base):
    asset_id: str
    asset: str = ""
    views: int = 0
    baseline_views: int = 0
    multiple: str = ""
    retention: int = 0
    baseline_retention: int = 0
    ctr: float = 0.0
    baseline_ctr: float = 0.0
    new_subscribers: int = 0


class PerformanceAnalysis(Base):
    """What `analyze_performance` returns."""

    what_happened: str
    likely_reason: str
    recommended_next_action: str
    learning: str


class NextRecommendation(Base):
    title: str
    format: str
    confidence: int = Field(ge=0, le=100)
    reason: str
    evidence: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Agent activity
# ---------------------------------------------------------------------------

LogLevel = Literal[
    "ingest", "tool", "reasoning", "memory", "gatekeeper", "verify", "error", "learn"
]


class LogEntry(Base):
    time: str
    level: LogLevel
    tag: str
    message: str
    detail: str | None = None


# ---------------------------------------------------------------------------
# Run state
# ---------------------------------------------------------------------------

RunStatus = Literal["queued", "running", "awaiting_approval", "completed", "failed"]


class RunMetrics(Base):
    candidate_moments: int = 0
    analysed: int = 0
    selected: int = 0
    rejection_rate: int = 0
    actions_planned: int = 0
    actions_verified: int = 0
    recoveries: int = 0
    tool_calls: int = 0
    manual_minutes: int = 142
    kreatr_minutes: int = 0
    saved_minutes: int = 0
    decisions_avoided: int = 0
    decision_reduction: int = 0


class Run(Base):
    id: str
    content_id: str
    creator_id: str
    status: RunStatus = "queued"
    mode: str = "live"
    started_at: str = ""
    finished_at: str | None = None
    error: str | None = None
    moments: list[Moment] = Field(default_factory=list)
    assets: list[Asset] = Field(default_factory=list)
    log: list[LogEntry] = Field(default_factory=list)
    metrics: RunMetrics = Field(default_factory=RunMetrics)
    performance: Performance | None = None
    next_recommendation: NextRecommendation | None = None
