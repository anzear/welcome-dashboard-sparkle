// Prototype-only enrichment simulation. No network calls, no real pipeline:
// runs advance queued -> running -> resolved on timers inside the mock store.
import type { EnrichmentRun, EnrichmentRunResolution, EnrichmentTriggerMode, EnrichmentType } from "@/lib/hitlStore";

export interface EnrichmentRunnerStore {
  createEnrichmentRun: (input: { pathway_id: string; enrichment_type: EnrichmentType; trigger_mode: EnrichmentTriggerMode; bulk_job_id: string | null }) => EnrichmentRun;
  markEnrichmentRunRunning: (runId: string) => void;
  resolveEnrichmentRun: (runId: string, resolution: EnrichmentRunResolution) => void;
}

export interface StartRunInput {
  pathway_id: string;
  enrichment_type: EnrichmentType;
  trigger_mode: EnrichmentTriggerMode;
  bulk_job_id?: string | null;
}

// Seeded per-pathway outcomes. Most pathways complete normally; these force the
// failure and partial-failure states so the demo always shows them.
type SeededOutcome = "completed" | "completed_with_errors" | "failed" | "empty";
const seededOutcomes: Record<string, Partial<Record<EnrichmentType, SeededOutcome>>> = {
  "pw-003": { patents: "failed" },
  "pw-010": { patents: "failed" },
  "pw-001": { indicators: "completed_with_errors" },
  "pw-002": { companies: "empty" },
  "pw-006": { indicators: "empty" },
};

const errorMessages: Record<EnrichmentType, string> = {
  companies: "Company registry lookup did not respond",
  patents: "Patent source timed out before returning results",
  papers: "Publication index rejected the request",
  indicators: "Indicator source returned an unreadable payload",
};

const randomInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

const buildResolution = (input: StartRunInput): EnrichmentRunResolution => {
  const outcome = seededOutcomes[input.pathway_id]?.[input.enrichment_type] ?? "completed";
  if (outcome === "failed") {
    // Failed runs produce no counts at all: all three stay null, never 0.
    return { status: "failed", items_found: null, items_new: null, items_already_known: null, error_message: errorMessages[input.enrichment_type] };
  }
  if (outcome === "empty") {
    // Success that found nothing: genuinely 0, not null.
    return { status: "completed", items_found: 0, items_new: 0, items_already_known: 0, error_message: null };
  }
  const added = randomInt(0, 6);
  const reconfirmed = randomInt(0, 8);
  return {
    status: outcome === "completed_with_errors" ? "completed_with_errors" : "completed",
    items_found: added + reconfirmed,
    items_new: added,
    items_already_known: reconfirmed,
    error_message: outcome === "completed_with_errors" ? "Some sources could not be read" : null,
  };
};

export function startRun(store: EnrichmentRunnerStore, input: StartRunInput): EnrichmentRun {
  const run = store.createEnrichmentRun({
    pathway_id: input.pathway_id,
    enrichment_type: input.enrichment_type,
    trigger_mode: input.trigger_mode,
    bulk_job_id: input.bulk_job_id ?? null,
  });
  window.setTimeout(() => store.markEnrichmentRunRunning(run.run_id), 800);
  // Randomised 2-4 s so bulk runs finish staggered.
  window.setTimeout(() => store.resolveEnrichmentRun(run.run_id, buildResolution(input)), 800 + randomInt(2000, 4000));
  return run;
}

export const newBulkJobId = () => `bulk-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`;
