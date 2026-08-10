import React from "react";
import { cn } from "@/lib/utils";
import { materials } from "@/data/materialPrioritisationMock";
import {
  JOURNEY_STATUS_LABEL,
  type FieldProvenance,
  type JourneyStatus,
  type Material,
} from "@/types/materialPrioritisation";

const nf = (decimals = 0) =>
  new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });

const Missing = () => (
  <span className="text-muted-foreground/50" title="No value recorded — unranked">
    —
  </span>
);

interface NumProps {
  value: number | null;
  decimals?: number;
  provenance?: FieldProvenance;
}

/**
 * Numeric cell. null renders as a muted em-dash (never 0, never bottom-ranked).
 * Computed values carry a dotted underline; entered judgements are marked with a
 * caret so they never read as a measurement.
 */
const NumCell: React.FC<NumProps> = ({ value, decimals = 0, provenance }) => {
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
      )}
      title={title}
    >
      {origin === "entered" && <span className="mr-0.5 text-primary/70">^</span>}
      {nf(decimals).format(value)}
    </span>
  );
};

const STATUS_STYLES: Record<JourneyStatus, string> = {
  not_started: "bg-muted text-muted-foreground border-border",
  under_evaluation: "bg-primary/10 text-primary border-primary/20",
  in_testing: "bg-primary/10 text-primary border-primary/20",
  qualified: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  sourcing: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  in_use: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  parked: "bg-muted text-foreground/60 border-border",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const StatusPill: React.FC<{ status: JourneyStatus }> = ({ status }) => (
  <span
    className={cn(
      "inline-flex items-center whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
      STATUS_STYLES[status],
    )}
  >
    {JOURNEY_STATUS_LABEL[status]}
  </span>
);

const HEAD =
  "sticky top-0 z-10 bg-muted/60 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border";

export const MaterialRegisterTable: React.FC<{ rows?: Material[] }> = ({ rows = materials }) => {
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2">
        <div className="text-xs font-medium text-foreground">
          <span className="font-mono tabular-nums">{rows.length}</span> materials
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="border-b border-dotted border-muted-foreground/60 font-mono">1 234</span> computed
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-primary/70">^</span> entered
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-muted-foreground/50">—</span> no value (unranked)
          </span>
        </div>
      </div>

      <div className="max-h-[calc(100vh-14rem)] overflow-auto rounded-md border border-border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className={cn(HEAD, "px-3 py-2 text-left")}>Material</th>
              <th className={cn(HEAD, "px-3 py-2 text-right")}>Annual volume (t/yr)</th>
              <th className={cn(HEAD, "px-3 py-2 text-right")}>Unit price (EUR/kg)</th>
              <th className={cn(HEAD, "px-3 py-2 text-right")}>Annual spend (EUR)</th>
              <th className={cn(HEAD, "px-3 py-2 text-right")}>GHG contribution (tCO2e/yr)</th>
              <th className={cn(HEAD, "px-3 py-2 text-right")}>Suppliers</th>
              <th className={cn(HEAD, "px-3 py-2 text-left")}>Status</th>
              <th className={cn(HEAD, "px-3 py-2 text-left")}>Owner</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.material_id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                <td className="px-3 py-1.5 align-top">
                  <div className="font-medium leading-tight text-foreground">{m.name}</div>
                  <div className="text-[10px] leading-tight text-muted-foreground">
                    {m.material_class ?? "Unclassified"}
                  </div>
                </td>
                <td className="px-3 py-1.5 text-right align-top">
                  <NumCell value={m.annual_volume} provenance={m.provenance.annual_volume} />
                </td>
                <td className="px-3 py-1.5 text-right align-top">
                  <NumCell value={m.unit_price} decimals={2} provenance={m.provenance.unit_price} />
                </td>
                <td className="px-3 py-1.5 text-right align-top">
                  <NumCell value={m.annual_spend} provenance={m.provenance.annual_spend} />
                </td>
                <td className="px-3 py-1.5 text-right align-top">
                  <NumCell value={m.ghg_contribution} provenance={m.provenance.ghg_contribution} />
                </td>
                <td className="px-3 py-1.5 text-right align-top">
                  <NumCell value={m.supplier_count} provenance={m.provenance.supplier_count} />
                </td>
                <td className="px-3 py-1.5 align-top">
                  <StatusPill status={m.journey_status} />
                </td>
                <td className="px-3 py-1.5 align-top">
                  {m.owner ?? <span className="text-muted-foreground/60">Unassigned</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaterialRegisterTable;
