import { useEffect, useMemo, useState } from "react";
import { History, Undo2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DerivedPathwaysForRecord, GroupChip, NodeChips, NodeFilterEmpty, OperationChip, PathwayRef, RoleNodeLine, ScopeChip, ScopeSummary, SectionBulkBar, SectionFilterSelect, SectionSearch, SectionToolbar, TargetRef, ValueDiff, useHistorySheet, useNodeFilter } from "@/components/hitl";
import { FIELD_LABELS, nodeListMatches, affectedPathwayIds, derivedCompanyPathwayIds, derivedPathwayIds, groupById, indicatorLabel, methodTagLabel, rolePosition, useHitlStore, type AuditEntityType, type AuditEntry, type AuditOperation, type MethodTag } from "@/lib/hitlStore";
import { cn } from "@/lib/utils";

const entityTypes: { value: AuditEntityType; label: string }[] = [
  { value: "pathway", label: "Pathway" }, { value: "group", label: "Group" }, { value: "company", label: "Company" },
  { value: "paper_match", label: "Paper match" }, { value: "patent_match", label: "Patent match" },
  { value: "indicator_value", label: "Indicator value" },
];
const operations: AuditOperation[] = ["create", "update", "link_add", "link_remove", "approve", "reject", "revert"];
const quoteCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export function AuditLogSection() {
  const store = useHitlStore();
  const { openHistory } = useHistorySheet();
  const nodeFilter = useNodeFilter();
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("all");
  const [operation, setOperation] = useState("all");
  const [actor, setActor] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<AuditEntry | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const actors = useMemo(() => [...new Set(store.auditEntries.map(item => item.actor))].sort(), [store.auditEntries]);
  const matchesNodeFilter = (item: (typeof store.auditEntries)[number]) => {
    if (!nodeFilter.isActive) return true;
    if (item.entity_type === "pathway") return nodeFilter.matchingPathwayIds.has(item.entity_id);
    if (item.entity_type === "company") { const company = store.companies.find(row => row.id === item.entity_id); if (!company) return false; const position = rolePosition(company.role).positionKey; const direct = (!nodeFilter.feedstock || (position === "feedstock" && nodeListMatches(company.role_nodes, nodeFilter.feedstock))) && (!nodeFilter.product || (position === "product" && nodeListMatches(company.role_nodes, nodeFilter.product))); return direct || derivedCompanyPathwayIds(company, store.pathways).some(id => nodeFilter.matchingPathwayIds.has(id)); }
    if (item.entity_type === "paper_match" || item.entity_type === "patent_match") { const match = store.paperPatentMatches.find(row => row.id === item.entity_id); if (!match) return false; const normalize = (value: string | null) => value?.trim().toLocaleLowerCase() ?? ""; const direct = (!nodeFilter.feedstock || nodeListMatches(match.nodes.feedstock, nodeFilter.feedstock)) && (!nodeFilter.product || nodeListMatches(match.nodes.product, nodeFilter.product)); return direct || derivedPathwayIds(match, store.pathways).some(id => nodeFilter.matchingPathwayIds.has(id)); }
    if (item.entity_type === "group") return store.pathways.some(pathway => pathway.group_ids.includes(item.entity_id) && nodeFilter.matchingPathwayIds.has(pathway.id));
    const indicatorValue = store.indicatorValues.find(value => value.id === item.entity_id);
    if (!indicatorValue) return false;
    const norm = (value: string | null) => value?.trim().toLocaleLowerCase() ?? "";
    const directTarget = (!nodeFilter.feedstock || norm(indicatorValue.target.feedstock) === norm(nodeFilter.feedstock)) && (!nodeFilter.product || norm(indicatorValue.target.product) === norm(nodeFilter.product));
    return directTarget || affectedPathwayIds(indicatorValue, store.pathways).some(id => nodeFilter.matchingPathwayIds.has(id));
  };
  const filtered = useMemo(() => store.auditEntries.filter(item => {
    const haystack = [item.entity_id, item.actor, item.field, item.note].join(" ").toLowerCase();
    const time = new Date(item.timestamp).getTime();
    return matchesNodeFilter(item) && (!search || haystack.includes(search.toLowerCase())) && (entity === "all" || item.entity_type === entity) && (operation === "all" || item.operation === operation) && (actor === "all" || item.actor === actor) && (!from || time >= new Date(`${from}T00:00:00`).getTime()) && (!to || time <= new Date(`${to}T23:59:59.999`).getTime());
  }).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)), [store.auditEntries, store.companies, store.pathways, store.paperPatentMatches, store.indicatorValues, search, entity, operation, actor, from, to, nodeFilter.feedstock, nodeFilter.product]);
  const pages = Math.max(1, Math.ceil(filtered.length / 25));
  useEffect(() => setPage(1), [search, entity, operation, actor, from, to]);
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  const rows = filtered.slice((page - 1) * 25, page * 25);
  const selectedEntries = selected.map(id => store.auditEntries.find(item => item.id === id)).filter((item): item is AuditEntry => Boolean(item));
  const selectedStates = selectedEntries.map(item => ({ item, reverted: store.revertedBy(item), intervening: store.isSuperseded(item) }));
  const bulkSuperseded = selectedStates.some(state => !state.reverted && state.intervening.length > 0);
  const fieldLabel = (field: string | null) => field ? FIELD_LABELS[field] ?? field : "Record";
  const diffValue = (item: AuditEntry, value: unknown) => item.field === "method_tag" ? methodTagLabel(value as MethodTag | null) : value;
  const priorLabel = (value: unknown) => value === null ? "null" : typeof value === "string" ? value : JSON.stringify(value);
  const relatedPathwayId = (item: (typeof store.auditEntries)[number]) => {
    if (item.entity_type === "pathway") return item.entity_id;
    return null;
  };
  const reset = () => { setSearch(""); setEntity("all"); setOperation("all"); setActor("all"); setFrom(""); setTo(""); };
  const doRevert = () => {
    if (!confirm) return;
    const entry = store.revertEntry(confirm.id);
    setConfirm(null);
    if (entry) toast.success(`Reverted — entry ${entry.id} written`);
  };
  const doBulkRevert = () => {
    const eligible = selectedStates.filter(state => !state.reverted).sort((a, b) => +new Date(b.item.timestamp) - +new Date(a.item.timestamp));
    let reverted = 0;
    eligible.forEach(({ item }) => { if (store.revertEntry(item.id)) reverted += 1; });
    const skipped = selectedStates.length - reverted;
    setBulkConfirm(false); setAcknowledged(false); setSelected([]);
    toast.success(`${reverted} reverted · ${skipped} skipped`);
  };
  const exportCsv = () => {
    const header = ["Timestamp", "Actor", "Entity type", "Entity ID", "Operation", "Field", "Prior value", "New value", "Note"];
    const body = filtered.map(item => [item.timestamp, item.actor, item.entity_type, item.entity_id, item.operation, item.field, JSON.stringify(item.prior_value), JSON.stringify(item.new_value), item.note]);
    const blob = new Blob([[header, ...body].map(row => row.map(quoteCsv).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "data-review-audit-log.csv"; link.click(); URL.revokeObjectURL(url);
  };
  const simulate = () => {
    const target = store.indicatorValues[Math.floor(Math.random() * store.indicatorValues.length)];
    if (!target) return;
    const value = Math.random() < .2 ? null : Number((Math.random() * 100).toFixed(1));
    const entry = store.recordChange({ entity_type: "indicator_value", entity_id: target.id, field: "value", prior_value: target.value, new_value: value, operation: "update", trace_id: `tr_${Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}` });
    toast.success(`Pipeline change written — ${entry.id}`);
  };
  const filtersActive = Boolean(search || entity !== "all" || operation !== "all" || actor !== "all" || from || to);
  const renderEntitySummary = (item: AuditEntry) => {
    const evidence = item.entity_type === "paper_match" || item.entity_type === "patent_match" ? store.paperPatentMatches.find(match => match.id === item.entity_id) : null;
    const company = item.entity_type === "company" ? store.companies.find(row => row.id === item.entity_id) : null;
    const indicatorValue = item.entity_type === "indicator_value" ? store.indicatorValues.find(row => row.id === item.entity_id) : null;
    const group = item.entity_type === "group" ? groupById(store.groups, item.entity_id) : null;
    return <div className="space-y-1"><div className="flex items-center gap-2"><span className="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded border px-2 text-xs text-muted-foreground">{entityTypes.find(type => type.value === item.entity_type)?.label}</span><Button variant="link" className="h-auto p-0 font-mono text-[10px]" onClick={() => openHistory(item.entity_type, item.entity_id)}>{item.entity_id}</Button></div>{company ? <div className="max-w-[520px] space-y-1"><span className="block truncate font-medium">{company.name}</span><RoleNodeLine company={company} compact /></div> : evidence ? <div className="max-w-[520px] space-y-1"><span className="block truncate font-medium">{evidence.title}</span><div className="flex flex-wrap items-center gap-1"><NodeChips nodes={evidence.nodes} compact /><DerivedPathwaysForRecord match={evidence} /><ScopeSummary match={evidence} /></div></div> : indicatorValue ? <div className="max-w-[520px] space-y-1"><div className="flex flex-wrap items-center gap-2"><ScopeChip scope={indicatorValue.scope} /><span className="font-medium">{indicatorLabel(indicatorValue.indicator_key)}</span></div><div className="max-w-[520px] text-muted-foreground"><TargetRef iv={indicatorValue} /></div></div> : group ? <GroupChip group={group} /> : relatedPathwayId(item) ? <div className="max-w-[420px] text-muted-foreground"><PathwayRef pathwayId={relatedPathwayId(item) ?? ""} variant="inline" showId={item.entity_type !== "pathway"} /></div> : null}</div>;
  };
  const intervening = confirm ? store.isSuperseded(confirm) : [];
  const confirmRevertedBy = confirm ? store.revertedBy(confirm) : null;
  return <div>
    <SectionToolbar title="Audit Log" description="Review every action, field change and reverted operation." filtersActive={filtersActive} onReset={reset} count={filtered.length} total={store.auditEntries.length} actions={<Button variant="outline" size="sm" className="h-9 text-xs" onClick={exportCsv}>Export CSV</Button>} filters={<><SectionSearch value={search} onChange={setSearch} placeholder="Search audit entries…" /><SectionFilterSelect value={entity} onChange={setEntity} label="Entity type"><SelectItem value="all">All entity types</SelectItem>{entityTypes.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SectionFilterSelect><SectionFilterSelect value={operation} onChange={setOperation} label="Operation"><SelectItem value="all">All operations</SelectItem>{operations.map(item => <SelectItem key={item} value={item}>{item.replace("_", " ")}</SelectItem>)}</SectionFilterSelect><SectionFilterSelect value={actor} onChange={setActor} label="Actor"><SelectItem value="all">All actors</SelectItem>{actors.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SectionFilterSelect><div className="flex h-9 shrink-0 items-center overflow-hidden rounded-md border"><Input aria-label="From date" type="date" value={from} onChange={event => setFrom(event.target.value)} className="h-9 w-36 rounded-none border-0 text-[10px]" /><span className="text-xs text-muted-foreground">–</span><Input aria-label="To date" type="date" value={to} onChange={event => setTo(event.target.value)} className="h-9 w-36 rounded-none border-0 text-[10px]" /></div></>} bulkBar={<SectionBulkBar count={selected.length} onClear={() => setSelected([])}><Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setAcknowledged(false); setBulkConfirm(true); }}>Revert selected</Button></SectionBulkBar>} />
    <div className="overflow-x-auto"><Table className="min-w-[1320px]"><TableHeader><TableRow><TableHead className="sticky left-0 z-20 w-9 min-w-9 bg-background"><Checkbox aria-label="Select all audit entries" checked={filtered.length > 0 && filtered.every(item => selected.includes(item.id))} onCheckedChange={checked => setSelected(checked ? filtered.map(item => item.id) : [])} /></TableHead><TableHead className="min-w-40">Timestamp</TableHead><TableHead>Actor</TableHead><TableHead className="min-w-[18rem] whitespace-nowrap">Entity</TableHead><TableHead className="min-w-32 whitespace-nowrap">Operation</TableHead><TableHead className="min-w-32">Field</TableHead><TableHead className="min-w-64">Change</TableHead><TableHead className="min-w-48">Note</TableHead><TableHead className="sticky right-0 z-20 min-w-24 bg-background text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
      {rows.map(item => { const undo = store.revertedBy(item); return <TableRow key={item.id} className={cn("text-[10px]", item.operation === "revert" && "border-l-2 border-l-warning", undo && "border-l-2 border-l-muted-foreground")}><TableCell className="sticky left-0 z-10 bg-background"><Checkbox aria-label={`Select ${item.id}`} checked={selected.includes(item.id)} onCheckedChange={checked => setSelected(ids => checked ? [...ids, item.id] : ids.filter(id => id !== item.id))} /></TableCell><TableCell className="whitespace-nowrap font-mono">{format(new Date(item.timestamp), "dd MMM yyyy, HH:mm:ss")}</TableCell><TableCell>{item.actor}</TableCell><TableCell className="min-w-[18rem]">{renderEntitySummary(item)}</TableCell><TableCell className="min-w-32 whitespace-nowrap"><OperationChip operation={item.operation} /></TableCell><TableCell className="font-mono">{fieldLabel(item.field)}</TableCell><TableCell><ValueDiff prior_value={diffValue(item, item.prior_value)} new_value={diffValue(item, item.new_value)} /></TableCell><TableCell className="max-w-48 truncate italic text-muted-foreground">{item.entity_type === "company" ? item.note?.replace(/evidence/gi, "relevance") ?? "—" : item.note ?? "—"}</TableCell><TableCell className="sticky right-0 z-10 bg-background"><div className="flex justify-end gap-1"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`History for ${item.id}`} onClick={() => openHistory(item.entity_type, item.entity_id)}><History className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>History</TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><span><Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Revert ${item.id}`} disabled={Boolean(undo)} onClick={() => setConfirm(item)}><Undo2 className="h-3.5 w-3.5" /></Button></span></TooltipTrigger><TooltipContent>{undo ? `Reverted by ${undo.id}` : "Revert"}</TooltipContent></Tooltip></div></TableCell></TableRow>; })}
      {rows.length === 0 && <TableRow><TableCell colSpan={9} className="p-0">{nodeFilter.isActive ? <NodeFilterEmpty rows="audit entries" /> : <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">No audit entries match these filters.</div>}</TableCell></TableRow>}
    </TableBody></Table></div>
    <div className="flex items-center justify-between border-t px-4 py-3"><span className="text-[10px] text-muted-foreground">Page {page} of {pages}</span><div className="flex gap-1"><Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous</Button><Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={page === pages} onClick={() => setPage(value => value + 1)}>Next</Button></div></div>
    {import.meta.env.DEV && <div className="m-4 flex items-center justify-between rounded-md border border-dashed p-3"><span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">DEV — simulate pipeline change</span><Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={simulate}>Update random indicator value</Button></div>}
    <AlertDialog open={confirm !== null} onOpenChange={open => { if (!open) setConfirm(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{intervening.length ? "This change has been superseded" : `Revert ${fieldLabel(confirm?.field ?? null)} to ${priorLabel(confirm?.prior_value)}?`}</AlertDialogTitle><AlertDialogDescription>{intervening.length ? "Later changes will be overwritten by this revert." : "A new audit entry will be written."}</AlertDialogDescription></AlertDialogHeader>{confirm && <div className="rounded-md border p-3">{renderEntitySummary(confirm)}</div>}{intervening.length > 0 && <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">{intervening.map(item => <div key={item.id} className="text-[10px]"><span className="font-mono text-muted-foreground">{format(new Date(item.timestamp), "dd MMM HH:mm")}</span> · {item.actor}<div><ValueDiff prior_value={item.prior_value} new_value={item.new_value} /></div></div>)}</div>}{confirmRevertedBy && <p className="text-xs text-muted-foreground">Reverted by {confirmRevertedBy.id}</p>}<AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={Boolean(confirmRevertedBy)} onClick={doRevert}>{intervening.length ? "Revert anyway" : "Revert"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={bulkConfirm} onOpenChange={open => { setBulkConfirm(open); if (!open) setAcknowledged(false); }}><AlertDialogContent className="sm:max-w-2xl"><AlertDialogHeader><AlertDialogTitle>Revert {selectedEntries.length} selected entries?</AlertDialogTitle><AlertDialogDescription>Revertible entries will be applied newest first. Already reverted entries will be skipped.</AlertDialogDescription></AlertDialogHeader><div className="max-h-[50vh] space-y-2 overflow-y-auto">{selectedStates.map(({ item, reverted, intervening: later }) => <div key={item.id} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_auto]"><div>{renderEntitySummary(item)}<div className="mt-2 flex items-center gap-2"><code className="text-[10px] text-muted-foreground">{fieldLabel(item.field)}</code><ValueDiff prior_value={item.prior_value} new_value={item.new_value} /></div></div><span className={cn("text-xs", later.length > 0 && !reverted ? "text-warning-foreground" : "text-muted-foreground")}>{reverted ? "Already reverted · skipped" : later.length > 0 ? "Superseded" : "Revertible"}</span></div>)}</div>{bulkSuperseded && <label className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs"><Checkbox checked={acknowledged} onCheckedChange={value => setAcknowledged(value === true)} /><span>I understand superseded changes will be overwritten</span></label>}<AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={bulkSuperseded && !acknowledged} onClick={doBulkRevert}>Revert selected</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
