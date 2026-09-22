export interface PathwayIndicatorOverrideRecord {
  id: string;
  indicatorId: string;
  value: string;
  reason: string;
  author: string;
  createdAt: string;
  operation: "override" | "revert";
  revertsId?: string;
}

const storageKey = (topic: string | undefined, pathwayId: string) =>
  `vcg.pathway.indicatorOverrides.${topic ? encodeURIComponent(topic) : "default"}.${pathwayId}`;

export function readPathwayIndicatorOverrides(
  topic: string | undefined,
  pathwayId: string,
): PathwayIndicatorOverrideRecord[] {
  try {
    const raw = localStorage.getItem(storageKey(topic, pathwayId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as PathwayIndicatorOverrideRecord[] : [];
  } catch {
    return [];
  }
}

export function writePathwayIndicatorOverrides(
  topic: string | undefined,
  pathwayId: string,
  records: PathwayIndicatorOverrideRecord[],
): void {
  try {
    localStorage.setItem(storageKey(topic, pathwayId), JSON.stringify(records));
  } catch {}
}

export function activePathwayIndicatorOverrides(records: PathwayIndicatorOverrideRecord[]) {
  const reverted = new Set(
    records.filter((record) => record.operation === "revert" && record.revertsId).map((record) => record.revertsId as string),
  );
  const latest = new Map<string, PathwayIndicatorOverrideRecord>();
  records.forEach((record) => {
    if (record.operation !== "override" || reverted.has(record.id)) return;
    const key = `${record.indicatorId}:${record.author}`;
    const current = latest.get(key);
    if (!current || current.createdAt < record.createdAt) latest.set(key, record);
  });
  return [...latest.values()];
}