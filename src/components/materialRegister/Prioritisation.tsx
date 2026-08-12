import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { JOURNEY_STATUS_LABEL, type JourneyStatus, type Material } from "@/types/materialPrioritisation";
import { useRegister } from "@/components/materialRegister/registerStore";
import FilterChips from "@/components/materialRegister/FilterChips";
import FilterSelects from "@/components/materialRegister/FilterSelects";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import PriorityDialog from "@/components/materialRegister/PriorityDialog";
import { STATUS_DOT, StatusLegend, median, ordinal } from "@/components/materialRegister/gridPrimitives";
import UnplottedList, { type UnplottedEntry } from "@/components/materialRegister/UnplottedList";
import DriverListView from "@/components/materialRegister/DriverListView";
import {
  AXIS_PRESETS,
  DEFAULT_PRESET,
  SIZE_MIN,
  buildAxisVars,
  findAxisVar,
  quadrantReadings,
  scaleFor,
  sizeRadius,
  type AxisVar,
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

/** Axis picker with lenses and drivers kept in separate labelled sections. */
const AxisSelect: React.FC<{
  label: string;
  value: string;
  vars: AxisVar[];
  onChange: (id: string) => void;
}> = ({ label, value, vars, onChange }) => (
  <label className="flex items-center gap-1.5">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 max-w-56 rounded-sm border border-border bg-background px-1.5 text-[11px] text-foreground"
      aria-label={label}
    >
      <optgroup label="Lenses">
        {vars
          .filter((v) => v.group === "lens")
          .map((v) => (
            <option key={v.id} value={v.id}>
              {v.label} ({v.unit})
            </option>
          ))}
      </optgroup>
      <optgroup label="Drivers">
        {vars
          .filter((v) => v.group === "driver")
          .map((v) => (
            <option key={v.id} value={v.id}>
              {v.label} ({v.unit})
            </option>
          ))}
      </optgroup>
    </select>
  </label>
);

const Prioritisation: React.FC<{ onOpenScoring?: () => void }> = ({ onOpenScoring }) => {
  const {
    setMeasureId,
    filters,
    setFilters,
    ordered,
    data,
    rankTables,
    countsFor,
    scoreFor,
    openBrief,
    questions,
    priorityPeriod,
    setPriorityPeriod,
    prioritySetCount,
    inPrioritySet,
    applyPriority,
    toast,
    setToast,
    undo,
  } = useRegister();

  const axisVars = useMemo(() => buildAxisVars(questions), [questions]);

  const [xId, setXId] = useState<AxisVarId>(DEFAULT_PRESET.x);
  const [yId, setYId] = useState<AxisVarId>(DEFAULT_PRESET.y);
  const [sizeId, setSizeId] = useState<SizeVarId>(DEFAULT_PRESET.size);
  const [mode, setMode] = useState<"chart" | "list">("chart");

  const xv = findAxisVar(axisVars, xId);
  const yv = findAxisVar(axisVars, yId);
  const sizeVar = findAxisVar(axisVars, sizeId);

  /** The register's ranking measure follows the X axis so the readings stay coherent. */
  const pickX = (id: AxisVarId) => {
    setXId(id);
    const v = findAxisVar(axisVars, id);
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
  const [dialog, setDialog] = useState<{ add: boolean } | null>(null);
  const [hover, setHover] = useState<{ dot: Dot; left: number; top: number } | null>(null);
  const [lasso, setLasso] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [justPlotted, setJustPlotted] = useState<Set<string>>(new Set());
  const svgRef = useRef<SVGSVGElement>(null);

  /** A newly filled value lands on the plot with one short pop, then settles. */
  const markPlotted = (id: string) => {
    setJustPlotted((prev) => new Set(prev).add(id));
  };
  useEffect(() => {
    if (justPlotted.size === 0) return;
    const t = setTimeout(() => setJustPlotted(new Set()), 900);
    return () => clearTimeout(t);
  }, [justPlotted]);

  const rows = useMemo(
    () => (prioritySetOnly ? ordered.filter((r) => inPrioritySet(r.m)) : ordered),
    [ordered, prioritySetOnly, inPrioritySet],
  );

  const classified = useMemo(() => {
    const plotted: { m: Material; x: number; y: number; sizeCount: number | null; scored: boolean }[] = [];
    /** One entry per material, listing every axis it lacks a value for. */
    const entries: UnplottedEntry[] = [];

    rows.forEach(({ m }) => {
      const counts = countsFor(m.material_id);
      const ctx = { score: (qid: string) => scoreFor(m.material_id, qid)?.score ?? null };
      const x = xv.value(m, counts, ctx);
      const y = yv.value(m, counts, ctx);
      if (x === null || y === null) {
        const gaps: AxisVar[] = [];
        if (x === null) gaps.push(xv);
        if (y === null) gaps.push(yv);
        entries.push({ m, gaps, sortValue: x === null ? y : x });
        return;
      }
      plotted.push({
        m,
        x,
        y,
        sizeCount: counts.scored_count === null ? null : (sizeVar.value(m, counts, ctx) as number),
        scored: counts.scored_count !== null,
      });
    });

    /** Highest exposure on the axis it does have comes first; no value sinks. */
    entries.sort((a, b) => {
      if (a.sortValue === null && b.sortValue === null) return a.m.name.localeCompare(b.m.name);
      if (a.sortValue === null) return 1;
      if (b.sortValue === null) return -1;
      return b.sortValue - a.sortValue;
    });

    return { plotted, entries, unplottedTotal: entries.length };
  }, [rows, xv, yv, sizeVar, countsFor, scoreFor]);

  const { plotted, entries, unplottedTotal } = classified;


  /** Fixed domains for judgement axes; round derived scales for measured ones. */
  const xScale = scaleFor(xv, plotted.map((p) => p.x));
  const yScale = scaleFor(yv, plotted.map((p) => p.y));

  const sx = (v: number) => PAD.l + ((v - xScale.min) / (xScale.max - xScale.min)) * PW;
  const sy = (v: number) => PAD.t + PH - ((v - yScale.min) / (yScale.max - yScale.min)) * PH;

  const xMedian = xv.domain ? null : median(plotted.map((p) => p.x));
  const yMedian = yv.domain ? null : median(plotted.map((p) => p.y));

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
    const v = findAxisVar(axisVars, id);
    if (!v.measureId) return null;
    return rankTables[v.measureId]?.ranks[m.material_id] ?? null;
  };

  const rankSentence = (m: Material) => {
    const rx = rankOf(m, xId);
    const ry = rankOf(m, yId);
    if (rx === null || ry === null) return null;
    return `${rx}${ordinal(rx)} on ${xv.noun}, ${ry}${ordinal(ry)} on ${yv.noun}.`;
  };

  const statusesPresent = [...new Set(plotted.map((p) => p.m.journey_status))] as JourneyStatus[];
  const readings = quadrantReadings(xv, yv);

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

  /** Thousands separators on every tick; decimals only when the step needs them. */
  const tickLabel = (v: number, step: number) => nf(step < 1 ? 2 : 0).format(v);
  /** Judgement axes label the ends and the zero line, never every step. */
  const labelTick = (v: number, scale: typeof xScale, judgement: boolean) =>
    !judgement || v === 0 || v === scale.min || v === scale.max || v % 2 === 0;

  const axisTitle = (v: AxisVar) => `${v.label} (${v.unit}) — ${v.kind}`;

  return (
    <div className="w-full space-y-2">
      {/* Toolbar — one quiet row: search, filters, chart setup; view switch right-aligned */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <Input
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder="Search name, CAS, customer ID"
          className="h-7 w-60 rounded-lg bg-card text-[11px]"
        />
        <FilterSelects variant="popover" />

        {mode === "chart" && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors",
                  activePreset
                    ? "border-border bg-card text-muted-foreground hover:text-foreground"
                    : "border-primary/40 bg-primary/5 text-foreground",
                )}
              >
                <SlidersHorizontal className="h-3 w-3 opacity-70" />
                {activePreset ? activePreset.label : "Custom pairing"}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="max-h-[70vh] w-72 overflow-y-auto p-2">
              <div className="pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Presets</div>
              {AXIS_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  className={cn(
                    "block w-full rounded-sm px-1.5 py-1 text-left hover:bg-muted/60",
                    activePreset?.id === p.id && "bg-primary/5",
                  )}
                >
                  <span
                    className={cn(
                      "block text-[11px]",
                      activePreset?.id === p.id ? "font-medium text-primary" : "text-foreground",
                    )}
                  >
                    {p.label}
                  </span>
                  <span className="block text-[10px] leading-tight text-muted-foreground">{p.reading}</span>
                </button>
              ))}

              <div className="mt-2 space-y-1.5 border-t border-border pt-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Axes</div>
                <AxisSelect label="X" value={xId} vars={axisVars} onChange={(id) => pickX(id)} />
                <AxisSelect label="Y" value={yId} vars={axisVars} onChange={(id) => setYId(id)} />
                <label className="flex items-center gap-1.5">
                  <span className="w-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    ●
                  </span>
                  <select
                    value={sizeId}
                    onChange={(e) => setSizeId(e.target.value as SizeVarId)}
                    className="h-7 w-full rounded-sm border border-border bg-background px-1.5 text-[11px] text-foreground"
                    aria-label="Size"
                  >
                    <option value="drivers">Strong drivers (count)</option>
                    <option value="constraints">Strong constraints (count)</option>
                  </select>
                </label>
              </div>

              <div className="mt-2 space-y-1.5 border-t border-border pt-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Priority set</div>
                <Input
                  value={priorityPeriod}
                  onChange={(e) => setPriorityPeriod(e.target.value)}
                  className="h-7 text-[11px]"
                  aria-label="Priority period"
                  placeholder="H2 2026"
                />
                <label className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 hover:bg-muted/60">
                  <Checkbox
                    checked={prioritySetOnly}
                    onCheckedChange={(v) => setPrioritySetOnly(v === true)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-[11px] text-foreground">Priority set only</span>
                </label>
              </div>
            </PopoverContent>
          </Popover>
        )}

        <div className="ml-auto flex items-center gap-1 rounded-lg bg-muted p-1">
          {(["chart", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={mode === v}
              onClick={() => setMode(v)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
                mode === v ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>


      {/* Readout on its own row */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span>
          <span className="font-mono tabular-nums text-foreground">{rows.length}</span>
          {rows.length !== data.length && (
            <>
              {" of "}
              <span className="font-mono tabular-nums">{data.length}</span>
            </>
          )}{" "}
          materials
        </span>
        {mode === "chart" && (
          <>
            <span className="text-border">·</span>
            <span>
              <span className="text-foreground">{xv.label}</span> against{" "}
              <span className="text-foreground">{yv.label}</span>, sized by {sizeVar.label.toLowerCase()}
            </span>
          </>
        )}
        <span className="text-border">·</span>
        <span>
          <span className="font-mono tabular-nums text-foreground">{prioritySetCount}</span> in {priorityPeriod} priority
          set
        </span>
        {activePreset && (
          <>
            <span className="text-border">·</span>
            <span>{activePreset.reading}</span>
          </>
        )}
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

      {mode === "list" ? (
        <DriverListView
          materials={rows.map((r) => r.m)}
          onOpenScoring={() => onOpenScoring?.()}
        />
      ) : (
        <>
          {/* Plot */}
          <div className="relative w-full rounded-md border border-border bg-card p-1">
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
              {yScale.ticks.map((t, i) => {
                const labelled = labelTick(t, yScale, yv.kind === "judgement");
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
                        {yv.domain && yv.domain.min < 0 && t > 0 ? `+${t}` : tickLabel(t, yScale.step)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* x ticks */}
              {xScale.ticks.map((t, i) => {
                const labelled = labelTick(t, xScale, xv.kind === "judgement");
                if (!labelled) return null;
                return (
                  <g key={i}>
                    <line x1={sx(t)} y1={PAD.t + PH} x2={sx(t)} y2={PAD.t + PH + 4} stroke="hsl(var(--border))" />
                    <text
                      x={sx(t)}
                      y={PAD.t + PH + 15}
                      textAnchor="middle"
                      className="fill-muted-foreground font-mono text-[9px] tabular-nums"
                    >
                      {xv.domain && xv.domain.min < 0 && t > 0 ? `+${t}` : tickLabel(t, xScale.step)}
                    </text>
                  </g>
                );
              })}

              {/* zero line on a driver axis — a recorded neutral judgement is a position */}
              {yv.domain && yv.domain.min < 0 && (
                <g>
                  <line
                    x1={PAD.l}
                    y1={sy(0)}
                    x2={PAD.l + PW}
                    y2={sy(0)}
                    stroke="hsl(var(--foreground))"
                    strokeOpacity={0.35}
                  />
                  <text x={PAD.l + PW - 2} y={sy(0) - 4} textAnchor="end" className="fill-muted-foreground text-[9px]">
                    0 — neutral judgement
                  </text>
                </g>
              )}
              {xv.domain && xv.domain.min < 0 && (
                <g>
                  <line
                    x1={sx(0)}
                    y1={PAD.t}
                    x2={sx(0)}
                    y2={PAD.t + PH}
                    stroke="hsl(var(--foreground))"
                    strokeOpacity={0.35}
                  />
                  <text
                    x={sx(0) + 3}
                    y={PAD.t + 9}
                    className="fill-muted-foreground text-[9px]"
                  >
                    0 — neutral judgement
                  </text>
                </g>
              )}

              {/* median splits on measured axes only */}
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

              {/* corner readings — orientation only, kept out of the way of the dots */}
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
                {axisTitle(xv)}
              </text>
              <text
                transform={`translate(14 ${PAD.t + PH / 2}) rotate(-90)`}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-widest"
              >
                {axisTitle(yv)}
              </text>

              {/* dots */}
              {dots.map((d) => {
                const isPicked = picked.has(d.m.material_id);
                const enter = () => {
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
                return (
                  <g
                    key={d.m.material_id}
                    className={cn(justPlotted.has(d.m.material_id) && "animate-value-pop")}
                    style={{ transformOrigin: `${d.cx}px ${d.cy}px` }}
                  >
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
                {rankSentence(hover.dot.m) && <p className="mt-1 text-foreground">{rankSentence(hover.dot.m)}</p>}
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
                Hollow ring: nothing scored, so no size
              </span>
              <span className="text-[10px] text-muted-foreground">
                Shift-click or drag a box to select. Click a dot to open its brief.
              </span>
            </div>
          </div>

          <UnplottedList entries={entries} totalMaterials={rows.length} onSaved={markPlotted} />
        </>
      )}

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

export default Prioritisation;
