"use client";

import { CalendarClock, Check, CircleCheck, Clapperboard, Mail, Sparkles } from "lucide-react";
import { VideoTimeline } from "@/components/workspace/VideoTimeline";
import { RejectionCard } from "@/components/workspace/RejectionCard";
import { moments } from "@/lib/mockData";
import { scenes } from "@/lib/images";
import { cn } from "@/lib/utils";

const rejected = moments.find((m) => m.id === "m_origin")!;
const heroMoments = moments.filter((m) => ["m_outreach", "m_pricing", "m_origin"].includes(m.id));

/* ---------------------------------------------------------------- */
/* Card 1 — source video + live scrubber                             */
/* ---------------------------------------------------------------- */

function SourceVideoCard() {
  return (
    <div className="overflow-hidden rounded-2xl border-[1.5px] border-black bg-white p-2 shadow-neo-lg">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-zinc-900">
        <img
          src={scenes.creatorDesk}
          alt="Creator desk with a studio microphone and an editing timeline on screen"
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/75 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-lime-custom backdrop-blur-sm">
          <Clapperboard className="h-3 w-3" />
          Source
        </span>
        <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-white">
          24:12
        </span>
      </div>

      <div className="px-1.5 pb-1 pt-2.5">
        <p className="truncate text-[13px] font-extrabold tracking-tight text-black">
          Source Video: SaaS Growth.mp4
        </p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          14 candidates · 3 kept
        </p>
      </div>

      <VideoTimeline
        durationSeconds={1452}
        moments={heroMoments}
        compact
        className="mt-2 border-black/10"
      />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Card 3 — selected short                                           */
/* ---------------------------------------------------------------- */

function SelectedShortCard() {
  return (
    <div className="overflow-hidden rounded-2xl border-[1.5px] border-black bg-white shadow-neo-lg">
      <div className="flex items-center gap-2 border-b-[1.5px] border-black bg-lime-custom px-3 py-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black">
          <Check className="h-3 w-3 text-lime-custom" strokeWidth={3.5} />
        </span>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-black">
          High-value short
        </span>
        <span className="ml-auto font-mono text-[10px] font-bold tabular-nums text-black/70">
          08:42-09:21
        </span>
      </div>

      <div className="flex gap-3 p-3">
        <div className="relative h-[104px] w-[62px] shrink-0 overflow-hidden rounded-lg border border-black/10 bg-zinc-900">
          <img
            src={scenes.boomMic}
            alt="Broadcast microphone on a boom arm, framed vertically for Shorts"
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <span className="absolute bottom-1 left-1 rounded bg-black/80 px-1 font-mono text-[8px] font-bold text-white">
            9:16
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-extrabold leading-snug tracking-tight text-black">
            Pricing Psychology
          </p>
          <div className="mt-2 flex items-baseline justify-between font-mono text-[9px] uppercase tracking-wider">
            <span className="text-zinc-500">Confidence</span>
            <span className="font-bold text-emerald-600">94%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full w-[94%] animate-grow-bar rounded-full bg-status-approved" />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {["YT Shorts", "TikTok"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-zinc-300 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-zinc-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Card 4 — scheduled + awaiting approval                            */
/* ---------------------------------------------------------------- */

function ScheduledCard() {
  return (
    <div className="overflow-hidden rounded-2xl border-[1.5px] border-black bg-surface-cardDark text-white shadow-neo-lg">
      <div className="flex items-center gap-2 border-b border-white/10 px-3.5 py-2.5">
        <CalendarClock className="h-3.5 w-3.5 text-lime-custom" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
          Scheduled: X Thread + Newsletter
        </span>
      </div>

      <div className="space-y-2 p-3">
        {[
          { icon: Sparkles, label: "X Thread · Flywheel", time: "Fri 9:15 AM" },
          { icon: Mail, label: "Newsletter angle", time: "Tue 7:00 AM" },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2"
          >
            <row.icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">{row.label}</span>
            <span className="shrink-0 font-mono text-[9px] tabular-nums text-lime-custom">
              {row.time}
            </span>
          </div>
        ))}

        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-amber-400" />
            <span className="relative h-2 w-2 rounded-full bg-amber-400" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
            1-click approval pending
          </span>
        </div>

        <div className="flex items-center gap-1.5 pt-0.5 font-mono text-[9px] text-zinc-500">
          <CircleCheck className="h-3 w-3 text-emerald-500" />
          Auto-publish once approved
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Handwritten annotation                                            */
/* ---------------------------------------------------------------- */

function Annotation({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none select-none", className)}>
      {/* Arrow curves up and to the right, pointing back at the rejection card. */}
      <svg viewBox="0 0 120 64" className="ml-6 h-14 w-28 text-zinc-800" fill="none" aria-hidden>
        <path
          d="M8 60C10 34 30 14 62 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 5"
        />
        <path
          d="M48 4l15 4-6 13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="max-w-[210px] font-handwritten text-xl leading-tight text-zinc-800">
        Agent filters out bad clips automatically!
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Layouts                                                           */
/* ---------------------------------------------------------------- */

/** Absolutely positioned polaroids, xl and up only. */
export function FloatingCards() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden xl:block">
      <div className="pointer-events-auto absolute left-0 top-[64px] w-[252px] rotate-[-7deg] animate-float-slow">
        <SourceVideoCard />
      </div>

      <div className="pointer-events-auto absolute left-[22px] top-[448px] w-[252px] rotate-[6deg]">
        <RejectionCard moment={rejected} compact />
      </div>

      <Annotation className="absolute left-[40px] top-[676px] rotate-[-4deg]" />

      <div
        className="pointer-events-auto absolute right-0 top-[92px] w-[248px] rotate-[8deg] animate-float-slow"
        style={{ animationDelay: "1.2s" }}
      >
        <SelectedShortCard />
      </div>

      <div className="pointer-events-auto absolute right-[14px] top-[462px] w-[262px] rotate-[-5deg]">
        <ScheduledCard />
      </div>
    </div>
  );
}

/** Stacked grid fallback below xl, so the cards never disappear on mobile. */
export function StackedCards() {
  return (
    <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-5 px-1 sm:grid-cols-2 xl:hidden">
      <div className="rotate-[-2deg]">
        <SourceVideoCard />
      </div>
      <div className="rotate-[2deg]">
        <SelectedShortCard />
      </div>
      <div className="rotate-[1.5deg]">
        <RejectionCard moment={rejected} compact />
      </div>
      <div className="rotate-[-1.5deg]">
        <ScheduledCard />
      </div>
    </div>
  );
}
