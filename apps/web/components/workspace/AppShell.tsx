import Link from "next/link";
import { ArrowUpRight, Bell, LayoutDashboard } from "lucide-react";
import { creator } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  active = "dashboard",
}: {
  children: React.ReactNode;
  active?: "dashboard" | "workspace";
}) {
  return (
    <div className="min-h-screen bg-surface-canvas">
      <header className="sticky top-0 z-40 border-b-2 border-black bg-[#0A0A0A] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
              Kreatr
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-lime-custom" />
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/dashboard"
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                  active === "dashboard"
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                Dashboard
              </Link>
              <Link
                href="/workspace/vid_100saas"
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                  active === "workspace" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white",
                )}
              >
                Workspace
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="relative hidden sm:block">
              <Bell className="h-4 w-4 text-zinc-400" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-status-pending" />
            </span>
            <div className="flex items-center gap-2.5 rounded-full border border-zinc-800 bg-surface-cardDark py-1 pl-1 pr-3.5">
              <img
                src={creator.avatar}
                alt={creator.name}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full border border-lime-custom object-cover"
              />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-xs font-bold">{creator.name}</span>
                <span className="block font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                  {creator.audience}
                </span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-zinc-200 px-5 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 font-mono text-[10px] uppercase tracking-widest text-zinc-400 sm:flex-row sm:items-center">
          <span className="flex items-center gap-2">
            <LayoutDashboard className="h-3 w-3" />
            Kreatr demo environment · seeded creator profile
          </span>
          <Link href="/" className="flex items-center gap-1 transition-colors hover:text-black">
            Back to landing page
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
