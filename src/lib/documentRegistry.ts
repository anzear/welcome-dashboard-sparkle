/**
 * Central document registry for a material. Every file uploaded anywhere in the
 * material — the general Documents card, a shortlisted pathway, company, patent
 * or paper, or a validation function — is registered here with a source tag, so
 * the Documents card on the Material Profile lists them all.
 *
 * Prototype only: localStorage, no server storage.
 */

export type RegisteredDocument = {
  id: string;
  name: string;
  uploader: string;
  /** Display date, e.g. "12 Sept 2026". */
  date: string;
  /** Where it was uploaded, e.g. "General" or "Pathway · Whey permeate". */
  source: string;
};

export const GENERAL_SOURCE = "General";
export const DOCUMENT_REGISTRY_CHANGED_EVENT = "document-registry-changed";

const STORAGE_KEY = "vcg.documentRegistry";

const todayLabel = () =>
  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Mock files already attached across the material, shown with their source. */
export const MOCK_REGISTRY: RegisteredDocument[] = [
  { id: "ws-doc-1", name: "Lactic-acid-market-scan-2026.pdf", uploader: "K. Brandt", date: "2 Sept 2026", source: GENERAL_SOURCE },
  { id: "ws-doc-2", name: "Internal-substitution-brief.docx", uploader: "A. Novak", date: "8 Sept 2026", source: GENERAL_SOURCE },
  { id: "ws-doc-3", name: "Supplier-longlist.xlsx", uploader: "M. Feld", date: "14 Sept 2026", source: GENERAL_SOURCE },
  { id: "reg-pw-1", name: "Whey-permeate-route-assessment.pdf", uploader: "K. Brandt", date: "5 Sept 2026", source: "Pathway · Whey permeate — Lactic Acid" },
  { id: "reg-co-1", name: "Producer-capacity-overview.xlsx", uploader: "A. Vermeer", date: "9 Sept 2026", source: "Company · Corbion" },
  { id: "reg-pa-1", name: "Patent-family-summary.pdf", uploader: "L. Haas", date: "11 Sept 2026", source: "Patent · EP3456789A1" },
  { id: "reg-pp-1", name: "Fermentation-yield-paper.pdf", uploader: "A. Novak", date: "12 Sept 2026", source: "Paper · Continuous fermentation of lactic acid" },
  { id: "rd-doc-1", name: "Lab-trial-report-Q3.pdf", uploader: "K. Brandt", date: "4 Sept 2026", source: "Status · R&D" },
  { id: "pr-doc-1", name: "Supplier-quotes-comparison.xlsx", uploader: "A. Vermeer", date: "9 Sept 2026", source: "Status · Procurement" },
];

/**
 * Optional second registry (e.g. one pathway) that mirrors uploads made while it
 * is active, so a pathway can show its own tagged document list without losing
 * the material-wide list.
 */
let activeSubKey: string | null = null;

export function setActiveSubRegistry(key: string | null): void {
  activeSubKey = key;
}

const subStorageKey = (key: string) => `${STORAGE_KEY}.sub.${key}`;

export function readSubRegistry(key: string, fallback: RegisteredDocument[] = []): RegisteredDocument[] {
  try {
    const stored = localStorage.getItem(subStorageKey(key));
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as RegisteredDocument[]) : fallback;
  } catch {
    return fallback;
  }
}

export function writeSubRegistry(key: string, documents: RegisteredDocument[]): void {
  try {
    localStorage.setItem(subStorageKey(key), JSON.stringify(documents));
    window.dispatchEvent(new Event(DOCUMENT_REGISTRY_CHANGED_EVENT));
  } catch {}
}

export function readDocumentRegistry(): RegisteredDocument[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return MOCK_REGISTRY;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as RegisteredDocument[]) : MOCK_REGISTRY;
  } catch {
    return MOCK_REGISTRY;
  }
}

function write(documents: RegisteredDocument[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    window.dispatchEvent(new Event(DOCUMENT_REGISTRY_CHANGED_EVENT));
  } catch {}
}

/** Adds uploaded files to the registry with the source they were uploaded from. */
export function registerDocuments(
  names: string[],
  uploader: string,
  source: string,
  ids?: string[],
): RegisteredDocument[] {
  const added = names.map((name, index) => ({
    id: ids?.[index] ?? `reg-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    uploader,
    date: todayLabel(),
    source,
  }));
  const next = [...readDocumentRegistry(), ...added];
  write(next);
  if (activeSubKey) writeSubRegistry(activeSubKey, [...readSubRegistry(activeSubKey), ...added]);
  return added;
}

/** Removes a registry entry — used when a file is deleted at its source. */
export function unregisterDocument(documentId: string): void {
  write(readDocumentRegistry().filter((document) => document.id !== documentId));
  if (activeSubKey) {
    writeSubRegistry(
      activeSubKey,
      readSubRegistry(activeSubKey).filter((document) => document.id !== documentId),
    );
  }
}

