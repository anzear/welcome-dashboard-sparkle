import React, { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/components/materialRegister/registerStore";
import type { DriverQuestion, QuestionSetAction } from "@/config/driverQuestions";

const ACTION_WORD: Record<QuestionSetAction, string> = {
  added: "added",
  archived: "archived",
  restored: "restored",
  renamed: "renamed",
  reordered: "reordered",
};

/**
 * Account-level configuration reached from the Scores section. One question set,
 * shared by every material. Archiving keeps the scores; renaming keeps the id.
 */
const QuestionSetDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void }> = ({
  open,
  onOpenChange,
}) => {
  const {
    data,
    questions,
    archivedQuestions,
    questionCoverage,
    canEditQuestionSet,
    addQuestion,
    renameQuestion,
    setQuestionHelper,
    archiveQuestion,
    restoreQuestion,
    reorderQuestions,
    questionSetEvents,
  } = useRegister();

  const total = data.length;
  const readOnly = !canEditQuestionSet;

  const [editing, setEditing] = useState<{ id: string; field: "label" | "helper" } | null>(null);
  const [draft, setDraft] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newHelper, setNewHelper] = useState("");
  const [confirm, setConfirm] = useState<{ q: DriverQuestion; coverage: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);

  const coverage = useMemo(
    () => Object.fromEntries(questions.map((q) => [q.question_id, questionCoverage(q.question_id, data)])),
    [questions, data, questionCoverage],
  );

  const beginEdit = (q: DriverQuestion, field: "label" | "helper") => {
    if (readOnly) return;
    setEditing({ id: q.question_id, field });
    setDraft(field === "label" ? q.label : (q.helper ?? ""));
  };

  const commitEdit = () => {
    if (!editing) return;
    if (editing.field === "label") renameQuestion(editing.id, draft);
    else setQuestionHelper(editing.id, draft);
    setEditing(null);
  };

  const onDrop = (targetId: string) => {
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === targetId) return;
    const ids = questions.map((q) => q.question_id).filter((id) => id !== from);
    const at = ids.indexOf(targetId);
    ids.splice(at, 0, from);
    reorderQuestions(ids);
  };

  const handleArchive = (q: DriverQuestion) => {
    const cov = coverage[q.question_id] ?? 0;
    if (cov === 0) {
      archiveQuestion(q.question_id);
      return;
    }
    setConfirm({ q, coverage: cov });
  };

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    addQuestion(newLabel, newHelper);
    setNewLabel("");
    setNewHelper("");
    setNotice(`Question added. Unscored on all ${total} materials.`);
    window.setTimeout(() => setNotice(null), 5000);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">Driver questions</DialogTitle>
            <DialogDescription className="text-xs text-amber-700 dark:text-amber-500">
              These questions apply to every material in your register. Changes here change the scoring set
              for all {total} materials.
            </DialogDescription>
          </DialogHeader>

          {readOnly && (
            <p className="text-[11px] text-muted-foreground">Managed by your workspace administrator.</p>
          )}

          <div className="divide-y divide-border/60">
            {questions.map((q) => {
              const labelEditing = editing?.id === q.question_id && editing.field === "label";
              const helperEditing = editing?.id === q.question_id && editing.field === "helper";
              return (
                <div
                  key={q.question_id}
                  draggable={!readOnly}
                  onDragStart={() => (dragId.current = q.question_id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(q.question_id)}
                  className="group flex items-start gap-2 py-2"
                >
                  <GripVertical
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40",
                      readOnly ? "opacity-30" : "cursor-grab",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    {labelEditing ? (
                      <>
                        <Input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit();
                            if (e.key === "Escape") setEditing(null);
                          }}
                          className="h-7 text-xs"
                        />
                        <p className="pt-0.5 text-[10px] text-muted-foreground">
                          Existing scores keep their values.
                        </p>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => beginEdit(q, "label")}
                        className="block text-left text-xs text-foreground"
                      >
                        {q.label}
                      </button>
                    )}

                    {helperEditing ? (
                      <Input
                        autoFocus
                        value={draft}
                        placeholder="What does +5 mean? What does -5 mean?"
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          if (e.key === "Escape") setEditing(null);
                        }}
                        className="mt-1 h-7 text-[11px]"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => beginEdit(q, "helper")}
                        className="block text-left text-[10px] text-muted-foreground"
                      >
                        {q.helper ?? "What does +5 mean? What does -5 mean?"}
                      </button>
                    )}
                  </div>

                  <span className="shrink-0 pt-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                    scored on {coverage[q.question_id] ?? 0} of {total}
                  </span>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleArchive(q)}
                      className="shrink-0 pt-0.5 text-[10px] text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    >
                      Archive
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {archivedQuestions.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowArchived((v) => !v)}
                className="text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2"
              >
                {archivedQuestions.length} archived
              </button>
              {showArchived && (
                <div className="mt-1 space-y-1">
                  {archivedQuestions.map((q) => (
                    <div key={q.question_id} className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">{q.label}</span>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => restoreQuestion(q.question_id)}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!readOnly && (
            <div className="space-y-1.5 border-t border-border/60 pt-3">
              <p className="text-[11px] text-foreground">Add question</p>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Question label"
                className="h-7 text-xs"
              />
              <Input
                value={newHelper}
                onChange={(e) => setNewHelper(e.target.value)}
                placeholder="What does +5 mean? What does -5 mean? (optional)"
                className="h-7 text-[11px]"
              />
              <Button size="sm" variant="secondary" disabled={!newLabel.trim()} onClick={handleAdd}>
                Add question
              </Button>
            </div>
          )}

          {questionSetEvents.length > 0 && (
            <div className="border-t border-border/60 pt-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Recent changes</p>
              <ul className="mt-1 space-y-0.5">
                {questionSetEvents.slice(0, 5).map((e) => (
                  <li key={e.event_id} className="text-[10px] text-muted-foreground">
                    {ACTION_WORD[e.action]}
                    {e.action === "renamed" && e.from_label
                      ? ` “${e.from_label}” to “${e.to_label}”`
                      : e.to_label
                        ? ` “${e.to_label}”`
                        : ` ${e.question_id || "question order"}`}{" "}
                    · {e.changed_by} · {e.changed_at.slice(0, 10)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-medium">
              Archive “{confirm?.q.label}”?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs">
              <span className="block">
                This question is scored on {confirm?.coverage} of {total} materials. Those scores are kept and
                can be restored, but the question stops appearing on material pages, in the scoring matrix,
                and in strong driver and constraint counts.
              </span>
              <span className="block">
                This will change strong driver and constraint counts, and positions on the prioritisation
                grid.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm) archiveQuestion(confirm.q.question_id);
                setConfirm(null);
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {notice && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md border border-border bg-background px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm">
          {notice}
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="ml-3 text-[10px] underline decoration-dotted"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
};

export default QuestionSetDialog;
