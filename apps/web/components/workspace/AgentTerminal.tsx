"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Circle,
  Pause,
  Play,
  RotateCcw,
  Terminal as TerminalIcon,
  type LucideIcon,
} from "lucide-react";
import {
  agentLog as seedAgentLog,
  metrics as seedMetrics,
  postPublishLog,
  type LogEntry,
  type LogLevel,
} from "@/lib/mockData";
import { eventStreamUrl, type RunMetrics, type RunStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * What the status pill says for a real run.
 *
 * Taken from the run's own status rather than from whether the event socket is
 * open. The stream stays open while a run sits at the approval gate — so that
 * the publish and verify entries arrive live once the creator decides — and
 * calling that "Live" would suggest an agent that is still working when it is
 * in fact waiting on a human.
 */
const statusLabel: Record<RunStatus, { label: string; active: boolean }> = {
  queued: { label: "Queued", active: false },
  running: { label: "Live", active: true },
  awaiting_approval: { label: "Awaiting approval", active: false },
  completed: { label: "Ended", active: false },
  failed: { label: "Failed", active: false },
};

const levelStyle: Record<LogLevel, { text: string; dot: string; label: string }> = {
  ingest: { text: "text-sky-300", dot: "bg-sky-400", label: "Ingest" },
  tool: { text: "text-lime-custom", dot: "bg-lime-custom", label: "Tool" },
  reasoning: { text: "text-violet-300", dot: "bg-violet-400", label: "Reasoning" },
  memory: { text: "text-cyan-300", dot: "bg-cyan-400", label: "Memory" },
  gatekeeper: { text: "text-amber-300", dot: "bg-amber-400", label: "Gatekeeper" },
  verify: { text: "text-emerald-300", dot: "bg-emerald-400", label: "Verify" },
  error: { text: "text-red-400", dot: "bg-red-500", label: "Error" },
  learn: { text: "text-fuchsia-300", dot: "bg-fuchsia-400", label: "Learning" },
};

const filters: { key: LogLevel | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "tool", label: "Tool calls" },
  { key: "reasoning", label: "Reasoning" },
  { key: "memory", label: "Memory" },
  { key: "error", label: "Errors" },
];

/**
 * Subscribes to a run's server-sent activity stream.
 *
 * The server replays the log from the beginning on every connection, so each
 * open resets the buffer rather than appending to it — an automatic EventSource
 * reconnect would otherwise duplicate the entire feed. For the same reason the
 * `done` event closes the source explicitly: the server ends the response when
 * the run settles, and EventSource treats a closed stream as a reason to
 * reconnect and replay it forever.
 *
 * Without a run id there is nothing to stream, and the seeded log is used as-is.
 */
function useRunStream(runId: string | null, seeded: LogEntry[]) {
  const [entries, setEntries] = useState<LogEntry[]>(seeded);
  const [streaming, setStreaming] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!runId) return;

    const source = new EventSource(eventStreamUrl(runId));
    let received: LogEntry[] = [];

    source.onopen = () => {
      received = [];
      setStreaming(true);
    };

    source.onmessage = (event) => {
      try {
        received = [...received, JSON.parse(event.data) as LogEntry];
        setEntries(received);
      } catch {
        // One malformed frame should not tear down the whole feed.
      }
    };

    source.addEventListener("done", () => {
      setFinished(true);
      setStreaming(false);
      source.close();
    });

    // Reconnection is EventSource's own business; we only stop claiming to be live.
    source.onerror = () => setStreaming(false);

    return () => source.close();
  }, [runId]);

  return { entries, streaming, finished };
}

function buildStats(metrics: RunMetrics): { label: string; value: string; icon: LucideIcon }[] {
  return [
    { label: "Tool calls", value: String(metrics.toolCalls), icon: TerminalIcon },
    {
      label: "Actions verified",
      value: `${metrics.actionsVerified}/${metrics.actionsPlanned}`,
      icon: Activity,
    },
    { label: "Recoveries", value: String(metrics.recoveries), icon: RotateCcw },
  ];
}

export function AgentTerminal({
  log: agentLog = seedAgentLog,
  metrics,
  runId = null,
  status = null,
}: {
  log?: LogEntry[];
  metrics: RunMetrics;
  runId?: string | null;
  /** The backing run's status; absent for seeded data. */
  status?: RunStatus | null;
}) {
  const stats = buildStats(metrics);
  const [session, setSession] = useState<"analysis" | "post">("analysis");
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const [visible, setVisible] = useState(0);
  const [playing, setPlaying] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  /** A run id means a real backend run is driving this screen. */
  const isLive = runId !== null;
  const { entries: liveLog, streaming, finished } = useRunStream(runId, agentLog);

  // The seeded fixture is split into two sessions to demonstrate the loop's two
  // halves. A real run has one continuous log, and showing the seeded
  // post-publication script beside it would be presenting fixture data as part
  // of an agent run — so the toggle only exists for seeded data (FR-25).
  const source: LogEntry[] = isLive
    ? liveLog
    : session === "analysis"
      ? agentLog
      : postPublishLog;

  useEffect(() => {
    setVisible(0);
    setPlaying(true);
  }, [session]);

  // Live entries arrive at the pace the agent produces them; the timed reveal
  // is a presentation device for the seeded log only.
  useEffect(() => {
    if (isLive) {
      setVisible(source.length);
      return;
    }
    if (!playing || visible >= source.length) return;
    const id = window.setTimeout(() => setVisible((n) => n + 1), 380);
    return () => window.clearTimeout(id);
  }, [isLive, playing, visible, source.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visible]);

  const streamed = source.slice(0, visible);
  const rows = useMemo(
    () => (filter === "all" ? streamed : streamed.filter((entry) => entry.level === filter)),
    [streamed, filter],
  );

  const live = isLive && status ? statusLabel[status] : null;
  // Drives the blinking cursor and the pill's pulse: seeded playback is
  // "running" while it still has lines to reveal, a real run only while the
  // agent itself is working.
  const running = live ? live.active : !isLive && visible < source.length;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2 text-zinc-500">Live agent activity</p>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Strands execution stream
            </h2>
          </div>
          {isLive ? null : (
            <div className="flex gap-2">
              {(
                [
                  { key: "analysis", label: "Analysis run" },
                  { key: "post", label: "Post-publication" },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSession(item.key)}
                  aria-pressed={session === item.key}
                  className={cn(
                    "neo-press rounded-full border-2 border-black px-4 py-2 text-xs font-extrabold shadow-neo-sm",
                    session === item.key ? "bg-lime-custom text-black" : "bg-white text-black",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Terminal */}
        <div className="overflow-hidden rounded-2xl border-2 border-black bg-[#0A0A0A] shadow-neo">
          <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-3">
            <div className="flex gap-1.5">
              <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" />
              <Circle className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              kreatr-agent · {runId ?? "vid_100saas"}
            </span>
            <span
              className={cn(
                "ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider",
                running ? "bg-lime-custom/15 text-lime-custom" : "bg-white/5 text-zinc-400",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  running ? "animate-pulse bg-lime-custom" : "bg-zinc-500",
                )}
              />
              {live ? live.label : running ? "Running" : "Idle"}
            </span>
            {/* Pausing and replaying are affordances of the seeded playback. A
                real stream is not ours to rewind. */}
            {isLive ? null : (
              <>
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  aria-label={playing ? "Pause stream" : "Resume stream"}
                  className="rounded-full border border-zinc-700 p-1.5 text-zinc-300 transition-colors hover:text-white"
                >
                  {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVisible(0);
                    setPlaying(true);
                  }}
                  aria-label="Replay stream"
                  className="rounded-full border border-zinc-700 p-1.5 text-zinc-300 transition-colors hover:text-white"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </>
            )}
          </div>

          {/* Filters */}
          <div className="scrollbar-slim flex gap-2 overflow-x-auto border-b border-zinc-800 px-4 py-2.5">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={filter === item.key}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors",
                  filter === item.key
                    ? "bg-lime-custom text-black"
                    : "border border-zinc-800 text-zinc-400 hover:text-white",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div
            ref={scrollRef}
            className="scrollbar-slim h-[480px] overflow-y-auto p-4 font-mono text-[12px] leading-relaxed"
          >
            {rows.length === 0 ? (
              <p className="text-zinc-600">No entries at this filter yet.</p>
            ) : (
              <ul className="space-y-2">
                {rows.map((entry, index) => {
                  const style = levelStyle[entry.level];
                  return (
                    <li key={`${entry.time}-${index}`} className="animate-fade-up">
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <span className="text-zinc-600 tabular-nums">[{entry.time}]</span>
                        <span className={cn("font-bold", style.text)}>[{entry.tag}]</span>
                        <span className="min-w-0 flex-1 text-zinc-300">{entry.message}</span>
                      </div>
                      {entry.detail ? (
                        <p className="mt-1 border-l-2 border-zinc-800 pl-3 text-[11px] text-zinc-500">
                          {entry.detail}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}

            {running ? (
              <p className="mt-2 text-lime-custom">
                <span className="animate-pulse">▊</span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-800 px-4 py-3">
            {stats.map((stat) => (
              <span
                key={stat.label}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500"
              >
                <stat.icon className="h-3 w-3" />
                {stat.label}
                <span className="font-bold text-white">{stat.value}</span>
              </span>
            ))}
            <span className="ml-auto font-mono text-[10px] tabular-nums text-zinc-600">
              {streamed.length}/{source.length} events
            </span>
          </div>
        </div>
      </div>

      {/* Legend + explanation */}
      <aside className="space-y-5 lg:col-span-4">
        <section className="rounded-2xl border-2 border-black bg-white p-5 shadow-neo">
          <h2 className="mb-4 text-sm font-extrabold uppercase tracking-tight">Event types</h2>
          <ul className="space-y-2.5">
            {(Object.keys(levelStyle) as LogLevel[]).map((level) => (
              <li key={level} className="flex items-center gap-2.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", levelStyle[level].dot)} />
                <span className="text-[13px] font-semibold text-black">
                  {levelStyle[level].label}
                </span>
                <span className="ml-auto font-mono text-[10px] tabular-nums text-zinc-400">
                  {source.filter((entry) => entry.level === level).length}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border-2 border-black bg-lime-custom p-5 shadow-neo">
          <h2 className="text-sm font-extrabold uppercase tracking-tight">Why this matters</h2>
          <p className="mt-2.5 text-[13px] font-medium leading-relaxed text-black/80">
            Every line is a real step in the loop: tool call, reasoning, memory lookup, failure,
            retry, verification. The agent is not one model call, and this stream proves it.
          </p>
          <div className="mt-4 space-y-2 border-t-2 border-black/15 pt-4">
            {[
              "Observed the transcript",
              "Rejected weak candidates",
              "Recovered from a connector timeout",
              "Paused for human approval",
            ].map((item) => (
              <p key={item} className="flex items-center gap-2 text-[12px] font-bold text-black">
                <span className="h-1.5 w-1.5 rounded-full bg-black" />
                {item}
              </p>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
