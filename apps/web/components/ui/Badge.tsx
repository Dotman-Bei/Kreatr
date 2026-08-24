import { cn } from "@/lib/utils";

type Tone = "lime" | "approved" | "rejected" | "pending" | "dark" | "neutral" | "outline";

const tones: Record<Tone, string> = {
  lime: "bg-lime-custom text-black border-black",
  approved: "bg-status-approvedBg text-emerald-700 border-emerald-600",
  rejected: "bg-status-rejectedBg text-red-700 border-red-500",
  pending: "bg-status-pendingBg text-amber-700 border-amber-500",
  dark: "bg-[#0A0A0A] text-white border-black",
  neutral: "bg-zinc-100 text-zinc-700 border-zinc-300",
  outline: "bg-transparent text-zinc-600 border-zinc-300",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
