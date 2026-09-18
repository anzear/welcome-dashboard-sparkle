/**
 * PATHWAY VALIDATION CHECKLIST — single source of truth.
 *
 * Jira-style: each of the four functions carries ONE status
 * (To do · In progress · Tested · Approved), selected from a dropdown.
 * The same data backs the "Validation" card on the Pathway Profile and the
 * evaluation checklist inside the Workspace Status card.
 *
 * A function counts as CONFIRMED only when its status is "Approved".
 * Prototype persistence is localStorage.
 */

export const VALIDATION_FUNCTIONS = ["R&D", "Procurement", "Sustainability", "Regulatory"] as const;
export type ValidationFunction = (typeof VALIDATION_FUNCTIONS)[number];

export const VALIDATION_STATUSES = ["To do", "In progress", "Tested", "Approved"] as const;
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export const DEFAULT_VALIDATION_STATUS: ValidationStatus = "To do";

/** Who set the status, and when. */
export type FunctionState = { status: ValidationStatus; by: string; date: string };
export type ValidationChecklist = Partial<Record<ValidationFunction, FunctionState>>;

export const VALIDATION_CURRENT_USER = "A. Novak";

/** Mock starting point: R&D and Sustainability approved (2 of 4 → 50%). */
export const MOCK_CHECKLIST: ValidationChecklist = {
  "R&D": { status: "Approved", by: "K. Brandt", date: "4 Sept 2026" },
  Procurement: { status: "In progress", by: "A. Vermeer", date: "9 Sept 2026" },
  Sustainability: { status: "Approved", by: "M. Feld", date: "11 Sept 2026" },
  Regulatory: { status: "To do", by: "A. Novak", date: "1 Sept 2026" },
};

export const pathwayValidationStorageKey = (topic: string | undefined, pathwayId: string | number) =>
  `pathway-validation-confirmations:${topic || "default"}:${pathwayId}`;

export const VALIDATION_CHANGED_EVENT = "pathway-validation-checklist-changed";

const isStatus = (value: unknown): value is ValidationStatus =>
  typeof value === "string" && (VALIDATION_STATUSES as readonly string[]).includes(value);

/**
 * Migrate older shapes:
 *  - { by, date } per function (single confirmation) → Approved
 *  - { "Sub item": { by, date }, ... } → Approved when both ticked, In progress when one
 */
const migrate = (raw: unknown): ValidationChecklist => {
  if (!raw || typeof raw !== "object") return {};
  const out: ValidationChecklist = {};
  for (const fn of VALIDATION_FUNCTIONS) {
    const value = (raw as Record<string, unknown>)[fn];
    if (!value || typeof value !== "object") continue;
    const record = value as Record<string, unknown>;

    if (isStatus(record.status)) {
      out[fn] = {
        status: record.status,
        by: typeof record.by === "string" ? record.by : VALIDATION_CURRENT_USER,
        date: typeof record.date === "string" ? record.date : todayLabel(),
      };
      continue;
    }

    if (typeof record.by === "string" && typeof record.date === "string") {
      out[fn] = { status: "Approved", by: record.by, date: record.date };
      continue;
    }

    const stamps = Object.values(record).filter(
      (sub): sub is { by: string; date: string } =>
        !!sub && typeof sub === "object" && typeof (sub as { by?: unknown }).by === "string",
    );
    if (stamps.length === 0) continue;
    const latest = stamps[stamps.length - 1];
    out[fn] = {
      status: stamps.length >= 2 ? "Approved" : "In progress",
      by: latest.by,
      date: latest.date,
    };
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

/** Set one function's status and persist-ready checklist. Free jumps allowed. */
export function setFunctionStatus(
  checklist: ValidationChecklist,
  fn: ValidationFunction,
  status: ValidationStatus,
  by: string,
): ValidationChecklist {
  return { ...checklist, [fn]: { status, by, date: todayLabel() } };
}

export const todayLabel = () =>
  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const functionStatus = (
  checklist: ValidationChecklist,
  fn: ValidationFunction,
): ValidationStatus => checklist[fn]?.status ?? DEFAULT_VALIDATION_STATUS;

/** Confirmed only when Approved. */
export const isFunctionConfirmed = (checklist: ValidationChecklist, fn: ValidationFunction) =>
  functionStatus(checklist, fn) === "Approved";

export function functionConfirmation(
  checklist: ValidationChecklist,
  fn: ValidationFunction,
): { by: string; date: string } | null {
  const state = checklist[fn];
  if (!state || state.status !== "Approved") return null;
  return { by: state.by, date: state.date };
}

export const countConfirmedFunctions = (checklist: ValidationChecklist) =>
  VALIDATION_FUNCTIONS.filter((fn) => isFunctionConfirmed(checklist, fn)).length;

/** Chip styling per status, Jira-like. */
export const VALIDATION_STATUS_CLASS: Record<ValidationStatus, string> = {
  "To do": "bg-muted text-muted-foreground border-border",
  "In progress": "bg-blue-500/10 text-blue-600 border-blue-500/30",
  Tested: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  Approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
};
