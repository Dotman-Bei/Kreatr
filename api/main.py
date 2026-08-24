"""Kreatr HTTP API.

Thin layer over the agent: start a run, read its state, record creator
decisions, and stream the activity feed. All responses are camelCase so the
Next.js client consumes them directly.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any, Literal

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent.config import settings
from agent.ingest import IngestError, ingest_video
from agent.main import run_workflow
from agent.resume import resume_after_approval
from agent.schemas import Run
from agent.store import list_content, list_creators, load_content, load_creator, runs

app = FastAPI(
    title="Kreatr API",
    version="0.1.0",
    description="Autonomous post-production agent for creators.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request bodies
# ---------------------------------------------------------------------------

class RunRequest(BaseModel):
    content_id: str = "vid_100saas"
    creator_id: str | None = None


class DecisionRequest(BaseModel):
    decision: Literal["approved", "rejected"]


# ---------------------------------------------------------------------------
# Meta
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "mode": settings.agent_mode,
        "model": settings.bedrock_model_id if not settings.is_replay else None,
        "region": settings.aws_region,
        "publishingMode": settings.publishing_mode,
    }


@app.get("/api/creators")
def get_creators() -> list[dict[str, Any]]:
    return [c.model_dump(by_alias=True) for c in list_creators()]


@app.get("/api/creators/{creator_id}")
def get_creator(creator_id: str) -> dict[str, Any]:
    try:
        return load_creator(creator_id).model_dump(by_alias=True)
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc


@app.get("/api/content")
def get_all_content() -> list[dict[str, Any]]:
    # The transcript is large; omit it from the list view.
    return [
        c.model_dump(by_alias=True, exclude={"transcript"}) for c in list_content()
    ]


@app.get("/api/content/{content_id}")
def get_content(content_id: str) -> dict[str, Any]:
    try:
        return load_content(content_id).model_dump(by_alias=True)
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc


@app.post("/api/content/upload", status_code=201)
async def upload_content(
    file: UploadFile = File(...),
    creator_id: str = Form("creator_alex"),
    title: str = Form(""),
) -> dict[str, Any]:
    """Upload a video, extract audio, transcribe it, and store the content.

    Stage A of the workflow. Returns the stored content so a run can be started
    against it immediately.
    """
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    destination = settings.uploads_dir / (file.filename or "upload.mp4")

    try:
        with destination.open("wb") as handle:
            while chunk := await file.read(1024 * 1024):
                handle.write(chunk)
    except OSError as exc:
        raise HTTPException(500, f"Could not save the upload: {exc}") from exc

    try:
        result = ingest_video(destination, creator_id=creator_id, title=title or None)
    except IngestError as exc:
        # Missing ffmpeg, no S3 bucket, silent audio — all actionable, so the
        # message goes back to the caller verbatim.
        raise HTTPException(422, str(exc)) from exc

    return {
        "contentId": result.content.id,
        "title": result.content.title,
        "duration": result.content.duration,
        "transcriptWords": result.content.transcript_words,
        "lines": len(result.content.transcript),
        "provider": result.provider,
        "secondsElapsed": round(result.seconds_elapsed, 1),
    }


# ---------------------------------------------------------------------------
# Runs
# ---------------------------------------------------------------------------

@app.post("/api/runs", status_code=202)
def start_run(body: RunRequest, background: BackgroundTasks) -> dict[str, Any]:
    """Kick off a post-production run and return immediately.

    A live run makes many model calls, so the work happens in the background and
    the client polls `/api/runs/{id}` or subscribes to the event stream.
    """
    try:
        load_content(body.content_id)
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc

    background.add_task(run_workflow, body.content_id, body.creator_id)
    return {"accepted": True, "contentId": body.content_id, "mode": settings.agent_mode}


@app.post("/api/runs/sync")
def start_run_sync(body: RunRequest) -> dict[str, Any]:
    """Run synchronously and return the finished run. Convenient in replay mode."""
    try:
        run = run_workflow(body.content_id, body.creator_id)
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc
    return run.model_dump(by_alias=True)


@app.get("/api/runs")
def get_runs() -> list[dict[str, Any]]:
    return [_summary(r) for r in sorted(runs.all(), key=lambda r: r.started_at, reverse=True)]


@app.get("/api/runs/latest")
def get_latest_run() -> dict[str, Any]:
    run = runs.latest()
    if run is None:
        raise HTTPException(404, "No runs yet. POST /api/runs to start one.")
    return run.model_dump(by_alias=True)


@app.get("/api/runs/{run_id}")
def get_run(run_id: str) -> dict[str, Any]:
    run = _require(run_id)
    return run.model_dump(by_alias=True)


@app.post("/api/runs/{run_id}/assets/{asset_id}/decision")
def decide(run_id: str, asset_id: str, body: DecisionRequest) -> dict[str, Any]:
    """Record the creator's approve/reject decision for one asset."""
    run = _require(run_id)
    if not any(a.id == asset_id for a in run.assets):
        raise HTTPException(404, f"Run {run_id} has no asset {asset_id}")
    runs.set_decision(run_id, asset_id, body.decision)
    return {"ok": True, "runId": run_id, "assetId": asset_id, "decision": body.decision}


@app.post("/api/runs/{run_id}/resume")
def resume(run_id: str) -> dict[str, Any]:
    """Execute everything the creator approved, then learn from the outcome."""
    _require(run_id)
    try:
        run = resume_after_approval(run_id)
    except KeyError as exc:
        raise HTTPException(404, str(exc)) from exc
    return run.model_dump(by_alias=True)


@app.get("/api/runs/{run_id}/events")
async def stream_events(run_id: str) -> StreamingResponse:
    """Server-sent events: replays the log so far, then polls for new entries."""
    _require(run_id)

    async def generator():
        sent = 0
        idle = 0
        while idle < 300:  # ~5 minutes of quiet before closing
            run = runs.get(run_id)
            entries = run.log if run else []
            if len(entries) > sent:
                for entry in entries[sent:]:
                    yield f"data: {json.dumps(entry.model_dump(by_alias=True))}\n\n"
                sent = len(entries)
                idle = 0
            else:
                idle += 1
            if run and run.status in ("completed", "failed") and sent >= len(entries):
                yield f"event: done\ndata: {json.dumps({'status': run.status})}\n\n"
                return
            await asyncio.sleep(1)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _require(run_id: str) -> Run:
    run = runs.get(run_id)
    if run is None:
        raise HTTPException(404, f"Unknown run {run_id!r}")
    return run


def _summary(run: Run) -> dict[str, Any]:
    return {
        "id": run.id,
        "contentId": run.content_id,
        "creatorId": run.creator_id,
        "status": run.status,
        "mode": run.mode,
        "startedAt": run.started_at,
        "finishedAt": run.finished_at,
        "metrics": run.metrics.model_dump(by_alias=True),
    }


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
