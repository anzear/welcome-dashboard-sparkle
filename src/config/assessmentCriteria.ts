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
const anchorsOf = (low?: string, high?: string) =>
  low && high ? `5 = ${high} · 1 = ${low}` : undefined;

/** Keeps the printable anchor line in step with the low/high labels. */
const withAnchors = (list: AssessmentCriterion[]): AssessmentCriterion[] =>
  list.map((c) => ({ ...c, anchors: anchorsOf(c.anchor_low, c.anchor_high) }));

export const STANDARD_JUDGED: AssessmentCriterion[] = withAnchors([
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
]);

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

export const STANDARD_JUDGED_IDS = STANDARD_JUDGED.map((c) => c.criterion_id);

/**
 * ROLE WORDING. There is one set of seven criteria — the scale, the rules and
 * the anchor labels never change. Only the framing of the question flips with
 * the role: on an existing material the team assesses why to replace it; on a
 * replacement candidate they assess why to implement it. The default `helper`
 * on each standard criterion is phrased for a replacement candidate (why to
 * implement); the map below carries the existing-material phrasing (why to
 * replace), which is swapped in by `criterionForRole`. Custom criteria have no
 * role-specific wording and read identically either way.
 */
export const EXISTING_HELPERS: Record<string, string> = {
  regulatory_pressure:
    "Extent to which restrictions in force or clearly coming affect this material, creating a need to move away from it.",
  market_pull:
    "Extent to which customer demand, tenders, brand commitments, changing expectations or reputational exposure create pressure to move away from this material.",
  competitive_advantage:
    "Extent to which continuing with this material costs competitive position, and whether competitors have already moved away from it.",
  economic_case:
    "Extent to which this material's cost position, margin contribution or long-term cost competitiveness is deteriorating.",
  supply_security:
    "Extent to which this material carries availability, supplier concentration, price volatility or supply-chain resilience problems.",
  sustainability_impact:
    "Extent to which this material's greenhouse gas emissions, product carbon footprint or wider environmental burden is a problem for the business.",
  product_performance:
    "Extent to which this material's technical or sensory performance falls short of what the finished product requires.",
};

/** Anchors as one printable line. Derived, never stored separately by a user. */
export const anchorLine = (c: AssessmentCriterion) => anchorsOf(c.anchor_low, c.anchor_high);

/** How many custom criteria a workspace may hold. */
export const MAX_CUSTOM_CRITERIA = 2;

/** The seeded set: the two evidence rows, then the seven standard criteria. */
export const CRITERIA: AssessmentCriterion[] = [...EVIDENCE_CRITERIA, ...STANDARD_JUDGED];

/** Every judged criterion, hidden ones included. */
export const ALL_JUDGED_CRITERIA = CRITERIA.filter((c) => c.kind === "judgement");

/** Active judged criteria: the ones in use. Hidden criteria are excluded. */
export const JUDGED_CRITERIA = ALL_JUDGED_CRITERIA.filter((c) => !c.hidden);

/**
 * The one-line framing shown above the criteria. Quiet, secondary weight, no
 * banner. Reads the assessment as a question, scoped by the material's role.
 */
export const ASSESSMENT_FRAMING: Record<MaterialRole, string> = {
  existing: "Assessing why this material should be replaced.",
  new: "Assessing why this material should be implemented.",
};

/**
 * ROLE WORDING. The criterion object is the same for both roles — only the
 * helper (tooltip) is reworded for an existing material. Custom and retired
 * criteria keep their single helper either way.
 */
export const criterionForRole = (
  criterion: AssessmentCriterion,
  role: MaterialRole,
): AssessmentCriterion =>
  role === "existing" && EXISTING_HELPERS[criterion.criterion_id]
    ? { ...criterion, helper: EXISTING_HELPERS[criterion.criterion_id] }
    : criterion;

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
 * The demo users. Their names are the same vocabulary the Owner field uses, so
 * "Viewing as" can be compared against a material's owner for gate rights.
 */
export const CONTRIBUTORS: Contributor[] = [
  { user_id: "u-brandt", name: "K. Brandt", team: "procurement", role: "Category manager" },
  { user_id: "u-oyelaran", name: "M. Oyelaran", team: "procurement", role: "Sourcing manager" },
  { user_id: "u-rautio", name: "S. Rautio", team: "rnd", role: "Formulation lead" },
  { user_id: "u-haugen", name: "L. Haugen", team: "sustainability", role: "Sustainability manager" },
  { user_id: "u-vermeer", name: "A. Vermeer", team: "marketing", role: "Brand director" },
  { user_id: "u-kowalczyk", name: "N. Kowalczyk", team: "regulatory", role: "Regulatory affairs manager" },
  { user_id: "u-delacroix", name: "R. Delacroix", team: "rnd", role: "Formulation scientist" },
  { user_id: "u-iqbal", name: "T. Iqbal", team: "procurement", role: "Category buyer" },
  { user_id: "u-moreau", name: "J. Moreau", team: "marketing", role: "Claims manager" },
  { user_id: "u-sandoval", name: "P. Sandoval", team: "regulatory", role: "Product compliance lead" },
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
