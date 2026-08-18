export type EntryType = "drop_in" | "substitution" | "new_material";

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  drop_in: "Drop-in",
  substitution: "Substitution",
  new_material: "New material",
};

/** Legacy entry-type values seen in stored/mock data. */
export const migrateEntryType = (v: unknown): EntryType => {
  switch (v) {
    case "drop_in":
    case "drop_in_substitute":
      return "drop_in";
    case "substitution":
    case "new_substitute":
      return "substitution";
    case "new_material":
    case "new_application":
      return "new_material";
    default:
      return "drop_in";
  }
};

/**
 * What the replacement has to achieve. Every field optional — a requirement the
 * customer has not stated is null, never a zero target.
 */
export interface MaterialRequirements {
  target_volume: number | null;
  price_ceiling: number | null;
  ghg_reduction_target: number | null;
  required_certifications: string[];
  earliest_need_date: string | null;
  notes: string | null;
}

/** Gate status — the decision position, not a workflow stage. */
export type JourneyStatus = "under_evaluation" | "go" | "go_with_conditions" | "hold" | "no_go";

/** Legacy status values seen in stored/mock data. */
export const migrateJourneyStatus = (v: unknown): JourneyStatus => {
  switch (v) {
    case "go":
      return "go";
    case "go_with_conditions":
      return "go_with_conditions";
    case "hold":
    case "parked":
      return "hold";
    case "no_go":
      return "no_go";
    default:
      return "under_evaluation";
  }
};

/**
 * "unknown" is for a field that genuinely holds a value whose origin was never
 * captured. It is NOT the same statement as "no value recorded" — a value with
 * no provenance entry at all is a defect, not a state.
 */
export type ProvenanceOrigin = "ingested" | "computed" | "entered" | "unknown";

export type IntelligenceStatus = "not_ordered" | "requested" | "in_progress" | "delivered";

export const INTELLIGENCE_STATUS_LABEL: Record<IntelligenceStatus, string> = {
  not_ordered: "Not ordered",
  requested: "Requested",
  in_progress: "In progress",
  delivered: "Delivered",
};

export interface FieldProvenance {
  origin: ProvenanceOrigin;
  source: string | null;
  date: string | null;
}

/**
 * VCG signals — three slim computed signals per material. They report whether
 * something exists, never what it is: no pathway names, no supplier identities,
 * no competitor names. The detail sits behind an intelligence order.
 */
export type SubstitutabilityReadiness = "established" | "emerging" | "none_found" | "not_assessed";

export const SUBSTITUTABILITY_LABEL: Record<SubstitutabilityReadiness, string> = {
  established: "Established",
  emerging: "Emerging",
  none_found: "None found",
  not_assessed: "Not assessed",
};

export type CompetitorActivity = "detected" | "none_detected" | "not_assessed";

export const COMPETITOR_ACTIVITY_LABEL: Record<CompetitorActivity, string> = {
  detected: "Detected",
  none_detected: "None detected",
  not_assessed: "Not assessed",
};

/**
 * Suppliers VCG detects who could supply an alternative, capped at the ceiling.
 * `assessed: false` is not zero suppliers — it means VCG has not run the check.
 */
export interface SupplierAvailability {
  value: number | null;
  capped: boolean;
  assessed: boolean;
}

export const SUPPLIER_CEILING = 9;

export const NOT_ASSESSED_SUPPLIERS: SupplierAvailability = { value: null, capped: false, assessed: false };

/** "0" | "3" | "10+" | null when not assessed. Never blank, never a fake 0. */
export const formatSupplierAvailability = (s: SupplierAvailability | undefined): string | null => {
  if (!s || !s.assessed || s.value === null) return null;
  return s.capped ? `${SUPPLIER_CEILING + 1}+` : String(s.value);
};

export interface Material {
  material_id: string;
  customer_material_ids: string[];
  name: string;
  cas_number: string | null;
  material_class: string | null;
  /** Free-text customer tags. Never null — empty array when none. */
  tags: string[];
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
  /** VCG signals. Computed by us, never entered by the client. */
  substitutability_readiness: SubstitutabilityReadiness;
  supplier_availability: SupplierAvailability;
  competitor_activity: CompetitorActivity;
  /** One VCG data date per material, shared by all three signals. */
  vcg_data_date: string | null;
  journey_status: JourneyStatus;
  /** null when no requirement has been stated at all. */
  requirements: MaterialRequirements | null;
  blocker_category: string | null;
  blocker_detail: string | null;
  blocker_date: string | null;
  blocker_condition: string | null;
  owner: string | null;
  /** Non-null means the material is in that period's priority set. Null = not prioritised. */
  priority_period: string | null;
  intelligence_status: IntelligenceStatus;
  intelligence_ordered_date: string | null;
  intelligence_delivered_date: string | null;
  intelligence_scope: string | null;
  last_status_change_date: string | null;
  last_status_user: string | null;
  last_change_batch_origin: "baselining" | "real_transition" | null;
  provenance: Record<string, FieldProvenance>;
}



export const JOURNEY_STATUS_LABEL: Record<JourneyStatus, string> = {
  under_evaluation: "Under evaluation",
  go: "Go",
  go_with_conditions: "Go with conditions",
  hold: "Hold",
  no_go: "No-go",
};

/**
 * Three provenance classes. Every displayed value belongs to exactly one, and a
 * field never changes class. Missing values keep their class and render as an
 * em dash — missing is never zero.
 */
export type ProvenanceClass = "company_entered" | "vcg_computed" | "team_judgement";

export const PROVENANCE_CLASS_LABEL: Record<ProvenanceClass, string> = {
  company_entered: "Company data",
  vcg_computed: "VCG data",
  team_judgement: "Team judgement",
};

/** Fixed field -> class assignment. Anything unlisted is company_entered. */
export const FIELD_PROVENANCE_CLASS: Record<string, ProvenanceClass> = {
  name: "company_entered",
  cas_number: "company_entered",
  customer_material_ids: "company_entered",
  material_class: "vcg_computed",
  annual_volume: "company_entered",
  unit_price: "company_entered",
  annual_spend: "vcg_computed",
  ghg_emission_factor: "company_entered",
  ghg_boundary: "company_entered",
  ghg_data_basis: "company_entered",
  ghg_contribution: "vcg_computed",
  substitutability_readiness: "vcg_computed",
  supplier_availability: "vcg_computed",
  competitor_activity: "vcg_computed",
  owner: "company_entered",
  entry_type: "company_entered",
  tags: "company_entered",
  application_categories: "company_entered",
  product_categories: "company_entered",
  journey_status: "team_judgement",
  driver_score: "team_judgement",
};

export const provenanceClassOf = (field: string): ProvenanceClass =>
  FIELD_PROVENANCE_CLASS[field] ?? "company_entered";

export type MaterialEventType =
  | "status_change"
  | "owner_change"
  | "priority_change"
  | "blocker_set"
  | "field_correction"
  | "score_change"
  | "tags_change";

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
  journey_status: "Gate status",
  entry_type: "Entry type",
  owner: "Owner",
  priority_period: "Priority period",
  blocker_category: "Blocker",
  cas_number: "CAS number",
  material_class: "Material class",
  tags: "Tags",
  customer_material_ids: "Customer material IDs",
  material_added: "Material added",
};

/**
 * One judgement on one question for one material. Stored sparsely: a missing
 * entry means no judgement at all, which is never the same as a recorded 0.
 */
export interface DriverScore {
  material_id: string;
  question_id: string;
  /** 1..5, or null for a cleared judgement. Never a stand-in for zero. */
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
  scored_count: number | null;
}
