# Kreatr — Web (`apps/web`)

Next.js 15 frontend for Kreatr: the Neo-Brutalist landing page and the four creator
workspace screens described in `frontend.md`.

## Run

```bash
cd apps/web
npm install
npm run dev        # http://localhost:3000
```

`npm run build` produces the production bundle; `npm start` serves it.

## Routes

| Route | Screen |
| :--- | :--- |
| `/` | Landing page — hero, problem checklist, bento, agent loop, comparison, proof, architecture, FAQ, demo form |
| `/dashboard` | Creator overview: latest content, agent recommendation, publishing queue, performance |
| `/workspace/[id]` | Content inspector: interactive timeline, selected vs rejected moments |
| `/workspace/[id]/actions` | Action plan with the human-in-the-loop approval modal |
| `/workspace/[id]/agent-feed` | Live Strands execution stream |

Use `vid_100saas` as the workspace id — it matches the seeded demo content.

## Structure

```text
app/                     routes (App Router)
components/landing/      landing page sections
components/workspace/    app screens + agent components
components/ui/           buttons, badges, meters
lib/mockData.ts          seeded creator, moments, assets, agent log, metrics
lib/images.ts            curated Unsplash CDN imagery (single source of truth)
```

## Notes

- **All demo data is seeded** in `lib/mockData.ts`. Every count shown in the UI
  (approvals pending, tool calls, selection funnel) derives from that file rather
  than being hardcoded per screen, so changing the data keeps the screens consistent.
- **The timeline, rejection cards, moment cards, approval modal and agent terminal
  are components, not images** — they use Tailwind and Lucide icons so they inherit
  the design tokens and stay interactive.
- **Imagery** is served from the Unsplash CDN via `lib/images.ts`. Each id there was
  checked for both availability and subject matter; add new ones to that file rather
  than inlining URLs in components.
- The waveform in `VideoTimeline` is generated from a deterministic seeded function
  so server and client markup match (a random waveform would cause a hydration error).

## Design tokens

Defined in `tailwind.config.ts` and `app/globals.css`: electric lime `#CCFF00`,
pitch black `#0A0A0A`, canvas `#F7F7F8`, hard `4px 4px 0` shadows, and the
Plus Jakarta Sans / Caveat / JetBrains Mono type trio.
