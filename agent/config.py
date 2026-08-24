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
    # Bedrock ids carry a cross-region inference-profile prefix (global./us./eu.)
    # in front of the base model id. Override per region if `global.` is not
    # available to your account.
    bedrock_model_id: str = os.getenv("BEDROCK_MODEL_ID", "global.anthropic.claude-opus-5")
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")

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

    @property
    def is_replay(self) -> bool:
        return self.agent_mode == "replay"


settings = Settings()
