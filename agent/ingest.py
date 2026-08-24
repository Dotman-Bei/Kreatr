"""Stage A — turn an uploaded video into a timestamped transcript.

    video file -> ffmpeg -> 16kHz mono wav -> transcription -> Content

Transcription is pluggable. `aws_transcribe` is the default because it needs no
heavy local dependency and the project already carries AWS credentials;
`whisper_local` runs offline if faster-whisper is installed.

Missing prerequisites raise `IngestError` with the install command, rather than
a subprocess traceback.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

from agent.config import settings
from agent.schemas import Content, TranscriptLine
from agent.store import save_content
from agent.utils import slugify, stamp

#: Group word-level results into a line when the gap between words exceeds this.
LINE_BREAK_SECONDS = 0.9
#: ...or when a line reaches this many words, so lines stay readable.
MAX_WORDS_PER_LINE = 32


class IngestError(RuntimeError):
    """Raised with an actionable message when ingest cannot proceed."""


@dataclass
class IngestResult:
    content: Content
    audio_path: Path
    provider: str
    seconds_elapsed: float


# ---------------------------------------------------------------------------
# ffmpeg
# ---------------------------------------------------------------------------

def _require_binary(path: str, name: str) -> str:
    resolved = shutil.which(path)
    if resolved:
        return resolved
    raise IngestError(
        f"{name} was not found (looked for {path!r}).\n"
        f"  Windows:  winget install Gyan.FFmpeg\n"
        f"  macOS:    brew install ffmpeg\n"
        f"  Linux:    sudo apt install ffmpeg\n"
        f"Or set FFMPEG_PATH / FFPROBE_PATH to the binaries."
    )


def probe_duration(video_path: Path) -> float:
    """Duration in seconds, via ffprobe."""
    ffprobe = _require_binary(settings.ffprobe_path, "ffprobe")
    result = subprocess.run(
        [
            ffprobe, "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(video_path),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise IngestError(f"ffprobe failed on {video_path.name}: {result.stderr.strip()[:300]}")
    try:
        return float(result.stdout.strip())
    except ValueError as exc:
        raise IngestError(f"Could not read a duration from {video_path.name}.") from exc


def extract_audio(video_path: Path, out_dir: Path | None = None) -> Path:
    """Extract a 16 kHz mono WAV — what both transcription providers want."""
    if not video_path.exists():
        raise IngestError(f"No such file: {video_path}")

    ffmpeg = _require_binary(settings.ffmpeg_path, "ffmpeg")
    out_dir = out_dir or settings.audio_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    audio_path = out_dir / f"{video_path.stem}.wav"

    result = subprocess.run(
        [
            ffmpeg, "-y", "-i", str(video_path),
            "-vn",                    # drop video
            "-acodec", "pcm_s16le",
            "-ar", "16000",           # 16 kHz
            "-ac", "1",               # mono
            str(audio_path),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0 or not audio_path.exists():
        raise IngestError(
            f"ffmpeg could not extract audio from {video_path.name}:\n"
            f"{result.stderr.strip()[-400:]}"
        )
    return audio_path


# ---------------------------------------------------------------------------
# Transcription providers
# ---------------------------------------------------------------------------

def _lines_from_words(words: list[tuple[float, float, str]]) -> list[TranscriptLine]:
    """Group word-level results into readable, timestamped lines."""
    lines: list[TranscriptLine] = []
    buffer: list[tuple[float, float, str]] = []

    def flush() -> None:
        if not buffer:
            return
        text = " ".join(w[2] for w in buffer).strip()
        text = text.replace(" ,", ",").replace(" .", ".").replace(" ?", "?").replace(" !", "!")
        if text:
            lines.append(TranscriptLine(start=buffer[0][0], end=buffer[-1][1], text=text))
        buffer.clear()

    for word in words:
        if buffer:
            gap = word[0] - buffer[-1][1]
            ends_sentence = buffer[-1][2].endswith((".", "?", "!"))
            if gap > LINE_BREAK_SECONDS or ends_sentence or len(buffer) >= MAX_WORDS_PER_LINE:
                flush()
        buffer.append(word)
    flush()
    return lines


def transcribe_aws(audio_path: Path) -> list[TranscriptLine]:
    """Amazon Transcribe: upload to S3, run a job, poll, parse."""
    import boto3
    from botocore.exceptions import ClientError

    if not settings.s3_bucket:
        raise IngestError("S3_BUCKET is not set — Amazon Transcribe needs a bucket to read from.")

    session = boto3.Session(region_name=settings.aws_region)
    s3 = session.client("s3")
    transcribe = session.client("transcribe")

    key = f"kreatr/audio/{audio_path.name}"
    job_name = f"kreatr-{uuid.uuid4().hex[:12]}"

    try:
        s3.upload_file(str(audio_path), settings.s3_bucket, key)
    except ClientError as exc:
        raise IngestError(
            f"Could not upload audio to s3://{settings.s3_bucket}/{key}: {exc}\n"
            "Check the bucket exists in this region and the principal has s3:PutObject."
        ) from exc

    try:
        transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={"MediaFileUri": f"s3://{settings.s3_bucket}/{key}"},
            MediaFormat="wav",
            LanguageCode="en-US",
        )
    except ClientError as exc:
        raise IngestError(f"Could not start the transcription job: {exc}") from exc

    # Poll. Transcribe is asynchronous and typically takes ~1x realtime.
    while True:
        job = transcribe.get_transcription_job(TranscriptionJobName=job_name)
        status = job["TranscriptionJob"]["TranscriptionJobStatus"]
        if status == "COMPLETED":
            break
        if status == "FAILED":
            reason = job["TranscriptionJob"].get("FailureReason", "unknown")
            raise IngestError(f"Transcription job failed: {reason}")
        time.sleep(5)

    import urllib.request

    uri = job["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
    with urllib.request.urlopen(uri) as response:
        payload = json.load(response)

    return parse_transcribe_payload(payload)


def parse_transcribe_payload(payload: dict) -> list[TranscriptLine]:
    """Turn an Amazon Transcribe result document into timestamped lines.

    Current API versions return sentence-level `audio_segments`; older ones only
    return word-level `items`, so both shapes are handled.
    """
    results = payload.get("results", {})

    segments = results.get("audio_segments")
    if segments:
        return [
            TranscriptLine(
                start=float(seg["start_time"]),
                end=float(seg["end_time"]),
                text=seg["transcript"].strip(),
            )
            for seg in segments
            if seg.get("transcript", "").strip()
        ]

    words: list[tuple[float, float, str]] = []
    for item in results.get("items", []):
        content = item["alternatives"][0]["content"]
        if item["type"] == "punctuation":
            if words:
                words[-1] = (words[-1][0], words[-1][1], words[-1][2] + content)
            continue
        words.append((float(item["start_time"]), float(item["end_time"]), content))
    return _lines_from_words(words)


def transcribe_whisper(audio_path: Path) -> list[TranscriptLine]:
    """faster-whisper, for offline transcription."""
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise IngestError(
            "faster-whisper is not installed.\n"
            "  pip install faster-whisper\n"
            "Or set TRANSCRIPTION_PROVIDER=aws_transcribe."
        ) from exc

    model = WhisperModel(settings.whisper_model, device="auto", compute_type="int8")
    segments, _info = model.transcribe(str(audio_path), vad_filter=True)
    return [
        TranscriptLine(start=segment.start, end=segment.end, text=segment.text.strip())
        for segment in segments
        if segment.text.strip()
    ]


PROVIDERS = {
    "aws_transcribe": transcribe_aws,
    "whisper_local": transcribe_whisper,
}


def transcribe(audio_path: Path) -> list[TranscriptLine]:
    provider = PROVIDERS.get(settings.transcription_provider)
    if provider is None:
        raise IngestError(
            f"Unknown TRANSCRIPTION_PROVIDER {settings.transcription_provider!r}. "
            f"Expected one of: {', '.join(PROVIDERS)}."
        )
    return provider(audio_path)


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def ingest_video(
    video_path: Path,
    creator_id: str,
    title: str | None = None,
    content_id: str | None = None,
) -> IngestResult:
    """Full Stage A: video in, stored `Content` with a transcript out."""
    started = time.time()
    video_path = Path(video_path)
    if not video_path.exists():
        # Report the obvious problem before complaining about missing binaries.
        raise IngestError(f"No such file: {video_path}")

    title = title or video_path.stem.replace("_", " ").replace("-", " ").title()
    content_id = content_id or f"vid_{slugify(video_path.stem, max_length=18)}"

    duration = probe_duration(video_path)
    audio_path = extract_audio(video_path)
    lines = transcribe(audio_path)

    if not lines:
        raise IngestError(
            "Transcription returned nothing. The audio track may be silent or "
            "in an unsupported language."
        )

    content = Content(
        id=content_id,
        creator_id=creator_id,
        title=title,
        filename=video_path.name,
        duration=stamp(duration),
        duration_seconds=int(duration),
        uploaded_at=time.strftime("%d %b %Y at %I:%M %p"),
        transcript_words=sum(len(line.text.split()) for line in lines),
        transcript=lines,
    )
    save_content(content)

    return IngestResult(
        content=content,
        audio_path=audio_path,
        provider=settings.transcription_provider,
        seconds_elapsed=time.time() - started,
    )
