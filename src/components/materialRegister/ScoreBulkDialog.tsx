import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SCORE_POINTS } from "@/config/driverQuestions";
import { scoreTone, signed } from "@/components/materialRegister/scorePrimitives";
import { useRegister } from "@/components/materialRegister/registerStore";

export type ScoreBulkKind = "set" | "clear";

/**
 * Bulk judgement across the selection. The confirmation states exactly what
 * changes before anything is written: how many are unscored, how many move from
 * another value, how many already hold it.
 */
const ScoreBulkDialog: React.FC<{
  open: boolean;
  kind: ScoreBulkKind;
  ids: string[];
  onOpenChange: (v: boolean) => void;
}> = ({ open, kind, ids, onOpenChange }) => {
  const { questions, scoreFor, applyScoreBulk } = useRegister();
  const [questionId, setQuestionId] = useState<string>("");
  const [value, setValue] = useState<number | null>(null);

  const q = questions.find((x) => x.question_id === questionId) ?? null;
  const ready = kind === "clear" ? Boolean(q) : Boolean(q) && value !== null;

  const breakdown = useMemo(() => {
    if (!q) return { unscored: 0, changing: 0, already: 0 };
    let unscored = 0;
    let changing = 0;
    let already = 0;
    ids.forEach((id) => {
      const current = scoreFor(id, q.question_id)?.score ?? null;
      const target = kind === "clear" ? null : value;
      if (current === target) already += 1;
      else if (current === null) unscored += 1;
      else changing += 1;
    });
    return { unscored, changing, already };
  }, [ids, q, value, kind, scoreFor]);

  const close = () => {
    onOpenChange(false);
    setQuestionId("");
    setValue(null);
  };

  const apply = () => {
    if (!q) return;
    applyScoreBulk(q.question_id, kind === "clear" ? null : value, new Set(ids));
    close();
  };

  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {kind === "clear" ? "Clear score" : "Set score"} for{" "}
            <span className="font-mono tabular-nums">{ids.length}</span>{" "}
            {plural(ids.length, "material", "materials")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Driver</span>
            <select
              value={questionId}
              onChange={(e) => setQuestionId(e.target.value)}
              className="h-8 w-full rounded-sm border border-border bg-background px-2 text-[12px]"
            >
              <option value="">Pick a driver…</option>
              {questions.map((x) => (
                <option key={x.question_id} value={x.question_id}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>

          {kind === "set" && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Value</span>
              <div className="flex flex-wrap items-center gap-[3px]">
                {SCORE_POINTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue(p)}
                    aria-pressed={value === p}
                    className={cn(
                      "h-7 w-8 rounded-[3px] border font-mono text-[11px] tabular-nums transition-colors",
                      value === p
                        ? cn(scoreTone(p), "border-foreground/40 bg-muted font-semibold")
                        : "border-border bg-background text-muted-foreground/70 hover:bg-muted",
                    )}
                  >
                    {signed(p)}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">-5 strong constraint · 0 neutral · +5 strong driver</p>
            </div>
          )}

          {ready && q && (
            <div className="space-y-0.5 rounded-md border border-border bg-muted/40 p-2 text-[11px]">
              <p className="font-medium text-foreground">
                {kind === "clear"
                  ? `Clear ${q.label} for ${ids.length} ${plural(ids.length, "material", "materials")}?`
                  : `Set ${q.label} to ${signed(value)} for ${ids.length} ${plural(ids.length, "material", "materials")}?`}
              </p>
              <p className="text-muted-foreground">
                <span className="font-mono tabular-nums">{breakdown.unscored}</span> currently unscored.
              </p>
              <p className="text-muted-foreground">
                <span className="font-mono tabular-nums">{breakdown.changing}</span> will change from another value.
              </p>
              <p className="text-muted-foreground">
                <span className="font-mono tabular-nums">{breakdown.already}</span> already{" "}
                {kind === "clear" ? "unscored" : signed(value)}.
              </p>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            These are recorded as your team's judgement, same as scoring one at a time.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={close}>
            Cancel
          </Button>
          <Button size="sm" className="h-7 text-[11px]" disabled={!ready} onClick={apply}>
            {kind === "clear" ? "Clear score" : "Set score"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreBulkDialog;
