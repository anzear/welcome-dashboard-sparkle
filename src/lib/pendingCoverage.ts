/**
 * PENDING COVERAGE — coverage requests that have been made but not yet agreed.
 *
 * A request must not vanish. Once made, the material appears in Your topics as a
 * pending topic: legible, dimmed, non-interactive, and impossible to request
 * again. Nothing here touches the Material Portfolio register: requesting
 * coverage does not change a material's role, strategy, assessment or links.
 */
import type { MaterialRole } from "@/types/materialPrioritisation";
import { materials } from "@/data/materialPrioritisationMock";
import { addPortfolioAddition, readPortfolioAdditions } from "@/lib/portfolioAdditions";

export const PENDING_COVERAGE_EVENT = "pendingCoverageUpdated";

const PENDING_KEY = "material_coverage_pending";
/** Older builds stored bare material ids from Available now. Still honoured. */
const LEGACY_REQUESTED_KEY = "material_coverage_requested";

export interface PendingCoverageEntry {
  name: string;
  /** Register row this came from, when the request started in Available now. */
  materialId?: string;
  /** How the pathway would be run, when the request came from the modal. */
  runAs?: "Feedstock" | "Material";
  /** Role given in the modal, used to create the register row for the request. */
  role?: MaterialRole;
  requestedAt: number;
}

export function readPendingCoverage(): PendingCoverageEntry[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(PENDING_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (e): e is PendingCoverageEntry =>
        !!e && typeof e === "object" && typeof (e as PendingCoverageEntry).name === "string",
    );
  } catch {
    return [];
  }
}

/** Material ids requested through older builds, kept so nothing reappears. */
export function readLegacyRequestedIds(): string[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(LEGACY_REQUESTED_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function isPendingCoverage(name: string, materialId?: string): boolean {
  const pending = readPendingCoverage();
  const key = name.trim().toLowerCase();
  return pending.some(
    (e) => e.name.trim().toLowerCase() === key || (!!materialId && e.materialId === materialId),
  );
}

/** Records the request. Returns false when one is already in for that material. */
export function addPendingCoverage(entry: Omit<PendingCoverageEntry, "requestedAt">): boolean {
  const current = readPendingCoverage();
  const key = entry.name.trim().toLowerCase();
  if (
    current.some(
      (e) =>
        e.name.trim().toLowerCase() === key ||
        (!!entry.materialId && e.materialId === entry.materialId),
    )
  ) {
    return false;
  }
  const next = [{ ...entry, name: entry.name.trim(), requestedAt: Date.now() }, ...current];
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(next));
  } catch {
    /* a storage failure must not stop the request being shown as made */
  }
  window.dispatchEvent(new CustomEvent(PENDING_COVERAGE_EVENT));
  return true;
}

/**
 * Requesting coverage for a material that is not in the register must create it
 * there. This reconciles what the prototype already holds: a pending topic with
 * no register row gets one created from its recorded role; a pending topic with
 * no role at all predates the role question and is a stub, so it is dropped
 * rather than guessed at.
 */
export function reconcilePendingCoverage(): void {
  const current = readPendingCoverage();
  if (current.length === 0) return;
  const registered = new Set(
    [...materials.map((m) => m.name), ...readPortfolioAdditions().map((a) => a.name)].map((n) =>
      n.trim().toLowerCase(),
    ),
  );
  const kept: PendingCoverageEntry[] = [];
  let changed = false;
  for (const entry of current) {
    const key = entry.name.trim().toLowerCase();
    if (entry.materialId || registered.has(key)) {
      kept.push(entry);
      continue;
    }
    if (entry.role) {
      addPortfolioAddition({ name: entry.name, role: entry.role });
      registered.add(key);
      kept.push(entry);
      continue;
    }
    changed = true; // stub request from before the role question — remove it
  }
  if (!changed) return;
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(kept));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(PENDING_COVERAGE_EVENT));
}
