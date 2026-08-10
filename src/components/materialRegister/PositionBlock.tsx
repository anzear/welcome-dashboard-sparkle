import React from "react";
import { cn } from "@/lib/utils";
import { MEASURES, useRegister, type MeasureId } from "@/components/materialRegister/registerStore";

/**
 * Four independent rank positions for one material. One rail per measure —
 * the rails are separate scales and are never normalised against each other,
 * averaged, or drawn as a single combined bar. Read-only.
 */
interface Props {
  materialId: string;
  gapMeasure?: MeasureId | null;
  gapSize?: number;
  /** "compact" = 2x2 grid for the register row. "detail" = one per row, coverage inline. */
  variant?: "compact" | "detail";
}

const PositionBlock: React.FC<Props> = ({ materialId, gapMeasure = null, gapSize = 0, variant = "compact" }) => {
  const { rankTables, measureId, filteredTotal } = useRegister();
  const detail = variant === "detail";

  const compactLabel = (id: MeasureId) => (id === "multi_application" ? "Apps" : undefined);

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
    let tooltip = coverage;
    if (isAmber && rank !== null && activeRank !== null) {
      const a = MEASURES.find((x) => x.id === measureId)!;
      const first = rank < activeRank ? { m: mm, r: rank } : { m: a, r: activeRank };
      const second = rank < activeRank ? { m: a, r: activeRank } : { m: mm, r: rank };
      tooltip = `${coverage} Ranks ${first.r} on ${first.m.noun} but ${second.r} on ${second.m.noun}. ${gapSize} positions apart.`;
    }

    // Left edge = rank 1, right edge = last ranked position.
    const pos = rank !== null && rankedCount > 1 ? (rank - 1) / (rankedCount - 1) : rank !== null ? 0 : null;

    return { mm, rank, rankedCount, isActive, isAmber, tooltip, coverage, pos };
  });

  return (
    <div
      className={cn(
        detail ? "flex flex-col gap-3" : "grid w-[200px] grid-cols-2 gap-x-3 gap-y-1",
      )}
    >
      {entries.map((e) => {
        const tone = e.isActive
          ? "text-primary"
          : e.isAmber
            ? "text-amber-700"
            : e.rank === null
              ? "text-muted-foreground/50"
              : "text-muted-foreground";
        return (
          <div key={e.mm.id} title={detail ? undefined : e.tooltip} className="min-w-0">
            <div className={cn("flex items-baseline gap-1", detail ? "text-[12px]" : "text-[10px]")}>
              <span
                className={cn(
                  "shrink-0 truncate",
                  detail ? "w-24" : "w-[3.6rem]",
                  e.isActive ? "text-primary/70" : e.isAmber ? "text-amber-700/70" : "text-muted-foreground/45",
                )}
              >
                {(!detail && compactLabel(e.mm.id)) || e.mm.label}
              </span>
              <span className={cn("font-mono tabular-nums", detail && "text-[14px]", tone)}>
                {e.rank === null ? "—" : `#${e.rank}`}
              </span>
            </div>
            <div className={cn("relative w-full rounded-full bg-muted-foreground/15", detail ? "mt-1 h-[3px]" : "mt-0.5 h-[2px]")}>
              {e.pos !== null && (
                <span
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full",
                    e.isActive
                      ? "h-[6px] w-[6px] bg-primary"
                      : detail
                        ? "h-[5px] w-[5px] bg-muted-foreground/70"
                        : "h-[4px] w-[4px] bg-muted-foreground/70",
                  )}
                  style={{ left: `${e.pos * 100}%` }}
                />
              )}
            </div>
            {detail && <div className="pt-1 text-[11px] text-muted-foreground/60">{e.coverage}</div>}
          </div>
        );
      })}
    </div>
  );
};

export default PositionBlock;
