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

/**
 * Department-specific stages. Every function starts at "To do" / "In progress";
 * the last two stages are specific to that function, and the FINAL stage is the
 * one that counts as confirmed.
 */
export const FUNCTION_STATUSES = {
  "R&D": ["To do", "In progress", "Tested", "Approved"],
  Procurement: ["To do", "In progress", "Suppliers engaged", "Suppliers confirmed"],
  Sustainability: ["To do", "In progress", "Data reviewed", "Approved"],
  Regulatory: ["To do", "In progress", "Compliance reviewed", "Cleared"],
} as const satisfies Record<ValidationFunction, readonly string[]>;

export type ValidationStatus =
  (typeof FUNCTION_STATUSES)[ValidationFunction][number];

export const DEFAULT_VALIDATION_STATUS = "To do" as const;

/** The stage that counts as confirmed for a given function. */
export const finalStatus = (fn: ValidationFunction): ValidationStatus => {
  const stages = FUNCTION_STATUSES[fn];
  return stages[stages.length - 1];
};

export const statusesFor = (fn: ValidationFunction): readonly ValidationStatus[] =>
  FUNCTION_STATUSES[fn];

/** Who set the status, and when. */
export type FunctionState = { status: ValidationStatus; by: string; date: string };
export type ValidationChecklist = Partial<Record<ValidationFunction, FunctionState>>;

export const VALIDATION_CURRENT_USER = "A. Novak";

/** Mock starting point: R&D and Sustainability approved (2 of 4 → 50%). */
export const MOCK_CHECKLIST: ValidationChecklist = {
  "R&D": { status: "Approved", by: "K. Brandt", date: "4 Sept 2026" },
  Procurement: { status: "Suppliers engaged", by: "A. Vermeer", date: "9 Sept 2026" },
  Sustainability: { status: "Data reviewed", by: "M. Feld", date: "11 Sept 2026" },
  Regulatory: { status: "To do", by: "A. Novak", date: "1 Sept 2026" },
};

export const pathwayValidationStorageKey = (topic: string | undefined, pathwayId: string | number) =>
  `pathway-validation-confirmations:${topic || "default"}:${pathwayId}`;

export const VALIDATION_CHANGED_EVENT = "pathway-validation-checklist-changed";

const isStatus = (value: unknown, fn: ValidationFunction): value is ValidationStatus =>
  typeof value === "string" && (FUNCTION_STATUSES[fn] as readonly string[]).includes(value);

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

    if (isStatus(record.status, fn)) {
      out[fn] = {
        status: record.status,
        by: typeof record.by === "string" ? record.by : VALIDATION_CURRENT_USER,
        date: typeof record.date === "string" ? record.date : todayLabel(),
      };
      continue;
    }

    if (typeof record.by === "string" && typeof record.date === "string") {
      out[fn] = { status: finalStatus(fn), by: record.by, date: record.date };
      continue;
    }

    const stamps = Object.values(record).filter(
      (sub): sub is { by: string; date: string } =>
        !!sub && typeof sub === "object" && typeof (sub as { by?: unknown }).by === "string",
    );
    if (stamps.length === 0) continue;
    const latest = stamps[stamps.length - 1];
    out[fn] = {
      status: stamps.length >= 2 ? finalStatus(fn) : "In progress",
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

/** Confirmed only at the function's final stage. */
export const isFunctionConfirmed = (checklist: ValidationChecklist, fn: ValidationFunction) =>
  functionStatus(checklist, fn) === finalStatus(fn);

export function functionConfirmation(
  checklist: ValidationChecklist,
  fn: ValidationFunction,
): { by: string; date: string } | null {
  const state = checklist[fn];
  if (!state || state.status !== finalStatus(fn)) return null;
  return { by: state.by, date: state.date };
}

export const countConfirmedFunctions = (checklist: ValidationChecklist) =>
  VALIDATION_FUNCTIONS.filter((fn) => isFunctionConfirmed(checklist, fn)).length;

/** Chip styling, Jira-like: To do grey, In progress blue, mid stage amber, final green. */
export function validationStatusClass(fn: ValidationFunction, status: ValidationStatus): string {
  if (status === "To do") return "bg-muted text-muted-foreground border-border";
  if (status === "In progress") return "bg-blue-500/10 text-blue-600 border-blue-500/30";
  if (status === finalStatus(fn)) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
  return "bg-amber-500/10 text-amber-600 border-amber-500/30";
}
