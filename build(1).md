# Kreatr — Build Specification
## Agents for Humans Hackathon · Professional Agents for Creators

> **Core idea:** Kreatr is a background AI post-production agent for creators. A creator finishes one long-form piece of content; Kreatr decides what is worth doing next, creates the downstream content package, prepares publishing actions, learns from performance, and only asks the creator for decisions that genuinely require human judgment.

---

## 0. Hackathon positioning

**Track:** Professional Agents — Creators

The official hackathon asks for a new AI agent built with the **Strands Agents SDK** that handles real work end-to-end. For the Professional Agents track, the target is explicitly repetitive, judgment-heavy work for creators and other professionals. The judges score Technological Implementation, Design, Potential Impact, Creativity & Originality, and Presentation. AgentCore deployment and/or a live demo can strengthen Technical Implementation.

Kreatr should therefore be presented as an **agent that owns the post-creation workflow**, not as another content-generation app.

Official deadline: **September 14, 2026 at 5:00 PM PDT.**

---

# 1. Product definition

## 1.1 Product name

**Kreatr**

Tagline:

> **Finish creating. Let Kreatr handle what comes next.**

Alternative pitch line:

> **One finished video. An autonomous content workflow.**

## 1.2 The pain

Creators finish recording, but the work is not finished.

After one long-form video or podcast they still have to:

- find moments worth repurposing;
- decide which moments are actually interesting for their audience;
- choose platforms;
- rewrite content for each platform;
- prepare titles, descriptions, chapters and posts;
- schedule everything;
- inspect performance;
- decide what to change;
- decide what the next piece of content should be.

This creates a second job around every piece of content.

The deeper pain is **decision fatigue + repetitive execution + missed opportunities**.

Kreatr solves:

> **“I created the content. Now I have to manage everything around it.”**

---

# 2. MVP scope

Do NOT attempt to build a full creator operating system for the hackathon.

The MVP owns one sharp workflow:

> **Long-form video → understand → select → repurpose → prepare publishing → learn from analytics → recommend next action.**

The MVP should be excellent at this one loop.

## 2.1 Primary user

Start with one user type:

**YouTube creators who publish long-form educational/commentary content and regularly repurpose it into Shorts and social posts.**

Avoid trying to support every creator, every platform and every format in v1.

## 2.2 Input

The creator supplies:

- a video file OR video URL;
- creator profile/preferences;
- optional audience description.

For the hackathon demo, a local upload flow is enough.

## 2.3 Output

Kreatr produces a **Content Action Plan** containing:

1. strongest moments from the source;
2. ranked short-form candidates;
3. reason each candidate was selected;
4. recommended platform for each;
5. platform-specific copy;
6. YouTube metadata recommendations;
7. publishing schedule;
8. confidence level;
9. approval requests for actions requiring human judgment;
10. post-publication performance analysis;
11. next-content recommendation.

---

# 3. What makes it an agent

Do not build:

> Upload video → prompt LLM → generate 10 captions.

That looks like a normal AI tool.

Build:

> **Observe → reason → plan → use tools → verify → ask approval when needed → execute → observe results → update future decisions.**

The agent should decide:

- which moments matter;
- which assets are worth producing;
- which platform fits each moment;
- whether a proposed action is strong enough to execute;
- when human approval is needed;
- what to learn from the resulting metrics.

The agent must be able to explain its decisions.

Example:

> “I rejected this 42-second segment because it requires too much context and has a weak opening. I selected the pricing segment because it reaches the main point in 7 seconds and resembles topics that previously performed well for this creator.”

That explanation is useful for both the user and the judges.

---

# 4. End-to-end MVP workflow

## Stage A — Ingest

1. Creator uploads video.
2. Extract audio.
3. Transcribe the video.
4. Generate timestamps.
5. Detect chapters/topics.
6. Store transcript and metadata.

Recommended MVP implementation:

- `ffmpeg` for audio extraction;
- a transcription provider or local speech-to-text;
- LLM analysis for segmentation.

The product does not need perfect video editing for the hackathon MVP.

---

## Stage B — Understand the creator

Create a small **Creator Memory** object.

Example:

```json
{
  "creator_name": "Alex",
  "primary_platform": "YouTube",
  "audience": "early-stage founders",
  "tone": ["direct", "educational", "practical"],
  "preferred_formats": ["Shorts", "X posts", "YouTube"],
  "avoid": ["clickbait", "generic motivational language"],
  "historical_patterns": {
    "strong_topics": ["pricing", "distribution", "AI tools"],
    "weak_topics": ["general productivity"]
  }
}
```

Do not overbuild memory.

The MVP only needs enough memory to demonstrate:

> **Kreatr does not make generic recommendations; it adapts to the individual creator.**

---

# 5. Agent architecture

Use Strands Agents as the orchestration layer.

Recommended logical architecture:

```text
                         ┌──────────────────┐
                         │      Creator     │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   Kreatr Web UI  │
                         └────────┬─────────┘
                                  │
                                  ▼
                    ┌────────────────────────┐
                    │   Strands Orchestrator │
                    │       Main Agent       │
                    └────────────┬───────────┘
                                 │
             ┌───────────────────┼────────────────────┐
             ▼                   ▼                    ▼
      ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
      │ Content      │     │ Strategy     │     │ Publishing   │
      │ Analyst      │     │ Agent        │     │ Agent        │
      └──────┬──────┘     └──────┬───────┘     └──────┬───────┘
             │                   │                    │
             ▼                   ▼                    ▼
       Transcript          Creator Memory        Social/Mock APIs
       Topic map           Analytics history      Scheduler
       Candidates          Performance signals
             │                   │
             └───────────┬───────┘
                         ▼
                  ┌──────────────┐
                  │ Verification │
                  │ / Guardrails  │
                  └───────┬──────┘
                          │
                 ┌────────▼────────┐
                 │ Human Approval  │
                 │ when necessary  │
                 └────────┬────────┘
                          │
                          ▼
                   Action / Publish
                          │
                          ▼
                     Analytics
                          │
                          ▼
                    Learn + Iterate
```

## Important

For the hackathon, avoid creating many independent agents just for appearance.

A **main Strands agent with well-defined tools and optionally a small number of specialist agents** is preferable to a fake multi-agent architecture.

The architecture should show genuine agent reasoning and tool use.

---

# 6. Suggested Strands tools

Implement actual tools/functions for the agent.

## Tool 1 — `get_transcript`

Input:

- content ID

Returns:

- timestamped transcript.

## Tool 2 — `find_content_moments`

Input:

- transcript;
- creator profile;
- target format.

Returns:

- candidate moments;
- timestamps;
- topic;
- hook;
- rationale;
- confidence.

## Tool 3 — `score_moment`

Score candidates using:

- hook strength;
- self-contained context;
- audience relevance;
- novelty;
- emotional/information value;
- historical creator performance;
- platform suitability.

Do not make the score look authoritative. Treat it as a recommendation signal.

Example:

```json
{
  "score": 86,
  "reasons": [
    "Gets to the point in 8 seconds",
    "Matches audience interest in pricing",
    "Similar topic previously outperformed channel average"
  ]
}
```

## Tool 4 — `generate_asset_plan`

Creates:

- Short title;
- caption;
- hook;
- CTA;
- X post;
- optional thread outline;
- newsletter angle;
- YouTube metadata suggestions.

The tool should return structured JSON.

## Tool 5 — `get_creator_analytics`

Returns simplified historical metrics:

- views;
- CTR;
- retention;
- engagement;
- average performance;
- top topics.

For an MVP, mock analytics data is acceptable for the demo, as long as the interface and reasoning are clear.

## Tool 6 — `schedule_asset`

For the MVP, start with a **mock publishing connector**.

It should demonstrate:

> Agent chooses action → tool schedules action → UI reflects scheduled state.

Do not spend the entire hackathon fighting platform OAuth.

A real connector can be added later.

## Tool 7 — `publish_asset`

Use the same mock connector or a sandbox/test integration.

The hackathon judges need to see that the agent can actually perform work.

## Tool 8 — `verify_publish_result`

Returns:

- success;
- failed action;
- error;
- retry recommendation.

This demonstrates the **agent verify-and-recover loop**.

## Tool 9 — `analyze_performance`

Input:

- asset ID;
- metrics.

Returns:

- what happened;
- likely reason;
- recommended next action.

## Tool 10 — `update_creator_memory`

Stores learned preferences or observations.

Example:

> “Shorts about concrete pricing examples outperform generic startup advice.”

---

# 7. The core agent loop

The main Strands agent should operate roughly like this:

```text
1. Inspect the creator and source content.
2. Determine the content objective.
3. Analyze the transcript.
4. Generate candidate moments.
5. Rank candidates.
6. Reject weak candidates.
7. Select only the strongest assets.
8. Map each asset to a platform.
9. Generate platform-specific adaptations.
10. Validate outputs against creator preferences.
11. Produce an action plan.
12. Ask creator for approval only where necessary.
13. Execute approved actions with tools.
14. Verify the outcome.
15. Monitor performance.
16. Generate learning.
17. Recommend the next content action.
```

The important word is **reject**.

A good agent should be able to say:

> “Not every moment deserves a Short.”

That demonstrates judgment.

---

# 8. Human-in-the-loop design

Kreatr should NOT blindly publish everything.

Use three action classes.

### Auto

Safe repetitive actions.

Examples:

- organize assets;
- create draft metadata;
- analyze performance;
- create internal recommendations.

### Approval required

Actions that affect the creator publicly.

Examples:

- publish a Short;
- publish a social post;
- change a public title;
- schedule a newsletter.

### Escalate

Uncertain or conflicting situations.

Examples:

- low confidence selection;
- brand/sponsor content;
- potentially controversial content;
- missing context;
- failed publishing action.

UI example:

> **Kreatr wants your approval**
>
> “Publish this 38-second Short to YouTube on Thursday at 4:00 PM?”
>
> Why: “Strong opening + high audience relevance + similar content performed 1.8× above average.”
>
> [Approve] [Edit] [Reject]

This is directly aligned with the hackathon's idea of agents working in the background and surfacing when a real decision is needed.

---

# 9. MVP UI

Keep the UI extremely simple.

## Screen 1 — Dashboard

Show:

- latest content;
- workflow status;
- pending approvals;
- scheduled assets;
- recent performance;
- next recommendation.

Example:

```text
Kreatr

Your content is moving.

━━━━━━━━━━━━━━━━━━━━━━━━━━

Latest:
How I Built a SaaS in 30 Days

✓ Analyzed
✓ 6 moments found
✓ 3 assets selected
✓ 2 drafts ready
⚠ 1 approval needed

━━━━━━━━━━━━━━━━━━━━━━━━━━

Kreatr recommends:

Create a follow-up on pricing.

Reason:
Your pricing segment is outperforming
your channel baseline.

[View Recommendation]
```

---

## Screen 2 — Content workspace

After upload:

```text
VIDEO
20:14

ANALYZING...

✓ Transcript
✓ Topics
✓ Audience fit
✓ Candidate moments
✓ Performance context

6 moments identified
3 recommended
3 rejected
```

Show the agent's reasoning.

---

## Screen 3 — Action Plan

Example:

```text
CONTENT ACTION PLAN

1. YouTube Short
   00:07:42 → 00:08:21
   Confidence: 91%

   Why:
   Strong standalone hook.
   Matches audience interest.
   Similar topic performed well.

2. X Post
   Based on the pricing segment
   Confidence: 84%

3. Newsletter
   Based on the main framework
   Confidence: 79%

[Approve Plan]
```

---

## Screen 4 — Agent Activity

This is important for the demo.

Show:

```text
Kreatr Agent

12:04:13
Reading transcript...

12:04:18
Found 14 potential moments.

12:04:21
Rejected 8 low-value moments.

12:04:26
Comparing remaining moments
with creator history...

12:04:31
Selected 3.

12:04:38
Preparing platform adaptations...

12:04:45
1 action requires approval.
```

This makes the agentic workflow visible to judges.

---

# 10. Recommended tech stack

Keep the implementation straightforward.

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend

- Python
- FastAPI

## Agent

- Strands Agents SDK

## AWS

Prefer AWS for the production architecture.

Potential services:

- Amazon Bedrock for model access;
- Amazon S3 for uploaded media;
- Amazon DynamoDB or PostgreSQL for state;
- Amazon CloudWatch for logs;
- Amazon Bedrock AgentCore for deployment/runtime where practical.

AgentCore is not mandatory, but the official hackathon page says deployment with AgentCore can strengthen the Technical Implementation score.

## Media

- FFmpeg
- transcription service/provider

## Development

```text
kreatr/
├── apps/
│   └── web/
├── agent/
│   ├── main.py
│   ├── tools/
│   │   ├── transcript.py
│   │   ├── moments.py
│   │   ├── scoring.py
│   │   ├── assets.py
│   │   ├── analytics.py
│   │   ├── publishing.py
│   │   └── memory.py
│   ├── prompts/
│   └── schemas/
├── api/
│   └── main.py
├── data/
├── demo/
├── architecture/
├── tests/
├── README.md
├── LICENSE
└── .env.example
```

---

# 11. Data model

Keep it small.

## Creator

```text
id
name
audience
tone
content_preferences
platform_preferences
historical_patterns
```

## Content

```text
id
creator_id
title
source_url
transcript
duration
created_at
```

## CandidateMoment

```text
id
content_id
start_time
end_time
topic
hook
score
reasons
status
```

## Asset

```text
id
content_id
type
platform
text
source_moment_id
status
scheduled_at
confidence
```

## Performance

```text
asset_id
views
engagement
retention
ctr
captured_at
```

---

# 12. What NOT to build

This is crucial for finishing the hackathon.

Do not spend MVP time on:

- full professional video editing;
- an advanced timeline editor;
- support for 10+ social networks;
- creator team management;
- billing;
- marketplace;
- mobile app;
- huge analytics dashboard;
- complex authentication;
- perfect automated clip rendering;
- fully autonomous real-world publishing across every platform.

The MVP should prove the **agentic workflow**, not build an entire startup.

---

# 13. The killer demo scenario

Use a single creator persona.

Example:

**Creator:** Alex  
**Audience:** early-stage founders  
**Content:** “How I got my first 100 SaaS customers”

Upload a 15–20 minute video.

Then demonstrate:

### Step 1

Kreatr analyzes it.

### Step 2

It finds 8 potential moments.

### Step 3

It rejects 5.

Show the judges why.

### Step 4

It selects:

- 2 YouTube Shorts;
- 1 X post;
- 1 newsletter angle.

### Step 5

It checks creator history.

It notices that practical pricing/distribution content performs best.

### Step 6

It changes the ranking based on that information.

### Step 7

It creates the assets.

### Step 8

It asks:

> “Approve these 2 public posts?”

### Step 9

Click approve.

### Step 10

Kreatr calls its publishing tool.

### Step 11

It verifies success.

### Step 12

Switch to simulated/seeded post-publication analytics.

### Step 13

Kreatr detects:

> “Pricing Short is outperforming your average by 2.3×.”

### Step 14

It recommends:

> “Create a follow-up video: ‘How I Price My SaaS.’”

That is the moment that sells the project.

It demonstrates:

**understanding → judgment → action → verification → learning → next action.**

---

# 14. Metrics to show

Do not invent business claims like “saves 80% of creator time” without measurement.

Instead, instrument the MVP.

Track:

### Time saved

Compare:

```text
Manual estimated workflow
vs.
Kreatr workflow
```

Example:

> Manual workflow: 142 min
> Kreatr: 32 min
> Estimated saved: 110 min

Clearly label this as a controlled demo estimate if it is not based on real user research.

### Decision reduction

Show:

> 14 candidate moments
> → 6 analyzed
> → 3 selected
> → 11 manual decisions avoided

### Action completion

Track:

> planned → approved → executed → verified

### Agent confidence

Show confidence for recommendations.

### Recovery rate

If a mock action fails:

> attempted → failure → retry → verified success

This demonstrates real agent engineering.

---

# 15. Judging criteria attack plan

The hackathon judges score five areas equally.

## 15.1 Technological Implementation

Goal:

**Make Strands impossible to miss.**

Show:

- main Strands agent;
- tool calling;
- structured outputs;
- agent memory;
- multi-step reasoning;
- verification;
- human-in-the-loop;
- optional AgentCore deployment;
- working live demo.

Do NOT only mention Strands in the README.

The source code should make its usage obvious.

---

## 15.2 Design

Goal:

**Make the product feel complete, not like an AI experiment.**

Design principles:

- one clear workflow;
- minimal UI;
- visible agent state;
- understandable recommendations;
- obvious approval actions;
- no unnecessary dashboards.

The user should immediately understand:

> “I upload a video, Kreatr handles the post-production workflow.”

---

## 15.3 Potential Impact

Goal:

**Make the problem specific.**

Do not say:

> “Creators waste time.”

Say:

> “Long-form creators finish recording and then face a repetitive second workflow: identifying reusable moments, adapting them for different platforms, publishing them, and interpreting performance.”

Demonstrate the workflow with a concrete creator.

Measure time and decision reduction in your demo.

---

## 15.4 Creativity & Originality

Your strongest differentiator:

> **Kreatr does not maximize the number of generated assets. It decides which assets are actually worth making.**

The agent can reject content.

That is a more interesting use of agentic AI than:

> “Generate 20 social posts.”

Add the feedback loop:

> Content → performance → learning → next recommendation.

That makes the agent progressively useful.

---

## 15.5 Presentation

The first 30 seconds of the demo should communicate:

> “Creators have a second job after they finish creating.”

Then immediately show the agent solving it.

Do not spend the first two minutes explaining architecture.

---

# 16. Five-minute demo structure

## 0:00–0:30 — Problem

Show:

```text
30-minute video finished.

But the work isn't finished.

Find clips.
Write posts.
Prepare metadata.
Schedule.
Analyze.
Decide what to make next.
```

## 0:30–0:50 — Solution

> “Kreatr is an autonomous post-production agent for creators.”

## 0:50–3:30 — Live workflow

Run the complete scenario.

Show:

- ingest;
- analysis;
- rejection;
- selection;
- reasoning;
- asset generation;
- approval;
- tool execution;
- verification;
- analytics;
- next recommendation.

## 3:30–4:20 — Architecture

Show:

```text
UI
 ↓
Strands Agent
 ↓
Tools + Creator Memory
 ↓
Actions
 ↓
Verification
 ↓
Analytics
 ↓
Learning
```

Mention AWS/Bedrock/AgentCore where actually used.

## 4:20–4:50 — Impact

Show measured MVP numbers:

- workflow time;
- manual decisions;
- actions completed;
- performance feedback.

## 4:50–5:00 — Close

> “Kreatr lets creators spend their time creating—not managing everything that happens after.”

---

# 17. Build order

## Phase 1 — Foundation

- [ ] Repository
- [ ] License
- [ ] Next.js UI
- [ ] FastAPI backend
- [ ] Strands setup
- [ ] Environment variables
- [ ] Basic AWS setup

## Phase 2 — Content intelligence

- [ ] Upload video
- [ ] Extract audio
- [ ] Transcribe
- [ ] Timestamp transcript
- [ ] Topic segmentation
- [ ] Candidate moments
- [ ] Moment scoring
- [ ] Rejection reasoning

## Phase 3 — Creator intelligence

- [ ] Creator profile
- [ ] Creator memory
- [ ] Seed historical analytics
- [ ] Performance-aware ranking
- [ ] Recommendation explanations

## Phase 4 — Actions

- [ ] Generate Shorts plan
- [ ] Generate X post
- [ ] Generate newsletter angle
- [ ] Generate YouTube metadata
- [ ] Approval workflow
- [ ] Mock scheduling tool
- [ ] Mock publishing tool
- [ ] Verification tool

## Phase 5 — Learning loop

- [ ] Analytics ingestion
- [ ] Performance comparison
- [ ] Learning generation
- [ ] Update creator memory
- [ ] Next-content recommendation

## Phase 6 — Hackathon polish

- [ ] Agent activity timeline
- [ ] Architecture diagram
- [ ] Error states
- [ ] Loading states
- [ ] Seeded demo content
- [ ] Metrics
- [ ] Public deployment
- [ ] AgentCore deployment where practical
- [ ] README
- [ ] Demo video

---

# 18. Definition of done

Kreatr is MVP-complete when the following exact flow works:

```text
Upload video
      ↓
Transcript created
      ↓
Kreatr identifies candidate moments
      ↓
Kreatr rejects weak moments
      ↓
Kreatr selects best opportunities
      ↓
Kreatr explains why
      ↓
Kreatr creates platform-specific assets
      ↓
Kreatr requests approval
      ↓
Creator approves
      ↓
Kreatr executes publishing action
      ↓
Kreatr verifies action
      ↓
Performance appears
      ↓
Kreatr learns
      ↓
Kreatr recommends next content
```

If this works smoothly, stop adding features.

Polish it.

---

# 19. Hackathon submission edge checklist

## Devpost requirements

- [ ] Submit under **Professional Agents**
- [ ] Clearly state that the target user is a **creator**
- [ ] Public source-code repository
- [ ] All source/assets/setup instructions included
- [ ] MIT or Apache license visible in repository About section
- [ ] README is complete
- [ ] Architecture diagram included
- [ ] Demo video is **5 minutes or less**
- [ ] Video clearly demonstrates the working project
- [ ] Video explicitly covers:
  - [ ] problem
  - [ ] target user
  - [ ] why it matters
- [ ] AWS Builder ID
- [ ] Live demo URL, if available
- [ ] Confirm submission before **September 14, 2026 at 5:00 PM PDT**

## Technical scoring edge

- [ ] Strands Agents SDK is used in the actual core workflow
- [ ] Tool calls are visible in code
- [ ] Agent performs multiple steps rather than one model call
- [ ] Agent can reject/choose between options
- [ ] Agent uses creator context/memory
- [ ] Agent verifies tool results
- [ ] Agent handles failure/retry
- [ ] Human approval exists for consequential public actions
- [ ] Live demo is working
- [ ] AgentCore deployment evaluated/used where practical
- [ ] Logs demonstrate actual execution

## Design scoring edge

- [ ] One clear workflow
- [ ] Creator understands the value immediately
- [ ] Agent activity is visible
- [ ] Recommendations have explanations
- [ ] Approval UI is obvious
- [ ] Error states are polished
- [ ] No unnecessary features
- [ ] Demo environment is clean

## Impact scoring edge

- [ ] Define the creator persona precisely
- [ ] Show a real workflow
- [ ] Measure time saved in the demo
- [ ] Measure decision reduction
- [ ] Explain the cost of the current workflow
- [ ] Avoid unsupported market-size claims
- [ ] Include at least a small amount of real creator feedback/user testing if possible
- [ ] Show before/after workflow

## Creativity scoring edge

- [ ] Agent selects rather than blindly generates
- [ ] Agent can reject low-value content
- [ ] Recommendations depend on creator history
- [ ] Performance feeds future decisions
- [ ] The agent closes the loop from creation to learning
- [ ] Demonstrate a non-obvious decision the agent made

## Presentation scoring edge

- [ ] First 30 seconds explain the pain
- [ ] Demo starts quickly
- [ ] Show agent making decisions
- [ ] Show an actual tool action
- [ ] Show verification
- [ ] Show learning
- [ ] Show the next recommendation
- [ ] Architecture is explained briefly
- [ ] Final message is memorable

---

# 20. Bonus-points strategy

The official rules provide bonus points for publishing public build-journey content on **builder.aws.com** before the submission deadline.

Use the build process itself as content.

Suggested posts:

### Post 1
**Agents for Humans: Why Creators Have a Second Job After Creating**

Cover the problem and why you chose it.

### Post 2
**Agents for Humans: Building Kreatr with Strands Agents**

Explain the agent architecture and tool workflow.

### Post 3
**Agents for Humans: Teaching an Agent to Decide What Content Is Worth Repurposing**

Show moment scoring, rejection and creator memory.

Make sure the posts satisfy the current official bonus rules before submitting them.

---

# 21. Strong README structure

Use this exact order:

```text
# Kreatr

## The Problem
## The Solution
## How Kreatr Works
## Why This Is an Agent
## Architecture
## Strands Agents Usage
## Tools
## Human-in-the-Loop
## Creator Memory
## Performance Learning
## Demo
## Local Setup
## Environment Variables
## AWS Deployment
## AgentCore Deployment
## Example Workflow
## Limitations
## Future Work
## License
```

A strong README should let a judge understand the project in under five minutes.

---

# 22. Final product positioning

### One-liner

> **Kreatr is an autonomous post-production agent that turns a creator's finished long-form content into a data-informed publishing workflow.**

### Problem

> **Creators spend hours after recording deciding what to repurpose, adapting it for each platform, publishing it, and figuring out what worked.**

### Solution

> **Kreatr analyzes finished content, decides which opportunities are worth pursuing, prepares and executes the downstream workflow, learns from performance, and only asks the creator for decisions that genuinely need them.**

### Differentiator

> **Kreatr isn't an AI content generator. It's an agent that decides what work is worth doing, does it, verifies it, and learns what to do next.**

### Demo loop

> **Create → Analyze → Decide → Act → Verify → Learn → Recommend**

---

# 23. Final rule for the build

When deciding whether to add a feature, ask:

> **Does this make Kreatr a better autonomous worker for creators, or is it just another feature?**

If it is just another feature, leave it out.

The strongest version of Kreatr is not the one with the most screens.

It is the one where a judge can watch a finished video enter the system and see a Strands agent independently turn it into a sensible, explainable, verified content workflow.
