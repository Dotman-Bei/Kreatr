import {
  BrainCircuit,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { scenes } from "@/lib/images";

type Block = {
  icon: LucideIcon;
  title: string;
  text: string;
  tone: "lime" | "white" | "dark";
  /** Optional stat strip rendered under the copy. */
  stat?: { value: string; label: string };
};

const blocks: Block[] = [
  {
    icon: CheckCircle2,
    title: "Intelligent Moment Rejection",
    text: "Kreatr rejects 70%+ of weak video moments so you never spam your audience with low-value clips.",
    tone: "lime",
    stat: { value: "79%", label: "Candidates discarded" },
  },
  {
    icon: Sparkles,
    title: "Platform-Native Copy",
    text: "Generates bespoke YouTube Shorts titles, viral X posts, and newsletter frameworks from your best moments.",
    tone: "white",
  },
  {
    icon: ShieldCheck,
    title: "1-Click Human-in-the-Loop",
    text: "Safe execution. Kreatr prepares the action plan and only asks your approval before publishing publicly.",
    tone: "lime",
    stat: { value: "3", label: "Action classes" },
  },
  {
    icon: BrainCircuit,
    title: "Persistent Creator Memory",
    text: "Remembers your audience persona, tone of voice, preferred formats, and previously high-performing topics.",
    tone: "white",
  },
  {
    icon: TrendingUp,
    title: "Closed-Loop Learning",
    text: "Inspects post-publication analytics and autonomously recommends your next high-converting video topic.",
    tone: "lime",
    stat: { value: "2.3x", label: "Baseline beaten" },
  },
  {
    icon: Cpu,
    title: "Powered by Strands Agents SDK",
    text: "Multi-step tool calling, dynamic recovery loops, and verified AWS Bedrock agent execution.",
    tone: "dark",
  },
];

const tones = {
  lime: "bg-lime-custom text-black",
  white: "bg-white text-black",
  dark: "bg-[#0A0A0A] text-white",
};

export function BentoFeatures() {
  return (
    <section className="px-5 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <h2 className="mx-auto max-w-3xl text-center text-4xl font-extrabold tracking-tight text-black md:text-5xl">
          We Make Content Repurposing{" "}
          <span className="bg-lime-custom px-2 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
            Insanely Intelligent.
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-base font-medium leading-relaxed text-zinc-600">
          Not another generic prompt generator. An agent that exercises genuine editorial judgment
          about what deserves to exist.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block) => (
            <article
              key={block.title}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-3xl border-2 border-black p-7 shadow-neo transition-transform duration-200 hover:-translate-y-1 hover:shadow-neo-lg",
                tones[block.tone],
              )}
            >
              <span
                className={cn(
                  "mb-5 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black",
                  block.tone === "dark" ? "bg-lime-custom text-black" : "bg-black text-lime-custom",
                )}
              >
                <block.icon className="h-5 w-5" strokeWidth={2.25} />
              </span>

              <h3 className="text-xl font-extrabold leading-tight tracking-tight">{block.title}</h3>
              <p
                className={cn(
                  "mt-2.5 flex-1 text-[15px] font-medium leading-relaxed",
                  block.tone === "dark" ? "text-zinc-400" : "text-black/70",
                )}
              >
                {block.text}
              </p>

              {block.stat ? (
                <div className="mt-5 flex items-baseline gap-2 border-t-2 border-black/15 pt-4">
                  <span className="font-mono text-2xl font-extrabold tabular-nums">
                    {block.stat.value}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">
                    {block.stat.label}
                  </span>
                </div>
              ) : null}

              {block.tone === "dark" ? (
                <img
                  src={scenes.mixConsole}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 rounded-2xl object-cover opacity-20 transition-opacity duration-300 group-hover:opacity-30"
                />
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
