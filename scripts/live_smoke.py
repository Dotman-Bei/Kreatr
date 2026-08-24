"""Live smoke test: prove the Strands agent actually works against Bedrock.

Run this the moment AWS credentials are available. It answers, in order:

  1. Are credentials resolvable at all?
  2. Can this account invoke the configured Bedrock model in this region?
  3. Does one full workflow run end to end?
  4. Did the agent behave like an agent — call tools, reject weak moments,
     stop at the approval gate — or did it just talk?

Every failure prints what to do about it rather than a stack trace.

    python scripts/live_smoke.py                 # preflight + full run
    python scripts/live_smoke.py --preflight     # cheap checks only
    python scripts/live_smoke.py --content vid_100saas
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

# Preflight must run before the model is configured, so import config only.
from agent.config import settings  # noqa: E402

GREEN, RED, YELLOW, DIM, BOLD, RESET = (
    "\033[32m", "\033[31m", "\033[33m", "\033[2m", "\033[1m", "\033[0m"
)

# Expected shape of a healthy run. These are sanity bounds, not exact targets —
# the agent is allowed to disagree with the fixture, just not to be degenerate.
MIN_CANDIDATES = 3
MIN_REJECTION_RATE = 20  # an agent that rejects nothing is not exercising judgement
MIN_TOOL_CALLS = 5


def ok(msg: str) -> None:
    print(f"  {GREEN}PASS{RESET}  {msg}")


def fail(msg: str, fix: str = "") -> None:
    print(f"  {RED}FAIL{RESET}  {msg}")
    if fix:
        for line in fix.strip().splitlines():
            print(f"        {DIM}{line.strip()}{RESET}")


def warn(msg: str) -> None:
    print(f"  {YELLOW}WARN{RESET}  {msg}")


def header(title: str) -> None:
    print(f"\n{BOLD}{title}{RESET}")


# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------

def preflight() -> bool:
    """Cheap checks before spending tokens on a full run."""
    header("Preflight")
    healthy = True

    if settings.is_replay:
        fail(
            "KREATR_AGENT_MODE is 'replay' - no model would be called.",
            "PowerShell:  $env:KREATR_AGENT_MODE = 'live'\n"
            "bash:        export KREATR_AGENT_MODE=live",
        )
        return False
    ok("Agent mode is 'live'.")

    # --- credentials ------------------------------------------------------
    try:
        import boto3
        from botocore.exceptions import NoCredentialsError, ClientError
    except ImportError:
        fail("boto3 is not installed.", "pip install -r requirements.txt")
        return False

    session = boto3.Session(
        region_name=settings.aws_region,
        profile_name=os.getenv("AWS_PROFILE") or None,
    )
    creds = session.get_credentials()
    if creds is None:
        fail(
            "No AWS credentials found.",
            "Set one of:\n"
            "  aws configure                       (writes ~/.aws/credentials)\n"
            "  $env:AWS_PROFILE = 'your-profile'\n"
            "  $env:AWS_ACCESS_KEY_ID / $env:AWS_SECRET_ACCESS_KEY\n"
            "An IAM role also works when running on AWS.",
        )
        return False
    ok(f"Credentials resolved via {creds.method}.")

    # --- identity ---------------------------------------------------------
    try:
        identity = session.client("sts").get_caller_identity()
        ok(f"Authenticated as {identity['Arn'].split('/')[-1]} (account {identity['Account']}).")
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "Unknown")
        hints = {
            "InvalidClientTokenId": (
                "The access key is not valid for this account. Check for a stale "
                "key, a typo, or a key issued by a different account."
            ),
            "SignatureDoesNotMatch": "The secret key does not match the access key id.",
            "ExpiredToken": (
                "Temporary credentials have expired. Refresh them with "
                "'aws sso login', or re-issue the session token."
            ),
            "AccessDenied": "The principal exists but cannot call sts:GetCallerIdentity.",
        }
        fail(f"Credentials were rejected ({code}).", hints.get(code, str(exc)))
        return False
    except Exception as exc:
        fail(f"STS check failed: {type(exc).__name__}: {exc}")
        return False

    ok(f"Region: {settings.aws_region}")
    ok(f"Model:  {settings.bedrock_model_id}")

    # --- model access -----------------------------------------------------
    try:
        runtime = session.client("bedrock-runtime", region_name=settings.aws_region)
        runtime.converse(
            modelId=settings.bedrock_model_id,
            messages=[{"role": "user", "content": [{"text": "Reply with the word: ready"}]}],
            inferenceConfig={"maxTokens": 16},
        )
        ok("Bedrock model responded to a test call.")
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "Unknown")
        if code in ("AccessDeniedException", "AccessDenied"):
            fail(
                f"Access denied for {settings.bedrock_model_id}.",
                "Enable model access: Bedrock console -> Model access -> request access\n"
                "for the Anthropic Claude models, then wait for it to show as Granted.\n"
                "Also confirm the IAM principal has bedrock:InvokeModel.",
            )
        elif code == "ValidationException":
            fail(
                f"Bedrock rejected the model id: {exc}",
                "The inference-profile prefix likely does not match your region.\n"
                "Try switching BEDROCK_MODEL_ID between the global. / us. / eu. prefixes,\n"
                "e.g. us.anthropic.claude-opus-5\n"
                "List what is available:  aws bedrock list-inference-profiles --region "
                f"{settings.aws_region}",
            )
        elif code in ("ResourceNotFoundException", "ThrottlingException"):
            fail(f"Bedrock returned {code}: {exc}")
        else:
            fail(f"Bedrock call failed ({code}): {exc}")
        return False
    except NoCredentialsError:
        fail("Credentials resolved but were rejected by Bedrock.")
        return False
    except Exception as exc:
        fail(f"Unexpected error calling Bedrock: {type(exc).__name__}: {exc}")
        return False

    return healthy


# ---------------------------------------------------------------------------
# Full run
# ---------------------------------------------------------------------------

def smoke(content_id: str) -> bool:
    header("Live workflow")
    print(f"  {DIM}Running the full loop against {content_id}. This makes real model")
    print(f"  calls and may take a few minutes.{RESET}\n")

    from agent.main import run_workflow

    started = time.time()
    run = run_workflow(content_id)
    elapsed = time.time() - started

    if run.status == "failed":
        fail(f"Run failed: {run.error}")
        print(f"\n{DIM}  Last log entries:{RESET}")
        for entry in run.log[-6:]:
            print(f"    [{entry.level}] {entry.tag}: {entry.message[:100]}")
        return False

    m = run.metrics
    header("Results")
    print(f"  run id            {run.id}")
    print(f"  status            {run.status}")
    print(f"  wall clock        {elapsed:.1f}s")
    print(f"  candidates found  {m.candidate_moments}")
    print(f"  selected          {m.selected}")
    print(f"  rejected          {m.analysed - m.selected}  ({m.rejection_rate}%)")
    print(f"  assets drafted    {m.actions_planned}")
    print(f"  tool calls        {m.tool_calls}")

    header("Tool sequence")
    tool_entries = [e for e in run.log if e.tag.startswith("TOOL:")]
    if tool_entries:
        for entry in tool_entries:
            print(f"  {DIM}{entry.time}{RESET}  {entry.tag.removeprefix('TOOL:')}")
    else:
        print(f"  {DIM}(none recorded){RESET}")

    header("Agent judgement")
    for moment in run.moments:
        mark = f"{GREEN}keep{RESET}" if moment.status == "selected" else f"{RED}drop{RESET}"
        reason = moment.rejection_reason or (moment.reasons[0] if moment.reasons else "")
        print(f"  {mark}  {moment.score:>3}  {moment.topic[:34]:<34} {DIM}{reason[:56]}{RESET}")

    # --- verdicts ---------------------------------------------------------
    header("Verdict")
    passed = True

    if m.candidate_moments >= MIN_CANDIDATES:
        ok(f"Found {m.candidate_moments} candidates.")
    else:
        fail(
            f"Only {m.candidate_moments} candidates - expected at least {MIN_CANDIDATES}.",
            "find_content_moments may be returning too few. Loosen its system prompt.",
        )
        passed = False

    if m.rejection_rate >= MIN_REJECTION_RATE:
        ok(f"Rejected {m.rejection_rate}% of candidates - the agent is exercising judgement.")
    else:
        fail(
            f"Rejection rate is only {m.rejection_rate}%.",
            "The agent is selecting nearly everything, which defeats the premise.\n"
            "Tighten the score_moment system prompt in agent/tools/scoring.py -\n"
            "make rejection the expected outcome and raise MOMENT_SCORE_THRESHOLD.",
        )
        passed = False

    if m.tool_calls >= MIN_TOOL_CALLS:
        ok(f"Made {m.tool_calls} tool calls - multi-step, not one shot.")
    else:
        fail(
            f"Only {m.tool_calls} tool calls.",
            "The orchestrator may be answering from the prompt instead of using tools.\n"
            "Check agent/prompts/orchestrator.md is being loaded.",
        )
        passed = False

    gated = [a for a in run.assets if a.action_class == "approval"]
    published_without_approval = [a for a in gated if a.status == "published"]
    if published_without_approval:
        fail(
            f"{len(published_without_approval)} public asset(s) published without approval.",
            "The human-in-the-loop gate leaked. Inspect publish_asset in\n"
            "agent/tools/publishing.py - this is the one bug that must never ship.",
        )
        passed = False
    elif gated:
        ok(f"{len(gated)} public actions held at the approval gate.")
    else:
        warn("No approval-class assets were produced - the gate was not exercised.")

    if run.assets:
        ok(f"Drafted {len(run.assets)} assets.")
    else:
        fail("No assets drafted.", "generate_asset_plan produced nothing.")
        passed = False

    return passed


def main() -> int:
    parser = argparse.ArgumentParser(description="Kreatr live smoke test")
    parser.add_argument("--content", default="vid_100saas", help="Content id to run")
    parser.add_argument("--preflight", action="store_true", help="Run only the cheap checks")
    args = parser.parse_args()

    print(f"{BOLD}Kreatr - live smoke test{RESET}")

    if not preflight():
        print(f"\n{RED}Preflight failed. Fix the above before running the agent.{RESET}")
        return 1

    if args.preflight:
        print(f"\n{GREEN}Preflight passed.{RESET} Re-run without --preflight for the full workflow.")
        return 0

    passed = smoke(args.content)
    if passed:
        print(f"\n{GREEN}{BOLD}Live run passed.{RESET} The agent is working against Bedrock.")
        print(f"{DIM}Capture this log - a real run's agent feed is your demo.{RESET}")
        return 0

    print(f"\n{YELLOW}{BOLD}Run completed but behaviour needs tuning.{RESET}")
    print(f"{DIM}The plumbing works; the prompts need iteration. See the failures above.{RESET}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
