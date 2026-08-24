# Kreatr

**Finish creating. Let Kreatr handle what comes next.**

Kreatr is an autonomous post-production agent for creators. It takes one finished
long-form video, decides which moments are actually worth repurposing, prepares the
downstream content package, asks for approval only where a human decision is genuinely
required, executes and verifies the action, then learns from the result.

Built for the **Agents for Humans Hackathon** — Professional Agents track (Creators),
on the **Strands Agents SDK** and **AWS Bedrock**.

---

## Project status

This repository is under active development for the hackathon. Status is stated
honestly per component so nothing here overstates what runs today.

| Component | Status |
| :--- | :--- |
| Web UI — landing page | ✅ Built |
| Web UI — dashboard, workspace, action plan, agent feed | ✅ Built |
| Strands agent + 11 tools | ✅ Built |
| FastAPI backend | ✅ Built |
| Human-in-the-loop approval gate | ✅ Built |
| Verify / retry / recover loop | ✅ Built |
| Creator memory persistence | ✅ Built (JSON store) |
| Performance learning loop | ✅ Built (seeded analytics) |
| Web UI wired to the API | ✅ Built |
| Ingest (ffmpeg + transcription) | ⬜ Not started — transcripts are seeded |
| Deployment | ⬜ Not started |
| Demo video | ⬜ Not started |

The workspace reads from the API when it is running and falls back to a seeded
fixture when it is not — each screen shows a badge saying which one you are looking
at. Sections below marked **Planned** describe intended design, not shipped behaviour.

`KREATR_AGENT_MODE=live` runs the real Strands agent against Bedrock and needs AWS
credentials. `KREATR_AGENT_MODE=replay` runs the same tools with no model in the loop
so the stack works offline — useful for UI work, but a replay run is not the agent
making decisions, and is labelled as such in the UI.

---

## The Problem

Long-form creators finish recording and then face a second, repetitive workflow:
scrubbing a 45-minute recording for 30-second moments, guessing which hooks will land,
reformatting captions for each platform, scheduling across four networks, and reading
retention graphs to decide what to make next.

That is roughly two hours of judgement-heavy, repetitive work after every upload — and
most of it is deciding, not creating.

## The Solution

Kreatr owns the loop from finished video to scheduled, verified, measured output:

```text
Create → Analyze → Decide → Act → Verify → Learn → Recommend
```

The differentiator is **rejection**. Kreatr does not maximise the number of assets it
generates; it decides which assets are worth making at all, and explains why the rest
were discarded.

## How Kreatr Works

1. **Ingest** — extract audio, transcribe with timestamps, segment into topics.
2. **Filter & reject** — score every candidate on hook strength, standalone context,
   audience relevance, novelty and historical fit. Most candidates are discarded.
3. **Draft assets** — survivors become platform-native copy: Shorts, X threads,
   newsletter angles, YouTube metadata.
4. **Approve** — anything public stops and waits for a single creator click.
   Reversible, non-public work runs unattended.
5. **Learn & iterate** — published performance is compared against the channel
   baseline, written back into Creator Memory, and used to rank the next batch.

## Why This Is an Agent

Kreatr is not a prompt wrapper around a transcript. It:

- performs multi-step reasoning rather than a single model call;
- calls typed tools and consumes their structured output;
- **chooses between options and rejects weak ones**, with stated reasons;
- reads and writes persistent creator context;
- verifies the result of every consequential action;
- retries and recovers when a connector fails;
- escalates to a human when confidence is low or the content is sensitive;
- feeds post-publication analytics back into future decisions.

## Architecture

```text
                         ┌──────────────────┐
                         │      Creator     │
                         └────────┬─────────┘
                                  ▼
                         ┌──────────────────┐
                         │   Kreatr Web UI  │  Next.js 15
                         └────────┬─────────┘
                                  ▼
                    ┌────────────────────────┐
                    │   Strands Orchestrator │  main agent
                    └────────────┬───────────┘
             ┌───────────────────┼────────────────────┐
             ▼                   ▼                    ▼
      ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
      │ Content     │     │ Strategy     │     │ Publishing   │
      │ Analysis    │     │ + Memory     │     │ Connectors   │
      └──────┬──────┘     └──────┬───────┘     └──────┬───────┘
             └───────────┬───────┴────────────────────┘
                         ▼
                  ┌──────────────┐
                  │ Verification │
                  └───────┬──────┘
                          ▼
                 ┌─────────────────┐
                 │ Human Approval  │  only when required
                 └────────┬────────┘
                          ▼
                   Action → Analytics → Learning
```

> A rendered architecture diagram will live in `architecture/`. **Planned.**

## Strands Agents Usage

The orchestrator is a single Strands agent in [`agent/main.py`](agent/main.py) with
eleven registered tools — not a fan-out of cosmetic sub-agents.

```python
Agent(
    model=BedrockModel(model_id=..., region_name=...),
    tools=ALL_TOOLS,                    # agent/tools/
    system_prompt=system_prompt(),      # agent/prompts/orchestrator.md
    hooks=[StrandsActivityHook(log)],   # feeds the live agent feed
)
```

Strands drives the actual workflow:

- **Tool calling** — the agent chooses the order; nothing is hard-scripted.
- **Structured output** — the analysis tools use `structured_output_model=` with
  Pydantic schemas, so scoring and asset plans return validated JSON.
- **Lifecycle hooks** — `BeforeToolCallEvent` / `AfterToolCallEvent` /
  `AfterModelCallEvent` are captured in [`agent/events.py`](agent/events.py), which is
  why the workspace's agent feed shows real executions rather than narration.
- **Memory** — `get_creator_memory` / `update_creator_memory` read and write a
  persistent profile that changes later scoring.
- **Verification and recovery** — every publish is followed by
  `verify_publish_result`, and failures retry with backoff.
- **Human-in-the-loop** — `publish_asset` refuses to act on a public asset until a
  decision is recorded, and returns `awaiting_approval` instead.

## Tools

The tools the agent exposes ([`agent/tools/`](agent/tools/)).

| Tool | Purpose |
| :--- | :--- |
| `get_transcript` | Timestamped transcript for a content id |
| `find_content_moments` | Candidate moments with topic, hook and rationale |
| `score_moment` | Hook, context, relevance, novelty, historical fit |
| `generate_asset_plan` | Platform-native copy and metadata as structured JSON |
| `get_creator_analytics` | Historical views, CTR, retention, top topics |
| `schedule_asset` | Reserve a publishing slot |
| `publish_asset` | Execute the publish through a connector |
| `verify_publish_result` | Confirm live state; report failure and retry advice |
| `analyze_performance` | What happened, likely reason, recommended next action |
| `update_creator_memory` | Persist a learned preference or observation |
| `get_creator_memory` | Read the persistent creator profile before judging |

## Human-in-the-Loop

Every action is classified before it runs:

- **Auto** — reversible and non-public. Organising assets, drafting metadata,
  analysing performance. Runs unattended.
- **Approval required** — anything the audience sees. Publishing a Short, posting
  publicly, sending a newsletter, changing a live title. Waits for one click.
- **Escalate** — low confidence, sponsor or brand content, missing context, or a
  failed publish. Surfaced with the specific reason it could not be decided.

The approval UI states what will happen, when, the agent's confidence, and why the
asset was selected — then offers Approve, Quick Edit or Reject.

## Creator Memory

A small persistent profile per creator: audience, tone, preferred formats, things to
avoid, and historical strong and weak topics. It is deliberately small — enough to
prove that Kreatr adapts to an individual creator instead of producing generic output.

Memory actively changes decisions: a candidate matching a known weak topic is rejected
even when its hook scores well, and a strong historical topic is promoted in ranking.

## Performance Learning

After the creator approves and the assets publish, `POST /api/runs/{id}/resume`
executes the approved actions, then `analyze_performance` compares the result against
the channel baseline and `update_creator_memory` writes the lesson back:

```text
Wrote to memory: Concrete pricing examples outperform generic startup advice.
```

That line then appears in the `score_moment` prompt on the next run, so the second run
ranks differently from the first. Analytics themselves are seeded for the demo.

## Demo

**Planned.** A demo video of five minutes or less will be linked here, along with a live
demo URL if one is available.

To explore the seeded UI today, run the web app (below) and visit:

| Route | Screen |
| :--- | :--- |
| `/` | Landing page |
| `/dashboard` | Creator overview and next recommendation |
| `/workspace/vid_100saas` | Content inspector, selected vs rejected moments |
| `/workspace/vid_100saas/actions` | Action plan and approval flow |
| `/workspace/vid_100saas/agent-feed` | Agent execution stream |

## Local Setup

**Requirements:** Node.js 20+, Python 3.10+. AWS credentials with Bedrock access are
needed for `live` mode only.

```bash
git clone https://github.com/Dotman-Bei/Kreatr.git
cd Kreatr
cp .env.example .env
```

**Backend** (agent + API):

```bash
python -m venv .venv
.venv/Scripts/activate           # Windows
source .venv/bin/activate        # macOS / Linux
pip install -r requirements.txt

uvicorn api.main:app --reload --port 8000
```

**Frontend**:

```bash
cd apps/web
npm install
npm run dev                      # http://localhost:3000
```

Then start a run:

```bash
curl -X POST http://localhost:8000/api/runs/sync   -H "Content-Type: application/json"   -d '{"contentId": "vid_100saas"}'
```

No AWS account? Set `KREATR_AGENT_MODE=replay` and everything above works offline
against the seeded fixture. The web app also runs standalone with no backend at all —
it falls back to seeded data and says so on screen.

See [`apps/web/README.md`](apps/web/README.md) for frontend specifics.

### API

| Method | Route | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Mode, model and connector status |
| `POST` | `/api/runs` | Start a run in the background |
| `POST` | `/api/runs/sync` | Run and return the finished result |
| `GET` | `/api/runs/latest` | The most recent run (what the UI reads) |
| `GET` | `/api/runs/{id}` | One run in full |
| `POST` | `/api/runs/{id}/assets/{assetId}/decision` | Approve or reject an asset |
| `POST` | `/api/runs/{id}/resume` | Execute approvals, verify, then learn |
| `GET` | `/api/runs/{id}/events` | SSE stream of the activity feed |

## Environment Variables

All variables are documented inline in [`.env.example`](.env.example). Summary:

| Group | Variables |
| :--- | :--- |
| AWS / Bedrock | `AWS_REGION`, `AWS_PROFILE`, `BEDROCK_MODEL_ID` |
| Storage | `S3_BUCKET`, `DYNAMODB_TABLE` or `DATABASE_URL` |
| Transcription | `TRANSCRIPTION_PROVIDER`, `WHISPER_MODEL`, `FFMPEG_PATH` |
| API | `API_HOST`, `API_PORT`, `CORS_ORIGINS` |
| Web | `NEXT_PUBLIC_API_URL` |
| Publishing | `PUBLISHING_MODE`, platform credentials |
| Agent tuning | `MOMENT_SCORE_THRESHOLD`, `ESCALATION_CONFIDENCE_THRESHOLD`, `MAX_TOOL_RETRIES` |

Never commit a filled-in `.env`; it is gitignored.

## AWS Deployment

**Planned.** Intended services: Bedrock for model access, S3 for uploaded media,
DynamoDB for state, CloudWatch for agent execution logs.

## AgentCore Deployment

**Planned.** Amazon Bedrock AgentCore is being evaluated for the agent runtime.

## Example Workflow

A 20-minute video, `How I Built a SaaS in 30 Days`, for a creator whose audience is
early-stage founders:

```text
14 candidate moments found
 → 8 rejected on hook score
 → 6 analysed in depth
 → 3 selected  (79% of candidates discarded)

Rejected 03:14–04:02  "Requires 45s of context, weak opening"      score 42
Rejected 11:02–11:48  "Low relevance — known weak topic"           score 51
Escalated 18:33–19:27 "Sponsor segment — creator decision needed"  score 38

Selected 08:42–09:21  Pricing psychology  → YouTube Short + TikTok  94%
Selected 05:12–05:50  Cold outreach       → YouTube Short           88%
Selected 14:20–15:05  Distribution loop   → X thread + Newsletter   84%

4 public actions paused for approval. Metadata applied automatically.
One connector timed out (HTTP 504), retried with backoff, verified live.

48h later: the pricing Short is at 2.3× the channel baseline.
Learned: concrete pricing examples outperform generic startup advice.
Recommended next: "How I Price My SaaS" (confidence 88%).
```

## Limitations

- Transcripts are seeded. Audio extraction (ffmpeg) and speech-to-text are not
  built yet, so the agent reasons over a stored transcript rather than one it
  produced from an uploaded file.
- Analytics are simulated for the demo rather than pulled from a live channel.
- Creator memory and run state are JSON files on disk, not DynamoDB or Postgres.
- Publishing defaults to a mock connector; real OAuth integrations are out of scope
  for the hackathon MVP.
- Kreatr plans clips and copy — it does not render finished video cuts.
- Time-saving figures are controlled demo measurements, not user research.

## Future Work

- Real platform connectors for YouTube and X.
- Automated clip rendering from selected timestamps.
- Multi-creator workspaces.
- Richer memory: per-format and per-audience-segment performance patterns.

## License

[MIT](LICENSE) © 2026 Heisbei
