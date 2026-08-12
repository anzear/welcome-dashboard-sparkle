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

  const origin = provenance?.origin ?? "unknown";
  const title =
    provenance && origin !== "unknown"
      ? `${origin}${provenance.source ? ` · ${provenance.source}` : ""}${provenance.date ? ` · ${provenance.date}` : ""}`
      : "Source unknown";

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        origin === "computed" && "border-b border-dotted border-muted-foreground/60",
        // The active measure is marked once, on the header and the column tint —
        // never by recolouring every value in the column.
        emphasis && "font-medium text-foreground",
      )}
      title={title}
    >
      {origin === "entered" && <span className="mr-0.5 text-muted-foreground/70">^</span>}
      {nf(decimals).format(value)}
    </span>
  );

};

/**
 * Eight-step muted progression. Reads as distance travelled, not judgement:
 * transparent -> light slate -> darker slate -> filled for in use. No green
 * anywhere — the accent belongs to the active ranking measure alone. Amber
 * outline for parked, lowest contrast for rejected.
 */
export const STATUS_STYLES: Record<JourneyStatus, string> = {
  not_started: "border-transparent text-muted-foreground/70",
  under_evaluation: "border-slate-200 text-slate-500",
  in_testing: "border-slate-300 text-slate-600",
  qualified: "border-slate-400 text-slate-700",
  sourcing: "border-slate-500 text-slate-800",
  in_use: "border-transparent bg-slate-800 text-slate-50",
  parked: "border-amber-400/70 text-amber-700",
  rejected: "border-dashed border-muted-foreground/30 text-muted-foreground/60",
};

  <span
    className={cn(
      "inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
      STATUS_STYLES[status],
    )}
    title={entered ? "entered judgement" : undefined}
  >
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

/**
 * Always-present provenance line for the brief's figures section.
 * "No figure recorded" belongs to fields with NO value. A field that holds a
 * value always came from somewhere: when the origin was never captured it reads
 * "Source unknown", which is a different statement.
 */
export const provenanceLine = (
  provenance: FieldProvenance | undefined,
  hasValue: boolean,
  computedInputs?: string,
): string => {
  if (!hasValue) return "No figure recorded";
  const p = provenance;
  if (!p || p.origin === "unknown") return "Source unknown";
  if (p.origin === "computed") return `Computed: ${computedInputs ?? p.source ?? "derived"}`;
  if (p.origin === "entered")
    return `Entered by ${p.source ?? "unknown"}${p.date ? ` · ${fmtDate(p.date)}` : ""}`;
  return `Source: ${p.source ?? "unknown"}${p.date ? ` · ${fmtDate(p.date)}` : ""}`;
};

/** Relative readout for a planned date. Undated is a state, never "today". */
export const relativeDate = (
  iso: string | null,
): { label: string; overdue: boolean } | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return { label: iso, overdue: false };
  const days = Math.round((t - Date.now()) / 86400000);
  if (days < 0) {
    const n = Math.abs(days);
    return { label: n >= 60 ? `${Math.round(n / 30)} months ago` : `${n} days ago`, overdue: true };
  }
  if (days === 0) return { label: "today", overdue: false };
  return {
    label: days >= 60 ? `in ${Math.round(days / 30)} months` : `in ${days} days`,
    overdue: false,
  };
};

export const shortDate = (iso: string | null) => fmtDate(iso);
