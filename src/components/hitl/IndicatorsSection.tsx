import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceStrict } from "date-fns";
import { Check, ChevronDown, ChevronRight, Download, History, MoreHorizontal, Pencil, Plus, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AffectedPathways, ScopeChip, TargetRef, targetSearchText } from "./IndicatorPrimitives";
import { BulkAddIndicatorValuesDialog, downloadBulkIndicatorValuesTemplate } from "./BulkAddIndicatorValuesDialog";
import { ComputedChip, NodeFilterEmpty, PathwayRef, ReviewStatusChip, SectionBulkBar, SectionFilterSelect, SectionSearch, SectionToolbar, SourcesEditor, SourcesPopover, SplitAddButton, ValueCell, cleanSources, sourcesValid, useHistorySheet, useNodeFilter } from "@/components/hitl";
import {
  COMPUTED_RULES, INDICATORS, INDICATOR_SCOPES, METHOD_TAGS, SCOPE_DESCRIPTIONS, SCOPE_LABELS, SCOPE_TARGET_KEYS, TARGET_POSITION_LABELS,
  affectedPathwayIds, computedMatches, computedValue, displayedValue, emptyIndicatorTarget, findIndicatorValue, indicatorDefinition, indicatorLabel, unitForStorage,
  indicatorsForScope, isStale, sameIndicatorTarget, targetForPathway, targetLabel, targetToPathwayPosition, useHitlStore,
  sameSources, sourceDisplay, type IndicatorDefinition, type IndicatorScope, type IndicatorSource, type IndicatorTarget, type IndicatorTargetKey, type IndicatorValue, type IndicatorValueType, type MethodTag, type ReviewStatus,
} from "@/lib/hitlStore";
import { cn } from "@/lib/utils";

type DecidedStatus = Exclude<ReviewStatus, "review_pending">;
type DecisionTarget = { ids: string[]; status: DecidedStatus } | null;
type ViewMode = "flat" | "target";
type AddPreset = { scope: IndicatorScope; indicator_key: string; target: IndicatorTarget } | null;
type ComputedRow = { key: string; scope: IndicatorScope; indicator_key: string; target: IndicatorTarget };

const clean = (value: string | null | undefined) => (value ?? "").trim().toLocaleLowerCase();
const formatDate = (value: string | null) => value ? format(new Date(value), "dd MMM yyyy") : null;
const valueWithUnit = (value: number | null, unit: string | null) => <ValueCell value={value} unit={value === null ? null : unit} />;
const targetKey = (scope: IndicatorScope, target: IndicatorTarget) => `${scope}|${SCOPE_TARGET_KEYS[scope].map(key => clean(target[key])).join("|")}`;

function parseValue(raw: string, type: IndicatorValueType): { value: number } | { error: string } {
  const trimmed = raw.trim();
  if (trimmed === "") return { error: "Enter a value" };
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return { error: "Enter a number" };
  if (type === "trl") return Number.isInteger(parsed) && parsed >= 1 && parsed <= 9 ? { value: parsed } : { error: "TRL is an integer from 1 to 9" };
  if (type === "count") return Number.isInteger(parsed) && parsed >= 0 ? { value: parsed } : { error: "Count is an integer of 0 or more" };
  return { value: parsed };
}

function FilterSelect({ value, onChange, label, children, className }: { value: string; onChange: (value: string) => void; label: string; children: React.ReactNode; className?: string }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className={cn("h-8 w-40 text-[10px]", className)}><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select>;
}

function StalenessCell({ item }: { item: IndicatorValue }) {
  if (!isStale(item) || item.corrected_at === null) return <ValueCell value={null} />;
  const days = Math.floor((Date.now() - new Date(item.corrected_at).getTime()) / 86_400_000);
  return <Tooltip><TooltipTrigger asChild><span className="inline-flex"><Badge variant="outline" className="inline-flex h-6 items-center gap-1 whitespace-nowrap border-warning/40 bg-warning/10 px-2 text-xs text-warning-foreground">Stale · {days} d</Badge></span></TooltipTrigger><TooltipContent>Correction may be refreshed by the next pipeline run</TooltipContent></Tooltip>;
}

function NodeCombobox({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const [focused, setFocused] = useState(false);
  const normalized = value.trim();
  const exact = options.find(option => clean(option) === clean(normalized));
  const suggestions = options.filter(option => option.toLocaleLowerCase().includes(normalized.toLocaleLowerCase())).slice(0, 8);
  const isNew = Boolean(normalized) && !exact;
  return <div className="space-y-1.5"><Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</Label>
    <div className="relative">
      <Input value={value} onFocus={() => setFocused(true)} onChange={event => { onChange(event.target.value); setFocused(true); }} onBlur={() => window.setTimeout(() => setFocused(false), 120)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); onChange(exact ?? normalized); setFocused(false); } }} placeholder={`Enter ${label}…`} className="h-9 pr-20 text-xs" />
      {isNew && <Badge variant="outline" className="pointer-events-none absolute right-2 top-1/2 inline-flex h-6 -translate-y-1/2 items-center gap-1 whitespace-nowrap px-2 text-xs text-muted-foreground">New node</Badge>}
      {focused && suggestions.length > 0 && <div className="absolute z-[110] mt-1 max-h-44 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">{suggestions.map(option => <Button key={option} type="button" variant="ghost" className="h-auto w-full justify-start px-2 py-1.5 text-left text-xs" onMouseDown={event => event.preventDefault()} onClick={() => { onChange(option); setFocused(false); }}><Check className={cn("mr-2 h-3 w-3", exact === option ? "opacity-100" : "opacity-0")} />{option}</Button>)}</div>}
    </div>
  </div>;
}

function IndicatorHeader({ variant, checked, onCheckedChange }: { variant: "flat" | "grouped"; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <TableHeader><TableRow>
    <TableHead className="sticky left-0 z-20 w-9 min-w-9 bg-background"><Checkbox checked={checked} onCheckedChange={value => onCheckedChange(value === true)} /></TableHead>
    {variant === "flat" && <><TableHead className="min-w-36 whitespace-nowrap">Scope</TableHead><TableHead>Target</TableHead></>}
    <TableHead>Indicator</TableHead><TableHead>Pipeline value</TableHead><TableHead>Corrected value</TableHead><TableHead>Displayed</TableHead><TableHead className="min-w-56">Justification</TableHead><TableHead className="whitespace-nowrap">Sources</TableHead>
    <TableHead>Value date</TableHead><TableHead className="min-w-[9.5rem] whitespace-nowrap">Status</TableHead><TableHead>Status changed</TableHead><TableHead>Staleness</TableHead>
    {variant === "flat" && <TableHead>Pathways</TableHead>}
    <TableHead>Note</TableHead><TableHead className="sticky right-0 z-20 min-w-36 bg-background text-right">Actions</TableHead>
  </TableRow></TableHeader>;
}

function IndicatorRow({ item, variant, selected, onSelect, onDecision, onCorrect, onClear }: { item: IndicatorValue; variant: "flat" | "grouped"; selected: boolean; onSelect: (checked: boolean) => void; onDecision: (status: DecidedStatus) => void; onCorrect: (focusJustification?: boolean, focusSources?: boolean) => void; onClear: () => void }) {
  const { openHistory } = useHistorySheet();
  return <TableRow id={`indicator-row-${item.id}`}>
    <TableCell className="sticky left-0 z-10 bg-background"><Checkbox checked={selected} onCheckedChange={checked => onSelect(checked === true)} /></TableCell>
    {variant === "flat" && <><TableCell className="min-w-36 whitespace-nowrap"><ScopeChip scope={item.scope} /></TableCell><TableCell className="max-w-64"><TargetRef iv={item} /></TableCell></>}
    <TableCell className="whitespace-nowrap text-[10px] font-medium">{indicatorLabel(item.indicator_key)}</TableCell>
    <TableCell className="whitespace-nowrap text-[10px]">{valueWithUnit(item.value, item.unit)}</TableCell>
    <TableCell className="whitespace-nowrap text-[10px]">{valueWithUnit(item.corrected_value, item.unit)}</TableCell>
    <TableCell className="whitespace-nowrap text-[10px] font-bold">{valueWithUnit(displayedValue(item), item.unit)}</TableCell>
    <TableCell className="cursor-pointer" onClick={() => onCorrect(true)}><Tooltip><TooltipTrigger asChild><span className="block max-w-56 truncate text-[10px]"><ValueCell value={item.justification} /></span></TooltipTrigger>{item.justification && <TooltipContent className="max-w-sm text-xs">{item.justification}</TooltipContent>}</Tooltip></TableCell>
    <TableCell><SourcesPopover sources={item.sources} onEdit={() => onCorrect(false, true)} /></TableCell>
    <TableCell className="whitespace-nowrap font-mono text-[10px]"><ValueCell value={formatDate(item.value_date)} /></TableCell>
    <TableCell className="min-w-[9.5rem] whitespace-nowrap"><ReviewStatusChip status={item.status} /></TableCell>
    <TableCell className="whitespace-nowrap font-mono text-[10px]">{formatDate(item.status_changed_at)}</TableCell>
    <TableCell><StalenessCell item={item} /></TableCell>
    {variant === "flat" && <TableCell><AffectedPathways iv={item} /></TableCell>}
    <TableCell><Tooltip><TooltipTrigger asChild><span className="block max-w-44 truncate text-[10px]"><ValueCell value={item.correction_note} /></span></TooltipTrigger>{item.correction_note && <TooltipContent className="max-w-sm text-xs">{item.correction_note}</TooltipContent>}</Tooltip></TableCell>
    <TableCell className="sticky right-0 z-10 bg-background"><div className="flex justify-end gap-1">
      {item.status !== "approved" && <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" aria-label={`Approve ${item.id}`} onClick={() => onDecision("approved")}><Check className="h-3.5 w-3.5" /></Button>}
      {item.status !== "rejected" && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label={`Reject ${item.id}`} onClick={() => onDecision("rejected")}><X className="h-3.5 w-3.5" /></Button>}
      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Correct ${item.id}`} onClick={() => onCorrect()}><Pencil className="h-3.5 w-3.5" /></Button>
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`More actions for ${item.id}`}><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{item.corrected_value !== null && <DropdownMenuItem onClick={onClear}>Clear correction</DropdownMenuItem>}<DropdownMenuItem onClick={() => openHistory("indicator_value", item.id)}><History className="mr-2 h-3.5 w-3.5" />History</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    </div></TableCell>
  </TableRow>;
}

function NotComputedRow({ label, onAdd }: { label: string; onAdd: () => void }) {
  return <TableRow className="text-muted-foreground">
    <TableCell className="sticky left-0 z-10 bg-background" />
    <TableCell className="whitespace-nowrap text-[10px] font-medium">{label}</TableCell>
    {Array.from({ length: 6 }, (_, index) => <TableCell key={`pre-${index}`} className="text-[10px]">—</TableCell>)}
    <TableCell className="whitespace-nowrap text-[10px] italic">not computed</TableCell>
    {Array.from({ length: 3 }, (_, index) => <TableCell key={`post-${index}`} className="text-[10px]">—</TableCell>)}
    <TableCell className="sticky right-0 z-10 bg-background"><div className="flex justify-end"><Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={onAdd}><Plus className="mr-1 h-3 w-3" />Add value</Button></div></TableCell>
  </TableRow>;
}

function ShowMatchesButton({ indicatorKey, target }: { indicatorKey: string; target: IndicatorTarget }) {
  const store = useHitlStore();
  const matches = computedMatches(indicatorKey, target, store.paperPatentMatches, store.pathways);
  return <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="h-7 text-[10px]">Show matches</Button></PopoverTrigger>
    <PopoverContent align="end" className="w-80 p-0">
      <div className="flex items-center justify-between border-b px-3 py-2"><span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Counted records</span><span className="text-[10px] text-muted-foreground">{matches.length} total</span></div>
      {matches.length === 0
        ? <p className="p-3 text-xs text-muted-foreground">No approved matches yet.</p>
        : <div className="max-h-72 space-y-2 overflow-y-auto p-3">{matches.map(match => <div key={match.id} className="space-y-1 border-b pb-2 last:border-0 last:pb-0">
            <div className="flex items-center gap-2"><Badge variant="outline" className="inline-flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs font-normal">{match.kind === "patent" ? "Patent" : "Paper"}</Badge><ReviewStatusChip status={match.status} /></div>
            <p className="text-xs font-medium leading-snug">{match.title}</p>
            <a href={`#match-row-${match.id}`} className="font-mono text-[10px] text-primary hover:underline">{match.external_id}</a>
          </div>)}</div>}
    </PopoverContent>
  </Popover>;
}

function ComputedIndicatorRow({ variant, scope, indicatorKey, target }: { variant: "flat" | "grouped"; scope: IndicatorScope; indicatorKey: string; target: IndicatorTarget }) {
  const store = useHitlStore();
  const definition = indicatorDefinition(indicatorKey);
  const count = computedValue(indicatorKey, target, store.paperPatentMatches, store.pathways);
  const reference = { scope, target };
  const rule = COMPUTED_RULES[indicatorKey];
  return <TableRow className="text-muted-foreground">
    <TableCell className="sticky left-0 z-10 bg-background" />
    {variant === "flat" && <><TableCell className="min-w-36 whitespace-nowrap"><ScopeChip scope={scope} /></TableCell><TableCell className="max-w-64"><TargetRef iv={reference} /></TableCell></>}
    <TableCell className="whitespace-nowrap text-[10px] font-medium"><Tooltip><TooltipTrigger asChild><span>{definition?.label ?? indicatorKey}</span></TooltipTrigger>{rule && <TooltipContent className="max-w-sm text-xs">{rule}</TooltipContent>}</Tooltip></TableCell>
    <TableCell className="text-[10px]">—</TableCell>
    <TableCell className="text-[10px]">—</TableCell>
    <TableCell className="whitespace-nowrap text-[10px] font-normal text-foreground">{count} {definition?.unit}</TableCell>
    <TableCell className="text-[10px] italic">Computed from matched records</TableCell>
    <TableCell className="text-[10px]">—</TableCell>
    <TableCell className="text-[10px]">—</TableCell>
    <TableCell className="min-w-[9.5rem] whitespace-nowrap"><ComputedChip /></TableCell>
    <TableCell className="text-[10px]">—</TableCell>
    <TableCell className="text-[10px]">—</TableCell>
    {variant === "flat" && <TableCell><AffectedPathways iv={reference} /></TableCell>}
    <TableCell className="text-[10px]">—</TableCell>
    <TableCell className="sticky right-0 z-10 bg-background"><div className="flex justify-end"><ShowMatchesButton indicatorKey={indicatorKey} target={target} /></div></TableCell>
  </TableRow>;
}

export function IndicatorsSection() {
  const store = useHitlStore();
  const nodeFilter = useNodeFilter();
  const [search, setSearch] = useState(""); const [scope, setScope] = useState("all"); const [indicator, setIndicator] = useState("all"); const [status, setStatus] = useState("all"); const [staleOnly, setStaleOnly] = useState(false); const [showComputed, setShowComputed] = useState(false); const [view, setView] = useState<ViewMode>("flat"); const [selected, setSelected] = useState<string[]>([]);
  const [decision, setDecision] = useState<DecisionTarget>(null); const [correctId, setCorrectId] = useState<string | null>(null); const [focusJustification, setFocusJustification] = useState(false); const [focusSources, setFocusSources] = useState(false); const [clearId, setClearId] = useState<string | null>(null); const [addOpen, setAddOpen] = useState(false); const [bulkAddOpen, setBulkAddOpen] = useState(false); const [addPreset, setAddPreset] = useState<AddPreset>(null);
  const indicatorOptions = useMemo(() => INDICATOR_SCOPES.filter(item => scope === "all" || item === scope).map(item => ({ scope: item, indicators: indicatorsForScope(item) })), [scope]);

  const passesNodeFilter = (item: { scope: IndicatorScope; target: IndicatorTarget }) => {
    if (!nodeFilter.isActive) return true;
    const direct = (!nodeFilter.feedstock || clean(item.target.feedstock) === clean(nodeFilter.feedstock)) && (!nodeFilter.product || clean(item.target.product) === clean(nodeFilter.product));
    return direct || affectedPathwayIds(item, store.pathways).some(id => nodeFilter.matchingPathwayIds.has(id));
  };
  const filtered = useMemo(() => store.indicatorValues.filter(item => {
    const haystack = [indicatorLabel(item.indicator_key), targetSearchText(item.target), item.correction_note, item.justification, ...item.sources.flatMap(source => [source.label ?? "", source.url])].join(" ").toLowerCase();
    return passesNodeFilter(item) && (!search || haystack.includes(search.toLowerCase())) && (scope === "all" || item.scope === scope) && (indicator === "all" || item.indicator_key === indicator) && (status === "all" || item.status === status) && (!staleOnly || isStale(item));
  }).sort((a, b) => (a.status === "review_pending" ? 0 : 1) - (b.status === "review_pending" ? 0 : 1) || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime() || INDICATOR_SCOPES.indexOf(a.scope) - INDICATOR_SCOPES.indexOf(b.scope) || targetLabel(a).localeCompare(targetLabel(b)) || INDICATORS.findIndex(item => item.key === a.indicator_key) - INDICATORS.findIndex(item => item.key === b.indicator_key)),
    [store.indicatorValues, store.pathways, search, scope, indicator, status, staleOnly, nodeFilter.feedstock, nodeFilter.product]);

  const computedRows = useMemo(() => {
    if (view !== "flat" || !showComputed || status !== "all" || staleOnly) return [] as ComputedRow[];
    const rows: ComputedRow[] = [];
    const push = (currentScope: IndicatorScope, target: IndicatorTarget) => {
      indicatorsForScope(currentScope).filter(item => item.computed).forEach(definition => {
        if (scope !== "all" && currentScope !== scope) return;
        if (indicator !== "all" && definition.key !== indicator) return;
        const reference = { scope: currentScope, target };
        if (!passesNodeFilter(reference)) return;
        const haystack = [definition.label, targetSearchText(target)].join(" ").toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return;
        const key = `${definition.key}|${targetKey(currentScope, target)}`;
        if (rows.some(row => row.key === key)) return;
        rows.push({ key, scope: currentScope, indicator_key: definition.key, target });
      });
    };
    const triples = new Set<string>();
    store.pathways.forEach(pathway => {
      const productionTarget = targetForPathway("production", pathway);
      const identity = targetKey("production", productionTarget);
      if (!triples.has(identity)) { triples.add(identity); push("production", productionTarget); }
      push("application", targetForPathway("application", pathway));
    });
    return rows;
  }, [store.pathways, view, showComputed, status, staleOnly, scope, indicator, search, nodeFilter.feedstock, nodeFilter.product]);

  const scopeGroups = useMemo(() => INDICATOR_SCOPES.filter(item => scope === "all" || item === scope).map(currentScope => {
    const rows = filtered.filter(item => item.scope === currentScope);
    const targets: { key: string; target: IndicatorTarget; rows: IndicatorValue[] }[] = [];
    rows.forEach(item => {
      const key = targetKey(currentScope, item.target);
      const existing = targets.find(entry => entry.key === key);
      if (existing) existing.rows.push(item); else targets.push({ key, target: item.target, rows: [item] });
    });
    return { scope: currentScope, rows, targets };
  }).filter(group => group.rows.length > 0), [filtered, scope]);

  const toggle = (id: string, checked: boolean) => setSelected(items => checked ? [...new Set([...items, id])] : items.filter(item => item !== id));
  useEffect(() => { setSelected([]); }, [nodeFilter.feedstock, nodeFilter.product]);
  useEffect(() => { if (indicator !== "all" && scope !== "all" && indicatorDefinition(indicator)?.scope !== scope) setIndicator("all"); }, [scope, indicator]);
  const openAdd = (preset: AddPreset) => { setAddPreset(preset); setAddOpen(true); };
  const rowProps = (item: IndicatorValue) => ({ selected: selected.includes(item.id), onSelect: (checked: boolean) => toggle(item.id, checked), onDecision: (next: DecidedStatus) => setDecision({ ids: [item.id], status: next }), onCorrect: (focus = false, sources = false) => { setFocusJustification(focus); setFocusSources(sources); setCorrectId(item.id); }, onClear: () => setClearId(item.id) });

  const filtersActive = Boolean(search || scope !== "all" || indicator !== "all" || status !== "all" || staleOnly || showComputed || view !== "flat");
  return <>
    <SectionToolbar title="Indicators" description="Check sourced indicator values, dates, units and human corrections." filtersActive={filtersActive} onReset={() => { setSearch(""); setScope("all"); setIndicator("all"); setStatus("all"); setStaleOnly(false); setShowComputed(false); setView("flat"); }} count={filtered.length} total={store.indicatorValues.length} actions={<SplitAddButton label="Add value" icon={Plus} onClick={() => openAdd(null)} ariaLabel="More add value options" items={[{ label: "Single value", icon: Plus, onSelect: () => openAdd(null) }, { label: "Bulk add values…", icon: Upload, onSelect: () => setBulkAddOpen(true) }, { label: "Download bulk template", icon: Download, onSelect: downloadBulkIndicatorValuesTemplate, separatorBefore: true }]} />} filters={<><SectionSearch placeholder="Search indicator values…" value={search} onChange={setSearch} /><SectionFilterSelect value={scope} onChange={setScope} label="Scope"><SelectItem value="all">All scopes</SelectItem>{INDICATOR_SCOPES.map(item => <SelectItem key={item} value={item}>{SCOPE_LABELS[item]}</SelectItem>)}</SectionFilterSelect><SectionFilterSelect value={indicator} onChange={setIndicator} label="Indicator"><SelectItem value="all">All indicators</SelectItem>{indicatorOptions.map(group => <SelectGroup key={group.scope}><SelectLabel className="text-[9px] uppercase tracking-widest">{SCOPE_LABELS[group.scope]}</SelectLabel>{group.indicators.map(item => <SelectItem key={item.key} value={item.key}><span>{item.label}</span><span className="ml-2 text-[10px] text-muted-foreground">{item.units[0]}</span></SelectItem>)}</SelectGroup>)}</SectionFilterSelect><SectionFilterSelect value={status} onChange={setStatus} label="Status"><SelectItem value="all">All statuses</SelectItem><SelectItem value="review_pending">Review pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SectionFilterSelect><label className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap text-xs text-muted-foreground"><Switch checked={staleOnly} onCheckedChange={setStaleOnly} />Stale corrections only</label>{view === "flat" && <label className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap text-xs text-muted-foreground"><Switch checked={showComputed} onCheckedChange={setShowComputed} />Show computed</label>}<div className="inline-flex h-9 shrink-0 items-center rounded-md bg-muted p-1"><Button variant="ghost" size="sm" className={cn("h-7 px-2 text-[10px]", view === "flat" && "bg-foreground text-background shadow-sm hover:bg-foreground hover:text-background")} onClick={() => setView("flat")}>Flat</Button><Button variant="ghost" size="sm" className={cn("h-7 px-2 text-[10px]", view === "target" && "bg-foreground text-background shadow-sm hover:bg-foreground hover:text-background")} onClick={() => setView("target")}>By target</Button></div></>} bulkBar={<SectionBulkBar count={selected.length} onClear={() => setSelected([])}><Button variant="outline" size="sm" className="h-7 text-[10px] text-primary" onClick={() => setDecision({ ids: selected, status: "approved" })}>Approve</Button><Button variant="outline" size="sm" className="h-7 text-[10px] text-destructive" onClick={() => setDecision({ ids: selected, status: "rejected" })}>Reject</Button></SectionBulkBar>} />
    {view === "flat"
      ? <div className="overflow-x-auto"><Table className="min-w-[1740px]"><IndicatorHeader variant="flat" checked={filtered.length > 0 && filtered.every(item => selected.includes(item.id))} onCheckedChange={checked => setSelected(checked ? filtered.map(item => item.id) : [])} /><TableBody>
          {filtered.map(item => <IndicatorRow key={item.id} item={item} variant="flat" {...rowProps(item)} />)}
            {computedRows.map(row => <ComputedIndicatorRow key={row.key} variant="flat" scope={row.scope} indicatorKey={row.indicator_key} target={row.target} />)}
            {filtered.length === 0 && computedRows.length === 0 && <TableRow><TableCell colSpan={16} className="p-0">{nodeFilter.isActive ? <NodeFilterEmpty rows="indicator values" /> : <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">No indicator values fit these filters.</div>}</TableCell></TableRow>}
        </TableBody></Table></div>
      : <div className="divide-y">
           {scopeGroups.map(group => <ScopeGroup key={group.scope} scope={group.scope} rows={group.rows} targets={group.targets} selected={selected} onSelect={toggle} onDecision={(id, next) => setDecision({ ids: [id], status: next })} onCorrect={(id, focus = false, sources = false) => { setFocusJustification(focus); setFocusSources(sources); setCorrectId(id); }} onClear={setClearId} onAdd={openAdd} />)}
          {scopeGroups.length === 0 && (nodeFilter.isActive ? <NodeFilterEmpty rows="indicator values" /> : <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">No indicator values fit these filters.</div>)}
        </div>}
    <DecisionDialog target={decision} onClose={() => setDecision(null)} afterSave={() => setSelected([])} />
    <CorrectDialog itemId={correctId} focusJustification={focusJustification} focusSources={focusSources} onClose={() => setCorrectId(null)} />
    <ClearDialog itemId={clearId} onClose={() => setClearId(null)} />
    <AddValueDialog open={addOpen} preset={addPreset} onClose={() => { setAddOpen(false); setAddPreset(null); }} />
    <BulkAddIndicatorValuesDialog open={bulkAddOpen} onClose={() => setBulkAddOpen(false)} onOpenRecord={id => { setBulkAddOpen(false); window.setTimeout(() => document.getElementById(`indicator-row-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60); }} />
  </>;
}

function ScopeGroup({ scope, rows, targets, selected, onSelect, onDecision, onCorrect, onClear, onAdd }: { scope: IndicatorScope; rows: IndicatorValue[]; targets: { key: string; target: IndicatorTarget; rows: IndicatorValue[] }[]; selected: string[]; onSelect: (id: string, checked: boolean) => void; onDecision: (id: string, status: DecidedStatus) => void; onCorrect: (id: string, focusJustification?: boolean, focusSources?: boolean) => void; onClear: (id: string) => void; onAdd: (preset: AddPreset) => void }) {
  const pending = rows.filter(item => item.status === "review_pending").length;
  const [open, setOpen] = useState(pending > 0);
  return <Collapsible open={open} onOpenChange={setOpen}>
    <div className="flex items-center gap-3 bg-muted/40 px-4 py-3">
      <CollapsibleTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6" aria-label={`${open ? "Collapse" : "Expand"} ${SCOPE_LABELS[scope]} scope`}>{open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</Button></CollapsibleTrigger>
      <ScopeChip scope={scope} /><span className="text-[10px] text-muted-foreground">{SCOPE_DESCRIPTIONS[scope]}</span>
      <Badge variant="outline" className="ml-auto inline-flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs font-normal">{rows.length} value{rows.length === 1 ? "" : "s"}</Badge>
      <Badge variant="outline" className="inline-flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs font-normal">{pending} review pending</Badge>
    </div>
    <CollapsibleContent>
      <div className="divide-y">{targets.map(entry => <TargetGroup key={entry.key} scope={scope} target={entry.target} rows={entry.rows} selected={selected} onSelect={onSelect} onDecision={onDecision} onCorrect={onCorrect} onClear={onClear} onAdd={onAdd} />)}</div>
    </CollapsibleContent>
  </Collapsible>;
}

function TargetGroup({ scope, target, rows, selected, onSelect, onDecision, onCorrect, onClear, onAdd }: { scope: IndicatorScope; target: IndicatorTarget; rows: IndicatorValue[]; selected: string[]; onSelect: (id: string, checked: boolean) => void; onDecision: (id: string, status: DecidedStatus) => void; onCorrect: (id: string, focusJustification?: boolean, focusSources?: boolean) => void; onClear: (id: string) => void; onAdd: (preset: AddPreset) => void }) {
  const reference = { scope, target };
  return <div>
    <div className="flex flex-wrap items-center gap-3 bg-muted/15 px-6 py-2">
      <div className="min-w-0 flex-1"><TargetRef iv={reference} /></div>
      <AffectedPathways iv={reference} />
    </div>
    <div className="overflow-x-auto"><Table className="min-w-[1280px]"><IndicatorHeader variant="grouped" checked={rows.length > 0 && rows.every(item => selected.includes(item.id))} onCheckedChange={checked => rows.forEach(item => onSelect(item.id, checked))} /><TableBody>
      {indicatorsForScope(scope).map(definition => {
        if (definition.computed) return <ComputedIndicatorRow key={definition.key} variant="grouped" scope={scope} indicatorKey={definition.key} target={target} />;
        const item = rows.find(row => row.indicator_key === definition.key);
        return item
          ? <IndicatorRow key={definition.key} item={item} variant="grouped" selected={selected.includes(item.id)} onSelect={checked => onSelect(item.id, checked)} onDecision={next => onDecision(item.id, next)} onCorrect={(focus, sources) => onCorrect(item.id, focus, sources)} onClear={() => onClear(item.id)} />
          : <NotComputedRow key={definition.key} label={definition.label} onAdd={() => onAdd({ scope, indicator_key: definition.key, target })} />;
      })}
    </TableBody></Table></div>
  </div>;
}

function DecisionDialog({ target, onClose, afterSave }: { target: DecisionTarget; onClose: () => void; afterSave: () => void }) {
  const store = useHitlStore(); const [note, setNote] = useState(""); useEffect(() => { if (target) setNote(""); }, [target]);
  const first = target?.ids.length === 1 ? store.indicatorValues.find(item => item.id === target.ids[0]) : null;
  const save = () => { if (!target) return; target.ids.forEach(id => { const item = store.indicatorValues.find(row => row.id === id); if (item && item.status !== target.status) store.recordChange({ entity_type: "indicator_value", entity_id: id, field: "status", prior_value: item.status, new_value: target.status, operation: target.status === "approved" ? "approve" : "reject", note: note.trim() || null }); }); toast.success(target.status === "approved" ? "Value approved." : "Value rejected. Displayed value is now empty."); afterSave(); onClose(); };
  return <Dialog open={target !== null} onOpenChange={open => { if (!open) onClose(); }}><DialogContent><DialogHeader><DialogTitle>{target?.status === "approved" ? "Approve indicator value" : "Reject indicator value"}</DialogTitle><DialogDescription>{first ? <span className="space-y-2"><span className="flex flex-wrap items-center gap-2"><ScopeChip scope={first.scope} /><span className="text-xs font-medium text-foreground">{indicatorLabel(first.indicator_key)}</span><ValueCell value={first.value} unit={first.value === null ? null : first.unit} /></span><TargetRef iv={first} /></span> : `${target?.ids.length ?? 0} values`}</DialogDescription></DialogHeader>{target && <div className="space-y-4">{first && <div className="rounded-md border p-3 text-xs"><span className="text-muted-foreground">Justification</span><p className="mt-1"><ValueCell value={first.justification} /></p>{first.sources.length > 0 && <div className="mt-2 space-y-1"><span className="text-muted-foreground">Sources</span><ul className="space-y-1">{first.sources.map((source, index) => <li key={`${source.url}-${index}`}><a href={source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{sourceDisplay(source)}</a></li>)}</ul></div>}</div>}<ReviewStatusChip status={target.status} />{target.status === "rejected" && <p className="text-xs text-muted-foreground">Rejected values are retained in history. The platform displays no value (—) for this indicator until a correction is entered.</p>}<div><Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Note (optional)</Label><Textarea className="mt-1 text-xs" value={note} onChange={event => setNote(event.target.value)} /></div></div>}<DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Confirm</Button></DialogFooter></DialogContent></Dialog>;
}

function UnitPicker({ id, definition, value, onChange, storedUnit }: { id: string; definition: IndicatorDefinition | undefined; value: string; onChange: (next: string) => void; storedUnit: string | null }) {
  const units = definition?.units ?? [];
  if (units.length <= 1) return <p id={id} className="mt-1 text-xs text-muted-foreground">{units[0] ?? "—"}</p>;
  return <div className="space-y-1">
    <Select value={units.includes(value) ? value : units[0]} onValueChange={onChange}>
      <SelectTrigger id={id}><SelectValue /></SelectTrigger>
      <SelectContent>{units.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
    </Select>
    {storedUnit && value && value !== storedUnit && <p className="text-xs text-muted-foreground">Unit change does not convert the value</p>}
  </div>;
}

function CorrectDialog({ itemId, focusJustification, focusSources, onClose }: { itemId: string | null; focusJustification: boolean; focusSources?: boolean; onClose: () => void }) {
  const store = useHitlStore(); const item = store.indicatorValues.find(row => row.id === itemId);
  const definition = item ? indicatorDefinition(item.indicator_key) : undefined;
  const [corrected, setCorrected] = useState(""); const [unit, setUnit] = useState(""); const [date, setDate] = useState(""); const [note, setNote] = useState(""); const [justification, setJustification] = useState(""); const [methodTag, setMethodTag] = useState<MethodTag | "">(""); const [methodDetail, setMethodDetail] = useState(""); const [sources, setSources] = useState<IndicatorSource[]>([]);
  useEffect(() => { if (!item) return; setCorrected(item.corrected_value === null ? "" : String(item.corrected_value)); setUnit(item.unit ?? definition?.units[0] ?? ""); setDate(item.value_date ? format(new Date(item.value_date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")); setNote(item.correction_note ?? ""); setJustification(item.justification ?? ""); setMethodTag(item.method_tag ?? ""); setMethodDetail(item.method_detail ?? ""); setSources(item.sources.map(source => ({ ...source }))); if (focusJustification) window.setTimeout(() => document.getElementById("correction-justification")?.focus(), 50); if (focusSources) window.setTimeout(() => document.getElementById("correction-sources")?.scrollIntoView({ block: "center" }), 60); }, [itemId, focusJustification, focusSources]);
  const parsed = definition ? parseValue(corrected, definition.value_type) : { error: "Unknown indicator" };
  const error = corrected.trim() === "" ? null : "error" in parsed ? parsed.error : null;
  const save = () => {
    if (!item) return;
    const valueChanged = corrected.trim() !== "" && "value" in parsed && parsed.value !== item.corrected_value;
    if (corrected.trim() !== "" && !("value" in parsed)) return;
    const nextValue = "value" in parsed ? parsed.value : item.corrected_value; const nextNote = note.trim() || null; const nextJustification = justification.trim() || null; const nextMethodDetail = methodDetail.trim() || null; const nextMethodTag = methodTag || null; const nextDate = new Date(`${date}T00:00:00.000Z`).toISOString(); const now = new Date().toISOString();
    if (valueChanged) store.recordChange({ entity_type: "indicator_value", entity_id: item.id, field: "corrected_value", prior_value: item.corrected_value, new_value: nextValue, operation: "update", note: nextNote });
    if (nextNote !== item.correction_note) store.recordChange({ entity_type: "indicator_value", entity_id: item.id, field: "correction_note", prior_value: item.correction_note, new_value: nextNote, operation: "update", note: nextNote });
    if (nextJustification !== item.justification) store.recordChange({ entity_type: "indicator_value", entity_id: item.id, field: "justification", prior_value: item.justification, new_value: nextJustification, operation: "update", note: nextNote });
    if (nextMethodTag !== item.method_tag) store.recordChange({ entity_type: "indicator_value", entity_id: item.id, field: "method_tag", prior_value: item.method_tag, new_value: nextMethodTag, operation: "update", note: nextNote });
    const nextSources = cleanSources(sources);
    if (!sameSources(nextSources, item.sources)) store.recordChange({ entity_type: "indicator_value", entity_id: item.id, field: "sources", prior_value: item.sources, new_value: nextSources, operation: "update", note: nextNote });
    if (nextMethodDetail !== item.method_detail) store.recordChange({ entity_type: "indicator_value", entity_id: item.id, field: "method_detail", prior_value: item.method_detail, new_value: nextMethodDetail, operation: "update", note: nextNote });
    if (valueChanged && item.unit === null && unit.trim()) store.recordChange({ entity_type: "indicator_value", entity_id: item.id, field: "unit", prior_value: null, new_value: unit.trim(), operation: "update", note: nextNote });
    if (valueChanged && nextDate !== item.value_date) store.recordChange({ entity_type: "indicator_value", entity_id: item.id, field: "value_date", prior_value: item.value_date, new_value: nextDate, operation: "update", note: nextNote });
    if (valueChanged) store.recordChange({ entity_type: "indicator_value", entity_id: item.id, field: "corrected_at", prior_value: item.corrected_at, new_value: now, operation: "update", note: nextNote });
    if (valueChanged && item.status !== "approved") store.recordChange({ entity_type: "indicator_value", entity_id: item.id, field: "status", prior_value: item.status, new_value: "approved", operation: "approve", note: "corrected" });
    toast.success(valueChanged ? "Correction saved. Displayed value updated. Benchmark scoring update queued." : "Justification and method updated"); onClose();
  };
  return <Dialog open={itemId !== null} onOpenChange={open => { if (!open) onClose(); }}><DialogContent><DialogHeader><DialogTitle>Correct indicator value</DialogTitle><DialogDescription>{item ? <span className="space-y-2"><span className="flex flex-wrap items-center gap-2"><ScopeChip scope={item.scope} /><span className="text-xs font-medium text-foreground">{indicatorLabel(item.indicator_key)}</span></span><TargetRef iv={item} /></span> : "Enter a corrected value."}</DialogDescription></DialogHeader>
    {item && <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 rounded-md border p-3 text-xs"><div><span className="text-muted-foreground">Pipeline value</span><p className="font-semibold">{valueWithUnit(item.value, item.unit)}</p></div><div><span className="text-muted-foreground">Current corrected value</span><p className="font-semibold">{valueWithUnit(item.corrected_value, item.unit)}</p></div></div>
      <div><Label htmlFor="corrected-value">Corrected value</Label><Input id="corrected-value" type="number" step="any" value={corrected} onChange={event => setCorrected(event.target.value)} />{error && <p className="mt-1 text-[10px] text-destructive">{error}</p>}</div>
      <div><Label htmlFor="correction-unit">Unit</Label><UnitPicker id="correction-unit" definition={definition} value={unit} onChange={setUnit} storedUnit={item?.unit ?? null} /></div>
      <div><Label htmlFor="correction-date">Value date</Label><Input id="correction-date" type="date" value={date} onChange={event => setDate(event.target.value)} /></div>
      <div><Label htmlFor="correction-justification">Justification</Label><Textarea id="correction-justification" rows={3} placeholder="Why this value is right — sources, assumptions, reasoning" value={justification} onChange={event => setJustification(event.target.value)} /></div>
      <div id="correction-sources"><SourcesEditor sources={sources} onChange={setSources} /></div>
      <div className="space-y-2"><Label htmlFor="correction-method">Method</Label><Select value={methodTag || "not_set"} onValueChange={value => setMethodTag(value === "not_set" ? "" : value as MethodTag)}><SelectTrigger id="correction-method"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="not_set">Not set</SelectItem>{METHOD_TAGS.map(tag => <SelectItem key={tag.value} value={tag.value}>{tag.label}</SelectItem>)}</SelectContent></Select><p className="text-[10px] text-muted-foreground">Pick the dominant basis. An estimated component makes the whole value Estimated.</p></div>
      <div><Label htmlFor="correction-method-detail">Method detail</Label><Textarea id="correction-method-detail" rows={2} placeholder="How the value was derived — inputs, aggregation, period" value={methodDetail} onChange={event => setMethodDetail(event.target.value)} /></div>
      <div><Label htmlFor="correction-note">Note (optional)</Label><Textarea id="correction-note" value={note} onChange={event => setNote(event.target.value)} /></div>
      <p className="text-[10px] text-muted-foreground">Saving a corrected value sets the row to Approved.</p>
    </div>}
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={Boolean(error) || !date || !sourcesValid(sources)} onClick={save}>Save correction</Button></DialogFooter></DialogContent></Dialog>;
}

function ClearDialog({ itemId, onClose }: { itemId: string | null; onClose: () => void }) {
  const store = useHitlStore(); const item = store.indicatorValues.find(row => row.id === itemId); const nextDisplayed = item?.status === "rejected" ? null : item?.value ?? null;
  const save = () => { if (!item || item.corrected_value === null) return; store.recordChange({ entity_type: "indicator_value", entity_id: item.id, field: "corrected_value", prior_value: item.corrected_value, new_value: null, operation: "update", note: "Correction cleared" }); store.recordChange({ entity_type: "indicator_value", entity_id: item.id, field: "corrected_at", prior_value: item.corrected_at, new_value: null, operation: "update", note: "Correction cleared" }); toast.success("Correction cleared."); onClose(); };
  return <Dialog open={itemId !== null} onOpenChange={open => { if (!open) onClose(); }}><DialogContent><DialogHeader><DialogTitle>Clear correction</DialogTitle><DialogDescription>Clear the corrected value? It returns to null. Displayed value becomes <strong><ValueCell value={nextDisplayed} unit={nextDisplayed === null ? null : item?.unit} /></strong>.</DialogDescription></DialogHeader>{item?.corrected_at && <p className="text-xs text-muted-foreground">Current correction was saved {formatDistanceStrict(new Date(item.corrected_at), new Date(), { addSuffix: true })}.</p>}<DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="destructive" onClick={save}>Clear correction</Button></DialogFooter></DialogContent></Dialog>;
}

function AddValueDialog({ open, preset, onClose }: { open: boolean; preset: AddPreset; onClose: () => void }) {
  const store = useHitlStore();
  const [step, setStep] = useState(1);
  const [scope, setScope] = useState<IndicatorScope>("feedstock");
  const [indicatorKey, setIndicatorKey] = useState("");
  const [target, setTarget] = useState<IndicatorTarget>(emptyIndicatorTarget);
  const [pathwaySearch, setPathwaySearch] = useState("");
  const [value, setValue] = useState(""); const [unit, setUnit] = useState(""); const [date, setDate] = useState(""); const [note, setNote] = useState(""); const [justification, setJustification] = useState(""); const [methodTag, setMethodTag] = useState<MethodTag | "">("expert_judgement"); const [methodDetail, setMethodDetail] = useState(""); const [sources, setSources] = useState<IndicatorSource[]>([]);
  const definition = indicatorDefinition(indicatorKey);
  useEffect(() => {
    if (!open) return;
    setPathwaySearch(""); setValue(""); setNote(""); setJustification(""); setMethodTag("expert_judgement"); setMethodDetail(""); setSources([]); setDate(format(new Date(), "yyyy-MM-dd"));
    if (preset) { setScope(preset.scope); setIndicatorKey(preset.indicator_key); setTarget(preset.target); setUnit(indicatorDefinition(preset.indicator_key)?.units[0] ?? ""); setStep(3); }
    else { setScope("feedstock"); setIndicatorKey(""); setTarget(emptyIndicatorTarget); setUnit(""); setStep(1); }
  }, [open, preset]);
  useEffect(() => { if (definition) setUnit(current => (definition.units.includes(current) ? current : definition.units[0])); }, [indicatorKey]);

  const nodeOptions = (key: IndicatorTargetKey) => [...new Set(store.pathways.map(pathway => pathway[targetToPathwayPosition[key]]))].sort((a, b) => a.localeCompare(b));
  const setNode = (key: IndicatorTargetKey, next: string) => setTarget(current => ({ ...current, [key]: next || null }));
  const targetKeys = SCOPE_TARGET_KEYS[scope];
  const targetReady = targetKeys.every(key => Boolean(target[key]?.trim()));
  const reference = { scope, target };
  const affected = targetReady ? affectedPathwayIds(reference, store.pathways) : [];
  const duplicate = definition && targetReady ? findIndicatorValue(store.indicatorValues, definition.key, target) : null;
  const parsed = definition ? parseValue(value, definition.value_type) : { error: "Select an indicator" };
  const valueError = value.trim() === "" ? null : "error" in parsed ? parsed.error : null;
  const selectablePathways = store.pathways.filter(pathway => [pathway.id, pathway.feedstock, pathway.process_technology, pathway.product, pathway.application_market].join(" ").toLowerCase().includes(pathwaySearch.toLowerCase()));
  const chosenPathway = scope === "application" && targetReady ? store.pathways.find(pathway => sameIndicatorTarget(targetForPathway("application", pathway), target)) : undefined;

  const cleanedSources = cleanSources(sources);
  const sourcesRequired = methodTag !== "expert_judgement" && cleanedSources.length === 0;
  const save = () => {
    if (!definition || definition.computed || !targetReady || duplicate || !("value" in parsed) || !justification.trim() || sourcesRequired || !sourcesValid(sources)) return;
    const now = new Date().toISOString();
    const id = `iv-${String(Math.max(0, ...store.indicatorValues.map(item => Number(item.id.match(/\d+/)?.[0] ?? 0))) + 1).padStart(3, "0")}`;
    const trimmedTarget: IndicatorTarget = { feedstock: target.feedstock?.trim() || null, process: target.process?.trim() || null, product: target.product?.trim() || null, application: target.application?.trim() || null };
    const record: IndicatorValue = {
      id, created_at: now, updated_at: now, status_changed_at: now, last_actor: store.currentUser.name, trace_id: null,
      indicator_key: definition.key, scope: definition.scope, target: trimmedTarget, value: null, unit: unitForStorage(definition.key, unit),
      value_date: new Date(`${date}T00:00:00.000Z`).toISOString(), status: "approved",
      corrected_value: parsed.value, correction_note: note.trim() || null, corrected_at: now,
      justification: justification.trim(), method_tag: methodTag || null, method_detail: methodDetail.trim() || null, sources: cleanedSources,
    };
    store.recordChange({ entity_type: "indicator_value", entity_id: id, field: null, prior_value: null, new_value: record, operation: "create", note: note.trim() || null });
    toast.success(`${definition.label} added for ${targetLabel(record)} · affects ${affectedPathwayIds(record, store.pathways).length} pathways`);
    onClose();
  };
  const openDuplicate = () => { onClose(); window.setTimeout(() => document.getElementById(`indicator-row-${duplicate?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60); };

  return <Dialog open={open} onOpenChange={next => { if (!next) onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
    <DialogHeader><DialogTitle>Add indicator value</DialogTitle><DialogDescription>{step === 1 ? "Choose the scope and indicator." : step === 2 ? "Define the target nodes." : "Enter the human value for this target."}</DialogDescription></DialogHeader>
    {step === 1 && <div className="space-y-4">
      <div className="space-y-1.5"><Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Scope</Label><Select value={scope} onValueChange={next => { setScope(next as IndicatorScope); setIndicatorKey(""); setTarget(emptyIndicatorTarget); }}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{INDICATOR_SCOPES.map(item => <SelectItem key={item} value={item}>{SCOPE_LABELS[item]} · {SCOPE_DESCRIPTIONS[item]}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Indicator</Label><Select value={indicatorKey} onValueChange={setIndicatorKey}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select indicator" /></SelectTrigger><SelectContent>{indicatorsForScope(scope).map(item => <SelectItem key={item.key} value={item.key} disabled={item.computed}>{item.label}{item.computed ? " · computed" : ""}</SelectItem>)}</SelectContent></Select></div>
    </div>}
    {step === 2 && <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2"><ScopeChip scope={scope} /><span className="text-xs font-medium">{definition?.label}</span></div>
      {scope === "application"
        ? <div className="space-y-2">
            <Input value={pathwaySearch} onChange={event => setPathwaySearch(event.target.value)} placeholder="Search pathways…" className="h-8 text-xs" />
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-md border p-1">{selectablePathways.map(pathway => <Button key={pathway.id} type="button" variant="ghost" className={cn("h-auto w-full justify-start px-2 py-1.5 text-left", chosenPathway?.id === pathway.id && "bg-muted")} onClick={() => setTarget(targetForPathway("application", pathway))}><PathwayRef pathwayId={pathway.id} variant="inline" /></Button>)}{selectablePathways.length === 0 && <p className="p-2 text-[10px] text-muted-foreground">No pathway matches this search.</p>}</div>
            {chosenPathway && <PathwayRef pathwayId={chosenPathway.id} variant="card" />}
          </div>
        : <div className="space-y-3">{targetKeys.map(key => <NodeCombobox key={key} label={TARGET_POSITION_LABELS[key]} value={target[key] ?? ""} options={nodeOptions(key)} onChange={next => setNode(key, next)} />)}</div>}
      {targetReady && <div className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-[10px]"><span className="text-muted-foreground">Affects</span><AffectedPathways iv={reference} /></div>}
      {duplicate && <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive"><span>Value exists for this target</span><Button variant="link" className="h-auto p-0 text-xs" onClick={openDuplicate}>Open</Button></div>}
    </div>}
    {step === 3 && <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2"><ScopeChip scope={scope} /><span className="text-xs font-medium">{definition?.label}</span></div>
      <div className="rounded-md border p-3"><TargetRef iv={reference} /><div className="mt-2 flex items-center gap-2 text-[10px]"><span className="text-muted-foreground">Affects</span><AffectedPathways iv={reference} /></div></div>
      {duplicate && <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive"><span>Value exists for this target</span><Button variant="link" className="h-auto p-0 text-xs" onClick={openDuplicate}>Open</Button></div>}
      <div><Label htmlFor="add-value">Value</Label><Input id="add-value" type="number" step="any" value={value} onChange={event => setValue(event.target.value)} />{valueError && <p className="mt-1 text-[10px] text-destructive">{valueError}</p>}</div>
      <div><Label htmlFor="add-unit">Unit</Label><UnitPicker id="add-unit" definition={definition} value={unit} onChange={setUnit} storedUnit={null} /></div>
      <div><Label htmlFor="add-date">Value date</Label><Input id="add-date" type="date" value={date} onChange={event => setDate(event.target.value)} /></div>
      <div><Label htmlFor="add-justification">Justification</Label><Textarea id="add-justification" rows={3} placeholder="Why this value is right — sources, assumptions, reasoning" value={justification} onChange={event => setJustification(event.target.value)} />{!justification.trim() && <p className="mt-1 text-[10px] text-destructive">Justification required for manual values</p>}</div>
      <div className="space-y-2"><Label htmlFor="add-method">Method</Label><Select value={methodTag || "not_set"} onValueChange={next => setMethodTag(next === "not_set" ? "" : next as MethodTag)}><SelectTrigger id="add-method"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="not_set">Not set</SelectItem>{METHOD_TAGS.map(tag => <SelectItem key={tag.value} value={tag.value}>{tag.label}</SelectItem>)}</SelectContent></Select><p className="text-[10px] text-muted-foreground">Pick the dominant basis. An estimated component makes the whole value Estimated.</p></div>
      <div><SourcesEditor sources={sources} onChange={setSources} requiredMessage={sourcesRequired ? "Add at least one source" : null} /></div>
      <div><Label htmlFor="add-method-detail">Method detail</Label><Textarea id="add-method-detail" rows={2} placeholder="How the value was derived — inputs, aggregation, period" value={methodDetail} onChange={event => setMethodDetail(event.target.value)} /></div>
      <div><Label htmlFor="add-note">Note (optional)</Label><Textarea id="add-note" value={note} onChange={event => setNote(event.target.value)} /></div>
    </div>}
    <DialogFooter>
      {step > 1 && !preset && <Button variant="outline" onClick={() => setStep(current => current - 1)}>Back</Button>}
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      {step < 3
        ? <Button disabled={step === 1 ? !definition : !targetReady || Boolean(duplicate)} onClick={() => setStep(current => current + 1)}>Continue</Button>
        : <Button disabled={!targetReady || Boolean(duplicate) || value.trim() === "" || Boolean(valueError) || !date || !justification.trim() || sourcesRequired || !sourcesValid(sources)} onClick={save}>Add value</Button>}
    </DialogFooter>
  </DialogContent></Dialog>;
}
