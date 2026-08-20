import type { Material } from "@/types/materialPrioritisation";
import { nf } from "@/components/materialRegister/primitives";
import type { MeasureId } from "@/components/materialRegister/registerStore";

/** Axis ids are the fixed lens ids. Judgements are never used as an axis. */
export type AxisVarId = string;

export interface AxisVar {
  id: AxisVarId;
  /** Control label. */
  label: string;
  /** Lower-case noun used in corner readings and sentences. */
  noun: string;
  unit: string;
  /** A measured figure, or a judged criterion plotted as a 1-5 range. */
  kind: "measured" | "judgement";
  group: "lens" | "judgement";
  /** Set on judgement axes. The criterion the entries belong to. */
  criterionId?: string;
  /** Present only for variables the register already ranks. */
  measureId?: MeasureId;
  /** Fixed axis domain. Absent for open-ended measured figures. */
  domain?: { min: number; max: number };
  /** Numeric field behind a measured lens, so a gap can be filled inline. */
  field?: keyof Material;
  value: (m: Material) => number | null;
  /** Judgement axes only: the lowest and highest score recorded, never an average. */
  range?: (m: Material) => { low: number; high: number } | null;
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
    value: (m: Material) => m.annual_spend,
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
    value: (m: Material) => m.ghg_contribution,
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
    value: (m: Material) => m.annual_volume,
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
    value: (m: Material) => m.unit_price,
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
    value: (m: Material) => m.ghg_emission_factor,
    fmt: (v) => `${nf(2).format(v)} kgCO2e/kg`,
  },
  {
    id: "applications",
    label: "Product categories",
    noun: "product categories",
    unit: "count",
    kind: "measured",
    group: "lens",
    measureId: "applications",
    value: (m: Material) => listLen(m.application_categories),
    fmt: (v) => `${nf(0).format(v)} product categories`,
  },
  {
    id: "products",
    label: "Applications",
    noun: "applications",
    unit: "count",
    kind: "measured",
    group: "lens",
    value: (m: Material) => listLen(m.application_areas),
    fmt: (v) => `${nf(0).format(v)} applications`,
  },
];

/** Judged criteria as axes. 1-5 integers only; a range when contributors disagree. */
export const judgementAxisVars = (
  criteria: { criterion_id: string; label: string }[],
  scoresFor: (materialId: string, criterionId: string) => number[],
): AxisVar[] =>
  criteria.map((c) => {
    const scores = (m: Material) => scoresFor(m.material_id, c.criterion_id);
    return {
      id: `judgement:${c.criterion_id}`,
      label: c.label,
      noun: c.label.toLowerCase(),
      unit: "1-5",
      kind: "judgement" as const,
      group: "judgement" as const,
      criterionId: c.criterion_id,
      domain: { min: 1, max: 5 },
      /** Position of a single view. A spread of views plots as a range instead. */
      value: (m: Material) => {
        const v = scores(m);
        return v.length === 0 ? null : Math.min(...v);
      },
      range: (m: Material) => {
        const v = scores(m);
        if (v.length === 0) return null;
        return { low: Math.min(...v), high: Math.max(...v) };
      },
      fmt: (v: number) => String(v),
    };
  });

/** Measured lenses only. Judgement axes are built from the live criterion set. */
export const AXIS_VARS: AxisVar[] = LENS_VARS;

export const findAxisVar = (vars: AxisVar[], id: AxisVarId): AxisVar =>
  vars.find((v) => v.id === id) ?? vars[0];

export interface AxisPreset {
  id: string;
  label: string;
  reading: string;
  x: AxisVarId;
  y: AxisVarId;
}

/** One click sets both axes. Any axis stays free to change afterwards. */
export const AXIS_PRESETS: AxisPreset[] = [
  {
    id: "spend-emissions",
    label: "Spend × Emissions",
    reading: "spend against emissions impact",
    x: "spend",
    y: "emissions",
  },
  {
    id: "spend-volume",
    label: "Spend × Volume",
    reading: "spend against the volume behind it",
    x: "spend",
    y: "volume",
  },
  {
    id: "emissions-factor",
    label: "Emissions × GHG factor",
    reading: "total impact against carbon intensity",
    x: "emissions",
    y: "ghg_factor",
  },
  {
    id: "spend-applications",
    label: "Spend × Applications",
    reading: "spend against how widely it is used",
    x: "spend",
    y: "applications",
  },
];

export const DEFAULT_PRESET = AXIS_PRESETS[0];

/** Every dot is the same size. Nothing is encoded in radius. */
export const DOT_R = 4.2;

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
