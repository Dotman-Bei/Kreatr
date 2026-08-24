import { cn } from "@/lib/utils";

type Tone = "lime" | "approved" | "rejected" | "pending" | "dark";

const fills: Record<Tone, string> = {
  lime: "bg-lime-custom",
  approved: "bg-status-approved",
  rejected: "bg-status-rejected",
  pending: "bg-status-pending",
  dark: "bg-[#0A0A0A]",
};

const texts: Record<Tone, string> = {
  lime: "text-lime-custom",
  approved: "text-emerald-600",
  rejected: "text-red-500",
  pending: "text-amber-600",
  dark: "text-[#0A0A0A]",
};

/** Single labelled progress bar with a hard-edged neo-brutalist track. */
export function ConfidenceBar({
  value,
  label,
  tone = "approved",
  dark = false,
  className,
}: {
  value: number;
  label?: string;
  tone?: Tone;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <div className="mb-1.5 flex items-baseline justify-between">
          <span
            className={cn(
              "font-mono text-[10px] font-bold uppercase tracking-widest",
              dark ? "text-zinc-400" : "text-zinc-500",
            )}
          >
            {label}
          </span>
          <span className={cn("font-mono text-xs font-bold", dark ? "text-white" : texts[tone])}>
            {value}%
          </span>
        </div>
      ) : null}
      <div
        className={cn(
          "h-2.5 w-full overflow-hidden rounded-full border",
          dark ? "border-white/15 bg-white/5" : "border-black/15 bg-zinc-100",
        )}
      >
        <div
          className={cn("h-full origin-left rounded-full animate-grow-bar", fills[tone])}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

/** Stacked sub-score readout returned by the scoring tool. */
export function SignalBars({
  signals,
  tone = "approved",
  dark = false,
  threshold,
}: {
  signals: { label: string; value: number }[];
  tone?: Tone;
  dark?: boolean;
  /** Draws a dashed pass line, e.g. the 60-point hook threshold. */
  threshold?: number;
}) {
  return (
    <div className="space-y-2.5">
      {signals.map((signal) => {
        const scored = threshold !== undefined;
        const failing = scored && signal.value < threshold;
        // With a pass line in play, each bar reports its own verdict rather than
        // inheriting the card's overall tone.
        const fill = scored ? (failing ? fills.rejected : fills.approved) : fills[tone];
        return (
          <div key={signal.label} className="flex items-center gap-3">
            <span
              className={cn(
                "w-[112px] shrink-0 font-mono text-[10px] uppercase tracking-wider",
                dark ? "text-zinc-400" : "text-zinc-500",
              )}
            >
              {signal.label}
            </span>
            <div
              className={cn(
                "relative h-1.5 flex-1 overflow-hidden rounded-full",
                dark ? "bg-white/10" : "bg-zinc-200",
              )}
            >
              <div
                className={cn("h-full origin-left rounded-full animate-grow-bar", fill)}
                style={{ width: `${signal.value}%` }}
              />
              {threshold !== undefined ? (
                <span
                  className={cn(
                    "absolute top-0 h-full w-px",
                    dark ? "bg-white/40" : "bg-black/30",
                  )}
                  style={{ left: `${threshold}%` }}
                />
              ) : null}
            </div>
            <span
              className={cn(
                "w-7 shrink-0 text-right font-mono text-[11px] font-bold tabular-nums",
                failing
                  ? "text-red-500"
                  : scored
                    ? "text-emerald-600"
                    : dark
                      ? "text-white"
                      : "text-zinc-700",
              )}
            >
              {signal.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Circular score dial drawn with inline SVG so it stays crisp at any size. */
export function ScoreDial({
  value,
  tone = "approved",
  size = 64,
  caption,
}: {
  value: number;
  tone?: Tone;
  size?: number;
  caption?: string;
}) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circumference;
  const strokeColor =
    tone === "rejected" ? "#EF4444" : tone === "pending" ? "#F59E0B" : tone === "lime" ? "#CCFF00" : "#10B981";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-black/10"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-extrabold tabular-nums">
          {value}
        </span>
      </div>
      {caption ? (
        <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-zinc-500">{caption}</span>
      ) : null}
    </div>
  );
}
