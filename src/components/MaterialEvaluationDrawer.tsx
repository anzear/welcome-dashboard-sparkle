import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info, Plus, Users, Compass, MessageSquare, History, ShoppingBag, Lock, RotateCcw, CheckCircle2, SlidersHorizontal, Paperclip, X, FileText, Download, BookMarked, Pencil, Unlink, ChevronDown } from "lucide-react";
import PipelineBriefEditor from "@/components/PipelineBriefEditor";
import { usePipelineBriefStore, BRIEF_PALETTE, PIPELINE_BRIEFS_EVENT } from "@/store/pipelineBriefStore";
import {
  DRIVERS_DEFAULT,
  DEFAULT_WEIGHTS,
  IMPACT_TYPES_DEFAULT,
  ImpactLevel,
  MaterialEvaluation,
  NoteAttachment,
  Severity,
  Timeline,
  UrgencyWeights,
  SectionKey,
  SECTION_LABELS,
  FIELD_TO_SECTION,
  HistoryEntry,
  computeUrgency,
  emptyEvaluation,
  emptyHistory,
  formatRelative,
  initials,
  loadEvaluation,
  recordEdit,
  saveEvaluation,
  urgencyColorClasses,
  extractSection,
  applySection,
  diffSummary,
  pushHistory,
  latestActivity,
} from "@/lib/materialEvaluation";
import { useCurrentUser, MOCK_USERS } from "@/lib/currentUser";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type Objective = "Source" | "Produce" | "Valorise" | "";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discoveryId: string | null;
  discoveryName: string;
  objective: Objective;
  owner: string;
  onRename?: (id: string, name: string) => void;
  onOrdered?: (id: string, reason: string) => void;
  onChangeObjective?: (id: string, objective: Objective) => void;
  onChangeOwner?: (id: string, owner: string) => void;
  briefId?: string;
  briefShareCount?: number;
  onAttachBrief?: (briefId: string) => void;
  onDetachBrief?: () => void;
  onOpenBriefPicker?: () => void;
}

const OBJ_TINT: Record<Exclude<Objective, "">, { text: string; soft: string }> = {
  Source: { text: "text-emerald-600", soft: "bg-emerald-500/10" },
  Produce: { text: "text-violet-600", soft: "bg-violet-500/10" },
  Valorise: { text: "text-amber-600", soft: "bg-amber-500/10" },
};

function userColor(name: string) {
  return MOCK_USERS.find((m) => m.name === name)?.color || "bg-foreground/30";
}

function Avatar({ name, size = 5 }: { name: string; size?: 4 | 5 | 6 }) {
  const sz = size === 4 ? "w-4 h-4 text-[8px]" : size === 6 ? "w-6 h-6 text-[10px]" : "w-5 h-5 text-[9px]";
  return (
    <span title={name} className={`${sz} rounded-full ${userColor(name)} text-white font-semibold inline-flex items-center justify-center ring-2 ring-card shrink-0`}>
      {initials(name)}
    </span>
  );
}

function FieldMetaLabel({ ev, field }: { ev: MaterialEvaluation; field: string }) {
  const m = ev.fieldMeta[field];
  if (!m?.by) return null;
  return (
    <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
      <Avatar name={m.by} size={4} />
      {m.by} · {formatRelative(m.at)}
    </span>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
  onAddCustom,
  disabled,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  onAddCustom: (v: string) => void;
  disabled?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [val, setVal] = useState("");
  const all = useMemo(() => Array.from(new Set([...options, ...selected])), [options, selected]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {all.map((opt) => {
        const isSel = selected.includes(opt);
        return (
          <button
            key={opt}
            disabled={disabled}
            onClick={() => onToggle(opt)}
            className={`text-[11px] px-2 py-1 rounded-full border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              isSel
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:border-muted-foreground/40"
            }`}
          >
            {opt}
          </button>
        );
      })}
      {!disabled && (adding ? (
        <span className="inline-flex items-center gap-1">
          <Input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && val.trim()) {
                onAddCustom(val.trim());
                setVal("");
                setAdding(false);
              } else if (e.key === "Escape") {
                setVal("");
                setAdding(false);
              }
            }}
            placeholder="Custom…"
            className="h-6 text-[11px] px-2 w-28"
          />
        </span>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-[11px] px-2 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 inline-flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      ))}
    </div>
  );
}

function SegBar<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (v: T | "") => void;
  disabled?: boolean;
}) {
  return (
    <div className={`inline-flex rounded-md border border-border bg-muted/40 p-0.5 ${disabled ? "opacity-60" : ""}`}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            disabled={disabled}
            onClick={() => onChange(active ? ("" as any) : o.value)}
            className={`text-[11px] px-2.5 py-1 rounded-[5px] transition-colors disabled:cursor-not-allowed ${
              active ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionFrame({
  sectionKey,
  title,
  titleExtra,
  ev,
  onRestore,
  children,
}: {
  sectionKey: SectionKey;
  title: React.ReactNode;
  titleExtra?: React.ReactNode;
  ev: MaterialEvaluation;
  onRestore: (key: SectionKey, entry: HistoryEntry) => void;
  children: React.ReactNode;
}) {
  const list = ev.history?.[sectionKey] ?? [];
  const last = list[0];
  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[10px] uppercase tracking-widest font-semibold inline-flex items-center gap-1.5">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {titleExtra}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Change history"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[340px] p-0 max-h-[420px] flex flex-col">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-widest font-semibold">
                  {SECTION_LABELS[sectionKey]} · History
                </div>
                <span className="text-[10px] text-muted-foreground">{list.length} {list.length === 1 ? "entry" : "entries"}</span>
              </div>
              <div className="overflow-y-auto flex-1">
                {list.length === 0 ? (
                  <div className="px-3 py-6 text-center text-[11px] text-muted-foreground italic">
                    No changes yet
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {list.map((e) => (
                      <li key={e.id} className="px-3 py-2.5 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={e.by} size={4} />
                          <span className="text-[11px] font-medium">{e.by}</span>
                          <span className="text-[10px] text-muted-foreground">· {formatRelative(e.at)}</span>
                          {e.kind === "restore" && (
                            <span className="text-[9px] uppercase tracking-widest text-amber-600 ml-auto">restored</span>
                          )}
                          {e.kind === "order" && (
                            <span className="text-[9px] uppercase tracking-widest text-emerald-600 ml-auto">order</span>
                          )}
                        </div>
                        <p className="text-[11px] text-foreground leading-snug break-words">
                          {e.summary}
                        </p>
                        {sectionKey !== "order" && (
                          <button
                            onClick={() => onRestore(sectionKey, e)}
                            className="text-[10px] inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <RotateCcw className="w-3 h-3" /> Restore this version
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {children}
      {last && (
        <div className="pt-1 border-t border-border/50 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Avatar name={last.by} size={4} />
          Last edited by <span className="font-medium text-foreground">{last.by}</span> · {formatRelative(last.at)}
        </div>
      )}
    </section>
  );
}

export default function MaterialEvaluationDrawer({
  open,
  onOpenChange,
  discoveryId,
  discoveryName,
  objective,
  owner,
  onRename,
  onOrdered,
  onChangeObjective,
  onChangeOwner,
  briefId,
  briefShareCount = 0,
  onAttachBrief,
  onDetachBrief,
  onOpenBriefPicker,
}: Props) {
  const currentUser = useCurrentUser();
  const brief = usePipelineBriefStore((s) => (briefId ? s.briefs[briefId] : undefined));
  const renameBrief = usePipelineBriefStore((s) => s.rename);
  const [briefNameDraft, setBriefNameDraft] = useState("");
  const [briefEditorOpen, setBriefEditorOpen] = useState(false);
  useEffect(() => { setBriefNameDraft(brief?.name || ""); }, [brief?.id, brief?.name]);
  const [ev, setEv] = useState<MaterialEvaluation>(emptyEvaluation(""));
  const [noteTeam, setNoteTeam] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteAttachments, setNoteAttachments] = useState<NoteAttachment[]>([]);
  const [nameDraft, setNameDraft] = useState(discoveryName);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderReason, setOrderReason] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setWeights = (next: UrgencyWeights) => {
    update((d) => { d.weights = next; });
  };
  const resetWeights = () => setWeights({ ...DEFAULT_WEIGHTS });
  const weights = { ...DEFAULT_WEIGHTS, ...(ev.weights || {}) };
  const weightsCustomized =
    weights.impact !== 1 || weights.timeline !== 1 || weights.risk !== 1 || weights.drivers !== 1;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const MAX = 4 * 1024 * 1024; // 4 MB per file
    const next: NoteAttachment[] = [];
    for (const f of Array.from(files)) {
      if (f.size > MAX) { alert(`"${f.name}" is larger than 4 MB and was skipped.`); continue; }
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      next.push({ id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: f.name, type: f.type || "application/octet-stream", size: f.size, dataUrl });
    }
    setNoteAttachments((prev) => [...prev, ...next].slice(0, 6));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    setNameDraft(discoveryName);
  }, [discoveryName, discoveryId]);

  useEffect(() => {
    if (!discoveryId) return;
    setEv(loadEvaluation(discoveryId));
    setOrderReason("");
  }, [discoveryId, open]);

  const isOrdered = ev.status === "Ordered";

  const update = (mutator: (draft: MaterialEvaluation) => void, field?: string) => {
    if (isOrdered) return;
    setEv((prev) => {
      const next: MaterialEvaluation = JSON.parse(JSON.stringify(prev));
      if (!next.history) next.history = emptyHistory();
      const sectionKey: SectionKey | null = field ? (FIELD_TO_SECTION[field] ?? null) : null;
      const prevSnap = sectionKey ? extractSection(next, sectionKey) : null;
      mutator(next);
      if (field) recordEdit(next, field, currentUser.name);
      if (sectionKey && prevSnap) {
        const nextSnap = extractSection(next, sectionKey);
        const summary = diffSummary(prevSnap, nextSnap, sectionKey);
        if (summary) {
          pushHistory(next, sectionKey, currentUser.name, "edit", nextSnap, summary);
        }
      }
      saveEvaluation(next);
      return next;
    });
  };

  const handleRestore = (key: SectionKey, entry: HistoryEntry) => {
    if (isOrdered) return;
    setEv((prev) => {
      const next: MaterialEvaluation = JSON.parse(JSON.stringify(prev));
      applySection(next, key, entry.snapshot);
      const snap = extractSection(next, key);
      const summary = `Restored version from ${new Date(entry.at).toLocaleString()} (by ${entry.by})`;
      pushHistory(next, key, currentUser.name, "restore", snap, summary);
      if (!next.editors.includes(currentUser.name)) next.editors.push(currentUser.name);
      saveEvaluation(next);
      return next;
    });
  };

  const urgency = computeUrgency(ev);
  const colors = urgencyColorClasses(urgency.color);
  const objTint = objective && objective in OBJ_TINT ? OBJ_TINT[objective as Exclude<Objective, "">] : null;

  const addNote = () => {
    if ((!noteBody.trim() && noteAttachments.length === 0) || isOrdered) return;
    const author = currentUser.name;
    const atts = [...noteAttachments];
    update((draft) => {
      draft.notes.unshift({
        id: `n-${Date.now()}`,
        author,
        team: noteTeam.trim() || currentUser.team || undefined,
        body: noteBody.trim(),
        at: Date.now(),
        attachments: atts.length ? atts : undefined,
      });
      if (!draft.editors.includes(author)) draft.editors.push(author);
    }, "notes");
    setNoteBody("");
    setNoteAttachments([]);
  };

  const confirmOrder = () => {
    if (!discoveryId) return;
    const reason = orderReason.trim();
    setEv((prev) => {
      const next: MaterialEvaluation = JSON.parse(JSON.stringify(prev));
      const prevSnap = extractSection(next, "order");
      next.status = "Ordered";
      next.order = { reason, by: currentUser.name, at: Date.now() };
      if (!next.editors.includes(currentUser.name)) next.editors.push(currentUser.name);
      const nextSnap = extractSection(next, "order");
      const summary = diffSummary(prevSnap, nextSnap, "order");
      pushHistory(next, "order", currentUser.name, "order", nextSnap, summary);
      saveEvaluation(next);
      return next;
    });
    onOrdered?.(discoveryId, reason);
    setOrderOpen(false);
  };

  const contributors = Array.from(new Set([owner, ...ev.editors])).filter(Boolean);
  const activity = latestActivity(ev);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none p-0 overflow-hidden flex flex-col"
        style={{ width: "min(960px, 100vw)" }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border bg-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild disabled={isOrdered || !discoveryId}>
                    <button
                      className={`text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded inline-flex items-center gap-1 transition-colors disabled:cursor-default ${objTint ? `${objTint.soft} ${objTint.text}` : "bg-muted text-muted-foreground"} ${!isOrdered ? "hover:ring-1 hover:ring-border" : ""}`}
                      title={isOrdered ? undefined : "Change objective"}
                    >
                      {objective || "Discovery"}
                      {!isOrdered && <ChevronDown className="w-2.5 h-2.5 opacity-70" />}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-44 p-1">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-1.5">Objective</div>
                    {(["Source", "Produce", "Valorise"] as const).map((opt) => {
                      const tint = OBJ_TINT[opt];
                      const active = objective === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => discoveryId && onChangeObjective?.(discoveryId, opt)}
                          className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted/60 ${active ? "font-semibold" : ""}`}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${tint.soft}`}>
                              <span className={`block w-2 h-2 rounded-full ${tint.text.replace("text-", "bg-")}`} />
                            </span>
                            {opt}
                          </span>
                          {active && <CheckCircle2 className="w-3 h-3 text-primary" />}
                        </button>
                      );
                    })}
                    {objective && (
                      <>
                        <div className="h-px bg-border my-1" />
                        <button
                          onClick={() => discoveryId && onChangeObjective?.(discoveryId, "")}
                          className="w-full text-left px-2 py-1.5 rounded text-xs text-muted-foreground hover:bg-muted/60"
                        >
                          Clear objective
                        </button>
                      </>
                    )}
                  </PopoverContent>
                </Popover>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1">
                  <Compass className="w-3 h-3" /> Material Evaluation
                </span>
                {isOrdered && (
                  <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Coverage requested
                  </span>
                )}
              </div>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                disabled={isOrdered}
                onBlur={() => {
                  const v = nameDraft.trim();
                  if (!discoveryId) return;
                  if (!v) { setNameDraft(discoveryName); return; }
                  if (v !== discoveryName) onRename?.(discoveryId, v);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") { setNameDraft(discoveryName); (e.target as HTMLInputElement).blur(); }
                }}
                placeholder="Material name"
                className="w-full text-xl font-semibold text-foreground bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none rounded px-1 -mx-1 py-0.5 truncate disabled:opacity-80 disabled:hover:border-transparent"
              />
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {!isOrdered && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                    </span>
                    Evaluation in progress
                  </span>
                )}
                <Popover>
                  <PopoverTrigger asChild disabled={isOrdered || !discoveryId}>
                    <button
                      className={`inline-flex items-center gap-1.5 text-[11px] text-muted-foreground rounded px-1 py-0.5 ${!isOrdered ? "hover:bg-muted/60" : "cursor-default"}`}
                      title={isOrdered ? undefined : "Change owner"}
                    >
                      <Avatar name={owner} size={4} />
                      <span>Owner: <span className="font-medium text-foreground">{owner}</span></span>
                      {!isOrdered && <ChevronDown className="w-2.5 h-2.5 opacity-70" />}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-56 p-1">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-1.5">Assign owner</div>
                    {MOCK_USERS.map((u) => {
                      const active = owner === u.name;
                      return (
                        <button
                          key={u.name}
                          onClick={() => discoveryId && onChangeOwner?.(discoveryId, u.name)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted/60 ${active ? "font-semibold" : ""}`}
                        >
                          <Avatar name={u.name} size={4} />
                          <span className="flex-1 text-left truncate">{u.name}{u.name === currentUser.name ? " (you)" : ""}</span>
                          {active && <CheckCircle2 className="w-3 h-3 text-primary" />}
                        </button>
                      );
                    })}
                  </PopoverContent>
                </Popover>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span className="flex -space-x-1.5">
                    {contributors.slice(0, 5).map((c) => (
                      <Avatar key={c} name={c} />
                    ))}
                  </span>
                  {contributors.length} {contributors.length === 1 ? "contributor" : "contributors"}
                </span>
                {activity && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <History className="w-3 h-3" />
                    <span className="font-medium text-foreground">{activity.entry.by}</span>
                    updated {SECTION_LABELS[activity.section]} · {formatRelative(activity.entry.at)}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-start gap-2">
              {/* Order CTA */}
              {!isOrdered ? (
                <Button
                  size="sm"
                  onClick={() => setOrderOpen(true)}
                  className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Request coverage
                </Button>
              ) : (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1.5 text-[10px] text-emerald-700 inline-flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Read-only
                </div>
              )}

              {/* Urgency Score */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className={`text-left rounded-lg border-2 px-3 py-2 ${colors.soft} ring-1 ${colors.ring} border-transparent hover:border-border transition-colors`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Urgency Score
                      </span>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                    {urgency.score == null ? (
                      <div className="text-[11px] text-muted-foreground mt-1">Not enough input yet</div>
                    ) : (
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className={`text-2xl font-bold tabular-nums ${colors.text}`}>{urgency.score}</span>
                        <span className={`text-[11px] uppercase tracking-wider font-semibold ${colors.text}`}>{urgency.label}</span>
                      </div>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3 space-y-2" align="end">
                  <div className="text-[10px] uppercase tracking-widest font-semibold">How this is calculated</div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Weighted average of Impact, Timeline and Risk severity, plus up to +20 from selected drivers (scaled by the drivers weight).
                  </p>
                  <ul className="space-y-1 text-[11px]">
                    <li className="flex justify-between"><span className="text-muted-foreground">Impact <span className="text-[9px]">× {weights.impact}</span></span><span className="tabular-nums">{urgency.parts.impact ?? "—"}</span></li>
                    <li className="flex justify-between"><span className="text-muted-foreground">Timeline <span className="text-[9px]">× {weights.timeline}</span></span><span className="tabular-nums">{urgency.parts.timeline ?? "—"}</span></li>
                    <li className="flex justify-between"><span className="text-muted-foreground">Risk severity <span className="text-[9px]">× {weights.risk}</span></span><span className="tabular-nums">{urgency.parts.risk ?? "—"}</span></li>
                    <li className="flex justify-between"><span className="text-muted-foreground">Drivers bonus <span className="text-[9px]">× {weights.drivers}</span></span><span className="tabular-nums">+{urgency.parts.driversBonus}</span></li>
                  </ul>
                </PopoverContent>
              </Popover>

              {/* Adjust weights */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={`h-9 inline-flex items-center gap-1.5 rounded-md border px-2.5 text-[11px] transition-colors ${
                      weightsCustomized
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                    }`}
                    title="Adjust scoring weights"
                    disabled={isOrdered}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Weights</span>
                    {weightsCustomized && <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 space-y-3" align="end">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-widest font-semibold">Scoring weights</div>
                    <button
                      onClick={resetWeights}
                      disabled={!weightsCustomized || isOrdered}
                      className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Tune how much each component contributes to the Urgency Score. 1.0 is the default; 0 removes the component, 2 doubles it.
                  </p>
                  {([
                    ["impact", "Impact"],
                    ["timeline", "Timeline"],
                    ["risk", "Risk severity"],
                    ["drivers", "Drivers bonus"],
                  ] as [keyof UrgencyWeights, string][]).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-foreground">{label}</span>
                        <span className="tabular-nums font-semibold">× {weights[key].toFixed(2)}</span>
                      </div>
                      <Slider
                        value={[weights[key]]}
                        min={0}
                        max={2}
                        step={0.25}
                        disabled={isOrdered}
                        onValueChange={(v) => setWeights({ ...weights, [key]: v[0] })}
                      />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border text-[10px] text-muted-foreground">
                    Weights are saved per material and recalculate the score instantly.
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {isOrdered && ev.order && (
            <div className="mt-3 rounded-md bg-emerald-500/5 border border-emerald-500/20 px-3 py-2 text-[11px] text-emerald-800">
              <span className="font-semibold">Coverage requested</span> by {ev.order.by} · {formatRelative(ev.order.at)}
              {ev.order.reason && <span className="text-emerald-700/80"> — “{ev.order.reason}”</span>}
            </div>
          )}
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-muted/20 ${isOrdered ? "select-none" : ""}`}>
          {/* Brief panel */}
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <BookMarked className="w-3.5 h-3.5 text-primary shrink-0" />
                <h3 className="text-[10px] uppercase tracking-widest font-semibold">Brief</h3>
                {brief && (() => {
                  const p = BRIEF_PALETTE[brief.color] || BRIEF_PALETTE.emerald;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] ${p.bg} ${p.text} ${p.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                      <input
                        value={briefNameDraft}
                        onChange={(e) => setBriefNameDraft(e.target.value)}
                        onBlur={() => {
                          const v = briefNameDraft.trim();
                          if (v && v !== brief.name) renameBrief(brief.id, v, currentUser.name);
                          else setBriefNameDraft(brief.name);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          if (e.key === "Escape") { setBriefNameDraft(brief.name); (e.target as HTMLInputElement).blur(); }
                        }}
                        disabled={isOrdered}
                        className="bg-transparent border-0 outline-none focus:ring-0 px-0 h-auto text-[11px] font-semibold min-w-0 w-auto"
                        style={{ width: `${Math.max(6, briefNameDraft.length + 1)}ch` }}
                      />
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {brief ? (
                  <>
                    <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1" onClick={() => setBriefEditorOpen((v) => !v)}>
                      <Pencil className="w-3 h-3" /> {briefEditorOpen ? "Hide editor" : "Edit brief"}
                    </Button>
                    {!isOrdered && (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1" onClick={onOpenBriefPicker}>
                          Change
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-destructive" onClick={onDetachBrief}>
                          <Unlink className="w-3 h-3" /> Detach
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  !isOrdered && (
                    <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={onOpenBriefPicker}>
                      <Plus className="w-3 h-3" /> Add a brief
                    </Button>
                  )
                )}
              </div>
            </div>

            {brief ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Avatar name={brief.lastEditedBy} size={4} />
                    Last edited by <span className="font-medium text-foreground">{brief.lastEditedBy}</span> · {formatRelative(brief.lastEditedAt)}
                  </span>
                  {briefShareCount > 1 && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                      <Users className="w-3 h-3" />
                      This brief is shared by {briefShareCount} materials. Changes apply to all of them.
                    </span>
                  )}
                </div>
                {briefEditorOpen && (
                  <div className="pt-2 border-t border-border/60">
                    <PipelineBriefEditor brief={brief} userName={currentUser.name} defaultOpen />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-2">
                No brief attached. Attach this material to a brief — useful when several materials address the same need.
              </p>
            )}
          </section>

          <fieldset disabled={isOrdered} className="space-y-5 m-0 p-0 border-0">
            {/* Block A — Business Impact */}
            <SectionFrame
              sectionKey="impact"
              title={<>Business Impact</>}
              titleExtra={<FieldMetaLabel ev={ev} field="impact" />}
              ev={ev}
              onRestore={handleRestore}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] text-muted-foreground">Impact level</span>
                <SegBar
                  disabled={isOrdered}
                  options={[
                    { value: "Low" as ImpactLevel, label: "Low" },
                    { value: "Medium" as ImpactLevel, label: "Medium" },
                    { value: "High" as ImpactLevel, label: "High" },
                    { value: "Critical" as ImpactLevel, label: "Critical" },
                  ]}
                  value={ev.impact}
                  onChange={(v) => update((d) => { d.impact = v as ImpactLevel; }, "impact")}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">What's the impact? (revenue, cost, volume, strategic fit)</label>
                <Textarea
                  value={ev.impactNote}
                  onChange={(e) => update((d) => { d.impactNote = e.target.value; }, "impactNote")}
                  placeholder="Describe the business impact…"
                  className="min-h-[72px] text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-muted-foreground">Impact type</label>
                  <FieldMetaLabel ev={ev} field="impactTypes" />
                </div>
                <ChipGroup
                  disabled={isOrdered}
                  options={IMPACT_TYPES_DEFAULT}
                  selected={ev.impactTypes}
                  onToggle={(v) =>
                    update((d) => {
                      d.impactTypes = d.impactTypes.includes(v)
                        ? d.impactTypes.filter((x) => x !== v)
                        : [...d.impactTypes, v];
                    }, "impactTypes")
                  }
                  onAddCustom={(v) => update((d) => { if (!d.impactTypes.includes(v)) d.impactTypes.push(v); }, "impactTypes")}
                />
              </div>
            </SectionFrame>

            {/* Block B — Urgency & Timeline */}
            <SectionFrame
              sectionKey="urgency"
              title={<>Urgency &amp; Timeline</>}
              titleExtra={<FieldMetaLabel ev={ev} field="timeline" />}
              ev={ev}
              onRestore={handleRestore}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] text-muted-foreground">Time horizon</span>
                <SegBar
                  disabled={isOrdered}
                  options={[
                    { value: "Immediate" as Timeline, label: "Immediate" },
                    { value: "Under 1 year" as Timeline, label: "Under 1 year" },
                    { value: "1–3 years" as Timeline, label: "1–3 years" },
                    { value: "Over 3 years" as Timeline, label: "Over 3 years" },
                  ]}
                  value={ev.timeline}
                  onChange={(v) => update((d) => { d.timeline = v as Timeline; }, "timeline")}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-muted-foreground">Drivers</label>
                  <FieldMetaLabel ev={ev} field="drivers" />
                </div>
                <ChipGroup
                  disabled={isOrdered}
                  options={DRIVERS_DEFAULT}
                  selected={ev.drivers}
                  onToggle={(v) =>
                    update((d) => {
                      d.drivers = d.drivers.includes(v)
                        ? d.drivers.filter((x) => x !== v)
                        : [...d.drivers, v];
                    }, "drivers")
                  }
                  onAddCustom={(v) => update((d) => { if (!d.drivers.includes(v)) d.drivers.push(v); }, "drivers")}
                />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-[11px] text-muted-foreground">Target / deadline</label>
                <Input
                  type="date"
                  value={ev.targetDate}
                  onChange={(e) => update((d) => { d.targetDate = e.target.value; }, "targetDate")}
                  className="h-8 text-xs w-44"
                />
                <FieldMetaLabel ev={ev} field="targetDate" />
              </div>
            </SectionFrame>

            {/* Block C — Risk of Inaction */}
            <SectionFrame
              sectionKey="risk"
              title={<>Risk of Inaction</>}
              titleExtra={<FieldMetaLabel ev={ev} field="inactionNote" />}
              ev={ev}
              onRestore={handleRestore}
            >
              <Textarea
                value={ev.inactionNote}
                onChange={(e) => update((d) => { d.inactionNote = e.target.value; }, "inactionNote")}
                placeholder="What happens if we don't act?"
                className="min-h-[64px] text-xs"
              />
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] text-muted-foreground">Severity</span>
                <SegBar
                  disabled={isOrdered}
                  options={[
                    { value: "Low" as Severity, label: "Low" },
                    { value: "Medium" as Severity, label: "Medium" },
                    { value: "High" as Severity, label: "High" },
                  ]}
                  value={ev.severity}
                  onChange={(v) => update((d) => { d.severity = v as Severity; }, "severity")}
                />
              </div>
            </SectionFrame>

            {/* Block D — Feasibility */}
            <SectionFrame
              sectionKey="feasibility"
              title={<>Feasibility <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span></>}
              titleExtra={<FieldMetaLabel ev={ev} field="effort" />}
              ev={ev}
              onRestore={handleRestore}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] text-muted-foreground">Effort to research</span>
                <SegBar
                  disabled={isOrdered}
                  options={[
                    { value: "Low", label: "Low" },
                    { value: "Medium", label: "Medium" },
                    { value: "High", label: "High" },
                  ]}
                  value={ev.effort}
                  onChange={(v) => update((d) => { d.effort = v as any; }, "effort")}
                />
              </div>
              <Textarea
                value={ev.feasibilityNotes}
                onChange={(e) => update((d) => { d.feasibilityNotes = e.target.value; }, "feasibilityNotes")}
                placeholder="Notes on feasibility…"
                className="min-h-[56px] text-xs"
              />
            </SectionFrame>

            {/* Block E — Cross-team Input */}
            <SectionFrame
              sectionKey="crossteam"
              title={<><MessageSquare className="w-3 h-3" /> Cross-team Input</>}
              ev={ev}
              onRestore={handleRestore}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar name={currentUser.name} />
                  <span className="text-[11px] text-muted-foreground">
                    Posting as <span className="font-semibold text-foreground">{currentUser.name}</span>
                  </span>
                  <Input
                    value={noteTeam}
                    onChange={(e) => setNoteTeam(e.target.value)}
                    placeholder={currentUser.team || "Team (optional)"}
                    className="h-7 text-xs w-44 ml-auto"
                  />
                </div>
                <Textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Add a note for the team…"
                  className="min-h-[60px] text-xs"
                />
                {noteAttachments.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {noteAttachments.map((a) => (
                      <li key={a.id} className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full border border-border bg-background text-[11px] max-w-[220px]">
                        <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate" title={a.name}>{a.name}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{formatBytes(a.size)}</span>
                        <button
                          onClick={() => setNoteAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                          className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                          aria-label="Remove attachment"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      hidden
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isOrdered || noteAttachments.length >= 6}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      Attach files
                      <span className="text-[10px] text-muted-foreground/70">(max 4 MB each)</span>
                    </button>
                  </div>
                  <Button size="sm" onClick={addNote} disabled={(!noteBody.trim() && noteAttachments.length === 0) || isOrdered} className="h-7 text-xs">
                    Post note
                  </Button>
                </div>
              </div>
              {ev.notes.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">No notes yet — start the discussion.</p>
              ) : (
                <ul className="space-y-2">
                  {ev.notes.map((n) => (
                    <li key={n.id} className="rounded-md border border-border/60 bg-muted/30 p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar name={n.author} />
                        <span className="text-[11px] font-semibold text-foreground">{n.author}</span>
                        {n.team && (
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">· {n.team}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">{formatRelative(n.at)}</span>
                      </div>
                      {n.body && (
                        <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{n.body}</p>
                      )}
                      {n.attachments && n.attachments.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {n.attachments.map((a) => (
                            <li key={a.id}>
                              <a
                                href={a.dataUrl}
                                download={a.name}
                                className="inline-flex items-center gap-1.5 pl-2 pr-2 py-1 rounded-full border border-border bg-background text-[11px] hover:bg-muted transition-colors max-w-[260px]"
                                title={`${a.name} · ${formatBytes(a.size)}`}
                              >
                                <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{a.name}</span>
                                <span className="text-[10px] text-muted-foreground tabular-nums">{formatBytes(a.size)}</span>
                                <Download className="w-3 h-3 text-muted-foreground shrink-0" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </SectionFrame>

            {/* Block F — Order / Decision (history only, always visible) */}
            <SectionFrame
              sectionKey="order"
              title={<><ShoppingBag className="w-3 h-3" /> Coverage request</>}
              ev={ev}
              onRestore={handleRestore}
            >
              {!isOrdered ? (
                <p className="text-[11px] text-muted-foreground italic">
                  Coverage not requested yet. When ready, click <span className="font-semibold text-foreground">Request coverage</span> in the header to open this discovery for full coverage.
                </p>
              ) : (
                <div className="text-[11px] text-foreground space-y-1">
                  <div>Status: <span className="font-semibold text-emerald-700">Coverage requested</span></div>
                  <div className="text-muted-foreground">
                    by {ev.order?.by} · {ev.order && new Date(ev.order.at).toLocaleString()}
                  </div>
                  {ev.order?.reason && (
                    <div className="rounded bg-muted/40 p-2 text-foreground/80">“{ev.order.reason}”</div>
                  )}
                </div>
              )}
            </SectionFrame>
          </fieldset>
        </div>
      </SheetContent>

      {/* Order confirmation modal */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="inline-flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" /> Request coverage
            </DialogTitle>
            <DialogDescription>
              Request full coverage for this discovery. The evaluation will be locked as read-only and the topic will be opened for full research.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {objTint ? (
                  <span className={`text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded ${objTint.soft} ${objTint.text}`}>
                    {objective}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    Discovery
                  </span>
                )}
                <span className="text-sm font-semibold">{discoveryName}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                Urgency Score:
                {urgency.score == null ? (
                  <span className="italic">Not enough input yet</span>
                ) : (
                  <span className={`font-semibold ${colors.text}`}>{urgency.score} · {urgency.label}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Avatar name={currentUser.name} size={4} />
                Requesting as <span className="font-semibold text-foreground">{currentUser.name}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Reason for the request (optional)</label>
              <Textarea
                value={orderReason}
                onChange={(e) => setOrderReason(e.target.value)}
                placeholder="Why is this the right material to invest in?"
                className="min-h-[70px] text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOrderOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={confirmOrder} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Request coverage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
