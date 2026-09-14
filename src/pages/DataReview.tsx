import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, FileSearch, Gauge, Link2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistorySheetProvider, RecordHistorySheet, TraceSheet, TraceSheetProvider } from "@/components/hitl";
import { AuditLogSection } from "@/components/hitl/AuditLogSection";
import { PathwaysSection } from "@/components/hitl/PathwaysSection";
import { CompaniesSection } from "@/components/hitl/CompaniesSection";
import { PapersPatentsSection } from "@/components/hitl/PapersPatentsSection";
import { IndicatorsSection } from "@/components/hitl/IndicatorsSection";
import { useHitlStore } from "@/lib/hitlStore";
import { cn } from "@/lib/utils";

type Section = "pathways" | "companies" | "papers-patents" | "indicators" | "audit-log";
const sections: { value: Section; label: string; title: string; description: string }[] = [
  { value: "pathways", label: "Pathways", title: "Pathways", description: "Review pathway definitions, node labels, visibility and lifecycle status." },
  { value: "companies", label: "Companies", title: "Companies", description: "Validate company profiles and proposed company–pathway relationships." },
  { value: "papers-patents", label: "Papers & Patents", title: "Papers & Patents", description: "Inspect publication and patent matches proposed for each pathway." },
  { value: "indicators", label: "Indicators", title: "Indicators", description: "Check sourced indicator values, dates, units and human corrections." },
  { value: "audit-log", label: "Audit Log", title: "Audit Log", description: "Trace every review action, field change and reverted operation." },
];
const validSections = new Set(sections.map(section => section.value));

function DataReviewContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const store = useHitlStore();
  const requested = searchParams.get("section") as Section | null;
  const activeSection: Section = requested && validSections.has(requested) ? requested : "pathways";
  const active = sections.find(section => section.value === activeSection) ?? sections[0];

  useEffect(() => {
    if (!requested || !validSections.has(requested)) setSearchParams({ section: "pathways" }, { replace: true });
  }, [requested, setSearchParams]);
  const queue = useMemo(() => [
    { label: "Pathways needing approval", count: store.pathways.filter(item => item.status === "needs_approval").length, sub: "Pathway definitions awaiting review", section: "pathways" as Section, icon: Link2 },
    { label: "Company matches pending", count: store.companyMatches.filter(item => item.status === "review_pending").length, sub: "Company–pathway links to verify", section: "companies" as Section, icon: Building2 },
    { label: "Paper & patent matches pending", count: store.paperPatentMatches.filter(item => item.status === "review_pending").length, sub: "Evidence matches to inspect", section: "papers-patents" as Section, icon: FileSearch },
    { label: "Indicator values pending", count: store.indicatorValues.filter(item => item.status === "review_pending").length, sub: "Values requiring validation", section: "indicators" as Section, icon: Gauge },
  ], [store.pathways, store.companyMatches, store.paperPatentMatches, store.indicatorValues]);

  const selectSection = (section: Section) => setSearchParams({ section });

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-[1400px] space-y-6 px-6 pb-6 pt-4">
        <div className="rounded-xl border border-border/40 bg-gradient-to-r from-card via-card to-primary/8 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-md bg-primary/20"><ShieldCheck className="h-2.5 w-2.5 text-primary" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Super Admin</span>
                <Badge variant="outline" className="ml-1 h-4 border-primary/20 bg-primary/10 px-1.5 text-[9px] text-primary">Restricted access</Badge>
              </div>
              <h1 className="mb-1 text-base font-bold tracking-tight text-foreground">Data <span className="text-primary">review</span></h1>
              <p className="text-[11px] leading-relaxed text-muted-foreground">Review, correct and revert pipeline-generated data. Every change is audited.</p>
            </div>
            <span className="shrink-0 pt-1 font-mono text-[10px] text-muted-foreground">store: in-memory · seed v1</span>
          </div>
        </div>

        <Card className="overflow-hidden rounded-xl border-border/40 shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-border/60 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            {queue.map(item => (
              <Button key={item.label} type="button" variant="ghost" onClick={() => selectSection(item.section)} className={cn("h-auto justify-start rounded-none px-4 py-3 text-left hover:bg-muted/40", activeSection === item.section && "bg-muted/60")}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10"><item.icon className="h-4 w-4 text-primary" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{item.label}</span>
                  <span className="flex items-baseline gap-1.5"><span className="text-base font-bold tabular-nums leading-none text-foreground">{item.count}</span><span className="truncate text-[10px] font-normal text-muted-foreground">{item.sub}</span></span>
                </span>
              </Button>
            ))}
          </div>
        </Card>

        <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-md bg-muted p-1" aria-label="Data Review sections">
          {sections.map(section => <Button key={section.value} type="button" variant="ghost" size="sm" onClick={() => selectSection(section.value)} className={cn("h-7 shrink-0 px-3 text-xs", activeSection === section.value ? "bg-foreground text-background shadow-sm hover:bg-foreground hover:text-background" : "text-muted-foreground")}>{section.label}</Button>)}
        </div>

        <Card className="overflow-hidden rounded-xl border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3"><CardTitle className="text-sm">{active.title}</CardTitle>{activeSection === "indicators" && <span className="font-mono text-[10px] text-muted-foreground">staleness window: 180 d</span>}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{active.description}</p>
          </CardHeader>
          <CardContent className={cn((activeSection === "pathways" || activeSection === "companies" || activeSection === "papers-patents" || activeSection === "indicators" || activeSection === "audit-log") && "p-0")}> 
            {activeSection === "pathways" ? <PathwaysSection /> : activeSection === "companies" ? <CompaniesSection /> : activeSection === "papers-patents" ? <PapersPatentsSection /> : activeSection === "indicators" ? <IndicatorsSection /> : <AuditLogSection />}
          </CardContent>
        </Card>
        <RecordHistorySheet />
        <TraceSheet />
      </div>
    </div>
  );
}

export default function DataReview() {
  return <HistorySheetProvider><TraceSheetProvider><DataReviewContent /></TraceSheetProvider></HistorySheetProvider>;
}
