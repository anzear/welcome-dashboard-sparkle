/**
 * PATHWAY VALIDATION CHECKLIST — single source of truth.
 *
 * Each of the four functions carries ONE status, picked from its own ladder:
 *   positions 1-2 — not started ("To do" and the department's unassessed state, grey)
 *   positions 3-4 — in progress (amber)
 *   position 5    — positive final state (green, counts toward the bar)
 *   position 6    — "Not fit for function" (red, counts as 0%)
 *
 * The same data backs the "Validation" card on the Pathway Profile and the
 * evaluation checklist inside the Workspace Status card.
 * Prototype persistence is localStorage.
 */

export const VALIDATION_FUNCTIONS = ["R&D", "Procurement", "Sustainability", "Regulatory"] as const;
export type ValidationFunction = (typeof VALIDATION_FUNCTIONS)[number];

export const NOT_FIT_STATUS = "Not fit for function" as const;
export const TO_DO_STATUS = "To do" as const;

/** Department-specific ladders; index 3 is the positive final state, index 4 is "Not fit". */
export const FUNCTION_STATUSES = {
  "R&D": [
    TO_DO_STATUS,
    "Concept identified",
    "Lab/pilot validated",
    "Production-ready",
    NOT_FIT_STATUS,
  ],
  Procurement: [
    TO_DO_STATUS,
    "Candidates scoped",
    "Supplier engaged (samples/quotes)",
    "Supply agreement signed",
    NOT_FIT_STATUS,
  ],
  Sustainability: [
    TO_DO_STATUS,
    "Assessment in progress",
    "Fits roadmap / reduction target",
    "Compliance confirmed",
    NOT_FIT_STATUS,
  ],
  Regulatory: [
    TO_DO_STATUS,
    "Pathway identified",
    "Compliance check in progress",
    "Approved for use",
    NOT_FIT_STATUS,
  ],
} as const satisfies Record<ValidationFunction, readonly string[]>;

export type ValidationStatus = (typeof FUNCTION_STATUSES)[ValidationFunction][number];

export const statusesFor = (fn: ValidationFunction): readonly ValidationStatus[] =>
  FUNCTION_STATUSES[fn];

/** Position 1 — "To do", nothing picked up yet. */
export const initialStatus = (fn: ValidationFunction): ValidationStatus => FUNCTION_STATUSES[fn][0];

/** Position 1 — nothing started yet. */
export const isNotStartedStatus = (fn: ValidationFunction, status: ValidationStatus) =>
  status === FUNCTION_STATUSES[fn][0];

/** Position 4 — the positive final state that counts as confirmed. */
export const finalStatus = (fn: ValidationFunction): ValidationStatus => FUNCTION_STATUSES[fn][3];


/** Who set the status, and when. */
export type FunctionState = { status: ValidationStatus; by: string; date: string };
export type ValidationChecklist = Partial<Record<ValidationFunction, FunctionState>>;

export const VALIDATION_CURRENT_USER = "A. Novak";

/** Mock starting point: one confirmed, two mid-progress, one not fit (25%). */
export const MOCK_CHECKLIST: ValidationChecklist = {
  "R&D": { status: "Production-ready", by: "K. Brandt", date: "4 Sept 2026" },
  Procurement: { status: "Supplier engaged (samples/quotes)", by: "A. Vermeer", date: "9 Sept 2026" },
  Sustainability: { status: "Fits roadmap / reduction target", by: "M. Feld", date: "11 Sept 2026" },
  Regulatory: { status: NOT_FIT_STATUS, by: "L. Haas", date: "15 Sept 2026" },
};

export const pathwayValidationStorageKey = (topic: string | undefined, pathwayId: string | number) =>
  `pathway-validation-confirmations:${topic || "default"}:${pathwayId}`;

export const VALIDATION_CHANGED_EVENT = "pathway-validation-checklist-changed";

const isStatus = (value: unknown, fn: ValidationFunction): value is ValidationStatus =>
  typeof value === "string" && (FUNCTION_STATUSES[fn] as readonly string[]).includes(value);

/**
 * Migrate older shapes: previous Jira-style stages and checkbox pairs map onto
 * the new ladder by position where possible.
 */
const LEGACY_POSITIONS: Record<string, number> = {
  "In progress": 2,
  Tested: 3,
  "Suppliers engaged": 3,
  "Data reviewed": 3,
  "Compliance reviewed": 3,
  Approved: 4,
  "Suppliers confirmed": 4,
  Cleared: 4,
  "Not assessed": 1,
  "No supplier identified": 1,
};


const migrate = (raw: unknown): ValidationChecklist => {
  if (!raw || typeof raw !== "object") return {};
  const out: ValidationChecklist = {};
  for (const fn of VALIDATION_FUNCTIONS) {
    const value = (raw as Record<string, unknown>)[fn];
    if (!value || typeof value !== "object") continue;
    const record = value as Record<string, unknown>;
    const by = typeof record.by === "string" ? record.by : VALIDATION_CURRENT_USER;
    const date = typeof record.date === "string" ? record.date : todayLabel();

    if (isStatus(record.status, fn)) {
      out[fn] = { status: record.status, by, date };
      continue;
    }

    if (typeof record.status === "string" && record.status in LEGACY_POSITIONS) {
      out[fn] = { status: FUNCTION_STATUSES[fn][LEGACY_POSITIONS[record.status]], by, date };
      continue;
    }

    if (typeof record.by === "string" && typeof record.date === "string") {
      out[fn] = { status: finalStatus(fn), by, date };
      continue;
    }

    const stamps = Object.values(record).filter(
      (sub): sub is { by: string; date: string } =>
        !!sub && typeof sub === "object" && typeof (sub as { by?: unknown }).by === "string",
    );
    if (stamps.length === 0) continue;
    const latest = stamps[stamps.length - 1];
    out[fn] = {
      status: stamps.length >= 2 ? finalStatus(fn) : FUNCTION_STATUSES[fn][2],
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

/** Set one function's status; records the current user and today's date. */
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
): ValidationStatus => checklist[fn]?.status ?? initialStatus(fn);

/** Confirmed only at position 4. "Not fit for function" is never confirmed. */
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

/** Grey while not started, amber mid-progress, green at the final state, red for "Not fit". */
export function validationStatusClass(fn: ValidationFunction, status: ValidationStatus): string {
  if (status === NOT_FIT_STATUS) return "bg-red-500/10 text-red-600 border-red-500/30";
  if (status === finalStatus(fn)) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
  if (isNotStartedStatus(fn, status)) return "bg-muted text-muted-foreground border-border";

  return "bg-amber-500/10 text-amber-600 border-amber-500/30";
}
