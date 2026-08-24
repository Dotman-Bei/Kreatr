import { ArrowDown, Quote, Sparkles, Timer, TrendingUp } from "lucide-react";
import { metrics, performance, testimonials } from "@/lib/mockData";
import { portraits, scenes } from "@/lib/images";
import { cn } from "@/lib/utils";

const funnel = [
  { label: "Candidate moments", value: metrics.candidateMoments, width: "100%", tone: "zinc" },
  { label: "Deep-analysed", value: metrics.analysed, width: "48%", tone: "amber" },
  { label: "Selected & produced", value: metrics.selected, width: "24%", tone: "lime" },
];

const faces = [portraits.maya, portraits.devin];

export function ProofAndMetrics() {
  return (
    <section className="px-5 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="eyebrow mb-3 text-zinc-500">Measured in the demo build</p>
          <h2 className="text-4xl font-extrabold tracking-tight text-black md:text-5xl">
            Less Deciding. Less Doing.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-zinc-600">
            Numbers from a controlled demo run on a 20-minute source video, not a market estimate.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Time saved */}
          <article className="flex flex-col rounded-3xl border-2 border-black bg-[#0A0A0A] p-7 text-white shadow-neo">
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-lime-custom text-black">
              <Timer className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <p className="font-mono text-5xl font-extrabold tabular-nums text-lime-custom">
              {metrics.savedMinutes}
              <span className="text-2xl">min</span>
            </p>
            <p className="mt-2 text-lg font-extrabold tracking-tight">Saved per video</p>
            <div className="mt-5 space-y-2.5">
              {[
                { label: "Manual workflow", value: metrics.manualMinutes, width: "100%", tone: "bg-red-500" },
                { label: "Kreatr workflow", value: metrics.kreatrMinutes, width: "22%", tone: "bg-lime-custom" },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="mb-1 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    <span>{bar.label}</span>
                    <span className="text-zinc-300">{bar.value} min</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn("h-full origin-left animate-grow-bar rounded-full", bar.tone)}
                      style={{ width: bar.width }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-zinc-800 pt-5">
              {[
                { label: "Steps automated", value: "17" },
                { label: "Creator touches", value: "3" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 font-mono text-xl font-extrabold tabular-nums text-white">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-zinc-500">
              <Timer className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Measured on one seeded 20-minute upload, start to scheduled queue.
            </p>
          </article>

          {/* Decision funnel */}
          <article className="rounded-3xl border-2 border-black bg-white p-7 shadow-neo">
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-black text-lime-custom">
              <Sparkles className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <p className="font-mono text-5xl font-extrabold tabular-nums text-black">
              {metrics.decisionReduction}%
            </p>
            <p className="mt-2 text-lg font-extrabold tracking-tight">Fewer decisions to make</p>

            <div className="mt-5 space-y-3">
              {funnel.map((row, index) => (
                <div key={row.label}>
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg border-2 border-black px-3 py-2",
                      row.tone === "lime"
                        ? "bg-lime-custom"
                        : row.tone === "amber"
                          ? "bg-status-pendingBg"
                          : "bg-zinc-100",
                    )}
                    style={{ width: row.width }}
                  >
                    <span className="font-mono text-sm font-extrabold tabular-nums">{row.value}</span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    {row.label}
                  </p>
                  {index < funnel.length - 1 ? (
                    <ArrowDown className="mt-1 h-3.5 w-3.5 text-zinc-300" />
                  ) : null}
                </div>
              ))}
            </div>

            <p className="mt-5 border-t border-zinc-200 pt-4 text-[13px] font-medium text-zinc-600">
              <span className="font-bold text-black">{metrics.decisionsAvoided} manual decisions</span>{" "}
              avoided on a single upload.
            </p>
          </article>

          {/* Performance + testimonials */}
          <div className="flex flex-col gap-5">
            <article className="relative overflow-hidden rounded-3xl border-2 border-black bg-lime-custom p-7 shadow-neo">
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-black text-lime-custom">
                <TrendingUp className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <p className="font-mono text-5xl font-extrabold tabular-nums text-black">
                {performance.multiple}
              </p>
              <p className="mt-2 text-lg font-extrabold leading-tight tracking-tight">
                Above the channel baseline
              </p>
              <p className="mt-2 text-[13px] font-medium leading-relaxed text-black/70">
                {performance.views.toLocaleString()} views against a{" "}
                {performance.baselineViews.toLocaleString()} baseline, then fed straight back into
                Creator Memory.
              </p>
              <img
                src={scenes.deskSetup}
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute -bottom-10 -right-10 h-36 w-36 rounded-2xl border-2 border-black object-cover opacity-40 mix-blend-multiply grayscale"
              />
            </article>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {testimonials.map((item, index) => (
                <figure
                  key={item.name}
                  className="rounded-2xl border-2 border-black bg-white p-5 shadow-neo-sm"
                >
                  <Quote className="mb-2 h-4 w-4 text-zinc-300" />
                  <blockquote className="text-[14px] font-semibold leading-snug text-black">
                    {item.quote}
                  </blockquote>
                  <figcaption className="mt-3 flex items-center gap-2.5">
                    <img
                      src={faces[index]}
                      alt={item.name}
                      width={32}
                      height={32}
                      loading="lazy"
                      decoding="async"
                      className="h-8 w-8 rounded-full border-2 border-black object-cover"
                    />
                    <span>
                      <span className="block text-xs font-bold text-black">{item.name}</span>
                      <span className="block font-mono text-[10px] text-zinc-500">{item.role}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
