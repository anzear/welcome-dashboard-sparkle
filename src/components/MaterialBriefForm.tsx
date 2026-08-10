import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ChevronDown, ChevronRight, Upload, File as FileIcon, Trash2,
  CheckCircle2, Circle, Eye, EyeOff,
  Repeat, Sparkles, Share2, Plus, Send, X, Pencil, Check, Tag, Star,
  ArrowLeft, ArrowRight, Wand2,
} from 'lucide-react';

// ============================================================================
// Types & constants
// ============================================================================

export type Intent = 'Replacement' | 'NewIntroduction';
// Kept for back-compat with other modules that import this type.
export type Objective = 'Source' | 'Produce' | 'Valorise';

interface UploadedFile { name: string; size: number; dataUrl: string; }

interface BriefData {
  intent: Intent | '';

  // Section 1 — Material context
  materialName: string;
  application: string;
  requiredFunction: string;

  // Section 2 — Why it matters
  commercialImportance: number;     // 0 (not set) – 5
  primaryMotivation: string;
  urgency: number;                  // 0 – 5
  urgencyNote: string;
  sustainabilityImpact: number;     // 0 – 5
  supplyRisk: number;               // 0 – 5

  // Section 3 — Replacement pathway
  incumbent: string;
  criticalSpec: string;
  substitutionFlexibility: string;

  // Section 3 — New introduction pathway
  desiredOutcome: string;
  adoptionPathway: string;
  internalBaseline: string;

  // Section 4 — Decision & readiness
  solutionReadiness: string;
  nextDecision: string;

  // ── Legacy mirrors (kept in storage so Material Pipeline & widgets keep working) ──
  objective: Objective;
  timeline: string;
  rationale: string[];
}

const REQUIRED_FUNCTIONS = [
  'Solvent', 'Binder', 'Surfactant', 'Monomer', 'Preservative', 'Plasticizer',
  'Barrier material', 'Fragrance carrier', 'Processing aid', 'Active ingredient',
  'Additive', 'Other',
];

const PRIMARY_MOTIVATIONS = [
  'Sustainability / decarbonisation', 'Bio-based transition', 'Circularity',
  'Supply security', 'Cost reduction', 'Regulatory pressure', 'Customer demand',
  'Product innovation / performance', 'Supplier diversification', 'Other',
];

const SUBSTITUTION_FLEXIBILITY = [
  'Drop-in replacement only',
  'Minor formulation changes acceptable',
  'Major reformulation acceptable',
  'Same molecule via new production route',
  'Not yet known',
];

const ADOPTION_PATHWAYS = [
  'New product launch', 'Existing product upgrade', 'Sustainability-led innovation',
  'Cost / performance improvement', 'Customer-specific request',
  'Strategic technology exploration', 'Not yet known',
];

const SOLUTION_READINESS = [
  'No known solutions',
  'Some solutions known, not evaluated',
  'Solutions tested but failed',
  'Suppliers known, maturity unclear',
  'Mature suppliers exist, comparison needed',
  'Internal shortlist already exists',
];

const NEXT_DECISIONS = [
  'Should we prioritise this material?',
  'Should we search for alternative suppliers?',
  'Should we assess bio-based routes?',
  'Should we assess circular routes?',
  'Should we benchmark solutions against the current baseline?',
  'Should we launch a pilot?',
  'Should we monitor the market?',
  'Should we stop pursuing this?',
];

const COMMERCIAL_SCALE = [
  'Low relevance',
  'Limited product or business exposure',
  'Meaningful business relevance',
  'Important material or opportunity',
  'Strategic / high-impact material or opportunity',
];
const URGENCY_SCALE = [
  'Exploratory / no timeline',
  'Relevant for long-term roadmap',
  'Should be assessed within 12–24 months',
  'Decision needed within 6–12 months',
  'Immediate priority / external deadline',
];
const SUSTAINABILITY_SCALE = [
  'Minimal sustainability relevance',
  'Some relevance, but not a key lever',
  'Moderate improvement potential',
  'Strong sustainability opportunity',
  'Major decarbonisation / circularity / renewable carbon priority',
];
const SUPPLY_RISK_SCALE = [
  'Stable / low concern',
  'Minor concerns',
  'Some supplier, price, maturity, or geography risk',
  'High dependency, volatility, or availability concern',
  'Critical supply or scale-up risk',
];

const empty: BriefData = {
  intent: '',
  materialName: '', application: '', requiredFunction: '',
  commercialImportance: 0, primaryMotivation: '',
  urgency: 0, urgencyNote: '',
  sustainabilityImpact: 0, supplyRisk: 0,
  incumbent: '', criticalSpec: '', substitutionFlexibility: '',
  desiredOutcome: '', adoptionPathway: '', internalBaseline: '',
  solutionReadiness: '', nextDecision: '',
  objective: 'Source', timeline: '', rationale: [],
};

const sulphuricAcidMock: Partial<BriefData> = {
  intent: 'Replacement',
  materialName: 'Sulphuric Acid (CAS 7664-93-9)',
  application: 'pH regulator and catalyst in personal care and industrial home-care formulations',
  requiredFunction: 'Processing aid',
  commercialImportance: 4,
  primaryMotivation: 'Regulatory pressure',
  urgency: 5,
  urgencyNote: 'EU REACH restrictions tightening Q2 2026',
  sustainabilityImpact: 4,
  supplyRisk: 3,
  incumbent: 'Fossil-based technical-grade sulphuric acid (96–98%)',
  criticalSpec: 'Concentration ≥ 96%, Fe < 50 ppm, Cl < 5 ppm, APHA < 10',
  substitutionFlexibility: 'Same molecule via new production route',
  solutionReadiness: 'Mature suppliers exist, comparison needed',
  nextDecision: 'Should we benchmark solutions against the current baseline?',
};

// ============================================================================
// Field → section mapping (for Section completion bar + legacy export)
// ============================================================================

const SECTION_FIELDS_COMMON = {
  ctx: ['intent', 'materialName', 'application', 'requiredFunction'] as const,
  why: ['commercialImportance', 'primaryMotivation', 'urgency', 'sustainabilityImpact', 'supplyRisk'] as const,
  decision: ['solutionReadiness', 'nextDecision'] as const,
};
const SECTION_FIELDS_REPLACEMENT = ['incumbent', 'criticalSpec', 'substitutionFlexibility'] as const;
const SECTION_FIELDS_NEW = ['desiredOutcome'] as const; // only desiredOutcome is required for new-intro readiness

const isFilled = (v: any) => Array.isArray(v) ? v.length > 0 : typeof v === 'number' ? v > 0 : !!v;

const sectionDefs = (intent: Intent | '') => {
  const pathway =
    intent === 'Replacement' ? [...SECTION_FIELDS_REPLACEMENT]
    : intent === 'NewIntroduction' ? ['desiredOutcome', 'adoptionPathway', 'internalBaseline']
    : [];
  return [
    { id: 'ctx',      title: 'Material context',          fields: [...SECTION_FIELDS_COMMON.ctx] },
    { id: 'why',      title: 'Why it matters',            fields: [...SECTION_FIELDS_COMMON.why] },
    { id: 'pathway',  title: 'Pathway-specific details',  fields: pathway },
    { id: 'decision', title: 'Decision & readiness',      fields: [...SECTION_FIELDS_COMMON.decision] },
  ];
};

// Exported for Material Pipeline & VCGWelcomeWidget (back-compat shape preserved)
export const computeBriefCompletion = (d: any) => {
  const intent: Intent | '' =
    d?.intent === 'Replacement' || d?.intent === 'NewIntroduction' ? d.intent : '';
  const defs = sectionDefs(intent);
  const sections = defs.map(sec => {
    const total = sec.fields.length;
    const filled = sec.fields.filter(f => isFilled(d?.[f])).length;
    return { filled, total, complete: total > 0 && filled === total };
  });
  // Legacy `objective` mirror — Replacement ≈ Source, NewIntroduction ≈ Produce
  const objective: Objective =
    intent === 'Replacement' ? 'Source'
    : intent === 'NewIntroduction' ? 'Produce'
    : (d?.objective === 'Source' || d?.objective === 'Produce' || d?.objective === 'Valorise' ? d.objective : 'Produce');
  return {
    objective,
    sections,
    completed: sections.filter(s => s.complete).length,
    total: sections.length,
  };
};

// ============================================================================
// Priority & readiness logic
// ============================================================================

export const computePriority = (d: BriefData) => {
  const ratings = [d.commercialImportance, d.urgency, d.sustainabilityImpact, d.supplyRisk];
  const provided = ratings.filter(r => r > 0);
  if (provided.length === 0) return { score: 0, max: 20, percent: 0, status: '—', confidence: 'Insufficient input' };
  const sum = provided.reduce((a, b) => a + b, 0);
  const max = provided.length * 5;
  const percent = Math.round((sum / max) * 100);
  let status: string;
  if (percent < 35) status = 'Low priority / monitor';
  else if (percent < 55) status = 'Medium priority / needs more input';
  else if (percent < 75) status = 'Strong candidate';
  else status = 'High-priority POC candidate';
  const confidence =
    provided.length === 4 ? 'High (all 4 ratings)' :
    provided.length === 3 ? 'Medium (3 of 4 ratings)' :
    provided.length === 2 ? 'Low (2 of 4 ratings)' : 'Very low (1 of 4 ratings)';
  return { score: sum, max, percent, status, confidence };
};

const READINESS_FIELDS: Record<Intent, (keyof BriefData)[]> = {
  Replacement: ['requiredFunction', 'incumbent', 'criticalSpec', 'substitutionFlexibility', 'solutionReadiness'],
  NewIntroduction: ['requiredFunction', 'desiredOutcome', 'solutionReadiness', 'application'],
};

export const computeReadiness = (d: BriefData) => {
  if (!d.intent) return { filled: 0, total: 0, percent: 0, status: 'Not defined' };
  const req = READINESS_FIELDS[d.intent];
  const filled = req.filter(k => isFilled(d[k])).length;
  const total = req.length;
  const percent = total ? Math.round((filled / total) * 100) : 0;
  let status: string;
  if (filled === 0) status = 'Not defined';
  else if (filled < total - 1) status = 'Partially defined';
  else if (filled < total) status = 'Search-ready';
  else status = 'Pilot-scope-ready';
  return { filled, total, percent, status };
};

// Load + summarize a brief from storage (for external consumers like the hero card)
export const loadBriefSummary = (topic: string, category: string) => {
  const storageKey = `material-brief-v2-${category}-${topic}`;
  let d: BriefData = { ...empty };
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    if (raw) d = { ...empty, ...JSON.parse(raw) };
    else if (topic === 'Sulphuric Acid') d = { ...empty, ...sulphuricAcidMock };
  } catch { /* */ }
  const { completed, total } = computeBriefCompletion(d);
  const completion = total ? Math.round((completed / total) * 100) : 0;
  return {
    priority: computePriority(d),
    readiness: computeReadiness(d),
    completion,
    completed,
    total,
  };
};

// ============================================================================
// Shared helpers
// ============================================================================

const formatRelativeTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatSize = (b: number) =>
  b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

// ============================================================================
// Reusable UI atoms
// ============================================================================

interface SectionProps {
  id: string; title: string; filled: number; total: number; complete: boolean; required?: boolean;
  updatedAt?: string;
  open: boolean; onToggle: () => void; onShare?: () => void; children: React.ReactNode;
  headless?: boolean;
}
const Section: React.FC<SectionProps> = ({ title, filled, total, complete, required, updatedAt, open, onToggle, onShare, children, headless }) => {
  if (headless) {
    return <div className="px-5 py-4 space-y-3">{children}</div>;
  }
  return (
    <div className="border-b-2 border-border last:border-b-0">
      <div className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          {complete ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-muted-foreground/50" />
          )}
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-widest">{title}</span>
          {required && !complete && (
            <span className="text-[8px] font-medium text-muted-foreground">Required</span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground tabular-nums">
            {filled}/{total}
            {updatedAt && (
              <span className="ml-1.5 text-[8px] opacity-70">{formatRelativeTime(updatedAt)}</span>
            )}
          </span>
          {onShare && (
            <button
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              title={`Share "${title}" with teammates`}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onToggle} className="p-1 text-muted-foreground">
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );
};


const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean; owner?: string; help?: string }> =
  ({ children, required, owner, help }) => (
  <div className="space-y-0.5">
    <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 flex-wrap">
      <span>{children}</span>
      {required && <span className="text-destructive">*</span>}
      {owner && (
        <span className="text-[8px] font-medium px-1.5 py-0 h-3.5 inline-flex items-center rounded bg-muted text-muted-foreground tracking-normal normal-case">
          {owner}
        </span>
      )}
    </label>
    {help && <p className="text-[10px] text-muted-foreground leading-snug">{help}</p>}
  </div>
);

const StarRating: React.FC<{
  value: number;
  onChange: (v: number) => void;
  scale?: string[];
}> = ({ value, onChange, scale }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(value === n ? 0 : n)}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}>
            <Star
              className={`w-4 h-4 ${n <= shown
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/40'}`}
            />
          </button>
        ))}
        {value > 0 && scale && (
          <span className="ml-2 text-[10px] text-muted-foreground">{scale[value - 1]}</span>
        )}
        {value === 0 && (
          <span className="ml-2 text-[10px] text-muted-foreground italic">Not rated</span>
        )}
      </div>
    </div>
  );
};

const ChipMulti: React.FC<{ options: string[]; value: string[]; onChange: (v: string[]) => void }> = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-1">
    {options.map(o => {
      const sel = value.includes(o);
      return (
        <Badge
          key={o}
          variant={sel ? 'default' : 'outline'}
          className={`cursor-pointer text-[9px] px-2 py-0.5 h-5 transition-all ${sel ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          onClick={() => onChange(sel ? value.filter(x => x !== o) : [...value, o])}>
          {o}
        </Badge>
      );
    })}
  </div>
);

const FileUpload: React.FC<{ files: UploadedFile[]; onChange: (f: UploadedFile[]) => void; label?: string }> = ({ files, onChange, label = 'Upload file' }) => {
  const ref = useRef<HTMLInputElement>(null);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files; if (!fl || fl.length === 0) return;
    const MAX_BYTES = 10 * 1024 * 1024;
    const readOne = (f: File) => new Promise<UploadedFile | null>(resolve => {
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} exceeds 10 MB and was skipped`);
        resolve(null); return;
      }
      const r = new FileReader();
      r.onload = () => resolve({ name: f.name, size: f.size, dataUrl: r.result as string });
      r.onerror = () => { toast.error(`Failed to read ${f.name}`); resolve(null); };
      r.readAsDataURL(f);
    });
    try {
      const results = await Promise.all(Array.from(fl).map(readOne));
      const added = results.filter((x): x is UploadedFile => x !== null);
      if (added.length > 0) {
        onChange([...files, ...added]);
        toast.success(`${added.length} file${added.length === 1 ? '' : 's'} uploaded`);
      }
    } finally {
      if (ref.current) ref.current.value = '';
    }
  };
  return (
    <div className="space-y-1">
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-2 border border-border rounded-md px-2 py-1.5 bg-muted/30">
          <FileIcon className="w-3 h-3 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-foreground truncate">{f.name}</p>
            <p className="text-[8px] text-muted-foreground">{formatSize(f.size)}</p>
          </div>
          <button onClick={() => onChange(files.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      <input ref={ref} type="file" className="hidden" multiple onChange={handle} />
      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 w-full border-dashed" onClick={() => ref.current?.click()}>
        <Upload className="w-3 h-3" /> {label}
      </Button>
    </div>
  );
};

// ============================================================================
// Department management + Share dialog (preserved)
// ============================================================================

const DEFAULT_DEPARTMENTS = ['R&D / Product', 'R&D / Quality', 'Product / Business Unit', 'Sustainability', 'Procurement', 'Strategy / Project Lead', 'Regulatory', 'Marketing', 'Operations', 'Finance'];
const DEPARTMENTS_KEY = 'team_departments_v1';
const DEPARTMENTS_EVENT = 'teamDepartmentsUpdated';

const loadDepartments = (): string[] => {
  try {
    const raw = localStorage.getItem(DEPARTMENTS_KEY);
    if (!raw) return DEFAULT_DEPARTMENTS;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length ? arr : DEFAULT_DEPARTMENTS;
  } catch { return DEFAULT_DEPARTMENTS; }
};
const saveDepartments = (list: string[]) => {
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(DEPARTMENTS_EVENT));
};

function useDepartments(): [string[], (next: string[]) => void] {
  const [list, setList] = useState<string[]>(() => loadDepartments());
  useEffect(() => {
    const h = () => setList(loadDepartments());
    window.addEventListener(DEPARTMENTS_EVENT, h);
    window.addEventListener('storage', h);
    return () => { window.removeEventListener(DEPARTMENTS_EVENT, h); window.removeEventListener('storage', h); };
  }, []);
  return [list, (next) => { saveDepartments(next); setList(next); }];
}

const DepartmentManagerDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onAdded?: (name: string) => void;
}> = ({ open, onClose, onAdded }) => {
  const [departments, setDepartments] = useDepartments();
  const [newName, setNewName] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => { if (open) { setNewName(''); setEditingIdx(null); setEditValue(''); } }, [open]);

  const add = () => {
    const n = newName.trim(); if (!n) return;
    if (departments.some(d => d.toLowerCase() === n.toLowerCase())) { toast.error('That department already exists'); return; }
    const next = [...departments, n]; setDepartments(next); setNewName(''); onAdded?.(n);
    toast.success(`Added "${n}"`);
  };
  const startEdit = (i: number) => { setEditingIdx(i); setEditValue(departments[i]); };
  const commitEdit = () => {
    if (editingIdx === null) return;
    const n = editValue.trim(); if (!n) { setEditingIdx(null); return; }
    if (departments.some((d, i) => i !== editingIdx && d.toLowerCase() === n.toLowerCase())) { toast.error('That department already exists'); return; }
    setDepartments(departments.map((d, i) => i === editingIdx ? n : d)); setEditingIdx(null);
  };
  const remove = (i: number) => {
    const name = departments[i];
    setDepartments(departments.filter((_, idx) => idx !== i));
    toast.success(`Removed "${name}"`);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" /> Manage departments
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground">
            Create, rename, or remove department tags. Changes apply to everyone using this workspace.
          </p>
        </DialogHeader>
        <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-1">
          {departments.map((d, i) => (
            <div key={`${d}-${i}`} className="flex items-center gap-1 group">
              {editingIdx === i ? (
                <>
                  <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingIdx(null); }}
                    className="h-8 text-[11px] flex-1" />
                  <button onClick={commitEdit} className="h-8 w-8 flex items-center justify-center rounded-md text-primary hover:bg-muted"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditingIdx(null)} className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><X className="w-3.5 h-3.5" /></button>
                </>
              ) : (
                <>
                  <div className="flex-1 px-2 py-1.5 text-[11px] rounded-md bg-muted/40 truncate">{d}</div>
                  <button onClick={() => startEdit(i)} className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(i)} className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )}
            </div>
          ))}
          {departments.length === 0 && <div className="text-[11px] text-muted-foreground text-center py-3">No departments yet.</div>}
        </div>
        <div className="border-t pt-3 space-y-1">
          <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">New department</label>
          <div className="flex items-center gap-2">
            <Input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); }} placeholder="e.g. Quality Assurance" className="h-8 text-[11px] flex-1" />
            <Button size="sm" onClick={add} disabled={!newName.trim()} className="h-8 text-[11px] gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</Button>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} className="h-8 text-[11px]">Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface Invitee { id: string; name: string; email: string; department: string; }
const ShareSectionDialog: React.FC<{ open: boolean; sectionTitle: string; topic: string; onClose: () => void }> = ({ open, sectionTitle, topic, onClose }) => {
  const newRow = (): Invitee => ({ id: Math.random().toString(36).slice(2), name: '', email: '', department: '' });
  const [invitees, setInvitees] = useState<Invitee[]>([newRow()]);
  const [message, setMessage] = useState('');
  const [departments] = useDepartments();
  const [manageOpen, setManageOpen] = useState(false);
  const [manageTargetId, setManageTargetId] = useState<string | null>(null);

  useEffect(() => { if (open) { setInvitees([newRow()]); setMessage(''); } }, [open]);

  const update = (id: string, patch: Partial<Invitee>) =>
    setInvitees(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  const remove = (id: string) =>
    setInvitees(prev => prev.length === 1 ? prev : prev.filter(i => i.id !== id));

  const valid = invitees.filter(i => i.name.trim() && /.+@.+\..+/.test(i.email) && i.department);
  const canSend = valid.length > 0;

  const send = () => {
    toast.success(`Invitation sent to ${valid.length} ${valid.length === 1 ? 'teammate' : 'teammates'}`, {
      description: `"${sectionTitle}" of ${topic} brief shared.`,
    });
    onClose();
  };

  const NEW_DEPT_SENTINEL = '__new__';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Share2 className="w-4 h-4 text-primary" />
            Share section · <span className="text-muted-foreground font-normal">{sectionTitle}</span>
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground">
            Invite teammates to view and contribute to this section of the {topic} material brief.
          </p>
        </DialogHeader>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {invitees.map((inv, idx) => (
            <div key={inv.id} className="grid grid-cols-[1fr_1.4fr_1fr_auto] gap-2 items-end">
              <div className="space-y-1">
                {idx === 0 && <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Name</label>}
                <Input value={inv.name} onChange={e => update(inv.id, { name: e.target.value })} placeholder="Jane Doe" className="h-8 text-[11px]" />
              </div>
              <div className="space-y-1">
                {idx === 0 && <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Email</label>}
                <Input type="email" value={inv.email} onChange={e => update(inv.id, { email: e.target.value })} placeholder="jane@company.com" className="h-8 text-[11px]" />
              </div>
              <div className="space-y-1">
                {idx === 0 && (
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Department</label>
                    <button onClick={() => { setManageTargetId(null); setManageOpen(true); }} title="Manage department tags" className="text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                  </div>
                )}
                <Select
                  value={inv.department}
                  onValueChange={v => {
                    if (v === NEW_DEPT_SENTINEL) { setManageTargetId(inv.id); setManageOpen(true); return; }
                    update(inv.id, { department: v });
                  }}>
                  <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d} className="text-[11px]">{d}</SelectItem>)}
                    {departments.length > 0 && <div className="h-px bg-border my-1" />}
                    <SelectItem value={NEW_DEPT_SENTINEL} className="text-[11px] text-primary">
                      <span className="inline-flex items-center gap-1.5"><Plus className="w-3 h-3" /> New department…</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <button onClick={() => remove(inv.id)} disabled={invitees.length === 1}
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted disabled:opacity-30">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 w-full border-dashed text-[11px]" onClick={() => setInvitees(prev => [...prev, newRow()])}>
          <Plus className="w-3.5 h-3.5" /> Add another invitee
        </Button>
        <div className="space-y-1">
          <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Optional message</label>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Add a short note for the invitees…" className="text-[11px] min-h-[60px]" />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-[11px]">Cancel</Button>
          <Button size="sm" onClick={send} disabled={!canSend} className="h-8 text-[11px] gap-1.5">
            <Send className="w-3.5 h-3.5" />
            Send {valid.length > 0 ? `${valid.length} ${valid.length === 1 ? 'invite' : 'invites'}` : 'invites'}
          </Button>
        </DialogFooter>
        <DepartmentManagerDialog
          open={manageOpen}
          onClose={() => { setManageOpen(false); setManageTargetId(null); }}
          onAdded={(name) => { if (manageTargetId) update(manageTargetId, { department: name }); }}
        />
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// Main component
// ============================================================================

interface Props { topic: string; category: string; headerless?: boolean; }

const MaterialBriefForm: React.FC<Props> = ({ topic, category, headerless = false }) => {
  const storageKey = `material-brief-v2-${category}-${topic}`;
  const metaKey = `material-brief-meta-v2-${category}-${topic}`;
  const [data, setData] = useState<BriefData>(empty);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [sectionsHidden, setSectionsHidden] = useState(true);
  const [shareSection, setShareSection] = useState<string | null>(null);
  const onShareFor = (title: string) => () => setShareSection(title);
  const [sectionUpdatedAt, setSectionUpdatedAt] = useState<Record<string, string>>({});
  // Wizard step (0..3) — controls which section is visible in the guided dialog
  const [wizardStep, setWizardStep] = useState(0);
  // Keep `open` for back-compat with <Section> props; all sections are forced open inside the wizard
  const [open, setOpen] = useState<Record<string, boolean>>({
    ctx: true, why: true, pathway: true, decision: true,
  });
  const loadedRef = useRef(false);

  // Listen for external requests to open the guided wizard (e.g. from the hero card)
  useEffect(() => {
    const evtName = `openMaterialProfile:${category}:${topic}`;
    const handler = () => { setWizardStep(0); setSectionsHidden(false); };
    window.addEventListener(evtName, handler as EventListener);
    return () => window.removeEventListener(evtName, handler as EventListener);
  }, [topic, category]);

  // Load saved data (with migration from legacy schema)
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    let next: BriefData = { ...empty };
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        next = { ...empty, ...parsed };
        // Migrate from legacy if needed
        if (!parsed.intent) {
          if (parsed.objective === 'Source' || parsed.briefType === 'Replacement') next.intent = 'Replacement';
          else if (parsed.objective === 'Produce' || parsed.objective === 'Valorise') next.intent = 'NewIntroduction';
          if (!next.materialName) next.materialName = topic;
        }
      } catch { /* */ }
    } else if (topic === 'Sulphuric Acid') {
      next = { ...empty, ...sulphuricAcidMock };
    } else {
      next.materialName = topic;
    }
    setData(next);

    const metaRaw = localStorage.getItem(metaKey);
    if (metaRaw) {
      try {
        const meta = JSON.parse(metaRaw);
        if (meta.sectionUpdatedAt) setSectionUpdatedAt(meta.sectionUpdatedAt);
      } catch { /* */ }
    }
    loadedRef.current = true;
  }, [storageKey, topic, category, metaKey]);

  // Auto-save (debounced) + legacy mirror
  useEffect(() => {
    if (!loadedRef.current) return;
    const t = setTimeout(() => {
      // Mirror to legacy fields so downstream views (Pipeline / Welcome widget) keep working
      const legacy: Partial<BriefData> = {
        objective: data.intent === 'Replacement' ? 'Source' : 'Produce',
        timeline: data.urgencyNote || data.timeline || '',
        rationale: [data.primaryMotivation].filter(Boolean) as string[],
      };
      const toSave = { ...data, ...legacy };
      localStorage.setItem(storageKey, JSON.stringify(toSave));
      setSavedAt(new Date());
      window.dispatchEvent(new Event('materialBriefUpdated'));
    }, 400);
    return () => clearTimeout(t);
  }, [data, storageKey]);

  useEffect(() => {
    if (!loadedRef.current) return;
    localStorage.setItem(metaKey, JSON.stringify({ sectionUpdatedAt }));
  }, [sectionUpdatedAt, metaKey]);

  const SECTION_FOR_FIELD: Record<string, string> = useMemo(() => {
    const m: Record<string, string> = {};
    sectionDefs(data.intent).forEach(s => s.fields.forEach(f => { m[f] = s.id; }));
    return m;
  }, [data.intent]);

  const update = <K extends keyof BriefData>(k: K, v: BriefData[K]) => {
    const sid = SECTION_FOR_FIELD[k as string];
    if (sid) setSectionUpdatedAt(prev => ({ ...prev, [sid]: new Date().toISOString() }));
    setData(prev => ({ ...prev, [k]: v }));
  };

  const { sections, completed, total } = computeBriefCompletion(data);
  const completion = total ? Math.round((completed / total) * 100) : 0;
  const priority = computePriority(data);
  const readiness = computeReadiness(data);

  const isReplacement = data.intent === 'Replacement';
  const isNew = data.intent === 'NewIntroduction';

  const intentMeta = isReplacement
    ? { Icon: Repeat, tint: 'text-primary', subtitle: 'Replacement / substitution — find an alternative to an existing material.' }
    : isNew
      ? { Icon: Sparkles, tint: 'text-application-purple', subtitle: 'New material introduction — assess a material not yet in the portfolio.' }
      : { Icon: Sparkles, tint: 'text-muted-foreground', subtitle: 'Select a material intent below to start the brief.' };
  const { Icon, tint, subtitle } = intentMeta;

  // Section indices (match sectionDefs order: 0 ctx, 1 why, 2 pathway, 3 decision)
  const s = sections;

  // Dynamic helpers
  const applicationHelp = isReplacement
    ? 'Where is the incumbent material currently used?'
    : isNew ? 'Where could this material be introduced?' : 'Where is (or will) this material be used?';
  const commercialHelp = isReplacement
    ? 'How important is the incumbent material to the business today?'
    : isNew ? 'How important is the opportunity this material could unlock?' : 'Capture the business relevance of this material.';
  const sustainabilityHelp = isReplacement
    ? 'How much sustainability improvement could replacement deliver?'
    : isNew ? 'How much sustainability value could introduction create?' : 'Sustainability lever potential.';
  const supplyHelp = isReplacement
    ? 'How vulnerable is the current sourcing situation?'
    : isNew ? 'How uncertain is future availability or scale-up?' : 'Supply or availability risk.';

  const priorityColor =
    priority.percent >= 75 ? 'text-emerald-600 bg-emerald-500/10'
    : priority.percent >= 55 ? 'text-amber-600 bg-amber-500/10'
    : priority.percent >= 35 ? 'text-orange-600 bg-orange-500/10'
    : 'text-muted-foreground bg-muted';

  const readinessColor =
    readiness.status === 'Pilot-scope-ready' ? 'text-emerald-600 bg-emerald-500/10'
    : readiness.status === 'Search-ready' ? 'text-amber-600 bg-amber-500/10'
    : readiness.status === 'Partially defined' ? 'text-orange-600 bg-orange-500/10'
    : 'text-muted-foreground bg-muted';

  return (
    <div className={headerless ? 'contents' : 'rounded-xl border border-border/60 bg-card overflow-hidden'}>
      {/* Header */}
      {!headerless && (
      <div className="p-4 space-y-3 border-b-2 border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center ${tint}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Material Profile</h2>
              <p className="text-[10px] text-muted-foreground">{topic} · {subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setWizardStep(0); setSectionsHidden(false); }}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
              <Wand2 className="w-3 h-3" />
              {completion === 0 ? 'Start guided setup' : completion === 100 ? 'Review profile' : 'Continue setup'}
            </button>
            <p className="text-[9px] text-muted-foreground">
              {savedAt ? (<><CheckCircle2 className="inline w-2.5 h-2.5 text-success mr-1" />Saved {formatTime(savedAt)}</>) : 'Auto-save enabled'}
            </p>
          </div>
        </div>

        {/* Completion */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Completion</span>
            <span className="text-[10px] font-bold text-foreground tabular-nums">{completed}/{total} sections · {completion}%</span>
          </div>
          <Progress value={completion} className="h-1.5" />
        </div>

        {/* Priority & Readiness summary */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className={`rounded-md px-3 py-2 ${priorityColor}`}>
            <div className="text-[9px] uppercase tracking-widest font-semibold opacity-80">Material Priority</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold tabular-nums">{priority.score}/{priority.max}</span>
              <span className="text-[10px] opacity-80">· {priority.percent}%</span>
            </div>
            <div className="text-[10px] mt-0.5 truncate">{priority.status}</div>
            <div className="text-[9px] opacity-70 mt-0.5">Confidence: {priority.confidence}</div>
          </div>
          <div className={`rounded-md px-3 py-2 ${readinessColor}`}>
            <div className="text-[9px] uppercase tracking-widest font-semibold opacity-80">Brief Readiness</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold tabular-nums">{readiness.filled}/{readiness.total}</span>
              <span className="text-[10px] opacity-80">· {readiness.percent}%</span>
            </div>
            <div className="text-[10px] mt-0.5 truncate">{readiness.status}</div>
            <div className="text-[9px] opacity-70 mt-0.5">For deeper VCG.AI intelligence</div>
          </div>
        </div>
        </div>
      )}

      <Dialog open={!sectionsHidden} onOpenChange={v => setSectionsHidden(!v)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          {(() => {
            const steps = [
              { id: 'ctx', label: 'Material context', sIdx: 0 },
              { id: 'why', label: 'Why it matters', sIdx: 1 },
              { id: 'pathway', label: isReplacement ? 'Replacement details' : isNew ? 'Introduction details' : 'Pathway details', sIdx: 2 },
              { id: 'decision', label: 'Decision & readiness', sIdx: 3 },
            ];
            const current = steps[wizardStep];
            const stepPct = Math.round(((wizardStep + 1) / steps.length) * 100);
            return (
              <>
                <DialogHeader className="px-5 pt-5 pb-3 border-b border-border space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-primary" />
                        Material Profile · Guided Setup
                      </DialogTitle>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{topic} · Step {wizardStep + 1} of {steps.length} — {current.label}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">Overall</div>
                      <div className="text-[11px] font-bold tabular-nums text-foreground">{completed}/{total} · {completion}%</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Progress value={stepPct} className="h-1" />
                    <div className="flex items-center justify-between gap-1">
                      {steps.map((st, i) => {
                        const sec = s[st.sIdx];
                        const isCurrent = i === wizardStep;
                        const isDone = sec.complete;
                        const isPast = i < wizardStep;
                        return (
                          <div
                            key={st.id}
                            className={`flex-1 flex items-center gap-1 text-[9px] font-medium transition-colors ${
                              isCurrent ? 'text-foreground' :
                              isDone || isPast ? 'text-muted-foreground' : 'text-muted-foreground/50'
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-success" />
                            ) : (
                              <Circle className={`w-2.5 h-2.5 shrink-0 ${isCurrent ? 'fill-foreground text-foreground' : ''}`} />
                            )}
                            <span className="truncate">{i + 1}. {st.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                  {wizardStep === 0 && (
                    <>
                      {/* ───────── Section 1 — Material context ───────── */}
          <Section headless id="ctx" title="Material context" filled={s[0].filled} total={s[0].total} complete={s[0].complete} updatedAt={sectionUpdatedAt['ctx']} required open={open.ctx} onToggle={() => setOpen(p => ({ ...p, ctx: !p.ctx }))} onShare={onShareFor('Material context')}>

            <div className="space-y-1">
              <FieldLabel required owner="Strategy / Project Lead" help="Select whether this material is replacing an existing incumbent or being introduced for the first time.">
                Material intent
              </FieldLabel>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                {([
                  { v: 'Replacement', label: 'Replacement / substitution' },
                  { v: 'NewIntroduction', label: 'New material introduction' },
                ] as { v: Intent; label: string }[]).map(o => {
                  const active = data.intent === o.v;
                  return (
                    <button key={o.v} onClick={() => update('intent', o.v)}
                      className={`text-[11px] py-1.5 rounded-md transition-all font-medium ${active ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <FieldLabel required owner="R&D / Product" help="Add the material name and optional CAS number if known.">
                  Material name / identifier
                </FieldLabel>
                <Input
                  value={data.materialName}
                  onChange={e => update('materialName', e.target.value)}
                  placeholder="e.g. Lactic acid, PET, bio-based surfactant, acrylic acid"
                  className="text-[11px] h-8" />
              </div>
              <div className="space-y-1">
                <FieldLabel required owner="R&D / Product" help={applicationHelp}>
                  {isReplacement ? 'Current application' : 'Target application'}
                </FieldLabel>
                <Input
                  value={data.application}
                  onChange={e => update('application', e.target.value)}
                  placeholder="e.g. preservative in personal care formulations"
                  className="text-[11px] h-8" />
              </div>
            </div>

            <div className="space-y-1">
              <FieldLabel required owner="R&D / Product" help="What role must the material perform?">
                Required function
              </FieldLabel>
              <Select value={data.requiredFunction} onValueChange={v => update('requiredFunction', v)}>
                <SelectTrigger className="text-[11px] h-8"><SelectValue placeholder="Select function" /></SelectTrigger>
                <SelectContent>{REQUIRED_FUNCTIONS.map(f => <SelectItem key={f} value={f} className="text-[11px]">{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </Section>
                    </>
                  )}

                  {wizardStep === 1 && (
                    <>
                      {/* ───────── Section 2 — Why it matters ───────── */}
                      <Section headless id="why" title="Why it matters" filled={s[1].filled} total={s[1].total} complete={s[1].complete} updatedAt={sectionUpdatedAt['why']} required open={open.why} onToggle={() => setOpen(p => ({ ...p, why: !p.why }))} onShare={onShareFor('Why it matters')}>
            <div className="space-y-1">
              <FieldLabel required owner="Product / Business Unit" help={commercialHelp}>
                Commercial importance
              </FieldLabel>
              <StarRating value={data.commercialImportance} onChange={v => update('commercialImportance', v)} scale={COMMERCIAL_SCALE} />
            </div>

            <div className="space-y-1">
              <FieldLabel required owner="Strategy / Project Lead" help="What is the main reason this material is being assessed?">
                Primary motivation
              </FieldLabel>
              <Select value={data.primaryMotivation} onValueChange={v => update('primaryMotivation', v)}>
                <SelectTrigger className="text-[11px] h-8"><SelectValue placeholder="Select motivation" /></SelectTrigger>
                <SelectContent>{PRIMARY_MOTIVATIONS.map(m => <SelectItem key={m} value={m} className="text-[11px]">{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <FieldLabel required owner="Strategy / Project Lead" help="How urgent is action on this material?">
                Urgency
              </FieldLabel>
              <StarRating value={data.urgency} onChange={v => update('urgency', v)} scale={URGENCY_SCALE} />
              <div className="pt-1">
                <FieldLabel>What is driving the urgency?</FieldLabel>
                <Input value={data.urgencyNote} onChange={e => update('urgencyNote', e.target.value)}
                  placeholder="e.g. EU regulation Q2 2026, customer RFP deadline" className="text-[11px] h-8" />
              </div>
            </div>

            <div className="space-y-1">
              <FieldLabel owner="Sustainability" help={sustainabilityHelp}>
                Sustainability impact potential
              </FieldLabel>
              <StarRating value={data.sustainabilityImpact} onChange={v => update('sustainabilityImpact', v)} scale={SUSTAINABILITY_SCALE} />
            </div>

            <div className="space-y-1">
              <FieldLabel owner="Procurement" help={supplyHelp}>
                Supply risk / availability concern
              </FieldLabel>
              <StarRating value={data.supplyRisk} onChange={v => update('supplyRisk', v)} scale={SUPPLY_RISK_SCALE} />
            </div>
          </Section>
                    </>
                  )}

                  {wizardStep === 2 && (
                    <>
                      {/* ───────── Section 3 — Pathway-specific details ───────── */}
                      <Section headless id="pathway"
            title={isReplacement ? 'Replacement details' : isNew ? 'Introduction details' : 'Pathway-specific details'}
            filled={s[2].filled} total={s[2].total} complete={s[2].complete}
            updatedAt={sectionUpdatedAt['pathway']} required={!!data.intent}
            open={open.pathway} onToggle={() => setOpen(p => ({ ...p, pathway: !p.pathway }))}
            onShare={onShareFor(isReplacement ? 'Replacement details' : 'Introduction details')}>
            {!data.intent && (
              <p className="text-[11px] text-muted-foreground italic">
                Select a material intent in the section above to reveal the relevant fields.
              </p>
            )}

            {isReplacement && (
              <>
                <div className="space-y-1">
                  <FieldLabel required owner="R&D / Product" help="What material, supplier solution, or production route is being replaced?">
                    Current incumbent material
                  </FieldLabel>
                  <Input value={data.incumbent} onChange={e => update('incumbent', e.target.value)}
                    placeholder="e.g. fossil-based acrylic acid, incumbent surfactant blend, current resin"
                    className="text-[11px] h-8" />
                </div>
                <div className="space-y-1">
                  <FieldLabel required owner="R&D / Quality" help="What is the one requirement a replacement cannot fail on?">
                    Critical specification to match
                  </FieldLabel>
                  <Textarea value={data.criticalSpec} onChange={e => update('criticalSpec', e.target.value)}
                    placeholder="e.g. must maintain viscosity range, purity, shelf-life, tensile strength, pH, barrier performance"
                    className="text-[11px] min-h-[60px] py-1.5" />
                </div>
                <div className="space-y-1">
                  <FieldLabel required owner="R&D / Product" help="How much change is acceptable when replacing the incumbent?">
                    Substitution flexibility
                  </FieldLabel>
                  <Select value={data.substitutionFlexibility} onValueChange={v => update('substitutionFlexibility', v)}>
                    <SelectTrigger className="text-[11px] h-8"><SelectValue placeholder="Select flexibility" /></SelectTrigger>
                    <SelectContent>{SUBSTITUTION_FLEXIBILITY.map(o => <SelectItem key={o} value={o} className="text-[11px]">{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </>
            )}

            {isNew && (
              <>
                <div className="space-y-1">
                  <FieldLabel required owner="R&D / Product" help="What should the new material enable?">
                    Desired performance outcome
                  </FieldLabel>
                  <Textarea value={data.desiredOutcome} onChange={e => update('desiredOutcome', e.target.value)}
                    placeholder="e.g. improve durability, enable lower-carbon claim, improve sensory profile, unlock new product format"
                    className="text-[11px] min-h-[60px] py-1.5" />
                </div>
                <div className="space-y-1">
                  <FieldLabel owner="Strategy / Project Lead" help="How would this material enter the portfolio?">
                    Adoption pathway
                  </FieldLabel>
                  <Select value={data.adoptionPathway} onValueChange={v => update('adoptionPathway', v)}>
                    <SelectTrigger className="text-[11px] h-8"><SelectValue placeholder="Select pathway" /></SelectTrigger>
                    <SelectContent>{ADOPTION_PATHWAYS.map(o => <SelectItem key={o} value={o} className="text-[11px]">{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <FieldLabel owner="R&D / Product" help="Even if there is no direct incumbent, what should this material be compared against?">
                    Internal baseline to compare against
                  </FieldLabel>
                  <Input value={data.internalBaseline} onChange={e => update('internalBaseline', e.target.value)}
                    placeholder="e.g. current formulation without this material, competitor benchmark, fossil-based category benchmark, target cost-in-use"
                    className="text-[11px] h-8" />
                </div>
              </>
            )}
          </Section>
                    </>
                  )}

                  {wizardStep === 3 && (
                    <>
                      {/* ───────── Section 4 — Decision & readiness ───────── */}
                      <Section headless id="decision" title="Decision & readiness" filled={s[3].filled} total={s[3].total} complete={s[3].complete} updatedAt={sectionUpdatedAt['decision']} required open={open.decision} onToggle={() => setOpen(p => ({ ...p, decision: !p.decision }))} onShare={onShareFor('Decision & readiness')}>
            <div className="space-y-1">
              <FieldLabel required owner="R&D / Product" help="How much does the organisation already know about possible solutions?">
                Solution readiness
              </FieldLabel>
              <Select value={data.solutionReadiness} onValueChange={v => update('solutionReadiness', v)}>
                <SelectTrigger className="text-[11px] h-8"><SelectValue placeholder="Select readiness" /></SelectTrigger>
                <SelectContent>{SOLUTION_READINESS.map(o => <SelectItem key={o} value={o} className="text-[11px]">{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <FieldLabel required owner="Strategy / Project Lead" help="What decision should this brief help the team make?">
                Next decision
              </FieldLabel>
              <Select value={data.nextDecision} onValueChange={v => update('nextDecision', v)}>
                <SelectTrigger className="text-[11px] h-8"><SelectValue placeholder="Select decision" /></SelectTrigger>
                <SelectContent>{NEXT_DECISIONS.map(o => <SelectItem key={o} value={o} className="text-[11px]">{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Summary cards inline */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-md border border-border p-2">
                <div className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">Material Priority Score</div>
                <div className="text-lg font-bold tabular-nums">{priority.score}<span className="text-xs text-muted-foreground">/{priority.max}</span></div>
                <div className="text-[10px] text-foreground">{priority.status}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">Confidence: {priority.confidence}</div>
              </div>
              <div className="rounded-md border border-border p-2">
                <div className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">Brief Readiness</div>
                <div className="text-lg font-bold tabular-nums">{readiness.filled}<span className="text-xs text-muted-foreground">/{readiness.total}</span></div>
                <div className="text-[10px] text-foreground">{readiness.status}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">Required fields for VCG.AI handoff</div>
              </div>
            </div>
          </Section>
                    </>
                  )}
                </div>

                <DialogFooter className="px-5 py-3 border-t border-border bg-muted/30 sm:justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] gap-1.5"
                    onClick={() => setWizardStep(p => Math.max(0, p - 1))}
                    disabled={wizardStep === 0}
                  >
                    <ArrowLeft className="w-3 h-3" /> Back
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 text-[11px]" onClick={() => setSectionsHidden(true)}>
                      Save & close
                    </Button>
                    {wizardStep < steps.length - 1 ? (
                      <Button size="sm" className="h-8 text-[11px] gap-1.5" onClick={() => setWizardStep(p => Math.min(steps.length - 1, p + 1))}>
                        Next <ArrowRight className="w-3 h-3" />
                      </Button>
                    ) : (
                      <Button size="sm" className="h-8 text-[11px] gap-1.5" onClick={() => setSectionsHidden(true)}>
                        <Check className="w-3 h-3" /> Finish
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <ShareSectionDialog
        open={!!shareSection}
        sectionTitle={shareSection || ''}
        topic={topic}
        onClose={() => setShareSection(null)}
      />
    </div>
  );
};

export default MaterialBriefForm;
