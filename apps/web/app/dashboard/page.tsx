import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  CircleCheckBig,
  Clock,
  Eye,
  Lightbulb,
  Sparkles,
  Terminal,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { AppShell } from "@/components/workspace/AppShell";
import { Badge } from "@/components/ui/Badge";
import { ConfidenceBar } from "@/components/ui/Meters";
import {
  assets,
  content,
  creator,
  metrics,
  nextRecommendation,
  pendingApprovals,
  performance,
} from "@/lib/mockData";
import { cn } from "@/lib/utils";

const statusPills = [
  { label: "Analyzed", done: true },
  { label: `${metrics.analysed} moments found`, done: true },
  { label: `${metrics.selected} assets selected`, done: true },
  { label: `${pendingApprovals.length} approvals pending`, done: false },
];

const scheduled = assets.filter((asset) => asset.actionClass !== "auto");

export default function DashboardPage() {
  return (
    <AppShell active="dashboard">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10">
        {/* Greeting */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={creator.avatar}
              alt={creator.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-2xl border-2 border-black object-cover shadow-neo-sm"
            />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Your content is moving, {creator.name.split(" ")[0]}.
              </h1>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                {creator.primaryPlatform} · {creator.subscribers} subs · Audience: {creator.audience}
              </p>
            </div>
          </div>
          <Link
            href="/workspace/vid_100saas/agent-feed"
            className="neo-press inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2.5 text-sm font-bold shadow-neo-sm"
          >
            <Terminal className="h-4 w-4" />
            Agent feed
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Latest content */}
          <section className="lg:col-span-8">
            <article className="overflow-hidden rounded-3xl border-2 border-black bg-white shadow-neo">
              <div className="flex flex-col sm:flex-row">
                <div className="relative h-48 w-full shrink-0 sm:h-auto sm:w-64">
                  <img
                    src={content.thumbnail}
                    alt="Studio microphone and editing timeline from the latest upload"
                    className="h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-white">
                    {content.duration}
                  </span>
                </div>

                <div className="min-w-0 flex-1 border-t-2 border-black p-5 sm:border-l-2 sm:border-t-0 sm:p-6">
                  <p className="eyebrow mb-2 text-zinc-500">Latest content</p>
                  <h2 className="text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
                    {content.title}
                  </h2>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    {content.uploadedAt} · {content.transcriptWords.toLocaleString()} words
                    transcribed
                  </p>

                  <ul className="mt-4 space-y-2">
                    {statusPills.map((pill) => (
                      <li key={pill.label} className="flex items-center gap-2.5 text-sm font-semibold">
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                            pill.done ? "bg-status-approved text-white" : "bg-status-pending text-white",
                          )}
                        >
                          {pill.done ? (
                            <Check className="h-3 w-3" strokeWidth={4} />
                          ) : (
                            <TriangleAlert className="h-3 w-3" strokeWidth={2.5} />
                          )}
                        </span>
                        <span className={pill.done ? "text-zinc-700" : "text-amber-700"}>
                          {pill.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                    <Link
                      href="/workspace/vid_100saas"
                      className="neo-press inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-black bg-lime-custom py-3 text-sm font-extrabold shadow-neo-sm"
                    >
                      Open workspace
                      <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                    </Link>
                    <Link
                      href="/workspace/vid_100saas/actions"
                      className="neo-press inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-extrabold shadow-neo-sm"
                    >
                      Review {pendingApprovals.length} approvals
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            {/* Recommendation banner */}
            <article className="mt-6 rounded-3xl border-2 border-black bg-lime-custom p-6 shadow-neo sm:p-7">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-black text-lime-custom">
                  <Lightbulb className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="eyebrow mb-1.5 text-black/60">Kreatr recommends</p>
                  <h2 className="text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
                    Create a follow-up on SaaS pricing: &ldquo;{nextRecommendation.title}&rdquo;
                  </h2>
                  <p className="mt-2.5 text-[14px] font-medium leading-relaxed text-black/75">
                    {nextRecommendation.reason}
                  </p>

                  <ul className="mt-4 space-y-1.5">
                    {nextRecommendation.evidence.map((item) => (
                      <li key={item} className="flex gap-2 text-[13px] font-medium text-black/70">
                        <CircleCheckBig className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="neo-press inline-flex items-center gap-2 rounded-xl border-2 border-black bg-black px-5 py-2.5 text-sm font-extrabold text-lime-custom shadow-neo-sm"
                    >
                      View Recommendation
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-black/60">
                      {nextRecommendation.format} · confidence {nextRecommendation.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            </article>

            {/* Scheduled */}
            <section className="mt-6 rounded-3xl border-2 border-black bg-white p-6 shadow-neo">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-tight">
                  <CalendarClock className="h-4 w-4" />
                  Publishing queue
                </h2>
                <Link
                  href="/workspace/vid_100saas/actions"
                  className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:text-black"
                >
                  Manage
                </Link>
              </div>

              <ul className="divide-y divide-zinc-200">
                {scheduled.map((asset) => (
                  <li key={asset.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-black">
                        {asset.title}
                      </span>
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                        {asset.type} · {asset.scheduledFor}
                      </span>
                    </span>
                    {asset.status === "pending" ? (
                      <Badge tone="pending">
                        <Clock className="h-3 w-3" />
                        Awaiting approval
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Draft</Badge>
                    )}
                    <span className="w-24 shrink-0">
                      <ConfidenceBar
                        value={asset.confidence}
                        tone={asset.confidence >= 85 ? "approved" : "pending"}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6 lg:col-span-4">
            <section className="rounded-3xl border-2 border-black bg-[#0A0A0A] p-6 text-white shadow-neo">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-tight">
                <TrendingUp className="h-4 w-4 text-lime-custom" />
                Recent performance
              </h2>

              <p className="text-sm font-bold leading-snug">{performance.asset}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                YouTube Short · 48 hours live
              </p>

              <p className="mt-4 font-mono text-4xl font-extrabold tabular-nums text-lime-custom">
                {performance.multiple}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                Above channel baseline
              </p>

              <dl className="mt-5 space-y-3 border-t border-zinc-800 pt-4">
                {[
                  {
                    label: "Views",
                    value: performance.views.toLocaleString(),
                    base: performance.baselineViews.toLocaleString(),
                    pct: 100,
                  },
                  {
                    label: "Retention",
                    value: `${performance.retention}%`,
                    base: `${performance.baselineRetention}%`,
                    pct: performance.retention,
                  },
                  {
                    label: "CTR",
                    value: `${performance.ctr}%`,
                    base: `${performance.baselineCtr}%`,
                    pct: performance.ctr * 10,
                  },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-baseline justify-between">
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                        {row.label}
                      </dt>
                      <dd className="font-mono text-xs">
                        <span className="font-bold text-white">{row.value}</span>
                        <span className="text-zinc-600"> vs {row.base}</span>
                      </dd>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full origin-left animate-grow-bar rounded-full bg-lime-custom"
                        style={{ width: `${Math.min(100, row.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </dl>

              <p className="mt-4 flex gap-2 border-t border-zinc-800 pt-4 text-[12px] leading-relaxed text-zinc-400">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-custom" />
                Written to Creator Memory: concrete pricing examples outperform generic startup
                advice.
              </p>
            </section>

            <section className="rounded-3xl border-2 border-black bg-white p-6 shadow-neo">
              <h2 className="mb-4 text-sm font-extrabold uppercase tracking-tight">
                This upload, measured
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: `${metrics.savedMinutes}m`, label: "Time saved" },
                  { value: `${metrics.decisionsAvoided}`, label: "Decisions avoided" },
                  { value: `${metrics.rejectionRate}%`, label: "Moments rejected" },
                  {
                    value: `${metrics.actionsVerified}/${metrics.actionsPlanned}`,
                    label: "Actions verified",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border-2 border-black bg-zinc-50 p-4">
                    <p className="font-mono text-2xl font-extrabold tabular-nums">{stat.value}</p>
                    <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                <Eye className="h-3 w-3" />
                Controlled demo estimate
              </p>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
