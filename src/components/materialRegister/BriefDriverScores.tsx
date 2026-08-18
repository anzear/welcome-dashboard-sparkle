import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useRegister } from "@/components/materialRegister/registerStore";
import { signed } from "@/components/materialRegister/scorePrimitives";
import QuestionSetDialog from "@/components/materialRegister/QuestionSetDialog";
import { SCORE_POINTS } from "@/config/driverQuestions";

/** Fixed rail width so every row lines up. */
const RAIL = "w-[128px]";

/**
 * Directly scoreable 1..5 rail. Each of the five stops is a hit target; hovering
 * previews the value, clicking commits it at once. Clicking the current value again
 * removes the judgement (back to not scored — never zero).
 */
const ScoreTrack: React.FC<{
  value: number | null;
  ariaLabel: string;
  onPick: (v: number) => void;
  onClear: () => void;
  onHover: (v: number | null) => void;
  preview: number | null;
}> = ({ value, ariaLabel, onPick, onClear, onHover, preview }) => {
  const shown = preview ?? value;
  const pct = (v: number) => ((v - 1) / 4) * 100;
  return (
    <div className={cn("relative h-5", RAIL)} role="group" aria-label={ariaLabel}>
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 rounded-full bg-border" />
      {shown !== null && (
        <div
          className={cn(
            "pointer-events-none absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full transition-all duration-150",
            preview !== null && preview !== value ? "bg-provenance-judgement/50" : "bg-provenance-judgement/85",
          )}
          style={{ width: `${pct(shown)}%` }}
        />
      )}
      {SCORE_POINTS.map((p) => {
        const active = shown !== null && p <= shown;
        const isHead = shown === p;
        return (
          <button
            key={p}
            type="button"
            aria-label={`${ariaLabel} ${p}`}
            aria-pressed={value === p}
            title={`Set ${p}${value === p ? " — click to clear" : ""}`}
            onMouseEnter={() => onHover(p)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(p)}
            onBlur={() => onHover(null)}
            onClick={() => (value === p ? onClear() : onPick(p))}
            className="absolute top-0 h-5 w-6 -translate-x-1/2 outline-none"
            style={{ left: `${pct(p)}%` }}
          >
            <span
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150",
                isHead
                  ? "h-2.5 w-2.5 bg-provenance-judgement ring-2 ring-provenance-judgement/20"
                  : active
                    ? "h-1.5 w-1.5 bg-provenance-judgement/70"
                    : "h-1.5 w-1.5 border border-muted-foreground/30 bg-background",
              )}
            />
          </button>
        );
      })}
    </div>
  );
};



/**
 * Editable 1..5 cell. Type a number to record a judgement; clear the box to
 * remove it. Enter or blur commits.
 */
const ScoreCell: React.FC<{
  value: number | null;
  ariaLabel: string;
  onCommit: (next: number | null) => void;
}> = ({ value, ariaLabel, onCommit }) => {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft !== null ? draft : value === null ? "" : signed(value);

  const commit = () => {
    if (draft === null) return;
    const t = draft.trim();
    setDraft(null);
    if (t === "" || t === "-" || t === "+") {
      onCommit(null);
      return;
    }
    const n = Number(t);
    if (Number.isNaN(n)) return;
    onCommit(Math.max(1, Math.min(5, Math.round(n))));
  };

  return (
    <input
      aria-label={ariaLabel}
      inputMode="numeric"
      value={shown}
      placeholder="—"
      onChange={(e) => {
        const raw = e.target.value;
        if (/^\d?$/.test(raw)) setDraft(raw);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit();
          (e.target as HTMLInputElement).blur();
        }
        if (e.key === "Escape") setDraft(null);
      }}
      className={cn(
        "w-full rounded-sm border border-transparent bg-transparent px-0.5 py-0 text-right font-mono text-[15px] font-medium tabular-nums outline-none hover:border-border focus:border-primary/40 focus:bg-background",
        value === null ? "text-muted-foreground/50 placeholder:text-muted-foreground/50" : "text-provenance-judgement",
      )}
    />
  );
};


/**
 * Section 3 of the brief. Judgement, kept in its own tint and its own type —
 * one row per question, scored in place by clicking a stop on its rail.
 */
const BriefDriverScores: React.FC<{ materialId: string }> = ({ materialId }) => {
  const { scoreFor, setScore, clearScore, countsFor, questions, canEditQuestionSet } = useRegister();
  const [editorOpen, setEditorOpen] = useState(false);
  const counts = countsFor(materialId);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hoverValue, setHoverValue] = useState<number | null>(null);


  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">
        {counts.scored_count === null ? (
          "No judgements recorded yet — nothing here is zero."
        ) : (
          <>
            <span className="font-mono tabular-nums text-foreground">{counts.strong_drivers}</span> strong{" "}
            {counts.strong_drivers === 1 ? "driver" : "drivers"},{" "}
            <span className="font-mono tabular-nums text-foreground">{counts.scored_count}</span> of{" "}
            <span className="font-mono tabular-nums">{questions.length}</span> scored
          </>
        )}
      </p>

      {/* Axis key sits directly above the rails, its 0 on the same vertical line */}
      <div className="grid grid-cols-[minmax(0,1fr)_128px_2.5rem] items-center gap-3 px-1 pt-1 text-[10px] text-muted-foreground/60">
        <span className="text-right">1 weak</span>
        <span className="relative block h-3 w-[128px]">
          <span className="absolute left-1/2 top-0 -translate-x-1/2">3</span>
        </span>
        <span className="whitespace-nowrap">5 strong</span>
      </div>



      <div className="divide-y divide-primary/10">
        {questions.map((q) => {
          const rec = scoreFor(materialId, q.question_id);
          const v = rec?.score ?? null;
          return (
            <div key={q.question_id} className="py-1.5">
              <div
                className="grid w-full grid-cols-[minmax(0,1fr)_128px_2.5rem] items-center gap-3 rounded-sm px-1 py-0.5 text-left transition-colors hover:bg-primary/[0.06]"
                title={q.helper ?? undefined}
              >
                <span className="text-left text-[13px] leading-snug text-muted-foreground">{q.label}</span>
                <ScoreTrack
                  value={v}
                  ariaLabel={q.label}
                  preview={hoverId === q.question_id ? hoverValue : null}
                  onHover={(hv) => {
                    setHoverId(hv === null ? null : q.question_id);
                    setHoverValue(hv);
                  }}
                  onPick={(next) => setScore(materialId, q.question_id, next, rec?.note ?? null)}
                  onClear={() => clearScore(materialId, q.question_id)}
                />
                <ScoreCell
                  value={v}
                  ariaLabel={`${q.label} score`}
                  onCommit={(next) => {
                    if (next === null) {
                      if (v !== null) clearScore(materialId, q.question_id);
                    } else if (next !== v) {
                      setScore(materialId, q.question_id, next, rec?.note ?? null);
                    }
                  }}
                />
              </div>


              {rec?.note && <p className="px-1 pt-0.5 text-[10px] italic text-muted-foreground">{rec.note}</p>}
              {rec && v !== null && (
                <p className="px-1 text-[10px] text-muted-foreground/70">
                  scored by {rec.scored_by} on {rec.scored_at.slice(0, 10)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-1">
        {canEditQuestionSet ? (
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            Edit question set
          </button>
        ) : (
          <span
            className="cursor-default text-[10px] text-muted-foreground/60"
            title="Managed by your workspace administrator"
          >
            Edit question set
          </span>
        )}
      </div>

      <QuestionSetDialog open={editorOpen} onOpenChange={setEditorOpen} />
    </div>
  );
};

export default BriefDriverScores;
