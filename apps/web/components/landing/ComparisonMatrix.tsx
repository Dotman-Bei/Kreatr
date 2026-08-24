import { Check, Minus, X } from "lucide-react";
import { comparisonRows } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const columns = [
  { key: "kreatr", label: "Kreatr Agent", sub: "Autonomous" },
  { key: "editor", label: "Video Editor", sub: "Freelance human" },
  { key: "genericAi", label: "Generic AI Tools", sub: "ChatGPT / Vizard" },
  { key: "diy", label: "Solo Creator", sub: "The grind" },
] as const;

export function ComparisonMatrix() {
  return (
    <section id="comparison" className="px-5 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="eyebrow mb-3 text-zinc-500">Head to head</p>
          <h2 className="text-4xl font-extrabold tracking-tight text-black md:text-5xl">
            The Smarter Way to Publish.
          </h2>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border-2 border-black bg-white p-3 shadow-neo-lg sm:p-6">
          <div className="scrollbar-slim w-full overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr>
                  <th scope="col" className="w-[190px] px-4 pb-4 pt-2">
                    <span className="eyebrow text-zinc-400">Dimension</span>
                  </th>
                  {columns.map((col) => (
                    <th key={col.key} scope="col" className="px-3 pb-4 pt-2 align-bottom">
                      <div
                        className={cn(
                          "rounded-2xl border-2 border-black px-4 py-3",
                          col.key === "kreatr" ? "bg-lime-custom shadow-neo-sm" : "bg-zinc-50",
                        )}
                      >
                        <p className="text-sm font-extrabold tracking-tight text-black">
                          {col.label}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-black/50">
                          {col.sub}
                        </p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, rowIndex) => (
                  <tr
                    key={row.dimension}
                    className={cn("align-middle", rowIndex % 2 === 1 && "bg-zinc-50/70")}
                  >
                    <th
                      scope="row"
                      className="rounded-l-xl px-4 py-4 text-[13px] font-extrabold tracking-tight text-black"
                    >
                      {row.dimension}
                    </th>
                    {columns.map((col) => {
                      const isKreatr = col.key === "kreatr";
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            "px-3 py-4 text-[13px] font-medium leading-snug",
                            isKreatr ? "text-black" : "text-zinc-500",
                          )}
                        >
                          <span className="flex items-start gap-2">
                            <span
                              className={cn(
                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                                isKreatr
                                  ? "bg-status-approved text-white"
                                  : col.key === "editor"
                                    ? "bg-zinc-300 text-zinc-600"
                                    : "bg-status-rejectedBg text-red-500",
                              )}
                            >
                              {isKreatr ? (
                                <Check className="h-2.5 w-2.5" strokeWidth={4} />
                              ) : col.key === "editor" ? (
                                <Minus className="h-2.5 w-2.5" strokeWidth={4} />
                              ) : (
                                <X className="h-2.5 w-2.5" strokeWidth={4} />
                              )}
                            </span>
                            <span className={cn(isKreatr && "font-bold")}>{row[col.key]}</span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
