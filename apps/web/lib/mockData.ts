import { portraits, scenes } from "@/lib/images";

/* ------------------------------------------------------------------ */
/* Creator memory                                                      */
/* ------------------------------------------------------------------ */

export const creator = {
  id: "creator_alex",
  name: "Alex Rivera",
  handle: "@alexbuilds",
  avatar: portraits.alex,
  primaryPlatform: "YouTube",
  audience: "Early-stage founders",
  subscribers: "148K",
  tone: ["direct", "educational", "practical"],
  preferredFormats: ["YouTube Shorts", "X posts", "Newsletter"],
  avoid: ["clickbait", "generic motivational language"],
  historicalPatterns: {
    strongTopics: ["pricing", "distribution", "AI tools"],
    weakTopics: ["general productivity", "morning routines"],
  },
  baseline: {
    avgShortViews: 41200,
    avgCtr: 5.4,
    avgRetention: 62,
  },
} as const;

/* ------------------------------------------------------------------ */
/* Source content                                                      */
/* ------------------------------------------------------------------ */

export const content = {
  id: "vid_100saas",
  title: "How I Built a SaaS in 30 Days",
  filename: "saas-growth-final.mp4",
  duration: "20:14",
  durationSeconds: 1214,
  uploadedAt: "Today at 12:03 PM",
  transcriptWords: 1420,
  poster: scenes.editTimeline,
  thumbnail: scenes.creatorDesk,
  rawSegments: 14,
  shortlisted: 6,
} as const;

/* ------------------------------------------------------------------ */
/* Candidate moments                                                   */
/* ------------------------------------------------------------------ */

export type MomentStatus = "selected" | "rejected";

export type Moment = {
  id: string;
  start: string;
  end: string;
  startSeconds: number;
  endSeconds: number;
  lengthSeconds: number;
  topic: string;
  hook: string;
  status: MomentStatus;
  score: number;
  platforms: string[];
  /** Sub-scores the scoring tool returned, 0-100. */
  signals: { label: string; value: number }[];
  reasons: string[];
  transcript: string;
  /** Only present on rejections. */
  rejectionReason?: string;
  rejectionClass?: "weak-hook" | "low-relevance" | "escalated";
};

export const moments: Moment[] = [
  {
    id: "m_pricing",
    start: "08:42",
    end: "09:21",
    startSeconds: 522,
    endSeconds: 561,
    lengthSeconds: 39,
    topic: "Pricing psychology",
    hook: "I tripled my price and lost exactly zero customers.",
    status: "selected",
    score: 94,
    platforms: ["YouTube Shorts", "TikTok"],
    signals: [
      { label: "Hook strength", value: 96 },
      { label: "Standalone context", value: 91 },
      { label: "Audience relevance", value: 97 },
      { label: "Novelty", value: 84 },
      { label: "Historical fit", value: 95 },
    ],
    reasons: [
      "Reaches the core claim in 7 seconds, no setup required.",
      "Pricing is a top-3 historical topic for this channel.",
      "A similar segment outperformed the channel baseline by 1.8x.",
    ],
    transcript:
      "I tripled my price and lost exactly zero customers. Here is the thing nobody tells you about pricing early: your first ten customers are not buying software, they are buying a fix for a problem that is costing them more than your price tag.",
  },
  {
    id: "m_outreach",
    start: "05:12",
    end: "05:50",
    startSeconds: 312,
    endSeconds: 350,
    lengthSeconds: 38,
    topic: "Cold outreach that converted",
    hook: "My first 40 customers came from a spreadsheet, not ads.",
    status: "selected",
    score: 88,
    platforms: ["YouTube Shorts"],
    signals: [
      { label: "Hook strength", value: 89 },
      { label: "Standalone context", value: 93 },
      { label: "Audience relevance", value: 90 },
      { label: "Novelty", value: 76 },
      { label: "Historical fit", value: 87 },
    ],
    reasons: [
      "Concrete number in the opening line, a strong scroll-stopper.",
      "Maps to distribution, a proven topic in Creator Memory.",
      "Fully self-contained, needs no reference to earlier chapters.",
    ],
    transcript:
      "My first 40 customers came from a spreadsheet, not ads. I opened a blank sheet, listed 200 companies that had publicly complained about the exact problem I solved, and sent 200 emails that each referenced their own words back to them.",
  },
  {
    id: "m_flywheel",
    start: "14:20",
    end: "15:05",
    startSeconds: 860,
    endSeconds: 905,
    lengthSeconds: 45,
    topic: "The distribution flywheel",
    hook: "Distribution is not a channel. It is a compounding loop.",
    status: "selected",
    score: 84,
    platforms: ["X thread", "Newsletter"],
    signals: [
      { label: "Hook strength", value: 78 },
      { label: "Standalone context", value: 86 },
      { label: "Audience relevance", value: 92 },
      { label: "Novelty", value: 81 },
      { label: "Historical fit", value: 83 },
    ],
    reasons: [
      "Framework-shaped content, reads better as text than as video.",
      "Routed to X and Newsletter instead of Shorts: the payoff is structural, not visual.",
      "An audience of founders over-indexes on distribution frameworks.",
    ],
    transcript:
      "Distribution is not a channel, it is a compounding loop. Every customer you land should make the next one cheaper to reach. If it does not, you do not have distribution, you have advertising.",
  },
  {
    id: "m_origin",
    start: "03:14",
    end: "04:02",
    startSeconds: 194,
    endSeconds: 242,
    lengthSeconds: 48,
    topic: "Origin story recap",
    hook: "So going back to what I mentioned earlier about the agency...",
    status: "rejected",
    score: 42,
    platforms: [],
    signals: [
      { label: "Hook strength", value: 31 },
      { label: "Standalone context", value: 22 },
      { label: "Audience relevance", value: 58 },
      { label: "Novelty", value: 40 },
      { label: "Historical fit", value: 49 },
    ],
    reasons: [
      "Opens with a back-reference that breaks standalone viewing.",
      "Needs roughly 45 seconds of prior context before the point lands.",
      "Origin-story clips historically underperform this channel baseline.",
    ],
    rejectionReason: "Requires 45s of context, weak opening.",
    rejectionClass: "weak-hook",
    transcript:
      "So going back to what I mentioned earlier about the agency, that whole period was really where the idea started forming, although at the time I did not think of it as a product at all.",
  },
  {
    id: "m_routine",
    start: "11:02",
    end: "11:48",
    startSeconds: 662,
    endSeconds: 708,
    lengthSeconds: 46,
    topic: "Daily routine tangent",
    hook: "I wake up at 5:30 and I do not check my phone...",
    status: "rejected",
    score: 51,
    platforms: [],
    signals: [
      { label: "Hook strength", value: 61 },
      { label: "Standalone context", value: 74 },
      { label: "Audience relevance", value: 28 },
      { label: "Novelty", value: 19 },
      { label: "Historical fit", value: 24 },
    ],
    reasons: [
      "General productivity is flagged as a weak topic in Creator Memory.",
      "Near-zero novelty, the claim is common across the category.",
      "Conflicts with the stated avoidance of generic motivational language.",
    ],
    rejectionReason: "Low audience relevance, matches a known weak topic.",
    rejectionClass: "low-relevance",
    transcript:
      "I wake up at 5:30 and I do not check my phone for the first hour, which honestly is the thing everybody says, but for me it genuinely did change how the first block of work went.",
  },
  {
    id: "m_sponsor",
    start: "18:33",
    end: "19:27",
    startSeconds: 1113,
    endSeconds: 1167,
    lengthSeconds: 54,
    topic: "Sponsor read",
    hook: "Quick word from today's sponsor before the last part.",
    status: "rejected",
    score: 38,
    platforms: [],
    signals: [
      { label: "Hook strength", value: 44 },
      { label: "Standalone context", value: 66 },
      { label: "Audience relevance", value: 21 },
      { label: "Novelty", value: 12 },
      { label: "Historical fit", value: 18 },
    ],
    reasons: [
      "Contains contractual sponsor copy, repurposing may breach the ad agreement.",
      "Escalated rather than silently discarded: only the creator knows the terms.",
      "No editorial payoff for a short-form audience.",
    ],
    rejectionReason: "Brand-safety escalation, sponsor segment needs a creator decision.",
    rejectionClass: "escalated",
    transcript:
      "Quick word from today's sponsor before we get into the last part. If you have ever tried to set up analytics for a side project you know how long that takes.",
  },
];

export const selectedMoments = moments.filter((m) => m.status === "selected");
export const rejectedMoments = moments.filter((m) => m.status === "rejected");

/* ------------------------------------------------------------------ */
/* Action plan                                                         */
/* ------------------------------------------------------------------ */

export type ActionClass = "auto" | "approval" | "escalate";

export type Asset = {
  id: string;
  type: string;
  platform: string;
  icon: "youtube" | "x" | "mail" | "tag";
  sourceMomentId: string;
  confidence: number;
  actionClass: ActionClass;
  status: "draft" | "pending" | "scheduled" | "published";
  scheduledFor: string;
  title: string;
  body: string;
  /** Rendered as chips under the copy. */
  meta: { label: string; value: string }[];
  rationale: string[];
};

export const assets: Asset[] = [
  {
    id: "a_short_pricing",
    type: "YouTube Short",
    platform: "YouTube",
    icon: "youtube",
    sourceMomentId: "m_pricing",
    confidence: 94,
    actionClass: "approval",
    status: "pending",
    scheduledFor: "Thursday at 4:00 PM",
    title: "I tripled my price. Nobody left.",
    body: "Your first ten customers are not buying software, they are buying a fix for a problem that costs them more than your price tag. Here is the exact script I used to raise prices without a single churn.",
    meta: [
      { label: "Cut", value: "08:42 - 09:21" },
      { label: "Length", value: "39s" },
      { label: "Aspect", value: "9:16" },
      { label: "Captions", value: "Burned-in" },
    ],
    rationale: [
      "Strong standalone hook, the claim lands in 7 seconds.",
      "Matches a top-performing topic in Creator Memory (pricing).",
      "A comparable segment beat the channel baseline by 1.8x.",
    ],
  },
  {
    id: "a_short_outreach",
    type: "YouTube Short",
    platform: "YouTube",
    icon: "youtube",
    sourceMomentId: "m_outreach",
    confidence: 88,
    actionClass: "approval",
    status: "pending",
    scheduledFor: "Saturday at 11:00 AM",
    title: "40 customers from a spreadsheet",
    body: "No ads. No launch. Two hundred rows, two hundred emails, each one quoting the prospect back to themselves. This is the cold outreach loop that produced the first 40 paying accounts.",
    meta: [
      { label: "Cut", value: "05:12 - 05:50" },
      { label: "Length", value: "38s" },
      { label: "Aspect", value: "9:16" },
      { label: "Captions", value: "Burned-in" },
    ],
    rationale: [
      "A concrete number in the opening line stops the scroll.",
      "Maps to distribution, a proven channel topic.",
      "Self-contained, no dependency on earlier chapters.",
    ],
  },
  {
    id: "a_x_flywheel",
    type: "X Thread",
    platform: "X",
    icon: "x",
    sourceMomentId: "m_flywheel",
    confidence: 84,
    actionClass: "approval",
    status: "pending",
    scheduledFor: "Friday at 9:15 AM",
    title: "Distribution is not a channel. It is a loop.",
    body: "Distribution is not a channel. It is a compounding loop.\n\nEvery customer you land should make the next one cheaper to reach.\n\nIf it does not, you do not have distribution. You have advertising.\n\n5 tests to tell the difference:",
    meta: [
      { label: "Source", value: "14:20 - 15:05" },
      { label: "Format", value: "Hook + 5 posts" },
      { label: "Tone", value: "Direct, practical" },
    ],
    rationale: [
      "Framework content reads better as text than as a Short.",
      "Founders over-index on distribution frameworks.",
      "Routed away from Shorts deliberately, the payoff is structural.",
    ],
  },
  {
    id: "a_newsletter",
    type: "Newsletter Angle",
    platform: "Email",
    icon: "mail",
    sourceMomentId: "m_flywheel",
    confidence: 79,
    actionClass: "approval",
    status: "pending",
    scheduledFor: "Next Tuesday at 7:00 AM",
    title: "The loop test: are you compounding or renting?",
    body: "Open with the spreadsheet story, then formalise it into the flywheel test. Close with the pricing correction as proof that the loop only works once the price reflects the fix.",
    meta: [
      { label: "Sections", value: "3" },
      { label: "Read time", value: "~4 min" },
      { label: "CTA", value: "Reply with your loop" },
    ],
    rationale: [
      "Long-form framing suits the framework better than 45 seconds of video.",
      "Reuses two selected moments without duplicating the Shorts.",
      "Newsletter is a stated preferred format in Creator Memory.",
    ],
  },
  {
    id: "a_metadata",
    type: "YouTube Metadata",
    platform: "YouTube",
    icon: "tag",
    sourceMomentId: "m_pricing",
    confidence: 91,
    actionClass: "auto",
    status: "draft",
    scheduledFor: "Applied to draft",
    title: "Chapters, description and tags rewritten",
    body: "Nine chapter markers generated from topic segmentation, the description rewritten to front-load the pricing segment, and 12 tags aligned to historical high-CTR terms.",
    meta: [
      { label: "Chapters", value: "9" },
      { label: "Tags", value: "12" },
      { label: "Class", value: "Auto, no approval" },
    ],
    rationale: [
      "Draft-only metadata change, nothing is published publicly.",
      "Classified auto because it is reversible and non-public.",
    ],
  },
];

/** Assets blocking on the creator. Every count in the UI derives from this. */
export const pendingApprovals = assets.filter((a) => a.actionClass === "approval");

/* ------------------------------------------------------------------ */
/* Agent activity feed                                                 */
/* ------------------------------------------------------------------ */

export type LogLevel =
  | "ingest"
  | "tool"
  | "reasoning"
  | "memory"
  | "gatekeeper"
  | "verify"
  | "error"
  | "learn";

export type LogEntry = {
  time: string;
  level: LogLevel;
  tag: string;
  message: string;
  detail?: string;
};

export const agentLog: LogEntry[] = [
  {
    time: "12:04:09",
    level: "ingest",
    tag: "INGEST",
    message: "Received saas-growth-final.mp4 (20:14), extracting audio via FFmpeg.",
  },
  {
    time: "12:04:13",
    level: "ingest",
    tag: "INGEST",
    message: "Transcribed audio via Whisper (1,420 words, 312 timestamped lines).",
  },
  {
    time: "12:04:15",
    level: "tool",
    tag: "TOOL:get_transcript",
    message: "Loaded timestamped transcript for vid_100saas.",
  },
  {
    time: "12:04:18",
    level: "tool",
    tag: "TOOL:find_content_moments",
    message: "Identified 14 raw candidate segments.",
  },
  {
    time: "12:04:21",
    level: "tool",
    tag: "TOOL:score_moment",
    message: "Scored 14 segments on hook, context, relevance, novelty and history.",
  },
  {
    time: "12:04:22",
    level: "reasoning",
    tag: "REASONING",
    message: "Rejected 8 segments (hook score below 60). Shortlist reduced to 6.",
  },
  {
    time: "12:04:26",
    level: "memory",
    tag: "MEMORY:creator_alex",
    message: "Loaded Creator Memory, prioritising pricing and distribution.",
    detail: "weak_topics: general productivity, morning routines",
  },
  {
    time: "12:04:28",
    level: "reasoning",
    tag: "REASONING",
    message: "Re-ranked the shortlist against historical performance. m_pricing promoted to rank 1.",
  },
  {
    time: "12:04:29",
    level: "reasoning",
    tag: "REASONING",
    message: "Rejected m_routine (51), matches a known weak topic.",
  },
  {
    time: "12:04:30",
    level: "gatekeeper",
    tag: "ESCALATE",
    message: "m_sponsor contains sponsor copy, escalating instead of auto-discarding.",
  },
  {
    time: "12:04:31",
    level: "reasoning",
    tag: "REASONING",
    message: "Selected 3 moments out of 14 (21% selection rate).",
  },
  {
    time: "12:04:34",
    level: "tool",
    tag: "TOOL:generate_asset_plan",
    message: "Drafted 2 Shorts, 1 X thread and 1 newsletter angle.",
  },
  {
    time: "12:04:36",
    level: "tool",
    tag: "TOOL:generate_asset_plan",
    message: "Routed m_flywheel to X and Newsletter, not Shorts. The payoff is structural.",
  },
  {
    time: "12:04:37",
    level: "tool",
    tag: "TOOL:schedule_asset",
    message: "Proposed slots from historical engagement windows (Thu 4:00 PM, Fri 9:15 AM).",
  },
  {
    time: "12:04:38",
    level: "error",
    tag: "TOOL:schedule_asset",
    message: "Connector timeout on x_scheduler (attempt 1 of 3).",
    detail: "HTTP 504, retrying with backoff",
  },
  {
    time: "12:04:40",
    level: "verify",
    tag: "TOOL:verify_publish_result",
    message: "Retry succeeded, slot confirmed for a_x_flywheel.",
  },
  {
    time: "12:04:42",
    level: "tool",
    tag: "TOOL:generate_asset_plan",
    message: "Rewrote the YouTube description and 9 chapters (class: auto).",
  },
  {
    time: "12:04:45",
    level: "gatekeeper",
    tag: "GATEKEEPER",
    message: "4 public actions require creator approval. Pausing execution.",
  },
];

export const postPublishLog: LogEntry[] = [
  {
    time: "16:31:02",
    level: "tool",
    tag: "TOOL:publish_asset",
    message: "Published a_short_pricing to YouTube Shorts.",
  },
  {
    time: "16:31:07",
    level: "verify",
    tag: "TOOL:verify_publish_result",
    message: "Verified live, asset id yt_sh_8842, status 200.",
  },
  {
    time: "09:12:44",
    level: "tool",
    tag: "TOOL:get_creator_analytics",
    message: "Pulled 48h metrics for a_short_pricing.",
  },
  {
    time: "09:12:46",
    level: "learn",
    tag: "TOOL:analyze_performance",
    message: "94,800 views against a 41,200 baseline, 2.3x the channel average.",
  },
  {
    time: "09:12:48",
    level: "memory",
    tag: "TOOL:update_creator_memory",
    message: "Learned: concrete pricing examples outperform generic startup advice.",
  },
  {
    time: "09:12:51",
    level: "learn",
    tag: "RECOMMENDATION",
    message: "Next content: How I Price My SaaS, a full-length follow-up.",
  },
];

/* ------------------------------------------------------------------ */
/* Performance and learning                                            */
/* ------------------------------------------------------------------ */

export const performance = {
  asset: "I tripled my price. Nobody left.",
  views: 94800,
  baselineViews: 41200,
  multiple: "2.3x",
  retention: 81,
  baselineRetention: 62,
  ctr: 9.1,
  baselineCtr: 5.4,
  newSubscribers: 1240,
} as const;

export const nextRecommendation = {
  title: "How I Price My SaaS",
  format: "Full-length video, 12-16 min",
  confidence: 88,
  reason:
    "Your pricing Short is outperforming the channel baseline by 2.3x, and retention held at 81% to the final frame. The audience is asking for the mechanics, not the anecdote.",
  evidence: [
    "94,800 views against a 41,200 baseline over 48 hours.",
    "Top comment theme: how did you decide the number (37 of 210 comments).",
    "Pricing is already a top-3 historical topic for this channel.",
  ],
} as const;

/* ------------------------------------------------------------------ */
/* Demo metrics                                                        */
/* ------------------------------------------------------------------ */

export const metrics = {
  manualMinutes: 142,
  kreatrMinutes: 32,
  savedMinutes: 110,
  decisionsAvoided: 11,
  decisionReduction: 78,
  candidateMoments: 14,
  analysed: 6,
  selected: 3,
  rejectionRate: 79,
  actionsPlanned: 5,
  actionsVerified: 5,
  recoveries: 1,
} as const;

/* ------------------------------------------------------------------ */
/* Landing page content                                                */
/* ------------------------------------------------------------------ */

export const problemTasks = [
  "Scrub a 45-minute recording for 30-second moments",
  "Guess which hooks will actually hook an audience",
  "Reformat captions for YouTube Shorts, X, and LinkedIn",
  "Schedule posts across 4 different platforms",
  "Analyse retention graphs to guess the next video idea",
];

export const processSteps = [
  {
    step: "01",
    title: "Ingest Video",
    sub: "FFmpeg & Whisper",
    body: "Audio extraction, timestamped transcription and topic segmentation the moment your file lands.",
    tool: "get_transcript",
  },
  {
    step: "02",
    title: "Filter & Reject",
    sub: "Scoring hook & value",
    body: "Every candidate is scored on hook strength, standalone context and relevance. Most get thrown away.",
    tool: "score_moment",
  },
  {
    step: "03",
    title: "Draft Assets",
    sub: "Shorts, X, Metadata",
    body: "Survivors become platform-native copy, never one caption pasted across five networks.",
    tool: "generate_asset_plan",
  },
  {
    step: "04",
    title: "1-Click Approve",
    sub: "Creator gatekeeper",
    body: "Anything public stops here and waits for you. Everything reversible ships on its own.",
    tool: "schedule_asset",
  },
  {
    step: "05",
    title: "Learn & Iterate",
    sub: "Analytics feedback",
    body: "Published performance flows back into Creator Memory and shapes the next recommendation.",
    tool: "analyze_performance",
  },
];

export const marqueeItems = [
  "Autonomous Moment Scoring",
  "Rejects Weak Clips",
  "Platform-Native Copy",
  "Creator Memory",
  "1-Click Approval",
  "Tool Verification",
  "Retry & Recover",
  "Closed-Loop Learning",
  "Strands Agents SDK",
  "AWS Bedrock",
];

export const comparisonRows = [
  {
    dimension: "Turnaround time",
    kreatr: "Under 3 minutes",
    editor: "3-5 business days",
    genericAi: "20 mins of prompting",
    diy: "6-8 hours",
  },
  {
    dimension: "Editorial judgment",
    kreatr: "Rejects weak clips (scored)",
    editor: "Human, subjective",
    genericAi: "Blindly generates 20 clips",
    diy: "Exhausting",
  },
  {
    dimension: "Creator effort",
    kreatr: "1-click review",
    editor: "Endless Slack messages",
    genericAi: "Copy/paste into 5 apps",
    diy: "100% manual",
  },
  {
    dimension: "Creator memory",
    kreatr: "Learns top-performing topics",
    editor: "High turnover, amnesia",
    genericAi: "Zero memory (stateless)",
    diy: "In your head",
  },
  {
    dimension: "Action execution",
    kreatr: "Direct tool calling & verify",
    editor: "Manual upload by editor",
    genericAi: "Manual download/upload",
    diy: "Manual upload",
  },
  {
    dimension: "Next topic idea",
    kreatr: "Data-driven recommendation",
    editor: "Guesswork",
    genericAi: "Generic suggestions",
    diy: "Blank page",
  },
];

export const faqs = [
  {
    q: "How does Kreatr decide what to reject?",
    a: "Kreatr evaluates every candidate segment for hook strength (the first 8 seconds), standalone context, and relevance to your Creator Memory. If a segment fails these thresholds it is discarded with an explainable reason, so you can read exactly why any clip did not make the cut.",
  },
  {
    q: "Why use the Strands Agents SDK instead of a simple API wrapper?",
    a: "Kreatr is not a one-shot prompt generator. It is an autonomous agent that reads transcripts, queries memory, executes multi-step tool calls, verifies published states, recovers from errors, and feeds post-publication analytics back into its own decision-making.",
  },
  {
    q: "Does Kreatr post to my channels without permission?",
    a: "No. Kreatr enforces a Human-in-the-Loop design. Consequential actions such as publishing a YouTube Short, posting publicly, or changing a live title require your single-click approval. Only reversible, non-public work runs unattended.",
  },
  {
    q: "How does the agent learn from performance?",
    a: "When an asset is published, Kreatr inspects its views and retention against your historical baseline, writes the finding into your Creator Memory, and uses it to rank the next batch of candidates and recommend your next content topic.",
  },
];

export const testimonials = [
  {
    quote: "It threw away five clips I would have posted. All five would have flopped.",
    name: "Maya Chen",
    role: "Dev tooling, 92K subs",
  },
  {
    quote: "The first tool that argues back about what is worth publishing.",
    name: "Devin Osei",
    role: "Founder podcast, 51K subs",
  },
];
