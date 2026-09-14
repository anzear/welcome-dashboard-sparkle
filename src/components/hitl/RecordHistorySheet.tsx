import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ActorStamp, OperationChip, TraceId, ValueDiff } from "./ReviewPrimitives";
import { useHitlStore, type AuditEntityType, type AuditEntry, type HitlRecord } from "@/lib/hitlStore";
import { cn } from "@/lib/utils";

interface Target { entity_type: AuditEntityType; entity_id: string; }
interface HistoryContextValue { openHistory: (entity_type: AuditEntityType, entity_id: string) => void; closeHistory: () => void; target: Target | null; }
const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistorySheetProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<Target | null>(null);
  const value = useMemo(() => ({ openHistory: (entity_type: AuditEntityType, entity_id: string) => setTarget({ entity_type, entity_id }), closeHistory: () => setTarget(null), target }), [target]);
  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}
export function useHistorySheet() {
  const context = useContext(HistoryContext);
  if (!context) throw new Error("useHistorySheet must be used within HistorySheetProvider");
  return context;
}

export function RecordHistoryList({ entityType, entityId }: { entityType: AuditEntityType; entityId: string }) {
  const store = useHitlStore();
  const [confirm, setConfirm] = useState<AuditEntry | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const history = store.getHistory(entityType, entityId);
  const intervening = confirm ? store.isSuperseded(confirm) : [];
  useEffect(() => { if (!highlight) return; const timer = window.setTimeout(() => setHighlight(null), 1800); return () => window.clearTimeout(timer); }, [highlight]);
  const jumpTo = (id: string) => { refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" }); setHighlight(id); };
  const doRevert = () => {
    if (!confirm) return;
    const entry = store.revertEntry(confirm.id);
    setConfirm(null);
    if (entry) toast.success(`Reverted — entry ${entry.id} written`);
  };
  return <>
    {history.length === 0 ? <div className="py-20 text-center text-xs text-muted-foreground">No changes recorded.</div> : <div className="space-y-2">
      {history.map(entry => {
        const later = store.isSuperseded(entry);
        const undo = store.revertedBy(entry);
        return <div key={entry.id} ref={node => { refs.current[entry.id] = node; }} className={cn("rounded-md border px-3 py-3 transition-colors", highlight === entry.id && "border-primary bg-primary/5")}>
          <div className="mb-2 flex flex-wrap items-center gap-2"><time className="font-mono text-[9px] text-muted-foreground">{format(new Date(entry.timestamp), "dd MMM yyyy, HH:mm:ss")}</time><ActorStamp name={entry.actor} timestamp={entry.timestamp} /><OperationChip operation={entry.operation} /></div>
          <div className="grid gap-2 sm:grid-cols-[100px_1fr_auto]"><code className="font-mono text-[10px] text-muted-foreground">{entry.field ?? "record"}</code><ValueDiff prior_value={entry.prior_value} new_value={entry.new_value} /><Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" disabled={Boolean(undo)} onClick={() => setConfirm(entry)}>Revert</Button></div>
          {entry.note && <p className="mt-2 text-[10px] italic text-muted-foreground">{entry.note}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2"><TraceId value={entry.trace_id} />{undo && <span className="text-[9px] text-muted-foreground">Reverted by {undo.id}</span>}{later.length > 0 && !undo && <Tooltip><TooltipTrigger asChild><span className="cursor-help text-[9px] font-medium text-warning-foreground">Superseded</span></TooltipTrigger><TooltipContent>Later entries: {later.map(item => item.id).join(", ")}</TooltipContent></Tooltip>}{entry.operation === "revert" && entry.reverts_entry_id && <Button variant="link" className="h-auto p-0 text-[9px]" onClick={() => jumpTo(entry.reverts_entry_id ?? "")}>Reverts {entry.reverts_entry_id}</Button>}</div>
        </div>;
      })}
    </div>}
    <AlertDialog open={confirm !== null} onOpenChange={open => { if (!open) setConfirm(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{intervening.length ? "This change has been superseded" : `Revert ${confirm?.field ?? "record"}?`}</AlertDialogTitle><AlertDialogDescription>{intervening.length ? "Later changes will be overwritten by this revert." : <>Revert <code>{confirm?.field}</code> to its prior value? A new audit entry will be written.</>}</AlertDialogDescription></AlertDialogHeader>
        {intervening.length > 0 && <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">{intervening.map(item => <div key={item.id} className="text-[10px]"><span className="font-mono text-muted-foreground">{format(new Date(item.timestamp), "dd MMM HH:mm")}</span> · {item.actor}<div><ValueDiff prior_value={item.prior_value} new_value={item.new_value} /></div></div>)}</div>}
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={doRevert}>{intervening.length ? "Revert anyway" : "Revert"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}

const labels: Record<AuditEntityType, string> = { pathway: "Pathway", company: "Company", company_match: "Company match", paper_patent_match: "Paper & patent match", indicator_value: "Indicator value" };
function summary(record: HitlRecord | null, type: AuditEntityType) {
  if (!record) return "Record unavailable";
  if (type === "pathway" && "feedstock" in record) return [record.feedstock, record.process_technology, record.product, record.application_market].join(" → ");
  if (type === "company" && "name" in record) return record.name;
  if (type === "company_match" && "company_name" in record) return `${record.company_name} · ${record.pathway_id}`;
  if (type === "paper_patent_match" && "title" in record) return `${record.title} · ${record.pathway_id}`;
  if (type === "indicator_value" && "indicator" in record) return `${record.indicator} · ${record.pathway_id}`;
  return record.id;
}

export function RecordHistorySheet() {
  const { target, closeHistory } = useHistorySheet();
  const store = useHitlStore();
  const record = target ? store.getRecord(target.entity_type, target.entity_id) : null;
  return (
    <Sheet open={target !== null} onOpenChange={open => { if (!open) closeHistory(); }}>
      <SheetContent className="flex w-[min(94vw,680px)] flex-col gap-0 p-0 sm:max-w-[680px]">
        {target && <>
          <SheetHeader className="border-b px-5 py-4 pr-12">
            <div className="flex items-center gap-2"><SheetTitle className="text-sm">{labels[target.entity_type]}</SheetTitle><code className="font-mono text-[10px] text-muted-foreground">{target.entity_id}</code></div>
            <SheetDescription className="truncate text-xs">{summary(record, target.entity_type)}</SheetDescription>
            {record && <span className="font-mono text-[9px] text-muted-foreground">Updated {format(new Date(record.updated_at), "dd MMM yyyy, HH:mm:ss")}</span>}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <RecordHistoryList entityType={target.entity_type} entityId={target.entity_id} />
          </div>
        </>}
      </SheetContent>
    </Sheet>
  );
}