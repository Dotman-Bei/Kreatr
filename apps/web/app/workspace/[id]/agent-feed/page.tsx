import { AgentTerminal } from "@/components/workspace/AgentTerminal";
import { SourceBadge } from "@/components/workspace/SourceBadge";
import { loadWorkspace } from "@/lib/api";

export default async function AgentFeedPage() {
  const data = await loadWorkspace();

  return (
    <>
      <div className="mb-6 flex justify-end">
        <SourceBadge source={data.source} mode={data.mode} runId={data.runId} />
      </div>
      <AgentTerminal log={data.log} metrics={data.metrics} runId={data.runId} />
    </>
  );
}
