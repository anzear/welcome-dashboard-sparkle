import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, CheckCircle2, Circle, Plus, X, Folder, FolderPlus, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// ── Types ───────────────────────────────────────────────────────────
type DimensionKey =
  | 'technical'
  | 'application'
  | 'cost'
  | 'supplier'
  | 'supply'
  | 'market'
  | 'regulatory';

type DecisionStatus = 'TBD' | 'Go' | 'Uncertain' | 'No-Go';
type Confidence = 'Low' | 'Medium' | 'High';

interface Decision {
  id: string;
  dimension: DimensionKey;
  title: string;
  notes: string;
  status: DecisionStatus;
  confidence: Confidence;
  owner: string;
  decisionDate: string;
  reviewDate: string;
  createdAt: number;
  supplier?: string;         // only for 'supplier' dimension
  attachments?: number;      // simulated
}

interface DimensionMeta { key: DimensionKey; label: string; }

const DIMENSIONS: DimensionMeta[] = [
  { key: 'technical', label: 'Technical Feasibility' },
  { key: 'application', label: 'Application Fit' },
  { key: 'cost', label: 'Cost Competitiveness' },
  { key: 'supplier', label: 'Supplier Readiness' },
  { key: 'supply', label: 'Supply Security' },
  { key: 'market', label: 'Market Demand' },
  { key: 'regulatory', label: 'Regulatory Status' },
];

const STATUS_ORDER: DecisionStatus[] = ['TBD', 'Go', 'Uncertain', 'No-Go'];

function computeDimensionStatus(decisions: Decision[]): DecisionStatus {
  if (decisions.length === 0) return 'TBD';
  if (decisions.some(d => d.status === 'No-Go')) return 'No-Go';
  if (decisions.some(d => d.status === 'Uncertain')) return 'Uncertain';
  if (decisions.every(d => d.status === 'Go')) return 'Go';
  return 'TBD';
}
const isCleared = (ds: Decision[]) => ds.length > 0 && !ds.some(d => d.status === 'No-Go' || d.status === 'Uncertain');

const statusPillClass = (s: DecisionStatus, active = false) => {
  const base = 'inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold border';
  if (active) {
    switch (s) {
      case 'Go': return `${base} bg-emerald-100 text-emerald-700 border-emerald-300`;
      case 'Uncertain': return `${base} bg-amber-100 text-amber-700 border-amber-300`;
      case 'No-Go': return `${base} bg-red-100 text-red-700 border-red-300`;
      default: return `${base} bg-muted text-foreground border-border`;
    }
  }
  switch (s) {
    case 'Go': return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
    case 'Uncertain': return `${base} bg-amber-50 text-amber-700 border-amber-200`;
    case 'No-Go': return `${base} bg-red-50 text-red-700 border-red-200`;
    default: return `${base} bg-muted/60 text-muted-foreground border-border`;
  }
};

const today = () => new Date().toISOString().slice(0, 10);

const ValidationSpace: React.FC = () => {
  const { category, topic } = useParams<{ category: string; topic: string }>();
  const navigate = useNavigate();
  const decodedTopic = decodeURIComponent(topic || '');

  const storageKey = `validationSpace:${category}:${topic}`;
  const suppliersKey = `validationSpaceSuppliers:${category}:${topic}`;

  const [decisions, setDecisions] = useState<Decision[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
  });
  const [suppliers, setSuppliers] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(suppliersKey) || '[]'); } catch { return []; }
  });

  const [activeDim, setActiveDim] = useState<DimensionKey>('technical');
  const [activeSupplier, setActiveSupplier] = useState<string>('__all__'); // for 'supplier' dim
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<Decision, 'id' | 'createdAt'>>({
    dimension: 'technical', title: '', notes: '', status: 'Uncertain',
    confidence: 'Medium', owner: '', decisionDate: today(), reviewDate: '', supplier: '',
  });

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(decisions)); }, [decisions, storageKey]);
  useEffect(() => { localStorage.setItem(suppliersKey, JSON.stringify(suppliers)); }, [suppliers, suppliersKey]);

  const decisionsByDim = useMemo(() => {
    const m = new Map<DimensionKey, Decision[]>();
    for (const d of DIMENSIONS) m.set(d.key, []);
    for (const dec of decisions) m.get(dec.dimension)?.push(dec);
    return m;
  }, [decisions]);

  const active = DIMENSIONS.find(d => d.key === activeDim)!;
  const dimDecisions = decisionsByDim.get(activeDim) || [];

  // Supplier folders derived from persisted list + any supplier tags on decisions
  const supplierFolders = useMemo(() => {
    const set = new Set<string>(suppliers);
    for (const d of dimDecisions) if (d.supplier) set.add(d.supplier);
    return Array.from(set);
  }, [suppliers, dimDecisions]);

  const activeDecisions = useMemo(() => {
    if (activeDim !== 'supplier' || activeSupplier === '__all__') return dimDecisions;
    return dimDecisions.filter(d => d.supplier === activeSupplier);
  }, [dimDecisions, activeDim, activeSupplier]);

  const total = activeDecisions.length;
  const goCount = activeDecisions.filter(d => d.status === 'Go').length;
  const openCount = activeDecisions.filter(d => d.status === 'TBD' || d.status === 'Uncertain').length;
  const blockers = activeDecisions.filter(d => d.status === 'No-Go').length;
  const lastUpdated = total ? new Date(Math.max(...activeDecisions.map(d => d.createdAt))) : null;
  const nextReview = activeDecisions.map(d => d.reviewDate).filter(Boolean).sort()[0];
  const cleared = isCleared(activeDecisions);
  const categoryStatus = computeDimensionStatus(activeDecisions);

  const openNewDecision = () => {
    setDraft({
      dimension: activeDim, title: '', notes: '', status: 'Uncertain',
      confidence: 'Medium', owner: '', decisionDate: today(), reviewDate: '',
      supplier: activeDim === 'supplier' && activeSupplier !== '__all__' ? activeSupplier : '',
    });
    setDialogOpen(true);
  };
  const saveDecision = () => {
    if (!draft.title.trim()) return;
    const dec: Decision = { ...draft, id: crypto.randomUUID(), createdAt: Date.now() };
    if (dec.dimension === 'supplier' && dec.supplier && !suppliers.includes(dec.supplier)) {
      setSuppliers(prev => [...prev, dec.supplier!]);
    }
    setDecisions(prev => [dec, ...prev]);
    setDialogOpen(false);
  };
  const addSupplier = () => {
    const s = newSupplier.trim();
    if (!s) return;
    if (!suppliers.includes(s)) setSuppliers(prev => [...prev, s]);
    setActiveSupplier(s);
    setNewSupplier('');
    setAddSupplierOpen(false);
  };




  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-6 pb-10">
        <button
          onClick={() => navigate(`/landscape/${category}/${topic}/value-chain`)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Material Overview
        </button>

        {/* Title */}
        <div className="flex items-start gap-2.5 mb-6">
          <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-tight">Validation Space</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Validate this material across seven readiness dimensions. Capture decisions, owners, and evidence per dimension.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          {/* Left dimensions list */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-1.5">
            {DIMENSIONS.map(dim => {
              const list = decisionsByDim.get(dim.key) || [];
              const status = computeDimensionStatus(list);
              const clr = isCleared(list);
              const isActive = dim.key === activeDim;
              const isSupplier = dim.key === 'supplier';
              return (
                <div key={dim.key}>
                  <button
                    onClick={() => setActiveDim(dim.key)}
                    className={`w-full text-left rounded-md border bg-card px-2.5 py-2 transition-colors hover:border-foreground/40 ${isActive ? 'border-foreground shadow-sm' : 'border-border'}`}
                  >
                    <div className="flex items-start gap-2">
                      {clr ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">{dim.label}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={statusPillClass(status)}>{status}</span>
                          <span className="text-[10px] text-muted-foreground">· {list.length}</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Supplier folders nested under Supplier Readiness when active */}
                  {isSupplier && isActive && (
                    <div className="mt-1 ml-2 border-l border-border pl-2 space-y-0.5">
                      <SupplierRow
                        label="All suppliers"
                        count={list.length}
                        active={activeSupplier === '__all__'}
                        onClick={() => setActiveSupplier('__all__')}
                        highlight
                      />
                      {supplierFolders.map(s => {
                        const c = list.filter(d => d.supplier === s).length;
                        return (
                          <SupplierRow
                            key={s}
                            label={s}
                            count={c}
                            active={activeSupplier === s}
                            onClick={() => setActiveSupplier(s)}
                          />
                        );
                      })}
                      <button
                        onClick={() => setAddSupplierOpen(true)}
                        className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        <FolderPlus className="w-3 h-3" /> Add supplier
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right detail */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9 rounded-md border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mb-1 ${cleared ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {cleared ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                  {cleared ? 'Cleared' : total === 0 ? 'Not started' : 'Partial'}
                </div>
                <h2 className="text-base font-bold leading-tight">{active.label}</h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Category Status</span>
                  <span className={statusPillClass(categoryStatus, true)}>{categoryStatus}</span>
                  <span className="text-muted-foreground text-[10px]">|</span>
                  {STATUS_ORDER.filter(s => s !== 'TBD').map(s => (
                    <span key={s} className={statusPillClass(s)}>{s}</span>
                  ))}
                </div>
              </div>
              <Button size="sm" className="h-7 bg-emerald-500 hover:bg-emerald-600 text-white gap-1 text-xs" onClick={openNewDecision}>
                <Plus className="w-3 h-3" /> New decision
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
              <div className="flex gap-6">
                <Stat label="Total" value={total} />
                <Stat label="Go" value={goCount} color="text-emerald-600" />
                <Stat label="Open" value={openCount} color="text-amber-500" />
                <Stat label="Blockers" value={blockers} color="text-red-500" />
              </div>
              <div className="flex gap-6">
                <MetaCol label="Last updated" value={lastUpdated ? lastUpdated.toLocaleDateString() : '—'} />
                <MetaCol label="Next review" value={nextReview ? new Date(nextReview).toLocaleDateString() : '—'} />
              </div>
            </div>

            {/* Decisions */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold text-foreground uppercase tracking-widest">Decisions</div>
                <div className="text-[10px] text-muted-foreground">{total} in this dimension</div>
              </div>

              {total === 0 ? (
                <div className="rounded-md border border-dashed border-border py-8 flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-semibold">No decisions yet</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Capture your first decision for this readiness dimension.</div>
                  <Button size="sm" className="h-7 mt-3 bg-emerald-500 hover:bg-emerald-600 text-white gap-1 text-xs" onClick={openNewDecision}>
                    <Plus className="w-3 h-3" /> Add decision
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border rounded-md border border-border">
                  {activeDecisions.map(d => (
                    <div key={d.id} className="p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold truncate">{d.title}</span>
                          <span className={statusPillClass(d.status, true)}>{d.status}</span>
                          {d.attachments ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground border border-border rounded px-1 py-0.5">
                              <Paperclip className="w-2.5 h-2.5" />{d.attachments}
                            </span>
                          ) : null}
                          {d.dimension === 'supplier' && d.supplier && (
                            <span className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-foreground/80">
                              <Folder className="w-2.5 h-2.5" />{d.supplier}
                            </span>
                          )}
                        </div>
                        {d.notes && <div className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-wrap">{d.notes}</div>}
                        <div className="text-[10px] text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                          {d.owner && <span><span className="text-foreground/70 font-medium">Owner:</span> {d.owner}</span>}
                          <span><span className="text-foreground/70 font-medium">Confidence:</span> {d.confidence}</span>
                          {d.decisionDate && <span><span className="text-foreground/70 font-medium">Decided:</span> {new Date(d.decisionDate).toLocaleDateString()}</span>}
                          {d.reviewDate && <span><span className="text-foreground/70 font-medium">Review:</span> {new Date(d.reviewDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => setDecisions(prev => prev.filter(x => x.id !== d.id))}
                        className="text-muted-foreground hover:text-foreground"
                        title="Remove decision"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* New Decision Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-sm">New decision</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Decision title</Label>
              <Input
                autoFocus
                value={draft.title}
                onChange={e => setDraft({ ...draft, title: e.target.value })}
                className="mt-1 h-8 text-xs border-emerald-500 focus-visible:ring-emerald-500"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Notes / context</Label>
              <Textarea rows={3} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} className="mt-1 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</Label>
                <Select value={draft.status} onValueChange={(v: DecisionStatus) => setDraft({ ...draft, status: v })}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</Label>
                <Select value={draft.confidence} onValueChange={(v: Confidence) => setDraft({ ...draft, confidence: v })}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{(['Low', 'Medium', 'High'] as Confidence[]).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Owner</Label>
                <Input value={draft.owner} onChange={e => setDraft({ ...draft, owner: e.target.value })} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Dimension</Label>
                <Select value={draft.dimension} onValueChange={(v: DimensionKey) => setDraft({ ...draft, dimension: v })}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{DIMENSIONS.map(d => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {draft.dimension === 'supplier' && (
                <div className="col-span-2">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Supplier</Label>
                  <Input
                    list="supplier-options"
                    placeholder="e.g. Corbion, Galactic"
                    value={draft.supplier || ''}
                    onChange={e => setDraft({ ...draft, supplier: e.target.value })}
                    className="mt-1 h-8 text-xs"
                  />
                  <datalist id="supplier-options">
                    {supplierFolders.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
              )}
              <div>
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Decision date</Label>
                <Input type="date" value={draft.decisionDate} onChange={e => setDraft({ ...draft, decisionDate: e.target.value })} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Review date</Label>
                <Input type="date" value={draft.reviewDate} onChange={e => setDraft({ ...draft, reviewDate: e.target.value })} className="mt-1 h-8 text-xs" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={saveDecision} className="bg-emerald-500 hover:bg-emerald-600 text-white">Add decision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Supplier Dialog */}
      <Dialog open={addSupplierOpen} onOpenChange={setAddSupplierOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Add supplier</DialogTitle>
          </DialogHeader>
          <div>
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Supplier name</Label>
            <Input
              autoFocus
              value={newSupplier}
              onChange={e => setNewSupplier(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSupplier()}
              placeholder="e.g. Corbion"
              className="mt-1 h-8 text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAddSupplierOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={addSupplier} className="bg-emerald-500 hover:bg-emerald-600 text-white">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SupplierRow: React.FC<{ label: string; count: number; active: boolean; onClick: () => void; highlight?: boolean }>
  = ({ label, count, active, onClick, highlight }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors ${
        active
          ? (highlight ? 'bg-foreground text-background' : 'bg-muted text-foreground')
          : 'text-foreground/80 hover:bg-muted/60'
      }`}
    >
      <Folder className={`w-3 h-3 ${active && highlight ? 'text-background' : 'text-muted-foreground'}`} />
      <span className="flex-1 text-left truncate">{label}</span>
      <span className={`text-[10px] ${active && highlight ? 'text-background/80' : 'text-muted-foreground'}`}>{count}</span>
    </button>
  );

const Stat: React.FC<{ label: string; value: number; color?: string }> = ({ label, value, color = 'text-foreground' }) => (
  <div>
    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</div>
    <div className={`text-xl font-bold mt-0.5 ${color}`}>{value}</div>
  </div>
);

const MetaCol: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</div>
    <div className="text-xs font-semibold mt-0.5 text-foreground/80 tabular-nums">{value}</div>
  </div>
);

export default ValidationSpace;
