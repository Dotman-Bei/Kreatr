"""Model access.

`analyse()` runs a focused, single-purpose structured-output call — used by the
analysis tools so each returns validated JSON instead of prose. The orchestrator
in `agent/main.py` uses its own long-lived Agent.

In replay mode no model is contacted and the caller's fallback is returned, so
the API and UI can be developed without AWS credentials.
"""

from __future__ import annotations

import functools
from typing import TypeVar

from pydantic import BaseModel
from strands import Agent
from strands.models import BedrockModel

from agent.config import settings

T = TypeVar("T", bound=BaseModel)


@functools.lru_cache(maxsize=1)
def build_model() -> BedrockModel:
    """The Bedrock model both the orchestrator and analysis calls share."""
    return BedrockModel(
        model_id=settings.bedrock_model_id,
        region_name=settings.aws_region,
    )


def analyse(
    prompt: str,
    schema: type[T],
    *,
    system_prompt: str,
    fallback: T | None = None,
) -> T:
    """Run one structured-output model call and return a validated `schema`.

    `fallback` is returned in replay mode, and is the last resort if the model
    call fails — a tool returning nothing would strand the orchestrator.
    """
    if settings.is_replay:
        if fallback is None:
            raise RuntimeError("Replay mode requires a fallback for every analysis call.")
        return fallback

    agent = Agent(
        model=build_model(),
        system_prompt=system_prompt,
        callback_handler=None,
    )
    result = agent(prompt, structured_output_model=schema)
    output = result.structured_output
    if output is None:
        if fallback is None:
            raise RuntimeError(f"Model returned no structured output for {schema.__name__}.")
        return fallback
    return output
