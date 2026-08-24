"""The tool registry handed to the Strands orchestrator."""

from agent.tools.analytics import analyze_performance, get_creator_analytics
from agent.tools.assets import generate_asset_plan
from agent.tools.memory import get_creator_memory, update_creator_memory
from agent.tools.moments import find_content_moments
from agent.tools.publishing import publish_asset, schedule_asset, verify_publish_result
from agent.tools.scoring import score_moment
from agent.tools.transcript import get_transcript

#: Order is the order the orchestrator is expected to need them.
ALL_TOOLS = [
    get_transcript,
    get_creator_memory,
    get_creator_analytics,
    find_content_moments,
    score_moment,
    generate_asset_plan,
    schedule_asset,
    publish_asset,
    verify_publish_result,
    analyze_performance,
    update_creator_memory,
]

__all__ = [
    "ALL_TOOLS",
    "analyze_performance",
    "find_content_moments",
    "generate_asset_plan",
    "get_creator_analytics",
    "get_creator_memory",
    "get_transcript",
    "publish_asset",
    "schedule_asset",
    "score_moment",
    "update_creator_memory",
    "verify_publish_result",
]
