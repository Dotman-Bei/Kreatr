"use client";

import { useState } from "react";
import { BrainCircuit, Check, Layers, Maximize2, Sparkles, X } from "lucide-react";
import { VideoTimeline } from "@/components/workspace/VideoTimeline";
import { MomentCard } from "@/components/workspace/MomentCard";
import { RejectionCard } from "@/components/workspace/RejectionCard";
import { content, creator, moments as seedMoments, type Moment } from "@/lib/mockData";
import type { RunMetrics } from "@/lib/api";
import { cn } from "@/lib/utils";

type Tab = "selected" | "rejected";

export function MomentInspector({
  moments = seedMoments,
  metrics,
}: {
  moments?: Moment[];
  metrics: RunMetrics;
}) {
  const [tab, setTab] = useState<Tab>("selected");
  const [activeId, setActiveId] = useState<string | null>(null);

  const selectedMoments = moments.filter((m) => m.status === "selected");
  const rejectedMoments = moments.filter((m) => m.status === "rejected");

  const handleSelectMoment = (id: string) => {
    const moment = moments.find((m) => m.id === id);
    if (!moment) return;
    setTab(moment.status === "selected" ? "selected" : "rejected");
    setActiveId(id);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="lg:col-span-8">
        {/* Player */}
        <div className="overflow-hidden rounded-3xl border-2 border-black bg-[#0A0A0A] shadow-neo">
          <div className="relative aspect-[16/8]">
            <img
              src={content.poster}
              alt="Multi-track editing timeline from the source video"
              className="h-full w-full object-cover opacity-70"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />

            <div className="absolute left-4 top-4 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-lime-custom backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-custom" />
                Analysis complete
              </span>
              <span className="hidden rounded-full bg-black/70 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-300 backdrop-blur-sm sm:inline-block">
                {content.transcriptWords.toLocaleString()} words transcribed
              </span>
            </div>

            <button
              type="button"
              aria-label="Expand preview"
              className="absolute right-4 top-4 rounded-full bg-black/70 p-2 text-zinc-300 backdrop-blur-sm transition-colors hover:text-white"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>

            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-lg font-extrabold tracking-tight text-white">{content.title}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                {content.uploadedAt} · {content.duration}
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 p-4 sm:p-5">
            <VideoTimeline
              durationSeconds={content.durationSeconds}
              moments={moments}
              activeMomentId={activeId}
              onSelectMoment={handleSelectMoment}
              className="border-none bg-transparent p-0"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex items-center gap-2">
          {(
            [
              { key: "selected", label: "Selected", count: selectedMoments.length, icon: Check },
              { key: "rejected", label: "Rejected", count: rejectedMoments.length, icon: X },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              aria-pressed={tab === item.key}
              className={cn(
                "neo-press inline-flex items-center gap-2 rounded-full border-2 border-black px-4 py-2 text-sm font-bold shadow-neo-sm",
                tab === item.key
                  ? item.key === "selected"
                    ? "bg-lime-custom text-black"
                    : "bg-status-rejected text-white"
                  : "bg-white text-black hover:bg-zinc-100",
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={3} />
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-mono text-[9px]",
                  tab === item.key ? "bg-black/20" : "bg-zinc-200",
                )}
              >
                {item.count}
              </span>
            </button>
          ))}
          <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-widest text-zinc-400 sm:block">
            {metrics.candidateMoments} raw · {metrics.analysed} analysed
          </span>
        </div>

        {/* Moment list */}
        <div className="mt-5 space-y-5">
          {tab === "selected"
            ? selectedMoments.map((moment, index) => (
                <MomentCard
                  key={moment.id}
                  moment={moment}
                  rank={index + 1}
                  active={activeId === moment.id}
                  onPreview={setActiveId}
                />
              ))
            : rejectedMoments.map((moment) => (
                <RejectionCard
                  key={moment.id}
                  moment={moment}
                  className={cn(activeId === moment.id && "ring-4 ring-red-300")}
                />
              ))}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-5 lg:col-span-4">
        <section className="rounded-2xl border-2 border-black bg-white p-5 shadow-neo">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <h2 className="text-sm font-extrabold uppercase tracking-tight">Selection funnel</h2>
          </div>
          <ol className="space-y-3">
            {[
              {
                label: "Raw segments",
                value: metrics.candidateMoments,
                width: "100%",
                tone: "bg-zinc-200",
              },
              {
                label: "Deep-analysed",
                value: metrics.analysed,
                width: `${Math.round((metrics.analysed / Math.max(1, metrics.candidateMoments)) * 100)}%`,
                tone: "bg-status-pending",
              },
              {
                label: "Selected",
                value: metrics.selected,
                width: `${Math.round((metrics.selected / Math.max(1, metrics.candidateMoments)) * 100)}%`,
                tone: "bg-lime-custom",
              },
            ].map((row) => (
              <li key={row.label}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    {row.label}
                  </span>
                  <span className="font-mono text-xs font-bold tabular-nums">{row.value}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full border border-black/10 bg-zinc-100">
                  <div
                    className={cn("h-full origin-left animate-grow-bar rounded-full", row.tone)}
                    style={{ width: row.width }}
                  />
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 border-t border-zinc-200 pt-3 text-[13px] font-medium leading-relaxed text-zinc-600">
            <span className="font-bold text-black">{metrics.rejectionRate}% rejected.</span> Not every
            moment deserves a Short.
          </p>
        </section>

        <section className="rounded-2xl border-2 border-black bg-[#0A0A0A] p-5 text-white shadow-neo">
          <div className="mb-4 flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-lime-custom" />
            <h2 className="text-sm font-extrabold uppercase tracking-tight">Creator memory</h2>
          </div>

          <dl className="space-y-3.5">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                Audience
              </dt>
              <dd className="mt-0.5 text-sm font-semibold">{creator.audience}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Tone</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {creator.tone.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-zinc-700 px-2 py-0.5 font-mono text-[10px] text-zinc-300"
                  >
                    {item}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                Strong topics
              </dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {creator.historicalPatterns.strongTopics.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-lime-custom px-2 py-0.5 font-mono text-[10px] font-bold text-black"
                  >
                    {item}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                Weak topics
              </dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {creator.historicalPatterns.weakTopics.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] text-red-300 line-through"
                  >
                    {item}
                  </span>
                ))}
              </dd>
            </div>
          </dl>

          <p className="mt-4 flex gap-2 border-t border-zinc-800 pt-3 text-[12px] leading-relaxed text-zinc-400">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-custom" />
            Memory re-ranked the shortlist: the pricing moment was promoted above the outreach moment
            on historical fit.
          </p>
        </section>
      </aside>
    </div>
  );
}
