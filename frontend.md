# Kreatr — Frontend Specification & Design System (`frontend.md`)
## Visual Style Clone: Neo-Brutalist Creator Agent Landing Page & Workspace
### Designed for: Agents for Humans Hackathon · Professional Agents for Creators

---

## 1. Executive Overview & Brand Architecture

`frontend.md` provides an end-to-end design system, component hierarchy, token schema, visual asset guide, and implementation blueprint for **Kreatr**.

Kreatr is a background AI post-production agent for long-form video creators built on the **Strands Agents SDK** and **AWS Bedrock**. The frontend clones the visual layout, interaction paradigms, and design language of the high-converting modern agency template (*Project One*), adapted specifically for an autonomous AI creator agent.

### Brand Positioning & Pitch
- **Tagline:** Finish creating. Let Kreatr handle what comes next.
- **Hero Headline:** Your Post-Production, Handled.
- **Value Equation:** 1 Finished Video → Ingest → Evaluate & Reject → Repurpose → 1-Click Approve → Verify & Learn.

---

## 2. Design System & Style Guide

The visual language combines **Neo-Brutalism**, **High-Contrast Dark Mode Elements**, **Tactile Polaroid Cards**, and **Electric Lime Accents**.

### 2.1 Color Tokens
```css
:root {
  /* Brand Primary Accents */
  --color-electric-lime: #CCFF00;       /* Primary CTA, active badges, neon highlights */
  --color-electric-lime-hover: #B8E600; /* Darker lime for hover states */
  --color-lime-tint: #F4FEE6;           /* Subtle light green background tint */

  /* Neutral Surfaces */
  --color-bg-canvas: #F7F7F8;           /* Clean off-white canvas background */
  --color-surface-pure: #FFFFFF;        /* Card & input white surface */
  --color-surface-dark: #0A0A0A;        /* Pitch black main containers & dark sections */
  --color-surface-card-dark: #141416;   /* Elevated dark cards */
  --color-surface-card-border: #26262B; /* Dark mode interior card borders */

  /* Typography Colors */
  --color-text-primary: #0A0A0A;        /* High-contrast headings and body */
  --color-text-secondary: #52525B;      /* Zinc-600 subtext and descriptions */
  --color-text-inverted: #FAFAFA;       /* White text on dark containers */
  --color-text-muted-dark: #A1A1AA;     /* Zinc-400 for dark mode secondary text */

  /* Semantic Agent States */
  --color-status-rejected: #EF4444;     /* Red badge: Bad hook / rejected moment */
  --color-status-rejected-bg: #FEF2F2;  /* Soft red container */
  --color-status-approved: #10B981;     /* Emerald green badge: Selected clip */
  --color-status-approved-bg: #ECFDF5;  /* Soft emerald container */
  --color-status-pending: #F59E0B;      /* Amber badge: Approval required */
  --color-status-pending-bg: #FFFBEB;   /* Soft amber container */
}
```

### 2.2 Typography
- **Primary Display & Interface:** `Plus Jakarta Sans`, `Inter`, or `system-ui, -apple-system, sans-serif`.
  - Display Titles: `font-extrabold tracking-tight` (Hero: 64px - 84px / Section Headings: 36px - 48px).
  - Body Text: `font-medium leading-relaxed text-zinc-600` (15px - 17px).
- **Handwritten & Sticky Note Annotations:** `Caveat`, `Reenie Beanie`, or `Architects Daughter`.
  - Used for dynamic marker callouts, sticky notes (*"I don't have time for this!"*), and hand-drawn SVG arrows.
- **Monospace Agent Logs:** `JetBrains Mono` or `Fira Code`.
  - Used for timestamps, tool execution readouts, confidence scores, and code blocks.

### 2.3 Borders, Shadows & Radii
- **Hard Neo-Brutalist Shadow:** `box-shadow: 4px 4px 0px #0A0A0A;`
- **Subtle Dark Elevation Shadow:** `box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.12);`
- **Neon Lime Glow:** `box-shadow: 0 0 30px rgba(204, 255, 0, 0.35);`
- **Border Standards:**
  - Light elements: `1.5px solid #0A0A0A` or `1px solid #E4E4E7`
  - Dark elements: `1px solid rgba(255, 255, 255, 0.12)`
  - Active / Focus: `2px solid #CCFF00`
- **Border Radius Hierarchy:**
  - Outer Section Boxes: `rounded-3xl` (24px)
  - Bento & Polaroid Cards: `rounded-2xl` (16px)
  - Floating Navbar & Buttons: `rounded-full` (9999px)

---

## 3. Visual Asset Sourcing Guide (Pinterest, Unsplash & UI Assets)

To populate the Polaroid floating cards, bento blocks, and creator social proof with the exact aesthetic from the video:

| Section / Placement | Recommended Search Queries (Pinterest / Unsplash / Lexica) | Recommended Visual Characteristics |
| :--- | :--- | :--- |
| **Hero Floating Card 1** (Top Left) | `"Cinematic YouTube Studio Desk Setup"`, `"Minimalist Video Editing Room Dark"` | Clean workspace with camera monitor, high contrast lighting, neutral tones. |
| **Hero Floating Card 2** (Bottom Left) | `"Dark Mode Video Editing Timeline UI"`, `"Video Scrubbing Waveform"` | Macro shot of video scrubbing bar showing clip cut points. |
| **Hero Floating Card 3** (Top Right) | `"Podcast Studio Shure SM7B Minimal"`, `"Creator Aesthetic Desk"` | High-end studio mic on boom arm, minimalist aesthetic. |
| **Hero Floating Card 4** (Bottom Right) | `"iPhone Social Media Feed Aesthetic"`, `"Minimalist Studio Portrait"` | Phone displaying vertical video player or creator holding camera. |
| **Social Proof Avatars** | `"Tech Founder Studio Headshot"`, `"Creative Director Portrait Monochrome"`, `"YouTube Creator Aesthetic Headshot"` | Authentic, expressive headshots in circular borders with neon rings. |
| **Bento Feature Mockups** | `"Dark Mode SaaS Analytics Terminal"`, `"Clean Minimalist Code Editor UI"`, `"Glassmorphic Mobile Dashboard"` | Crisp UI cards showing charts, confidence bars, and JSON schemas. |

---

## 4. Landing Page Component Architecture & Specifications

```text
LandingPage Layout
├── 1. FloatingNavbar (Sticky pill container with live CTA)
├── 2. HeroSection
│    ├── BackgroundDisc (Large light gray radial ellipse)
│    ├── PillBadge ("⚡ Autonomous Strands Agent · Hackathon 2026")
│    ├── Headline & Subtitle
│    ├── CTABtns (Electric Lime & Ghost Black)
│    └── FloatingPolaroidCards (4x tilted floating cards with handwritten SVGs)
├── 3. ProblemChecklist ("Post-Production Shouldn't Feel Like a Second Job")
│    ├── ChecklistColumn (Dark container with checkbox tasks)
│    └── StickyNotes (Yellow & Lime sticky tags rotated -4° and +3°)
├── 4. BentoGridFeatures ("We Make Content Repurposing Insanely Intelligent")
│    └── 6x Grid Blocks (Lime, White, Dark cards)
├── 5. ProcessStepper (The 5-Stage Autonomous Agent Loop)
│    └── Horizontal Branching Tree (Ingest → Score → Plan → Approve → Learn)
├── 6. InfiniteMarqueeTicker (High-Speed Feature Ribbon)
├── 7. ComparisonMatrix ("The Smarter Way to Post-Produce")
│    └── 4-Column Table: Kreatr vs Editor vs Generic AI vs DIY
├── 8. ProofAndMetrics (Bento proof: 110m Saved, 78% Decision Reduction)
├── 9. FAQSection (Full-width Electric Lime accordion list)
├── 10. DemoWaitlistForm ("Your Content Won't Manage Itself. Let Kreatr Do It.")
└── 11. DarkFooter (Pitch black container with SDK & AWS badges)
```

---

## 5. Detailed Component Specifications

### 5.1 `FloatingNavbar.tsx`
- **Position:** `fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl`
- **Container:** `bg-[#0A0A0A]/90 backdrop-blur-md text-white rounded-full px-6 py-3.5 border border-zinc-800 shadow-2xl flex items-center justify-between`
- **Left Logo:**
  ```tsx
  <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-white">
    Kreatr<span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] inline-block animate-pulse"></span>
  </div>
  ```
- **Nav Links:** Pills for `How It Works`, `Agent Loop`, `Comparison`, `FAQ`, `Architecture` (`text-sm font-medium text-zinc-300 hover:text-white transition-colors`).
- **Right CTA:**
  ```tsx
  <button className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full flex items-center gap-2 transition-transform hover:scale-105 shadow-[2px_2px_0px_#000]">
    Launch Demo <ArrowUpRight className="w-4 h-4" />
  </button>
  ```

---

### 5.2 `HeroSection.tsx`
- **Container:** Relative, centered, min-height 90vh, padding-top 140px, padding-bottom 80px.
- **Center Background:** Giant soft disc: `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-zinc-200/50 rounded-full blur-3xl -z-10`.
- **Top Badge:**
  ```tsx
  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black text-white text-xs font-semibold mb-6 shadow-sm border border-zinc-800">
    <span className="text-[#CCFF00]">⚡</span> Powered by Strands Agents SDK & AWS Bedrock
  </div>
  ```
- **Main Heading:**
  ```tsx
  <h1 className="text-5xl sm:text-7xl font-extrabold text-[#0A0A0A] tracking-tight text-center max-w-4xl mx-auto leading-[1.08]">
    Your Post-Production, <br />
    <span className="underline decoration-[#CCFF00] decoration-wavy decoration-4">Handled.</span>
  </h1>
  ```
- **Subheadline:**
  ```tsx
  <p className="text-lg md:text-xl text-zinc-600 font-medium text-center max-w-2xl mx-auto mt-6 leading-relaxed">
    One finished video in. An autonomous multi-platform workflow out. Kreatr observes, extracts viral hooks, rejects the fluff, and only asks for your approval.
  </p>
  ```
- **Dual CTA Buttons:**
  - Primary: `bg-[#CCFF00] text-black font-bold text-base px-8 py-4 rounded-full border-2 border-black shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#0A0A0A]` -> `[ Try Live Demo -> ]`
  - Secondary: `bg-white text-black font-bold text-base px-8 py-4 rounded-full border-2 border-black shadow-[4px_4px_0px_#0A0A0A] hover:bg-zinc-100` -> `[ View Agent Architecture -> ]`
- **4x Tilted Floating Polaroid Cards:**
  1. **Top Left Card (Rotated -7°):**
     - Image: YouTube 4K timeline video capture.
     - Label: `"Source Video: SaaS Growth.mp4 (24:12)"`.
     - Styling: White card, 1.5px black border, heavy shadow, pinned clip graphic.
  2. **Bottom Left Card (Rotated +6°):**
     - Red Accent Header: `"✗ REJECTED MOMENT (03:14 - 04:02)"`.
     - Content: `"Hook Score: 42/100 · Reason: Requires 45s of context, weak opening."`.
     - Annotation: Handwritten font note with arrow: *"Agent filters out bad clips automatically!"*.
  3. **Top Right Card (Rotated +8°):**
     - Lime Accent Header: `"✓ HIGH-VALUE SHORT (08:42 - 09:21)"`.
     - Content: `"Confidence: 94% · Hook: Pricing Psychology · Formatted for YT Shorts + TikTok"`.
  4. **Bottom Right Card (Rotated -5°):**
     - Dark Card Header: `"Scheduled: X Thread + Newsletter"`.
     - Content: `"1-Click Approval Pending · Auto-publish scheduled for Thursday 4:00 PM"`.

---

### 5.3 `ProblemChecklist.tsx` (Sound Familiar Section)
- **Container:** `bg-[#0A0A0A] text-white rounded-3xl p-8 md:p-16 my-16 relative overflow-hidden border border-zinc-800`
- **Layout:** 2-column grid (`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center`)
- **Left Column (Tasks Checklist - 7 cols):**
  - Dark rounded container (`bg-[#141416] p-6 rounded-2xl border border-zinc-800 space-y-3 relative`):
    - `[x] Scrub 45-minute recording for 30-second moments`
    - `[x] Guess which hooks will hook an audience`
    - `[x] Reformat captions for YouTube Shorts, X, and LinkedIn`
    - `[x] Schedule posts across 4 different platforms`
    - `[x] Analyze retention graphs to guess the next video idea`
  - **Sticky Note 1 (Rotated -6°, Lime Tag):**
    ```tsx
    <div className="absolute -top-4 -right-4 bg-[#CCFF00] text-black font-bold font-handwritten px-4 py-2 rounded-lg shadow-xl rotate-[-6deg] text-sm">
      "I don't have time for this second job!" ✍️
    </div>
    ```
  - **Sticky Note 2 (Rotated +4°, Yellow Tag):**
    ```tsx
    <div className="absolute -bottom-4 right-12 bg-[#FEF08A] text-black font-bold font-handwritten px-4 py-2 rounded-lg shadow-xl rotate-[4deg] text-sm">
      "Is this clip even worth posting?" 🤔
    </div>
    ```
- **Right Column (Copy - 5 cols):**
  - Eyebrow: `text-[#CCFF00] font-mono text-xs uppercase tracking-widest font-bold mb-3` -> `SOUND FAMILIAR?`
  - Headline: `text-3xl md:text-5xl font-extrabold leading-tight text-white` -> **"Post-Production Shouldn't Feel Like a Never-Ending Checklist."**
  - Description: `text-zinc-400 text-base leading-relaxed mt-4` -> *"Creators finish recording, but the real grind begins. Kreatr turns hours of manual post-production into an autonomous background workflow."*

---

### 5.4 `BentoFeatures.tsx` (Value Proposition Grid)
- **Headline:** `text-4xl md:text-5xl font-extrabold text-center text-black mb-4` -> **"We Make Content Repurposing Insanely Intelligent."**
- **Subheading:** `text-center text-zinc-600 max-w-2xl mx-auto mb-12` -> *"Not another generic prompt generator. An agent that exercises genuine editorial judgment."*
- **Grid Structure (3 cols x 2 rows):**
  1. **Block 1 (`bg-[#CCFF00] text-black border-2 border-black rounded-3xl p-8`):**
     - Icon: `CheckCircle2`
     - Title: **Intelligent Moment Rejection**
     - Text: *"Kreatr rejects 70%+ of weak video moments so you never spam your audience with low-value clips."*
  2. **Block 2 (`bg-white text-black border-2 border-black rounded-3xl p-8`):**
     - Icon: `Sparkles`
     - Title: **Platform-Native Copy**
     - Text: *"Generates bespoke YouTube Shorts titles, viral X posts, and newsletter frameworks from your best moments."*
  3. **Block 3 (`bg-[#CCFF00] text-black border-2 border-black rounded-3xl p-8`):**
     - Icon: `ShieldCheck`
     - Title: **1-Click Human-in-the-Loop**
     - Text: *"Safe execution. Kreatr prepares the action plan and only asks your approval before publishing publicly."*
  4. **Block 4 (`bg-white text-black border-2 border-black rounded-3xl p-8`):**
     - Icon: `BrainCircuit`
     - Title: **Persistent Creator Memory**
     - Text: *"Remembers your audience persona, tone of voice, preferred formats, and previously high-performing topics."*
  5. **Block 5 (`bg-[#CCFF00] text-black border-2 border-black rounded-3xl p-8`):**
     - Icon: `TrendingUp`
     - Title: **Closed-Loop Learning**
     - Text: *"Inspects post-publication analytics and autonomously recommends your next high-converting video topic."*
  6. **Block 6 (`bg-[#0A0A0A] text-white border-2 border-black rounded-3xl p-8`):**
     - Icon: `Cpu`
     - Title: **Powered by Strands Agents SDK**
     - Text: *"Multi-step tool calling, dynamic recovery loops, and verified AWS Bedrock agent execution."*

---

### 5.5 `ProcessStepper.tsx` (5-Stage Kreatr Loop)
- **Header:** `text-center mb-12` -> **"Meet the Kreatr Autonomous Loop"**
- **Subheader:** *"5 steps. Zero manual grunt work. Complete control over what gets published."*
- **Branching Flowchart Visual:**
  ```text
  [ 1. Ingest Video ] ──▶ [ 2. Filter & Reject ] ──▶ [ 3. Draft Assets ] ──▶ [ 4. 1-Click Approve ] ──▶ [ 5. Learn & Iterate ]
  (FFmpeg & Whisper)       (Scoring Hook & Value)      (Shorts, X, Meta)        (Creator Gatekeeper)       (Analytics Feedback)
  ```
- **Step Card Styling:**
  - Nodes: `bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#CCFF00] transition-colors group`
  - Step Number: `inline-block px-3 py-1 bg-black text-[#CCFF00] font-mono text-xs font-bold rounded-full mb-3`
  - Connector: Animated neon green dotted SVG line between nodes.

---

### 5.6 `ComparisonMatrix.tsx` (Comparison Table)
- **Section Heading:** **"The Smarter Way to Publish."**
- **Table Container:** `w-full overflow-x-auto bg-white border-2 border-black rounded-3xl p-8 shadow-[6px_6px_0px_#0A0A0A]`
- **Comparison Table Structure:**
  | Dimension | Kreatr Autonomous Agent | Traditional Video Editor | Generic AI Tools (ChatGPT/Vizard) | Solo Creator Grind |
  | :--- | :--- | :--- | :--- | :--- |
  | **Turnaround Time** | **< 3 Minutes** | 3–5 Business Days | 20 Mins Prompting | 6–8 Hours |
  | **Editorial Judgment** | **Rejects weak clips (Scored)** | Human subjective | Blindly generates 20 clips | Exhausting |
  | **Creator Effort** | **1-Click Review** | Endless Slack messages | Copy/Paste into 5 apps | 100% manual |
  | **Creator Memory** | **Learns top-performing topics**| High turnover/amnesia | Zero memory (Stateless) | In your head |
  | **Action Execution** | **Direct Tool Calling & Verify** | Manual upload by editor | Manual download/upload | Manual upload |
  | **Next Topic Idea** | **Data-driven recommendation** | Guesswork | Generic suggestions | Blank page |

---

### 5.7 `FAQSection.tsx` (Electric Lime Full-Width Accordions)
- **Background:** Full section background `bg-[#CCFF00] py-20 px-6 border-y-2 border-black`
- **Section Heading:** `text-4xl md:text-6xl font-extrabold text-black text-center mb-12` -> **"Frequently Asked Questions"**
- **Accordion Wrapper:** `max-w-4xl mx-auto space-y-4`
- **Accordion Items:** `bg-black text-white rounded-2xl p-6 border-2 border-black transition-all cursor-pointer`
- **Included Q&As:**
  1. **Q: How does Kreatr decide what to reject?**  
     *A:* Kreatr evaluates every candidate segment for hook strength (first 8 seconds), standalone context, and relevance to your Creator Memory. If a segment fails these thresholds, it is automatically discarded with an explainable reason.
  2. **Q: Why use Strands Agents SDK instead of a simple OpenAI API wrapper?**  
     *A:* Kreatr is not a one-shot prompt generator. It is an autonomous agent that reads transcripts, queries memory, executes multi-step tool calls, verifies published states, recovers from errors, and ingests post-publication analytics.
  3. **Q: Does Kreatr post directly to my channels without permission?**  
     *A:* No. Kreatr enforces a Human-in-the-Loop design. Consequential actions (like publishing a YouTube Short or public social post) require your single-click approval.
  4. **Q: How does the agent learn from performance?**  
     *A:* When an asset is published, Kreatr inspects its views and retention metrics against your historical baseline, updates your Creator Memory, and recommends the next content topic.

---

### 5.8 `DemoWaitlistForm.tsx` (Interactive Playground Card)
- **Container:** `max-w-3xl mx-auto bg-[#CCFF00] border-2 border-black rounded-3xl p-8 md:p-12 shadow-[8px_8px_0px_#0A0A0A] my-20`
- **Headline:** `text-3xl md:text-5xl font-extrabold text-black text-center mb-3` -> **"Your Content Won't Manage Itself. Let Kreatr Do It."**
- **Subheadline:** `text-center text-black/80 font-medium mb-8` -> *"Paste a video URL or upload a file to experience autonomous post-production."*
- **Form Layout:**
  - `Creator Name` (Input: White background, 2px black border, rounded-xl, padding 14px)
  - `YouTube / Video URL` (Input)
  - `Primary Target Audience` (Input / Select: Early-stage founders, Developers, Lifestyle)
  - Submit Button: `w-full bg-black hover:bg-zinc-800 text-[#CCFF00] font-extrabold text-lg py-4 rounded-xl transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.3)]` -> `[ Run Kreatr Agent Workflow ⚡ ]`

---

### 5.9 `Footer.tsx`
- **Container:** `bg-[#0A0A0A] text-white pt-16 pb-12 px-6 border-t border-zinc-800`
- **Content Columns:**
  - **Left:** Kreatr logo with lime dot, description: *"Autonomous post-production agent for creators. Built for the Strands Agents for Humans Hackathon 2026."*
  - **Center:** Navigation Links (Product, How It Works, Strands SDK Architecture, Devpost, GitHub Repository).
  - **Right:** Tech Stack Badges (`Strands Agents SDK`, `AWS Bedrock`, `Next.js 15`, `FastAPI`).
- **Bottom Bar:** `text-xs text-zinc-500 flex justify-between items-center border-t border-zinc-900 pt-8 mt-12` -> `© 2026 Kreatr. Open-source under MIT License.`

---

## 6. Creator App Workspace Screens (For MVP Live Demo)

In addition to the landing page, the Next.js app includes the 4 core workflow screens specified in `build.md`:

### 6.1 Screen 1: Dashboard (`/dashboard`)
- **Header:** Creator Profile Greeting (*"Alex • Audience: Early-Stage Founders"*)
- **Active Content Status Card:** Shows latest video processed (*"How I Built a SaaS in 30 Days"*), breakdown pills (`✓ Analyzed`, `✓ 6 Moments Found`, `✓ 3 Selected`, `⚠ 1 Approval Pending`).
- **Agent Recommendation Banner:**
  - Headline: *"Kreatr Recommends: Create a follow-up on SaaS Pricing."*
  - Rationale: *"Your pricing Short is outperforming channel average by 2.3×."*

### 6.2 Screen 2: Content Workspace & Inspector (`/workspace/[id]`)
- **Video Player / Timeline Bar:** Displays video duration (`20:14`) with green/red moment markers.
- **Moments List (Split View):**
  - **Selected Moments Tab (Green Badges):** High hook score moments with timestamps, platform target, and agent rationale.
  - **Rejected Moments Tab (Red Strikethrough Badges):** Rejected candidate clips displaying exact failure reasons (e.g., *"Weak hook, requires too much context"*).

### 6.3 Screen 3: Action Plan & Approval (`/workspace/[id]/actions`)
- **Platform Asset Cards:**
  1. **YouTube Short:** Trimmed video timestamps + generated title + hook script.
  2. **X Post:** Standalone hook thread based on highest-retention moment.
  3. **Newsletter Angle:** Summary framework.
- **Human Gatekeeper Controls:** `[ Approve & Schedule ]`, `[ Quick Edit ]`, `[ Reject Asset ]`.

### 6.4 Screen 4: Live Strands Agent Activity Feed (`/workspace/[id]/agent-feed`)
- **Terminal View:** Monospace live stream of agent execution:
  ```text
  [12:04:13] [INGEST] Transcribed audio via Whisper (1,420 words).
  [12:04:18] [TOOL:find_content_moments] Identified 14 raw segments.
  [12:04:21] [TOOL:score_moment] Evaluated hook strength & context.
  [12:04:22] [REASONING] Rejected 8 segments (Low hook score < 60).
  [12:04:26] [MEMORY:alex_profile] Prioritizing 'pricing' & 'distribution' topics.
  [12:04:31] [TOOL:generate_asset_plan] Formatted 2 Shorts + 1 X Thread.
  [12:04:38] [GATEKEEPER] Surfaced 1 action requiring Creator Approval.
  ```

---

## 7. Tailwind CSS Configuration & Utility Setup

### `tailwind.config.ts`
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lime: {
          custom: "#CCFF00",
          hover: "#B8E600",
          tint: "#F4FEE6",
        },
        surface: {
          canvas: "#F7F7F8",
          dark: "#0A0A0A",
          cardDark: "#141416",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        handwritten: ["var(--font-caveat)", "cursive"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      boxShadow: {
        neo: "4px 4px 0px #0A0A0A",
        "neo-sm": "2px 2px 0px #0A0A0A",
        "neo-lg": "8px 8px 0px #0A0A0A",
        glow: "0 0 30px rgba(204, 255, 0, 0.35)",
      },
      animation: {
        "marquee-fast": "marquee 22s linear infinite",
        "float-slow": "float 5s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 8. Frontend File Tree Structure

```text
apps/web/
├── app/
│   ├── layout.tsx                 # Root layout with fonts & providers
│   ├── page.tsx                   # High-converting Landing Page clone
│   ├── dashboard/
│   │   └── page.tsx               # Creator overview dashboard
│   ├── workspace/
│   │   └── [id]/
│   │       ├── page.tsx           # Content inspector & candidate moments
│   │       ├── actions/
│   │       │   └── page.tsx       # Action plan & 1-click approval
│   │       └── agent-feed/
│   │           └── page.tsx       # Real-time Strands SDK tool execution stream
├── components/
│   ├── landing/
│   │   ├── Navbar.tsx             # Floating pill navbar
│   │   ├── Hero.tsx               # Hero display with tilted cards
│   │   ├── FloatingCards.tsx      # Tilted polaroid card mockups
│   │   ├── ProblemChecklist.tsx   # Sound familiar dark checklist with stickies
│   │   ├── BentoFeatures.tsx      # 6-card value proposition bento
│   │   ├── ProcessStepper.tsx     # 5-stage agent flow chart
│   │   ├── MarqueeTicker.tsx      # High-speed feature roll
│   │   ├── ComparisonMatrix.tsx   # Feature comparison table
│   │   ├── FAQSection.tsx         # Full-width lime accordion list
│   │   ├── DemoWaitlistForm.tsx   # Interactive upload / test form
│   │   └── Footer.tsx             # Pitch black footer with SDK badges
│   ├── workspace/
│   │   ├── VideoPlayer.tsx        # Timestamped timeline preview
│   │   ├── MomentCard.tsx         # Scored / Rejected moment item
│   │   ├── ApprovalModal.tsx      # Human-in-the-loop gatekeeper modal
│   │   └── AgentTerminal.tsx      # Monospace execution logs
│   └── ui/                        # Radix / shadcn/ui components
├── lib/
│   ├── api.ts                     # FastAPI backend connector
│   └── mockData.ts                # Seeded demo video & analytics
└── styles/
    └── globals.css                # Neo-brutalist utility classes
```
