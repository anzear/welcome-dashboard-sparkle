import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRegister } from "@/components/materialRegister/registerStore";
import { ScoreScale, scoreTone, signed } from "@/components/materialRegister/scorePrimitives";
import type { Material } from "@/types/materialPrioritisation";

type Mode = "by_question" | "by_material";

const HEAD = "text-[9px] font-semibold uppercase tracking-widest text-muted-foreground";

/** One focused item in the entry panel: a material/question pair. */
interface EntryTarget {
  material: Material;
  questionId: string;
}

const DriverScoring: React.FC = () => {
  const { ordered, scoreFor, setScore, countsFor, questionCoverage, filtersActive, questions } = useRegister();
  const rows = useMemo(() => ordered.map((r) => r.m), [ordered]);

  const [mode, setMode] = useState<Mode>("by_question");
  const [focusQuestion, setFocusQuestion] = useState<string | null>(null);
  const [focusMaterial, setFocusMaterial] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const totalCells = rows.length * questions.length;
  const scoredCells = useMemo(
    () =>
      rows.reduce(
        (acc, m) =>
          acc + questions.filter((q) => (scoreFor(m.material_id, q.question_id)?.score ?? null) !== null).length,
        0,
      ),
    [rows, scoreFor],
  );
  const pct = totalCells === 0 ? 0 : Math.round((scoredCells / totalCells) * 100);

  /** The isolated run of items being scored, in order. */
  const run: EntryTarget[] = useMemo(() => {
    if (mode === "by_question" && focusQuestion) {
      return rows.map((m) => ({ material: m, questionId: focusQuestion }));
    }
    if (mode === "by_material" && focusMaterial) {
      const m = rows.find((x) => x.material_id === focusMaterial);
      if (!m) return [];
      return questions.map((q) => ({ material: m, questionId: q.question_id }));
    }
    return [];
  }, [mode, focusQuestion, focusMaterial, rows]);

  const current = run[index] ?? null;
  const currentScore = current ? (scoreFor(current.material.material_id, current.questionId)?.score ?? null) : null;

  useEffect(() => {
    if (current) setNote(scoreFor(current.material.material_id, current.questionId)?.note ?? "");
  }, [current?.material.material_id, current?.questionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (run.length > 0) panelRef.current?.focus();
  }, [run.length]);

  const runScored = run.filter(
    (t) => (scoreFor(t.material.material_id, t.questionId)?.score ?? null) !== null,
  ).length;

  const openRun = (next: Mode, id: string) => {
    setMode(next);
    if (next === "by_question") setFocusQuestion(id);
    else setFocusMaterial(id);
    setIndex(0);
  };

  const exitRun = () => {
    setFocusQuestion(null);
    setFocusMaterial(null);
    setIndex(0);
  };

  const step = (delta: number) => {
    setIndex((i) => Math.max(0, Math.min(run.length - 1, i + delta)));
  };

  const commit = (value: number) => {
    if (!current) return;
    setScore(current.material.material_id, current.questionId, value, note || null);
  };

  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (!current) return;
    if (e.key === "Enter") {
      e.preventDefault();
      step(1);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      exitRun();
      return;
    }
    // Digits 0-5 set magnitude; a leading minus makes it a constraint.
    if (/^[0-5]$/.test(e.key)) {
      e.preventDefault();
      const mag = Number(e.key);
      commit(negativeNext.current ? -mag : mag);
      negativeNext.current = false;
      return;
    }
    if (e.key === "-") {
      negativeNext.current = true;
    }
  };

  const negativeNext = useRef(false);
  const questionLabel = (id: string) => questions.find((q) => q.question_id === id)?.label ?? id;
  const questionHelper = (id: string) => questions.find((q) => q.question_id === id)?.helper ?? "";

  return (
    <div className="space-y-3">
      {/* Mode switch and coverage */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className={HEAD}>Entry mode</span>
          <div className="inline-flex items-center gap-1 rounded-md bg-muted p-0.5">
            {(
              [
                { id: "by_question", label: "Score by question" },
                { id: "by_material", label: "Score by material" },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setMode(o.id);
                  exitRun();
                }}
                className={cn(
                  "rounded-[4px] px-2 py-0.5 text-[11px] font-medium transition-colors",
                  mode === o.id
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{scoredCells.toLocaleString("en-GB")}</span> of{" "}
          <span className="font-mono tabular-nums">{totalCells.toLocaleString("en-GB")}</span> cells scored (
          <span className="font-mono tabular-nums">{pct}%</span>)
        </div>
        {filtersActive && (
          <span className="text-[10px] text-muted-foreground">Matrix follows the register's current filters.</span>
        )}
        <span className="text-[10px] text-muted-foreground">
          Partial scoring is normal. Nothing depends on filling this in.
        </span>
      </div>

      {/* Focused entry panel */}
      {current ? (
        <div
          ref={panelRef}
          tabIndex={0}
          onKeyDown={onPanelKeyDown}
          className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <div className={HEAD}>{mode === "by_question" ? questionLabel(current.questionId) : current.material.name}</div>
              <div className="text-sm font-semibold tracking-tight text-foreground">
                {mode === "by_question" ? current.material.name : questionLabel(current.questionId)}
              </div>
              <div className="text-[10px] text-muted-foreground">{questionHelper(current.questionId)}</div>
            </div>
            <div className="text-[11px] text-muted-foreground">
              <span className="font-mono tabular-nums text-foreground">{runScored}</span> of{" "}
              <span className="font-mono tabular-nums">{run.length}</span> scored
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ScoreScale value={currentScore} onChange={commit} ariaLabel="Driver score" />
            <span className="text-[10px] text-muted-foreground">
              -5 strong constraint · 0 neutral · +5 strong driver
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => {
                if (currentScore !== null) commit(currentScore);
              }}
              placeholder="Note (optional)"
              className="h-7 max-w-md text-[11px]"
            />
            <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => step(1)}>
              Skip
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => step(-1)} disabled={index === 0}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => step(1)}
              disabled={index >= run.length - 1}
            >
              Next
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={exitRun}>
              Back to matrix
            </Button>
            <span className="text-[10px] text-muted-foreground">
              Keyboard: 0-5 scores, minus first for a constraint, Enter or arrows move on, Esc exits.
            </span>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          {mode === "by_question"
            ? "Pick a question header to work down the column of materials — like compared with like."
            : "Pick a material name to work across all twelve questions."}
        </p>
      )}

      {/* Matrix */}
      <div className="relative max-h-[70vh] overflow-auto rounded-md border border-border">
        <table className="w-full border-separate border-spacing-0 text-[11px]">
          <thead className="sticky top-0 z-20">
            <tr>
              <th
                className={cn(
                  HEAD,
                  "sticky left-0 z-30 min-w-[220px] border-b border-r border-border bg-background px-3 py-2 text-left",
                )}
              >
                Material
              </th>
              {questions.map((q) => {
                const cov = questionCoverage(q.question_id, rows);
                const active = mode === "by_question" && focusQuestion === q.question_id;
                return (
                  <th
                    key={q.question_id}
                    title={q.helper ? `${q.label} — ${q.helper}` : q.label}
                    className={cn(
                      "border-b border-border bg-background px-1 py-1.5 align-bottom",
                      active && "bg-primary/5",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => openRun("by_question", q.question_id)}
                      className="flex w-full flex-col items-center gap-0.5"
                    >
                      <span
                        className={cn(
                          HEAD,
                          "hover:text-foreground",
                          active && "text-primary",
                        )}
                      >
                        {q.short}
                      </span>
                      <span className="font-mono text-[9px] tabular-nums text-muted-foreground/70">
                        {cov}/{rows.length}
                      </span>
                    </button>
                  </th>
                );
              })}
              <th className={cn(HEAD, "border-b border-l border-border bg-background px-2 py-2 text-right")}>
                Scored
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const counts = countsFor(m.material_id);
              const activeRow = mode === "by_material" && focusMaterial === m.material_id;
              return (
                <tr key={m.material_id} className={cn("hover:bg-muted/40", activeRow && "bg-primary/5")}>
                  <td
                    className={cn(
                      "sticky left-0 z-10 border-b border-r border-border bg-background px-3 py-1 align-middle",
                      activeRow && "bg-primary/5",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => openRun("by_material", m.material_id)}
                      className="block max-w-[200px] truncate text-left hover:text-primary"
                      title={m.name}
                    >
                      <span className={cn("leading-tight", activeRow && "text-primary")}>{m.name}</span>
                    </button>
                    {counts.scored_count !== null && (
                      <span className="block text-[9px] leading-tight text-muted-foreground">
                        {counts.strong_drivers} strong {counts.strong_drivers === 1 ? "driver" : "drivers"},{" "}
                        {counts.strong_constraints} strong{" "}
                        {counts.strong_constraints === 1 ? "constraint" : "constraints"}
                      </span>
                    )}
                  </td>
                  {questions.map((q) => {
                    const rec = scoreFor(m.material_id, q.question_id);
                    const v = rec?.score ?? null;
                    const activeCol = mode === "by_question" && focusQuestion === q.question_id;
                    return (
                      <td
                        key={q.question_id}
                        className={cn("border-b border-border px-1 py-1 text-center", activeCol && "bg-primary/5")}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            openRun(mode, mode === "by_question" ? q.question_id : m.material_id);
                            setIndex(
                              mode === "by_question"
                                ? rows.findIndex((r) => r.material_id === m.material_id)
                                : questions.findIndex((x) => x.question_id === q.question_id),
                            );
                          }}
                          title={
                            v === null
                              ? `${m.name} · ${q.label} — not scored`
                              : `${m.name} · ${q.label} — ${signed(v)}${rec?.note ? ` · ${rec.note}` : ""}${
                                  rec ? ` · ${rec.scored_by} on ${rec.scored_at.slice(0, 10)}` : ""
                                }`
                          }
                          className={cn(
                            "mx-auto flex h-5 w-7 items-center justify-center rounded-[3px] font-mono text-[10px] tabular-nums",
                            scoreTone(v),
                          )}
                        >
                          {v === null ? "·" : signed(v)}
                        </button>
                      </td>
                    );
                  })}
                  <td className="border-b border-l border-border px-2 py-1 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
                    {counts.scored_count === null ? (
                      <span className="text-muted-foreground/60" title="No judgements recorded">
                        —
                      </span>
                    ) : (
                      `${counts.scored_count}/12`
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className={cn("inline-block h-3 w-5 rounded-[3px]", scoreTone(-4))} /> constraint
        </span>
        <span className="flex items-center gap-1">
          <span className={cn("inline-block h-3 w-5 rounded-[3px]", scoreTone(0))} /> recorded neutral
        </span>
        <span className="flex items-center gap-1">
          <span className={cn("inline-block h-3 w-5 rounded-[3px]", scoreTone(4))} /> driver
        </span>
        <span className="flex items-center gap-1">
          <span className={cn("inline-block h-3 w-5 rounded-[3px]", scoreTone(null))} /> not scored — not zero
        </span>
        <span>Counts of judgements only. Scores are never combined into an index.</span>
      </div>
    </div>
  );
};

export default DriverScoring;
