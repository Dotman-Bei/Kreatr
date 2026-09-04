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
from strands.models.model import Model

from agent.config import settings

T = TypeVar("T", bound=BaseModel)


def _build_anthropic() -> Model:
    """A fresh Anthropic model, deliberately not cached.

    The client underneath is async, and its connection pool binds to whichever
    event loop first uses it. Strands runs each tool call in its own loop, so a
    shared instance is reused against a loop that has since closed and every
    call after the first dies with `RuntimeError: Event loop is closed` — which
    surfaces as a tool failure, gets retried, and doubles the model spend. One
    client per call is the fix; constructing it costs nothing next to the round
    trip it is about to make.
    """
    # Imported lazily so a Bedrock-only deployment needs no anthropic package.
    from strands.models.anthropic import AnthropicModel

    if not settings.anthropic_api_key:
        raise RuntimeError(
            "KREATR_MODEL_PROVIDER is 'anthropic' but ANTHROPIC_API_KEY is empty.\n"
            "Set it in .env, or switch back with KREATR_MODEL_PROVIDER=bedrock."
        )
    client_args: dict[str, object] = {"api_key": settings.anthropic_api_key}
    if settings.anthropic_base_url:
        client_args["base_url"] = settings.anthropic_base_url
    if settings.anthropic_workspace_id:
        # An identity-linked key is not bound to one workspace, so every request
        # has to say which it acts in or the API rejects it as a 400.
        client_args["default_headers"] = {
            "anthropic-workspace-id": settings.anthropic_workspace_id
        }
    return AnthropicModel(
        client_args=client_args,
        model_id=settings.anthropic_model_id,
        # Required by the Anthropic client; Bedrock infers its own ceiling.
        max_tokens=settings.max_output_tokens,
    )


@functools.lru_cache(maxsize=1)
def _build_bedrock() -> Model:
    """Cached: boto3 is synchronous, so one client is safe to share, and
    building it is the expensive part."""
    return BedrockModel(
        model_id=settings.bedrock_model_id,
        region_name=settings.aws_region,
    )


def build_model() -> Model:
    """The model the orchestrator and the analysis calls reason with.

    Bedrock is the default. The Anthropic provider is the escape hatch for when
    Bedrock is unavailable — a new AWS account can sit at a zero token quota
    with no self-service fix — and nothing else in the agent changes with it:
    same orchestrator, same eleven tools, same prompts.
    """
    if settings.model_provider == "anthropic":
        return _build_anthropic()
    if settings.model_provider != "bedrock":
        raise RuntimeError(
            f"Unknown KREATR_MODEL_PROVIDER {settings.model_provider!r}. "
            "Expected 'bedrock' or 'anthropic'."
        )
    return _build_bedrock()


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
