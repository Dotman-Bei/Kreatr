"use client";

import { useState } from "react";
import {
  ArrowRight,
  BrainCog,
  FileVideo,
  Filter,
  PenLine,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { processSteps } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const icons: LucideIcon[] = [FileVideo, Filter, PenLine, ShieldCheck, BrainCog];

function Connector({ vertical = false }: { vertical?: boolean }) {
  return (
    <svg
      viewBox={vertical ? "0 0 24 40" : "0 0 40 24"}
      className={cn("shrink-0 text-black/40", vertical ? "h-10 w-6" : "h-6 w-10")}
      fill="none"
      aria-hidden
    >
      <path
        d={vertical ? "M12 2 L12 38" : "M2 12 L38 12"}
        stroke="#CCFF00"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="6 6"
        className="animate-dash-flow"
        style={{ filter: "drop-shadow(0 0 3px rgba(204,255,0,0.9))" }}
      />
      <path
        d={vertical ? "M12 2 L12 38" : "M2 12 L38 12"}
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="6 6"
      />
    </svg>
  );
}

export function ProcessStepper() {
  const [active, setActive] = useState(1);

  return (
    <section id="agent-loop" className="px-5 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="eyebrow mb-3 text-zinc-500">The autonomous loop</p>
          <h2 className="text-4xl font-extrabold tracking-tight text-black md:text-5xl">
            Meet the Kreatr Autonomous Loop
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-zinc-600">
            5 steps. Zero manual grunt work. Complete control over what actually gets published.
          </p>
        </div>

        {/* Desktop: branching row */}
        <div className="mt-14 hidden items-stretch justify-center lg:flex">
          {processSteps.map((step, index) => {
            const Icon = icons[index];
            const isActive = active === index;
            return (
              <div key={step.step} className="flex items-center">
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                  aria-pressed={isActive}
                  className={cn(
                    "group flex h-full w-[214px] flex-col rounded-2xl border-2 border-black p-6 text-left shadow-neo transition-all duration-200",
                    isActive
                      ? "-translate-y-1.5 bg-lime-custom shadow-neo-lg"
                      : "bg-white hover:bg-lime-custom",
                  )}
                >
                  <span className="mb-3 inline-block w-fit rounded-full bg-black px-3 py-1 font-mono text-[10px] font-bold text-lime-custom">
                    STEP {step.step}
                  </span>
                  <Icon className="mb-3 h-6 w-6" strokeWidth={2.25} />
                  <h3 className="text-lg font-extrabold leading-tight tracking-tight">{step.title}</h3>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-black/50">
                    {step.sub}
                  </p>
                  <p className="mt-3 flex-1 text-[13px] font-medium leading-relaxed text-black/70">
                    {step.body}
                  </p>
                  <code
                    className={cn(
                      "mt-4 block truncate rounded-lg border px-2 py-1.5 font-mono text-[10px] transition-colors",
                      isActive
                        ? "border-black/25 bg-black text-lime-custom"
                        : "border-black/10 bg-zinc-100 text-zinc-600",
                    )}
                  >
                    {step.tool}()
                  </code>
                </button>
                {index < processSteps.length - 1 ? <Connector /> : null}
              </div>
            );
          })}
        </div>

        {/* Mobile: vertical stack */}
        <div className="mt-12 flex flex-col items-center lg:hidden">
          {processSteps.map((step, index) => {
            const Icon = icons[index];
            return (
              <div key={step.step} className="flex w-full max-w-md flex-col items-center">
                <div className="w-full rounded-2xl border-2 border-black bg-white p-6 shadow-neo">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-black px-3 py-1 font-mono text-[10px] font-bold text-lime-custom">
                      STEP {step.step}
                    </span>
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </div>
                  <h3 className="mt-3 text-lg font-extrabold tracking-tight">{step.title}</h3>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-black/50">
                    {step.sub}
                  </p>
                  <p className="mt-2.5 text-sm font-medium leading-relaxed text-black/70">
                    {step.body}
                  </p>
                  <code className="mt-3 block rounded-lg border border-black/10 bg-zinc-100 px-2 py-1.5 font-mono text-[10px] text-zinc-600">
                    {step.tool}()
                  </code>
                </div>
                {index < processSteps.length - 1 ? <Connector vertical /> : null}
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <p className="flex items-center gap-2 rounded-full border-2 border-black bg-white px-5 py-2.5 text-sm font-bold shadow-neo-sm">
            Every step is a real Strands tool call
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </p>
        </div>
      </div>
    </section>
  );
}
