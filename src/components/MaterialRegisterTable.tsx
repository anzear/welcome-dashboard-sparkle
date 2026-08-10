import React, { useMemo, useState } from "react";
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
  emphasis?: boolean;
}

/**
 * Numeric cell. null renders as a muted em-dash (never 0, never bottom-ranked).
 * Computed values carry a dotted underline; entered judgements are marked with a
 * caret so they never read as a measurement.
 */
const NumCell: React.FC<NumProps> = ({ value, decimals = 0, provenance, emphasis }) => {
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

type MeasureId = "spend" | "emissions" | "volume" | "multi_application";

interface Measure {
  id: MeasureId;
  label: string;
  /** label used in the unranked divider, lower-case */
  noun: string;
  value: (m: Material) => number | null;
}

const MEASURES: Measure[] = [
  { id: "spend", label: "Spend", noun: "spend", value: (m) => m.annual_spend },
  { id: "emissions", label: "Emissions", noun: "emissions", value: (m) => m.ghg_contribution },
  { id: "volume", label: "Volume", noun: "volume", value: (m) => m.annual_volume },
  {
    id: "multi_application",
    label: "Multi-application",
    noun: "application",
    value: (m) => (m.application_categories && m.application_categories.length > 0 ? m.application_categories.length : null),
  },
];

interface RankedRow {
  m: Material;
  rank: number | null;
}

export const MaterialRegisterTable: React.FC<{ rows?: Material[] }> = ({ rows = materials }) => {
  const [measureId, setMeasureId] = useState<MeasureId>("spend");
  const [onlyUnranked, setOnlyUnranked] = useState(false);

  const measure = MEASURES.find((x) => x.id === measureId)!;

  const { ordered, rankedCount, total } = useMemo(() => {
    const ranked = rows.filter((m) => measure.value(m) !== null);
    const unranked = rows.filter((m) => measure.value(m) === null);

    ranked.sort((a, b) => {
      const diff = (measure.value(b) as number) - (measure.value(a) as number);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });
    unranked.sort((a, b) => a.name.localeCompare(b.name));

    // Ties share a rank; the next rank skips accordingly (1, 2, 2, 4).
    const rankedRows: RankedRow[] = [];
    let lastValue: number | null = null;
    let lastRank = 0;
    ranked.forEach((m, i) => {
      const v = measure.value(m) as number;
      const rank = lastValue !== null && v === lastValue ? lastRank : i + 1;
      lastValue = v;
      lastRank = rank;
      rankedRows.push({ m, rank });
    });

    const unrankedRows: RankedRow[] = unranked.map((m) => ({ m, rank: null }));

    return {
      ordered: [...rankedRows, ...unrankedRows],
      rankedCount: rankedRows.length,
      total: rows.length,
    };
  }, [rows, measure]);

  const missingCount = total - rankedCount;
  const visible = onlyUnranked ? ordered.filter((r) => r.rank === null) : ordered;
  const firstUnrankedId = onlyUnranked ? null : ordered.find((r) => r.rank === null)?.m.material_id ?? null;

  const activeCol = (id: MeasureId) => measureId === id;
  const emphHead = (id: MeasureId) => (activeCol(id) ? "text-primary" : undefined);

  const colCount = 9;

  return (
    <div className="w-full">
      {/* Rank control */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Ranked by</span>
          <div className="inline-flex items-center gap-1 rounded-md bg-muted p-0.5">
            {MEASURES.map((mm) => (
              <button
                key={mm.id}
                type="button"
                aria-pressed={measureId === mm.id}
                onClick={() => setMeasureId(mm.id)}
                className={cn(
                  "rounded-[4px] px-2.5 py-1 text-[11px] font-medium transition-colors",
                  measureId === mm.id
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mm.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-baseline gap-2 text-[11px] text-muted-foreground">
          <span>
            Ranking <span className="font-mono tabular-nums">{rankedCount}</span> of{" "}
            <span className="font-mono tabular-nums">{total}</span>
          </span>
          {missingCount > 0 && (
            <button
              type="button"
              onClick={() => setOnlyUnranked((v) => !v)}
              className="text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              {onlyUnranked ? "Show all" : `${missingCount} missing`}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2">
        <div className="text-xs font-medium text-foreground">
          <span className="font-mono tabular-nums">{visible.length}</span> materials
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

      <div className="max-h-[calc(100vh-16rem)] overflow-auto rounded-md border border-border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className={cn(HEAD, "w-10 px-2 py-2 text-right")}>#</th>
              <th className={cn(HEAD, "px-3 py-2 text-left")}>Material</th>
              <th className={cn(HEAD, "px-3 py-2 text-right", emphHead("volume"))}>Annual volume (t/yr)</th>
              <th className={cn(HEAD, "px-3 py-2 text-right")}>Unit price (EUR/kg)</th>
              <th className={cn(HEAD, "px-3 py-2 text-right", emphHead("spend"))}>Annual spend (EUR)</th>
              <th className={cn(HEAD, "px-3 py-2 text-right", emphHead("emissions"))}>
                GHG contribution (tCO2e/yr)
              </th>
              {activeCol("multi_application") && (
                <th className={cn(HEAD, "px-3 py-2 text-right text-primary")}>Applications</th>
              )}
              <th className={cn(HEAD, "px-3 py-2 text-right")}>Suppliers</th>
              <th className={cn(HEAD, "px-3 py-2 text-left")}>Status</th>
              <th className={cn(HEAD, "px-3 py-2 text-left")}>Owner</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ m, rank }) => (
              <React.Fragment key={m.material_id}>
                {m.material_id === firstUnrankedId && (
                  <tr>
                    <td colSpan={colCount + (activeCol("multi_application") ? 1 : 0)} className="p-0">
                      <div className="border-t border-border px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                        Unranked — no {measure.noun} figure
                      </div>
                    </td>
                  </tr>
                )}
                <tr
                  className={cn(
                    "border-b border-border/60 last:border-0 hover:bg-muted/40",
                    rank === null && "text-muted-foreground",
                  )}
                >
                  <td className="px-2 py-1.5 text-right align-top font-mono tabular-nums text-muted-foreground">
                    {rank === null ? <span className="text-muted-foreground/50">—</span> : rank}
                  </td>
                  <td className="px-3 py-1.5 align-top">
                    <div className={cn("font-medium leading-tight", rank === null ? "text-foreground/70" : "text-foreground")}>
                      {m.name}
                    </div>
                    <div className="text-[10px] leading-tight text-muted-foreground">
                      {m.material_class ?? "Unclassified"}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-right align-top">
                    <NumCell
                      value={m.annual_volume}
                      provenance={m.provenance.annual_volume}
                      emphasis={activeCol("volume")}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right align-top">
                    <NumCell value={m.unit_price} decimals={2} provenance={m.provenance.unit_price} />
                  </td>
                  <td className="px-3 py-1.5 text-right align-top">
                    <NumCell
                      value={m.annual_spend}
                      provenance={m.provenance.annual_spend}
                      emphasis={activeCol("spend")}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right align-top">
                    <NumCell
                      value={m.ghg_contribution}
                      provenance={m.provenance.ghg_contribution}
                      emphasis={activeCol("emissions")}
                    />
                  </td>
                  {activeCol("multi_application") && (
                    <td className="px-3 py-1.5 text-right align-top">
                      {m.application_categories && m.application_categories.length > 0 ? (
                        <span
                          className="font-mono tabular-nums font-medium text-foreground"
                          title={m.application_categories.join(", ")}
                        >
                          {m.application_categories.length}
                        </span>
                      ) : (
                        <Missing />
                      )}
                    </td>
                  )}
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
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaterialRegisterTable;
