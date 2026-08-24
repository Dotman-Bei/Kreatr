"use client";

import { useState } from "react";
import { Check, Clock3 } from "lucide-react";
import { problemTasks } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const durations = ["~45 min", "~25 min", "~30 min", "~20 min", "~22 min"];

export function ProblemChecklist() {
  const [done, setDone] = useState<number[]>([0, 1]);

  const toggle = (index: number) =>
    setDone((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));

  return (
    <section id="how-it-works" className="px-5 py-8 sm:px-6">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-zinc-800 bg-[#0A0A0A] p-7 text-white sm:p-10 lg:p-16">
        <div className="grid-dots absolute inset-0 opacity-70" aria-hidden />
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-lime-custom/10 blur-3xl"
          aria-hidden
        />

        <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Checklist */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl border border-zinc-800 bg-surface-cardDark p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  After every upload
                </span>
                <span className="font-mono text-[10px] font-bold tabular-nums text-zinc-500">
                  {done.length}/{problemTasks.length} done
                </span>
              </div>

              <ul className="space-y-3">
                {problemTasks.map((task, index) => {
                  const checked = done.includes(index);
                  return (
                    <li key={task}>
                      <button
                        type="button"
                        onClick={() => toggle(index)}
                        aria-pressed={checked}
                        className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/[0.04]"
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                            checked
                              ? "border-lime-custom bg-lime-custom"
                              : "border-zinc-600 group-hover:border-zinc-400",
                          )}
                        >
                          {checked ? <Check className="h-3.5 w-3.5 text-black" strokeWidth={3.5} /> : null}
                        </span>
                        <span
                          className={cn(
                            "flex-1 text-sm font-medium transition-colors sm:text-[15px]",
                            checked ? "text-zinc-500 line-through" : "text-zinc-200",
                          )}
                        >
                          {task}
                        </span>
                        <span className="hidden shrink-0 items-center gap-1 font-mono text-[10px] tabular-nums text-zinc-600 sm:flex">
                          <Clock3 className="h-3 w-3" />
                          {durations[index]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Total per video
                </span>
                <span className="font-mono text-sm font-bold text-red-400">142 min</span>
              </div>

              {/* Sticky notes */}
              <div className="absolute -right-3 -top-5 rotate-[-6deg] rounded-lg bg-lime-custom px-4 py-2 font-handwritten text-base font-bold text-black shadow-xl sm:-right-4 sm:text-lg">
                &ldquo;I don&rsquo;t have time for this second job!&rdquo;
              </div>
              <div className="absolute -bottom-6 right-6 rotate-[4deg] rounded-lg bg-[#FEF08A] px-4 py-2 font-handwritten text-base font-bold text-black shadow-xl sm:text-lg">
                &ldquo;Is this clip even worth posting?&rdquo;
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="lg:col-span-5">
            <p className="eyebrow mb-3 text-lime-custom">Sound familiar?</p>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
              Post-Production Shouldn&rsquo;t Feel Like a Never-Ending Checklist.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">
              Creators finish recording, but the real grind begins. Kreatr turns hours of manual
              post-production into an autonomous background workflow that only interrupts you when a
              decision genuinely needs a human.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              {[
                { value: "142 min", label: "Manual workflow" },
                { value: "32 min", label: "With Kreatr" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={cn(
                    "rounded-2xl border p-4",
                    i === 1
                      ? "border-lime-custom/40 bg-lime-custom/10"
                      : "border-zinc-800 bg-surface-cardDark",
                  )}
                >
                  <p
                    className={cn(
                      "font-mono text-2xl font-extrabold tabular-nums",
                      i === 1 ? "text-lime-custom" : "text-white",
                    )}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
