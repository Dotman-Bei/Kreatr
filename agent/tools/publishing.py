"""Tools 6, 7, 8 — schedule_asset, publish_asset, verify_publish_result.

The human-in-the-loop gate lives here: `publish_asset` refuses to act on an
approval-class asset until a creator decision has been recorded through the API.
The mock connector fails once on a known asset so the verify-and-recover loop is
exercised rather than described.
"""

from __future__ import annotations

import json

from strands import tool

from agent.config import settings
from agent.context import current
from agent.schemas import Asset
from agent.store import runs


def _find_asset(asset_id: str) -> Asset | None:
    ctx = current()
    for asset in ctx.scratch.get("assets", []):
        if asset.id == asset_id:
            return asset
    return None


class MockConnector:
    """Stand-in for the platform APIs.

    Deterministic on purpose: the first publish attempt for an asset whose id is
    listed in `flaky` fails, so retry and verification are demonstrable without
    depending on a real outage.
    """

    flaky = {"a_x_flywheel"}

    def __init__(self) -> None:
        self._attempts: dict[str, int] = {}
        self._published: dict[str, str] = {}

    def publish(self, asset: Asset) -> tuple[bool, str]:
        attempts = self._attempts.get(asset.id, 0) + 1
        self._attempts[asset.id] = attempts
        if asset.id in self.flaky and attempts == 1:
            return False, f"Connector timeout (HTTP 504) on {asset.platform} — attempt 1"
        remote_id = f"{asset.platform[:2].lower()}_{asset.id[-8:]}_{attempts}"
        self._published[asset.id] = remote_id
        return True, remote_id

    def verify(self, asset_id: str) -> tuple[bool, str]:
        remote = self._published.get(asset_id)
        if remote is None:
            return False, "No published record found for this asset."
        return True, remote


connector = MockConnector()


@tool
def schedule_asset(asset_id: str, slot: str) -> str:
    """Reserve a publishing slot for an asset.

    Scheduling is reversible and does not make anything public, so it does not
    require approval.

    Args:
        asset_id: The asset to schedule.
        slot: Human-readable slot, e.g. "Thursday at 4:00 PM".

    Returns:
        JSON confirming the reserved slot.
    """
    ctx = current()
    ctx.tool_invocations += 1
    asset = _find_asset(asset_id)
    if asset is None:
        return json.dumps({"ok": False, "error": f"Unknown asset {asset_id!r}."})

    asset.scheduled_for = slot
    if asset.action_class != "approval":
        asset.status = "scheduled"
    ctx.log.tool("schedule_asset", f"Reserved {slot} for {asset_id}.")
    return json.dumps({"ok": True, "assetId": asset_id, "scheduledFor": slot})


@tool
def publish_asset(asset_id: str) -> str:
    """Publish an asset through its platform connector.

    Approval-class assets are blocked until the creator has approved them. If
    this returns status "awaiting_approval", stop and report that the creator
    must decide — do not retry.

    Args:
        asset_id: The asset to publish.

    Returns:
        JSON with the publish outcome, including a remoteId on success.
    """
    ctx = current()
    ctx.tool_invocations += 1
    asset = _find_asset(asset_id)
    if asset is None:
        return json.dumps({"ok": False, "error": f"Unknown asset {asset_id!r}."})

    # --- the gate -------------------------------------------------------
    if asset.action_class == "approval":
        decision = runs.decision(ctx.run_id, asset_id)
        if decision != "approved":
            asset.status = "pending"
            ctx.log.gatekeeper(
                f"{asset_id} is a public action and needs creator approval.",
                f"type: {asset.type}, confidence: {asset.confidence}%",
            )
            return json.dumps(
                {
                    "ok": False,
                    "status": "awaiting_approval",
                    "assetId": asset_id,
                    "message": "Creator approval required before this can be published.",
                }
            )

    if settings.publishing_mode != "mock":
        return json.dumps(
            {
                "ok": False,
                "status": "unsupported",
                "message": "Live connectors are not configured. Set PUBLISHING_MODE=mock.",
            }
        )

    ok, detail = connector.publish(asset)
    if not ok:
        ctx.recoveries += 1
        asset.status = "failed"
        ctx.log.error("TOOL:publish_asset", detail, "Retry recommended with backoff.")
        return json.dumps(
            {
                "ok": False,
                "status": "failed",
                "assetId": asset_id,
                "error": detail,
                "retryRecommended": True,
                "maxRetries": settings.max_tool_retries,
            }
        )

    asset.status = "published"
    ctx.log.tool("publish_asset", f"Published {asset_id} to {asset.platform}.", f"remote id {detail}")
    return json.dumps({"ok": True, "assetId": asset_id, "remoteId": detail})


@tool
def verify_publish_result(asset_id: str) -> str:
    """Confirm an asset really is live after publishing.

    Always call this after publish_asset — a successful call is not proof of a
    published state.

    Args:
        asset_id: The asset to verify.

    Returns:
        JSON with verified true/false and a retry recommendation on failure.
    """
    ctx = current()
    ctx.tool_invocations += 1
    asset = _find_asset(asset_id)
    if asset is None:
        return json.dumps({"verified": False, "error": f"Unknown asset {asset_id!r}."})

    ok, detail = connector.verify(asset_id)
    if ok:
        asset.status = "published"
        ctx.log.tool("verify_publish_result", f"Verified {asset_id} live.", f"remote id {detail}")
        return json.dumps({"verified": True, "assetId": asset_id, "remoteId": detail})

    ctx.log.error("TOOL:verify_publish_result", f"{asset_id} is not live: {detail}")
    return json.dumps(
        {
            "verified": False,
            "assetId": asset_id,
            "error": detail,
            "retryRecommended": True,
        }
    )
