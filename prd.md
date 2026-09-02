# Kreatr — Product Requirements

> Read this first. It defines *what* the product must do. `architecture.md` covers
> *how*, `project-plan.md` tracks *status*, `handoff.md` says *what to do next*.

---

## 1. One-liner

Kreatr is an autonomous post-production agent for video creators. It takes one
finished long-form video, decides which moments are worth repurposing, prepares the
downstream content, asks for approval only where a human decision is genuinely
required, executes and verifies the action, then learns from the result.

**Tagline:** Finish creating. Let Kreatr handle what comes next.

## 2. Context

Built for the **Agents for Humans Hackathon**, Professional Agents track (Creators).
Submission deadline **14 September 2026, 5:00 PM PDT**. Judged on five equally
weighted criteria: Technological Implementation, Design, Potential Impact,
Creativity & Originality, Presentation.

The original specs live in [`build(1).md`](build(1).md) (product + hackathon strategy)
and [`frontend.md`](frontend.md) (design system + component specs). They are the
source of truth for intent; this file is the condensed, current version.

## 3. The problem

Long-form creators finish recording and then face a second, repetitive workflow:

- scrub a 45-minute recording for 30-second moments
- guess which hooks will land
- reformat captions for YouTube Shorts, X, LinkedIn
- schedule across four platforms
- read retention graphs to decide what to make next

Roughly two hours of judgement-heavy work after every upload, most of it *deciding*
rather than creating.

## 4. Target user

One persona, deliberately narrow:

**Alex Rivera** — YouTube creator, 148K subscribers, audience of early-stage
founders. Publishes long-form educational/commentary content and regularly
repurposes it into Shorts and social posts. Tone: direct, educational, practical.
Avoids clickbait and generic motivational language.

Seeded at [`data/creators/creator_alex.json`](data/creators/creator_alex.json).

Do not broaden this. Supporting every creator, platform and format is an explicit
non-goal (§7).

## 5. The core loop

```text
Create → Analyze → Decide → Act → Verify → Learn → Recommend
```

1. **Ingest** — extract audio, transcribe with timestamps
2. **Filter & reject** — score candidates; most are discarded
3. **Draft** — survivors become platform-native assets
4. **Approve** — anything public waits for one creator click
5. **Learn** — published performance rewrites Creator Memory and the next ranking

## 6. Functional requirements

Each is testable. `[✓]` = implemented and verified. `[~]` = implemented, not verified
against a live model. `[ ]` = not built.

### Ingest
- `[✓]` **FR-1** Accept a video file, extract audio via ffmpeg (16kHz mono WAV)
- `[✓]` **FR-2** Produce a timestamped transcript via a pluggable provider
  *(verified with `whisper_local`; `aws_transcribe` is still unexercised)*
- `[✓]` **FR-3** Missing prerequisites must yield actionable guidance, not a traceback

### Understanding
- `[✓]` **FR-4** Load a persistent Creator Memory: audience, tone, formats, avoid
  list, historically strong/weak topics
- `[✓]` **FR-5** Identify candidate moments from the transcript (recall-oriented)

### Judgement — *the product's core claim*
- `[✓]` **FR-6** Score every candidate on five signals: hook strength, standalone
  context, audience relevance, novelty, historical fit
- `[✓]` **FR-7** Return one of three verdicts: `select`, `reject`, `escalate`
- `[✓]` **FR-8** **Reject the majority of candidates.** An agent that selects
  everything has failed the product thesis, not just a metric
- `[✓]` **FR-9** Every rejection carries a specific reason naming the actual flaw
- `[~]` **FR-10** Creator Memory must change decisions — a candidate matching a known
  weak topic is rejected even when well delivered

### Production
- `[✓]` **FR-11** Draft platform-native assets: Shorts, X threads, newsletter angles,
  YouTube metadata. Never one caption reused across platforms
- `[~]` **FR-12** Route by payoff: punchy/visual → Short; framework/structural → text

### Human-in-the-loop
- `[✓]` **FR-13** Classify every action as `auto`, `approval`, or `escalate`
- `[✓]` **FR-14** **Never publish an `approval`-class asset without a recorded
  creator decision.** This is the one invariant that must never break
- `[✓]` **FR-15** `auto` actions (reversible, non-public) run unattended
- `[✓]` **FR-16** Approval UI states what will happen, when, confidence, and why

### Execution & recovery
- `[✓]` **FR-17** Verify after every publish — a successful call is not proof
- `[✓]` **FR-18** Retry recoverable failures with backoff, up to `MAX_TOOL_RETRIES`
- `[✓]` **FR-19** Escalate what cannot be recovered

### Learning
- `[✓]` **FR-20** Compare published performance against the channel baseline
- `[✓]` **FR-21** Write a durable, specific learning back to Creator Memory
- `[✓]` **FR-22** That learning must enter the next run's scoring prompt
- `[✓]` **FR-23** Recommend the next piece of content with evidence

### Visibility
- `[✓]` **FR-24** Show the agent's real execution: tool calls, reasoning, memory
  lookups, failures, retries, verification
- `[✓]` **FR-25** Never present replay/seeded output as a live agent run — the UI
  must always say which it is showing

## 7. Out of scope

From `build(1).md` §12, and still binding:

- Full video editing, timeline editors, automated clip rendering
- More than the four demo platforms (YouTube, X, newsletter, YouTube metadata)
- Team management, billing, marketplace, mobile app
- Complex authentication or multi-tenancy
- Real OAuth publishing integrations (mock connector is sufficient)
- Large analytics dashboards

If a proposed feature does not make Kreatr a better autonomous worker, leave it out.

## 8. Success criteria

**MVP-complete** when this flow works end to end with a live model:

```text
Upload → transcript → candidates → rejections with reasons → selections →
platform assets → approval request → creator approves → publish → verify →
performance → learning → next recommendation
```

**Hackathon requirements:**
- Public repo, MIT licence visible in the About section ✓
- Complete README with architecture diagram
- Demo video ≤ 5 minutes covering problem, target user, why it matters
- Strands Agents SDK used in the actual core workflow, obvious in the source ✓
- Live demo URL if available

**Differentiator to protect:** Kreatr does not maximise assets generated. It decides
what is worth making. Rejection is the feature.

## 9. Demo narrative

Source: *How I Built a SaaS in 30 Days* (20:14), seeded at
[`data/content/vid_100saas.json`](data/content/vid_100saas.json).

Expected shape of a good run:

| Moment | Verdict | Why |
| :--- | :--- | :--- |
| Pricing psychology (08:42) | select | Claim lands in 7s; top historical topic |
| Cold outreach (05:12) | select | Concrete number in the opening line |
| Distribution flywheel (14:20) | select → X + newsletter | Structural payoff, not visual |
| Origin story recap (03:14) | reject | Back-reference breaks standalone viewing |
| Daily routine (11:02) | reject | Known weak topic; near-zero novelty |
| Sponsor read (18:33) | escalate | Contractual copy; only the creator knows terms |

Then: approve 3 → X thread fails (HTTP 504) → retries → verifies → pricing Short hits
2.3× baseline → learning written → recommends *How I Price My SaaS*.

## 10. Measured claims

Only claim what is instrumented. Current demo-run numbers come from
`RunMetrics` and must be labelled as controlled demo estimates, never user research:
time saved, decisions avoided, rejection rate, actions verified, recoveries.
