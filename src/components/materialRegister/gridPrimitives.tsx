import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useRegister, type Measure } from "@/components/materialRegister/registerStore";
import { JOURNEY_STATUS_LABEL, type JourneyStatus, type Material } from "@/types/materialPrioritisation";
import { nf } from "@/components/materialRegister/primitives";

export const ordinal = (n: number) => {
  const rem = n % 100;
  if (rem >= 11 && rem <= 13) return "th";
  return ["th", "st", "nd", "rd"][n % 10] ?? "th";
};

/** Exact figure with its unit. Never blended with any other measure. */
export const fmtMeasure = (v: number, measure: Measure) => {
  if (measure.id === "spend") return `EUR ${nf(0).format(v)}`;
  return `${nf(measure.id === "emissions" ? 0 : 0).format(v)} ${measure.unit}`;
};

/** Compact figure for the findings cards. */
export const fmtMeasureCompact = (v: number, measure: Measure) => {
  const compact = (x: number) =>
    x >= 1_000_000 ? `${(x / 1_000_000).toFixed(1)}M` : x >= 10_000 ? `${(x / 1000).toFixed(0)}k` : nf(0).format(x);
  if (measure.id === "spend") return `EUR ${compact(v)}`;
  if (measure.id === "applications") return `${nf(0).format(v)} ${measure.unit}`;
  return `${compact(v)} ${measure.unit}`;
};

/** Same muted families as the status pills, expressed as a dot colour. */
export const STATUS_DOT: Record<JourneyStatus, string> = {
  not_started: "text-muted-foreground/70",
  under_evaluation: "text-primary/80",
  in_testing: "text-primary",
  qualified: "text-emerald-600",
  sourcing: "text-amber-600",
  in_use: "text-emerald-700",
  parked: "text-foreground/35",
  rejected: "text-destructive/80",
};

export const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** A name that opens its brief. Used by the unplotted panel and the findings. */
export const BriefLink: React.FC<{ m: Material }> = ({ m }) => {
  const { openBrief } = useRegister();
  return (
    <button
      type="button"
      onClick={() => openBrief(m.material_id)}
      className="text-left text-[11px] text-foreground underline decoration-dotted underline-offset-2 hover:text-primary"
    >
      {m.name}
    </button>
  );
};

export const StatusLegend: React.FC<{ statuses: JourneyStatus[] }> = ({ statuses }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
    {statuses.map((s) => (
      <span key={s} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <svg width="8" height="8" viewBox="0 0 8 8" className={cn("shrink-0", STATUS_DOT[s])}>
          <circle cx="4" cy="4" r="4" fill="currentColor" />
        </svg>
        {JOURNEY_STATUS_LABEL[s]}
      </span>
    ))}
  </div>
);

/** Expandable count line, used by the unplotted panel and the findings cards. */
export const Expandable: React.FC<{
  summary: React.ReactNode;
  count: number;
  children: React.ReactNode;
}> = ({ summary, count, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-baseline justify-between gap-2 text-left text-[11px] text-muted-foreground hover:text-foreground"
        aria-expanded={open}
      >
        <span>{summary}</span>
        <span className="shrink-0 text-[10px] underline decoration-dotted underline-offset-2">
          {open ? "hide" : `show ${count}`}
        </span>
      </button>
      {open && <div className="mt-1 flex flex-col gap-0.5 border-l border-border pl-2">{children}</div>}
    </div>
  );
};
