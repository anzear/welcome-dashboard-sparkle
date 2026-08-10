import React from "react";
import { cn } from "@/lib/utils";
import { JOURNEY_STATUS_LABEL, type FieldProvenance, type JourneyStatus } from "@/types/materialPrioritisation";

export const nf = (decimals = 0) =>
  new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });

export const Missing: React.FC = () => (
  <span className="text-muted-foreground/50" title="No value recorded — unranked">
    —
  </span>
);

interface NumProps {
  value: number | null;
  decimals?: number;
  provenance?: FieldProvenance;
  emphasis?: boolean;
}

/**
 * Numeric cell. null renders as a muted em-dash (never 0, never bottom-ranked).
 * Computed values carry a dotted underline; entered judgements are marked with a
 * caret so they never read as a measurement.
 */
export const NumCell: React.FC<NumProps> = ({ value, decimals = 0, provenance, emphasis }) => {
  if (value === null || value === undefined) return <Missing />;

  const origin = provenance?.origin ?? "ingested";
  const title = provenance
    ? `${origin}${provenance.source ? ` · ${provenance.source}` : ""}${provenance.date ? ` · ${provenance.date}` : ""}`
    : undefined;

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        origin === "computed" && "border-b border-dotted border-muted-foreground/60",
        emphasis && "font-medium text-primary",
      )}
      title={title}
    >
      {origin === "entered" && <span className="mr-0.5 text-muted-foreground/70">^</span>}
      {nf(decimals).format(value)}
    </span>
  );
};

/**
 * Muted, sequential treatment. Reads as progression, not judgement:
 * grey -> slate -> teal -> filled. Amber outline for parked, lowest contrast
 * for rejected. No traffic lights, no red, no green accent.
 */
export const STATUS_STYLES: Record<JourneyStatus, string> = {
  not_started: "border-transparent text-muted-foreground",
  under_evaluation: "border-slate-300 text-slate-600",
  in_testing: "border-slate-400 text-slate-700",
  qualified: "border-teal-300 text-teal-700",
  sourcing: "border-teal-500/70 text-teal-800",
  in_use: "border-transparent bg-slate-700 text-slate-50",
  parked: "border-amber-400/70 text-amber-700",
  rejected: "border-transparent text-muted-foreground/60",
};

const STATUS_DOT_STYLES: Record<JourneyStatus, string> = {
  not_started: "bg-muted-foreground/40",
  under_evaluation: "bg-slate-400",
  in_testing: "bg-slate-600",
  qualified: "bg-teal-400",
  sourcing: "bg-teal-600",
  in_use: "bg-slate-200",
  parked: "bg-amber-500/70",
  rejected: "bg-muted-foreground/30",
};

export const StatusPill: React.FC<{ status: JourneyStatus; entered?: boolean }> = ({ status, entered }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
      STATUS_STYLES[status],
    )}
    title={entered ? "entered judgement" : undefined}
  >
    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT_STYLES[status])} />
    {entered && <span className="text-muted-foreground/70">^</span>}
    {JOURNEY_STATUS_LABEL[status]}
  </span>
);


const fmtDate = (d: string | null) => {
  if (!d) return null;
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/** Always-present provenance line for the brief's figures section. */
export const provenanceLine = (
  provenance: FieldProvenance | undefined,
  hasValue: boolean,
  computedInputs?: string,
): string => {
  if (!hasValue) return "No figure recorded";
  const p = provenance;
  if (!p) return "Source: not recorded";
  if (p.origin === "computed") return `Computed: ${computedInputs ?? p.source ?? "derived"}`;
  if (p.origin === "entered")
    return `Entered by ${p.source ?? "unknown"}${p.date ? ` · ${fmtDate(p.date)}` : ""}`;
  return `Source: ${p.source ?? "not recorded"}${p.date ? ` · ${fmtDate(p.date)}` : ""}`;
};
