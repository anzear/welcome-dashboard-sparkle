import React, { useMemo, useState } from "react";

import type { Material } from "@/types/materialPrioritisation";
import type { AxisVar } from "@/components/materialRegister/gridAxes";

export interface PlottedEntry {
  m: Material;
  x: number;
  y: number;
}

const FIRST_PAGE = 12;

const fmt = (v: number, axis: AxisVar) =>
  axis.kind === "measured"
    ? v >= 1000
      ? Math.round(v).toLocaleString("en-US")
      : v.toFixed(v < 10 ? 1 : 0)
    : String(v);

/**
 * The materials the current axes can place, ranked on the axes themselves.
 * Ranks stay separate per axis — the two measures are never merged into one score.
 */
const PlottedList: React.FC<{
  entries: PlottedEntry[];
  xv: AxisVar;
  yv: AxisVar;
  onOpen: (m: Material) => void;
}> = ({ entries, xv, yv, onOpen }) => {
  const [showAll, setShowAll] = useState(false);
  const [sortAxis, setSortAxis] = useState<"both" | "x" | "y">("both");

  const { ranked, xRank, yRank, avgRank } = useMemo(() => {
    const rankMap = (key: "x" | "y") => {
      const sorted = [...entries].sort((a, b) => b[key] - a[key]);
      const map = new Map<string, number>();
      let last: number | null = null;
      let lastRank = 0;
      sorted.forEach((e, i) => {
        const rank = last !== null && e[key] === last ? lastRank : i + 1;
        map.set(e.m.material_id, rank);
        last = e[key];
        lastRank = rank;
      });
      return map;
    };
    const xRank = rankMap("x");
    const yRank = rankMap("y");
    const avgRank = new Map<string, number>();
    entries.forEach((e) => {
      const rx = xRank.get(e.m.material_id) ?? 0;
      const ry = yRank.get(e.m.material_id) ?? 0;
      avgRank.set(e.m.material_id, (rx + ry) / 2);
    });
    const ranked =
      sortAxis === "both"
        ? [...entries].sort((a, b) => {
            const av = avgRank.get(a.m.material_id) ?? 0;
            const bv = avgRank.get(b.m.material_id) ?? 0;
            if (av !== bv) return av - bv;
            const abest = Math.min(xRank.get(a.m.material_id) ?? 0, yRank.get(a.m.material_id) ?? 0);
            const bbest = Math.min(xRank.get(b.m.material_id) ?? 0, yRank.get(b.m.material_id) ?? 0);
            if (abest !== bbest) return abest - bbest;
            return a.m.name.localeCompare(b.m.name);
          })
        : [...entries].sort((a, b) => b[sortAxis] - a[sortAxis]);
    return { ranked, xRank, yRank, avgRank };
  }, [entries, sortAxis]);

  if (entries.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Nothing is plotted on the current axes.
      </p>
    );
  }

  const visible = showAll ? ranked : ranked.slice(0, FIRST_PAGE);
  const rest = ranked.length - visible.length;
  const bothMode = sortAxis === "both";
  const activeAxis = sortAxis === "y" ? yv : xv;

  return (
    <section>
      <header className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="font-mono tabular-nums">{entries.length}</span> materials plotted
        </h2>
        <p className="text-[10px] text-muted-foreground/70">
          {bothMode
            ? "Ranked on the average of both axis positions. Each axis keeps its own rank."
            : `Ranked on ${activeAxis.label.toLowerCase()}. Each axis keeps its own rank.`}
        </p>
      </header>

      <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-muted p-1">
        {(["both", "x", "y"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setSortAxis(k)}
            className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${
              sortAxis === k
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {k === "both" ? "Both axes" : `Rank by ${(k === "x" ? xv : yv).label}`}
          </button>
        ))}
      </div>

      <ul className="mt-3 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <li className={`grid ${bothMode ? "grid-cols-[32px_minmax(0,1fr)_auto_auto_auto]" : "grid-cols-[32px_minmax(0,1fr)_auto_auto]"} items-center gap-x-4 bg-muted/40 px-4 py-2 text-[10px] uppercase tracking-wide text-muted-foreground`}>
          <span className="text-right">#</span>
          <span>Material</span>
          <span className="w-[120px] text-right">
            {xv.label}
            {xv.kind === "measured" ? ` (${xv.unit})` : ""}
          </span>
          <span className="w-[120px] text-right">
            {yv.label}
            {yv.kind === "measured" ? ` (${yv.unit})` : ""}
          </span>
          {bothMode && <span className="w-[72px] text-right">Avg rank</span>}
        </li>
        {visible.map((e, i) => (
          <li
            key={e.m.material_id}
            className={`grid ${bothMode ? "grid-cols-[32px_minmax(0,1fr)_auto_auto_auto]" : "grid-cols-[32px_minmax(0,1fr)_auto_auto]"} items-center gap-x-4 px-4 py-2.5 transition-colors hover:bg-muted/40`}
          >
            <span className="text-right font-mono text-[11px] tabular-nums text-muted-foreground">
              {i + 1}
            </span>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onOpen(e.m)}
                className="block max-w-full truncate text-left text-[12px] font-medium text-foreground hover:underline"
                title={e.m.name}
              >
                {e.m.name}
              </button>
              <p className="truncate text-[10px] text-muted-foreground">
                {e.m.material_class ?? "Unclassified"}
              </p>
            </div>
            <div className="w-[120px] text-right">
              <span className="font-mono text-[11px] tabular-nums text-foreground">
                {fmt(e.x, xv)}
              </span>
              <span className="ml-2 font-mono text-[10px] tabular-nums text-muted-foreground">
                #{xRank.get(e.m.material_id)}
              </span>
            </div>
            <div className="w-[120px] text-right">
              <span className="font-mono text-[11px] tabular-nums text-foreground">
                {fmt(e.y, yv)}
              </span>
              <span className="ml-2 font-mono text-[10px] tabular-nums text-muted-foreground">
                #{yRank.get(e.m.material_id)}
              </span>
            </div>
            {bothMode && (
              <div className="w-[72px] text-right">
                <span className="font-mono text-[11px] tabular-nums text-foreground">
                  {(avgRank.get(e.m.material_id) ?? 0).toFixed(1)}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>

      {rest > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-3 text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          Show <span className="font-mono tabular-nums">{rest}</span> more
        </button>
      )}
    </section>
  );
};

export default PlottedList;
