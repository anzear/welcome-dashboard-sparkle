import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DerivedPathwaysForRecord, NodeChips, NodeFilterEmpty, OperationChip, PathwayRef, RoleNodeLine, ScopeChip, ScopeSummary, SectionFilterSelect, SectionSearch, SectionToolbar, TargetRef, ValueDiff, useHistorySheet, useNodeFilter } from "@/components/hitl";
import { FIELD_LABELS, affectedPathwayIds, derivedCompanyPathwayIds, derivedPathwayIds, indicatorLabel, rolePosition, useHitlStore, type AuditEntityType, type AuditOperation } from "@/lib/hitlStore";
import { cn } from "@/lib/utils";

const entityTypes: { value: AuditEntityType; label: string }[] = [
  { value: "pathway", label: "Pathway" }, { value: "group", label: "Group" }, { value: "company", label: "Company" },
  { value: "paper_match", label: "Paper match" }, { value: "patent_match", label: "Patent match" },
  { value: "indicator_value", label: "Indicator value" },
];
const operations: AuditOperation[] = ["create", "update", "deactivate", "link_add", "link_remove", "accept", "reject", "revert"];
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
  const actors = useMemo(() => [...new Set(store.auditEntries.map(item => item.actor))].sort(), [store.auditEntries]);
  const matchesNodeFilter = (item: (typeof store.auditEntries)[number]) => {
    if (!nodeFilter.isActive) return true;
    if (item.entity_type === "pathway") return nodeFilter.matchingPathwayIds.has(item.entity_id);
    if (item.entity_type === "company") { const company = store.companies.find(row => row.id === item.entity_id); if (!company) return false; const position = rolePosition(company.role).positionKey; const direct = (!nodeFilter.feedstock || (position === "feedstock" && company.role_node.trim().toLocaleLowerCase() === nodeFilter.feedstock.trim().toLocaleLowerCase())) && (!nodeFilter.product || (position === "product" && company.role_node.trim().toLocaleLowerCase() === nodeFilter.product.trim().toLocaleLowerCase())); return direct || derivedCompanyPathwayIds(company, store.pathways).some(id => nodeFilter.matchingPathwayIds.has(id)); }
    if (item.entity_type === "paper_match" || item.entity_type === "patent_match") { const match = store.paperPatentMatches.find(row => row.id === item.entity_id); if (!match) return false; const normalize = (value: string | null) => value?.trim().toLocaleLowerCase() ?? ""; const direct = (!nodeFilter.feedstock || normalize(match.nodes.feedstock) === normalize(nodeFilter.feedstock)) && (!nodeFilter.product || normalize(match.nodes.product) === normalize(nodeFilter.product)); return direct || derivedPathwayIds(match, store.pathways).some(id => nodeFilter.matchingPathwayIds.has(id)); }
    if (item.entity_type === "group") return store.pathways.some(pathway => pathway.group_id === item.entity_id && nodeFilter.matchingPathwayIds.has(pathway.id));
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
  const relatedPathwayId = (item: (typeof store.auditEntries)[number]) => {
    if (item.entity_type === "pathway") return item.entity_id;
    return null;
  };
  const reset = () => { setSearch(""); setEntity("all"); setOperation("all"); setActor("all"); setFrom(""); setTo(""); };
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
  return <div>
    <SectionToolbar title="Audit Log" description="Review every action, field change and reverted operation." filtersActive={filtersActive} onReset={reset} count={filtered.length} total={store.auditEntries.length} actions={<Button variant="outline" size="sm" className="h-9 text-xs" onClick={exportCsv}>Export CSV</Button>} filters={<><SectionSearch value={search} onChange={setSearch} placeholder="Search audit entries…" /><SectionFilterSelect value={entity} onChange={setEntity} label="Entity type"><SelectItem value="all">All entity types</SelectItem>{entityTypes.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SectionFilterSelect><SectionFilterSelect value={operation} onChange={setOperation} label="Operation"><SelectItem value="all">All operations</SelectItem>{operations.map(item => <SelectItem key={item} value={item}>{item.replace("_", " ")}</SelectItem>)}</SectionFilterSelect><SectionFilterSelect value={actor} onChange={setActor} label="Actor"><SelectItem value="all">All actors</SelectItem>{actors.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SectionFilterSelect><div className="flex h-9 shrink-0 items-center overflow-hidden rounded-md border"><Input aria-label="From date" type="date" value={from} onChange={event => setFrom(event.target.value)} className="h-9 w-36 rounded-none border-0 text-[10px]" /><span className="text-xs text-muted-foreground">–</span><Input aria-label="To date" type="date" value={to} onChange={event => setTo(event.target.value)} className="h-9 w-36 rounded-none border-0 text-[10px]" /></div></>} />
    <div className="overflow-x-auto"><Table className="min-w-[1180px]"><TableHeader><TableRow><TableHead className="sticky left-0 z-20 min-w-40 bg-background">Timestamp</TableHead><TableHead>Actor</TableHead><TableHead className="min-w-[9.5rem] whitespace-nowrap">Entity</TableHead><TableHead className="min-w-32 whitespace-nowrap">Operation</TableHead><TableHead>Field</TableHead><TableHead>Change</TableHead><TableHead className="sticky right-0 z-20 min-w-48 bg-background">Note</TableHead></TableRow></TableHeader><TableBody>
      {rows.map(item => { const evidence = item.entity_type === "paper_match" || item.entity_type === "patent_match" ? store.paperPatentMatches.find(match => match.id === item.entity_id) : null; const company = item.entity_type === "company" ? store.companies.find(row => row.id === item.entity_id) : null; const indicatorValue = item.entity_type === "indicator_value" ? store.indicatorValues.find(row => row.id === item.entity_id) : null; return <TableRow key={item.id} className={cn("text-[10px]", item.operation === "revert" && "border-l-2 border-l-warning", store.revertedBy(item) && "border-l-2 border-l-muted-foreground")}><TableCell className="sticky left-0 z-10 whitespace-nowrap bg-background font-mono">{format(new Date(item.timestamp), "dd MMM yyyy, HH:mm:ss")}</TableCell><TableCell>{item.actor}</TableCell><TableCell className="min-w-[9.5rem]"><div className="space-y-1"><div className="flex items-center gap-2"><span className="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded border px-2 text-xs text-muted-foreground">{entityTypes.find(type => type.value === item.entity_type)?.label}</span><Button variant="link" className="h-auto p-0 font-mono text-[10px]" onClick={() => openHistory(item.entity_type, item.entity_id)}>{item.entity_id}</Button></div>{company ? <div className="max-w-[520px] space-y-1"><span className="block truncate font-medium">{company.name}</span><RoleNodeLine company={company} compact /></div> : evidence ? <div className="max-w-[520px] space-y-1"><span className="block truncate font-medium">{evidence.title}</span><div className="flex flex-wrap items-center gap-1"><NodeChips nodes={evidence.nodes} compact /><DerivedPathwaysForRecord match={evidence} /><ScopeSummary match={evidence} /></div></div> : indicatorValue ? <div className="max-w-[520px] space-y-1"><div className="flex flex-wrap items-center gap-2"><ScopeChip scope={indicatorValue.scope} /><span className="font-medium">{indicatorLabel(indicatorValue.indicator_key)}</span></div><div className="max-w-[520px] text-muted-foreground"><TargetRef iv={indicatorValue} /></div></div> : relatedPathwayId(item) && <div className="max-w-[420px] text-muted-foreground"><PathwayRef pathwayId={relatedPathwayId(item) ?? ""} variant="inline" showId={item.entity_type !== "pathway"} /></div>}</div></TableCell><TableCell className="min-w-32 whitespace-nowrap"><OperationChip operation={item.operation} /></TableCell><TableCell className="font-mono">{item.entity_type === "company" && item.field ? FIELD_LABELS[item.field] ?? item.field : item.field ?? "record"}</TableCell><TableCell><ValueDiff prior_value={item.prior_value} new_value={item.new_value} /></TableCell><TableCell className="sticky right-0 z-10 max-w-48 truncate bg-background italic text-muted-foreground">{item.note ?? "—"}</TableCell></TableRow>; })}
      {rows.length === 0 && <TableRow><TableCell colSpan={7} className="p-0">{nodeFilter.isActive ? <NodeFilterEmpty rows="audit entries" /> : <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">No audit entries match these filters.</div>}</TableCell></TableRow>}
    </TableBody></Table></div>
    <div className="flex items-center justify-between border-t px-4 py-3"><span className="text-[10px] text-muted-foreground">Page {page} of {pages}</span><div className="flex gap-1"><Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous</Button><Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={page === pages} onClick={() => setPage(value => value + 1)}>Next</Button></div></div>
    {import.meta.env.DEV && <div className="m-4 flex items-center justify-between rounded-md border border-dashed p-3"><span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">DEV — simulate pipeline change</span><Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={simulate}>Update random indicator value</Button></div>}
  </div>;
}
