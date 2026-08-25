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
| Model: `global.anthropic.claude-opus-5` | Bedrock ids take a cross-region inference-profile prefix | Switch to `us.`/`eu.` if `global.` is not enabled |
| Unsplash ids centralised in `lib/images.ts` | Every id was resolution- and subject-checked; two 404'd, several were wrong subjects | Add new ids there, verify before use |

## 4. Environment facts (development machine)

- Windows, PowerShell primary; Git Bash available
- Python 3.12.3, venv at `.venv/` → `.venv/Scripts/python.exe`
- Node 22.17.1, npm 10.9.2
- **ffmpeg: NOT installed** → ingest cannot actually run here
- **AWS credentials: NONE** → live agent has never run here
- **Docker: not installed** on the dev machine (user has a VPS with it)
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

**Assumed, never observed:**
- That the agent rejects most candidates when a real model scores them ← **the
  product thesis, still unproven**
- That the orchestrator calls tools in a sensible order in live mode
- That ffmpeg extraction works on a real video
- That Amazon Transcribe returns the payload shape the parser expects
- Cost and latency of a live run

## 6. Expected first-live-run failure mode

Models tend to find merit in everything. "Reject most candidates" fights that
instinct. **Expect the first live run to be too generous.** `scripts/live_smoke.py`
asserts a minimum 20% rejection rate and will flag it.

If that happens, in order:
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
