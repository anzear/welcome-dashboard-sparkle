import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wand2, Star, Upload, FileText, Sparkles, ShieldCheck, Compass,
  AlertTriangle, CheckCircle2, Plus, X, MessageSquare, UserPlus,
  Trash2, Edit3, Check, Link2, Users, Target, FlaskConical,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { addActivity } from '@/lib/activityNotifications';

// ============================================================================
// Types
// ============================================================================
type Intent = 'replace' | 'introduce' | '';
type WorkflowStatus =
  | 'Draft'
  | 'Prioritisation-ready'
  | 'Evidence-ready'
  | 'Benchmark-ready'
  | 'Market-introduction-ready'
  | 'Ready for VCG.AI intelligence scan';

interface Prioritise {
  materialName: string;
  intent: Intent;
  applicationArea: string;
  requiredFunction: string;
  currentStatus: string;
  primaryDriver: string;
  commercialImportance: number;
  sustainabilityImpact: number;
  supplyRisk: number;
  customerPull: number;
  urgency: number;
  urgencyNote: string;
}

interface Attachment {
  id: string;
  name: string;
  category: string;
  attachmentType: string;
  sourceFunction: string;
  relatedPathway: string;
  confidence: string;
  notes: string;
}

interface ExtractedItem {
  id: string;
  text: string;
  type?: string;       // requirement type / importance / risk
  value?: string;      // baseline/target/threshold
  unit?: string;
  source: string;      // attachment name
  confidence: 'High' | 'Medium' | 'Low';
  owner: string;
  status: 'New' | 'Accepted' | 'Edited' | 'Rejected' | 'Needs owner review' | 'Conflict detected';
  group: 'technical' | 'metrics' | 'sustainability' | 'regulatory' | 'commercial' | 'customer';
  region?: string;
}

interface BenchmarkRef {
  benchmarkType: string;
  incumbent: string;
  targetBenchmark: string;
  performanceBaseline: string;
  notes: string;
}

interface Approvals {
  rd: boolean;
  quality: boolean;
  sustainability: boolean;
  procurement: boolean;
  regulatory: boolean;
  productBU: boolean;
  sales: boolean;
  marketing: boolean;
}

interface Decision {
  nextDecision: string;
  decisionOwner: string;
  targetDate: string;
  notes: string;
}

// ============================================================================
// Constants
// ============================================================================
const FUNCTION_OPTIONS = [
  'Binder','Surfactant','Solvent','Preservative','Plasticizer','Monomer','Resin',
  'Additive','Fragrance carrier','Processing aid','Barrier material','Active ingredient','Other',
];
const CURRENT_STATUS = [
  'Used today internally','Known material, not used internally','New opportunity',
  'Customer-requested material','Strategic exploration','Existing pilot candidate',
];
const PRIMARY_DRIVER = [
  'Decarbonisation','Bio-based transition','Circularity','Supply security','Customer request',
  'Regulatory pressure','Cost competitiveness','Performance improvement','Supplier diversification',
  'Brand / claims opportunity','Innovation roadmap','Other',
];
const getAttachmentCategories = (intent: 'replace' | 'introduce' | string) => {
  const isNew = intent === 'introduce';
  return [
    { key: 'materialSpec',
      label: isNew ? 'Target material specification' : 'Material specification',
      contributors: ['R&D','Procurement'],
      examples: isNew
        ? 'target technical spec, desired properties, performance targets, candidate datasheets'
        : 'technical datasheet, SDS, supplier datasheet, certificate of analysis, current spec' },
    { key: 'product', label: 'Product requirements', contributors: ['R&D','Product','Quality'],
      examples: 'product brief, formulation requirements, quality spec, application requirements' },
    { key: 'sustainability',
      label: isNew ? 'Sustainability targets' : 'Sustainability baseline',
      contributors: ['Sustainability'],
      examples: isNew
        ? 'renewable carbon target, PCF target, Scope 3 reduction goal, circularity ambition'
        : 'LCA, product carbon footprint, Scope 3, renewable carbon baseline, supplier declaration' },
    { key: 'customer', label: 'Customer requirements', contributors: ['Sales','Product'],
      examples: 'customer spec, tender requirement, key account brief, customer sustainability requirement' },
    { key: 'regulatory', label: 'Regulatory & compliance requirements', contributors: ['Regulatory','Quality'],
      examples: 'REACH, FDA / food-contact, CLP, regional restrictions, certification requirements' },
    { key: 'strategy', label: 'Strategy', contributors: ['Strategy','Business Unit'],
      examples: 'innovation roadmap, sustainability roadmap, business case, investment rationale' },
  ];
};
const ATTACHMENT_CATEGORIES = getAttachmentCategories('replace');
const ATTACHMENT_TYPES = [
  'Technical specification','Supplier datasheet','Safety data sheet','Certificate of analysis',
  'Product brief','Formulation requirements','Performance test results','LCA / carbon footprint',
  'Sustainability target','Regulatory requirement','Customer specification','Procurement / sourcing information',
  'Competitor benchmark','Internal strategy / roadmap','Other',
];
const SOURCE_FUNCTIONS = ['R&D','Product','Procurement','Sustainability','Regulatory','Quality','Sales','Marketing','Strategy','Finance','Supplier','Customer'];
const RELATED_PATHWAYS = ['Replacement only','New introduction only','Both'];
const CONFIDENCE_OPTS = ['Draft / unvalidated','Current approved source','Historical reference','Supplier-provided','Customer-provided','Needs review','Superseded / outdated'];
const NEXT_DECISIONS = [
  'Prioritise for deeper assessment','Search for suppliers','Assess bio-based production routes',
  'Assess circular production routes','Benchmark against incumbent','Start technical validation',
  'Launch customer discussion','Start supplier engagement','Monitor market','Stop / deprioritise',
];

// ============================================================================
// Helpers
// ============================================================================
const cls = (...c: (string|false|null|undefined)[]) => c.filter(Boolean).join(' ');

const StatusPill: React.FC<{ tone: 'green'|'amber'|'red'|'blue'|'muted'; children: React.ReactNode }> = ({ tone, children }) => {
  const map: Record<string,string> = {
    green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    red:   'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
    blue:  'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
    muted: 'bg-muted text-muted-foreground border-border',
  };
  return <span className={cls('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium tracking-wide', map[tone])}>{children}</span>;
};

const SectionTitle: React.FC<{ children: React.ReactNode; icon?: React.ReactNode; hint?: string }> = ({ children, icon, hint }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-[10px] uppercase tracking-widest font-bold text-foreground">{children}</h2>
    </div>
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean; owner?: string; hint?: string }> = ({ children, required, hint }) => (
  <div className="flex items-baseline justify-between gap-2 mb-1.5">
    <label className="text-xs font-medium text-foreground">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {hint && <span className="text-[10px] text-muted-foreground italic">{hint}</span>}
  </div>
);

const StarRating: React.FC<{ value: number; onChange: (v:number)=>void; scale?: string[] }> = ({ value, onChange, scale }) => (
  <div className="flex items-center gap-1">
    {[1,2,3,4,5].map(n => (
      <button key={n} type="button" onClick={() => onChange(n === value ? 0 : n)}
        className="p-0.5 hover:scale-110 transition-transform">
        <Star className={cls('w-4 h-4', n <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
      </button>
    ))}
    {value > 0 && scale && (
      <span className="ml-2 text-[10px] text-muted-foreground">{scale[value-1]}</span>
    )}
  </div>
);

// ============================================================================
// Main page
// ============================================================================
const MaterialBrief: React.FC = () => {
  const { category, topic } = useParams<{ category: string; topic: string }>();
  const navigate = useNavigate();
  const decodedTopic = decodeURIComponent(topic || '');
  const cat = category || 'Product';

  const [activeTab, setActiveTab] = useState('details');
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [savedSteps, setSavedSteps] = useState<Record<string, boolean>>({});

  const STEPS = [
    { value: 'details',  icon: Target,      label: 'Material Details',      sub: 'Identify the material & intent',  tint: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',  ring: 'hsl(243 75% 59%)' },
    { value: 'scoring',  icon: Star,        label: 'Strategic Scoring',     sub: 'Rate priority drivers 1–5',       tint: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',    ring: 'hsl(38 92% 50%)'  },
    { value: 'evidence', icon: Upload,      label: 'Material Requirements', sub: 'Upload supporting docs',          tint: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',          ring: 'hsl(199 89% 48%)' },
    { value: 'extract',  icon: Sparkles,    label: 'Material Brief Summary', sub: 'Derive key specs',               tint: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', ring: 'hsl(262 83% 58%)' },
    { value: 'decide',   icon: Compass,     label: 'Decide Next Step',      sub: 'Choose recommendation',           tint: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',       ring: 'hsl(346 77% 50%)' },
  ] as const;



  const openStep = (value: string) => {
    setActiveTab(value);
    setStepDialogOpen(true);
  };


  // ----- State -----
  const [p, setP] = useState<Prioritise>({
    materialName: decodedTopic,
    intent: '',
    applicationArea: '',
    requiredFunction: '',
    currentStatus: '',
    primaryDriver: '',
    commercialImportance: 0,
    sustainabilityImpact: 0,
    supplyRisk: 0,
    customerPull: 0,
    urgency: 0,
    urgencyNote: '',
  });
  const setPField = <K extends keyof Prioritise>(k: K, v: Prioritise[K]) => setP(prev => ({ ...prev, [k]: v }));

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [extracted, setExtracted] = useState<ExtractedItem[]>([]);
  const [bench, setBench] = useState<BenchmarkRef>({
    benchmarkType: '', incumbent: '', targetBenchmark: '', performanceBaseline: '', notes: '',
  });
  const [approvals, setApprovals] = useState<Approvals>({
    rd:false, quality:false, sustainability:false, procurement:false,
    regulatory:false, productBU:false, sales:false, marketing:false,
  });
  const [decision, setDecision] = useState<Decision>({
    nextDecision: '', decisionOwner: '', targetDate: '', notes: '',
  });
  const [manualMust, setManualMust] = useState<string[]>([]);
  const [manualNice, setManualNice] = useState<string[]>([]);
  const [manualDeal, setManualDeal] = useState<string[]>([]);

  // ----- Team management -----
  interface TeamMember { id: string; name: string; email?: string; role: 'Owner' | 'Contributor'; }
  const teamKey = `material_team_${decodedTopic}`;
  const [team, setTeam] = useState<TeamMember[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(`material_team_${decodedTopic}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { id: 'm1', name: 'Jane Goodwin', email: 'jane.goodwin@company.com', role: 'Owner' },
      { id: 'm2', name: 'Alex Rivera', email: 'alex.rivera@company.com', role: 'Contributor' },
      { id: 'm3', name: 'Priya Patel', email: 'priya.patel@company.com', role: 'Contributor' },
    ];
  });
  const persistTeam = (next: TeamMember[]) => {
    setTeam(next);
    try { localStorage.setItem(teamKey, JSON.stringify(next)); } catch {}
  };
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState<{ name: string; email: string; role: 'Owner' | 'Contributor' }>({ name: '', email: '', role: 'Contributor' });
  const addMember = () => {
    if (!newMember.name.trim()) { toast.error('Name is required'); return; }
    const next: TeamMember[] = [...team, { id: `m_${Date.now()}`, name: newMember.name.trim(), email: newMember.email.trim() || undefined, role: newMember.role }];
    if (newMember.role === 'Owner') {
      // demote any existing owner
      next.forEach(m => { if (m.id !== next[next.length - 1].id && m.role === 'Owner') m.role = 'Contributor'; });
    }
    persistTeam(next);
    setNewMember({ name: '', email: '', role: 'Contributor' });
    toast.success(`${next[next.length - 1].name} added to the team`);
  };
  const removeMember = (id: string) => {
    persistTeam(team.filter(m => m.id !== id));
    toast.success('Member removed');
  };
  const changeRole = (id: string, role: 'Owner' | 'Contributor') => {
    const next = team.map(m => {
      if (m.id === id) return { ...m, role };
      if (role === 'Owner' && m.role === 'Owner') return { ...m, role: 'Contributor' as const };
      return m;
    });
    persistTeam(next);
  };

  // ----- Computed -----
  const priorityScore = p.commercialImportance + p.sustainabilityImpact + p.supplyRisk + p.customerPull + p.urgency;
  const priorityStatus = useMemo(() => {
    if (priorityScore === 0) return { label: 'Not scored', tone: 'muted' as const };
    if (priorityScore <= 10) return { label: 'Low priority / monitor', tone: 'muted' as const };
    if (priorityScore <= 15) return { label: 'Medium priority', tone: 'amber' as const };
    if (priorityScore <= 20) return { label: 'Strong candidate', tone: 'blue' as const };
    return { label: 'High-priority investment', tone: 'green' as const };
  }, [priorityScore]);

  const prioritisationComplete = !!(p.materialName && p.intent && p.applicationArea && p.requiredFunction &&
    p.currentStatus && p.primaryDriver && p.commercialImportance && p.sustainabilityImpact &&
    p.supplyRisk && p.customerPull && p.urgency);

  const missingPrioritisation = useMemo(() => {
    const m: string[] = [];
    if (!p.materialName) m.push('Material name');
    if (!p.intent) m.push('Material intent');
    if (!p.applicationArea) m.push('Applications');
    if (!p.requiredFunction) m.push('Required function');
    if (!p.currentStatus) m.push('Current status');
    if (!p.primaryDriver) m.push('Primary driver');
    if (!p.commercialImportance) m.push('Commercial importance');
    if (!p.sustainabilityImpact) m.push('Sustainability impact');
    if (!p.supplyRisk) m.push('Supply risk');
    if (!p.customerPull) m.push('Customer / market pull');
    if (!p.urgency) m.push('Urgency');
    return m;
  }, [p]);

  const evidenceReadiness = useMemo(() => {
    if (attachments.length === 0) return { label: 'No evidence uploaded', tone: 'muted' as const };
    const categoriesCovered = new Set(attachments.map(a => a.category)).size;
    const outdated = attachments.some(a => a.confidence === 'Superseded / outdated' || a.confidence === 'Needs review');
    if (outdated) return { label: 'Evidence needs review', tone: 'amber' as const };
    if (categoriesCovered >= 4) return { label: 'Evidence-ready', tone: 'green' as const };
    return { label: 'Partial evidence uploaded', tone: 'amber' as const };
  }, [attachments]);

  const acceptedMust = extracted.filter(e => e.status === 'Accepted' && e.type === 'Must-have');
  const acceptedNice = extracted.filter(e => e.status === 'Accepted' && e.type === 'Nice-to-have');
  const acceptedDeal = extracted.filter(e => e.status === 'Accepted' && e.type === 'Deal-breaker');
  const conflicts = extracted.filter(e => e.status === 'Conflict detected');
  const pendingReviewCount = extracted.filter(e => e.status === 'New' || e.status === 'Needs owner review').length;

  const requiredApprovals = useMemo(() => {
    const req: (keyof Approvals)[] = [];
    if (extracted.some(e => e.group === 'technical')) req.push('rd', 'quality');
    if (p.primaryDriver === 'Decarbonisation' || p.primaryDriver === 'Bio-based transition' || p.primaryDriver === 'Circularity'
        || attachments.some(a => a.category === 'sustainability')) req.push('sustainability');
    if (attachments.some(a => a.category === 'regulatory') || extracted.some(e => e.group === 'regulatory')) req.push('regulatory');
    if (extracted.some(e => e.group === 'commercial') || attachments.some(a => a.category === 'procurement')) req.push('procurement');
    if (attachments.some(a => a.category === 'customer') || extracted.some(e => e.group === 'customer')) req.push('sales', 'productBU');
    if (extracted.some(e => /claim/i.test(e.text))) req.push('marketing');
    return Array.from(new Set(req));
  }, [extracted, p.primaryDriver, attachments]);

  const benchmarkReadinessScore = useMemo(() => {
    let s = 0; let total = 0;
    const add = (cond: boolean) => { total++; if (cond) s++; };
    add(!!bench.benchmarkType);
    add(acceptedMust.length + manualMust.length > 0);
    add(acceptedDeal.length + manualDeal.length > 0);
    add(extracted.filter(e => e.group === 'metrics' && e.status === 'Accepted').length > 0);
    add(extracted.filter(e => e.group === 'sustainability' && e.status === 'Accepted').length > 0 || !attachments.some(a => a.category === 'sustainability'));
    add(extracted.filter(e => e.group === 'regulatory' && e.status === 'Accepted').length > 0 || !attachments.some(a => a.category === 'regulatory'));
    add(extracted.filter(e => e.group === 'commercial' && e.status === 'Accepted').length > 0 || !attachments.some(a => a.category === 'procurement'));
    add(requiredApprovals.every(k => approvals[k]));
    add(conflicts.length === 0);
    return Math.round((s/total)*100);
  }, [bench, acceptedMust, manualMust, acceptedDeal, manualDeal, extracted, attachments, requiredApprovals, approvals, conflicts]);

  const benchmarkStatus = useMemo(() => {
    if (benchmarkReadinessScore === 0) return { label: 'Not benchmark-ready', tone: 'muted' as const };
    if (benchmarkReadinessScore < 50) return { label: 'Partially benchmark-ready', tone: 'amber' as const };
    if (benchmarkReadinessScore < 85) return { label: 'Pilot-scope-ready', tone: 'blue' as const };
    return { label: 'Benchmark-ready', tone: 'green' as const };
  }, [benchmarkReadinessScore]);

  const completionLevel: WorkflowStatus = useMemo(() => {
    if (!prioritisationComplete) return 'Draft';
    if (evidenceReadiness.label !== 'Evidence-ready' && evidenceReadiness.label !== 'Evidence needs review') return 'Prioritisation-ready';
    if (benchmarkStatus.label !== 'Benchmark-ready') return 'Evidence-ready';
    if (!decision.nextDecision || !decision.decisionOwner) return 'Benchmark-ready';
    if (decision.nextDecision === 'Launch customer discussion' || decision.nextDecision === 'Start supplier engagement') return 'Market-introduction-ready';
    if (benchmarkStatus.label === 'Benchmark-ready' && priorityScore >= 16) return 'Ready for VCG.AI intelligence scan';
    return 'Market-introduction-ready';
  }, [prioritisationComplete, evidenceReadiness, benchmarkStatus, decision, priorityScore]);

  const recommendedAction = useMemo(() => {
    if (!prioritisationComplete) return 'Complete prioritisation inputs to score this material.';
    if (attachments.length === 0) return 'Attach incumbent or target documentation to begin evidence collection.';
    if (extracted.length === 0) return 'Run AI extraction on uploaded evidence to surface requirements.';
    if (conflicts.length > 0) return `Resolve ${conflicts.length} conflict${conflicts.length>1?'s':''} between extracted requirements before validating.`;
    if (pendingReviewCount > 0) return `Validate ${pendingReviewCount} extracted requirement${pendingReviewCount>1?'s':''}.`;
    if (!bench.benchmarkType) return 'Define a benchmark reference (incumbent or target) on the Validate tab.';
    const missingApprovals = requiredApprovals.filter(k => !approvals[k]);
    if (missingApprovals.length > 0) return `Collect ${missingApprovals.length} functional approval${missingApprovals.length>1?'s':''} before launching benchmarking.`;
    if (priorityScore >= 16 && benchmarkStatus.label === 'Benchmark-ready') return 'Launch a VCG.AI intelligence scan — this brief is benchmark-ready and high-priority.';
    return 'Confirm the next decision and assign a decision owner.';
  }, [prioritisationComplete, attachments, extracted, conflicts, pendingReviewCount, bench, requiredApprovals, approvals, priorityScore, benchmarkStatus]);

  // ----- Persist brief progress for external readers (e.g. ValueChain hero) -----
  useEffect(() => {
    const detailsDone = !!(p.materialName && p.intent && p.applicationArea && p.requiredFunction && p.currentStatus && p.primaryDriver) || !!savedSteps.details;
    const scoringDone = !!(p.commercialImportance && p.sustainabilityImpact && p.supplyRisk && p.customerPull && p.urgency) || !!savedSteps.scoring;
    const evidenceDone = evidenceReadiness.label === 'Evidence-ready' || !!savedSteps.evidence;
    const extractDone = (extracted.length > 0 && pendingReviewCount === 0 && conflicts.length === 0) || !!savedSteps.extract;
    const decideDone = !!(decision.nextDecision && decision.decisionOwner) || !!savedSteps.decide;
    const flags = [detailsDone, scoringDone, evidenceDone, extractDone, decideDone];
    const doneCount = flags.filter(Boolean).length;
    const totalCount = flags.length;
    const completion = Math.round((doneCount / totalCount) * 100);
    try {
      localStorage.setItem(
        `material_brief_progress_${cat}_${decodedTopic}`,
        JSON.stringify({ completion, doneCount, totalCount }),
      );
      window.dispatchEvent(new Event('materialBriefUpdated'));
    } catch { /* ignore */ }
  }, [cat, decodedTopic, p, savedSteps, evidenceReadiness, extracted, pendingReviewCount, conflicts, decision]);

  // ----- Intent-aware language -----
  const lang = p.intent === 'replace'
    ? { benchmarkLabel: 'Incumbent material', supplyHint: 'How vulnerable is the current supply situation?', benchmarkQuestion: 'What must the replacement match or improve?' }
    : { benchmarkLabel: 'Target benchmark', supplyHint: 'How uncertain is future availability or scale-up?', benchmarkQuestion: 'What must the new material enable or outperform?' };

  // ----- Handlers -----
  const addAttachment = (categoryKey: string) => {
    const cat = ATTACHMENT_CATEGORIES.find(c => c.key === categoryKey)!;
    const id = `att_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    setAttachments(prev => [...prev, {
      id,
      name: `New ${cat.label.toLowerCase()} ${prev.filter(a=>a.category===categoryKey).length + 1}.pdf`,
      category: categoryKey,
      attachmentType: ATTACHMENT_TYPES[0],
      sourceFunction: cat.contributors[0] || 'R&D',
      relatedPathway: p.intent === 'replace' ? 'Replacement only' : p.intent === 'introduce' ? 'New introduction only' : 'Both',
      confidence: 'Draft / unvalidated',
      notes: '',
    }]);
    toast.success('Attachment added — fill metadata below.');
  };

  const removeAttachment = (id: string) => setAttachments(prev => prev.filter(a => a.id !== id));
  const updateAttachment = (id: string, patch: Partial<Attachment>) =>
    setAttachments(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));

  const runExtraction = useCallback(() => {
    if (attachments.length === 0) { toast.error('Upload evidence first.'); return; }
    const generated: ExtractedItem[] = [];
    const mk = (group: ExtractedItem['group'], text: string, opts: Partial<ExtractedItem> = {}): ExtractedItem => ({
      id: `ex_${group}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      text, source: opts.source || 'multiple', confidence: 'Medium', owner: 'Unassigned',
      status: 'New', group, ...opts,
    });
    attachments.forEach(a => {
      if (a.category === 'product' || a.category === 'incumbent') {
        generated.push(mk('technical', 'Must maintain viscosity range within 5% of incumbent', { source: a.name, type: 'Must-have' }));
        generated.push(mk('technical', 'Must be compatible with existing formulation pH 6–8', { source: a.name, type: 'Must-have' }));
        generated.push(mk('metrics', 'Tensile strength', { source: a.name, value: '≥ 28', unit: 'MPa', type: 'Must-have', confidence: 'High' }));
      }
      if (a.category === 'sustainability') {
        generated.push(mk('sustainability', 'Product carbon footprint', { source: a.name, value: '≤ 1.8', unit: 'kg CO2e/kg', confidence: 'Medium' }));
        generated.push(mk('sustainability', 'Bio-based content ≥ 50% (mass balance unclear — verify)', { source: a.name, confidence: 'Low', status: 'Conflict detected' }));
      }
      if (a.category === 'regulatory') {
        generated.push(mk('regulatory', 'REACH SVHC compliance required', { source: a.name, region: 'EU', type: 'High' }));
        generated.push(mk('regulatory', 'Food-contact approval (FDA 21 CFR 175)', { source: a.name, region: 'US', type: 'Critical' }));
      }
      if (a.category === 'procurement') {
        generated.push(mk('commercial', 'Maximum price premium vs incumbent', { source: a.name, value: '+15%', type: 'Must-have' }));
        generated.push(mk('commercial', 'Minimum supply volume', { source: a.name, value: '500', unit: 't/year' }));
      }
      if (a.category === 'customer') {
        generated.push(mk('customer', 'Drop-in replacement required by key account Q4', { source: a.name, type: 'Must-have' }));
        generated.push(mk('customer', 'Bio-based claim requested for retail packaging', { source: a.name }));
      }
    });
    if (generated.length === 0) {
      generated.push({
        id: `ex_default_${Date.now()}`, group: 'technical', text: 'No structured requirements detected — upload technical or specification documents.',
        source: 'system', confidence: 'Low', owner: 'Unassigned', status: 'Needs owner review',
      });
    }
    setExtracted(prev => [...prev, ...generated]);
    toast.success(`Extracted ${generated.length} requirements from ${attachments.length} document${attachments.length>1?'s':''}.`);
  }, [attachments]);

  const updateExtracted = (id: string, patch: Partial<ExtractedItem>) =>
    setExtracted(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  const removeExtracted = (id: string) => setExtracted(prev => prev.filter(e => e.id !== id));

  // Recommended VCG.AI module
  const recommendedModule = useMemo(() => {
    if (p.urgency >= 4) return 'Rapid opportunity scan';
    if (attachments.some(a => a.category === 'sustainability') || p.primaryDriver === 'Decarbonisation') return 'Feedstock and sustainability route comparison';
    if (extracted.some(e => /supplier|MOQ|sourcing/i.test(e.text))) return 'Supplier and scale-up intelligence';
    if (p.currentStatus === 'New opportunity' || p.currentStatus === 'Strategic exploration') return 'BioLinks production route mapping';
    if (p.primaryDriver === 'Innovation roadmap') return 'Patent and R&D activity analysis';
    if (p.urgency <= 2) return 'Market monitoring workflow';
    return 'Commercial project and scale-up intelligence';
  }, [p, attachments, extracted]);

  // Decision matrix quadrant
  const matrixQuadrant = useMemo(() => {
    const pri = priorityScore >= 16 ? 'high' : priorityScore >= 11 ? 'med' : 'low';
    const br = benchmarkReadinessScore >= 70 ? 'high' : benchmarkReadinessScore >= 40 ? 'med' : 'low';
    if (pri === 'high' && br === 'high') return { label: 'Launch VCG.AI intelligence scan', tone: 'green' as const };
    if (pri === 'high' && br === 'low')  return { label: 'Align requirements first', tone: 'amber' as const };
    if (pri === 'low'  && br === 'high') return { label: 'Monitor', tone: 'blue' as const };
    if (pri === 'low'  && br === 'low')  return { label: 'Park or complete later', tone: 'muted' as const };
    return { label: 'Continue building evidence', tone: 'blue' as const };
  }, [priorityScore, benchmarkReadinessScore]);

  // ============================================================================
  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-full overflow-y-auto bg-background">
        <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">

          {/* Back link */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/landscape/${category}/${topic}/value-chain`)}
            className="gap-1.5 h-7 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>

          {/* Header */}
          {(() => {
            const ownerMember = team.find(m => m.role === 'Owner');
            const ownerName = ownerMember?.name || decision.decisionOwner || 'Jane Goodwin';
            const contributorNames = team.filter(m => m.role === 'Contributor').map(m => m.name);
            const initials = (name: string) => name.split(/[\s\/]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
            const ownerTone = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/50';
            const contributorTone = 'bg-muted text-muted-foreground ring-1 ring-border';
            const Avatar = ({ name, tone }: { name: string; tone: string }) => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cls(
                    'inline-flex items-center justify-center w-8 h-8 rounded-full text-[10px] font-bold border border-background',
                    tone,
                  )}>{initials(name)}</span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">{name}</TooltipContent>
              </Tooltip>
            );
            return (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wand2 className="w-4 h-4 text-foreground" />
                    <h1 className="text-[10px] uppercase tracking-widest font-semibold text-foreground">
                      Material Brief
                    </h1>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-xl font-semibold text-foreground leading-tight">{p.materialName || '—'}</div>
                    <StatusPill tone={completionLevel === 'Ready for VCG.AI intelligence scan' ? 'green' : completionLevel === 'Draft' ? 'muted' : 'blue'}>{completionLevel}</StatusPill>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Owner</span>
                    <Avatar name={ownerName} tone={ownerTone} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Contributors</span>
                    <div className="flex -space-x-2">
                      {contributorNames.slice(0, 5).map((n) => (
                        <Avatar key={n} name={n} tone={contributorTone} />
                      ))}
                      {contributorNames.length > 5 && (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-background">
                          +{contributorNames.length - 5}
                        </span>
                      )}
                      {contributorNames.length === 0 && (
                        <span className="text-[10px] text-muted-foreground italic">No contributors</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Team</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTeamDialogOpen(true)}
                      className="h-8 px-2.5 text-[11px] gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Manage ({team.length})
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}

          {(() => {
            const detailsDone = !!(p.materialName && p.intent && p.applicationArea && p.requiredFunction && p.currentStatus && p.primaryDriver) || !!savedSteps.details;
            const detailsStarted = !!(p.materialName || p.intent || p.applicationArea || p.requiredFunction || p.currentStatus || p.primaryDriver);
            const scoringDone = !!(p.commercialImportance && p.sustainabilityImpact && p.supplyRisk && p.customerPull && p.urgency) || !!savedSteps.scoring;
            const scoringStarted = !!(p.commercialImportance || p.sustainabilityImpact || p.supplyRisk || p.customerPull || p.urgency);
            const evidenceDone = evidenceReadiness.label === 'Evidence-ready' || !!savedSteps.evidence;
            const evidenceStarted = attachments.length > 0;
            const extractDone = (extracted.length > 0 && pendingReviewCount === 0 && conflicts.length === 0) || !!savedSteps.extract;
            const extractStarted = extracted.length > 0;
            const validateDone = benchmarkStatus.label === 'Benchmark-ready' || !!savedSteps.validate;
            const validateStarted = !!(bench.benchmarkType || bench.incumbent || bench.targetBenchmark || bench.performanceBaseline);
            const decideDone = !!(decision.nextDecision && decision.decisionOwner) || !!savedSteps.decide;
            const decideStarted = !!(decision.nextDecision || decision.decisionOwner || decision.notes || decision.targetDate);
            const stepStatus: Record<string, boolean> = {
              details: detailsDone, scoring: scoringDone, evidence: evidenceDone,
              extract: extractDone, validate: validateDone, decide: decideDone,
            };
            const stepStarted: Record<string, boolean> = {
              details: detailsStarted, scoring: scoringStarted, evidence: evidenceStarted,
              extract: extractStarted, validate: validateStarted, decide: decideStarted,
            };
            const doneCount = Object.values(stepStatus).filter(Boolean).length;
            const totalCount = STEPS.length;
            const pct = Math.round((doneCount / totalCount) * 100);
            const stepsCompleted = doneCount;
            const totalSteps = totalCount;
            const briefCompletion = pct;
            const priorityPct = Math.round((priorityScore / 25) * 100);

            const ringColor = (v: number) =>
              v >= 70 ? 'hsl(142 71% 45%)' : v >= 40 ? 'hsl(38 92% 50%)' : 'hsl(var(--muted-foreground))';

            const Ring = ({ pct, label, value, sub }: { pct: number; label: string; value: string; sub?: string }) => {
              const r = 42, c = 2 * Math.PI * r;
              const stroke = ringColor(pct);
              return (
                <div className="flex items-center gap-4">
                  <div className="relative w-[104px] h-[104px] shrink-0">
                    <svg viewBox="0 0 104 104" className="w-full h-full -rotate-90">
                      <circle cx="52" cy="52" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                      <circle cx="52" cy="52" r={r} fill="none" stroke={stroke} strokeWidth="12"
                        strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="round"
                        className="transition-all duration-500" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">{value}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</div>
                    {sub && <div className="text-[11px] text-foreground mt-0.5 truncate">{sub}</div>}
                  </div>
                </div>
              );
            };

            return (
              <>
              <div className="grid grid-cols-12 gap-4 items-stretch">
                {/* Guided steps - main */}
                <div className="col-span-12 lg:col-span-9 rounded-xl border border-border bg-card p-4 space-y-4 min-h-[440px]">
                  <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-foreground">Guided process</div>
                      <p className="text-xs text-muted-foreground mt-0.5">Work through each step — open a card to fill in its details.</p>
                    </div>
                    <div className="flex items-center gap-3 min-w-[220px]">
                      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold tabular-nums text-foreground">{doneCount}/{totalCount}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {STEPS.filter(s => s.value !== 'extract').map((s, i) => {
                      const Icon = s.icon;
                      const done = stepStatus[s.value];
                      const started = stepStarted[s.value] && !done;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => openStep(s.value)}
                          className="group relative overflow-hidden flex flex-col items-start justify-between gap-2 min-h-[170px] p-4 rounded-xl border border-border bg-background text-left transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-foreground/40"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-muted text-muted-foreground">
                              <Icon className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground">
                              STEP {i + 1}
                            </span>
                          </div>
                          <div className="space-y-1 w-full">
                            <div className="text-xs font-semibold leading-tight whitespace-normal text-foreground">{s.label}</div>
                            <div className="text-[11px] leading-snug whitespace-normal text-muted-foreground">
                              {s.sub}
                            </div>
                          </div>
                          <span className={cls(
                            'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded',
                            done
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : started
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                : 'bg-muted text-muted-foreground'
                          )}>
                            {done && <CheckCircle2 className="w-3 h-3" />}
                            {done ? 'Completed' : started ? 'In progress' : 'Not started'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Score rings - side panel */}
                <div className="col-span-12 lg:col-span-3 rounded-xl border border-border bg-card p-4 flex flex-col self-start">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-foreground">Scores</div>
                  <div className="mt-4 space-y-4">
                    <Ring pct={briefCompletion} label="Brief progress" value={`${stepsCompleted}/${totalSteps}`} sub={`${briefCompletion}% complete`} />
                    <div className="h-px bg-border" />
                    <Ring pct={priorityPct} label="Priority" value={`${priorityScore}`} sub={priorityStatus.label} />
                  </div>
                </div>
                </div>

                {(() => {
                  const s = STEPS.find(st => st.value === 'extract');
                  if (!s) return null;
                  const Icon = s.icon;
                  const done = stepStatus.extract;
                  const started = stepStarted.extract && !done;
                  return (
                    <button
                      type="button"
                      onClick={() => openStep('extract')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card text-left transition-all hover:shadow-md hover:border-foreground/40"
                    >
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-muted-foreground shrink-0">
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Next step</div>
                        <div className="text-sm font-semibold text-foreground leading-tight">{s.label}</div>
                        <div className="text-[11px] text-muted-foreground leading-snug">{s.sub}</div>
                      </div>
                      <span className={cls(
                        'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded shrink-0',
                        done
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : started
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : 'bg-muted text-muted-foreground'
                      )}>
                        {done && <CheckCircle2 className="w-3 h-3" />}
                        {done ? 'Completed' : started ? 'In progress' : 'Not started'}
                      </span>
                    </button>
                  );
                })()}
              </>
            );
          })()}





          <Dialog open={stepDialogOpen} onOpenChange={setStepDialogOpen}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 [&_input]:text-xs [&_input]:h-9 [&_textarea]:text-xs [&_[role=combobox]]:text-xs [&_[role=combobox]]:h-9">
              {(() => {
                const current = STEPS.find(s => s.value === activeTab);
                if (!current) return null;
                const Icon = current.icon;
                const idx = STEPS.findIndex(s => s.value === activeTab) + 1;
                const stepFill: Record<string, number> = {
                  details: [p.materialName, p.intent, p.applicationArea, p.requiredFunction, p.currentStatus, p.primaryDriver].filter(Boolean).length / 6,
                  scoring: [p.commercialImportance, p.sustainabilityImpact, p.supplyRisk, p.customerPull, p.urgency].filter(Boolean).length / 5,
                  evidence: Math.min(attachments.length, 3) / 3,
                  extract: extracted.length === 0 ? 0 : Math.max(0, 1 - (pendingReviewCount + conflicts.length) / Math.max(extracted.length, 1)),
                  validate: [bench.benchmarkType, bench.incumbent, bench.targetBenchmark, bench.performanceBaseline].filter(Boolean).length / 4,
                  decide: [decision.nextDecision, decision.decisionOwner, decision.notes, decision.targetDate].filter(Boolean).length / 4,
                };
                const fillPct = Math.round((savedSteps[activeTab] ? 1 : (stepFill[activeTab] ?? 0)) * 100);
                return (
                  <div className="relative px-6 pt-5 pb-4 border-b border-border">
                    <div className="absolute inset-x-0 top-0 h-1 bg-muted overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${fillPct}%`, background: current.ring }}
                      />
                    </div>
                    <DialogHeader className="space-y-1">
                      <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                        <span className={cls('inline-flex items-center justify-center w-7 h-7 rounded-lg', current.tint)}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground">STEP {idx}</span>
                        <span className="text-muted-foreground">·</span>
                        <span>{current.label}</span>
                        <span className="ml-auto text-[10px] font-semibold tabular-nums text-muted-foreground">{fillPct}%</span>
                      </DialogTitle>
                      <DialogDescription className="text-xs">{current.sub}</DialogDescription>
                    </DialogHeader>
                  </div>
                );
              })()}
              <div className="overflow-y-auto px-6 py-4 max-h-[calc(90vh-180px)]">
              <Tabs value={activeTab} onValueChange={setActiveTab}>



                {/* =================== TAB 1: MATERIAL DETAILS =================== */}
                <TabsContent value="details" className="mt-4 space-y-4">
                  <div className="rounded-xl border border-border bg-card p-4 space-y-4">


                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel required owner="R&D / Product">Material name / identifier</FieldLabel>
                        <Input value={p.materialName} onChange={e => setPField('materialName', e.target.value)}
                          placeholder="e.g. bio-based surfactant, lactic acid, acrylic acid, PET alternative" />
                      </div>
                      <div>
                        <FieldLabel required owner="R&D / Product">Material intent</FieldLabel>
                        <div className="inline-flex bg-muted rounded-md p-1">
                          {([['replace','Replace existing material'],['introduce','Introduce new material']] as const).map(([k, label]) => (
                            <button key={k} type="button" onClick={() => setPField('intent', k as Intent)}
                              className={cls('px-3 py-1.5 text-xs rounded transition-colors',
                                p.intent === k ? 'bg-foreground text-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <FieldLabel required owner="Product / R&D">Applications</FieldLabel>
                        <Input value={p.applicationArea} onChange={e => setPField('applicationArea', e.target.value)}
                          placeholder="e.g. laundry detergent, adhesive formulation, packaging film, surface treatment" />
                      </div>
                      <div>
                        <FieldLabel required owner="R&D">Required function</FieldLabel>
                        <Input
                          value={p.requiredFunction}
                          onChange={e => setPField('requiredFunction', e.target.value)}
                          placeholder="Describe the required function"
                        />
                      </div>
                      <div>
                        <FieldLabel required owner="Project lead">Primary driver</FieldLabel>
                        <Select value={p.primaryDriver} onValueChange={v => setPField('primaryDriver', v)}>
                          <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                          <SelectContent>{PRIMARY_DRIVER.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* =================== TAB 2: STRATEGIC SCORING =================== */}
                <TabsContent value="scoring" className="mt-4 space-y-4">
                  <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                    <p className="text-xs text-muted-foreground">Rate 1 (low) to 5 (high). The combined score determines material priority.</p>



                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <FieldLabel owner="Product / BU" required>Commercial importance</FieldLabel>
                        <StarRating value={p.commercialImportance} onChange={v => setPField('commercialImportance', v)}
                          scale={['Low commercial relevance','Limited business exposure','Meaningful business relevance','Important across products / regions','Strategic / high-impact']} />
                      </div>
                      <div>
                        <FieldLabel owner="Sustainability" required>Sustainability impact potential</FieldLabel>
                        <StarRating value={p.sustainabilityImpact} onChange={v => setPField('sustainabilityImpact', v)}
                          scale={['Minimal relevance','Some relevance','Moderate improvement potential','Strong opportunity','Major decarbonisation / circularity priority']} />
                      </div>
                      <div>
                        <FieldLabel owner="Procurement" required hint={lang.supplyHint}>Supply risk / availability concern</FieldLabel>
                        <StarRating value={p.supplyRisk} onChange={v => setPField('supplyRisk', v)}
                          scale={['Stable, low concern','Minor concern','Some supplier/price/regional risk','High dependency or volatility','Critical supply or scale-up risk']} />
                      </div>
                      <div>
                        <FieldLabel owner="Sales / Product / Marketing" required>Customer / market pull</FieldLabel>
                        <StarRating value={p.customerPull} onChange={v => setPField('customerPull', v)}
                          scale={['No clear demand','Early interest','Relevant for selected customers','Strong customer/market pull','Critical customer requirement']} />
                      </div>
                      <div>
                        <FieldLabel owner="Project lead / Strategy" required>Urgency</FieldLabel>
                        <StarRating value={p.urgency} onChange={v => setPField('urgency', v)}
                          scale={['Exploratory / no timeline','Long-term roadmap','Assess within 12–24 months','Decision needed within 6–12 months','Immediate priority / external deadline']} />
                      </div>
                      <div>
                        <FieldLabel>Urgency driver note</FieldLabel>
                        <Input value={p.urgencyNote} onChange={e => setPField('urgencyNote', e.target.value)}
                          placeholder="e.g. customer deadline, sustainability target, supplier issue, regulation, product launch" />
                      </div>
                    </div>
                  </div>

                  {/* Missing inputs hint */}
                  {missingPrioritisation.length > 0 && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Missing prioritisation inputs
                      </div>
                      <div className="text-[11px] text-muted-foreground">{missingPrioritisation.join(' · ')}</div>
                    </div>
                  )}
                </TabsContent>


                {/* =================== TAB 2: ATTACH EVIDENCE =================== */}
                <TabsContent value="evidence" className="mt-4 space-y-5">
                  <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <SectionTitle icon={<Upload className="w-4 h-4 text-primary" />}
                      hint="Upload or link the documents that define what this material must achieve, what it should be benchmarked against, and what constraints must be considered.">
                      Material requirements
                    </SectionTitle>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getAttachmentCategories(p.intent).map(category => {
                        const items = attachments.filter(a => a.category === category.key);
                        return (
                          <div key={category.key} className="border border-border rounded-lg p-3 bg-background/50">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-foreground">{category.label}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{category.examples}</div>
                                <div className="text-[10px] text-muted-foreground mt-1">
                                  Contributors: {category.contributors.join(', ')}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {items.length === 0
                                  ? <StatusPill tone="muted">empty</StatusPill>
                                  : <StatusPill tone="green">{items.length}</StatusPill>}
                              </div>
                            </div>
                            <div className="space-y-2 mt-2">
                              {items.map(item => (
                                <div key={item.id} className="border border-border rounded-md p-2 bg-card space-y-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <Input value={item.name} onChange={e => updateAttachment(item.id, { name: e.target.value })}
                                      className="h-7 text-xs flex-1" />
                                    <button onClick={() => removeAttachment(item.id)} className="text-muted-foreground hover:text-red-500">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Select value={item.attachmentType} onValueChange={v => updateAttachment(item.id, { attachmentType: v })}>
                                      <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>{ATTACHMENT_TYPES.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select value={item.sourceFunction} onValueChange={v => updateAttachment(item.id, { sourceFunction: v })}>
                                      <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>{SOURCE_FUNCTIONS.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select value={item.relatedPathway} onValueChange={v => updateAttachment(item.id, { relatedPathway: v })}>
                                      <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>{RELATED_PATHWAYS.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select value={item.confidence} onValueChange={v => updateAttachment(item.id, { confidence: v })}>
                                      <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>{CONFIDENCE_OPTS.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}</SelectContent>
                                    </Select>
                                  </div>
                                  {(item.confidence === 'Superseded / outdated') && (
                                    <div className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Outdated — replace before using for benchmarking.
                                    </div>
                                  )}
                                  {(item.confidence === 'Supplier-provided' && category.key === 'sustainability') && (
                                    <div className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Supplier-provided sustainability claim — request independent verification.
                                    </div>
                                  )}
                                  <Input value={item.notes} onChange={e => updateAttachment(item.id, { notes: e.target.value })}
                                    placeholder="Notes…" className="h-7 text-[11px]" />
                                </div>
                              ))}
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => addAttachment(category.key)}>
                                  <Upload className="w-3 h-3 mr-1" /> Upload / link
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.info(`Request sent to ${category.contributors[0]}`)}>
                                  <UserPlus className="w-3 h-3 mr-1" /> Request
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-foreground">Evidence readiness</div>
                      <div className="text-[11px] text-muted-foreground">{attachments.length} document{attachments.length!==1?'s':''} across {new Set(attachments.map(a=>a.category)).size} categor{new Set(attachments.map(a=>a.category)).size===1?'y':'ies'}</div>
                    </div>
                    <StatusPill tone={evidenceReadiness.tone}>{evidenceReadiness.label}</StatusPill>
                  </div>
                </TabsContent>

                {/* =================== TAB 3: EXTRACT REQUIREMENTS =================== */}
                <TabsContent value="extract" className="mt-4 space-y-5">
                  <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <SectionTitle icon={<Sparkles className="w-4 h-4 text-primary" />}
                        hint="AI-generated extraction from uploaded documents. Review before using these requirements for benchmarking or market introduction decisions.">
                        Material brief summary
                      </SectionTitle>
                      <Button size="sm" onClick={runExtraction} className="shrink-0">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Run AI extraction
                      </Button>
                    </div>

                    {extracted.length === 0 && (
                      <div className="text-center py-10 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                        Upload evidence and run extraction to surface technical, sustainability, regulatory, commercial and customer requirements.
                      </div>
                    )}

                    {extracted.length > 0 && (
                      <div className="space-y-4">
                        {([
                          ['technical', 'Technical requirements'],
                          ['metrics', 'Key performance metrics'],
                          ['sustainability', 'Sustainability baseline and requirements'],
                          ['regulatory', 'Regulatory and compliance constraints'],
                          ['commercial', 'Commercial and procurement constraints'],
                          ['customer', 'Customer, product and claims requirements'],
                        ] as const).map(([groupKey, groupLabel]) => {
                          const rows = extracted.filter(e => e.group === groupKey);
                          if (rows.length === 0) return null;
                          return (
                            <div key={groupKey} className="border border-border rounded-lg overflow-hidden">
                              <div className="bg-muted/50 px-3 py-2 text-[10px] uppercase tracking-widest font-bold text-foreground">
                                {groupLabel} <span className="text-muted-foreground">({rows.length})</span>
                              </div>
                              <div className="divide-y divide-border">
                                {rows.map(r => (
                                  <div key={r.id} className="p-3 space-y-2">
                                    <div className="flex items-start gap-2">
                                      <div className="flex-1 min-w-0">
                                        <Input value={r.text} onChange={e => updateExtracted(r.id, { text: e.target.value, status: r.status === 'New' ? 'Edited' : r.status })}
                                          className="h-7 text-xs" />
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                          <Link2 className="w-3 h-3" /> {r.source}
                                          <span>·</span>
                                          <span>Confidence: {r.confidence}</span>
                                          {r.value && <><span>·</span><span className="font-medium text-foreground">{r.value} {r.unit || ''}</span></>}
                                          {r.region && <><span>·</span><span>{r.region}</span></>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {r.status === 'Conflict detected' && <StatusPill tone="red">conflict</StatusPill>}
                                        {r.status === 'Accepted' && <StatusPill tone="green">accepted</StatusPill>}
                                        {r.status === 'Rejected' && <StatusPill tone="muted">rejected</StatusPill>}
                                        {r.status === 'Edited' && <StatusPill tone="blue">edited</StatusPill>}
                                        {(r.status === 'New' || r.status === 'Needs owner review') && <StatusPill tone="amber">needs review</StatusPill>}
                                      </div>
                                    </div>
                                    <div className="flex items-center flex-wrap gap-1.5">
                                      <Select value={r.type || ''} onValueChange={v => updateExtracted(r.id, { type: v })}>
                                        <SelectTrigger className="h-6 text-[10px] w-32"><SelectValue placeholder="Importance" /></SelectTrigger>
                                        <SelectContent>
                                          {['Must-have','Nice-to-have','Deal-breaker','Open question','To validate','Low','Medium','High','Critical'].map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                      <Input value={r.owner} onChange={e => updateExtracted(r.id, { owner: e.target.value })}
                                        placeholder="Assign owner" className="h-6 text-[10px] w-32" />
                                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateExtracted(r.id, { status: 'Accepted' })}>
                                        <Check className="w-3 h-3 mr-1" /> Accept
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => updateExtracted(r.id, { status: 'Rejected' })}>
                                        <X className="w-3 h-3 mr-1" /> Reject
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-6 text-[10px] text-muted-foreground" onClick={() => removeExtracted(r.id)}>
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Summary */}
                    {extracted.length > 0 && (
                      <div className="grid grid-cols-4 gap-3 pt-2 border-t border-border">
                        <div className="text-center">
                          <div className="text-lg font-bold text-foreground tabular-nums">{extracted.length}</div>
                          <div className="text-[10px] text-muted-foreground">total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{extracted.filter(e=>e.status==='Accepted').length}</div>
                          <div className="text-[10px] text-muted-foreground">accepted</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">{pendingReviewCount}</div>
                          <div className="text-[10px] text-muted-foreground">pending review</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">{conflicts.length}</div>
                          <div className="text-[10px] text-muted-foreground">conflicts</div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>



                {/* =================== TAB 5: DECIDE NEXT STEP =================== */}
                <TabsContent value="decide" className="mt-4 space-y-5">
                  <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <SectionTitle icon={<Compass className="w-4 h-4 text-primary" />}>Decision and next step</SectionTitle>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel required>Next decision</FieldLabel>
                        <Select value={decision.nextDecision} onValueChange={v => setDecision(d => ({...d, nextDecision: v}))}>
                          <SelectTrigger><SelectValue placeholder="Select next decision" /></SelectTrigger>
                          <SelectContent>{NEXT_DECISIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel required>Decision owner</FieldLabel>
                        <Input value={decision.decisionOwner} onChange={e => setDecision(d => ({...d, decisionOwner: e.target.value}))}
                          placeholder="Person or team" />
                      </div>
                      <div>
                        <FieldLabel>Target decision date</FieldLabel>
                        <Input type="date" value={decision.targetDate} onChange={e => setDecision(d => ({...d, targetDate: e.target.value}))} />
                      </div>
                      <div className="col-span-2">
                        <FieldLabel>Notes for decision meeting</FieldLabel>
                        <Textarea value={decision.notes} onChange={e => setDecision(d => ({...d, notes: e.target.value}))} rows={2} />
                      </div>
                    </div>
                  </div>





                  {/* Missing evidence map */}
                  <div className="rounded-xl border border-border bg-card p-5">
                    <SectionTitle icon={<Users className="w-4 h-4 text-primary" />}>Missing evidence by function</SectionTitle>
                    <table className="w-full text-xs mt-3">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                          <th className="py-2 text-left">Function</th>
                          <th className="py-2 text-left">Missing</th>
                          <th className="py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['R&D', !attachments.some(a => a.category === 'product') ? 'Product or formulation requirements' : null],
                          ['Procurement', !attachments.some(a => a.category === 'procurement') ? 'Procurement / sourcing info' : null],
                          ['Sustainability', !attachments.some(a => a.category === 'sustainability') ? 'LCA / sustainability baseline' : null],
                          ['Regulatory', !attachments.some(a => a.category === 'regulatory') ? 'Compliance documentation' : null],
                          ['Product / BU', !attachments.some(a => a.category === 'strategy') ? 'Business case / roadmap' : null],
                          ['Sales / Customer', !attachments.some(a => a.category === 'customer') ? 'Customer specification' : null],
                          
                        ].map(([fn, miss]) => (
                          <tr key={fn as string} className="border-b border-border/50">
                            <td className="py-2 font-medium">{fn}</td>
                            <td className="py-2 text-muted-foreground">{miss || '—'}</td>
                            <td className="py-2">{miss ? <StatusPill tone="amber">missing</StatusPill> : <StatusPill tone="green">covered</StatusPill>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Recommendation */}
                  <div className="rounded-xl border border-primary/40 bg-primary/5 p-5">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <div className="text-[10px] uppercase tracking-widest font-bold text-primary">Recommended next action</div>
                        <div className="text-sm text-foreground">{recommendedAction}</div>
                        <div className="pt-2 border-t border-primary/20">
                          <div className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">Recommended VCG.AI intelligence module</div>
                          <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <FlaskConical className="w-4 h-4" /> {recommendedModule}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              </div>
              <div className="border-t border-border px-6 py-3 flex items-center justify-end gap-2 bg-card">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setStepDialogOpen(false)}>Cancel</Button>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => {
                  setSavedSteps(prev => ({ ...prev, [activeTab]: true }));
                  toast.success('Saved');
                  addActivity({
                    source: 'material-brief',
                    action: 'updated',
                    title: `${decodedTopic} \u2014 ${String(activeTab).charAt(0).toUpperCase() + String(activeTab).slice(1)} step saved`,
                    description: 'Material Brief progress updated',
                    link: typeof window !== 'undefined' ? window.location.pathname : '',
                    topic: decodedTopic,
                  });
                  setStepDialogOpen(false);
                }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Team management dialog */}
          <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4" /> Team for {p.materialName || 'this material'}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Manage who has access to this material brief. Owners can edit everything; contributors can collaborate on sections.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Member list */}
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {team.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-md">
                      No team members yet. Add the first one below.
                    </div>
                  )}
                  {team.map(m => {
                    const initials = m.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
                    const isOwner = m.role === 'Owner';
                    return (
                      <div key={m.id} className="flex items-center gap-2.5 rounded-md border border-border bg-background px-2.5 py-2">
                        <span className={cls(
                          'inline-flex items-center justify-center w-8 h-8 rounded-full text-[10px] font-bold shrink-0',
                          isOwner ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/50' : 'bg-muted text-muted-foreground ring-1 ring-border'
                        )}>{initials || '?'}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-foreground truncate">{m.name}</div>
                          {m.email && <div className="text-[10px] text-muted-foreground truncate">{m.email}</div>}
                        </div>
                        <Select value={m.role} onValueChange={(v: 'Owner' | 'Contributor') => changeRole(m.id, v)}>
                          <SelectTrigger className="h-7 w-[120px] text-[11px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Owner" className="text-xs">Owner</SelectItem>
                            <SelectItem value="Contributor" className="text-xs">Contributor</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeMember(m.id)}
                          aria-label={`Remove ${m.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* Add new */}
                <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <UserPlus className="w-3 h-3" /> Add team member
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={newMember.name}
                      onChange={e => setNewMember(s => ({ ...s, name: e.target.value }))}
                      placeholder="Full name"
                      className="h-8 text-xs"
                      onKeyDown={e => { if (e.key === 'Enter') addMember(); }}
                    />
                    <Input
                      value={newMember.email}
                      onChange={e => setNewMember(s => ({ ...s, email: e.target.value }))}
                      placeholder="email@company.com"
                      type="email"
                      className="h-8 text-xs"
                      onKeyDown={e => { if (e.key === 'Enter') addMember(); }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={newMember.role} onValueChange={(v: 'Owner' | 'Contributor') => setNewMember(s => ({ ...s, role: v }))}>
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Contributor" className="text-xs">Contributor</SelectItem>
                        <SelectItem value="Owner" className="text-xs">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={addMember}>
                      <Plus className="w-3 h-3" /> Add
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setTeamDialogOpen(false)}>
                  Done
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </TooltipProvider>
  );
};

// Manual add helper
const ManualAdder: React.FC<{ onAdd: (v: string) => void; placeholder: string }> = ({ onAdd, placeholder }) => {
  const [v, setV] = useState('');
  return (
    <div className="flex gap-2">
      <Input value={v} onChange={e => setV(e.target.value)} placeholder={placeholder}
        className="h-7 text-xs"
        onKeyDown={e => { if (e.key === 'Enter' && v.trim()) { onAdd(v.trim()); setV(''); } }} />
      <Button size="sm" variant="outline" className="h-7" onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(''); } }}>
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default MaterialBrief;
