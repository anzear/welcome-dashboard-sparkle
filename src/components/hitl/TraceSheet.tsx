import { Copy } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ActorStamp, OperationChip, PathwayStatusChip, ReviewStatusChip, ValueCell, ValueDiff } from "./ReviewPrimitives";
import { PathwayRef } from "./PathwayRef";
import { DerivedPathwaysForRecord, NodeChips, ScopeSummary } from "./EvidenceMatchPrimitives";
import { RoleNodeLine } from "./CompanyFitPrimitives";
import { ScopeChip, TargetRef } from "./IndicatorPrimitives";
import { useHistorySheet } from "./RecordHistorySheet";
import { useTraceSheet } from "./TraceSheetContext";
import { displayedValue, indicatorLabel, useHitlStore, type AuditEntry, type AuditEntityType, type HitlRecord } from "@/lib/hitlStore";
import { getTrace } from "@/lib/mockTraces";

const entityLabels: Record<AuditEntityType, string> = { pathway: "Pathway", group: "Group", company: "Company", paper_match: "Paper match", patent_match: "Patent match", indicator_value: "Indicator value" };
const decisionOperations = new Set(["accept", "reject", "update", "deactivate", "revert"]);

function recordSummary(record: HitlRecord, type: AuditEntityType, store: ReturnType<typeof useHitlStore>) {
  if (type === "pathway" && "feedstock" in record) return [record.feedstock, record.process_technology, record.product, record.application_market].join(" → ");
  if (type === "company" && "name" in record) return record.name;
  if ((type === "paper_match" || type === "patent_match") && "title" in record) return record.title;
  if (type === "indicator_value" && "indicator_key" in record) return indicatorLabel(record.indicator_key);
  return record.id;
}

function AuditRows({ entries, empty }: { entries: AuditEntry[]; empty: string }) {
  if (!entries.length) return <p className="py-6 text-center text-xs text-muted-foreground">{empty}</p>;
  return <div className="divide-y rounded-md border">{entries.map(entry => <div key={entry.id} className="space-y-1.5 px-3 py-2.5"><div className="flex flex-wrap items-center gap-2"><time className="font-mono text-[9px] text-muted-foreground">{format(new Date(entry.timestamp), "dd MMM yyyy, HH:mm:ss")}</time><ActorStamp name={entry.actor} timestamp={entry.timestamp} /><OperationChip operation={entry.operation} /></div><div className="flex min-w-0 flex-wrap items-center gap-2"><code className="font-mono text-[10px] text-muted-foreground">{entry.field ?? "record"}</code><ValueDiff prior_value={entry.prior_value} new_value={entry.new_value} /></div>{entry.note && <p className="text-[10px] italic text-muted-foreground">{entry.note}</p>}</div>)}</div>;
}

export function TraceSheet() {
  const { traceId, closeTrace } = useTraceSheet();
  const { openHistory } = useHistorySheet();
  const store = useHitlStore();
  const trace = traceId ? getTrace(traceId) : null;
  const typedRecords: { type: AuditEntityType; record: HitlRecord }[] = traceId ? [
    ...store.pathways.filter(item => item.trace_id === traceId).map(record => ({ type: "pathway" as const, record })),
    ...store.companies.filter(item => item.trace_id === traceId).map(record => ({ type: "company" as const, record })),
    ...store.paperMatches().filter(item => item.trace_id === traceId).map(record => ({ type: "paper_match" as const, record })),
    ...store.patentMatches().filter(item => item.trace_id === traceId).map(record => ({ type: "patent_match" as const, record })),
    ...store.indicatorValues.filter(item => item.trace_id === traceId).map(record => ({ type: "indicator_value" as const, record })),
  ] : [];
  const recordIds = new Set(typedRecords.map(item => `${item.type}:${item.record.id}`));
  const decisions = store.auditEntries.filter(entry => recordIds.has(`${entry.entity_type}:${entry.entity_id}`) && decisionOperations.has(entry.operation)).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  const carrying = store.auditEntries.filter(entry => entry.trace_id === traceId).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  const counts = { accepted: decisions.filter(item => item.operation === "accept").length, rejected: decisions.filter(item => item.operation === "reject").length, corrected: decisions.filter(item => item.operation === "update").length, reverted: decisions.filter(item => item.operation === "revert").length };
  const openRecord = (type: AuditEntityType, id: string) => { closeTrace(); window.setTimeout(() => openHistory(type, id), 0); };
  return <Sheet open={traceId !== null} onOpenChange={open => { if (!open) closeTrace(); }}><SheetContent className="flex w-[min(96vw,760px)] flex-col gap-0 p-0 sm:max-w-[760px]">{trace && <><SheetHeader className="border-b px-5 py-4 pr-12"><div className="flex items-center gap-1"><SheetTitle className="break-all font-mono text-xs">{trace.trace_id}</SheetTitle><Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label="Copy full trace ID" onClick={() => void navigator.clipboard.writeText(trace.trace_id)}><Copy className="h-3 w-3" /></Button></div><SheetDescription className="space-y-1 text-left"><span className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="inline-flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs font-normal">{trace.chain}</Badge><code className="font-mono text-[9px]">{trace.model} · {trace.prompt_version}</code></span><time className="block font-mono text-[9px]">{format(new Date(trace.called_at), "dd MMM yyyy, HH:mm:ss")}</time>{trace.note && <span className="block text-[10px] italic">{trace.note}</span>}</SheetDescription></SheetHeader><div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4"><section><h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Call</h3><div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 rounded-md border p-3 text-xs">{[["Temperature", trace.temperature], ["Latency", `${trace.latency_ms} ms`], ["Tokens in", trace.token_in], ["Tokens out", trace.token_out], ["Input summary", trace.input_summary], ["Output summary", trace.output_summary]].map(([label, value]) => <div className="contents" key={String(label)}><span className="text-muted-foreground">{label}</span><ValueCell value={value} /></div>)}</div></section><section><h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Records produced by this call</h3>{typedRecords.length ? <div className="divide-y rounded-md border">{typedRecords.map(({ type, record }) => { const status = "status" in record ? record.status : null; const evidence = (type === "paper_match" || type === "patent_match") && "matched_nodes" in record ? record : null; const company = type === "company" && "role_node" in record ? record : null; return <div key={`${type}:${record.id}`} className="flex items-center gap-2 px-3 py-2.5"><Badge variant="outline" className="inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap px-2 text-xs font-normal text-muted-foreground">{entityLabels[type]}</Badge><Button variant="link" className="h-auto shrink-0 p-0 font-mono text-[10px]" onClick={() => openRecord(type, record.id)}>{record.id}</Button><div className="min-w-0 flex-1 text-[10px]">{type === "pathway" ? <PathwayRef pathwayId={record.id} variant="inline" /> : company ? <><span className="block truncate font-medium">{company.name}</span><RoleNodeLine company={company} compact /></> : evidence ? <><span className="block truncate font-medium">{evidence.title}</span><span className="mt-1 flex flex-wrap items-center gap-1"><NodeValueChips values={evidence.matched_nodes} compact /><DerivedPathwaysForRecord match={evidence} /><ScopeSummary match={evidence} /></span></> : "indicator_key" in record ? <><span className="flex flex-wrap items-center gap-2"><ScopeChip scope={record.scope} /><span className="truncate font-medium">{indicatorLabel(record.indicator_key)}</span></span><span className="mt-1 block text-muted-foreground"><TargetRef iv={record} /></span></> : <span className="block truncate">{recordSummary(record, type, store)}</span>}</div>{status && (type === "pathway" ? <PathwayStatusChip status={status as never} /> : <ReviewStatusChip status={status as never} />)}{type === "indicator_value" && "indicator_key" in record && <span className="shrink-0 text-xs font-semibold"><ValueCell value={displayedValue(record)} unit={record.unit} /></span>}</div>; })}</div> : <p className="py-6 text-center text-xs text-muted-foreground">No records reference this trace.</p>}</section><section><h3 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Human decisions on these records</h3><p className="mb-2 text-[10px] text-muted-foreground">{decisions.length} decisions · {counts.accepted} accepted · {counts.rejected} rejected · {counts.corrected} corrected · {counts.reverted} reverted</p><AuditRows entries={decisions} empty="No human decisions yet." /></section><section><h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Audit entries carrying this trace</h3><AuditRows entries={carrying} empty="No audit entries carry this trace." /></section></div></>}</SheetContent></Sheet>;
}