import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { allowedSecondaryPositions, computeFit, derivedCompanyPathwayIds, useHitlStore, type Company, type CompanyFit } from "@/lib/hitlStore";
import { companyRoleLabels, roleNode } from "@/lib/roleNode";
import { cn } from "@/lib/utils";
import { NodeChips, evidenceNodeLabels } from "./EvidenceMatchPrimitives";
import { PathwayRef } from "./PathwayRef";
import { PathwayStatusChip } from "./ReviewPrimitives";

const fitLabels = { exact: "Exact fit", strong: "Strong fit", broad: "Broad fit" } as const;
const names = (keys: CompanyFit["matched"]) => keys.map(key => evidenceNodeLabels[key]).join(", ") || "None";

export function CompanyRoleChip({ role }: { role: Company["role"] }) {
  return <Badge variant="outline" className="inline-flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs font-normal text-muted-foreground">{companyRoleLabels[role]}</Badge>;
}

export function FitChip({ fit }: { fit: CompanyFit | null }) {
  if (!fit) return null;
  return <Tooltip><TooltipTrigger asChild><Badge variant="outline" className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs font-normal", fit.level === "exact" ? "border-success/40 text-success" : fit.level === "strong" ? "border-primary/40 text-primary" : "text-muted-foreground")}>{fitLabels[fit.level]}</Badge></TooltipTrigger><TooltipContent className="max-w-sm text-xs">Matches: {names(fit.matched)}. Differs: {names(fit.differing)}. Unknown: {names(fit.unknown)}.</TooltipContent></Tooltip>;
}

export function RoleNodeLine({ company, compact = false }: { company: Pick<Company, "role" | "role_node">; compact?: boolean }) {
  const ref = roleNode(company);
  return <span className={cn("flex flex-wrap items-center gap-1.5", compact && "text-[10px]")}><CompanyRoleChip role={company.role} /><span><span className="text-muted-foreground">{ref.verb}:</span> <strong className="text-foreground">{company.role_node}</strong></span></span>;
}

export function SecondaryNodes({ company, compact = false }: { company: Pick<Company, "role" | "secondary_nodes">; compact?: boolean }) {
  const positions = allowedSecondaryPositions(company.role);
  if (!positions.length) return <Tooltip><TooltipTrigger asChild><span className="text-[10px] text-muted-foreground">—</span></TooltipTrigger><TooltipContent>Feedstock suppliers have no upstream nodes</TooltipContent></Tooltip>;
  const nodes = Object.fromEntries(positions.map(position => [position, company.secondary_nodes[position]]));
  const hasAny = Object.values(nodes).some(Boolean);
  if (!hasAny) return <span className="text-[10px] text-muted-foreground">No secondary data</span>;
  return <div className="flex flex-wrap items-center gap-1"><span className="text-[10px] text-muted-foreground">Also known:</span><NodeChips nodes={nodes} compact={compact} /></div>;
}

export function CompanyDerivedPathwayList({ company }: { company: Company }) {
  const store = useHitlStore(); const ref = roleNode(company);
  const rows = derivedCompanyPathwayIds(company, store.pathways).map(id => store.pathways.find(pathway => pathway.id === id)).filter((pathway): pathway is NonNullable<typeof pathway> => Boolean(pathway)).map(pathway => ({ pathway, fit: computeFit(company, pathway) })).sort((a, b) => a.fit && b.fit ? ({ exact: 0, strong: 1, broad: 2 }[a.fit.level] - { exact: 0, strong: 1, broad: 2 }[b.fit.level]) : 0);
  if (!rows.length) return <p className="py-4 text-xs text-muted-foreground">No pathway contains {ref.positionLabel}: {company.role_node}.</p>;
  return <div className="divide-y rounded-md border">{rows.map(({ pathway, fit }) => <div key={pathway.id} className="flex items-center gap-2 px-3 py-2"><div className="min-w-0 flex-1"><PathwayRef pathwayId={pathway.id} variant="inline" emphasisNodes={[ref.positionKey, ...(fit?.matched ?? [])]} /></div>{fit ? <FitChip fit={fit} /> : <span className="text-xs text-muted-foreground">—</span>}<PathwayStatusChip status={pathway.status} /></div>)}</div>;
}

export function DerivedPathwaysForCompany({ company }: { company: Company }) {
  const store = useHitlStore(); const [open, setOpen] = useState(false); const ref = roleNode(company); const count = derivedCompanyPathwayIds(company, store.pathways).length;
  if (!count) return <span className="text-[10px] text-muted-foreground">0 pathways</span>;
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="link" className="h-auto p-0 text-[10px]" onMouseEnter={() => setOpen(true)}>{count} {count === 1 ? "pathway" : "pathways"}</Button></PopoverTrigger><PopoverContent className="w-[min(92vw,760px)]" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}><p className="mb-2 text-[10px] text-muted-foreground">Pathways containing {ref.positionLabel}: {company.role_node}</p><CompanyDerivedPathwayList company={company} /></PopoverContent></Popover>;
}