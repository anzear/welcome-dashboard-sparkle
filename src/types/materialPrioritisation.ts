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
