import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Star, Upload, Users, UserPlus, Compass, Trash2, Plus, X, CheckCircle2, AlertTriangle, Wand2, Download, History as HistoryIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { exportScoringCsv, exportScoringPdf } from '@/lib/exportStrategicScoring';

// ────────────────────────────────────────────────────────────
// Types & defaults
// ────────────────────────────────────────────────────────────
type Role = 'Owner' | 'Contributor';
type TeamMember = { id: string; name: string; email: string; role: Role };

type MaterialDetails = {
  name: string;
  intent: 'replace' | 'introduce';
  category: string;
  applicationAreas: string[];
  transitionOwnerId: string;
};

type StarKey =
  | 'regulatory'
  | 'supplySecurity'
  | 'internalMandate'
  | 'performanceUpside'
  | 'marketPull'
  | 'marketingClaim'
  | 'sustainabilityImprovement'
  | 'costOpportunity';
type StrategicScoring = {
  volume: number | '';
  volumeUnit: string;
  volumeSource: string;
  ghg: number | '';
  ghgMode: 'fxv' | 'total';
  ghgSource: string;
  spend: number | '';
  spendMode: 'fxv' | 'total';
  spendCurrency: string;
  spendSource: string;
  supplierCount: number | '';
  supplierCountries: { id: string; country: string; share: number | '' }[];
  suppliersSource: string;
  stars: Record<StarKey, number>;
  supplySource: 'single' | 'multi';
  priorityNote: string;
  productGated: boolean;
};

type RequirementKey = 'targetSpec' | 'product' | 'sustainability' | 'customer' | 'regulatory' | 'strategy';
type Requirements = Record<RequirementKey, { status: 'empty' | 'uploaded' | 'requested'; note?: string }>;

type WorkStatus =
  | 'not_started'
  | 'under_evaluation'
  | 'in_testing'
  | 'qualified'
  | 'sourcing'
  | 'in_use'
  | 'parked'
  | 'rejected';

type BlockerCategory =
  | ''
  | 'technical'
  | 'cost'
  | 'supply'
  | 'regulatory'
  | 'customer'
  | 'internal_capacity'
  | 'strategic_fit'
  | 'other';

type Blocker = {
  category: BlockerCategory;
  detail: string;
  date: string;
  condition: string;
};

type HistoryEvent = {
  id: string;
  field: string;
  from: string;
  to: string;
  reason: string;
  at: string;
  by: string;
};

type BriefState = {
  workStatus: WorkStatus;
  blocker: Blocker;
  prioritySelected: '' | 'yes' | 'no';
  priorityPeriod: string;
  history: HistoryEvent[];
  team: TeamMember[];
  details: MaterialDetails;
  scoring: StrategicScoring;
  requirements: Requirements;
};

const DEFAULT_TEAM: TeamMember[] = [
  { id: 'jg', name: 'Jane Goodwin', email: 'jane.goodwin@company.com', role: 'Owner' },
  { id: 'ar', name: 'Alex Rivera', email: 'alex.rivera@company.com', role: 'Contributor' },
  { id: 'pp', name: 'Priya Patel', email: 'priya.patel@company.com', role: 'Contributor' },
];

// Signed-in user used to attribute event log entries in the prototype.
const CURRENT_USER = 'Jane Goodwin';

const defaultState = (topic: string): BriefState => ({
  workStatus: 'not_started',
  blocker: { category: '', detail: '', date: '', condition: '' },
  prioritySelected: '',
  priorityPeriod: '',
  history: [],
  team: DEFAULT_TEAM,
  details: {
    name: topic,
    intent: 'introduce',
    category: 'Additives',
    applicationAreas: ['Detergents'],
    transitionOwnerId: 'ar',
  },
  scoring: {
    volume: 19968,
    volumeUnit: 't/yr',
    volumeSource: '',
    ghg: 15,
    ghgMode: 'fxv',
    ghgSource: '',
    spend: '',
    spendMode: 'fxv',
    spendCurrency: 'EUR',
    spendSource: '',
    supplierCount: '',
    supplierCountries: [],
    suppliersSource: '',
    stars: {
      regulatory: 1,
      supplySecurity: 2,
      internalMandate: 5,
      performanceUpside: 3,
      marketPull: 5,
      marketingClaim: 3,
       sustainabilityImprovement: 4,
       costOpportunity: 4,
     },
     supplySource: 'multi',
     priorityNote: '',
     productGated: false,
  },
  requirements: {
    targetSpec: { status: 'empty' },
    product: { status: 'empty' },
    sustainability: { status: 'empty' },
    customer: { status: 'empty' },
    regulatory: { status: 'empty' },
    strategy: { status: 'empty' },
  },
});

const WORK_STATUS_META: Record<WorkStatus, { label: string; dot: string }> = {
  not_started: { label: 'Not started', dot: 'bg-muted-foreground' },
  under_evaluation: { label: 'Under evaluation', dot: 'bg-muted-foreground' },
  in_testing: { label: 'In testing', dot: 'bg-muted-foreground' },
  qualified: { label: 'Qualified', dot: 'bg-muted-foreground' },
  sourcing: { label: 'Sourcing', dot: 'bg-muted-foreground' },
  in_use: { label: 'In-use', dot: 'bg-muted-foreground' },
  parked: { label: 'Parked', dot: 'bg-muted-foreground' },
  rejected: { label: 'Rejected', dot: 'bg-muted-foreground' },
};

const BLOCKER_CATEGORIES: { value: Exclude<BlockerCategory, ''>; label: string }[] = [
  { value: 'technical', label: 'Technical performance' },
  { value: 'cost', label: 'Cost / economics' },
  { value: 'supply', label: 'Supply / availability' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'customer', label: 'Customer acceptance' },
  { value: 'internal_capacity', label: 'Internal capacity' },
  { value: 'strategic_fit', label: 'Strategic fit' },
  { value: 'other', label: 'Other' },
];

const LEGACY_STATUS_MAP: Record<string, WorkStatus> = {
  scoping: 'not_started',
  in_progress: 'under_evaluation',
  validated: 'qualified',
  archived: 'parked',
};

// ────────────────────────────────────────────────────────────
// Storage
// ────────────────────────────────────────────────────────────
const storageKey = (cat: string, topic: string) => `material_brief_v2_${cat}_${topic}`;
const progressKey = (cat: string, topic: string) => `material_brief_progress_${cat}_${topic}`;

const loadState = (cat: string, topic: string): BriefState => {
  if (typeof window === 'undefined') return defaultState(topic);
  try {
    const raw = localStorage.getItem(storageKey(cat, topic));
    if (!raw) return defaultState(topic);
    const base = defaultState(topic);
    const parsed = JSON.parse(raw) as Partial<BriefState>;
    const merged = {
      ...base,
      ...parsed,
      details: { ...base.details, ...(parsed.details ?? {}) },
      scoring: { ...base.scoring, ...(parsed.scoring ?? {}) },
    } as BriefState;
    // Migrate legacy work statuses and ensure blocker shape exists.
    merged.workStatus = (WORK_STATUS_META[merged.workStatus as WorkStatus]
      ? merged.workStatus
      : LEGACY_STATUS_MAP[merged.workStatus as unknown as string] ?? 'not_started') as WorkStatus;
    merged.blocker = { ...base.blocker, ...(parsed.blocker ?? {}) };
    merged.history = Array.isArray(parsed.history) ? parsed.history : [];
    // Migrate legacy strategic ratings and supplierCountries to the current shapes.
    const savedStars = (merged.scoring.stars ?? {}) as Record<string, number>;
    merged.scoring.stars = {
      regulatory: savedStars.regulatory ?? 0,
      supplySecurity: savedStars.supplySecurity ?? savedStars.supplyRisk ?? 0,
      internalMandate: savedStars.internalMandate ?? savedStars.strategicCommitment ?? 0,
      performanceUpside: savedStars.performanceUpside ?? 0,
      marketPull: savedStars.marketPull ?? savedStars.customerPull ?? 0,
      marketingClaim: savedStars.marketingClaim ?? 0,
      sustainabilityImprovement: savedStars.sustainabilityImprovement ?? 0,
      costOpportunity: savedStars.costOpportunity ?? savedStars.businessExposure ?? 0,
    };
    const sc = merged.scoring.supplierCountries as unknown;
    merged.scoring.supplierCountries = Array.isArray(sc)
      ? sc
      : typeof sc === 'string' && sc.trim()
        ? sc.split(',').map((c, i) => ({ id: `legacy-${i}`, country: c.trim(), share: '' as const }))
        : [];
    // Migrate legacy single applicationArea to the list
    const parsedDetails = parsed.details as unknown as { applicationArea?: string; applicationAreas?: string[] } | undefined;
    merged.details.applicationAreas = Array.isArray(parsedDetails?.applicationAreas)
      ? parsedDetails!.applicationAreas
      : parsedDetails?.applicationArea
        ? [parsedDetails.applicationArea]
        : base.details.applicationAreas;
    return merged;
  } catch { return defaultState(topic); }
};

// ────────────────────────────────────────────────────────────
// Completion helpers
// ────────────────────────────────────────────────────────────
const detailsComplete = (d: MaterialDetails) =>
  !!d.name && !!d.category && d.applicationAreas.length > 0 && !!d.transitionOwnerId;

const scoringComplete = (s: StrategicScoring) =>
  s.volume !== '' && s.ghg !== '' && Object.values(s.stars).every((v) => v > 0);

const requirementsComplete = (r: Requirements) =>
  Object.values(r).some((x) => x.status === 'uploaded');

const detailsPercent = (d: MaterialDetails) => {
  const fields = [d.name, d.category, d.applicationAreas.length > 0, d.transitionOwnerId];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
};

const scoringPercent = (s: StrategicScoring) => {
  let filled = 0;
  const total = 10;
  if (s.volume !== '') filled++;
  if (s.ghg !== '') filled++;
  filled += Object.values(s.stars).filter((v) => v > 0).length;
  return Math.round((filled / total) * 100);
};

const requirementsPercent = (r: Requirements) => {
  const total = Object.keys(r).length;
  const filled = Object.values(r).filter((x) => x.status === 'uploaded').length;
  return Math.round((filled / total) * 100);
};

const priorityScore = (s: StrategicScoring) => {
  // Equal weighting keeps the eight R&D and Sourcing drivers balanced.
  const weights: Record<StarKey, number> = {
    regulatory: 0.125,
    supplySecurity: 0.125,
    internalMandate: 0.125,
    performanceUpside: 0.125,
    marketPull: 0.125,
    marketingClaim: 0.125,
    sustainabilityImprovement: 0.125,
    costOpportunity: 0.125,
  };
  let acc = 0;
  (Object.keys(weights) as StarKey[]).forEach((k) => { acc += ((s.stars[k] ?? 0) / 5) * weights[k]; });
  return Math.round(acc * 100);
};

const priorityTier = (score: number) => (score >= 80 ? 'Now' : score >= 60 ? 'Next' : score >= 40 ? 'Later' : 'Backlog');

// ────────────────────────────────────────────────────────────
// UI atoms
// ────────────────────────────────────────────────────────────
const DRIVER_SUMMARY_LABELS: [StarKey, string][] = [
  ['regulatory', 'Regulatory pressure'],
  ['supplySecurity', 'Supply security'],
  ['internalMandate', 'Internal mandate'],
  ['performanceUpside', 'Performance upside'],
  ['marketPull', 'Market pull'],
  ['marketingClaim', 'Marketing claim'],
  ['sustainabilityImprovement', 'Sustainability improvement'],
  ['costOpportunity', 'Cost / economic opportunity'],
];

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
    <span className="text-xs font-medium text-right">{value}</span>
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`text-[10px] font-bold text-muted-foreground uppercase tracking-widest ${className}`}>{children}</div>
);

const Avatar: React.FC<{ name: string; ring?: boolean; className?: string }> = ({ name, ring, className = '' }) => {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`w-8 h-8 rounded-full bg-secondary text-secondary-foreground text-[11px] font-semibold flex items-center justify-center ${ring ? 'ring-2 ring-border' : ''} ${className}`}>
      {initials}
    </div>
  );
};

const Ring: React.FC<{ percent: number; size?: number; stroke?: number; color: string; children: React.ReactNode }> = ({ percent, size = 88, stroke = 8, color, children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-muted" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke={color} fill="none" strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums">{children}</div>
    </div>
  );
};

const StarRow: React.FC<{ value: number; onChange: (v: number) => void; labels?: string[] }> = ({ value, onChange, labels }) => {
  const [hover, setHover] = React.useState(0);
  const active = hover || value;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange(n)}>
            <Star className={`w-5 h-5 ${n <= active ? 'fill-foreground text-foreground' : 'text-muted-foreground/30'}`} />
          </button>
        ))}
      </div>
      {labels && value > 0 && <span className="text-xs text-muted-foreground">{labels[value - 1]}</span>}
    </div>
  );
};

const SegmentedToggle = <T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) => (
  <div className="inline-flex bg-muted rounded-md p-0.5">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${value === o.value ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

// Custom dialog content for step modals: no default top-right X, we provide our own.
const StepDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
StepDialogContent.displayName = 'StepDialogContent';

// ────────────────────────────────────────────────────────────
// Team dialog
// ────────────────────────────────────────────────────────────
const TeamDialog: React.FC<{ open: boolean; onClose: () => void; topic: string; team: TeamMember[]; onChange: (t: TeamMember[]) => void }> = ({ open, onClose, topic, team, onChange }) => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<Role>('Contributor');

  const add = () => {
    if (!name.trim() || !email.trim()) return;
    onChange([...team, { id: crypto.randomUUID(), name: name.trim(), email: email.trim(), role }]);
    setName(''); setEmail(''); setRole('Contributor');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Team for {topic}</h2>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Manage who has access to this material brief. Owners can edit everything; contributors can collaborate on sections.
        </p>
        <div className="space-y-2 mb-5">
          {team.map((m) => (
            <div key={m.id} className="flex items-center gap-3 border border-border/60 rounded-lg p-3">
              <Avatar name={m.name} ring={m.role === 'Owner'} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{m.name}</div>
                <div className="text-xs text-muted-foreground truncate">{m.email}</div>
              </div>
              <Select value={m.role} onValueChange={(v: Role) => onChange(team.map((x) => x.id === m.id ? { ...x, role: v } : x))}>
                <SelectTrigger className={`h-9 w-36 text-sm ${m.role === 'Owner' ? 'border-foreground/40 ring-1 ring-border' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Contributor">Contributor</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={() => onChange(team.filter((x) => x.id !== m.id))} className="p-2 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="border border-border/60 rounded-lg p-4 bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-4 h-4 text-muted-foreground" />
            <SectionLabel>Add Team Member</SectionLabel>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="email@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Select value={role} onValueChange={(v: Role) => setRole(v)}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Contributor">Contributor</SelectItem>
                <SelectItem value="Owner">Owner</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={add} className="bg-foreground text-background hover:bg-foreground/90 gap-1.5"><Plus className="w-4 h-4" /> Add</Button>
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <Button variant="outline" onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ────────────────────────────────────────────────────────────
// Step modal shell
// ────────────────────────────────────────────────────────────
const StepModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  headerAccent: string; // top bar color
  progressPercent: number;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ open, onClose, onSave, stepNumber, title, subtitle, icon, headerAccent, progressPercent, headerActions, children }) => (
  <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
    <StepDialogContent className="max-w-5xl p-0 overflow-hidden max-h-[90vh] flex flex-col gap-0">
      <div className={`h-1 ${headerAccent}`} />
      <div className="p-6 flex items-start justify-between border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">{icon}</div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Step {stepNumber} · <span className="text-foreground normal-case tracking-normal text-base font-semibold">{title}</span></div>
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {headerActions}
          <div className="text-sm text-muted-foreground tabular-nums">{progressPercent}%</div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">{children}</div>
      <div className="p-4 border-t border-border/60 flex justify-end gap-2 bg-muted/20">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} className="bg-foreground text-background hover:bg-foreground/90 gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> Save
        </Button>
      </div>
    </StepDialogContent>
  </Dialog>
);

// ────────────────────────────────────────────────────────────
// Step 1: Material Details
// ────────────────────────────────────────────────────────────
const APPLICATION_AREA_OPTIONS = ['Detergents', 'Food & Beverage', 'Packaging', 'Pharmaceuticals', 'Cosmetics', 'Industrial', 'Agriculture', 'Automotive', 'Textiles', 'Coatings'];

const Step1Body: React.FC<{ details: MaterialDetails; setDetails: (d: MaterialDetails) => void; team: TeamMember[]; onManageTeam: () => void }> = ({ details, setDetails, team, onManageTeam }) => {
  const [customArea, setCustomArea] = React.useState('');
  const addArea = (area: string) => {
    const value = area.trim();
    if (!value || details.applicationAreas.some((a) => a.toLowerCase() === value.toLowerCase())) return;
    setDetails({ ...details, applicationAreas: [...details.applicationAreas, value] });
  };
  const removeArea = (area: string) =>
    setDetails({ ...details, applicationAreas: details.applicationAreas.filter((a) => a !== area) });
  const available = APPLICATION_AREA_OPTIONS.filter((o) => !details.applicationAreas.includes(o));

  return (
  <div className="space-y-4">
    <div className="border border-border rounded-lg p-5 space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-semibold">Material name / identifier <span className="text-destructive">*</span></label>
          <Input className="mt-2" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-semibold">Material intent <span className="text-destructive">*</span></label>
          <div className="mt-2">
            <SegmentedToggle
              value={details.intent}
              onChange={(v) => setDetails({ ...details, intent: v })}
              options={[{ value: 'replace', label: 'Substitute Source' }, { value: 'introduce', label: 'Introduce new material' }]}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold">Category <span className="text-destructive">*</span></label>
          <Select value={details.category} onValueChange={(v) => setDetails({ ...details, category: v })}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Additives', 'Polymers', 'Solvents', 'Acids', 'Enzymes', 'Other'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-semibold">Application areas <span className="text-destructive">*</span></label>
          <div className="mt-2 flex gap-2">
            <Select value="" onValueChange={addArea}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={available.length ? 'Select an application area' : 'All listed areas added'} />
              </SelectTrigger>
              <SelectContent>
                {available.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Add custom application area"
              value={customArea}
              onChange={(e) => setCustomArea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addArea(customArea); setCustomArea(''); }
              }}
            />
            <Button
              variant="outline"
              className="gap-1 shrink-0"
              onClick={() => { addArea(customArea); setCustomArea(''); }}
              disabled={!customArea.trim()}
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {details.applicationAreas.length === 0 && (
              <p className="text-xs text-muted-foreground">No application areas selected yet.</p>
            )}
            {details.applicationAreas.map((area) => (
              <Badge key={area} variant="secondary" className="gap-1 pr-1">
                {area}
                <button
                  type="button"
                  aria-label={`Remove ${area}`}
                  className="rounded-sm p-0.5 hover:bg-background/60 hover:text-destructive"
                  onClick={() => removeArea(area)}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
    <div className="border border-border/60 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-foreground" />
        <SectionLabel>Transition Ownership</SectionLabel>
      </div>
      <p className="text-sm text-muted-foreground mb-4">The person accountable for driving this material transition.</p>
      <div className="grid grid-cols-2 gap-3 items-end">
        <div>
          <label className="text-sm font-semibold">Transition owner <span className="text-destructive">*</span></label>
          <Select value={details.transitionOwnerId} onValueChange={(v) => setDetails({ ...details, transitionOwnerId: v })}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {team.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={onManageTeam} className="gap-1.5 w-fit"><Users className="w-4 h-4" /> Manage team</Button>
      </div>
    </div>
  </div>
  );
};

// ────────────────────────────────────────────────────────────
// Step 2: Strategic Scoring
// ────────────────────────────────────────────────────────────
const STAR_LABELS: Record<StarKey, string[]> = {
  regulatory: ['None', 'Low', 'Moderate', 'High', 'Imminent'],
  supplySecurity: ['No concern', 'Minor concern', 'Moderate', 'High risk', 'Critical'],
  internalMandate: ['None', 'Internal target', 'Board target', 'Announced', 'Public commitment'],
  performanceUpside: ['None', 'Limited', 'Moderate', 'Strong', 'Transformational'],
  marketPull: ['Nice to have', 'Requested', 'Important', 'Strong pull', 'Critical requirement'],
  marketingClaim: ['None', 'Limited', 'Credible', 'Strong', 'Differentiating'],
  sustainabilityImprovement: ['None', 'Limited', 'Meaningful', 'Significant', 'Step-change'],
  costOpportunity: ['None', 'Low', 'Moderate', 'High', 'Breakthrough'],
};

/** Dataset each figure was populated from — read-only provenance footnote. */
const SOURCE_DATASETS: Record<'volume' | 'ghg' | 'spend' | 'suppliers', { file: string; date: string }> = {
  volume: { file: 'Group volume plan 2026.xlsx', date: '12 Mar 2026' },
  ghg: { file: 'Scope 3 factor library v4.csv', date: '04 Feb 2026' },
  spend: { file: '2025 spend cube export.xlsx', date: '28 Jan 2026' },
  suppliers: { file: 'Supplier master extract.csv', date: '19 Feb 2026' },
};

const SourceNote: React.FC<{ field: keyof typeof SOURCE_DATASETS }> = ({ field }) => {
  const src = SOURCE_DATASETS[field];
  return (
    <p className="mt-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
      Source: <span className="font-medium text-foreground/80">{src.file}</span> · added {src.date}
    </p>
  );
};

const Step2Body: React.FC<{ scoring: StrategicScoring; setScoring: (s: StrategicScoring) => void; missing: string[]; materialName: string }> = ({ scoring, setScoring, missing, materialName }) => {
  const total = typeof scoring.volume === 'number' && typeof scoring.ghg === 'number'
    ? (scoring.ghgMode === 'fxv' ? scoring.volume * scoring.ghg : scoring.ghg)
    : 0;
  const spendTotal = typeof scoring.spend === 'number'
    ? (scoring.spendMode === 'fxv' ? (typeof scoring.volume === 'number' ? scoring.volume * scoring.spend : 0) : scoring.spend)
    : 0;
  return (
    <div className="space-y-6">
      {/* A · Impact */}

      <section>
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-foreground" />
          <SectionLabel>A · Impact (Quantitative)</SectionLabel>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Quantitative inputs — big numbers are normalised to a 1–5 equivalent so they don't dominate the ratings.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border/60 rounded-lg p-4">
            <label className="text-sm font-semibold">Volume (target) <span className="text-destructive">*</span></label>
            <div className="flex gap-2 mt-2">
              <Input type="number" value={scoring.volume} onChange={(e) => setScoring({ ...scoring, volume: e.target.value === '' ? '' : Number(e.target.value) })} />
              <Select value={scoring.volumeUnit} onValueChange={(v) => setScoring({ ...scoring, volumeUnit: v })}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>{['t/yr', 'kt/yr', 'kg/yr'].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Shared multiplier for Spend and GHG.</p>
            <SourceField value={scoring.volumeSource} onChange={(v) => setScoring({ ...scoring, volumeSource: v })} />
          </div>
          <div className="border border-border/60 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <label className="text-sm font-semibold">GHG (tCO₂e/yr) <span className="text-destructive">*</span></label>
              <SegmentedToggle
                value={scoring.ghgMode}
                onChange={(v) => setScoring({ ...scoring, ghgMode: v })}
                options={[{ value: 'fxv', label: 'Per ton' }, { value: 'total', label: 'Total' }]}
              />
            </div>
            <Input type="number" className="mt-2" value={scoring.ghg} onChange={(e) => setScoring({ ...scoring, ghg: e.target.value === '' ? '' : Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground mt-2">Total: <span className="font-semibold text-foreground tabular-nums">{total.toLocaleString()}</span> tCO₂e/yr</p>
            <SourceField value={scoring.ghgSource} onChange={(v) => setScoring({ ...scoring, ghgSource: v })} />
          </div>
          <div className="border border-border/60 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <label className="text-sm font-semibold">Spend</label>
              <SegmentedToggle
                value={scoring.spendMode}
                onChange={(v) => setScoring({ ...scoring, spendMode: v })}
                options={[{ value: 'fxv', label: 'Per ton' }, { value: 'total', label: 'Total' }]}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <Input type="number" value={scoring.spend} onChange={(e) => setScoring({ ...scoring, spend: e.target.value === '' ? '' : Number(e.target.value) })} />
              <Select value={scoring.spendCurrency} onValueChange={(v) => setScoring({ ...scoring, spendCurrency: v })}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>{['EUR', 'USD', 'GBP', 'CHF'].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Total: <span className="font-semibold text-foreground tabular-nums">{spendTotal.toLocaleString()}</span> {scoring.spendCurrency}/yr</p>
            <SourceField value={scoring.spendSource} onChange={(v) => setScoring({ ...scoring, spendSource: v })} />
          </div>
          <div className="border border-border/60 rounded-lg p-4">
            <div className="flex items-start justify-between gap-2">
              <label className="text-sm font-semibold">Suppliers</label>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => setScoring({
                  ...scoring,
                  supplierCountries: [...scoring.supplierCountries, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, country: '', share: '' }],
                })}
              >
                <Plus className="w-3 h-3" /> Add country
              </Button>
            </div>
            <Input
              type="number"
              min={0}
              className="mt-2"
              placeholder="Number of suppliers"
              value={scoring.supplierCount}
              onChange={(e) => setScoring({ ...scoring, supplierCount: e.target.value === '' ? '' : Number(e.target.value) })}
            />
            <div className="mt-3 space-y-2">
              {scoring.supplierCountries.length === 0 && (
                <p className="text-xs text-muted-foreground">No producing countries added yet.</p>
              )}
              {scoring.supplierCountries.map((entry, idx) => (
                <div key={entry.id} className="grid grid-cols-[1fr_92px_32px] gap-2 items-center">
                  <Input
                    placeholder="Country"
                    value={entry.country}
                    onChange={(e) => {
                      const next = [...scoring.supplierCountries];
                      next[idx] = { ...entry, country: e.target.value };
                      setScoring({ ...scoring, supplierCountries: next });
                    }}
                  />
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="%"
                      className="pr-6"
                      value={entry.share}
                      onChange={(e) => {
                        const next = [...scoring.supplierCountries];
                        next[idx] = { ...entry, share: e.target.value === '' ? '' : Number(e.target.value) };
                        setScoring({ ...scoring, supplierCountries: next });
                      }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${entry.country || 'country'}`}
                    onClick={() => setScoring({ ...scoring, supplierCountries: scoring.supplierCountries.filter((c) => c.id !== entry.id) })}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Number of suppliers and % of volume per producing country.
              {scoring.supplierCountries.length > 0 && (
                <> Total allocated: <span className="font-semibold text-foreground tabular-nums">
                  {scoring.supplierCountries.reduce((a, c) => a + (typeof c.share === 'number' ? c.share : 0), 0)}%
                </span></>
              )}
            </p>
            <SourceField value={scoring.suppliersSource} onChange={(v) => setScoring({ ...scoring, suppliersSource: v })} />
          </div>
        </div>
      </section>


      {/* B · Drivers */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-4 h-4 text-foreground" />
          <SectionLabel>B · Drivers</SectionLabel>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Rate each driver from 1 (low) to 5 (high).</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border/60 rounded-lg p-4">
            <label className="text-sm font-semibold">Regulatory pressure <span className="text-destructive">*</span></label>
            <div className="mt-3"><StarRow value={scoring.stars.regulatory} onChange={(v) => setScoring({ ...scoring, stars: { ...scoring.stars, regulatory: v } })} labels={STAR_LABELS.regulatory} /></div>
          </div>
          <div className="border border-border/60 rounded-lg p-4">
            <label className="text-sm font-semibold">Supply security <span className="text-destructive">*</span></label>
            <div className="mt-3"><StarRow value={scoring.stars.supplySecurity} onChange={(v) => setScoring({ ...scoring, stars: { ...scoring.stars, supplySecurity: v } })} labels={STAR_LABELS.supplySecurity} /></div>
          </div>
          <div className="border border-border/60 rounded-lg p-4">
            <label className="text-sm font-semibold">Internal mandate <span className="text-destructive">*</span></label>
            <div className="mt-3"><StarRow value={scoring.stars.internalMandate} onChange={(v) => setScoring({ ...scoring, stars: { ...scoring.stars, internalMandate: v } })} labels={STAR_LABELS.internalMandate} /></div>
          </div>
          <div className="border border-border/60 rounded-lg p-4">
            <label className="text-sm font-semibold">Performance upside <span className="text-destructive">*</span></label>
            <div className="mt-3"><StarRow value={scoring.stars.performanceUpside} onChange={(v) => setScoring({ ...scoring, stars: { ...scoring.stars, performanceUpside: v } })} labels={STAR_LABELS.performanceUpside} /></div>
          </div>
          <div className="border border-border/60 rounded-lg p-4">
            <label className="text-sm font-semibold">Market pull <span className="text-destructive">*</span></label>
            <div className="mt-3"><StarRow value={scoring.stars.marketPull} onChange={(v) => setScoring({ ...scoring, stars: { ...scoring.stars, marketPull: v } })} labels={STAR_LABELS.marketPull} /></div>
          </div>
          <div className="border border-border/60 rounded-lg p-4">
            <label className="text-sm font-semibold">Marketing claim <span className="text-destructive">*</span></label>
            <div className="mt-3"><StarRow value={scoring.stars.marketingClaim} onChange={(v) => setScoring({ ...scoring, stars: { ...scoring.stars, marketingClaim: v } })} labels={STAR_LABELS.marketingClaim} /></div>
          </div>
          <div className="border border-border/60 rounded-lg p-4">
            <label className="text-sm font-semibold">Sustainability improvement <span className="text-destructive">*</span></label>
            <div className="mt-3"><StarRow value={scoring.stars.sustainabilityImprovement} onChange={(v) => setScoring({ ...scoring, stars: { ...scoring.stars, sustainabilityImprovement: v } })} labels={STAR_LABELS.sustainabilityImprovement} /></div>
          </div>
          <div className="border border-border/60 rounded-lg p-4">
            <label className="text-sm font-semibold">Cost / Economic opportunity <span className="text-destructive">*</span></label>
            <div className="mt-3"><StarRow value={scoring.stars.costOpportunity} onChange={(v) => setScoring({ ...scoring, stars: { ...scoring.stars, costOpportunity: v } })} labels={STAR_LABELS.costOpportunity} /></div>
          </div>
        </div>
        <div className="border border-border/60 rounded-lg p-4 mt-4">
          <label className="text-sm font-semibold">Priority context note</label>
          <Textarea className="mt-2" placeholder="e.g. customer deadline, sustainability target, launch dependency" value={scoring.priorityNote} onChange={(e) => setScoring({ ...scoring, priorityNote: e.target.value })} />
        </div>
      </section>

      {/* C · Product & Deadlines */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-4 h-4 text-foreground" />
          <SectionLabel>C · Product & Deadlines</SectionLabel>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox checked={scoring.productGated} onCheckedChange={(v) => setScoring({ ...scoring, productGated: !!v })} />
          <span className="text-sm">Launch, redesign, or customer program gated on this material</span>
        </label>
      </section>

      {missing.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex items-center gap-2 text-foreground font-semibold mb-1">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" /> Missing prioritisation inputs
          </div>
          <ul className="text-sm text-muted-foreground list-disc ml-6">
            {missing.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Step 3: Material Requirements
// ────────────────────────────────────────────────────────────
const REQUIREMENT_META: Record<RequirementKey, { title: string; desc: string; contributors: string }> = {
  targetSpec: { title: 'Target material specification', desc: 'target technical spec, desired properties, performance targets, candidate datasheets', contributors: 'R&D, Procurement' },
  product: { title: 'Product requirements', desc: 'product brief, formulation requirements, quality spec, application requirements', contributors: 'R&D, Product, Quality' },
  sustainability: { title: 'Sustainability targets', desc: 'renewable carbon target, PCF target, Scope 3 reduction goal, circularity ambition', contributors: 'Sustainability' },
  customer: { title: 'Customer requirements', desc: 'customer spec, tender requirement, key account brief, customer sustainability requirement', contributors: 'Sales, Product' },
  regulatory: { title: 'Regulatory & compliance requirements', desc: 'REACH, FDA / food-contact, CLP, regional restrictions, certification requirements', contributors: 'Regulatory, Quality' },
  strategy: { title: 'Strategy', desc: 'innovation roadmap, sustainability roadmap, business case, investment rationale', contributors: 'Strategy, Business Unit' },
};

const Step3Body: React.FC<{ requirements: Requirements; setRequirements: (r: Requirements) => void }> = ({ requirements, setRequirements }) => {
  const update = (k: RequirementKey, patch: Partial<Requirements[RequirementKey]>) =>
    setRequirements({ ...requirements, [k]: { ...requirements[k], ...patch } });

  const statusStyle = (s: string) => s === 'uploaded' ? 'bg-secondary text-secondary-foreground' : s === 'requested' ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground';

  const evidenceCount = Object.values(requirements).filter((r) => r.status === 'uploaded').length;

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-1">
          <Upload className="w-4 h-4 text-foreground" />
          <SectionLabel>Material Requirements</SectionLabel>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Upload or link the documents that define what this material must achieve, what it should be benchmarked against, and what constraints must be considered.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(REQUIREMENT_META) as RequirementKey[]).map((k) => {
            const meta = REQUIREMENT_META[k];
            const req = requirements[k];
            return (
              <div key={k} className="border border-border/60 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold">{meta.title}</h4>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle(req.status)}`}>{req.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{meta.desc}</p>
                <p className="text-xs text-muted-foreground mb-3">Contributors: {meta.contributors}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => update(k, { status: 'uploaded' })}>
                    <Upload className="w-3.5 h-3.5" /> Upload / link
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => update(k, { status: 'requested' })}>
                    <UserPlus className="w-3.5 h-3.5" /> Request
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
          <h4 className="text-sm font-semibold">Evidence readiness</h4>
          <span className="text-xs text-muted-foreground">{evidenceCount === 0 ? 'No evidence uploaded' : `${evidenceCount} document${evidenceCount === 1 ? '' : 's'} uploaded`}</span>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Guided step card
// ────────────────────────────────────────────────────────────
const StepCard: React.FC<{ n: number; icon: React.ReactNode; iconBg: string; title: string; subtitle: string; status: 'not_started' | 'in_progress' | 'completed'; onClick: () => void }> = ({ n, icon, iconBg, title, subtitle, status, onClick }) => {
  const badge = status === 'completed'
    ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-secondary text-secondary-foreground"><CheckCircle2 className="w-3 h-3" /> Completed</span>
    : status === 'in_progress'
    ? <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-muted text-muted-foreground">In progress</span>
    : <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Not started</span>;
  return (
    <button onClick={onClick} className="text-left border border-border/60 rounded-xl p-4 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
        <SectionLabel>Step {n}</SectionLabel>
      </div>
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div>{badge}</div>
    </button>
  );
};

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────
const MaterialBriefSimple: React.FC = () => {
  const { category, topic } = useParams<{ category: string; topic: string }>();
  const navigate = useNavigate();
  const decodedTopic = decodeURIComponent(topic || '');
  const cat = category || 'Product';

  const [state, setState] = React.useState<BriefState>(() => loadState(cat, decodedTopic));
  const [openStep, setOpenStep] = React.useState<0 | 1 | 2 | 3>(0);
  const [teamOpen, setTeamOpen] = React.useState(false);
  const periodRef = React.useRef('');

  // Apply the change immediately and write it to the event log (no reason prompt)
  const requestChange = (field: string, from: string, to: string, apply?: (s: BriefState) => BriefState) => {
    if (from === to) return;
    const event: HistoryEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      field,
      from,
      to,
      reason: '',
      at: new Date().toISOString(),
      by: CURRENT_USER,
    };
    setState((prev) => {
      const next = apply ? apply(prev) : prev;
      return { ...next, history: [event, ...(next.history ?? [])] };
    });
  };

  // Draft copies edited inside step modals
  const [draftDetails, setDraftDetails] = React.useState(state.details);
  const [draftScoring, setDraftScoring] = React.useState(state.scoring);
  const [draftRequirements, setDraftRequirements] = React.useState(state.requirements);

  React.useEffect(() => {
    if (openStep === 1) setDraftDetails(state.details);
    if (openStep === 2) setDraftScoring(state.scoring);
    if (openStep === 3) setDraftRequirements(state.requirements);
  }, [openStep, state]);

  // Persist + emit progress event
  React.useEffect(() => {
    localStorage.setItem(storageKey(cat, decodedTopic), JSON.stringify(state));
    const briefProgress = Math.round((
      (detailsComplete(state.details) ? 1 : 0) +
      (scoringComplete(state.scoring) ? 1 : 0) +
      (requirementsComplete(state.requirements) ? 1 : 0)
    ) / 3 * 100);
    localStorage.setItem(progressKey(cat, decodedTopic), JSON.stringify({ completion: briefProgress }));
    window.dispatchEvent(new Event('materialBriefUpdated'));
  }, [state, cat, decodedTopic]);

  const owner = state.team.find((m) => m.role === 'Owner');
  const contributors = state.team.filter((m) => m.role !== 'Owner');
  const stepStatus = (n: 1 | 2 | 3): 'not_started' | 'in_progress' | 'completed' => {
    if (n === 1) {
      if (detailsComplete(state.details)) return 'completed';
      return detailsPercent(state.details) > 0 ? 'in_progress' : 'not_started';
    }
    if (n === 2) {
      if (scoringComplete(state.scoring)) return 'completed';
      return scoringPercent(state.scoring) > 0 ? 'in_progress' : 'not_started';
    }
    if (requirementsComplete(state.requirements)) return 'completed';
    return requirementsPercent(state.requirements) > 0 ? 'in_progress' : 'not_started';
  };

  const completedSteps = ([1, 2, 3] as const).filter((n) => stepStatus(n) === 'completed').length;
  const overallPercent = Math.round((completedSteps / 3) * 100);
  const pScore = priorityScore(state.scoring);
  const tier = priorityTier(pScore);

  const missingScoring: string[] = [];
  if (state.scoring.volume === '') missingScoring.push('Volume (target)');
  if (state.scoring.ghg === '') missingScoring.push('GHG');

  const driverChips = React.useMemo(() => {
    const chips: string[] = [];
    const driverLabels: [StarKey, string][] = [
      ['regulatory', 'REG'],
      ['supplySecurity', 'SECURITY'],
      ['internalMandate', 'MANDATE'],
      ['performanceUpside', 'UPSIDE'],
      ['marketPull', 'PULL'],
      ['marketingClaim', 'CLAIM'],
      ['sustainabilityImprovement', 'SUSTAIN'],
      ['costOpportunity', 'COST'],
    ];
    driverLabels.forEach(([key, label]) => {
      if (state.scoring.stars[key] >= 4) chips.push(label);
    });
    return chips.length > 0 ? chips : ['—'];
  }, [state.scoring]);

  return (
    <div className="h-full overflow-y-auto bg-muted/30">
      {/* Back */}
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-4">
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs bg-card" onClick={() => navigate(`/landscape/${cat}/${topic}/value-chain`)}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Button>
      </div>

      {/* Header */}
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 pb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="w-4 h-4 text-muted-foreground" />
              <SectionLabel>Material Brief</SectionLabel>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold tracking-tight">{decodedTopic}</h1>
              <Badge variant="outline" className="text-xs font-medium">Draft</Badge>
            </div>
          </div>


          <div className="flex items-start gap-8">
            <div className="text-center">
              <SectionLabel className="mb-2">Owner</SectionLabel>
              {owner && <Avatar name={owner.name} ring className="mx-auto" />}
            </div>
            <div className="text-center">
              <SectionLabel className="mb-2">Contributors</SectionLabel>
              <div className="flex -space-x-2 justify-center">
                {contributors.slice(0, 3).map((m) => <Avatar key={m.id} name={m.name} className="ring-2 ring-background" />)}
              </div>
            </div>
            <div className="text-center">
              <SectionLabel className="mb-2">Team</SectionLabel>
              <Button variant="outline" onClick={() => setTeamOpen(true)} className="gap-1.5 h-8 text-xs">
                <Users className="w-3.5 h-3.5" /> Manage ({state.team.length})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="max-w-[1400px] w-full mx-auto px-6 pb-10 grid gap-5" style={{ gridTemplateColumns: 'minmax(0,1fr) 320px' }}>
        {/* Guided Process */}
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-start justify-between mb-5 gap-4">
            <div>
              <SectionLabel className="mb-1">Guided Process</SectionLabel>
              <p className="text-sm text-muted-foreground">Work through each step — open a card to fill in its details.</p>
            </div>
            <div className="flex items-center gap-2 min-w-[180px]">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${overallPercent || 4}%` }} />
              </div>

              <span className="text-sm font-semibold tabular-nums">{completedSteps}/3</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <StepCard n={1} title="Material Details" subtitle="Identify the material & intent" icon={<Target className="w-5 h-5 text-foreground" />} iconBg="bg-muted" status={stepStatus(1)} onClick={() => setOpenStep(1)} />
            <StepCard n={2} title="Strategic Scoring" subtitle="Rate priority drivers 1–5" icon={<Star className="w-5 h-5 text-foreground" />} iconBg="bg-muted" status={stepStatus(2)} onClick={() => setOpenStep(2)} />
            <StepCard n={3} title="Material Requirements" subtitle="Upload supporting docs" icon={<Upload className="w-5 h-5 text-foreground" />} iconBg="bg-muted" status={stepStatus(3)} onClick={() => setOpenStep(3)} />
          </div>

          {/* Status & prioritisation */}
          <div className="mt-6 pt-5 border-t border-border/60 grid gap-4 md:grid-cols-3">
            <div>
              <SectionLabel className="mb-2">Work Status</SectionLabel>
              <Select
                value={state.workStatus}
                onValueChange={(v: WorkStatus) =>
                  requestChange('Status', WORK_STATUS_META[state.workStatus].label, WORK_STATUS_META[v].label, (s) => ({
                    ...s,
                    workStatus: v,
                    blocker:
                      v === 'parked' || v === 'rejected'
                        ? { ...s.blocker, date: s.blocker.date || new Date().toISOString().slice(0, 10) }
                        : s.blocker,
                  }))
                }
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(WORK_STATUS_META) as WorkStatus[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${WORK_STATUS_META[k].dot}`} />
                        {WORK_STATUS_META[k].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <SectionLabel className="mb-2">Selected as Priority</SectionLabel>
              <Select
                value={state.prioritySelected || undefined}
                onValueChange={(v: 'yes' | 'no') =>
                  requestChange('Priority', state.prioritySelected ? (state.prioritySelected === 'yes' ? 'Yes' : 'No') : '—', v === 'yes' ? 'Yes' : 'No', (s) => ({
                    ...s,
                    prioritySelected: v,
                    priorityPeriod: v === 'no' ? '' : s.priorityPeriod,
                  }))
                }
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="Yes / No" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <SectionLabel className="mb-2">Priority Period</SectionLabel>
              <Input
                value={state.priorityPeriod}
                onFocus={() => { periodRef.current = state.priorityPeriod; }}
                onChange={(e) => setState({ ...state, priorityPeriod: e.target.value })}
                onBlur={(e) => requestChange('Priority period', periodRef.current || '—', e.target.value || '—')}
                placeholder="e.g. H2 2026"
                disabled={state.prioritySelected !== 'yes'}
                className="h-9 text-xs bg-background"
              />
            </div>
          </div>

          {(state.workStatus === 'parked' || state.workStatus === 'rejected') && (
            <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                <SectionLabel>{state.workStatus === 'parked' ? 'Why parked' : 'Why rejected'}</SectionLabel>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Blocker category <span className="text-destructive">*</span></label>
                  <Select
                    value={state.blocker.category || undefined}
                    onValueChange={(v: BlockerCategory) => setState({ ...state, blocker: { ...state.blocker, category: v } })}
                  >
                    <SelectTrigger className={cn('h-9 bg-background', !state.blocker.category && 'border-destructive')}>
                      <SelectValue placeholder="Select a blocker category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOCKER_CATEGORIES.map((b) => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!state.blocker.category && (
                    <p className="text-[11px] text-destructive mt-1">Required when a material is parked or rejected.</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">Date</label>
                  <Input
                    type="date"
                    value={state.blocker.date}
                    onChange={(e) => setState({ ...state, blocker: { ...state.blocker, date: e.target.value } })}
                    className="h-9 text-xs bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Blocker detail</label>
                <Textarea
                  value={state.blocker.detail}
                  onChange={(e) => setState({ ...state, blocker: { ...state.blocker, detail: e.target.value } })}
                  placeholder="What exactly is blocking this material?"
                  className="text-xs min-h-[60px] bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Re-open condition</label>
                <Textarea
                  value={state.blocker.condition}
                  onChange={(e) => setState({ ...state, blocker: { ...state.blocker, condition: e.target.value } })}
                  placeholder="What would have to change for this to move forward?"
                  className="text-xs min-h-[60px] bg-background"
                />
              </div>
            </div>
          )}

          {/* History / event log */}
          <div className="mt-6 pt-5 border-t border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <HistoryIcon className="w-3.5 h-3.5 text-muted-foreground" />
              <SectionLabel>History</SectionLabel>
              <span className="text-[11px] text-muted-foreground">{(state.history ?? []).length} change{(state.history ?? []).length === 1 ? '' : 's'}</span>
            </div>
            {(state.history ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No changes yet — status, owner and priority updates will appear here.</p>
            ) : (
              <ol className="relative pl-5 max-h-64 overflow-y-auto pr-1">
                <span className="absolute left-[5px] top-1 bottom-1 w-px bg-border" aria-hidden />
                {(state.history ?? []).map((h) => (
                  <li key={h.id} className="relative pb-4 last:pb-0">
                    <span className="absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full bg-foreground ring-4 ring-card" />
                    <div className="text-xs">
                      <span className="font-semibold">{h.field}</span>
                      <span className="text-muted-foreground"> changed from </span>
                      <span className="font-medium">{h.from}</span>
                      <span className="text-muted-foreground"> to </span>
                      <span className="font-medium">{h.to}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(h.at).toLocaleString()} · {h.by}
                    </div>
                    {h.reason && (
                      <div className="text-[11px] mt-1 text-muted-foreground">
                        <span className="font-medium text-foreground">Reason: </span>
                        {h.reason}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>



        {/* Summary sidebar */}
        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-6">
          <SectionLabel>Summary</SectionLabel>

          <div className="space-y-2">
            <SectionLabel className="mb-1">Material Details</SectionLabel>
            <SummaryRow label="Name" value={state.details.name || '—'} />
            <SummaryRow label="Intent" value={state.details.intent === 'replace' ? 'Substitute Source' : 'Introduce new material'} />
            <SummaryRow label="Category" value={state.details.category || '—'} />
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] text-muted-foreground shrink-0">Applications</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {state.details.applicationAreas.length > 0
                  ? state.details.applicationAreas.map((a) => (
                      <span key={a} className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium">{a}</span>
                    ))
                  : <span className="text-xs font-medium">—</span>}
              </div>
            </div>
            <SummaryRow label="Owner" value={state.team.find((m) => m.id === state.details.transitionOwnerId)?.name ?? '—'} />
          </div>

          <div className="space-y-2 pt-4 border-t border-border/60">
            <SectionLabel className="mb-1">Strategic Scoring</SectionLabel>
            <SummaryRow label="Priority score" value={`${pScore} · ${tier}`} />
            <SummaryRow label="Volume" value={state.scoring.volume === '' ? '—' : `${Number(state.scoring.volume).toLocaleString()} ${state.scoring.volumeUnit}`} />
            <SummaryRow
              label="GHG"
              value={state.scoring.ghg === '' ? '—' : `${Number(state.scoring.ghg).toLocaleString()} ${state.scoring.ghgMode === 'total' ? 'total' : 'per ton'}`}
            />
            <SummaryRow
              label="Spend"
              value={state.scoring.spend === '' ? '—' : `${state.scoring.spendCurrency} ${Number(state.scoring.spend).toLocaleString()} ${state.scoring.spendMode === 'total' ? 'total' : 'per ton'}`}
            />
            <SummaryRow label="Suppliers" value={state.scoring.supplierCount === '' ? '—' : String(state.scoring.supplierCount)} />
            {state.scoring.supplierCountries.length > 0 && (
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] text-muted-foreground shrink-0">Countries</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {state.scoring.supplierCountries.map((c) => (
                    <span key={c.id} className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium">
                      {c.country || '—'}{c.share !== '' ? ` ${c.share}%` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border/60">
            <SectionLabel className="mb-2">Drivers</SectionLabel>
            <div className="space-y-1.5">
              {DRIVER_SUMMARY_LABELS.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-3 h-3 ${n <= (state.scoring.stars[key] ?? 0) ? 'fill-foreground text-foreground' : 'text-muted-foreground/30'}`} />
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>




      {/* Team dialog */}
      <TeamDialog open={teamOpen} onClose={() => setTeamOpen(false)} topic={decodedTopic} team={state.team} onChange={(t) => setState({ ...state, team: t })} />

      {/* Step modals */}
      <StepModal
        open={openStep === 1}
        onClose={() => setOpenStep(0)}
        onSave={() => {
          const prevOwner = state.team.find((m) => m.id === state.details.transitionOwnerId)?.name ?? '—';
          const nextOwner = state.team.find((m) => m.id === draftDetails.transitionOwnerId)?.name ?? '—';
          setState({ ...state, details: draftDetails });
          setOpenStep(0);
          if (prevOwner !== nextOwner) requestChange('Owner', prevOwner, nextOwner);
        }}
        stepNumber={1}
        title="Material Details"
        subtitle="Identify the material & intent"
        icon={<Target className="w-5 h-5 text-foreground" />}
        headerAccent="bg-foreground"
        progressPercent={detailsPercent(draftDetails)}
      >
        <Step1Body details={draftDetails} setDetails={setDraftDetails} team={state.team} onManageTeam={() => setTeamOpen(true)} />
      </StepModal>

      <StepModal
        open={openStep === 2}
        onClose={() => setOpenStep(0)}
        onSave={() => { setState({ ...state, scoring: draftScoring }); setOpenStep(0); }}
        stepNumber={2}
        title="Strategic Scoring"
        subtitle="Rate priority drivers 1–5"
        icon={<Star className="w-5 h-5 text-foreground" />}
        headerAccent="bg-foreground"
        progressPercent={scoringPercent(draftScoring)}
      >
        <Step2Body scoring={draftScoring} setScoring={setDraftScoring} missing={missingScoring} materialName={decodedTopic} />
      </StepModal>

      <StepModal
        open={openStep === 3}
        onClose={() => setOpenStep(0)}
        onSave={() => { setState({ ...state, requirements: draftRequirements }); setOpenStep(0); }}
        stepNumber={3}
        title="Material Requirements"
        subtitle="Upload supporting docs"
        icon={<Upload className="w-5 h-5 text-foreground" />}
        headerAccent="bg-foreground"
        progressPercent={requirementsPercent(draftRequirements)}
      >
        <Step3Body requirements={draftRequirements} setRequirements={setDraftRequirements} />
      </StepModal>
    </div>
  );
};

export default MaterialBriefSimple;
