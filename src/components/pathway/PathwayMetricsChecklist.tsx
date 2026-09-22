import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, History, MessageSquare, MessageSquarePlus, Paperclip, Pencil, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  readValidationComments,
  writeValidationComments,
  VALIDATION_COMMENTS_CHANGED_EVENT,
  type ValidationComment,
} from "@/lib/pathwayValidationComments";
import { registerDocuments } from "@/lib/documentRegistry";
import {
  activePathwayIndicatorOverrides,
  readPathwayIndicatorOverrides,
  writePathwayIndicatorOverrides,
  type PathwayIndicatorOverrideRecord,
} from "@/lib/pathwayIndicatorOverrides";

/**
 * VALIDATION CHECKLIST — grouped pathway review criteria.
 * Confirmations, attributed notes, and checklist documents use the existing localStorage stores.
 */

export interface ChecklistMetric {
  id: string;
  label: string;
  value: string;
  group?: string;
  /** Null means evidence has not loaded; an empty list means it loaded with no evidence. */
  evidence?: string[] | null;
  indicators?: ChecklistIndicator[];
}

export interface ChecklistIndicator {
  id: string;
  label: string;
  vcgValue: string | null;
  unit: string;
  observedAt: string;
  percentile?: number;
}

type MetricStatus = "met" | "not_met";

type MetricEntry = {
  state: MetricStatus | "confirmed" | "own";
  ownValue?: string;
  by: string;
  date: string;
};

const isMet = (entry?: MetricEntry) =>
  entry?.state === "met" || entry?.state === "confirmed" || entry?.state === "own";

type MetricChecklistState = Record<string, MetricEntry>;

const storageKey = (topic: string | undefined, pathwayId: string) =>
  `vcg.pathway.metricChecklist.${topic ? encodeURIComponent(topic) : "default"}.${pathwayId}`;

const todayLabel = () =>
  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const read = (topic: string | undefined, pathwayId: string): MetricChecklistState => {
  try {
    const raw = localStorage.getItem(storageKey(topic, pathwayId));
    return raw ? (JSON.parse(raw) as MetricChecklistState) : {};
  } catch {
    return {};
  }
};

interface Props {
  pathwayId: string;
  topic?: string;
  metrics: ChecklistMetric[];
  currentUser?: string;
}

export const PathwayMetricsChecklist: React.FC<Props> = ({
  pathwayId,
  topic,
  metrics,
  currentUser = "A. Novak",
}) => {
  const [state, setState] = useState<MetricChecklistState>({});
  const [comments, setComments] = useState<ValidationComment[]>([]);
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [pendingDocMetric, setPendingDocMetric] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [overrides, setOverrides] = useState<PathwayIndicatorOverrideRecord[]>([]);
  const [overrideIndicator, setOverrideIndicator] = useState<ChecklistIndicator | null>(null);
  const [overrideValue, setOverrideValue] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setState(read(topic, pathwayId));
    setOverrides(readPathwayIndicatorOverrides(topic, pathwayId));
  }, [topic, pathwayId]);

  useEffect(() => {
    const load = () => setComments(readValidationComments(topic, pathwayId));
    load();
    window.addEventListener(VALIDATION_COMMENTS_CHANGED_EVENT, load);
    return () => window.removeEventListener(VALIDATION_COMMENTS_CHANGED_EVENT, load);
  }, [topic, pathwayId]);

  const commentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    comments.forEach((c) => {
      if (c.metricLabel) counts[c.metricLabel] = (counts[c.metricLabel] ?? 0) + 1;
    });
    return counts;
  }, [comments]);

  const addComment = (metric: ChecklistMetric) => {
    if (!noteDraft.trim()) return;
    const next: ValidationComment[] = [
      ...comments,
      {
        id: crypto.randomUUID(),
        categoryId: "",
        author: currentUser,
        text: noteDraft.trim(),
        createdAt: new Date().toISOString(),
        metricLabel: metric.label,
      },
    ];
    setComments(next);
    writeValidationComments(topic, pathwayId, next);
    setNoteDraft("");
    setNoteOpen(null);
  };

  const handleDocClick = (metric: ChecklistMetric) => {
    setPendingDocMetric(metric.id);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0 || !pendingDocMetric) return;
    const metric = metrics.find((m) => m.id === pendingDocMetric);
    if (!metric) return;
    registerDocuments(
      files.map((file) => file.name),
      currentUser,
      `Checklist · ${metric.label}`,
    );
    event.target.value = "";
    setPendingDocMetric(null);
  };

  const persist = (next: MetricChecklistState) => {
    setState(next);
    try {
      localStorage.setItem(storageKey(topic, pathwayId), JSON.stringify(next));
    } catch {}
  };

  const setStatus = (metric: ChecklistMetric, status: MetricStatus) =>
    persist({
      ...state,
      [metric.id]: { state: status, by: currentUser, date: todayLabel() },
    });

  const reset = (metric: ChecklistMetric) => {
    const next = { ...state };
    delete next[metric.id];
    persist(next);
  };

  const reviewed = metrics.filter((m) => isMet(state[m.id])).length;
  const activeOverrides = useMemo(() => activePathwayIndicatorOverrides(overrides), [overrides]);
  const persistOverrides = (next: PathwayIndicatorOverrideRecord[]) => {
    setOverrides(next);
    writePathwayIndicatorOverrides(topic, pathwayId, next);
  };
  const saveOverride = () => {
    if (!overrideIndicator || !overrideValue.trim() || !overrideReason.trim()) return;
    persistOverrides([
      ...overrides,
      {
        id: crypto.randomUUID(),
        indicatorId: overrideIndicator.id,
        value: overrideValue.trim(),
        reason: overrideReason.trim(),
        author: currentUser,
        createdAt: new Date().toISOString(),
        operation: "override",
      },
    ]);
    setOverrideIndicator(null);
    setOverrideValue("");
    setOverrideReason("");
  };
  const revertOverride = (record: PathwayIndicatorOverrideRecord) => {
    persistOverrides([
      ...overrides,
      {
        id: crypto.randomUUID(),
        indicatorId: record.indicatorId,
        value: record.value,
        reason: `Reverted: ${record.reason}`,
        author: currentUser,
        createdAt: new Date().toISOString(),
        operation: "revert",
        revertsId: record.id,
      },
    ]);
  };
  const groupLabels: Record<string, string> = {
    "Technical Feasibility": "Technical",
    "Commercial Viability": "Commercial",
    "Risk & Compliance": "Risk & Compliance",
  };
  const groups = useMemo(() => {
    const ordered: Array<{ label: string; metrics: ChecklistMetric[] }> = [];
    metrics.forEach((metric) => {
      const label = metric.group ?? "Criteria";
      const existing = ordered.find((group) => group.label === label);
      if (existing) existing.metrics.push(metric);
      else ordered.push({ label, metrics: [metric] });
    });
    return ordered;
  }, [metrics]);

  return (
    <div className="mt-3 overflow-hidden rounded-md border border-border bg-card">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
          Validation checklist
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <div
            className="h-[3px] w-12 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={reviewed}
            aria-valuemin={0}
            aria-valuemax={metrics.length}
            aria-label="Criteria confirmed"
          >
            {reviewed > 0 && (
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-150"
                style={{ width: `${(reviewed / metrics.length) * 100}%` }}
              />
            )}
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {reviewed > 0 ? `${reviewed} of ${metrics.length}` : `${metrics.length} criteria`}
          </span>
        </div>
      </div>

      <div className="max-h-[520px] overflow-y-auto border-t border-border px-2 pb-2">
        {groups.map((group, groupIndex) => (
          <div key={group.label}>
            <div className={`flex h-6 items-center gap-2 px-1 pb-1 ${groupIndex > 0 ? "mt-2" : ""}`}>
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {groupLabels[group.label] ?? group.label}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            {group.metrics.map((metric) => {
              const entry = state[metric.id];
              const noteCount = commentCounts[metric.label] ?? 0;
              const evidenceText = metric.evidence?.filter(Boolean).join(" · ") ?? "";
              const indicators = metric.indicators ?? [];
              const metricOverrides = activeOverrides.filter((record) => indicators.some((indicator) => indicator.id === record.indicatorId));

              return (
                <div key={metric.id}>
                <div className="group flex h-9 items-center rounded-sm px-2 outline-none transition-colors hover:bg-muted/50">
                  <button
                    type="button"
                    onClick={() => (isMet(entry) ? reset(metric) : setStatus(metric, "met"))}
                    className={`mr-3 flex h-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium transition-colors duration-[120ms] ${
                      isMet(entry)
                        ? "border-success bg-success px-2 text-success-foreground"
                        : "h-5 w-8 border-border bg-transparent text-transparent hover:bg-muted/60"
                    }`}
                    title={isMet(entry) ? "Met — click to reset" : "Mark as met"}
                    aria-label={isMet(entry) ? "Met — click to reset" : "Mark as met"}
                  >
                    {isMet(entry) && (
                      <span className="flex items-center gap-0.5">
                        <Check className="h-3 w-3" />
                        met
                      </span>
                    )}
                  </button>

                  <span className={`min-w-0 flex-1 truncate text-left text-[13px] font-medium ${entry ? "text-muted-foreground" : "text-foreground"}`}>
                    {metric.label}
                  </span>

                  {indicators.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="ml-1 h-6 gap-1 px-1.5 text-[10px] font-normal text-muted-foreground"
                      title={expanded[metric.id] ? "Hide related indicators" : "Show related indicators"}
                      aria-expanded={Boolean(expanded[metric.id])}
                      onClick={(event) => {
                        event.stopPropagation();
                        setExpanded((current) => ({ ...current, [metric.id]: !current[metric.id] }));
                      }}
                    >
                      <ChevronRight className={`h-3 w-3 transition-transform ${expanded[metric.id] ? "rotate-90" : ""}`} />
                      {indicators.length} indicators
                      {metricOverrides.length > 0 && <span>· {metricOverrides.length} overridden</span>}
                    </Button>
                  )}

                  <div className="ml-2 flex min-w-[60px] shrink-0 justify-end">
                    {indicators.length > 0 ? null : metric.evidence === null || metric.evidence === undefined ? (
                      <span className="h-2.5 w-[60px] animate-pulse rounded-sm bg-muted" aria-label="Evidence loading" />
                    ) : evidenceText ? (
                      <span className="max-w-[180px] truncate text-right text-[11px] text-muted-foreground">
                        {evidenceText}
                      </span>
                    ) : null}
                  </div>

                  <div className="ml-2 flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 text-muted-foreground"
                      title="Attach document"
                      aria-label="Attach document"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDocClick(metric);
                      }}
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                    </Button>
                    <Popover
                      open={noteOpen === metric.id}
                      onOpenChange={(open) => {
                        setNoteOpen(open ? metric.id : null);
                        if (open) setNoteDraft("");
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 min-w-5 gap-0.5 p-0 text-[9px] text-muted-foreground"
                          title={commentCounts[metric.label] ? "Notes" : "Add note"}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {noteCount > 0 ? (
                            <>
                              <MessageSquare className="h-3 w-3 fill-current" />
                              {noteCount}
                            </>
                          ) : (
                            <MessageSquarePlus className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-72 p-2">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {metric.label}
                        </div>
                        {comments
                          .filter((c) => c.metricLabel === metric.label)
                          .map((c) => (
                            <div key={c.id} className="mt-2 rounded border border-border/60 p-2">
                              <div className="text-[10px] text-muted-foreground">
                                {c.author} · {new Date(c.createdAt).toLocaleDateString()}
                              </div>
                              <p className="mt-0.5 whitespace-pre-wrap break-words text-[11px]">{c.text}</p>
                            </div>
                          ))}
                        <Textarea
                          value={noteDraft}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          placeholder="Add a note on this metric…"
                          className="mt-2 min-h-[56px] text-xs"
                        />
                        <div className="mt-2 flex justify-end">
                          <Button
                            size="sm"
                            className="h-7 gap-1 text-[10px]"
                            disabled={!noteDraft.trim()}
                            onClick={() => addComment(metric)}
                          >
                            <Send className="h-3 w-3" /> Post note
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {expanded[metric.id] && indicators.length > 0 && (
                  <div className="mb-1 ml-12 mr-2 overflow-hidden rounded-sm border border-border/70 bg-background">
                    {indicators.map((indicator) => {
                      const indicatorOverrides = activeOverrides.filter((record) => record.indicatorId === indicator.id);
                      const currentUsersOverride = indicatorOverrides.find((record) => record.author === currentUser);
                      const history = overrides.filter((record) => record.indicatorId === indicator.id).slice().reverse();
                      const pct = indicator.percentile === undefined ? null : Math.max(0, Math.min(100, indicator.percentile));
                      return (
                        <div key={indicator.id} className="group/indicator border-b border-border/60 px-3 py-2 last:border-b-0">
                          <div className="grid grid-cols-[minmax(150px,1fr)_140px_minmax(120px,1fr)_80px_52px] items-center gap-3">
                            <span className="truncate text-[11px] text-foreground">{indicator.label}</span>
                            <div className="min-w-0 text-right text-[10px] tabular-nums">
                              {currentUsersOverride ? (
                                <>
                                  <span className="font-semibold text-foreground">{currentUsersOverride.value}</span>
                                  {indicator.unit && <span className="ml-1 text-muted-foreground">{indicator.unit}</span>}
                                </>
                              ) : indicator.vcgValue === null ? (
                                <span className="text-muted-foreground">—</span>
                              ) : (
                                <span className="font-semibold text-foreground">{indicator.vcgValue}</span>
                              )}
                            </div>
                            <div>
                              {pct === null ? null : indicator.vcgValue === null ? (
                                <div className="h-1.5 rounded-full border border-dashed border-foreground/20" />
                              ) : (
                                <div className="relative h-1.5 rounded-full bg-muted">
                                  <div className="absolute inset-y-0 left-0 rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                                  <span className="absolute top-1/2 h-2 w-0.5 -translate-y-1/2 bg-foreground/40" style={{ left: "50%" }} />
                                </div>
                              )}
                            </div>
                            <span className="text-right text-[9px] tabular-nums text-muted-foreground">{indicator.observedAt}</span>
                            <div className="flex justify-end gap-0.5">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground" title="Override history" onClick={(event) => event.stopPropagation()}>
                                    <History className="h-3.5 w-3.5" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-80 p-3" onClick={(event) => event.stopPropagation()}>
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Override history</p>
                                  {history.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">No overrides.</p> : history.map((record) => (
                                    <div key={record.id} className="mt-2 border-t border-border pt-2 text-[10px]">
                                      <div className="flex items-center justify-between gap-2"><span className="font-medium">{record.author}</span><span className="text-muted-foreground">{new Date(record.createdAt).toLocaleString()}</span></div>
                                      <p className="mt-0.5"><span className="font-medium">{record.operation === "revert" ? "Reverted" : record.value}</span> · {record.reason}</p>
                                    </div>
                                  ))}
                                </PopoverContent>
                              </Popover>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-6 w-6 p-0 text-muted-foreground ${currentUsersOverride ? "opacity-100" : "opacity-0 group-hover/indicator:opacity-100 focus-visible:opacity-100"}`}
                                title={currentUsersOverride ? "Edit your value" : "Add your value"}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOverrideIndicator(indicator);
                                  setOverrideValue(currentUsersOverride?.value ?? "");
                                  setOverrideReason("");
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-1 flex items-start justify-between gap-3 pl-[calc(100%-192px)] text-[9px] text-muted-foreground">
                            <span>VCG: {indicator.vcgValue ?? "—"}</span>
                            {currentUsersOverride && (
                              <Button size="sm" variant="ghost" className="h-4 gap-1 px-1 text-[9px] text-muted-foreground" title="Revert your value" onClick={(event) => { event.stopPropagation(); revertOverride(currentUsersOverride); }}>
                                <RotateCcw className="h-3 w-3" /> Revert
                              </Button>
                            )}
                          </div>
                          {indicatorOverrides.length > 0 && (
                            <div className="mt-1 space-y-0.5 text-[9px] text-muted-foreground">
                              {indicatorOverrides.map((record) => <p key={record.id}>{record.author} · {record.value}{indicator.unit ? ` ${indicator.unit}` : ""} · {new Date(record.createdAt).toLocaleString()} · {record.reason}</p>)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <Dialog open={Boolean(overrideIndicator)} onOpenChange={(open) => { if (!open) setOverrideIndicator(null); }}>
        <DialogContent className="sm:max-w-md" onClick={(event) => event.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-base">Add your value</DialogTitle>
            <DialogDescription>{overrideIndicator?.label}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-sm border border-border bg-muted/30 px-3 py-2 text-xs">
              <span className="text-muted-foreground">VCG value</span>
              <span className="ml-2 font-semibold text-foreground">{overrideIndicator?.vcgValue ?? "—"}</span>
            </div>
            <label className="block text-xs font-medium">
              Your value
              <div className="mt-1 flex items-center gap-2">
                <Input value={overrideValue} onChange={(event) => setOverrideValue(event.target.value)} className="h-8 text-xs" />
                {overrideIndicator?.unit && <span className="shrink-0 text-xs text-muted-foreground">{overrideIndicator.unit}</span>}
              </div>
            </label>
            <label className="block text-xs font-medium">
              Reason
              <Textarea value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} className="mt-1 min-h-[72px] text-xs" placeholder="Why should this value be used?" />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideIndicator(null)}>Cancel</Button>
            <Button onClick={saveOverride} disabled={!overrideValue.trim() || !overrideReason.trim()}>Save value</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PathwayMetricsChecklist;
