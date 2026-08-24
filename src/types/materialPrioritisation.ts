export type EntryType = "new_material" | "substitution";

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  new_material: "New material",
  substitution: "Substitution material",
};

/**
 * ROLE — what the material is in the portfolio. Two values only, required on
 * every record. An existing material is one the company already buys and may
 * want to replace; a replacement candidate is a material that could replace one.
 * Company-entered data: never derived, never inferred from other fields.
 */
export type MaterialRole = "existing" | "new";

export const MATERIAL_ROLE_LABEL: Record<MaterialRole, string> = {
  existing: "Existing material",
  new: "Candidate material",
};

/** Short form for dense table cells. */
export const MATERIAL_ROLE_SHORT: Record<MaterialRole, string> = {
  existing: "Existing",
  new: "Candidate",
};

export const MATERIAL_ROLES: MaterialRole[] = ["existing", "new"];

/** Stored/legacy data carries no role. Everything without one is existing. */
export const migrateMaterialRole = (v: unknown): MaterialRole =>
  v === "new" || v === "new_material" ? "new" : "existing";

/** A link only ever joins opposite roles. */
export const oppositeRole = (role: MaterialRole): MaterialRole =>
  role === "existing" ? "new" : "existing";

/** What the link section is called on each side. */
export const LINK_SECTION_LABEL: Record<MaterialRole, string> = {
  existing: "Potential replacements",
  new: "Could replace",
};


/**
 * Legacy entry-type values seen in stored/mock data. Only "drop-in" maps onto
 * a new option; anything else is left empty rather than inferred.
 */
export const migrateEntryType = (v: unknown): EntryType | null => {
  switch (v) {
    case "drop_in":
    case "drop_in_substitute":
      return "substitution";
    case "new_material":
      return "new_material";
    default:
      return null;
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
  not_ordered: "Not requested",
  requested: "Coverage requested",
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
 * no competitor names. The detail sits behind a coverage request.
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

/**
 * THE GATE — two separate acts, kept apart on purpose.
 *
 * A recommendation is what the owner thinks should happen, weighed by a person
 * against the assessment entries. It is never derived, suggested or prefilled
 * from the scores: one weak criterion has to be able to override four strong
 * ones, and an average would hide exactly that override.
 *
 * The outcome is the decision. It can overturn the recommendation, and when it
 * does both stay visible.
 */
export type GateOutcome = "go" | "go_with_conditions" | "hold" | "no_go";

export const GATE_OUTCOMES: GateOutcome[] = ["go", "go_with_conditions", "hold", "no_go"];

export interface GateRecommendation {
  outcome: GateOutcome;
  /** Mandatory. No minimum length, but an empty text blocks the save. */
  text: string;
  author: string;
  date: string;
}

/** One condition attached to a go_with_conditions outcome. */
export interface GateCondition {
  condition_id: string;
  text: string;
  owner: string;
  due_date: string;
  met: boolean;
  /** Set when ticked. Anyone may tick; the person who did is stamped. */
  met_date: string | null;
  met_by: string | null;
}

/** The no-go reason a reopen leaves behind. Never deleted. */
export interface PreviousNoGo {
  reason: string;
  author: string;
  date: string;
}

export interface Material {
  material_id: string;
  customer_material_ids: string[];
  name: string;
  cas_number: string | null;
  material_class: string | null;
  /**
   * What this record is: an existing material, or a new one. Required — every
   * material carries a role, and nothing derives it.
   */
  role: MaterialRole;
  /**
   * Materials of the opposite role this one is linked to. Many-to-many, held on
   * both sides. A link carries no decision and no score.
   */
  linked_material_ids: string[];
  /** Free-text customer tags. Never null — empty array when none. */
  tags: string[];
  /**
   * Product lines the material belongs to. Its own field, separate from Tags,
   * drawn from the controlled workspace list. Empty array = none assigned.
   */
  product_lines: string[];

  application_categories: string[];
  application_areas: string[];
  /** Material strategy. Only meaningful on a new material. */
  entry_type: EntryType | null;

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
  /** Step 1 of the gate. null when nobody has written one yet. */
  recommendation: GateRecommendation | null;
  /** Step 2: who set the current gate status, and when. */
  gate_decided_by: string | null;
  gate_decided_date: string | null;
  /** Only meaningful on go_with_conditions, but kept rather than wiped. */
  gate_conditions: GateCondition[];
  /** Both mandatory on a hold. The event is the reason, the date stops drift. */
  hold_trigger_event: string | null;
  /** Separate from priority_period, and never merged with it. */
  hold_review_date: string | null;
  no_go_reason: string | null;
  /** Survives a reopen so a closed argument is not re-litigated. */
  previous_no_go: PreviousNoGo | null;
  reopened: boolean;
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
  /**
   * Coverage availability. A state VCG sets on the material: our data for it is
   * ready to be taken. It is never derived from the customer's own data and the
   * customer cannot set it. Availability is the exception, not the default.
   */
  coverage_available: boolean;
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
  vcg_computed: "VCG data peek",
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
  role: "company_entered",
  linked_material_ids: "company_entered",

  entry_type: "company_entered",
  tags: "company_entered",
  product_lines: "company_entered",
  application_categories: "company_entered",
  application_areas: "company_entered",
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
  | "tags_change"
  | "recommendation"
  | "gate_outcome"
  | "condition_change"
  | "condition_met"
  | "hold_change"
  | "no_go_reason"
  | "reopen"
  /** A decision document was circulated. Reading is not deciding. */
  | "decision_export";

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
  entry_type: "Material strategy",
  role: "Role",
  linked_material_ids: "Linked materials",

  owner: "Owner",
  priority_period: "Priority period",
  blocker_category: "Blocker",
  cas_number: "CAS number",
  material_class: "Material class",
  tags: "Tags",
  product_lines: "Product line",
  customer_material_ids: "Customer material IDs",
  material_added: "Material added",
  recommendation: "Recommendation",
  gate_condition: "Condition",
  hold_trigger_event: "Hold trigger",
  hold_review_date: "Hold review date",
  no_go_reason: "No-go reason",
  reopen: "Gate reopened",
  decision_export: "Material profile export",
};

/** A material with no gate act recorded yet. Absence, never a default outcome. */
export const EMPTY_GATE = {
  recommendation: null,
  gate_decided_by: null,
  gate_decided_date: null,
  gate_conditions: [],
  hold_trigger_event: null,
  hold_review_date: null,
  no_go_reason: null,
  previous_no_go: null,
  reopened: false,
} satisfies Pick<
  Material,
  | "recommendation"
  | "gate_decided_by"
  | "gate_decided_date"
  | "gate_conditions"
  | "hold_trigger_event"
  | "hold_review_date"
  | "no_go_reason"
  | "previous_no_go"
  | "reopened"
>;

export const GATE_OUTCOME_LABEL: Record<GateOutcome, string> = {
  go: "Go",
  go_with_conditions: "Go with conditions",
  hold: "Hold",
  no_go: "No-go",
};

/** Teams that contribute judgements. */
export type TeamId = "rnd" | "procurement" | "sustainability" | "marketing" | "regulatory";

export interface Contributor {
  user_id: string;
  name: string;
  team: TeamId;
  role: string;
}

export type CriterionKind = "evidence" | "judgement";

/**
 * One assessment criterion. `evidence` criteria are read off data the platform
 * already holds and are never scored by a person. `judgement` criteria take one
 * entry per person, 1..5.
 */
export interface AssessmentCriterion {
  criterion_id: string;
  label: string;
  kind: CriterionKind;
  /** Where an evidence criterion reads from. Absent for judged criteria. */
  source?: "figures" | "vcg";
  helper: string;
  /** What the ends of the 1–5 scale mean. Judged criteria only. */
  anchors?: string;
  /** What the low (1) end of the scale means. Judged criteria only. */
  anchor_low?: string;
  /** What the high (5) end of the scale means. Judged criteria only. */
  anchor_high?: string;
  /** True for a workspace-added criterion. Standard criteria are never custom. */
  custom?: boolean;
  /**
   * Hidden criteria are out of use: gone from entry, columns, ranking, filters
   * and counts. Their recorded entries are never deleted and stay readable.
   */
  hidden?: boolean;
}

/**
 * One person's judgement on one criterion for one material. Stored sparsely: no
 * entry means that person has not assessed it, which is never a recorded score.
 */
export interface AssessmentEntry {
  material_id: string;
  criterion_id: string;
  user_id: string;
  team: TeamId;
  /**
   * 1..5 always. An entry cannot exist without a score and a rationale — there
   * is no abstain, skip or no-view state.
   */
  score: number;
  note: string;
  assessed_at: string;
}

/**
 * How a criterion's entries sit against each other. Counts and spread only —
 * the entries are never averaged into a single score.
 */
export type AssessmentFlag =
  | "not_assessed"
  | "single_view"
  | "aligned"
  | "mixed"
  | "split";

export const ASSESSMENT_FLAG_LABEL: Record<AssessmentFlag, string> = {
  not_assessed: "No entries",
  single_view: "One view",
  aligned: "Aligned",
  mixed: "Mixed",
  split: "Split",
};

export interface AssessmentState {
  flag: AssessmentFlag;
  entries: AssessmentEntry[];
  /** null when nothing has been recorded — never 0. */
  low: number | null;
  high: number | null;
  spread: number | null;
  /** Count of recorded 1–5 scores. */
  scoredCount: number;
  teams: TeamId[];
}


/** Icon-driving file kinds. Mock only — nothing is stored or downloadable. */
export type DocumentFileType = "pdf" | "docx" | "xlsx" | "pptx" | "msg" | "png";

/**
 * Evidence a person put forward behind a judged criterion. Criterion-level and
 * shared: everyone on the material sees every document, whoever uploaded it.
 * Documents are team_judgement — never counted toward a score or coverage.
 */
export interface SupportingDocument {
  document_id: string;
  material_id: string;
  /** One of the three judged criteria. The reference rows take no documents. */
  criterion_id: string;
  filename: string;
  file_type: DocumentFileType;
  /** Mock size string, e.g. "1.4 MB". */
  size: string;
  /** One line on what the document shows. Optional. */
  note: string | null;
  uploaded_by: string;
  uploaded_date: string;
}
