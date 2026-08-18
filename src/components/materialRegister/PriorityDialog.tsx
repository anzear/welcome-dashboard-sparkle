import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Material } from "@/types/materialPrioritisation";

interface Props {
  open: boolean;
  add: boolean;
  period: string;
  materials: Material[];
  onCancel: () => void;
  onApply: () => void;
}

/** States what changes before anything is written — same pattern as bulk edit. */
const PriorityDialog: React.FC<Props> = ({ open, add, period, materials, onCancel, onApply }) => {
  const already = materials.filter((m) => m.priority_period === period);
  const changing = add ? materials.filter((m) => !already.includes(m)) : already;
  const untouched = materials.length - changing.length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="portfolio-type max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {add ? `Add to the ${period} priority set` : `Remove from the ${period} priority set`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            This writes a priority change to the event log for each material, all under one batch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 text-xs">
          <p className="text-foreground">
            <span className="font-mono tabular-nums">{changing.length}</span>{" "}
            {add ? "will be added" : "will be removed"}.
          </p>
          {untouched > 0 && (
            <p className="text-muted-foreground">
              <span className="font-mono tabular-nums">{untouched}</span>{" "}
              {add ? "already in the set — unchanged" : "not in the set — unchanged"}.
            </p>
          )}
          <div className="max-h-40 overflow-auto rounded-sm border border-border p-1.5">
            {changing.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Nothing to change.</p>
            ) : (
              changing.map((m) => (
                <p key={m.material_id} className="text-[11px] text-foreground">
                  {m.name}
                </p>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" disabled={changing.length === 0} onClick={onApply}>
            {add ? "Add" : "Remove"} {changing.length}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PriorityDialog;
