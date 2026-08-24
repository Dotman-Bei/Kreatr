"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Agent Loop", href: "#agent-loop" },
  { label: "Comparison", href: "#comparison" },
  { label: "FAQ", href: "#faq" },
  { label: "Architecture", href: "#architecture" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed left-1/2 top-4 z-50 w-[94%] max-w-5xl -translate-x-1/2 sm:top-6">
      <nav
        className={cn(
          "flex items-center justify-between rounded-full border border-zinc-800 bg-[#0A0A0A]/90 px-5 py-3 text-white backdrop-blur-md transition-shadow duration-300 sm:px-6 sm:py-3.5",
          scrolled ? "shadow-2xl shadow-black/25" : "shadow-lg shadow-black/10",
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white"
        >
          Kreatr
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-lime-custom" />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full bg-lime-custom px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-black shadow-[2px_2px_0px_#000] transition-transform hover:scale-105 hover:bg-lime-hover sm:px-5 sm:text-xs"
          >
            Launch Demo
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="rounded-full border border-zinc-700 p-2 text-zinc-300 transition-colors hover:text-white lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="mt-2 overflow-hidden rounded-3xl border border-zinc-800 bg-[#0A0A0A]/95 p-2 backdrop-blur-md lg:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </header>
  );
}
