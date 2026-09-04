"""Runtime configuration, read once from the environment."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")

DATA_DIR = REPO_ROOT / "data"


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    """Everything the agent and API read from the environment."""

    # --- Model -------------------------------------------------------------
    # Which provider backs the Strands agent. Bedrock is the default and the
    # one the AWS story rests on; `anthropic` calls the Anthropic API directly
    # and exists because Bedrock access is gated per account — a new account can
    # sit at a zero token quota for days, and the agent should not be hostage to
    # that. The orchestrator, the tools and the prompts are identical either
    # way; only the model client changes.
    model_provider: str = os.getenv("KREATR_MODEL_PROVIDER", "bedrock").strip().lower()

    # Bedrock ids carry a cross-region inference-profile prefix (global./us./eu.)
    # in front of the base model id. Override per region if `global.` is not
    # available to your account.
    bedrock_model_id: str = os.getenv("BEDROCK_MODEL_ID", "global.anthropic.claude-opus-5")
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")

    # Anthropic API ids carry no prefix — the same model is `claude-opus-5` here
    # and `global.anthropic.claude-opus-5` on Bedrock.
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    anthropic_model_id: str = os.getenv("ANTHROPIC_MODEL_ID", "claude-opus-5")
    # Points the Anthropic client at an Anthropic-compatible gateway instead of
    # api.anthropic.com — a router with its own credit, say. Empty means direct.
    # Such gateways usually expose their own subset of model ids, so set
    # ANTHROPIC_MODEL_ID to one they actually serve.
    anthropic_base_url: str = os.getenv("ANTHROPIC_BASE_URL", "").strip().rstrip("/")
    # Identity-linked keys must name the workspace they act in on every request.
    # Plain workspace-scoped keys carry it implicitly and leave this empty.
    anthropic_workspace_id: str = os.getenv("ANTHROPIC_WORKSPACE_ID", "")

    # The Anthropic client requires an explicit output ceiling; Bedrock does not.
    # 8192 was too tight: generate_asset_plan drafts every surviving moment in
    # one structured call, and a run with eight assets hit the ceiling mid-plan.
    # 16000 keeps a non-streaming call comfortably inside the SDK's HTTP timeout.
    max_output_tokens: int = _int("MAX_OUTPUT_TOKENS", 16000)

    # --- Agent mode --------------------------------------------------------
    # live   — the Strands agent reasons over Bedrock. Requires AWS credentials.
    # replay — no model calls; the same tools run in a fixed order against the
    #          seeded fixture. Lets the UI and API be developed and demoed
    #          offline. Never use replay to claim the agent "ran".
    agent_mode: str = os.getenv("KREATR_AGENT_MODE", "live").strip().lower()

    # --- Judgement thresholds ---------------------------------------------
    moment_score_threshold: int = _int("MOMENT_SCORE_THRESHOLD", 60)
    escalation_confidence_threshold: int = _int("ESCALATION_CONFIDENCE_THRESHOLD", 70)
    max_tool_retries: int = _int("MAX_TOOL_RETRIES", 3)

    # --- Connectors --------------------------------------------------------
    publishing_mode: str = os.getenv("PUBLISHING_MODE", "mock").strip().lower()

    # --- Ingest ------------------------------------------------------------
    # aws_transcribe | whisper_local
    transcription_provider: str = os.getenv("TRANSCRIPTION_PROVIDER", "aws_transcribe").strip().lower()
    whisper_model: str = os.getenv("WHISPER_MODEL", "base")
    s3_bucket: str = os.getenv("S3_BUCKET", "")
    ffmpeg_path: str = os.getenv("FFMPEG_PATH", "ffmpeg")
    ffprobe_path: str = os.getenv("FFPROBE_PATH", "ffprobe")

    # --- API ---------------------------------------------------------------
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = _int("API_PORT", 8000)
    cors_origins: list[str] = field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
            if origin.strip()
        ]
    )

    # --- Paths -------------------------------------------------------------
    data_dir: Path = DATA_DIR
    creators_dir: Path = DATA_DIR / "creators"
    content_dir: Path = DATA_DIR / "content"
    runs_dir: Path = DATA_DIR / "runs"
    uploads_dir: Path = DATA_DIR / "uploads"
    audio_dir: Path = DATA_DIR / "audio"

    @property
    def is_replay(self) -> bool:
        return self.agent_mode == "replay"

    @property
    def model_label(self) -> str:
        """What the run is actually reasoning with, for logs and /api/health."""
        if self.is_replay:
            return "none (replay)"
        if self.model_provider == "anthropic":
            # Name the gateway when one is in front, so a run is never mistaken
            # for a direct Anthropic call.
            via = f" via {self.anthropic_base_url}" if self.anthropic_base_url else ""
            return f"anthropic:{self.anthropic_model_id}{via}"
        return f"bedrock:{self.bedrock_model_id}"


settings = Settings()
