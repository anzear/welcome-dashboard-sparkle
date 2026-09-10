import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Bookmark, ExternalLink, Info, Bell, BellOff, FlaskConical, ScrollText, Rocket, Factory, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PathwayResourcesTab from "@/components/PathwayResourcesTab";
import PathwayFlowPopover from "@/components/PathwayFlowPopover";
import PathwayOpinionsTab from "@/components/PathwayOpinionsTab";
import PathwayUserInputSection from "@/components/PathwayUserInputSection";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import PathwayValidationSpace from '@/components/PathwayValidationSpace';
import PathwayProfileGroups from '@/components/PathwayProfileGroups';


const PathwayDetail = () => {
  const { pathwayId, category, topic } = useParams<{pathwayId: string;category: string;topic: string;}>();
  const navigate = useNavigate();
  const [activeOpinionsTab, setActiveOpinionsTab] = useState(false);
  const [evaluationTab, setEvaluationTab] = useState<'evaluation' | 'updates' | 'company'>('evaluation');

  // State for favorites and saves
  const pathwayIndex = parseInt(pathwayId || "0");
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscriptionKey = `${topic || ''}_${pathwayId || ''}`;
  const readUpdatesKey = `pathwayReadUpdates_${subscriptionKey}`;

  // Mock updates (stable list with ids so read-state can be tracked)
  const pathwayUpdates = React.useMemo(() => ([
    { id: 'u1', cat: 'Research', title: 'New catalytic process improves yield by 18%', source: 'Nature Catalysis', date: '2d ago', tone: 'blue' },
    { id: 'u2', cat: 'Patents', title: 'EP4123456 — Continuous fermentation process filed', source: 'EPO', date: '5d ago', tone: 'purple' },
    { id: 'u3', cat: 'Projects', title: 'Horizon Europe grant awarded to consortium (€8.4M)', source: 'CORDIS', date: '1w ago', tone: 'emerald' },
    { id: 'u4', cat: 'Commercial', title: 'Demo plant commissioned in Rotterdam', source: 'Company Press Release', date: '2w ago', tone: 'amber' },
    { id: 'u5', cat: 'Market', title: 'Feedstock spot price down 6% QoQ in EU markets', source: 'IndexMundi', date: '3w ago', tone: 'orange' },
    { id: 'u6', cat: 'Research', title: 'Life-cycle assessment shows 42% lower GHG vs. baseline', source: 'J. Cleaner Production', date: '4w ago', tone: 'blue' },
  ]), []);

  const [readUpdates, setReadUpdates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(readUpdatesKey);
    setReadUpdates(stored ? new Set(JSON.parse(stored)) : new Set());
  }, [readUpdatesKey]);

  const markUpdateRead = (id: string) => {
    setReadUpdates(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(readUpdatesKey, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const markAllUpdatesRead = () => {
    const allIds = pathwayUpdates.map(u => u.id);
    const next = new Set(allIds);
    setReadUpdates(next);
    localStorage.setItem(readUpdatesKey, JSON.stringify(allIds));
  };

  const unreadUpdatesCount = pathwayUpdates.filter(u => !readUpdates.has(u.id)).length;

  // Load favorite and save states from localStorage
  useEffect(() => {
    const favoritedPathways = localStorage.getItem('favoritedPathways');
    const savedPathways = localStorage.getItem('savedPathways');
    const subs = localStorage.getItem('pathwayUpdateSubscriptions');

    if (favoritedPathways) {
      const favorited = new Set(JSON.parse(favoritedPathways));
      setIsFavorited(favorited.has(pathwayIndex));
    }

    if (savedPathways) {
      const saved = new Set(JSON.parse(savedPathways));
      setIsSaved(saved.has(pathwayIndex));
    }

    if (subs) {
      const set = new Set(JSON.parse(subs));
      setIsSubscribed(set.has(subscriptionKey));
    }
  }, [pathwayIndex, subscriptionKey]);

  const toggleSubscription = () => {
    const subs = localStorage.getItem('pathwayUpdateSubscriptions');
    const set = subs ? new Set(JSON.parse(subs)) : new Set();
    if (set.has(subscriptionKey)) {
      set.delete(subscriptionKey);
      setIsSubscribed(false);
      toast.success('Notifications turned off for this pathway');
    } else {
      set.add(subscriptionKey);
      setIsSubscribed(true);
      toast.success('You will be notified of new updates for this pathway');
    }
    localStorage.setItem('pathwayUpdateSubscriptions', JSON.stringify(Array.from(set)));
  };

  const toggleFavorite = () => {
    const favoritedPathways = localStorage.getItem('favoritedPathways');
    const favorited = favoritedPathways ? new Set(JSON.parse(favoritedPathways)) : new Set();

    if (favorited.has(pathwayIndex)) {
      favorited.delete(pathwayIndex);
      setIsFavorited(false);
    } else {
      favorited.add(pathwayIndex);
      setIsFavorited(true);
    }

    localStorage.setItem('favoritedPathways', JSON.stringify(Array.from(favorited)));
  };

  const toggleSave = () => {
    const savedPathways = localStorage.getItem('savedPathways');
    const saved = savedPathways ? new Set(JSON.parse(savedPathways)) : new Set();

    if (saved.has(pathwayIndex)) {
      saved.delete(pathwayIndex);
      setIsSaved(false);
    } else {
      saved.add(pathwayIndex);
      setIsSaved(true);
    }

    localStorage.setItem('savedPathways', JSON.stringify(Array.from(saved)));
  };

  // Get pathway data from localStorage
  const getPathwayData = () => {
    const customPathways = localStorage.getItem('customPathways');
    const allPathways = customPathways ? JSON.parse(customPathways) : [];

    // Predefined pathways would be loaded here too
    const decodedTopic = topic ? decodeURIComponent(topic) : 'Lactic Acid';
    const PREDEFINED_PATHWAYS = [
    {
      feedstock: "Corn Starch",
      technology: "Homofermentation (Lactobacillus)",
      product: decodedTopic,
      application: "PLA Packaging",
      trl: "TRL 9",
      patents: "12 Patents",
      category1: "Agricultural Waste",
      category2: "Biotechnology",
      category3: "Bioplastics",
      category4: "Packaging"
    },
    {
      feedstock: "Sugarcane Molasses",
      technology: "Heterofermentation",
      product: decodedTopic,
      application: "Food Preservatives",
      trl: "TRL 7",
      patents: "8 Patents",
      category1: "Agricultural By-product",
      category2: "Biotechnology",
      category3: "Food & Beverage",
      category4: "Food & Beverage"
    }];


    const combined = [...PREDEFINED_PATHWAYS, ...allPathways];
    const index = parseInt(pathwayId || "0");
    return combined[index] || combined[0];
  };

  const pathway = getPathwayData();
  const pathwayNumber = parseInt(pathwayId || "0") + 1;
  const [activeTab, setActiveTab] = useState<'feedstock' | 'technology' | 'product' | 'application' | null>('feedstock');
  const [hoveredFlowType, setHoveredFlowType] = useState<string | null>(null);
  const unreadCount = useUnreadMessages(pathwayId || "0", activeOpinionsTab);
  const displayUnreadCount = 3;

  // Swappable pathway values
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const currentFeedstock = swaps.feedstock || pathway.feedstock;
  const currentTechnology = swaps.technology || pathway.technology;
  const currentProduct = swaps.product || pathway.product;
  const currentApplication = swaps.application || pathway.application;

  const handleSwap = (type: string, newValue: string) => {
    setSwaps(prev => ({ ...prev, [type]: newValue }));
  };

  // Alternative metrics data - keyed by name
  const alternativeMetrics: Record<string, {
    radar: { feedstockPrice: number; supplyVolume: number; capex: number; marketPrice: number; sizeGlobal: number; sizeEU: number; growthGlobal: number; growthEU: number; appPrice: number; trlScore: number };
    metrics: { feedstockPrice: string; feedstockQty: string; capex: string; trl: string; marketGlobal: string; marketEU: string; growthGlobal: string; growthEU: string; appPrice: string };
  }> = {
    // Default / original
    _default: {
      radar: { feedstockPrice: 85, supplyVolume: 90, capex: 72, marketPrice: 78, sizeGlobal: 92, sizeEU: 85, growthGlobal: 80, growthEU: 83, appPrice: 82, trlScore: 100 },
      metrics: { feedstockPrice: '€120-180/t', feedstockQty: '8.2M t/yr', capex: '€15-25M', trl: 'TRL 9', marketGlobal: '$3.9B', marketEU: '€1.4B', growthGlobal: '8.5% CAGR', growthEU: '9.2% CAGR', appPrice: '€2,800-3,500/t' },
    },
    // Feedstock alternatives
    'Sugarcane Molasses': {
      radar: { feedstockPrice: 70, supplyVolume: 75, capex: 72, marketPrice: 78, sizeGlobal: 92, sizeEU: 85, growthGlobal: 80, growthEU: 83, appPrice: 82, trlScore: 100 },
      metrics: { feedstockPrice: '€80-130/t', feedstockQty: '12.5M t/yr', capex: '€15-25M', trl: 'TRL 9', marketGlobal: '$3.9B', marketEU: '€1.4B', growthGlobal: '8.5% CAGR', growthEU: '9.2% CAGR', appPrice: '€2,800-3,500/t' },
    },
    'Wheat Bran': {
      radar: { feedstockPrice: 78, supplyVolume: 65, capex: 72, marketPrice: 78, sizeGlobal: 92, sizeEU: 85, growthGlobal: 80, growthEU: 83, appPrice: 82, trlScore: 100 },
      metrics: { feedstockPrice: '€90-140/t', feedstockQty: '5.8M t/yr', capex: '€15-25M', trl: 'TRL 9', marketGlobal: '$3.9B', marketEU: '€1.4B', growthGlobal: '8.5% CAGR', growthEU: '9.2% CAGR', appPrice: '€2,800-3,500/t' },
    },
    'Cassava Starch': {
      radar: { feedstockPrice: 82, supplyVolume: 70, capex: 72, marketPrice: 78, sizeGlobal: 92, sizeEU: 85, growthGlobal: 80, growthEU: 83, appPrice: 82, trlScore: 100 },
      metrics: { feedstockPrice: '€100-160/t', feedstockQty: '6.4M t/yr', capex: '€15-25M', trl: 'TRL 9', marketGlobal: '$3.9B', marketEU: '€1.4B', growthGlobal: '8.5% CAGR', growthEU: '9.2% CAGR', appPrice: '€2,800-3,500/t' },
    },
    // Technology alternatives
    'Heterofermentation': {
      radar: { feedstockPrice: 85, supplyVolume: 90, capex: 65, yield: 72, marketPrice: 78, sizeGlobal: 92, sizeEU: 85, growthGlobal: 80, growthEU: 83, appPrice: 82, trlScore: 78, yieldScore: 68, ghgScore: 66 },
      metrics: { feedstockPrice: '€120-180/t', feedstockQty: '8.2M t/yr', capex: '€20-35M', trl: 'TRL 7', marketGlobal: '$3.9B', marketEU: '€1.4B', growthGlobal: '8.5% CAGR', growthEU: '9.2% CAGR', appPrice: '€2,800-3,500/t', yield: '71%', ghg: '1.9 t CO₂e/t' },
    },
    'Enzymatic Hydrolysis + Fermentation': {
      radar: { feedstockPrice: 85, supplyVolume: 90, capex: 58, yield: 80, marketPrice: 78, sizeGlobal: 92, sizeEU: 85, growthGlobal: 80, growthEU: 83, appPrice: 82, trlScore: 67, yieldScore: 80, ghgScore: 72 },
      metrics: { feedstockPrice: '€120-180/t', feedstockQty: '8.2M t/yr', capex: '€25-40M', trl: 'TRL 6', marketGlobal: '$3.9B', marketEU: '€1.4B', growthGlobal: '8.5% CAGR', growthEU: '9.2% CAGR', appPrice: '€2,800-3,500/t', yield: '84%', ghg: '1.5 t CO₂e/t' },
    },
    'Continuous Fermentation (CSTR)': {
      radar: { feedstockPrice: 85, supplyVolume: 90, capex: 68, yield: 82, marketPrice: 78, sizeGlobal: 92, sizeEU: 85, growthGlobal: 80, growthEU: 83, appPrice: 82, trlScore: 89, yieldScore: 82, ghgScore: 76 },
      metrics: { feedstockPrice: '€120-180/t', feedstockQty: '8.2M t/yr', capex: '€18-30M', trl: 'TRL 8', marketGlobal: '$3.9B', marketEU: '€1.4B', growthGlobal: '8.5% CAGR', growthEU: '9.2% CAGR', appPrice: '€2,800-3,500/t', yield: '86%', ghg: '1.3 t CO₂e/t' },
    },
    // Product alternatives
    'D-Lactic Acid': {
      radar: { feedstockPrice: 85, supplyVolume: 90, capex: 72, yield: 88, marketPrice: 82, sizeGlobal: 68, sizeEU: 60, growthGlobal: 92, growthEU: 88, appPrice: 82, trlScore: 100, yieldScore: 85, ghgScore: 73 },
      metrics: { feedstockPrice: '€120-180/t', feedstockQty: '8.2M t/yr', capex: '€15-25M', trl: 'TRL 9', marketGlobal: '$1.2B', marketEU: '€480M', growthGlobal: '12.1% CAGR', growthEU: '13.5% CAGR', appPrice: '€2,800-3,500/t', yield: '89%', ghg: '1.45 t CO₂e/t' },
    },
    'Lactide': {
      radar: { feedstockPrice: 85, supplyVolume: 90, capex: 72, yield: 88, marketPrice: 75, sizeGlobal: 72, sizeEU: 65, growthGlobal: 85, growthEU: 82, appPrice: 82, trlScore: 100, yieldScore: 78, ghgScore: 68 },
      metrics: { feedstockPrice: '€120-180/t', feedstockQty: '8.2M t/yr', capex: '€15-25M', trl: 'TRL 9', marketGlobal: '$2.1B', marketEU: '€850M', growthGlobal: '10.2% CAGR', growthEU: '11.0% CAGR', appPrice: '€2,800-3,500/t', yield: '81%', ghg: '1.8 t CO₂e/t' },
    },
    // Application alternatives
    'Food Preservatives': {
      radar: { feedstockPrice: 85, supplyVolume: 90, capex: 72, yield: 88, marketPrice: 78, sizeGlobal: 92, sizeEU: 85, growthGlobal: 80, growthEU: 83, appPrice: 70, trlScore: 100, yieldScore: 88, ghgScore: 74 },
      metrics: { feedstockPrice: '€120-180/t', feedstockQty: '8.2M t/yr', capex: '€15-25M', trl: 'TRL 9', marketGlobal: '$3.9B', marketEU: '€1.4B', growthGlobal: '8.5% CAGR', growthEU: '9.2% CAGR', appPrice: '€1,200-1,800/t', yield: '92%', ghg: '1.4 t CO₂e/t' },
    },
    'PLA Fiber': {
      radar: { feedstockPrice: 85, supplyVolume: 90, capex: 72, yield: 88, marketPrice: 78, sizeGlobal: 92, sizeEU: 85, growthGlobal: 80, growthEU: 83, appPrice: 88, trlScore: 100, yieldScore: 88, ghgScore: 74 },
      metrics: { feedstockPrice: '€120-180/t', feedstockQty: '8.2M t/yr', capex: '€15-25M', trl: 'TRL 9', marketGlobal: '$3.9B', marketEU: '€1.4B', growthGlobal: '8.5% CAGR', growthEU: '9.2% CAGR', appPrice: '€3,200-4,200/t', yield: '92%', ghg: '1.4 t CO₂e/t' },
    },
    'Green Solvents': {
      radar: { feedstockPrice: 85, supplyVolume: 90, capex: 72, yield: 88, marketPrice: 78, sizeGlobal: 92, sizeEU: 85, growthGlobal: 80, growthEU: 83, appPrice: 75, trlScore: 100, yieldScore: 88, ghgScore: 74 },
      metrics: { feedstockPrice: '€120-180/t', feedstockQty: '8.2M t/yr', capex: '€15-25M', trl: 'TRL 9', marketGlobal: '$3.9B', marketEU: '€1.4B', growthGlobal: '8.5% CAGR', growthEU: '9.2% CAGR', appPrice: '€1,800-2,500/t', yield: '92%', ghg: '1.4 t CO₂e/t' },
    },
    '3D Printing Filament': {
      radar: { feedstockPrice: 85, supplyVolume: 90, capex: 72, yield: 88, marketPrice: 78, sizeGlobal: 92, sizeEU: 85, growthGlobal: 80, growthEU: 83, appPrice: 92, trlScore: 100, yieldScore: 88, ghgScore: 74 },
      metrics: { feedstockPrice: '€120-180/t', feedstockQty: '8.2M t/yr', capex: '€15-25M', trl: 'TRL 9', marketGlobal: '$3.9B', marketEU: '€1.4B', growthGlobal: '8.5% CAGR', growthEU: '9.2% CAGR', appPrice: '€4,500-6,000/t', yield: '92%', ghg: '1.4 t CO₂e/t' },
    },
  };

  // Compute active metrics by merging swaps
  const getActiveMetrics = () => {
    let radar = { ...alternativeMetrics._default.radar };
    let metrics = { ...alternativeMetrics._default.metrics };
    
    // Apply feedstock swap
    if (swaps.feedstock && alternativeMetrics[swaps.feedstock]) {
      const alt = alternativeMetrics[swaps.feedstock];
      radar.feedstockPrice = alt.radar.feedstockPrice;
      radar.supplyVolume = alt.radar.supplyVolume;
      metrics.feedstockPrice = alt.metrics.feedstockPrice;
      metrics.feedstockQty = alt.metrics.feedstockQty;
    }
    // Apply technology swap
    if (swaps.technology && alternativeMetrics[swaps.technology]) {
      const alt = alternativeMetrics[swaps.technology];
      radar.capex = alt.radar.capex;
      radar.yield = alt.radar.yield;
      radar.trlScore = alt.radar.trlScore;
      radar.yieldScore = alt.radar.yieldScore;
      radar.ghgScore = alt.radar.ghgScore;
      metrics.capex = alt.metrics.capex;
      metrics.trl = alt.metrics.trl;
      metrics.yield = alt.metrics.yield;
      metrics.ghg = alt.metrics.ghg;
    }
    // Apply product swap
    if (swaps.product && alternativeMetrics[swaps.product]) {
      const alt = alternativeMetrics[swaps.product];
      radar.marketPrice = alt.radar.marketPrice;
      radar.sizeGlobal = alt.radar.sizeGlobal;
      radar.sizeEU = alt.radar.sizeEU;
      radar.growthGlobal = alt.radar.growthGlobal;
      radar.growthEU = alt.radar.growthEU;
      metrics.appPrice = alt.metrics.appPrice;
      metrics.marketGlobal = alt.metrics.marketGlobal;
      metrics.marketEU = alt.metrics.marketEU;
      metrics.growthGlobal = alt.metrics.growthGlobal;
      metrics.growthEU = alt.metrics.growthEU;
    }
    // Apply application swap
    if (swaps.application && alternativeMetrics[swaps.application]) {
      const alt = alternativeMetrics[swaps.application];
      radar.appPrice = alt.radar.appPrice;
      metrics.appPrice = alt.metrics.appPrice;
    }
    
    return { radar, metrics };
  };

  const activeMetrics = getActiveMetrics();

  const displayMetric = (value?: string | null) => value && value.trim() ? value : '—';
  const metricGrowthValue = (value: string) => displayMetric(value.replace('CAGR', 'YoY'));

  const splitValueUnit = (raw: string): { number: string; unit: string } => {
    const value = raw
      .replace(/(\d)\s*[-\u2013]\s*(\d)/g, '$1\u2013$2')
      .replace(/\s/g, '\u00A0');
    const units = ['kg\u00A0CO\u2082e/t', 'CO\u2082e/t', 'kt/yr', 't/yr', 'YoY', '/t'];
    for (const u of units) {
      const idx = value.lastIndexOf(u);
      if (idx > 0 && idx + u.length === value.length) {
        return { number: value.slice(0, idx), unit: value.slice(idx) };
      }
    }
    return { number: value, unit: '' };
  };

  const categoryPalette: Record<string, string> = {
    Feedstock: '--cat-feedstock',
    Process: '--cat-process',
    Product: '--cat-material',
    Production: '--cat-production',
    Application: '--cat-application',
  };

  const categoryStyle = (category: string, highlighted = false): React.CSSProperties => {
    const v = categoryPalette[category];
    if (!v) return {};
    return {
      borderLeftColor: `hsl(var(${v})${highlighted ? '' : ' / 0.85'})`,
      backgroundColor: `hsl(var(${v})${highlighted ? ' / 0.14' : ' / 0.08'})`,
      color: `hsl(var(${v})${highlighted ? '' : ' / 0.85'})`,
    };
  };

  const evaluationGroups: Array<{
    category: string;
    type: 'feedstock' | 'technology' | 'product' | 'application';
    rows: Array<{ label: string; value: string; percentile: number; mutedDetail?: string }>;
  }> = [
    {
      category: 'Feedstock',
      type: 'feedstock',
      rows: [
        { label: 'Feedstock price (Europe)', value: displayMetric(activeMetrics.metrics.feedstockPrice), percentile: activeMetrics.radar.feedstockPrice },
        { label: 'Feedstock availability (Europe)', value: displayMetric(activeMetrics.metrics.feedstockQty), percentile: activeMetrics.radar.supplyVolume },
      ],
    },
    {
      category: 'Process',
      type: 'technology',
      rows: [
        { label: 'Process TRL', value: displayMetric(activeMetrics.metrics.trl), percentile: activeMetrics.radar.trlScore },
        { label: 'Yield', value: displayMetric(activeMetrics.metrics.yield), percentile: activeMetrics.radar.yieldScore },
      ],
    },
    {
      category: 'Product',
      type: 'product',
      rows: [
        { label: 'Product price', value: displayMetric(activeMetrics.metrics.appPrice), percentile: activeMetrics.radar.marketPrice },
        { label: 'Product availability (Europe)', value: '1.4M t/yr', percentile: 46 },
        { label: 'Market size (EU)', value: displayMetric(activeMetrics.metrics.marketEU), percentile: activeMetrics.radar.sizeEU },
        { label: 'Market size (Global)', value: displayMetric(activeMetrics.metrics.marketGlobal), percentile: activeMetrics.radar.sizeGlobal },
        { label: 'Market growth (EU)', value: metricGrowthValue(activeMetrics.metrics.growthEU), percentile: activeMetrics.radar.growthEU },
        { label: 'Market growth (Global)', value: metricGrowthValue(activeMetrics.metrics.growthGlobal), percentile: activeMetrics.radar.growthGlobal },
        { label: 'Market concentration', value: '34', mutedDetail: 'producers in 12 countries', percentile: 38 },
      ],
    },
    {
      category: 'Production',
      type: 'technology',
      rows: [
        { label: 'Production TRL', value: 'TRL 8', percentile: 88 },
        { label: 'GHG emissions', value: displayMetric(activeMetrics.metrics.ghg), percentile: activeMetrics.radar.ghgScore },
        { label: 'Production IP count', value: '412', percentile: 20 },
        { label: 'Production research count', value: '1,268', percentile: 12 },
      ],
    },
    {
      category: 'Application',
      type: 'application',
      rows: [
        { label: 'Application TRL', value: 'TRL 7', percentile: 76 },
        { label: 'Application IP count', value: '96', percentile: 26 },
        { label: 'Application research count', value: '743', percentile: 24 },
        { label: 'Demand', value: '18', mutedDetail: 'offtakers in 7 countries', percentile: 29 },
      ],
    },
  ];


  // Popover data for each flow item
  const flowPopoverData = {
    feedstock: {
      name: currentFeedstock,
      category1: pathway.category1 || 'Agricultural Waste',
      category2: 'Starch-based',
      description: 'A renewable carbohydrate-rich feedstock commonly derived from cereal crops. Widely available and cost-effective for industrial fermentation processes.',
      alternatives: [
        { name: 'Sugarcane Molasses' },
        { name: 'Wheat Bran' },
        { name: 'Cassava Starch' },
      ],
    },
    technology: {
      name: currentTechnology,
      category1: pathway.category2 || 'Biotechnology',
      category2: 'Fermentation',
      description: 'A microbial fermentation process using Lactobacillus strains to convert sugars into lactic acid with high selectivity and yield.',
      alternatives: [
        { name: 'Heterofermentation' },
        { name: 'Enzymatic Hydrolysis + Fermentation' },
        { name: 'Continuous Fermentation (CSTR)' },
      ],
    },
    product: {
      name: currentProduct,
      category1: pathway.category3 || 'Chemicals',
      category2: 'Organic Acid',
      description: 'A versatile organic acid (C₃H₆O₃) used across food, pharmaceutical, and chemical industries. Key building block for PLA bioplastics.',
      alternatives: [
        { name: 'D-Lactic Acid' },
        { name: 'Lactide' },
      ],
    },
    application: {
      name: currentApplication,
      category1: pathway.category4 || 'Packaging',
      category2: 'Bioplastics',
      description: 'Polylactic acid (PLA) based packaging products offering compostability and reduced carbon footprint compared to conventional plastics.',
      alternatives: [
        { name: 'Food Preservatives' },
        { name: 'PLA Fiber' },
        { name: 'Green Solvents' },
        { name: '3D Printing Filament' },
      ],
    },
  };

  // Function to convert TRL to Market Ready status
  const getMarketReadyStatus = (trl: string) => {
    const trlNumber = parseInt(trl.replace('TRL ', ''));
    if (trlNumber >= 8) return "Market Ready Now";
    if (trlNumber >= 6) return "Market Ready in 2-5 years";
    if (trlNumber >= 4) return "Market Ready in >10 years";
    return "Market Ready in <10 years";
  };

  // Function to get TRL stage label
  const getTRLStageLabel = (trl: string) => {
    const trlNumber = parseInt(trl.replace('TRL ', ''));
    if (trlNumber >= 8) return "Commercial";
    if (trlNumber >= 6) return "Pilot";
    if (trlNumber >= 4) return "Lab";
    return "Research";
  };

  return (
    <div className="h-full bg-background flex flex-col animate-fade-in">
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
        <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/landscape/${category}/${topic}/value-chain/pathways`)}
            className="gap-1.5 h-7 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-6 pb-6 flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain">
        {/* Title row */}
        <div className="grid gap-5 items-center mb-3 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pathway Profile</h3>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Knowledge Base</h3>
          </div>
        </div>

        {/* Content grid */}
        <div className={`grid gap-5 items-start min-h-0 pb-2 lg:grid-cols-[minmax(0,1fr)_280px] ${
          evaluationTab === 'company' ? 'flex-none' : 'flex-1'
        }`}>
              <div className={`border border-border rounded-lg bg-card p-5 shadow-sm flex flex-col gap-3 min-w-0 ${
                evaluationTab === 'company'
                  ? 'min-h-0 overflow-x-hidden'
                  : 'min-h-0 max-h-full overflow-y-auto overflow-x-hidden overscroll-y-contain'
              }`}>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">Detailed breakdown of this pathway's value chain, scoring, and key metrics. Click on any node to explore alternatives.</p>
              <PathwayProfileGroups pathwayIndex={pathwayIndex} feedstock={currentFeedstock} />
              <div className="border border-border rounded-lg bg-card shadow-sm">
                {/* Header row */}
                <div className="px-3 py-1.5 border-b border-border bg-muted/50 rounded-t-lg grid grid-cols-[28px_50px_minmax(0,1.8fr)_minmax(0,1.8fr)_minmax(0,1.8fr)_minmax(0,1.5fr)_75px] items-center gap-2">
                  <span></span>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest text-center flex items-center justify-center gap-0.5">VCG Score <Info className="w-2.5 h-2.5 text-muted-foreground/50" /></span>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest text-center">Feedstock</span>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest text-center">Process</span>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest text-center">Product</span>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest text-center">Application</span>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest text-center">TRL</span>
                </div>
                {/* Single row matching table format */}
                {(() => {
                  const score = Math.max(20, 95 - (parseInt(pathwayId || "0")) * 3);
                  const trlLabel = getTRLStageLabel(pathway.trl);
                  const trlNum = parseInt(pathway.trl.replace('TRL ', ''));
                  return (
                    <div className="px-3 py-2 grid grid-cols-[28px_50px_minmax(0,1.8fr)_minmax(0,1.8fr)_minmax(0,1.8fr)_minmax(0,1.5fr)_75px] items-center gap-2">
                      <button
                        onClick={toggleSave}
                        className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                        title={isSaved ? 'Remove from shortlist' : 'Add to shortlist'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-primary text-primary' : ''}`} />
                      </button>
                      <div className="text-[11px] font-bold text-foreground text-center">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="cursor-help hover:text-primary transition-colors">{score}</button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-3" side="bottom" align="start">
                            <div className="space-y-2.5">
                              <div>
                                <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">VCG Score Methodology</h4>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                  The VCG Score evaluates pathways by blending three positive performance indicators and subtracting one negative indicator.
                                </p>
                              </div>
                              <div className="space-y-1.5">
                                {[
                                  { label: 'Research', weight: '25%', value: 65, color: 'bg-blue-500' },
                                  { label: 'TRL', weight: '40%', value: 70, color: 'bg-emerald-500' },
                                  { label: 'Market Size', weight: '35%', value: 60, color: 'bg-amber-500' },
                                  { label: 'IP Score', weight: '−20%', value: 40, color: 'bg-red-400', negative: true },
                                ].map((w) => (
                                  <div key={w.label} className="flex items-center gap-2">
                                    <span className="text-[9px] font-medium text-foreground w-16 shrink-0">{w.label}</span>
                                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div className={`h-full ${w.color} rounded-full`} style={{ width: `${w.value}%` }} />
                                    </div>
                                    <span className={`text-[9px] font-semibold w-8 text-right ${w.negative ? 'text-red-500' : 'text-muted-foreground'}`}>
                                      {w.weight}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      {([
                        { label: 'Feedstock', value: currentFeedstock, type: 'feedstock' as const, isAnchor: category === 'Feedstock' },
                        { label: 'Process', value: currentTechnology, type: 'technology' as const, isAnchor: false },
                        { label: 'Product', value: currentProduct, type: 'product' as const, isAnchor: category === 'Product' },
                        { label: 'Application', value: currentApplication, type: 'application' as const, isAnchor: false },
                      ]).map((node, pi) => (
                        <div
                          key={pi}
                          onMouseEnter={() => setHoveredFlowType(node.type)}
                          onMouseLeave={() => setHoveredFlowType(null)}
                        >
                          <PathwayFlowPopover
                            type={node.type}
                            data={flowPopoverData[node.type]}
                            originalValue={pathway[node.type === 'technology' ? 'technology' : node.type]}
                            onSwap={(v) => handleSwap(node.type, v)}
                            onRestore={() => setSwaps(prev => { const next = { ...prev }; delete next[node.type]; return next; })}
                          >
                            <div className={`text-[10px] font-medium truncate border rounded px-1.5 py-1 text-center transition-all ${node.isAnchor ? 'border-primary/40 bg-primary/5 text-primary' : hoveredFlowType === node.type ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20 text-foreground' : 'border-border bg-muted/20 text-foreground'}`}>
                              {node.value}
                            </div>
                          </PathwayFlowPopover>
                        </div>
                      ))}
                      <div className="text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                          trlNum >= 8 ? 'bg-green-100 text-green-800 border border-green-200' :
                          trlNum >= 6 ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {trlLabel}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Technical Feasibility Evaluation Card */}
              <div className={`border border-border rounded-lg bg-card px-5 py-4 shadow-sm flex flex-col min-w-0 ${
                evaluationTab === 'company' ? 'flex-none min-h-0' : 'flex-1 min-h-[420px]'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="inline-flex w-full xl:w-auto items-center gap-2 bg-muted/50 rounded-lg p-0.5">
                    <button
                      onClick={() => setEvaluationTab('evaluation')}
                      className={`flex-1 xl:flex-none xl:w-[140px] min-w-0 text-center py-1 rounded-md text-[9px] font-semibold uppercase tracking-widest transition-all ${evaluationTab === 'evaluation' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Pathway Evaluation
                    </button>
                    <button
                      onClick={() => setEvaluationTab('updates')}
                      className={`flex-1 xl:flex-none xl:w-[140px] min-w-0 text-center py-1 rounded-md text-[9px] font-semibold uppercase tracking-widest transition-all inline-flex items-center justify-center gap-1.5 ${evaluationTab === 'updates' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Latest Updates
                      {unreadUpdatesCount > 0 && (
                        <Bell className={`w-3 h-3 ${evaluationTab === 'updates' ? 'text-background' : 'text-foreground'}`} strokeWidth={2.5} />
                      )}
                    </button>
                    <button
                      onClick={() => setEvaluationTab('company')}
                      className={`flex-1 xl:flex-none xl:w-[140px] min-w-0 text-center py-1 rounded-md text-[9px] font-semibold uppercase tracking-widest transition-all ${evaluationTab === 'company' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Validation Space
                    </button>
                  </div>
                </div>

                {evaluationTab === 'evaluation' ? (
                  <>
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-lg border border-border bg-background">
                  <div className="flex-1 min-h-0 overflow-auto">
                    <div className="min-w-0">
                    <div className="sticky top-0 z-10 grid grid-cols-[80px_minmax(110px,1fr)_minmax(180px,auto)_minmax(100px,1fr)] items-center border-b border-border bg-background px-2 py-0.5">
                      <span className="col-span-2 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Key indicators</span>
                      <span className="pr-6 text-right text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Value</span>
                      <div className="relative flex items-center justify-between text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                    {evaluationGroups.map((group, groupIndex) => {
                      const isHighlighted = hoveredFlowType === group.type;
                      return (
                        <div
                          key={group.category}
                          className={`grid grid-cols-[80px_minmax(0,1fr)] ${groupIndex > 0 ? 'border-t border-foreground/10' : ''}`}
                          onMouseEnter={() => setHoveredFlowType(group.type)}
                          onMouseLeave={() => setHoveredFlowType(null)}
                        >
                          <div className="flex items-center px-1.5 h-6">
                            <span
                              className="mr-1 h-3 w-[2px] shrink-0 rounded-full"
                              style={{ backgroundColor: `hsl(var(${categoryPalette[group.category]}))` }}
                            />
                            <span className={`text-[9px] uppercase tracking-[0.08em] ${isHighlighted ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {group.category}
                            </span>
                          </div>

                          <div>
                            {group.rows.map((row) => {
                              const isNull = !row.value || row.value === '—';
                              const pct = Math.max(0, Math.min(100, row.percentile ?? 0));
                              // Deterministic population average across all pathways in the analysis
                              let hash = 0;
                              for (let i = 0; i < row.label.length; i++) hash = (hash * 31 + row.label.charCodeAt(i)) >>> 0;
                              const avg = 25 + (hash % 51);
                              const { number, unit } = splitValueUnit(row.value);
                              return (
                                <div
                                  key={`${group.category}-${row.label}`}
                                  tabIndex={0}
                                  className="group/row grid h-6 grid-cols-[minmax(110px,1fr)_minmax(180px,auto)_minmax(100px,1fr)] items-center pr-2 outline-none transition-colors hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.04]"
                                >
                                  <span className="truncate pl-1 text-[10px] font-medium text-muted-foreground" title={row.label}>{row.label}</span>

                                  <div className="flex items-start justify-end gap-1 min-w-0">
                                    <div className="min-w-0 overflow-hidden pr-3 text-right">
                                      {isNull ? (
                                        <span className="text-[10px] tabular-nums text-muted-foreground">—</span>
                                      ) : (
                                          <span className="block truncate text-[10px] tabular-nums whitespace-nowrap">
                                          <span className="font-semibold text-foreground">{number}</span>
                                          {unit && <span className="font-normal text-muted-foreground">{unit}</span>}
                                          {row.mutedDetail && (
                                            <span className="font-normal text-muted-foreground"> {row.mutedDetail}</span>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                    <ExternalLink className="mt-[3px] h-2 w-2 shrink-0 text-muted-foreground/60 opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-visible/row:opacity-100" />
                                  </div>

                                  <div className="relative h-3.5">
                                    {isNull ? (
                                      <div className="absolute left-0 right-4 top-1/2 h-[3px] -translate-y-1/2 rounded-full border border-dashed border-foreground/20" />
                                    ) : (
                                      <>
                                         <div className="absolute left-0 right-4 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-foreground/[0.08]" />
                                         <div className="absolute left-1/2 top-1/2 h-[9px] w-px -translate-y-1/2 bg-foreground/15" />
                                         <div
                                            className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-primary"
                                            style={{ width: `${pct}%` }}
                                          />
                                          <div
                                            className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-background"
                                            style={{ left: `${pct}%` }}
                                          />
                                           <div className="group/marker absolute top-0 bottom-0 flex items-center justify-center" style={{ left: `${avg}%` }}>
                                             <div className="relative h-3.5 w-3.5 -translate-x-1/2 cursor-help" title={`Average of all pathways: ${avg}`}>
                                               <div className="absolute left-1/2 top-1/2 h-[12px] w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/50" />
                                               <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded border border-border bg-background px-1 py-0.5 text-[9px] tabular-nums text-foreground opacity-0 shadow-sm transition-opacity group-hover/marker:opacity-100">
                                                 Average: {avg}
                                               </span>
                                             </div>
                                           </div>
                                          <span
                                            className="pointer-events-none absolute -top-[2px] -translate-x-full -translate-y-full text-[9px] tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-visible/row:opacity-100"
                                            style={{ left: `calc(${pct}% + 6px)` }}
                                          >
                                            {Math.round(row.percentile)}
                                          </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>

                  <details className="group border-t border-border bg-muted/20 px-2 py-2">
                    <summary className="flex cursor-pointer items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                      <Info className="h-3 w-3" />
                      Methodology
                    </summary>
                    <div className="mt-2 grid gap-1 text-[9px] leading-relaxed text-muted-foreground md:grid-cols-2">
                       <p>Percentiles normalize each indicator against comparable pathways. Higher values indicate stronger pathway position. The vertical tick marks the average of all pathways in the analysis.</p>
                      <p>Yield is shown as a percentage. GHG emissions are cradle-to-gate emissions per tonne of product.</p>
                    </div>
                  </details>
                </div>
                  </>
                ) : evaluationTab === 'updates' ? (
                  <div className="flex-1 flex flex-col mt-1 min-h-0 overflow-hidden">
                    <div className="flex items-start justify-between gap-3 mb-2 shrink-0 pr-1">
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Recent research, patents, projects, commercial signals and market news relevant to this pathway.
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                        onClick={toggleSubscription}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wider border transition-all ${
                          isSubscribed
                            ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                            : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30'
                        }`}
                        title={isSubscribed ? 'Unsubscribe from updates' : 'Get notified of new updates'}
                      >
                        {isSubscribed ? <Bell className="w-3 h-3 fill-current" /> : <BellOff className="w-3 h-3" />}
                        {isSubscribed ? 'Notifications On' : 'Notify Me'}
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain pr-1 pb-1 space-y-1.5">
                      {pathwayUpdates.map((u, i) => {
                        const toneMap: Record<string, { bg: string; text: string; ring: string }> = {
                          blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
                          purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100' },
                          emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
                          amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
                          orange: { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'ring-orange-100' },
                        };
                        const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                          Research: FlaskConical,
                          Patents: ScrollText,
                          Projects: Rocket,
                          Commercial: Factory,
                          Market: TrendingUp,
                        };
                        const CatIcon = iconMap[u.cat] ?? FileText;
                        const t = toneMap[u.tone];
                        const isUnread = !readUpdates.has(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() => markUpdateRead(u.id)}
                            className={`group relative flex min-h-[44px] items-center gap-3 px-3 py-1.5 rounded-lg border bg-card hover:border-foreground/30 hover:shadow-sm transition-all cursor-pointer ${
                              isUnread ? 'border-border shadow-[inset_2px_0_0_0_hsl(var(--foreground))]' : 'border-border'
                            }`}
                          >
                            <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${t.bg} ${t.text} border border-current/10`}>
                              <CatIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[8px] font-semibold uppercase tracking-wider ${t.text}`}>{u.cat}</span>
                                <span className="text-muted-foreground/50 text-[8px]">•</span>
                                <span className="text-[9px] text-muted-foreground">{u.source}</span>
                                {isUnread && (
                                  <span className="ml-1 inline-flex items-center px-1.5 py-px rounded-full border border-foreground/30 text-foreground/70 text-[8px] font-semibold uppercase tracking-wider leading-none">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className={`text-[11px] leading-snug ${isUnread ? 'text-foreground font-semibold' : 'text-foreground/80 font-medium'}`}>{u.title}</p>
                            </div>
                            <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                              {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-foreground" />}
                              <span className="text-[9px] text-muted-foreground tabular-nums whitespace-nowrap">{u.date}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : evaluationTab === 'company' ? (
                  <PathwayValidationSpace
                    pathwayId={pathwayId || '0'}
                    topic={topic ? decodeURIComponent(topic) : undefined}
                  />
                ) : null}
                </div>

            </div>
            
            {/* Right: Sidebar */}
            <div className="space-y-1.5 sticky top-4">
              <PathwayResourcesTab productName={topic ? decodeURIComponent(topic) : "Product"} pathwayNumber={pathwayNumber} showFooter={true} />
            </div>
          </div>
        </div>
      </div>
  );
};

export default PathwayDetail;
