import React from "react";
import { cn } from "@/lib/utils";
import { SCORE_POINTS } from "@/config/driverQuestions";

/**
 * Text-first diverging scale. Drivers sit on teal, constraints on sky — never on
 * red or orange, so nothing here can be mistaken for the amber divergence flag.
 * Intensity tracks magnitude; only strong values (>= +3, <= -3) carry a faint
 * background tint, so the extremes are what the eye catches.
 */
const POSITIVE = [
  "text-teal-700/60",
  "text-teal-700/80",
  "text-teal-800 bg-teal-600/10",
  "text-teal-900 bg-teal-600/15",
  "text-teal-950 bg-teal-600/20",
];
const NEGATIVE = [
  "text-sky-800/60",
  "text-sky-800/80",
  "text-sky-900 bg-sky-700/10",
  "text-sky-950 bg-sky-700/15",
  "text-sky-950 bg-sky-700/20",
];

/** Colour by sign, intensity by magnitude. A recorded 0 is neutral but present. */
export function scoreTone(score: number | null): string {
  if (score === null) return "border border-dotted border-muted-foreground/40 text-transparent";
  if (score === 0) return "text-muted-foreground";
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
              ? cn(scoreTone(p), "border-foreground/40 bg-muted font-semibold")
              : "border-border bg-background text-muted-foreground/70 hover:bg-muted",
          )}
        >
          {signed(p)}
        </button>
      );
    })}
  </div>
);
