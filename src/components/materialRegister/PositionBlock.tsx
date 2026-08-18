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
  variant?: "compact" | "detail" | "inline";
}

const BAR_H = 28;
const MIN_H = 3;

const PositionBlock: React.FC<Props> = ({ materialId, gapMeasure = null, gapSize = 0, variant = "compact" }) => {
  const { rankTables, measureId, filteredTotal } = useRegister();
  const detail = variant === "detail";

  // Fixed slot order, always: Spend | Emissions | Volume | Applications.
  // Bar index matches measure index — never sorted by height or by state.
  const entries = MEASURES.map((mm) => {
    const table = rankTables[mm.id];
    const rank = table.ranks[materialId] ?? null;
    const rankedCount = table.rankedCount;
    const missing = filteredTotal - rankedCount;
    const isActive = mm.id === measureId;
    // One accent bar and at most one amber bar per row; the active slot wins.
    const isAmber = !isActive && gapMeasure === mm.id;

    let coverage: string;
    if (rank === null) coverage = `${mm.label}: no figure recorded. Not ranked.`;
    else
      coverage =
        `${mm.label}: rank ${rank} of ${rankedCount} ranked.` +
        (missing > 0 ? ` ${missing} material${missing === 1 ? "" : "s"} have no figure.` : "");

    const activeRank = measureId === "all" ? null : rankTables[measureId].ranks[materialId] ?? null;
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

  if (variant === "inline") {
    return (
      <div className="flex items-end gap-4">
        {entries.map((e) => (
          <div key={e.mm.id} className="min-w-[64px]" title={`${e.coverage}${e.gapSentence}`}>
            <div
              className={cn(
                "truncate text-[10px] leading-none",
                e.isActive ? "text-primary/80" : e.isAmber ? "text-amber-700/80" : "text-muted-foreground",
              )}
            >
              {e.mm.label}
            </div>
            <div
              className={cn(
                "pt-1 text-[13px] leading-none tabular-nums",
                e.isActive
                  ? "text-primary"
                  : e.isAmber
                    ? "text-amber-700"
                    : e.rank === null
                      ? "text-muted-foreground/50"
                      : "text-foreground",
              )}
            >
              {e.rank === null ? "—" : `#${e.rank}`}
              <span className="pl-1 text-[10px] text-muted-foreground/60">
                {e.rank === null ? "" : `/${e.rankedCount}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!detail) {

    const tooltip = entries
      .map(
        (e) =>
          `${(e.mm.label).padEnd(14, " ")}${
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

  /* Detail: one row per measure — label, fixed rail, rank. Read as one unit
     inside ~380px; the coverage sentence sits beneath in the faintest tier. */
  return (
    <div className="max-w-[380px] space-y-2.5">
      {entries.map((e) => {
        const tone = e.isActive
          ? "text-primary"
          : e.isAmber
            ? "text-amber-700"
            : e.rank === null
              ? "text-muted-foreground/50"
              : "text-foreground";
        return (
          <div key={e.mm.id} className="min-w-0" title={`${e.coverage}${e.gapSentence}`}>
            <div className="grid grid-cols-[6rem_180px_auto] items-center gap-3">
              <span
                className={cn(
                  "truncate text-[11px]",
                  e.isActive ? "text-primary/80" : e.isAmber ? "text-amber-700/80" : "text-muted-foreground",
                )}
              >
                {e.mm.label}
              </span>
              <span className="relative block h-[3px] w-[180px] rounded-full bg-muted-foreground/15">
                {e.pos !== null && (
                  <span
                    className={cn(
                      "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full",
                      e.isActive
                        ? "h-[7px] w-[7px] bg-primary"
                        : e.isAmber
                          ? "h-[6px] w-[6px] bg-amber-500"
                          : "h-[6px] w-[6px] bg-muted-foreground/70",
                    )}
                    style={{ left: `${e.pos * 100}%` }}
                  />
                )}
              </span>
              <span className={cn("justify-self-end text-[13px] tabular-nums", tone)}>
                {e.rank === null ? "—" : `#${e.rank}`}
                <span className="pl-1 text-[11px] text-muted-foreground/60">
                  {e.rank === null ? "" : `of ${e.rankedCount}`}
                </span>
              </span>
            </div>
            <div className="pl-[6.75rem] pt-0.5 text-[11px] leading-tight text-muted-foreground/55">
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
