import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { allowedSecondaryPositions, cleanNodeList, computeFit, derivedCompanyPathwayIds, useHitlStore, type Company, type CompanyFit } from "@/lib/hitlStore";
import { companyRoleLabels, roleNodeRefs, roleNodePositionKeys, roleNodesSummary } from "@/lib/roleNode";
import { cn } from "@/lib/utils";
import { NodeChips, evidenceNodeLabels } from "./EvidenceMatchPrimitives";
import { PathwayRef } from "./PathwayRef";
import { VisibilityChip } from "./ReviewPrimitives";

const fitLabels = { exact: "Exact fit", strong: "Strong fit", broad: "Broad fit" } as const;
const names = (keys: CompanyFit["matched"]) => keys.map(key => evidenceNodeLabels[key]).join(", ") || "None";

export function CompanyRoleChip({ role }: { role: Company["roles"][number] }) {
  return <Badge variant="outline" className="inline-flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs font-normal text-muted-foreground">{companyRoleLabels[role]}</Badge>;
}

export function CompanyRoleChips({ roles }: { roles: Company["roles"] }) {
  return <span className="flex flex-wrap items-center gap-1">{roles.map(role => <CompanyRoleChip key={role} role={role} />)}</span>;
}

export function FitChip({ fit }: { fit: CompanyFit | null }) {
  if (!fit) return null;
  return <Tooltip><TooltipTrigger asChild><span><Badge variant="outline" className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs font-normal", fit.level === "exact" ? "border-success/40 text-success" : fit.level === "strong" ? "border-primary/40 text-primary" : "text-muted-foreground")}>{fitLabels[fit.level]}</Badge></span></TooltipTrigger><TooltipContent className="max-w-sm text-xs">Matches: {names(fit.matched)}. Differs: {names(fit.differing)}. Unknown: {names(fit.unknown)}.</TooltipContent></Tooltip>;
}

export function RoleNodeLine({ company, compact = false }: { company: Pick<Company, "roles" | "role_nodes">; compact?: boolean }) {
  const refs = roleNodeRefs(company);
  if (!refs.length) return <span className="text-xs text-muted-foreground">No role set</span>;
  return <span className={cn("flex flex-col gap-1", compact && "text-[10px]")}>{refs.map(ref => <span key={ref.role} className="flex flex-wrap items-center gap-1.5"><CompanyRoleChip role={ref.role} /><span><span className="text-muted-foreground">{ref.verb}:</span> {ref.values.length ? <strong className="text-foreground">{ref.values.join(", ")}</strong> : <span className="text-muted-foreground">Not set</span>}</span></span>)}</span>;
}

export function SecondaryNodes({ company, compact = false }: { company: Pick<Company, "roles" | "secondary_nodes">; compact?: boolean }) {
  const positions = allowedSecondaryPositions(company.roles);
  if (!positions.length) return <Tooltip><TooltipTrigger asChild><span className="text-[10px] text-muted-foreground">—</span></TooltipTrigger><TooltipContent>These roles already cover every relevant node</TooltipContent></Tooltip>;
  const nodes = { feedstock: [], process_technology: [], product: [], application_market: [] } as Company["secondary_nodes"];
  positions.forEach(position => { nodes[position] = cleanNodeList(company.secondary_nodes[position]); });
  if (!Object.values(nodes).some(values => values.length > 0)) return <span className="text-[10px] text-muted-foreground">No secondary data</span>;
  const matchNodes = { feedstock: nodes.feedstock, process: nodes.process_technology, product: nodes.product, application: nodes.application_market };
  return <div className="flex flex-wrap items-center gap-1"><span className="text-[10px] text-muted-foreground">Also known:</span><NodeChips nodes={matchNodes} compact={compact} /></div>;
}

export function CompanyDerivedPathwayList({ company }: { company: Company }) {
  const store = useHitlStore();
  const rows = derivedCompanyPathwayIds(company, store.pathways).map(id => store.pathways.find(pathway => pathway.id === id)).filter((pathway): pathway is NonNullable<typeof pathway> => Boolean(pathway)).map(pathway => ({ pathway, fit: computeFit(company, pathway) })).sort((a, b) => a.fit && b.fit ? ({ exact: 0, strong: 1, broad: 2 }[a.fit.level] - { exact: 0, strong: 1, broad: 2 }[b.fit.level]) : 0);
  if (!rows.length) return <p className="py-4 text-xs text-muted-foreground">No pathway matches {roleNodesSummary(company) || "these role nodes"}.</p>;
  return <div className="divide-y rounded-md border">{rows.map(({ pathway, fit }) => <div key={pathway.id} className="flex items-center gap-2 px-3 py-2"><div className="min-w-0 flex-1"><PathwayRef pathwayId={pathway.id} variant="inline" emphasisNodes={[...roleNodePositionKeys(company), ...(fit?.matched ?? [])]} /></div>{fit ? <FitChip fit={fit} /> : <span className="text-xs text-muted-foreground">—</span>}<VisibilityChip state={pathway.visibility.default} /></div>)}</div>;
}

export function DerivedPathwaysForCompany({ company }: { company: Company }) {
  const store = useHitlStore(); const [open, setOpen] = useState(false); const count = derivedCompanyPathwayIds(company, store.pathways).length;
  if (!count) return <span className="text-[10px] text-muted-foreground">0 pathways</span>;
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="link" className="h-auto p-0 text-[10px]" onMouseEnter={() => setOpen(true)}>{count} {count === 1 ? "pathway" : "pathways"}</Button></PopoverTrigger><PopoverContent className="w-[min(92vw,760px)]" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}><p className="mb-2 text-[10px] text-muted-foreground">Pathways matching {roleNodesSummary(company)}</p><CompanyDerivedPathwayList company={company} /></PopoverContent></Popover>;
}

