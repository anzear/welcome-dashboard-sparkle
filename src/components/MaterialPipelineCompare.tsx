import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  DRIVER_KEYS,
  DRIVER_LABELS,
  JOURNEY_STATUS_META,
  type DriverKey,
  type MaterialRow,
} from "@/lib/materialPipelineData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Measure = {
  key: string;
  label: string;
  unit: string;
  group: "Lenses" | "Drivers";
  get: (r: MaterialRow) => number | null;
};

const MEASURES: Measure[] = [
  { key: "spend", label: "Spend", unit: "€/yr", group: "Lenses", get: (r) => r.annualSpend },
  { key: "ghg", label: "GHG", unit: "tCO₂e/yr", group: "Lenses", get: (r) => r.ghgContribution },
  { key: "volume", label: "Volume", unit: "t/yr", group: "Lenses", get: (r) => r.annualVolume },
  { key: "apps", label: "Applications fit", unit: "count", group: "Lenses", get: (r) => r.applicationCount },
  ...DRIVER_KEYS.map((k: DriverKey) => ({
    key: `driver:${k}`,
    label: DRIVER_LABELS[k],
    unit: "0–5",
    group: "Drivers" as const,
    get: (r: MaterialRow) => r.drivers?.[k] ?? null,
  })),
];

const byKey = (k: string) => MEASURES.find((m) => m.key === k) || MEASURES[0];

const fmt = (v: number) =>
  v >= 1000 ? v.toLocaleString("en-US", { maximumFractionDigits: 0 }) : v.toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function MaterialPipelineCompare({ rows }: { rows: MaterialRow[] }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);
  const [xKey, setXKey] = useState("spend");
  const [yKey, setYKey] = useState("driver:supplySecurity");

  const xM = byKey(xKey);
  const yM = byKey(yKey);

  const W = 960;
  const H = 460;
  const padLeft = 90;
  const padRight = 40;
  const padTop = 30;
  const padBottom = 66;
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;

  // Only materials ranked on BOTH selected measures are plotted.
  const points = useMemo(() => {
    const withVals = rows
      .map((r) => ({ row: r, x: xM.get(r), y: yM.get(r) }))
      .filter((p): p is { row: MaterialRow; x: number; y: number } => p.x != null && p.y != null);

    const xs = withVals.map((p) => p.x);
    const ys = withVals.map((p) => p.y);
    const xMin = xs.length ? Math.min(...xs) : 0;
    const xMaxRaw = xs.length ? Math.max(...xs) : 1;
    const yMin = ys.length ? Math.min(...ys) : 0;
    const yMaxRaw = ys.length ? Math.max(...ys) : 1;
    const xMax = xMaxRaw === xMin ? xMin + 1 : xMaxRaw;
    const yMax = yMaxRaw === yMin ? yMin + 1 : yMaxRaw;

    return {
      xMin,
      xMax,
      yMin,
      yMax,
      items: withVals.map((p) => ({
        ...p,
        cx: padLeft + ((p.x - xMin) / (xMax - xMin)) * plotW,
        cy: padTop + plotH - ((p.y - yMin) / (yMax - yMin)) * plotH,
      })),
    };
  }, [rows, xM, yM]);

  const unranked = rows.length - points.items.length;

  return (
    <div className="p-4 space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <AxisPicker label="Horizontal axis" value={xKey} onChange={setXKey} />
        <AxisPicker label="Vertical axis" value={yKey} onChange={setYKey} />
        <div className="text-[11px] text-muted-foreground pb-1.5">
          plotting {points.items.length} of {rows.length}
          {unranked > 0 && <> · {unranked} without a figure on both measures</>}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Each material is plotted against the two chosen measures, each scaled independently on its own units.
        Materials missing a value for either measure are not plotted — missing is never read as zero.
      </p>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[860px]"
          role="img"
          aria-label={`Scatter plot of materials by ${xM.label} and ${yM.label}`}
        >
          {/* axes */}
          <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + plotH} className="stroke-border" strokeWidth={1} />
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={padLeft + plotW}
            y2={padTop + plotH}
            className="stroke-border"
            strokeWidth={1}
          />
          {/* midlines */}
          <line
            x1={padLeft + plotW / 2}
            y1={padTop}
            x2={padLeft + plotW / 2}
            y2={padTop + plotH}
            className="stroke-border"
            strokeDasharray="3 4"
            strokeWidth={1}
            opacity={0.5}
          />
          <line
            x1={padLeft}
            y1={padTop + plotH / 2}
            x2={padLeft + plotW}
            y2={padTop + plotH / 2}
            className="stroke-border"
            strokeDasharray="3 4"
            strokeWidth={1}
            opacity={0.5}
          />

          {/* axis labels */}
          <text
            x={padLeft + plotW / 2}
            y={padTop + plotH + 44}
            textAnchor="middle"
            className="fill-foreground text-[10px] uppercase tracking-widest font-semibold"
          >
            {xM.label} ({xM.unit})
          </text>
          <text
            x={-(padTop + plotH / 2)}
            y={20}
            transform="rotate(-90)"
            textAnchor="middle"
            className="fill-foreground text-[10px] uppercase tracking-widest font-semibold"
          >
            {yM.label} ({yM.unit})
          </text>

          {/* ticks */}
          <text x={padLeft} y={padTop + plotH + 16} textAnchor="middle" className="fill-muted-foreground text-[9px]">
            {fmt(points.xMin)}
          </text>
          <text x={padLeft + plotW} y={padTop + plotH + 16} textAnchor="middle" className="fill-muted-foreground text-[9px]">
            {fmt(points.xMax)}
          </text>
          <text x={padLeft - 8} y={padTop + plotH} textAnchor="end" className="fill-muted-foreground text-[9px]">
            {fmt(points.yMin)}
          </text>
          <text x={padLeft - 8} y={padTop + 8} textAnchor="end" className="fill-muted-foreground text-[9px]">
            {fmt(points.yMax)}
          </text>

          {points.items.map((p) => {
            const active = hovered === p.row.id;
            return (
              <g
                key={p.row.id}
                onMouseEnter={() => setHovered(p.row.id)}
                onMouseLeave={() => setHovered((h) => (h === p.row.id ? null : h))}
                onClick={() => navigate(p.row.href)}
                className="cursor-pointer"
              >
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={active ? 7 : 5}
                  className={cn("fill-foreground transition-opacity", active ? "opacity-100" : hovered ? "opacity-20" : "opacity-60")}
                />
                {active && (
                  <text x={p.cx + 10} y={p.cy - 8} className="fill-foreground text-[11px] font-semibold">
                    {p.row.name} · {fmt(p.x)} / {fmt(p.y)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend / row list so points are identifiable without hovering */}
      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border">
        {rows.map((r) => {
          const status = JOURNEY_STATUS_META[r.journeyStatus] || JOURNEY_STATUS_META.not_started;
          const plotted = xM.get(r) != null && yM.get(r) != null;
          return (
            <button
              key={r.id}
              onMouseEnter={() => setHovered(r.id)}
              onMouseLeave={() => setHovered((h) => (h === r.id ? null : h))}
              onClick={() => navigate(r.href)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] transition-colors",
                hovered === r.id ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted",
                !plotted && hovered !== r.id && "opacity-50"
              )}
            >
              <span className="font-medium">{r.name}</span>
              <span className={cn("rounded-full border px-1.5 py-px", hovered === r.id ? "border-background/40" : status.chip)}>
                {status.label}
              </span>
              {!plotted && <span className="opacity-70">not ranked</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AxisPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-56 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">Lenses</div>
          {MEASURES.filter((m) => m.group === "Lenses").map((m) => (
            <SelectItem key={m.key} value={m.key} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
          <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">Drivers</div>
          {MEASURES.filter((m) => m.group === "Drivers").map((m) => (
            <SelectItem key={m.key} value={m.key} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
