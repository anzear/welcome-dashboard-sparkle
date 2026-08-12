import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCORE_POINTS } from "@/config/driverQuestions";
import { scoreTone, signed } from "@/components/materialRegister/scorePrimitives";
import { useRegister } from "@/components/materialRegister/registerStore";

export type ScoreBulkKind = "set" | "clear";

/**
 * Bulk judgement across the selection. The first driver is selected on open;
 * the user moves through drivers with the arrows or the dropdown and can stage
 * several drivers in one session before saving. Nothing is written until Save.
 */
const ScoreBulkDialog: React.FC<{
  open: boolean;
  kind: ScoreBulkKind;
  ids: string[];
  onOpenChange: (v: boolean) => void;
}> = ({ open, kind, ids, onOpenChange }) => {
  const { questions, scoreFor, applyScoreBulk } = useRegister();
  const [index, setIndex] = useState(0);
  /** Staged changes for this session. Key present = will be written. */
  const [staged, setStaged] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (open) {
      setIndex(0);
      setStaged({});
    }
  }, [open, kind]);

  const q = questions[index] ?? null;
  const stagedKeys = Object.keys(staged);
  const value = q && q.question_id in staged ? staged[q.question_id] : null;
  const hasStagedHere = Boolean(q && q.question_id in staged);

  const breakdown = useMemo(() => {
    if (!q || !hasStagedHere) return { unscored: 0, changing: 0, already: 0 };
    let unscored = 0;
    let changing = 0;
    let already = 0;
    ids.forEach((id) => {
      const current = scoreFor(id, q.question_id)?.score ?? null;
      const target = staged[q.question_id];
      if (current === target) already += 1;
      else if (current === null) unscored += 1;
      else changing += 1;
    });
    return { unscored, changing, already };
  }, [ids, q, staged, hasStagedHere, scoreFor]);

  const close = () => {
    onOpenChange(false);
    setIndex(0);
    setStaged({});
  };

  const stage = (v: number | null) => {
    if (!q) return;
    setStaged((prev) => ({ ...prev, [q.question_id]: v }));
  };

  const unstage = () => {
    if (!q) return;
    setStaged((prev) => {
      const next = { ...prev };
      delete next[q.question_id];
      return next;
    });
  };

  const step = (delta: number) => {
    setIndex((i) => Math.min(questions.length - 1, Math.max(0, i + delta)));
  };

  const save = () => {
    stagedKeys.forEach((qid) => {
      applyScoreBulk(qid, staged[qid], new Set(ids));
    });
    close();
  };

  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {kind === "clear" ? "Clear scores" : "Set scores"} for{" "}
            <span className="font-mono tabular-nums">{ids.length}</span>{" "}
            {plural(ids.length, "material", "materials")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Driver</span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={index === 0}
                onClick={() => step(-1)}
                aria-label="Previous driver"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <select
                value={q?.question_id ?? ""}
                onChange={(e) => setIndex(Math.max(0, questions.findIndex((x) => x.question_id === e.target.value)))}
                className="h-8 min-w-0 flex-1 rounded-sm border border-border bg-background px-2 text-[12px]"
              >
                {questions.map((x) => (
                  <option key={x.question_id} value={x.question_id}>
                    {x.label}
                    {x.question_id in staged
                      ? ` — ${staged[x.question_id] === null ? "clear" : signed(staged[x.question_id] as number)}`
                      : ""}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={index >= questions.length - 1}
                onClick={() => step(1)}
                aria-label="Next driver"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Driver <span className="font-mono tabular-nums">{index + 1}</span> of{" "}
              <span className="font-mono tabular-nums">{questions.length}</span>
              {q?.helper ? ` · ${q.helper}` : ""}
            </p>
          </div>

          {kind === "set" ? (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Value</span>
              <div className="flex flex-wrap items-center gap-[3px]">
                {SCORE_POINTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => stage(p)}
                    aria-pressed={value === p && hasStagedHere}
                    className={cn(
                      "h-7 w-8 rounded-[3px] border font-mono text-[11px] tabular-nums transition-colors",
                      hasStagedHere && value === p
                        ? cn(scoreTone(p), "border-foreground/40 bg-muted font-semibold")
                        : "border-border bg-background text-muted-foreground/70 hover:bg-muted",
                    )}
                  >
                    {signed(p)}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">-5 strong constraint · 0 neutral · +5 strong driver</p>
                {hasStagedHere && (
                  <button type="button" onClick={unstage} className="text-[10px] underline text-muted-foreground">
                    Remove
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={hasStagedHere ? "default" : "outline"}
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => (hasStagedHere ? unstage() : stage(null))}
              >
                {hasStagedHere ? "Staged for clearing" : "Clear this driver"}
              </Button>
            </div>
          )}

          {hasStagedHere && q && (
            <div className="space-y-0.5 rounded-md border border-border bg-muted/40 p-2 text-[11px]">
              <p className="font-medium text-foreground">
                {staged[q.question_id] === null
                  ? `Clear ${q.label} for ${ids.length} ${plural(ids.length, "material", "materials")}`
                  : `Set ${q.label} to ${signed(staged[q.question_id] as number)} for ${ids.length} ${plural(ids.length, "material", "materials")}`}
              </p>
              <p className="text-muted-foreground">
                <span className="font-mono tabular-nums">{breakdown.unscored}</span> currently unscored.
              </p>
              <p className="text-muted-foreground">
                <span className="font-mono tabular-nums">{breakdown.changing}</span> will change from another value.
              </p>
              <p className="text-muted-foreground">
                <span className="font-mono tabular-nums">{breakdown.already}</span> already{" "}
                {staged[q.question_id] === null ? "unscored" : signed(staged[q.question_id] as number)}.
              </p>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            <span className="font-mono tabular-nums">{stagedKeys.length}</span>{" "}
            {plural(stagedKeys.length, "driver", "drivers")} staged. Nothing is written until you save. These are
            recorded as your team's judgement, same as scoring one at a time.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={close}>
            Cancel
          </Button>
          <Button size="sm" className="h-7 text-[11px]" disabled={stagedKeys.length === 0} onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreBulkDialog;
