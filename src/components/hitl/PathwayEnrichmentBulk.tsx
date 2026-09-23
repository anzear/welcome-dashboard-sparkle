import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { appendEnrichmentRun, appendEnrichmentRunOutcome, getLatestEnrichmentRun, type EnrichmentRun, type EnrichmentType } from "@/lib/enrichmentRuns";
import { cn } from "@/lib/utils";

export const ENRICHMENT_TYPES: EnrichmentType[] = ["companies", "patents", "papers", "indicators"];
export const ENRICHMENT_TYPE_LABELS: Record<EnrichmentType, string> = { companies: "Companies", patents: "Patents", papers: "Papers", indicators: "Indicators" };

type OutcomeStatus = "queued" | "running" | "completed" | "completed_with_errors" | "failed" | "skipped";
type Outcome = { pathway_id: string; enrichment_type: EnrichmentType; status: OutcomeStatus; detail: string | null };
export type BulkJob = { bulk_job_id: string; pathway_ids: string[]; types: EnrichmentType[]; total: number; outcomes: Outcome[] };

const isBusy = (run: EnrichmentRun | null) => run !== null && (run.status === "queued" || run.status === "running");
const jobId = () => `bulk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/* ------------------------------------------------------------------ */
/* Type-selection confirmation modal (bulk and single pathway)         */
/* ------------------------------------------------------------------ */

export function EnrichmentTypeDialog({ pathwayIds, onClose, onConfirm }: { pathwayIds: string[] | null; onClose: () => void; onConfirm: (types: EnrichmentType[]) => void }) {
  const [types, setTypes] = useState<EnrichmentType[]>(ENRICHMENT_TYPES);
  useEffect(() => { if (pathwayIds) setTypes(ENRICHMENT_TYPES); }, [pathwayIds]);
  const count = pathwayIds?.length ?? 0;
  const runs = count * types.length;
  const allSelected = types.length === ENRICHMENT_TYPES.length;
  return <Dialog open={pathwayIds !== null} onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="sm:max-w-md">
    <DialogHeader><DialogTitle>Enrich {count === 1 ? pathwayIds?.[0] : `${count} pathways`}</DialogTitle><DialogDescription>Each pathway and type is recorded as its own enrichment run.</DialogDescription></DialogHeader>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Enrichment types</span>
        <Button variant="link" size="sm" className="h-6 p-0 text-xs" onClick={() => setTypes(allSelected ? [] : ENRICHMENT_TYPES)}>{allSelected ? "Deselect all" : "Select all"}</Button>
      </div>
      <div className="space-y-1.5 rounded-md border p-2">
        {ENRICHMENT_TYPES.map(type => <label key={type} className="flex items-center gap-2 rounded-md p-1.5 text-xs hover:bg-muted">
          <Checkbox checked={types.includes(type)} onCheckedChange={checked => setTypes(current => checked ? [...new Set([...current, type])] : current.filter(item => item !== type))} />
          {ENRICHMENT_TYPE_LABELS[type]}
        </label>)}
      </div>
      <p className="text-xs text-muted-foreground">This will trigger {runs} enrichment run{runs === 1 ? "" : "s"} across {count} pathway{count === 1 ? "" : "s"}.</p>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={types.length === 0} onClick={() => onConfirm(types)}>Confirm</Button></DialogFooter>
  </DialogContent></Dialog>;
}

/* ------------------------------------------------------------------ */
/* Sticky selection bar at the bottom of the viewport                  */
/* ------------------------------------------------------------------ */

export function EnrichmentSelectionBar({ count, onClear, onEnrich }: { count: number; onClear: () => void; onEnrich: () => void }) {
  if (count === 0) return null;
  return <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-background px-4 py-2 shadow-lg">
    <span className="text-xs font-medium">{count} pathway{count === 1 ? "" : "s"} selected</span>
    <Button size="sm" className="h-7 text-[10px]" onClick={onEnrich}><Sparkles className="mr-1 h-3 w-3" />Enrich</Button>
    <Button variant="link" size="sm" className="h-7 text-xs" onClick={onClear}>Clear selection</Button>
  </div>;
}

/* ------------------------------------------------------------------ */
/* Job runner                                                          */
/* ------------------------------------------------------------------ */

export function useBulkEnrichment(currentUser: string) {
  const [job, setJob] = useState<BulkJob | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => { timers.current.forEach(window.clearTimeout); }, []);

  const start = useCallback((pathwayIds: string[], types: EnrichmentType[]) => {
    const bulk_job_id = jobId();
    const mode = pathwayIds.length > 1 || types.length > 1 ? "bulk" : "single";
    const outcomes: Outcome[] = [];
    const queued: { run: EnrichmentRun; key: string }[] = [];
    pathwayIds.forEach(pathway_id => types.forEach(enrichment_type => {
      const latest = getLatestEnrichmentRun(pathway_id, enrichment_type);
      if (isBusy(latest)) { outcomes.push({ pathway_id, enrichment_type, status: "skipped", detail: "Already queued or running" }); return; }
      const run = appendEnrichmentRun({ pathway_id, enrichment_type, status: "running", triggered_by: currentUser, triggered_at: new Date().toISOString(), completed_at: null, trigger_mode: mode, bulk_job_id, items_found: null, items_new: null, items_reconfirmed: null, error_message: null });
      outcomes.push({ pathway_id, enrichment_type, status: "running", detail: null });
      queued.push({ run, key: `${pathway_id}:${enrichment_type}` });
    }));
    setJob({ bulk_job_id, pathway_ids: pathwayIds, types, total: pathwayIds.length * types.length, outcomes });

    queued.forEach(({ run }, index) => {
      const timer = window.setTimeout(() => {
        // Prototype outcome: a partial failure never aborts the remaining runs.
        const roll = (index * 7 + run.pathway_id.length) % 10;
        const failed = roll === 3;
        const empty = roll === 5;
        const partial = roll === 7;
        const found = failed ? null : empty ? 0 : 4 + roll;
        const outcome = appendEnrichmentRunOutcome(run, {
          status: failed ? "failed" : partial ? "completed_with_errors" : "completed",
          completed_at: new Date().toISOString(),
          items_found: found,
          items_new: found === null ? null : Math.max(0, Math.floor(found / 3)),
          items_reconfirmed: found === null ? null : found - Math.max(0, Math.floor(found / 3)),
          error_message: failed ? "Upstream provider returned HTTP 503." : partial ? "Some sources timed out; partial results stored." : null,
        });
        setJob(current => current && current.bulk_job_id === run.bulk_job_id ? {
          ...current,
          outcomes: current.outcomes.map(item => item.pathway_id === run.pathway_id && item.enrichment_type === run.enrichment_type
            ? { ...item, status: outcome.status, detail: outcome.error_message ?? (outcome.items_found === 0 ? "No results found" : `${outcome.items_new} new · ${outcome.items_reconfirmed} re-confirmed`) }
            : item),
        } : current);
      }, 700 + index * 350);
      timers.current.push(timer);
    });
    return { fired: queued.length, skipped: outcomes.length - queued.length };
  }, [currentUser]);

  return { job, start, dismiss: () => setJob(null) };
}

/* ------------------------------------------------------------------ */
/* Progress panel + per-pathway outcome list                           */
/* ------------------------------------------------------------------ */

export function BulkJobProgressPanel({ job, onDismiss }: { job: BulkJob; onDismiss: () => void }) {
  const [listOpen, setListOpen] = useState(false);
  const completed = job.outcomes.filter(item => item.status === "completed" || item.status === "completed_with_errors").length;
  const failed = job.outcomes.filter(item => item.status === "failed").length;
  const skipped = job.outcomes.filter(item => item.status === "skipped").length;
  const running = job.outcomes.filter(item => item.status === "running" || item.status === "queued").length;
  return <>
    <div className="fixed bottom-4 right-4 z-40 w-72 rounded-lg border bg-background p-3 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {running > 0 ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-primary" />}Enrichment job
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Dismiss enrichment job panel" onClick={onDismiss}><X className="h-3.5 w-3.5" /></Button>
      </div>
      <p className="mt-1.5 text-xs">{job.total} run{job.total === 1 ? "" : "s"} total</p>
      <div className="mt-1 grid grid-cols-3 gap-2 text-[10px]">
        <span>Completed <strong className="text-foreground">{completed}</strong></span>
        <span className={cn(failed > 0 && "text-destructive")}>Failed <strong>{failed}</strong></span>
        <span className="text-muted-foreground">Skipped <strong>{skipped}</strong></span>
      </div>
      <Button variant="link" size="sm" className="mt-1 h-6 p-0 text-xs" onClick={() => setListOpen(true)}>View per-pathway outcomes</Button>
    </div>
    <Sheet open={listOpen} onOpenChange={setListOpen}><SheetContent className="w-full sm:max-w-2xl">
      <SheetHeader><SheetTitle>Enrichment outcomes</SheetTitle><SheetDescription>One row per pathway, with the result of each selected type.</SheetDescription></SheetHeader>
      <div className="mt-4 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Pathway</TableHead>{job.types.map(type => <TableHead key={type}>{ENRICHMENT_TYPE_LABELS[type]}</TableHead>)}</TableRow></TableHeader><TableBody>
        {job.pathway_ids.map(id => <TableRow key={id}><TableCell className="font-mono text-[10px]">{id}</TableCell>{job.types.map(type => {
          const outcome = job.outcomes.find(item => item.pathway_id === id && item.enrichment_type === type);
          if (!outcome) return <TableCell key={type} className="text-[10px] text-muted-foreground">—</TableCell>;
          return <TableCell key={type} className="text-[10px]">
            <span className={cn("inline-flex items-center gap-1", outcome.status === "failed" && "text-destructive", outcome.status === "skipped" && "text-muted-foreground")}>
              {outcome.status === "running" || outcome.status === "queued" ? <Loader2 className="h-3 w-3 animate-spin" /> : outcome.status === "failed" ? <AlertTriangle className="h-3 w-3" /> : outcome.status === "completed_with_errors" ? <AlertTriangle className="h-3 w-3 text-amber-600" /> : outcome.status === "skipped" ? null : <Check className="h-3 w-3 text-primary" />}
              {outcome.status === "running" || outcome.status === "queued" ? "Running" : outcome.status === "skipped" ? "Skipped" : outcome.status === "failed" ? "Failed" : outcome.detail}
            </span>
            {outcome.detail && outcome.status !== "completed" && <span className="block text-muted-foreground">{outcome.detail}</span>}
          </TableCell>;
        })}</TableRow>)}
      </TableBody></Table></div>
    </SheetContent></Sheet>
  </>;
}
