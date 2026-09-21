import { useMemo, useState } from "react";
import { Factory, Target, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MATCH_NODE_LABELS, allNodeValues, cleanNodeList, derivedPathwayIds, filledPositions, hasNoNodes, matchNodePositions, matchToPathwayPosition, pathwayScope, scopeSummary, useHitlStore, type MatchNodes, type MatchNodePosition, type PaperPatentMatch, type PathwayScope } from "@/lib/hitlStore";
import { cn } from "@/lib/utils";
import { PathwayRef } from "./PathwayRef";

export const evidenceNodeLabels = MATCH_NODE_LABELS;

function NodeChip({ position, value }: { position: MatchNodePosition; value: string }) {
  return <Badge variant="secondary" className="inline-flex h-6 max-w-none items-center gap-1 whitespace-nowrap px-2 text-left text-xs font-normal"><span className="text-muted-foreground">{evidenceNodeLabels[position]}:</span>{value}</Badge>;
}

export function NodeChips({ nodes, compact = false }: { nodes: MatchNodes; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const entries = matchNodePositions.flatMap(position => cleanNodeList(nodes[position]).map(value => ({ position, value })));
  if (!entries.length) return <Tooltip><TooltipTrigger asChild><span><Badge variant="outline" className="inline-flex h-6 items-center gap-1 whitespace-nowrap border-warning px-2 text-xs font-normal text-warning-foreground">No nodes</Badge></span></TooltipTrigger><TooltipContent>No pathway can be derived until at least one node is set</TooltipContent></Tooltip>;
  const shown = compact ? entries.slice(0, 2) : entries; const hidden = compact ? entries.slice(2) : [];
  return <div className="flex max-w-full flex-wrap gap-1">{shown.map(entry => <NodeChip key={`${entry.position}-${entry.value}`} {...entry} />)}{hidden.length > 0 && <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="outline" size="sm" className="h-6 px-2 text-xs" onMouseEnter={() => setOpen(true)}>+{hidden.length}</Button></PopoverTrigger><PopoverContent className="w-80" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}><div className="flex flex-wrap gap-1">{hidden.map(entry => <NodeChip key={`${entry.position}-${entry.value}`} {...entry} />)}</div></PopoverContent></Popover>}</div>;
}

// One position, several alternative values. Free text is allowed and marked as a new node.
export function NodeMultiInput({ label, values, options, id, onChange }: { label: string; values: string[]; options: string[]; id: string; onChange: (values: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const canonical = (value: string) => options.find(option => option.trim().toLocaleLowerCase() === value.trim().toLocaleLowerCase()) ?? value.trim();
  const add = (raw: string) => { const value = canonical(raw); if (!value) return; onChange(cleanNodeList([...values, value])); setDraft(""); };
  const isNew = (value: string) => !options.some(option => option.trim().toLocaleLowerCase() === value.trim().toLocaleLowerCase());
  return <div className="space-y-1">
    <Label htmlFor={id} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</Label>
    {values.length > 0 && <div className="flex flex-wrap gap-1">{values.map(value => <Badge key={value} variant="secondary" className="inline-flex h-6 max-w-none items-center gap-1 whitespace-nowrap px-2 text-xs font-normal">{value}{isNew(value) && <span className="text-[9px] text-muted-foreground">new</span>}<button type="button" aria-label={`Remove ${value} from ${label}`} onClick={() => onChange(values.filter(item => item !== value))}><X className="h-3 w-3" /></button></Badge>)}</div>}
    <Input id={id} list={`${id}-options`} className="h-8 text-xs" value={draft} placeholder={values.length ? "Add another…" : "Optional"} onChange={event => { const value = event.target.value; if (options.some(option => option === value)) add(value); else setDraft(value); }} onBlur={() => add(draft)} onKeyDown={event => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); add(draft); } }} />
    <datalist id={`${id}-options`}>{options.filter(option => !values.some(value => value.toLocaleLowerCase() === option.toLocaleLowerCase())).map(option => <option key={option} value={option} />)}</datalist>
  </div>;
}

export function NodeFields({ value, onChange, compact = false }: { value: MatchNodes; onChange: (value: MatchNodes) => void; compact?: boolean }) {
  const store = useHitlStore(); const metadata = useMemo(() => allNodeValues(store.pathways), [store.pathways]);
  const count = filledPositions({ nodes: value }).length; const pathways = derivedPathwayIds({ nodes: value }, store.pathways).length;
  const total = matchNodePositions.reduce((sum, position) => sum + cleanNodeList(value[position]).length, 0);
  return <div className={cn("grid gap-2", compact ? "grid-cols-4 min-w-[860px]" : "sm:grid-cols-2")}>
    {matchNodePositions.map(position => {
      const options = metadata.filter(item => item.positions.some(entry => entry.position === matchToPathwayPosition[position])).map(item => item.value);
      return <NodeMultiInput key={position} id={`match-${position}`} label={MATCH_NODE_LABELS[position]} values={cleanNodeList(value[position])} options={options} onChange={values => onChange({ ...value, [position]: values })} />;
    })}
    <div className="col-span-full text-[10px] text-muted-foreground">{count} {count === 1 ? "position" : "positions"} set · {total} {total === 1 ? "value" : "values"} · {pathways} derived {pathways === 1 ? "pathway" : "pathways"}</div>
    {hasNoNodes({ nodes: value }) && <div className="col-span-full text-xs text-warning-foreground">No nodes set — no pathway will be derived</div>}
  </div>;
}

export function PathwayScopeChips({ scope }: { scope: PathwayScope }) {
  return <span className="inline-flex flex-wrap gap-1">{scope.production && <Badge variant="outline" className="inline-flex h-6 items-center gap-1 whitespace-nowrap border-success/40 px-2 text-xs font-normal text-success"><Factory className="h-3 w-3 shrink-0" />Production</Badge>}{scope.application && <Badge variant="outline" className="inline-flex h-6 items-center gap-1 whitespace-nowrap border-primary/40 px-2 text-xs font-normal text-primary"><Target className="h-3 w-3 shrink-0" />Application</Badge>}</span>;
}

export function ScopeSummary({ match }: { match: Pick<PaperPatentMatch, "nodes"> }) {
  const store = useHitlStore(); const summary = scopeSummary(match, store.pathways);
  if (!summary.production && !summary.application) return <span className="text-[10px] text-muted-foreground">—</span>;
  return <span className="whitespace-nowrap text-[10px]">{summary.production} production <span className="text-muted-foreground">·</span> {summary.application} application</span>;
}

export function DerivedPathwayList({ match, cards = false }: { match: Pick<PaperPatentMatch, "nodes">; cards?: boolean }) {
  const store = useHitlStore();
  const rows = derivedPathwayIds(match, store.pathways).map(id => store.pathways.find(item => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item)).map(pathway => ({ pathway, scope: pathwayScope(match, pathway) })).sort((a, b) => Number(b.scope.production && !b.scope.application) - Number(a.scope.production && !a.scope.application) || Number(b.scope.production && b.scope.application) - Number(a.scope.production && a.scope.application));
  if (!rows.length) return <p className="py-4 text-xs text-muted-foreground">No pathway matches every filled position.</p>;
  return <div className={cn("space-y-2", !cards && "divide-y rounded-md border")}>{rows.map(({ pathway, scope }) => <div key={pathway.id} className={cn("space-y-2", cards ? "rounded-md border p-3" : "px-3 py-2")}><div className="flex items-center justify-between gap-3"><div className="min-w-0 flex-1"><PathwayRef pathwayId={pathway.id} variant={cards ? "card" : "inline"} emphasisValues={Object.values(scope.matchedValues).filter((item): item is string => Boolean(item))} showStatus={false} /></div><PathwayScopeChips scope={scope} /></div>{cards && <p className="text-[10px] text-muted-foreground">{scope.productionPositions.length ? `Production match: ${scope.productionPositions.map(position => `${evidenceNodeLabels[position]} — ${scope.matchedValues[position]}`).join(", ")}.` : "No production-position match."} {scope.applicationHit ? `Application match: ${scope.matchedValues.application}.` : "No Application match."}</p>}</div>)}</div>;
}

export function DerivedPathwaysForRecord({ match }: { match: Pick<PaperPatentMatch, "nodes"> }) {
  const store = useHitlStore(); const [open, setOpen] = useState(false); const count = derivedPathwayIds(match, store.pathways).length;
  if (!count) return <span className="text-[10px] text-muted-foreground">0 pathways</span>;
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="link" className="h-auto p-0 text-[10px]" onMouseEnter={() => setOpen(true)}>{count} {count === 1 ? "pathway" : "pathways"}</Button></PopoverTrigger><PopoverContent className="w-[min(92vw,760px)]" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}><p className="mb-2 text-[10px] text-muted-foreground">Pathways matching every filled position</p><DerivedPathwayList match={match} /></PopoverContent></Popover>;
}
