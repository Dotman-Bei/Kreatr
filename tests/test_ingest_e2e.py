"""End-to-end ingest with ffmpeg and the transcriber stubbed out.

Proves the wiring — probe, extract, transcribe, assemble, persist — without
needing ffmpeg installed or an AWS account.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from agent import ingest
from agent.schemas import TranscriptLine

FAKE_LINES = [
    TranscriptLine(start=0.0, end=6.0, text="Thirty days ago this was an empty repo."),
    TranscriptLine(start=6.0, end=14.5, text="I tripled my price and lost exactly zero customers."),
    TranscriptLine(start=14.5, end=20.0, text="Distribution is a compounding loop."),
]


@pytest.fixture
def stubbed(monkeypatch, tmp_path: Path):
    """Stub the two things that need external binaries or AWS."""
    monkeypatch.setattr(ingest, "probe_duration", lambda _: 1214.0)
    monkeypatch.setattr(ingest, "extract_audio", lambda p, out_dir=None: tmp_path / "audio.wav")
    monkeypatch.setattr(ingest, "transcribe", lambda _: list(FAKE_LINES))
    # Keep the test off the real data directory.
    monkeypatch.setattr(ingest, "save_content", lambda content: None)
    return tmp_path


def test_ingest_assembles_content(stubbed, tmp_path: Path):
    video = tmp_path / "saas_growth_final.mp4"
    video.write_bytes(b"stub")

    result = ingest.ingest_video(video, creator_id="creator_alex")

    content = result.content
    assert content.creator_id == "creator_alex"
    assert content.filename == "saas_growth_final.mp4"
    assert content.duration == "20:14"          # 1214s formatted
    assert content.duration_seconds == 1214
    assert len(content.transcript) == 3
    assert content.transcript_words == sum(len(l.text.split()) for l in FAKE_LINES)
    # Title derived from the filename when none is given.
    assert content.title == "Saas Growth Final"
    assert content.id.startswith("vid_")


def test_explicit_title_and_id_win(stubbed, tmp_path: Path):
    video = tmp_path / "clip.mp4"
    video.write_bytes(b"stub")

    result = ingest.ingest_video(
        video, creator_id="creator_alex", title="How I Priced It", content_id="vid_custom"
    )
    assert result.content.title == "How I Priced It"
    assert result.content.id == "vid_custom"


def test_silent_audio_is_reported(monkeypatch, tmp_path: Path):
    monkeypatch.setattr(ingest, "probe_duration", lambda _: 60.0)
    monkeypatch.setattr(ingest, "extract_audio", lambda p, out_dir=None: tmp_path / "a.wav")
    monkeypatch.setattr(ingest, "transcribe", lambda _: [])

    video = tmp_path / "silent.mp4"
    video.write_bytes(b"stub")

    with pytest.raises(ingest.IngestError, match="Transcription returned nothing"):
        ingest.ingest_video(video, creator_id="creator_alex")


def test_upload_endpoint_reports_ingest_failure_as_422(monkeypatch, tmp_path: Path):
    """A missing ffmpeg should reach the caller as guidance, not a 500."""
    from api import main as api_main

    def boom(*_args, **_kwargs):
        raise ingest.IngestError("ffmpeg was not found. winget install Gyan.FFmpeg")

    import dataclasses

    monkeypatch.setattr(api_main, "ingest_video", boom)
    # Settings is frozen; swap in a copy pointed at the temp directory.
    monkeypatch.setattr(
        api_main, "settings", dataclasses.replace(api_main.settings, uploads_dir=tmp_path)
    )

    client = TestClient(api_main.app)
    response = client.post(
        "/api/content/upload",
        files={"file": ("clip.mp4", b"stub", "video/mp4")},
        data={"creator_id": "creator_alex"},
    )

    assert response.status_code == 422
    assert "ffmpeg was not found" in response.json()["detail"]
    assert "winget install" in response.json()["detail"]
