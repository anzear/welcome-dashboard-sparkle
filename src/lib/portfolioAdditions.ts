/**
 * Materials added to the Material Portfolio from the dashboard.
 *
 * The register itself holds its rows in memory only. Anything added from the
 * dashboard is parked here so the register picks it up as soon as it mounts.
 * This carries the portfolio path only — a coverage request is a different act
 * and is never written here.
 */
import type { Material, MaterialRole } from "@/types/materialPrioritisation";
import { blankMaterial, provenanceOf } from "@/components/materialRegister/materialEntry";

export const PORTFOLIO_ADDITIONS_KEY = "material_portfolio_additions";
export const PORTFOLIO_ADDITIONS_EVENT = "materialPortfolioUpdated";

export interface PortfolioAddition {
  name: string;
  /** Legacy: older records may carry alternative names. No longer collected. */
  synonyms?: string;
  role: MaterialRole;
  added_at: number;
}

export function readPortfolioAdditions(): PortfolioAddition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(PORTFOLIO_ADDITIONS_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((r) => r && typeof r.name === "string" && r.name.trim() !== "");
  } catch {
    return [];
  }
}

export function addPortfolioAddition(entry: Omit<PortfolioAddition, "added_at">): boolean {
  const current = readPortfolioAdditions();
  const name = entry.name.trim();
  if (current.some((c) => c.name.toLowerCase() === name.toLowerCase())) return false;
  const next = [...current, { ...entry, name, added_at: Date.now() }];
  try {
    window.localStorage.setItem(PORTFOLIO_ADDITIONS_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  window.dispatchEvent(new CustomEvent(PORTFOLIO_ADDITIONS_EVENT, { detail: { name } }));
  return true;
}

/**
 * Projects the stored additions into register rows. Only name, synonyms and
 * role are known — everything else is filled in later inside the portfolio.
 */
export function portfolioAdditionRows(taken: Material[]): Material[] {
  const additions = readPortfolioAdditions();
  if (additions.length === 0) return [];
  const seen = new Set(taken.map((m) => m.name.toLowerCase()));
  let max = 0;
  taken.forEach((m) => {
    const n = Number(m.material_id.replace(/\D/g, ""));
    if (Number.isFinite(n) && n > max) max = n;
  });
  const rows: Material[] = [];
  additions.forEach((a) => {
    if (seen.has(a.name.toLowerCase())) return;
    seen.add(a.name.toLowerCase());
    max += 1;
    const entered = provenanceOf("entered", "Added from dashboard");
    rows.push({
      ...blankMaterial(null, a.role),
      material_id: `MAT-${String(max).padStart(4, "0")}`,
      name: a.name,
      customer_material_ids: (a.synonyms ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      provenance: { name: entered, role: entered },
    });
  });
  return rows;
}
