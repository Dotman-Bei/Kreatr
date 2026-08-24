"""Ingest a local video file into Kreatr.

    python scripts/ingest.py path/to/video.mp4
    python scripts/ingest.py video.mp4 --creator creator_alex --title "How I Priced It"

Extracts audio with ffmpeg, transcribes it with the configured provider, and
writes data/content/<id>.json ready for a run.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from agent.config import settings  # noqa: E402
from agent.ingest import IngestError, ingest_video  # noqa: E402

GREEN, RED, DIM, BOLD, RESET = "\033[32m", "\033[31m", "\033[2m", "\033[1m", "\033[0m"


def main() -> int:
    parser = argparse.ArgumentParser(description="Ingest a video into Kreatr")
    parser.add_argument("video", type=Path, help="Path to the video file")
    parser.add_argument("--creator", default="creator_alex", help="Creator id")
    parser.add_argument("--title", default=None, help="Title (defaults to the filename)")
    parser.add_argument("--id", dest="content_id", default=None, help="Content id override")
    args = parser.parse_args()

    print(f"{BOLD}Kreatr - ingest{RESET}")
    print(f"  file      {args.video}")
    print(f"  provider  {settings.transcription_provider}")
    if settings.transcription_provider == "aws_transcribe":
        print(f"  bucket    {settings.s3_bucket or DIM + '(unset)' + RESET}")
    print(f"\n{DIM}  Extracting audio and transcribing. This runs about as long as")
    print(f"  the video itself.{RESET}\n")

    try:
        result = ingest_video(
            args.video,
            creator_id=args.creator,
            title=args.title,
            content_id=args.content_id,
        )
    except IngestError as exc:
        print(f"{RED}Ingest failed:{RESET}\n")
        for line in str(exc).splitlines():
            print(f"  {line}")
        return 1

    content = result.content
    print(f"{GREEN}Done in {result.seconds_elapsed:.1f}s{RESET}")
    print(f"  content id   {content.id}")
    print(f"  title        {content.title}")
    print(f"  duration     {content.duration}")
    print(f"  transcript   {content.transcript_words:,} words in {len(content.transcript)} lines")
    print(f"  saved to     data/content/{content.id}.json")

    print(f"\n{DIM}  First lines:{RESET}")
    for line in content.transcript[:3]:
        print(f"    [{line.start:>6.1f}s] {line.text[:72]}")

    print(f"\n  Start a run:")
    print(f"    curl -X POST http://localhost:8000/api/runs/sync \\")
    print(f'      -H "Content-Type: application/json" \\')
    print(f'      -d \'{{"contentId": "{content.id}"}}\'')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
