// Product line is a first-class field on a material, not a tag. Values come from
// a controlled workspace list: a material may sit in several product lines, but
// the vocabulary is governed centrally rather than typed freely per material.

import { useEffect, useState } from "react";
import type { Material } from "@/types/materialPrioritisation";
import { normalizeTag, tagKey } from "@/components/materialRegister/tags";

/**
 * The controlled list, held at workspace level. Seeded with the brand lines the
 * register was loaded with; a user can add to it deliberately from a picker.
 */
export const PRODUCT_LINES: string[] = ["Persil", "Pril", "Perwoll", "Somat", "Bref"];

const PRODUCT_LINE_KEYS = new Set(PRODUCT_LINES.map((p) => tagKey(p)));

const listeners = new Set<() => void>();

/** Adds a value to the controlled list. Returns the canonical spelling stored. */
export function registerProductLine(raw: string): string | null {
  const t = normalizeTag(raw);
  if (!t) return null;
  const k = tagKey(t);
  if (PRODUCT_LINE_KEYS.has(k)) return PRODUCT_LINES.find((p) => tagKey(p) === k) ?? t;
  PRODUCT_LINE_KEYS.add(k);
  PRODUCT_LINES.push(t);
  listeners.forEach((l) => l());
  return t;
}

/** Re-renders a component when the controlled list grows. */
export function useProductLines(): string[] {
  const [, bump] = useState(0);
  useEffect(() => {
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return PRODUCT_LINES;
}

/** True when a value is part of the controlled product line list. */
export const isProductLineValue = (value: string) => PRODUCT_LINE_KEYS.has(tagKey(value));

/** Canonical spelling for a product line, so counts never split on case. */
export const canonicalProductLine = (value: string) =>
  PRODUCT_LINES.find((p) => tagKey(p) === tagKey(value)) ?? value;

/** Cleans an assignment: canonical spellings, de-duplicated, order kept. */
export const cleanProductLines = (raw: (string | null | undefined)[]): string[] => {
  const out: string[] = [];
  raw.forEach((r) => {
    const t = normalizeTag(r);
    if (!t) return;
    const c = canonicalProductLine(t);
    if (!out.some((x) => tagKey(x) === tagKey(c))) out.push(c);
  });
  return out;
};

/** The material's own field. No product line assigned is an empty list, never a placeholder. */
export const productLinesOf = (m: Pick<Material, "product_lines">) =>
  (m.product_lines ?? []).map(canonicalProductLine);

/**
 * Migration: any product line value still sitting in Tags moves into the field
 * and is dropped from Tags, so the same fact never appears in two places.
 */
export function migrateProductLinesFromTags<T extends Pick<Material, "tags" | "product_lines">>(
  rows: T[],
): T[] {
  return rows.map((m) => {
    const fromTags = (m.tags ?? []).filter(isProductLineValue);
    if (fromTags.length === 0) return m;
    return {
      ...m,
      product_lines: cleanProductLines([...(m.product_lines ?? []), ...fromTags]),
      tags: (m.tags ?? []).filter((t) => !isProductLineValue(t)),
    };
  });
}

/** Scope value for materials carrying no product line at all. */
export const SCOPE_UNTAGGED = "__untagged_line__";

export type Scope = string | null;

export const inScope = (m: Pick<Material, "product_lines">, scope: Scope) => {
  if (scope === null) return true;
  const lines = productLinesOf(m);
  if (scope === SCOPE_UNTAGGED) return lines.length === 0;
  return lines.some((l) => tagKey(l) === tagKey(scope));
};

export const scopeLabel = (scope: Scope) =>
  scope === null ? "All materials" : scope === SCOPE_UNTAGGED ? "Untagged" : canonicalProductLine(scope);

/** Counts per product line plus the untagged bucket. Derived, never stored. */
export function productLineCounts(rows: Pick<Material, "product_lines">[]) {
  const lines = PRODUCT_LINES.map((line) => ({
    value: line as string,
    label: line as string,
    count: rows.filter((r) => inScope(r, line)).length,
  })).filter((l) => l.count > 0);
  const untagged = rows.filter((r) => productLinesOf(r).length === 0).length;
  return { lines, untagged };
}
