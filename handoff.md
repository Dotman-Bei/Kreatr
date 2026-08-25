# Kreatr — Handoff

> **Where we stopped and what to do next.** Rewrite this file at the end of each
> working session; it describes the present, not history.
>
> **Written:** 25 August 2026 · **Deadline:** 14 September 2026, 5:00 PM PDT (20 days)

---

## 1. Read this first (5 minutes)

| File | What it gives you |
| :--- | :--- |
| `prd.md` | What the product must do, and what is deliberately out of scope |
| `architecture.md` | How it is built, and the decisions you should not casually undo |
| `memory.md` | Traps already hit, conventions, verified vs assumed |
| `project-plan.md` | Phase status and ranked remaining work |
| `build(1).md`, `frontend.md` | Original specs — intent, design system |

Then run it (§3) and click through the workspace. Fifteen minutes total and you will
understand the whole system.

## 2. State in one paragraph

Every functional component is built: the Next.js frontend (landing page + four
workspace screens), a Strands orchestrator with 11 registered tools, a FastAPI
backend, the human-in-the-loop approval gate, verify/retry recovery, creator memory
persistence, the performance learning loop, and Stage A ingest. The full workflow has
been exercised end to end **in replay mode** (no model in the loop) and the frontend
reads live backend data with a fail-soft fallback. What has **never happened** is a
live run against AWS Bedrock, because no AWS credentials have been available on the
development machine. Deployment and the demo video are not started.

## 3. Running it

```bash
# Backend (terminal 1) — replay needs no AWS account
cd <repo>
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
KREATR_AGENT_MODE=replay .venv/Scripts/python -m uvicorn api.main:app --reload --port 8000

# Frontend (terminal 2)
cd apps/web && npm install && npm run dev      # http://localhost:3000

# Create a run so the workspace shows agent output rather than seeded data
curl -X POST http://localhost:8000/api/runs/sync \
  -H "Content-Type: application/json" -d '{"contentId":"vid_100saas"}'

# Tests
.venv/Scripts/python -m pytest tests/ -q       # 14 passing
```

On Windows PowerShell use `$env:KREATR_AGENT_MODE = "replay"` and `curl.exe`.

Ports 8000/3000 are the defaults both sides expect — no env var needed to connect
them. The workspace shows a badge saying whether it is displaying a live run or the
seeded fixture.

## 4. Exactly where we stopped

The last completed work was **Stage A ingest** (commit `8df7c16`): ffmpeg audio
extraction, pluggable transcription, the upload endpoint, a CLI, and 14 tests.

The conversation then turned to **deployment**. The user asked whether to move the
project to a VPS they already have, since Docker is available there. That question
was answered — **yes, a VPS is the right target** — with the reasoning recorded in
`architecture.md` §8: the in-memory run store, `BackgroundTasks`, the SSE stream and
the ffmpeg dependency all assume one long-lived process, which serverless breaks.

**We stopped before writing any deployment files.** No `Dockerfile`, no
`docker-compose.yml`, no reverse-proxy config exists yet.

Two things were about to be asked and are still open:

1. **Does the VPS have a domain, and is anything already serving 80/443?**
   Determines Caddy (auto-HTTPS, simplest) vs an nginx block alongside an existing
   proxy vs IP-only.
2. **What else runs on that box?** Determines whether Kreatr can take standard ports
   or must stay on high ports behind an existing proxy.

Ask the user these before writing deployment config.

## 5. What to do next

### Priority 1 — Get a live agent run working *(blocked on the user)*

This is the only unvalidated assumption in the project. Everything is built around
the premise that the agent rejects most candidates, and **that has never been
observed**. Prompt iteration has an unbounded tail, so it cannot be left to the end.

The blocker is an AWS account with Bedrock model access for Claude. When available:

```bash
export KREATR_AGENT_MODE=live
export AWS_REGION=us-east-1
# + credentials (profile, env keys, or IAM role)

python scripts/live_smoke.py --preflight   # seconds, near-free
python scripts/live_smoke.py               # full run + behavioural verdict
```

`scripts/live_smoke.py` was written for exactly this moment. Preflight checks
credentials, identity and model access, and every failure prints the fix (enabling
model access, the `global.`/`us.`/`eu.` inference-profile prefix mismatch, expired
keys). The full run then asserts the agent behaved like one — found candidates,
rejected a meaningful share, made multiple tool calls, and published nothing without
approval.

**Expect the first run to be too generous.** See `memory.md` §6 for the tuning order.

### Priority 2 — Deployment *(unblocked, can start now)*

Answer the two questions in §4, then produce:
- `Dockerfile` for the API (Python 3.12 + ffmpeg installed)
- `Dockerfile` for the web app, or build it and serve statically
- `docker-compose.yml` wiring both plus a reverse proxy
- Reverse-proxy config with **HTTPS** — if the app is https and the API is http,
  browsers block it as mixed content and the workspace silently falls back to seeded
  data, which looks like a working demo showing fake numbers
- `DEPLOY.md` with exact steps

### Priority 3 — Demo video (≤5 min)

Depends on Priority 1; you want real agent footage. `build(1).md` §16 scripts it beat
by beat. A real run's agent feed is the centrepiece.

### Priority 4 — Architecture diagram, Devpost submission

An hour each. The README has an ASCII diagram; Devpost wants an image.

## 6. Known issues and gaps

| Issue | Impact | Notes |
| :--- | :--- | :--- |
| **Live agent never run** | Critical — the product thesis is unproven | Needs AWS Bedrock access |
| Ingest never run for real | ffmpeg not installed; Transcribe untested | Unit-tested with stubs only |
| Run store is in-memory | Runs vanish on API restart | JSON mirror in `data/runs/` is for inspection, not reload |
| Analytics are seeded | `get_creator_analytics` returns fixture data | Acceptable per `build(1).md` §6 |
| Publishing is a mock connector | No real OAuth | Deliberate scope decision |
| No frontend tests | Verified by screenshot and manual checks | pytest covers ingest only |
| `build(1).md` filename | Download artifact; specs reference it as `build.md` | Cosmetic; `git mv` if desired |

## 7. Repository facts

- **Remote:** https://github.com/Dotman-Bei/Kreatr (public, MIT, main branch)
- **Latest commit:** `8df7c16` — Stage A ingest
- Working tree should be clean; `.venv/`, `node_modules/`, `.next/`, `.env` and
  `data/runs/` are gitignored
- No CI configured

## 8. If you are an AI agent picking this up

- **Do not rewrite working parts.** The frontend, agent and API are verified working
  in replay. Read `memory.md` §2 before touching hydration-sensitive code or tests.
- **The approval gate in `publish_asset` is the one invariant.** Never relocate it,
  never bypass it, never let an approval-class asset publish without a recorded
  decision.
- **Never present replay output as a live agent run.** Not in the UI, not in the
  README, not in a demo.
- **Keep the docs current.** `memory.md` §8 says which file to update when.
- **Ask before deployment choices** — §4 lists the two open questions.
