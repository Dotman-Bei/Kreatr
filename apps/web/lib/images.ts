/**
 * Curated Unsplash CDN imagery for Kreatr.
 *
 * Every id below was resolution-checked and eyeballed for subject matter, so no
 * card ever renders an empty or mismatched placeholder. Keep this file as the
 * single source of truth: components import named assets, never raw ids.
 */

type Fit = "crop" | "facearea";

function unsplash(
  id: string,
  { w = 800, h, q = 80, fit = "crop" as Fit, facepad }: { w?: number; h?: number; q?: number; fit?: Fit; facepad?: number } = {},
) {
  const params = new URLSearchParams({
    auto: "format",
    fit,
    w: String(w),
    q: String(q),
  });
  if (h) params.set("h", String(h));
  if (fit === "facearea") params.set("facepad", String(facepad ?? 2.5));
  return `https://images.unsplash.com/${id}?${params.toString()}`;
}

/** Scenes: creator desks, studios, editing rooms. */
export const scenes = {
  /** Condenser mic + headphones in front of an editing timeline monitor. */
  creatorDesk: unsplash("photo-1589903308904-1010c2294adc", { w: 900, h: 620 }),
  /** Broadcast dynamic mic on a boom arm against a dark seamless backdrop. */
  boomMic: unsplash("photo-1590602847861-f357a9332bbc", { w: 760, h: 900 }),
  /** Studio condenser in a shock mount, monochrome and moody. */
  shockMic: unsplash("photo-1478737270239-2f02b77fc618", { w: 900, h: 620 }),
  /** Macro of a multi-track NLE timeline with clip cut points. */
  editTimeline: unsplash("photo-1574717024653-61fd2cf4d44d", { w: 1100, h: 620 }),
  /** Backlit iMac desk setup, saturated key light. */
  deskSetup: unsplash("photo-1547082299-de196ea013d6", { w: 900, h: 640 }),
  /** Mixing console wall in a warm-lit recording studio. */
  mixConsole: unsplash("photo-1598488035139-bdbb2231ce04", { w: 1000, h: 620 }),
  /** Laptop showing a dashboard, shot on a leather couch. */
  laptopDashboard: unsplash("photo-1593642532842-98d0fd5ebc1a", { w: 900, h: 620 }),
  /** Two founders talking over a laptop — audience stand-in. */
  founders: unsplash("photo-1517245386807-bb43f82c33c4", { w: 900, h: 600 }),
  /** Creator filming on location. */
  onLocation: unsplash("photo-1492691527719-9d1e07e534b4", { w: 900, h: 600 }),
} as const;

/** Portraits: studio headshots for avatars and the creator profile. */
export const portraits = {
  alex: unsplash("photo-1607990281513-2c110a25bd8c", { w: 260, h: 260, fit: "facearea" }),
  maya: unsplash("photo-1534528741775-53994a69daeb", { w: 260, h: 260, fit: "facearea" }),
  devin: unsplash("photo-1507003211169-0a1dd7228f2d", { w: 260, h: 260, fit: "facearea" }),
  june: unsplash("photo-1494790108377-be9c29b29330", { w: 260, h: 260, fit: "facearea" }),
  soren: unsplash("photo-1500648767791-00dcc994a43e", { w: 260, h: 260, fit: "facearea" }),
  wren: unsplash("photo-1517841905240-472988babdf9", { w: 260, h: 260, fit: "facearea" }),
  hal: unsplash("photo-1472099645785-5658abf4ff4e", { w: 260, h: 260, fit: "facearea" }),
} as const;

export const socialProof = [
  { name: "Maya", src: portraits.maya },
  { name: "Devin", src: portraits.devin },
  { name: "June", src: portraits.june },
  { name: "Soren", src: portraits.soren },
  { name: "Wren", src: portraits.wren },
] as const;
