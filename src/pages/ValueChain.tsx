import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, FolderOpen, Settings, TestTube, Zap, Box, UtensilsCrossed, GitBranch, Beaker, Package, Folder, Fuel, Wheat, Layers, Leaf, Tractor, Sparkles, Pill, FlaskConical, Search, SortAsc, BarChart3, Eye, EyeOff, GitCompare, X, Info, Trees, Sprout, Factory, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Lightbulb, Scale, TrendingUp, Download, Star, CheckCircle2, AlertCircle, MapPin, Globe, BookOpen, Award, Check, Target, MessageSquare, FileText, Wand2, Circle, DollarSign, Users, Minus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, ComposedChart, Bar, Area, BarChart } from 'recharts';
import ProductTable from '@/components/ProductTable';
import { PREDEFINED_PATHWAYS } from '@/pages/ValueChainPathways';
import PathwayChat from '@/components/PathwayChat';
import feedstockAnalysisChart from '@/assets/feedstock-analysis-chart.png';
import marketApplicationsChart from '@/assets/market-applications-chart.png';
import xyloseMolecule from '@/assets/xylose-molecule.png';
import sampleEuropeMap from '@/assets/sample-europe-map.png.asset.json';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import ValueChainSummary from '@/components/ValueChainSummary';
import SankeyConnections from '@/components/SankeyConnections';
import VCGScoreBadge from '@/components/VCGScoreBadge';
import ProductBriefDialog from '@/components/ProductBriefDialog';
import MaterialBriefForm, { loadBriefSummary } from '@/components/MaterialBriefForm';
import MaterialBriefOutline from '@/components/MaterialBriefOutline';
import WorldRegionMap from '@/components/WorldRegionMap';
import CompanyBrief from '@/components/CompanyBrief';
import { Tooltip as UiTooltip, TooltipContent as UiTooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Objective = 'Source' | 'Produce' | 'Valorise';

const detectObjective = (topic: string | undefined, category: string | undefined): Objective | null => {
  if (!topic || !category) return null;
  try {
    const key = `portfolio_${category.toLowerCase()}`;
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    const match = items.find((i: any) => i?.name?.toLowerCase() === topic.toLowerCase());
    const o = match?.objective;
    if (o === 'Source' || o === 'Produce' || o === 'Valorise') return o;
  } catch { /* */ }
  return null;
};

const objectiveBadgeClasses = (objective: Objective | null) => {
  switch (objective) {
    case 'Source': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Produce': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Valorise': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default: return 'bg-primary/10 text-primary border-primary/20';
  }
};

const MaterialProfileHero: React.FC<{
  decodedTopic: string;
  cat: string;
  objective: Objective | null;
  category?: string;
  isFeedstockRoute: boolean;
  showProductBrief: boolean;
  setShowProductBrief: (v: boolean) => void;
  topic?: string;
}> = ({ decodedTopic, cat, objective, category, isFeedstockRoute, showProductBrief, setShowProductBrief, topic }) => {
  const [briefSummary, setBriefSummary] = React.useState(() => loadBriefSummary(decodedTopic, cat));
  const briefProgressKey = `material_brief_progress_${cat}_${decodedTopic}`;
  const readBriefCompletion = React.useCallback(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const stored = localStorage.getItem(briefProgressKey);
      if (!stored) return 0;
      const parsed = JSON.parse(stored);
      return typeof parsed?.completion === 'number' ? parsed.completion : 0;
    } catch { return 0; }
  }, [briefProgressKey]);
  const [briefCompletion, setBriefCompletion] = React.useState<number>(readBriefCompletion);
  const decisionsKey = `material_decisions_${category}_${topic}`;
  const readDecisionsCount = React.useCallback(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const stored = localStorage.getItem(decisionsKey);
      if (!stored) return 4; // seed default
      const arr = JSON.parse(stored);
      return Array.isArray(arr) ? arr.length : 0;
    } catch { return 0; }
  }, [decisionsKey]);
  const [decisionsCount, setDecisionsCount] = React.useState<number>(readDecisionsCount);
  React.useEffect(() => {
    const refresh = () => {
      setBriefSummary(loadBriefSummary(decodedTopic, cat));
      setBriefCompletion(readBriefCompletion());
      setDecisionsCount(readDecisionsCount());
    };
    refresh();
    window.addEventListener('materialBriefUpdated', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('materialBriefUpdated', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [decodedTopic, cat, readDecisionsCount, readBriefCompletion]);
  const { priority, readiness, completion: legacyCompletion } = briefSummary;
  const completion = briefCompletion || legacyCompletion;
  const priorityColor =
    priority.percent >= 75 ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
    : priority.percent >= 55 ? 'text-amber-600 bg-amber-500/10 border-amber-500/20'
    : priority.percent >= 35 ? 'text-orange-600 bg-orange-500/10 border-orange-500/20'
    : 'text-muted-foreground bg-muted border-border';
  const readinessColor =
    readiness.status === 'Pilot-scope-ready' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
    : readiness.status === 'Search-ready' ? 'text-amber-600 bg-amber-500/10 border-amber-500/20'
    : readiness.status === 'Partially defined' ? 'text-orange-600 bg-orange-500/10 border-orange-500/20'
    : 'text-muted-foreground bg-muted border-border';
  const launchWizard = () => {
    window.dispatchEvent(new Event(`openMaterialProfile:${cat}:${decodedTopic}`));
  };
  const cta =
    completion === 0 ? 'Start guided setup'
    : completion === 100 ? 'Review profile'
    : 'Continue setup';
  const barColor = (pct: number) =>
    pct >= 70 ? 'bg-emerald-500'
    : pct >= 40 ? 'bg-amber-500'
    : pct > 0 ? 'bg-orange-500'
    : 'bg-muted-foreground/20';

  const ProgressBar: React.FC<{ percent: number; label: string; valueLabel: string; sub: string }> = ({ percent, label, valueLabel, sub }) => (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-foreground">{label}</span>
        <span className="text-[10px] font-bold tabular-nums text-foreground">{valueLabel} <span className="text-muted-foreground font-medium">· {percent}%</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor(percent)}`} style={{ width: `${Math.max(percent, percent === 0 ? 0 : 4)}%` }} />
      </div>
      <div className="text-[9px] text-muted-foreground truncate">{sub}</div>
    </div>
  );

  type MCStatus = 'cleared' | 'partial' | 'pending' | 'blocker';
  const marketCheckItems: { label: string; status: MCStatus }[] = completion === 0
    ? [
        { label: 'Application & formulation performance fit', status: 'pending' },
        { label: 'Supplier & material grade readiness', status: 'pending' },
        { label: 'Regulatory, safety & quality approval', status: 'pending' },
        { label: 'Sustainability, certification & claims readiness', status: 'pending' },
        { label: 'Commercial value & customer acceptance', status: 'pending' },
        { label: 'Operational integration & launch readiness', status: 'pending' },
      ]
    : [
        { label: 'Application & formulation performance fit', status: 'cleared' },
        { label: 'Supplier & material grade readiness', status: 'partial' },
        { label: 'Regulatory, safety & quality approval', status: 'cleared' },
        { label: 'Sustainability, certification & claims readiness', status: 'partial' },
        { label: 'Commercial value & customer acceptance', status: 'pending' },
        { label: 'Operational integration & launch readiness', status: 'blocker' },
      ];

  const mcSummary = marketCheckItems.reduce(
    (acc, x) => { acc[x.status]++; return acc; },
    { cleared: 0, partial: 0, pending: 0, blocker: 0 } as Record<MCStatus, number>
  );

  const statusMeta: Record<MCStatus, { icon: React.ElementType; cls: string; label: string }> = {
    cleared: { icon: CheckCircle2, cls: 'text-emerald-600', label: 'Cleared' },
    partial: { icon: Circle, cls: 'text-amber-500', label: 'Partial' },
    pending: { icon: Circle, cls: 'text-muted-foreground/40', label: 'Pending' },
    blocker: { icon: AlertCircle, cls: 'text-destructive', label: 'Blocker' },
  };

  const isEmpty = completion === 0;
  const navHero = useNavigate();
  const goBrief = () => navHero(`/landscape/${category}/${topic}/material-brief`);
  const goDecisions = () => navHero(`/landscape/${category}/${topic}/decisions-space`);


  const isLacticAcid = (decodedTopic || '').toLowerCase() === 'lactic acid';

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* ── Band 1 — Hero ───────────────────────────────────────────── */}
      <div className="p-5 border-b border-border/60">
        {isLacticAcid ? (
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <Badge className="uppercase text-[9px] font-bold tracking-[0.18em] px-2.5 py-0.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/5">
                  Source
                </Badge>
                <Badge className="text-[10px] font-medium px-2.5 py-0.5 rounded-full text-muted-foreground border border-border/60 bg-transparent hover:bg-transparent">Chemical</Badge>
                <Badge className="text-[10px] font-medium px-2.5 py-0.5 rounded-full text-muted-foreground border border-border/60 bg-transparent hover:bg-transparent">Organic Acid</Badge>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                {decodedTopic}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                A naturally occurring organic acid widely used in food preservation, biodegradable plastics (PLA), pharmaceuticals, and cosmetics. Produced primarily via fermentation of carbohydrate-rich feedstocks.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 shrink-0">
              <Leaf className="w-5 h-5 text-emerald-600" />
              <div className="leading-tight">
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Pathways</div>
                <div className="text-xl font-bold text-foreground tabular-nums">
                  {PREDEFINED_PATHWAYS.length} <span className="text-[10px] font-medium text-muted-foreground">analysed</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                <Badge className={`uppercase text-[8px] font-bold tracking-[0.18em] px-2.5 py-0.5 rounded-md border ${objective === 'Valorise' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                  {objective || 'Material'}
                </Badge>
                <Badge className="text-[9px] font-medium px-2 py-0.5 rounded-md text-muted-foreground border border-border/50 bg-muted/50">Chemical</Badge>
                <Badge className="text-[9px] font-medium px-2 py-0.5 rounded-md text-muted-foreground border border-border/50 bg-muted/50">Organic Acid</Badge>
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground mb-5">
                {decodedTopic || 'Xylose'}: <span className="text-foreground">{PREDEFINED_PATHWAYS.length} production pathways identified</span>
              </h1>
              <ValueChainOverview topic={topic} />
            </div>
          </div>
        )}
        <ProductBriefDialog
          isOpen={showProductBrief}
          onClose={() => setShowProductBrief(false)}
          topicKey={`${category}-${topic}`}
          productName={decodedTopic || 'Xylose'}
        />
      </div>

      {/* ── Band 2 — Material Brief / Priorities entry tiles ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/60">
        <button
          type="button"
          onClick={() => navHero(`/landscape/${category}/${topic}/material-brief-simple`)}
          className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors text-left group"
        >
            <span className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-foreground" />
            <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Material Brief</span>
          </span>
          <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden>→</span>
        </button>
        <button
          type="button"
          onClick={() => navHero(`/landscape/${category}/${topic}/validation-space`)}
          className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors text-left group"
        >
          <span className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-foreground" />
            <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Validation Space</span>
          </span>
          <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
};



type TrlStage = 'commercial' | 'pilot' | 'lab';

const STAGE_META: Record<TrlStage, { label: string; hex: string; bg: string; text: string; border: string }> = {
  commercial: { label: 'Commercial', hex: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200' },
  pilot: { label: 'Pilot to Scale-up', hex: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200' },
  lab: { label: 'Lab to Pilot', hex: '#f97316', bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-200' },
};

type Feedstock = {
  name: string;
  category: string;
  price: number;
  volume: number;
  players: number;
  pathways: number;
  maturity_commercial_pct: number;
  maturity_pilot_pct: number;
  maturity_lab_pct: number;
};

const FEEDSTOCK_DATA: Feedstock[] = [
  { name: 'Corn Starch',        category: 'Starch',              price: 140, volume: 9.2, players: 142, pathways: 27, maturity_commercial_pct: 0.62, maturity_pilot_pct: 0.05, maturity_lab_pct: 0.33 },
  { name: 'Sugarcane Molasses', category: 'Sugar',               price:  95, volume: 5.1, players:  38, pathways: 19, maturity_commercial_pct: 0.55, maturity_pilot_pct: 0.20, maturity_lab_pct: 0.25 },
  { name: 'Fructose',           category: 'Sugar',               price: 165, volume: 3.4, players:  21, pathways: 16, maturity_commercial_pct: 0.44, maturity_pilot_pct: 0.25, maturity_lab_pct: 0.31 },
  { name: 'Cassava Starch',     category: 'Starch',              price: 118, volume: 2.6, players:  17, pathways: 13, maturity_commercial_pct: 0.23, maturity_pilot_pct: 0.23, maturity_lab_pct: 0.54 },
  { name: 'Whey Permeate',      category: 'Dairy side-stream',   price:  72, volume: 1.8, players:  12, pathways: 10, maturity_commercial_pct: 0.30, maturity_pilot_pct: 0.40, maturity_lab_pct: 0.30 },
  { name: 'Sugar Beet',         category: 'Sugar',               price: 105, volume: 4.2, players:  29, pathways:  9, maturity_commercial_pct: 0.50, maturity_pilot_pct: 0.25, maturity_lab_pct: 0.25 },
  { name: 'Wheat Starch',       category: 'Starch',              price: 128, volume: 3.8, players:  24, pathways:  8, maturity_commercial_pct: 0.48, maturity_pilot_pct: 0.22, maturity_lab_pct: 0.30 },
  { name: 'Glycerol (crude)',   category: 'Oleochemical',        price:  58, volume: 2.1, players:  18, pathways:  7, maturity_commercial_pct: 0.20, maturity_pilot_pct: 0.45, maturity_lab_pct: 0.35 },
  { name: 'Sugarcane Bagasse',  category: 'Lignocellulose',      price:  48, volume: 6.5, players:  22, pathways:  7, maturity_commercial_pct: 0.10, maturity_pilot_pct: 0.35, maturity_lab_pct: 0.55 },
  { name: 'Corn Stover',        category: 'Lignocellulose',      price:  52, volume: 5.8, players:  19, pathways:  6, maturity_commercial_pct: 0.08, maturity_pilot_pct: 0.32, maturity_lab_pct: 0.60 },
  { name: 'Wheat Straw',        category: 'Lignocellulose',      price:  55, volume: 4.9, players:  15, pathways:  5, maturity_commercial_pct: 0.05, maturity_pilot_pct: 0.30, maturity_lab_pct: 0.65 },
  { name: 'Cheese Whey',        category: 'Dairy side-stream',   price:  38, volume: 2.4, players:  14, pathways:  5, maturity_commercial_pct: 0.35, maturity_pilot_pct: 0.35, maturity_lab_pct: 0.30 },
  { name: 'Rice Straw',         category: 'Lignocellulose',      price:  45, volume: 3.6, players:  11, pathways:  4, maturity_commercial_pct: 0.05, maturity_pilot_pct: 0.25, maturity_lab_pct: 0.70 },
  { name: 'Waste Cooking Oil',  category: 'Waste oil',           price:  82, volume: 1.2, players:  16, pathways:  4, maturity_commercial_pct: 0.30, maturity_pilot_pct: 0.30, maturity_lab_pct: 0.40 },
  { name: 'Algae Biomass',      category: 'Algae',               price: 185, volume: 0.4, players:   9, pathways:  3, maturity_commercial_pct: 0.05, maturity_pilot_pct: 0.25, maturity_lab_pct: 0.70 },
];

const CHART_TOP_N = 5;
const chartFeedstocks = [...FEEDSTOCK_DATA].sort((a, b) => b.pathways - a.pathways).slice(0, CHART_TOP_N);

// Market prices and available feedstock volumes are inherently ranges (seasonal, regional, quality-graded).
// The stored value is treated as the midpoint; low/high bounds are derived symmetrically.
const PRICE_RANGE_PCT = 0.15;
const VOLUME_RANGE_PCT = 0.20;
const priceLow  = (p: number) => Math.round(p * (1 - PRICE_RANGE_PCT));
const priceHigh = (p: number) => Math.round(p * (1 + PRICE_RANGE_PCT));
const volLow    = (v: number) => +(v * (1 - VOLUME_RANGE_PCT)).toFixed(1);
const volHigh   = (v: number) => +(v * (1 + VOLUME_RANGE_PCT)).toFixed(1);
const priceRangeStr  = (p: number) => `€${priceLow(p)}–${priceHigh(p)}/t`;
const volumeRangeStr = (v: number) => `${volLow(v).toFixed(1)}–${volHigh(v).toFixed(1)} M t/yr`;


// Pure helpers — swap in real API data later
const dominantStage = (f: Feedstock): TrlStage => {
  const s: [TrlStage, number][] = [
    ['commercial', f.maturity_commercial_pct],
    ['pilot', f.maturity_pilot_pct],
    ['lab', f.maturity_lab_pct],
  ];
  return s.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
};
const cheapestOf = (d: Feedstock[]) => d.reduce((a, b) => (b.price < a.price ? b : a));
const mostAbundantOf = (d: Feedstock[]) => d.reduce((a, b) => (b.volume > a.volume ? b : a));
const mostContestedOf = (d: Feedstock[]) => d.reduce((a, b) => (b.players > a.players ? b : a));

const computeAggregateStats = (d: Feedstock[]) => {
  if (!d.length) {
    return { avgPrice: 0, minPrice: 0, maxPrice: 0, commercialCount: 0, commercialPct: 0, minPlayers: 0, maxPlayers: 0, playerRatio: 0 };
  }
  const prices = d.map((f) => f.price);
  const players = d.map((f) => f.players);
  const commercialCount = d.filter((f) => dominantStage(f) === 'commercial').length;
  const minPl = Math.min(...players);
  const maxPl = Math.max(...players);
  return {
    avgPrice: Math.round(prices.reduce((s, x) => s + x, 0) / d.length),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    commercialCount,
    commercialPct: Math.round((commercialCount / d.length) * 100),
    minPlayers: minPl,
    maxPlayers: maxPl,
    playerRatio: minPl > 0 ? Math.round((maxPl / minPl) * 10) / 10 : maxPl,
  };
};

const bestOpeningOf = (d: Feedstock[]) => {
  // Combined low-price + low-competition score (lower price and fewer players = better)
  const maxPrice = Math.max(...d.map((f) => f.price));
  const maxPlayers = Math.max(...d.map((f) => f.players));
  return d.reduce((best, f) => {
    const score = (f.price / maxPrice) + (f.players / maxPlayers);
    const bestScore = (best.price / maxPrice) + (best.players / maxPlayers);
    return score < bestScore ? f : best;
  });
};

const buildInsight = (d: Feedstock[]): string => {
  const cheap = cheapestOf(d);
  const abundant = mostAbundantOf(d);
  const opening = bestOpeningOf(d);
  if (cheap.name === abundant.name) {
    return `${cheap.name} is both the cheapest (${priceRangeStr(cheap.price)}) and most abundant (${volumeRangeStr(cheap.volume)}) feedstock — a natural default starting point.`;
  }
  if (opening.name === cheap.name) {
    return `${cheap.name} is the lowest cost at ${priceRangeStr(cheap.price)} and also carries the best combined price-vs-competition profile.`;
  }
  return `${cheap.name} is the lowest cost at ${priceRangeStr(cheap.price)}, but ${opening.name} may be the better opening — comparable pricing with materially less market competition.`;
};

type BubbleDatum = Feedstock & { color: string; stage: TrlStage };

const BubbleChart: React.FC<{
  data: Feedstock[];
  height?: number;
}> = ({ data, height = 360 }) => {
  const uid = React.useId();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [w, setW] = React.useState(760);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(Math.max(360, Math.floor(e.contentRect.width)));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const H = height;
  const W = w;
  const M = { top: 32, right: 32, bottom: 48, left: 64 };
  const iw = Math.max(50, W - M.left - M.right);
  const ih = Math.max(50, H - M.top - M.bottom);

  const prices = data.map((d) => d.price);
  const vols = data.map((d) => d.volume);
  const players = data.map((d) => d.players);
  const pathways = data.map((d) => d.pathways);
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const maxV = Math.max(...vols);
  const maxPl = Math.max(...players);
  const maxPw = Math.max(...pathways);
  const avgP = prices.reduce((s, x) => s + x, 0) / prices.length;
  const avgV = vols.reduce((s, x) => s + x, 0) / vols.length;

  const padP = Math.max(20, (maxP - minP) * 0.22);
  const xMin = Math.floor((minP - padP) / 10) * 10;
  const xMax = Math.ceil((maxP + padP) / 10) * 10;
  const yMax = Math.ceil((maxV + 3.2) / 2) * 2;

  const x = (p: number) => M.left + ((p - xMin) / (xMax - xMin)) * iw;
  const y = (v: number) => M.top + ih - (v / yMax) * ih;
  const r = (pw: number) => 10 + Math.sqrt(pw / Math.max(1, maxPw)) * 30;

  const xTicks = 5, yTicks = 4;
  const xTickVals = Array.from({ length: xTicks + 1 }, (_, i) => xMin + ((xMax - xMin) / xTicks) * i);
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => (yMax / yTicks) * i);

  type Enriched = Feedstock & { stage: TrlStage; color: string; cx: number; cy: number; rad: number };
  const enriched: Enriched[] = data.map((f) => {
    const stage = dominantStage(f);
    return { ...f, stage, color: STAGE_META[stage].hex, cx: x(f.price), cy: y(f.volume), rad: r(f.pathways) };
  });


  const [hover, setHover] = React.useState<Enriched | null>(null);

  // Consistent label side — above by default, with enough top domain padding to avoid forced flips
  const labelFor = (d: Enriched) => {
    const preferredLy = d.cy - d.rad - 12;
    const above = preferredLy >= M.top + 10;
    return { lx: d.cx, ly: above ? preferredLy : Math.max(M.top + 10, preferredLy), above: true };
  };


  const gradId = (s: TrlStage) => `bg-${uid}-${s}`;

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: H }}>
      <svg width={W} height={H} className="block overflow-visible">
        <defs>
          {(['commercial', 'pilot', 'lab'] as TrlStage[]).map((s) => (
            <radialGradient key={s} id={gradId(s)} cx="35%" cy="35%" r="75%">
              <stop offset="0%" stopColor={STAGE_META[s].hex} stopOpacity={0.28} />
              <stop offset="100%" stopColor={STAGE_META[s].hex} stopOpacity={0.10} />
            </radialGradient>
          ))}
          <linearGradient id={`sweet-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Sweet spot band — low price, high volume (top-left of avg split) */}
        

        {/* Horizontal gridlines only — clean & airy */}
        {yTickVals.map((v, i) => (
          <line key={`gy-${i}`} x1={M.left} x2={M.left + iw} y1={y(v)} y2={y(v)} stroke="#eef2f6" strokeWidth={1} />
        ))}




        {/* Avg reference pills — only when hovering */}
        {hover && (
          <>
            <g>
              <rect x={x(avgP) - 26} y={M.top - 12} width={52} height={16} rx={8} fill="#ffffff" stroke="#e2e8f0" />
              <text x={x(avgP)} y={M.top - 1} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={600} fontFamily="ui-monospace, SFMono-Regular, monospace">AVG €{Math.round(avgP)}</text>
            </g>
            <g>
              <rect x={M.left + iw - 4 - 44} y={y(avgV) - 8} width={48} height={16} rx={8} fill="#ffffff" stroke="#e2e8f0" />
              <text x={M.left + iw - 4 - 20} y={y(avgV) + 3} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={600} fontFamily="ui-monospace, SFMono-Regular, monospace">AVG {avgV.toFixed(1)}M</text>
            </g>
          </>
        )}







        {/* Axis tick labels */}
        {xTickVals.map((v, i) => (
          <text key={`xt-${i}`} x={x(v)} y={M.top + ih + 20} textAnchor="middle" fontSize={10} fill="#94a3b8" fontFamily="ui-monospace, SFMono-Regular, monospace">€{Math.round(v)}</text>
        ))}
        {yTickVals.map((v, i) => (
          <text key={`yt-${i}`} x={M.left - 12} y={y(v) + 3} textAnchor="end" fontSize={10} fill="#94a3b8" fontFamily="ui-monospace, SFMono-Regular, monospace">{v.toFixed(v >= 10 ? 0 : 1)}M</text>
        ))}

        {/* Axis titles */}
        <text x={M.left + iw / 2} y={H - 10} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={700} style={{ letterSpacing: '0.20em' }}>PRICE  €/TONNE</text>
        <text transform={`rotate(-90 ${18} ${M.top + ih / 2})`} x={18} y={M.top + ih / 2} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={700} style={{ letterSpacing: '0.20em' }}>VOLUME  M T/YR</text>

        {/* Bubbles */}
        {enriched.map((d) => {
          const isHover = hover?.name === d.name;
          const dim = hover && !isHover;
          const { lx, ly, above } = labelFor(d);
          return (
            <g key={d.name} style={{ cursor: 'pointer', opacity: dim ? 0.35 : 1, transition: 'opacity 160ms ease' }} onMouseEnter={() => setHover(d)} onMouseLeave={() => setHover(null)}>
              {/* soft glow on hover */}
              {isHover && (
                <circle cx={d.cx} cy={d.cy} r={d.rad + 8} fill={d.color} fillOpacity={0.08} />
              )}
              {/* main bubble — single solid fill with gradient, crisp thin stroke */}
              <circle cx={d.cx} cy={d.cy} r={d.rad} fill={`url(#${gradId(d.stage)})`} stroke={d.color} strokeWidth={1.25} strokeOpacity={0.85} />
              {/* subtle specular */}
              <circle cx={d.cx - d.rad * 0.35} cy={d.cy - d.rad * 0.35} r={d.rad * 0.18} fill="#ffffff" fillOpacity={0.35} />
              {/* center dot */}
              <circle cx={d.cx} cy={d.cy} r={3} fill={d.color} fillOpacity={0.9} />
              
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hover && (() => {
        const tipW = 250;
        const tipH = 128;
        let tx = hover.cx + 18;
        let ty = hover.cy - tipH / 2;
        if (tx + tipW > W - 4) tx = hover.cx - tipW - 18;
        if (ty < 4) ty = 4;
        if (ty + tipH > H - 4) ty = H - tipH - 4;
        return (
          <div
            className="absolute rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm shadow-2xl px-3.5 py-3 text-[11px] pointer-events-none"
            style={{ left: tx, top: ty, width: tipW, boxShadow: '0 20px 40px -12px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.04)' }}
          >
            <div className="mb-2.5">
              <div className="font-semibold text-slate-900 text-[12px] leading-tight">{hover.name}</div>
              <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: `${hover.color}14`, color: hover.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: hover.color }} />
                {STAGE_META[hover.stage].label}
              </span>
            </div>

            <div className="space-y-1.5 tabular-nums">
              <div className="flex items-center justify-between gap-3"><span className="text-slate-400 text-[10px] uppercase tracking-wider">Price</span><span className="font-semibold text-slate-900">{priceRangeStr(hover.price)}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-slate-400 text-[10px] uppercase tracking-wider">Volume (EU)</span><span className="font-semibold text-slate-900">{volumeRangeStr(hover.volume)}</span></div>
              
              <div className="flex items-center justify-between"><span className="text-slate-400 text-[10px] uppercase tracking-wider">Pathways</span><span className="font-semibold text-slate-900">{hover.pathways}</span></div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const StageDot: React.FC<{ stage: TrlStage }> = ({ stage }) => (
  <span className={`inline-block w-2 h-2 rounded-full ${STAGE_META[stage].bg}`} />
);

const StagePill: React.FC<{ stage: TrlStage }> = ({ stage }) => {
  const m = STAGE_META[stage];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${m.border} ${m.text} bg-white px-2 py-0.5 text-[10px] font-semibold`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.bg}`} />
      {m.label}
    </span>
  );
};

const generateValueChainOverview = (
  topic: string,
  feedstocks: Feedstock[],
  technologies: { name: string; category: string; trl: number; status: string; patents: number; ipScore: number; players: number; energy: number; feedstockVolume: number; feedstocks: string[] }[],
  producers: Producer[],
  applications: { name: string; category: string; maturity: TrlStage; ipScore: number; signals: number; researchScore: number; topMarket: string; materialPrice: number }[],
) => {
  // --- Feedstocks ---
  const totalPathways = feedstocks.reduce((s, f) => s + f.pathways, 0);
  const topFeedstock = [...feedstocks].sort((a, b) => b.volume - a.volume)[0];
  const totalVolume = feedstocks.reduce((s, f) => s + f.volume, 0);
  const minPrice = Math.min(...feedstocks.map((f) => f.price));
  const maxPrice = Math.max(...feedstocks.map((f) => f.price));
  const commercialCount = feedstocks.filter((f) => dominantStage(f) === 'commercial').length;
  const commercialShare = Math.round((commercialCount / feedstocks.length) * 100);

  // --- Technologies ---
  const techCount = technologies.length;
  // Best = most feedstock compatibility, tie-broken by feedstock volume throughput
  const bestTech = [...technologies].sort(
    (a, b) => b.feedstocks.length - a.feedstocks.length || b.feedstockVolume - a.feedstockVolume,
  )[0];

  // --- Producers ---
  const totalProducers = producers.length;
  const regionCounts: Record<string, number> = {};
  producers.forEach((p) => { regionCounts[p.hqRegion] = (regionCounts[p.hqRegion] || 0) + 1; });
  const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const regionProducers = producers.filter((p) => p.hqRegion === topRegion);
  const countryCounts: Record<string, number> = {};
  regionProducers.forEach((p) => { countryCounts[p.hqCountry] = (countryCounts[p.hqCountry] || 0) + 1; });
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([c]) => c);
  const scaleCounts: Record<string, number> = {};
  regionProducers.forEach((p) => { scaleCounts[p.type] = (scaleCounts[p.type] || 0) + 1; });
  const topScales = Object.entries(scaleCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([s]) => s.toLowerCase());

  // --- Applications ---
  const appCount = applications.length;
  const topApp = [...applications].sort((a, b) => b.signals - a.signals)[0];

  const bullets = [
    `The top feedstock is ${topFeedstock.name} (${topFeedstock.volume.toFixed(1)} M t/yr), with a total of ~${totalVolume.toFixed(0)} M t/yr available across all feedstocks at prices ranging €${minPrice}–${maxPrice}/t. ${commercialShare}% of feedstocks are already at commercial maturity.`,
    `${techCount} technologies transform these feedstocks into ${topic}. The best-matched route is ${bestTech.name} — compatible with ${bestTech.feedstocks.length} feedstocks and processing ~${bestTech.feedstockVolume.toFixed(1)} M t/yr, with low IP density (score ${bestTech.ipScore}) and high research activity (${bestTech.patents} patents). Status: ${bestTech.status} (TRL ${bestTech.trl}).`,
    `${totalProducers} producers of ${topic} identified. ${topRegion} leads, with the main players in ${topCountries.join(' and ')}, primarily at ${topScales.join(' and ')} scale.`,
    `${topic} is sold across ${appCount} market applications. Top market is ${topApp.name} (${topApp.topMarket}), with a ${topic} price of ~€${topApp.materialPrice.toLocaleString()}/t.`,
  ];

  return { heading: `${topic}: ${totalPathways} production pathways identified`, bullets };
};

const ValueChainOverview: React.FC<{ topic?: string }> = ({ topic }) => {
  const decodedTopic = decodeURIComponent(topic || 'this material');
  const overview = useMemo(
    () => generateValueChainOverview(decodedTopic, FEEDSTOCK_DATA, TECHNOLOGIES_DATA, PRODUCERS, APPLICATIONS_DATA),
    [decodedTopic],
  );

  const labels = ['Feedstocks', 'Technologies', 'Producers', 'Applications'];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {overview.bullets.map((b, i) => (
          <div key={i} className="rounded-lg border border-border/60 bg-background/50 p-4 space-y-2">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{labels[i]}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{b}</p>
          </div>
        ))}
      </div>
    </div>
  );




};

// Row of 3 summary tiles (Feedstock / Technology / Application) that open the full snapshot in a dialog
const BriefCardsRow: React.FC<{
  category?: string;
  topic?: string;
  navigate: (path: string) => void;
}> = ({ category, topic, navigate }) => {
  const [open, setOpen] = useState<'feedstock' | 'technology' | 'material' | 'application'>('feedstock');

  const tiles: Array<{
    key: 'feedstock' | 'technology' | 'material' | 'application';
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [

    { key: 'feedstock', label: 'Feedstock', Icon: Sprout },
    { key: 'technology', label: 'Technology', Icon: FlaskConical },
    { key: 'material', label: 'Material', Icon: Package },
    { key: 'application', label: 'Application', Icon: Target },
  ];

  return (
    <div className="mt-6 bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 pt-4">
        <div className="grid grid-cols-4 gap-1 p-1 bg-muted rounded-lg w-full">
          {tiles.map((t) => {
            const isActive = open === t.key;
            const Icon = t.Icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setOpen(t.key)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest transition-all inline-flex items-center justify-center gap-1.5 ${isActive ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>




      <div className="p-4">
        {open === 'feedstock' && <FeedstockSnapshotSection category={category} topic={topic} navigate={navigate} />}
        {open === 'technology' && <TechnologySnapshotSection topic={topic} navigate={navigate} category={category} />}
        {open === 'material' && <MaterialSnapshotSection topic={topic} navigate={navigate} category={category} />}
        {open === 'application' && <MarketSnapshotSection topic={topic} navigate={navigate} category={category} />}
      </div>
    </div>
  );
};





const FeedstockSnapshotSection: React.FC<{
  category?: string;
  topic?: string;
  navigate: (path: string) => void;
}> = ({ category, topic, navigate }) => {
  const data = FEEDSTOCK_DATA;
  const decodedTopic = decodeURIComponent(topic || 'Lactic Acid');
  const totalPathways = data.reduce((s, f) => s + f.pathways, 0);

  const stats = useMemo(() => computeAggregateStats(data), [data]);
  const insight = buildInsight(data);

  const priceBounds = useMemo(() => [Math.floor(Math.min(...data.map(d => d.price))), Math.ceil(Math.max(...data.map(d => d.price)))] as const, [data]);
  const playerBounds = useMemo(() => [Math.min(...data.map(d => d.players)), Math.max(...data.map(d => d.players))] as const, [data]);
  const volumeBounds = useMemo(() => [0, Math.ceil(Math.max(...data.map(d => d.volume)))] as const, [data]);

  const [modalOpen, setModalOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(priceBounds[1]);
  const [maxPlayers, setMaxPlayers] = useState(playerBounds[1]);
  const [minVolume, setMinVolume] = useState(volumeBounds[0]);
  const [stageFilter, setStageFilter] = useState<'all' | TrlStage>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<keyof Feedstock | 'stage' | 'rank'>('rank');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const feedstockCategories = useMemo(() => Array.from(new Set(data.map((d) => d.category))).sort(), [data]);



  const STAGE_WEIGHT: Record<TrlStage, number> = { commercial: 1, pilot: 0.6, lab: 0.3 };
  const scored = useMemo(() => {
    const prices = data.map((d) => d.price);
    const volumes = data.map((d) => d.volume);
    const players = data.map((d) => d.players);
    const pathways = data.map((d) => d.pathways);
    const norm = (v: number, arr: number[], invert = false) => {
      const mn = Math.min(...arr), mx = Math.max(...arr);
      if (mx === mn) return 1;
      const n = (v - mn) / (mx - mn);
      return invert ? 1 - n : n;
    };
    return data.map((r) => ({
      ...r,
      score:
        norm(r.price, prices, true) * 0.25 +
        norm(r.volume, volumes) * 0.2 +
        norm(r.players, players) * 0.15 +
        norm(r.pathways, pathways) * 0.2 +
        STAGE_WEIGHT[dominantStage(r)] * 0.2,
    }));
  }, [data]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scored.filter(
      (r) =>
        r.price <= maxPrice &&
        r.players <= maxPlayers &&
        r.volume >= minVolume &&
        (stageFilter === 'all' || dominantStage(r) === stageFilter) &&
        (categoryFilter === 'all' || r.category === categoryFilter) &&
        (q === '' || r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)),
    );
  }, [scored, maxPrice, maxPlayers, minVolume, stageFilter, categoryFilter, searchQuery]);


  const chartData = [...(filtered.length ? filtered : scored)]
    .sort((a, b) => b.score - a.score)
    .slice(0, CHART_TOP_N);

  const sortedRows = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      if (sortKey === 'rank') return b.score - a.score;
      if (sortKey === 'stage') {
        return STAGE_WEIGHT[dominantStage(b)] - STAGE_WEIGHT[dominantStage(a)];
      }
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      return (a[sortKey as keyof Feedstock] as number) - (b[sortKey as keyof Feedstock] as number);
    });
    return rows;
  }, [filtered, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = sortedRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [searchQuery, categoryFilter, stageFilter, maxPrice, maxPlayers, minVolume, sortKey]);


  return (
    <div className="space-y-3">





      {/* Bubble chart */}
      <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Feedstock Economics: Cost, Volume, &amp; Scale</h4>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {(['lab', 'pilot', 'commercial'] as TrlStage[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <StageDot stage={s} /> {STAGE_META[s].label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 pl-2 ml-1 border-l border-border/60">
              <span className="inline-flex items-end gap-1">
                <span className="inline-block rounded-full border border-slate-400/70" style={{ width: 5, height: 5 }} />
                <span className="inline-block rounded-full border border-slate-400/70" style={{ width: 8, height: 8 }} />
                <span className="inline-block rounded-full border border-slate-400/70" style={{ width: 12, height: 12 }} />
              </span>
              <span className="text-muted-foreground/80"># pathways</span>
            </span>



          </div>
        </div>
        <BubbleChart data={chartData} height={300} />
      </div>


      {/* Highlight cards — top feedstock per dimension */}
      {(() => {
        const mostAbundant = data.reduce((a, b) => (b.volume > a.volume ? b : a));
        const lowestCost = data.reduce((a, b) => (b.price < a.price ? b : a));
        const commercialPathways = (f: Feedstock) => Math.round(f.pathways * f.maturity_commercial_pct);
        const mostUsed = data.reduce((a, b) => (commercialPathways(b) > commercialPathways(a) ? b : a));
        const highlights: { label: string; icon: any; feedstock: Feedstock; value: string; unit: string }[] = [
          { label: 'Most Abundant', icon: Package, feedstock: mostAbundant, value: `${volLow(mostAbundant.volume).toFixed(1)}–${volHigh(mostAbundant.volume).toFixed(1)}`, unit: 'M t/yr EU' },
          { label: 'Lowest Cost', icon: DollarSign, feedstock: lowestCost, value: `€${priceLow(lowestCost.price)}–${priceHigh(lowestCost.price)}`, unit: '/tonne' },
          { label: 'Most Commercial Pathways', icon: Users, feedstock: mostUsed, value: `${commercialPathways(mostUsed)}`, unit: 'commercial pathways' },
        ];
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-lg border border-border/60 bg-muted/40 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border/60">
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.label} className="px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{h.label}</div>
                    <Icon className="w-3 h-3 text-slate-300" />
                  </div>
                  <div className="mt-1.5 text-sm font-semibold text-slate-900 leading-tight truncate">{h.feedstock.name}</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-sm font-bold tabular-nums text-slate-900 leading-none whitespace-nowrap">{h.value}</span>
                    <span className="text-[10px] font-medium text-slate-400">{h.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}




      {/* Inline full ranked set */}
          <div className="flex items-center gap-2 flex-wrap justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search feedstock or category…"
                className="h-8 pl-8 !text-[11px] placeholder:!text-[11px] bg-card border-border/60"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 rounded-md border border-border/60 bg-card px-2 text-[12px] text-slate-700"
            >
              <option value="all">All categories</option>
              {feedstockCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="rounded-lg border border-border/60 bg-card overflow-hidden">

            <table className="w-full text-[12px] table-fixed border-collapse">
              <colgroup>
                <col style={{ width: '48px' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <thead className="bg-muted/40 border-b border-border/60 text-slate-500 uppercase tracking-widest text-[10px]">
                <tr>
                  {([
                    ['rank', '#', 'center'],
                    ['name', 'Feedstock', 'left'],
                    ['name', 'Category', 'left'],
                    ['price', 'Price (€/t)', 'center'],
                    ['volume', 'Volume EU (M t/yr)', 'center'],
                    ['pathways', 'Pathways', 'center'],
                    ['stage', 'Maturity', 'left'],
                  ] as [typeof sortKey, string, 'left' | 'right' | 'center'][]).map(([key, label, align], i) => (
                    <th
                      key={`${key}-${i}`}
                      onClick={() => setSortKey(key)}
                      className={`px-4 py-2.5 cursor-pointer select-none hover:text-slate-900 whitespace-nowrap font-semibold ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${sortKey === key ? 'text-slate-900' : ''}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card">
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500">No feedstocks match these filters.</td>
                  </tr>
                ) : (
                  pagedRows.map((r, idx) => {
                    const stage = dominantStage(r);
                    const globalIdx = (currentPage - 1) * PAGE_SIZE + idx;
                    const rank = sortKey === 'rank'
                      ? globalIdx + 1
                      : [...scored].sort((a, b) => b.score - a.score).findIndex((s) => s.name === r.name) + 1;
                    return (
                      <tr
                        key={r.name}
                        className="border-t border-border/40 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => navigate(`/landscape/${category}/${encodeURIComponent(decodedTopic)}/value-chain/pathways?filterType=feedstock&filterValues=${encodeURIComponent(r.name)}`)}
                      >
                        <td className="px-4 py-2.5 tabular-nums font-medium text-slate-400 text-center">{rank}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-900 truncate">{r.name}</td>
                        <td className="px-4 py-2.5 text-slate-500 truncate">{r.category}</td>
                        <td className="px-4 py-2.5 tabular-nums text-center whitespace-nowrap text-slate-700 font-medium">{priceLow(r.price)}–{priceHigh(r.price)}</td>
                        <td className="px-4 py-2.5 tabular-nums text-center whitespace-nowrap text-slate-700 font-medium">{volLow(r.volume).toFixed(1)}–{volHigh(r.volume).toFixed(1)}</td>
                        <td className="px-4 py-2.5 tabular-nums text-center text-slate-700 font-medium">{r.pathways}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap"><StagePill stage={stage} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {sortedRows.length > 0 && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-100 bg-slate-50/60 text-[11px]">
                <span className="text-slate-500 tabular-nums">
                  Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * PAGE_SIZE + 1}</span>
                  –<span className="font-semibold text-slate-900">{Math.min(currentPage * PAGE_SIZE, sortedRows.length)}</span>
                  <span className="text-slate-400"> of {sortedRows.length}</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-7 px-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium"
                  >
                    Prev
                  </button>
                  <span className="px-2 tabular-nums text-slate-600">
                    Page <span className="font-semibold text-slate-900">{currentPage}</span> / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-7 px-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
    </div>


  );
};

const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone?: 'emerald' | 'blue' | 'orange';
  bar?: number; // 0..1 — optional inline progress
  onClick?: () => void;
}> = ({ label, value, sub, Icon, bar, onClick }) => {
  const Wrapper: any = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`text-left w-full rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 flex items-start gap-3 transition-colors ${onClick ? 'hover:border-slate-300 hover:bg-muted/60' : ''}`}
    >
      <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-sm font-bold tabular-nums text-slate-900 leading-tight mt-0.5">{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground mt-0.5 tabular-nums truncate">{sub}</div>}
        {typeof bar === 'number' && (
          <div className="mt-1.5 h-1 w-full rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-slate-500 rounded-full" style={{ width: `${Math.max(0, Math.min(1, bar)) * 100}%` }} />
          </div>
        )}
      </div>
    </Wrapper>
  );
};

// =====================================================================
// Technology Snapshot — top 5 production technologies with IP protection
// =====================================================================
type TechDatum = {
  name: string;
  trl: number;
  ipScore: number;
  energy: number;
  feedstocks: string[];
  feedstockVolume: number; // M t/yr available for this technology
  productionOutput: number; // kt/yr production output
  players: number;
  patents: number;
  status: string;
};


const techStage = (trl: number): TrlStage =>
  trl >= 9 ? 'commercial' : trl >= 6 ? 'pilot' : 'lab';

const TechBubbleChart: React.FC<{ data: TechDatum[]; height?: number }> = ({ data, height = 300 }) => {
  const uid = React.useId();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [w, setW] = React.useState(760);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(Math.max(360, Math.floor(e.contentRect.width)));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const H = height;
  const W = w;
  const M = { top: 32, right: 32, bottom: 48, left: 64 };
  const iw = Math.max(50, W - M.left - M.right);
  const ih = Math.max(50, H - M.top - M.bottom);

  // Domains: X = IP density (0-100), Y = feedstock available (M t/yr)
  const xMin = 0, xMax = 100;
  const yRawMax = Math.max(...data.map((d) => d.feedstockVolume), 1);
  const yMax = Math.ceil(yRawMax / 5) * 5;
  const yMin = 0;
  const avgIp = data.reduce((s, d) => s + d.ipScore, 0) / data.length;
  const avgVol = data.reduce((s, d) => s + d.feedstockVolume, 0) / data.length;

  const x = (v: number) => M.left + ((v - xMin) / (xMax - xMin)) * iw;
  const y = (v: number) => M.top + ih - ((v - yMin) / (yMax - yMin)) * ih;

  const xTickVals = [0, 25, 50, 75, 100];
  const yTickVals = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  type Enriched = TechDatum & { stage: TrlStage; color: string; cx: number; cy: number; rad: number };
  // Bubble size = number of compatible feedstock pathways. Square-root scale for perceptual area.
  const pathwayMax = Math.max(...data.map((d) => d.feedstocks.length), 1);
  const R_MIN = 8;
  const R_MAX = 26;
  const sizeR = (p: number) => R_MIN + Math.sqrt(p / pathwayMax) * (R_MAX - R_MIN);
  const enriched: Enriched[] = data.map((t) => {
    const stage = techStage(t.trl);
    // Color by TRL stage (matches feedstock tab)
    const color = STAGE_META[stage].hex;
    return { ...t, stage, color, cx: x(t.ipScore), cy: y(t.feedstockVolume), rad: sizeR(t.feedstocks.length) };
  });


  const [hover, setHover] = React.useState<Enriched | null>(null);

  // Smart label placement: alternate above/below when bubbles overlap horizontally, and stack in rows
  const approxCharW = 5.6;
  const labels = React.useMemo(() => {
    const sorted = [...enriched].sort((a, b) => a.cx - b.cx);
    const placed: Array<{ name: string; lx: number; ly: number; above: boolean; anchor: 'start' | 'middle' | 'end' }> = [];
    const rowHeight = 14;
    sorted.forEach((d) => {
      const width = d.name.length * approxCharW;
      let anchor: 'start' | 'middle' | 'end' = 'middle';
      let lx = d.cx;
      // Nudge anchor near edges to keep text inside plot
      if (d.cx - width / 2 < M.left + 4) { anchor = 'start'; lx = d.cx; }
      else if (d.cx + width / 2 > M.left + iw - 4) { anchor = 'end'; lx = d.cx; }

      const collides = (ly: number) =>
        placed.some((p) => {
          if (Math.abs(p.ly - ly) > rowHeight - 1) return false;
          const pLeft = p.anchor === 'middle' ? p.lx - (p.name.length * approxCharW) / 2 : p.anchor === 'end' ? p.lx - p.name.length * approxCharW : p.lx;
          const pRight = pLeft + p.name.length * approxCharW;
          const cLeft = anchor === 'middle' ? lx - width / 2 : anchor === 'end' ? lx - width : lx;
          const cRight = cLeft + width;
          return !(cRight + 6 < pLeft || cLeft > pRight + 6);
        });

      // Try above stacks first, then below
      const candidates: Array<{ ly: number; above: boolean }> = [];
      for (let i = 0; i < 4; i++) candidates.push({ ly: d.cy - d.rad - 10 - i * rowHeight, above: true });
      for (let i = 0; i < 4; i++) candidates.push({ ly: d.cy + d.rad + 12 + i * rowHeight, above: false });
      let chosen = candidates[0];
      for (const c of candidates) {
        if (c.ly < M.top + 8 || c.ly > M.top + ih - 4) continue;
        if (!collides(c.ly)) { chosen = c; break; }
      }
      placed.push({ name: d.name, lx, ly: chosen.ly, above: chosen.above, anchor });
    });
    // Return map name -> placement
    const map = new Map(placed.map((p) => [p.name, p]));
    return map;
  }, [enriched, iw, ih, M.top, M.left]);

  const labelFor = (d: Enriched) => labels.get(d.name) ?? { lx: d.cx, ly: d.cy - d.rad - 10, above: true, anchor: 'middle' as const };


  const gradId = (s: TrlStage) => `tech-bg-${uid}-${s}`;

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: H }}>
      <svg width={W} height={H} className="block overflow-visible">
        <defs>
          {(['commercial', 'pilot', 'lab'] as TrlStage[]).map((s) => (
            <radialGradient key={s} id={gradId(s)} cx="35%" cy="35%" r="75%">
              <stop offset="0%" stopColor={STAGE_META[s].hex} stopOpacity={0.28} />
              <stop offset="100%" stopColor={STAGE_META[s].hex} stopOpacity={0.10} />
            </radialGradient>
          ))}
          <linearGradient id={`tech-sweet-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>




        {/* Horizontal gridlines */}
        {yTickVals.map((v, i) => (
          <line key={`gy-${i}`} x1={M.left} x2={M.left + iw} y1={y(v)} y2={y(v)} stroke="#eef2f6" strokeWidth={1} />
        ))}




        {hover && (
          <>
            <g>
              <rect x={x(avgIp) - 40} y={M.top - 12} width={80} height={16} rx={8} fill="#ffffff" stroke="#e2e8f0" />
              <text x={x(avgIp)} y={M.top - 1} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={600} fontFamily="ui-monospace, SFMono-Regular, monospace">AVG {Math.round(avgIp)} IP</text>
            </g>
            <g>
              <rect x={M.left + iw - 4 - 76} y={y(avgVol) - 8} width={76} height={16} rx={8} fill="#ffffff" stroke="#e2e8f0" />
              <text x={M.left + iw - 4 - 38} y={y(avgVol) + 3} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={600} fontFamily="ui-monospace, SFMono-Regular, monospace">AVG {avgVol.toFixed(1)} Mt</text>
            </g>
          </>
        )}

        {/* Quadrant label */}
        

        {/* Axis tick labels */}
        {xTickVals.map((v, i) => (
          <text key={`xt-${i}`} x={x(v)} y={M.top + ih + 20} textAnchor="middle" fontSize={10} fill="#94a3b8" fontFamily="ui-monospace, SFMono-Regular, monospace">{v % 1 === 0 ? v : v.toFixed(1)}</text>
        ))}
        {yTickVals.map((v, i) => (
          <text key={`yt-${i}`} x={M.left - 12} y={y(v) + 3} textAnchor="end" fontSize={10} fill="#94a3b8" fontFamily="ui-monospace, SFMono-Regular, monospace">{v % 1 === 0 ? v : v.toFixed(1)}</text>
        ))}

        {/* Axis titles */}
        <text x={M.left + iw / 2} y={H - 10} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={700} style={{ letterSpacing: '0.20em' }}>IP DENSITY</text>
        <text transform={`rotate(-90 ${18} ${M.top + ih / 2})`} x={18} y={M.top + ih / 2} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={700} style={{ letterSpacing: '0.20em' }}>FEEDSTOCK AVAILABLE EU  (M t/yr)</text>



        {/* Bubbles */}
        {enriched.map((d) => {
          const isHover = hover?.name === d.name;
          const dim = hover && !isHover;
          const { lx, ly, above, anchor } = labelFor(d);
          return (
            <g key={d.name} style={{ cursor: 'pointer', opacity: dim ? 0.35 : 1, transition: 'opacity 160ms ease' }} onMouseEnter={() => setHover(d)} onMouseLeave={() => setHover(null)}>
              {isHover && (
                <circle cx={d.cx} cy={d.cy} r={d.rad + 8} fill={d.color} fillOpacity={0.08} />
              )}
              <circle cx={d.cx} cy={d.cy} r={d.rad} fill={d.color} fillOpacity={0.22} stroke={d.color} strokeWidth={1.5} strokeOpacity={0.95} />
              <circle cx={d.cx - d.rad * 0.35} cy={d.cy - d.rad * 0.35} r={d.rad * 0.18} fill="#ffffff" fillOpacity={0.55} />
              <circle cx={d.cx} cy={d.cy} r={2.5} fill={d.color} fillOpacity={0.95} />
              <text x={d.cx} y={d.cy + d.rad + 11} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={600}>{d.feedstocks.length} pathways</text>
            </g>

          );
        })}
      </svg>

      {hover && (() => {
        const tipW = 300;
        const tipH = 160;
        let tx = hover.cx + 18;
        let ty = hover.cy - tipH / 2;
        if (tx + tipW > W - 4) tx = hover.cx - tipW - 18;
        if (ty < 4) ty = 4;
        if (ty + tipH > H - 4) ty = H - tipH - 4;
        return (
          <div
            className="absolute rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm shadow-2xl px-3.5 py-3 text-[11px] pointer-events-none"
            style={{ left: tx, top: ty, width: tipW, boxShadow: '0 20px 40px -12px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.04)' }}
          >
            <div className="mb-2.5">
              <div className="font-semibold text-slate-900 text-[12px] leading-tight">{hover.name}</div>
              <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: `${STAGE_META[hover.stage].hex}14`, color: STAGE_META[hover.stage].hex }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: STAGE_META[hover.stage].hex }} />
                TRL {hover.trl} · {STAGE_META[hover.stage].label}
              </span>
            </div>
            <div className="space-y-1.5 tabular-nums">
              <div className="flex items-center justify-between gap-3"><span className="text-slate-400 text-[10px] uppercase tracking-wider">IP density</span><span className="font-semibold text-slate-900 text-right whitespace-nowrap">{hover.ipScore}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-slate-400 text-[10px] uppercase tracking-wider">Research volume</span><span className="font-semibold text-slate-900 text-right whitespace-nowrap">{Math.round(hover.patents * 2.4).toLocaleString()} pubs</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-slate-400 text-[10px] uppercase tracking-wider">Est. feedstock vol. (M t/yr)</span><span className="font-semibold text-slate-900 text-right whitespace-nowrap">{volumeRangeStr(hover.feedstockVolume)}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-slate-400 text-[10px] uppercase tracking-wider">Pathways</span><span className="font-semibold text-slate-900 text-right whitespace-nowrap">{hover.feedstocks.length} feedstocks</span></div>



            </div>
          </div>
        );
      })()}
    </div>
  );
};

const TechnologySnapshotSection: React.FC<{

  category?: string;
  topic?: string;
  navigate: (path: string) => void;
}> = ({ category, topic, navigate }) => {
  const decodedTopic = decodeURIComponent(topic || '');




  // Composite score: TRL (30%), inverse IP (25%), inverse energy (25%), feedstock flexibility (20%)
  const eMin = Math.min(...TECHNOLOGIES_DATA.map((t) => t.energy));
  const eMax = Math.max(...TECHNOLOGIES_DATA.map((t) => t.energy));
  const fMax = Math.max(...TECHNOLOGIES_DATA.map((t) => t.feedstocks.length));
  const TECHS = TECHNOLOGIES_DATA
    .map((t) => {
      const trlNorm = t.trl / 9;
      const ipNorm = 1 - t.ipScore / 100;
      const eNorm = eMax === eMin ? 1 : 1 - (t.energy - eMin) / (eMax - eMin);
      const fNorm = fMax === 0 ? 0 : t.feedstocks.length / fMax;
      const score = trlNorm * 0.3 + ipNorm * 0.25 + eNorm * 0.25 + fNorm * 0.2;
      return { ...t, score };
    })
    .sort((a, b) => b.score - a.score);

  const CARD_TOP_N = 5;
  const TOP_TECHS = TECHS.slice(0, CARD_TOP_N);

  const trl9Count = TECHS.filter((t) => t.trl === 9).length;
  const totalPatents = TECHS.reduce((s, t) => s + t.patents, 0);
  const avgIp = Math.round(TECHS.reduce((s, t) => s + t.ipScore, 0) / TECHS.length);
  const avgEnergy = (TECHS.reduce((s, t) => s + t.energy, 0) / TECHS.length).toFixed(1);

  const ipMeta = (patents: number) => {
    if (patents >= 500) return { label: 'High', dir: 'up' as const, color: 'text-rose-600', bar: 'bg-rose-500' };
    if (patents >= 150) return { label: 'Moderate', dir: 'flat' as const, color: 'text-amber-600', bar: 'bg-amber-500' };
    return { label: 'Open', dir: 'down' as const, color: 'text-emerald-600', bar: 'bg-emerald-500' };
  };

  const energyMeta = (kwh: number) => {
    if (kwh <= 3.5) return { label: 'Low', color: 'text-emerald-600', bar: 'bg-emerald-500' };
    if (kwh <= 5.0) return { label: 'Medium', color: 'text-amber-600', bar: 'bg-amber-500' };
    return { label: 'High', color: 'text-rose-600', bar: 'bg-rose-500' };
  };

  const flexMeta = (n: number) => {
    if (n >= 4) return { label: 'Flexible', color: 'text-emerald-600', bar: 'bg-emerald-500' };
    if (n >= 2) return { label: 'Moderate', color: 'text-amber-600', bar: 'bg-amber-500' };
    return { label: 'Single-source', color: 'text-rose-600', bar: 'bg-rose-500' };
  };

  const trlPillTone = (trl: number) =>
    trl >= 9 ? 'bg-emerald-100 text-emerald-700'
    : trl >= 6 ? 'bg-sky-100 text-sky-700'
    : 'bg-amber-100 text-amber-700';
  const maturityLabel = (trl: number) =>
    trl >= 9 ? 'Commercial scale'
    : trl >= 6 ? 'Pilot to Scale-up'
    : 'Lab to Pilot';

  // --- View all modal state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'grid' | 'list'>('list');

  const [selectedTech, setSelectedTech] = useState<typeof TECHS[number] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const TECH_PAGE_SIZE = 8;


  const trlBounds: [number, number] = [1, 9];
  const ipBounds: [number, number] = [0, 100];
  const enBoundsArr = TECHS.map((t) => t.energy);
  const enBounds: [number, number] = [
    Math.floor(Math.min(...enBoundsArr) * 10) / 10,
    Math.ceil(Math.max(...enBoundsArr) * 10) / 10,
  ];
  const fxBounds: [number, number] = [1, Math.max(...TECHS.map((t) => t.feedstocks.length))];

  const [minTrl, setMinTrl] = useState(trlBounds[0]);
  const [maxIp, setMaxIp] = useState(ipBounds[1]);
  const [maxEnergy, setMaxEnergy] = useState(enBounds[1]);
  const [minFlex, setMinFlex] = useState(fxBounds[0]);
  const [stageFilter, setStageFilter] = useState<'all' | 'commercial' | 'pilot' | 'research'>('all');
  const [sortKey, setSortKey] = useState<'rank' | 'name' | 'trl' | 'ipScore' | 'energy' | 'feedstocks' | 'status'>('rank');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const techCategories = useMemo(() => Array.from(new Set(TECHS.map((t) => t.category))).sort(), [TECHS]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TECHS.filter((t) => {
      if (t.trl < minTrl) return false;
      if (t.ipScore > maxIp) return false;
      if (t.energy > maxEnergy) return false;
      if (t.feedstocks.length < minFlex) return false;
      if (stageFilter !== 'all' && t.status.toLowerCase() !== stageFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [TECHS, minTrl, maxIp, maxEnergy, minFlex, stageFilter, categoryFilter, searchQuery]);


  const sortedRows = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'name': return a.name.localeCompare(b.name);
        case 'trl': return b.trl - a.trl;
        case 'ipScore': return a.ipScore - b.ipScore; // lower IP = better/open first
        case 'energy': return a.energy - b.energy;
        case 'feedstocks': return b.feedstocks.length - a.feedstocks.length;
        case 'status': return a.status.localeCompare(b.status);
        default: return b.score - a.score;
      }
    });
    return arr;
  }, [filtered, sortKey]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, categoryFilter, stageFilter, minTrl, maxIp, maxEnergy, minFlex, sortKey, modalView]);
  const techTotalPages = Math.max(1, Math.ceil(sortedRows.length / TECH_PAGE_SIZE));
  const techStartIdx = (currentPage - 1) * TECH_PAGE_SIZE;
  const techEndIdx = Math.min(techStartIdx + TECH_PAGE_SIZE, sortedRows.length);
  const pagedTechRows = sortedRows.slice(techStartIdx, techEndIdx);


  const rangeActiveCount =
    (minTrl > trlBounds[0] ? 1 : 0) +
    (maxIp < ipBounds[1] ? 1 : 0) +
    (maxEnergy < enBounds[1] ? 1 : 0) +
    (minFlex > fxBounds[0] ? 1 : 0);
  const activeFilterCount = rangeActiveCount + (stageFilter !== 'all' ? 1 : 0);
  const resetRanges = () => {
    setMinTrl(trlBounds[0]); setMaxIp(ipBounds[1]);
    setMaxEnergy(enBounds[1]); setMinFlex(fxBounds[0]);
  };
  const resetAll = () => {
    resetRanges();
    setStageFilter('all');
    setSearchQuery('');
  };


  const Row = ({ label, value, tone, pct, indicator }: {
    label: string; value: string; tone: { color: string; bar: string };
    pct?: number; indicator?: 'low' | 'medium' | 'high';
  }) => {
    const isColored = pct !== undefined;
    const Icon = indicator === 'high' ? ArrowUp : indicator === 'low' ? ArrowDown : Minus;
    return (
      <div className="py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className={`text-[12px] font-semibold tabular-nums ${isColored ? tone.color : 'text-foreground'}`}>{value}</span>
          {indicator && (
            <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider ${tone.color}`}>
              <Icon className="w-3 h-3" strokeWidth={2.75} />
            </span>
          )}
        </div>
        {pct !== undefined && (
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden mt-1.5">
            <div className={`h-full ${tone.bar} rounded-full`} style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    );
  };

  const renderCard = (t: typeof TECHS[number], idx: number, variant: 'snapshot' | 'modal' = 'snapshot') => {
    const ip = ipMeta(t.patents);
    const en = energyMeta(t.energy);
    const fx = flexMeta(t.feedstocks.length);
    const enInd: 'low' | 'medium' | 'high' = en.label === 'Low' ? 'low' : en.label === 'High' ? 'high' : 'medium';
    const fxInd: 'low' | 'medium' | 'high' = fx.label === 'Flexible' ? 'high' : fx.label === 'Moderate' ? 'medium' : 'low';
    const surface = 'bg-muted/40 hover:bg-muted/60';
    return (
      <button
        key={t.name}
        onClick={() => setSelectedTech(t)}

        className={`text-left ${surface} border border-border/60 rounded-lg p-3 hover:border-primary/40 hover:shadow-sm transition-all flex flex-col group`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tabular-nums text-muted-foreground">#{idx + 1}</span>
          <span className={`text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${trlPillTone(t.trl)}`}>TRL {t.trl}</span>
        </div>
        <div className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.3rem] group-hover:text-primary transition-colors">
          {t.name}
        </div>
        <div className="mt-2 pt-2 border-t border-border/50 divide-y divide-border/40">
          <Row label="IP density" value={`${t.patents.toLocaleString()} patents`} tone={ip} />
          <Row label="Energy" value={`${t.energy.toFixed(1)} kWh/kg`} tone={en} indicator={enInd} />
          <Row label="Feedstocks" value={`${t.feedstocks.length} ${t.feedstocks.length === 1 ? 'option' : 'options'}`} tone={fx} />
        </div>
      </button>
    );
  };


  const Slider = ({ label, unit, value, min, max, step, onChange, format, isActive }: any) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 h-4">
        <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label} <span className="text-slate-300 font-normal normal-case tracking-normal">· {unit}</span>
        </label>
        <span className={`text-[12px] font-bold tabular-nums leading-none ${isActive ? 'text-sky-600' : 'text-slate-900'}`}>
          {format(value)}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sky-500 h-1"
      />
      <div className="flex justify-between text-[10px] tabular-nums text-slate-400 leading-none">
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">




      {/* Bubble chart — top 5 technologies */}
      <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Technology Maturity & Scalability</h4>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {(['lab', 'pilot', 'commercial'] as TrlStage[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <StageDot stage={s} /> {STAGE_META[s].label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 pl-2 ml-1 border-l border-border/60">
              <span className="inline-flex items-end gap-1">
                <span className="inline-block rounded-full border border-slate-400/70" style={{ width: 5, height: 5 }} />
                <span className="inline-block rounded-full border border-slate-400/70" style={{ width: 8, height: 8 }} />
                <span className="inline-block rounded-full border border-slate-400/70" style={{ width: 12, height: 12 }} />
              </span>
              <span className="text-muted-foreground/80"># pathways</span>
            </span>
          </div>



        </div>
        <TechBubbleChart data={TOP_TECHS} height={300} />
      </div>

      {/* Category highlights */}
      {(() => {
        const byCat = new Map<string, { trl: number; ip: number; patents: number; count: number }>();
        TECHS.forEach((t) => {
          const cur = byCat.get(t.category) ?? { trl: 0, ip: 0, patents: 0, count: 0 };
          cur.trl += t.trl; cur.ip += t.ipScore; cur.patents += t.patents; cur.count += 1;
          byCat.set(t.category, cur);
        });
        const cats = Array.from(byCat.entries()).map(([name, v]) => ({
          name,
          avgTrl: v.trl / v.count,
          avgIp: v.ip / v.count,
          patents: v.patents,
          count: v.count,
        }));
        const mostScalable = [...cats].sort((a, b) => b.avgTrl - a.avgTrl)[0];
        const mostIp = [...cats].sort((a, b) => b.avgIp - a.avgIp)[0];
        const leastIp = [...cats].sort((a, b) => a.avgIp - b.avgIp)[0];
        const cards: { label: string; cat: typeof cats[number]; metric: string; unit: string }[] = [
          { label: 'Most Scalable',      cat: mostScalable, metric: mostScalable.avgTrl.toFixed(1),      unit: 'avg TRL' },
          { label: 'Most IP Dense',      cat: mostIp,       metric: Math.round(mostIp.avgIp).toString(), unit: 'avg IP score' },
          { label: 'Least IP Dense',     cat: leastIp,      metric: Math.round(leastIp.avgIp).toString(),unit: 'avg IP score' },
        ];
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-lg border border-border/60 bg-muted/40 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border/60">
            {cards.map((h) => (
              <div key={h.label} className="px-3 py-2.5">
                <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{h.label}</div>
                <div className="mt-1.5 text-sm font-semibold text-slate-900 leading-tight truncate">{h.cat.name}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-sm font-bold tabular-nums text-slate-900 leading-none whitespace-nowrap">{h.metric}</span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{h.unit}</span>
                </div>
              </div>
            ))}
          </div>
        );

      })()}




      {/* Inline full ranked set */}
      <div className="rounded-lg border border-border/60 bg-card p-3 space-y-3">

          <div className="flex items-center gap-2 flex-wrap justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search technology or category…"
                className="h-8 pl-8 !text-[11px] placeholder:!text-[11px] bg-card border-border/60"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 rounded-md border border-border/60 bg-card px-2 text-[12px] text-slate-700"
            >
              <option value="all">All categories</option>
              {techCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>









          {/* Results — cards or list */}
          {modalView === 'grid' ? (
            sortedRows.length === 0 ? (
              <div className="rounded-lg border border-slate-200 py-10 text-center text-[12px] text-slate-500">
                No technologies match these filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {pagedTechRows.map((t) => {
                  const originalRank = TECHS.findIndex((x) => x.name === t.name) + 1;
                  return renderCard(t, originalRank - 1, 'modal');
                })}

              </div>
            )
          ) : (
            <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
              <table className="w-full text-[12px] table-fixed">
                <colgroup>
                  <col style={{ width: '4%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '18%' }} />
                </colgroup>
                <thead className="bg-muted/40 border-b border-border/60 text-slate-500 uppercase tracking-widest text-[10px]">
                  <tr>
                    {([
                      ['rank', '#', '#', 'center'],
                      ['name', 'Technology', 'Technology', 'left'],
                      ['name', 'Category', 'Category', 'left'],
                      ['feedstocks', 'Feedstocks', 'Feedstock types', 'center'],
                      ['feedstocks', 'Est. vol.', 'Est. feedstock vol. (M t/yr)', 'center'],


                      ['ipScore', 'IP dens.', 'IP density', 'center'],
                      ['ipScore', 'Research', 'Research density', 'center'],
                      ['trl', 'Maturity', 'Maturity', 'left'],
                    ] as [typeof sortKey, string, string, 'left' | 'right' | 'center'][]).map(([key, label, full, align], i) => (
                      <th key={`${key}-${i}`}
                        className={`px-4 py-2.5 font-semibold whitespace-nowrap overflow-hidden text-ellipsis ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${sortKey === key ? 'text-slate-900' : ''}`}>
                        <TooltipProvider delayDuration={100}>
                          <UiTooltip>
                            <TooltipTrigger asChild>
                              <button type="button" onClick={() => setSortKey(key)}
                                className="cursor-pointer select-none hover:text-slate-900 uppercase tracking-widest text-[10px] font-semibold">
                                {label}
                              </button>
                            </TooltipTrigger>
                            <UiTooltipContent side="top" className="text-xs">{full}</UiTooltipContent>
                          </UiTooltip>
                        </TooltipProvider>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-6 text-slate-500">No technologies match these filters.</td></tr>
                  ) : (
                    pagedTechRows.map((t) => {
                      const rank = TECHS.findIndex((x) => x.name === t.name) + 1;
                      const ip = ipMeta(t.patents);
                      const en = energyMeta(t.energy);
                      const fx = flexMeta(t.feedstocks.length);
                      // Research density derived deterministically from TRL + feedstock diversity
                      const research = Math.round(t.patents * 0.55 + t.trl * 45 + t.feedstocks.length * 32);
                      return (
                        <tr key={t.name} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                          onClick={() => navigate(`/landscape/${category}/${encodeURIComponent(decodedTopic)}/value-chain/pathways?filterType=technology&filterValues=${encodeURIComponent(t.name)}`)}>

                          <td className="px-4 py-2.5 tabular-nums font-medium text-slate-400 text-center">{rank}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900 truncate">{t.name}</td>
                          <td className="px-4 py-2.5 text-slate-500 truncate">{t.category}</td>
                          <td className="px-4 py-2.5 tabular-nums font-medium text-center text-slate-700">
                            {t.feedstocks.length}
                          </td>
                          <td className="px-4 py-2.5 tabular-nums font-medium text-center text-slate-700 whitespace-nowrap">{volLow(t.feedstockVolume).toFixed(1)}–{volHigh(t.feedstockVolume).toFixed(1)}</td>
                          <td className="px-4 py-2.5 tabular-nums font-medium text-center text-slate-700">{t.patents.toLocaleString()}</td>
                          <td className="px-4 py-2.5 tabular-nums font-medium text-center text-slate-700">{research.toLocaleString()}</td>
                          <td className="px-4 py-2.5 whitespace-nowrap"><StagePill stage={techStage(t.trl)} /></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {sortedRows.length > 0 && techTotalPages > 1 && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-100 bg-slate-50/60 text-[11px]">
                  <span className="text-slate-500 tabular-nums">
                    Showing <span className="font-semibold text-slate-900">{techStartIdx + 1}</span>
                    –<span className="font-semibold text-slate-900">{techEndIdx}</span>
                    <span className="text-slate-400"> of {sortedRows.length}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-7 px-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium"
                    >
                      Prev
                    </button>
                    <span className="px-2 tabular-nums text-slate-600">
                      Page <span className="font-semibold text-slate-900">{currentPage}</span> / {techTotalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(techTotalPages, p + 1))}
                      disabled={currentPage === techTotalPages}
                      className="h-7 px-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

          )}


      </div>


      {/* Technology detail modal */}
      <Dialog open={!!selectedTech} onOpenChange={(o) => !o && setSelectedTech(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedTech && (() => {
            const t = selectedTech;
            const ip = ipMeta(t.patents);
            const en = energyMeta(t.energy);
            const fx = flexMeta(t.feedstocks.length);
            const patentsUrl = `https://patents.google.com/?q=${encodeURIComponent(t.name + ' lactic acid')}`;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${trlPillTone(t.trl)}`}>TRL {t.trl}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{t.category}</span>
                    <span className="text-[10px] text-slate-400">·</span>
                    <span className="text-[10px] font-semibold text-slate-600">{t.status}</span>
                  </div>
                  <DialogTitle className="text-lg">{t.name}</DialogTitle>
                  <DialogDescription className="text-[13px] leading-relaxed text-slate-600">
                    {t.description}
                  </DialogDescription>
                </DialogHeader>

                {/* Key metrics strip */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="rounded-lg bg-muted/40 border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">IP density</div>
                      <a
                        href={patentsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 hover:text-sky-900"
                        title="Explore patents on Google Patents"
                      >
                        <FileText className="w-3 h-3" />
                        Google Patents ↗
                      </a>
                    </div>
                    <div className={`text-lg font-bold tabular-nums mt-0.5 ${ip.color}`}>{t.patents.toLocaleString()}<span className="text-[11px] text-slate-400 font-medium"> patents</span></div>
                    <div className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${ip.color}`}>{ip.label}</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Energy</div>
                      <a
                        href={t.energyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 hover:text-amber-900"
                        title={t.energySource}
                      >
                        <Zap className="w-3 h-3" />
                        Source ↗
                      </a>
                    </div>
                    <div className="text-lg font-bold tabular-nums text-slate-900 mt-0.5">{t.energy.toFixed(1)}<span className="text-[11px] text-slate-400 font-medium"> kWh/kg</span></div>
                    <div className={`text-[10px] font-semibold mt-1 ${en.color}`}>{en.label}</div>
                  </div>
                </div>

                {/* Compatible feedstocks */}
                <div className="rounded-lg border border-border/60 bg-white p-3 mt-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Compatible feedstocks</div>
                    <div className="flex items-center gap-3 text-[10px] tabular-nums text-slate-500">
                      <span className="inline-flex items-center gap-1"><Sprout className="w-3 h-3 text-emerald-600" /><span className="font-semibold text-slate-900">{t.feedstocks.length}</span> feedstocks</span>
                      <span className="text-slate-300">·</span>
                      <span className="inline-flex items-center gap-1"><Users className="w-3 h-3 text-slate-500" /><span className="font-semibold text-slate-900">{t.players}</span> players worldwide</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.feedstocks.map((f) => (
                      <span key={f} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700">
                        <Sprout className="w-3 h-3 text-emerald-600" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};



// =====================================================================
// Material Snapshot — producers list + geographic map
// =====================================================================
type ProducerStage = 'Industrial' | 'Demo' | 'Pilot' | 'Lab';
type Region = 'Europe' | 'North America' | 'Asia' | 'South America' | 'Africa' | 'Oceania';
type CompanyType = 'Industrial' | 'Demo' | 'Pilot' | 'Lab';

type ProductionSite = {
  city: string;
  country: string;
  region: Region;
  scale: ProducerStage;
  capacityKtY?: number; // nameplate capacity in kilotonnes/year, where disclosed
};

type Producer = {
  name: string;
  hqCity: string;
  hqCountry: string;
  hqRegion: Region;
  type: CompanyType;
  founded: number;
  sites: ProductionSite[];
};

const PRODUCERS: Producer[] = [
  {
    name: 'Corbion', hqCity: 'Amsterdam', hqCountry: 'Netherlands', hqRegion: 'Europe',
    type: 'Industrial', founded: 1919,
    sites: [
      { city: 'Gorinchem',   country: 'Netherlands', region: 'Europe',        scale: 'Industrial', capacityKtY: 100 },
      { city: 'Rayong',      country: 'Thailand',    region: 'Asia',          scale: 'Industrial', capacityKtY: 125 },
      { city: 'Blair, NE',   country: 'USA',         region: 'North America', scale: 'Demo',       capacityKtY: 40 },
    ],
  },
  {
    name: 'NatureWorks (Cargill)', hqCity: 'Minnetonka', hqCountry: 'USA', hqRegion: 'North America',
    type: 'Industrial', founded: 1997,
    sites: [
      { city: 'Blair, NE',    country: 'USA',      region: 'North America', scale: 'Industrial', capacityKtY: 150 },
      { city: 'Nakhon Sawan', country: 'Thailand', region: 'Asia',          scale: 'Industrial', capacityKtY: 75 },
    ],
  },
  {
    name: 'Galactic', hqCity: 'Escanaffles', hqCountry: 'Belgium', hqRegion: 'Europe',
    type: 'Industrial', founded: 1994,
    sites: [
      { city: 'Escanaffles', country: 'Belgium', region: 'Europe',        scale: 'Industrial', capacityKtY: 80 },
      { city: 'Bandung',     country: 'China',   region: 'Asia',          scale: 'Demo',       capacityKtY: 20 },
      { city: 'Milwaukee',   country: 'USA',     region: 'North America', scale: 'Pilot' },
    ],
  },
  {
    name: 'Henan Jindan', hqCity: 'Dancheng', hqCountry: 'China', hqRegion: 'Asia',
    type: 'Industrial', founded: 2001,
    sites: [
      { city: 'Dancheng', country: 'China', region: 'Asia', scale: 'Industrial', capacityKtY: 180 },
    ],
  },
  {
    name: 'COFCO Biochemical', hqCity: 'Bengbu', hqCountry: 'China', hqRegion: 'Asia',
    type: 'Industrial', founded: 2006,
    sites: [
      { city: 'Anhui',  country: 'China', region: 'Asia', scale: 'Demo',  capacityKtY: 30 },
      { city: 'Bengbu', country: 'China', region: 'Asia', scale: 'Pilot' },
    ],
  },
  {
    name: 'Musashino Chemical', hqCity: 'Tokyo', hqCountry: 'Japan', hqRegion: 'Asia',
    type: 'Industrial', founded: 1940,
    sites: [
      { city: 'Tokyo',     country: 'Japan', region: 'Asia', scale: 'Demo',  capacityKtY: 25 },
      { city: 'Yokkaichi', country: 'Japan', region: 'Asia', scale: 'Pilot' },
    ],
  },
  {
    name: 'BBCA Biochemical', hqCity: 'Bengbu', hqCountry: 'China', hqRegion: 'Asia',
    type: 'Industrial', founded: 1997,
    sites: [
      { city: 'Bengbu', country: 'China', region: 'Asia', scale: 'Pilot', capacityKtY: 10 },
    ],
  },
  {
    name: 'Futerro', hqCity: 'Escanaffles', hqCountry: 'Belgium', hqRegion: 'Europe',
    type: 'Demo', founded: 2007,
    sites: [
      { city: 'Escanaffles', country: 'Belgium', region: 'Europe', scale: 'Demo', capacityKtY: 1.5 },
      { city: 'Normandy',    country: 'France',  region: 'Europe', scale: 'Pilot' },
    ],
  },
  {
    name: 'Sulzer / Fuiba', hqCity: 'São Paulo', hqCountry: 'Brazil', hqRegion: 'South America',
    type: 'Demo', founded: 2016,
    sites: [
      { city: 'São Paulo', country: 'Brazil', region: 'South America', scale: 'Pilot', capacityKtY: 5 },
    ],
  },
  {
    name: 'Solugen', hqCity: 'Houston', hqCountry: 'USA', hqRegion: 'North America',
    type: 'Demo', founded: 2016,
    sites: [
      { city: 'Houston',   country: 'USA', region: 'North America', scale: 'Demo', capacityKtY: 10 },
      { city: 'Marshall',  country: 'USA', region: 'North America', scale: 'Pilot' },
    ],
  },
  {
    name: 'Uluu', hqCity: 'Perth', hqCountry: 'Australia', hqRegion: 'Oceania',
    type: 'Pilot', founded: 2021,
    sites: [
      { city: 'Perth', country: 'Australia', region: 'Oceania', scale: 'Pilot' },
    ],
  },
  {
    name: 'Bloom Biorenewables', hqCity: 'Marly', hqCountry: 'Switzerland', hqRegion: 'Europe',
    type: 'Pilot', founded: 2019,
    sites: [
      { city: 'Marly', country: 'Switzerland', region: 'Europe', scale: 'Lab' },
    ],
  },
  {
    name: 'Loliware', hqCity: 'New York', hqCountry: 'USA', hqRegion: 'North America',
    type: 'Pilot', founded: 2015,
    sites: [
      { city: 'New York', country: 'USA', region: 'North America', scale: 'Lab' },
    ],
  },
  {
    name: 'Protein Evolution', hqCity: 'New Haven', hqCountry: 'USA', hqRegion: 'North America',
    type: 'Lab', founded: 2021,
    sites: [
      { city: 'New Haven', country: 'USA', region: 'North America', scale: 'Lab' },
    ],
  },
  {
    name: 'Origin Materials', hqCity: 'West Sacramento', hqCountry: 'USA', hqRegion: 'North America',
    type: 'Lab', founded: 2008,
    sites: [
      { city: 'West Sacramento', country: 'USA', region: 'North America', scale: 'Lab' },
    ],
  },
];

const TECHNOLOGIES_DATA = [
  { name: 'Homofermentation (Lactobacillus)', productionOutput: 850, category: 'Microbial Fermentation', trl: 9, status: 'Commercial', patents: 1240, ipScore: 86, players: 28, energy: 3.2, feedstockVolume: 22.4, energySource: 'NREL Bioenergy Tech Office · 2024 techno-economic review', energyUrl: 'https://www.nrel.gov/bioenergy/', description: 'Industry-standard route: Lactobacillus strains ferment C6 sugars to L-lactic acid at high yield (>90%) and titer (>150 g/L). Mature downstream via calcium lactate precipitation.', feedstocks: ['Corn glucose', 'Cane sugar', 'Beet sugar', 'Wheat glucose', 'Cassava starch'] },
  { name: 'Engineered Yeast Fermentation', productionOutput: 420, category: 'Microbial Fermentation', trl: 7, status: 'Pilot', patents: 612, ipScore: 71, players: 19, energy: 4.1, feedstockVolume: 14.8, energySource: 'DOE BETO 2023 pathway benchmarking', energyUrl: 'https://www.energy.gov/eere/bioenergy/bioenergy-technologies-office', description: 'CRISPR-edited yeasts (S. cerevisiae, K. marxianus) tolerate low pH, cutting neutralizing agent use and simplifying DSP. Higher CAPEX offset by lower gypsum waste.', feedstocks: ['Corn glucose', 'Lignocellulosic sugars', 'Whey permeate'] },
  { name: 'Continuous Membrane Bioreactor', productionOutput: 260, category: 'Bioreactor Engineering', trl: 6, status: 'Pilot', patents: 198, ipScore: 48, players: 11, energy: 2.4, feedstockVolume: 18.1, energySource: 'Elsevier · Bioresource Technology (2023) meta-analysis', energyUrl: 'https://doi.org/10.1016/j.biortech.2023.129000', description: 'Integrated membrane cell recycle enables continuous fermentation with in-situ product removal. Cuts energy 25–35% vs. batch and boosts volumetric productivity 3–5×.', feedstocks: ['Corn glucose', 'Cane sugar', 'Whey permeate', 'Glycerol'] },
  { name: 'Reactive Distillation (DSP)', productionOutput: 380, category: 'Downstream / Separation', trl: 8, status: 'Commercial', patents: 142, ipScore: 39, players: 9, energy: 5.6, feedstockVolume: 7.5, energySource: 'AIChE Journal (2022) column benchmarking', energyUrl: 'https://aiche.onlinelibrary.wiley.com/journal/15475905', description: 'Esterification and hydrolysis combined in a single column recovers polymer-grade lactic acid from crude broth. Energy-intensive but eliminates gypsum byproduct.', feedstocks: ['Crude lactate broth', 'Ammonium lactate'] },
  { name: 'Gas Fermentation (CO₂ → LA)', productionOutput: 12, category: 'C1 / Gas Fermentation', trl: 3, status: 'Research', patents: 47, ipScore: 18, players: 5, energy: 6.8, feedstockVolume: 2.8, energySource: 'LanzaTech / ARPA-E OPEN 2024 filings', energyUrl: 'https://arpa-e.energy.gov/', description: 'Acetogenic bacteria (Clostridium spp.) convert CO₂/H₂ or syngas to lactate. Circular-carbon route still limited by low titers and high hydrogen cost.', feedstocks: ['CO₂ + H₂'] },
  { name: 'Heterofermentation (Bifidobacterium)', productionOutput: 190, category: 'Microbial Fermentation', trl: 6, status: 'Pilot', patents: 324, ipScore: 55, players: 12, energy: 3.8, feedstockVolume: 6.2, energySource: 'FEMS Microbiology Reviews (2023)', energyUrl: 'https://academic.oup.com/femsre', description: 'Mixed-acid fermenters valorize dairy and fruit side-streams. Yields lower than homofermentation but enables use of low-cost residual feedstocks.', feedstocks: ['Whey permeate', 'Molasses', 'Fruit waste'] },
  { name: 'Electrodialysis Recovery (DSP)', productionOutput: 220, category: 'Downstream / Separation', trl: 7, status: 'Pilot', patents: 218, ipScore: 44, players: 8, energy: 4.9, feedstockVolume: 6.9, energySource: 'Journal of Membrane Science (2023)', energyUrl: 'https://www.sciencedirect.com/journal/journal-of-membrane-science', description: 'Bipolar-membrane electrodialysis separates lactate salts electrochemically, eliminating gypsum. Higher OPEX from electricity but cleaner effluent.', feedstocks: ['Fermentation broth', 'Ammonium lactate'] },
  { name: 'Algal Photosynthetic Route', productionOutput: 6, category: 'Photosynthetic / Algal', trl: 4, status: 'Research', patents: 61, ipScore: 22, players: 6, energy: 5.2, feedstockVolume: 1.6, energySource: 'DOE Algae Program 2024 report', energyUrl: 'https://www.energy.gov/eere/bioenergy/algae', description: 'Engineered cyanobacteria produce lactate directly from CO₂ + sunlight in photobioreactors. Very early-stage; productivity and photon efficiency remain barriers.', feedstocks: ['CO₂', 'Sunlight'] },
  { name: 'Chemical Catalysis (Glycerol → LA)', productionOutput: 45, category: 'Heterogeneous Catalysis', trl: 5, status: 'Pilot', patents: 156, ipScore: 63, players: 10, energy: 4.5, feedstockVolume: 2.1, energySource: 'ACS Catalysis (2023) review', energyUrl: 'https://pubs.acs.org/journal/accacs', description: 'Base- or noble-metal-catalyzed oxidation of biodiesel glycerol to lactic acid. Fast reaction, but catalyst cost and selectivity constrain scale-up.', feedstocks: ['Glycerol'] },
  { name: 'Solid-State Fermentation', productionOutput: 78, category: 'Solid-State / Low-Water', trl: 5, status: 'Pilot', patents: 89, ipScore: 31, players: 7, energy: 2.9, feedstockVolume: 13.6, energySource: 'Biotechnology Advances (2022)', energyUrl: 'https://www.sciencedirect.com/journal/biotechnology-advances', description: 'Low-moisture fermentation on agri-residues cuts water use ~80% and enables on-site regional processing. Limited heat/mass transfer at scale.', feedstocks: ['Cassava bagasse', 'Rice bran', 'Corn stover'] },
  { name: 'Cell-Free Enzymatic Synthesis', productionOutput: 8, category: 'Cell-Free / Enzymatic', trl: 3, status: 'Research', patents: 38, ipScore: 27, players: 4, energy: 3.6, feedstockVolume: 9.2, energySource: 'Nature Chemical Biology (2023)', energyUrl: 'https://www.nature.com/nchembio/', description: 'Purified enzyme cascade converts glucose/pyruvate to lactate without whole cells. Fast, tunable, but enzyme cost dominates economics.', feedstocks: ['Glucose', 'Pyruvate'] },
  { name: 'Simulated Moving Bed Chromatography', productionOutput: 310, category: 'Downstream / Separation', trl: 8, status: 'Commercial', patents: 174, ipScore: 51, players: 8, energy: 3.4, feedstockVolume: 7.8, energySource: 'Separation & Purification Technology (2023)', energyUrl: 'https://www.sciencedirect.com/journal/separation-and-purification-technology', description: 'Continuous chromatographic separation of L- and D-lactate isomers for polymer-grade purity. High resin cost but low thermal energy.', feedstocks: ['Crude lactate broth'] },
];

const appSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const APPLICATIONS_DATA: Array<{
  name: string;
  category: string;
  maturity: TrlStage;
  ipScore: number;
  signals: number;
  researchScore: number;
  topMarket: string;
  materialPrice: number;
  marketPlayers: number;
  url: string;
}> = [
  { name: 'Bioplastics (PLA)',           category: 'Polymers',      maturity: 'commercial', ipScore: 78, signals: 184, researchScore: 84, topMarket: 'Germany',    materialPrice: 2500, marketPlayers: 142, url: `/applications/${appSlug('Bioplastics (PLA)')}` },
  { name: 'Food & Beverage',             category: 'Food & Feed',   maturity: 'commercial', ipScore: 42, signals: 132, researchScore: 61, topMarket: 'Netherlands', materialPrice: 1800, marketPlayers: 98,  url: `/applications/${appSlug('Food & Beverage')}` },
  { name: 'Pharma & Personal Care',      category: 'Pharma',        maturity: 'commercial', ipScore: 71, signals: 98,  researchScore: 77, topMarket: 'France',     materialPrice: 3200, marketPlayers: 76,  url: `/applications/${appSlug('Pharma & Personal Care')}` },
  { name: 'Industrial Solvents',         category: 'Chemicals',     maturity: 'commercial', ipScore: 38, signals: 54,  researchScore: 49, topMarket: 'Germany',    materialPrice: 1600, marketPlayers: 64,  url: `/applications/${appSlug('Industrial Solvents')}` },
  { name: 'Agriculture & Biostimulants', category: 'Agri',          maturity: 'pilot',      ipScore: 34, signals: 71,  researchScore: 42, topMarket: 'Spain',      materialPrice: 1400, marketPlayers: 38,  url: `/applications/${appSlug('Agriculture & Biostimulants')}` },
  { name: 'Textile Fibers (PLA yarn)',   category: 'Polymers',      maturity: 'pilot',      ipScore: 58, signals: 88,  researchScore: 66, topMarket: 'Italy',      materialPrice: 2800, marketPlayers: 42,  url: `/applications/${appSlug('Textile Fibers (PLA yarn)')}` },
  { name: 'Packaging Coatings',          category: 'Polymers',      maturity: 'pilot',      ipScore: 63, signals: 76,  researchScore: 58, topMarket: 'Belgium',    materialPrice: 2200, marketPlayers: 51,  url: `/applications/${appSlug('Packaging Coatings')}` },
  { name: 'Home & Personal Cleaning',    category: 'Consumer',      maturity: 'commercial', ipScore: 29, signals: 44,  researchScore: 31, topMarket: 'Sweden',     materialPrice: 1500, marketPlayers: 55,  url: `/applications/${appSlug('Home & Personal Cleaning')}` },
  { name: 'Medical Devices & Sutures',   category: 'Medical',       maturity: 'pilot',      ipScore: 82, signals: 62,  researchScore: 88, topMarket: 'Switzerland',materialPrice: 4500, marketPlayers: 29,  url: `/applications/${appSlug('Medical Devices & Sutures')}` },
  { name: '3D Printing Resins',          category: 'Advanced Mfg.', maturity: 'lab',        ipScore: 66, signals: 51,  researchScore: 73, topMarket: 'Denmark',    materialPrice: 3500, marketPlayers: 18,  url: `/applications/${appSlug('3D Printing Resins')}` },
  { name: 'Animal Feed Preservatives',   category: 'Food & Feed',   maturity: 'commercial', ipScore: 24, signals: 33,  researchScore: 27, topMarket: 'Netherlands', materialPrice: 1200, marketPlayers: 47,  url: `/applications/${appSlug('Animal Feed Preservatives')}` },
  { name: 'Cosmetics & Fragrance',       category: 'Pharma',        maturity: 'commercial', ipScore: 47, signals: 58,  researchScore: 45, topMarket: 'France',     materialPrice: 2800, marketPlayers: 61,  url: `/applications/${appSlug('Cosmetics & Fragrance')}` },
];


const TYPE_TONE: Record<CompanyType, string> = {
  'Industrial': 'bg-slate-100 text-slate-700 border-slate-200',
  'Demo':       'bg-violet-50 text-violet-700 border-violet-200',
  'Pilot':      'bg-orange-50 text-orange-700 border-orange-200',
  'Lab':        'bg-pink-50 text-pink-700 border-pink-200',
};


const STAGE_RANK: Record<ProducerStage, number> = { Industrial: 4, Demo: 3, Pilot: 2, Lab: 1 };

const STAGE_TONE: Record<ProducerStage, { dot: string; fill: string; badge: string; label: string }> = {
  Industrial: { dot: 'bg-emerald-500', fill: '#10b981', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Industrial' },
  Demo:       { dot: 'bg-sky-500',     fill: '#0ea5e9', badge: 'bg-sky-50 text-sky-700 border-sky-200',             label: 'Demo' },
  Pilot:      { dot: 'bg-amber-500',   fill: '#f59e0b', badge: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Pilot' },
  Lab:        { dot: 'bg-slate-400',   fill: '#94a3b8', badge: 'bg-slate-50 text-slate-600 border-slate-200',       label: 'Lab' },
};

// Best (highest) scale across a producer's sites — used for ranking
const topScale = (p: Producer): ProducerStage =>
  p.sites.reduce<ProducerStage>((best, s) => (STAGE_RANK[s.scale] > STAGE_RANK[best] ? s.scale : best), 'Lab');

const MaterialSnapshotSection: React.FC<{
  category?: string;
  topic?: string;
  navigate: (path: string) => void;
}> = ({ topic }) => {
  const decodedTopic = decodeURIComponent(topic || 'this material');
  const [hover, setHover] = useState<string | null>(null); // region name
  const [stageFilter, setStageFilter] = useState<ProducerStage | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CompanyType>('all');
  const [regionFilter, setRegionFilter] = useState<'all' | Region>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  // Filter options derived from data
  const regionOptions = useMemo(() => Array.from(new Set(PRODUCERS.map((p) => p.hqRegion))).sort(), []);
  const countryOptions = useMemo(
    () => Array.from(new Set(PRODUCERS.filter((p) => regionFilter === 'all' || p.hqRegion === regionFilter).map((p) => p.hqCountry))).sort(),
    [regionFilter],
  );
  const cityOptions = useMemo(
    () => Array.from(new Set(PRODUCERS.filter((p) => (regionFilter === 'all' || p.hqRegion === regionFilter) && (countryFilter === 'all' || p.hqCountry === countryFilter)).map((p) => p.hqCity))).sort(),
    [regionFilter, countryFilter],
  );

  // A producer is included if any of its sites match the stage filter and HQ matches region/country/city filters
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PRODUCERS.filter((p) => {
      if (stageFilter !== 'all' && !p.sites.some((s) => s.scale === stageFilter)) return false;
      if (categoryFilter !== 'all' && p.type !== categoryFilter) return false;
      if (regionFilter !== 'all' && p.hqRegion !== regionFilter) return false;
      if (countryFilter !== 'all' && p.hqCountry !== countryFilter) return false;
      if (cityFilter !== 'all' && p.hqCity !== cityFilter) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.hqCity.toLowerCase().includes(q) && !p.hqCountry.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [stageFilter, categoryFilter, regionFilter, countryFilter, cityFilter, searchQuery]);


  // Rank by top scale then by number of sites
  const ranked = useMemo(
    () => [...filtered].sort((a, b) => STAGE_RANK[topScale(b)] - STAGE_RANK[topScale(a)] || b.sites.length - a.sites.length),
    [filtered],
  );


  const counts = useMemo(() => {
    const c: Record<CompanyType, number> = { 'Industrial': 0, 'Demo': 0, 'Pilot': 0, 'Lab': 0 };
    PRODUCERS.forEach((p) => { c[p.type]++; });
    return c;
  }, []);
  const totalCapacity = useMemo(
    () => PRODUCERS.reduce((sum, p) => sum + p.sites.reduce((s, x) => s + (x.capacityKtY || 0), 0), 0),
    [],
  );
  const emerging = useMemo(
    () => PRODUCERS.filter((p) => p.type !== 'Industrial').sort((a, b) => STAGE_RANK[topScale(b)] - STAGE_RANK[topScale(a)]),
    [],
  );

  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(ranked.length / PAGE_SIZE));
  useEffect(() => { setPage(1); }, [stageFilter, categoryFilter, searchQuery]);
  const pageStart = (page - 1) * PAGE_SIZE;
  const paged = ranked.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="space-y-4">


      {/* Map + table */}
      <div className="space-y-4">

        {/* Heatmap */}
        <div className="rounded-lg border border-border/60 bg-muted/40 p-3">

          <div className="flex items-center justify-between gap-3 mb-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Material Producers per Region Worldwide</h4>
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-muted-foreground">
              <Users size={12} />
              <span className="flex h-2 w-20 overflow-hidden rounded-sm">
                {['#a7f3d0', '#34d399', '#10b981', '#059669', '#047857'].map((c) => (
                  <span key={c} style={{ background: c }} className="flex-1" />
                ))}
              </span>
              <Users size={18} />
            </div>
          </div>
          {(() => {
            // Count unique producers per region — same set shown in the producer table below
            const regionCounts: Record<string, number> = {};
            filtered.forEach((p) => {
              const regions = new Set(p.sites.map((s) => s.region));
              regions.forEach((r) => { regionCounts[r] = (regionCounts[r] || 0) + 1; });
            });
            const hoverProds = hover ? filtered.filter((p) => p.sites.some((s) => s.region === hover)) : [];
            return (
              <div className="relative">
                <WorldRegionMap
                  regionCounts={regionCounts}
                  hoveredRegion={hover}
                  onHoverRegion={setHover}
                />
                {hover && regionCounts[hover] && (
                  <div className="pointer-events-none absolute top-2 right-2 w-[240px] rounded-md border border-slate-200 bg-white shadow-lg px-2.5 py-2 text-[10px] leading-tight">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-900">{hover}</div>
                    <div className="text-slate-500 text-[9px]">
                      {regionCounts[hover]} site{regionCounts[hover] > 1 ? 's' : ''} · {hoverProds.length} producer{hoverProds.length > 1 ? 's' : ''}
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      {hoverProds.slice(0, 5).map((p) => {
                        const best = topScale(p);
                        return (
                          <div key={p.name} className="flex items-center justify-between gap-2">
                            <span className="truncate text-slate-700 text-[10px]">{p.name}</span>
                            <span className={`text-[9px] font-semibold uppercase tracking-wider ${STAGE_TONE[best].badge.split(' ').find((x) => x.startsWith('text-'))}`}>{best}</span>
                          </div>
                        );
                      })}
                      {hoverProds.length > 5 && (
                        <div className="text-[9px] font-medium text-slate-500">+ {hoverProds.length - 5} more</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>





        {/* Table */}
        <div className="flex items-center gap-2 flex-wrap justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search producer, city, country…"
              className="h-8 pl-8 !text-[11px] placeholder:!text-[11px] bg-card border-border/60"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-8 rounded-md border border-border/60 bg-card px-2 text-[12px] text-slate-700"
            >
              <option value="all">All cities</option>
              {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={countryFilter}
              onChange={(e) => {
                setCountryFilter(e.target.value);
                setCityFilter('all');
              }}
              className="h-8 rounded-md border border-border/60 bg-card px-2 text-[12px] text-slate-700"
            >
              <option value="all">All countries</option>
              {countryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value as 'all' | Region);
                setCountryFilter('all');
                setCityFilter('all');
              }}
              className="h-8 rounded-md border border-border/60 bg-card px-2 text-[12px] text-slate-700"
            >
              <option value="all">All regions</option>
              {regionOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | CompanyType)}
              className="h-8 rounded-md border border-border/60 bg-card px-2 text-[12px] text-slate-700"
            >
              <option value="all">All types</option>
              <option value="Industrial">Industrial</option>
              <option value="Demo">Demo</option>
              <option value="Pilot">Pilot</option>
              <option value="Lab">Lab</option>
            </select>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card overflow-hidden">

          <div>
            <table className="w-full text-[12px] table-fixed">
              <colgroup>
                <col style={{ width: '36px' }} />
                <col style={{ width: '28%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '120px' }} />
              </colgroup>


              <thead className="bg-muted/40 border-b border-border/60 text-slate-500 uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-4 py-2.5 text-center font-semibold whitespace-nowrap">#</th>
                  <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">Producer ({PRODUCERS.length})</th>
                  
                  <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">City</th>
                  <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">Country</th>
                  <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">Region</th>
                  <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">Maturity</th>
                </tr>
              </thead>

              <tbody>
                {paged.map((p, idx) => {
                  const i = pageStart + idx;
                  const best = topScale(p);
                  const hoveredHere = hover && p.sites.some((s) => s.region === hover);
                  const tone = STAGE_TONE[best];

                  return (
                    <tr
                      key={p.name}
                      onMouseEnter={() => setHover(p.hqRegion)}
                      onMouseLeave={() => setHover(null)}
                      className={`border-b border-border/40 align-middle cursor-pointer transition-colors ${hoveredHere ? 'bg-white' : 'hover:bg-white/60'}`}
                    >
                      <td className="px-4 py-2.5 tabular-nums font-medium text-slate-400 text-center">{i + 1}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-900 leading-tight truncate">{p.name}</div>
                        <div className="text-[9px] text-slate-400 leading-tight">est. {p.founded}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 truncate"><MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />{p.hqCity}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap truncate">{p.hqCountry}</td>

                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap truncate">{p.hqRegion}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border bg-white px-2 py-0.5 text-[10px] font-semibold ${tone.badge.replace(/bg-\S+\s?/g, '')}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                          {tone.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-100 bg-slate-50/60 text-[11px]">
              <span className="text-slate-500 tabular-nums">
                Showing <span className="font-semibold text-slate-900">{pageStart + 1}</span>
                –<span className="font-semibold text-slate-900">{Math.min(pageStart + PAGE_SIZE, ranked.length)}</span>
                <span className="text-slate-400"> of {ranked.length}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-7 px-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium"
                >
                  Prev
                </button>
                <span className="px-2 tabular-nums text-slate-600">
                  Page <span className="font-semibold text-slate-900">{page}</span> / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-7 px-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};


// =====================================================================
// Market Snapshot — geography + applications + players
// =====================================================================

const MarketSnapshotSection: React.FC<{
  category?: string;
  topic?: string;
  navigate: (path: string) => void;
}> = ({ category, topic, navigate }) => {
  const decodedTopic = decodeURIComponent(topic || '');

  // Top countries by demand share (mock data) — % positions on a simple world canvas
  // x/y are % positions on a 100x60 viewport mimicking a world map
  const COUNTRIES = [
    { name: 'United States', flag: '🇺🇸', demand: 28, value: '$1.46B', x: 22, y: 36 },
    { name: 'China',         flag: '🇨🇳', demand: 24, value: '$1.25B', x: 78, y: 38 },
    { name: 'Germany',       flag: '🇩🇪', demand: 11, value: '$574M',  x: 51, y: 28 },
    { name: 'Japan',         flag: '🇯🇵', demand:  8, value: '$418M',  x: 86, y: 40 },
    { name: 'Brazil',        flag: '🇧🇷', demand:  6, value: '$313M',  x: 34, y: 70 },
  ];



  const MATURITY_WEIGHT: Record<TrlStage, number> = { commercial: 1, pilot: 0.6, lab: 0.3 };

  // ================= State =================
  const [searchQuery, setSearchQuery] = useState('');
  const [maturityFilter, setMaturityFilter] = useState<'all' | TrlStage>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const appCategories = useMemo(() => Array.from(new Set(APPLICATIONS_DATA.map((a) => a.category))).sort(), []);

  const [minSignals, setMinSignals] = useState(0);
  const [maxIp, setMaxIp] = useState(100);
  const [sortKey, setSortKey] = useState<'rank' | 'name' | 'signals' | 'ipScore' | 'materialPrice' | 'maturity'>('rank');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  // Composite ranking: maturity 40% · inverse IP density 30% · signals 30%
  const rankedApps = useMemo(() => {
    const maxSig = Math.max(...APPLICATIONS_DATA.map((a) => a.signals));
    return [...APPLICATIONS_DATA]
      .map((a) => ({
        ...a,
        score:
          MATURITY_WEIGHT[a.maturity] * 40 +
          (1 - a.ipScore / 100) * 30 +
          (a.signals / maxSig) * 30,
      }))
      .sort((a, b) => b.score - a.score)
      .map((a, i) => ({ ...a, rank: i + 1 }));
  }, []);

  const signalBounds: [number, number] = [0, Math.max(...APPLICATIONS_DATA.map((a) => a.signals))];
  const rangeActiveCount = (minSignals > 0 ? 1 : 0) + (maxIp < 100 ? 1 : 0);
  const activeFilterCount = rangeActiveCount + (maturityFilter !== 'all' ? 1 : 0);

  const filteredApps = useMemo(() => {
    return rankedApps.filter((a) => {
      if (maturityFilter !== 'all' && a.maturity !== maturityFilter) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (a.signals < minSignals) return false;
      if (a.ipScore > maxIp) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !a.category.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rankedApps, maturityFilter, categoryFilter, minSignals, maxIp, searchQuery]);


  const sortedApps = useMemo(() => {
    const arr = [...filteredApps];
    switch (sortKey) {
      case 'name': arr.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'signals': arr.sort((a, b) => b.signals - a.signals); break;
      case 'ipScore': arr.sort((a, b) => a.ipScore - b.ipScore); break;
      case 'materialPrice': arr.sort((a, b) => b.materialPrice - a.materialPrice); break;
      case 'maturity': arr.sort((a, b) => MATURITY_WEIGHT[b.maturity] - MATURITY_WEIGHT[a.maturity]); break;
      default: arr.sort((a, b) => a.rank - b.rank);
    }
    return arr;
  }, [filteredApps, sortKey]);

  const appTotalPages = Math.max(1, Math.ceil(sortedApps.length / PAGE_SIZE));
  const appStartIdx = (currentPage - 1) * PAGE_SIZE;
  const appEndIdx = Math.min(appStartIdx + PAGE_SIZE, sortedApps.length);
  const pagedApps = sortedApps.slice(appStartIdx, appEndIdx);

  useEffect(() => { setCurrentPage(1); }, [maturityFilter, categoryFilter, minSignals, maxIp, searchQuery, sortKey]);

  const resetRanges = () => { setMinSignals(0); setMaxIp(100); };
  const resetAll = () => { resetRanges(); setSearchQuery(''); setMaturityFilter('all'); setCategoryFilter('all'); };


  // ================= Bubble chart geometry =================
  const CHART_W = 760;
  const CHART_H = 320;
  const M = { top: 22, right: 22, bottom: 42, left: 52 };
  const iw = CHART_W - M.left - M.right;
  const ih = CHART_H - M.top - M.bottom;
  const xMin = 0, xMax = 100;             // Application IP density (0-100)
  const yMin = 0, yMax = Math.ceil(Math.max(...APPLICATIONS_DATA.map((a) => a.marketPlayers)) / 20) * 20;
  const xScale = (v: number) => M.left + ((v - xMin) / (xMax - xMin)) * iw;
  const yScale = (v: number) => M.top + ih - ((v - yMin) / (yMax - yMin)) * ih;
  const xTicks = [0, 25, 50, 75, 100];
  const enriched = useMemo(() =>
    rankedApps.map((a) => ({
      ...a,
      cx: xScale(a.ipScore),
      cy: yScale(a.marketPlayers),
      color: '#0f172a',
    }))
  , [rankedApps]);
  const [hover, setHover] = useState<typeof enriched[number] | null>(null);

  return (
    <>
    <div className="space-y-3">

      {/* ===== Bubble chart: Material price × Market players, colored by maturity ===== */}
      <div className="bg-muted/40 border border-border/60 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Application Landscape</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">IP density × market players</p>
          </div>
        </div>

        <div className="relative">
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-auto block">
            {/* Y gridlines */}
            {Array.from({ length: 5 }, (_, i) => {
              const v = yMin + ((yMax - yMin) / 4) * i;
              return (
                <g key={`gy-${i}`}>
                  <line x1={M.left} x2={M.left + iw} y1={yScale(v)} y2={yScale(v)} stroke="#e2e8f0" strokeDasharray="2 4" />
                  <text x={M.left - 8} y={yScale(v) + 3} textAnchor="end" fontSize={10} fill="#94a3b8" fontFamily="ui-monospace, SFMono-Regular, monospace">{v}</text>
                </g>
              );
            })}
            {/* X gridlines */}
            {xTicks.map((v) => (
              <g key={`gx-${v}`}>
                <line x1={xScale(v)} x2={xScale(v)} y1={M.top} y2={M.top + ih} stroke="#e2e8f0" strokeDasharray="2 4" />
                <text x={xScale(v)} y={M.top + ih + 16} textAnchor="middle" fontSize={10} fill="#94a3b8" fontFamily="ui-monospace, SFMono-Regular, monospace">{v}</text>
              </g>
            ))}
            {/* Axis labels */}
            <text x={M.left + iw / 2} y={CHART_H - 8} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={700} style={{ letterSpacing: '0.20em' }}>IP DENSITY</text>
            <text transform={`rotate(-90 ${16} ${M.top + ih / 2})`} x={16} y={M.top + ih / 2} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={700} style={{ letterSpacing: '0.20em' }}>MARKET PLAYERS</text>

            {/* Bubbles */}
            {enriched.map((d) => {
              const isHover = hover?.name === d.name;
              const dim = hover && !isHover;
              return (
                <g key={d.name} onMouseEnter={() => setHover(d)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer', opacity: dim ? 0.35 : 1, transition: 'opacity 160ms ease' }}>
                  {isHover && (
                    <circle cx={d.cx} cy={d.cy} r={9 + 8} fill={d.color} fillOpacity={0.08} />
                  )}
                  <circle cx={d.cx} cy={d.cy} r={9} fill={d.color} fillOpacity={0.22} stroke={d.color} strokeWidth={1.5} strokeOpacity={0.95} />
                  <circle cx={d.cx - 9 * 0.35} cy={d.cy - 9 * 0.35} r={9 * 0.18} fill="#ffffff" fillOpacity={0.55} />
                  <circle cx={d.cx} cy={d.cy} r={2.5} fill={d.color} fillOpacity={0.95} />
                </g>
              );
            })}
          </svg>

          {hover && (() => {
            const tipW = 250;
            const tipH = 150;
            const W = CHART_W;
            const H = CHART_H;
            let tx = hover.cx + 18;
            let ty = hover.cy - tipH / 2;
            if (tx + tipW > W - 4) tx = hover.cx - tipW - 18;
            if (ty < 4) ty = 4;
            if (ty + tipH > H - 4) ty = H - tipH - 4;
            const leftPct = (tx / W) * 100;
            const topPct = (ty / H) * 100;
            const widthPct = (tipW / W) * 100;
            return (
              <div
                className="absolute rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm shadow-2xl px-3.5 py-3 text-[11px] pointer-events-none"
                style={{ left: `${leftPct}%`, top: `${topPct}%`, width: `${widthPct}%`, boxShadow: '0 20px 40px -12px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.04)' }}
              >
                <div className="mb-2.5">
                  <div className="font-semibold text-slate-900 text-[12px] leading-tight">{hover.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{hover.category}</div>
                </div>
                <div className="space-y-1.5 tabular-nums">
                  <div className="flex items-center justify-between"><span className="text-slate-400 text-[10px] uppercase tracking-wider">Maturity</span><span className="font-semibold text-slate-900">{STAGE_META[hover.maturity].label}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-400 text-[10px] uppercase tracking-wider">Market players</span><span className="font-semibold text-slate-900">{hover.marketPlayers}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-400 text-[10px] uppercase tracking-wider">Top market</span><span className="font-semibold text-slate-900">{hover.topMarket}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-400 text-[10px] uppercase tracking-wider">IP density</span><span className="font-semibold text-slate-900">{hover.ipScore}</span></div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>


    {/* ============= Category highlights ============= */}
    {(() => {
      const byCat = new Map<string, { signals: number; filings: number; research: number; count: number }>();
      APPLICATIONS_DATA.forEach((a) => {
        const cur = byCat.get(a.category) ?? { signals: 0, filings: 0, research: 0, count: 0 };
        cur.signals += a.signals;
        cur.filings += Math.round(a.ipScore * 8.5);
        cur.research += a.researchScore;
        cur.count += 1;
        byCat.set(a.category, cur);
      });
      const cats = Array.from(byCat.entries()).map(([name, v]) => ({ name, ...v, researchAvg: Math.round(v.research / v.count) }));
      const topSignals = [...cats].sort((a, b) => b.signals - a.signals)[0];
      const topIp = [...cats].sort((a, b) => b.filings - a.filings)[0];
      const topResearch = [...cats].sort((a, b) => b.researchAvg - a.researchAvg)[0];

      const byMarket = new Map<string, { count: number; totalIp: number }>();
      APPLICATIONS_DATA.forEach((a) => {
        const cur = byMarket.get(a.topMarket) ?? { count: 0, totalIp: 0 };
        cur.count += 1;
        cur.totalIp += a.ipScore;
        byMarket.set(a.topMarket, cur);
      });
      const markets = Array.from(byMarket.entries()).map(([name, v]) => ({ name, ...v, avgIp: Math.round(v.totalIp / v.count) }));
      const topMarket = [...markets].sort((a, b) => b.avgIp - a.avgIp)[0];
      const minIp = Math.min(...APPLICATIONS_DATA.map((a) => a.ipScore));
      const maxIp = Math.max(...APPLICATIONS_DATA.map((a) => a.ipScore));

      const topApp = [...APPLICATIONS_DATA].sort((a, b) => b.signals - a.signals)[0];
      const tiles: Array<{ label: string; value: string | number; unit: string; tooltip?: string; footer?: React.ReactNode }> = [
        { label: 'Applications', value: APPLICATIONS_DATA.length, unit: 'identified', tooltip: 'Total applications tracked', footer: `Top: ${topApp.name} · ${topApp.signals.toLocaleString()} players` },
        { label: 'Top Market', value: topMarket.name, unit: `${topMarket.count} app${topMarket.count === 1 ? '' : 's'}`, tooltip: 'Top market by average IP density', footer: <span className="font-semibold text-slate-900">avg IP density {topMarket.avgIp}</span> },
        { label: 'IP Density Range', value: `${minIp}–${maxIp}`, unit: 'IP density', footer: 'Across all applications' },
      ];
      return (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-0 rounded-lg border border-border/60 bg-muted/40 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border/60">
          {tiles.map((t) => (
            <div key={t.label} className="px-3 py-2.5">
              {t.tooltip ? (
                <TooltipProvider delayDuration={100}>
                  <UiTooltip>
                    <TooltipTrigger asChild>
                      <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500 cursor-help underline decoration-slate-300 underline-offset-2 decoration-dotted">{t.label}</div>
                    </TooltipTrigger>
                    <UiTooltipContent side="top" className="text-xs">{t.tooltip}</UiTooltipContent>
                  </UiTooltip>
                </TooltipProvider>
              ) : (
                <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{t.label}</div>
              )}
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className={`font-bold tabular-nums text-slate-900 leading-none ${t.label === 'Top Market' ? 'text-base' : 'text-2xl'}`}>{typeof t.value === 'number' ? t.value.toLocaleString() : t.value}</span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{t.unit}</span>
              </div>
              {t.footer && <div className="mt-1 text-[10px] font-medium text-slate-500">{t.footer}</div>}
            </div>
          ))}
        </div>
      );


    })()}



    {/* ============= All Applications — Inline ============= */}
    <div className="mt-4 space-y-3">

        {/* Ranked table */}
        <div className="flex items-center gap-2 flex-wrap justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search application or category…"
              className="h-8 pl-8 !text-[11px] placeholder:!text-[11px] bg-card border-border/60"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded-md border border-border/60 bg-card px-2 text-[12px] text-slate-700"
          >
            <option value="all">All categories</option>
            {appCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
          <table className="w-full text-[12px] table-fixed">
            <colgroup>
              <col style={{ width: '4%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead className="bg-muted/40 border-b border-border/60 text-slate-500 uppercase tracking-widest text-[10px]">
              <tr>
                {([
                  ['rank', '#', 'center', null],
                  ['name', 'Application', 'left', null],
                  ['name', 'Category', 'left', null],
                  ['signals', 'Market Players', 'center', null],
                  ['topMarket', 'Top Market', 'left', null],
                  ['ipScore', 'IP Density', 'center', 'Patent intensity score for this application'],
                  ['maturity', 'Maturity', 'left', null],
                ] as [typeof sortKey, string, 'left' | 'right' | 'center', string | null][]).map(([key, label, align, tooltip]) => (
                  <th key={key} onClick={() => setSortKey(key)}
                    className={`px-4 py-2.5 cursor-pointer select-none font-semibold hover:text-slate-900 whitespace-nowrap ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${sortKey === key ? 'text-slate-900' : ''}`}>
                    {tooltip ? (
                      <TooltipProvider delayDuration={100}>
                        <UiTooltip>
                          <TooltipTrigger asChild>
                            <span className="underline decoration-slate-300 underline-offset-2 decoration-dotted cursor-help">{label}</span>
                          </TooltipTrigger>
                          <UiTooltipContent side="top" className="text-xs">{tooltip}</UiTooltipContent>
                        </UiTooltip>
                      </TooltipProvider>
                    ) : label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedApps.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-slate-500">No applications match these filters.</td></tr>
              ) : (
                pagedApps.map((a) => {
                  return (
                    <tr key={a.name} className="border-b border-border/40 hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 tabular-nums font-medium text-slate-400 text-center">{a.rank}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900 truncate">{a.name}</td>
                      <td className="px-4 py-2.5 text-slate-500 truncate">{a.category}</td>
                      <td className="px-4 py-2.5 tabular-nums font-medium text-center text-slate-700">{a.signals}</td>
                      <td className="px-4 py-2.5 font-medium text-left text-slate-700">{a.topMarket}</td>
                      <td className="px-4 py-2.5 tabular-nums font-medium text-center text-slate-700">
                        <a href={a.url} className="inline-block w-full text-center text-slate-700 hover:text-primary hover:underline underline-offset-2">{a.ipScore}</a>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap"><StagePill stage={a.maturity} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {sortedApps.length > 0 && appTotalPages > 1 && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-100 bg-slate-50/60 text-[11px]">
              <span className="text-slate-500 tabular-nums">
                Showing <span className="font-semibold text-slate-900">{appStartIdx + 1}</span>
                –<span className="font-semibold text-slate-900">{appEndIdx}</span>
                <span className="text-slate-400"> of {sortedApps.length}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 px-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium"
                >
                  Prev
                </button>
                <span className="px-2 tabular-nums text-slate-600">
                  Page <span className="font-semibold text-slate-900">{currentPage}</span> / {appTotalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(appTotalPages, p + 1))}
                  disabled={currentPage === appTotalPages}
                  className="h-7 px-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
    </div>


    </>
  );
};



const ValueChain = () => {
  const { category, topic } = useParams<{category: string;topic: string;}>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Determine default selection based on route category
  const isProductRoute = category === 'Product';
  const isFeedstockRoute = category === 'Feedstock';
  const defaultSelection = isProductRoute ? 'product' : 'feedstock';

  const [activeTab, setActiveTab] = useState(defaultSelection);
  const [selectedTechCategory, setSelectedTechCategory] = useState<string | null>(null);
  const [selectedTechCategoryFilter, setSelectedTechCategoryFilter] = useState<string[]>([]);
  const [currentTechPage, setCurrentTechPage] = useState(1);
  const [techItemsPerPage] = useState(10); // Show 10 technologies per page
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1); // For category-based pagination
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Chemical']);
  const [activeTechTab, setActiveTechTab] = useState(isFeedstockRoute ? 'Fermentation' : 'Fermentation');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedProductCategory, setSelectedProductCategory] = useState<string[]>([]);
  const [selectedMarketCategory, setSelectedMarketCategory] = useState<string[]>([]);
  const [currentMarketPage, setCurrentMarketPage] = useState(0);
  const [selectedTRLFilter, setSelectedTRLFilter] = useState<string[]>([]);

  // New state for enhanced navigation features
  const [marketSearchTerm, setMarketSearchTerm] = useState('');
  const [marketSortBy, setMarketSortBy] = useState<'alphabetical' | 'growth' | 'subcategory'>('alphabetical');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedComparisons, setSelectedComparisons] = useState<string[]>([]);

  // Detect objective from portfolio/localStorage
  const objective = useMemo(() => detectObjective(topic, category), [topic, category]);
  const [expandAllCards, setExpandAllCards] = useState(false);
  const [feedstockSelected, setFeedstockSelected] = useState(!isProductRoute);
  const [productSelected, setProductSelected] = useState(false);
  const [environmentSelected, setEnvironmentSelected] = useState(isProductRoute);
  const [selectedFeedstocks, setSelectedFeedstocks] = useState<string[]>([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);

  // Feedstock filter state
  const [selectedFeedstockCategories, setSelectedFeedstockCategories] = useState<string[]>([]);
  const [selectedFeedstock, setSelectedFeedstock] = useState<string | null>(null);
  const [currentFeedstockPage, setCurrentFeedstockPage] = useState(1);
  const feedstocksPerPage = 5;
  const [selectedMaturityLevels, setSelectedMaturityLevels] = useState<string[]>([]);
  const [feedstockSortKey, setFeedstockSortKey] = useState<string | null>(null);
  const [feedstockSortDir, setFeedstockSortDir] = useState<'asc' | 'desc'>('asc');
  const [techSortKey, setTechSortKey] = useState<string | null>(null);
  const [techSortDir, setTechSortDir] = useState<'asc' | 'desc'>('asc');
  const [appSortKey, setAppSortKey] = useState<string | null>(null);
  const [appSortDir, setAppSortDir] = useState<'asc' | 'desc'>('asc');
  const [prodSortKey, setProdSortKey] = useState<string | null>(null);
  const [prodSortDir, setProdSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentAppPage, setCurrentAppPage] = useState(1);
  const appsPerPage = 5;

  // Resource tab state
  const [resourceTab, setResourceTab] = useState('resources');
  
  const [showProductBrief, setShowProductBrief] = useState(false);
  const [hasBriefData, setHasBriefData] = useState(false);
  const [briefData, setBriefData] = useState<{ materialSpec: string; materialSpecFiles?: { name: string; size: number; dataUrl: string }[]; constraints: string; priorities: string[]; customPriorities: string[]; status: string; notes: string } | null>(null);

  // Check if product brief data exists in localStorage; otherwise seed a sensible default for preview
  useEffect(() => {
    const storageKey = `product-brief-${category}-${topic}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setHasBriefData(true);
      try { setBriefData(JSON.parse(saved)); } catch { setBriefData(null); }
    } else {
      const topicName = decodeURIComponent(topic || '');
      const defaultBrief = {
        materialSpec: '',
        materialSpecFiles: [
          { name: `${topicName.replace(/\s+/g, '_')}_Material_Spec_v2.pdf`, size: 245 * 1024, dataUrl: '' },
          { name: `Quality_Requirements_${topicName.replace(/\s+/g, '_')}_FoodGrade.docx`, size: 128 * 1024, dataUrl: '' },
        ],
        constraints: '1. High production costs (feedstock + energy)\n2. Inhibition during fermentation (process inefficiency)\n3. Product quality and yield limitations',
        priorities: ['Decarbonization', 'Supply Diversification'],
        customPriorities: [],
        status: 'Under Review',
        notes: 'Fermentation efficiency is reduced by inhibition effects, where both the substrate and the produced lactic acid can negatively impact microbial performance.',
      };
      setBriefData(defaultBrief);
      setHasBriefData(true);
    }
  }, [category, topic, showProductBrief]);


  // Show summary only after a card is clicked
  const [showSummary, setShowSummary] = useState(false);

  // View mode: top 3 pathways vs full landscape
  const [showFullLandscape, setShowFullLandscape] = useState(false);

  // Active pathway state for highlighting correlated cards
  const [activePathway, setActivePathway] = useState<{
    type: 'feedstock' | 'technology' | 'market' | null;
    item: string | null;
  }>({ type: null, item: null });

  // Track unread messages for notifications
  const pathwayId = `value-chain-${category}-${topic}`;
  const unreadCount = useUnreadMessages(pathwayId, resourceTab === 'opinions');


  // Feedstock data - conditional on route type
  const feedstockData = isFeedstockRoute ? [
  {
    name: 'High-Fructose Corn Syrup',
    categories: ['Intermediates/precursors'],
    maturity: 'Commercial',
    maturityRating: 4,
    price: '€350-450/ton',
    quantity: '12 million tons/year'
  },
  {
    name: 'Crystalline Fructose',
    categories: ['Bio-based primary feedstocks'],
    maturity: 'Commercial',
    maturityRating: 4,
    price: '€600-900/ton',
    quantity: '0.5 million tons/year'
  },
  {
    name: 'Fruit Processing Waste',
    categories: ['Waste', 'Industrial side-streams'],
    maturity: 'Pilot',
    maturityRating: 3,
    price: '€30-60/ton',
    quantity: '18 million tons/year'
  },
  {
    name: 'Inulin Hydrolysate',
    categories: ['Intermediates/precursors'],
    maturity: 'Pilot',
    maturityRating: 3,
    price: '€400-550/ton',
    quantity: '2.5 million tons/year'
  },
  {
    name: 'Sugar Beet Syrup',
    categories: ['Industrial side-streams'],
    maturity: 'Commercial',
    maturityRating: 4,
    price: '€200-300/ton',
    quantity: '8 million tons/year'
  },
  {
    name: 'Honey By-products',
    categories: ['Bio-based primary feedstocks', 'Industrial side-streams'],
    maturity: 'Lab Scale',
    maturityRating: 2,
    price: '€1,200-2,000/ton',
    quantity: '0.3 million tons/year'
  },
  {
    name: 'Agave Syrup Waste',
    categories: ['Waste', 'Industrial side-streams'],
    maturity: 'Lab Scale',
    maturityRating: 2,
    price: '€80-150/ton',
    quantity: '1.2 million tons/year'
  },
  {
    name: 'Enzymatic Starch Conversion',
    categories: ['Intermediates/precursors'],
    maturity: 'Commercial',
    maturityRating: 4,
    price: '€280-380/ton',
    quantity: '45 million tons/year'
  }] : [
  {
    name: 'Corn Stover',
    categories: ['Biomass', 'Waste'],
    maturity: 'Commercial',
    maturityRating: 4,
    price: '€40-55/ton',
    quantity: '75 million tons/year'
  },
  {
    name: 'Sugarcane Molasses',
    categories: ['Industrial side-streams', 'Bio-based primary feedstocks'],
    maturity: 'Commercial',
    maturityRating: 4,
    price: '€80-120/ton',
    quantity: '62 million tons/year'
  },
  {
    name: 'Fructose',
    categories: ['Intermediates/precursors', 'Bio-based primary feedstocks'],
    maturity: 'Commercial',
    maturityRating: 4,
    price: '€350-600/ton',
    quantity: '12 million tons/year'
  },
  {
    name: 'Whey Permeate',
    categories: ['Industrial side-streams', 'Waste'],
    maturity: 'Commercial',
    maturityRating: 4,
    price: '€150-200/ton',
    quantity: '45 million tons/year'
  },
  {
    name: 'Cassava Starch',
    categories: ['Bio-based primary feedstocks'],
    maturity: 'Commercial',
    maturityRating: 4,
    price: '€250-350/ton',
    quantity: '95 million tons/year'
  },
  {
    name: 'Sugar Beet Pulp',
    categories: ['Biomass', 'Industrial side-streams'],
    maturity: 'Commercial',
    maturityRating: 4,
    price: '€35-50/ton',
    quantity: '14 million tons/year'
  },
  {
    name: 'Wheat Straw',
    categories: ['Biomass', 'Waste'],
    maturity: 'Pilot',
    maturityRating: 3,
    price: '€30-45/ton',
    quantity: '38 million tons/year'
  },
  {
    name: 'Rice Straw',
    categories: ['Biomass', 'Waste'],
    maturity: 'Pilot',
    maturityRating: 3,
    price: '€25-35/ton',
    quantity: '2.8 million tons/year'
  },
  {
    name: 'Food Processing Waste',
    categories: ['Waste', 'Industrial side-streams'],
    maturity: 'Pilot',
    maturityRating: 3,
    price: '€15-30/ton',
    quantity: '88 million tons/year'
  },
  {
    name: 'Bread Waste',
    categories: ['Waste'],
    maturity: 'Lab Scale',
    maturityRating: 2,
    price: '€10-20/ton',
    quantity: '10 million tons/year'
  },
  {
    name: 'CO₂ (via Gas Fermentation)',
    categories: ['Industrial side-streams'],
    maturity: 'Lab Scale',
    maturityRating: 2,
    price: '€20-40/ton',
    quantity: 'Unlimited'
  },
  {
    name: 'Potato Starch Waste',
    categories: ['Industrial side-streams', 'Waste'],
    maturity: 'Pilot',
    maturityRating: 3,
    price: '€25-40/ton',
    quantity: '6.5 million tons/year'
  }];


  // Filter feedstocks based on selected categories and maturity levels
  const filteredFeedstockData = useMemo(() => {
    let filtered = feedstockData;

    if (selectedFeedstockCategories.length > 0) {
      filtered = filtered.filter((feedstock) =>
      feedstock.categories.some((category) => selectedFeedstockCategories.includes(category))
      );
    }

    if (selectedMaturityLevels.length > 0) {
      filtered = filtered.filter((feedstock) =>
      selectedMaturityLevels.includes(feedstock.maturity)
      );
    }

    if (feedstockSortKey) {
      const parseQuantity = (q: string) => {
        if (q === 'Unlimited') return Infinity;
        const match = q.match(/([\d.]+)/);
        return match ? parseFloat(match[1]) : 0;
      };
      const parsePrice = (p: string) => {
        const match = p.match(/€([\d,.]+)/);
        return match ? parseFloat(match[1].replace(',', '')) : 0;
      };
      const playerCounts = [8, 12, 6, 4, 9, 3, 2, 15, 5, 7, 11, 3];
      const statusOrder: Record<string, number> = { 'Commercial': 3, 'Pilot': 2, 'Lab': 1, 'Research': 0 };

      filtered = [...filtered].sort((a, b) => {
        let cmp = 0;
        if (feedstockSortKey === 'quantity') cmp = parseQuantity(a.quantity) - parseQuantity(b.quantity);
        else if (feedstockSortKey === 'price') cmp = parsePrice(a.price) - parsePrice(b.price);
        else if (feedstockSortKey === 'players') {
          const idxA = feedstockData.indexOf(a) % 12;
          const idxB = feedstockData.indexOf(b) % 12;
          cmp = playerCounts[idxA] - playerCounts[idxB];
        }
        else if (feedstockSortKey === 'status') cmp = (statusOrder[a.maturity] || 0) - (statusOrder[b.maturity] || 0);
        return feedstockSortDir === 'asc' ? cmp : -cmp;
      });
    }

    return filtered;
  }, [selectedFeedstockCategories, selectedMaturityLevels, feedstockSortKey, feedstockSortDir]);

  const top3FeedstockNames = isFeedstockRoute 
    ? ['High-Fructose Corn Syrup', 'Sugar Beet Syrup', 'Enzymatic Starch Conversion']
    : ['Corn Stover', 'Sugarcane Molasses', 'Fructose'];
  // Pagination for feedstocks
  const totalFeedstockPages = Math.ceil(filteredFeedstockData.length / feedstocksPerPage);
  const startFeedstockIndex = (currentFeedstockPage - 1) * feedstocksPerPage;
  const endFeedstockIndex = startFeedstockIndex + feedstocksPerPage;
  const currentFeedstocks = filteredFeedstockData.slice(startFeedstockIndex, endFeedstockIndex);

  const handlePreviousFeedstockPage = () => {
    setCurrentFeedstockPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextFeedstockPage = () => {
    setCurrentFeedstockPage((prev) => Math.min(prev + 1, totalFeedstockPages));
  };

  // Technology data - conditional on route type
  const technologyData = isFeedstockRoute ? [
  {
    category: 'Fermentation',
    technologies: [
    { name: 'Homofermentation (Lactobacillus)', status: 'Commercial', trl: 'TRL 9', description: 'High-yield L-lactic acid production from fructose using Lactobacillus' },
    { name: 'Yeast Fermentation (Ethanol)', status: 'Commercial', trl: 'TRL 9', description: 'Anaerobic fermentation of fructose to ethanol by S. cerevisiae' },
    { name: 'Heterofermentation', status: 'Commercial', trl: 'TRL 8-9', description: 'Mixed acid fermentation producing lactic acid and co-products' },
    { name: 'Engineered E. coli Fermentation', status: 'Pilot', trl: 'TRL 6-7', description: 'Metabolically engineered bacteria for succinic acid from fructose' },
    { name: 'Anaerobic Digestion', status: 'Pilot', trl: 'TRL 6-7', description: 'Biogas production through anaerobic fructose conversion' }]
  },
  {
    category: 'Chemical Conversion',
    technologies: [
    { name: 'Acid-Catalysed Dehydration', status: 'Pilot', trl: 'TRL 7', description: 'Fructose dehydration to 5-hydroxymethylfurfural (HMF)' },
    { name: 'Catalytic Hydrogenation', status: 'Commercial', trl: 'TRL 9', description: 'Hydrogenation of fructose to sorbitol and mannitol' },
    { name: 'Isomerisation', status: 'Commercial', trl: 'TRL 9', description: 'Enzymatic or chemical fructose-glucose interconversion' },
    { name: 'Oxidation (Au/TiO₂)', status: 'Lab', trl: 'TRL 4-5', description: 'Selective oxidation of fructose to gluconic/glucaric acid' },
    { name: 'Acid Dehydration + Hydrogenation', status: 'Pilot', trl: 'TRL 6', description: 'Two-step conversion of fructose to levulinic acid' },
    { name: 'Electrochemical Oxidation', status: 'Lab', trl: 'TRL 4', description: 'Electrochemical route to 2,5-furandicarboxylic acid (FDCA)' }]
  },
  {
    category: 'Purification & Separation',
    technologies: [
    { name: 'Chromatographic Separation', status: 'Commercial', trl: 'TRL 9', description: 'High-purity fructose isolation from mixed sugar streams' },
    { name: 'Membrane Filtration', status: 'Commercial', trl: 'TRL 8-9', description: 'Ultrafiltration for product recovery and purification' },
    { name: 'Crystallization', status: 'Commercial', trl: 'TRL 9', description: 'Selective crystallization for pure fructose isolation' },
    { name: 'Reactive Distillation', status: 'Pilot', trl: 'TRL 6-7', description: 'Integrated reaction-separation for HMF and derivatives' }]
  },
  {
    category: 'Enzymatic Processing',
    technologies: [
    { name: 'Glucose Isomerase', status: 'Commercial', trl: 'TRL 9', description: 'Industrial enzyme for glucose-to-fructose conversion' },
    { name: 'Inulinase Hydrolysis', status: 'Commercial', trl: 'TRL 8-9', description: 'Enzymatic breakdown of inulin to fructose' },
    { name: 'Multi-Enzyme Cascade', status: 'Lab', trl: 'TRL 4-5', description: 'Sequential enzyme systems for fructose-derived platform chemicals' }]
  }] : [
  {
    category: 'Fermentation',
    technologies: [
    { name: 'Homofermentation (Lactobacillus)', status: 'Commercial', trl: 'TRL 9', description: 'High-yield L-lactic acid production using Lactobacillus strains' },
    { name: 'Heterofermentation', status: 'Commercial', trl: 'TRL 8-9', description: 'Mixed acid fermentation producing lactic acid and byproducts' },
    { name: 'Simultaneous Saccharification & Fermentation', status: 'Pilot', trl: 'TRL 6-7', description: 'Combined enzymatic hydrolysis and fermentation in one reactor' },
    { name: 'Solid-State Fermentation', status: 'Pilot', trl: 'TRL 6-7', description: 'Fermentation on solid substrates with minimal water' },
    { name: 'Continuous Fermentation (CSTR)', status: 'Pilot', trl: 'TRL 6-7', description: 'Continuous stirred tank reactor for steady-state production' },
    { name: 'Cell-Recycled Fermentation', status: 'Lab', trl: 'TRL 4-5', description: 'Membrane-coupled bioreactors for cell reuse' },
    { name: 'Gas Fermentation (CO₂)', status: 'Research', trl: 'TRL 2-3', description: 'Microbial conversion of CO₂ to lactic acid' },
    { name: 'Engineered Yeast Fermentation', status: 'Lab', trl: 'TRL 4-5', description: 'Genetically modified yeast for low-pH lactic acid production' }]
  },
  {
    category: 'Pretreatment',
    technologies: [
    { name: 'Enzymatic Hydrolysis', status: 'Commercial', trl: 'TRL 8-9', description: 'Breaking down complex carbohydrates using cellulase enzymes' },
    { name: 'Acid Hydrolysis', status: 'Commercial', trl: 'TRL 8-9', description: 'Dilute acid treatment for sugar release from lignocellulosics' },
    { name: 'Steam Explosion', status: 'Commercial', trl: 'TRL 8-9', description: 'High-pressure steam treatment and rapid decompression' },
    { name: 'Alkaline Pretreatment', status: 'Pilot', trl: 'TRL 6-7', description: 'NaOH or lime treatment for lignin removal' },
    { name: 'Organosolv Process', status: 'Pilot', trl: 'TRL 6-7', description: 'Organic solvent-based fractionation of biomass' },
    { name: 'Ionic Liquid Pretreatment', status: 'Lab', trl: 'TRL 4-5', description: 'Dissolution using ionic liquids for biomass deconstruction' }]
  },
  {
    category: 'Purification',
    technologies: [
    { name: 'Reactive Distillation', status: 'Commercial', trl: 'TRL 8-9', description: 'Combined reaction and separation for high-purity lactic acid' },
    { name: 'Membrane Separation', status: 'Commercial', trl: 'TRL 8-9', description: 'Ultrafiltration and nanofiltration for product recovery' },
    { name: 'Ion Exchange Chromatography', status: 'Commercial', trl: 'TRL 8-9', description: 'Resin-based purification and decolorization' },
    { name: 'Electrodialysis', status: 'Pilot', trl: 'TRL 6-7', description: 'Electrically driven membrane separation of lactate' },
    { name: 'Crystallization', status: 'Commercial', trl: 'TRL 8-9', description: 'Purification through controlled crystal formation' },
    { name: 'Molecular Distillation', status: 'Lab', trl: 'TRL 4-5', description: 'Short-path distillation for heat-sensitive lactic acid' }]
  },
  {
    category: 'Polymerization',
    technologies: [
    { name: 'Direct Polycondensation', status: 'Commercial', trl: 'TRL 8-9', description: 'Direct conversion of lactic acid to low-MW PLA' },
    { name: 'Ring-Opening Polymerization', status: 'Commercial', trl: 'TRL 9', description: 'Lactide-based route to high-MW PLA polymers' },
    { name: 'Azeotropic Dehydration', status: 'Pilot', trl: 'TRL 6-7', description: 'Solvent-assisted polycondensation for higher MW' },
    { name: 'Enzymatic Polymerization', status: 'Lab', trl: 'TRL 3-4', description: 'Enzyme-catalyzed green polymerization of lactide' }]
  },
  {
    category: 'Chemical Conversion',
    technologies: [
    { name: 'Esterification', status: 'Commercial', trl: 'TRL 8-9', description: 'Conversion to lactate esters as green solvents' },
    { name: 'Catalytic Dehydration', status: 'Pilot', trl: 'TRL 6-7', description: 'Conversion to acrylic acid via catalytic dehydration' },
    { name: 'Hydrogenation', status: 'Pilot', trl: 'TRL 6-7', description: 'Reduction to propylene glycol using metal catalysts' },
    { name: 'Oxidation', status: 'Lab', trl: 'TRL 4-5', description: 'Selective oxidation to pyruvic acid derivatives' },
    { name: 'Electrochemical Conversion', status: 'Research', trl: 'TRL 2-3', description: 'Electrochemical upgrading of lactate to higher-value chemicals' }]
  }];


  // Market data - conditional on route type
  const marketDataDetail = isFeedstockRoute ? [
  {
    application: 'Food & Beverage',
    totalSize: '€85.2B',
    subcategories: [
    { name: 'Sweetener (HFCS)', maturity: 'High' as const, grade: 'Food-grade', greenPremium: 'Low' as const, description: 'High-fructose corn syrup for soft drinks and processed foods' },
    { name: 'Sorbitol (Food Additive)', maturity: 'High' as const, grade: 'Food-grade', greenPremium: 'Low' as const, description: 'Sugar alcohol used as humectant and sugar substitute' },
    { name: 'Lactic Acid (Food Acidulant)', maturity: 'High' as const, grade: 'Food-grade', greenPremium: 'Medium' as const, description: 'Natural acidulant and preservative from fructose fermentation' }]
  },
  {
    application: 'Platform Chemicals',
    totalSize: '€18.5B',
    subcategories: [
    { name: 'HMF (5-Hydroxymethylfurfural)', maturity: 'Emerging' as const, grade: 'Technical', greenPremium: 'High' as const, description: 'Versatile platform chemical from fructose dehydration' },
    { name: 'Levulinic Acid', maturity: 'Emerging' as const, grade: 'Technical', greenPremium: 'High' as const, description: 'Green solvent precursor and chemical building block' },
    { name: '2,5-FDCA', maturity: 'Low' as const, grade: 'Technical', greenPremium: 'High' as const, description: 'Bio-based monomer for PEF packaging (PET replacement)' }]
  },
  {
    application: 'Bioplastics & Packaging',
    totalSize: '€28.4B',
    subcategories: [
    { name: 'PLA Packaging', maturity: 'High' as const, grade: 'Industrial', greenPremium: 'High' as const, description: 'Fructose → Lactic Acid → PLA for compostable packaging' },
    { name: 'PEF Bottles', maturity: 'Emerging' as const, grade: 'Industrial', greenPremium: 'High' as const, description: 'Fructose → FDCA → PEF as next-gen bio-plastic bottles' },
    { name: 'Biodegradable Films', maturity: 'Emerging' as const, grade: 'Industrial', greenPremium: 'High' as const, description: 'Compostable films from fructose-derived polymers' }]
  },
  {
    application: 'Fuels & Energy',
    totalSize: '€89.1B',
    subcategories: [
    { name: 'Bioethanol', maturity: 'High' as const, grade: 'Fuel-grade', greenPremium: 'Medium' as const, description: 'Fermentative ethanol from fructose for transportation fuel' },
    { name: 'DMF (2,5-Dimethylfuran)', maturity: 'Low' as const, grade: 'Fuel-grade', greenPremium: 'High' as const, description: 'Advanced biofuel from HMF hydrogenation with high energy density' }]
  },
  {
    application: 'Pharmaceuticals & Cosmetics',
    totalSize: '€42.5B',
    subcategories: [
    { name: 'Mannitol (IV Solution)', maturity: 'High' as const, grade: 'Pharma-grade', greenPremium: 'None' as const, description: 'Osmotic diuretic from fructose hydrogenation' },
    { name: 'Gluconic Acid (Cleaning)', maturity: 'High' as const, grade: 'Technical', greenPremium: 'Medium' as const, description: 'Biodegradable chelating and cleaning agent from fructose oxidation' },
    { name: 'Succinic Acid (Cosmetics)', maturity: 'Emerging' as const, grade: 'Cosmetic-grade', greenPremium: 'High' as const, description: 'Bio-based ingredient for skin care formulations' }]
  }] : [
  {
    application: 'Bioplastics & Packaging',
    totalSize: '€28.4B',
    subcategories: [
    { name: 'PLA Packaging', maturity: 'High' as const, grade: 'Industrial', greenPremium: 'High' as const, description: 'Compostable packaging films and containers from polylactic acid' },
    { name: 'Biodegradable Films', maturity: 'Emerging' as const, grade: 'Industrial', greenPremium: 'High' as const, description: 'Thin films for agriculture mulch and food wrap applications' },
    { name: '3D Printing Filaments', maturity: 'Emerging' as const, grade: 'Technical', greenPremium: 'Medium' as const, description: 'PLA-based filaments for additive manufacturing' }]
  },
  {
    application: 'Food & Beverage',
    totalSize: '€85.2B',
    subcategories: [
    { name: 'Food Acidulant', maturity: 'High' as const, grade: 'Food-grade', greenPremium: 'Low' as const, description: 'pH regulator and flavour enhancer in processed foods' },
    { name: 'Preservatives', maturity: 'High' as const, grade: 'Food-grade', greenPremium: 'Low' as const, description: 'Natural antimicrobial preservation for shelf-life extension' },
    { name: 'Fermented Beverages', maturity: 'Emerging' as const, grade: 'Food-grade', greenPremium: 'Medium' as const, description: 'Probiotic and fermented drink formulations' }]
  },
  {
    application: 'Pharmaceuticals & Cosmetics',
    totalSize: '€218B',
    subcategories: [
    { name: 'Excipients & Drug Delivery', maturity: 'High' as const, grade: 'Pharma-grade', greenPremium: 'None' as const, description: 'Biocompatible carriers for controlled drug release' },
    { name: 'Skin Care (AHA)', maturity: 'High' as const, grade: 'Cosmetic-grade', greenPremium: 'High' as const, description: 'Alpha hydroxy acid for exfoliation and anti-aging' },
    { name: 'Bioabsorbable Implants', maturity: 'Emerging' as const, grade: 'Medical-grade', greenPremium: 'Medium' as const, description: 'Resorbable surgical implants and sutures' }]
  },
  {
    application: 'Chemical Intermediates',
    totalSize: '€12.8B',
    subcategories: [
    { name: 'Acrylic Acid Substitute', maturity: 'Emerging' as const, grade: 'Technical', greenPremium: 'High' as const, description: 'Bio-based alternative to petrochemical acrylic acid' },
    { name: 'Propylene Glycol', maturity: 'Emerging' as const, grade: 'Technical', greenPremium: 'Medium' as const, description: 'Green solvent and antifreeze from lactic acid hydrogenation' },
    { name: 'Lactate Esters (Green Solvents)', maturity: 'Low' as const, grade: 'Technical', greenPremium: 'High' as const, description: 'Eco-friendly solvents replacing petroleum-derived alternatives' }]
  },
  {
    application: 'Textiles & Fibers',
    totalSize: '€6.7B',
    subcategories: [
    { name: 'PLA Fibers', maturity: 'Emerging' as const, grade: 'Textile-grade', greenPremium: 'High' as const, description: 'Bio-based fibers for sustainable textile production' },
    { name: 'Nonwoven Fabrics', maturity: 'Low' as const, grade: 'Industrial', greenPremium: 'Medium' as const, description: 'Disposable hygiene and filtration products' },
    { name: 'Sportswear Materials', maturity: 'Low' as const, grade: 'Textile-grade', greenPremium: 'High' as const, description: 'Performance fabrics with moisture-wicking properties' }]
  }];


  // State for expanded categories in inline detail
  const [expandedInlineCategories, setExpandedInlineCategories] = useState<Set<string>>(new Set());

  const toggleInlineCategory = (category: string) => {
    setExpandedInlineCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Helper functions for inline detail sections
  const getCommercialTechCountInline = (category: typeof technologyData[0]) => {
    return category.technologies.filter((tech) => tech.status === 'Commercial').length;
  };

  const maxCommercialCountInline = technologyData.length > 0 ? Math.max(...technologyData.map(getCommercialTechCountInline)) : 0;

  const calculateTotalMarketSizeInline = () => {
    const total = marketDataDetail.reduce((sum, market) => {
      const value = parseFloat(market.totalSize.replace('€', '').replace('B', ''));
      return sum + value;
    }, 0);
    return `€${total.toFixed(1)}B`;
  };

  const getMaturityBadge = (maturity: string) => {
    switch (maturity) {
      case 'High':return { bgClass: 'bg-gradient-to-b from-green-50 to-green-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.08)]', textClass: 'text-green-700' };
      case 'Emerging':return { bgClass: 'bg-gradient-to-b from-amber-50 to-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.08)]', textClass: 'text-amber-700' };
      case 'Low':return { bgClass: 'bg-gradient-to-b from-gray-50 to-gray-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.08)]', textClass: 'text-gray-600' };
      default:return { bgClass: 'bg-gradient-to-b from-gray-50 to-gray-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.08)]', textClass: 'text-gray-600' };
    }
  };

  const getStatusTagStyle = (status: string) => {
    switch (status) {
      case 'Commercial':return 'text-emerald-600 border-emerald-300 bg-white';
      case 'Pilot':return 'text-blue-600 border-blue-300 bg-white';
      case 'Lab':case 'Lab Scale':return 'text-slate-500 border-slate-300 bg-white';
      case 'Research':case 'Research':default:return 'text-amber-600 border-amber-300 bg-white';
    }
  };

  const getGreenPremiumBadge = (premium: string) => {
    switch (premium) {
      case 'High':return { bgClass: 'bg-emerald-100', textClass: 'text-emerald-800' };
      case 'Medium':return { bgClass: 'bg-teal-100', textClass: 'text-teal-800' };
      case 'Low':return { bgClass: 'bg-sky-100', textClass: 'text-sky-800' };
      case 'None':return { bgClass: 'bg-gray-100', textClass: 'text-gray-500' };
      default:return { bgClass: 'bg-gray-100', textClass: 'text-gray-500' };
    }
  };

  const getStatusDisplayInline = (status: string, context?: 'feedstock' | 'technology') => {
    switch (status) {
      case 'Commercial':
        if (context === 'technology') {
          return { text: 'Commercial Use', icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />, bgClass: 'bg-blue-100', textClass: 'text-blue-800', borderClass: 'border-blue-300' };
        }
        return { text: 'Commercial Use', icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />, bgClass: 'bg-green-100', textClass: 'text-green-800', borderClass: 'border-green-300' };
      case 'Pilot':
        return { text: 'Pilot Scale', icon: <AlertCircle className="w-3.5 h-3.5 text-gray-600" />, bgClass: 'bg-gray-100', textClass: 'text-gray-700', borderClass: 'border-gray-300' };
      case 'Lab':
        return { text: 'Lab Research', icon: <TestTube className="w-3.5 h-3.5 text-gray-500" />, bgClass: 'bg-gray-50', textClass: 'text-gray-600', borderClass: 'border-gray-200' };
      case 'Research':
        return { text: 'Early Research', icon: <Sprout className="w-3.5 h-3.5 text-gray-400" />, bgClass: 'bg-white', textClass: 'text-gray-500', borderClass: 'border-gray-200' };
      default:
        return { text: status, icon: null, bgClass: 'bg-gray-100', textClass: 'text-gray-700', borderClass: 'border-gray-300' };
    }
  };

  // Get category color and style
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Biomass':
        return 'px-2 py-1 text-xs rounded-md bg-green-100 text-green-700 border border-green-200';
      case 'Waste':
        return 'px-2 py-1 text-xs rounded-md bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'Industrial side-streams':
        return 'px-2 py-1 text-xs rounded-md bg-orange-100 text-orange-700 border border-orange-200';
      case 'Bio-based primary feedstocks':
        return 'px-2 py-1 text-xs rounded-md bg-blue-100 text-blue-700 border border-blue-200';
      case 'Intermediates/precursors':
        return 'px-2 py-1 text-xs rounded-md bg-purple-100 text-purple-700 border border-purple-200';
      default:
        return 'px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  // Scatter chart data for product analysis
  const scatterData = [
  { name: 'Ethanol', price: 0.65, marketSize: 89.1, marketGrowth: 4.2, category: 'Chemicals' },
  { name: 'Acetic Acid', price: 1.20, marketSize: 15.6, marketGrowth: 3.8, category: 'Chemicals' },
  { name: 'Lactic Acid', price: 1.80, marketSize: 3.9, marketGrowth: 8.5, category: 'Chemicals' },
  { name: 'Citric Acid', price: 1.45, marketSize: 3.2, marketGrowth: 5.4, category: 'Chemicals' },
  { name: 'Succinic Acid', price: 3.20, marketSize: 0.8, marketGrowth: 12.3, category: 'Chemicals' },
  { name: 'Glycerol', price: 1.25, marketSize: 2.8, marketGrowth: 4.1, category: 'Chemicals' },
  { name: 'Industrial Enzymes', price: 15.20, marketSize: 7.0, marketGrowth: 6.2, category: 'Chemicals' },
  { name: 'Bio-based Solvents', price: 2.65, marketSize: 4.2, marketGrowth: 8.7, category: 'Chemicals' },
  { name: 'Platform Chemicals', price: 1.95, marketSize: 89.7, marketGrowth: 5.8, category: 'Chemicals' },
  { name: 'Organic Acids', price: 2.30, marketSize: 8.9, marketGrowth: 7.4, category: 'Chemicals' },
  { name: 'Bioethanol', price: 0.68, marketSize: 65.8, marketGrowth: 6.2, category: 'Fuels' },
  { name: 'Hydrogen', price: 3.50, marketSize: 174, marketGrowth: 9.8, category: 'Fuels' },
  { name: 'Biodiesel', price: 0.95, marketSize: 39.7, marketGrowth: 4.8, category: 'Fuels' },
  { name: 'Biogas', price: 0.45, marketSize: 33.1, marketGrowth: 7.1, category: 'Fuels' },
  { name: 'Methanol', price: 0.38, marketSize: 31.2, marketGrowth: 3.5, category: 'Fuels' },
  { name: 'Renewable Diesel', price: 1.15, marketSize: 65.4, marketGrowth: 8.9, category: 'Fuels' },
  { name: 'Bioplastics', price: 2.45, marketSize: 13.3, marketGrowth: 11.2, category: 'Materials' },
  { name: 'Bio-based Polymers', price: 2.80, marketSize: 20.9, marketGrowth: 9.7, category: 'Materials' },
  { name: 'Biocomposites', price: 4.50, marketSize: 6.2, marketGrowth: 11.8, category: 'Materials' },
  { name: 'Bio-fibers', price: 2.15, marketSize: 4.8, marketGrowth: 6.9, category: 'Materials' },
  { name: 'Natural Rubber', price: 1.85, marketSize: 18.3, marketGrowth: 4.2, category: 'Materials' },
  { name: 'Biomaterials', price: 7.25, marketSize: 5.7, marketGrowth: 10.3, category: 'Materials' },
  { name: 'Animal Feed', price: 0.28, marketSize: 460, marketGrowth: 2.1, category: 'Food & Feed' },
  { name: 'Functional Foods', price: 12.00, marketSize: 279, marketGrowth: 7.3, category: 'Food & Feed' },
  { name: 'Dietary Supplements', price: 18.50, marketSize: 151.9, marketGrowth: 6.8, category: 'Food & Feed' },
  { name: 'Prebiotics', price: 8.75, marketSize: 7.1, marketGrowth: 9.3, category: 'Food & Feed' },
  { name: 'Pectin', price: 4.20, marketSize: 1.4, marketGrowth: 5.7, category: 'Food & Feed' },
  { name: 'Food Additives', price: 6.80, marketSize: 52.8, marketGrowth: 4.9, category: 'Food & Feed' },
  { name: 'Sweeteners', price: 3.95, marketSize: 18.6, marketGrowth: 3.2, category: 'Food & Feed' },
  { name: 'Biofertilizers', price: 3.40, marketSize: 2.9, marketGrowth: 11.5, category: 'Food & Feed' },
  { name: 'Protein Concentrates', price: 9.80, marketSize: 12.4, marketGrowth: 8.2, category: 'Food & Feed' }];


  // Filter scatter data based on selected categories
  const filteredScatterData = selectedProductCategory.length > 0 ?
  scatterData.filter((item) => selectedProductCategory.includes(item.category)) :
  scatterData;

  // Market sectors data with pagination
  const marketSectors = [
  // Page 1 - Primary Sectors
  [
  {
    title: "Food & Feed Applications",
    color: "amber",
    items: [
    { name: "Livestock Nutrition", value: "$460B" },
    { name: "Human Nutrition & Health", value: "$279B" },
    { name: "Food Processing Industry", value: "$151.9B" },
    { name: "Sugar & Sweetener Markets", value: "$85.2B" },
    { name: "Food Preservation", value: "$52.8B" },
    { name: "Functional Food Development", value: "$18.6B" },
    { name: "Nutraceutical Applications", value: "$7.1B" },
    { name: "Food Texture Enhancement", value: "$1.4B" }]

  },
  {
    title: "Chemical Applications",
    color: "violet",
    items: [
    { name: "Industrial Manufacturing", value: "$89.7B" },
    { name: "Pharmaceutical Manufacturing", value: "$15.6B" },
    { name: "Biotechnology Industry", value: "$7.0B" },
    { name: "Specialty Chemical Production", value: "$4.2B" },
    { name: "Polymer & Plastics Industry", value: "$3.9B" },
    { name: "Food & Beverage Processing", value: "$3.2B" },
    { name: "Personal Care Manufacturing", value: "$2.8B" }]

  },
  {
    title: "Material Applications",
    color: "emerald",
    items: [
    { name: "Building & Construction", value: "$1,430B" },
    { name: "Packaging Industry", value: "$1,050B" },
    { name: "Textile Manufacturing", value: "$993B" },
    { name: "Automotive Industry", value: "$20.9B" },
    { name: "Consumer Goods", value: "$13.3B" },
    { name: "Electronics & Technology", value: "$6.2B" }]

  },
  {
    title: "Fuel Applications",
    color: "blue",
    items: [
    { name: "Transportation Sector", value: "$174B" },
    { name: "Industrial Energy", value: "$65.8B" },
    { name: "Aviation Industry", value: "$65.4B" },
    { name: "Marine Transportation", value: "$39.7B" },
    { name: "Residential Heating", value: "$33.1B" }]

  }],

  // Page 2 - Secondary Sectors
  [
  {
    title: "Pharmaceutical Applications",
    color: "rose",
    items: [
    { name: "Drug Development", value: "$218B" },
    { name: "Medical Device Manufacturing", value: "$89.3B" },
    { name: "Health Supplement Industry", value: "$45.7B" },
    { name: "Clinical Research", value: "$23.1B" }]

  },
  {
    title: "Cosmetic Applications",
    color: "pink",
    items: [
    { name: "Beauty & Personal Care", value: "$126B" },
    { name: "Anti-aging Market", value: "$67.8B" },
    { name: "Natural Cosmetics", value: "$34.5B" }]

  },
  {
    title: "Agricultural Applications",
    color: "green",
    items: [
    { name: "Crop Production", value: "$78.9B" },
    { name: "Pest Management", value: "$45.2B" },
    { name: "Soil Health Management", value: "$23.7B" }]

  },
  {
    title: "Environmental Applications",
    color: "teal",
    items: [
    { name: "Environmental Remediation", value: "$56.4B" },
    { name: "Water Treatment Industry", value: "$34.8B" }]

  }]];



  // Filter market sectors based on selected categories
  const filterMarketSectors = (sectors: any[]) => {
    if (selectedMarketCategory.length === 0) return sectors;

    return sectors.filter((sector) => {
      const sectorTitle = sector.title;

      // Direct mapping between legend names and sector titles
      const categoryMapping: Record<string, string[]> = {
        'Fuel Applications': ['Fuel Applications'],
        'Food & Feed Applications': ['Food & Feed Applications'],
        'Material Applications': ['Material Applications'],
        'Environmental Applications': ['Environmental Applications'],
        'Agricultural Applications': ['Agricultural Applications'],
        'Cosmetic Applications': ['Cosmetic Applications'],
        'Pharmaceutical Applications': ['Pharmaceutical Applications'],
        'Chemical Applications': ['Chemical Applications']
      };

      return selectedMarketCategory.some((category) => {
        const matchingSectors = categoryMapping[category] || [];
        return matchingSectors.includes(sectorTitle);
      });
    });
  };

  const allSectors = marketSectors.flat();

  // Enhanced filtering and sorting logic
  const processedSectors = useMemo(() => {
    let sectors = filterMarketSectors(allSectors);

    // Apply search filter
    if (marketSearchTerm) {
      sectors = sectors.filter((sector) =>
      sector.title.toLowerCase().includes(marketSearchTerm.toLowerCase()) ||
      sector.items.some((item) => item.name.toLowerCase().includes(marketSearchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    sectors = [...sectors].sort((a, b) => {
      switch (marketSortBy) {
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'growth':
          // Calculate average growth rate based on market size (simplified)
          const aAvg = a.items.reduce((sum, item) => sum + parseFloat(item.value.replace(/[$B]/g, '')), 0) / a.items.length;
          const bAvg = b.items.reduce((sum, item) => sum + parseFloat(item.value.replace(/[$B]/g, '')), 0) / b.items.length;
          return bAvg - aAvg;
        case 'subcategory':
          return b.items.length - a.items.length;
        default:
          return 0;
      }
    });

    return sectors;
  }, [allSectors, selectedMarketCategory, marketSearchTerm, marketSortBy]);

  // Paginate processed sectors
  const sectorsPerPage = 4; // Show 4 cards (2 rows of 2) per page
  const totalFilteredPages = Math.ceil(processedSectors.length / sectorsPerPage);
  const startIndex = currentMarketPage * sectorsPerPage;
  const currentSectors = processedSectors.slice(startIndex, startIndex + sectorsPerPage);
  const totalPages = totalFilteredPages;

  const nextMarketPage = () => {
    setCurrentMarketPage((prev) => (prev + 1) % totalPages);
  };

  const prevMarketPage = () => {
    setCurrentMarketPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  // Get icon for sector title
  const getSectorIcon = (title: string) => {
    switch (title) {
      case 'Fuel Applications':
        return <Fuel className="w-4 h-4" />;
      case 'Food & Feed Applications':
        return <UtensilsCrossed className="w-4 h-4" />;
      case 'Material Applications':
        return <Layers className="w-4 h-4" />;
      case 'Environmental Applications':
        return <Leaf className="w-4 h-4" />;
      case 'Agricultural Applications':
        return <Wheat className="w-4 h-4" />;
      case 'Cosmetic Applications':
        return <Sparkles className="w-4 h-4" />;
      case 'Pharmaceutical Applications':
        return <Pill className="w-4 h-4" />;
      case 'Chemical Applications':
        return <FlaskConical className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: {[key: string]: {bg: string;border: string;text: string;textSecondary: string;};} = {
      amber: { bg: "bg-amber-50/50", border: "border-amber-200/50", text: "text-amber-700", textSecondary: "text-amber-600" },
      violet: { bg: "bg-violet-50/50", border: "border-violet-200/50", text: "text-violet-700", textSecondary: "text-violet-600" },
      blue: { bg: "bg-blue-50/50", border: "border-blue-200/50", text: "text-blue-700", textSecondary: "text-blue-600" },
      emerald: { bg: "bg-emerald-50/50", border: "border-emerald-200/50", text: "text-emerald-700", textSecondary: "text-emerald-600" },
      rose: { bg: "bg-rose-50/50", border: "border-rose-200/50", text: "text-rose-700", textSecondary: "text-rose-600" },
      pink: { bg: "bg-pink-50/50", border: "border-pink-200/50", text: "text-pink-700", textSecondary: "text-pink-600" },
      green: { bg: "bg-green-50/50", border: "border-green-200/50", text: "text-green-700", textSecondary: "text-green-600" },
      teal: { bg: "bg-teal-50/50", border: "border-teal-200/50", text: "text-teal-700", textSecondary: "text-teal-600" }
    };
    return colorMap[color] || colorMap.amber;
  };

  // Technology pie chart data  
  const technologyPieData = [
  { name: 'Biochemical', value: 25, color: '#1e40af' },
  { name: 'Chemical', value: 18, color: '#2563eb' },
  { name: 'Physicochemical', value: 15, color: '#3b82f6' },
  { name: 'Mechanical', value: 12, color: '#60a5fa' },
  { name: 'Thermomechanical', value: 8, color: '#93c5fd' },
  { name: 'Thermochemical', value: 7, color: '#bfdbfe' },
  { name: 'Physical', value: 5, color: '#dbeafe' },
  { name: 'Hybrid', value: 10, color: '#eff6ff' }];


  // Technology categories data without subgroups
  const techCategories = [
  {
    name: 'Biochemical',
    icon: <Beaker className="w-5 h-5" />,
    color: 'blue',
    technologies: [
    { name: 'Alcoholic Fermentation', maturity: 'commercial', description: 'Conversion of sugars to ethanol using yeast' },
    { name: 'Lactic Acid Fermentation', maturity: 'commercial', description: 'Production of lactic acid through bacterial fermentation' },
    { name: 'Dark Fermentation', maturity: 'pilot', description: 'Anaerobic fermentation for hydrogen production' },
    { name: 'Enzymatic Hydrolysis', maturity: 'commercial', description: 'Use of cellulase enzymes to convert cellulose to glucose' },
    { name: 'Simultaneous Saccharification and Fermentation', maturity: 'commercial', description: 'Combined enzyme treatment and fermentation process' },
    { name: 'Consolidated Bioprocessing', maturity: 'lab', description: 'Single-step process combining cellulase production and fermentation' },
    { name: 'Synthetic Biology Approaches', maturity: 'research', description: 'Engineered microorganisms for enhanced bioconversion' },
    { name: 'Metabolic Engineering', maturity: 'lab', description: 'Modified metabolic pathways for improved yields' }]

  },
  {
    name: 'Chemical',
    icon: <FlaskConical className="w-5 h-5" />,
    color: 'violet',
    technologies: [
    { name: 'Acid Catalysis', maturity: 'commercial', description: 'Use of acid catalysts for biomass conversion' },
    { name: 'Base Catalysis', maturity: 'pilot', description: 'Alkaline catalysts for selective reactions' },
    { name: 'Heterogeneous Catalysis', maturity: 'commercial', description: 'Solid catalysts for continuous processing' },
    { name: 'Hydrolysis Reactions', maturity: 'commercial', description: 'Chemical breakdown using water' },
    { name: 'Oxidation Processes', maturity: 'pilot', description: 'Selective oxidation for value-added products' },
    { name: 'Reduction Reactions', maturity: 'lab', description: 'Chemical reduction for specific compounds' },
    { name: 'Electrochemical Oxidation', maturity: 'lab', description: 'Electrochemical conversion of biomass compounds' },
    { name: 'Electrolysis', maturity: 'pilot', description: 'Electrochemical splitting of compounds' },
    { name: 'Organosolv Process', maturity: 'pilot', description: 'Organic solvent-based delignification process' },
    { name: 'Ionic Liquid Pretreatment', maturity: 'lab', description: 'Novel pretreatment using ionic liquids' }]

  },
  {
    name: 'Physicochemical',
    icon: <Zap className="w-5 h-5" />,
    color: 'emerald',
    technologies: [
    { name: 'Steam Explosion', maturity: 'commercial', description: 'High-temperature steam treatment followed by rapid decompression' },
    { name: 'Ammonia Fiber Explosion', maturity: 'pilot', description: 'Ammonia-based explosive decompression pretreatment' },
    { name: 'Supercritical Fluid Extraction', maturity: 'pilot', description: 'Use of supercritical CO2 for selective extraction' },
    { name: 'Pressurized Liquid Extraction', maturity: 'pilot', description: 'High-pressure liquid extraction at elevated temperatures' },
    { name: 'Microwave-Assisted Extraction', maturity: 'pilot', description: 'Use of microwave energy to enhance extraction processes' }]

  },
  {
    name: 'Mechanical',
    icon: <Settings className="w-5 h-5" />,
    color: 'amber',
    technologies: [
    { name: 'Mechanical Milling', maturity: 'commercial', description: 'Physical size reduction to increase surface area' },
    { name: 'High-Shear Processing', maturity: 'pilot', description: 'Mechanical disruption using high shear forces' },
    { name: 'Compression Processing', maturity: 'pilot', description: 'Mechanical compression to extract valuable compounds' },
    { name: 'Membrane Separation', maturity: 'commercial', description: 'Selective separation using semi-permeable membranes' },
    { name: 'Ultrafiltration', maturity: 'commercial', description: 'Membrane-based size exclusion separation' }]

  },
  {
    name: 'Thermomechanical',
    icon: <GitBranch className="w-5 h-5" />,
    color: 'rose',
    technologies: [
    { name: 'Thermomechanical Pulping', maturity: 'commercial', description: 'Combined heat and mechanical treatment for fiber separation' },
    { name: 'Refiner Mechanical Pulping', maturity: 'commercial', description: 'Mechanical refining at elevated temperatures' },
    { name: 'Thermal Membrane Processing', maturity: 'pilot', description: 'Heat-assisted membrane separation' },
    { name: 'Thermal Screw Processing', maturity: 'pilot', description: 'Continuous thermal and mechanical processing' }]

  },
  {
    name: 'Thermochemical',
    icon: <Fuel className="w-5 h-5" />,
    color: 'orange',
    technologies: [
    { name: 'Fast Pyrolysis', maturity: 'pilot', description: 'Rapid thermal decomposition for bio-oil production' },
    { name: 'Slow Pyrolysis', maturity: 'commercial', description: 'Controlled pyrolysis for biochar production' },
    { name: 'Catalytic Pyrolysis', maturity: 'lab', description: 'Catalyst-enhanced pyrolysis for improved yields' },
    { name: 'Gasification', maturity: 'commercial', description: 'Thermal conversion to produce synthesis gas' },
    { name: 'Torrefaction', maturity: 'pilot', description: 'Mild pyrolysis to improve fuel properties' },
    { name: 'Hydrothermal Processing', maturity: 'lab', description: 'High-temperature water treatment for biomass conversion' },
    { name: 'Plasma Processing', maturity: 'research', description: 'High-energy plasma for biomass conversion' }]

  },
  {
    name: 'Physical',
    icon: <Package className="w-5 h-5" />,
    color: 'cyan',
    technologies: [
    { name: 'Crystallization', maturity: 'commercial', description: 'Purification through controlled crystal formation' },
    { name: 'Phase Separation', maturity: 'commercial', description: 'Separation based on phase behavior' },
    { name: 'Distillation', maturity: 'commercial', description: 'Separation based on volatility differences' },
    { name: 'Centrifugal Separation', maturity: 'commercial', description: 'Physical separation based on density differences' },
    { name: 'Spray Drying', maturity: 'commercial', description: 'Rapid moisture removal through atomization' }]

  },
  {
    name: 'Hybrid',
    icon: <Layers className="w-5 h-5" />,
    color: 'indigo',
    technologies: [
    { name: 'Integrated Biorefineries', maturity: 'pilot', description: 'Multi-process facilities for comprehensive biomass utilization' },
    { name: 'Sequential Processing', maturity: 'lab', description: 'Combined thermal and biological treatments' },
    { name: 'Process Intensification', maturity: 'lab', description: 'Combining multiple processes for improved efficiency' },
    { name: 'Cascade Processing', maturity: 'pilot', description: 'Sequential processing to maximize value extraction' },
    { name: 'Microbial Fuel Cells', maturity: 'research', description: 'Bioelectrochemical systems for energy and chemicals' },
    { name: 'Bioelectrosynthesis', maturity: 'research', description: 'Electrochemical-biological hybrid systems' },
    { name: 'Multi-Product Biorefineries', maturity: 'lab', description: 'Simultaneous production of multiple products' },
    { name: 'AI-Optimized Processing', maturity: 'research', description: 'Machine learning-enhanced bioprocessing' }]

  }];


  const getMaturityStars = (maturity: string) => {
    switch (maturity) {
      case 'research':return 1;
      case 'lab':return 2;
      case 'pilot':return 3;
      case 'commercial':return 4;
      default:return 0;
    }
  };

  const renderTechnologyStars = (maturity: string, category: string) => {
    const starCount = getMaturityStars(maturity);

    const getStarColor = (category: string) => {
      switch (category) {
        case 'Chemical':return 'text-violet-500';
        case 'Biochemical':return 'text-blue-500';
        case 'Physicochemical':return 'text-emerald-500';
        case 'Mechanical':return 'text-amber-500';
        case 'Thermomechanical':return 'text-rose-500';
        case 'Thermochemical':return 'text-orange-500';
        case 'Physical':return 'text-cyan-500';
        case 'Hybrid':return 'text-indigo-500';
        default:return 'text-slate-700';
      }
    };

    return (
      <span className="inline-flex items-center gap-0.5">
        {[...Array(4)].map((_, index) =>
        <span
          key={index}
          className={`text-sm ${
          index < starCount ?
          getStarColor(category) :
          'text-gray-300'}`
          }>

            ★
          </span>
        )}
      </span>);

  };

  const handlePieClick = (data: any) => {
    if (data && data.name) {
      setSelectedTechCategory(data.name);
    }
  };

  const handleProductClick = (productName: string) => {
    setSelectedProduct(selectedProduct === productName ? null : productName);
  };

  const handleProductCategoryClick = (categoryName: string) => {
    setSelectedProductCategory((prev) =>
    prev.includes(categoryName) ?
    prev.filter((cat) => cat !== categoryName) :
    [...prev, categoryName]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Chemicals':return 'bg-violet-50 border-violet-300';
      case 'Fuels':return 'bg-blue-50 border-blue-300';
      case 'Materials':return 'bg-emerald-50 border-emerald-300';
      case 'Food':return 'bg-amber-50 border-amber-300';
      default:return 'bg-muted/30 border-border';
    }
  };

  const handleBack = () => {
    navigate(`/landscape/${category}/${topic}/value-chain`);
  };

  // Define pathway connections
  const pathwayConnections = {
    feedstock: {
      'Sugarcane Molasses': ['Fermentation', 'Hydrolysis'],
      'Corn Stover': ['Hydrolysis', 'Gasification'],
      'Wheat Straw': ['Fermentation', 'Gasification', 'Pyrolysis'],
      'Bagasse': ['Fermentation', 'Pyrolysis'],
      'Rice Husk': ['Gasification', 'Pyrolysis'],
      'Wood Chips': ['Gasification', 'Catalysis'],
      'Algae': ['Extraction', 'Fermentation'],
      'Switchgrass': ['Pyrolysis', 'Gasification'],
      'Miscanthus': ['Fermentation', 'Hydrolysis'],
      'Hemp': ['Extraction', 'Pyrolysis'],
      'Sorghum': ['Fermentation', 'Hydrolysis'],
      'Cassava': ['Fermentation', 'Hydrolysis']
    },
    technology: {
      'Fermentation': ['Pharmaceuticals', 'Food & Beverage', 'Biofuels'],
      'Hydrolysis': ['Chemicals', 'Food & Beverage', 'Biofuels'],
      'Gasification': ['Biofuels', 'Energy', 'Chemicals'],
      'Pyrolysis': ['Biofuels', 'Chemicals', 'Agriculture'],
      'Catalysis': ['Chemicals', 'Pharmaceuticals'],
      'Extraction': ['Cosmetics', 'Pharmaceuticals', 'Food & Beverage'],
      'Purification': ['Pharmaceuticals', 'Cosmetics'],
      'Synthesis': ['Chemicals', 'Pharmaceuticals', 'Materials']
    },
    market: {
      'Pharmaceuticals': ['Fermentation', 'Extraction', 'Purification', 'Catalysis', 'Synthesis'],
      'Food & Beverage': ['Fermentation', 'Hydrolysis', 'Extraction'],
      'Cosmetics': ['Extraction', 'Purification'],
      'Biofuels': ['Fermentation', 'Hydrolysis', 'Gasification', 'Pyrolysis'],
      'Chemicals': ['Hydrolysis', 'Gasification', 'Pyrolysis', 'Catalysis', 'Synthesis'],
      'Animal Feed': ['Hydrolysis', 'Fermentation'],
      'Packaging': ['Pyrolysis', 'Synthesis'],
      'Textiles': ['Extraction', 'Synthesis'],
      'Agriculture': ['Pyrolysis', 'Fermentation'],
      'Construction': ['Pyrolysis', 'Synthesis'],
      'Energy': ['Gasification', 'Pyrolysis'],
      'Transportation': ['Gasification', 'Biofuels']
    }
  };

  // Get reverse connections (from technology to feedstock)
  const getReverseConnections = (tech: string): string[] => {
    const feedstocks: string[] = [];
    Object.entries(pathwayConnections.feedstock).forEach(([feedstock, technologies]) => {
      if (technologies.includes(tech)) {
        feedstocks.push(feedstock);
      }
    });
    return feedstocks;
  };

  // Determine if an item should be highlighted based on active pathway
  const isItemHighlighted = (type: 'feedstock' | 'technology' | 'market', item: string): boolean => {
    if (!activePathway.type || !activePathway.item) return false;

    if (activePathway.type === 'feedstock') {
      if (type === 'feedstock') return item === activePathway.item;
      if (type === 'technology') return pathwayConnections.feedstock[activePathway.item]?.includes(item) || false;
      if (type === 'market') {
        const connectedTechs = pathwayConnections.feedstock[activePathway.item] || [];
        return connectedTechs.some((tech) => pathwayConnections.technology[tech]?.includes(item));
      }
    } else if (activePathway.type === 'technology') {
      if (type === 'feedstock') return getReverseConnections(activePathway.item).includes(item);
      if (type === 'technology') return item === activePathway.item;
      if (type === 'market') return pathwayConnections.technology[activePathway.item]?.includes(item) || false;
    } else if (activePathway.type === 'market') {
      if (type === 'market') return item === activePathway.item;
      if (type === 'technology') return pathwayConnections.market[activePathway.item]?.includes(item) || false;
      if (type === 'feedstock') {
        const connectedTechs = pathwayConnections.market[activePathway.item] || [];
        return connectedTechs.some((tech) => getReverseConnections(tech).includes(item));
      }
    }

    return false;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Chemicals':return <TestTube className="w-4 h-4 text-violet-500" />;
      case 'Fuels':return <Zap className="w-4 h-4 text-blue-500" />;
      case 'Materials':return <Box className="w-4 h-4 text-emerald-500" />;
      case 'Food & Feed':return <UtensilsCrossed className="w-4 h-4 text-amber-500" />;
      default:return null;
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
    prev.includes(category) ?
    prev.filter((cat) => cat !== category) :
    [...prev, category]
    );
  };

  // New handler functions for enhanced features
  const handleComparisonToggle = (sectorTitle: string) => {
    if (!comparisonMode) return;

    setSelectedComparisons((prev) => {
      if (prev.includes(sectorTitle)) {
        return prev.filter((title) => title !== sectorTitle);
      } else if (prev.length < 3) {
        return [...prev, sectorTitle];
      }
      return prev;
    });
  };

  const calculateTotalMarketSize = () => {
    return processedSectors.
    filter((sector) => selectedMarketCategory.length === 0 || selectedMarketCategory.some((cat) => sector.title.includes(cat))).
    reduce((total, sector) => {
      const sectorTotal = sector.items.reduce((sum, item) => {
        const value = parseFloat(item.value.replace(/[$B]/g, ''));
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
      return total + sectorTotal;
    }, 0);
  };

  const resetComparison = () => {
    setComparisonMode(false);
    setSelectedComparisons([]);
  };

  const handleTechCategoryClick = (category: string) => {
    setSelectedTechCategoryFilter((prev) =>
    prev.includes(category) ?
    prev.filter((cat) => cat !== category) :
    [...prev, category]
    );
    // Reset to first page when filters change
    setCurrentTechPage(1);
    setCurrentCategoryPage(1);
  };

  const getTechCategoryColors = (categoryName: string) => {
    const category = techCategories.find((cat) => cat.name === categoryName);
    if (!category) return {
      bg: 'bg-gray-500', hover: 'hover:bg-gray-600', text: 'text-white', border: 'border-gray-500',
      hoverBg: 'bg-gray-50 hover:bg-gray-100', unselectedText: 'text-gray-700'
    };

    switch (category.color) {
      case 'blue':
        return {
          bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-white', border: 'border-blue-500',
          hoverBg: 'bg-blue-50 hover:bg-blue-100', unselectedText: 'text-blue-700'
        };
      case 'violet':
        return {
          bg: 'bg-violet-500', hover: 'hover:bg-violet-600', text: 'text-white', border: 'border-violet-500',
          hoverBg: 'bg-violet-50 hover:bg-violet-100', unselectedText: 'text-violet-700'
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', text: 'text-white', border: 'border-emerald-500',
          hoverBg: 'bg-emerald-50 hover:bg-emerald-100', unselectedText: 'text-emerald-700'
        };
      case 'amber':
        return {
          bg: 'bg-amber-500', hover: 'hover:bg-amber-600', text: 'text-white', border: 'border-amber-500',
          hoverBg: 'bg-amber-50 hover:bg-amber-100', unselectedText: 'text-amber-700'
        };
      case 'rose':
        return {
          bg: 'bg-rose-500', hover: 'hover:bg-rose-600', text: 'text-white', border: 'border-rose-500',
          hoverBg: 'bg-rose-50 hover:bg-rose-100', unselectedText: 'text-rose-700'
        };
      case 'orange':
        return {
          bg: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-white', border: 'border-orange-500',
          hoverBg: 'bg-orange-50 hover:bg-orange-100', unselectedText: 'text-orange-700'
        };
      case 'cyan':
        return {
          bg: 'bg-cyan-500', hover: 'hover:bg-cyan-600', text: 'text-white', border: 'border-cyan-500',
          hoverBg: 'bg-cyan-50 hover:bg-cyan-100', unselectedText: 'text-cyan-700'
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-500', hover: 'hover:bg-indigo-600', text: 'text-white', border: 'border-indigo-500',
          hoverBg: 'bg-indigo-50 hover:bg-indigo-100', unselectedText: 'text-indigo-700'
        };
      default:
        return {
          bg: 'bg-gray-500', hover: 'hover:bg-gray-600', text: 'text-white', border: 'border-gray-500',
          hoverBg: 'bg-gray-50 hover:bg-gray-100', unselectedText: 'text-gray-700'
        };
    }
  };

  const getTechCategoryIcon = (category: string) => {
    const categoryData = techCategories.find((cat) => cat.name === category);
    const colorClass = categoryData ? `text-${categoryData.color}-500` : 'text-gray-500';

    switch (category) {
      case 'Biochemical':return <Beaker className={`w-4 h-4 ${colorClass}`} />;
      case 'Chemical':return <TestTube className={`w-4 h-4 ${colorClass}`} />;
      case 'Physicochemical':return <FlaskConical className={`w-4 h-4 ${colorClass}`} />;
      case 'Mechanical':return <Settings className={`w-4 h-4 ${colorClass}`} />;
      case 'Thermomechanical':return <Zap className={`w-4 h-4 ${colorClass}`} />;
      case 'Thermochemical':return <Fuel className={`w-4 h-4 ${colorClass}`} />;
      case 'Physical':return <Box className={`w-4 h-4 ${colorClass}`} />;
      case 'Hybrid':return <GitBranch className={`w-4 h-4 ${colorClass}`} />;
      default:return null;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-sm">{data.name}</p>
          <p className="text-xs text-gray-600">Price: ${data.price}/kg</p>
          <p className="text-xs text-gray-600">Market Size: ${data.marketSize}B</p>
          <p className="text-xs text-gray-600">Growth Rate: {data.marketGrowth}%</p>
        </div>);

    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload) return null;

    let color;
    switch (payload.category) {
      case 'Chemicals':
        color = '#8b5cf6';
        break;
      case 'Fuels':
        color = '#3b82f6';
        break;
      case 'Materials':
        color = '#10b981';
        break;
      case 'Food & Feed':
        color = '#f59e0b';
        break;
      default:
        color = '#6b7280';
    }

    return (
      <circle
        cx={cx}
        cy={cy}
        r={selectedProduct === payload.name ? 8 : 6}
        fill={color}
        fillOpacity={selectedProduct === payload.name ? 1 : 0.7}
        stroke={selectedProduct === payload.name ? '#000' : color}
        strokeWidth={selectedProduct === payload.name ? 2 : 1}
        style={{ cursor: 'pointer' }}
        onClick={() => handleProductClick(payload.name)} />);


  };

  // Opportunity map selected category
  // Default opportunity tab excludes the anchor category
  const defaultOpportunityTab = isFeedstockRoute ? 'technologies' : 'feedstocks';
  const [opportunityTab, setOpportunityTab] = useState<'feedstocks' | 'technologies' | 'products' | 'applications' | null>(defaultOpportunityTab as any);
  const [hoveredPathwayIdx, setHoveredPathwayIdx] = useState<number | null>(null);
  const [selectedOpportunityItems, setSelectedOpportunityItems] = useState<Set<string>>(new Set());

  const handleOpportunityTabChange = (tab: 'feedstocks' | 'technologies' | 'products' | 'applications') => {
    setOpportunityTab(tab);
    setSelectedOpportunityItems(new Set());
  };

  const toggleOpportunityItem = (name: string) => {
    setSelectedOpportunityItems(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleExploreFilteredPathways = () => {
    const filterType = opportunityTab === 'feedstocks' ? 'feedstock' : opportunityTab === 'technologies' ? 'technology' : opportunityTab === 'products' ? 'product' : 'application';
    const params = new URLSearchParams();
    params.set('filterType', filterType);
    params.set('filterValues', Array.from(selectedOpportunityItems).join('||'));
    navigate(`/landscape/${category}/${topic}/value-chain/pathways?${params.toString()}`);
  };

  const technologyItems = technologyData.flatMap((categoryGroup) => categoryGroup.technologies);
  const flatTechnologiesBase = technologyData.flatMap((categoryGroup) =>
  categoryGroup.technologies.map((tech) => ({ ...tech, category: categoryGroup.category }))
  );
  const flatTechnologies = useMemo(() => {
    if (!techSortKey) return flatTechnologiesBase;
    const statusOrder: Record<string, number> = { 'Commercial': 3, 'Pilot': 2, 'Lab': 1, 'Research': 0 };
    return [...flatTechnologiesBase].sort((a, b) => {
      const cmp = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
      return techSortDir === 'asc' ? cmp : -cmp;
    });
  }, [flatTechnologiesBase, techSortKey, techSortDir]);
  const top3TechNames = ['Acid Hydrolysis', 'Enzymatic Hydrolysis', 'Steam Explosion'];
  const techPerPage = 5;
  const totalTechPages = Math.ceil(flatTechnologies.length / techPerPage);
  const startTechIndex = (currentTechPage - 1) * techPerPage;
  const currentTechnologies = flatTechnologies.slice(startTechIndex, startTechIndex + techPerPage);

  const flatApplicationsBase = marketDataDetail.flatMap((market) =>
  market.subcategories.map((sub) => ({ ...sub, category: market.application, totalSize: market.totalSize }))
  );
  const flatApplications = useMemo(() => {
    if (!appSortKey) return flatApplicationsBase;
    const playerCounts = [14, 22, 8, 6, 18, 3, 10, 5, 12, 7, 9, 16, 4, 11, 2];
    const maturityOrder: Record<string, number> = { 'High': 3, 'Medium': 2, 'Emerging': 1, 'Growing': 1 };
    return [...flatApplicationsBase].sort((a, b) => {
      let cmp = 0;
      if (appSortKey === 'players') {
        const idxA = flatApplicationsBase.indexOf(a) % 15;
        const idxB = flatApplicationsBase.indexOf(b) % 15;
        cmp = playerCounts[idxA] - playerCounts[idxB];
      } else if (appSortKey === 'maturity') {
        cmp = (maturityOrder[a.maturity] || 0) - (maturityOrder[b.maturity] || 0);
      }
      return appSortDir === 'asc' ? cmp : -cmp;
    });
  }, [flatApplicationsBase, appSortKey, appSortDir]);
  const top3AppNames = ['PLA Packaging', 'Food Acidulant', 'Skin Care (AHA)'];
  const totalAppPages = Math.ceil(flatApplications.length / appsPerPage);
  const startAppIndex = (currentAppPage - 1) * appsPerPage;
  const currentApplications = flatApplications.slice(startAppIndex, startAppIndex + appsPerPage);

  const stageCounts = { Commercial: 0, Pilot: 0, Lab: 0, Research: 0 };
  technologyItems.forEach((tech) => {
    if (tech.status === 'Commercial') stageCounts.Commercial++;else
    if (tech.status === 'Pilot') stageCounts.Pilot++;else
    if (tech.status === 'Lab') stageCounts.Lab++;else
    stageCounts.Research++;
  });
  const trlDistributionData = [
  { stage: 'Commercial', count: stageCounts.Commercial, fill: 'hsl(142, 71%, 45%)' },
  { stage: 'Pilot', count: stageCounts.Pilot, fill: 'hsl(217, 91%, 60%)' },
  { stage: 'Lab', count: stageCounts.Lab, fill: 'hsl(220, 9%, 46%)' },
  { stage: 'Research', count: stageCounts.Research, fill: 'hsl(220, 9%, 70%)' }];


  // Key facts data
  const keyFacts = [
  { label: 'Producers', value: '520+' },
  { label: 'Off-take Signals', value: '142 signed' },
  { label: 'Projects', value: '680+' },
  { label: 'Patents', value: '1,240+' },
  { label: 'Research Publications', value: '3,800+' }];

  return (
    <>
      <div className="h-full bg-background flex flex-col" key="value-chain-layout">
        <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => navigate('/')}>
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>
          <Button
            size="sm"
            className="gap-1.5 h-7 text-xs bg-foreground text-background hover:bg-foreground/90"
            onClick={() => navigate(`/landscape/${category}/${topic}/value-chain/pathways`)}
          >
            Explore Pathways
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Main layout: Left content + Right sidebar */}
        <div className="max-w-[1400px] w-full mx-auto px-6 pb-6 flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="grid gap-x-5 gap-y-1.5 items-start flex-shrink-0" style={{ gridTemplateColumns: 'minmax(0, 1fr) 280px' }}>
            {/* Titles row */}
            <div>
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{topic === 'Sulphuric Acid' ? 'Material Brief' : 'Overview'}</h2>
            </div>
            <div>
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Knowledge Base</h2>
            </div>

          </div>

          <div className="grid gap-x-5 gap-y-1.5 flex-1 min-h-0 mt-3" style={{ gridTemplateColumns: 'minmax(0, 1fr) 280px' }}>
            {/* LEFT column: Hero + Opportunity Map */}
            <div className="min-w-0 space-y-3 overflow-y-auto h-full pr-1 pb-6 relative">
              {topic === 'Sulphuric Acid' ? (
                <>
                  <MaterialBriefForm topic={topic} category={category || 'Product'} />
                  <MaterialBriefOutline />
                </>
              ) : (<>
              {/* Outer white card wrapping Hero + Pathway Readiness + Opportunity Map */}
              <div className="space-y-4">
                <MaterialProfileHero
                  decodedTopic={decodeURIComponent(topic || '')}
                  cat={category || 'Product'}
                  objective={objective}
                  category={category}
                  isFeedstockRoute={isFeedstockRoute}
                  showProductBrief={showProductBrief}
                  setShowProductBrief={setShowProductBrief}
                  topic={topic}
                />


                {/* Headless MaterialBriefForm — provides the guided wizard dialog; opened from the hero card above */}
                <MaterialBriefForm topic={decodeURIComponent(topic || '')} category={category || 'Product'} headerless />






              <BriefCardsRow category={category} topic={topic} navigate={navigate} />



              </div>
              </>)}
            </div>

            {/* Right Sidebar — fixed within column, scrolls internally only if needed */}
             <div className="space-y-1.5 h-full overflow-y-auto pb-6 pr-1">

                <>
                  {(() => {
                    const locked = topic === 'Sulphuric Acid';
                    const baseBtn = "w-full rounded-lg border border-border/60 bg-card px-4 py-3 text-left transition-colors";
                    const lockedCls = "opacity-50 cursor-not-allowed";
                    const enabledCls = "hover:border-primary/40";
                    return (
                    <>
                      <button
                        disabled={locked}
                        onClick={() => !locked && navigate(`/landscape/${category}/${topic}/market-activity`)}
                        className={`${baseBtn} ${locked ? lockedCls : enabledCls}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-foreground">Market Players</span>
                          {!locked && <span className="text-xs font-bold text-primary tabular-nums">1,384</span>}
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Companies & startups across the value chain</p>
                      </button>

                      <button
                        disabled={locked}
                        onClick={() => !locked && navigate(`/landscape/${category}/${topic}/patents`)}
                        className={`${baseBtn} ${locked ? lockedCls : enabledCls}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-foreground">IP Landscape</span>
                          {!locked && <span className="text-xs font-bold text-primary tabular-nums">{isProductRoute ? '890' : '1,240'}</span>}
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Patents & intellectual property filings</p>
                      </button>

                      <button
                        disabled={locked}
                        onClick={() => !locked && navigate(`/landscape/${category}/${topic}/publications`)}
                        className={`${baseBtn} ${locked ? lockedCls : enabledCls}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-foreground">Research Landscape</span>
                          {!locked && <span className="text-xs font-bold text-primary tabular-nums">{isProductRoute ? '2,150' : '3,800'}</span>}
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Scientific publications & academic research</p>
                      </button>

                      <button disabled className="w-full rounded-lg border border-border/40 bg-card px-4 py-3 text-left opacity-50 cursor-default">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-foreground">Regulation</span>
                          <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground font-normal">Soon</Badge>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Regulatory frameworks & compliance</p>
                      </button>

                      {!locked && (
                        <div className="pt-1">
                          <p className="text-[9px] text-muted-foreground/60 text-right"><span className="font-semibold text-muted-foreground/80">5,560+</span> records | Updated Sep 2025</p>
                        </div>
                      )}
                    </>
                    );
                  })()}
                </>
            </div>
          </div>
        </div>
      </div>
    </>
  );

};


export default ValueChain;