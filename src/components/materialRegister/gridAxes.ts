import type { DriverCounts, Material } from "@/types/materialPrioritisation";
import { nf } from "@/components/materialRegister/primitives";
import type { MeasureId } from "@/components/materialRegister/registerStore";
import type { DriverQuestion } from "@/config/driverQuestions";

/** Lens ids are fixed; a driver axis is "q:<question_id>". */
export type AxisVarId = string;
export const DRIVER_AXIS_PREFIX = "q:";
export const driverAxisId = (questionId: string) => `${DRIVER_AXIS_PREFIX}${questionId}`;

export type SizeVarId = "drivers";

/** Read access to the team's judgements, for axes that read a single question. */
export interface AxisCtx {
  score: (questionId: string) => number | null;
}

export interface AxisVar {
  id: AxisVarId;
  /** Control label. */
  label: string;
  /** Lower-case noun used in corner readings and sentences. */
  noun: string;
  unit: string;
  /** Measured figure or a judgement. Never mixed into one number. */
  kind: "measured" | "judgement";
  /** Which selector section the variable belongs to. */
  group: "lens" | "driver";
  /** Present only for variables the register already ranks. */
  measureId?: MeasureId;
  /** Fixed axis domain. Absent for open-ended measured figures. */
  domain?: { min: number; max: number };
  /** Set when the axis reads one driver question. */
  questionId?: string;
  /** Numeric field behind a measured lens, so a gap can be filled inline. */
  field?: keyof Material;
  value: (m: Material, counts: DriverCounts, ctx: AxisCtx) => number | null;
  fmt: (v: number) => string;
}

const eur = (v: number) => `EUR ${nf(0).format(v)}`;
const listLen = (v: string[] | null | undefined) => (v && v.length > 0 ? v.length : null);

/** Measured lenses. Each one is a figure the register already holds. */
export const LENS_VARS: AxisVar[] = [
  {
    id: "spend",
    label: "Annual spend",
    noun: "spend",
    unit: "EUR/yr",
    kind: "measured",
    group: "lens",
    measureId: "spend",
    field: "annual_spend",
    value: (m) => m.annual_spend,
    fmt: (v) => `${eur(v)}/yr`,
  },
  {
    id: "emissions",
    label: "GHG contribution",
    noun: "emissions",
    unit: "tCO2e/yr",
    kind: "measured",
    group: "lens",
    measureId: "emissions",
    field: "ghg_contribution",
    value: (m) => m.ghg_contribution,
    fmt: (v) => `${nf(0).format(v)} tCO2e/yr`,
  },
  {
    id: "volume",
    label: "Annual volume",
    noun: "volume",
    unit: "t/yr",
    kind: "measured",
    group: "lens",
    measureId: "volume",
    field: "annual_volume",
    value: (m) => m.annual_volume,
    fmt: (v) => `${nf(0).format(v)} t/yr`,
  },
  {
    id: "price",
    label: "Unit price",
    noun: "unit price",
    unit: "EUR/kg",
    kind: "measured",
    group: "lens",
    field: "unit_price",
    value: (m) => m.unit_price,
    fmt: (v) => `EUR ${nf(2).format(v)}/kg`,
  },
  {
    id: "ghg_factor",
    label: "GHG factor",
    noun: "GHG factor",
    unit: "kgCO2e/kg",
    kind: "measured",
    group: "lens",
    field: "ghg_emission_factor",
    value: (m) => m.ghg_emission_factor,
    fmt: (v) => `${nf(2).format(v)} kgCO2e/kg`,
  },
  {
    id: "applications",
    label: "Applications",
    noun: "applications",
    unit: "count",
    kind: "measured",
    group: "lens",
    measureId: "applications",
    value: (m) => listLen(m.application_categories),
    fmt: (v) => `${nf(0).format(v)} applications`,
  },
  {
    id: "products",
    label: "Products",
    noun: "products",
    unit: "count",
    kind: "measured",
    group: "lens",
    value: (m) => listLen(m.product_categories),
    fmt: (v) => `${nf(0).format(v)} products`,
  },
];

/** Counts of judgements. Counts only — never a blended index. */
export const COUNT_VARS: AxisVar[] = [
  {
    id: "drivers",
    label: "Strong drivers",
    noun: "strong drivers",
    unit: "count",
    kind: "judgement",
    group: "driver",
    domain: { min: 0, max: 12 },
    value: (_m, c) => (c.scored_count === null ? null : (c.strong_drivers as number)),
    fmt: (v) => `${v} strong drivers`,
  },
];

/** One driver question as an axis: its recorded score, 1 to 5. Unscored is no position. */
export const driverAxis = (q: DriverQuestion): AxisVar => ({
  id: driverAxisId(q.question_id),
  label: q.label,
  noun: q.label.toLowerCase(),
  unit: "1..5",
  kind: "judgement",
  group: "driver",
  domain: { min: 1, max: 5 },
  questionId: q.question_id,
  value: (_m, _c, ctx) => ctx.score(q.question_id),
  fmt: (v) => `${q.label} ${v}`,
});

/** Full selector list: lenses first, then every driver question, then the counts. */
export const buildAxisVars = (questions: DriverQuestion[]): AxisVar[] => [
  ...LENS_VARS,
  ...questions.map(driverAxis),
  ...COUNT_VARS,
];

export const findAxisVar = (vars: AxisVar[], id: AxisVarId): AxisVar =>
  vars.find((v) => v.id === id) ?? vars[0];

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
    reading: "spend against emissions impact",
    x: "spend",
    y: "emissions",
    size: "drivers",
  },
  {
    id: "spend-cost",
    label: "Spend × Cost",
    reading: "exposure against the cost barrier",
    x: "spend",
    y: driverAxisId("cost"),
    size: "drivers",
  },
  {
    id: "emissions-regulatory",
    label: "Emissions × Regulatory",
    reading: "impact against regulatory push",
    x: "emissions",
    y: driverAxisId("regulatory_position"),
    size: "drivers",
  },
  {
    id: "spend-readiness",
    label: "Spend × Internal readiness",
    reading: "exposure against capacity to act",
    x: "spend",
    y: driverAxisId("internal_readiness"),
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

export interface AxisScale {
  min: number;
  max: number;
  step: number;
  ticks: number[];
}

/** Fixed domain when the variable has one, otherwise a round scale over the data. */
export const scaleFor = (v: AxisVar, values: number[]): AxisScale => {
  if (v.domain) {
    const { min, max } = v.domain;
    const ticks: number[] = [];
    for (let t = min; t <= max; t += 1) ticks.push(t);
    return { min, max, step: 1, ticks };
  }
  const s = niceScale(Math.max(1, ...values));
  return { min: 0, max: s.max, step: s.step, ticks: s.ticks };
};
