/**
 * The twelve driver questions. One scale from -5 (strong constraint, pushes
 * against pursuing the material) through 0 (neutral or no view) to +5 (strong
 * driver, pushes toward pursuing it). The same question can be a driver at one
 * material and a constraint at another — that is the point of a single scale.
 *
 * Edit this array to change the question set.
 */
export interface DriverQuestion {
  id: string;
  label: string;
  /** Compact label for the matrix header. */
  short: string;
  /** One line describing what +5 and -5 mean. Shown on hover. */
  helper: string;
}

export const DRIVER_QUESTIONS: DriverQuestion[] = [
  {
    id: "business_importance",
    label: "Business importance",
    short: "BUS",
    helper: "+5 = central to a strategic product line · -5 = peripheral, little business consequence",
  },
  {
    id: "regulatory_position",
    label: "Regulatory position",
    short: "REG",
    helper: "+5 = restriction imminent, change is forced · -5 = regulation settled and comfortable",
  },
  {
    id: "market_pull",
    label: "Market pull",
    short: "MKT",
    helper: "+5 = customers actively asking and willing to pay · -5 = no interest, change unwanted",
  },
  {
    id: "environmental_impact",
    label: "Environmental impact",
    short: "ENV",
    helper: "+5 = large footprint reduction available · -5 = renewable route is worse on impact",
  },
  {
    id: "feedstock_availability",
    label: "Feedstock availability",
    short: "FDS",
    helper: "+5 = renewable feedstock plentiful and proven · -5 = no credible feedstock at scale",
  },
  {
    id: "supply_security",
    label: "Supply security",
    short: "SEC",
    helper: "+5 = change reduces exposure and single-sourcing · -5 = change adds fragility",
  },
  {
    id: "cost",
    label: "Cost",
    short: "CST",
    helper: "+5 = renewable route is cheaper · -5 = prohibitive premium against current source",
  },
  {
    id: "product_performance",
    label: "Product performance",
    short: "PRF",
    helper: "+5 = performance improves in the formulation · -5 = performance loss customers would notice",
  },
  {
    id: "process_impact",
    label: "Production process impact",
    short: "PRC",
    helper: "+5 = drops into the existing process · -5 = needs new plant, handling or process redesign",
  },
  {
    id: "internal_readiness",
    label: "Internal readiness",
    short: "RDY",
    helper: "+5 = team, data and capacity in place today · -5 = no owner, no capacity, no know-how",
  },
  {
    id: "timing_pressure",
    label: "Timing pressure",
    short: "TIM",
    helper: "+5 = a dated commitment or deadline applies · -5 = no time pressure of any kind",
  },
  {
    id: "competitor_activity",
    label: "Competitor activity",
    short: "CMP",
    helper: "+5 = competitors already moved, we are behind · -5 = nobody in the sector is moving",
  },
];

export const DRIVER_QUESTION_LABEL: Record<string, string> = Object.fromEntries(
  DRIVER_QUESTIONS.map((q) => [q.id, q.label]),
);

/** Sparse map key. Unscored pairs simply have no entry. */
export const scoreKey = (materialId: string, questionId: string) => `${materialId}::${questionId}`;

export const SCORE_POINTS = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] as const;
