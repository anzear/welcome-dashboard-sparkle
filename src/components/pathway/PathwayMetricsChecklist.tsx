import React, { useEffect, useMemo, useState } from "react";
import { Check, MessageSquare, MessageSquarePlus, Pencil, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  readValidationComments,
  writeValidationComments,
  VALIDATION_COMMENTS_CHANGED_EVENT,
  type ValidationComment,
} from "@/lib/pathwayValidationComments";

/**
 * VALIDATION CHECKLIST — the relevant pathway metrics, one row each.
 * The user either confirms the VCG.AI value or records their own value found
 * during their evaluation. Prototype persistence is localStorage.
 */

export interface ChecklistMetric {
  id: string;
  label: string;
  value: string;
  group?: string;
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
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState<ValidationComment[]>([]);
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    setState(read(topic, pathwayId));
    setEditing(null);
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

  const saveOwn = (metric: ChecklistMetric) => {
    if (!draft.trim()) return;
    persist({
      ...state,
      [metric.id]: { state: "own", ownValue: draft.trim(), by: currentUser, date: todayLabel() },
    });
    setEditing(null);
    setDraft("");
  };

  const reset = (metric: ChecklistMetric) => {
    const next = { ...state };
    delete next[metric.id];
    persist(next);
  };

  const reviewed = metrics.filter((m) => state[m.id]).length;
  const percent = metrics.length ? Math.round((reviewed / metrics.length) * 100) : 0;

  let lastGroup: string | undefined;

  return (
    <div className="mt-3 overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
          Validation checklist
        </span>
        <span className="text-[10px] text-muted-foreground">
          {reviewed} of {metrics.length} metrics reviewed · {percent}%
        </span>
      </div>

      <div className="border-t border-border/40 px-3 py-2">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Metric review progression"
        >
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto border-t border-border">
        {metrics.map((metric) => {
          const entry = state[metric.id];
          const isEditing = editing === metric.id;
          const showGroup = metric.group && metric.group !== lastGroup;
          lastGroup = metric.group;

          return (
            <React.Fragment key={metric.id}>
              {showGroup && (
                <div className="border-b border-border/40 bg-muted/30 px-3 py-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {metric.group}
                </div>
              )}
              <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-medium text-foreground">{metric.label}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="tabular-nums">VCG.AI: {metric.value}</span>
                    {entry?.state === "own" && (
                      <span className="tabular-nums font-medium text-foreground">
                        · Your value: {entry.ownValue}
                      </span>
                    )}
                    {entry && (
                      <span>
                        · {entry.by}, {entry.date}
                      </span>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <Input
                      autoFocus
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") saveOwn(metric);
                        if (event.key === "Escape") setEditing(null);
                      }}
                      placeholder="Your value"
                      className="h-7 w-[150px] text-xs"
                    />
                    <Button size="sm" className="h-7 px-2 text-[10px]" onClick={() => saveOwn(metric)}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => setEditing(null)}
                      aria-label="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    {entry ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                          <Check className="h-3 w-3" /> Confirmed
                        </span>
                        {entry.state === "own" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                            <Pencil className="h-3 w-3" /> Own value
                          </span>
                        )}
                      </>
                    ) : null}

                    {!entry && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2 text-[10px]"
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
                          className="h-7 gap-1 px-1.5 text-[10px]"
                          title={commentCounts[metric.label] ? "Notes" : "Add note"}
                        >
                          {commentCounts[metric.label] ? (
                            <>
                              <MessageSquare className="h-3.5 w-3.5 fill-current" />
                              {commentCounts[metric.label]}
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
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title={entry?.state === "own" ? "Edit own value" : "Own value"}
                      onClick={() => {
                        setEditing(metric.id);
                        setDraft(entry?.ownValue ?? "");
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {entry && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => reset(metric)}
                        aria-label="Reset metric"
                        title="Clear"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default PathwayMetricsChecklist;
