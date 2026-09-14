import { useMemo, useState } from "react";
import { Factory, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { allNodeValues, derivedPathwayIds, pathwayScope, scopeSummary, useHitlStore, type EvidenceNodes, type PaperPatentMatch, type PathwayScope } from "@/lib/hitlStore";
import { cn } from "@/lib/utils";
import { PathwayRef, type PathwayNodeKey } from "./PathwayRef";

export const evidenceNodeKeys: PathwayNodeKey[] = ["feedstock", "process_technology", "product", "application_market"];
export const evidenceNodeLabels: Record<PathwayNodeKey, string> = { feedstock: "Feedstock", process_technology: "Process/Technology", product: "Product", application_market: "Application/Market" };
export const matchedNodeKeys = (nodes: EvidenceNodes) => evidenceNodeKeys.filter(key => nodes[key] !== null && nodes[key]?.trim() !== "");

function NodeChip({ position, value }: { position: PathwayNodeKey; value: string }) {
  return <Badge variant="secondary" className="h-auto max-w-full whitespace-normal px-1.5 py-0.5 text-left text-[9px] font-normal"><span className="text-muted-foreground">{evidenceNodeLabels[position]}:</span>&nbsp;{value}</Badge>;
}

export function NodeChips({ nodes, compact = false }: { nodes: EvidenceNodes; compact?: boolean }) {
  const entries = matchedNodeKeys(nodes).map(key => ({ key, value: nodes[key] as string }));
  return <div className="flex max-w-full flex-wrap gap-1">{entries.slice(0, compact ? 2 : entries.length).map(entry => <NodeChip key={entry.key} position={entry.key} value={entry.value} />)}{compact && entries.length > 2 && <Badge variant="outline" className="h-5 text-[9px] font-normal">+{entries.length - 2}</Badge>}</div>;
}

export function NodeValueChips({ values, compact = false }: { values: string[]; compact?: boolean }) {
  const store = useHitlStore(); const [open, setOpen] = useState(false);
  const metadata = useMemo(() => allNodeValues(store.pathways), [store.pathways]);
  const ordered = [...values].sort((a, b) => {
    const aMeta = metadata.find(item => item.value.toLocaleLowerCase() === a.trim().toLocaleLowerCase());
    const bMeta = metadata.find(item => item.value.toLocaleLowerCase() === b.trim().toLocaleLowerCase());
    return evidenceNodeKeys.indexOf(aMeta?.mostCommonPosition ?? "feedstock") - evidenceNodeKeys.indexOf(bMeta?.mostCommonPosition ?? "feedstock") || a.localeCompare(b);
  });
  const visible = compact ? ordered.slice(0, 2) : ordered; const hidden = ordered.slice(2);
  const chip = (value: string) => { const meta = metadata.find(item => item.value.toLocaleLowerCase() === value.trim().toLocaleLowerCase()); return <Tooltip key={value}><TooltipTrigger asChild><Badge variant="secondary" className="h-auto max-w-full whitespace-normal px-1.5 py-0.5 text-left text-[9px] font-normal">{value}</Badge></TooltipTrigger><TooltipContent className="max-w-xs text-[10px]">{meta ? <><p>{meta.pathwayCount} {meta.pathwayCount === 1 ? "Pathway" : "Pathways"}</p>{meta.positions.map(item => <p key={item.position}>{evidenceNodeLabels[item.position]} · {item.pathwayCount}</p>)}</> : <p>New node · not currently used in a Pathway</p>}</TooltipContent></Tooltip>; };
  return <div className="flex max-w-full flex-wrap gap-1">{visible.map(chip)}{compact && hidden.length > 0 && <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="outline" size="sm" className="h-5 px-1.5 text-[9px]" onMouseEnter={() => setOpen(true)}>+{hidden.length}</Button></PopoverTrigger><PopoverContent className="w-80" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}><div className="flex flex-wrap gap-1">{hidden.map(chip)}</div></PopoverContent></Popover>}</div>;
}

export function PathwayScopeChips({ scope }: { scope: PathwayScope }) {
  return <span className="inline-flex flex-wrap gap-1">{scope.production && <Badge variant="outline" className="h-5 gap-1 whitespace-nowrap border-success/40 text-[9px] font-normal text-success"><Factory className="h-3 w-3" />Production</Badge>}{scope.application && <Badge variant="outline" className="h-5 gap-1 whitespace-nowrap border-primary/40 text-[9px] font-normal text-primary"><Target className="h-3 w-3" />Application</Badge>}</span>;
}

export function ScopeSummary({ match }: { match: Pick<PaperPatentMatch, "matched_nodes"> }) {
  const store = useHitlStore(); const summary = scopeSummary(match, store.pathways);
  if (!summary.production && !summary.application) return <span className="text-[10px] text-muted-foreground">—</span>;
  return <span className="whitespace-nowrap text-[10px]">{summary.production} production <span className="text-muted-foreground">·</span> {summary.application} application</span>;
}

export function DerivedPathwayList({ match, cards = false }: { match: Pick<PaperPatentMatch, "matched_nodes">; cards?: boolean }) {
  const store = useHitlStore();
  const rows = derivedPathwayIds(match, store.pathways).map(id => store.pathways.find(item => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item)).map(pathway => ({ pathway, scope: pathwayScope(match, pathway) })).sort((a, b) => Number(b.scope.production && !b.scope.application) - Number(a.scope.production && !a.scope.application) || Number(b.scope.production && b.scope.application) - Number(a.scope.production && a.scope.application));
  if (!rows.length) return <p className="py-4 text-xs text-muted-foreground">No pathway contains all matched nodes.</p>;
  return <div className={cn("space-y-2", !cards && "divide-y rounded-md border")}>{rows.map(({ pathway, scope }) => <div key={pathway.id} className={cn("space-y-2", cards ? "rounded-md border p-3" : "px-3 py-2")}><div className="flex items-center justify-between gap-3"><div className="min-w-0 flex-1"><PathwayRef pathwayId={pathway.id} variant={cards ? "card" : "inline"} emphasisValues={match.matched_nodes} showStatus={false} /></div><PathwayScopeChips scope={scope} /></div>{cards && <p className="text-[10px] text-muted-foreground">{scope.productionPositions.length ? `Production match: ${scope.productionPositions.map(position => evidenceNodeLabels[position]).join(", ")}.` : "No production-position match."} {scope.applicationHit ? "Application match: Application/Market." : "No Application/Market match."}</p>}</div>)}</div>;
}

export function DerivedPathwaysForRecord({ match }: { match: Pick<PaperPatentMatch, "matched_nodes"> }) {
  const store = useHitlStore(); const [open, setOpen] = useState(false); const count = derivedPathwayIds(match, store.pathways).length;
  if (!count) return <span className="text-[10px] text-muted-foreground">0 pathways</span>;
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="link" className="h-auto p-0 text-[10px]" onMouseEnter={() => setOpen(true)}>{count} {count === 1 ? "pathway" : "pathways"}</Button></PopoverTrigger><PopoverContent className="w-[min(92vw,760px)]" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}><p className="mb-2 text-[10px] text-muted-foreground">Pathways containing all matched nodes</p><DerivedPathwayList match={match} /></PopoverContent></Popover>;
}