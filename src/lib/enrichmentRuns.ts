/**
 * Enrichment run tracking (data layer only — no UI in this step).
 *
 * Runs are APPEND-ONLY: a completed run record is never updated or deleted.
 * A pathway has many runs per enrichment type and all of them are kept.
 *
 * items_found semantics (must never be rendered identically):
 *   0    -> the run succeeded and genuinely found nothing
 *   null -> the run produced no count (failed, queued, or still running)
 */

export type EnrichmentType = "companies" | "patents" | "papers" | "indicators";

export type EnrichmentRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "completed_with_errors"
  | "failed";

export type EnrichmentTriggerMode = "single" | "bulk";

export interface EnrichmentRun {
  run_id: string;
  pathway_id: string;
  enrichment_type: EnrichmentType;
  status: EnrichmentRunStatus;
  triggered_by: string;
  triggered_at: string;
  completed_at: string | null;
  trigger_mode: EnrichmentTriggerMode;
  bulk_job_id: string | null;
  items_found: number | null;
  items_new: number | null;
  items_reconfirmed: number | null;
  error_message: string | null;
}

const STORAGE_KEY = "vcg.enrichmentRuns.v1";
export const ENRICHMENT_RUNS_EVENT = "enrichmentRunsChanged";

const uuid = (): string => {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {}
  return `run-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
};

/* ------------------------------------------------------------------ */
/* Mock seed data — covers every status and the required edge cases.   */
/* ------------------------------------------------------------------ */

const U_BRANDT = "user-k-brandt";
const U_ROSSI = "user-m-rossi";
const U_WEBER = "user-a-weber";

export const MOCK_ENRICHMENT_RUNS: EnrichmentRun[] = [
  // pathway-corn-lactic: healthy history across types, plus a bulk job.
  {
    run_id: "11111111-1111-4111-8111-000000000001",
    pathway_id: "pathway-corn-lactic",
    enrichment_type: "companies",
    status: "completed",
    triggered_by: U_BRANDT,
    triggered_at: "2026-08-04T08:12:00.000Z",
    completed_at: "2026-08-04T08:14:22.000Z",
    trigger_mode: "single",
    bulk_job_id: null,
    items_found: 24,
    items_new: 6,
    items_reconfirmed: 18,
    error_message: null,
  },
  {
    run_id: "11111111-1111-4111-8111-000000000002",
    pathway_id: "pathway-corn-lactic",
    enrichment_type: "companies",
    status: "completed",
    triggered_by: U_BRANDT,
    triggered_at: "2026-09-02T07:40:00.000Z",
    completed_at: "2026-09-02T07:43:05.000Z",
    trigger_mode: "bulk",
    bulk_job_id: "bulk-2026-09-02-a",
    items_found: 27,
    items_new: 3,
    items_reconfirmed: 24,
    error_message: null,
  },
  {
    run_id: "11111111-1111-4111-8111-000000000003",
    pathway_id: "pathway-corn-lactic",
    enrichment_type: "patents",
    status: "completed_with_errors",
    triggered_by: U_BRANDT,
    triggered_at: "2026-09-02T07:40:00.000Z",
    completed_at: "2026-09-02T07:46:31.000Z",
    trigger_mode: "bulk",
    bulk_job_id: "bulk-2026-09-02-a",
    items_found: 11,
    items_new: 2,
    items_reconfirmed: 9,
    error_message: "2 of 13 sources timed out; partial results stored.",
  },
  {
    run_id: "11111111-1111-4111-8111-000000000004",
    pathway_id: "pathway-corn-lactic",
    enrichment_type: "indicators",
    status: "running",
    triggered_by: U_ROSSI,
    triggered_at: "2026-09-23T09:58:00.000Z",
    completed_at: null,
    trigger_mode: "single",
    bulk_job_id: null,
    items_found: null,
    items_new: null,
    items_reconfirmed: null,
    error_message: null,
  },

  // pathway-whey-lactic: a successful run followed by a later FAILED run.
  {
    run_id: "22222222-2222-4222-8222-000000000001",
    pathway_id: "pathway-whey-lactic",
    enrichment_type: "papers",
    status: "completed",
    triggered_by: U_ROSSI,
    triggered_at: "2026-07-18T13:02:00.000Z",
    completed_at: "2026-07-18T13:05:44.000Z",
    trigger_mode: "single",
    bulk_job_id: null,
    items_found: 9,
    items_new: 9,
    items_reconfirmed: 0,
    error_message: null,
  },
  {
    run_id: "22222222-2222-4222-8222-000000000002",
    pathway_id: "pathway-whey-lactic",
    enrichment_type: "papers",
    status: "failed",
    triggered_by: U_ROSSI,
    triggered_at: "2026-09-15T10:21:00.000Z",
    completed_at: "2026-09-15T10:21:38.000Z",
    trigger_mode: "single",
    bulk_job_id: null,
    items_found: null,
    items_new: null,
    items_reconfirmed: null,
    error_message: "Upstream literature provider returned HTTP 503.",
  },

  // pathway-glycerol-lactic: succeeded but found nothing (items_found = 0).
  {
    run_id: "33333333-3333-4333-8333-000000000001",
    pathway_id: "pathway-glycerol-lactic",
    enrichment_type: "companies",
    status: "completed",
    triggered_by: U_WEBER,
    triggered_at: "2026-09-02T07:40:00.000Z",
    completed_at: "2026-09-02T07:41:12.000Z",
    trigger_mode: "bulk",
    bulk_job_id: "bulk-2026-09-02-a",
    items_found: 0,
    items_new: 0,
    items_reconfirmed: 0,
    error_message: null,
  },
  {
    run_id: "33333333-3333-4333-8333-000000000002",
    pathway_id: "pathway-glycerol-lactic",
    enrichment_type: "patents",
    status: "queued",
    triggered_by: U_WEBER,
    triggered_at: "2026-09-23T10:20:00.000Z",
    completed_at: null,
    trigger_mode: "single",
    bulk_job_id: null,
    items_found: null,
    items_new: null,
    items_reconfirmed: null,
    error_message: null,
  },

  // pathway-cellulosic-lactic: intentionally has NO runs (zero-run case).
];

/** Pathway deliberately left with zero enrichment runs, for empty-state work. */
export const MOCK_PATHWAY_WITHOUT_RUNS = "pathway-cellulosic-lactic";

/* ------------------------------------------------------------------ */
/* Append-only store                                                  */
/* ------------------------------------------------------------------ */

function persist(runs: EnrichmentRun[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
    window.dispatchEvent(new Event(ENRICHMENT_RUNS_EVENT));
  } catch {}
}

/** Reads all runs, seeding mock data on first use. */
export function readEnrichmentRuns(): EnrichmentRun[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      persist(MOCK_ENRICHMENT_RUNS);
      return [...MOCK_ENRICHMENT_RUNS];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as EnrichmentRun[]) : [];
  } catch {
    return [...MOCK_ENRICHMENT_RUNS];
  }
}

/** All runs for a pathway, newest first. Optionally scoped to one type. */
export function getPathwayEnrichmentRuns(
  pathwayId: string,
  enrichmentType?: EnrichmentType,
): EnrichmentRun[] {
  return readEnrichmentRuns()
    .filter((run) => run.pathway_id === pathwayId)
    .filter((run) => (enrichmentType ? run.enrichment_type === enrichmentType : true))
    .sort((a, b) => b.triggered_at.localeCompare(a.triggered_at));
}

/** Most recent run for a pathway + type, or null when the pathway has none. */
export function getLatestEnrichmentRun(
  pathwayId: string,
  enrichmentType: EnrichmentType,
): EnrichmentRun | null {
  return getPathwayEnrichmentRuns(pathwayId, enrichmentType)[0] ?? null;
}

/** All runs fired from one bulk action. */
export function getBulkJobRuns(bulkJobId: string): EnrichmentRun[] {
  return readEnrichmentRuns()
    .filter((run) => run.bulk_job_id === bulkJobId)
    .sort((a, b) => a.triggered_at.localeCompare(b.triggered_at));
}

/** Appends a new run record. Existing records are never modified. */
export function appendEnrichmentRun(
  run: Omit<EnrichmentRun, "run_id"> & { run_id?: string },
): EnrichmentRun {
  const record: EnrichmentRun = { ...run, run_id: run.run_id ?? uuid() };
  persist([...readEnrichmentRuns(), record]);
  return record;
}

/**
 * Records the outcome of a run as a NEW append-only record; the original
 * queued/running record is left untouched.
 */
export function appendEnrichmentRunOutcome(
  previous: EnrichmentRun,
  outcome: {
    status: Extract<EnrichmentRunStatus, "completed" | "completed_with_errors" | "failed">;
    completed_at: string;
    items_found?: number | null;
    items_new?: number | null;
    items_reconfirmed?: number | null;
    error_message?: string | null;
  },
): EnrichmentRun {
  return appendEnrichmentRun({
    pathway_id: previous.pathway_id,
    enrichment_type: previous.enrichment_type,
    triggered_by: previous.triggered_by,
    triggered_at: previous.triggered_at,
    trigger_mode: previous.trigger_mode,
    bulk_job_id: previous.bulk_job_id,
    status: outcome.status,
    completed_at: outcome.completed_at,
    items_found: outcome.items_found ?? null,
    items_new: outcome.items_new ?? null,
    items_reconfirmed: outcome.items_reconfirmed ?? null,
    error_message: outcome.error_message ?? null,
  });
}

/** True when the run reported a real count (including a genuine zero). */
export function hasItemCount(run: EnrichmentRun): boolean {
  return run.items_found !== null && run.items_found !== undefined;
}
