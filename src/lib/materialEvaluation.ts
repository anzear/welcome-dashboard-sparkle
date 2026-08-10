export type ImpactLevel = "Low" | "Medium" | "High" | "Critical" | "";
export type Timeline = "Immediate" | "Under 1 year" | "1–3 years" | "Over 3 years" | "";
export type Severity = "Low" | "Medium" | "High" | "";
export type Effort = "Low" | "Medium" | "High" | "";

export interface FieldMeta {
  by?: string;
  at?: number;
}

export interface NoteAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface EvalNote {
  id: string;
  author: string;
  team?: string;
  body: string;
  at: number;
  attachments?: NoteAttachment[];
}

export interface UrgencyWeights {
  impact: number;
  timeline: number;
  risk: number;
  drivers: number;
}

export const DEFAULT_WEIGHTS: UrgencyWeights = {
  impact: 1, timeline: 1, risk: 1, drivers: 1,
};

export type SectionKey = "impact" | "urgency" | "risk" | "feasibility" | "crossteam" | "order";

export const SECTION_LABELS: Record<SectionKey, string> = {
  impact: "Business Impact",
  urgency: "Urgency & Timeline",
  risk: "Risk of Inaction",
  feasibility: "Feasibility",
  crossteam: "Cross-team Input",
  order: "Order",
};

export const FIELD_TO_SECTION: Record<string, SectionKey> = {
  impact: "impact",
  impactNote: "impact",
  impactTypes: "impact",
  timeline: "urgency",
  drivers: "urgency",
  targetDate: "urgency",
  inactionNote: "risk",
  severity: "risk",
  effort: "feasibility",
  feasibilityNotes: "feasibility",
  notes: "crossteam",
  order: "order",
};

export type SectionSnapshot = Record<string, any>;

export interface HistoryEntry {
  id: string;
  at: number;
  by: string;
  snapshot: SectionSnapshot;
  summary: string;
  kind: "edit" | "restore" | "order";
}

export interface OrderInfo {
  reason: string;
  by: string;
  at: number;
}

export interface MaterialEvaluation {
  discoveryId: string;
  impact: ImpactLevel;
  impactNote: string;
  impactTypes: string[];
  timeline: Timeline;
  drivers: string[];
  targetDate: string;
  inactionNote: string;
  severity: Severity;
  effort: Effort;
  feasibilityNotes: string;
  notes: EvalNote[];
  editors: string[];
  fieldMeta: Record<string, FieldMeta>;
  history: Record<SectionKey, HistoryEntry[]>;
  weights?: UrgencyWeights;
  status?: "Ordered";
  order?: OrderInfo;
  updatedAt: number;
}

export const IMPACT_TYPES_DEFAULT = [
  "Cost savings",
  "New revenue",
  "Volume at stake",
  "Strategic fit",
  "Customer commitment",
  "ESG / sustainability",
];

export const DRIVERS_DEFAULT = [
  "Regulatory deadline",
  "Supply risk",
  "Cost pressure",
  "Competitive pressure",
  "Customer demand",
  "Sustainability mandate",
];

export const CURRENT_USER = "Jon Doe";

const KEY = (id: string) => `material-evaluation-${id}`;

export function emptyHistory(): Record<SectionKey, HistoryEntry[]> {
  return { impact: [], urgency: [], risk: [], feasibility: [], crossteam: [], order: [] };
}

export function emptyEvaluation(discoveryId: string): MaterialEvaluation {
  return {
    discoveryId,
    impact: "",
    impactNote: "",
    impactTypes: [],
    timeline: "",
    drivers: [],
    targetDate: "",
    inactionNote: "",
    severity: "",
    effort: "",
    feasibilityNotes: "",
    notes: [],
    editors: [],
    fieldMeta: {},
    history: emptyHistory(),
    weights: { ...DEFAULT_WEIGHTS },
    updatedAt: 0,
  };
}

export function loadEvaluation(discoveryId: string): MaterialEvaluation {
  try {
    const raw = localStorage.getItem(KEY(discoveryId));
    if (!raw) return emptyEvaluation(discoveryId);
    const parsed = JSON.parse(raw);
    const merged: MaterialEvaluation = { ...emptyEvaluation(discoveryId), ...parsed };
    if (!merged.history || typeof merged.history !== "object") merged.history = emptyHistory();
    for (const k of ["impact","urgency","risk","feasibility","crossteam","order"] as SectionKey[]) {
      if (!Array.isArray(merged.history[k])) merged.history[k] = [];
    }
    return merged;
  } catch {
    return emptyEvaluation(discoveryId);
  }
}

export function saveEvaluation(ev: MaterialEvaluation) {
  ev.updatedAt = Date.now();
  localStorage.setItem(KEY(ev.discoveryId), JSON.stringify(ev));
  window.dispatchEvent(new Event("materialEvaluationUpdated"));
}

const IMPACT_MAP: Record<Exclude<ImpactLevel, "">, number> = {
  Low: 25, Medium: 50, High: 75, Critical: 100,
};
const TIMELINE_MAP: Record<Exclude<Timeline, "">, number> = {
  "Over 3 years": 25, "1–3 years": 50, "Under 1 year": 75, Immediate: 100,
};
const SEVERITY_MAP: Record<Exclude<Severity, "">, number> = {
  Low: 33, Medium: 66, High: 100,
};

export interface UrgencyResult {
  score: number | null;
  label: "Low" | "Medium" | "High" | "Critical" | "Not enough input yet";
  color: "muted" | "emerald" | "amber" | "orange" | "rose";
  parts: { impact?: number; timeline?: number; risk?: number; driversBonus: number };
}

export function computeUrgency(ev: MaterialEvaluation): UrgencyResult {
  const w = { ...DEFAULT_WEIGHTS, ...(ev.weights || {}) };
  const parts: UrgencyResult["parts"] = { driversBonus: 0 };
  type C = { value: number; weight: number };
  const components: C[] = [];
  if (ev.impact) { parts.impact = IMPACT_MAP[ev.impact]; components.push({ value: parts.impact, weight: w.impact }); }
  if (ev.timeline) { parts.timeline = TIMELINE_MAP[ev.timeline]; components.push({ value: parts.timeline, weight: w.timeline }); }
  if (ev.severity) { parts.risk = SEVERITY_MAP[ev.severity]; components.push({ value: parts.risk, weight: w.risk }); }
  parts.driversBonus = Math.min(Math.round(20 * w.drivers), Math.round(ev.drivers.length * 5 * w.drivers));

  const weightSum = components.reduce((s, c) => s + c.weight, 0);
  if (components.length === 0 && parts.driversBonus === 0) {
    return { score: null, label: "Not enough input yet", color: "muted", parts };
  }
  const avg = weightSum > 0 ? components.reduce((s, c) => s + c.value * c.weight, 0) / weightSum : 0;
  const raw = Math.round(avg + parts.driversBonus);
  const score = Math.max(0, Math.min(100, raw));
  let label: UrgencyResult["label"] = "Low";
  let color: UrgencyResult["color"] = "emerald";
  if (score >= 80) { label = "Critical"; color = "rose"; }
  else if (score >= 60) { label = "High"; color = "orange"; }
  else if (score >= 40) { label = "Medium"; color = "amber"; }
  else { label = "Low"; color = "emerald"; }
  return { score, label, color, parts };
}

export function urgencyColorClasses(color: UrgencyResult["color"]) {
  switch (color) {
    case "rose":    return { bg: "bg-rose-500",    text: "text-rose-600",    soft: "bg-rose-500/10",    ring: "ring-rose-500/20" };
    case "orange":  return { bg: "bg-orange-500",  text: "text-orange-600",  soft: "bg-orange-500/10",  ring: "ring-orange-500/20" };
    case "amber":   return { bg: "bg-amber-500",   text: "text-amber-600",   soft: "bg-amber-500/10",   ring: "ring-amber-500/20" };
    case "emerald": return { bg: "bg-emerald-500", text: "text-emerald-600", soft: "bg-emerald-500/10", ring: "ring-emerald-500/20" };
    default:        return { bg: "bg-muted-foreground/40", text: "text-muted-foreground", soft: "bg-muted", ring: "ring-border" };
  }
}

export function recordEdit(ev: MaterialEvaluation, field: string, author = CURRENT_USER) {
  ev.fieldMeta[field] = { by: author, at: Date.now() };
  if (!ev.editors.includes(author)) ev.editors.push(author);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatRelative(at?: number): string {
  if (!at) return "";
  const diff = Date.now() - at;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

// ============ SECTION SNAPSHOTS ============

export function extractSection(ev: MaterialEvaluation, key: SectionKey): SectionSnapshot {
  switch (key) {
    case "impact":
      return { impact: ev.impact, impactNote: ev.impactNote, impactTypes: [...ev.impactTypes] };
    case "urgency":
      return { timeline: ev.timeline, drivers: [...ev.drivers], targetDate: ev.targetDate };
    case "risk":
      return { inactionNote: ev.inactionNote, severity: ev.severity };
    case "feasibility":
      return { effort: ev.effort, feasibilityNotes: ev.feasibilityNotes };
    case "crossteam":
      return { notes: JSON.parse(JSON.stringify(ev.notes)) };
    case "order":
      return { status: ev.status ?? null, order: ev.order ? { ...ev.order } : null };
  }
}

export function applySection(ev: MaterialEvaluation, key: SectionKey, snap: SectionSnapshot) {
  switch (key) {
    case "impact":
      ev.impact = snap.impact ?? "";
      ev.impactNote = snap.impactNote ?? "";
      ev.impactTypes = Array.isArray(snap.impactTypes) ? [...snap.impactTypes] : [];
      break;
    case "urgency":
      ev.timeline = snap.timeline ?? "";
      ev.drivers = Array.isArray(snap.drivers) ? [...snap.drivers] : [];
      ev.targetDate = snap.targetDate ?? "";
      break;
    case "risk":
      ev.inactionNote = snap.inactionNote ?? "";
      ev.severity = snap.severity ?? "";
      break;
    case "feasibility":
      ev.effort = snap.effort ?? "";
      ev.feasibilityNotes = snap.feasibilityNotes ?? "";
      break;
    case "crossteam":
      ev.notes = Array.isArray(snap.notes) ? JSON.parse(JSON.stringify(snap.notes)) : [];
      break;
    case "order":
      ev.status = snap.status ?? undefined;
      ev.order = snap.order ? { ...snap.order } : undefined;
      break;
  }
}

const FIELD_LABELS: Record<string, string> = {
  impact: "Impact level",
  impactNote: "Impact note",
  impactTypes: "Impact types",
  timeline: "Time horizon",
  drivers: "Drivers",
  targetDate: "Target date",
  inactionNote: "Risk note",
  severity: "Severity",
  effort: "Effort",
  feasibilityNotes: "Feasibility notes",
  notes: "Notes",
};

function truncate(s: string, n = 32) {
  s = String(s ?? "");
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function diffSummary(prev: SectionSnapshot, next: SectionSnapshot, key: SectionKey): string {
  if (key === "order") {
    if (!prev.status && next.status === "Ordered") {
      return `Ordered intelligence${next.order?.reason ? ` — “${truncate(next.order.reason, 60)}”` : ""}`;
    }
    return "";
  }
  if (key === "crossteam") {
    const prevIds = new Set((prev.notes || []).map((n: any) => n.id));
    const nextIds = new Set((next.notes || []).map((n: any) => n.id));
    const added = (next.notes || []).filter((n: any) => !prevIds.has(n.id));
    const removed = (prev.notes || []).filter((n: any) => !nextIds.has(n.id));
    const parts: string[] = [];
    if (added.length) parts.push(`Added ${added.length} note${added.length > 1 ? "s" : ""}`);
    if (removed.length) parts.push(`Removed ${removed.length} note${removed.length > 1 ? "s" : ""}`);
    return parts.join("; ");
  }
  const parts: string[] = [];
  for (const k of Object.keys(next)) {
    const a = prev[k];
    const b = next[k];
    if (Array.isArray(b)) {
      const aa = Array.isArray(a) ? a : [];
      const added = b.filter((x) => !aa.includes(x));
      const removed = aa.filter((x) => !b.includes(x));
      if (added.length || removed.length) {
        const bits: string[] = [];
        if (added.length) bits.push(`+${added.map((x) => truncate(x, 18)).join(", ")}`);
        if (removed.length) bits.push(`−${removed.map((x) => truncate(x, 18)).join(", ")}`);
        parts.push(`${FIELD_LABELS[k] || k}: ${bits.join(" ")}`);
      }
    } else if ((a ?? "") !== (b ?? "")) {
      const before = a ? truncate(String(a)) : "—";
      const after = b ? truncate(String(b)) : "—";
      parts.push(`${FIELD_LABELS[k] || k}: ${before} → ${after}`);
    }
  }
  return parts.join("; ");
}

const COALESCE_MS = 30_000;

function genId() {
  return (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function pushHistory(
  ev: MaterialEvaluation,
  key: SectionKey,
  by: string,
  kind: HistoryEntry["kind"],
  snapshot: SectionSnapshot,
  summary: string,
) {
  if (!summary) return;
  if (!ev.history) ev.history = emptyHistory();
  const list = ev.history[key];
  const last = list[0];
  const now = Date.now();
  if (
    last &&
    kind === "edit" &&
    last.kind === "edit" &&
    last.by === by &&
    now - last.at < COALESCE_MS
  ) {
    // Coalesce with previous edit — recompute summary against the baseline before it
    const baseline = list[1]?.snapshot ?? extractEmpty(key);
    const merged = diffSummary(baseline, snapshot, key);
    if (!merged) {
      // change reverted within window — drop the entry
      list.shift();
      return;
    }
    last.snapshot = snapshot;
    last.summary = merged;
    last.at = now;
    return;
  }
  list.unshift({ id: genId(), at: now, by, kind, snapshot, summary });
  if (list.length > 50) list.length = 50;
}

function extractEmpty(key: SectionKey): SectionSnapshot {
  const blank = emptyEvaluation("");
  return extractSection(blank, key);
}

export function latestActivity(ev: MaterialEvaluation):
  | { section: SectionKey; entry: HistoryEntry }
  | null {
  let best: { section: SectionKey; entry: HistoryEntry } | null = null;
  (Object.keys(ev.history || {}) as SectionKey[]).forEach((k) => {
    const e = ev.history?.[k]?.[0];
    if (e && (!best || e.at > best.entry.at)) best = { section: k, entry: e };
  });
  return best;
}
