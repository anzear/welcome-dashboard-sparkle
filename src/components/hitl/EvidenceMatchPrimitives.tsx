import { useState } from "react";
import { Factory, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { derivedPathwayIds, useHitlStore, type EvidenceNodes, type EvidenceScope, type PaperPatentMatch } from "@/lib/hitlStore";
import { cn } from "@/lib/utils";
import { PathwayRef, type PathwayNodeKey } from "./PathwayRef";
import { PathwayStatusChip } from "./ReviewPrimitives";

export const evidenceNodeKeys: PathwayNodeKey[] = ["feedstock", "process_technology", "product", "application_market"];
export const evidenceNodeLabels: Record<PathwayNodeKey, string> = { feedstock: "Feedstock", process_technology: "Process/Technology", product: "Product", application_market: "Application/Market" };
export const matchedNodeKeys = (nodes: EvidenceNodes) => evidenceNodeKeys.filter(key => nodes[key] !== null && nodes[key]?.trim() !== "");

export function ScopeChip({ scope }: { scope: EvidenceScope }) {
  const Icon = scope === "production" ? Factory : scope === "application" ? Target : null;
  return <Badge variant="outline" className={cn("h-5 gap-1 whitespace-nowrap text-[9px] font-normal", scope === "production" ? "border-success/40 text-success" : scope === "application" ? "border-primary/40 text-primary" : "text-muted-foreground")}>{Icon && <Icon className="h-3 w-3" />}{scope === "production" ? "Production" : scope === "application" ? "Application" : "Unclassified"}</Badge>;
}

function NodeChip({ position, value }: { position: PathwayNodeKey; value: string }) {
  return <Badge variant="secondary" className="h-auto max-w-full whitespace-normal px-1.5 py-0.5 text-left text-[9px] font-normal"><span className="text-muted-foreground">{evidenceNodeLabels[position]}:</span>&nbsp;{value}</Badge>;
}

export function NodeChips({ nodes, compact = false }: { nodes: EvidenceNodes; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const entries = matchedNodeKeys(nodes).map(key => ({ key, value: nodes[key] as string }));
  const visible = compact ? entries.slice(0, 2) : entries;
  const hidden = entries.slice(2);
  return <div className="flex max-w-full flex-wrap gap-1">{visible.map(entry => <NodeChip key={entry.key} position={entry.key} value={entry.value} />)}{compact && hidden.length > 0 && <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="outline" size="sm" className="h-5 px-1.5 text-[9px]" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>+{hidden.length}</Button></PopoverTrigger><PopoverContent className="w-80" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}><div className="flex flex-wrap gap-1">{hidden.map(entry => <NodeChip key={entry.key} position={entry.key} value={entry.value} />)}</div></PopoverContent></Popover>}</div>;
}

export function DerivedPathwayList({ match }: { match: Pick<PaperPatentMatch, "nodes"> }) {
  const store = useHitlStore();
  const ids = derivedPathwayIds(match, store.pathways);
  const emphasisNodes = matchedNodeKeys(match.nodes);
  if (!ids.length) return <p className="py-4 text-xs text-muted-foreground">No pathway contains all matched nodes.</p>;
  return <div className="divide-y rounded-md border">{ids.map(id => { const pathway = store.pathways.find(item => item.id === id); return <div key={id} className="flex items-center justify-between gap-3 px-3 py-2"><div className="min-w-0 flex-1"><PathwayRef pathwayId={id} variant="inline" emphasisNodes={emphasisNodes} /></div>{pathway && <PathwayStatusChip status={pathway.status} />}</div>; })}</div>;
}

export function DerivedPathways({ match }: { match: Pick<PaperPatentMatch, "nodes"> }) {
  const store = useHitlStore(); const [open, setOpen] = useState(false);
  const count = derivedPathwayIds(match, store.pathways).length;
  if (!count) return <span className="text-[10px] text-muted-foreground">0 pathways</span>;
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="link" className="h-auto p-0 text-[10px]" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>{count} {count === 1 ? "pathway" : "pathways"}</Button></PopoverTrigger><PopoverContent className="w-[min(92vw,720px)]" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}><p className="mb-2 text-[10px] text-muted-foreground">Pathways containing all matched nodes</p><DerivedPathwayList match={match} /></PopoverContent></Popover>;
}