import React, { useEffect, useMemo, useState } from "react";
import { Check, MessageSquare, MessageSquarePlus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  readValidationComments,
  writeValidationComments,
  VALIDATION_COMMENTS_CHANGED_EVENT,
  type ValidationComment,
} from "@/lib/pathwayValidationComments";

/**
 * VALIDATION CHECKLIST — grouped pathway review criteria.
 * Confirmations and attributed notes use the existing localStorage stores.
 */

export interface ChecklistMetric {
  id: string;
  label: string;
  value: string;
  group?: string;
  /** Null means evidence has not loaded; an empty list means it loaded with no evidence. */
  evidence?: string[] | null;
}

type MetricEntry = {
  state: "confirmed" | "own";
  ownValue?: string;
  by: string;
  date: string;
};

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

  useEffect(() => {
    setState(read(topic, pathwayId));
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

  const persist = (next: MetricChecklistState) => {
    setState(next);
    try {
      localStorage.setItem(storageKey(topic, pathwayId), JSON.stringify(next));
    } catch {}
  };

  const confirm = (metric: ChecklistMetric) =>
    persist({
      ...state,
      [metric.id]: { state: "confirmed", by: currentUser, date: todayLabel() },
    });

  const reset = (metric: ChecklistMetric) => {
    const next = { ...state };
    delete next[metric.id];
    persist(next);
  };

  const reviewed = metrics.filter((m) => state[m.id]).length;
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

              return (
                <div
                  key={metric.id}
                  role="checkbox"
                  aria-checked={Boolean(entry)}
                  tabIndex={0}
                  onClick={() => entry ? reset(metric) : confirm(metric)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      entry ? reset(metric) : confirm(metric);
                    }
                  }}
                  className="group flex h-9 cursor-pointer items-center rounded-sm px-2 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span
                    className={`mr-3 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-[background-color,border-color] duration-[120ms] ${entry ? "border-primary bg-primary text-primary-foreground" : "border-border bg-transparent"}`}
                    aria-hidden="true"
                  >
                    {entry && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>

                  <span className={`min-w-0 flex-1 truncate text-left text-[13px] font-medium ${entry ? "text-muted-foreground" : "text-foreground"}`}>
                    {metric.label}
                  </span>

                  <div className="ml-2 flex min-w-[60px] shrink-0 justify-end">
                    {metric.evidence === null || metric.evidence === undefined ? (
                      <span className="h-2.5 w-[60px] animate-pulse rounded-sm bg-muted" aria-label="Evidence loading" />
                    ) : evidenceText ? (
                      <span className="max-w-[180px] truncate text-right text-[11px] text-muted-foreground">
                        {evidenceText}
                      </span>
                    ) : null}
                  </div>

                  <div className="ml-2 flex h-5 w-5 shrink-0 items-center justify-end">
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
                          className={`h-5 min-w-5 gap-0.5 p-0 text-[9px] transition-opacity ${noteCount > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"}`}
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
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PathwayMetricsChecklist;
