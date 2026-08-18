import type { Material } from "@/types/materialPrioritisation";

/**
 * How much of a material's record is actually filled in. Counts only fields a
 * customer is expected to state — a null is missing, never a zero.
 */
export interface Completeness {
  filled: number;
  total: number;
  ratio: number;
  missing: string[];
}

const FIELDS: [string, (m: Material) => boolean][] = [
  ["CAS number", (m) => Boolean(m.cas_number)],
  ["Their IDs", (m) => (m.customer_material_ids ?? []).length > 0],
  ["Material category", (m) => Boolean(m.material_class)],
  ["Tags", (m) => (m.tags ?? []).length > 0],
  ["Applications", (m) => (m.application_categories ?? []).length > 0],
  ["Products", (m) => (m.product_categories ?? []).length > 0],
  ["Volume", (m) => m.annual_volume !== null],
  ["Unit price", (m) => m.unit_price !== null],
  ["Spend", (m) => m.annual_spend !== null],
  ["GHG factor", (m) => m.ghg_emission_factor !== null],
  ["GHG contribution", (m) => m.ghg_contribution !== null],
  ["GHG boundary", (m) => Boolean(m.ghg_boundary)],
  ["Owner", (m) => Boolean(m.owner)],
  ["Requirements", (m) => Boolean(m.requirements)],
];

export function completenessOf(m: Material): Completeness {
  const missing = FIELDS.filter(([, has]) => !has(m)).map(([label]) => label);
  const total = FIELDS.length;
  const filled = total - missing.length;
  return { filled, total, ratio: filled / total, missing };
}
