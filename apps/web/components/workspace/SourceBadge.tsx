import { Database, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * States plainly whether the screen is showing a real agent run or the seeded
 * fixture. The workspace should never leave that ambiguous.
 */
export function SourceBadge({
  source,
  mode,
  runId,
  className,
}: {
  source: "api" | "seed";
  mode?: string;
  runId?: string | null;
  className?: string;
}) {
  const live = source === "api";
  const label = live
    ? mode === "replay"
      ? "Backend · replay run"
      : "Live agent run"
    : "Seeded demo data";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider",
        live
          ? "border-emerald-600 bg-status-approvedBg text-emerald-700"
          : "border-zinc-300 bg-zinc-100 text-zinc-500",
        className,
      )}
      title={runId ? `run ${runId}` : "Backend not reachable — showing the seeded fixture"}
    >
      {live ? <Radio className="h-3 w-3" /> : <Database className="h-3 w-3" />}
      {label}
    </span>
  );
}
