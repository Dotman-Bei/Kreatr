"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  CornerUpLeft,
  Quote,
  ShieldAlert,
  Timer,
  TrendingDown,
  X,
} from "lucide-react";
import type { Moment } from "@/lib/mockData";
import { Badge } from "@/components/ui/Badge";
import { ScoreDial, SignalBars } from "@/components/ui/Meters";
import { cn } from "@/lib/utils";

const HOOK_THRESHOLD = 60;

const classMeta = {
  "weak-hook": { label: "Weak hook", Icon: TrendingDown, tone: "rejected" as const },
  "low-relevance": { label: "Low relevance", Icon: AlertTriangle, tone: "rejected" as const },
  escalated: { label: "Escalated to creator", Icon: ShieldAlert, tone: "pending" as const },
};

/**
 * The rejection card is the product's whole argument, so it is built as a
 * component rather than an image: live sub-scores, a pass threshold, and the
 * transcript the agent actually judged.
 */
export function RejectionCard({
  moment,
  compact = false,
  className,
}: {
  moment: Moment;
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [overridden, setOverridden] = useState(false);
  const meta = classMeta[moment.rejectionClass ?? "weak-hook"];
  const escalated = moment.rejectionClass === "escalated";

  if (compact) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-2xl border-[1.5px] border-black bg-white shadow-neo",
          className,
        )}
      >
        <div className="flex items-center gap-2 border-b-[1.5px] border-black bg-status-rejected px-3 py-2 text-white">
          <X className="h-3.5 w-3.5" strokeWidth={3} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
            Rejected moment ({moment.start} - {moment.end})
          </span>
        </div>
        <div className="space-y-2.5 p-3">
          <p className="text-[13px] font-bold leading-snug text-zinc-400 line-through decoration-red-400 decoration-2">
            {moment.hook}
          </p>
          <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wider">
            <span className="text-zinc-500">Hook score</span>
            <span className="font-bold text-status-rejected">{moment.score}/100</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full animate-grow-bar rounded-full bg-status-rejected"
              style={{ width: `${moment.score}%` }}
            />
          </div>
          <p className="text-[11px] font-medium leading-snug text-zinc-600">
            <span className="font-bold text-zinc-900">Reason:</span> {moment.rejectionReason}
          </p>
        </div>
      </div>
    );
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border-2 border-black bg-white shadow-neo transition-shadow",
        overridden && "opacity-90",
        className,
      )}
    >
      {/* Header */}
      <header
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b-2 border-black px-4 py-3 text-white sm:px-5",
          escalated ? "bg-status-pending" : "bg-status-rejected",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/25">
            <X className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
            Rejected · {moment.start} - {moment.end}
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider">
          <meta.Icon className="h-3 w-3" />
          {meta.label}
        </span>
      </header>

      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold leading-snug text-zinc-400 line-through decoration-red-400 decoration-2">
              {moment.hook}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">
                <Timer className="h-3 w-3" />
                {moment.lengthSeconds}s
              </Badge>
              <Badge tone="outline">{moment.topic}</Badge>
            </div>
          </div>
          <ScoreDial value={moment.score} tone={escalated ? "pending" : "rejected"} caption="Score" />
        </div>

        {/* Verdict */}
        <div
          className={cn(
            "mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3",
            escalated
              ? "border-amber-300 bg-status-pendingBg"
              : "border-red-200 bg-status-rejectedBg",
          )}
        >
          <meta.Icon
            className={cn("mt-0.5 h-4 w-4 shrink-0", escalated ? "text-amber-600" : "text-red-500")}
          />
          <p className="text-[13px] font-semibold leading-snug text-zinc-800">
            {moment.rejectionReason}
          </p>
        </div>

        {/* Sub-scores against the pass threshold */}
        <div className="mt-4">
          <div className="mb-2.5 flex items-baseline justify-between">
            <span className="eyebrow text-zinc-500">Scoring signals</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              Pass line {HOOK_THRESHOLD}
            </span>
          </div>
          <SignalBars
            signals={moment.signals}
            tone={escalated ? "pending" : "rejected"}
            threshold={HOOK_THRESHOLD}
          />
        </div>

        {/* Expandable rationale */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="mt-4 flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-left transition-colors hover:bg-zinc-100"
        >
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Agent rationale · {moment.reasons.length} points
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-zinc-500 transition-transform", open && "rotate-180")}
          />
        </button>

        {open ? (
          <div className="animate-fade-up space-y-3 pt-3">
            <ul className="space-y-2">
              {moment.reasons.map((reason) => (
                <li key={reason} className="flex gap-2.5 text-[13px] leading-relaxed text-zinc-600">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {reason}
                </li>
              ))}
            </ul>
            <figure className="rounded-xl border border-zinc-200 bg-white p-3.5">
              <Quote className="mb-1.5 h-3.5 w-3.5 text-zinc-300" />
              <blockquote className="font-mono text-[11px] leading-relaxed text-zinc-500">
                {moment.transcript}
              </blockquote>
            </figure>
          </div>
        ) : null}

        {/* Creator override */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
            {overridden ? "Restored to the shortlist" : "You can overrule the agent"}
          </span>
          <button
            type="button"
            onClick={() => setOverridden((prev) => !prev)}
            className={cn(
              "neo-press inline-flex items-center gap-1.5 rounded-full border-2 border-black px-3.5 py-1.5 text-[11px] font-bold shadow-neo-sm",
              overridden ? "bg-lime-custom text-black" : "bg-white text-black hover:bg-zinc-100",
            )}
          >
            <CornerUpLeft className="h-3.5 w-3.5" />
            {overridden ? "Kept anyway" : "Override & keep"}
          </button>
        </div>
      </div>
    </article>
  );
}
