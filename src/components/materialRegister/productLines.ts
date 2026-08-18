// Product lines are tags, not a field. A material sits in as many product lines as
// it is actually used in. The only thing that separates a product line tag from a
// general tag is its type — the storage is the same Tags array.

import { useEffect, useState } from "react";
import type { Material } from "@/types/materialPrioritisation";
import { normalizeTag, tagKey } from "@/components/materialRegister/tags";

export type TagType = "product_line" | "general";

/**
 * The commercial brand lines in play. Company-entered vocabulary, so the list is
 * open: marking a new tag as a product line adds it here for the whole session.
 */
export const PRODUCT_LINES: string[] = ["Persil", "Pril", "Perwoll", "Somat", "Bref"];

const PRODUCT_LINE_KEYS = new Set(PRODUCT_LINES.map((p) => tagKey(p)));

const listeners = new Set<() => void>();

/** Records a tag as a product line. Returns the canonical spelling stored. */
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

/** Re-renders a component when the product line vocabulary grows. */
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

export const tagTypeOf = (tag: string): TagType =>
  PRODUCT_LINE_KEYS.has(tagKey(tag)) ? "product_line" : "general";

export const isProductLineTag = (tag: string) => tagTypeOf(tag) === "product_line";

/** Canonical spelling for a product line tag, so counts never split on case. */
export const canonicalProductLine = (tag: string) =>
  PRODUCT_LINES.find((p) => tagKey(p) === tagKey(tag)) ?? tag;

export const productLinesOf = (m: Pick<Material, "tags">) =>
  (m.tags ?? []).filter(isProductLineTag).map(canonicalProductLine);

export const generalTagsOf = (m: Pick<Material, "tags">) =>
  (m.tags ?? []).filter((t) => !isProductLineTag(t));

/** Scope value for materials carrying no product line tag at all. */
export const SCOPE_UNTAGGED = "__untagged_line__";

export type Scope = string | null;

export const inScope = (m: Pick<Material, "tags">, scope: Scope) => {
  if (scope === null) return true;
  const lines = productLinesOf(m);
  if (scope === SCOPE_UNTAGGED) return lines.length === 0;
  return lines.some((l) => tagKey(l) === tagKey(scope));
};

export const scopeLabel = (scope: Scope) =>
  scope === null ? "All materials" : scope === SCOPE_UNTAGGED ? "Untagged" : canonicalProductLine(scope);

/** Counts per product line plus the untagged bucket. Derived, never stored. */
export function productLineCounts(rows: Pick<Material, "tags">[]) {
  const lines = PRODUCT_LINES.map((line) => ({
    value: line as string,
    label: line as string,
    count: rows.filter((r) => inScope(r, line)).length,
  })).filter((l) => l.count > 0);
  const untagged = rows.filter((r) => productLinesOf(r).length === 0).length;
  return { lines, untagged };
}
