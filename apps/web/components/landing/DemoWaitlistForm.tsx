"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Loader2, Upload, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const bootLines = [
  "[INGEST] Extracting audio track via FFmpeg...",
  "[TOOL:get_transcript] Transcribing 20:14 of source audio...",
  "[TOOL:find_content_moments] 14 candidate segments identified.",
  "[TOOL:score_moment] Scoring hooks against Creator Memory...",
  "[GATEKEEPER] 3 selected, 11 rejected. Awaiting your approval.",
];

const audiences = [
  "Early-stage founders",
  "Developers & engineers",
  "Lifestyle & wellness",
  "Marketing & growth",
];

export function DemoWaitlistForm() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [audience, setAudience] = useState(audiences[0]);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (phase !== "running") return;
    if (visibleLines >= bootLines.length) {
      const id = window.setTimeout(() => setPhase("done"), 600);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setVisibleLines((n) => n + 1), 620);
    return () => window.clearTimeout(id);
  }, [phase, visibleLines]);

  const start = (event: React.FormEvent) => {
    event.preventDefault();
    setVisibleLines(0);
    setPhase("running");
  };

  const inputClass =
    "w-full rounded-xl border-2 border-black bg-white px-4 py-3.5 text-[15px] font-medium text-black placeholder:text-zinc-400 focus:outline-none focus:ring-0";

  return (
    <section className="px-5 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl rounded-3xl border-2 border-black bg-lime-custom p-7 shadow-neo-lg sm:p-10 md:p-12">
        <h2 className="text-center text-3xl font-extrabold leading-tight tracking-tight text-black md:text-5xl">
          Your Content Won&rsquo;t Manage Itself. Let Kreatr Do It.
        </h2>
        <p className="mt-3 text-center text-[15px] font-medium text-black/80">
          Paste a video URL or upload a file to experience autonomous post-production.
        </p>

        {phase === "idle" ? (
          <form onSubmit={start} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="creator-name"
                className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-black/60"
              >
                Creator name
              </label>
              <input
                id="creator-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="video-url"
                className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-black/60"
              >
                YouTube / video URL
              </label>
              <div className="relative">
                <input
                  id="video-url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className={cn(inputClass, "pr-12")}
                />
                <Upload className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>

            <div>
              <label
                htmlFor="audience"
                className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-black/60"
              >
                Primary target audience
              </label>
              <div className="relative">
                <select
                  id="audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className={cn(inputClass, "appearance-none pr-12")}
                >
                  {audiences.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              </div>
            </div>

            <button
              type="submit"
              className="neo-press w-full rounded-xl bg-black py-4 text-lg font-extrabold tracking-tight text-lime-custom shadow-[4px_4px_0px_rgba(0,0,0,0.3)] transition-colors hover:bg-zinc-800"
            >
              <span className="inline-flex items-center gap-2">
                Run Kreatr Agent Workflow
                <Zap className="h-5 w-5 fill-lime-custom" />
              </span>
            </button>
          </form>
        ) : (
          <div className="mt-8">
            <div className="rounded-2xl border-2 border-black bg-[#0A0A0A] p-5">
              <div className="mb-3 flex items-center gap-2 border-b border-zinc-800 pb-3">
                {phase === "running" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-lime-custom" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-lime-custom" />
                )}
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  {phase === "running" ? "Agent running" : "Run complete"}
                </span>
                <span className="ml-auto truncate font-mono text-[10px] text-zinc-600">
                  {name || "Alex Rivera"} · {audience}
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px] leading-relaxed">
                {bootLines.slice(0, visibleLines).map((line) => (
                  <p key={line} className="animate-fade-up text-zinc-300">
                    <span className="text-lime-custom">$</span> {line}
                  </p>
                ))}
                {phase === "running" ? (
                  <p className="text-zinc-600">
                    <span className="animate-pulse">_</span>
                  </p>
                ) : null}
              </div>
            </div>

            {phase === "done" ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/workspace/vid_100saas"
                  className="neo-press inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-black bg-black px-6 py-3.5 text-base font-extrabold text-lime-custom shadow-neo-sm"
                >
                  Open the workspace
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setPhase("idle");
                    setVisibleLines(0);
                  }}
                  className="neo-press rounded-xl border-2 border-black bg-white px-6 py-3.5 text-base font-extrabold text-black shadow-neo-sm"
                >
                  Run again
                </button>
              </div>
            ) : null}
          </div>
        )}

        <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-widest text-black/50">
          Demo environment · seeded creator profile · no channel connection required
        </p>
      </div>
    </section>
  );
}
