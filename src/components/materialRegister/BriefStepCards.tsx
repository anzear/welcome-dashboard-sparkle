import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Star, Target, Upload } from "lucide-react";
import type { Material } from "@/types/materialPrioritisation";
import MaterialDetailsDialog from "@/components/materialRegister/MaterialDetailsDialog";
import MaterialRequirementsDialog, {
  EVIDENCE_SLOTS,
  emptyEvidence,
  evidenceFilledCount,
  type EvidenceState,
} from "@/components/materialRegister/MaterialRequirementsDialog";

export type StepState = "completed" | "in_progress" | "not_started";

const STATE_LABEL: Record<StepState, string> = {
  completed: "Completed",
  in_progress: "In progress",
  not_started: "Not started",
};

const StepCard: React.FC<{
  step: number;
  title: string;
  description: string;
  state: StepState;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}> = ({ step, title, description, state, icon: Icon, onClick }) => {
  const done = state === "completed";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "rounded-lg border border-border p-4 text-left transition-colors",
        done ? "bg-muted/40" : "bg-card",
        onClick ? "hover:border-foreground/30 hover:bg-muted/60" : "cursor-default",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Step {step}
        </span>
      </div>

      <div className="mt-5">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="mt-0.5 text-[12px] text-muted-foreground">{description}</div>
      </div>

      <div className="mt-3">
        {done ? (
          <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground">
            <CheckCircle2 className="h-3 w-3" />
            {STATE_LABEL[state]}
          </span>
        ) : (
          <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {STATE_LABEL[state]}
          </span>
        )}
      </div>
    </button>
  );
};

const BriefStepCards: React.FC<{ material: Material; scoredCount?: number }> = ({
  material,
  scoredCount = 0,
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceState>(emptyEvidence());

  const detailsFields = [
    material.name,
    material.material_class,
    material.application_categories.length > 0 ? "y" : null,
    material.owner,
  ];
  const detailsFilled = detailsFields.filter(Boolean).length;
  const detailsState: StepState =
    detailsFilled === detailsFields.length ? "completed" : detailsFilled > 0 ? "in_progress" : "not_started";

  const filledEvidence = evidenceFilledCount(evidence);
  const reqState: StepState =
    filledEvidence === EVIDENCE_SLOTS.length
      ? "completed"
      : filledEvidence > 0
        ? "in_progress"
        : "not_started";

  const scoringState: StepState = scoredCount === 0 ? "not_started" : scoredCount >= 12 ? "completed" : "in_progress";

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <StepCard
          step={1}
          title="Material Details"
          description="Identify the material & intent"
          state={detailsState}
          icon={Target}
          onClick={() => setDetailsOpen(true)}
        />
        <StepCard
          step={2}
          title="Strategic Scoring"
          description="Rate priority drivers"
          state={scoringState}
          icon={Star}
        />
        <StepCard
          step={3}
          title="Material Requirements"
          description="Upload supporting docs"
          state={reqState}
          icon={Upload}
          onClick={() => setReqOpen(true)}
        />
      </div>

      {detailsOpen && (
        <MaterialDetailsDialog material={material} open={detailsOpen} onOpenChange={setDetailsOpen} />
      )}
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
