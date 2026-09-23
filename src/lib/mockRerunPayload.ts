// Prototype-only re-run payload. In a real system these items arrive from the
// enrichment pipeline; here they are seeded so one click demonstrates every
// merge branch.
//
// Companies (Prompt 50): a wholly new company, a known company gaining a second
// role, a known approved match gaining one new node link, a known match returned
// unchanged, an existing match left out of the payload, and a rejected match
// returned by the payload to show it does not move.
//
// Papers and patents keep the Prompt 45 behaviour.
import type { CompanyRole, EnrichmentType, PathwayNodePosition } from "@/lib/hitlStore";

export type MergeableEnrichmentType = Extract<EnrichmentType, "companies" | "patents" | "papers">;

export interface PayloadNodeLink { node_type: PathwayNodePosition; node_value: string }
export interface PayloadRoleMatch { role: CompanyRole; nodes: PayloadNodeLink[] }

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
  /** Companies only: one entry per role the payload reports, with its node links. */
  matches?: PayloadRoleMatch[];
}

type PathwayPayloads = Partial<Record<MergeableEnrichmentType, RerunPayloadItem[]>>;

const PW001 = {
  feedstock: "Wheat straw",
  process: "Steam explosion and enzymatic hydrolysis",
  product: "Cellulosic ethanol",
};

export const rerunPayloads: Record<string, PathwayPayloads> = {
  "pw-001": {
    companies: [
      // Known company: feedstock supplier match returned unchanged, plus a
      // product manufacturer role it does not yet hold.
      {
        identifier: "PL-330192", label: "Vistula Straw Collective",
        matches: [
          { role: "feedstock_supplier", nodes: [{ node_type: "feedstock", node_value: PW001.feedstock }] },
          { role: "product_manufacturer", nodes: [{ node_type: "product", node_value: PW001.product }] },
        ],
      },
      // Known approved match gaining one new node link.
      {
        identifier: "PL-887311", label: "Wisła Enzyme Works",
        matches: [
          {
            role: "product_manufacturer",
            nodes: [
              { node_type: "product", node_value: PW001.product },
              { node_type: "process_technology", node_value: PW001.process },
            ],
          },
        ],
      },
      // Rejected match returned by the payload. It does not move.
      {
        identifier: "DK-482910", label: "Nordic Enzymes",
        matches: [{ role: "feedstock_supplier", nodes: [{ node_type: "feedstock", node_value: PW001.feedstock }] }],
      },
      // Wholly new company.
      {
        identifier: "SE-771203", label: "Vasa Biorefining", website: "https://vasa-biorefining.example",
        country: "Sweden", city: "Vaasa", industry_sector: "Industrial biotechnology",
        matches: [
          {
            role: "product_manufacturer",
            nodes: [
              { node_type: "product", node_value: PW001.product },
              { node_type: "feedstock", node_value: PW001.feedstock },
            ],
          },
        ],
      },
      // PL-661204 (Vistula Logistics) is deliberately absent from the payload.
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
