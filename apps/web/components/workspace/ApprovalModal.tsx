"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  Check,
  CircleCheckBig,
  Loader2,
  Pencil,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import type { Asset } from "@/lib/mockData";
import { ConfidenceBar } from "@/components/ui/Meters";
import { cn } from "@/lib/utils";

type Step = {
  tool: string;
  label: string;
  kind: "ok" | "error" | "retry";
};

/** The X connector fails once on purpose so the recovery loop is visible. */
function stepsFor(asset: Asset): Step[] {
  const schedule: Step = {
    tool: "schedule_asset",
    label: `Reserving slot · ${asset.scheduledFor}`,
    kind: "ok",
  };
  const publish: Step = {
    tool: "publish_asset",
    label: `Dispatching to the ${asset.platform} connector`,
    kind: "ok",
  };
  const verify: Step = {
    tool: "verify_publish_result",
    label: "Confirming published state",
    kind: "ok",
  };

  if (asset.id === "a_x_flywheel") {
    return [
      schedule,
      { tool: "publish_asset", label: "Connector timeout (HTTP 504) · attempt 1 of 3", kind: "error" },
      { tool: "publish_asset", label: "Retrying with backoff · attempt 2 of 3", kind: "retry" },
      verify,
    ];
  }

  return [schedule, publish, verify];
}

export function ApprovalModal({
  asset,
  onClose,
  onApproved,
  onRejected,
}: {
  asset: Asset;
  onClose: () => void;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
}) {
  const [phase, setPhase] = useState<"review" | "executing" | "verified">("review");
  const [stepIndex, setStepIndex] = useState(0);
  const steps = stepsFor(asset);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (phase !== "executing") return;
    if (stepIndex >= steps.length) {
      const id = window.setTimeout(() => {
        setPhase("verified");
        onApproved(asset.id);
      }, 500);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setStepIndex((n) => n + 1), 850);
    return () => window.clearTimeout(id);
  }, [phase, stepIndex, steps.length, asset.id, onApproved]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Approval required"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-fade-up max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-black bg-white shadow-neo-xl">
        {/* Header */}
        <header
          className={cn(
            "flex items-start justify-between gap-3 border-b-2 border-black px-5 py-4",
            phase === "review" ? "bg-status-pending" : "bg-lime-custom",
          )}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                phase === "review" ? "bg-black/25 text-white" : "bg-black text-lime-custom",
              )}
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div>
              <p
                className={cn(
                  "text-base font-extrabold leading-tight tracking-tight",
                  phase === "review" ? "text-white" : "text-black",
                )}
              >
                {phase === "review" ? "Kreatr wants your approval" : "Approved by you"}
              </p>
              <p
                className={cn(
                  "font-mono text-[10px] uppercase tracking-wider",
                  phase === "review" ? "text-white/70" : "text-black/60",
                )}
              >
                Human-in-the-loop · public action
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "rounded-full p-1.5 transition-colors hover:bg-black/20",
              phase === "review" ? "text-white/80 hover:text-white" : "text-black/60 hover:text-black",
            )}
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </header>

        <div className="p-5">
          {phase === "review" ? (
            <>
              <p className="text-lg font-extrabold leading-snug tracking-tight text-black">
                Publish this {asset.type} on {asset.scheduledFor}?
              </p>

              <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {asset.title}
                </p>
                <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-zinc-700">
                  {asset.body}
                </p>
              </div>

              <div className="mt-4">
                <ConfidenceBar value={asset.confidence} label="Agent confidence" tone="approved" />
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-200 bg-status-approvedBg p-4">
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                  Why Kreatr picked this
                </p>
                <ul className="space-y-1.5">
                  {asset.rationale.map((reason) => (
                    <li key={reason} className="flex gap-2 text-[13px] leading-snug text-zinc-700">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setPhase("executing")}
                  className="neo-press flex-1 rounded-xl border-2 border-black bg-lime-custom py-3 text-sm font-extrabold text-black shadow-neo-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4" strokeWidth={3} />
                    Approve &amp; Schedule
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="neo-press rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-extrabold text-black shadow-neo-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    Quick Edit
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRejected(asset.id);
                    onClose();
                  }}
                  className="neo-press rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-extrabold text-status-rejected shadow-neo-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    <X className="h-4 w-4" strokeWidth={3} />
                    Reject
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-extrabold leading-snug tracking-tight text-black">
                {phase === "verified" ? "Action executed and verified" : "Executing approved action"}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {asset.type} · {asset.platform}
              </p>

              <ol className="mt-5 space-y-2.5">
                {steps.map((step, index) => {
                  const done = index < stepIndex || phase === "verified";
                  const current = index === stepIndex && phase === "executing";
                  const pending = index > stepIndex && phase === "executing";
                  const failed = step.kind === "error" && (done || current);

                  return (
                    <li
                      key={`${step.tool}-${index}`}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors",
                        failed
                          ? "border-red-200 bg-status-rejectedBg"
                          : done
                            ? "border-emerald-200 bg-status-approvedBg"
                            : current
                              ? "border-black bg-white"
                              : "border-zinc-200 bg-zinc-50",
                        pending && "opacity-50",
                      )}
                    >
                      <span className="mt-0.5 shrink-0">
                        {failed ? (
                          <TriangleAlert className="h-4 w-4 text-red-500" />
                        ) : done ? (
                          <CircleCheckBig className="h-4 w-4 text-emerald-600" />
                        ) : current ? (
                          <Loader2 className="h-4 w-4 animate-spin text-black" />
                        ) : (
                          <span className="block h-4 w-4 rounded-full border-2 border-zinc-300" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-[11px] font-bold text-black">
                          {step.tool}()
                        </span>
                        <span
                          className={cn(
                            "block text-[12px] leading-snug",
                            failed ? "text-red-600" : "text-zinc-600",
                          )}
                        >
                          {step.label}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>

              {phase === "verified" ? (
                <div className="animate-fade-up mt-5">
                  <div className="flex items-center gap-3 rounded-2xl border-2 border-black bg-lime-custom p-4">
                    <CalendarClock className="h-5 w-5 shrink-0" />
                    <p className="text-[13px] font-bold leading-snug text-black">
                      Scheduled for {asset.scheduledFor} and verified live by the agent.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="neo-press mt-4 w-full rounded-xl border-2 border-black bg-black py-3 text-sm font-extrabold text-lime-custom shadow-neo-sm"
                  >
                    Done
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
