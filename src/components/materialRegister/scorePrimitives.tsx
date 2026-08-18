import React from "react";
import { cn } from "@/lib/utils";
import { SCORE_POINTS } from "@/config/driverQuestions";

/**
 * Text-first driver scale, 1 to 5. Scores are team judgement, so they sit on the
 * --provenance-judgement token — never teal, never red or orange. Intensity
 * tracks magnitude, and weight varies so the class survives greyscale.
 */
const POSITIVE = [
  "text-provenance-judgement/60",
  "text-provenance-judgement/80",
  "text-provenance-judgement bg-provenance-judgement/10 font-medium",
  "text-provenance-judgement bg-provenance-judgement/15 font-medium",
  "text-provenance-judgement bg-provenance-judgement/20 font-semibold",
];
/** Intensity by strength of the driver. */
export function scoreTone(score: number | null): string {
  if (score === null) return "border border-dotted border-muted-foreground/40 text-transparent";
  const mag = Math.min(5, Math.max(1, score));
  return POSITIVE[mag - 1];
}

export const signed = (score: number | null) => (score === null ? "—" : String(score));

/** 5-point control, 1..5. Clickable; keyboard handled by the caller. */
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
