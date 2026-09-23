import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  ENRICHMENT_RUNS_EVENT,
  appendEnrichmentRun,
  appendEnrichmentRunOutcome,
  readEnrichmentRuns,
  type EnrichmentRun,
  type EnrichmentType,
} from "@/lib/enrichmentRuns";

const TYPES: { type: EnrichmentType; label: string }[] = [
  { type: "companies", label: "Companies" },
  { type: "patents", label: "Patents" },
  { type: "papers", label: "Papers" },
  { type: "indicators", label: "Indicators" },
];

/** Prototype mapping so mock run states are reachable from the pathway index. */
const MOCK_PATHWAY_IDS = [
  "pathway-corn-lactic",
  "pathway-whey-lactic",
  "pathway-glycerol-lactic",
  "pathway-cellulosic-lactic",
];

export function resolveEnrichmentPathwayId(pathwayId: string, topic?: string): string {
  const index = Number.parseInt(pathwayId, 10);
  if (Number.isFinite(index) && index >= 0 && index < MOCK_PATHWAY_IDS.length) {
    return MOCK_PATHWAY_IDS[index];
  }
  return `pathway:${topic ?? "default"}:${pathwayId}`;
}

const relativeTime = (iso: string): string => {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)} min ago`;
  if (diff < day) return `${Math.floor(diff / hour)} h ago`;
  if (diff < 30 * day) return `${Math.floor(diff / day)} d ago`;
  const months = Math.floor(diff / (30 * day));
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(months / 12)} y ago`;
};

const absoluteTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const isBusy = (run: EnrichmentRun | null): boolean =>
  !!run && (run.status === "queued" || run.status === "running");

interface Props {
  pathwayId: string;
  topic?: string;
  currentUser?: string;
}

export const PathwayEnrichmentPanel: React.FC<Props> = ({ pathwayId, topic, currentUser = "A. Weber" }) => {
  const enrichmentPathwayId = useMemo(() => resolveEnrichmentPathwayId(pathwayId, topic), [pathwayId, topic]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener(ENRICHMENT_RUNS_EVENT, handler);
    return () => window.removeEventListener(ENRICHMENT_RUNS_EVENT, handler);
  }, []);

  /** Newest first; records appended later win when timestamps tie. */
  const pathwayRuns = useMemo(() => {
    const all = readEnrichmentRuns()
      .map((run, index) => ({ run, index }))
      .filter((entry) => entry.run.pathway_id === enrichmentPathwayId);
    all.sort((a, b) =>
      a.run.triggered_at === b.run.triggered_at
        ? b.index - a.index
        : b.run.triggered_at.localeCompare(a.run.triggered_at),
    );
    return all.map((entry) => entry.run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrichmentPathwayId, version]);

  const rows = useMemo(
    () =>
      TYPES.map(({ type, label }) => {
        const runs = pathwayRuns.filter((run) => run.enrichment_type === type);
        const latest = runs[0] ?? null;
        const lastSuccess = runs.find(
          (run) => run.status === "completed" || run.status === "completed_with_errors",
        ) ?? null;
        return { type, label, latest, lastSuccess };
      }),
    [pathwayRuns],
  );

  const mostRecent = pathwayRuns[0] ?? null;

  /** Fires one independent run record per type — never a combined record. */
  const fireRun = useCallback(
    (type: EnrichmentType, bulkJobId: string | null) => {
      const triggeredAt = new Date().toISOString();
      const queued = appendEnrichmentRun({
        pathway_id: enrichmentPathwayId,
        enrichment_type: type,
        status: "queued",
        triggered_by: currentUser,
        triggered_at: triggeredAt,
        completed_at: null,
        trigger_mode: bulkJobId ? "bulk" : "single",
        bulk_job_id: bulkJobId,
        items_found: null,
        items_new: null,
        items_reconfirmed: null,
        error_message: null,
      });

      window.setTimeout(() => {
        appendEnrichmentRun({ ...queued, run_id: undefined as unknown as string, status: "running" });
      }, 700);

      window.setTimeout(() => {
        const found = Math.floor(Math.random() * 12);
        const newItems = found === 0 ? 0 : Math.floor(Math.random() * found);
        appendEnrichmentRunOutcome(queued, {
          status: "completed",
          completed_at: new Date().toISOString(),
          items_found: found,
          items_new: newItems,
          items_reconfirmed: found - newItems,
        });
      }, 2600);
    },
    [currentUser, enrichmentPathwayId],
  );

  const busyTypes = rows.filter((row) => isBusy(row.latest));
  const idleRows = rows.filter((row) => !isBusy(row.latest));
  const allBusy = idleRows.length === 0;

  const runAll = () => {
    if (allBusy) return;
    const bulkJobId = `bulk-${Date.now()}`;
    idleRows.forEach((row) => fireRun(row.type, bulkJobId));
    if (busyTypes.length > 0) {
      toast({
        title: "Run all started",
        description: `Skipped ${busyTypes.map((row) => row.label).join(", ")} — already in progress.`,
      });
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Enrichment</span>
          {mostRecent ? (
            <span
              className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground"
              title={absoluteTime(mostRecent.triggered_at)}
            >
              Last enriched {relativeTime(mostRecent.triggered_at)}
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
              Never enriched
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-6 gap-1 px-2 text-[10px]"
          disabled={allBusy}
          onClick={runAll}
          title={allBusy ? "All enrichment types are already running" : "Fires one run per type"}
        >
          <RefreshCw className="h-3 w-3" />
          Run all
        </Button>
      </div>

      <div className="divide-y divide-border">
        {rows.map(({ type, label, latest, lastSuccess }) => {
          const busy = isBusy(latest);
          return (
            <div key={type} className="grid grid-cols-[120px_1fr_64px] items-center gap-2 px-3 py-2">
              <span className="text-[11px] font-semibold text-foreground">{label}</span>

              <div className="min-w-0">
                {!latest ? (
                  <span className="text-[10px] text-muted-foreground">Not run</span>
                ) : busy ? (
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {latest.status === "queued" ? "Queued" : "Running"}
                    <span title={absoluteTime(latest.triggered_at)}>· started {relativeTime(latest.triggered_at)}</span>
                  </span>
                ) : (
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span title={absoluteTime(latest.triggered_at)} className="text-muted-foreground">
                        {relativeTime(latest.triggered_at)}
                      </span>
                      <span className="text-muted-foreground/50">·</span>
                      {latest.status === "failed" ? (
                        <span className="flex items-center gap-1 font-semibold text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          Failed
                        </span>
                      ) : latest.items_found === 0 ? (
                        <span className="text-foreground">Completed — no results found</span>
                      ) : (
                        <span className="text-foreground">
                          {latest.items_new ?? 0} new · {latest.items_reconfirmed ?? 0} re-confirmed
                        </span>
                      )}
                      {latest.status === "completed_with_errors" && (
                        <span
                          className="flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700"
                          title={latest.error_message ?? "Partial results"}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Partial
                        </span>
                      )}
                    </div>
                    {latest.status === "failed" && (
                      <div className="text-[9px] text-muted-foreground">
                        {latest.error_message}
                        {lastSuccess && (
                          <>
                            {" · "}
                            <span title={absoluteTime(lastSuccess.triggered_at)}>
                              last successful run {relativeTime(lastSuccess.triggered_at)}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn("h-6 gap-1 px-2 text-[10px]")}
                  disabled={busy}
                  onClick={() => fireRun(type, null)}
                  title={
                    busy && latest
                      ? `${latest.status === "queued" ? "Queued" : "Running"} since ${absoluteTime(latest.triggered_at)}`
                      : `Run ${label.toLowerCase()} enrichment`
                  }
                >
                  <Play className="h-3 w-3" />
                  Run
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PathwayEnrichmentPanel;
