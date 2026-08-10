import type { Material } from "@/types/materialPrioritisation";
import type { DriverCounts } from "@/types/materialPrioritisation";
import { nf } from "@/components/materialRegister/primitives";
import type { MeasureId } from "@/components/materialRegister/registerStore";

export type AxisVarId =
  | "spend"
  | "emissions"
  | "volume"
  | "price"
  | "applications"
  | "drivers"
  | "constraints";

export type SizeVarId = "drivers" | "constraints";

export interface AxisVar {
  id: AxisVarId;
  /** Control label. */
  label: string;
  /** Lower-case noun used in quadrant readings and sentences. */
  noun: string;
  unit: string;
  /** Measured figure or a count of judgements. Never mixed into one number. */
  kind: "measured" | "judgement";
  /** Present only for variables the register already ranks. */
  measureId?: MeasureId;
  /** Fixed upper bound for count axes. */
  fixedMax?: number;
  value: (m: Material, counts: DriverCounts) => number | null;
  fmt: (v: number) => string;
}

const eur = (v: number) => `EUR ${nf(0).format(v)}`;

export const AXIS_VARS: AxisVar[] = [
  {
    id: "spend",
    label: "Annual spend",
    noun: "spend",
    unit: "EUR/yr",
    kind: "measured",
    measureId: "spend",
    value: (m) => m.annual_spend,
    fmt: (v) => `${eur(v)}/yr`,
  },
  {
    id: "emissions",
    label: "GHG contribution",
    noun: "emissions",
    unit: "tCO2e/yr",
    kind: "measured",
    measureId: "emissions",
    value: (m) => m.ghg_contribution,
    fmt: (v) => `${nf(0).format(v)} tCO2e/yr`,
  },
  {
    id: "volume",
    label: "Annual volume",
    noun: "volume",
    unit: "t/yr",
    kind: "measured",
    measureId: "volume",
    value: (m) => m.annual_volume,
    fmt: (v) => `${nf(0).format(v)} t/yr`,
  },
  {
    id: "price",
    label: "Unit price",
    noun: "unit price",
    unit: "EUR/kg",
    kind: "measured",
    value: (m) => m.unit_price,
    fmt: (v) => `EUR ${nf(2).format(v)}/kg`,
  },
  {
    id: "applications",
    label: "Applications",
    noun: "applications",
    unit: "count",
    kind: "measured",
    measureId: "applications",
    value: (m) => (m.application_categories && m.application_categories.length > 0 ? m.application_categories.length : null),
    fmt: (v) => `${nf(0).format(v)} applications`,
  },
  {
    id: "drivers",
    label: "Strong drivers",
    noun: "strong drivers",
    unit: "count",
    kind: "judgement",
    fixedMax: 12,
    value: (_m, c) => (c.scored_count === null ? null : (c.strong_drivers as number)),
    fmt: (v) => `${v} strong drivers`,
  },
  {
    id: "constraints",
    label: "Strong constraints",
    noun: "strong constraints",
    unit: "count",
    kind: "judgement",
    fixedMax: 12,
    value: (_m, c) => (c.scored_count === null ? null : (c.strong_constraints as number)),
    fmt: (v) => `${v} strong constraints`,
  },
];

export const axisVar = (id: AxisVarId) => AXIS_VARS.find((v) => v.id === id)!;

export interface AxisPreset {
  id: string;
  label: string;
  reading: string;
  x: AxisVarId;
  y: AxisVarId;
  size: SizeVarId;
}

/** One click sets both axes and the size encoding. Any axis stays free to change afterwards. */
export const AXIS_PRESETS: AxisPreset[] = [
  {
    id: "spend-emissions",
    label: "Spend × Emissions",
    reading: "where the two cases disagree",
    x: "spend",
    y: "emissions",
    size: "drivers",
  },
  {
    id: "spend-drivers",
    label: "Spend × Strong drivers",
    reading: "exposure against the case for acting",
    x: "spend",
    y: "drivers",
    size: "constraints",
  },
  {
    id: "volume-price",
    label: "Volume × Unit price",
    reading: "where the money actually comes from",
    x: "volume",
    y: "price",
    size: "drivers",
  },
  {
    id: "emissions-constraints",
    label: "Emissions × Strong constraints",
    reading: "high impact, hard to move",
    x: "emissions",
    y: "constraints",
    size: "drivers",
  },
];

export const DEFAULT_PRESET = AXIS_PRESETS[0];

/** Bubble radius from a 0..12 count, with a floor so a zero-count material stays visible. */
export const SIZE_MIN = 3.4;
export const SIZE_MAX = 11;
export const sizeRadius = (count: number | null) =>
  count === null ? SIZE_MIN : SIZE_MIN + (Math.min(Math.max(count, 0), 12) / 12) * (SIZE_MAX - SIZE_MIN);

/** Two- or three-word corner readings. Orientation, not a verdict. */
export const quadrantReadings = (x: AxisVar, y: AxisVar) => ({
  topRight: "both high",
  topLeft: `${y.noun} only`,
  bottomRight: `${x.noun} only`,
  bottomLeft: "low on both",
});

/** Round tick step from the 1 / 2 / 2.5 / 5 x 10^n series. */
export const niceStep = (range: number, count = 4) => {
  const raw = Math.max(range, Number.EPSILON) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const mult = [1, 2, 2.5, 5, 10].reduce((best, m) =>
    Math.abs(norm - m) < Math.abs(norm - best) ? m : best,
  );
  return mult * mag;
};

/** Axis scale that ends on a round maximum, with round intermediate ticks. */
export const niceScale = (dataMax: number, count = 4) => {
  const step = niceStep(dataMax, count);
  const max = Math.ceil(dataMax / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= max + step / 2; t += step) ticks.push(Number(t.toFixed(10)));
  return { max, step, ticks };
};

