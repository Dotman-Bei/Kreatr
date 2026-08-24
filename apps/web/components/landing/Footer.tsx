import Link from "next/link";
import { Github, Trophy } from "lucide-react";

const navGroups = [
  {
    heading: "Product",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Agent Loop", href: "#agent-loop" },
      { label: "Comparison", href: "#comparison" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    heading: "Demo",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Content Workspace", href: "/workspace/vid_100saas" },
      { label: "Action Plan", href: "/workspace/vid_100saas/actions" },
      { label: "Agent Feed", href: "/workspace/vid_100saas/agent-feed" },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "Strands SDK Architecture", href: "#architecture" },
      { label: "Devpost Submission", href: "#" },
      { label: "GitHub Repository", href: "#" },
      { label: "MIT License", href: "#" },
    ],
  },
];

const stack = ["Strands Agents SDK", "AWS Bedrock", "Next.js 15", "FastAPI"];

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-[#0A0A0A] px-5 pb-12 pt-16 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
              Kreatr
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-lime-custom" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-400">
              Autonomous post-production agent for creators. Built for the Strands Agents for Humans
              Hackathon 2026.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="#"
                className="flex items-center gap-2 rounded-full border border-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>
              <a
                href="#"
                className="flex items-center gap-2 rounded-full border border-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
              >
                <Trophy className="h-3.5 w-3.5" />
                Devpost
              </a>
            </div>
          </div>

          {navGroups.map((group) => (
            <div key={group.heading} className="lg:col-span-2">
              <p className="eyebrow mb-4 text-zinc-500">{group.heading}</p>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-zinc-400 transition-colors hover:text-lime-custom"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-2">
            <p className="eyebrow mb-4 text-zinc-500">Built with</p>
            <ul className="flex flex-wrap gap-2">
              {stack.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-zinc-800 bg-surface-cardDark px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-300"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-zinc-900 pt-8 text-xs text-zinc-500 sm:flex-row sm:items-center">
          <p>© 2026 Kreatr. Open-source under MIT License.</p>
          <p className="font-mono uppercase tracking-wider">
            Professional Agents · Creators Track
          </p>
        </div>
      </div>
    </footer>
  );
}
