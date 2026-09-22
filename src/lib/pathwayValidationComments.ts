/**
 * Shared store for Validation Space comments on a pathway.
 *
 * Comments are written on the pathway detail page (Validation Space) and read
 * back in the material Workspace for pathways that are shortlisted there.
 * Prototype persistence is localStorage only.
 */

export const VALIDATION_CATEGORIES = [
  { id: 'feedstock', label: 'Feedstock Availability & Security', group: 'Technical Feasibility' },
  { id: 'technology', label: 'Process Maturity & Scalability', group: 'Technical Feasibility' },
  { id: 'material', label: 'Product Specification Fit', group: 'Technical Feasibility' },
  { id: 'supply-chain', label: 'Supply Chain & Sourcing Readiness', group: 'Commercial Viability' },
  { id: 'economics', label: 'Cost & Economics', group: 'Commercial Viability' },
  { id: 'sustainability', label: 'Sustainability targets', group: 'Risk & Compliance' },
  { id: 'ip', label: 'IP & Freedom to Operate', group: 'Risk & Compliance' },
  { id: 'regulations', label: 'Regulatory Compliance', group: 'Risk & Compliance' },
] as const;

export type ValidationCategoryId = (typeof VALIDATION_CATEGORIES)[number]['id'];

export interface ValidationComment {
  id: string;
  categoryId: string;
  author: string;
  text: string;
  createdAt: string;
  /** Set when the note was written on a validation-checklist metric row. */
  metricLabel?: string;
}

export const VALIDATION_COMMENTS_CHANGED_EVENT = 'pathway-validation-comments-changed';

export const categoryLabel = (id: string) =>
  VALIDATION_CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const validationCommentsKey = (topic: string | undefined, pathwayId: string) =>
  `pathway-validation-comments:${topic || 'default'}:${pathwayId}`;

/** Mock comments used to showcase the space until the team writes real ones. */
const MOCK_COMMENTS: Omit<ValidationComment, 'id' | 'createdAt'>[] = [
  {
    categoryId: 'feedstock',
    author: 'K. Brandt',
    text: 'Spoke with two EU sugar-beet suppliers — contract volumes look secure through 2028, but pricing is indexed to energy. Worth a hedging clause.',
  },
  {
    categoryId: 'technology',
    author: 'S. Rautio',
    text: 'Fermentation step is proven at pilot scale (TRL 6) with our shortlisted licensor. Main open question is downstream purification yield above 500 t/a.',
  },
  {
    categoryId: 'economics',
    author: 'M. Kovac',
    text: 'At €1.68/kg the pathway beats our €2,200/t ceiling with ~18% margin. Sensitivity to feedstock price is the main risk to watch.',
  },
  {
    categoryId: 'sustainability',
    author: 'K. Brandt',
    text: 'Preliminary LCA shows ~55% lower GHG vs fossil incumbent. Needs third-party verification before we claim it externally.',
  },
  {
    categoryId: 'ip',
    author: 'Legal',
    text: 'FTO search returned two blocking patents in the US from a competitor. EU looks clear; flag for counsel before any US commitments.',
  },
];

export function readValidationComments(topic: string | undefined, pathwayId: string): ValidationComment[] {
  try {
    const raw = localStorage.getItem(validationCommentsKey(topic, pathwayId));
    if (raw !== null) return JSON.parse(raw) as ValidationComment[];
  } catch {
    return [];
  }
  // Never written before: seed mock comments so the space showcases populated.
  const seeded: ValidationComment[] = MOCK_COMMENTS.map((c, i) => ({
    ...c,
    id: `mock-${i + 1}`,
    createdAt: new Date(Date.UTC(2026, 8, 10 + i, 9, 15)).toISOString(),
  }));
  writeValidationComments(topic, pathwayId, seeded);
  return seeded;
}

export function writeValidationComments(
  topic: string | undefined,
  pathwayId: string,
  comments: ValidationComment[],
) {
  try {
    localStorage.setItem(validationCommentsKey(topic, pathwayId), JSON.stringify(comments));
    window.dispatchEvent(new Event('pathway-validation-comments-changed'));
  } catch {}
}

/** Shortlist ids look like "pathway-3"; validation space keys by route index ("2"). */
export function shortlistIdToPathwayIndex(shortlistId: string): string | null {
  const match = /^pathway-(\d+)$/.exec(shortlistId);
  if (!match) return null;
  return String(Number(match[1]) - 1);
}

/**
 * The five pathway statuses. NOT a sequence — a pathway can move between any
 * two directly (e.g. Not evaluated → Parked) without passing through others.
 */
export type PathwayValidationStatus =
  | 'Not evaluated'
  | 'Lab testing'
  | 'Piloting'
  | 'Integrated'
  | 'Parked';

export const PATHWAY_VALIDATION_STATUSES: PathwayValidationStatus[] = [
  'Not evaluated',
  'Lab testing',
  'Piloting',
  'Integrated',
  'Parked',
];

/** Migration for values stored before the rename: TBD/Go/Uncertain/No-Go. */
const LEGACY_STATUS_MAP: Record<string, PathwayValidationStatus> = {
  TBD: 'Not evaluated',
  Go: 'Piloting',
  Uncertain: 'Lab testing',
  'No-Go': 'Parked',
};

export const validationStatusKey = (topic: string | undefined, pathwayId: string) =>
  `pathway-validation-status:${topic || 'default'}:${pathwayId}`;

/**
 * Pathway status set in the Validation Space on the pathway profile.
 * Legacy values are migrated to the new five on read. Default: Not evaluated.
 */
export function readPathwayValidationStatus(
  topic: string | undefined,
  pathwayId: string,
): PathwayValidationStatus {
  try {
    const s = localStorage.getItem(validationStatusKey(topic, pathwayId));
    if (s && (PATHWAY_VALIDATION_STATUSES as string[]).includes(s)) {
      return s as PathwayValidationStatus;
    }
    if (s && LEGACY_STATUS_MAP[s]) return LEGACY_STATUS_MAP[s];
  } catch {}
  return 'Not evaluated';
}

export function writePathwayValidationStatus(
  topic: string | undefined,
  pathwayId: string,
  status: PathwayValidationStatus,
) {
  try {
    localStorage.setItem(validationStatusKey(topic, pathwayId), status);
    window.dispatchEvent(new Event('pathway-validation-comments-changed'));
  } catch {}
}

/** Seed diverse statuses for demo shortlists without overwriting user-set values. */
export function seedPathwayValidationStatuses(
  topic: string | undefined,
  pathwayIds: string[],
  statuses: PathwayValidationStatus[],
) {
  pathwayIds.forEach((id, i) => {
    try {
      const key = validationStatusKey(topic, id);
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, statuses[i % statuses.length]);
      }
    } catch {}
  });
}
