export type EntryType = "substitute_material_source" | "new_material";

export type JourneyStatus =
  | "not_started"
  | "under_evaluation"
  | "in_testing"
  | "qualified"
  | "sourcing"
  | "in_use"
  | "parked"
  | "rejected";

export type ProvenanceOrigin = "ingested" | "computed" | "entered";

export interface FieldProvenance {
  origin: ProvenanceOrigin;
  source: string | null;
  date: string | null;
}

export interface Material {
  material_id: string;
  customer_material_ids: string[];
  name: string;
  cas_number: string | null;
  material_class: string | null;
  customer_material_group: string | null;
  application_categories: string[];
  product_categories: string[];
  entry_type: EntryType;
  annual_volume: number | null;
  unit_price: number | null;
  annual_spend: number | null;
  ghg_emission_factor: number | null;
  ghg_contribution: number | null;
  ghg_boundary: string | null;
  ghg_data_basis: string | null;
  supplier_count: number | null;
  supplier_countries: string[];
  journey_status: JourneyStatus;
  blocker_category: string | null;
  blocker_detail: string | null;
  blocker_date: string | null;
  blocker_condition: string | null;
  owner: string | null;
  priority_selected: boolean;
  priority_period: string | null;
  last_status_change_date: string | null;
  last_status_user: string | null;
  last_change_batch_origin: "baselining" | "real_transition" | null;
  provenance: Record<string, FieldProvenance>;
}

export const JOURNEY_STATUS_LABEL: Record<JourneyStatus, string> = {
  not_started: "Not started",
  under_evaluation: "Under evaluation",
  in_testing: "In testing",
  qualified: "Qualified",
  sourcing: "Sourcing",
  in_use: "In use",
  parked: "Parked",
  rejected: "Rejected",
};

export type MaterialEventType =
  | "status_change"
  | "owner_change"
  | "priority_change"
  | "blocker_set"
  | "field_correction"
  | "score_change";

export type BatchOrigin = "baselining" | "real_transition";

/**
 * One row per change. Never a field on Material — the register holds the current
 * position, the event log holds the decisions that got it there.
 */
export interface MaterialEvent {
  event_id: string;
  material_id: string;
  event_type: MaterialEventType;
  field: string;
  from_value: string | null;
  to_value: string | null;
  reason: string | null;
  blocker_category: string | null;
  blocker_detail: string | null;
  blocker_condition: string | null;
  changed_by: string;
  changed_at: string;
  batch_origin: BatchOrigin;
  batch_id: string | null;
}

export const EVENT_FIELD_LABEL: Record<string, string> = {
  journey_status: "Status",
  owner: "Owner",
  priority_selected: "Priority",
  blocker_category: "Blocker",
  cas_number: "CAS number",
  material_class: "Material class",
  customer_material_group: "Material group",
};

/**
 * One judgement on one question for one material. Stored sparsely: a missing
 * entry means no judgement at all, which is never the same as a recorded 0.
 */
export interface DriverScore {
  material_id: string;
  question_id: string;
  /** -5..+5, or null for a cleared judgement. Never a stand-in for zero. */
  score: number | null;
  note: string | null;
  scored_by: string;
  scored_at: string;
}

/**
 * Counts of judgements, never a composite. All null when nothing is scored —
 * an unscored material has no counts, not counts of zero.
 */
export interface DriverCounts {
  strong_drivers: number | null;
  strong_constraints: number | null;
  scored_count: number | null;
}
