// Indicator run history. Separate from RecordHistorySheet: that sheet shows human
// decisions on the record, this panel shows the runs themselves. Runs are
// append-only — nothing here replaces, overwrites or averages an earlier run.
import { useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, History } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ActorStamp, ReviewStatusChip, ValueCell, ValueDiff } from "./ReviewPrimitives";
import { useHistorySheet } from "./RecordHistorySheet";
import { IndicatorRunSheetContext, useOptionalIndicatorRunSheet, type IndicatorRunSheetContextValue, type IndicatorRunTarget } from "./indicatorRunSheetContext";
import {
  indicatorLabel, latestApprovedIndicatorRun, methodTagLabel, resolveIndicatorRuns, sourceDisplay,
  useHitlStore, type IndicatorRun,
} from "@/lib/hitlStore";
import { cn } from "@/lib/utils";

export function IndicatorRunSheetProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<IndicatorRunTarget | null>(null);
  const value = useMemo<IndicatorRunSheetContextValue>(() => ({ target, openRuns: setTarget, closeRuns: () => setTarget(null) }), [target]);
  return <IndicatorRunSheetContext.Provider value={value}>{children}<IndicatorRunHistorySheet /></IndicatorRunSheetContext.Provider>;
}

const timestamp = (value: string) => format(new Date(value), "dd MMM yyyy, HH:mm");

/** Value of a single run. null (nothing found) and 0 never render the same way. */
function RunValue({ run }: { run: IndicatorRun }) {
  if (run.value === null) {
    return <span className="inline-flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">No value found</span>
      {run.null_reason && <span className="max-w-72 text-[10px] text-muted-foreground">{run.null_reason}</span>}
    </span>;
  }
  return <span className="text-xs font-semibold text-foreground"><ValueCell value={run.value} unit={run.unit} /></span>;
}

/** The indicator value in the table: the most recent Approved run, nothing else. */
export function IndicatorRunValue({ runs, className }: { runs: IndicatorRun[]; className?: string }) {
  const resolution = resolveIndicatorRuns(runs);
  if (resolution.kind === "awaiting") return <span className={cn("whitespace-nowrap text-[10px] italic text-muted-foreground", className)}>Awaiting review</span>;
  if (resolution.kind === "no_value") return <Tooltip><TooltipTrigger asChild><span className={cn("whitespace-nowrap text-[10px] text-muted-foreground", className)}>No value found</span></TooltipTrigger>{resolution.run.null_reason && <TooltipContent className="max-w-xs text-xs">{resolution.run.null_reason}</TooltipContent>}</Tooltip>;
  return <span className={cn("whitespace-nowrap text-[10px] font-bold", className)}><ValueCell value={resolution.value} unit={resolution.run.unit} /></span>;
}

export function IndicatorRunHistoryButton({ target, count }: { target: IndicatorRunTarget; count: number }) {
  const sheet = useOptionalIndicatorRunSheet();
  if (!sheet) return null;
  return <Tooltip><TooltipTrigger asChild>
    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label={`Run history for ${indicatorLabel(target.indicatorKey)}`} onClick={() => sheet.openRuns(target)}>
      <History className={cn("h-3.5 w-3.5", count === 0 && "opacity-40")} />
    </Button>
  </TooltipTrigger><TooltipContent>{count === 0 ? "No runs yet" : `Run history · ${count} run${count === 1 ? "" : "s"}`}</TooltipContent></Tooltip>;
}

function RunRow({ run, approvedRun, readOnly }: { run: IndicatorRun; approvedRun: IndicatorRun | null; readOnly: boolean }) {
  const store = useHitlStore();
  const [open, setOpen] = useState(false);
  const isCurrent = approvedRun?.run_id === run.run_id;
  const showDelta = run.status === "review_pending" && approvedRun !== null && approvedRun.value !== run.value;
  const decide = (status: "approved" | "rejected") => {
    store.setIndicatorRunStatus(run.run_id, status);
    toast.success(status === "approved" ? "Run approved. Earlier runs stay in history." : "Run rejected. It remains in history.");
  };
  return <li className={cn("rounded-md border p-3", isCurrent && "border-primary/40 bg-primary/5")}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">{timestamp(run.triggered_at)}</span>
          <code className="font-mono text-[10px] text-muted-foreground">{run.run_id}</code>
          <ReviewStatusChip status={run.status} />
          {isCurrent && <Badge variant="outline" className="h-5 whitespace-nowrap border-primary/40 px-1.5 text-[10px] text-primary">Current value</Badge>}
        </div>
        <RunValue run={run} />
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span>{methodTagLabel(run.method_tag)}</span>
          <span>·</span><code className="font-mono">{run.prompt_version}</code>
          <span>·</span><code className="font-mono">{run.model}</code>
        </div>
        <ActorStamp name={run.triggered_by} timestamp={run.triggered_at} />
        {run.reviewed_by && run.reviewed_at && <div className="text-[10px] text-muted-foreground">Reviewed by {run.reviewed_by} · {timestamp(run.reviewed_at)}</div>}
      </div>
      {!readOnly && run.status === "review_pending" && <div className="flex gap-1">
        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => decide("approved")}>Approve</Button>
        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => decide("rejected")}>Reject</Button>
      </div>}
    </div>
    {showDelta && <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 p-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Differs from approved value</span>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
        <ValueDiff prior_value={approvedRun?.value ?? null} new_value={run.value} />
        {typeof approvedRun?.value === "number" && typeof run.value === "number" && <span className="font-mono text-[10px] text-muted-foreground">Δ {run.value - approvedRun.value > 0 ? "+" : ""}{Number((run.value - approvedRun.value).toFixed(4))}{run.unit ? ` ${run.unit}` : ""}</span>}
      </div>
    </div>}
    {run.sources.length > 0 && <div className="mt-2">
      <Button variant="ghost" size="sm" className="h-6 gap-1 px-1 text-[10px] text-muted-foreground" onClick={() => setOpen(value => !value)}>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}Sources ({run.sources.length})
      </Button>
      {open && <ul className="mt-1 space-y-1 pl-4">{run.sources.map((source, index) => <li key={`${source.url}-${index}`}><a href={source.url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline">{sourceDisplay(source)}</a></li>)}</ul>}
    </div>}
  </li>;
}

export function IndicatorRunHistorySheet() {
  const store = useHitlStore();
  const sheet = useOptionalIndicatorRunSheet();
  const target = sheet?.target ?? null;
  const runs = target ? store.runsForIndicator(target.indicatorId) : [];
  const approvedRun = latestApprovedIndicatorRun(runs);
  return <Sheet open={target !== null} onOpenChange={open => { if (!open) sheet?.closeRuns(); }}>
    <SheetContent side="right" className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-xl">
      <SheetHeader>
        <SheetTitle className="text-sm">Run history · {target ? indicatorLabel(target.indicatorKey) : ""}</SheetTitle>
        <SheetDescription className="text-xs">
          {target?.contextLabel && <span className="block text-foreground">{target.contextLabel}</span>}
          Every run is kept. The indicator value is the most recent approved run — runs are never averaged.
          {target?.readOnly && <span className="block">Computed count indicator: read-only, no review actions.</span>}
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        <span>{runs.length} run{runs.length === 1 ? "" : "s"}</span>
        <span>·</span>
        <span className="flex items-center gap-1">Current value: <IndicatorRunValue runs={runs} /></span>
      </div>
      {target?.recordId && <RecordHistoryLink recordId={target.recordId} />}
      {runs.length === 0
        ? <p className="text-xs text-muted-foreground">No runs recorded for this indicator yet.</p>
        : <ul className="space-y-2">{runs.map(run => <RunRow key={run.run_id} run={run} approvedRun={approvedRun} readOnly={target?.readOnly ?? false} />)}</ul>}
    </SheetContent>
  </Sheet>;
}

function RecordHistoryLink({ recordId }: { recordId: string }) {
  const { openHistory } = useHistorySheet();
  return <Button variant="outline" size="sm" className="h-7 w-fit gap-1 px-2 text-[10px]" onClick={() => openHistory("indicator_value", recordId)}>
    <History className="h-3 w-3" />Decisions on this record
  </Button>;
}
