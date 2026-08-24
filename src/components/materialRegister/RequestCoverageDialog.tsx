/**
 * The one coverage request flow. Used from the material profile and from the
 * dashboard's "Available now" section — there is no second purchase path.
 * The questions themselves live in the shared coverage step.
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
import { RoleChip } from "@/components/materialRegister/RoleChip";
import { CoverageStep, type CoverageRunAs } from "@/components/coverage/CoverageStep";
import { MATERIAL_ROLE_LABEL, type MaterialRole } from "@/types/materialPrioritisation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialName: string;
  role: MaterialRole;
  onConfirm: (request: { runAs: CoverageRunAs; question: string | null }) => void;
}

export const RequestCoverageDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  materialName,
  role,
  onConfirm,
}) => {
  const [runAs, setRunAs] = useState<CoverageRunAs | "">("");
  const [question, setQuestion] = useState("");

  useEffect(() => {
    if (open) {
      setRunAs("");
      setQuestion("");
    }
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
          {/* The material and its role are already known — read-only here. */}
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2">
            <span className="text-xs font-semibold text-foreground">{materialName}</span>
            <RoleChip isExisting={role === "existing"}>{MATERIAL_ROLE_LABEL[role]}</RoleChip>
          </div>
          <CoverageStep
            runAs={runAs}
            onRunAsChange={setRunAs}
            question={question}
            onQuestionChange={setQuestion}
            questionFieldId="coverage-scope"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!runAs}
            className="h-7 bg-foreground text-xs text-background hover:bg-foreground/90"
            onClick={() => {
              if (!runAs) return;
              onConfirm({ runAs, question: question.trim() === "" ? null : question.trim() });
              onOpenChange(false);
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestCoverageDialog;
