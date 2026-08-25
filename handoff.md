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
| `DEPLOY.md` | The VPS, the port map, and how to get it live |
| `build(1).md`, `frontend.md` | Original specs — intent, design system |

Then run it (§3) and click through the workspace. Fifteen minutes total and you will
understand the whole system.

## 2. State in one paragraph

**Kreatr is deployed and publicly live at <https://kreatr-demo.duckdns.org>** over
HTTPS, verified end to end. Every functional component is built and running on the
VPS: the Next.js frontend, a Strands orchestrator with 11 registered tools, a
FastAPI backend, the human-in-the-loop approval gate, verify/retry recovery, creator
memory persistence, the performance learning loop, and Stage A ingest. ffmpeg is now
installed, so real ingest is finally runnable. What has **never happened** is a live
run against AWS Bedrock, because no AWS credentials have ever been available — so
the deployed site runs in **replay mode**, and the UI says so. That is the one
remaining gap, and it is the product thesis.

## 3. Running it

The repo now lives on the VPS at `/root/kreatr/Kreatr` (Ubuntu 24.04).

```bash
# Backend (terminal 1) — replay needs no AWS account.
# NB: 8000 is taken on this box by another project; use 8010.
cd /root/kreatr/Kreatr
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt -r requirements-dev.txt
KREATR_AGENT_MODE=replay API_PORT=8010 \
  .venv/bin/uvicorn api.main:app --reload --port 8010

# Frontend (terminal 2)
cd apps/web && npm install && npm run dev      # http://localhost:3000

# Create a run so the workspace shows agent output rather than seeded data
curl -X POST http://localhost:8010/api/runs/sync \
  -H "Content-Type: application/json" -d '{"contentId":"vid_100saas"}'

# Tests
.venv/bin/python -m pytest tests/ -q       # 14 passing
```

In dev the two run on separate ports and CORS covers it. In production they share
one hostname — see `architecture.md` §8.

## 4. Exactly where we stopped

Deployment is **done**. The previous session ended before writing any deployment
files, with two open questions about the VPS. **Both were answered by inspecting the
box**, and the answers reversed the plan that had been sketched:

- The VPS was assumed free. It is not. **nginx already serves another live project**
  (`financehub-demo.duckdns.org`) on 80/443, and ports 8000–8003 are taken.
- So: **no Docker, no Caddy.** Kreatr installs as a sibling nginx vhost plus two
  systemd services on ports 8010 (API) and 3010 (web), matching how the box already
  works. Reasoning in `DEPLOY.md` §1.

Written and verified this session:

- `deploy/nginx/kreatr.conf`, `deploy/kreatr-api.service`,
  `deploy/kreatr-web.service`, `deploy/provision.sh`, `DEPLOY.md`
- One code change: `apps/web/lib/api.ts` now resolves the API base separately for
  server and browser. The workspace pages are async server components, so they need
  an absolute loopback URL, while the browser needs a relative same-origin path. One
  shared constant could not serve both, and getting this wrong is silent — the
  fail-soft would render seeded data as if it were a run.

Verified end to end through a throwaway nginx on a high port, with the system nginx
untouched and the other project confirmed still serving 200 throughout: all five
routes 200, SSR reading the live run (`m_pricing_psychology`, not the fixture's
`m_pricing`), SSE streaming incrementally rather than buffering, approve → resume →
publish → verify over a relative browser path, the approval gate holding every
unapproved asset, and upload returning an actionable 422 with ffmpeg absent.

Then, with the user's go-ahead and after backing up the nginx config to
`/root/kreatr-deploy-backup-20260825-124609`, it was provisioned for real:
`provision.sh` installed ffmpeg 6.1.1, the venv, both systemd services and the
vhost; `certbot` issued a certificate valid to **23 November 2026**. Re-verified
over public HTTPS — including that certbot's rewrite preserved the SSE block and
its ordering — and `financehub` stayed up throughout. `DEPLOY.md` §6 lists every
check.

Auto-renewal is confirmed: `certbot renew --dry-run` reported *all simulated
renewals succeeded*, and `certbot.timer` is active. (It failed once on the first
attempt with `rateLimited :: Service busy` — that was Let's Encrypt's staging
service, not the config, and it passed on retry.)

## 5. What to do next

### Priority 1 — Get a live agent run working *(blocked on the user)*

Still the only unvalidated assumption in the project. Everything is built around the
premise that the agent rejects most candidates, and **that has never been observed**.
Prompt iteration has an unbounded tail, so it cannot be left to the end.

The blocker is an AWS account with Bedrock model access for Claude. When available:

```bash
cd /root/kreatr/Kreatr
# put credentials in .env, and KREATR_AGENT_MODE=live
.venv/bin/python scripts/live_smoke.py --preflight   # seconds, near-free
.venv/bin/python scripts/live_smoke.py               # full run + behavioural verdict
```

`scripts/live_smoke.py` was written for exactly this moment. Preflight checks
credentials, identity and model access, and every failure prints the fix (enabling
model access, the `global.`/`us.`/`eu.` inference-profile prefix mismatch, expired
keys). The full run then asserts the agent behaved like one — found candidates,
rejected a meaningful share, made multiple tool calls, and published nothing without
approval.

**Expect the first run to be too generous.** See `memory.md` §6 for the tuning order.

Note: a non-AWS VPS has no IAM role, so this box needs an access key pair in `.env`.

### Priority 2 — Go live ✅ *(done)*

Live at <https://kreatr-demo.duckdns.org>. To redeploy after a push:

```bash
git pull
sudo DOMAIN=kreatr-demo.duckdns.org ./deploy/provision.sh
```

Auto-renewal is verified, and real ingest is done: a 77s MP4 went through ffmpeg
and `whisper_local` to a stored `Content`, so FR-1 and FR-2 are verified rather
than assumed. The `aws_transcribe` provider — the default — is still unexercised
and needs credentials plus an S3 bucket.

### Priority 3 — Demo video (≤5 min)

Depends on Priority 1; you want real agent footage. `build(1).md` §16 scripts it beat
by beat. A real run's agent feed is the centrepiece.

The agent feed now streams live over SSE, including the entries generated after
an approval — approving on camera pushes publish, verify, performance and the
recommendation into the terminal with no reload. That is the shot worth framing.

Do not restart the API between takes — the run store is in memory.

### Priority 4 — Devpost submission

The architecture diagram is done: `architecture/kreatr-architecture.svg` is
embedded in the README, and a 2560px PNG sits beside it for Devpost's upload. It
is hand-authored SVG, so edit the source rather than re-exporting from a tool,
and re-render the PNG with:

```bash
rsvg-convert -w 2560 -f png -o architecture/kreatr-architecture.png \
  architecture/kreatr-architecture.svg
```

The write-up is what remains, and it depends on the demo video.

Note for a live demo of ingest: replay mode has no fixture for a newly ingested
video, so a fresh upload yields zero candidates and says so in the feed. Ingest
demos need `KREATR_AGENT_MODE=live`.

## 6. Known issues and gaps

| Issue | Impact | Notes |
| :--- | :--- | :--- |
| **Live agent never run** | Critical — the product thesis is unproven | Needs AWS Bedrock access. The live site runs in replay, labelled as such |
| Amazon Transcribe path unrun | Medium — the default STT provider is unverified | Needs AWS credentials + an S3 bucket. `whisper_local` is verified |
| Run store is in-memory | Runs vanish on API restart | JSON mirror in `data/runs/` is for inspection, not reload |
| Analytics are seeded | `get_creator_analytics` returns fixture data | Acceptable per `build(1).md` §6 |
| Publishing is a mock connector | No real OAuth | Deliberate scope decision |
| No frontend tests | Verified by screenshot and manual checks | pytest covers ingest only |
| `build(1).md` filename | Download artifact; specs reference it as `build.md` | Cosmetic; `git mv` if desired |

## 7. Repository facts

- **Remote:** https://github.com/Dotman-Bei/Kreatr (public, MIT, main branch)
- **Latest commit:** `8df7c16` — Stage A ingest
- **Uncommitted:** the five planning docs were staged but never committed in the
  previous session, plus this session's `deploy/`, `DEPLOY.md`, the `api.ts` change
  and the doc updates. Commit them.
- **Live deployment runs from this working tree** at `/root/kreatr/Kreatr`, so an
  uncommitted change here is already serving the public site.
- `.venv/`, `node_modules/`, `.next/`, `.env` and `data/runs/` are gitignored
- No CI configured

## 8. If you are an AI agent picking this up

- **Do not rewrite working parts.** The frontend, agent and API are verified working
  in replay. Read `memory.md` §2 before touching hydration-sensitive code or tests.
- **The approval gate in `publish_asset` is the one invariant.** Never relocate it,
  never bypass it, never let an approval-class asset publish without a recorded
  decision.
- **Never present replay output as a live agent run.** Not in the UI, not in the
  README, not in a demo.
- **This VPS is shared with another live project.** Check `ss -tlnp` before claiming
  a port, and always `nginx -t` before reloading — a bad config takes down both sites.
- **Keep the docs current.** `memory.md` §8 says which file to update when.
