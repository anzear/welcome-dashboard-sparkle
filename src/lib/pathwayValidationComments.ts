/**
 * Shared store for Validation Space comments on a pathway.
 *
 * Comments are written on the pathway detail page (Validation Space) and read
 * back in the material Research Space for pathways that are shortlisted there.
 * Prototype persistence is localStorage only.
 */

export const VALIDATION_CATEGORIES = [
  { id: 'feedstock', label: 'Feedstock Availability & Security' },
  { id: 'technology', label: 'Technology Maturity & Scalability' },
  { id: 'material', label: 'Material Conformance' },
  { id: 'economics', label: 'Economics' },
  { id: 'sustainability', label: 'Sustainability / LCA' },
  { id: 'ip', label: 'IP & FTO' },
  { id: 'regulations', label: 'Regulations' },
] as const;

export type ValidationCategoryId = (typeof VALIDATION_CATEGORIES)[number]['id'];

export interface ValidationComment {
  id: string;
  categoryId: string;
  author: string;
  text: string;
  createdAt: string;
}

export const categoryLabel = (id: string) =>
  VALIDATION_CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const validationCommentsKey = (topic: string | undefined, pathwayId: string) =>
  `pathway-validation-comments:${topic || 'default'}:${pathwayId}`;

export function readValidationComments(topic: string | undefined, pathwayId: string): ValidationComment[] {
  try {
    const raw = localStorage.getItem(validationCommentsKey(topic, pathwayId));
    return raw ? (JSON.parse(raw) as ValidationComment[]) : [];
  } catch {
    return [];
  }
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
