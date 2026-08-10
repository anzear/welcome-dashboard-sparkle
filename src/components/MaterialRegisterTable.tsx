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
  /** compact chip label */
  short: string;
  /** label used in the unranked divider, lower-case */
  noun: string;
  value: (m: Material) => number | null;
}

const MEASURES: Measure[] = [
  { id: "spend", label: "Spend", short: "SPD", noun: "spend", value: (m) => m.annual_spend },
  { id: "emissions", label: "Emissions", short: "GHG", noun: "emissions", value: (m) => m.ghg_contribution },
  { id: "volume", label: "Volume", short: "VOL", noun: "volume", value: (m) => m.annual_volume },
  {
    id: "multi_application",
    label: "Multi-application",
    short: "APP",
    noun: "application",
    value: (m) => (m.application_categories && m.application_categories.length > 0 ? m.application_categories.length : null),
  },
];

/** A gap counts as divergent at or above this share of the ranked population. */
export const DIVERGENCE_THRESHOLD_RATIO = 0.25;

interface RankTable {
  ranks: Record<string, number | null>;
  rankedCount: number;
  /** ranked materials, descending, in rank order */
  order: Material[];
  unranked: Material[];
}

/** Descending ranking. Ties share a rank, next rank skips. Missing value → null. */
function computeRanks(rows: Material[], measure: Measure): RankTable {
  const ranked = rows.filter((m) => measure.value(m) !== null);
  const unranked = rows.filter((m) => measure.value(m) === null);

  ranked.sort((a, b) => {
    const diff = (measure.value(b) as number) - (measure.value(a) as number);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
  unranked.sort((a, b) => a.name.localeCompare(b.name));

  const ranks: Record<string, number | null> = {};
  let lastValue: number | null = null;
  let lastRank = 0;
  ranked.forEach((m, i) => {
    const v = measure.value(m) as number;
    const rank = lastValue !== null && v === lastValue ? lastRank : i + 1;
    lastValue = v;
    lastRank = rank;
    ranks[m.material_id] = rank;
  });
  unranked.forEach((m) => {
    ranks[m.material_id] = null;
  });

  return { ranks, rankedCount: ranked.length, order: ranked, unranked };
}

interface RankedRow {
  m: Material;
  rank: number | null;
  ranks: Record<MeasureId, number | null>;
  /** measure driving the largest gap vs. the active rank, when significant */
  gapMeasure: MeasureId | null;
  gapSize: number;
}

export const MaterialRegisterTable: React.FC<{ rows?: Material[] }> = ({ rows = materials }) => {
  const [measureId, setMeasureId] = useState<MeasureId>("spend");
  const [onlyUnranked, setOnlyUnranked] = useState(false);
  const [onlyDivergent, setOnlyDivergent] = useState(false);

  const measure = MEASURES.find((x) => x.id === measureId)!;

  const { ordered, rankedCount, total, rankTables } = useMemo(() => {
    const tables = {} as Record<MeasureId, RankTable>;
    MEASURES.forEach((mm) => {
      tables[mm.id] = computeRanks(rows, mm);
    });

    const active = tables[measureId];
    const threshold = active.rankedCount * DIVERGENCE_THRESHOLD_RATIO;

    const build = (m: Material, rank: number | null): RankedRow => {
      const ranks = {} as Record<MeasureId, number | null>;
      MEASURES.forEach((mm) => {
        ranks[mm.id] = tables[mm.id].ranks[m.material_id] ?? null;
      });

      let gapMeasure: MeasureId | null = null;
      let gapSize = 0;
      if (rank !== null) {
        MEASURES.forEach((mm) => {
          if (mm.id === measureId) return;
          const other = ranks[mm.id];
          if (other === null) return;
          const d = Math.abs(other - rank);
          if (d > gapSize) {
            gapSize = d;
            gapMeasure = mm.id;
          }
        });
      }
      const flagged = gapMeasure !== null && gapSize >= threshold && gapSize > 0;

      return { m, rank, ranks, gapMeasure: flagged ? gapMeasure : null, gapSize };
    };

    const orderedRows: RankedRow[] = [
      ...active.order.map((m) => build(m, active.ranks[m.material_id] ?? null)),
      ...active.unranked.map((m) => build(m, null)),
    ];

    return {
      ordered: orderedRows,
      rankedCount: active.rankedCount,
      total: rows.length,
      rankTables: tables,
    };
  }, [rows, measureId]);

  const missingCount = total - rankedCount;
  const divergentCount = ordered.filter((r) => r.gapMeasure !== null).length;

  const bothFilters = onlyUnranked && onlyDivergent;
  const visible = bothFilters
    ? []
    : ordered.filter(
        (r) => (!onlyUnranked || r.rank === null) && (!onlyDivergent || r.gapMeasure !== null),
      );

  const firstUnrankedId =
    onlyUnranked || onlyDivergent ? null : ordered.find((r) => r.rank === null)?.m.material_id ?? null;

  const activeCol = (id: MeasureId) => measureId === id;
  const emphHead = (id: MeasureId) => (activeCol(id) ? "text-primary" : undefined);

  const colCount = 10;

  const otherMeasures = MEASURES.filter((mm) => mm.id !== measureId);

  const chipTooltip = (row: RankedRow, mm: Measure) => {
    const other = row.ranks[mm.id];
    if (other === null) return `${mm.label}: no figure — unranked`;
    if (row.gapMeasure === mm.id && row.rank !== null) {
      const a = MEASURES.find((x) => x.id === measureId)!;
      const first = other < row.rank ? { m: mm, r: other } : { m: a, r: row.rank };
      const second = other < row.rank ? { m: a, r: row.rank } : { m: mm, r: other };
      return `Ranks ${first.r}${ordinal(first.r)} on ${first.m.noun} but ${second.r}${ordinal(
        second.r,
      )} on ${second.m.noun}. ${row.gapSize} positions apart.`;
    }
    return `${mm.label}: rank ${other} of ${rankTables[mm.id].rankedCount} ranked`;
  };

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

        <button
          type="button"
          aria-pressed={onlyDivergent}
          onClick={() => setOnlyDivergent((v) => !v)}
          className={cn(
            "rounded-sm border px-2 py-0.5 text-[11px] font-medium transition-colors",
            onlyDivergent
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          Divergent only (<span className="font-mono tabular-nums">{divergentCount}</span>)
        </button>
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
            <span className="rounded-sm bg-amber-500/10 px-1 font-mono text-amber-700">GHG 6</span> rank divergence
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
              <th className={cn(HEAD, "px-3 py-2 text-left")}>Other rankings</th>
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
            {bothFilters && (
              <tr>
                <td
                  colSpan={colCount + (activeCol("multi_application") ? 1 : 0)}
                  className="px-3 py-6 text-center text-[11px] text-muted-foreground"
                >
                  No material can be both unranked and divergent — an unranked material has no{" "}
                  {measure.noun} position to diverge from. Turn off one filter.
                </td>
              </tr>
            )}
            {visible.map((row) => {
              const { m, rank } = row;
              return (
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
                    <td className="whitespace-nowrap px-3 py-1.5 align-top">
                      <span className="inline-flex items-center gap-1">
                        {otherMeasures.map((mm) => {
                          const other = row.ranks[mm.id];
                          const amber = row.gapMeasure === mm.id;
                          return (
                            <span
                              key={mm.id}
                              title={chipTooltip(row, mm)}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-sm px-1 py-0.5 font-mono text-[10px] tabular-nums",
                                amber
                                  ? "bg-amber-500/10 text-amber-700"
                                  : "text-muted-foreground/70",
                              )}
                            >
                              <span>{mm.short}</span>
                              {other === null ? (
                                <span className="text-muted-foreground/50">—</span>
                              ) : (
                                <span className={amber ? "font-medium" : undefined}>{other}</span>
                              )}
                            </span>
                          );
                        })}
                      </span>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function ordinal(n: number) {
  const r10 = n % 10;
  const r100 = n % 100;
  if (r10 === 1 && r100 !== 11) return "st";
  if (r10 === 2 && r100 !== 12) return "nd";
  if (r10 === 3 && r100 !== 13) return "rd";
  return "th";
}

export default MaterialRegisterTable;
