import { MomentInspector } from "@/components/workspace/MomentInspector";
import { SourceBadge } from "@/components/workspace/SourceBadge";
import { loadWorkspace } from "@/lib/api";

export default async function WorkspacePage() {
  const data = await loadWorkspace();

  return (
    <>
      <div className="mb-6 flex justify-end">
        <SourceBadge source={data.source} mode={data.mode} runId={data.runId} />
      </div>
      <MomentInspector moments={data.moments} metrics={data.metrics} />
    </>
  );
}
