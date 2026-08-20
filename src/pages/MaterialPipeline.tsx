import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layers, Factory, Leaf, Recycle, ArrowRight, Target, Compass, User, Users, ArrowUpDown, Trash2, CheckCircle2, BookMarked, X, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


import { Textarea } from "@/components/ui/textarea";
import MaterialPipelineList from "@/components/MaterialPipelineList";
import MaterialAddDialog, { type MaterialObjective } from "@/components/MaterialAddDialog";
import { computeBriefCompletion } from "@/components/MaterialBriefForm";
import MaterialEvaluationDrawer from "@/components/MaterialEvaluationDrawer";
import UserSwitcher from "@/components/UserSwitcher";
import BriefPickerDialog from "@/components/BriefPickerDialog";
import { computeUrgency as computeDiscoveryUrgency, loadEvaluation, urgencyColorClasses } from "@/lib/materialEvaluation";
import { usePipelineBriefStore, BRIEF_PALETTE, PIPELINE_BRIEFS_EVENT } from "@/store/pipelineBriefStore";
import { useCompanyBriefStore, makeBriefKey, type MaterialStatus } from "@/store/companyBriefStore";
import { useCurrentUser } from "@/lib/currentUser";
import { MOCK_USERS } from "@/lib/currentUser";

const STATUS_META: Record<Exclude<MaterialStatus, "">, { label: string; dot: string }> = {
  exploration: { label: "Exploration", dot: "bg-sky-500" },
  development: { label: "Development", dot: "bg-violet-500" },
  validation: { label: "Validation", dot: "bg-amber-500" },
  pilot: { label: "Pilot", dot: "bg-orange-500" },
  commercial: { label: "Commercial", dot: "bg-emerald-500" },
  on_hold: { label: "On hold", dot: "bg-muted-foreground" },
};

const URGENCY_LEVELS: { label: string; bar: string }[] = [
  { label: "Low", bar: "bg-emerald-500" },
  { label: "Moderate", bar: "bg-lime-500" },
  { label: "Elevated", bar: "bg-amber-500" },
  { label: "High", bar: "bg-orange-500" },
  { label: "Critical", bar: "bg-rose-500" },
];

function objectiveToCategory(obj: "Source" | "Produce" | "Valorise" | ""): "Feedstock" | "Product" {
  return obj === "Source" ? "Feedstock" : "Product";
}

type Cat = "Feedstock" | "Product";
type Objective = "Source" | "Produce" | "Valorise";



interface PipelineItem {
  name: string;
  category: Cat;
  objective: Objective;
  completed: number;
  total: number;
  completion: number; // 0..1
  timeline: string;
  timelineQuarter: number | null; // absolute index (year*4 + q-1)
  status: string;
  rationale: string[];
  urgencyScore: number;     // 0..100
  motivationScore: number;  // 0..100
  strategicScore: number;   // 0..100
  materialStatus: MaterialStatus;
  briefUrgency: number;     // 0..5 (from CompanyBrief)
  topPathwayMatch: number | null; // 0..100 top company fit score
}

// Strategic relevance scoring
// Urgency: closer the target launch quarter, the higher the score (12+ quarters away => 0, now => 100)
function computeUrgency(targetIdx: number | null, nowIdx: number): number {
  if (targetIdx == null) return 20; // unknown timeline → modest baseline
  const quartersAway = targetIdx - nowIdx;
  if (quartersAway <= 0) return 100;
  if (quartersAway >= 12) return 10;
  return Math.round(100 - (quartersAway / 12) * 90);
}
// Motivation: stronger when multiple strategic drivers (rationale items) are captured.
function computeMotivation(rationale: string[]): number {
  const n = Math.min(rationale.length, 5);
  if (n === 0) return 0;
  return Math.round((n / 5) * 100);
}

const QUARTER_RE = /Q\s*([1-4]).{0,3}(\d{4})/i;
const YEAR_RE = /\b(20\d{2})\b/;

function parseTimeline(t: string): number | null {
  if (!t) return null;
  const q = t.match(QUARTER_RE);
  if (q) return parseInt(q[2], 10) * 4 + (parseInt(q[1], 10) - 1);
  const y = t.match(YEAR_RE);
  if (y) return parseInt(y[1], 10) * 4 + 1; // mid-year
  return null;
}

function quarterLabel(idx: number) {
  const year = Math.floor(idx / 4);
  const q = (idx % 4) + 1;
  return `Q${q} ${year}`;
}

function normalize(item: any): { name: string; objective: Objective } {
  if (typeof item === "string") return { name: item, objective: "Valorise" };
  return {
    name: item?.name,
    objective: (item?.objective as Objective) || "Valorise",
  };
}

const OBJ_META: Record<Objective, { Icon: any; tint: string; bar: string; label: string }> = {
  Source: { Icon: Leaf, tint: "text-emerald-600", bar: "bg-emerald-500", label: "Source" },
  Produce: { Icon: Factory, tint: "text-violet-600", bar: "bg-violet-500", label: "Produce" },
  Valorise: { Icon: Recycle, tint: "text-amber-600", bar: "bg-amber-500", label: "Valorise" },
};

interface Discovery {
  id: string;
  name: string;
  objective: "Source" | "Produce" | "Valorise" | "";
  context: string;
  createdAt: number;
  owner?: string;
  contributors?: number;
  status?: "Ordered";
  orderReason?: string;
  orderedBy?: string;
  orderedAt?: number;
  briefId?: string;
}

export default function MaterialPipeline() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tick, setTick] = useState(0);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [discSort, setDiscSort] = useState<"recent" | "urgency">("urgency");
  const [openDiscoveryId, setOpenDiscoveryId] = useState<string | null>(() => searchParams.get("discovery"));
  const [evalTick, setEvalTick] = useState(0);
  const [briefPickerFor, setBriefPickerFor] = useState<string | null>(null);
  const [briefFilter, setBriefFilter] = useState<string>("all"); // "all" | "none" | briefId
  const [briefsTick, setBriefsTick] = useState(0);
  const briefOrder = usePipelineBriefStore((s) => s.order);
  const briefsMap = usePipelineBriefStore((s) => s.briefs);
  const allBriefs = useMemo(
    () => briefOrder.map((id) => briefsMap[id]).filter(Boolean),
    [briefOrder, briefsMap]
  );
  const createBrief = usePipelineBriefStore((s) => s.create);
  const companyBriefs = useCompanyBriefStore((s) => s.briefs);
  const companyPathwayScores = useCompanyBriefStore((s) => s.pathwayScores);
  const currentUser = useCurrentUser();

  // Add-material dialog
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [matName, setMatName] = useState("");
  const [matSynonyms, setMatSynonyms] = useState("");
  const [matObjective, setMatObjective] = useState<MaterialObjective>("Source");


  // New-discovery dialog
  const [showNewDiscovery, setShowNewDiscovery] = useState(false);
  const [discName, setDiscName] = useState("");
  const [discObjective, setDiscObjective] = useState<Objective | "">("");
  const [discContext, setDiscContext] = useState("");
  const [discBriefMode, setDiscBriefMode] = useState<"none" | "existing" | "new">("none");
  const [discBriefId, setDiscBriefId] = useState("");
  const [discNewBriefName, setDiscNewBriefName] = useState("");
  const [discOwner, setDiscOwner] = useState<string>(currentUser.name);

  const resetMaterialForm = () => {
    setMatName(""); setMatSynonyms(""); setMatObjective("Source");
  };
  const resetDiscoveryForm = () => {
    setDiscName(""); setDiscObjective(""); setDiscContext("");
    setDiscBriefMode("none"); setDiscBriefId(""); setDiscNewBriefName("");
    setDiscOwner(currentUser.name);
  };

  const handleAddMaterial = () => {
    const name = matName.trim();
    if (!name) return;
    const key = matObjective === "Produce" ? "portfolio_product" : "portfolio_feedstock";
    let arr: any[] = [];
    try { arr = JSON.parse(localStorage.getItem(key) || "[]"); } catch {}
    const exists = arr.some((it) => (typeof it === "string" ? it : it?.name)?.toLowerCase() === name.toLowerCase());
    if (!exists) {
      const category = key === "portfolio_product" ? "Product" : "Feedstock";
      arr.unshift({ name, synonyms: matSynonyms.trim(), objective: matObjective, category, isNew: true });
      localStorage.setItem(key, JSON.stringify(arr));
      window.dispatchEvent(new Event("portfolioUpdated"));
      window.dispatchEvent(new Event("storage"));
    }
    setShowAddMaterial(false);
    resetMaterialForm();
  };


  const handleNewDiscovery = () => {
    const name = discName.trim() || "Untitled discovery";
    let briefId: string | undefined;
    if (discBriefMode === "existing" && discBriefId) briefId = discBriefId;
    else if (discBriefMode === "new" && discNewBriefName.trim()) {
      briefId = createBrief(discNewBriefName.trim(), currentUser.name).id;
    }
    const next: Discovery = {
      id: `disc-${Date.now()}`,
      name,
      objective: discObjective,
      context: discContext.trim(),
      createdAt: Date.now(),
      owner: discOwner || currentUser.name || "Jon Doe",
      contributors: 1,
      briefId,
    };
    persistDiscoveries([next, ...discoveries]);
    setShowNewDiscovery(false);
    resetDiscoveryForm();
    setOpenDiscoveryId(next.id);
    setSearchParams({ discovery: next.id });
  };

  const persistDiscoveries = (next: Discovery[]) => {
    setDiscoveries(next);
    try {
      localStorage.setItem("portfolio_discoveries", JSON.stringify(next));
    } catch {}
    window.dispatchEvent(new Event("discoveriesUpdated"));
  };

  const renameDiscovery = (id: string, name: string) => {
    persistDiscoveries(discoveries.map((d) => (d.id === id ? { ...d, name } : d)));
  };
  const changeObjective = (id: string, objective: Objective | "") => {
    persistDiscoveries(discoveries.map((d) => (d.id === id ? { ...d, objective } : d)));
  };
  const changeOwner = (id: string, owner: string) => {
    persistDiscoveries(discoveries.map((d) => (d.id === id ? { ...d, owner } : d)));
  };

  const attachBrief = (discoveryId: string, briefId: string) => {
    persistDiscoveries(discoveries.map((d) => (d.id === discoveryId ? { ...d, briefId } : d)));
  };
  const detachBrief = (discoveryId: string) => {
    persistDiscoveries(discoveries.map((d) => (d.id === discoveryId ? { ...d, briefId: undefined } : d)));
  };


  const deleteDiscovery = (d: Discovery) => {
    if (!window.confirm(`Delete "${d.name}" from Material Prioritization? This cannot be undone.`)) return;
    persistDiscoveries(discoveries.filter((x) => x.id !== d.id));
    try {
      localStorage.removeItem(`material-evaluation-${d.id}`);
    } catch {}
    if (openDiscoveryId === d.id) {
      setOpenDiscoveryId(null);
      setSearchParams({});
    }
  };

  const markOrdered = (id: string, reason: string) => {
    const u = (() => {
      try {
        const raw = localStorage.getItem("current_user_v1");
        return raw ? JSON.parse(raw)?.name || "Jon Doe" : "Jon Doe";
      } catch { return "Jon Doe"; }
    })();
    persistDiscoveries(
      discoveries.map((d) =>
        d.id === id ? { ...d, status: "Ordered", orderReason: reason, orderedBy: u, orderedAt: Date.now() } : d
      )
    );
  };

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    const evalH = () => setEvalTick((t) => t + 1);
    const loadDisc = () => {
      try {
        setDiscoveries(JSON.parse(localStorage.getItem("portfolio_discoveries") || "[]"));
      } catch {
        setDiscoveries([]);
      }
    };
    const briefH = () => setBriefsTick((t) => t + 1);
    loadDisc();
    window.addEventListener("storage", h);
    window.addEventListener("materialBriefUpdated", h);
    window.addEventListener("discoveriesUpdated", loadDisc);
    window.addEventListener("materialEvaluationUpdated", evalH);
    window.addEventListener(PIPELINE_BRIEFS_EVENT, briefH);
    return () => {
      window.removeEventListener("storage", h);
      window.removeEventListener("materialBriefUpdated", h);
      window.removeEventListener("discoveriesUpdated", loadDisc);
      window.removeEventListener("materialEvaluationUpdated", evalH);
      window.removeEventListener(PIPELINE_BRIEFS_EVENT, briefH);
    };
  }, []);

  useEffect(() => {
    const discoveryId = searchParams.get("discovery");
    if (discoveryId) setOpenDiscoveryId(discoveryId);
  }, [searchParams]);

  const discoveryRows = useMemo(() => {
    void evalTick;
    void briefsTick;
    const rows = discoveries.map((d) => {
      const ev = loadEvaluation(d.id);
      const u = computeDiscoveryUrgency(ev);
      const contributors = Math.max(
        d.contributors ?? 1,
        new Set([d.owner || "Jon Doe", ...ev.editors]).size
      );
      return { d, urgency: u, contributors };
    });
    if (discSort === "urgency") {
      rows.sort((a, b) => (b.urgency.score ?? -1) - (a.urgency.score ?? -1));
    } else {
      rows.sort((a, b) => b.d.createdAt - a.d.createdAt);
    }
    return rows;
  }, [discoveries, discSort, evalTick, briefsTick]);

  const briefCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    discoveries.forEach((d) => {
      if (d.briefId) counts[d.briefId] = (counts[d.briefId] || 0) + 1;
    });
    return counts;
  }, [discoveries]);

  const filteredDiscoveryRows = useMemo(() => {
    if (briefFilter === "all") return discoveryRows;
    if (briefFilter === "none") return discoveryRows.filter((r) => !r.d.briefId);
    return discoveryRows.filter((r) => r.d.briefId === briefFilter);
  }, [discoveryRows, briefFilter]);



  const items = useMemo<PipelineItem[]>(() => {
    void tick;
    const now = new Date();
    const nowIdx = now.getFullYear() * 4 + Math.floor(now.getMonth() / 3);
    const collect = (key: string, category: Cat): PipelineItem[] => {
      let raw: any[] = [];
      try {
        raw = JSON.parse(localStorage.getItem(key) || "[]");
      } catch {
        raw = [];
      }
      return raw
        .map(normalize)
        .filter((x) => !!x.name && x.name !== "K")
        .map((x) => {
          let data: any = {};
          try {
            data = JSON.parse(
              localStorage.getItem(`material-brief-v2-${category}-${x.name}`) || "{}"
            );
          } catch {}
          const { completed, total, objective } = computeBriefCompletion(data);
          const obj = (data?.objective as Objective) || x.objective || objective;
          const tl: string = data?.timeline || "";
          const tIdx = parseTimeline(tl);
          const rationale = Array.isArray(data?.rationale) ? data.rationale : [];
          const urgencyScore = computeUrgency(tIdx, nowIdx);
          const motivationScore = computeMotivation(rationale);
          const strategicScore = Math.round(urgencyScore * 0.5 + motivationScore * 0.5);
          const briefKey = makeBriefKey(category, x.name);
          const cBrief = companyBriefs[briefKey];
          const pScores = companyPathwayScores[briefKey] || {};
          let topPathwayMatch: number | null = null;
          Object.values(pScores).forEach((p) => {
            const vals = Object.values(p?.priorityScores || {});
            if (vals.length) {
              const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
              if (topPathwayMatch == null || avg > topPathwayMatch) topPathwayMatch = Math.round(avg);
            }
          });
          return {
            name: x.name,
            category,
            objective: obj,
            completed,
            total,
            completion: total ? completed / total : 0,
            timeline: tl,
            timelineQuarter: tIdx,
            status: data?.status || "",
            rationale,
            urgencyScore,
            motivationScore,
            strategicScore,
            materialStatus: (cBrief?.materialStatus || "") as MaterialStatus,
            briefUrgency: cBrief?.urgency ?? 0,
            topPathwayMatch,
          };
        });
    };
    return [
      ...collect("portfolio_feedstock", "Feedstock"),
      ...collect("portfolio_product", "Product"),
    ];
  }, [tick, companyBriefs, companyPathwayScores]);

  const prioritized = useMemo(
    () =>
      [...items].sort((a, b) => {
        const am = a.topPathwayMatch ?? -1;
        const bm = b.topPathwayMatch ?? -1;
        if (bm !== am) return bm - am;
        if (b.strategicScore !== a.strategicScore) return b.strategicScore - a.strategicScore;
        if (b.completion !== a.completion) return b.completion - a.completion;
        const at = a.timelineQuarter ?? Infinity;
        const bt = b.timelineQuarter ?? Infinity;
        return at - bt;
      }),
    [items]
  );

  // Timeline range
  const withTimeline = items.filter((i) => i.timelineQuarter != null);
  const now = new Date();
  const nowIdx = now.getFullYear() * 4 + Math.floor(now.getMonth() / 3);
  const startIdx = nowIdx;
  const maxIdx = withTimeline.reduce(
    (m, i) => Math.max(m, i.timelineQuarter as number),
    nowIdx + 7
  );
  const endIdx = Math.max(maxIdx, nowIdx + 7);
  const span = Math.max(1, endIdx - startIdx);

  const yearTicks: number[] = [];
  for (let i = startIdx; i <= endIdx; i++) {
    if (i % 4 === 0) yearTicks.push(i);
  }

  const handleOpen = (it: PipelineItem) => {
    navigate(`/landscape/${encodeURIComponent(it.category)}/${encodeURIComponent(it.name)}/value-chain`);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-foreground" />
              <h1 className="text-[10px] uppercase tracking-widest font-semibold text-foreground">
                Material Pipeline
              </h1>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Materials already in research and new ideas being explored through discovery.
            </p>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {items.length} in research · {discoveries.length} in discovery
          </div>
        </div>

        {/* Materials in Research */}
        <MaterialPipelineList />

        {/* Material Prioritization */}
        <section className="rounded-lg border-2 border-border bg-card">
          <div className="px-4 py-3 border-b-2 border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-primary" />
              <h2 className="text-[10px] uppercase tracking-widest font-semibold">
                Material Prioritization
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                Exploratory — find which materials are worth researching
              </span>
              <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <ArrowUpDown className="w-3 h-3" />
                <span>Sort:</span>
                <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5">
                  <button
                    onClick={() => setDiscSort("urgency")}
                    className={`px-2 py-0.5 rounded-[5px] ${discSort === "urgency" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Urgency
                  </button>
                  <button
                    onClick={() => setDiscSort("recent")}
                    className={`px-2 py-0.5 rounded-[5px] ${discSort === "recent" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Recent
                  </button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { resetDiscoveryForm(); setShowNewDiscovery(true); }}
                className="text-[11px] text-muted-foreground hover:text-foreground h-6 px-2 gap-1"
              >
                <Plus className="w-3 h-3" />
                Add
              </Button>
            </div>
          </div>


          {filteredDiscoveryRows.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              {discoveries.length === 0 ? "No discoveries started yet." : "No materials match this brief filter."}
            </div>
          ) : (
            <>
              <div className="px-4 py-2 grid grid-cols-12 gap-3 items-center border-b border-border/60 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Discovery</div>
                <div className="col-span-2">Objective</div>
                <div className="col-span-2">Owner</div>
                <div className="col-span-1">Contributors</div>
                <div className="col-span-2">Urgency</div>
                <div className="col-span-1 text-right" />
              </div>
              <ul className="divide-y divide-border">
                {filteredDiscoveryRows.map(({ d, urgency, contributors }, i) => {
                  const objMeta = d.objective ? OBJ_META[d.objective] : null;
                  const owner = d.owner || "Jon Doe";
                  const uc = urgencyColorClasses(urgency.color);
                  const isOrdered = d.status === "Ordered";
                  return (
                    <li
                      key={d.id}
                      className="px-4 py-3 grid grid-cols-12 gap-3 items-center hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => {
                        if (isOrdered) {
                          const cat = objectiveToCategory(d.objective);
                          navigate(`/landscape/${encodeURIComponent(cat)}/${encodeURIComponent(d.name)}/value-chain`);
                          return;
                        }
                        setOpenDiscoveryId(d.id);
                        setSearchParams({ discovery: d.id });
                      }}
                    >
                      <div className="col-span-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                        #{i + 1}
                      </div>
                      <div className="col-span-3 flex items-center gap-2 min-w-0">
                        <Compass className={`w-3.5 h-3.5 shrink-0 ${isOrdered ? "text-emerald-600" : "text-primary"}`} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{d.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {isOrdered ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span className="text-[10px] uppercase tracking-widest font-semibold text-emerald-700">
                                  Coverage requested
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                                </span>
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                  Discovery in progress
                                </span>
                              </>
                            )}
                            {(() => {
                              const b = d.briefId ? allBriefs.find((x) => x.id === d.briefId) : null;
                              if (!b) return null;
                              const p = BRIEF_PALETTE[b.color] || BRIEF_PALETTE.emerald;
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] ${p.bg} ${p.text} ${p.border}`}
                                  title={`Brief: ${b.name}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                                  <BookMarked className="w-2.5 h-2.5" />
                                  <span className="truncate max-w-[120px]">{b.name}</span>
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        {objMeta ? (
                          <span className="inline-flex items-center gap-1.5">
                            <objMeta.Icon className={`w-3.5 h-3.5 ${objMeta.tint}`} />
                            <span className={`text-[11px] font-semibold uppercase tracking-wider ${objMeta.tint}`}>
                              {objMeta.label}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Unscoped
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 text-xs min-w-0">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{owner}</span>
                      </div>
                      <div className="col-span-1 flex items-center gap-1 text-xs">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="tabular-nums">{contributors}</span>
                      </div>
                      <div className="col-span-2">
                        {urgency.score == null ? (
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground italic">
                            Not enough input
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full ${uc.bg}`} style={{ width: `${urgency.score}%` }} />
                            </div>
                            <span className={`text-[11px] tabular-nums font-semibold w-7 text-right ${uc.text}`}>
                              {urgency.score}
                            </span>
                            <span className={`text-[9px] uppercase tracking-widest font-semibold ${uc.text} w-14`}>
                              {urgency.label}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-end items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        {!d.briefId && !isOrdered && (
                          <button
                            onClick={() => setBriefPickerFor(d.id)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                            title="Add a brief"
                          >
                            <BookMarked className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteDiscovery(d)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>

      <MaterialEvaluationDrawer
        open={!!openDiscoveryId}
        onOpenChange={(o) => {
          if (!o) {
            setOpenDiscoveryId(null);
            setSearchParams({});
          }
        }}
        discoveryId={openDiscoveryId}
        discoveryName={discoveries.find((d) => d.id === openDiscoveryId)?.name || ""}
        objective={discoveries.find((d) => d.id === openDiscoveryId)?.objective || ""}
        owner={discoveries.find((d) => d.id === openDiscoveryId)?.owner || "Jon Doe"}
        briefId={discoveries.find((d) => d.id === openDiscoveryId)?.briefId}
        briefShareCount={(() => {
          const bId = discoveries.find((d) => d.id === openDiscoveryId)?.briefId;
          return bId ? briefCounts[bId] || 0 : 0;
        })()}
        onAttachBrief={(briefId) => { if (openDiscoveryId) attachBrief(openDiscoveryId, briefId); }}
        onDetachBrief={() => { if (openDiscoveryId) detachBrief(openDiscoveryId); }}
        onOpenBriefPicker={() => { if (openDiscoveryId) setBriefPickerFor(openDiscoveryId); }}
        onRename={renameDiscovery}
        onOrdered={markOrdered}
        onChangeObjective={changeObjective}
        onChangeOwner={changeOwner}
      />

      <BriefPickerDialog
        open={!!briefPickerFor}
        onOpenChange={(o) => { if (!o) setBriefPickerFor(null); }}
        onAttach={(briefId) => { if (briefPickerFor) attachBrief(briefPickerFor, briefId); }}
        countsByBrief={briefCounts}
      />

      <MaterialAddDialog
        open={showAddMaterial}
        onOpenChange={(open) => { setShowAddMaterial(open); if (!open) resetMaterialForm(); }}
        name={matName}
        onNameChange={setMatName}
        synonyms={matSynonyms}
        onSynonymsChange={setMatSynonyms}
        objective={matObjective}
        onObjectiveChange={setMatObjective}
        onSubmit={handleAddMaterial}
        onCancel={() => { setShowAddMaterial(false); resetMaterialForm(); }}
      />

      {/* New Discovery Dialog */}
      <Dialog open={showNewDiscovery} onOpenChange={(o) => { setShowNewDiscovery(o); if (!o) resetDiscoveryForm(); }}>
        <DialogContent className="sm:max-w-2xl p-8 bg-gradient-to-br from-card to-card/95 border border-border/40 shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 -mb-2">
            <DialogTitle className="text-2xl font-semibold text-foreground">Start Material Prioritization</DialogTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Find which materials are worth researching. Start now and finish later; nothing has to be complete.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="disc-name" className="text-sm font-semibold">Discovery Name</Label>
              <Input id="disc-name" placeholder="Untitled discovery" value={discName} onChange={(e) => setDiscName(e.target.value)} className="border-2 border-success/20 focus:border-success/40 rounded-md h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Owner</Label>
              <div className="grid grid-cols-2 gap-2">
                {MOCK_USERS.map((u) => {
                  const sel = discOwner === u.name;
                  const initials = u.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <button
                      key={u.name}
                      type="button"
                      onClick={() => setDiscOwner(u.name)}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all text-left ${sel ? "border-success bg-success/10" : "border-border/40 bg-background hover:border-muted-foreground/30"}`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${u.color}`}>{initials}</span>
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold truncate ${sel ? "text-success" : "text-foreground"}`}>{u.name}{u.name === currentUser.name ? " (you)" : ""}</div>
                        {u.team && <div className="text-[10px] text-muted-foreground truncate">{u.team}</div>}
                      </div>
                      {sel && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Objective</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "Source" as const, l: "Source", d: "Find suppliers" },
                  { v: "Produce" as const, l: "Produce", d: "Manufacture" },
                  { v: "Valorise" as const, l: "Valorise", d: "Utilise waste" },
                ]).map((o) => {
                  const sel = discObjective === o.v;
                  const selBorder = o.v === "Source" ? "border-primary bg-primary/10" : o.v === "Produce" ? "border-application-purple bg-application-purple/10" : "border-success bg-success/10";
                  const selText = o.v === "Source" ? "text-primary" : o.v === "Produce" ? "text-application-purple" : "text-success";
                  return (
                    <button key={o.v} onClick={() => setDiscObjective(sel ? "" : o.v)} className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${sel ? selBorder : "border-border/40 bg-background hover:border-muted-foreground/30"}`}>
                      <span className={`text-sm font-semibold ${sel ? selText : "text-foreground"}`}>{o.l}</span>
                      <span className="text-[10px] text-muted-foreground">{o.d}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="disc-context" className="text-sm font-semibold">Context</Label>
              <Textarea id="disc-context" placeholder="What's driving this? Cost, regulation, supply risk, sustainability, new market…" value={discContext} onChange={(e) => setDiscContext(e.target.value)} className="border-2 border-success/20 focus:border-success/40 rounded-md min-h-[96px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold inline-flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-primary" /> Brief <span className="text-[10px] font-normal text-muted-foreground">(optional)</span>
              </Label>
              <p className="text-[11px] text-muted-foreground">Attach a shared brief — useful when several materials address the same need.</p>
              <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5">
                {([
                  { value: "none", label: "No brief" },
                  { value: "existing", label: "Use existing" },
                  { value: "new", label: "Create new" },
                ] as const).map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setDiscBriefMode(opt.value)} className={`text-[11px] px-3 py-1 rounded-[5px] ${discBriefMode === opt.value ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {discBriefMode === "existing" && (
                allBriefs.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic px-1 pt-1">No briefs yet — switch to "Create new".</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-md border border-border divide-y divide-border mt-1">
                    {allBriefs.map((b) => {
                      const p = BRIEF_PALETTE[b.color] || BRIEF_PALETTE.emerald;
                      const active = discBriefId === b.id;
                      return (
                        <button key={b.id} type="button" onClick={() => setDiscBriefId(b.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${active ? `${p.bg}` : "hover:bg-muted/50"}`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${p.dot} shrink-0`} />
                          <span className={`text-sm flex-1 truncate ${active ? `${p.text} font-semibold` : ""}`}>{b.name}</span>
                          {active && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                )
              )}
              {discBriefMode === "new" && (
                <Input value={discNewBriefName} onChange={(e) => setDiscNewBriefName(e.target.value)} placeholder="Brief name (e.g. Replace incumbent X)" className="border-2 border-success/20 focus:border-success/40 rounded-md h-9 mt-1" />
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowNewDiscovery(false); resetDiscoveryForm(); }} className="flex-1 h-9 border-2 rounded-md">Cancel</Button>
              <Button onClick={handleNewDiscovery} className="flex-1 h-9 rounded-md bg-success hover:bg-success/90 text-success-foreground">Start Discovery</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      <UserSwitcher />
    </div>
  );
}
