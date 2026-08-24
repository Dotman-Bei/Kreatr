import { ActionPlan } from "@/components/workspace/ActionPlan";
import { SourceBadge } from "@/components/workspace/SourceBadge";
import { loadWorkspace } from "@/lib/api";

export default async function ActionsPage() {
  const data = await loadWorkspace();

  return (
    <>
      <div className="mb-6 flex justify-end">
        <SourceBadge source={data.source} mode={data.mode} runId={data.runId} />
      </div>
      <ActionPlan assets={data.assets} runId={data.runId} />
    </>
  );
}
