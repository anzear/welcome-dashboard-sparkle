import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ActorStamp, ValueCell } from "@/components/hitl/ReviewPrimitives";
import { useNodeFilter } from "@/components/hitl/NodeFilterBar";
import { ENRICHMENT_STATUS_LABELS, ENRICHMENT_TYPES, ENRICHMENT_TYPE_LABELS, NODE_LABELS, isRunActive, useHitlStore, type EnrichmentRun, type EnrichmentRunStatus, type EnrichmentType, type Pathway } from "@/lib/hitlStore";
import { newBulkJobId, startRun } from "@/lib/mockEnrichment";
import { cn } from "@/lib/utils";

const relative = (timestamp: string) => formatDistanceToNow(new Date(timestamp), { addSuffix: true });
const absolute = (timestamp: string) => format(new Date(timestamp), "dd MMM yyyy, HH:mm:ss");

const dotClass = (status: EnrichmentRunStatus | null) => {
  if (status === null) return "bg-muted-foreground/30";
  if (status === "completed") return "bg-primary";
  if (status === "completed_with_errors") return "bg-warning";
  if (status === "failed") return "bg-destructive";
  return "bg-muted-foreground";
};

const useRunner = () => {
  const store = useHitlStore();
  return useMemo(() => ({
    createEnrichmentRun: store.createEnrichmentRun,
    markEnrichmentRunRunning: store.markEnrichmentRunRunning,
    resolveEnrichmentRun: store.resolveEnrichmentRun,
  }), [store.createEnrichmentRun, store.markEnrichmentRunRunning, store.resolveEnrichmentRun]);
};

// --- Pathways table cell -----------------------------------------------------
export function EnrichmentCell({ pathway }: { pathway: Pathway }) {
  const store = useHitlStore();
  const perType = ENRICHMENT_TYPES.map(type => ({ type, run: store.lastRun(pathway.id, type) }));
  const newest = perType.map(item => item.run).filter((run): run is EnrichmentRun => Boolean(run))
    .sort((a, b) => +new Date(b.triggered_at) - +new Date(a.triggered_at))[0] ?? null;
  return <div className="flex flex-col gap-1 text-[10px]">
    {newest === null
      ? <span className="text-muted-foreground">Not run</span>
      : <Tooltip><TooltipTrigger asChild><span className="cursor-default whitespace-nowrap">{relative(newest.triggered_at)}</span></TooltipTrigger><TooltipContent className="font-mono text-xs">{absolute(newest.triggered_at)}</TooltipContent></Tooltip>}
    <div className="flex items-center gap-1.5">
      {perType.map(({ type, run }) => <Tooltip key={type}><TooltipTrigger asChild>
        <span className="inline-flex h-3 w-3 items-center justify-center">
          {run && isRunActive(run)
            ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            : <span className={cn("h-2 w-2 rounded-full", dotClass(run?.status ?? null))} />}
        </span>
      </TooltipTrigger><TooltipContent className="text-xs">
        {ENRICHMENT_TYPE_LABELS[type]} · {run ? `${ENRICHMENT_STATUS_LABELS[run.status]} · ${absolute(run.triggered_at)}` : "Not run"}
      </TooltipContent></Tooltip>)}
    </div>
  </div>;
}

// --- Row panel ---------------------------------------------------------------
function RunCounts({ run }: { run: EnrichmentRun }) {
  // A completed companies run that added nothing is a success state, stated as
  // such and distinct from a never-run state.
  if (run.enrichment_type === "companies" && isRunSuccessful(run)) {
    if (run.items_new === 0) return <span className="text-[10px] text-muted-foreground">No new companies found{run.items_already_known === null ? "" : ` · ${run.items_already_known} already known`}</span>;
    return <span className="text-[10px] text-muted-foreground">
      <span className="text-foreground"><ValueCell value={run.items_new} /></span> new · <span className="text-foreground"><ValueCell value={run.items_already_known} /></span> already known
    </span>;
  }
  return <span className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
    <span>New <span className="text-foreground"><ValueCell value={run.items_new} /></span></span>
    <span>Already known <span className="text-foreground"><ValueCell value={run.items_already_known} /></span></span>
    <span>Found <span className="text-foreground"><ValueCell value={run.items_found} /></span></span>
  </span>;
}


function TypeRow({ pathway, type }: { pathway: Pathway; type: EnrichmentType }) {
  const store = useHitlStore();
  const runner = useRunner();
  const last = store.lastRun(pathway.id, type);
  const active = store.activeRun(pathway.id, type);
  const lastSuccess = store.lastSuccessfulRun(pathway.id, type);
  const busy = Boolean(active);
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b px-3 py-3 last:border-b-0">
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-medium">{ENRICHMENT_TYPE_LABELS[type]}</p>
      {last === null && <p className="text-[10px] text-muted-foreground">Not run</p>}
      {last && busy && <p className="flex items-center gap-1.5 text-[10px]"><Loader2 className="h-3 w-3 animate-spin" />{ENRICHMENT_STATUS_LABELS[last.status]}</p>}
      {last && !busy && <>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]",
            last.status === "failed" && "border-destructive/40 bg-destructive/5 text-destructive",
            last.status === "completed_with_errors" && "border-warning/40 bg-warning/10 text-warning-foreground")}>
            {last.status === "completed" && last.items_found === 0 ? "Completed — no results found" : ENRICHMENT_STATUS_LABELS[last.status]}
          </Badge>
          {last.status === "completed_with_errors" && <AlertTriangle className="h-3 w-3 text-warning" />}
          <Tooltip><TooltipTrigger asChild><span className="cursor-default text-[10px] text-muted-foreground">{relative(last.triggered_at)}</span></TooltipTrigger><TooltipContent className="font-mono text-xs">{absolute(last.triggered_at)}</TooltipContent></Tooltip>
        </div>
        {last.status === "failed"
          ? <div className="space-y-0.5">
              <p className="text-[10px] text-destructive">{last.error_message}</p>
              {lastSuccess && <p className="text-[10px] text-muted-foreground">Last successful run {absolute(lastSuccess.triggered_at)}</p>}
            </div>
          : last.items_found === 0 ? null : <RunCounts run={last} />}
      </>}
    </div>
    <Tooltip><TooltipTrigger asChild><span>
      <Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={busy}
        onClick={() => { startRun(runner, { pathway_id: pathway.id, enrichment_type: type, trigger_mode: "single", bulk_job_id: null }); toast.success(`${ENRICHMENT_TYPE_LABELS[type]} enrichment queued for ${pathway.id}`); }}>
        Run
      </Button>
    </span></TooltipTrigger><TooltipContent className="text-xs">{active ? `Running since ${absolute(active.triggered_at)}` : `Run ${ENRICHMENT_TYPE_LABELS[type]} enrichment`}</TooltipContent></Tooltip>
  </div>;
}

function RunHistorySheet({ pathwayId, open, onClose }: { pathwayId: string; open: boolean; onClose: () => void }) {
  const store = useHitlStore();
  const runs = store.runsForPathway(pathwayId);
  return <Sheet open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
      <SheetHeader><SheetTitle>Run history · <span className="font-mono text-sm">{pathwayId}</span></SheetTitle><SheetDescription>Every enrichment run for this Pathway, newest first. Read-only.</SheetDescription></SheetHeader>
      <div className="mt-4 divide-y rounded-md border">
        {runs.length === 0 && <p className="p-3 text-xs text-muted-foreground">No runs yet.</p>}
        {runs.map(run => <div key={run.run_id} className="space-y-1 p-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="text-xs font-medium">{ENRICHMENT_TYPE_LABELS[run.enrichment_type]}</span>
            <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]",
              run.status === "failed" && "border-destructive/40 bg-destructive/5 text-destructive",
              run.status === "completed_with_errors" && "border-warning/40 bg-warning/10 text-warning-foreground")}>{ENRICHMENT_STATUS_LABELS[run.status]}</Badge>
            <span className="text-muted-foreground">{run.trigger_mode === "bulk" ? "Bulk" : "Single"}</span>
            <span className="font-mono text-muted-foreground">{absolute(run.triggered_at)}</span>
          </div>
          <RunCounts run={run} />
          {run.error_message && <p className="text-[10px] text-destructive">{run.error_message}</p>}
          <ActorStamp name={run.triggered_by} timestamp={run.triggered_at} />
        </div>)}
      </div>
    </SheetContent>
  </Sheet>;
}

export function EnrichmentSheet({ pathway, open, onClose }: { pathway: Pathway | null; open: boolean; onClose: () => void }) {
  const store = useHitlStore();
  const runner = useRunner();
  const [historyOpen, setHistoryOpen] = useState(false);
  if (!pathway) return null;
  const runs = store.runsForPathway(pathway.id);
  const lastAny = runs[0] ?? null;
  const busyTypes = ENRICHMENT_TYPES.filter(type => store.activeRun(pathway.id, type));
  const runAll = () => {
    const idle = ENRICHMENT_TYPES.filter(type => !store.activeRun(pathway.id, type));
    // Shortcut only: one separate run per type, never a combined record.
    idle.forEach(type => startRun(runner, { pathway_id: pathway.id, enrichment_type: type, trigger_mode: "single", bulk_job_id: null }));
    const skipped = ENRICHMENT_TYPES.filter(type => !idle.includes(type));
    toast.success(`${idle.length} run${idle.length === 1 ? "" : "s"} queued${skipped.length ? ` · skipped ${skipped.map(type => ENRICHMENT_TYPE_LABELS[type]).join(", ")} (already running)` : ""}`);
  };
  return <>
    <Sheet open={open} onOpenChange={value => { if (!value) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm">{pathway.id}</SheetTitle>
          <SheetDescription>Enrichment for this Pathway. Each type runs and is recorded on its own.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-1 rounded-md border bg-muted/30 p-3">
            {(["feedstock", "process_technology", "product", "application_market"] as const).map(key => <div key={key} className="flex items-baseline gap-2 text-[11px]">
              <span className="w-24 shrink-0 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{NODE_LABELS[key]}</span>
              <span className="truncate">{pathway[key]}</span>
            </div>)}
          </div>
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="h-6 px-2 text-[10px]">{lastAny ? `Last enriched ${relative(lastAny.triggered_at)}` : "Never enriched"}</Badge>
            <Tooltip><TooltipTrigger asChild><span>
              <Button size="sm" className="h-7 text-[10px]" disabled={busyTypes.length === ENRICHMENT_TYPES.length} onClick={runAll}>Run all</Button>
            </span></TooltipTrigger><TooltipContent className="text-xs">{busyTypes.length === ENRICHMENT_TYPES.length ? "All types are already running" : "Runs each idle type as its own run"}</TooltipContent></Tooltip>
          </div>
          <div className="rounded-md border">
            {ENRICHMENT_TYPES.map(type => <TypeRow key={type} pathway={pathway} type={type} />)}
          </div>
          <Button variant="link" className="h-auto p-0 text-xs" onClick={() => setHistoryOpen(true)}>Run history ({runs.length})</Button>
        </div>
      </SheetContent>
    </Sheet>
    <RunHistorySheet pathwayId={pathway.id} open={historyOpen} onClose={() => setHistoryOpen(false)} />
  </>;
}

// --- Bulk enrichment ---------------------------------------------------------
export interface BulkEnrichJob { bulk_job_id: string; pathway_ids: string[]; types: EnrichmentType[]; total: number; skipped: number; started_at: string }
interface BulkJobContextValue { job: BulkEnrichJob | null; setJob: (job: BulkEnrichJob | null) => void }
const BulkJobContext = createContext<BulkJobContextValue | null>(null);
export function BulkEnrichmentJobProvider({ children }: { children: ReactNode }) {
  const [job, setJob] = useState<BulkEnrichJob | null>(null);
  const value = useMemo(() => ({ job, setJob }), [job]);
  return <BulkJobContext.Provider value={value}>{children}<BulkEnrichmentProgressPanel /></BulkJobContext.Provider>;
}
export function useBulkEnrichmentJob() {
  const context = useContext(BulkJobContext);
  if (!context) throw new Error("useBulkEnrichmentJob must be used within BulkEnrichmentJobProvider");
  return context;
}

export function BulkEnrichDialog({ open, pathwayIds, onClose, afterStart }: { open: boolean; pathwayIds: string[]; onClose: () => void; afterStart?: () => void }) {
  const store = useHitlStore();
  const runner = useRunner();
  const { setJob } = useBulkEnrichmentJob();
  const nodeFilter = useNodeFilter();
  const [types, setTypes] = useState<EnrichmentType[]>(ENRICHMENT_TYPES);
  const allSelected = types.length === ENRICHMENT_TYPES.length;
  const confirm = () => {
    const bulkJobId = newBulkJobId();
    let started = 0;
    let skipped = 0;
    pathwayIds.forEach(pathwayId => types.forEach(type => {
      // A type already queued or running is skipped; the rest of the job continues.
      if (store.activeRun(pathwayId, type)) { skipped += 1; return; }
      startRun(runner, { pathway_id: pathwayId, enrichment_type: type, trigger_mode: "bulk", bulk_job_id: bulkJobId });
      started += 1;
    }));
    store.recordChange({
      entity_type: "bulk_job", entity_id: bulkJobId, field: "bulk_selection", prior_value: null,
      new_value: { types, pathway_count: pathwayIds.length, pathway_ids: pathwayIds, node_filter: { feedstock: nodeFilter.feedstock || null, product: nodeFilter.product || null }, runs_started: started, runs_skipped: skipped },
      operation: "enrich_trigger", trigger_mode: "bulk", bulk_job_id: bulkJobId,
      note: "Bulk enrichment triggered from the Pathways table",
    });
    setJob({ bulk_job_id: bulkJobId, pathway_ids: pathwayIds, types, total: started, skipped, started_at: new Date().toISOString() });
    toast.success(`${started} enrichment run${started === 1 ? "" : "s"} queued${skipped ? ` · ${skipped} skipped (already running)` : ""}`);
    onClose(); afterStart?.();
  };
  return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>Enrich {pathwayIds.length} Pathway{pathwayIds.length === 1 ? "" : "s"}</DialogTitle><DialogDescription>Each Pathway and type is recorded as its own run.</DialogDescription></DialogHeader>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Types</span>
        <Button variant="link" className="h-auto p-0 text-xs" onClick={() => setTypes(allSelected ? [] : ENRICHMENT_TYPES)}>{allSelected ? "Deselect all" : "Select all"}</Button>
      </div>
      <div className="space-y-1.5 rounded-md border p-2">
        {ENRICHMENT_TYPES.map(type => <label key={type} className="flex items-center gap-2 rounded-md p-1.5 text-xs hover:bg-muted">
          <Checkbox checked={types.includes(type)} onCheckedChange={checked => setTypes(current => checked ? [...new Set([...current, type])] : current.filter(item => item !== type))} />
          {ENRICHMENT_TYPE_LABELS[type]}
        </label>)}
      </div>
      <p className="text-xs text-muted-foreground">This will trigger {pathwayIds.length * types.length} enrichment runs across {pathwayIds.length} Pathway{pathwayIds.length === 1 ? "" : "s"}.</p>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={types.length === 0 || pathwayIds.length === 0} onClick={confirm}>Confirm</Button></DialogFooter>
  </DialogContent></Dialog>;
}

function BulkEnrichmentProgressPanel() {
  const store = useHitlStore();
  const context = useContext(BulkJobContext);
  const [outcomesOpen, setOutcomesOpen] = useState(false);
  const job = context?.job ?? null;
  if (!job) return null;
  const runs = store.runsForBulkJob(job.bulk_job_id);
  const completed = runs.filter(run => run.status === "completed" || run.status === "completed_with_errors").length;
  const failed = runs.filter(run => run.status === "failed").length;
  return <>
    <div className="fixed bottom-4 right-4 z-50 w-72 space-y-2 rounded-lg border bg-background p-3 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Bulk enrichment</p>
        <Button variant="ghost" size="icon" className="-mr-1 -mt-1 h-6 w-6" aria-label="Dismiss bulk enrichment panel" onClick={() => context?.setJob(null)}><X className="h-3.5 w-3.5" /></Button>
      </div>
      <div className="grid grid-cols-2 gap-1 text-[10px]">
        <span className="text-muted-foreground">Runs</span><span className="text-right">{job.total}</span>
        <span className="text-muted-foreground">Completed</span><span className="text-right">{completed}</span>
        <span className="text-muted-foreground">Failed</span><span className="text-right">{failed}</span>
        <span className="text-muted-foreground">Skipped</span><span className="text-right">{job.skipped}</span>
      </div>
      <Button variant="link" className="h-auto p-0 text-xs" onClick={() => setOutcomesOpen(true)}>Per-Pathway outcomes</Button>
    </div>
    <Sheet open={outcomesOpen} onOpenChange={setOutcomesOpen}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader><SheetTitle>Bulk enrichment outcomes</SheetTitle><SheetDescription>One row per Pathway with its result for each selected type.</SheetDescription></SheetHeader>
        <div className="mt-4 divide-y rounded-md border">
          {job.pathway_ids.map(pathwayId => <div key={pathwayId} className="space-y-1.5 p-3">
            <p className="font-mono text-[11px]">{pathwayId}</p>
            {job.types.map(type => {
              const run = runs.find(item => item.pathway_id === pathwayId && item.enrichment_type === type) ?? null;
              return <div key={type} className="flex flex-wrap items-center gap-2 text-[10px]">
                <span className="w-20 shrink-0 text-muted-foreground">{ENRICHMENT_TYPE_LABELS[type]}</span>
                {run === null
                  ? <span className="text-muted-foreground">Skipped — already running</span>
                  : <>
                      <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]",
                        run.status === "failed" && "border-destructive/40 bg-destructive/5 text-destructive",
                        run.status === "completed_with_errors" && "border-warning/40 bg-warning/10 text-warning-foreground")}>
                        {run.status === "completed" && run.items_found === 0 ? "Completed — no results found" : ENRICHMENT_STATUS_LABELS[run.status]}
                      </Badge>
                      {run.status === "failed" ? <span className="text-destructive">{run.error_message}</span> : <RunCounts run={run} />}
                    </>}
              </div>;
            })}
          </div>)}
        </div>
      </SheetContent>
    </Sheet>
  </>;
}
