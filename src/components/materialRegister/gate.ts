import type { GateCondition, GateOutcome, JourneyStatus, Material } from "@/types/materialPrioritisation";

/**
 * Gate helpers. Everything here reads the recorded gate — nothing derives an
 * outcome, ranks the five statuses, or turns them into a number. They are
 * categories, and a category has no order.
 */

export const todayIso = () => new Date().toISOString().slice(0, 10);

/** A date in the past. A missing date is never overdue — it is simply unset. */
export const datePassed = (date: string | null, now: string = todayIso()) =>
  date !== null && date < now;

export const overdueConditions = (m: Material): GateCondition[] =>
  m.journey_status === "go_with_conditions"
    ? m.gate_conditions.filter((c) => !c.met && datePassed(c.due_date))
    : [];

export const hasOverdueCondition = (m: Material) => overdueConditions(m).length > 0;

export const holdReviewOverdue = (m: Material) =>
  m.journey_status === "hold" && datePassed(m.hold_review_date);

/**
 * True when every condition is met. This never flips the gate on its own — it
 * only earns the owner a prompt. Flipping a gate is a decision.
 */
export const allConditionsMet = (m: Material) =>
  m.journey_status === "go_with_conditions" &&
  m.gate_conditions.length > 0 &&
  m.gate_conditions.every((c) => c.met);

export interface GateFlag {
  id: "overdue_condition" | "hold_review" | "conditions_complete" | "reopened";
  label: string;
  tone: "warn" | "info";
}

/** Visual flags only. No notifications, no reminders, no email. */
export const gateFlags = (m: Material): GateFlag[] => {
  const flags: GateFlag[] = [];
  const overdue = overdueConditions(m);
  if (overdue.length > 0) {
    flags.push({
      id: "overdue_condition",
      label: `${overdue.length} condition${overdue.length === 1 ? "" : "s"} overdue`,
      tone: "warn",
    });
  }
  if (holdReviewOverdue(m)) flags.push({ id: "hold_review", label: "Hold review overdue", tone: "warn" });
  if (allConditionsMet(m))
    flags.push({
      id: "conditions_complete",
      label: `All ${m.gate_conditions.length} conditions met`,
      tone: "info",
    });
  if (m.reopened) flags.push({ id: "reopened", label: "Reopened", tone: "info" });
  return flags;
};

/** Only the material's owner writes the recommendation or sets the outcome. */
export const canSetGate = (m: Material, userName: string) =>
  m.owner !== null && m.owner === userName;

export const gateLockNote = (m: Material) =>
  m.owner === null
    ? "Assign an owner to set the gate."
    : `Only ${m.owner} can set the gate for this material.`;

/** What each outcome must carry before it can be saved. */
export const outcomeBlockers = (
  outcome: GateOutcome,
  draft: {
    conditions: GateCondition[];
    holdTrigger: string;
    holdReview: string;
    noGoReason: string;
  },
): string[] => {
  const blockers: string[] = [];
  if (outcome === "go_with_conditions") {
    if (draft.conditions.length === 0) blockers.push("Add at least one condition.");
    if (draft.conditions.some((c) => !c.text.trim())) blockers.push("Every condition needs text.");
    if (draft.conditions.some((c) => !c.due_date)) blockers.push("Every condition needs a due date.");
    if (draft.conditions.some((c) => !c.owner)) blockers.push("Every condition needs an owner.");
  }
  if (outcome === "hold") {
    if (!draft.holdTrigger.trim()) blockers.push("State what has to happen.");
    if (!draft.holdReview) blockers.push("Set a review date.");
  }
  if (outcome === "no_go" && !draft.noGoReason.trim()) blockers.push("State the reason.");
  return blockers;
};

/** The gate status an outcome sets. The two vocabularies line up one-to-one. */
export const statusForOutcome = (o: GateOutcome): JourneyStatus => o;

export const formatDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d.length > 10 ? d : `${d}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};
