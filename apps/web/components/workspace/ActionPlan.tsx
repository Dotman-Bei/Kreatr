"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  CalendarClock,
  Check,
  CircleCheckBig,
  Mail,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Tag,
  TriangleAlert,
  X,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { assets as fixtureAssets, type ActionClass, type Asset } from "@/lib/mockData";
import { decideAsset, resumeRun } from "@/lib/api";
import { ApprovalModal } from "@/components/workspace/ApprovalModal";
import { Badge } from "@/components/ui/Badge";
import { ConfidenceBar } from "@/components/ui/Meters";
import { cn } from "@/lib/utils";

/** X has no Lucide glyph, so the logo is inlined. */
function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const platformIcons: Record<Asset["icon"], LucideIcon | typeof XLogo> = {
  youtube: Youtube,
  x: XLogo,
  mail: Mail,
  tag: Tag,
};

const classMeta: Record<ActionClass, { label: string; icon: LucideIcon; tone: string }> = {
  auto: { label: "Auto", icon: Bot, tone: "border-zinc-300 bg-zinc-100 text-zinc-600" },
  approval: {
    label: "Approval required",
    icon: ShieldCheck,
    tone: "border-amber-400 bg-status-pendingBg text-amber-700",
  },
  escalate: {
    label: "Escalated",
    icon: ShieldAlert,
    tone: "border-red-300 bg-status-rejectedBg text-red-600",
  },
};

type Decision = "pending" | "approved" | "rejected";

export function ActionPlan({
  assets: seedAssets = fixtureAssets,
  runId = null,
}: {
  assets?: Asset[];
  /** Present when a live backend run is driving this screen. */
  runId?: string | null;
}) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() =>
    Object.fromEntries(
      seedAssets.map((asset) => [
        asset.id,
        asset.actionClass === "auto" || asset.status === "published" ? "approved" : "pending",
      ]),
    ),
  );
  const [modalAsset, setModalAsset] = useState<Asset | null>(null);

  /** Mirror the decision to the backend when one is driving this screen. */
  const persist = (assetId: string, decision: Decision) => {
    if (!runId || decision === "pending") return;
    void decideAsset(runId, assetId, decision).then(() => resumeRun(runId));
  };

  const counts = useMemo(() => {
    const values = Object.entries(decisions).filter(
      ([id]) => seedAssets.find((a) => a.id === id)?.actionClass !== "auto",
    );
    return {
      pending: values.filter(([, d]) => d === "pending").length,
      approved: values.filter(([, d]) => d === "approved").length,
      rejected: values.filter(([, d]) => d === "rejected").length,
    };
  }, [decisions]);

  const setDecision = (id: string, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
    persist(id, decision);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2 text-zinc-500">Content action plan</p>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {seedAssets.length} assets prepared, {counts.pending} awaiting you
              </h2>
            </div>
            {counts.pending > 0 ? (
              <button
                type="button"
                onClick={() =>
                  setDecisions((prev) => {
                    const next = Object.fromEntries(
                      Object.entries(prev).map(([id, d]) => [id, d === "pending" ? "approved" : d]),
                    ) as Record<string, Decision>;
                    Object.entries(prev)
                      .filter(([, d]) => d === "pending")
                      .forEach(([id]) => persist(id, "approved"));
                    return next;
                  })
                }
                className="neo-press inline-flex items-center gap-2 rounded-full border-2 border-black bg-lime-custom px-5 py-2.5 text-sm font-extrabold shadow-neo-sm"
              >
                <Check className="h-4 w-4" strokeWidth={3} />
                Approve all {counts.pending}
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-5 py-2.5 text-sm font-extrabold shadow-neo-sm">
                <CircleCheckBig className="h-4 w-4 text-emerald-600" />
                Plan resolved
              </span>
            )}
          </div>

          <div className="space-y-5">
            {seedAssets.map((asset, index) => {
              const Icon = platformIcons[asset.icon];
              const decision = decisions[asset.id];
              const meta = classMeta[asset.actionClass];

              return (
                <article
                  key={asset.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border-2 border-black bg-white shadow-neo transition-opacity",
                    decision === "rejected" && "opacity-60",
                  )}
                >
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black px-4 py-3 sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-black text-lime-custom">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold tracking-tight">
                          {index + 1}. {asset.type}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                          from {asset.sourceMomentId}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider",
                          meta.tone,
                        )}
                      >
                        <meta.icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                      {decision === "approved" ? (
                        <Badge tone="approved">
                          <Check className="h-3 w-3" strokeWidth={3} />
                          {asset.actionClass === "auto" ? "Executed" : "Approved"}
                        </Badge>
                      ) : decision === "rejected" ? (
                        <Badge tone="rejected">
                          <X className="h-3 w-3" strokeWidth={3} />
                          Rejected
                        </Badge>
                      ) : (
                        <Badge tone="pending">
                          <TriangleAlert className="h-3 w-3" />
                          Waiting
                        </Badge>
                      )}
                    </div>
                  </header>

                  <div className="p-4 sm:p-5">
                    <h3 className="text-lg font-extrabold leading-snug tracking-tight text-black">
                      {asset.title}
                    </h3>
                    <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-zinc-600">
                      {asset.body}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {asset.meta.map((chip) => (
                        <span
                          key={chip.label}
                          className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 font-mono text-[10px] text-zinc-600"
                        >
                          <span className="uppercase tracking-wider text-zinc-400">
                            {chip.label}:
                          </span>{" "}
                          <span className="font-bold text-zinc-700">{chip.value}</span>
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <ConfidenceBar
                        value={asset.confidence}
                        label="Confidence"
                        tone={asset.confidence >= 85 ? "approved" : "pending"}
                      />
                      <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-600">
                        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        {asset.scheduledFor}
                      </div>
                    </div>

                    <ul className="mt-4 space-y-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3">
                      {asset.rationale.map((reason) => (
                        <li
                          key={reason}
                          className="flex gap-2 text-[12.5px] leading-snug text-zinc-600"
                        >
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-lime-custom ring-1 ring-black/20" />
                          {reason}
                        </li>
                      ))}
                    </ul>

                    {asset.actionClass === "auto" ? (
                      <p className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-3 font-mono text-[11px] text-zinc-500">
                        <Bot className="h-3.5 w-3.5 shrink-0" />
                        Reversible and non-public, so Kreatr executed this without asking.
                      </p>
                    ) : (
                      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => setModalAsset(asset)}
                          disabled={decision === "approved"}
                          className={cn(
                            "neo-press flex-1 rounded-xl border-2 border-black py-3 text-sm font-extrabold shadow-neo-sm",
                            decision === "approved"
                              ? "pointer-events-none bg-status-approvedBg text-emerald-700"
                              : "bg-lime-custom text-black",
                          )}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Check className="h-4 w-4" strokeWidth={3} />
                            {decision === "approved" ? "Approved & scheduled" : "Approve & Schedule"}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="neo-press rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-extrabold shadow-neo-sm"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Pencil className="h-4 w-4" />
                            Quick Edit
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDecision(asset.id, decision === "rejected" ? "pending" : "rejected")
                          }
                          className="neo-press rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-extrabold text-status-rejected shadow-neo-sm"
                        >
                          <span className="inline-flex items-center gap-2">
                            <X className="h-4 w-4" strokeWidth={3} />
                            {decision === "rejected" ? "Undo" : "Reject Asset"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:col-span-4">
          <section className="rounded-2xl border-2 border-black bg-[#0A0A0A] p-5 text-white shadow-neo">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-tight">
              <ShieldCheck className="h-4 w-4 text-lime-custom" />
              Gatekeeper status
            </h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Waiting", value: counts.pending, tone: "text-status-pending" },
                { label: "Approved", value: counts.approved, tone: "text-lime-custom" },
                { label: "Rejected", value: counts.rejected, tone: "text-red-400" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-zinc-800 bg-surface-cardDark p-3">
                  <p className={cn("font-mono text-xl font-extrabold tabular-nums", stat.tone)}>
                    {stat.value}
                  </p>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-zinc-800 pt-3 text-[12px] leading-relaxed text-zinc-400">
              Kreatr never publishes a public asset on its own. Everything reversible already ran.
            </p>
          </section>

          <section className="rounded-2xl border-2 border-black bg-white p-5 shadow-neo">
            <h2 className="mb-4 text-sm font-extrabold uppercase tracking-tight">Action classes</h2>
            <ul className="space-y-3">
              {(
                [
                  { key: "auto", body: "Organise assets, draft metadata, analyse performance." },
                  { key: "approval", body: "Publish a Short, post publicly, send a newsletter." },
                  { key: "escalate", body: "Low confidence, sponsor content, failed publish." },
                ] as const
              ).map((row) => {
                const meta = classMeta[row.key];
                return (
                  <li key={row.key} className="flex gap-3">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                        meta.tone,
                      )}
                    >
                      <meta.icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-[13px] font-extrabold tracking-tight">
                        {meta.label}
                      </span>
                      <span className="block text-[12px] leading-snug text-zinc-500">{row.body}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>

      {modalAsset ? (
        <ApprovalModal
          asset={modalAsset}
          onClose={() => setModalAsset(null)}
          onApproved={(id) => setDecision(id, "approved")}
          onRejected={(id) => setDecision(id, "rejected")}
        />
      ) : null}
    </>
  );
}
