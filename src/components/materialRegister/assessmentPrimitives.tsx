import React from "react";
import { cn } from "@/lib/utils";
import {
  SCORE_POINTS,
  TEAM_LABEL,
  initialsOf,
} from "@/config/assessmentCriteria";
import {
  ASSESSMENT_FLAG_LABEL,
  type AssessmentEntry,
  type AssessmentFlag,
  type AssessmentState,
} from "@/types/materialPrioritisation";

/**
 * Judgements sit on the judgement provenance token — never teal (that is VCG
 * data) and never the company-data neutral. Flags describe agreement only; they
 * are not a verdict and never a score of their own.
 */
const FLAG_STYLE: Record<AssessmentFlag, string> = {
  not_assessed: "border-dashed border-border text-muted-foreground",
  single_view: "border-border bg-muted/60 text-muted-foreground",
  aligned: "border-provenance-judgement/40 bg-provenance-judgement/10 text-provenance-judgement",
  mixed: "border-border bg-muted text-foreground",
  split: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

export const FlagChip: React.FC<{ state: AssessmentState; className?: string }> = ({ state, className }) => (
  <span
    title={
      state.spread === null
        ? "Nobody has recorded a view"
        : `${state.scoredCount} ${state.scoredCount === 1 ? "score" : "scores"}, ${state.low} to ${state.high}`
    }
    className={cn(
      "inline-flex h-5 items-center gap-1 rounded-full border px-1.5 text-[10px] font-medium",
      FLAG_STYLE[state.flag],
      className,
    )}
  >
    {ASSESSMENT_FLAG_LABEL[state.flag]}
    {state.scoredCount > 0 && (
      <span className="tabular-nums opacity-70">
        {state.low === state.high ? state.low : `${state.low}–${state.high}`}
      </span>
    )}
  </span>
);

/** Filled square = at least one 1–5 score, hollow = none. Never a number. */
export const CoverageMark: React.FC<{ state: AssessmentState }> = ({ state }) => (
  <span
    aria-label={ASSESSMENT_FLAG_LABEL[state.flag]}
    title={`${ASSESSMENT_FLAG_LABEL[state.flag]}${
      state.scoredCount ? ` · ${state.scoredCount} scores` : ""
    }`}
    className={cn(
      "inline-block h-3 w-3 rounded-[3px] border",
      state.scoredCount === 0
        ? "border-dashed border-muted-foreground/40"
        : state.flag === "split"
          ? "border-amber-500/60 bg-amber-500/40"
          : "border-provenance-judgement/50 bg-provenance-judgement/40",
    )}
  />
);

export const ContributorMark: React.FC<{ entry: AssessmentEntry; name: string }> = ({ entry, name }) => (
  <span
    title={`${name} (${TEAM_LABEL[entry.team]}) — ${entry.score}${
      entry.note ? ` · ${entry.note}` : ""
    }`}
    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-1.5 py-[1px] text-[10px]"
  >
    <span className="text-muted-foreground">{initialsOf(name)}</span>
    <span className="tabular-nums font-medium text-provenance-judgement">{entry.score}</span>
  </span>
);

/**
 * 1..5 rail. `value` is a number for a recorded score, or null for nothing
 * recorded. There is no abstain or no-view position on the scale.
 */
export const ScoreRail: React.FC<{
  value: number | null;
  onPick: (v: number) => void;
  onClear?: () => void;
  ariaLabel?: string;
  size?: "sm" | "md";
}> = ({ value, onPick, onClear, ariaLabel, size = "md" }) => (
  <div className="inline-flex items-center gap-[3px]" role="group" aria-label={ariaLabel}>
    {SCORE_POINTS.map((p) => {
      const active = value === p;
      return (
        <button
          key={p}
          type="button"
          aria-pressed={active}
          onClick={() => (active && onClear ? onClear() : onPick(p))}
          className={cn(
            "rounded-[3px] border tabular-nums transition-colors",
            size === "sm" ? "h-5 w-5 text-[10px]" : "h-6 w-7 text-[11px]",
            active
              ? "border-provenance-judgement bg-provenance-judgement/15 font-semibold text-provenance-judgement"
              : "border-border bg-background text-muted-foreground/70 hover:bg-muted",
          )}
        >
          {p}
        </button>
      );
    })}
  </div>
);
