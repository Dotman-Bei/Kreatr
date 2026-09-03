# Kreatr — Working Memory

> Accumulated context that is **not obvious from the code**: decisions and their
> reasons, traps already hit, environment quirks, and conventions to preserve.
> Read this before making changes. It will save you from re-discovering things the
> hard way.

---

## 1. Conventions to preserve

**camelCase across the boundary.** `agent/schemas.py` uses an alias generator so
Pydantic serialises to camelCase, matching `apps/web/lib/mockData.ts`. This removes a
whole mapping layer. If you rename a Pydantic field, rename the TS type in the same
commit — nothing catches this at build time.

**Counts derive from data, never hardcoded per screen.** An early version had "3
approvals" typed into four different components and they drifted. Every count now
comes from `RunMetrics` or a filter over `assets`. Keep it that way.

**Docstrings are prompts.** A Strands `@tool` docstring is what the model reads to
decide when to call it. Write them for the model, not for a human skimming the file.

**The source badge is a feature, not decoration.** `SourceBadge` tells the viewer
whether they are seeing a live run or seeded data. FR-25 depends on it. Do not remove
it to "clean up" the UI.

**Comment density matches the surrounding code.** Comments explain *why*, not *what*.

## 2. Traps already hit — do not re-introduce

### React hydration
- **Seeded waveform, not random.** `VideoTimeline` generates bar heights from a
  deterministic sine-based function. `Math.random()` produced server/client mismatch.
- **Fixed-precision percentages.** Style values use `.toFixed(2)` / `.toFixed(3)`.
  React serialises floats differently server-side (`27.7636%` vs
  `27.76364271892955%`) → hydration error. This was a real bug, already fixed.

### Python
- **`Settings` is a frozen dataclass.** `monkeypatch.setattr(settings, ...)` raises
  `FrozenInstanceError`. Use `dataclasses.replace(settings, field=value)` and patch
  the *module attribute*. Both existing tests do this.
- **Tools must run inside a run context.** `current()` raises if no `ContextVar` is
  set. Always go through `run_workflow` / `resume_after_approval`.

### Tooling on this machine
- **Bash heredocs mangle apostrophes and backslash escapes.** Writing Python or
  TS through `<<'PY'` heredocs has broken twice: once on typographic apostrophes,
  once turning `\\n` into a real newline inside a string literal (syntax error).
  Use the Write/Edit tools for source files, or `py_compile` afterwards.
- **Line endings.** `.gitattributes` normalises to LF. Git will warn about CRLF on
  Windows; that is expected and harmless.

### Bedrock onboarding on a brand-new AWS account
Getting from "account created" to "model responds" took four distinct blockers,
each with a different error, and only the last is about the code. Diagnose by
reading the error string, not by assuming credentials are wrong.

1. **`ProfileNotFound`** — `.env.example` ships `AWS_PROFILE=default`, and
   `live_smoke.py` passes it to boto3. There is no `~/.aws` on this box, so the
   profile line must stay commented out and the key pair used instead.
2. **`no identity-based policy allows bedrock:*`** — creating an IAM user does
   not attach a policy. `AmazonBedrockFullAccess` has to be added explicitly;
   the "attach policies" step during user creation is easy to skip.
3. **`ResourceNotFoundException: Model use case details have not been
   submitted`** — Anthropic models need a one-time form, once per account, from
   the Bedrock **Model catalog** (the old *Model access* page is retired and
   there is no longer a Granted toggle). Took a few minutes to propagate.
4. **`ThrottlingException: Too many tokens per day`** — the quota is applied at
   **0** for every model, so even an 8-token probe fails. This was first read as
   account warm-up that would lift on its own. **It did not.** Polled 3.6 hours,
   then re-checked hours later, then again on 3 Sep: still zero. Service Quotas
   marks these **Not adjustable**, so there is no increase to request either.
   The only remaining lever is an AWS Support case — `handoff.md` §6 has the
   text, including the sentence that stops support from blaming IAM.

Also seen: **`AccessDeniedException: <model> is not available for this
account`** on the newest tier (Opus 5, Sonnet 5, Opus 4.8). Different from the
above and not fixed by the form — that tier is not granted to new accounts.
`BEDROCK_MODEL_ID` is one config line; Sonnet 4.6 or Haiku 4.5 run the
orchestrator and all three analysis tools fine, and Haiku is the cheaper choice
while iterating on the `score_moment` prompt.

### The Anthropic provider and event loops
- **Never cache the Anthropic model across calls.** `build_model()` was
  `@lru_cache`d, which is right for Bedrock and wrong here: the Anthropic client
  is async and its connection pool binds to whichever event loop first uses it.
  Strands runs each tool call in its own loop, so the shared instance was reused
  against a closed one and every `score_moment` after the first died with
  `RuntimeError: Event loop is closed`. The symptom was not an error message —
  it was **36 score_moment calls for 18 candidates**, every one silently retried,
  double the spend, then the run dying on `APIConnectionError`. Bedrock is immune
  because boto3 is synchronous. `_build_anthropic()` is deliberately uncached.
- **`MAX_OUTPUT_TOKENS` is not a formality.** `generate_asset_plan` drafts every
  surviving moment in one structured call; 8192 truncated a run with 8 assets
  and raised `MaxTokensReachedException`. Now 16000.
- **An empty credit balance arrives as a 400, not a 429.** Check the message
  body for "credit balance"; the `RateLimitError` branch never fires for it.

### SSE
- **The server sends no `done` event for an `awaiting_approval` run.** It only
  fires for `completed`/`failed`, and the stream is deliberately held open so
  post-approval entries reach a connected viewer. Anything deriving "is it
  running" from the socket being open will claim a paused agent is working —
  read the run's status instead.
- **The stream replays from entry zero on every connection.** `useRunStream`
  resets its buffer on `open` rather than appending; without that, EventSource's
  automatic reconnect duplicates the whole feed.
- **Close the source on `done`.** EventSource treats the server ending the
  response as a reason to reconnect, so a settled run would replay forever.

### Deployment
- **Do not trust a "nothing else is running" answer — check the box.** The VPS
  was believed to be free; it was in fact serving another project on 80/443 with
  ports 8000–8003 taken. `ss -tlnp` before choosing any port. This is why
  `provision.sh` refuses to start when a port is held, naming the holder.
- **`NEXT_PUBLIC_*` is inlined at build time.** Changing the browser-side API
  base needs a rebuild, not a restart. A restart looks like it did nothing.
- **Server components cannot use a relative fetch URL.** The workspace pages are
  async server components; they need an absolute loopback base
  (`KREATR_API_ORIGIN`), while the browser needs a relative one. One shared
  constant cannot serve both — `lib/api.ts` resolves them separately.
- **SSE dies silently behind a default nginx config.** Without
  `proxy_buffering off` the agent feed arrives in one lump at the end of the
  run. It looks like a hung UI, not a proxy setting.

### Next.js
- **`next build` wipes `.next`, killing a running `next dev`.** If the dev server
  starts 404-ing on chunks after a production build, restart it. Not a code bug.
- **Plain `<img>`, not `next/image`.** Deliberate: avoids optimiser/network coupling
  for remote Unsplash URLs. Keep `loading` and `decoding` attributes.
- **Lazy images inside `display:none` never load.** The mobile `StackedCards`
  duplicate does not fetch at desktop widths. Not a broken image — expected.

## 3. Decisions and why

| Decision | Why | Notes |
| :--- | :--- | :--- |
| One Strands agent | `build(1).md` §5 explicitly warns against cosmetic multi-agent setups | Specialist tools, not specialist agents |
| Nested model calls in analysis tools | Typed, validated output per tool; orchestrator stays a decider | `agent/llm.py:analyse()` |
| Approval gate inside `publish_asset` | A UI gate can be bypassed by calling the tool directly | **Never move this to the UI layer** |
| `a_x_flywheel` fails once, deliberately | Makes retry/verify demonstrable without a real outage | `MockConnector.flaky` |
| `replay` mode exists | Lets the whole stack run with no AWS account | It is a test double. Never call it an agent run |
| AWS Transcribe over Whisper as default | No torch-sized dependency; fits the AWS story | Whisper still available |
| VPS over serverless | In-memory store, BackgroundTasks, SSE, ffmpeg all assume one process | See `architecture.md` §8 |
| systemd + existing nginx, not Docker + Caddy | The VPS already runs a live project on native nginx/certbot and has no Docker; nginx already holds 443 | Reversed the sketch in the old handoff after inspecting the box |
| Web and API behind one hostname | A split origin gets blocked as mixed content, and the fail-soft would show seeded data as if it were a run | `deploy/nginx/kreatr.conf` |
| Model: `global.anthropic.claude-opus-5` | Bedrock ids take a cross-region inference-profile prefix | Switch to `us.`/`eu.` if `global.` is not enabled |
| Unsplash ids centralised in `lib/images.ts` | Every id was resolution- and subject-checked; two 404'd, several were wrong subjects | Add new ids there, verify before use |

## 3b. What AWS is doing in this project

Worth stating plainly, because it caused most of the friction and the scope is
narrower than it looks. AWS is Amazon's cloud platform — rented compute, storage
and managed services. **Kreatr is not hosted on it**; it runs on a Contabo VPS.
Four services are referenced and only one is load-bearing:

| Service | Role | Status |
| :--- | :--- | :--- |
| **Bedrock** | Rents model access — the agent's brain | Configured, default, **never executed** |
| **Transcribe** | Speech to text for ingest | Optional; `whisper_local` is what ran |
| **S3** | Storage, only for the Transcribe path | Unused |
| **IAM** | Issues the access keys | Working |

The hackathon leans AWS because Strands is AWS's SDK, which is why Bedrock stays
the configured default despite never working on this account. Swapping providers
is one env var (`KREATR_MODEL_PROVIDER`) and changes nothing else.

## 4. Environment facts

### The VPS (where the project now lives — Ubuntu 24.04)

The repo was moved onto the VPS; this is the primary environment now.

- `/root/kreatr/Kreatr`, root user. 4 cores, 7.8 GB RAM, 84 GB free
- Python 3.12.3, venv at `.venv/` → `.venv/bin/python`. Node 20.20.2, npm 10.8.2
- **This box is shared.** Another live project (`financehub`,
  `financehub-demo.duckdns.org`) runs on it. Everything Kreatr does must be
  additive, and nginx must be `nginx -t`-checked before every reload — a syntax
  error takes down *both* sites
- **nginx owns 80/443**, with certbot and a working Let's Encrypt cert. This is
  why the plan is an nginx vhost, not Caddy
- **Ports 8000–8003 are taken** by that project's uvicorn workers, plus postgres
  5432 and redis 6379. Kreatr uses **8010** (API) and **3010** (web)
- **Docker: NOT installed** — and deliberately not being installed. See `DEPLOY.md` §1
- **AWS credentials: NONE** → live agent still has never run
- **Anthropic account is out of credit** as of 3 Sep — preflight reports it, and
  it arrives as a 400 rather than a 429. ~$5 restores it
- **`kreatr-web` was found stopped on 3 Sep** (exited cleanly 30 Aug, so
  `Restart=on-failure` did not fire) and the site was 502ing. `systemctl start
  kreatr-web` fixed it. Check `systemctl is-active` before any demo
- Public IP `169.58.153.9`. Kreatr is live on `kreatr-demo.duckdns.org` (DuckDNS,
  same pattern as the other project), TLS via certbot, cert valid to 23 Nov 2026
- **ffmpeg 6.1.1 installed** by `provision.sh`; **espeak-ng** and
  **faster-whisper** added by hand for the ingest verification. faster-whisper
  is not in `requirements.txt` (it is the optional offline STT provider), so a
  fresh box needs `pip install faster-whisper` to use `whisper_local`

### The original dev machine

- Windows, PowerShell primary; Git Bash available. venv at `.venv/Scripts/`
- No ffmpeg, no AWS credentials, no Docker
- `gh` CLI not installed; git push works via Git Credential Manager

Pinned: `strands-agents 1.53.0`, `fastapi 0.141.1`, `pydantic 2.13.4`,
`next 15.5.23`, `react 19.1`, `tailwind 3.4`, `lucide-react 0.474`.

## 5. Verified vs assumed

**Verified by running it:**
- Full replay workflow: 6 candidates → 3 selected, 2 rejected, 1 escalated → 5 assets
- Approval gate held 4 assets; none published without a decision
- Retry/recovery: X thread failed (HTTP 504), retried, verified
- Learning persisted to `data/creators/creator_alex.json` and re-read
- Web reads real backend ids (`m_pricing_psychology`, not the fixture's `m_pricing`)
- Fail-soft: API down → page still 200, badge says "Seeded demo data"
- All 5 routes: zero console errors, zero horizontal overflow at 1440/1600/390px
- Live agent *constructs* with 11 tools; fails cleanly with `NoCredentialsError`
- 14 pytest tests pass
- **On the VPS (25 Aug):** full stack runs on Linux at ports 8010/3010 — 14 tests
  pass, replay run completes, all five routes 200 through a throwaway nginx using
  the real vhost, SSR reads the live run rather than the fixture, SSE streams
  incrementally, approve → resume → publish → verify works over a relative
  browser path, the approval gate holds unapproved assets, upload returns an
  actionable 422 without ffmpeg, and the other project on the box stayed up
- **Live SSE feed (25 Aug):** against the deployed instance, the backlog
  replayed and then approving an asset mid-stream delivered five further
  entries (publish, verify, performance, recommendation) to the already-
  connected client. Seeded fallback still renders its badge, session toggle
  and timed replay
- **THE PRODUCT THESIS (25 Aug).** First live run, `claude-opus-5` via the
  Anthropic provider: 21 candidates → 8 selected, **62% rejected**, 96 tool
  calls, 6 public actions held at the approval gate, 8 assets drafted. The
  rejections name real flaws rather than restating a score — one reads "an intro
  roadmap that promises four topics and delivers none of them; the strong 'empty
  repo' line writes a check the remaining 30 seconds never cashes". **No prompt
  tuning was needed.** §6's prediction that the first run would be too generous
  was wrong — the prompt was already strict enough. Captured at
  `docs/runs/first-live-run.json`
- **Real ingest (25 Aug):** a 77s MP4 (H.264 + AAC at 22050 Hz) went through
  ffmpeg to 16 kHz mono PCM and out of `whisper_local` as 200 words in 12
  lines, timestamps monotonic and within duration. FR-1 and FR-2 are no longer
  assumptions. `aws_transcribe` is still unexercised

**Assumed, never observed:**
- That Amazon Transcribe returns the payload shape the parser expects
- Anything about the Bedrock path end to end — the account never cleared its
  zero token quota, so only the Anthropic provider has actually run

## 6. Rejection tuning — the prediction that did not come true

This section predicted the first live run would be too generous, because models
tend to find merit in everything. **It was wrong.** The first run rejected 62%
against a 20% floor, with no tuning. Kept because the levers still apply if a
future prompt change loosens it.

If a run ever selects too much, in order:
1. Tighten the `score_moment` system prompt (`agent/tools/scoring.py`) — make
   rejection the expected outcome even harder
2. Raise `MOMENT_SCORE_THRESHOLD` above 60
3. Add few-shot examples of good rejections to the prompt

Do not "fix" it by post-filtering scores in code. The agent must exercise the
judgement; a code filter would be theatre.

## 7. Things not to do

- Do not present a replay run as a live agent run
- Do not move the approval gate out of `publish_asset`
- Do not broaden the target persona beyond Alex Rivera
- Do not add features that do not make Kreatr a better autonomous worker
- Do not claim time-saved numbers as user research; they are controlled demo estimates
- Do not commit `.env`, `data/runs/`, `.venv/`, `node_modules/`

## 8. Maintaining these docs

Update when something significant changes:

| Change | Update |
| :--- | :--- |
| New requirement or scope change | `prd.md` |
| New component, decision, or contract change | `architecture.md` |
| Phase completed, status changed | `project-plan.md` |
| Trap hit, decision made, assumption resolved | `memory.md` (this file) |
| End of any working session | `handoff.md` |

`handoff.md` should be rewritten, not appended to — it describes *now*, not history.
