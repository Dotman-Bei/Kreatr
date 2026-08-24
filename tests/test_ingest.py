"""Ingest tests — the parts that need neither ffmpeg nor AWS."""

from __future__ import annotations

from pathlib import Path

import pytest

from agent.ingest import (
    IngestError,
    _lines_from_words,
    extract_audio,
    parse_transcribe_payload,
)


# ---------------------------------------------------------------------------
# Word grouping
# ---------------------------------------------------------------------------

def words(*specs: tuple[float, float, str]) -> list[tuple[float, float, str]]:
    return list(specs)


def test_splits_on_a_long_pause():
    lines = _lines_from_words(
        words(
            (0.0, 0.4, "distribution"),
            (0.4, 0.8, "is"),
            (0.8, 1.2, "everything"),
            # 2s of silence: a new line starts here.
            (3.2, 3.6, "pricing"),
            (3.6, 4.0, "next"),
        )
    )
    assert len(lines) == 2
    assert lines[0].text == "distribution is everything"
    assert lines[1].text == "pricing next"
    assert lines[0].start == 0.0
    assert lines[1].start == 3.2


def test_splits_after_a_sentence_ends():
    lines = _lines_from_words(
        words(
            (0.0, 0.4, "I"),
            (0.4, 0.8, "tripled"),
            (0.8, 1.2, "it."),
            (1.3, 1.7, "Nobody"),
            (1.7, 2.1, "left."),
        )
    )
    assert [line.text for line in lines] == ["I tripled it.", "Nobody left."]


def test_caps_line_length():
    long_run = [(i * 0.2, i * 0.2 + 0.15, f"w{i}") for i in range(70)]
    lines = _lines_from_words(long_run)
    assert len(lines) >= 2
    assert all(len(line.text.split()) <= 32 for line in lines)


def test_empty_input_produces_no_lines():
    assert _lines_from_words([]) == []


# ---------------------------------------------------------------------------
# Amazon Transcribe payload parsing
# ---------------------------------------------------------------------------

def test_parses_audio_segments_when_present():
    payload = {
        "results": {
            "audio_segments": [
                {"start_time": "0.0", "end_time": "4.2", "transcript": "I tripled my price."},
                {"start_time": "4.5", "end_time": "9.1", "transcript": "Nobody left."},
                {"start_time": "9.5", "end_time": "9.6", "transcript": "   "},
            ]
        }
    }
    lines = parse_transcribe_payload(payload)
    assert [line.text for line in lines] == ["I tripled my price.", "Nobody left."]
    assert lines[0].start == 0.0
    assert lines[1].end == 9.1


def test_falls_back_to_word_items():
    payload = {
        "results": {
            "items": [
                {"type": "pronunciation", "start_time": "0.0", "end_time": "0.4",
                 "alternatives": [{"content": "pricing"}]},
                {"type": "pronunciation", "start_time": "0.4", "end_time": "0.9",
                 "alternatives": [{"content": "matters"}]},
                {"type": "punctuation", "alternatives": [{"content": "."}]},
                {"type": "pronunciation", "start_time": "2.5", "end_time": "3.0",
                 "alternatives": [{"content": "next"}]},
            ]
        }
    }
    lines = parse_transcribe_payload(payload)
    assert lines[0].text == "pricing matters."
    assert lines[1].text == "next"


def test_punctuation_attaches_to_the_preceding_word():
    payload = {
        "results": {
            "items": [
                {"type": "punctuation", "alternatives": [{"content": "."}]},  # leading, ignored
                {"type": "pronunciation", "start_time": "0.0", "end_time": "0.4",
                 "alternatives": [{"content": "hello"}]},
            ]
        }
    }
    assert parse_transcribe_payload({"results": {}}) == []
    assert parse_transcribe_payload(payload)[0].text == "hello"


# ---------------------------------------------------------------------------
# Failure messages
# ---------------------------------------------------------------------------

def test_missing_file_is_reported_before_ffmpeg_is_needed(tmp_path: Path):
    with pytest.raises(IngestError, match="No such file"):
        extract_audio(tmp_path / "nope.mp4")


def test_missing_ffmpeg_explains_how_to_install(tmp_path: Path, monkeypatch):
    video = tmp_path / "clip.mp4"
    video.write_bytes(b"not really a video")
    monkeypatch.setattr("agent.ingest.shutil.which", lambda _: None)

    with pytest.raises(IngestError) as exc:
        extract_audio(video)

    message = str(exc.value)
    assert "ffmpeg was not found" in message
    assert "winget install" in message  # actionable, not just a failure


def test_unknown_provider_is_named(monkeypatch, tmp_path: Path):
    import dataclasses

    from agent import ingest

    # Settings is frozen, so swap in a modified copy rather than mutating it.
    monkeypatch.setattr(
        ingest,
        "settings",
        dataclasses.replace(ingest.settings, transcription_provider="banana"),
    )
    with pytest.raises(IngestError, match="Unknown TRANSCRIPTION_PROVIDER"):
        ingest.transcribe(tmp_path / "audio.wav")
