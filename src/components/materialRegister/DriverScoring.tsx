import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRegister } from "@/components/materialRegister/registerStore";
import FilterSelects from "@/components/materialRegister/FilterSelects";
import FilterChips from "@/components/materialRegister/FilterChips";
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
  const { ordered, scoreFor, setScore, countsFor, questionCoverage, filtersActive, questions, filters, setFilters } =
    useRegister();
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
        <span className="text-[10px] text-muted-foreground">
          Partial scoring is normal. Nothing depends on filling this in.
        </span>
      </div>

      {/* Same filter scope as the register */}
      <div className="space-y-1.5 border-b border-border bg-muted/30 px-2 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search name, CAS, customer ID"
            className="h-7 w-56 bg-background text-[11px]"
          />
          <FilterSelects className="ml-auto" />
        </div>
        <FilterChips />
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

      {/* Matrix — axes follow the entry mode */}
      {(() => {
        const transposed = mode === "by_material";
        // Rows carry the entity being worked through; columns carry the other axis.
        const rowItems = transposed
          ? questions.map((q) => ({ id: q.question_id, label: q.label, short: q.short, helper: q.helper }))
          : rows.map((m) => ({ id: m.material_id, label: m.name, short: m.name, helper: "" }));
        const colItems = transposed
          ? rows.map((m) => ({ id: m.material_id, label: m.name, short: m.name, helper: "" }))
          : questions.map((q) => ({ id: q.question_id, label: q.label, short: q.short, helper: q.helper }));

        const focusId = transposed ? focusMaterial : focusQuestion;
        const rowMode: Mode = transposed ? "by_material" : "by_question";
        const scoreAt = (rowId: string, colId: string) =>
          transposed ? scoreFor(colId, rowId) : scoreFor(rowId, colId);
        const cellTitleParts = (rowId: string, colId: string) => {
          const materialId = transposed ? colId : rowId;
          const questionId = transposed ? rowId : colId;
          const m = rows.find((x) => x.material_id === materialId);
          return { name: m?.name ?? materialId, qLabel: questionLabel(questionId), materialId, questionId };
        };

        return (
          <div className="relative overflow-x-auto rounded-md border border-border">
            <table className="w-full border-separate border-spacing-0 text-[11px]">
              <thead className="sticky top-0 z-20">
                <tr>
                  <th
                    className={cn(
                      HEAD,
                      "sticky left-0 z-30 min-w-[300px] border-b border-r border-border bg-background px-3 py-2 text-left",
                    )}
                  >
                    {transposed ? "Question" : "Material"}
                  </th>

                  {colItems.map((c) => {
                    const active = transposed ? false : mode === "by_question" && focusQuestion === c.id;
                    const cov = transposed
                      ? questions.filter(
                          (q) => (scoreFor(c.id, q.question_id)?.score ?? null) !== null,
                        ).length
                      : questionCoverage(c.id, rows);
                    const denom = transposed ? questions.length : rows.length;
                    return (
                      <th
                        key={c.id}
                        title={c.helper ? `${c.label} — ${c.helper}` : c.label}
                        className={cn(
                          "w-[38px] border-b border-border bg-background px-0.5 py-1.5 align-bottom",
                          active && "bg-primary/5",
                        )}

                      >
                        <button
                          type="button"
                          onClick={() => openRun(transposed ? "by_material" : "by_question", c.id)}
                          className="flex w-full flex-col items-center gap-0.5"
                        >
                          <span
                            className={cn(
                              HEAD,
                              "hover:text-foreground",
                              transposed && "max-w-[80px] truncate",
                              active && "text-primary",
                            )}
                          >
                            {c.short}
                          </span>
                          <span className="font-mono text-[9px] tabular-nums text-muted-foreground/70">
                            {cov}/{denom}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                  <th
                    className={cn(
                      HEAD,
                      "sticky right-0 z-30 w-[132px] min-w-[132px] whitespace-nowrap border-b border-l border-border bg-background px-2 py-2 text-right",
                    )}
                  >
                    Scored
                  </th>

                </tr>
              </thead>
              <tbody>
                {rowItems.map((r) => {
                  const activeRow = focusId === r.id;
                  const counts = transposed ? null : countsFor(r.id);
                  const rowScored = transposed
                    ? rows.filter((m) => (scoreFor(m.material_id, r.id)?.score ?? null) !== null).length
                    : (counts?.scored_count ?? null);
                  const rowDenom = transposed ? rows.length : questions.length;
                  return (
                    <tr key={r.id} className={cn("hover:bg-muted/40", activeRow && "bg-primary/5")}>
                      <td
                        className={cn(
                          "sticky left-0 z-10 border-b border-r border-border bg-background px-3 py-1 align-middle",
                          activeRow && "bg-primary/5",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => openRun(rowMode, r.id)}
                          className="block max-w-[280px] truncate text-left hover:text-primary"
                          title={r.helper ? `${r.label} — ${r.helper}` : r.label}
                        >
                          <span className={cn("leading-tight", activeRow && "text-primary")}>{r.label}</span>
                        </button>
                      </td>
                      {colItems.map((c) => {
                        const rec = scoreAt(r.id, c.id);
                        const v = rec?.score ?? null;
                        const activeCol = !transposed && mode === "by_question" && focusQuestion === c.id;
                        const t = cellTitleParts(r.id, c.id);
                        return (
                          <td
                            key={c.id}
                            className={cn("border-b border-border px-0.5 py-1 text-center", activeCol && "bg-primary/5")}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                openRun(rowMode, r.id);
                                setIndex(colItems.findIndex((x) => x.id === c.id));
                              }}
                              title={
                                v === null
                                  ? `${t.name} · ${t.qLabel} — not scored`
                                  : `${t.name} · ${t.qLabel} — ${signed(v)}${rec?.note ? ` · ${rec.note}` : ""}${
                                      rec ? ` · ${rec.scored_by} on ${rec.scored_at.slice(0, 10)}` : ""
                                    }`
                              }
                              className={cn(
                                "mx-auto flex h-5 w-[30px] items-center justify-center rounded-[3px] font-mono text-[11px] tabular-nums",
                                scoreTone(v),
                              )}
                            >
                              {v === null ? "·" : signed(v)}
                            </button>
                          </td>
                        );
                      })}
                      {/* Coverage and the two strong counts, one compact readout */}
                      <td className="sticky right-0 z-10 whitespace-nowrap border-b border-l border-border bg-background px-2 py-1 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
                        {rowScored === null ? (
                          <span className="text-muted-foreground/60" title="No judgements recorded">
                            —
                          </span>
                        ) : (
                          <>
                            {rowScored}/{rowDenom}
                            {!transposed && counts && counts.scored_count !== null && (
                              <span
                                className="pl-1 text-muted-foreground/70"
                                title={`${counts.strong_drivers} strong drivers, ${counts.strong_constraints} strong constraints`}
                              >
                                · {counts.strong_drivers}↑ {counts.strong_constraints}↓
                              </span>
                            )}
                          </>
                        )}

                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })()}


      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className={cn("inline-flex h-4 w-6 items-center justify-center rounded-[3px] font-mono", scoreTone(-4))}>
            -4
          </span>{" "}
          constraint
        </span>
        <span className="flex items-center gap-1">
          <span className={cn("inline-flex h-4 w-6 items-center justify-center rounded-[3px] font-mono", scoreTone(0))}>
            0
          </span>{" "}
          recorded neutral
        </span>
        <span className="flex items-center gap-1">
          <span className={cn("inline-flex h-4 w-6 items-center justify-center rounded-[3px] font-mono", scoreTone(4))}>
            +4
          </span>{" "}
          driver
        </span>
        <span className="flex items-center gap-1">
          <span className={cn("inline-block h-4 w-6 rounded-[3px]", scoreTone(null))} /> not scored — not zero
        </span>
        <span>
          Only strong judgements (+3 or more, -3 or less) carry a tint. Counts of judgements only — scores are never
          combined into an index.
        </span>
      </div>

    </div>
  );
};

export default DriverScoring;
