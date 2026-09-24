// Seeded indicator runs. Append-only mock data: every run is its own immutable
// row, so approving a later run never removes or alters an earlier one.
import type { IndicatorRun, MethodTag, IndicatorSource, ReviewStatus } from "./hitlStore";

const stamp = (day: number, hour: number) => `2026-09-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:30:00.000Z`;

const SOURCES: Record<string, IndicatorSource[]> = {
  feedstock: [
    { url: "https://www.usda.gov/oce/commodity/wasde", label: "USDA WASDE outlook" },
    { url: "https://ec.europa.eu/eurostat/web/agriculture/data", label: "Eurostat agriculture data" },
  ],
  product: [{ url: "https://www.icis.com/explore/commodities/chemicals", label: "ICIS chemical pricing" }],
  market: [{ url: "https://www.oecd.org/industry/ind/", label: "OECD industry statistics" }],
  patents: [{ url: "https://patentscope.wipo.int/", label: "WIPO PATENTSCOPE" }],
};

interface RunSeed {
  run_id: string;
  indicator_id: string;
  indicator_key: string;
  pathway_id: string;
  value: number | string | null;
  null_reason?: string | null;
  unit: string | null;
  method_tag: MethodTag | null;
  model: string;
  prompt_version: string;
  status: ReviewStatus;
  triggered_by: string;
  day: number;
  hour: number;
  reviewed_by?: string | null;
  reviewedDay?: number;
  sources: IndicatorSource[];
}

const runSeeds: RunSeed[] = [
  // iv-002 — five runs across three prompt versions, with a pending run that
  // differs sharply from the approved value.
  { run_id: "ir-001", indicator_id: "iv-002", indicator_key: "feedstock_availability", pathway_id: "pw-001", value: 1100, unit: "kt/yr", method_tag: "estimated", model: "gemini-2.5-flash", prompt_version: "ind-v1.0", status: "rejected", triggered_by: "Anže", day: 2, hour: 9, reviewed_by: "Anže", reviewedDay: 2, sources: SOURCES.feedstock },
  { run_id: "ir-002", indicator_id: "iv-002", indicator_key: "feedstock_availability", pathway_id: "pw-001", value: 1180, unit: "kt/yr", method_tag: "derived", model: "gemini-2.5-flash", prompt_version: "ind-v1.1", status: "rejected", triggered_by: "Anže", day: 5, hour: 10, reviewed_by: "Jon Goriup", reviewedDay: 5, sources: SOURCES.feedstock },
  { run_id: "ir-003", indicator_id: "iv-002", indicator_key: "feedstock_availability", pathway_id: "pw-001", value: 1220, unit: "kt/yr", method_tag: "reported", model: "gemini-2.5-flash", prompt_version: "ind-v1.1", status: "approved", triggered_by: "Jon Goriup", day: 8, hour: 11, reviewed_by: "Jon Goriup", reviewedDay: 8, sources: SOURCES.feedstock },
  { run_id: "ir-004", indicator_id: "iv-002", indicator_key: "feedstock_availability", pathway_id: "pw-001", value: 1250, unit: "kt/yr", method_tag: "reported", model: "gemini-2.5-pro", prompt_version: "ind-v1.2", status: "approved", triggered_by: "Jon Goriup", day: 13, hour: 9, reviewed_by: "Jon Goriup", reviewedDay: 13, sources: SOURCES.feedstock },
  { run_id: "ir-005", indicator_id: "iv-002", indicator_key: "feedstock_availability", pathway_id: "pw-001", value: 2100, unit: "kt/yr", method_tag: "estimated", model: "gemini-2.5-pro", prompt_version: "ind-v1.3", status: "review_pending", triggered_by: "Anže", day: 16, hour: 8, sources: SOURCES.feedstock },
  // iv-002 also carries a human override (entered 6 Sep) superseded when ir-003 was approved.
  // iv-005 — active human override (1520) and a pending run with a different value.
  { run_id: "ir-050", indicator_id: "iv-005", indicator_key: "product_price", pathway_id: "pw-003", value: 1480, unit: "EUR/t", method_tag: "reported", model: "gemini-2.5-flash", prompt_version: "ind-v1.1", status: "approved", triggered_by: "Anže", day: 1, hour: 9, reviewed_by: "Anže", reviewedDay: 1, sources: SOURCES.product },
  { run_id: "ir-051", indicator_id: "iv-005", indicator_key: "product_price", pathway_id: "pw-003", value: 1610, unit: "EUR/t", method_tag: "estimated", model: "gemini-2.5-pro", prompt_version: "ind-v1.3", status: "review_pending", triggered_by: "Jon Goriup", day: 17, hour: 9, sources: SOURCES.product },
  // iv-009 — active human override (3.2) and a pending run returning the identical value.
  { run_id: "ir-060", indicator_id: "iv-009", indicator_key: "market_growth_eu", pathway_id: "pw-003", value: 3.2, unit: "%/yr", method_tag: "reported", model: "gemini-2.5-pro", prompt_version: "ind-v1.3", status: "review_pending", triggered_by: "Anže", day: 17, hour: 10, sources: SOURCES.market },
  // iv-008 — no override, two approved runs in history.
  { run_id: "ir-070", indicator_id: "iv-008", indicator_key: "market_size_global", pathway_id: "pw-003", value: 4100, unit: "EUR m", method_tag: "reported", model: "gemini-2.5-flash", prompt_version: "ind-v1.1", status: "approved", triggered_by: "Anže", day: 3, hour: 9, reviewed_by: "Anže", reviewedDay: 3, sources: SOURCES.market },
  { run_id: "ir-071", indicator_id: "iv-008", indicator_key: "market_size_global", pathway_id: "pw-003", value: 4200, unit: "EUR m", method_tag: "reported", model: "gemini-2.5-pro", prompt_version: "ind-v1.2", status: "approved", triggered_by: "Jon Goriup", day: 12, hour: 9, reviewed_by: "Jon Goriup", reviewedDay: 12, sources: SOURCES.market },
  // iv-006 — an approved run whose value is 0. Never rendered like a null run.
  { run_id: "ir-010", indicator_id: "iv-006", indicator_key: "product_availability", pathway_id: "pw-003", value: 0, unit: "kt/yr", method_tag: "reported", model: "gemini-2.5-pro", prompt_version: "ind-v1.2", status: "approved", triggered_by: "Jon Goriup", day: 11, hour: 12, reviewed_by: "Jon Goriup", reviewedDay: 11, sources: SOURCES.product },
  { run_id: "ir-011", indicator_id: "iv-006", indicator_key: "product_availability", pathway_id: "pw-003", value: 310, unit: "kt/yr", method_tag: "estimated", model: "gemini-2.5-pro", prompt_version: "ind-v1.3", status: "review_pending", triggered_by: "Anže", day: 15, hour: 9, sources: SOURCES.product },
  // iv-007 — approved run with no value found, with the stored reason.
  { run_id: "ir-020", indicator_id: "iv-007", indicator_key: "market_size_eu", pathway_id: "pw-003", value: null, null_reason: "No EU-level market figure published for this product in 2024–2025 sources.", unit: "MEUR", method_tag: null, model: "gemini-2.5-flash", prompt_version: "ind-v1.2", status: "approved", triggered_by: "Jon Goriup", day: 10, hour: 10, reviewed_by: "Jon Goriup", reviewedDay: 10, sources: SOURCES.market },
  // iv-020 — runs exist but none approved yet: value position reads "Awaiting review".
  { run_id: "ir-030", indicator_id: "iv-020", indicator_key: "process_trl", pathway_id: "pw-002", value: 4, unit: "TRL", method_tag: "expert_judgement", model: "gemini-2.5-flash", prompt_version: "ind-v1.1", status: "review_pending", triggered_by: "Anže", day: 4, hour: 9, sources: SOURCES.product },
  { run_id: "ir-031", indicator_id: "iv-020", indicator_key: "process_trl", pathway_id: "pw-002", value: 5, unit: "TRL", method_tag: "expert_judgement", model: "gemini-2.5-pro", prompt_version: "ind-v1.3", status: "review_pending", triggered_by: "Jon Goriup", day: 14, hour: 15, sources: SOURCES.product },
  // Computed count indicator — run history only, no review actions.
  { run_id: "ir-040", indicator_id: "computed:production_ip_count|pw-003", indicator_key: "production_ip_count", pathway_id: "pw-003", value: 2, unit: "patents", method_tag: "summed", model: "gemini-2.5-flash", prompt_version: "ind-v1.1", status: "approved", triggered_by: "Anže", day: 6, hour: 9, reviewed_by: "Anže", reviewedDay: 6, sources: SOURCES.patents },
  { run_id: "ir-041", indicator_id: "computed:production_ip_count|pw-003", indicator_key: "production_ip_count", pathway_id: "pw-003", value: 3, unit: "patents", method_tag: "summed", model: "gemini-2.5-pro", prompt_version: "ind-v1.2", status: "approved", triggered_by: "Jon Goriup", day: 12, hour: 10, reviewed_by: "Jon Goriup", reviewedDay: 12, sources: SOURCES.patents },
  { run_id: "ir-042", indicator_id: "computed:production_ip_count|pw-003", indicator_key: "production_ip_count", pathway_id: "pw-003", value: 3, unit: "patents", method_tag: "summed", model: "gemini-2.5-pro", prompt_version: "ind-v1.3", status: "review_pending", triggered_by: "Anže", day: 16, hour: 11, sources: SOURCES.patents },
];

export const seedIndicatorRuns: IndicatorRun[] = runSeeds.map(seed => {
  const triggered_at = stamp(seed.day, seed.hour);
  const reviewed_at = seed.reviewedDay ? stamp(seed.reviewedDay, seed.hour + 2) : null;
  return {
    id: seed.run_id, created_at: triggered_at, updated_at: reviewed_at ?? triggered_at,
    status_changed_at: reviewed_at ?? triggered_at, last_actor: seed.reviewed_by ?? seed.triggered_by, trace_id: null,
    run_id: seed.run_id, indicator_id: seed.indicator_id, indicator_key: seed.indicator_key, pathway_id: seed.pathway_id,
    value: seed.value, null_reason: seed.value === null ? seed.null_reason ?? null : null,
    unit: seed.unit, method_tag: seed.method_tag, sources: seed.sources,
    model: seed.model, prompt_version: seed.prompt_version, status: seed.status,
    reviewed_by: seed.reviewed_by ?? null, reviewed_at,
    triggered_by: seed.triggered_by, triggered_at,
  };
});
