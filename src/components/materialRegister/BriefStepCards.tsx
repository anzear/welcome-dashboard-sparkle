import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Paperclip } from "lucide-react";
import type { Material } from "@/types/materialPrioritisation";
import MaterialRequirementsDialog, {
  emptyEvidence,
  evidenceFilledCount,
  evidenceRequestedCount,
  type EvidenceState,
} from "@/components/materialRegister/MaterialRequirementsDialog";

export type StepState = "completed" | "in_progress" | "not_started";

const STATE_LABEL: Record<StepState, string> = {
  completed: "Complete",
  in_progress: "In progress",
  not_started: "Not started",
};

/**
 * Requirements and documents. A quiet single row while empty — an empty state
 * never outranks populated content. Opens the full document list on click.
 */
const BriefStepCards: React.FC<{ material: Material; scoredCount?: number }> = ({ material }) => {
  const [reqOpen, setReqOpen] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceState>(emptyEvidence());

  const attached = evidenceFilledCount(evidence);
  const requested = evidenceRequestedCount(evidence);
  const state: StepState =
    attached > 0 && requested === 0 ? "completed" : attached > 0 || requested > 0 ? "in_progress" : "not_started";

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setReqOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setReqOpen(true);
        }}
        className="group flex cursor-pointer items-center gap-2 rounded-sm py-1.5 text-[11px] hover:bg-muted/50"
      >
        <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-foreground">Material requirements</span>
        <span className={cn("text-muted-foreground", state === "completed" && "text-foreground")}>
          · {STATE_LABEL[state]}
        </span>
        {attached > 0 && (
          <span className="font-mono tabular-nums text-muted-foreground">
            {attached} document{attached === 1 ? "" : "s"}
          </span>
        )}
        {requested > 0 && (
          <span className="font-mono tabular-nums text-amber-600">{requested} requested</span>
        )}
        <span className="ml-auto text-muted-foreground underline decoration-dotted underline-offset-2 group-hover:text-foreground">
          Upload
        </span>
      </div>


      {reqOpen && (
        <MaterialRequirementsDialog
          open={reqOpen}
          onOpenChange={setReqOpen}
          value={evidence}
          onSave={setEvidence}
        />
      )}
    </>
  );
};

export default BriefStepCards;
