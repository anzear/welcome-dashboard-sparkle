import React, { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { JOURNEY_STATUS_LABEL, type JourneyStatus, type Material } from "@/types/materialPrioritisation";
import { useRegister } from "@/components/materialRegister/registerStore";
import FilterChips from "@/components/materialRegister/FilterChips";
import PriorityDialog from "@/components/materialRegister/PriorityDialog";
import {
  BriefLink,
  Expandable,
  STATUS_DOT,
  StatusLegend,
  median,
  ordinal,
} from "@/components/materialRegister/gridPrimitives";
import {
  AXIS_PRESETS,
  AXIS_VARS,
  DEFAULT_PRESET,
  SIZE_MIN,
  axisVar,
  niceScale,
  quadrantReadings,
  sizeRadius,
  type AxisVarId,
  type SizeVarId,
} from "@/components/materialRegister/gridAxes";
import { nf } from "@/components/materialRegister/primitives";

const W = 780;
const H = 460;
const PAD = { l: 78, r: 52, t: 22, b: 52 };
const PW = W - PAD.l - PAD.r;
const PH = H - PAD.t - PAD.b;

/** Deterministic jitter so overlapping dots stay individually clickable. */
const jitter = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 997;
  return { dx: ((h % 13) - 6) * 0.55, dy: (((h >> 2) % 13) - 6) * 0.55 };
};

interface Dot {
  m: Material;
  x: number;
  y: number;
  cx: number;
  cy: number;
  r: number;
  /** Count behind the bubble size, or null when nothing has been scored. */
  sizeCount: number | null;
  scored: boolean;
}

const compact = (x: number) =>
  x >= 1_000_000 ? `${(x / 1_000_000).toFixed(1)}M` : x >= 10_000 ? `${(x / 1000).toFixed(0)}k` : nf(0).format(x);

const AxisSelect: React.FC<{
  label: string;
  value: string;
  options: { id: string; label: string; kind?: string }[];
  onChange: (id: string) => void;
}> = ({ label, value, options, onChange }) => (
  <label className="flex items-center gap-1.5">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 rounded-sm border border-border bg-background px-1.5 text-[11px] text-foreground"
      aria-label={label}
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

const PrioritisationGrid: React.FC = () => {
  const {
    setMeasureId,
    measure,
    ordered,
    data,
    rankTables,
    countsFor,
    openBrief,
    priorityPeriod,
    setPriorityPeriod,
    prioritySetCount,
    inPrioritySet,
    applyPriority,
    toast,
    setToast,
    undo,
  } = useRegister();

  const [xId, setXId] = useState<AxisVarId>(DEFAULT_PRESET.x);
  const [yId, setYId] = useState<AxisVarId>(DEFAULT_PRESET.y);
  const [sizeId, setSizeId] = useState<SizeVarId>(DEFAULT_PRESET.size);

  const xv = axisVar(xId);
  const yv = axisVar(yId);
  const sizeVar = axisVar(sizeId);

  /** The register's ranking measure follows the X axis so the findings stay coherent. */
  const pickX = (id: AxisVarId) => {
    setXId(id);
    const v = axisVar(id);
    if (v.measureId) setMeasureId(v.measureId);
  };

  const applyPreset = (presetId: string) => {
    const p = AXIS_PRESETS.find((x) => x.id === presetId)!;
    pickX(p.x);
    setYId(p.y);
    setSizeId(p.size);
  };

  const activePreset = AXIS_PRESETS.find((p) => p.x === xId && p.y === yId && p.size === sizeId) ?? null;

  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [prioritySetOnly, setPrioritySetOnly] = useState(false);
  const [activeView, setActiveView] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ add: boolean } | null>(null);
  const [hover, setHover] = useState<{ dot: Dot; left: number; top: number } | null>(null);
  const [lasso, setLasso] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const rows = useMemo(
    () => (prioritySetOnly ? ordered.filter((r) => inPrioritySet(r.m)) : ordered),
    [ordered, prioritySetOnly, inPrioritySet],
  );

  const classified = useMemo(() => {
    const plotted: { m: Material; x: number; y: number; sizeCount: number | null; scored: boolean }[] = [];
    const noFigure: Material[] = [];
    const notScored: Material[] = [];
    rows.forEach(({ m }) => {
      const counts = countsFor(m.material_id);
      const x = xv.value(m, counts);
      const y = yv.value(m, counts);
      if (x === null || y === null) {
        const missingJudgement =
          (xv.kind === "judgement" && x === null) || (yv.kind === "judgement" && y === null);
        (missingJudgement ? notScored : noFigure).push(m);
        return;
      }
      plotted.push({
        m,
        x,
        y,
        sizeCount: counts.scored_count === null ? null : (sizeVar.value(m, counts) as number),
        scored: counts.scored_count !== null,
      });
    });
    const byName = (a: Material, b: Material) => a.name.localeCompare(b.name);
    return { plotted, noFigure: noFigure.sort(byName), notScored: notScored.sort(byName) };
  }, [rows, xv, yv, sizeVar, countsFor]);

  const { plotted, noFigure, notScored } = classified;

  /** Round axis maxima and round tick intervals, derived from the data range. */
  const xScale =
    xv.fixedMax !== undefined
      ? { max: xv.fixedMax, step: 1, ticks: Array.from({ length: xv.fixedMax + 1 }, (_, i) => i) }
      : niceScale(Math.max(1, ...plotted.map((p) => p.x)));
  const yScale =
    yv.fixedMax !== undefined
      ? { max: yv.fixedMax, step: 1, ticks: Array.from({ length: yv.fixedMax + 1 }, (_, i) => i) }
      : niceScale(Math.max(1, ...plotted.map((p) => p.y)));

  const xMax = xScale.max;
  const yMax = yScale.max;
  const xMedian = median(plotted.map((p) => p.x));
  const yMedian = median(plotted.map((p) => p.y));

  const sx = (v: number) => PAD.l + (v / xMax) * PW;
  const sy = (v: number) => PAD.t + PH - (v / yMax) * PH;

  const dots: Dot[] = plotted.map((p) => {
    const j = jitter(p.m.material_id);
    return {
      ...p,
      cx: sx(p.x) + j.dx,
      cy: sy(p.y) + j.dy,
      r: p.scored ? sizeRadius(p.sizeCount) : SIZE_MIN,
    };
  });


  const rankOf = (m: Material, id: AxisVarId) => {
    const v = axisVar(id);
    if (!v.measureId) return null;
    return rankTables[v.measureId]?.ranks[m.material_id] ?? null;
  };

  const rankSentence = (m: Material) => {
    const rx = rankOf(m, xId);
    const ry = rankOf(m, yId);
    if (rx === null || ry === null) return null;
    return `${rx}${ordinal(rx)} on ${xv.noun}, ${ry}${ordinal(ry)} on ${yv.noun}.`;
  };

  const unplottedTotal = noFigure.length + notScored.length;
  const statusesPresent = [...new Set(plotted.map((p) => p.m.journey_status))] as JourneyStatus[];
  const readings = quadrantReadings(xv, yv);

  /** Saved readings of the same scope. Each one is a set of materials, never a score. */
  const views = useMemo(() => {
    const ranked = rows.filter((r) => r.rank !== null);
    const cut = Math.ceil(ranked.length / 3);
    const stalled = ranked
      .filter((r) => (r.rank as number) <= cut && r.m.journey_status === "not_started" && !r.m.owner)
      .map((r) => r.m.material_id);
    const divergent = rows.filter((r) => r.gapMeasure !== null).map((r) => r.m.material_id);

    const byClass = new Map<string, typeof rows>();
    rows.forEach((r) => {
      const key = r.m.material_class ?? "Unclassified";
      byClass.set(key, [...(byClass.get(key) ?? []), r]);
    });
    const topClass = [...byClass.entries()]
      .filter(([, group]) => group.length >= 3)
      .map(([cls, group]) => ({
        cls,
        ids: group.map((r) => r.m.material_id),
        combined: group.reduce((sum, r) => sum + (measure.value(r.m) ?? 0), 0),
      }))
      .sort((a, b) => b.combined - a.combined)[0];

    const untouched = rows
      .filter((r) => r.m.last_change_batch_origin !== "real_transition")
      .map((r) => r.m.material_id);

    return [
      { id: "stalled", label: "Exposed, nobody working on it", ids: stalled },
      { id: "divergent", label: "Ranks differently by measure", ids: divergent },
      { id: "concentrated", label: "Concentrated by material class", ids: topClass?.ids ?? [] },
      { id: "untouched", label: "Never touched since load", ids: untouched },
    ].filter((v) => v.ids.length > 1);
  }, [rows, measure]);

  const activeIds = useMemo(
    () => new Set(views.find((v) => v.id === activeView)?.ids ?? []),
    [views, activeView],
  );


  const pickedMaterials = data.filter((m) => picked.has(m.material_id));

  const toSvg = (e: React.MouseEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const startLasso = (e: React.MouseEvent) => {
    const p = toSvg(e);
    setLasso({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };

  const moveLasso = (e: React.MouseEvent) => {
    if (!lasso) return;
    const p = toSvg(e);
    setLasso({ ...lasso, x1: p.x, y1: p.y });
  };

  const endLasso = () => {
    if (!lasso) return;
    const x0 = Math.min(lasso.x0, lasso.x1);
    const x1 = Math.max(lasso.x0, lasso.x1);
    const y0 = Math.min(lasso.y0, lasso.y1);
    const y1 = Math.max(lasso.y0, lasso.y1);
    if (x1 - x0 > 3 && y1 - y0 > 3) {
      const inside = dots.filter((d) => d.cx >= x0 && d.cx <= x1 && d.cy >= y0 && d.cy <= y1);
      setPicked((prev) => {
        const next = new Set(prev);
        inside.forEach((d) => next.add(d.m.material_id));
        return next;
      });
    }
    setLasso(null);
  };

  const xTicks = xScale.ticks;
  const yTicks = yScale.ticks;
  /** Thousands separators on every tick; decimals only when the step needs them. */
  const tickLabel = (v: number, step: number) => nf(step < 1 ? 2 : 0).format(v);


  return (
    <div className="w-full space-y-2">
      {/* Axis presets */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Presets</span>
        {AXIS_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={activePreset?.id === p.id}
            onClick={() => applyPreset(p.id)}
            title={p.reading}
            className={cn(
              "rounded-sm border px-2 py-0.5 text-[11px] font-medium transition-colors",
              activePreset?.id === p.id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
        {activePreset && (
          <span className="text-[10px] text-muted-foreground">— {activePreset.reading}</span>
        )}
      </div>

      {/* Axis controls */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <AxisSelect
          label="X"
          value={xId}
          options={AXIS_VARS.map((v) => ({ id: v.id, label: `${v.label} (${v.unit})` }))}
          onChange={(id) => pickX(id as AxisVarId)}
        />
        <AxisSelect
          label="Y"
          value={yId}
          options={AXIS_VARS.map((v) => ({ id: v.id, label: `${v.label} (${v.unit})` }))}
          onChange={(id) => setYId(id as AxisVarId)}
        />
        <AxisSelect
          label="Size"
          value={sizeId}
          options={[
            { id: "drivers", label: "Strong drivers (count)" },
            { id: "constraints", label: "Strong constraints (count)" },
          ]}
          onChange={(id) => setSizeId(id as SizeVarId)}
        />

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Priority set for
          </span>
          <Input
            value={priorityPeriod}
            onChange={(e) => setPriorityPeriod(e.target.value)}
            className="h-7 w-28 text-[11px]"
            aria-label="Priority period"
          />
          <span className="text-[11px] text-muted-foreground">
            <span className="font-mono tabular-nums">{prioritySetCount}</span> materials in {priorityPeriod} priority
            set
          </span>
        </div>

        <button
          type="button"
          aria-pressed={prioritySetOnly}
          onClick={() => setPrioritySetOnly((v) => !v)}
          className={cn(
            "rounded-sm border px-2 py-0.5 text-[11px] font-medium transition-colors",
            prioritySetOnly
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          Priority set only
        </button>

        <span className="text-[11px] text-muted-foreground">
          Showing <span className="font-mono tabular-nums">{rows.length}</span> of{" "}
          <span className="font-mono tabular-nums">{data.length}</span> materials
        </span>
      </div>

      <FilterChips />



      {/* Selection bar */}
      {picked.size > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-[11px]">
          <span className="font-medium text-foreground">
            <span className="font-mono tabular-nums">{picked.size}</span> selected
          </span>
          <button
            type="button"
            onClick={() => setDialog({ add: true })}
            className="rounded-sm border border-border bg-background px-2 py-0.5 font-medium hover:bg-muted"
          >
            Add to priority set
          </button>
          <button
            type="button"
            onClick={() => setDialog({ add: false })}
            className="rounded-sm border border-border bg-background px-2 py-0.5 font-medium hover:bg-muted"
          >
            Remove
          </button>
          <button
            type="button"
            onClick={() => setPicked(new Set())}
            className="text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            Clear selection
          </button>
        </div>
      )}

      {toast && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/50 px-2 py-1.5 text-[11px]">
          <span className="text-foreground">{toast.message}</span>
          <button
            type="button"
            onClick={undo}
            className="underline decoration-dotted underline-offset-2 hover:text-primary"
          >
            Undo
          </button>
          <button type="button" onClick={() => setToast(null)} className="text-muted-foreground hover:text-foreground">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 lg:flex-row">
        {/* Plot */}
        <div className="relative min-w-0 flex-1 rounded-md border border-border bg-card p-1">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full select-none"
            onMouseMove={moveLasso}
            onMouseUp={endLasso}
            onMouseLeave={() => {
              setLasso(null);
              setHover(null);
            }}
          >
            <rect
              x={PAD.l}
              y={PAD.t}
              width={PW}
              height={PH}
              fill="transparent"
              onMouseDown={startLasso}
              className="cursor-crosshair"
            />

            {/* frame */}
            <line x1={PAD.l} y1={PAD.t + PH} x2={PAD.l + PW} y2={PAD.t + PH} stroke="hsl(var(--border))" />
            <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + PH} stroke="hsl(var(--border))" />

            {/* y ticks */}
            {yTicks.map((t, i) => {
              const isCount = yv.fixedMax !== undefined;
              const labelled = !isCount || i % 2 === 0;
              return (
                <g key={i}>
                  <line
                    x1={PAD.l - 4}
                    y1={sy(t)}
                    x2={PAD.l + PW}
                    y2={sy(t)}
                    stroke="hsl(var(--border))"
                    strokeOpacity={labelled ? 0.5 : 0.2}
                  />
                  {labelled && (
                    <text
                      x={PAD.l - 8}
                      y={sy(t) + 3}
                      textAnchor="end"
                      className="fill-muted-foreground font-mono text-[9px] tabular-nums"
                    >
                      {tickLabel(t, yScale.step)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* x ticks */}
            {xTicks.map((t, i) => (
              <g key={i}>
                <line x1={sx(t)} y1={PAD.t + PH} x2={sx(t)} y2={PAD.t + PH + 4} stroke="hsl(var(--border))" />
                <text
                  x={sx(t)}
                  y={PAD.t + PH + 15}
                  textAnchor="middle"
                  className="fill-muted-foreground font-mono text-[9px] tabular-nums"
                >
                  {tickLabel(t, xScale.step)}
                </text>
              </g>
            ))}

            {/* median splits */}
            {xMedian !== null && (
              <line
                x1={sx(xMedian)}
                y1={PAD.t}
                x2={sx(xMedian)}
                y2={PAD.t + PH}
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity={0.35}
                strokeDasharray="3 3"
              />
            )}
            {yMedian !== null && (
              <line
                x1={PAD.l}
                y1={sy(yMedian)}
                x2={PAD.l + PW}
                y2={sy(yMedian)}
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity={0.35}
                strokeDasharray="3 3"
              />
            )}

            {/* quadrant readings — orientation only, kept out of the way of the dots */}
            <text x={PAD.l + PW - 4} y={PAD.t + 10} textAnchor="end" className="fill-muted-foreground/45 text-[9px]">
              {readings.topRight}
            </text>
            <text x={PAD.l + 4} y={PAD.t + 10} className="fill-muted-foreground/45 text-[9px]">
              {readings.topLeft}
            </text>
            <text
              x={PAD.l + PW - 4}
              y={PAD.t + PH - 4}
              textAnchor="end"
              className="fill-muted-foreground/45 text-[9px]"
            >
              {readings.bottomRight}
            </text>
            <text x={PAD.l + 4} y={PAD.t + PH - 4} className="fill-muted-foreground/45 text-[9px]">
              {readings.bottomLeft}
            </text>


            {/* axis titles */}
            <text
              x={PAD.l + PW / 2}
              y={H - 12}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-widest"
            >
              {xv.label} ({xv.unit}) — {xv.kind}
            </text>
            <text
              transform={`translate(14 ${PAD.t + PH / 2}) rotate(-90)`}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-widest"
            >
              {yv.label} ({yv.unit}) — {yv.kind}
            </text>

            {/* dots */}
            {dots.map((d) => {
              const isPicked = picked.has(d.m.material_id);
              const enter = (e: React.MouseEvent) => {
                const rect = svgRef.current!.getBoundingClientRect();
                setHover({ dot: d, left: (d.cx / W) * rect.width, top: (d.cy / H) * rect.height });
              };
              const click = (e: React.MouseEvent) => {
                if (e.shiftKey) {
                  setPicked((prev) => {
                    const next = new Set(prev);
                    next.has(d.m.material_id) ? next.delete(d.m.material_id) : next.add(d.m.material_id);
                    return next;
                  });
                  return;
                }
                openBrief(d.m.material_id);
              };
              const inView = activeView === null || activeIds.has(d.m.material_id);
              return (
                <g key={d.m.material_id} opacity={inView ? 1 : 0.16}>
                  {inPrioritySet(d.m) && (
                    <circle
                      cx={d.cx}
                      cy={d.cy}
                      r={d.r + 2.6}
                      fill="none"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity={0.55}
                      strokeWidth={1.2}
                    />
                  )}
                  {activeView !== null && inView && (
                    <circle
                      cx={d.cx}
                      cy={d.cy}
                      r={d.r + 4.4}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeOpacity={0.7}
                      strokeWidth={1.2}
                    />
                  )}
                  <circle
                    cx={d.cx}
                    cy={d.cy}
                    r={d.r}
                    className={cn(STATUS_DOT[d.m.journey_status], "cursor-pointer")}
                    fill={d.scored ? "currentColor" : "none"}
                    fillOpacity={d.scored ? 0.75 : 0}
                    stroke={isPicked ? "hsl(var(--primary))" : d.scored ? "hsl(var(--background))" : "currentColor"}
                    strokeWidth={isPicked ? 2 : d.scored ? 0.8 : 1.3}
                    strokeDasharray={d.scored ? undefined : "2 1.6"}
                    onMouseEnter={enter}
                    onMouseLeave={() => setHover(null)}
                    onClick={click}
                  />
                </g>

              );
            })}

            {lasso && (
              <rect
                x={Math.min(lasso.x0, lasso.x1)}
                y={Math.min(lasso.y0, lasso.y1)}
                width={Math.abs(lasso.x1 - lasso.x0)}
                height={Math.abs(lasso.y1 - lasso.y0)}
                fill="hsl(var(--primary))"
                fillOpacity={0.08}
                stroke="hsl(var(--primary))"
                strokeOpacity={0.5}
                strokeDasharray="3 3"
              />
            )}
          </svg>

          {hover && (
            <div
              className="pointer-events-none absolute z-20 w-60 rounded-md border border-border bg-popover p-2 text-[10px] shadow-md"
              style={{
                left: Math.min(hover.left + 12, 9999),
                top: Math.max(hover.top - 10, 0),
                transform: hover.left > 420 ? "translateX(-110%)" : undefined,
              }}
            >
              <p className="text-[11px] font-medium text-foreground">{hover.dot.m.name}</p>
              <p className="text-muted-foreground">{hover.dot.m.material_class ?? "Unclassified"}</p>
              <p className="mt-1 font-mono tabular-nums text-foreground">{xv.fmt(hover.dot.x)}</p>
              <p className="font-mono tabular-nums text-foreground">{yv.fmt(hover.dot.y)}</p>
              {rankSentence(hover.dot.m) && (
                <p className="mt-1 text-foreground">{rankSentence(hover.dot.m)}</p>
              )}
              <p className="mt-1 text-muted-foreground">
                {hover.dot.scored
                  ? `${hover.dot.sizeCount} ${sizeVar.noun}`
                  : "Not yet scored — no judgement to size by"}
              </p>
              <p className="text-muted-foreground">{JOURNEY_STATUS_LABEL[hover.dot.m.journey_status]}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-2 py-1.5">
            <StatusLegend statuses={statusesPresent} />
            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <svg width="26" height="12" viewBox="0 0 26 12" className="text-muted-foreground/70">
                <circle cx="5" cy="6" r="3.4" fill="currentColor" fillOpacity={0.75} />
                <circle cx="18" cy="6" r="5.5" fill="currentColor" fillOpacity={0.75} />
              </svg>
              Bubble size = {sizeVar.noun} (count, 0 to 12)
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <svg width="14" height="14" viewBox="0 0 14 14" className="text-muted-foreground/70">
                <circle cx="7" cy="7" r="3.4" fill="none" stroke="currentColor" strokeDasharray="2 1.6" />
              </svg>
              Hollow ring: not yet scored.
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <svg width="14" height="14" viewBox="0 0 14 14">
                <circle cx="7" cy="7" r="6" fill="none" stroke="hsl(var(--foreground))" strokeOpacity={0.55} />
                <circle cx="7" cy="7" r="3.2" fill="currentColor" fillOpacity={0.6} />
              </svg>
              Solid outer ring = in the {priorityPeriod} priority set
            </span>
            <span className="text-[10px] text-muted-foreground">
              Axes: measured figures. Bubble size: your team's judgement.
            </span>
            <span className="text-[10px] text-muted-foreground">
              Two axes, two units, one size encoding — never blended into a score.
            </span>
            <span className="text-[10px] text-muted-foreground">
              Shift-click or drag a box to select. Click a dot to open its brief.
            </span>
          </div>
        </div>

        {/* Not plotted */}
        <aside className="w-full shrink-0 space-y-2 rounded-md border border-border bg-card p-2.5 lg:w-72">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Not plotted</p>
            <p className="mt-1 text-[11px] text-foreground">
              <span className="font-mono tabular-nums">{unplottedTotal}</span> materials not plotted
            </p>
            <p className="text-[10px] text-muted-foreground">
              A missing figure on either axis cannot be a position. None of these sits at zero.
            </p>
          </div>

          {unplottedTotal === 0 ? (
            <p className="text-[11px] text-muted-foreground">Everything in scope has a figure on both axes.</p>
          ) : (
            <div className="space-y-2">
              {noFigure.length > 0 && (
                <Expandable
                  count={noFigure.length}
                  summary={
                    <>
                      <span className="font-mono tabular-nums">{noFigure.length}</span> missing {xv.noun} or {yv.noun}
                    </>
                  }
                >
                  {noFigure.map((m) => (
                    <BriefLink key={m.material_id} m={m} />
                  ))}
                </Expandable>
              )}
              {notScored.length > 0 && (
                <Expandable
                  count={notScored.length}
                  summary={
                    <>
                      <span className="font-mono tabular-nums">{notScored.length}</span> not yet scored
                    </>
                  }
                >
                  {notScored.map((m) => (
                    <BriefLink key={m.material_id} m={m} />
                  ))}
                </Expandable>
              )}
              <p className="text-[10px] text-muted-foreground">
                A figure or a judgement moves a material onto the plot. This is a task list, not an error.
              </p>
            </div>
          )}
        </aside>
      </div>

      <PriorityDialog
        open={dialog !== null}
        add={dialog?.add ?? true}
        period={priorityPeriod}
        materials={pickedMaterials}
        onCancel={() => setDialog(null)}
        onApply={() => {
          applyPriority(picked, dialog!.add);
          setDialog(null);
          setPicked(new Set());
        }}
      />
    </div>
  );
};

export default PrioritisationGrid;
