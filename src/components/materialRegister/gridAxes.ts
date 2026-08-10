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

/** Quadrant readings, stated as what the pairing means rather than as a verdict. */
export const quadrantReadings = (x: AxisVar, y: AxisVar) => {
  const both = x.id === "spend" && y.id === "emissions";
  return {
    topRight: `high ${x.noun}, high ${y.noun}${both ? " — both cases hold" : ""}`,
    topLeft: `low ${x.noun}, high ${y.noun}${both ? " — the sustainability case alone" : ""}`,
    bottomRight: `high ${x.noun}, low ${y.noun}${both ? " — the procurement case alone" : ""}`,
    bottomLeft: `low on both`,
  };
};
