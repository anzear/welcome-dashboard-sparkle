import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileText, Trash2, Edit2, Plus, Rocket, Sprout, DollarSign, Leaf, Shield, Scale, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addActivity } from "@/lib/activityNotifications";

const CATEGORIES = [
  { value: 'maturity', label: 'Maturity & Scale-Up Readiness', icon: Rocket },
  { value: 'scalability', label: 'Scalability & Feedstock Availability', icon: Sprout },
  { value: 'economic', label: 'Economic Viability', icon: DollarSign },
  { value: 'sustainability', label: 'Sustainability', icon: Leaf },
  { value: 'ip_fto', label: 'IP & FTO', icon: Shield },
  { value: 'regulatory', label: 'Regulatory Compliance', icon: Scale },
];

const STATUS_OPTIONS = [
  { value: 'tbd', label: 'TBD', color: 'bg-muted text-muted-foreground border-border' },
  { value: 'go', label: 'Go', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'uncertain', label: 'Uncertain', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'no_go', label: 'No-Go', color: 'bg-red-100 text-red-700 border-red-200' },
];

const OVERALL_STATUS_OPTIONS = [
  { value: 'tbd', label: 'TBD', color: 'bg-muted text-muted-foreground border-border' },
  { value: 'go', label: 'Go', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'uncertain', label: 'Uncertain', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'no_go', label: 'No-Go', color: 'bg-red-100 text-red-700 border-red-200' },
];

const normalizeStatus = (s?: string) => {
  if (!s) return 'tbd';
  if (s === 'go' || s === 'no_go' || s === 'uncertain' || s === 'tbd') return s;
  return 'tbd';
};

const CONFIDENCE_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

interface Decision {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  status: string | null;
  responsible_person: string | null;
  rating: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  confidence_level: string | null;
  decision_date: string | null;
  review_date: string | null;
}

interface Props {
  pathwayId: string;
}

const PathwayUserInputSection: React.FC<Props> = ({ pathwayId }) => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('maturity');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('uncertain');
  const [responsible, setResponsible] = useState('');
  const [confidence, setConfidence] = useState('medium');
  const [decisionDate, setDecisionDate] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activeCat, setActiveCat] = useState<string>('maturity');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const overallStatusKey = `pathway_overall_status_${pathwayId}`;
  const [overallStatus, setOverallStatus] = useState<string>(() => {
    if (typeof window === 'undefined') return 'uncertain';
    const stored = localStorage.getItem(`pathway_overall_status_${pathwayId}`);
    // migrate legacy values to new Go/Monitor/Pause/No-Go scheme
    const map: Record<string, string> = { active: 'go', paused: 'uncertain', rejected: 'no_go', monitor: 'uncertain', pause: 'uncertain', needs_validation: 'uncertain', risk_accepted: 'uncertain' };
    return (stored && map[stored]) || stored || 'uncertain';
  });

  // Per-category Go/Monitor/Pause/No-Go status
  const categoryStatusKey = `pathway_category_status_${pathwayId}`;
  const [categoryStatus, setCategoryStatus] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(`pathway_category_status_${pathwayId}`) || '{}'); }
    catch { return {}; }
  });

  useEffect(() => {
    const stored = localStorage.getItem(overallStatusKey);
    const map: Record<string, string> = { active: 'go', paused: 'uncertain', rejected: 'no_go', monitor: 'uncertain', pause: 'uncertain', needs_validation: 'uncertain', risk_accepted: 'uncertain' };
    setOverallStatus((stored && map[stored]) || stored || 'uncertain');
    try { setCategoryStatus(JSON.parse(localStorage.getItem(categoryStatusKey) || '{}')); }
    catch { setCategoryStatus({}); }
  }, [pathwayId]);

  const handleOverallStatusChange = (val: string) => {
    setOverallStatus(val);
    localStorage.setItem(overallStatusKey, val);
    toast.success(`Decision Space marked as ${OVERALL_STATUS_OPTIONS.find(o => o.value === val)?.label}`);
  };

  const handleCategoryStatusChange = (catValue: string, val: string) => {
    const next = { ...categoryStatus, [catValue]: val };
    setCategoryStatus(next);
    localStorage.setItem(categoryStatusKey, JSON.stringify(next));
  };



  const decisionsKey = `pathway_decisions_${pathwayId}`;

  useEffect(() => { fetchDecisions(); }, [pathwayId]);

  const persistDecisions = (list: Decision[]) => {
    try { localStorage.setItem(decisionsKey, JSON.stringify(list)); } catch {}
  };

  const fetchDecisions = async () => {
    try {
      const stored = localStorage.getItem(decisionsKey);
      if (stored) {
        setDecisions(JSON.parse(stored) as Decision[]);
        return;
      }
    } catch {}
    setDecisions([]);
  };

  const openForNew = (cat: string) => {
    setEditingId(null);
    setCategory(cat);
    setTitle('');
    setContent('');
    setStatus('uncertain');
    setResponsible('');
    setConfidence('medium');
    setDecisionDate(new Date().toISOString().slice(0, 10));
    setReviewDate('');
    setFile(null);
    setDialogOpen(true);
  };

  const openForEdit = (d: Decision) => {
    setEditingId(d.id);
    setCategory(d.category || 'maturity');
    setTitle(d.title);
    setContent(d.content || '');
    setStatus(d.status || 'uncertain');
    setResponsible(d.responsible_person || '');
    setConfidence(d.confidence_level || 'medium');
    setDecisionDate(d.decision_date || '');
    setReviewDate(d.review_date || '');
    setFile(null);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingId(null);
    setTitle('');
    setContent('');
    setStatus('uncertain');
    setResponsible('');
    setConfidence('medium');
    setDecisionDate('');
    setReviewDate('');
    setFile(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Please enter a decision title'); return; }

    setLoading(true);
    const fileUrl: string | null = file ? URL.createObjectURL(file) : null;
    const fileName: string | null = file ? file.name : null;

    let next: Decision[];
    if (editingId) {
      next = decisions.map(d => d.id === editingId ? {
        ...d,
        title: title.trim(),
        content: content.trim() || null,
        category,
        status,
        responsible_person: responsible.trim() || null,
        confidence_level: confidence,
        decision_date: decisionDate || null,
        review_date: reviewDate || null,
        rating: status,
        file_url: file ? fileUrl : d.file_url,
        file_name: file ? fileName : d.file_name,
      } : d);
      toast.success('Decision updated');
    } else {
      const newDecision: Decision = {
        id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}`,
        title: title.trim(),
        content: content.trim() || null,
        category,
        status,
        responsible_person: responsible.trim() || null,
        confidence_level: confidence,
        decision_date: decisionDate || null,
        review_date: reviewDate || null,
        rating: status,
        file_url: fileUrl,
        file_name: fileName,
        created_at: new Date().toISOString(),
      };
      next = [newDecision, ...decisions];
      toast.success('Decision added');
    }

    setDecisions(next);
    persistDecisions(next);
    const catLabel = CATEGORIES.find(c => c.value === category)?.label || category;
    addActivity({
      source: 'pathway-decision',
      action: editingId ? 'updated' : 'added',
      title: title.trim(),
      description: `${catLabel}${content.trim() ? ` \u2014 ${content.trim().slice(0, 80)}` : ''}`,
      link: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '',
      topic: `Pathway ${pathwayId}`,
    });
    resetForm();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const removed = decisions.find(d => d.id === id);
    const next = decisions.filter(d => d.id !== id);
    setDecisions(next);
    persistDecisions(next);
    if (removed) {
      addActivity({
        source: 'pathway-decision',
        action: 'removed',
        title: removed.title,
        link: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '',
        topic: `Pathway ${pathwayId}`,
      });
    }
    toast.success('Decision deleted');
  };

  const getStatusStyle = (s: string | null) => STATUS_OPTIONS.find(o => o.value === normalizeStatus(s || undefined)) || STATUS_OPTIONS[1];
  const getByCategory = (cat: string) => decisions.filter(d => (d.category || 'maturity') === cat);

  const activeCategory = CATEGORIES.find(c => c.value === activeCat) || CATEGORIES[0];
  const ActiveIcon = activeCategory.icon;
  const activeItems = getByCategory(activeCat);

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-border">
        <p className="text-[10px] text-muted-foreground leading-relaxed flex-1">
          Capture decisions for this pathway across the six evaluation categories. Each decision can have a status, responsible owner and supporting evidence.
        </p>
        <div className="shrink-0">
          <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Decision Space Status</p>
          <div className="flex items-center gap-1.5">
            {OVERALL_STATUS_OPTIONS.map((o, idx) => {
              const active = overallStatus === o.value;
              return (
                <React.Fragment key={o.value}>
                  {idx === 1 && <span className="h-4 w-px bg-border mx-1" />}
                  <button
                    onClick={() => handleOverallStatusChange(o.value)}
                    className={`text-[10px] px-2 py-1 rounded-full border font-medium transition-all ${
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
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden grid grid-cols-1 md:grid-cols-[260px_1fr]">
        {/* Sidebar: Categories */}
        <div className="border-r border-border bg-muted/20 p-3 space-y-1 max-h-[70vh] overflow-y-auto">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = cat.value === activeCat;
            const count = getByCategory(cat.value).length;
            const catDec = categoryStatus[cat.value] || 'tbd';
            const decMeta = OVERALL_STATUS_OPTIONS.find(o => o.value === catDec) || OVERALL_STATUS_OPTIONS[0];
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setActiveCat(cat.value)}
                className={`w-full text-left rounded-md border px-2.5 py-2 flex items-start gap-2 transition-all ${isActive ? 'border-primary/50 bg-background shadow-sm' : 'border-border bg-background hover:border-primary/30'}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-foreground leading-snug">{cat.label}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${decMeta.color}`}>{decMeta.label}</span>
                    <span className="text-[9px] text-muted-foreground">· {count}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail pane: Decisions */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ActiveIcon className="w-4 h-4 text-foreground/70" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Category</span>
              </div>
              <h2 className="text-base font-semibold text-foreground">{activeCategory.label}</h2>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest">Category Status</span>
                {OVERALL_STATUS_OPTIONS.map((o, idx) => {
                  const active = (categoryStatus[activeCat] || 'tbd') === o.value;
                  return (
                    <React.Fragment key={o.value}>
                      {idx === 1 && <span className="h-4 w-px bg-border mx-1" />}
                      <button
                        onClick={() => handleCategoryStatusChange(activeCat, o.value)}
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
            <Button size="sm" onClick={() => openForNew(activeCat)} className="h-7 px-3 text-[11px] gap-1.5">
              <Plus className="w-3 h-3" /> New decision
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-widest text-foreground">Decisions</div>
              <div className="text-[10px] text-muted-foreground">{activeItems.length} in this category</div>
            </div>

            {activeItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
                <div className="text-[11px] font-semibold text-foreground">No decisions yet</div>
                <div className="text-[10px] text-muted-foreground mt-1 mb-3">Capture your first decision for this category.</div>
                <Button size="sm" onClick={() => openForNew(activeCat)} className="h-7 px-3 text-[11px] gap-1.5">
                  <Plus className="w-3 h-3" /> Add decision
                </Button>
              </div>
            ) : (
              activeItems.map(d => {
                const sStyle = getStatusStyle(d.status);
                return (
                  <div key={d.id} className="border border-border rounded-md bg-background p-2.5 group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[11px] font-semibold text-foreground">{d.title}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-medium ${sStyle.color}`}>
                            {sStyle.label}
                          </span>
                        </div>
                        {d.content && (
                          <p className="text-[10px] text-muted-foreground leading-relaxed mb-1">{d.content}</p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap mt-1">
                          {d.responsible_person && (
                            <span className="text-[9px] text-muted-foreground">
                              <span className="font-medium text-foreground/70">Owner:</span> {d.responsible_person}
                            </span>
                          )}
                          {d.confidence_level && (
                            <span className="text-[9px] text-muted-foreground">
                              <span className="font-medium text-foreground/70">Confidence:</span> {CONFIDENCE_OPTIONS.find(c => c.value === d.confidence_level)?.label || d.confidence_level}
                            </span>
                          )}
                          {d.decision_date && (
                            <span className="text-[9px] text-muted-foreground">
                              <span className="font-medium text-foreground/70">Decided:</span> {new Date(d.decision_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                          )}
                          {d.review_date && (
                            <span className="text-[9px] text-muted-foreground">
                              <span className="font-medium text-foreground/70">Review:</span> {new Date(d.review_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                          )}
                          {d.file_name && (
                            <a href={d.file_url || '#'} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[9px] text-primary hover:underline">
                              <FileText className="w-3 h-3" /> {d.file_name}
                            </a>
                          )}
                          <span className="text-[9px] text-muted-foreground/70">
                            Added {new Date(d.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => openForEdit(d)}>
                          <Edit2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => handleDelete(d.id)}>
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


      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="pb-1 border-b">
            <DialogTitle className="text-xs">{editingId ? 'Edit Decision' : 'New Decision'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Section: Classification */}
            <div className="space-y-2">
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest">Classification</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[8px] font-medium text-muted-foreground mb-0.5">Category</p>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value} className="text-[11px]">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-[8px] font-medium text-muted-foreground mb-0.5">Status / Conclusion</p>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value} className="text-[11px]">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <p className="text-[8px] font-medium text-muted-foreground mb-0.5">Decision Title</p>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Pilot batch reproducibility" className="h-7 text-[11px]" />
              </div>
            </div>

            {/* Section: Ownership & Timing */}
            <div className="space-y-2">
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest">Ownership & Timing</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[8px] font-medium text-muted-foreground mb-0.5">Decision Owner</p>
                  <Input value={responsible} onChange={e => setResponsible(e.target.value)} placeholder="Name or role" className="h-7 text-[11px]" />
                </div>
                <div>
                  <p className="text-[8px] font-medium text-muted-foreground mb-0.5">Confidence</p>
                  <Select value={confidence} onValueChange={setConfidence}>
                    <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONFIDENCE_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value} className="text-[11px]">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-[8px] font-medium text-muted-foreground mb-0.5">Decision Date</p>
                  <Input type="date" value={decisionDate} onChange={e => setDecisionDate(e.target.value)} className="h-7 text-[11px]" />
                </div>
                <div>
                  <p className="text-[8px] font-medium text-muted-foreground mb-0.5">Review Date</p>
                  <Input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)} className="h-7 text-[11px]" />
                </div>
              </div>
            </div>

            {/* Section: Context & Evidence */}
            <div className="space-y-2">
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest">Context & Evidence</p>
              <div>
                <p className="text-[8px] font-medium text-muted-foreground mb-0.5">Notes / Open Risks</p>
                <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Context, open risks or questions..." className="text-[11px] min-h-[70px]" />
              </div>
              <div>
                <p className="text-[8px] font-medium text-muted-foreground mb-0.5">Evidence (file)</p>
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 w-full justify-start" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-3 h-3" /> {file ? file.name : 'Choose file'}
                </Button>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="h-6 text-[10px] px-3" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update' : 'Save'}
              </Button>
              <Button variant="outline" size="sm" className="h-6 text-[10px] px-3" onClick={resetForm}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PathwayUserInputSection;
