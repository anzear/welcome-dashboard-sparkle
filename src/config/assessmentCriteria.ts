import type { AssessmentCriterion, Contributor, TeamId } from "@/types/materialPrioritisation";

/**
 * Five assessment criteria per material. Two are read from evidence the platform
 * already holds — nobody scores them. Three are judged by people, one entry per
 * person. The five are never blended into a single number.
 */
export const CRITERIA: AssessmentCriterion[] = [
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
  {
    criterion_id: "technical_feasibility",
    label: "Technical feasibility",
    kind: "judgement",
    helper: "5 = a drop-in change we could qualify; 1 = reformulation with no known route.",
  },
  {
    criterion_id: "commercial_viability",
    label: "Commercial viability",
    kind: "judgement",
    helper: "5 = the switch carries itself commercially; 1 = the cost gap blocks it.",
  },
  {
    criterion_id: "strategic_fit",
    label: "Strategic fit",
    kind: "judgement",
    helper: "5 = squarely inside a stated commitment; 1 = outside current strategy.",
  },
];

export const JUDGED_CRITERIA = CRITERIA.filter((c) => c.kind === "judgement");

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

export const TEAM_LABEL: Record<TeamId, string> = {
  rnd: "R&D",
  procurement: "Procurement",
  sustainability: "Sustainability",
  commercial: "Commercial",
};

/** Demo account members. The switcher changes who an entry is recorded as. */
/**
 * The six demo users. Their names are the same vocabulary the Owner field uses,
 * so "Viewing as" can be compared against a material's owner for gate rights.
 */
export const CONTRIBUTORS: Contributor[] = [
  { user_id: "u-brandt", name: "K. Brandt", team: "rnd", role: "Formulation lead" },
  { user_id: "u-haugen", name: "L. Haugen", team: "procurement", role: "Category manager" },
  { user_id: "u-oyelaran", name: "M. Oyelaran", team: "sustainability", role: "Sustainability manager" },
  { user_id: "u-vermeer", name: "A. Vermeer", team: "commercial", role: "Brand director" },
  { user_id: "u-kowalczyk", name: "N. Kowalczyk", team: "procurement", role: "Sourcing manager" },
  { user_id: "u-rautio", name: "S. Rautio", team: "rnd", role: "Process engineer" },
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
