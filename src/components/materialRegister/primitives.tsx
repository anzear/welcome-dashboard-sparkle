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
        emphasis && "font-medium text-foreground",
      )}
      title={title}
    >
      {origin === "entered" && <span className="mr-0.5 text-primary/70">^</span>}
      {nf(decimals).format(value)}
    </span>
  );
};

export const STATUS_STYLES: Record<JourneyStatus, string> = {
  not_started: "bg-muted text-muted-foreground border-border",
  under_evaluation: "bg-primary/10 text-primary border-primary/20",
  in_testing: "bg-primary/10 text-primary border-primary/20",
  qualified: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  sourcing: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  in_use: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  parked: "bg-muted text-foreground/60 border-border",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export const StatusPill: React.FC<{ status: JourneyStatus; entered?: boolean }> = ({ status, entered }) => (
  <span
    className={cn(
      "inline-flex items-center whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
      STATUS_STYLES[status],
    )}
    title={entered ? "entered judgement" : undefined}
  >
    {entered && <span className="mr-0.5 text-primary/70">^</span>}
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
