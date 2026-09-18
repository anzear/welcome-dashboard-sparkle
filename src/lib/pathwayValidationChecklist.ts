/**
 * PATHWAY VALIDATION CHECKLIST — single source of truth.
 *
 * The same data backs the "Validation" card on the Pathway Profile and the
 * function checklist inside the Workspace Status card. Both read and write this
 * module; there is no second copy. Prototype persistence is localStorage.
 *
 * A function counts as CONFIRMED only when both of its sub-items are ticked.
 * Partial is never partial credit.
 */

export const VALIDATION_FUNCTIONS = ["R&D", "Procurement", "Sustainability", "Regulatory"] as const;
export type ValidationFunction = (typeof VALIDATION_FUNCTIONS)[number];

/** The two sub-items each function carries, in display order. */
export const FUNCTION_SUBITEMS: Record<ValidationFunction, readonly [string, string]> = {
  "R&D": ["Tested", "Approved"],
  Procurement: ["Suppliers engaged", "Suppliers confirmed"],
  Sustainability: ["Data reviewed", "Approved"],
  Regulatory: ["Compliance reviewed", "Cleared"],
};

/** Who ticked a sub-item, and when. Absent means not confirmed. */
export type SubItemConfirmation = { by: string; date: string };
export type FunctionState = Record<string, SubItemConfirmation>;
export type ValidationChecklist = Partial<Record<ValidationFunction, FunctionState>>;

export const VALIDATION_CURRENT_USER = "A. Novak";

/**
 * Mock starting point, shared by both surfaces: R&D and Sustainability fully
 * confirmed (2 of 4 → 50%), Procurement half done, Regulatory untouched.
 */
export const MOCK_CHECKLIST: ValidationChecklist = {
  "R&D": {
    Tested: { by: "K. Brandt", date: "28 Aug 2026" },
    Approved: { by: "K. Brandt", date: "4 Sept 2026" },
  },
  Procurement: {
    "Suppliers engaged": { by: "A. Vermeer", date: "9 Sept 2026" },
  },
  Sustainability: {
    "Data reviewed": { by: "M. Feld", date: "7 Sept 2026" },
    Approved: { by: "M. Feld", date: "11 Sept 2026" },
  },
};

export const pathwayValidationStorageKey = (topic: string | undefined, pathwayId: string | number) =>
  `pathway-validation-confirmations:${topic || "default"}:${pathwayId}`;

export const VALIDATION_CHANGED_EVENT = "pathway-validation-checklist-changed";

/** Legacy shape: one confirmation per function. Fold onto both sub-items. */
const migrate = (raw: unknown): ValidationChecklist => {
  if (!raw || typeof raw !== "object") return {};
  const out: ValidationChecklist = {};
  for (const fn of VALIDATION_FUNCTIONS) {
    const value = (raw as Record<string, unknown>)[fn];
    if (!value || typeof value !== "object") continue;
    const record = value as Record<string, unknown>;
    if (typeof record.by === "string" && typeof record.date === "string") {
      const stamp = { by: record.by, date: record.date };
      const [a, b] = FUNCTION_SUBITEMS[fn];
      out[fn] = { [a]: stamp, [b]: stamp };
      continue;
    }
    const state: FunctionState = {};
    for (const key of FUNCTION_SUBITEMS[fn]) {
      const sub = record[key] as { by?: unknown; date?: unknown } | undefined;
      if (sub && typeof sub.by === "string" && typeof sub.date === "string") {
        state[key] = { by: sub.by, date: sub.date };
      }
    }
    if (Object.keys(state).length > 0) out[fn] = state;
  }
  return out;
};

export function readValidationChecklist(
  topic: string | undefined,
  pathwayId: string | number,
): ValidationChecklist {
  try {
    const stored = localStorage.getItem(pathwayValidationStorageKey(topic, pathwayId));
    if (!stored) return MOCK_CHECKLIST;
    return migrate(JSON.parse(stored));
  } catch {
    return MOCK_CHECKLIST;
  }
}

export function writeValidationChecklist(
  topic: string | undefined,
  pathwayId: string | number,
  next: ValidationChecklist,
): void {
  try {
    localStorage.setItem(pathwayValidationStorageKey(topic, pathwayId), JSON.stringify(next));
    window.dispatchEvent(new Event(VALIDATION_CHANGED_EVENT));
  } catch {}
}

/** Tick or untick one sub-item and persist. Returns the new checklist. */
export function toggleSubItem(
  checklist: ValidationChecklist,
  fn: ValidationFunction,
  subItem: string,
  checked: boolean,
  by: string,
): ValidationChecklist {
  const state: FunctionState = { ...(checklist[fn] ?? {}) };
  if (checked) state[subItem] = { by, date: todayLabel() };
  else delete state[subItem];
  const next: ValidationChecklist = { ...checklist };
  if (Object.keys(state).length === 0) delete next[fn];
  else next[fn] = state;
  return next;
}

export const todayLabel = () =>
  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const subItemsDone = (checklist: ValidationChecklist, fn: ValidationFunction) =>
  FUNCTION_SUBITEMS[fn].filter((sub) => !!checklist[fn]?.[sub]).length;

/** Confirmed only when BOTH sub-items are ticked. No partial credit. */
export const isFunctionConfirmed = (checklist: ValidationChecklist, fn: ValidationFunction) =>
  subItemsDone(checklist, fn) === FUNCTION_SUBITEMS[fn].length;

/** The confirmer and the most recent of the two sub-item dates. */
export function functionConfirmation(
  checklist: ValidationChecklist,
  fn: ValidationFunction,
): SubItemConfirmation | null {
  if (!isFunctionConfirmed(checklist, fn)) return null;
  const stamps = FUNCTION_SUBITEMS[fn].map((sub) => checklist[fn]![sub]);
  const latest = stamps.reduce((best, stamp) =>
    new Date(stamp.date).getTime() >= new Date(best.date).getTime() ? stamp : best,
  );
  return latest;
}

export const countConfirmedFunctions = (checklist: ValidationChecklist) =>
  VALIDATION_FUNCTIONS.filter((fn) => isFunctionConfirmed(checklist, fn)).length;
