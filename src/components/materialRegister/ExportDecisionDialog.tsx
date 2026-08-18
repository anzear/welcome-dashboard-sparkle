import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRegister } from "@/components/materialRegister/registerStore";
import {
  GATE_OUTCOMES,
  GATE_OUTCOME_LABEL,
  type GateOutcome,
  type Material,
} from "@/types/materialPrioritisation";

/**
 * The decision document export. A record of what was decided — never a working
 * copy. No render, no preview, no download, no format options: the action
 * confirms and completes.
 */

const INCLUDED = [
  "Material name and CAS",
  "Product line tags",
  "Gate outcome",
  "Conditions — text, owner, due date, met status (Go with conditions)",
  "Hold trigger and review date (Hold)",
  "No-go reason (No-go)",
  "Rationale — the recommendation text",
  "Recommended by, decided by, decision date",
  "Export date and who exported",
];

const EXCLUDED: [string, string][] = [
  ["Assessment scores and rationales", "the work stays in the platform"],
  ["Supporting documents", "same"],
  ["VCG signals", "intelligence is not distributed by export"],
  ["Company figures", "the client already has these"],
];

const Contents: React.FC = () => (
  <div className="space-y-3 pt-1">
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        What the document contains
      </div>
      <ul className="mt-1 space-y-0.5 text-xs text-foreground">
        {INCLUDED.map((line) => (
          <li key={line} className="flex gap-1.5">
            <span className="text-muted-foreground/60">·</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        What it excludes
      </div>
      <ul className="mt-1 space-y-0.5 text-xs">
        {EXCLUDED.map(([what, why]) => (
          <li key={what} className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-foreground">{what}</span>
            <span className="text-muted-foreground">— {why}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const outcomeOf = (m: Material): GateOutcome | null =>
  m.journey_status === "under_evaluation" ? null : (m.journey_status as GateOutcome);

export const ExportDecisionDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** One material for a single export, many for a batch (already scoped). */
  materials: Material[];
  onExported: (count: number) => void;
}> = ({ open, onOpenChange, materials, onExported }) => {
  const { recordEvents } = useRegister();
  const batch = materials.length > 1;

  const breakdown = GATE_OUTCOMES.map((o) => ({
    outcome: o,
    count: materials.filter((m) => outcomeOf(m) === o).length,
  })).filter((r) => r.count > 0);
  const undecided = materials.filter((m) => outcomeOf(m) === null).length;

  const doExport = () => {
    const batchId = batch ? `EXP-${Date.now()}` : null;
    recordEvents(
      materials.map((m) => ({
        material_id: m.material_id,
        event_type: "decision_export" as const,
        field: "decision_export",
        from_value: null,
        to_value: outcomeOf(m) ? GATE_OUTCOME_LABEL[outcomeOf(m) as GateOutcome] : "Under evaluation",
        batch_id: batchId,
      })),
    );
    onOpenChange(false);
    onExported(materials.length);
  };

  if (materials.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {batch
              ? `Export decisions — ${materials.length} materials`
              : `Export decision — ${materials[0].name}`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Gate outcome, conditions, rationale, and who decided. Assessment scores, supporting documents,
            and VCG signals are not included.
          </DialogDescription>
        </DialogHeader>

        {batch && (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              By gate outcome
            </div>
            <ul className="mt-1 space-y-0.5 text-xs">
              {breakdown.map((r) => (
                <li key={r.outcome} className="flex items-baseline gap-2">
                  <span className="w-6 text-right font-mono tabular-nums text-foreground">{r.count}</span>
                  <span className="text-foreground">{GATE_OUTCOME_LABEL[r.outcome]}</span>
                </li>
              ))}
              {undecided > 0 && (
                <li className="flex items-baseline gap-2">
                  <span className="w-6 text-right font-mono tabular-nums text-amber-700">{undecided}</span>
                  <span className="text-amber-700">under evaluation, no decision recorded</span>
                </li>
              )}
            </ul>
          </div>
        )}

        {!batch && undecided === 1 && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-800">
            No decision recorded. The export will state that this material is under evaluation.
          </p>
        )}

        <Contents />

        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 bg-foreground text-xs text-background hover:bg-foreground/90"
            onClick={doExport}
          >
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDecisionDialog;
