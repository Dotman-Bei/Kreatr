"use client";

import { useState } from "react";
import { Check, ChevronDown, Play, Quote, Sparkles, Timer } from "lucide-react";
import type { Moment } from "@/lib/mockData";
import { Badge } from "@/components/ui/Badge";
import { ScoreDial, SignalBars } from "@/components/ui/Meters";
import { cn } from "@/lib/utils";

export function MomentCard({
  moment,
  rank,
  onPreview,
  active = false,
}: {
  moment: Moment;
  rank: number;
  onPreview?: (id: string) => void;
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border-2 border-black bg-white shadow-neo transition-all",
        active && "ring-4 ring-lime-custom",
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black bg-lime-custom px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black">
            <Check className="h-3.5 w-3.5 text-lime-custom" strokeWidth={3.5} />
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-black">
            Selected #{rank} · {moment.start} - {moment.end}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onPreview?.(moment.id)}
          className="flex items-center gap-1.5 rounded-full bg-black px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-lime-custom transition-transform hover:scale-105"
        >
          <Play className="h-3 w-3 fill-lime-custom" />
          Preview
        </button>
      </header>

      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold leading-snug tracking-tight text-black">
              &ldquo;{moment.hook}&rdquo;
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">
                <Timer className="h-3 w-3" />
                {moment.lengthSeconds}s
              </Badge>
              <Badge tone="outline">{moment.topic}</Badge>
              {moment.platforms.map((platform) => (
                <Badge key={platform} tone="approved">
                  <Sparkles className="h-3 w-3" />
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
          <ScoreDial value={moment.score} tone="approved" caption="Score" />
        </div>

        <ul className="mt-4 space-y-2 rounded-xl border border-emerald-200 bg-status-approvedBg px-3.5 py-3">
          {moment.reasons.map((reason) => (
            <li key={reason} className="flex gap-2.5 text-[13px] font-medium leading-snug text-zinc-700">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />
              {reason}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="mt-4 flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-left transition-colors hover:bg-zinc-100"
        >
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Scoring signals & transcript
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-zinc-500 transition-transform", open && "rotate-180")}
          />
        </button>

        {open ? (
          <div className="animate-fade-up space-y-4 pt-4">
            <SignalBars signals={moment.signals} tone="approved" threshold={60} />
            <figure className="rounded-xl border border-zinc-200 bg-white p-3.5">
              <Quote className="mb-1.5 h-3.5 w-3.5 text-zinc-300" />
              <blockquote className="font-mono text-[11px] leading-relaxed text-zinc-500">
                {moment.transcript}
              </blockquote>
            </figure>
          </div>
        ) : null}
      </div>
    </article>
  );
}
