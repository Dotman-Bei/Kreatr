# Kreatr — Project Plan

> Status and sequencing. See `handoff.md` for the immediate next action.
>
> **Last updated:** 25 August 2026 · **Deadline:** 14 September 2026, 5:00 PM PDT

---

## 1. Status at a glance

| Component | Status | Verified how |
| :--- | :--- | :--- |
| Landing page (11 sections) | ✅ Built | Rendered + screenshotted at 1440/1600/390px |
| Workspace screens (4) | ✅ Built | All routes 200, zero console errors |
| Strands agent + 11 tools | ✅ Built | Constructs with all tools registered |
| FastAPI backend (14 routes) | ✅ Built | Exercised end to end in replay |
| Human-in-the-loop gate | ✅ Built | Held 4 assets; none published without decision |
| Verify / retry / recover | ✅ Built | X thread failed once, retried, verified |
| Creator memory persistence | ✅ Built | Learning written to disk and re-read |
| Performance learning loop | ✅ Built | Closed loop confirmed in replay |
| Web wired to API | ✅ Built | Real backend ids render; fail-soft confirmed |
| Ingest (ffmpeg + STT) | ⚠️ Built, unverified | 14 unit tests; **real ffmpeg/AWS calls never run** |
| **Live agent run** | ❌ **Never executed** | No AWS credentials available |
| Deployment | ⬜ Not started | — |
| Demo video | ⬜ Not started | — |
| Architecture diagram (image) | ⬜ Not started | ASCII version exists in README |

## 2. Phases

### Phase 1 — Foundation ✅
- [x] Git repo, public on GitHub
- [x] MIT LICENSE (detected by GitHub, visible in About)
- [x] README following `build(1).md` §21 section order
- [x] `.env.example`, `.gitignore`, `.gitattributes`

### Phase 2 — Frontend ✅
- [x] Neo-Brutalist landing page, all 11 sections from `frontend.md` §4
- [x] Dashboard, content workspace, action plan, agent feed
- [x] Interactive timeline, rejection cards, approval modal, agent terminal built as
      components (Tailwind + Lucide), not images
- [x] Curated Unsplash imagery, every id resolution- and subject-checked

### Phase 3 — Agent + API ✅
- [x] Strands orchestrator with 11 registered tools
- [x] Structured output (Pydantic) for the three analysis tools
- [x] Lifecycle hooks feeding the activity log
- [x] Approval gate enforced inside `publish_asset`
- [x] Verify + retry with a deliberately flaky mock connector
- [x] Creator memory read/write
- [x] FastAPI: runs, decisions, resume, SSE, upload
- [x] Web wired with fail-soft fallback and a source badge

### Phase 4 — Ingest ⚠️
- [x] ffmpeg audio extraction (16kHz mono WAV)
- [x] Pluggable transcription: `aws_transcribe` (default) / `whisper_local`
- [x] Word grouping into readable lines
- [x] Both Amazon Transcribe payload shapes handled
- [x] `POST /api/content/upload` + `scripts/ingest.py`
- [x] 14 tests covering grouping, parsing, assembly, and the 422 path
- [ ] **Run against a real video file** — needs ffmpeg installed
- [ ] **Run against real Amazon Transcribe** — needs AWS credentials + S3 bucket

### Phase 5 — Live validation ❌ *(the critical path)*
- [ ] AWS account with Bedrock model access for Claude
- [ ] `scripts/live_smoke.py --preflight` passes
- [ ] `scripts/live_smoke.py` full run passes
- [ ] Tune `score_moment` prompt until rejection behaviour is right
- [ ] Capture a real run's log for the demo

### Phase 6 — Ship ⬜
- [ ] Deploy (VPS decided in principle — see `handoff.md` §5)
- [ ] HTTPS + a domain
- [ ] Architecture diagram as an image
- [ ] Demo video ≤ 5 minutes
- [ ] Devpost submission
- [ ] *(Bonus)* builder.aws.com build-journey posts

## 3. Remaining work, ranked

**1. Live agent run** — the only unvalidated assumption in the project. Everything
else is built around the premise that the agent rejects most candidates, and that has
never been observed. Prompt iteration has an unbounded tail; start it first.
*Blocked on: AWS Bedrock access.*

**2. Deployment** — independent of Bedrock, produces the live demo URL Devpost asks
for. Can start immediately. VPS chosen over serverless (`architecture.md` §8).

**3. Demo video** — depends on (1). You want real agent footage, and re-recording
after prompt fixes wastes a day.

**4. Architecture diagram + Devpost submission** — an hour each, do last.

## 4. Time budget

20 days remaining. Suggested shape:

| Window | Focus |
| :--- | :--- |
| Days 1–3 | Bedrock access, first live run, prompt iteration |
| Days 4–6 | Deployment, HTTPS, live URL |
| Days 7–9 | Real ingest on a real video; end-to-end rehearsal |
| Days 10–14 | Demo video, architecture diagram, README polish |
| Days 15–20 | Buffer, Devpost submission, bonus posts |

The buffer is not optional — the first live run is the most likely source of
surprise.

## 5. Guardrails

From `build(1).md` §23: before adding a feature, ask whether it makes Kreatr a better
autonomous worker or is just another feature. If the latter, leave it out.

The strongest version of this project is not the one with the most screens. It is the
one where a judge watches a finished video enter the system and sees a Strands agent
independently turn it into a sensible, explainable, verified content workflow.
