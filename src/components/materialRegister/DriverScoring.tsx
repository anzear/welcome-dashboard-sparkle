import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/components/materialRegister/registerStore";
import FilterSelects from "@/components/materialRegister/FilterSelects";
import FilterChips from "@/components/materialRegister/FilterChips";
import QuestionSetDialog from "@/components/materialRegister/QuestionSetDialog";
import ScoreBulkPanel, { type ScoreBulkKind } from "@/components/materialRegister/ScoreBulkDialog";
import { scoreTone, signed } from "@/components/materialRegister/scorePrimitives";
import type { Material } from "@/types/materialPrioritisation";

const HEAD = "text-[9px] font-semibold uppercase tracking-widest text-muted-foreground";
const CELL_W = "w-[38px] min-w-[38px]";

/** null sorts to its own block at the bottom, never as a zero. */
type SortDir = "desc" | "asc";
interface Sort {
  /** A question id, or "scored" for the coverage column. */
  key: string;
  dir: SortDir;
}

interface Cursor {
  row: number;
  col: number;
}

const DriverScoring: React.FC = () => {
  const {
    ordered,
    scores,
    scoreFor,
    setScore,
    clearScore,
    countsFor,
    questionCoverage,
    questions,
    filters,
    setFilters,
    filtersActive,
    canEditQuestionSet,
    toast,
    setToast,
    undo,
  } = useRegister();

  const rows = useMemo(() => ordered.map((r) => r.m), [ordered]);

  const [sort, setSort] = useState<Sort | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [bulk, setBulk] = useState<ScoreBulkKind | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const negativeNext = useRef(false);
  const gridRef = useRef<HTMLTableSectionElement>(null);

  const scoreOf = (m: Material, questionId: string) => scoreFor(m.material_id, questionId)?.score ?? null;

  /** Sorted material list. Unscored rows split off into a trailing block. */
  const { scoredRows, unscoredRows } = useMemo(() => {
    if (!sort) return { scoredRows: rows, unscoredRows: [] as Material[] };
    const valueOf = (m: Material) =>
      sort.key === "scored" ? countsFor(m.material_id).scored_count : scoreOf(m, sort.key);
    const present = rows.filter((m) => valueOf(m) !== null);
    const absent = rows.filter((m) => valueOf(m) === null);
    const sorted = [...present].sort((a, b) => {
      const d = (valueOf(b) as number) - (valueOf(a) as number);
      return sort.dir === "desc" ? d : -d;
    });
    return { scoredRows: sorted, unscoredRows: absent };
  }, [rows, sort, scores, countsFor]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayRows = useMemo(() => [...scoredRows, ...unscoredRows], [scoredRows, unscoredRows]);

  const totalCells = rows.length * questions.length;
  const scoredCells = useMemo(
    () => rows.reduce((acc, m) => acc + questions.filter((q) => scoreOf(m, q.question_id) !== null).length, 0),
    [rows, questions, scores], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const pct = totalCells === 0 ? 0 : Math.round((scoredCells / totalCells) * 100);

  /** Selection accumulates: rows filtered out stay selected but are counted apart. */
  const visibleIds = useMemo(() => new Set(rows.map((m) => m.material_id)), [rows]);
  const hiddenSelected = [...selected].filter((id) => !visibleIds.has(id)).length;
  const allVisibleSelected = rows.length > 0 && rows.every((m) => selected.has(m.material_id));

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) rows.forEach((m) => next.delete(m.material_id));
      else rows.forEach((m) => next.add(m.material_id));
      return next;
    });

  /** Third click on the same column clears back to the register's order. */
  const cycleSort = (key: string) =>
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "desc" };
      if (prev.dir === "desc") return { key, dir: "asc" };
      return null;
    });

  const sortLabel = () => {
    if (!sort) return null;
    const name = sort.key === "scored" ? "coverage" : questions.find((q) => q.question_id === sort.key)?.label;
    return `Sorted by ${name}, ${sort.dir === "desc" ? "highest" : "lowest"} first`;
  };

  const sortedQuestionLabel = sort && sort.key !== "scored"
    ? (questions.find((q) => q.question_id === sort.key)?.label ?? null)
    : null;

  /* ------------------------------- cell entry ------------------------------ */

  const focusCell = (row: number, col: number) => {
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-cell="${row}-${col}"]`);
    el?.focus();
  };

  const move = (dr: number, dc: number) => {
    if (!cursor) return;
    const row = Math.max(0, Math.min(displayRows.length - 1, cursor.row + dr));
    const col = Math.max(0, Math.min(questions.length - 1, cursor.col + dc));
    setCursor({ row, col });
    focusCell(row, col);
  };

  const onCellKeyDown = (e: React.KeyboardEvent, m: Material, questionId: string) => {
    const key = e.key;
    if (/^[0-5]$/.test(key)) {
      e.preventDefault();
      const mag = Number(key);
      setScore(m.material_id, questionId, negativeNext.current ? -mag : mag, scoreFor(m.material_id, questionId)?.note ?? null);
      negativeNext.current = false;
      return;
    }
    if (key === "-") {
      negativeNext.current = true;
      return;
    }
    if (key === "Backspace" || key === "Delete") {
      e.preventDefault();
      clearScore(m.material_id, questionId);
      return;
    }
    if (key === "ArrowDown" || key === "Enter") {
      e.preventDefault();
      move(1, 0);
      return;
    }
    if (key === "ArrowUp") {
      e.preventDefault();
      move(-1, 0);
      return;
    }
    if (key === "ArrowRight" || (key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      move(0, 1);
      return;
    }
    if (key === "ArrowLeft" || (key === "Tab" && e.shiftKey)) {
      e.preventDefault();
      move(0, -1);
    }
  };

  useEffect(() => {
    // A shrinking list must not leave the cursor pointing past the end.
    if (cursor && cursor.row > displayRows.length - 1) setCursor(null);
  }, [displayRows.length, cursor]);

  const arrow = (key: string) =>
    sort?.key !== key ? null : sort.dir === "desc" ? (
      <ArrowDown className="ml-0.5 inline h-2.5 w-2.5" />
    ) : (
      <ArrowUp className="ml-0.5 inline h-2.5 w-2.5" />
    );

  return (
    <div className="space-y-2">
      {/* Toolbar — same shape as the register: search, folded filters, right-aligned action */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <Input
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder="Search name, CAS, customer ID"
          className="h-7 w-60 rounded-lg bg-card text-[11px]"
        />
        <FilterSelects
          variant="popover"
          include={["statuses", "owners", "applications", "products", "priorityPeriods"]}
        />

        {canEditQuestionSet ? (
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="ml-auto inline-flex h-7 items-center rounded-lg border border-border bg-card px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Edit question set
          </button>
        ) : (
          <span
            className="ml-auto inline-flex h-7 cursor-default items-center rounded-lg border border-border bg-card px-2.5 text-[11px] font-medium text-muted-foreground/60"
            title="Managed by your workspace administrator"
          >
            Edit question set
          </span>
        )}
      </div>

      {/* Caption row: instruction on the left, coverage readout on the right */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          {sort ? (
            <>
              <span className="text-foreground">{sortLabel()}</span>
              <button
                type="button"
                onClick={() => setSort(null)}
                className="text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                Clear sort
              </button>
            </>
          ) : (
            <span>
              Click a driver heading to rank by that judgement; click a cell, then 0–5 to score, minus first for a
              constraint, Backspace clears, arrows move.
            </span>
          )}
        </div>
        <span>
          <span className="font-mono tabular-nums text-foreground">{scoredCells.toLocaleString("en-GB")}</span> of{" "}
          <span className="font-mono tabular-nums">{totalCells.toLocaleString("en-GB")}</span> cells scored (
          <span className="font-mono tabular-nums">{pct}%</span>)
        </span>
      </div>

      <FilterChips />


      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-[11px]">
          <span className="font-medium text-foreground">
            <span className="font-mono tabular-nums">{selected.size}</span> selected
            {(hiddenSelected > 0 || filtersActive) && (
              <>
                {" "}
                — <span className="font-mono tabular-nums">{hiddenSelected}</span> hidden by current filters
              </>
            )}
          </span>
          <button
            type="button"
            onClick={() => setBulk("set")}
            className="rounded-sm border border-border bg-background px-2 py-0.5 font-medium hover:bg-muted"
          >
            Set score
          </button>
          <button
            type="button"
            onClick={() => setBulk("clear")}
            className="rounded-sm border border-border bg-background px-2 py-0.5 font-medium hover:bg-muted"
          >
            Clear score
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            Clear selection
          </button>
        </div>
      )}

      <ScoreBulkPanel
        open={bulk !== null && selected.size > 0}
        kind={bulk ?? "set"}
        ids={[...selected]}
        onRemoveMaterial={(id) =>
          setSelected((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          })
        }
        onOpenChange={(v) => setBulk(v ? bulk : null)}
      />


      {toast && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/50 px-2 py-1.5 text-[11px]">
          <span className="text-foreground">{toast.message}</span>
          <button
            type="button"
            onClick={undo}
            className="underline decoration-dotted underline-offset-2 hover:text-primary"
          >
            Undo
          </button>
          <button type="button" onClick={() => setToast(null)} className="text-muted-foreground hover:text-foreground">
            Dismiss
          </button>
        </div>
      )}

      {/* The matrix is the only entry surface */}
      <div className="relative overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
        <table className="w-full border-separate border-spacing-0 text-[11px]">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 w-8 min-w-8 border-b border-border bg-card px-2 py-2">
                <input
                  type="checkbox"
                  aria-label="Select all shown"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  className="h-3 w-3 cursor-pointer accent-primary"
                />
              </th>
              <th
                className={cn(
                  HEAD,
                  "sticky left-8 z-30 min-w-[280px] border-b border-r border-border bg-card px-3 py-2 text-left",
                )}
              >
                Material
              </th>

              {questions.map((q) => {
                const active = sort?.key === q.question_id;
                return (
                  <th
                    key={q.question_id}
                    title={q.helper ? `${q.label} — ${q.helper}` : q.label}
                    className={cn(
                      CELL_W,
                      "border-b border-border bg-card px-0.5 py-1.5 align-bottom",
                      active && "bg-primary/10",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => cycleSort(q.question_id)}
                      className="flex w-full flex-col items-center gap-0.5"
                    >
                      <span className={cn(HEAD, "hover:text-foreground", active && "text-primary")}>
                        {q.short}
                        {arrow(q.question_id)}
                      </span>
                      <span className="font-mono text-[9px] tabular-nums text-muted-foreground/70">
                        {questionCoverage(q.question_id, rows)}/{rows.length}
                      </span>
                    </button>
                  </th>
                );
              })}

              <th
                className={cn(
                  HEAD,
                  "sticky right-0 z-30 w-[132px] min-w-[132px] whitespace-nowrap border-b border-l border-border bg-card px-2 py-2 text-right",
                  sort?.key === "scored" && "bg-primary/10",
                )}
              >
                <button
                  type="button"
                  onClick={() => cycleSort("scored")}
                  className={cn("hover:text-foreground", sort?.key === "scored" && "text-primary")}
                >
                  Scored{arrow("scored")}
                </button>
              </th>
            </tr>
          </thead>

          <tbody ref={gridRef}>
            {displayRows.map((m, rowIndex) => {
              const counts = countsFor(m.material_id);
              const isSelected = selected.has(m.material_id);
              const startsUnscoredBlock =
                sort !== null && unscoredRows.length > 0 && rowIndex === scoredRows.length;

              return (
                <React.Fragment key={m.material_id}>
                  {startsUnscoredBlock && (
                    <tr>
                      <td
                        colSpan={questions.length + 3}
                        className="border-y border-dashed border-border bg-muted/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                      >
                        Not scored on {sortedQuestionLabel ?? "any driver"} ·{" "}
                        <span className="font-mono tabular-nums">{unscoredRows.length}</span>
                      </td>
                    </tr>
                  )}
                  <tr className={cn("hover:bg-muted/40", isSelected && "bg-primary/5")}>
                    <td
                      className={cn(
                        "sticky left-0 z-10 border-b border-border bg-card px-2 py-1 align-middle group-hover:bg-muted/30",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select ${m.name}`}
                        checked={isSelected}
                        onChange={() => toggleRow(m.material_id)}
                        className="h-3 w-3 cursor-pointer accent-primary"
                      />
                    </td>
                    <td
                      className={cn(
                        "sticky left-8 z-10 border-b border-r border-border bg-card px-3 py-1 align-middle group-hover:bg-muted/30",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <span className="block max-w-[260px] truncate leading-tight" title={m.name}>
                        {m.name}
                      </span>
                    </td>

                    {questions.map((q, colIndex) => {
                      const rec = scoreFor(m.material_id, q.question_id);
                      const v = rec?.score ?? null;
                      const activeCol = sort?.key === q.question_id;
                      const focused = cursor?.row === rowIndex && cursor?.col === colIndex;
                      return (
                        <td
                          key={q.question_id}
                          className={cn(
                            "border-b border-border px-0.5 py-1 text-center",
                            activeCol && "bg-primary/10",
                          )}
                        >
                          <button
                            type="button"
                            data-cell={`${rowIndex}-${colIndex}`}
                            onFocus={() => setCursor({ row: rowIndex, col: colIndex })}
                            onClick={() => {
                              setCursor({ row: rowIndex, col: colIndex });
                              negativeNext.current = false;
                            }}
                            onKeyDown={(e) => onCellKeyDown(e, m, q.question_id)}
                            title={
                              v === null
                                ? `${m.name} · ${q.label} — not scored`
                                : `${m.name} · ${q.label} — ${signed(v)}${rec?.note ? ` · ${rec.note}` : ""}${
                                    rec ? ` · ${rec.scored_by} on ${rec.scored_at.slice(0, 10)}` : ""
                                  }`
                            }
                            className={cn(
                              "mx-auto flex h-5 w-[30px] items-center justify-center rounded-[3px] font-mono text-[11px] tabular-nums outline-none",
                              scoreTone(v),
                              focused && "ring-2 ring-primary/60 ring-offset-1",
                            )}
                          >
                            {v === null ? (focused ? "" : "·") : signed(v)}
                          </button>
                        </td>
                      );
                    })}

                    <td
                      className={cn(
                        "sticky right-0 z-10 whitespace-nowrap border-b border-l border-border bg-card px-2 py-1 text-right font-mono text-[10px] tabular-nums text-muted-foreground group-hover:bg-muted/30",
                        sort?.key === "scored" && "bg-primary/10",
                      )}
                    >
                      {counts.scored_count === null ? (
                        <span className="text-muted-foreground/60" title="No judgements recorded">
                          —
                        </span>
                      ) : (
                        <>
                          {counts.scored_count}/{questions.length}
                          <span
                            className="pl-1 text-muted-foreground/70"
                            title={`${counts.strong_drivers} strong drivers, ${counts.strong_constraints} strong constraints`}
                          >
                            · {counts.strong_drivers}↑ {counts.strong_constraints}↓
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

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
      </div>

      <QuestionSetDialog open={editorOpen} onOpenChange={setEditorOpen} />
    </div>
  );
};

export default DriverScoring;
