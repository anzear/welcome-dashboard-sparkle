import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ActorStamp, OperationChip, ValueDiff } from "./ReviewPrimitives";
import { RoleNodeLine } from "./CompanyFitPrimitives";
import { PathwayRef } from "./PathwayRef";
import { DerivedPathwaysForRecord, NodeChips, ScopeSummary } from "./EvidenceMatchPrimitives";
import { ScopeChip, TargetRef } from "./IndicatorPrimitives";
import { SourcesPopover } from "./IndicatorSources";
import { FIELD_LABELS, groupById, indicatorLabel, methodTagLabel, useHitlStore, type AuditEntityType, type AuditEntry, type Company, type Group, type HitlRecord, type IndicatorValue, type PaperPatentMatch } from "@/lib/hitlStore";
import { GroupChip } from "./GroupChip";
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
        const fieldLabel = entry.field ? FIELD_LABELS[entry.field] ?? entry.field : "Record";
        return <div key={entry.id} ref={node => { refs.current[entry.id] = node; }} className={cn("rounded-md border px-3 py-3 transition-colors", highlight === entry.id && "border-primary bg-primary/5")}>
          <div className="mb-2 flex flex-wrap items-center gap-2"><time className="font-mono text-[9px] text-muted-foreground">{format(new Date(entry.timestamp), "dd MMM yyyy, HH:mm:ss")}</time><ActorStamp name={entry.actor} timestamp={entry.timestamp} /><OperationChip operation={entry.operation} /></div>
           <div className="grid gap-2 sm:grid-cols-[100px_1fr_auto]"><code className="font-mono text-[10px] text-muted-foreground">{fieldLabel}</code>{entry.entity_type === "pathway" && entry.field === "group_ids" ? <div className="flex flex-wrap items-center gap-2 text-xs"><GroupIdList ids={entry.prior_value} /><span>→</span><GroupIdList ids={entry.new_value} /></div> : <ValueDiff prior_value={entry.field === "method_tag" ? methodTagLabel(entry.prior_value as IndicatorValue["method_tag"]) : entry.prior_value} new_value={entry.field === "method_tag" ? methodTagLabel(entry.new_value as IndicatorValue["method_tag"]) : entry.new_value} />}<Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" disabled={Boolean(undo)} onClick={() => setConfirm(entry)}>Revert</Button></div>
          {entry.note && <p className="mt-2 text-[10px] italic text-muted-foreground">{entry.entity_type === "company" ? entry.note.replace(/evidence/gi, "relevance") : entry.note}</p>}
           <div className="mt-2 flex flex-wrap items-center gap-2">{undo && <span className="text-[9px] text-muted-foreground">Reverted by {undo.id}</span>}{later.length > 0 && !undo && <Tooltip><TooltipTrigger asChild><span className="cursor-help text-[9px] font-medium text-warning-foreground">Superseded</span></TooltipTrigger><TooltipContent>Later entries: {later.map(item => item.id).join(", ")}</TooltipContent></Tooltip>}{entry.operation === "revert" && entry.reverts_entry_id && <Button variant="link" className="h-auto p-0 text-[9px]" onClick={() => jumpTo(entry.reverts_entry_id ?? "")}>Reverts {entry.reverts_entry_id}</Button>}</div>
        </div>;
      })}
    </div>}
    <AlertDialog open={confirm !== null} onOpenChange={open => { if (!open) setConfirm(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{intervening.length ? "This change has been superseded" : `Revert ${confirm?.field ? FIELD_LABELS[confirm.field] ?? confirm.field : "Record"}?`}</AlertDialogTitle><AlertDialogDescription>{intervening.length ? "Later changes will be overwritten by this revert." : <>Revert <code>{confirm?.field ? FIELD_LABELS[confirm.field] ?? confirm.field : "Record"}</code> to its prior value? A new audit entry will be written.</>}</AlertDialogDescription></AlertDialogHeader>
        {intervening.length > 0 && <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">{intervening.map(item => <div key={item.id} className="text-[10px]"><span className="font-mono text-muted-foreground">{format(new Date(item.timestamp), "dd MMM HH:mm")}</span> · {item.actor}<div><ValueDiff prior_value={item.prior_value} new_value={item.new_value} /></div></div>)}</div>}
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={doRevert}>{intervening.length ? "Revert anyway" : "Revert"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}

const labels: Record<AuditEntityType, string> = { pathway: "Pathway", group: "Group", company: "Company", paper_match: "Paper match", patent_match: "Patent match", indicator_value: "Indicator value", enrichment_run: "Enrichment run" };
function GroupIdList({ ids }: { ids: unknown }) {
  const list = Array.isArray(ids) ? ids.filter((value): value is string => typeof value === "string") : typeof ids === "string" ? [ids] : [];
  if (list.length === 0) return <span className="text-muted-foreground">No groups</span>;
  return <span className="flex flex-wrap items-center gap-1">{list.map(id => <GroupChip key={id} groupId={id} />)}</span>;
}
function summary(record: HitlRecord | null, type: AuditEntityType) {
  if (!record) return "Record unavailable";
  if (type === "pathway" && "feedstock" in record) return [record.feedstock, record.process_technology, record.product, record.application_market].join(" → ");
  if (type === "company" && "name" in record) return record.name;
  if (type === "group" && "name" in record) return record.name;
  if ((type === "paper_match" || type === "patent_match") && "title" in record) return record.title;
  if (type === "indicator_value" && "indicator_key" in record) return indicatorLabel(record.indicator_key);
  return record.id;
}

export function RecordHistorySheet() {
  const { target, closeHistory } = useHistorySheet();
  const store = useHitlStore();
  const record = target ? store.getRecord(target.entity_type, target.entity_id) : null;
  const isEvidence = Boolean(target && (target.entity_type === "paper_match" || target.entity_type === "patent_match") && record && "nodes" in record);
  const evidence = isEvidence ? record as PaperPatentMatch : null;
  const company = target?.entity_type === "company" && record && "roles" in record ? record as Company : null;
  const indicatorValue = target?.entity_type === "indicator_value" && record && "indicator_key" in record ? record as IndicatorValue : null;
  const relatedPathwayId = target?.entity_type === "pathway" ? target.entity_id : null;
  const group = target?.entity_type === "group" && record && "color_token" in record ? record as Group : null;
  return (
    <Sheet open={target !== null} onOpenChange={open => { if (!open) closeHistory(); }}>
      <SheetContent className="flex w-[min(94vw,680px)] flex-col gap-0 p-0 sm:max-w-[680px]">
        {target && <>
          <SheetHeader className="border-b px-5 py-4 pr-12">
             <div className="flex items-center gap-2"><SheetTitle className="text-sm">{labels[target.entity_type]}</SheetTitle><code className="font-mono text-[10px] text-muted-foreground">{target.entity_id}</code>{indicatorValue && <span className="inline-flex h-6 items-center whitespace-nowrap rounded-md bg-muted px-2 text-xs text-muted-foreground">Method: {methodTagLabel(indicatorValue.method_tag)}</span>}{indicatorValue && indicatorValue.sources.length > 0 && <SourcesPopover sources={indicatorValue.sources} />}</div>
             <SheetDescription className="text-xs">{target.entity_type === "pathway" ? <PathwayRef pathwayId={target.entity_id} variant="card" /> : group ? <GroupChip group={group} /> : company ? <span className="space-y-2"><span className="block truncate font-medium text-foreground">{company.name}</span><RoleNodeLine company={company} compact /></span> : evidence ? <span className="space-y-2"><span className="block truncate font-medium text-foreground">{evidence.title}</span><span className="flex flex-wrap items-center gap-1"><NodeChips nodes={evidence.nodes} compact /><DerivedPathwaysForRecord match={evidence} /><ScopeSummary match={evidence} /></span></span> : indicatorValue ? <span className="space-y-2"><span className="flex flex-wrap items-center gap-2"><ScopeChip scope={indicatorValue.scope} /><span className="font-medium text-foreground">{indicatorLabel(indicatorValue.indicator_key)}</span></span><TargetRef iv={indicatorValue} /></span> : <><span className="block truncate">{summary(record, target.entity_type)}</span>{relatedPathwayId && <span className="mt-2 block"><PathwayRef pathwayId={relatedPathwayId} variant="inline" /></span>}</>}</SheetDescription>
             {record && <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[9px] text-muted-foreground">Updated {format(new Date(record.updated_at), "dd MMM yyyy, HH:mm:ss")}</span></div>}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <RecordHistoryList entityType={target.entity_type} entityId={target.entity_id} />
          </div>
        </>}
      </SheetContent>
    </Sheet>
  );
}