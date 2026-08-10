import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Scale, Target, ArrowRight, Download, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useCompanyBriefStore,
  makeBriefKey,
  type PropertyAssessment,
  type PriorityStatus,
} from "@/store/companyBriefStore";
import { exportCompanyPdf } from "@/lib/exportCompanyPdf";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface PathwayInfo {
  feedstock?: string;
  process?: string;
  material?: string;
  application?: string;
  trl?: string;
}

interface Props {
  category?: string;
  topic?: string;
  pathwayId: string;
  pathwayInfo?: PathwayInfo;
}

const statusOptions: { value: PropertyAssessment["status"]; label: string }[] = [
  { value: "", label: "—" },
  { value: "met", label: "Met" },
  { value: "partial", label: "Partial" },
  { value: "not_met", label: "Not met" },
];

const priorityStatusOptions: { value: PriorityStatus; label: string }[] = [
  { value: "", label: "—" },
  { value: "go", label: "Go" },
  { value: "open", label: "Open" },
  { value: "blocked", label: "Blocked" },
];

const statusColor = (s: PropertyAssessment["status"]) => {
  switch (s) {
    case "met":
      return "bg-primary/10 text-primary border-primary/30";
    case "partial":
      return "bg-amber-100 text-amber-700 border-amber-300";
    case "not_met":
      return "bg-rose-100 text-rose-700 border-rose-300";
    default:
      return "bg-background text-muted-foreground border-border";
  }
};

const priorityStatusColor = (s: PriorityStatus) => {
  switch (s) {
    case "go":
      return "bg-primary/10 text-primary border-primary/30";
    case "open":
      return "bg-amber-100 text-amber-700 border-amber-300";
    case "blocked":
      return "bg-rose-100 text-rose-700 border-rose-300";
    default:
      return "bg-background text-muted-foreground border-border";
  }
};

const formatUpdatedAt = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

const fitColor = (score: number) =>
  score >= 70 ? "text-primary" : score >= 40 ? "text-amber-600" : "text-muted-foreground";

const CompanyEvaluation: React.FC<Props> = ({ category, topic, pathwayId, pathwayInfo }) => {
  const briefKey = makeBriefKey(category, topic);
  const briefFromStore = useCompanyBriefStore((s) => s.briefs[briefKey]);
  const brief = briefFromStore ?? useCompanyBriefStore.getState().getBrief(briefKey);
  const scores =
    useCompanyBriefStore((s) => s.pathwayScores[briefKey]?.[pathwayId]) ?? {
      priorityScores: {},
      priorityNotes: {},
      priorityMeta: {},
      propertyAssessments: {},
    };
  const setPriorityScore = useCompanyBriefStore((s) => s.setPriorityScore);
  const setPriorityNote = useCompanyBriefStore((s) => s.setPriorityNote);
  const setPriorityStatus = useCompanyBriefStore((s) => s.setPriorityStatus);
  const setPropertyAssessment = useCompanyBriefStore((s) => s.setPropertyAssessment);

  const [userName, setUserName] = useState<string>("User");
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user;
      if (u) {
        setUserName(
          (u.user_metadata as { display_name?: string } | null)?.display_name ||
            u.email?.split("@")[0] ||
            "User"
        );
      }
    });
  }, []);

  const criteria = brief.criteria;
  const properties = brief.properties;

  const briefHref = `/landscape/${category || "Product"}/${encodeURIComponent(
    topic || ""
  )}/value-chain`;

  const { fitScore, totalWeight } = useMemo(() => {
    const totalW = criteria.reduce((s, c) => s + (c.weight || 0), 0);
    if (totalW <= 0) return { fitScore: 0, totalWeight: 0 };
    const weighted = criteria.reduce((sum, c) => {
      const sub = scores.priorityScores?.[c.id] ?? 0;
      return sum + (c.weight || 0) * sub;
    }, 0);
    return { fitScore: Math.round(weighted / totalW), totalWeight: totalW };
  }, [criteria, scores.priorityScores]);

  const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-center space-y-2">
      <p className="text-xs text-muted-foreground">{message}</p>
      <Button asChild size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
        <Link to={briefHref}>
          Open Company Brief <ArrowRight className="w-3 h-3" />
        </Link>
      </Button>
    </div>
  );

  const handleExport = () => {
    try {
      exportCompanyPdf({
        category,
        topic,
        pathwayLabel: `Pathway ${Number(pathwayId) + 1}`,
        pathwayInfo,
        brief,
        scores,
      });
      toast.success("PDF exported");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          Company Evaluation
        </p>
        <div className="flex items-center gap-2 xl:justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            className="h-7 gap-1.5 text-xs min-w-0"
          >
            <Download className="w-3 h-3" />
            Export PDF
          </Button>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Data privacy information"
                  className="w-6 h-6 rounded-full inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs text-xs leading-relaxed">
                Your data stays yours. The information entered here will not be used to train AI
                models and is never shared with anyone. It is owned solely by the company that
                inputs it.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {/* BLOCK 1 — Target Properties check */}
      <section className="rounded-lg border border-border bg-background p-4 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Target className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Target Properties Check</h3>
        </div>

        {properties.length === 0 ? (
          <EmptyState message="No target properties defined. Add them in the Company Brief." />
        ) : (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground mb-1.5">
              Compare this pathway's delivered properties to your targets from the Company Brief.
            </p>
            <div className="hidden lg:grid grid-cols-[minmax(140px,1.4fr)_140px_110px_70px_minmax(0,2.2fr)] gap-2 px-2 text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
              <span>Property</span>
              <span>Target</span>
              <span>Delivered</span>
              <span>Status</span>
              <span>Note</span>
            </div>
            {properties.map((p) => {
              const a =
                scores.propertyAssessments?.[p.id] ?? { value: "", status: "" as const, note: "" };
              return (
                <div
                  key={p.id}
                  className="group grid grid-cols-1 lg:grid-cols-[minmax(140px,1.4fr)_140px_110px_70px_minmax(0,2.2fr)] gap-2 items-center rounded-md border-l-2 border-l-primary/60 border-y border-r border-border/60 bg-accent/5 hover:bg-accent/10 transition-colors px-2 py-1"
                >
                  <span className="text-xs font-medium text-foreground truncate" title={p.property}>
                    {p.property || "—"}
                  </span>
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span className="text-xs font-mono tabular-nums text-foreground truncate">
                      {p.value || "—"}
                    </span>
                    {p.unit && (
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                        {p.unit}
                      </span>
                    )}
                  </div>
                  <Input
                    value={a.value}
                    onChange={(e) =>
                      setPropertyAssessment(briefKey, pathwayId, p.id, { value: e.target.value })
                    }
                    placeholder="value"
                    className="h-6 text-xs font-mono tabular-nums px-1.5"
                  />
                  <select
                    value={a.status}
                    onChange={(e) =>
                      setPropertyAssessment(briefKey, pathwayId, p.id, {
                        status: e.target.value as PropertyAssessment["status"],
                      })
                    }
                    className={`h-6 text-[10px] px-1 rounded border ${statusColor(a.status)}`}
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={a.note}
                    onChange={(e) =>
                      setPropertyAssessment(briefKey, pathwayId, p.id, { note: e.target.value })
                    }
                    placeholder="Gap, test conditions, source…"
                    className="h-6 text-xs"
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* BLOCK 2 — Company Fit Score */}
      <section className="rounded-lg border border-border bg-background p-3 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Scale className="w-3 h-3" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Company Fit Score</h3>
          </div>
          {criteria.length > 0 && (
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-bold tabular-nums leading-none ${fitColor(fitScore)}`}>
                {fitScore}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                weighted fit
              </span>
            </div>
          )}
        </div>

        {criteria.length === 0 ? (
          <EmptyState message="No priorities set. Add them in the Company Brief." />
        ) : (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground mb-1.5">
              Score the slider, set status, then capture the reasoning in the note. Weights come from the Company Brief.
            </p>
            <div className="hidden md:grid grid-cols-[minmax(140px,1.2fr)_120px_70px_minmax(0,2.4fr)_60px] gap-2 px-1.5 text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
              <span>Priority</span>
              <span>Score</span>
              <span>Status</span>
              <span>Note</span>
              <span className="text-right">Updated</span>
            </div>
            {criteria.map((c) => {
              const sub = scores.priorityScores?.[c.id] ?? 0;
              const note = scores.priorityNotes?.[c.id] ?? "";
              const meta = scores.priorityMeta?.[c.id];
              const pStatus: PriorityStatus = meta?.status ?? "";
              const weightPct = totalWeight > 0 ? Math.round(((c.weight || 0) / totalWeight) * 100) : 0;
              return (
                <div
                  key={c.id}
                  className="grid grid-cols-1 md:grid-cols-[minmax(140px,1.2fr)_120px_70px_minmax(0,2.4fr)_60px] gap-2 items-center rounded-md border border-border bg-muted/20 px-2 py-1.5 min-w-0"
                >
                  {/* Priority name + weight chip */}
                  <div className="min-w-0 flex items-center gap-1.5">
                    <span className="text-xs text-foreground truncate" title={c.name || "Untitled"}>
                      {c.name || "Untitled"}
                    </span>
                    <span className="shrink-0 text-[9px] font-semibold tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {c.weight || 0}%
                    </span>
                  </div>

                  {/* Compact slider + inline score */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Slider
                      value={[sub]}
                      onValueChange={(v) =>
                        setPriorityScore(briefKey, pathwayId, c.id, v[0], userName)
                      }
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1 min-w-0"
                    />
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-foreground w-6 text-right">
                      {sub}
                    </span>
                  </div>

                  {/* Compact status select */}
                  <select
                    value={pStatus}
                    onChange={(e) =>
                      setPriorityStatus(
                        briefKey,
                        pathwayId,
                        c.id,
                        e.target.value as PriorityStatus,
                        userName
                      )
                    }
                    className={`h-6 text-[10px] px-1.5 rounded border w-full min-w-0 font-medium ${priorityStatusColor(pStatus)}`}
                  >
                    {priorityStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Note — the focus */}
                  <Input
                    value={note}
                    onChange={(e) =>
                      setPriorityNote(briefKey, pathwayId, c.id, e.target.value, userName)
                    }
                    placeholder="Why this score? Add reasoning, blockers, links…"
                    className="h-7 text-xs"
                  />

                  {/* Tiny updated stamp */}
                  <div
                    className="text-[9px] text-muted-foreground/70 text-right truncate"
                    title={
                      meta?.updatedAt
                        ? `${meta.updatedBy || "—"} · ${new Date(meta.updatedAt).toLocaleString()}`
                        : ""
                    }
                  >
                    {meta?.updatedAt ? formatUpdatedAt(meta.updatedAt) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

export default CompanyEvaluation;
