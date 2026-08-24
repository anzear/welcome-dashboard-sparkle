/**
 * The one coverage request flow. Used from the material profile and from the
 * dashboard's "Available now" section — there is no second purchase path.
 */
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RoleChip } from "@/components/materialRegister/RoleChip";
import { MATERIAL_ROLE_LABEL, type MaterialRole } from "@/types/materialPrioritisation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialName: string;
  role: MaterialRole;
  onConfirm: (scope: string | null) => void;
}

export const RequestCoverageDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  materialName,
  role,
  onConfirm,
}) => {
  const [scope, setScope] = useState("");

  useEffect(() => {
    if (open) setScope("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="portfolio-type sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Request coverage</DialogTitle>
          <DialogDescription className="text-[11px]">
            VCG researches this material and builds its material brief. The brief appears
            under Your topics on the dashboard when it is ready.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2">
            <span className="text-xs font-semibold text-foreground">{materialName}</span>
            <RoleChip isExisting={role === "existing"}>{MATERIAL_ROLE_LABEL[role]}</RoleChip>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coverage-scope" className="text-[11px] font-medium">
              What should the coverage answer? <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="coverage-scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="e.g. suppliers outside the EU, or routes that avoid palm"
              className="min-h-[70px] text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 bg-foreground text-xs text-background hover:bg-foreground/90"
            onClick={() => {
              onConfirm(scope.trim() === "" ? null : scope.trim());
              onOpenChange(false);
            }}
          >
            Request coverage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestCoverageDialog;
