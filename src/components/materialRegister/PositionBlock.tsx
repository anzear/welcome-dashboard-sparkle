import React from "react";
import { cn } from "@/lib/utils";
import { MEASURES, useRegister, type MeasureId } from "@/components/materialRegister/registerStore";

/**
 * Four independent rank positions for one material, always rendered in the same
 * fixed order (Spend, Emissions, Volume, Applications) whatever measure the table
 * is ranked by — only the accent highlight moves. Each measure scales against its
 * own ranked population; the four are never averaged, summed or drawn as one bar.
 *
 * "compact" = micro bar chart for the register row (shape is the finding, no
 * numbers in the cell). "detail" = labelled rows with ranks and coverage.
 * Read-only.
 */
interface Props {
  materialId: string;
  gapMeasure?: MeasureId | null;
  gapSize?: number;
  variant?: "compact" | "detail";
}

const BAR_H = 28;
const MIN_H = 3;

const PositionBlock: React.FC<Props> = ({ materialId, gapMeasure = null, gapSize = 0, variant = "compact" }) => {
  const { rankTables, measureId, filteredTotal } = useRegister();
  const detail = variant === "detail";

  const labelFor = (id: MeasureId) => (id === "multi_application" ? "Applications" : undefined);

  const entries = MEASURES.map((mm) => {
    const table = rankTables[mm.id];
    const rank = table.ranks[materialId] ?? null;
    const rankedCount = table.rankedCount;
    const missing = filteredTotal - rankedCount;
    const isActive = mm.id === measureId;
    const isAmber = gapMeasure === mm.id;

    let coverage: string;
    if (rank === null) coverage = `${mm.label}: no figure recorded. Not ranked.`;
    else
      coverage =
        `${mm.label}: rank ${rank} of ${rankedCount} ranked.` +
        (missing > 0 ? ` ${missing} material${missing === 1 ? "" : "s"} have no figure.` : "");

    const activeRank = rankTables[measureId].ranks[materialId] ?? null;
    let gapSentence = "";
    if (isAmber && rank !== null && activeRank !== null) {
      const a = MEASURES.find((x) => x.id === measureId)!;
      const first = rank < activeRank ? { m: mm, r: rank } : { m: a, r: activeRank };
      const second = rank < activeRank ? { m: a, r: activeRank } : { m: mm, r: rank };
      gapSentence = ` Ranks ${first.r} on ${first.m.noun} but ${second.r} on ${second.m.noun}. ${gapSize} positions apart.`;
    }

    // Rank 1 = full height, last ranked = minimum visible height.
    const frac = rank !== null && rankedCount > 1 ? 1 - (rank - 1) / (rankedCount - 1) : rank !== null ? 1 : null;

    // Left edge = rank 1, right edge = last ranked position (detail rails).
    const pos = rank !== null && rankedCount > 1 ? (rank - 1) / (rankedCount - 1) : rank !== null ? 0 : null;

    return { mm, rank, rankedCount, isActive, isAmber, coverage, gapSentence, frac, pos };
  });

  if (!detail) {
    const tooltip = entries
      .map(
        (e) =>
          `${(labelFor(e.mm.id) || e.mm.label).padEnd(14, " ")}${
            e.rank === null ? "no figure recorded" : `#${e.rank} of ${e.rankedCount} ranked`
          }${e.gapSentence}`,
      )
      .join("\n");

    return (
      <div title={tooltip} className="inline-block">
        <div className="flex items-end gap-[4px]" style={{ height: BAR_H }}>
          {entries.map((e) => {
            if (e.frac === null) {
              return (
                <span
                  key={e.mm.id}
                  className="border border-dotted border-muted-foreground/45"
                  style={{ width: 12, height: BAR_H }}
                />
              );
            }
            return (
              <span
                key={e.mm.id}
                className={cn(
                  e.isActive ? "bg-primary" : e.isAmber ? "bg-amber-500" : "bg-muted-foreground/55",
                )}
                style={{ width: 12, height: Math.max(MIN_H, Math.round(e.frac * BAR_H)) }}
              />
            );
          })}
        </div>
        <div className="mt-[2px] h-px w-[60px] bg-border" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((e) => {
        const tone = e.isActive
          ? "text-primary"
          : e.isAmber
            ? "text-amber-700"
            : e.rank === null
              ? "text-muted-foreground/50"
              : "text-muted-foreground";
        return (
          <div key={e.mm.id} className="min-w-0">
            <div className="flex items-baseline gap-1 text-[12px]">
              <span
                className={cn(
                  "w-24 shrink-0 truncate",
                  e.isActive ? "text-primary/70" : e.isAmber ? "text-amber-700/70" : "text-muted-foreground/45",
                )}
              >
                {labelFor(e.mm.id) || e.mm.label}
              </span>
              <span className={cn("font-mono text-[14px] tabular-nums", tone)}>
                {e.rank === null ? "—" : `#${e.rank}`}
              </span>
            </div>
            <div className="relative mt-1 h-[3px] w-full rounded-full bg-muted-foreground/15">
              {e.pos !== null && (
                <span
                  className={cn(
                    "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full",
                    e.isActive ? "h-[6px] w-[6px] bg-primary" : "h-[5px] w-[5px] bg-muted-foreground/70",
                  )}
                  style={{ left: `${e.pos * 100}%` }}
                />
              )}
            </div>
            <div className="pt-1 text-[11px] text-muted-foreground/60">
              {e.coverage}
              {e.gapSentence}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PositionBlock;
