// Prototype-only re-run payload. In a real system these items arrive from the
// enrichment pipeline; here they are seeded so one click demonstrates every
// merge branch: new item, match on an Approved record, match on a Rejected
// record, and an existing record deliberately absent from the payload.
import type { EnrichmentType } from "@/lib/hitlStore";

export type MergeableEnrichmentType = Extract<EnrichmentType, "companies" | "patents" | "papers">;

export interface RerunPayloadItem {
  /** Stable identifier: registry_id for companies, external_id for patents and papers. */
  identifier: string;
  label: string;
  /** Only used when the item is genuinely new and has to be inserted. */
  authors_or_assignee?: string | null;
  year?: number | null;
  website?: string | null;
  country?: string | null;
  city?: string | null;
  industry_sector?: string | null;
}

type PathwayPayloads = Partial<Record<MergeableEnrichmentType, RerunPayloadItem[]>>;

export const rerunPayloads: Record<string, PathwayPayloads> = {
  // pw-001 companies — co-009 approved (re-confirm), co-001 rejected (seen again),
  // one new item, and co-010 left out of the payload entirely.
  "pw-001": {
    companies: [
      { identifier: "PL-330192", label: "Vistula Straw Collective" },
      { identifier: "DK-482910", label: "Nordic Enzymes" },
      { identifier: "SE-771203", label: "Vasa Biorefining", website: "https://vasa-biorefining.example", country: "Sweden", city: "Vaasa", industry_sector: "Industrial biotechnology" },
    ],
  },
  // pw-003 papers — pp-101 approved (re-confirm), pp-102 rejected (seen again),
  // one new item, and pp-103 left out of the payload entirely.
  "pw-003": {
    papers: [
      { identifier: "10.1016/j.biortech.2026.44011", label: "Whey-derived lactic acid fermentation at pilot scale" },
      { identifier: "10.1016/j.biortech.2026.44012", label: "Membrane separation of dairy fermentation broths" },
      { identifier: "10.1016/j.biortech.2026.44013", label: "Continuous lactic acid recovery from dairy side streams", authors_or_assignee: "K. Lindqvist, R. Pavlič", year: 2026 },
    ],
  },
};

export const rerunPayloadFor = (pathwayId: string, type: EnrichmentType): RerunPayloadItem[] =>
  type === "indicators" ? [] : rerunPayloads[pathwayId]?.[type as MergeableEnrichmentType] ?? [];

export const hasRerunPayload = (pathwayId: string, type: EnrichmentType): boolean => rerunPayloadFor(pathwayId, type).length > 0;
