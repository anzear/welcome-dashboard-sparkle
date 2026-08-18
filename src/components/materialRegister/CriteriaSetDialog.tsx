import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRegister } from "@/components/materialRegister/registerStore";
import { shortDate } from "@/components/materialRegister/primitives";
import { ComingSoonTag } from "@/components/materialRegister/vcgSignals";
import type { AssessmentCriterion } from "@/types/materialPrioritisation";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";

const FIELD =
  "w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring";
const LABEL = "text-[10px] font-medium uppercase tracking-wide text-muted-foreground";

type Draft = { label: string; helper: string; anchors: string };

const EMPTY: Draft = { label: "", helper: "", anchors: "" };

/** The shared warning. Nothing here is local to one material. */
const SharedNotice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/10 px-2 py-1.5 text-[10px] leading-snug text-amber-800 dark:text-amber-300">
    <AlertTriangle className="mt-[1px] h-3 w-3 shrink-0" />
    <span>{children}</span>
  </div>
);

const DraftForm: React.FC<{
  draft: Draft;
  onChange: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
}> = ({ draft, onChange, onSave, onCancel, saveLabel }) => (
  <div className="space-y-2">
    <div className="space-y-1">
      <span className={LABEL}>Criterion</span>
      <input
        value={draft.label}
        autoFocus
        onChange={(e) => onChange({ ...draft, label: e.target.value })}
        placeholder="What is being judged"
        className={FIELD}
      />
    </div>
    <div className="space-y-1">
      <span className={LABEL}>Helper</span>
      <textarea
        value={draft.helper}
        rows={2}
        onChange={(e) => onChange({ ...draft, helper: e.target.value })}
        placeholder="What this criterion is asking people, in their own terms"
        className={cn(FIELD, "resize-none")}
      />
    </div>
    <div className="space-y-1">
      <span className={LABEL}>Anchors</span>
      <textarea
        value={draft.anchors}
        rows={2}
        onChange={(e) => onChange({ ...draft, anchors: e.target.value })}
        placeholder="5 = … · 1 = …"
        className={cn(FIELD, "resize-none")}
      />
    </div>
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="h-6 bg-foreground px-2.5 text-[10px] text-background hover:bg-foreground/90"
        disabled={draft.label.trim() === ""}
        onClick={onSave}
      >
        {saveLabel}
      </Button>
      <button
        type="button"
        onClick={onCancel}
        className="text-[10px] text-muted-foreground underline decoration-dotted hover:text-foreground"
      >
        Cancel
      </button>
    </div>
  </div>
);

const CriterionRow: React.FC<{ criterion: AssessmentCriterion }> = ({ criterion }) => {
  const { judgedCriteria, criterionFootprint, updateCriterion, removeCriterion } = useRegister();
  const [mode, setMode] = useState<"read" | "edit" | "confirm">("read");
  const [draft, setDraft] = useState<Draft>({
    label: criterion.label,
    helper: criterion.helper ?? "",
    anchors: criterion.anchors ?? "",
  });
  const foot = criterionFootprint(criterion.criterion_id);
  /** A judged set of nothing cannot be assessed, so the last one cannot go. */
  const lastOne = judgedCriteria.length <= 1;

  return (
    <div className="space-y-2 rounded-md border border-border/70 border-l-2 border-l-provenance-judgement/70 bg-card p-2.5">
      {mode === "edit" ? (
        <>
          <SharedNotice>
            This criterion is shared. Rewording it changes the question on every material — the{" "}
            {foot.entries} {foot.entries === 1 ? "entry" : "entries"} already recorded against it stay as they
            are, under the new wording.
          </SharedNotice>
          <DraftForm
            draft={draft}
            onChange={setDraft}
            saveLabel="Save for all materials"
            onCancel={() => setMode("read")}
            onSave={() => {
              if (updateCriterion(criterion.criterion_id, draft)) setMode("read");
            }}
          />
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-medium text-foreground">{criterion.label}</span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                title="Edit for all materials"
                onClick={() => {
                  setDraft({
                    label: criterion.label,
                    helper: criterion.helper ?? "",
                    anchors: criterion.anchors ?? "",
                  });
                  setMode("edit");
                }}
                className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                title={lastOne ? "The last judged criterion cannot be removed" : "Remove from all materials"}
                disabled={lastOne}
                onClick={() => setMode("confirm")}
                className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
          {criterion.helper && (
            <p className="text-[10px] leading-snug text-muted-foreground">{criterion.helper}</p>
          )}
          {criterion.anchors && (
            <p className="text-[10px] leading-snug text-muted-foreground/80">{criterion.anchors}</p>
          )}
          <p className="text-[10px] text-muted-foreground">
            <span className="font-mono tabular-nums text-foreground">{foot.entries}</span>{" "}
            {foot.entries === 1 ? "entry" : "entries"} across{" "}
            <span className="font-mono tabular-nums">{foot.materials}</span>{" "}
            {foot.materials === 1 ? "material" : "materials"}
            {foot.documents > 0 && (
              <>
                {" · "}
                <span className="font-mono tabular-nums">{foot.documents}</span>{" "}
                {foot.documents === 1 ? "document" : "documents"}
              </>
            )}
          </p>

          {mode === "confirm" && (
            <div className="space-y-2">
              <SharedNotice>
                Removing “{criterion.label}” takes it off every material.{" "}
                {foot.entries === 0
                  ? "No entries exist, so nothing is lost."
                  : `${foot.entries} recorded ${foot.entries === 1 ? "entry" : "entries"} and ${foot.documents} ${
                      foot.documents === 1 ? "document" : "documents"
                    } are deleted with it. This cannot be undone.`}
              </SharedNotice>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-6 px-2.5 text-[10px]"
                  onClick={() => removeCriterion(criterion.criterion_id)}
                >
                  Remove from all materials
                </Button>
                <button
                  type="button"
                  onClick={() => setMode("read")}
                  className="text-[10px] text-muted-foreground underline decoration-dotted hover:text-foreground"
                >
                  Keep it
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * The criterion set editor. One shared set for the whole portfolio, editable
 * only by a material owner. Evidence criteria are read from data and are not
 * editable here — there is no wording to agree on.
 */
const CriteriaSetDialog: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = ({
  open,
  onOpenChange,
}) => {
  const { criteria, judgedCriteria, criteriaEvents, canEditCriteria, addCriterion } = useRegister();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const evidence = criteria.filter((c) => c.kind === "evidence");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[13px]">Judged criteria</DialogTitle>
          <DialogDescription className="text-[11px]">
            One set, shared by all materials. Every change here applies to the whole portfolio.
          </DialogDescription>
        </DialogHeader>

        {!canEditCriteria ? (
          <SharedNotice>
            Only a material owner can change the criterion set. You can read it here.
          </SharedNotice>
        ) : (
          <SharedNotice>
            You are editing the set every material is scored on. Nothing here is local to one material.
          </SharedNotice>
        )}

        <div className="space-y-2">
          {judgedCriteria.map((c) =>
            canEditCriteria ? (
              <CriterionRow key={c.criterion_id} criterion={c} />
            ) : (
              <div
                key={c.criterion_id}
                className="space-y-1 rounded-md border border-border/70 bg-muted/30 p-2.5"
              >
                <span className="text-[11px] font-medium text-foreground">{c.label}</span>
                {c.helper && <p className="text-[10px] leading-snug text-muted-foreground">{c.helper}</p>}
              </div>
            ),
          )}
        </div>

        {canEditCriteria &&
          (adding ? (
            <div className="space-y-2 rounded-md border border-dashed border-border p-2.5">
              <SharedNotice>
                A new criterion appears on every material with no entries against it, so coverage drops until
                people record a view.
              </SharedNotice>
              <DraftForm
                draft={draft}
                onChange={setDraft}
                saveLabel="Add to all materials"
                onCancel={() => {
                  setAdding(false);
                  setDraft(EMPTY);
                }}
                onSave={() => {
                  if (addCriterion(draft)) {
                    setAdding(false);
                    setDraft(EMPTY);
                  }
                }}
              />
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 self-start text-[11px]"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add criterion
            </Button>
          ))}

        <div className="space-y-1 border-t border-border/60 pt-2">
          <span className={LABEL}>Read from data — not judged, not editable</span>
          {evidence.map((c) => (
            <p key={c.criterion_id} className="text-[10px] text-muted-foreground">
              <span className="text-foreground">{c.label}</span> · {c.helper}
              {c.source === "vcg" && <ComingSoonTag className="ml-1.5 align-middle" />}
            </p>
          ))}
        </div>

        <div className="space-y-1 border-t border-border/60 pt-2">
          <span className={LABEL}>Changes to the set</span>
          {criteriaEvents.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">
              The set has not been changed in this session.
            </p>
          ) : (
            criteriaEvents.map((e) => (
              <p key={e.event_id} className="text-[10px] leading-snug text-muted-foreground">
                <span className="text-foreground">{e.label}</span> {e.action} by {e.changed_by} ·{" "}
                <span className="font-mono">{shortDate(e.changed_at)}</span>
                {e.detail && <span className="block text-muted-foreground/80">{e.detail}</span>}
              </p>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CriteriaSetDialog;
