import React from "react";
import { cn } from "@/lib/utils";
import { SCORE_POINTS } from "@/config/driverQuestions";

/** Static class lists so Tailwind keeps them; intensity tracks magnitude. */
const POSITIVE = [
  "bg-teal-600/10 text-teal-900 dark:text-teal-100",
  "bg-teal-600/20 text-teal-900 dark:text-teal-100",
  "bg-teal-600/30 text-teal-900 dark:text-teal-50",
  "bg-teal-600/45 text-teal-950 dark:text-teal-50",
  "bg-teal-600/60 text-teal-950 dark:text-teal-50",
];
const NEGATIVE = [
  "bg-orange-600/10 text-orange-900 dark:text-orange-100",
  "bg-orange-600/20 text-orange-900 dark:text-orange-100",
  "bg-orange-600/30 text-orange-900 dark:text-orange-50",
  "bg-orange-600/45 text-orange-950 dark:text-orange-50",
  "bg-orange-600/60 text-orange-950 dark:text-orange-50",
];

/**
 * Diverging, muted colour by magnitude. Constraints sit on one hue, drivers on
 * another; a recorded 0 is neutral but present. Unscored is never coloured.
 */
export function scoreTone(score: number | null): string {
  if (score === null) return "border border-dotted border-muted-foreground/40 text-transparent";
  if (score === 0) return "bg-muted/70 text-muted-foreground";
  const mag = Math.abs(score);
  return score > 0 ? POSITIVE[mag - 1] : NEGATIVE[mag - 1];
}


export const signed = (score: number | null) =>
  score === null ? "—" : score > 0 ? `+${score}` : String(score);

/** 11-point control, -5..+5. Clickable; keyboard handled by the caller. */
export const ScoreScale: React.FC<{
  value: number | null;
  onChange: (v: number) => void;
  size?: "sm" | "md";
  ariaLabel?: string;
}> = ({ value, onChange, size = "md", ariaLabel }) => (
  <div className="inline-flex items-center gap-[2px]" role="group" aria-label={ariaLabel}>
    {SCORE_POINTS.map((p) => {
      const active = value === p;
      return (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-pressed={active}
          title={`${signed(p)}`}
          className={cn(
            "rounded-[3px] border font-mono tabular-nums transition-colors",
            size === "sm" ? "h-5 w-6 text-[10px]" : "h-7 w-8 text-[11px]",
            active
              ? cn(scoreTone(p), "border-foreground/40 font-semibold")
              : "border-border bg-background text-muted-foreground/70 hover:bg-muted",
          )}
        >
          {signed(p)}
        </button>
      );
    })}
  </div>
);
