import type {
  AssessmentCriterion,
  Contributor,
  MaterialRole,
  TeamId,
} from "@/types/materialPrioritisation";

/**
 * SEVEN STANDARD CRITERIA. Fixed in every workspace: they cannot be renamed,
 * reworded, reordered, rescaled or deleted. They can only be hidden. All seven
 * run in the same direction — a high score supports switching. They are never
 * blended, totalled, averaged or weighted into a single number.
 */
export const STANDARD_JUDGED: AssessmentCriterion[] = [
  {
    criterion_id: "regulatory_pressure",
    label: "Regulatory pressure",
    kind: "judgement",
    helper:
      "Extent to which restrictions in force or clearly coming affect the incumbent material, and whether switching gets ahead of them or only delays the problem.",
    anchor_low: "No restriction in sight",
    anchor_high: "Restriction confirmed",
  },
  {
    criterion_id: "market_pull",
    label: "Market pull",
    kind: "judgement",
    helper:
      "Extent to which customer demand, tenders, brand commitments, changing expectations or reputational exposure support implementation.",
    anchor_low: "No demand signal",
    anchor_high: "Customers asking",
  },
  {
    criterion_id: "competitive_advantage",
    label: "Competitive advantage",
    kind: "judgement",
    helper:
      "Extent to which the switch differentiates against competitors through claims rivals cannot make, first-mover position or defensibility, and whether competitors have already moved.",
    anchor_low: "No edge",
    anchor_high: "Clear differentiation",
  },
  {
    criterion_id: "economic_case",
    label: "Economic case",
    kind: "judgement",
    helper:
      "Extent to which the material offers attractive costs, margins, investment returns, or improved long-term cost competitiveness.",
    anchor_low: "Worse economics",
    anchor_high: "Economics improve",
  },
  {
    criterion_id: "supply_security",
    label: "Supply security",
    kind: "judgement",
    helper:
      "Extent to which the material improves availability, supplier diversification, price stability, and supply-chain resilience.",
    anchor_low: "No improvement",
    anchor_high: "Materially more secure",
  },
  {
    criterion_id: "sustainability_impact",
    label: "Sustainability impact",
    kind: "judgement",
    helper:
      "Extent to which the switch delivers a real reduction in greenhouse gas emissions, product carbon footprint or other environmental burden, large enough to claim. This is the reduction the switch delivers, not the incumbent material's current footprint.",
    anchor_low: "Marginal reduction",
    anchor_high: "Substantial reduction",
  },
  {
    criterion_id: "product_performance",
    label: "Product performance",
    kind: "judgement",
    helper:
      "Extent to which the material meets the technical and sensory performance the finished product requires, without reformulation compromise.",
    anchor_low: "Performance gap",
    anchor_high: "Meets or beats incumbent",
  },
];

/** The two evidence rows. Read from data the platform already holds. */
export const EVIDENCE_CRITERIA: AssessmentCriterion[] = [
  {
    criterion_id: "business_exposure",
    label: "Business exposure",
    kind: "evidence",
    source: "figures",
    helper: "Read from the company figures: spend, volume and GHG contribution.",
  },
  {
    criterion_id: "market_readiness",
    label: "Market readiness",
    kind: "evidence",
    source: "vcg",
    helper: "Read from the VCG signals: substitutability, suppliers, competitor activity.",
  },
];

/**
 * RETIRED CRITERION. "Strategic importance" has no replacement in the standard
 * set, and its recorded scores, rationales and contributors must stay readable.
 * It is therefore carried as a hidden criterion: out of use, nothing deleted.
 */
export const RETIRED_JUDGED: AssessmentCriterion[] = [
  {
    criterion_id: "strategic_importance",
    label: "Strategic importance",
    kind: "judgement",
    helper:
      "Retired criterion. Kept hidden so the judgements already recorded against it stay readable.",
    anchor_low: "Peripheral",
    anchor_high: "Central to strategy",
    hidden: true,
  },
];

export const STANDARD_JUDGED_IDS = STANDARD_JUDGED.map((c) => c.criterion_id);

/** Anchors as one printable line. Derived, never stored separately by a user. */
export const anchorLine = (c: AssessmentCriterion) =>
  c.anchor_low && c.anchor_high ? `5 = ${c.anchor_high} · 1 = ${c.anchor_low}` : undefined;

/** How many custom criteria a workspace may hold. */
export const MAX_CUSTOM_CRITERIA = 2;

/** The seeded set: evidence rows, the seven standard criteria, then the retired one. */
export const CRITERIA: AssessmentCriterion[] = [
  ...EVIDENCE_CRITERIA,
  ...STANDARD_JUDGED,
  ...RETIRED_JUDGED,
];

/** Every judged criterion, hidden ones included. */
export const ALL_JUDGED_CRITERIA = CRITERIA.filter((c) => c.kind === "judgement");

/** Active judged criteria: the ones in use. Hidden criteria are excluded. */
export const JUDGED_CRITERIA = ALL_JUDGED_CRITERIA.filter((c) => !c.hidden);

/**
 * ROLE WORDING. The criteria read the same for both roles: every one of the
 * seven is phrased around the switch itself, so nothing needs rewording for an
 * existing material versus a replacement candidate.
 */
export const criterionForRole = (
  criterion: AssessmentCriterion,
  _role: MaterialRole,
): AssessmentCriterion => criterion;

export const criterionById = (id: string): AssessmentCriterion | undefined =>
  CRITERIA.find((c) => c.criterion_id === id);

export const CRITERION_LABEL: Record<string, string> = Object.fromEntries(
  CRITERIA.map((c) => [c.criterion_id, c.label]),
);

/** The only permitted judgement values. 1..5, no zero, no negatives. */
export const SCORE_POINTS = [1, 2, 3, 4, 5] as const;

export const SCORE_LABEL: Record<number, string> = {
  1: "1 — very weak",
  2: "2 — weak",
  3: "3 — moderate",
  4: "4 — strong",
  5: "5 — very strong",
};

/** Neutral is a recorded position, not a score. It never enters a count of scores. */
export const NEUTRAL_LABEL = "Neutral";
export const NEUTRAL_HELPER = "This team has no visibility here. Not 3, not 0 — never counted as a score.";

export const TEAM_LABEL: Record<TeamId, string> = {
  rnd: "R&D",
  procurement: "Procurement",
  sustainability: "Sustainability",
  marketing: "Marketing",
  regulatory: "Regulatory",
};

/**
 * The six demo users. Their names are the same vocabulary the Owner field uses,
 * so "Viewing as" can be compared against a material's owner for gate rights.
 */
export const CONTRIBUTORS: Contributor[] = [
  { user_id: "u-brandt", name: "K. Brandt", team: "procurement", role: "Category manager" },
  { user_id: "u-oyelaran", name: "M. Oyelaran", team: "procurement", role: "Sourcing manager" },
  { user_id: "u-rautio", name: "S. Rautio", team: "rnd", role: "Formulation lead" },
  { user_id: "u-haugen", name: "L. Haugen", team: "sustainability", role: "Sustainability manager" },
  { user_id: "u-vermeer", name: "A. Vermeer", team: "marketing", role: "Brand director" },
  { user_id: "u-kowalczyk", name: "N. Kowalczyk", team: "regulatory", role: "Regulatory affairs manager" },
];

/** Names available as a condition owner. */
export const DEMO_USER_NAMES = CONTRIBUTORS.map((c) => c.name);

export const contributorByName = (name: string | null): Contributor | undefined =>
  name ? CONTRIBUTORS.find((c) => c.name === name) : undefined;

export const contributorById = (id: string): Contributor | undefined =>
  CONTRIBUTORS.find((c) => c.user_id === id);

export const DEFAULT_CONTRIBUTOR = CONTRIBUTORS[0];

/** Initials for a compact contributor mark. */
export const initialsOf = (name: string) =>
  name
    .replace(/\./g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase())
    .slice(0, 2)
    .join("");

export const assessmentKey = (materialId: string, criterionId: string, userId: string) =>
  `${materialId}|${criterionId}|${userId}`;
