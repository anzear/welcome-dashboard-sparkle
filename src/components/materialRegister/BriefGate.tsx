import React, { useMemo, useState } from "react";
import { AlertTriangle, Check, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEMO_USER_NAMES } from "@/config/assessmentCriteria";
import { useRegister } from "@/components/materialRegister/registerStore";
import {
  allConditionsMet,
  canSetGate,
  datePassed,
  formatDate,
  gateLockNote,
  holdReviewOverdue,
  outcomeBlockers,
  overdueConditions,
} from "@/components/materialRegister/gate";
import {
  GATE_OUTCOME_LABEL,
  JOURNEY_STATUS_LABEL,
  type GateCondition,
  type GateOutcome,
  type JourneyStatus,
  type Material,
} from "@/types/materialPrioritisation";

/**
 * THE GATE.
 *
 * The status is the headline: a segmented control of five categories. They are
 * categories, not a scale — a material can go straight from Under evaluation to
 * Go, and No-go is not the far end of anything. Nothing here is derived from the
 * assessment: every status is set by the owner, and detail is typed, not
 * suggested. The recommendation sits at the foot, read after the call.
 */

/** The five gate values, in a fixed reading order that carries no ranking. */
const STATUSES: JourneyStatus[] = ["under_evaluation", "hold", "go_with_conditions", "go", "no_go"];

/** Categorical colour. Solid when set, quiet when not — never a gradient. */
const STATUS_FILL: Record<JourneyStatus, string> = {
  under_evaluation: "bg-muted-foreground text-background border-muted-foreground",
  hold: "bg-amber-500 text-white border-amber-500",
  go_with_conditions: "bg-provenance-judgement text-white border-provenance-judgement",
  go: "bg-emerald-600 text-white border-emerald-600",
  no_go: "bg-destructive text-destructive-foreground border-destructive",
};

const LINK =
  "text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground";

const Stamp: React.FC<{ by: string | null; date: string | null }> = ({ by, date }) => (
  <span className="tabular-nums text-[10px] text-muted-foreground">
    {by ?? "Unknown"} · {formatDate(date)}
  </span>
);

const Flag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1 rounded-sm border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
    <AlertTriangle className="h-3 w-3" />
    {children}
  </span>
);

const emptyCondition = (n: number): GateCondition => ({
  condition_id: `new-${n}-${Math.random().toString(36).slice(2, 7)}`,
  text: "",
  owner: DEMO_USER_NAMES[0],
  due_date: "",
  met: false,
  met_date: null,
  met_by: null,
});

const BriefGate: React.FC<{ material: Material }> = ({ material: m }) => {
  const { currentUser, saveRecommendation, setGateOutcome, toggleCondition, saveConditions, reopenGate } =
    useRegister();

  const writable = canSetGate(m, currentUser.name);
  const rec = m.recommendation;

  /** The status being drafted. Never seeded from a score or a recommendation. */
  const [pending, setPending] = useState<GateOutcome | null>(null);
  const [conditions, setConditions] = useState<GateCondition[]>([]);
  const [holdTrigger, setHoldTrigger] = useState("");
  const [holdReview, setHoldReview] = useState("");
  const [noGoReason, setNoGoReason] = useState("");

  const [recOpen, setRecOpen] = useState(false);
  const [recOutcome, setRecOutcome] = useState<GateOutcome | "">("");
  const [recText, setRecText] = useState("");

  const [condOpen, setCondOpen] = useState(false);
  const [condDraft, setCondDraft] = useState<GateCondition[]>([]);

  const overdue = overdueConditions(m);
  const reviewLate = holdReviewOverdue(m);
  const complete = allConditionsMet(m);
  const decided = m.gate_decided_date !== null;
  const differs = rec !== null && decided && (rec.outcome as string) !== m.journey_status;

  const blockers = useMemo(
    () =>
      pending === null
        ? []
        : outcomeBlockers(pending, { conditions, holdTrigger, holdReview, noGoReason }),
    [pending, conditions, holdTrigger, holdReview, noGoReason],
  );

  const startPending = (o: GateOutcome) => {
    setPending(o);
    setConditions(o === "go_with_conditions" ? [emptyCondition(0)] : []);
    setHoldTrigger(o === "hold" ? (m.hold_trigger_event ?? "") : "");
    setHoldReview(o === "hold" ? (m.hold_review_date ?? "") : "");
    setNoGoReason("");
  };

  /** A click on a segment. Detail-carrying statuses draft first, then commit. */
  const pickStatus = (s: JourneyStatus) => {
    if (!writable || s === m.journey_status) return;
    setPending(null);
    if (s === "under_evaluation") {
      reopenGate(m.material_id, null);
      return;
    }
    if (s === "go") {
      setGateOutcome(m.material_id, "go", {});
      return;
    }
    startPending(s);
  };

  const commitPending = () => {
    if (pending === null || blockers.length > 0) return;
    setGateOutcome(m.material_id, pending, {
      conditions: conditions.map((c) => ({ ...c, text: c.text.trim() })),
      holdTrigger: holdTrigger.trim() || null,
      holdReview: holdReview || null,
      noGoReason: noGoReason.trim() || null,
    });
    setPending(null);
  };

  const ConditionEditor: React.FC<{
    rows: GateCondition[];
    setRows: (r: GateCondition[]) => void;
  }> = ({ rows, setRows }) => (
    <div className="space-y-2">
      {rows.map((c, i) => (
        <div key={c.condition_id} className="space-y-1.5 rounded-md border border-border/70 bg-background p-2">
          <div className="flex items-start gap-1.5">
            <Input
              value={c.text}
              onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))}
              placeholder="e.g. Second supplier qualified outside SE Asia"
              className="h-7 text-[11px]"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground"
              onClick={() => setRows(rows.filter((_, k) => k !== i))}
              aria-label="Remove condition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Select
              value={c.owner}
              onValueChange={(v) => setRows(rows.map((x, k) => (k === i ? { ...x, owner: v } : x)))}
            >
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent className="portfolio-type">
                {DEMO_USER_NAMES.map((n) => (
                  <SelectItem key={n} value={n} className="text-xs">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={c.due_date}
              onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, due_date: e.target.value } : x)))}
              className="h-7 tabular-nums text-[11px]"
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1 text-[11px]"
        onClick={() => setRows([...rows, emptyCondition(rows.length)])}
      >
        <Plus className="h-3 w-3" /> Add condition
      </Button>
    </div>
  );

  /** What the drafted status must carry, inline under the control. */
  const pendingDetail = pending && (
    <div className="space-y-2">
      {pending === "go_with_conditions" && <ConditionEditor rows={conditions} setRows={setConditions} />}

      {pending === "hold" && (
        <div className="space-y-1.5">
          <Input
            value={holdTrigger}
            onChange={(e) => setHoldTrigger(e.target.value)}
            placeholder="What has to happen before this moves"
            className="h-7 text-[11px]"
          />
          <Input
            type="date"
            value={holdReview}
            onChange={(e) => setHoldReview(e.target.value)}
            className="h-7 w-40 tabular-nums text-[11px]"
          />
        </div>
      )}

      {pending === "no_go" && (
        <Textarea
          value={noGoReason}
          onChange={(e) => setNoGoReason(e.target.value)}
          rows={2}
          placeholder="Why not. Specific enough that nobody re-litigates it in six months."
          className="text-[11px]"
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" className="h-7 text-[11px]" disabled={blockers.length > 0} onClick={commitPending}>
          Set {JOURNEY_STATUS_LABEL[pending].toLowerCase()}
        </Button>
        <button type="button" onClick={() => setPending(null)} className={LINK}>
          Cancel
        </button>
        {blockers.length > 0 && (
          <span className="text-[10px] text-amber-700 dark:text-amber-400">{blockers[0]}</span>
        )}
      </div>
    </div>
  );

  /** What the status that is actually set carries. Only ever the active one. */
  const activeDetail = (
    <>
      {m.journey_status === "go_with_conditions" && (
        <div className="space-y-2">
          {condOpen ? (
            <div className="space-y-2">
              <ConditionEditor rows={condDraft} setRows={setCondDraft} />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-7 text-[11px]"
                  disabled={
                    outcomeBlockers("go_with_conditions", {
                      conditions: condDraft,
                      holdTrigger: "",
                      holdReview: "",
                      noGoReason: "",
                    }).length > 0
                  }
                  onClick={() => {
                    saveConditions(m.material_id, condDraft);
                    setCondOpen(false);
                  }}
                >
                  Save conditions
                </Button>
                <button type="button" onClick={() => setCondOpen(false)} className={LINK}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <ul className="space-y-1.5">
                {m.gate_conditions.map((c) => {
                  const late = !c.met && datePassed(c.due_date);
                  return (
                    <li key={c.condition_id} className="flex items-start gap-2">
                      {/* Anyone can report a condition met — the ticker is stamped. */}
                      <button
                        type="button"
                        onClick={() => toggleCondition(m.material_id, c.condition_id, !c.met)}
                        aria-label={c.met ? "Mark not met" : "Mark met"}
                        className={cn(
                          "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-sm border",
                          c.met
                            ? "border-emerald-600/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "border-border bg-background text-transparent hover:border-foreground/40",
                        )}
                      >
                        {c.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      </button>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className={cn("text-[11px] text-foreground", c.met && "line-through opacity-70")}>
                          {c.text}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 tabular-nums text-[10px] text-muted-foreground">
                          <span>{c.owner}</span>
                          <span>due {formatDate(c.due_date)}</span>
                          {late && <span className="text-amber-700 dark:text-amber-400">overdue</span>}
                          {c.met && (
                            <span>
                              met {formatDate(c.met_date)} · {c.met_by}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-wrap items-center gap-3">
                {writable && m.gate_conditions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCondDraft(m.gate_conditions);
                      setCondOpen(true);
                    }}
                    className={LINK}
                  >
                    Edit conditions
                  </button>
                )}
                {/* Every condition met earns a prompt, never an automatic flip. */}
                {complete && writable && (
                  <button
                    type="button"
                    onClick={() => setGateOutcome(m.material_id, "go", {})}
                    className={LINK}
                  >
                    All {m.gate_conditions.length} met — move to Go
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {m.journey_status === "hold" && (
        <div className="space-y-0.5">
          <p className="text-[11px] text-foreground">{m.hold_trigger_event ?? "No trigger recorded."}</p>
          <p
            className={cn(
              "tabular-nums text-[10px]",
              reviewLate ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground",
            )}
          >
            Review {formatDate(m.hold_review_date)}
            {reviewLate && " · overdue"}
          </p>
        </div>
      )}

      {m.journey_status === "no_go" && (
        <div className="space-y-1">
          <p className="text-[11px] leading-relaxed text-foreground">{m.no_go_reason ?? "No reason recorded."}</p>
          {writable && (
            <button type="button" onClick={() => reopenGate(m.material_id, null)} className={LINK}>
              Reopen
            </button>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      {/* Active flags first. Visual only — nothing here sends a notification. */}
      {(overdue.length > 0 || reviewLate || m.reopened) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {overdue.length > 0 && (
            <Flag>
              {overdue.length} condition{overdue.length === 1 ? "" : "s"} overdue
            </Flag>
          )}
          {reviewLate && <Flag>Hold review overdue</Flag>}
          {m.reopened && (
            <span className="rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              Reopened
            </span>
          )}
        </div>
      )}

      {/* The status is the headline. Five categories, one row, no order implied. */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => {
            const active = s === m.journey_status;
            const drafting = pending !== null && (pending as string) === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                disabled={!writable}
                onClick={() => pickStatus(s)}
                className={cn(
                  "flex-1 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  active
                    ? STATUS_FILL[s]
                    : drafting
                      ? "border-foreground/40 bg-muted text-foreground"
                      : "border-border bg-transparent text-muted-foreground",
                  !active && !drafting && writable && "hover:border-foreground/40 hover:text-foreground",
                  !writable && "cursor-default",
                )}
              >
                {JOURNEY_STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {decided ? (
            <Stamp by={m.gate_decided_by} date={m.gate_decided_date} />
          ) : (
            <span className="text-[10px] text-muted-foreground">Not set.</span>
          )}
          {!writable && <span className="text-[10px] text-muted-foreground">{gateLockNote(m)}</span>}
        </div>
      </div>

      {/* Detail belongs to a status, not to a section of its own. */}
      {pending !== null ? pendingDetail : activeDetail}

      {/* A no-go that was reopened keeps its argument in plain sight. */}
      {m.previous_no_go && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Previously no-go:</span> {m.previous_no_go.reason}{" "}
          <Stamp by={m.previous_no_go.author} date={m.previous_no_go.date} />
        </p>
      )}

      {/* ------------------------------------------------ the reasoning, last */}
      {recOpen ? (
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Recommendation</span>
          <Select value={recOutcome} onValueChange={(v) => setRecOutcome(v as GateOutcome)}>
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue placeholder="What should happen?" />
            </SelectTrigger>
            <SelectContent className="portfolio-type">
              {(["go", "go_with_conditions", "hold", "no_go"] as GateOutcome[]).map((o) => (
                <SelectItem key={o} value={o} className="text-xs">
                  {GATE_OUTCOME_LABEL[o]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={recText}
            onChange={(e) => setRecText(e.target.value)}
            rows={3}
            placeholder="Why. Say what matters most and what you are discounting."
            className="text-[11px]"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="h-7 text-[11px]"
              disabled={recOutcome === "" || recText.trim() === ""}
              onClick={() => {
                if (recOutcome === "") return;
                saveRecommendation(m.material_id, recOutcome, recText);
                setRecOpen(false);
              }}
            >
              Save recommendation
            </Button>
            <button type="button" onClick={() => setRecOpen(false)} className={LINK}>
              Cancel
            </button>
            {recText.trim() === "" && (
              <span className="text-[10px] text-muted-foreground">Reasoning is required.</span>
            )}
          </div>
        </div>
      ) : rec ? (
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Recommendation</span>
          <p
            role={writable ? "button" : undefined}
            tabIndex={writable ? 0 : undefined}
            onClick={() => {
              if (!writable) return;
              setRecOutcome(rec.outcome);
              setRecText(rec.text);
              setRecOpen(true);
            }}
            className={cn(
              "text-[11px] leading-relaxed text-foreground",
              writable && "cursor-text hover:text-foreground/80",
            )}
          >
            {rec.text}
          </p>
          <Stamp by={rec.author} date={rec.date} />
          {differs && (
            <p className="text-[10px] text-muted-foreground">
              Recommended {GATE_OUTCOME_LABEL[rec.outcome]}.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-[11px] text-muted-foreground">No recommendation written.</span>
          {writable && (
            <button
              type="button"
              onClick={() => {
                setRecOutcome("");
                setRecText("");
                setRecOpen(true);
              }}
              className={LINK}
            >
              Add
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BriefGate;
