// Free-text, customer-owned tags. The vocabulary is derived from the data, never
// stored as a separate list, and nothing is ranked, scored or derived from tags.

export const TAG_MAX_LENGTH = 40;

/** Trim and cap. Empty input yields null — an empty tag is never stored. */
export const normalizeTag = (raw: string | null | undefined): string | null => {
  const t = (raw ?? "").trim().replace(/\s+/g, " ").slice(0, TAG_MAX_LENGTH).trim();
  return t === "" ? null : t;
};

/** Matching is case-insensitive; storage keeps the spelling first typed. */
export const tagKey = (t: string) => t.trim().toLowerCase();

export const hasTag = (tags: string[], tag: string) => tags.some((t) => tagKey(t) === tagKey(tag));

/** Cleans a list: trims, drops empties, de-duplicates case-insensitively. */
export const cleanTags = (raw: (string | null | undefined)[]): string[] => {
  const out: string[] = [];
  raw.forEach((r) => {
    const t = normalizeTag(r);
    if (t && !hasTag(out, t)) out.push(t);
  });
  return out;
};

/** Adds without overwriting. Existing spelling wins on a case-insensitive hit. */
export const addTags = (existing: string[], incoming: string[]): string[] => {
  const out = [...existing];
  cleanTags(incoming).forEach((t) => {
    if (!hasTag(out, t)) out.push(t);
  });
  return out;
};

export const removeTags = (existing: string[], drop: string[]): string[] => {
  const keys = new Set(cleanTags(drop).map(tagKey));
  return existing.filter((t) => !keys.has(tagKey(t)));
};

export const formatTags = (tags: string[]) => tags.join(", ");

/** Semicolon-joined, the CSV shape on both import and export. */
export const tagsToCsv = (tags: string[]) => tags.join(";");

/** Tag vocabulary in use, with counts. Derived, never persisted. */
export function tagVocabulary(rows: { tags: string[] }[]): { tag: string; count: number }[] {
  const seen = new Map<string, { tag: string; count: number }>();
  rows.forEach((r) =>
    cleanTags(r.tags ?? []).forEach((t) => {
      const k = tagKey(t);
      const hit = seen.get(k);
      if (hit) hit.count += 1;
      else seen.set(k, { tag: t, count: 1 });
    }),
  );
  return [...seen.values()].sort((a, b) => a.tag.localeCompare(b.tag));
}

export const UNTAGGED = "__untagged__";
