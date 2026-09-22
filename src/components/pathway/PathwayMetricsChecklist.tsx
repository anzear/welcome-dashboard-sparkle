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
        <span className="text-[10px] text-muted-foreground">
          {reviewed > 0 ? `${reviewed} of ${metrics.length} confirmed` : `${metrics.length} criteria`}
        </span>
      </div>

      <div className="border-t border-border/40 px-3 py-2">
        <div
          className="flex h-0.5 w-full gap-1"
          role="progressbar"
          aria-valuenow={reviewed}
          aria-valuemin={0}
          aria-valuemax={metrics.length}
          aria-label="Criteria confirmed"
        >
          {groups.map((group) => {
            const confirmed = group.metrics.filter((metric) => state[metric.id]).length;
            const fill = (confirmed / group.metrics.length) * 100;
            return (
              <div key={group.label} className="h-full overflow-hidden bg-muted" style={{ flex: group.metrics.length }}>
                {confirmed > 0 && <div className="h-full bg-primary" style={{ width: `${fill}%` }} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-h-[520px] overflow-y-auto border-t border-border">
        {groups.map((group, groupIndex) => (
          <div key={group.label} className={groupIndex > 0 ? "mt-3" : undefined}>
            <div className="flex h-8 items-center px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              {group.label}
            </div>
            {group.metrics.map((metric, metricIndex) => {
              const entry = state[metric.id];
              const noteCount = commentCounts[metric.label] ?? 0;
              const evidenceText = metric.evidence === null || metric.evidence === undefined
                ? "Not available"
                : metric.evidence.filter(Boolean).join(" · ");

              return (
                <div
                  key={metric.id}
                  className={`group relative flex h-11 items-center gap-2 px-3 ${metricIndex > 0 ? "border-t border-border/40" : ""} ${entry ? "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-[11px] font-medium ${entry ? "text-muted-foreground" : "text-foreground"}`}>
                      {metric.label}
                    </div>
                    {evidenceText && <div className="truncate text-[11px] text-muted-foreground">{evidenceText}</div>}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {entry ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 px-2 text-[10px] text-primary hover:text-primary"
                        onClick={() => reset(metric)}
                        title="Revert to pending"
                      >
                        <Check className="h-3.5 w-3.5 fill-current" /> Confirmed
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 border border-transparent bg-transparent px-2 text-[10px] opacity-0 transition-[opacity,background-color,border-color] hover:border-border hover:bg-muted group-hover:opacity-100 focus-visible:opacity-100"
                        onClick={() => confirm(metric)}
                      >
                        <Check className="h-3 w-3" /> Confirm
                      </Button>
                    )}
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
                          className={`h-7 gap-1 px-1.5 text-[10px] transition-opacity ${noteCount > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"}`}
                          title={commentCounts[metric.label] ? "Notes" : "Add note"}
                        >
                          {noteCount > 0 ? (
                            <>
                              <MessageSquare className="h-3.5 w-3.5 fill-current" />
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
