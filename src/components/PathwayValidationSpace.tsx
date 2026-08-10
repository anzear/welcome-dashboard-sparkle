import React, { useMemo, useState, useEffect } from 'react';
import { Sprout, Rocket, FlaskConical, DollarSign, Leaf, Shield, Scale, Plus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

type Status = 'TBD' | 'Go' | 'Uncertain' | 'No-Go';
type Confidence = 'Low' | 'Medium' | 'High';

interface Decision {
  id: string;
  categoryId: string;
  title: string;
  status: Status;
  owner: string;
  confidence: Confidence;
  decisionDate: string;
  reviewDate: string;
  notes: string;
  evidence?: string;
  addedDate: string;
}

const CATEGORIES = [
  { id: 'feedstock', label: 'Feedstock Availability & Security', Icon: Sprout },
  { id: 'technology', label: 'Technology Maturity & Scalability', Icon: Rocket },
  { id: 'material', label: 'Material Conformance', Icon: FlaskConical },
  { id: 'economics', label: 'Economics', Icon: DollarSign },
  { id: 'sustainability', label: 'Sustainability / LCA', Icon: Leaf },
  { id: 'ip', label: 'IP & FTO', Icon: Shield },
  { id: 'regulations', label: 'Regulations', Icon: Scale },
] as const;

const STATUSES: Status[] = ['TBD', 'Go', 'Uncertain', 'No-Go'];

const statusPillClass = (s: Status, active = false) => {
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

function rollupStatus(decisions: Decision[]): Status {
  if (!decisions.length) return 'TBD';
  if (decisions.some(d => d.status === 'No-Go')) return 'No-Go';
  if (decisions.some(d => d.status === 'Uncertain')) return 'Uncertain';
  if (decisions.every(d => d.status === 'Go')) return 'Go';
  return 'TBD';
}

interface Props {
  pathwayId: string;
  topic?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const PathwayValidationSpace: React.FC<Props> = ({ pathwayId, topic }) => {
  const storageKey = `pathway-validation:${topic || 'default'}:${pathwayId}`;
  const statusKey = `pathway-validation-status:${topic || 'default'}:${pathwayId}`;

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].id);
  const [overallStatus, setOverallStatus] = useState<Status>('TBD');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<Decision, 'id' | 'addedDate'>>({
    categoryId: CATEGORIES[0].id,
    title: '',
    status: 'Uncertain',
    owner: '',
    confidence: 'Medium',
    decisionDate: today(),
    reviewDate: '',
    notes: '',
    evidence: '',
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setDecisions(JSON.parse(raw));
      const s = localStorage.getItem(statusKey) as Status | null;
      if (s) setOverallStatus(s);
    } catch {}
  }, [storageKey, statusKey]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(decisions)); } catch {}
  }, [decisions, storageKey]);

  useEffect(() => {
    try { localStorage.setItem(statusKey, overallStatus); } catch {}
  }, [overallStatus, statusKey]);


  const byCategory = useMemo(() => {
    const map: Record<string, Decision[]> = {};
    for (const c of CATEGORIES) map[c.id] = [];
    for (const d of decisions) (map[d.categoryId] ||= []).push(d);
    return map;
  }, [decisions]);

  
  const active = CATEGORIES.find(c => c.id === activeCategory)!;
  const activeDecisions = byCategory[active.id] || [];
  const activeStatus = rollupStatus(activeDecisions);

  const openNew = () => {
    setDraft({
      categoryId: active.id,
      title: '',
      status: 'Uncertain',
      owner: '',
      confidence: 'Medium',
      decisionDate: today(),
      reviewDate: '',
      notes: '',
      evidence: '',
    });
    setDialogOpen(true);
  };

  const save = () => {
    if (!draft.title.trim()) return;
    const d: Decision = { ...draft, id: crypto.randomUUID(), addedDate: today() };
    setDecisions(prev => [...prev, d]);
    setActiveCategory(d.categoryId);
    setDialogOpen(false);
  };

  return (
    <div className="mt-1">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[620px]">
          Capture decisions for this pathway across the seven evaluation categories. Each decision can have a status, responsible owner and supporting evidence.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Validation Space Status</span>
          <div className="flex items-center gap-1">
            {STATUSES.map(s => {
              const selected = overallStatus === s;
              const activeCls =
                s === 'Go' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                : s === 'Uncertain' ? 'bg-amber-100 text-amber-700 border-amber-300'
                : s === 'No-Go' ? 'bg-red-100 text-red-700 border-red-300'
                : 'bg-foreground text-background border-foreground';
              return (
                <button
                  key={s}
                  onClick={() => setOverallStatus(s)}
                  className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold border transition-colors ${selected ? activeCls : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted'}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-3">
        {/* Sidebar */}
        <div className="space-y-1.5">
          {CATEGORIES.map(c => {
            const list = byCategory[c.id] || [];
            const st = rollupStatus(list);
            const isActive = c.id === activeCategory;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`w-full text-left rounded-md border bg-card px-2.5 py-2 transition-colors hover:border-foreground/40 ${isActive ? 'border-foreground shadow-sm' : 'border-border'}`}
              >
                <div className="flex items-start gap-2">
                  <c.Icon className="w-3.5 h-3.5 text-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground leading-tight">{c.label}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={statusPillClass(st)}>{st}</span>
                      <span className="text-[10px] text-muted-foreground">· {list.length}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main */}
        <div className="border border-border rounded-md bg-card p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <active.Icon className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</span>
              </div>
              <h3 className="text-base font-bold text-foreground leading-tight">{active.label}</h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Category Status</span>
                <span className={statusPillClass(activeStatus, true)}>{activeStatus}</span>
                <span className="text-muted-foreground text-[10px]">|</span>
                {STATUSES.filter(s => s !== 'TBD').map(s => (
                  <span key={s} className={statusPillClass(s)}>{s}</span>
                ))}
              </div>
            </div>
            <Button size="sm" onClick={openNew} className="h-7 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs">
              <Plus className="w-3 h-3" /> New decision
            </Button>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Decisions</span>
            <span className="text-[10px] text-muted-foreground">{activeDecisions.length} in this category</span>
          </div>

          {activeDecisions.length === 0 ? (
            <div className="rounded-md border border-dashed border-border py-8 flex flex-col items-center justify-center text-center">
              <div className="text-xs font-semibold">No decisions yet</div>
              <div className="text-[10px] text-muted-foreground mt-1">Capture your first decision for this category.</div>
              <Button size="sm" className="h-7 mt-3 bg-emerald-500 hover:bg-emerald-600 text-white gap-1 text-xs" onClick={openNew}>
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
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm">New decision</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Classification</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Category</Label>
                  <Select value={draft.categoryId} onValueChange={v => setDraft({ ...draft, categoryId: v })}>
                    <SelectTrigger className="mt-1 h-8 text-xs border-emerald-500 focus:ring-emerald-500"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Status / Conclusion</Label>
                  <Select value={draft.status} onValueChange={v => setDraft({ ...draft, status: v as Status })}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Decision title</Label>
                <Input
                  value={draft.title}
                  onChange={e => setDraft({ ...draft, title: e.target.value })}
                  placeholder="e.g. Pilot batch reproducibility"
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Ownership & Timing</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Owner</Label>
                  <Input value={draft.owner} onChange={e => setDraft({ ...draft, owner: e.target.value })} placeholder="Name or role" className="mt-1 h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</Label>
                  <Select value={draft.confidence} onValueChange={v => setDraft({ ...draft, confidence: v as Confidence })}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Context & Evidence</div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Notes / open risks</Label>
              <Textarea
                value={draft.notes}
                onChange={e => setDraft({ ...draft, notes: e.target.value })}
                placeholder="Context, open risks or questions..."
                className="mt-1 text-xs min-h-[80px]"
              />
              <div className="mt-3">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Evidence (file)</Label>
                <label className="mt-1 flex items-center gap-2 px-3 py-1.5 border border-border rounded-md cursor-pointer hover:bg-muted/50 w-fit">
                  <Upload className="w-3 h-3" />
                  <span className="text-xs">{draft.evidence || 'Choose file'}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={e => setDraft({ ...draft, evidence: e.target.files?.[0]?.name || '' })}
                  />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} className="bg-emerald-500 hover:bg-emerald-600 text-white">Add decision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PathwayValidationSpace;
