import { useSyncExternalStore } from "react";
import {
  CRITERIA,
  MAX_CUSTOM_CRITERIA,
  STANDARD_JUDGED_IDS,
  anchorLine,
} from "@/config/assessmentCriteria";
import type { AssessmentCriterion } from "@/types/materialPrioritisation";

export interface CriterionSetEvent {
  event_id: string;
  action: "added" | "edited" | "removed" | "hidden" | "restored";
  criterion_id: string;
  label: string;
  detail: string | null;
  changed_by: string;
  changed_at: string;
}

export interface CustomCriterionDraft {
  label: string;
  helper: string;
  anchor_low: string;
  anchor_high: string;
}

/**
 * WORKSPACE CRITERIA SET. One set per workspace, shared by every material — it
 * never varies by material, product line, role or scope segment. Held outside
 * React so the register and the Manage criteria page in settings read and write
 * the same set.
 */
type State = { criteria: AssessmentCriterion[]; events: CriterionSetEvent[] };

let state: State = { criteria: CRITERIA, events: [] };
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const set = (next: State) => {
  state = next;
  emit();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useCriteriaSet = () => useSyncExternalStore(subscribe, () => state, () => state);

export const isStandard = (id: string) => STANDARD_JUDGED_IDS.includes(id);

const log = (
  action: CriterionSetEvent["action"],
  criterion_id: string,
  label: string,
  detail: string | null,
  by: string,
) => ({
  event_id: `cse-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  action,
  criterion_id,
  label,
  detail,
  changed_by: by,
  changed_at: new Date().toISOString(),
});

const find = (id: string) => state.criteria.find((c) => c.criterion_id === id);

/** Hiding is the only way to take a criterion out of use. Nothing is deleted. */
export const hideCriterion = (id: string, by: string) => {
  const c = find(id);
  if (!c || c.kind !== "judgement" || c.hidden) return false;
  set({
    criteria: state.criteria.map((x) => (x.criterion_id === id ? { ...x, hidden: true } : x)),
    events: [
      log("hidden", id, c.label, "Taken out of use. Existing entries kept and readable.", by),
      ...state.events,
    ],
  });
  return true;
};

export const restoreCriterion = (id: string, by: string) => {
  const c = find(id);
  if (!c || !c.hidden) return false;
  set({
    criteria: state.criteria.map((x) => (x.criterion_id === id ? { ...x, hidden: false } : x)),
    events: [log("restored", id, c.label, "Back in use, with every entry intact.", by), ...state.events],
  });
  return true;
};

export const customCriteria = (criteria: AssessmentCriterion[]) =>
  criteria.filter((c) => c.custom);

export const addCustomCriterion = (
  draft: CustomCriterionDraft,
  by: string,
): { ok: boolean; error?: string } => {
  const label = draft.label.trim();
  if (!label) return { ok: false, error: "A name is required." };
  if (customCriteria(state.criteria).length >= MAX_CUSTOM_CRITERIA)
    return { ok: false, error: `A workspace can hold ${MAX_CUSTOM_CRITERIA} custom criteria.` };
  const clash = state.criteria.some(
    (c) => c.label.trim().toLowerCase() === label.toLowerCase(),
  );
  if (clash) return { ok: false, error: "That name is already in use." };

  const criterion: AssessmentCriterion = {
    criterion_id: `crit_${Date.now().toString(36)}`,
    label,
    kind: "judgement",
    custom: true,
    helper: draft.helper.trim(),
    anchor_low: draft.anchor_low.trim() || undefined,
    anchor_high: draft.anchor_high.trim() || undefined,
  };
  criterion.anchors = anchorLine(criterion);

  set({
    criteria: [...state.criteria, criterion],
    events: [
      log("added", criterion.criterion_id, label, "Added to every material, with no entries yet.", by),
      ...state.events,
    ],
  });
  return { ok: true };
};

/** Wording of a custom criterion can change at any time. Entries are untouched. */
export const updateCustomCriterion = (
  id: string,
  draft: CustomCriterionDraft,
  by: string,
): { ok: boolean; error?: string } => {
  const existing = find(id);
  if (!existing || !existing.custom) return { ok: false, error: "Standard criteria cannot be edited." };
  const label = draft.label.trim();
  if (!label) return { ok: false, error: "A name is required." };
  const clash = state.criteria.some(
    (c) => c.criterion_id !== id && c.label.trim().toLowerCase() === label.toLowerCase(),
  );
  if (clash) return { ok: false, error: "That name is already in use." };

  set({
    criteria: state.criteria.map((c) => {
      if (c.criterion_id !== id) return c;
      const next: AssessmentCriterion = {
        ...c,
        label,
        helper: draft.helper.trim(),
        anchor_low: draft.anchor_low.trim() || undefined,
        anchor_high: draft.anchor_high.trim() || undefined,
      };
      next.anchors = anchorLine(next);
      return next;
    }),
    events: [
      log(
        "edited",
        id,
        label,
        existing.label === label ? "Wording changed." : `Renamed from "${existing.label}".`,
        by,
      ),
      ...state.events,
    ],
  });
  return { ok: true };
};

/** Only a custom criterion with no entries at all can be deleted outright. */
export const deleteCustomCriterion = (id: string, by: string, entryCount: number) => {
  const existing = find(id);
  if (!existing || !existing.custom || entryCount > 0) return false;
  set({
    criteria: state.criteria.filter((c) => c.criterion_id !== id),
    events: [log("removed", id, existing.label, "Deleted. It held no entries.", by), ...state.events],
  });
  return true;
};
