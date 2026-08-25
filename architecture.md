# Kreatr — Architecture

> *How* the system is built. See `prd.md` for *what* it must do.

---

## 1. Shape

Three deployables, one repo:

```text
apps/web  (Next.js 15)      →  HTTP  →  api/ (FastAPI)  →  agent/ (Strands + Bedrock)
                                              ↓
                                         data/ (JSON on disk)
```

```text
                    ┌──────────────────┐
                    │   Kreatr Web UI  │  Next.js 15, App Router
                    └────────┬─────────┘
                             │ fetch, fails soft to seeded data
                    ┌────────▼─────────┐
                    │   FastAPI (api/) │  runs, decisions, SSE feed, upload
                    └────────┬─────────┘
                    ┌────────▼─────────────────┐
                    │  Strands Orchestrator    │  agent/main.py
                    │  1 agent, 11 tools       │
                    └────────┬─────────────────┘
         ┌───────────────────┼────────────────────┐
         ▼                   ▼                    ▼
   Analysis tools      Memory + analytics    Publishing connectors
   (structured out)    (JSON store)          (mock, deliberately flaky)
                             │
                    ┌────────▼─────────┐
                    │   Verification   │  verify_publish_result
                    └────────┬─────────┘
                    ┌────────▼─────────┐
                    │  Approval gate   │  blocks in publish_asset
                    └────────┬─────────┘
                             ▼
                  Execute → Analytics → Learning → next ranking
```

## 2. Directory map

| Path | Responsibility |
| :--- | :--- |
| `agent/main.py` | Orchestrator construction, run bookkeeping, metrics, replay driver |
| `agent/resume.py` | Post-approval execution: publish, retry, verify, then learn |
| `agent/tools/` | The 11 registered Strands tools |
| `agent/schemas.py` | Pydantic models — **the contract with the web app** |
| `agent/events.py` | Activity log + `StrandsActivityHook` (feeds the UI's agent feed) |
| `agent/context.py` | Per-run `RunContext` in a `ContextVar` |
| `agent/store.py` | JSON persistence + in-memory `RunStore` + approval registry |
| `agent/llm.py` | Bedrock model construction + focused structured-output calls |
| `agent/ingest.py` | Stage A: ffmpeg → transcription → `Content` |
| `agent/fixtures.py` | Replay fixtures (offline mode only) |
| `agent/config.py` | All environment configuration, one frozen dataclass |
| `api/main.py` | HTTP surface |
| `apps/web/lib/api.ts` | Backend connector, fails soft |
| `apps/web/lib/mockData.ts` | Seeded fixture; also the shape reference for the API |
| `data/` | creators, content, fixtures, runs (runs are gitignored) |
| `scripts/` | `live_smoke.py` (verify Bedrock), `ingest.py` (CLI ingest) |
| `tests/` | pytest — 14 tests, ingest only so far |

## 3. The agent

One Strands `Agent`, not a fan-out of cosmetic sub-agents:

```python
Agent(
    model=BedrockModel(model_id=..., region_name=...),
    tools=ALL_TOOLS,                    # agent/tools/__init__.py
    system_prompt=system_prompt(),      # agent/prompts/orchestrator.md
    hooks=[StrandsActivityHook(log)],
    callback_handler=None,
)
```

The orchestrator chooses tool order. Nothing is hard-scripted in live mode.

### The 11 tools

| Tool | File | Notes |
| :--- | :--- | :--- |
| `get_transcript` | `tools/transcript.py` | Deterministic |
| `get_creator_memory` | `tools/memory.py` | Deterministic |
| `get_creator_analytics` | `tools/analytics.py` | Seeded metrics |
| `find_content_moments` | `tools/moments.py` | **Model call** → `CandidateList` |
| `score_moment` | `tools/scoring.py` | **Model call** → `MomentScore` |
| `generate_asset_plan` | `tools/assets.py` | **Model call** → `AssetPlan` |
| `schedule_asset` | `tools/publishing.py` | Deterministic, reversible |
| `publish_asset` | `tools/publishing.py` | **Holds the approval gate** |
| `verify_publish_result` | `tools/publishing.py` | Deterministic |
| `analyze_performance` | `tools/analytics.py` | **Model call** ×2 |
| `update_creator_memory` | `tools/memory.py` | Writes to disk |

The three analysis tools make their own focused structured-output calls via
`agent/llm.py:analyse()` rather than asking the orchestrator to emit JSON. This keeps
each tool's contract typed and validated. It is a nested-model-call pattern, not a
multi-agent one.

### How tools reach run state

Strands tools are module-level functions, so the active run travels in a
`ContextVar` (`agent/context.py`), set by `run_workflow` and reset in a `finally`.
Call `current()` inside a tool to reach `RunContext`. Calling a tool outside a run
raises a clear `RuntimeError`.

## 4. Data flow

### A run
```
POST /api/runs(/sync)
  → run_workflow(content_id)
      loads Content + Creator, builds RunContext, sets ContextVar
      live:   Agent(task) — model decides tool order
      replay: _replay_driver() — fixed sequence, no model
      → _finalise(): moments, assets, log, metrics onto the Run
  → RunStore.put()  (memory + data/runs/*.json mirror)
```

### Approval and resume
```
POST /api/runs/{id}/assets/{assetId}/decision   → RunStore.set_decision()
POST /api/runs/{id}/resume
  → resume_after_approval()
      rebuilds RunContext from the stored Run
      for each approved asset: _publish_with_retry() → verify
      then _close_the_loop(): analyze_performance → update_creator_memory
```

The learning written here lands in `data/creators/<id>.json` and is injected into
`score_moment`'s prompt on the **next** run. That is the closed loop.

### The activity feed
`StrandsActivityHook` subscribes to `BeforeToolCallEvent`, `AfterToolCallEvent`,
`AfterModelCallEvent`, `BeforeInvocationEvent`, `AfterInvocationEvent` and appends to
`ActivityLog`. `GET /api/runs/{id}/events` streams it as SSE. This is why the feed
shows real executions rather than narration.

## 5. The contract with the web app

`agent/schemas.py` serialises to **camelCase** via an alias generator, matching the
TypeScript types in `apps/web/lib/mockData.ts` exactly. Responses drop into existing
components with no mapping layer.

Aligned types: `Moment`, `Asset`, `LogEntry`, `RunMetrics`, `Creator`, `Content`,
`Performance`, `NextRecommendation`.

**If you change a Pydantic field name, update the TS type in the same commit.**
Nothing enforces this at build time — it is the most likely place to introduce a
silent break.

### Fail-soft loading
`apps/web/lib/api.ts:loadWorkspace()` returns `{ source: "api" | "seed", ... }`.
Backend down, timed out or CORS-blocked → seeded fixture, and `SourceBadge` says so
on screen. Never remove that badge; FR-25 depends on it.

## 6. Key decisions and why

| Decision | Rationale | Reversible? |
| :--- | :--- | :--- |
| One Strands agent, not many | `build(1).md` §5 warns against fake multi-agent architecture for appearance | Yes |
| Analysis tools make nested model calls | Keeps each tool's output typed and validated; orchestrator stays a decision-maker | Yes |
| `ContextVar` for run state | Strands tools are module-level; threading state through every signature would be worse | Hard |
| camelCase Pydantic aliases | Removes an entire mapping layer between Python and TS | Hard |
| Approval gate inside `publish_asset` | A UI-level gate can be bypassed; a tool-level one cannot | **Do not change** |
| Mock connector fails once on `a_x_flywheel` | Makes retry/verify demonstrable without depending on a real outage | Yes |
| `replay` mode | Lets UI/API be developed with no AWS account | Yes |
| In-memory `RunStore`, JSON mirror | Fastest path; sufficient for a demo | Yes — swap for DynamoDB/Postgres behind the same interface |
| AWS Transcribe as default STT | No heavy local ML dependency; strengthens the AWS story | Yes |
| Deterministic seeded waveform | `Math.random()` would cause a React hydration mismatch | **Do not change** |
| Fixed-precision CSS percentages | Server/client float serialisation differs → hydration error | **Do not change** |

## 7. Run modes

`KREATR_AGENT_MODE`:

- **`live`** (default) — the Strands agent reasons over Bedrock. Needs AWS credentials.
- **`replay`** — no model calls. `_replay_driver()` runs the same tools in a fixed
  order against `data/fixtures/`. For offline UI/API development.

**A replay run is not the agent deciding.** It is a test double. It is labelled in
config, README and UI. Do not present it as an agent run, and do not let the
distinction blur.

## 8. Deployment constraints

The current design assumes **one long-lived process**. Serverless would break four
things:

| Constraint | Location |
| :--- | :--- |
| In-memory run store | `agent/store.py` |
| `BackgroundTasks` for async runs | `api/main.py` |
| SSE stream | `api/main.py` |
| ffmpeg system binary | `agent/ingest.py` |

A VPS or container host is the right target. If serverless becomes a requirement,
the run store must move to Redis/Postgres and ingest must become a queued worker.

**HTTPS matters:** if the web app is served over https and calls the API over http,
browsers block it as mixed content and the workspace silently falls back to seeded
data — which looks like a working demo showing fake numbers.

## 9. Extension points

- **New tool** — add to `agent/tools/`, export in `tools/__init__.py::ALL_TOOLS`.
  Docstrings are the tool description the model reads; write them for the model.
- **New transcription provider** — add to `agent/ingest.py::PROVIDERS`.
- **Real publishing** — replace `MockConnector` in `tools/publishing.py`; keep the
  approval gate above it untouched.
- **Persistent storage** — reimplement `agent/store.py` behind its current functions.
