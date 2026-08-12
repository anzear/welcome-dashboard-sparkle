import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCORE_POINTS } from "@/config/driverQuestions";
import { scoreTone, signed } from "@/components/materialRegister/scorePrimitives";
import { useRegister } from "@/components/materialRegister/registerStore";

/**
 * Bulk judgement across the selection, shown inline above the matrix so the
 * selection stays visible and editable while scoring. The first driver is
 * selected by default; the user steps through drivers with the arrows or the
 * dropdown and can stage several before saving. Nothing is written until Save.
 */
const ScoreBulkPanel: React.FC<{
  ids: string[];
  onRemoveMaterial?: (id: string) => void;
  onClearSelection?: () => void;
}> = ({ ids, onRemoveMaterial, onClearSelection }) => {
  const { questions, scoreFor, applyScoreBulk, data } = useRegister();
  const [index, setIndex] = useState(0);
  /** Staged changes for this session. Key present = will be written. */
  const [staged, setStaged] = useState<Record<string, number | null>>({});

  const nameFor = useMemo(() => {
    const map = new Map(data.map((m) => [m.material_id, m.name]));
    return (id: string) => map.get(id) ?? id;
  }, [data]);

  const q = questions[index] ?? null;
  const stagedKeys = Object.keys(staged);
  const hasStagedHere = Boolean(q && q.question_id in staged);

  /** If every selected material has the same existing score for this driver, return it. */
  const commonScore = useMemo(() => {
    if (!q || ids.length === 0) return null;
    let first: number | null = null;
    let set = false;
    for (const id of ids) {
      const score = scoreFor(id, q.question_id)?.score ?? null;
      if (!set) {
        first = score;
        set = true;
      } else if (score !== first) {
        return null;
      }
    }
    return first;
  }, [ids, q, scoreFor]);

  /** Highlight the staged value first; fall back to the common existing score. */
  const effectiveValue = q && q.question_id in staged ? staged[q.question_id] : commonScore;

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
    onClearSelection?.();
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

  const step = (delta: number) => setIndex((i) => Math.min(questions.length - 1, Math.max(0, i + delta)));

  const save = () => {
    stagedKeys.forEach((qid) => applyScoreBulk(qid, staged[qid], new Set(ids)));
    close();
  };

  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

  if (!open) return null;

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Set scores</h3>
          <p className="text-[11px] text-muted-foreground">
            <span className="font-mono tabular-nums text-foreground">{ids.length}</span>{" "}
            {plural(ids.length, "material", "materials")} selected · tick more rows below to add, or remove them here.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={close}
            className="text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            Clear selection
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Selection, visible and editable */}
      <div className="flex max-h-24 flex-wrap items-start gap-1 overflow-y-auto">
        {ids.length === 0 && <span className="text-[11px] text-muted-foreground">No materials selected.</span>}
        {ids.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[11px] text-foreground"
          >
            {nameFor(id)}
            {onRemoveMaterial && (
              <button
                type="button"
                onClick={() => onRemoveMaterial(id)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${nameFor(id)} from selection`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
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

        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Value</span>
          <div className="flex flex-wrap items-center gap-[3px]">
            {SCORE_POINTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => stage(p)}
                aria-pressed={effectiveValue === p}
                className={cn(
                  "h-7 w-8 rounded-[3px] border font-mono text-[11px] tabular-nums transition-colors",
                  effectiveValue === p
                    ? cn(scoreTone(p), "border-foreground/40 bg-muted font-semibold")
                    : "border-border bg-background text-muted-foreground/70 hover:bg-muted",
                )}
              >
                {signed(p)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => stage(null)}
              aria-pressed={hasStagedHere && staged[q?.question_id ?? ""] === null}
              className={cn(
                "h-7 rounded-[3px] border px-2 text-[11px] font-medium transition-colors",
                hasStagedHere && staged[q?.question_id ?? ""] === null
                  ? "border-destructive/50 bg-destructive/10 text-destructive"
                  : "border-border bg-background text-muted-foreground/70 hover:bg-muted hover:text-destructive",
              )}
            >
              Clear
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">-5 strong constraint · 0 neutral · +5 strong driver</p>
            {hasStagedHere && (
              <button type="button" onClick={unstage} className="text-[10px] text-muted-foreground underline">
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {hasStagedHere && q && (
        <div className="space-y-0.5 rounded-md border border-border/70 bg-muted/40 p-2 text-[11px]">
          <p className="font-medium text-foreground">
            {staged[q.question_id] === null
              ? `Clear ${q.label} for ${ids.length} ${plural(ids.length, "material", "materials")}`
              : `Set ${q.label} to ${signed(staged[q.question_id] as number)} for ${ids.length} ${plural(ids.length, "material", "materials")}`}
          </p>
          <p className="text-muted-foreground">
            <span className="font-mono tabular-nums">{breakdown.unscored}</span> currently unscored ·{" "}
            <span className="font-mono tabular-nums">{breakdown.changing}</span> will change from another value ·{" "}
            <span className="font-mono tabular-nums">{breakdown.already}</span> already{" "}
            {staged[q.question_id] === null ? "unscored" : signed(staged[q.question_id] as number)}.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">
          <span className="font-mono tabular-nums">{stagedKeys.length}</span>{" "}
          {plural(stagedKeys.length, "driver", "drivers")} staged. Nothing is written until you save.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={close}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-[11px]"
            disabled={stagedKeys.length === 0 || ids.length === 0}
            onClick={save}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScoreBulkPanel;
