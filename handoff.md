# Kreatr — Handoff

> **Where we stopped and what to do next.** Rewrite this file at the end of each
> working session; it describes the present, not history.
>
> **Written:** 3 September 2026 · **Deadline:** 14 September 2026, 5:00 PM PDT
> (**11 days**)

---

## 1. Read this first (5 minutes)

| File | What it gives you |
| :--- | :--- |
| `prd.md` | What the product must do, and what is deliberately out of scope |
| `architecture.md` | How it is built, and the decisions you should not casually undo |
| `memory.md` | Traps already hit, conventions, verified vs assumed |
| `project-plan.md` | Phase status and ranked remaining work |
| `DEPLOY.md` | The VPS, the port map, and the runbook |
| `build(1).md`, `frontend.md` | Original specs — intent, design system |

Then open the live site (§3) and click through the workspace. Fifteen minutes
total and you will understand the whole system.

## 2. State in one paragraph

**Kreatr is built, deployed, and the agent has run for real.** It is live at
<https://kreatr-demo.duckdns.org> over HTTPS. Every functional component works:
the Next.js frontend, a Strands orchestrator with 11 registered tools, a FastAPI
backend, the human-in-the-loop approval gate, verify/retry recovery, creator
memory persistence, the performance learning loop, Stage A ingest, and a live SSE
activity feed. On 25 August the agent ran against a real model for the first
time and **the product thesis held**: 21 candidates, 8 selected, **62% rejected**,
96 tool calls, 6 public actions held at the gate, and a specific learning written
back to Creator Memory. No prompt tuning was needed. What remains is the demo
video and the Devpost write-up — plus one honest caveat: that run went through the
**Anthropic API**, not Bedrock, because the AWS account has never been able to
call a model (§6).

## 3. Running it

Live: <https://kreatr-demo.duckdns.org> — but the run store is in memory, so
after any API restart the workspace shows *Seeded demo data* until a run exists:

```bash
curl -X POST https://kreatr-demo.duckdns.org/api/runs/sync \
  -H 'Content-Type: application/json' -d '{"contentId":"vid_100saas"}'
```

Locally, on the VPS at `/root/kreatr/Kreatr` (Ubuntu 24.04):

```bash
# Backend — replay needs no credentials at all.
# NB: 8000 is taken on this box by another project; use 8010.
cd /root/kreatr/Kreatr
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt -r requirements-dev.txt
KREATR_AGENT_MODE=replay API_PORT=8010 \
  .venv/bin/uvicorn api.main:app --reload --port 8010

# Frontend
cd apps/web && npm install && npm run dev      # http://localhost:3000

# Tests
.venv/bin/python -m pytest tests/ -q       # 16 passing
```

**Health check the deployment:**

```bash
systemctl status kreatr-api kreatr-web --no-pager
curl -s https://kreatr-demo.duckdns.org/api/health
```

Both units are `enabled` and now set `Restart=always`, so a crash *or* a clean
exit is recovered within about 10 seconds. Verified by killing each process and
watching systemd bring it back. Still worth a glance at `is-active` before
demoing, but an unattended outage should no longer be possible.

## 4. What AWS is, and why this project touches it

Written down because it caused most of the friction and the question came up.

**AWS (Amazon Web Services)** is Amazon's cloud platform: rented computers,
storage, databases and managed services, billed by usage. Normally you use it to
host applications without owning servers. Kreatr touches four of its services:

| Service | What it does | Kreatr's use |
| :--- | :--- | :--- |
| **Bedrock** | Rents access to AI models, Claude among them | The agent's brain — this is the one that matters |
| **Transcribe** | Speech to text | Optional ingest provider; `whisper_local` is the alternative and is what actually ran |
| **S3** | File storage | Only needed by the Transcribe path |
| **IAM** | Users and permissions | Issues the access keys everything else authenticates with |

Only **Bedrock** is load-bearing. Kreatr is *not* hosted on AWS — it runs on a
Contabo VPS (`DEPLOY.md`). The hackathon leans AWS because Strands is AWS's SDK,
which is why Bedrock is still the configured default even though it has never
worked on this account.

## 5. Exactly where we stopped

Everything below was done and pushed. `git log` is the short version:

```
b2e2451  The agent runs live, and the thesis holds
83d6f8d  Make the model provider configurable
1de4b43  Record the Bedrock onboarding sequence
d7a4269  Add the architecture diagram
5979ef3  Verify Stage A ingest against a real video
```

- **Deployed** to the VPS behind the nginx that already serves another project.
  systemd units, an nginx vhost, `provision.sh`, HTTPS via certbot (cert valid to
  23 Nov 2026, renewal dry-run passes). Full record in `DEPLOY.md`.
- **Live SSE agent feed.** `eventStreamUrl` had been exported but never consumed;
  the terminal replayed a finished log on a timer. It now streams, including the
  entries generated *after* an approval.
- **Stage A ingest verified** against a real 77s MP4 — ffmpeg to 16 kHz mono,
  `whisper_local` to 200 words in 12 lines. FR-1 and FR-2 are no longer
  assumptions.
- **Architecture diagram** — hand-authored SVG in the README, 2560px PNG for
  Devpost.
- **Model provider made configurable** (`KREATR_MODEL_PROVIDER`) because Bedrock
  could not be unblocked. Bedrock is still the default; `anthropic` is what ran.
- **The first live agent run**, captured at `docs/runs/first-live-run.json`.

Two real bugs surfaced only under a live model, both fixed:

- `build_model` was `@lru_cache`d — correct for Bedrock, wrong for Anthropic,
  whose async client binds to the event loop that first uses it. The symptom was
  not an error but 36 `score_moment` calls for 18 candidates, every one silently
  retried at double the spend. `memory.md` §2 has the detail.
- `MAX_OUTPUT_TOKENS` at 8192 truncated `generate_asset_plan`. Now 16000.

## 6. The AWS problem — read before touching credentials

**AWS has set this account's Bedrock inference quota to zero and there is no
self-service way to raise it.** Everything else about the setup is correct and
verified:

| Layer | Status |
| :--- | :--- |
| Credentials | ✅ STS authenticates as `kreatr`, account `430300055673` |
| IAM | ✅ `AmazonBedrockFullAccess`; `ListFoundationModels` returns 121 models |
| Anthropic use-case form | ✅ submitted and propagated |
| **Invoking any model** | ❌ `ThrottlingException: Too many tokens per day` |

Service Quotas shows an **applied value of 0** against AWS defaults in the
billions, marked **Not adjustable** — so the "request increase" path does not
exist. An 8-token probe fails. Polled 3.6 hours, then again hours later: no
change. A second, separate gate also applies to the newest tier (Opus 5,
Sonnet 5, Opus 4.8): `not available for this account`, which the use-case form
does not fix. Sonnet 4.6 or Haiku 4.5 would be fine if the quota ever lifts.

**The only lever is an AWS Support case** — free under *Account and billing*:
<https://support.console.aws.amazon.com/support/home#/case/create>

> Account 430300055673, region us-east-1. All Amazon Bedrock on-demand "tokens
> per day" quotas show an applied value of 0 while AWS defaults are in the
> billions, and Service Quotas marks them Not adjustable so I cannot submit an
> increase request. This is not a permissions issue: the IAM principal has
> AmazonBedrockFullAccess and ListFoundationModels succeeds, returning 121
> models. Anthropic model use case details have been submitted and accepted.
> Only InvokeModel/Converse is blocked, with ThrottlingException "Too many
> tokens per day" on requests as small as 8 tokens. Please activate on-demand
> inference for this account.

The "not a permissions issue" sentence matters — without it support's first reply
will ask you to check IAM, costing a day.

`memory.md` §2 records all four blockers that had to be cleared to get this far,
each with a different error message. Read it before re-diagnosing.

## 7. What to do next

### Priority 1 — Demo video (≤5 min) *(the critical path now)*

This is the last substantial piece of work, and the only reason it is not done is
that live inference costs money the project currently has none of (§8).
`build(1).md` §16 scripts it beat by beat.

The shot worth framing: open the **agent feed** in one tab and the **action plan**
in another, then approve on camera. Publish, verify, performance and the next
recommendation stream into the terminal live, with no reload.

Two rules while filming:

- **Do not restart the API between takes.** The run store is in memory; a restart
  discards every run and the workspace falls back to seeded data.
- **Never film past the source badge saying replay.** If the demo shows replay
  output, say so. FR-25 exists precisely so a fallback cannot be passed off as
  the agent working.

### Priority 2 — Devpost submission

Needs: the video, the repo link, the architecture PNG (already at
`architecture/kreatr-architecture.png`), and the live URL. An hour once the video
exists.

**Describe the AWS integration honestly.** Bedrock is built, configured and the
default — but it has never executed. The run that proves the thesis went through
the Anthropic API. Claiming a Bedrock run would be false, and the distinction is
one a judge can check.

### Priority 3 — *(optional)* Strands `ModelRouter`

The SDK ships `strands.models.routing`, which would let the agent declare Bedrock
and Anthropic as candidates and fail over automatically. A decent robustness
story, and it directly addresses both failure modes hit here. Its own docstring
warns the API is provisional. Only worth it if the video and submission are done.

## 8. Blockers, and what unblocks them

| Blocker | Unblocks by |
| :--- | :--- |
| **Anthropic account out of credit** | ~$5 at <https://console.anthropic.com/settings/billing>. A run costs roughly $0.30–0.60 on `claude-opus-5`. This is the cheapest path to filming. |
| **Bedrock quota at 0** | AWS Support case (§6). Free, and uses the $100 AWS credits already on the account — but the turnaround is AWS's to decide. |

Either one unblocks the demo video. If Bedrock clears first, film on it and the
AWS story is intact at no cost. If a week goes by, spend the $5 — the provider
switch means that decision needs no code change.

## 9. Known issues and gaps

| Issue | Impact | Notes |
| :--- | :--- | :--- |
| **Bedrock never executed** | The AWS story is configured, not demonstrated | §6. Do not overclaim it |
| **Out of Anthropic credit** | Cannot run the agent right now | ~$5 fixes it |
| Amazon Transcribe path unrun | The default STT provider is unverified | Needs credentials + an S3 bucket. `whisper_local` is verified |
| Run store is in-memory | Runs vanish on API restart | `data/runs/*.json` is a mirror for inspection, not reloaded on boot |
| Analytics are seeded | `get_creator_analytics` returns fixture data | Acceptable per `build(1).md` §6 |
| Publishing is a mock connector | No real OAuth | Deliberate scope decision |
| No frontend tests | Verified by screenshot and manual checks | pytest covers ingest and one moments branch |
| `build(1).md` filename | Download artifact; specs reference it as `build.md` | Cosmetic |

## 10. Repository and credentials

- **Remote:** <https://github.com/Dotman-Bei/Kreatr> (public, MIT, `main`)
- **Latest commit:** `b2e2451` — working tree clean, in sync with origin
- **Auth from this box:** a Kreatr-scoped deploy key at `~/.ssh/id_kreatr_ed25519`,
  pinned via `core.sshCommand`, so plain `git push` works
- `.env` is `chmod 600` and gitignored. It holds the live Anthropic key
- **Rotate these** — both were pasted into a chat transcript and are compromised:
  the AWS key `AKIAWIL7BZB4RAVCU44M` (IAM → `kreatr` → Security credentials →
  deactivate) and the current Anthropic key
- nginx config backup: `/root/kreatr-deploy-backup-20260825-124609`

## 11. If you are an AI agent picking this up

- **Do not rewrite working parts.** The frontend, agent and API are verified. Read
  `memory.md` §2 before touching hydration-sensitive code, the Anthropic provider,
  or the SSE feed — each has a trap that costs an hour to rediscover.
- **The approval gate in `publish_asset` is the one invariant.** Never relocate
  it, never bypass it, never let an approval-class asset publish without a
  recorded decision.
- **Never present replay output as a live agent run**, and never present the
  Anthropic run as a Bedrock run. Both distinctions are checkable.
- **This VPS is shared with another live project.** Check `ss -tlnp` before
  claiming a port, and always `nginx -t` before reloading — a bad config takes
  down both sites.
- **Keep the docs current.** `memory.md` §8 says which file to update when.
