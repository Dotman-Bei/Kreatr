"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Scissors, SkipBack, Volume2 } from "lucide-react";
import type { Moment } from "@/lib/mockData";
import { cn, toStamp } from "@/lib/utils";

/**
 * Deterministic pseudo-waveform. Seeded by bar index so the server and client
 * render identical markup (a Math.random() waveform would hydrate-mismatch).
 */
function amplitudeAt(index: number) {
  const wobble =
    Math.sin(index * 0.7) * 0.28 +
    Math.sin(index * 0.21 + 1.3) * 0.24 +
    Math.sin(index * 1.93 + 0.4) * 0.16;
  return 0.34 + Math.abs(wobble) + (index % 7 === 0 ? 0.12 : 0);
}

type Props = {
  durationSeconds: number;
  moments: Moment[];
  /** Compact variant used inside the hero polaroid card. */
  compact?: boolean;
  activeMomentId?: string | null;
  onSelectMoment?: (momentId: string) => void;
  className?: string;
};

export function VideoTimeline({
  durationSeconds,
  moments,
  compact = false,
  activeMomentId = null,
  onSelectMoment,
  className,
}: Props) {
  const barCount = compact ? 56 : 132;
  const [playhead, setPlayhead] = useState(compact ? 522 : 0);
  const [playing, setPlaying] = useState(compact);
  const [hoverSeconds, setHoverSeconds] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const bars = useMemo(
    () => Array.from({ length: barCount }, (_, i) => ({ i, amp: amplitudeAt(i) })),
    [barCount],
  );

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setPlayhead((prev) => (prev + durationSeconds / 260) % durationSeconds);
    }, 90);
    return () => window.clearInterval(id);
  }, [playing, durationSeconds]);

  const secondsFromEvent = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return ratio * durationSeconds;
    },
    [durationSeconds],
  );

  // Fixed precision keeps the server and client markup byte-identical (React
  // serialises floats differently on each side otherwise).
  const pct = (seconds: number) => `${((seconds / durationSeconds) * 100).toFixed(3)}%`;

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#0A0A0A] text-white",
        compact ? "p-3" : "p-4 sm:p-5",
        className,
      )}
    >
      {/* Transport controls */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause preview" : "Play preview"}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-custom text-black transition-transform hover:scale-110"
          >
            {playing ? <Pause className="h-3.5 w-3.5 fill-black" /> : <Play className="h-3.5 w-3.5 fill-black" />}
          </button>
          {!compact ? (
            <button
              type="button"
              onClick={() => setPlayhead(0)}
              aria-label="Back to start"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:text-white"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <span className="ml-1 font-mono text-xs font-bold tabular-nums text-lime-custom">
            {toStamp(playhead)}
          </span>
          <span className="font-mono text-xs tabular-nums text-zinc-500">/ {toStamp(durationSeconds)}</span>
        </div>

        <div className="flex items-center gap-2">
          {!compact ? (
            <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500 sm:flex">
              <Scissors className="h-3 w-3" />
              {moments.length} candidates
            </span>
          ) : null}
          <Volume2 className="h-3.5 w-3.5 text-zinc-600" />
        </div>
      </div>

      {/* Waveform track */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Video scrubber"
        aria-valuemin={0}
        aria-valuemax={durationSeconds}
        aria-valuenow={Math.round(playhead)}
        aria-valuetext={toStamp(playhead)}
        onClick={(e) => setPlayhead(secondsFromEvent(e.clientX))}
        onMouseMove={(e) => setHoverSeconds(secondsFromEvent(e.clientX))}
        onMouseLeave={() => setHoverSeconds(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setPlayhead((p) => Math.min(durationSeconds, p + 5));
          if (e.key === "ArrowLeft") setPlayhead((p) => Math.max(0, p - 5));
        }}
        className={cn(
          "group relative w-full cursor-pointer select-none overflow-hidden rounded-lg bg-white/[0.03]",
          compact ? "h-12" : "h-20 sm:h-24",
        )}
      >
        {/* Moment regions */}
        {moments.map((moment) => (
          <button
            key={moment.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPlayhead(moment.startSeconds);
              onSelectMoment?.(moment.id);
            }}
            title={`${moment.start} ${moment.topic}`}
            aria-label={`Jump to ${moment.topic} at ${moment.start}`}
            className={cn(
              "absolute inset-y-0 z-10 border-x transition-colors",
              moment.status === "selected"
                ? "border-lime-custom/70 bg-lime-custom/[0.14] hover:bg-lime-custom/25"
                : "border-red-500/50 bg-red-500/[0.10] hover:bg-red-500/20",
              activeMomentId === moment.id &&
                (moment.status === "selected" ? "bg-lime-custom/30" : "bg-red-500/25"),
            )}
            style={{
              left: pct(moment.startSeconds),
              width: pct(moment.endSeconds - moment.startSeconds),
            }}
          />
        ))}

        {/* Bars */}
        <div className="absolute inset-0 flex items-center gap-[2px] px-[2px]">
          {bars.map(({ i, amp }) => {
            const barSeconds = (i / barCount) * durationSeconds;
            const inMoment = moments.find(
              (m) => barSeconds >= m.startSeconds && barSeconds <= m.endSeconds,
            );
            const played = barSeconds <= playhead;
            return (
              <span
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-colors duration-200",
                  inMoment?.status === "selected"
                    ? "bg-lime-custom"
                    : inMoment?.status === "rejected"
                      ? "bg-red-500/70"
                      : played
                        ? "bg-zinc-400"
                        : "bg-zinc-700",
                )}
                style={{ height: `${Math.min(96, amp * 78).toFixed(2)}%` }}
              />
            );
          })}
        </div>

        {/* Hover ghost playhead */}
        {hoverSeconds !== null ? (
          <div
            className="pointer-events-none absolute inset-y-0 z-20 w-px bg-white/30"
            style={{ left: pct(hoverSeconds) }}
          />
        ) : null}

        {/* Playhead */}
        <div
          className="pointer-events-none absolute inset-y-0 z-30 w-[2px] bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
          style={{ left: pct(playhead) }}
        >
          <span className="absolute -top-0.5 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
        </div>
      </div>

      {/* Ruler (full variant only — the polaroid card stays compact) */}
      {!compact ? (
        <div className="mt-2 flex items-center justify-between font-mono text-[9px] tabular-nums text-zinc-600">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i}>{toStamp((i * durationSeconds) / 8)}</span>
          ))}
        </div>
      ) : null}

      {/* Legend */}
      {!compact ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-3">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-lime-custom" /> Selected
          </span>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-500/70" /> Rejected
          </span>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-zinc-700" /> Not repurposed
          </span>
          <span className="ml-auto hidden font-mono text-[10px] text-zinc-600 sm:block">
            Click a region to inspect
          </span>
        </div>
      ) : null}
    </div>
  );
}
