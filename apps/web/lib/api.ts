/**
 * FastAPI backend connector.
 *
 * The API mirrors the shapes in `mockData.ts` exactly, so responses drop
 * straight into the existing components. Every call fails soft: if the backend
 * is not running the workspace falls back to the seeded fixture, which keeps
 * the UI demoable standalone. `source` always says which one you are looking at.
 */

import type { Asset, LogEntry, Moment } from "@/lib/mockData";
import {
  agentLog as seedLog,
  assets as seedAssets,
  metrics as seedMetrics,
  moments as seedMoments,
  nextRecommendation as seedRecommendation,
  performance as seedPerformance,
} from "@/lib/mockData";

/**
 * Where the API lives, which is a different answer per side of the render.
 *
 * The workspace pages are server components, so `loadWorkspace` runs inside the
 * Next.js process and reaches the API over loopback — no DNS, no TLS, no round
 * trip back through the proxy. Approve/resume run in the browser, which must
 * use a same-origin path so the call inherits the page's scheme and can never
 * be blocked as mixed content. Behind one hostname the browser base is empty
 * and every path stays relative.
 *
 * Deployment sets `NEXT_PUBLIC_API_URL=/` and `KREATR_API_ORIGIN` to loopback.
 * Unset, both fall back to the split-port local dev setup.
 */
const LOCAL_API = "http://localhost:8000";

/** Trailing slashes are stripped so `${base}${path}` never doubles up. "/" and "" both mean same-origin. */
function apiBase(value: string | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  return value.trim().replace(/\/+$/, "");
}

const BROWSER_API_URL = apiBase(process.env.NEXT_PUBLIC_API_URL, LOCAL_API);
// A same-origin browser base is meaningless server-side, so loopback wins there.
const SERVER_API_URL = apiBase(
  process.env.KREATR_API_ORIGIN,
  BROWSER_API_URL || LOCAL_API,
);

const apiUrl = () => (typeof window === "undefined" ? SERVER_API_URL : BROWSER_API_URL);

export type RunStatus =
  | "queued"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed";

export type RunMetrics = {
  candidateMoments: number;
  analysed: number;
  selected: number;
  rejectionRate: number;
  actionsPlanned: number;
  actionsVerified: number;
  recoveries: number;
  toolCalls: number;
  manualMinutes: number;
  kreatrMinutes: number;
  savedMinutes: number;
  decisionsAvoided: number;
  decisionReduction: number;
};

export type Run = {
  id: string;
  contentId: string;
  creatorId: string;
  status: RunStatus;
  mode: string;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  moments: Moment[];
  assets: Asset[];
  log: LogEntry[];
  metrics: RunMetrics;
  performance: typeof seedPerformance | null;
  nextRecommendation: typeof seedRecommendation | null;
};

export type WorkspaceData = {
  /** "api" when the backend answered, "seed" when we fell back. */
  source: "api" | "seed";
  runId: string | null;
  status: RunStatus;
  mode: string;
  moments: Moment[];
  assets: Asset[];
  log: LogEntry[];
  metrics: RunMetrics;
  performance: typeof seedPerformance | null;
  nextRecommendation: typeof seedRecommendation | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${apiUrl()}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      // The workspace must reflect the live run, never a cached one.
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    // Backend down, timed out, or CORS-blocked — callers fall back to seed data.
    return null;
  }
}

/** Seeded fixture shaped like a Run, used whenever the API is unavailable. */
function seedWorkspace(): WorkspaceData {
  return {
    source: "seed",
    runId: null,
    status: "awaiting_approval",
    mode: "seed",
    moments: seedMoments,
    assets: seedAssets,
    log: seedLog,
    metrics: {
      candidateMoments: seedMetrics.candidateMoments,
      analysed: seedMetrics.analysed,
      selected: seedMetrics.selected,
      rejectionRate: seedMetrics.rejectionRate,
      actionsPlanned: seedMetrics.actionsPlanned,
      actionsVerified: seedMetrics.actionsVerified,
      recoveries: seedMetrics.recoveries,
      toolCalls: 14,
      manualMinutes: seedMetrics.manualMinutes,
      kreatrMinutes: seedMetrics.kreatrMinutes,
      savedMinutes: seedMetrics.savedMinutes,
      decisionsAvoided: seedMetrics.decisionsAvoided,
      decisionReduction: seedMetrics.decisionReduction,
    },
    performance: seedPerformance,
    nextRecommendation: seedRecommendation,
  };
}

function toWorkspace(run: Run): WorkspaceData {
  return {
    source: "api",
    runId: run.id,
    status: run.status,
    mode: run.mode,
    moments: run.moments,
    assets: run.assets,
    log: run.log,
    metrics: run.metrics,
    performance: run.performance,
    nextRecommendation: run.nextRecommendation,
  };
}

/**
 * The workspace's single data entry point.
 *
 * Returns the most recent run from the backend, or the seeded fixture when the
 * backend is unreachable.
 */
export async function loadWorkspace(): Promise<WorkspaceData> {
  const run = await request<Run>("/api/runs/latest");
  if (!run || !run.moments?.length) return seedWorkspace();
  return toWorkspace(run);
}

export async function health() {
  return request<{ ok: boolean; mode: string; model: string | null }>("/api/health");
}

export async function startRun(contentId = "vid_100saas") {
  return request<{ accepted: boolean }>("/api/runs", {
    method: "POST",
    body: JSON.stringify({ contentId }),
  });
}

export async function decideAsset(
  runId: string,
  assetId: string,
  decision: "approved" | "rejected",
) {
  return request<{ ok: boolean }>(`/api/runs/${runId}/assets/${assetId}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}

export async function resumeRun(runId: string) {
  return request<Run>(`/api/runs/${runId}/resume`, { method: "POST" });
}

/** URL for the SSE activity stream; the terminal subscribes to it directly. */
export function eventStreamUrl(runId: string) {
  // Consumed by EventSource in the browser, so it always uses the browser base.
  return `${BROWSER_API_URL}/api/runs/${runId}/events`;
}
