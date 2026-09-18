/**
 * Per-function documents and notes for the pathway validation checklist.
 * Shared store, so the Workspace Evaluation checklist and the Pathway Profile
 * Validation card show the same attachments and notes. Prototype: localStorage.
 */
import type { ItemDocument } from "@/components/materialRegister/itemDocuments";
import { registerDocuments, unregisterDocument } from "./documentRegistry";
import { VALIDATION_FUNCTIONS, todayLabel, type ValidationFunction } from "./pathwayValidationChecklist";

export type ValidationNote = { id: string; author: string; date: string; text: string };
export type FunctionExtras = { documents: ItemDocument[]; notes: ValidationNote[] };
export type ValidationExtras = Partial<Record<ValidationFunction, FunctionExtras>>;

export const VALIDATION_EXTRAS_CHANGED_EVENT = "pathway-validation-extras-changed";

const storageKey = (topic: string | undefined, pathwayId: string | number) =>
  `pathway-validation-extras:${topic || "default"}:${pathwayId}`;

/** Mock starting point so the row controls can be reviewed with real-looking data. */
export const MOCK_EXTRAS: ValidationExtras = {
  "R&D": {
    documents: [{ id: "rd-doc-1", name: "Lab-trial-report-Q3.pdf", uploader: "K. Brandt", date: "4 Sept 2026" }],
    notes: [
      {
        id: "rd-note-1",
        author: "K. Brandt",
        date: "4 Sept 2026",
        text: "Pilot batches hit spec on all three runs; ready for production trial.",
      },
    ],
  },
  Procurement: {
    documents: [{ id: "pr-doc-1", name: "Supplier-quotes-comparison.xlsx", uploader: "A. Vermeer", date: "9 Sept 2026" }],
    notes: [],
  },
  Regulatory: {
    documents: [],
    notes: [
      {
        id: "rg-note-1",
        author: "L. Haas",
        date: "15 Sept 2026",
        text: "Food-contact clearance missing for the EU market — blocking for this application.",
      },
    ],
  },
};

const empty: FunctionExtras = { documents: [], notes: [] };

export function readValidationExtras(
  topic: string | undefined,
  pathwayId: string | number,
): ValidationExtras {
  try {
    const stored = localStorage.getItem(storageKey(topic, pathwayId));
    if (!stored) return MOCK_EXTRAS;
    const parsed = JSON.parse(stored) as ValidationExtras;
    const out: ValidationExtras = {};
    for (const fn of VALIDATION_FUNCTIONS) {
      const value = parsed?.[fn];
      out[fn] = {
        documents: Array.isArray(value?.documents) ? value!.documents : [],
        notes: Array.isArray(value?.notes) ? value!.notes : [],
      };
    }
    return out;
  } catch {
    return MOCK_EXTRAS;
  }
}

export function writeValidationExtras(
  topic: string | undefined,
  pathwayId: string | number,
  next: ValidationExtras,
): void {
  try {
    localStorage.setItem(storageKey(topic, pathwayId), JSON.stringify(next));
    window.dispatchEvent(new Event(VALIDATION_EXTRAS_CHANGED_EVENT));
  } catch {}
}

export const extrasFor = (extras: ValidationExtras, fn: ValidationFunction): FunctionExtras =>
  extras[fn] ?? empty;

export function addFunctionDocuments(
  extras: ValidationExtras,
  fn: ValidationFunction,
  names: string[],
  uploader: string,
): ValidationExtras {
  const current = extrasFor(extras, fn);
  // Uploads here also land in the material-wide registry, tagged with the function.
  const created = registerDocuments(names, uploader, `Validation · ${fn}`);
  return {
    ...extras,
    [fn]: { ...current, documents: [...current.documents, ...created] },
  };
}

export function removeFunctionDocument(
  extras: ValidationExtras,
  fn: ValidationFunction,
  documentId: string,
): ValidationExtras {
  const current = extrasFor(extras, fn);
  return {
    ...extras,
    [fn]: { ...current, documents: current.documents.filter((doc) => doc.id !== documentId) },
  };
}

export function addFunctionNote(
  extras: ValidationExtras,
  fn: ValidationFunction,
  text: string,
  author: string,
): ValidationExtras {
  const current = extrasFor(extras, fn);
  return {
    ...extras,
    [fn]: {
      ...current,
      notes: [
        ...current.notes,
        { id: `vnote-${Date.now()}`, author, date: todayLabel(), text: text.trim() },
      ],
    },
  };
}

export function removeFunctionNote(
  extras: ValidationExtras,
  fn: ValidationFunction,
  noteId: string,
): ValidationExtras {
  const current = extrasFor(extras, fn);
  return { ...extras, [fn]: { ...current, notes: current.notes.filter((note) => note.id !== noteId) } };
}
