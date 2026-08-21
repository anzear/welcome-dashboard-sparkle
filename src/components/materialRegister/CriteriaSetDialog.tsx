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
import { AlertTriangle, EyeOff, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { MAX_CUSTOM_CRITERIA } from "@/config/assessmentCriteria";

const FIELD =
  "w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring";
const LABEL = "text-[10px] font-medium uppercase tracking-wide text-muted-foreground";

type Draft = { label: string; helper: string; anchor_low: string; anchor_high: string };

const EMPTY: Draft = { label: "", helper: "", anchor_low: "", anchor_high: "" };

/** The shared warning. Nothing here is local to one material. */
const SharedNotice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/10 px-2 py-1.5 text-[10px] leading-snug text-amber-800 dark:text-amber-300">
    <AlertTriangle className="mt-[1px] h-3 w-3 shrink-0" />
    <span>{children}</span>
  </div>
);

const CustomTag: React.FC = () => (
  <span className="rounded border border-border px-1 text-[9px] uppercase tracking-wide text-muted-foreground">
    Custom
  </span>
);

const DraftForm: React.FC<{
  draft: Draft;
  error?: string;
  onChange: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
}> = ({ draft, error, onChange, onSave, onCancel, saveLabel }) => (
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
      <span className={LABEL}>Tooltip</span>
      <textarea
        value={draft.helper}
        rows={2}
        onChange={(e) => onChange({ ...draft, helper: e.target.value })}
        placeholder="What this criterion is asking people, in their own terms"
        className={cn(FIELD, "resize-none")}
      />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <span className={LABEL}>Low anchor (1)</span>
        <input
          value={draft.anchor_low}
          onChange={(e) => onChange({ ...draft, anchor_low: e.target.value })}
          className={FIELD}
        />
      </div>
      <div className="space-y-1">
        <span className={LABEL}>High anchor (5)</span>
        <input
          value={draft.anchor_high}
          onChange={(e) => onChange({ ...draft, anchor_high: e.target.value })}
          className={FIELD}
        />
      </div>
    </div>
    {error && <p className="text-[10px] text-destructive">{error}</p>}
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

const Footprint: React.FC<{ criterionId: string }> = ({ criterionId }) => {
  const { criterionFootprint } = useRegister();
  const foot = criterionFootprint(criterionId);
  return (
    <p className="text-[10px] text-muted-foreground">
      <span className="tabular-nums text-foreground">{foot.entries}</span>{" "}
      {foot.entries === 1 ? "entry" : "entries"} across{" "}
      <span className="tabular-nums">{foot.materials}</span>{" "}
      {foot.materials === 1 ? "material" : "materials"}
      {foot.documents > 0 && (
        <>
          {" · "}
          <span className="tabular-nums">{foot.documents}</span>{" "}
          {foot.documents === 1 ? "document" : "documents"}
        </>
      )}
    </p>
  );
};

const CriterionRow: React.FC<{ criterion: AssessmentCriterion }> = ({ criterion }) => {
  const {
    criterionFootprint,
    canEditCriteria,
    hideCriterion,
    updateCustomCriterion,
    deleteCustomCriterion,
  } = useRegister();
  const [mode, setMode] = useState<"read" | "edit" | "confirmHide" | "confirmDelete">("read");
  const [error, setError] = useState<string | undefined>();
  const [draft, setDraft] = useState<Draft>({
    label: criterion.label,
    helper: criterion.helper ?? "",
    anchor_low: criterion.anchor_low ?? "",
    anchor_high: criterion.anchor_high ?? "",
  });
  const foot = criterionFootprint(criterion.criterion_id);
  const deletable = Boolean(criterion.custom) && foot.entries === 0;

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
            error={error}
            onChange={setDraft}
            saveLabel="Save for all materials"
            onCancel={() => setMode("read")}
            onSave={() => {
              const res = updateCustomCriterion(criterion.criterion_id, draft);
              if (res.ok) setMode("read");
              else setError(res.error);
            }}
          />
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
              {criterion.label}
              {criterion.custom && <CustomTag />}
            </span>
            {canEditCriteria && (
              <div className="flex shrink-0 items-center gap-1">
                {criterion.custom && (
                  <button
                    type="button"
                    title="Edit for all materials"
                    onClick={() => {
                      setDraft({
                        label: criterion.label,
                        helper: criterion.helper ?? "",
                        anchor_low: criterion.anchor_low ?? "",
                        anchor_high: criterion.anchor_high ?? "",
                      });
                      setError(undefined);
                      setMode("edit");
                    }}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  title="Take out of use. Entries are kept."
                  onClick={() => setMode("confirmHide")}
                  className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <EyeOff className="h-3 w-3" />
                </button>
                {deletable && (
                  <button
                    type="button"
                    title="Delete. It holds no entries."
                    onClick={() => setMode("confirmDelete")}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>
          {criterion.helper && (
            <p className="text-[10px] leading-snug text-muted-foreground">{criterion.helper}</p>
          )}
          {criterion.anchors && (
            <p className="text-[10px] leading-snug text-muted-foreground/80">{criterion.anchors}</p>
          )}
          <Footprint criterionId={criterion.criterion_id} />

          {mode === "confirmHide" && (
            <div className="space-y-2">
              <SharedNotice>
                Hiding “{criterion.label}” takes it out of use on every material. Existing entries are kept
                and stay readable, and it can be restored at any time.
              </SharedNotice>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-6 bg-foreground px-2.5 text-[10px] text-background hover:bg-foreground/90"
                  onClick={() => hideCriterion(criterion.criterion_id)}
                >
                  Hide for all materials
                </Button>
                <button
                  type="button"
                  onClick={() => setMode("read")}
                  className="text-[10px] text-muted-foreground underline decoration-dotted hover:text-foreground"
                >
                  Keep it in use
                </button>
              </div>
            </div>
          )}

          {mode === "confirmDelete" && (
            <div className="space-y-2">
              <SharedNotice>
                Deleting “{criterion.label}” removes it from every material. It holds no entries, so nothing
                is lost.
              </SharedNotice>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-6 px-2.5 text-[10px]"
                  onClick={() => deleteCustomCriterion(criterion.criterion_id)}
                >
                  Delete criterion
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
 * The criterion set editor. One shared set for the whole workspace, editable
 * only by a material owner. Standard criteria can be hidden but never renamed or
 * deleted. Evidence criteria are read from data and are not editable here.
 */
const CriteriaSetDialog: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = ({
  open,
  onOpenChange,
}) => {
  const {
    criteria,
    judgedCriteria,
    hiddenCriteria,
    customCriteriaCount,
    criteriaEvents,
    canEditCriteria,
    addCustomCriterion,
    restoreCriterion,
  } = useRegister();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | undefined>();
  const evidence = criteria.filter((c) => c.kind === "evidence");
  const atLimit = customCriteriaCount >= MAX_CUSTOM_CRITERIA;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="portfolio-type max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[13px]">Manage criteria</DialogTitle>
          <DialogDescription className="text-[11px]">
            One set, shared by all materials. Every change here applies to the whole workspace.
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
          {judgedCriteria.map((c) => (
            <CriterionRow key={c.criterion_id} criterion={c} />
          ))}
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
                error={error}
                onChange={setDraft}
                saveLabel="Add to all materials"
                onCancel={() => {
                  setAdding(false);
                  setDraft(EMPTY);
                  setError(undefined);
                }}
                onSave={() => {
                  const res = addCustomCriterion(draft);
                  if (res.ok) {
                    setAdding(false);
                    setDraft(EMPTY);
                    setError(undefined);
                  } else setError(res.error);
                }}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Button
                size="sm"
                variant="outline"
                disabled={atLimit}
                className="h-7 gap-1.5 self-start text-[11px]"
                onClick={() => setAdding(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add criterion
              </Button>
              {atLimit && (
                <p className="text-[10px] text-muted-foreground">
                  A workspace can hold {MAX_CUSTOM_CRITERIA} custom criteria.
                </p>
              )}
            </div>
          ))}

        {hiddenCriteria.length > 0 && (
          <div className="space-y-1 border-t border-border/60 pt-2">
            <span className={LABEL}>Hidden — out of use, entries kept</span>
            {hiddenCriteria.map((c) => (
              <div
                key={c.criterion_id}
                className="flex items-start justify-between gap-2 rounded-md border border-border/70 bg-muted/30 p-2.5"
              >
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                    {c.label}
                    {c.custom && <CustomTag />}
                  </span>
                  <Footprint criterionId={c.criterion_id} />
                </div>
                {canEditCriteria && (
                  <button
                    type="button"
                    title="Restore to full use"
                    onClick={() => restoreCriterion(c.criterion_id)}
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

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
                <span className="tabular-nums">{shortDate(e.changed_at)}</span>
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
