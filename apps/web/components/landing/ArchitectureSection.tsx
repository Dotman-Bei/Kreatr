import {
  Boxes,
  BrainCircuit,
  CircleCheckBig,
  Cloud,
  Database,
  LayoutDashboard,
  RefreshCw,
  Send,
  Wrench,
} from "lucide-react";

const tools = [
  "get_transcript",
  "find_content_moments",
  "score_moment",
  "generate_asset_plan",
  "get_creator_analytics",
  "schedule_asset",
  "publish_asset",
  "verify_publish_result",
  "analyze_performance",
  "update_creator_memory",
];

const layers = [
  {
    icon: LayoutDashboard,
    label: "Kreatr Web UI",
    detail: "Next.js 15 · upload, review, approve",
  },
  {
    icon: BrainCircuit,
    label: "Strands Orchestrator",
    detail: "Main agent · multi-step reasoning loop",
    highlight: true,
  },
  {
    icon: Wrench,
    label: "Tools + Creator Memory",
    detail: "10 typed tools · persistent creator profile",
  },
  {
    icon: Send,
    label: "Actions",
    detail: "Schedule & publish via platform connectors",
  },
  {
    icon: CircleCheckBig,
    label: "Verification",
    detail: "Confirm state · retry on failure",
  },
  {
    icon: RefreshCw,
    label: "Analytics → Learning",
    detail: "Performance rewrites the next ranking",
  },
];

export function ArchitectureSection() {
  return (
    <section id="architecture" className="px-5 py-8 sm:px-6">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-zinc-800 bg-[#0A0A0A] p-7 text-white sm:p-10 lg:p-16">
        <div className="grid-dots absolute inset-0 opacity-70" aria-hidden />
        <div
          className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-lime-custom/10 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3 text-lime-custom">Architecture</p>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
              A Real Agent Loop. Not a Prompt Chain.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">
              Kreatr runs as a single Strands orchestrator with typed tools, a persistent creator
              memory, and a verification step after every consequential action.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Layer stack */}
            <div className="lg:col-span-7">
              <ol className="space-y-2.5">
                {layers.map((layer, index) => (
                  <li key={layer.label}>
                    <div
                      className={`flex items-center gap-4 rounded-2xl border p-4 ${
                        layer.highlight
                          ? "border-lime-custom/50 bg-lime-custom/10"
                          : "border-zinc-800 bg-surface-cardDark"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          layer.highlight ? "bg-lime-custom text-black" : "bg-white/5 text-lime-custom"
                        }`}
                      >
                        <layer.icon className="h-5 w-5" strokeWidth={2.25} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-extrabold tracking-tight">{layer.label}</p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                          {layer.detail}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-zinc-600">
                        0{index + 1}
                      </span>
                    </div>
                    {index < layers.length - 1 ? (
                      <div className="ml-9 h-3 w-px bg-gradient-to-b from-lime-custom/60 to-transparent" />
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>

            {/* Tool registry */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-zinc-800 bg-surface-cardDark p-5">
                <div className="mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <Boxes className="h-4 w-4 text-lime-custom" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Registered tools
                  </span>
                  <span className="ml-auto font-mono text-[10px] tabular-nums text-zinc-600">
                    {tools.length}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {tools.map((tool) => (
                    <li
                      key={tool}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-mono text-[11px] text-zinc-300 transition-colors hover:bg-white/5"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lime-custom" />
                      {tool}
                      <span className="ml-auto text-[9px] uppercase tracking-wider text-zinc-600">
                        tool
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { icon: Cloud, label: "AWS Bedrock", sub: "Model access" },
                  { icon: Database, label: "DynamoDB", sub: "Creator memory" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-zinc-800 bg-surface-cardDark p-4"
                  >
                    <item.icon className="mb-2 h-4 w-4 text-lime-custom" />
                    <p className="text-[13px] font-bold tracking-tight">{item.label}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      {item.sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
