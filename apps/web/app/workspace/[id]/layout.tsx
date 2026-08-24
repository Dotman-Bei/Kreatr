import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, FileVideo, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/workspace/AppShell";
import { WorkspaceTabs } from "@/components/workspace/WorkspaceTabs";
import { content } from "@/lib/mockData";
import { loadWorkspace } from "@/lib/api";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadWorkspace();
  const pendingCount = data.assets.filter(
    (asset) => asset.actionClass === "approval" && asset.status === "pending",
  ).length;

  const pills = [
    { icon: CheckCircle2, label: "Analyzed", tone: "done" },
    { icon: CheckCircle2, label: `${data.metrics.analysed} moments found`, tone: "done" },
    { icon: CheckCircle2, label: `${data.metrics.selected} assets selected`, tone: "done" },
    {
      icon: pendingCount ? TriangleAlert : CheckCircle2,
      label: pendingCount ? `${pendingCount} approvals needed` : "All actions resolved",
      tone: pendingCount ? "warn" : "done",
    },
  ];

  return (
    <AppShell active="workspace">
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 sm:py-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-black"
          >
            <ArrowLeft className="h-3 w-3" />
            Dashboard
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                <FileVideo className="h-3.5 w-3.5" />
                {content.filename}
                <span className="text-zinc-300">·</span>
                <Clock className="h-3 w-3" />
                {content.duration}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
                {content.title}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {pills.map((pill) => (
                  <span
                    key={pill.label}
                    className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
                      pill.tone === "warn"
                        ? "border-amber-500 bg-status-pendingBg text-amber-700"
                        : "border-black bg-white text-black"
                    }`}
                  >
                    <pill.icon className="h-3 w-3" strokeWidth={2.5} />
                    {pill.label}
                  </span>
                ))}
              </div>
            </div>

            <WorkspaceTabs id={id} pendingCount={pendingCount} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10">{children}</div>
    </AppShell>
  );
}
