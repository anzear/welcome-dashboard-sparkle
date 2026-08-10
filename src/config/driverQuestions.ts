/**
 * The driver question set. One scale from -5 (strong constraint, pushes against
 * pursuing the material) through 0 (neutral or no view) to +5 (strong driver,
 * pushes toward pursuing it). The same question can be a driver at one material
 * and a constraint at another — that is the point of a single scale.
 *
 * This array is the account-level seed. At runtime the set lives in the register
 * store, shared by every material, and is edited from the Scores section.
 */
export interface DriverQuestion {
  /** Slug. Stable, never reused — scores stay keyed to it through renames. */
  question_id: string;
  label: string;
  /** Compact label for the matrix header. */
  short: string;
  /** One line describing what +5 and -5 mean. */
  helper: string | null;
  order: number;
  archived: boolean;
  archived_at: string | null;
  created_by: string;
  created_at: string;
}

export type QuestionSetAction = "added" | "archived" | "restored" | "renamed" | "reordered";

export interface QuestionSetEvent {
  event_id: string;
  action: QuestionSetAction;
  question_id: string;
  from_label: string | null;
  to_label: string | null;
  changed_by: string;
  changed_at: string;
}

const seed: Array<Pick<DriverQuestion, "question_id" | "label" | "short" | "helper">> = [
  {
    question_id: "business_importance",
    label: "Business importance",
    short: "BUS",
    helper: "+5 = central to a strategic product line · -5 = peripheral, little business consequence",
  },
  {
    question_id: "regulatory_position",
    label: "Regulatory position",
    short: "REG",
    helper: "+5 = restriction imminent, change is forced · -5 = regulation settled and comfortable",
  },
  {
    question_id: "market_pull",
    label: "Market pull",
    short: "MKT",
    helper: "+5 = customers actively asking and willing to pay · -5 = no interest, change unwanted",
  },
  {
    question_id: "environmental_impact",
    label: "Environmental impact",
    short: "ENV",
    helper: "+5 = large footprint reduction available · -5 = renewable route is worse on impact",
  },
  {
    question_id: "feedstock_availability",
    label: "Feedstock availability",
    short: "FDS",
    helper: "+5 = renewable feedstock plentiful and proven · -5 = no credible feedstock at scale",
  },
  {
    question_id: "supply_security",
    label: "Supply security",
    short: "SEC",
    helper: "+5 = change reduces exposure and single-sourcing · -5 = change adds fragility",
  },
  {
    question_id: "cost",
    label: "Cost",
    short: "CST",
    helper: "+5 = renewable route is cheaper · -5 = prohibitive premium against current source",
  },
  {
    question_id: "product_performance",
    label: "Product performance",
    short: "PRF",
    helper: "+5 = performance improves in the formulation · -5 = performance loss customers would notice",
  },
  {
    question_id: "process_impact",
    label: "Production process impact",
    short: "PRC",
    helper: "+5 = drops into the existing process · -5 = needs new plant, handling or process redesign",
  },
  {
    question_id: "internal_readiness",
    label: "Internal readiness",
    short: "RDY",
    helper: "+5 = team, data and capacity in place today · -5 = no owner, no capacity, no know-how",
  },
  {
    question_id: "timing_pressure",
    label: "Timing pressure",
    short: "TIM",
    helper: "+5 = a dated commitment or deadline applies · -5 = no time pressure of any kind",
  },
  {
    question_id: "competitor_activity",
    label: "Competitor activity",
    short: "CMP",
    helper: "+5 = competitors already moved, we are behind · -5 = nobody in the sector is moving",
  },
];

export const DRIVER_QUESTIONS: DriverQuestion[] = seed.map((q, i) => ({
  ...q,
  order: i + 1,
  archived: false,
  archived_at: null,
  created_by: "Workspace setup",
  created_at: "2026-01-14",
}));

export const DRIVER_QUESTION_LABEL: Record<string, string> = Object.fromEntries(
  DRIVER_QUESTIONS.map((q) => [q.question_id, q.label]),
);

/** Derives a stable slug for a newly added question. */
export const slugForLabel = (label: string, taken: string[]): string => {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "question";
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
};

/** Short code for the matrix header, derived from the label. */
export const shortForLabel = (label: string) =>
  label
    .replace(/[^A-Za-z ]/g, "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase() || "NEW";

/** Sparse map key. Unscored pairs simply have no entry. */
export const scoreKey = (materialId: string, questionId: string) => `${materialId}::${questionId}`;

export const SCORE_POINTS = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] as const;
