import React from "react";
import { cn } from "@/lib/utils";
import {
  NEUTRAL_HELPER,
  NEUTRAL_LABEL,
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
  neutral_only: "border-dashed border-border text-muted-foreground",
  single_view: "border-border bg-muted/60 text-muted-foreground",
  aligned: "border-provenance-judgement/40 bg-provenance-judgement/10 text-provenance-judgement",
  mixed: "border-border bg-muted text-foreground",
  split: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

export const FlagChip: React.FC<{ state: AssessmentState; className?: string }> = ({ state, className }) => (
  <span
    title={
      state.spread === null
        ? state.neutralCount > 0
          ? `${state.neutralCount} neutral, no scores recorded`
          : "Nobody has recorded a view"
        : `${state.scoredCount} ${state.scoredCount === 1 ? "score" : "scores"}, ${state.low} to ${state.high}${
            state.neutralCount > 0 ? ` · ${state.neutralCount} neutral` : ""
          }`
    }
    className={cn(
      "inline-flex h-5 items-center gap-1 rounded-full border px-1.5 text-[10px] font-medium",
      FLAG_STYLE[state.flag],
      className,
    )}
  >
    {ASSESSMENT_FLAG_LABEL[state.flag]}
    {state.scoredCount > 0 && (
      <span className="font-mono tabular-nums opacity-70">
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
    }${state.neutralCount ? ` · ${state.neutralCount} neutral` : ""}`}
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
    title={`${name} (${TEAM_LABEL[entry.team]}) — ${
      entry.score === null ? `${NEUTRAL_LABEL}: ${NEUTRAL_HELPER}` : entry.score
    }${entry.note ? ` · ${entry.note}` : ""}`}
    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-1.5 py-[1px] text-[10px]"
  >
    <span className="text-muted-foreground">{initialsOf(name)}</span>
    {entry.score === null ? (
      <span className="text-muted-foreground/80">{NEUTRAL_LABEL}</span>
    ) : (
      <span className="font-mono tabular-nums font-medium text-provenance-judgement">{entry.score}</span>
    )}
  </span>
);

/**
 * 1..5 rail with Neutral beside it. Neutral is a recorded position — no
 * visibility on this criterion — and is never 3, never 0, never a score.
 * `value` is a number for a score, "neutral", or null for nothing recorded.
 */
export const ScoreRail: React.FC<{
  value: number | "neutral" | null;
  onPick: (v: number) => void;
  onNeutral?: () => void;
  onClear?: () => void;
  ariaLabel?: string;
  size?: "sm" | "md";
}> = ({ value, onPick, onNeutral, onClear, ariaLabel, size = "md" }) => (
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
            "rounded-[3px] border font-mono tabular-nums transition-colors",
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
    {onNeutral && (
      <button
        type="button"
        aria-pressed={value === "neutral"}
        title={NEUTRAL_HELPER}
        onClick={() => (value === "neutral" && onClear ? onClear() : onNeutral())}
        className={cn(
          "ml-1.5 rounded-[3px] border px-2 transition-colors",
          size === "sm" ? "h-5 text-[10px]" : "h-6 text-[11px]",
          value === "neutral"
            ? "border-foreground/40 bg-muted font-medium text-foreground"
            : "border-dashed border-border bg-background text-muted-foreground/70 hover:bg-muted",
        )}
      >
        {NEUTRAL_LABEL}
      </button>
    )}
  </div>
);
