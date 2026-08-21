import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  JOURNEY_STATUS_LABEL,
  MATERIAL_ROLES,
  MATERIAL_ROLE_LABEL,
  type JourneyStatus,
  type Material,
  type MaterialRole,
} from "@/types/materialPrioritisation";
import { useRegister } from "@/components/materialRegister/registerStore";
import FilterChips from "@/components/materialRegister/FilterChips";
import FilterSelects from "@/components/materialRegister/FilterSelects";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import PriorityDialog from "@/components/materialRegister/PriorityDialog";
import { STATUS_DOT, StatusLegend, median, ordinal } from "@/components/materialRegister/gridPrimitives";
import UnplottedList, { type UnplottedEntry } from "@/components/materialRegister/UnplottedList";
import PlottedList from "@/components/materialRegister/PlottedList";
import {
  AXIS_PRESETS,
  DEFAULT_PRESET,
  DOT_R,
  AXIS_VARS,
  findAxisVar,
  judgementAxisVars,
  quadrantReadings,
  scaleFor,
  type AxisVar,
  type AxisVarId,
} from "@/components/materialRegister/gridAxes";
import { nf } from "@/components/materialRegister/primitives";
import { TEAM_LABEL } from "@/config/assessmentCriteria";

const W = 600;
const H = 300;
const PAD = { l: 72, r: 40, t: 20, b: 46 };
const PW = W - PAD.l - PAD.r;
const PH = H - PAD.t - PAD.b;

/** Deterministic jitter so overlapping dots stay individually clickable. */
const jitter = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 997;
  return { dx: ((h % 13) - 6) * 0.55, dy: (((h >> 2) % 13) - 6) * 0.55 };
};

/** Lowest and highest score recorded on a judged criterion. Never averaged. */
interface Span {
  low: number;
  high: number;
}

interface PlacedPoint {
  m: Material;
  x: number;
  y: number;
  /** Present only when contributors gave different scores on that axis. */
  xSpan: Span | null;
  ySpan: Span | null;
  contributorCount: number;
  assessed: boolean;
}

interface Dot extends PlacedPoint {
  cx: number;
  cy: number;
  r: number;
}

/** Axis picker. Measured lenses, plus the judged criteria as 1-5 axes. */
const AxisSelect: React.FC<{
  label: string;
  value: string;
  vars: AxisVar[];
  onChange: (id: string) => void;
}> = ({ label, value, vars, onChange }) => {
  const lenses = vars.filter((v) => v.group === "lens");
  const judgements = vars.filter((v) => v.group === "judgement");
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 max-w-56 rounded-sm border border-border bg-background px-1.5 text-[11px] text-foreground"
        aria-label={label}
      >
        <optgroup label="Company figures">
          {lenses.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label} ({v.unit})
            </option>
          ))}
        </optgroup>
        {judgements.length > 0 && (
          <optgroup label="Team judgement">
            {judgements.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} (1-5)
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </label>
  );
};

const Prioritisation: React.FC = () => {
  const {
    setMeasureId,
    filters,
    setFilters,
    ordered,
    data,
    rankTables,
    openBrief,
    assessmentSummary,
    priorityPeriod,
    setPriorityPeriod,
    prioritySetCount,
    inPrioritySet,
    applyPriority,
    toast,
    setToast,
    undo,
    scope,
    scopeLabel,
    criteria,
    entriesFor,
  } = useRegister();

  const judgedCriteria = useMemo(
    () => criteria.filter((c) => c.kind === "judgement"),
    [criteria],
  );

  /** Only recorded 1-5 entries count. Absence is never a position. */
  const scoresFor = React.useCallback(
    (materialId: string, criterionId: string) =>
      entriesFor(materialId, criterionId)
        .map((e) => e.score)
        .filter((v): v is number => v !== null),
    [entriesFor],
  );

  const axisVars = useMemo(
    () => [...AXIS_VARS, ...judgementAxisVars(judgedCriteria, scoresFor)],
    [judgedCriteria, scoresFor],
  );

  const [xId, setXId] = useState<AxisVarId>(DEFAULT_PRESET.x);
  const [yId, setYId] = useState<AxisVarId>(DEFAULT_PRESET.y);
  const [listSide, setListSide] = useState<"plotted" | "unplotted">("plotted");
  /** One role on the plot at a time — the two are never mixed on one grid. */
  const [roleView, setRoleView] = useState<MaterialRole>("existing");

  const xv = findAxisVar(axisVars, xId);
  const yv = findAxisVar(axisVars, yId);

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
  };

  const activePreset = AXIS_PRESETS.find((p) => p.x === xId && p.y === yId) ?? null;

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

  const rows = useMemo(() => {
    const byRole = ordered.filter((r) => r.m.role === roleView);
    return prioritySetOnly ? byRole.filter((r) => inPrioritySet(r.m)) : byRole;
  }, [ordered, prioritySetOnly, inPrioritySet, roleView]);

  /** Why a judged criterion cannot place a material. */
  const judgementGap = (m: Material, v: AxisVar): "no_entries" => {
    const all = entriesFor(m.material_id, v.criterionId!);
    return "no_entries";
  };

  const classified = useMemo(() => {
    const plotted: PlacedPoint[] = [];
    /** One entry per material, listing every axis it lacks a value for. */
    const entries: UnplottedEntry[] = [];

    const spanOf = (m: Material, v: AxisVar): Span | null => {
      const r = v.range?.(m);
      return r && r.high > r.low ? r : null;
    };

    rows.forEach(({ m }) => {
      const summary = assessmentSummary(m.material_id);
      const x = xv.value(m);
      const y = yv.value(m);
      if (x === null || y === null) {
        const gaps: AxisVar[] = [];
        const reasons: Record<string, "no_entries"> = {};
        if (x === null) {
          gaps.push(xv);
          if (xv.kind === "judgement") reasons[xv.id] = judgementGap(m, xv);
        }
        if (y === null) {
          gaps.push(yv);
          if (yv.kind === "judgement") reasons[yv.id] = judgementGap(m, yv);
        }
        entries.push({ m, gaps, sortValue: x === null ? y : x, reasons });
        return;
      }
      plotted.push({
        m,
        x,
        y,
        xSpan: spanOf(m, xv),
        ySpan: spanOf(m, yv),
        contributorCount: summary.contributors.length,
        assessed: summary.entryCount > 0,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, xv, yv, assessmentSummary, entriesFor]);

  const { plotted, entries, unplottedTotal } = classified;


  /** Fixed domains for judgement axes; round derived scales for measured ones. */
  const xScale = scaleFor(xv, plotted.map((p) => (p.xSpan ? p.xSpan.high : p.x)));
  const yScale = scaleFor(yv, plotted.map((p) => (p.ySpan ? p.ySpan.high : p.y)));

  const sx = (v: number) => PAD.l + ((v - xScale.min) / (xScale.max - xScale.min)) * PW;
  const sy = (v: number) => PAD.t + PH - ((v - yScale.min) / (yScale.max - yScale.min)) * PH;

  const xMedian = xv.domain ? null : median(plotted.map((p) => p.x));
  const yMedian = yv.domain ? null : median(plotted.map((p) => p.y));

  const dots: Dot[] = plotted.map((p) => {
    const j = jitter(p.m.material_id);
    return {
      ...p,
      cx: p.xSpan ? sx((p.xSpan.low + p.xSpan.high) / 2) : sx(p.x) + j.dx,
      cy: p.ySpan ? sy((p.ySpan.low + p.ySpan.high) / 2) : sy(p.y) + j.dy,
      r: DOT_R,
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

  const axisTitle = (v: AxisVar) =>
    v.kind === "judgement" ? `${v.label} (1-5)` : `${v.label} (${v.unit})`;

  const judgementAxes = [xv, yv].filter((v) => v.kind === "judgement");

  /** Entries behind a judged position, listed in the hover panel. Never summarised. */
  const judgementLines = (m: Material) =>
    judgementAxes.map((v) => ({
      axis: v,
      rows: entriesFor(m.material_id, v.criterionId!),
    }));

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

        <div className="inline-flex items-center gap-1 rounded-md bg-muted p-0.5">
          {MATERIAL_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleView(r)}
              aria-pressed={roleView === r}
              className={cn(
                "rounded-[4px] px-2.5 py-1 text-[11px] font-medium transition-colors",
                roleView === r
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {MATERIAL_ROLE_LABEL[r]}
            </button>
          ))}
        </div>

        <>
            <div className="flex flex-wrap items-center gap-1">
              {AXIS_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={p.reading}
                  onClick={() => applyPreset(p.id)}
                  className={cn(
                    "inline-flex h-7 items-center rounded-lg border px-2.5 text-[11px] font-medium transition-colors",
                    activePreset?.id === p.id
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

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
                  {activePreset ? "Custom set" : "Custom pairing"}
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="portfolio-type max-h-[70vh] w-72 overflow-y-auto p-2">
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Axes</div>
                  <AxisSelect label="X" value={xId} vars={axisVars} onChange={(id) => pickX(id)} />
                  <AxisSelect label="Y" value={yId} vars={axisVars} onChange={(id) => setYId(id)} />
                </div>

                <div className="mt-2 space-y-1.5 border-t border-border pt-2">
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
        </>
      </div>


      {/* Readout on its own row */}
      <div className="w-full text-right text-[11px] text-muted-foreground">
        {activePreset && (
          <span className="hidden sm:inline">{activePreset.reading}</span>
        )}
        {activePreset && <span className="hidden sm:inline text-border"> · </span>}
        <span className="hidden sm:inline">
            <span className="text-foreground">{xv.label}</span> against{" "}
            <span className="text-foreground">{yv.label}</span>
        </span>
        <span className="text-border"> · </span>
        <span>
          <span className="tabular-nums text-foreground">{prioritySetCount}</span> in priority set
        </span>
        <span className="text-border"> · </span>
        <span>
          <span className="tabular-nums text-foreground">{rows.length}</span>
          {rows.length !== data.length && (
            <>
              {" of "}
              <span className="tabular-nums">{data.length}</span>
            </>
          )}{" "}
          {scope ? `${scopeLabel} materials` : "materials"}
        </span>
      </div>

      <FilterChips />


      {/* Selection bar */}
      {picked.size > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-[11px]">
          <span className="font-medium text-foreground">
            <span className="tabular-nums">{picked.size}</span> selected
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

      <>
          {/* Plot + legend side by side */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_200px]">
            <div className="relative rounded-xl border border-border/70 bg-card p-1 shadow-sm">
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
                  const labelled = labelTick(t, yScale, false);
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
                          className="fill-muted-foreground text-[9px] tabular-nums"
                        >
                          {yv.domain && yv.domain.min < 0 && t > 0 ? `+${t}` : tickLabel(t, yScale.step)}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* x ticks */}
                {xScale.ticks.map((t, i) => {
                  const labelled = labelTick(t, xScale, false);
                  if (!labelled) return null;
                  return (
                    <g key={i}>
                      <line x1={sx(t)} y1={PAD.t + PH} x2={sx(t)} y2={PAD.t + PH + 4} stroke="hsl(var(--border))" />
                      <text
                        x={sx(t)}
                        y={PAD.t + PH + 15}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[9px] tabular-nums"
                      >
                        {xv.domain && xv.domain.min < 0 && t > 0 ? `+${t}` : tickLabel(t, xScale.step)}
                      </text>
                    </g>
                  );
                })}

                {/* zero line, drawn only when an axis domain crosses zero */}
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
                      0
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
                      0
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
                  className="fill-muted-foreground text-[8px] font-semibold uppercase tracking-wider"
                >
                  {axisTitle(xv)}
                </text>
                <text
                  transform={`translate(14 ${PAD.t + PH / 2}) rotate(-90)`}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[8px] font-semibold uppercase tracking-wider"
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
                      {d.xSpan && d.ySpan ? (
                        /* Both criteria diverge — a light rectangle over both ranges */
                        <rect
                          x={Math.min(sx(d.xSpan.low), sx(d.xSpan.high))}
                          y={Math.min(sy(d.ySpan.low), sy(d.ySpan.high))}
                          width={Math.abs(sx(d.xSpan.high) - sx(d.xSpan.low))}
                          height={Math.abs(sy(d.ySpan.high) - sy(d.ySpan.low))}
                          className={cn(STATUS_DOT[d.m.journey_status], "cursor-pointer")}
                          fill="currentColor"
                          fillOpacity={0.14}
                          stroke={isPicked ? "hsl(var(--primary))" : "currentColor"}
                          strokeOpacity={isPicked ? 1 : 0.6}
                          strokeWidth={isPicked ? 2 : 1}
                          onMouseEnter={enter}
                          onMouseLeave={() => setHover(null)}
                          onClick={click}
                        />
                      ) : d.xSpan || d.ySpan ? (
                        /* One criterion diverges — a capped segment across its range */
                        <g
                          className={cn(STATUS_DOT[d.m.journey_status], "cursor-pointer")}
                          onMouseEnter={enter}
                          onMouseLeave={() => setHover(null)}
                          onClick={click}
                        >
                          {d.xSpan ? (
                            <>
                              <line
                                x1={sx(d.xSpan.low)}
                                y1={d.cy}
                                x2={sx(d.xSpan.high)}
                                y2={d.cy}
                                stroke={isPicked ? "hsl(var(--primary))" : "currentColor"}
                                strokeWidth={isPicked ? 2.4 : 1.6}
                              />
                              {[d.xSpan.low, d.xSpan.high].map((v) => (
                                <line
                                  key={v}
                                  x1={sx(v)}
                                  y1={d.cy - 3.4}
                                  x2={sx(v)}
                                  y2={d.cy + 3.4}
                                  stroke={isPicked ? "hsl(var(--primary))" : "currentColor"}
                                  strokeWidth={isPicked ? 2.4 : 1.6}
                                />
                              ))}
                            </>
                          ) : (
                            <>
                              <line
                                x1={d.cx}
                                y1={sy(d.ySpan!.low)}
                                x2={d.cx}
                                y2={sy(d.ySpan!.high)}
                                stroke={isPicked ? "hsl(var(--primary))" : "currentColor"}
                                strokeWidth={isPicked ? 2.4 : 1.6}
                              />
                              {[d.ySpan!.low, d.ySpan!.high].map((v) => (
                                <line
                                  key={v}
                                  x1={d.cx - 3.4}
                                  y1={sy(v)}
                                  x2={d.cx + 3.4}
                                  y2={sy(v)}
                                  stroke={isPicked ? "hsl(var(--primary))" : "currentColor"}
                                  strokeWidth={isPicked ? 2.4 : 1.6}
                                />
                              ))}
                            </>
                          )}
                        </g>
                      ) : (
                        <circle
                          cx={d.cx}
                          cy={d.cy}
                          r={d.r}
                          className={cn(STATUS_DOT[d.m.journey_status], "cursor-pointer")}
                          fill={d.assessed ? "currentColor" : "none"}
                          fillOpacity={d.assessed ? 0.75 : 0}
                          stroke={isPicked ? "hsl(var(--primary))" : d.assessed ? "hsl(var(--background))" : "currentColor"}
                          strokeWidth={isPicked ? 2 : d.assessed ? 0.8 : 1.3}
                          strokeDasharray={d.assessed ? undefined : "2 1.6"}
                          onMouseEnter={enter}
                          onMouseLeave={() => setHover(null)}
                          onClick={click}
                        />
                      )}
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
                    transform: hover.left > W / 2 ? "translateX(-110%)" : undefined,
                  }}
                >
                  <p className="text-[11px] font-medium text-foreground">{hover.dot.m.name}</p>
                  <p className="text-muted-foreground">{hover.dot.m.material_class ?? "Unclassified"}</p>
                  <p className="mt-1 tabular-nums text-foreground">
                    {hover.dot.xSpan
                      ? `${hover.dot.xSpan.low}–${hover.dot.xSpan.high}`
                      : xv.fmt(hover.dot.x)}
                  </p>
                  <p className="tabular-nums text-foreground">
                    {hover.dot.ySpan
                      ? `${hover.dot.ySpan.low}–${hover.dot.ySpan.high}`
                      : yv.fmt(hover.dot.y)}
                  </p>
                  {judgementLines(hover.dot.m).map(({ axis, rows: lines }) => (
                    <div key={axis.id} className="mt-1.5 border-t border-border/60 pt-1.5">
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {axis.label}
                      </p>
                      {lines.map((e) => (
                        <p key={e.user_id} className="text-muted-foreground">
                          <span className="text-foreground">{TEAM_LABEL[e.team] ?? e.team}</span>{" "}
                          <span className="tabular-nums text-foreground">
                            {e.score}
                          </span>
                          {e.note ? ` · ${e.note}` : ""}
                        </p>
                      ))}
                    </div>
                  ))}
                  {rankSentence(hover.dot.m) && <p className="mt-1 text-foreground">{rankSentence(hover.dot.m)}</p>}
                  <p className="mt-1 text-muted-foreground">
                    {hover.dot.assessed
                      ? `${hover.dot.contributorCount} ${hover.dot.contributorCount === 1 ? "person has" : "people have"} assessed it`
                      : "Nobody has assessed it yet"}
                  </p>
                  <p className="text-muted-foreground">{JOURNEY_STATUS_LABEL[hover.dot.m.journey_status]}</p>
                </div>
              )}
            </div>

            {/* Legend panel */}
            <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Legend</div>
              <div className="space-y-2.5">
                <div className="text-[10px] font-medium text-foreground">Status colour</div>
                <StatusLegend statuses={statusesPresent} />
              </div>
              {judgementAxes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-medium text-foreground">Range</div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <svg width="26" height="12" viewBox="0 0 26 12" className="text-muted-foreground/70">
                      <line x1="4" y1="6" x2="22" y2="6" stroke="currentColor" strokeWidth="1.6" />
                      <line x1="4" y1="2.6" x2="4" y2="9.4" stroke="currentColor" strokeWidth="1.6" />
                      <line x1="22" y1="2.6" x2="22" y2="9.4" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                    Segment — teams gave different scores, the line spans their range
                  </span>
                </div>
              )}
              <div className="space-y-2">
                <div className="text-[10px] font-medium text-foreground">Not assessed</div>
                <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <svg width="14" height="14" viewBox="0 0 14 14" className="text-muted-foreground/70">
                    <circle cx="7" cy="7" r="3.4" fill="none" stroke="currentColor" strokeDasharray="2 1.6" />
                  </svg>
                  Hollow ring — nobody has assessed it
                </span>
              </div>
              <div className="mt-auto space-y-2">
                <div className="text-[10px] font-medium text-foreground">Interactions</div>
                <ul className="space-y-1 text-[10px] text-muted-foreground">
                  <li>• Click a dot to open its brief</li>
                  <li>• Shift-click to select</li>
                  <li>• Drag a box to select multiple</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
              {([
                { id: "plotted" as const, label: `Plotted (${plotted.length})` },
                { id: "unplotted" as const, label: `Not plotted (${entries.length})` },
              ]).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setListSide(t.id)}
                  className={`rounded-md px-3 py-1 text-[11px] font-medium transition-colors ${
                    listSide === t.id
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {listSide === "plotted" ? (
              <PlottedList
                entries={plotted.map((p) => ({ m: p.m, x: p.x, y: p.y }))}
                xv={xv}
                yv={yv}
                onOpen={(m) => openBrief(m.material_id)}
              />
            ) : (
              <UnplottedList entries={entries} totalMaterials={rows.length} onSaved={markPlotted} />
            )}
          </div>

      </>

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
