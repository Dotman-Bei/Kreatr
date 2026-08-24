"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, ScanSearch, Terminal } from "lucide-react";
import { pendingApprovals } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export function WorkspaceTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/workspace/${id}`;

  const tabs = [
    { href: base, label: "Moments", icon: ScanSearch },
    {
      href: `${base}/actions`,
      label: "Action Plan",
      icon: ListChecks,
      badge: String(pendingApprovals.length),
    },
    { href: `${base}/agent-feed`, label: "Agent Feed", icon: Terminal },
  ];

  return (
    <div className="scrollbar-slim flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "neo-press inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-black px-4 py-2 text-sm font-bold shadow-neo-sm transition-colors",
              isActive ? "bg-lime-custom text-black" : "bg-white text-black hover:bg-zinc-100",
            )}
          >
            <tab.icon className="h-4 w-4" strokeWidth={2.25} />
            {tab.label}
            {tab.badge ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold",
                  isActive ? "bg-black text-lime-custom" : "bg-status-pending text-white",
                )}
              >
                {tab.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
