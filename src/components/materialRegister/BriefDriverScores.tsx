import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useRegister } from "@/components/materialRegister/registerStore";
import { ScoreScale, signed } from "@/components/materialRegister/scorePrimitives";
import QuestionSetDialog from "@/components/materialRegister/QuestionSetDialog";

/** Thin read-only 1..5 track. Fixed width so every rail lines up. */
const RAIL = "w-[128px]";

/**
 * Fixed-width 1..5 rail. The fill grows from the left with the strength of the
 * driver; an unscored question keeps an empty rail with a hollow marker.
 */
const ScoreTrack: React.FC<{ value: number | null }> = ({ value }) => {
  const pct = value === null ? 0 : ((value - 1) / 4) * 100;
  return (
    <div className={cn("relative h-3.5", RAIL)}>
      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      {value !== null && (
        <div
          className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-teal-600/80"
          style={{ width: `${pct}%` }}
        />
      )}
      <div
        className={cn(
          "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full",
          value === null
            ? "h-2 w-2 border border-dotted border-muted-foreground/50 bg-background"
            : "h-2 w-2 bg-teal-600",
        )}
        style={{ left: `${pct}%` }}
      />
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
        value === null ? "text-muted-foreground/50 placeholder:text-muted-foreground/50" : "text-teal-800",
      )}
    />
  );
};


/**
 * Section 3 of the brief. Judgement, kept in its own tint and its own type —
 * one compact row per question at rest, expanding to the 5-point control on click.
 */
const BriefDriverScores: React.FC<{ materialId: string }> = ({ materialId }) => {
  const { scoreFor, setScore, clearScore, countsFor, questions, canEditQuestionSet } = useRegister();
  const [editorOpen, setEditorOpen] = useState(false);
  const counts = countsFor(materialId);
  const [openId, setOpenId] = useState<string | null>(null);

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
          const expanded = openId === q.question_id;
          return (
            <div key={q.question_id} className="py-1.5">
              <div
                className="grid w-full grid-cols-[minmax(0,1fr)_128px_2.5rem] items-center gap-3 rounded-sm px-1 py-0.5 text-left hover:bg-primary/10"
                title={q.helper ?? undefined}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(expanded ? null : q.question_id)}
                  className="text-left text-[13px] leading-snug text-muted-foreground"
                >
                  {q.label}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenId(expanded ? null : q.question_id)}
                  className="block"
                  aria-label={`${q.label} track`}
                >
                  <ScoreTrack value={v} />
                </button>
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





              {expanded && (
                <div className="px-1 pt-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <ScoreScale
                      value={v}
                      size="sm"
                      ariaLabel={`${q.label} score`}
                      onChange={(next) => {
                        setScore(materialId, q.question_id, next, rec?.note ?? null);
                        setOpenId(null);
                      }}
                    />
                    {v !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          clearScore(materialId, q.question_id);
                          setOpenId(null);
                        }}
                        className="text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

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
