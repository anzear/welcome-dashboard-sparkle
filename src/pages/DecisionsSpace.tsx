import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, CheckCircle2, AlertCircle, Circle, Plus, Edit2, Trash2, FileText, Download, Paperclip, Folder, FolderPlus, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { addActivity } from '@/lib/activityNotifications';

type MCStatus = 'cleared' | 'partial' | 'pending' | 'blocker';

const DIMENSIONS: { key: string; label: string; status: MCStatus }[] = [
  { key: 'application', label: 'Application fit', status: 'cleared' },
  { key: 'supplier', label: 'Supplier & Material Readiness', status: 'partial' },
  { key: 'regulatory', label: 'Regulatory & Safety', status: 'cleared' },
  { key: 'sustainability', label: 'Sustainability & Certification Readiness', status: 'partial' },
  { key: 'commercial', label: 'Commercial Value & Customer Acceptance', status: 'pending' },
  { key: 'operational', label: 'Operational Integration', status: 'blocker' },
];

const statusMeta: Record<MCStatus, { icon: React.ElementType; cls: string; label: string }> = {
  cleared: { icon: CheckCircle2, cls: 'text-emerald-600', label: 'Cleared' },
  partial: { icon: Circle, cls: 'text-amber-500', label: 'Partial' },
  pending: { icon: Circle, cls: 'text-muted-foreground/40', label: 'Pending' },
  blocker: { icon: AlertCircle, cls: 'text-destructive', label: 'Blocker' },
};

const DECISION_STATUS = [
  { value: 'go', label: 'Go', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'uncertain', label: 'Uncertain', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'no_go', label: 'No-Go', color: 'bg-red-100 text-red-700 border-red-200' },
];

const normalizeDecisionStatus = (s?: string) => {
  if (!s) return 'uncertain';
  if (s === 'go' || s === 'no_go' || s === 'uncertain') return s;
  return 'uncertain';
};

const CONFIDENCE = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

interface Attachment { name: string; url: string; size?: string; }

interface Decision {
  id: string;
  dimension: string;
  title: string;
  content: string;
  status: string;
  owner: string;
  confidence: string;
  decision_date: string;
  review_date: string;
  created_at: string;
  attachments?: Attachment[];
  supplier?: string;
}

const SEED: Decision[] = [
  {
    id: 'd1', dimension: 'application', title: 'Validate viscosity range with R&D',
    content: 'Confirmed PLA-grade lactic acid meets 0.9–1.1 Pa·s spec in 3 trial batches.',
    status: 'go', owner: 'A. Müller', confidence: 'high',
    decision_date: '2026-04-10', review_date: '2026-07-10',
    created_at: '2026-04-10',
    attachments: [
      { name: 'viscosity-trial-report.pdf', url: '#', size: '1.2 MB' },
      { name: 'batch-data.xlsx', url: '#', size: '340 KB' },
    ],
  },
  {
    id: 'd2', dimension: 'supplier', supplier: 'Corbion', title: 'Qualify Corbion as primary supplier',
    content: 'Corbion qualified — passed audit and meets PLA-grade spec.',
    status: 'go', owner: 'P. Singh', confidence: 'high',
    decision_date: '2026-05-02', review_date: '2026-09-01',
    created_at: '2026-05-02',
    attachments: [
      { name: 'supplier-audit-checklist.pdf', url: '#', size: '820 KB' },
    ],
  },
  {
    id: 'd4', dimension: 'supplier', supplier: 'Galactic',
    title: 'Galactic second-source audit',
    content: 'Audit scheduled Q3. Pending on-site review.',
    status: 'uncertain', owner: 'P. Singh', confidence: 'medium',
    decision_date: '2026-05-10', review_date: '2026-09-15',
    created_at: '2026-05-10',
  },
  {
    id: 'd3', dimension: 'operational', title: 'Line changeover compatibility',
    content: 'Existing fermentation line requires retrofit — blocker until CapEx approved.',
    status: 'no_go', owner: 'J. Costa', confidence: 'high',
    decision_date: '2026-05-15', review_date: '',
    created_at: '2026-05-15',
  },
];

const newId = () => Math.random().toString(36).slice(2, 9);

const DecisionsSpace: React.FC = () => {
  const { category, topic } = useParams<{ category: string; topic: string }>();
  const navigate = useNavigate();
  const decodedTopic = decodeURIComponent(topic || '');

  
  const decisionsKey = `material_decisions_${category}_${topic}`;
  const [activeDim, setActiveDim] = useState(DIMENSIONS[0].key);
  const [decisions, setDecisionsState] = useState<Decision[]>(() => {
    if (typeof window === 'undefined') return SEED;
    try {
      const stored = localStorage.getItem(decisionsKey);
      return stored ? JSON.parse(stored) : SEED;
    } catch { return SEED; }
  });
  const setDecisions = (updater: Decision[] | ((prev: Decision[]) => Decision[])) => {
    setDecisionsState(prev => {
      const next = typeof updater === 'function' ? (updater as (p: Decision[]) => Decision[])(prev) : updater;
      try { localStorage.setItem(decisionsKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Overall and per-dimension Go/Monitor/Pause/No-Go status (localStorage)
  const overallKey = `material_decision_overall_${category}_${topic}`;
  const dimKey = `material_decision_dim_${category}_${topic}`;
  const [overallStatus, setOverallStatus] = useState<string>(() => {
    if (typeof window === 'undefined') return 'uncertain';
    return localStorage.getItem(overallKey) || 'uncertain';
  });
  const [dimStatus, setDimStatus] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(dimKey) || '{}'); } catch { return {}; }
  });
  const setOverall = (v: string) => { setOverallStatus(v); localStorage.setItem(overallKey, v); };
  const setDim = (k: string, v: string) => {
    const next = { ...dimStatus, [k]: v };
    setDimStatus(next);
    localStorage.setItem(dimKey, JSON.stringify(next));
  };

  // Suppliers sub-folders (only used in 'supplier' dimension)
  const suppliersKey = `material_suppliers_${category}_${topic}`;
  const [suppliers, setSuppliers] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['Corbion', 'Galactic'];
    try {
      const stored = JSON.parse(localStorage.getItem(suppliersKey) || 'null');
      return Array.isArray(stored) && stored.length ? stored : ['Corbion', 'Galactic'];
    } catch { return ['Corbion', 'Galactic']; }
  });
  const [activeSupplier, setActiveSupplier] = useState<string | null>(null);
  const persistSuppliers = (next: string[]) => {
    setSuppliers(next);
    localStorage.setItem(suppliersKey, JSON.stringify(next));
  };
  const addSupplier = () => {
    const name = window.prompt('Supplier name')?.trim();
    if (!name) return;
    if (suppliers.includes(name)) { setActiveSupplier(name); return; }
    persistSuppliers([...suppliers, name]);
    setActiveDim('supplier');
    setActiveSupplier(name);
  };
  const removeSupplier = (name: string) => {
    if (!window.confirm(`Remove supplier "${name}"? Decisions remain but lose this tag.`)) return;
    persistSuppliers(suppliers.filter(s => s !== name));
    setDecisions(prev => prev.map(d => d.supplier === name ? { ...d, supplier: undefined } : d));
    if (activeSupplier === name) setActiveSupplier(null);
  };
  const DECISION_OVERALL = [
    { value: 'tbd', label: 'TBD', color: 'bg-muted text-muted-foreground border-border' },
    { value: 'go', label: 'Go', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'uncertain', label: 'Uncertain', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'no_go', label: 'No-Go', color: 'bg-red-100 text-red-700 border-red-200' },
  ];

  // dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Decision | null>(null);
  const [form, setForm] = useState<Omit<Decision, 'id' | 'created_at'>>({
    dimension: DIMENSIONS[0].key, title: '', content: '', status: 'uncertain',
    owner: '', confidence: 'medium', decision_date: '', review_date: '', supplier: '',
  });

  const dim = DIMENSIONS.find(d => d.key === activeDim) || DIMENSIONS[0];
  const meta = statusMeta[dim.status];
  const DimIcon = meta.icon;

  const items = useMemo(() => {
    let list = decisions.filter(d => d.dimension === activeDim);
    if (activeDim === 'supplier' && activeSupplier) {
      list = list.filter(d => d.supplier === activeSupplier);
    }
    return list;
  }, [decisions, activeDim, activeSupplier]);

  // stats for active dimension
  const stats = useMemo(() => {
    const total = items.length;
    const go = items.filter(i => normalizeDecisionStatus(i.status) === 'go').length;
    const open = items.filter(i => normalizeDecisionStatus(i.status) === 'uncertain').length;
    const blockers = items.filter(i => normalizeDecisionStatus(i.status) === 'no_go').length;
    const lastUpdated = items
      .map(i => i.decision_date || i.created_at)
      .sort()
      .slice(-1)[0] || '';
    const today = new Date().toISOString().slice(0, 10);
    const nextReview = items
      .map(i => i.review_date)
      .filter(d => d && d >= today)
      .sort()[0] || '';
    return { total, go, open, blockers, lastUpdated, nextReview };
  }, [items]);

  const overallSummary = useMemo(() => {
    return DIMENSIONS.reduce(
      (acc, d) => { acc[d.status]++; return acc; },
      { cleared: 0, partial: 0, pending: 0, blocker: 0 } as Record<MCStatus, number>
    );
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({
      dimension: activeDim, title: '', content: '', status: 'uncertain',
      owner: '', confidence: 'medium', decision_date: new Date().toISOString().slice(0, 10), review_date: '',
      supplier: activeDim === 'supplier' ? (activeSupplier || '') : '',
    });
    setDialogOpen(true);
  };

  const openEdit = (d: Decision) => {
    setEditingId(d.id);
    setForm({
      dimension: d.dimension, title: d.title, content: d.content, status: d.status,
      owner: d.owner, confidence: d.confidence, decision_date: d.decision_date, review_date: d.review_date,
      supplier: d.supplier || '',
    });
    setDialogOpen(true);
  };

  const saveDecision = () => {
    if (!form.title.trim()) return;
    const dimLabel = DIMENSIONS.find(d => d.key === form.dimension)?.label || form.dimension;
    if (editingId) {
      setDecisions(prev => prev.map(d => d.id === editingId ? { ...d, ...form } : d));
      addActivity({
        source: 'decision-space',
        action: 'updated',
        title: form.title,
        description: `${dimLabel}${form.content ? ` \u2014 ${form.content.slice(0, 80)}` : ''}`,
        link: typeof window !== 'undefined' ? window.location.pathname : '',
        topic: decodedTopic,
      });
    } else {
      setDecisions(prev => [
        ...prev,
        { id: newId(), created_at: new Date().toISOString().slice(0, 10), ...form },
      ]);
      addActivity({
        source: 'decision-space',
        action: 'added',
        title: form.title,
        description: `${dimLabel}${form.content ? ` \u2014 ${form.content.slice(0, 80)}` : ''}`,
        link: typeof window !== 'undefined' ? window.location.pathname : '',
        topic: decodedTopic,
      });
    }
    setDialogOpen(false);
  };

  const deleteDecision = (id: string) => {
    const removed = decisions.find(d => d.id === id);
    setDecisions(prev => prev.filter(d => d.id !== id));
    if (removed) {
      addActivity({
        source: 'decision-space',
        action: 'removed',
        title: removed.title,
        link: typeof window !== 'undefined' ? window.location.pathname : '',
        topic: decodedTopic,
      });
    }
  };

  const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(`/landscape/${category}/${topic}/value-chain`)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Material Overview
          </button>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Target className="w-5 h-5 text-foreground" />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">Decisions Space — {decodedTopic}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Validate this material across six readiness dimensions. Capture decisions, owners, and evidence per dimension.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden grid grid-cols-1 md:grid-cols-[300px_1fr]">
          {/* Sidebar */}
          <div className="border-r border-border bg-muted/20 p-3 space-y-1 max-h-[75vh] overflow-y-auto">
            {DIMENSIONS.map(d => {
              const m = statusMeta[d.status];
              const I = m.icon;
              const isActive = d.key === activeDim;
              const count = decisions.filter(x => x.dimension === d.key).length;
              const dimDec = dimStatus[d.key] || 'tbd';
              const decMeta = DECISION_OVERALL.find(o => o.value === dimDec) || DECISION_OVERALL[0];
              return (
                <div key={d.key}>
                  <button
                    type="button"
                    onClick={() => { setActiveDim(d.key); if (d.key !== 'supplier') setActiveSupplier(null); }}
                    className={`w-full text-left rounded-md border px-2.5 py-2 flex items-start gap-2 transition-all ${isActive ? 'border-primary/50 bg-background shadow-sm' : 'border-border bg-background hover:border-primary/30'}`}
                  >
                    <I className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-foreground leading-snug">{d.label}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${decMeta.color}`}>{decMeta.label}</span>
                        <span className="text-[9px] text-muted-foreground">· {count}</span>
                      </div>
                    </div>
                  </button>

                  {d.key === 'supplier' && isActive && (
                    <div className="mt-1 ml-3 pl-2 border-l border-border space-y-0.5">
                      <button
                        type="button"
                        onClick={() => setActiveSupplier(null)}
                        className={`w-full text-left rounded px-2 py-1 flex items-center gap-1.5 text-[10px] ${activeSupplier === null ? 'bg-foreground text-background font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
                      >
                        <Folder className="w-3 h-3" />
                        <span className="flex-1">All suppliers</span>
                        <span className="text-[9px] opacity-70">{decisions.filter(x => x.dimension === 'supplier').length}</span>
                      </button>
                      {suppliers.map(s => {
                        const sCount = decisions.filter(x => x.dimension === 'supplier' && x.supplier === s).length;
                        const sActive = activeSupplier === s;
                        return (
                          <div key={s} className={`group flex items-center rounded ${sActive ? 'bg-foreground text-background' : 'hover:bg-muted'}`}>
                            <button
                              type="button"
                              onClick={() => setActiveSupplier(s)}
                              className={`flex-1 text-left px-2 py-1 flex items-center gap-1.5 text-[10px] ${sActive ? 'font-semibold' : 'text-foreground/80'}`}
                            >
                              <Folder className="w-3 h-3" />
                              <span className="flex-1 truncate">{s}</span>
                              <span className={`text-[9px] ${sActive ? 'opacity-80' : 'opacity-60'}`}>{sCount}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeSupplier(s); }}
                              className={`opacity-0 group-hover:opacity-100 px-1.5 py-1 ${sActive ? 'text-background/80 hover:text-background' : 'text-muted-foreground hover:text-destructive'}`}
                              title="Remove supplier"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={addSupplier}
                        className="w-full text-left rounded px-2 py-1 flex items-center gap-1.5 text-[10px] text-primary hover:bg-primary/10"
                      >
                        <FolderPlus className="w-3 h-3" />
                        Add supplier
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detail pane */}
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <DimIcon className={`w-4 h-4 ${meta.cls}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${meta.cls}`}>{meta.label}</span>
                </div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                  {dim.label}
                  {activeDim === 'supplier' && activeSupplier && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      <Folder className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-foreground">{activeSupplier}</span>
                    </>
                  )}
                </h2>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest">Category Status</span>
                  {DECISION_OVERALL.map((o, idx) => {
                    const active = (dimStatus[activeDim] || 'tbd') === o.value;
                    return (
                      <React.Fragment key={o.value}>
                        {idx === 1 && <span className="h-4 w-px bg-border mx-1" />}
                        <button
                          onClick={() => setDim(activeDim, o.value)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all ${
                            active ? o.color + ' ring-1 ring-offset-1 ring-foreground/20' : 'bg-background text-muted-foreground border-border hover:bg-muted'
                          }`}
                        >
                          {o.label}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
              <Button size="sm" onClick={openNew} className="h-7 px-3 text-[11px] gap-1.5">
                <Plus className="w-3 h-3" /> New decision
              </Button>
            </div>

            {/* High-level stats */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 py-2">
              {[
                { k: 'Total', v: stats.total, cls: 'text-foreground' },
                { k: 'Go', v: stats.go, cls: 'text-emerald-600' },
                { k: 'Open', v: stats.open, cls: 'text-amber-600' },
                { k: 'Blockers', v: stats.blockers, cls: 'text-destructive' },
              ].map((s, i, arr) => (
                <div key={s.k} className={`flex flex-col ${i < arr.length - 1 ? 'pr-8 border-r border-border' : ''}`}>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{s.k}</div>
                  <div className={`text-xl font-bold tabular-nums leading-tight ${s.cls}`}>{s.v}</div>
                </div>
              ))}
              <div className="flex-1" />
              {[
                { k: 'Last updated', v: stats.lastUpdated ? fmtDate(stats.lastUpdated) : '—' },
                { k: 'Next review', v: stats.nextReview ? fmtDate(stats.nextReview) : '—' },
              ].map(s => (
                <div key={s.k} className="flex flex-col">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{s.k}</div>
                  <div className="text-sm font-semibold tabular-nums text-foreground leading-tight mt-1">{s.v}</div>
                </div>
              ))}
            </div>

            {/* Decision cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground">Decisions</div>
                <div className="text-[10px] text-muted-foreground">{items.length} in this dimension</div>
              </div>

              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
                  <div className="text-[11px] font-semibold text-foreground">No decisions yet</div>
                  <div className="text-[10px] text-muted-foreground mt-1 mb-3">Capture your first decision for this readiness dimension.</div>
                  <Button size="sm" onClick={openNew} className="h-7 px-3 text-[11px] gap-1.5">
                    <Plus className="w-3 h-3" /> Add decision
                  </Button>
                </div>
              ) : (
                items.map(d => {
                  const sStyle = DECISION_STATUS.find(o => o.value === normalizeDecisionStatus(d.status)) || DECISION_STATUS[1];
                  return (
                    <div
                      key={d.id}
                      onClick={() => setViewing(d)}
                      className="rounded-lg border border-border bg-card p-4 group hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-semibold text-foreground">{d.title}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${sStyle.color}`}>
                              {sStyle.label}
                            </span>
                            {d.attachments && d.attachments.length > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
                                <Paperclip className="w-2.5 h-2.5" />{d.attachments.length}
                              </span>
                            )}
                            {d.dimension === 'supplier' && d.supplier && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full border border-border bg-muted/40 text-foreground/80 font-medium">
                                <Folder className="w-2.5 h-2.5" />{d.supplier}
                              </span>
                            )}
                          </div>
                          {d.content && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed mb-2 line-clamp-2">{d.content}</p>
                          )}
                          <div className="flex items-center gap-3 flex-wrap">
                            {d.owner && (
                              <span className="text-[10px] text-muted-foreground">
                                <span className="font-medium text-foreground/70">Owner:</span> {d.owner}
                              </span>
                            )}
                            {d.confidence && (
                              <span className="text-[10px] text-muted-foreground">
                                <span className="font-medium text-foreground/70">Confidence:</span> {CONFIDENCE.find(c => c.value === d.confidence)?.label}
                              </span>
                            )}
                            {d.decision_date && (
                              <span className="text-[10px] text-muted-foreground">
                                <span className="font-medium text-foreground/70">Decided:</span> {fmtDate(d.decision_date)}
                              </span>
                            )}
                            {d.review_date && (
                              <span className="text-[10px] text-muted-foreground">
                                <span className="font-medium text-foreground/70">Review:</span> {fmtDate(d.review_date)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); openEdit(d); }}>
                            <Edit2 className="w-3 h-3 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); deleteDecision(d.id); }}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl">
          {viewing && (() => {
            const sStyle = DECISION_STATUS.find(o => o.value === normalizeDecisionStatus(viewing.status)) || DECISION_STATUS[1];
            const dimLabel = DIMENSIONS.find(d => d.key === viewing.dimension)?.label || viewing.dimension;
            return (
              <>
                <DialogHeader className="pb-3 border-b border-border">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">{dimLabel}</div>
                  <DialogTitle className="text-base flex items-center gap-2 flex-wrap">
                    {viewing.title}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${sStyle.color}`}>{sStyle.label}</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
                  {viewing.content && (
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Notes / context</div>
                      <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{viewing.content}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { k: 'Owner', v: viewing.owner || '—' },
                      { k: 'Confidence', v: CONFIDENCE.find(c => c.value === viewing.confidence)?.label || '—' },
                      { k: 'Decided', v: viewing.decision_date ? fmtDate(viewing.decision_date) : '—' },
                      { k: 'Review', v: viewing.review_date ? fmtDate(viewing.review_date) : '—' },
                    ].map(f => (
                      <div key={f.k}>
                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{f.k}</div>
                        <div className="text-xs font-medium text-foreground mt-0.5">{f.v}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Attachments</div>
                    {viewing.attachments && viewing.attachments.length > 0 ? (
                      <div className="space-y-1.5">
                        {viewing.attachments.map((a, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs font-medium text-foreground truncate">{a.name}</span>
                              {a.size && <span className="text-[10px] text-muted-foreground shrink-0">{a.size}</span>}
                            </div>
                            <a href={a.url} download={a.name}>
                              <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-[10px]">
                                <Download className="w-3 h-3" /> Download
                              </Button>
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">No attachments.</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" size="sm" onClick={() => setViewing(null)}>Close</Button>
                  <Button size="sm" onClick={() => { const d = viewing; setViewing(null); openEdit(d); }}>
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>


      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="pb-2 border-b border-border">
            <DialogTitle className="text-sm">{editingId ? 'Edit decision' : 'New decision'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <p className="text-[9px] font-medium text-muted-foreground mb-1">Decision title</p>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-8 text-xs" />
            </div>
            <div>
              <p className="text-[9px] font-medium text-muted-foreground mb-1">Notes / context</p>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="min-h-[100px] text-xs" />
            </div>
            {form.dimension === 'supplier' && (
              <div>
                <p className="text-[9px] font-medium text-muted-foreground mb-1">Supplier</p>
                <Select value={form.supplier || '__none'} onValueChange={v => setForm({ ...form, supplier: v === '__none' ? '' : v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none" className="text-xs italic text-muted-foreground">Unassigned</SelectItem>
                    {suppliers.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-medium text-muted-foreground mb-1">Status</p>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DECISION_STATUS.map(s => <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-[9px] font-medium text-muted-foreground mb-1">Confidence</p>
                <Select value={form.confidence} onValueChange={v => setForm({ ...form, confidence: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONFIDENCE.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-[9px] font-medium text-muted-foreground mb-1">Owner</p>
                <Input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} className="h-8 text-xs" />
              </div>
              <div>
                <p className="text-[9px] font-medium text-muted-foreground mb-1">Dimension</p>
                <Select value={form.dimension} onValueChange={v => setForm({ ...form, dimension: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIMENSIONS.map(d => <SelectItem key={d.key} value={d.key} className="text-xs">{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-[9px] font-medium text-muted-foreground mb-1">Decision date</p>
                <Input type="date" value={form.decision_date} onChange={e => setForm({ ...form, decision_date: e.target.value })} className="h-8 text-xs" />
              </div>
              <div>
                <p className="text-[9px] font-medium text-muted-foreground mb-1">Review date</p>
                <Input type="date" value={form.review_date} onChange={e => setForm({ ...form, review_date: e.target.value })} className="h-8 text-xs" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={saveDecision}>{editingId ? 'Save' : 'Add decision'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DecisionsSpace;
