import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, FileText, Gauge, Link2, ScrollText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HistorySheetProvider, NodeFilterBar, NodeFilterProvider, RecordHistorySheet, useNodeFilter } from "@/components/hitl";
import { AuditLogSection } from "@/components/hitl/AuditLogSection";
import { PathwaysSection } from "@/components/hitl/PathwaysSection";
import { CompaniesSection } from "@/components/hitl/CompaniesSection";
import { MatchReviewSection } from "@/components/hitl/MatchReviewSection";
import { IndicatorsSection } from "@/components/hitl/IndicatorsSection";
import { affectedPathwayIds, nodeListMatches, derivedCompanyPathwayIds, derivedPathwayIds, rolePosition, useHitlStore, type Company, type IndicatorValue, type PaperPatentMatch } from "@/lib/hitlStore";
import { cn } from "@/lib/utils";

type Section = "pathways" | "companies" | "papers" | "patents" | "indicators" | "audit";
const sections: { value: Section; label: string; title: string; description: string }[] = [
  { value: "pathways", label: "Pathways", title: "Pathways", description: "Review pathway definitions, node labels, visibility and lifecycle status." },
  { value: "companies", label: "Companies", title: "Companies", description: "Validate company profiles and proposed company–pathway relationships." },
  { value: "papers", label: "Papers", title: "Papers", description: "Inspect publication matches proposed for each Pathway." },
  { value: "patents", label: "Patents", title: "Patents", description: "Inspect patent matches proposed for each Pathway." },
  { value: "indicators", label: "Indicators", title: "Indicators", description: "Check sourced indicator values, dates, units and human corrections." },
  { value: "audit", label: "Audit Log", title: "Audit Log", description: "Review every action, field change and reverted operation." },
];
const validSections = new Set(sections.map(section => section.value));

function DataReviewContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const store = useHitlStore();
  const rawRequested = searchParams.get("section");
  const requested = rawRequested as Section | null;
  const activeSection: Section = requested && validSections.has(requested) ? requested : "pathways";
  const nodeFilter = useNodeFilter();
  const evidencePassesFilter = (item: PaperPatentMatch) => { if (!nodeFilter.isActive) return true; const normalized = (value: string | null) => value?.trim().toLocaleLowerCase() ?? ""; const direct = (!nodeFilter.feedstock || nodeListMatches(item.nodes.feedstock, nodeFilter.feedstock)) && (!nodeFilter.product || nodeListMatches(item.nodes.product, nodeFilter.product)); return direct || derivedPathwayIds(item, store.pathways).some(id => nodeFilter.matchingPathwayIds.has(id)); };
  const companyPassesFilter = (item: Company) => { if (!nodeFilter.isActive) return true; const normalized = (value: string | null) => value?.trim().toLocaleLowerCase() ?? ""; const position = rolePosition(item.role).positionKey; const direct = (!nodeFilter.feedstock || (position === "feedstock" && nodeListMatches(item.role_nodes, nodeFilter.feedstock))) && (!nodeFilter.product || (position === "product" && nodeListMatches(item.role_nodes, nodeFilter.product))); return direct || derivedCompanyPathwayIds(item, store.pathways).some(id => nodeFilter.matchingPathwayIds.has(id)); };

  const indicatorPassesFilter = (item: IndicatorValue) => { if (!nodeFilter.isActive) return true; const normalized = (value: string | null) => value?.trim().toLocaleLowerCase() ?? ""; const direct = (!nodeFilter.feedstock || normalized(item.target.feedstock) === normalized(nodeFilter.feedstock)) && (!nodeFilter.product || normalized(item.target.product) === normalized(nodeFilter.product)); return direct || affectedPathwayIds(item, store.pathways).some(id => nodeFilter.matchingPathwayIds.has(id)); };

  useEffect(() => {
    if (rawRequested === "papers-patents") { const next = new URLSearchParams(searchParams); next.set("section", "papers"); setSearchParams(next, { replace: true }); }
    else if (!requested || !validSections.has(requested)) { const next = new URLSearchParams(searchParams); next.set("section", "pathways"); setSearchParams(next, { replace: true }); }
  }, [rawRequested, requested, setSearchParams]);
  const queue = useMemo(() => [
    { label: "Pathways pending review", count: store.pathways.filter(item => nodeFilter.matchesPathway(item) && item.status === "review_pending").length, sub: "Pathway definitions awaiting review", section: "pathways" as Section, icon: Link2 },
    { label: "Companies pending review", count: store.companies.filter(item => companyPassesFilter(item) && item.status === "review_pending").length, sub: "Company node assignments to verify", section: "companies" as Section, icon: Building2 },
    { label: "Paper matches pending", count: store.paperMatches().filter(item => evidencePassesFilter(item) && item.status === "review_pending").length, sub: "Publication matches to inspect", section: "papers" as Section, icon: FileText },
    { label: "Patent matches pending", count: store.patentMatches().filter(item => evidencePassesFilter(item) && item.status === "review_pending").length, sub: "Patent matches to inspect", section: "patents" as Section, icon: ScrollText },
    { label: "Indicator values pending", count: store.indicatorValues.filter(item => indicatorPassesFilter(item) && item.status === "review_pending").length, sub: "Values requiring validation", section: "indicators" as Section, icon: Gauge },
  ], [store.pathways, store.companies, store.paperPatentMatches, store.indicatorValues, nodeFilter.feedstock, nodeFilter.product]);

  const selectSection = (section: Section) => { const next = new URLSearchParams(searchParams); next.set("section", section); setSearchParams(next); };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-[1400px] space-y-6 px-6 pb-6 pt-4">
        <div className="rounded-xl border border-border/40 bg-gradient-to-r from-card via-card to-primary/8 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-md bg-primary/20"><ShieldCheck className="h-2.5 w-2.5 text-primary" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Super Admin</span>
                <Badge variant="outline" className="ml-1 inline-flex h-6 items-center gap-1 whitespace-nowrap border-primary/20 bg-primary/10 px-2 text-xs text-primary">Restricted access</Badge>
              </div>
              <h1 className="mb-1 text-base font-bold tracking-tight text-foreground">Data <span className="text-primary">review</span></h1>
              <p className="text-[11px] leading-relaxed text-muted-foreground">Review, correct and revert pipeline-generated data. Every change is audited.</p>
            </div>
            <span className="shrink-0 pt-1 font-mono text-[10px] text-muted-foreground">store: in-memory · seed v1</span>
          </div>
        </div>

        <Card className="overflow-hidden rounded-xl border-border/40 shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-border/60 md:grid-cols-2 xl:grid-cols-5 xl:divide-x xl:divide-y-0">
            {queue.map(item => (
              <Button key={item.label} type="button" variant="ghost" onClick={() => selectSection(item.section)} className={cn("h-auto justify-start rounded-none px-4 py-3 text-left hover:bg-muted/40", activeSection === item.section && "bg-muted/60")}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10"><item.icon className="h-4 w-4 text-primary" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{item.label}{nodeFilter.isActive && <span className="ml-1 font-normal normal-case tracking-normal">filtered</span>}</span>
                  <span className="flex items-baseline gap-1.5"><span className="text-base font-bold tabular-nums leading-none text-foreground">{item.count}</span><span className="truncate text-[10px] font-normal text-muted-foreground">{item.sub}</span></span>
                </span>
              </Button>
            ))}
          </div>
        </Card>

        <NodeFilterBar />

        <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-md bg-muted p-1" aria-label="Data Review sections">
          {sections.map(section => <Button key={section.value} type="button" variant="ghost" size="sm" onClick={() => selectSection(section.value)} className={cn("h-7 shrink-0 px-3 text-xs", activeSection === section.value ? "bg-foreground text-background shadow-sm hover:bg-foreground hover:text-background" : "text-muted-foreground")}>{section.label}</Button>)}
        </div>

        <Card className="overflow-hidden rounded-xl border-border/40 shadow-sm">
          <CardContent className="p-0"> 
            {activeSection === "pathways" ? <PathwaysSection /> : activeSection === "companies" ? <CompaniesSection /> : activeSection === "papers" ? <MatchReviewSection kind="paper" /> : activeSection === "patents" ? <MatchReviewSection kind="patent" /> : activeSection === "indicators" ? <IndicatorsSection /> : <AuditLogSection />}
          </CardContent>
        </Card>
        <RecordHistorySheet />
      </div>
    </div>
  );
}

export default function DataReview() {
  return <HistorySheetProvider><NodeFilterProvider><DataReviewContent /></NodeFilterProvider></HistorySheetProvider>;
}
