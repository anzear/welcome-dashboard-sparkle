import React, { useMemo, useState } from "react";
import { AlertTriangle, Check, Plus, RotateCcw, Trash2, X } from "lucide-react";
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
  todayIso,
} from "@/components/materialRegister/gate";
import {
  GATE_OUTCOME_LABEL,
  JOURNEY_STATUS_LABEL,
  type GateCondition,
  type GateOutcome,
  type Material,
} from "@/types/materialPrioritisation";

/**
 * THE GATE.
 *
 * Two acts, kept apart on purpose. The owner writes a recommendation — what
 * they think should happen, and why. Then the owner sets the outcome. Neither
 * is calculated from the assessment entries: one weak criterion must be able to
 * override four strong ones, and an average would bury exactly that override.
 * The outcome dropdown therefore opens empty, every time.
 */

const OUTCOMES: GateOutcome[] = ["go", "go_with_conditions", "hold", "no_go"];

const STATUS_CHIP: Record<string, string> = {
  under_evaluation: "border-border bg-muted text-muted-foreground",
  go: "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  go_with_conditions: "border-provenance-judgement/40 bg-provenance-judgement/10 text-provenance-judgement",
  hold: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  no_go: "border-destructive/40 bg-destructive/10 text-destructive",
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{children}</span>
);

const Stamp: React.FC<{ by: string | null; date: string | null }> = ({ by, date }) => (
  <span className="font-mono text-[10px] text-muted-foreground">
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

  const [recOpen, setRecOpen] = useState(false);
  const [recOutcome, setRecOutcome] = useState<GateOutcome | "">("");
  const [recText, setRecText] = useState("");

  const [decOpen, setDecOpen] = useState(false);
  /** Opens empty. Never seeded from the recommendation or from any score. */
  const [decOutcome, setDecOutcome] = useState<GateOutcome | "">("");
  const [conditions, setConditions] = useState<GateCondition[]>([]);
  const [holdTrigger, setHoldTrigger] = useState("");
  const [holdReview, setHoldReview] = useState("");
  const [noGoReason, setNoGoReason] = useState("");

  const [condOpen, setCondOpen] = useState(false);
  const [condDraft, setCondDraft] = useState<GateCondition[]>([]);

  const overdue = overdueConditions(m);
  const reviewLate = holdReviewOverdue(m);
  const complete = allConditionsMet(m);
  const decided = m.gate_decided_date !== null;
  const differs = rec !== null && decided && (rec.outcome as string) !== m.journey_status;

  const blockers = useMemo(
    () =>
      decOutcome === ""
        ? ["Choose an outcome."]
        : outcomeBlockers(decOutcome, { conditions, holdTrigger, holdReview, noGoReason }),
    [decOutcome, conditions, holdTrigger, holdReview, noGoReason],
  );

  const openRecommendation = () => {
    setRecOpen(true);
    setRecOutcome(rec?.outcome ?? "");
    setRecText(rec?.text ?? "");
  };

  const openDecision = () => {
    setDecOpen(true);
    setDecOutcome("");
    setConditions([]);
    setHoldTrigger(m.hold_trigger_event ?? "");
    setHoldReview(m.hold_review_date ?? "");
    setNoGoReason("");
  };

  const commitDecision = () => {
    if (decOutcome === "" || blockers.length > 0) return;
    setGateOutcome(m.material_id, decOutcome, {
      conditions: conditions.map((c) => ({ ...c, text: c.text.trim() })),
      holdTrigger: holdTrigger.trim() || null,
      holdReview: holdReview || null,
      noGoReason: noGoReason.trim() || null,
    });
    setDecOpen(false);
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
              <SelectContent>
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
              className="h-7 font-mono text-[11px]"
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

  return (
    <div className="space-y-3">
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

      {/* A no-go that was reopened keeps its argument in plain sight. */}
      {m.previous_no_go && (
        <div className="rounded-md border border-border/70 bg-muted/40 p-2.5">
          <p className="text-[11px] leading-relaxed text-foreground">
            <span className="font-medium">Previously no-go:</span> {m.previous_no_go.reason}
          </p>
          <Stamp by={m.previous_no_go.author} date={m.previous_no_go.date} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium",
            STATUS_CHIP[m.journey_status],
          )}
        >
          {JOURNEY_STATUS_LABEL[m.journey_status]}
        </span>
        {decided && <Stamp by={m.gate_decided_by} date={m.gate_decided_date} />}
      </div>

      {differs && (
        <p className="text-[11px] text-foreground">
          Recommended: <span className="font-medium">{GATE_OUTCOME_LABEL[rec.outcome]}</span> · Decided:{" "}
          <span className="font-medium">{JOURNEY_STATUS_LABEL[m.journey_status]}</span>
        </p>
      )}

      {/* ---------------------------------------------------------- step 1 */}
      <div className="space-y-1.5 border-t border-border/60 pt-2.5">
        <Label>Recommendation</Label>
        {rec && !recOpen && (
          <div className="space-y-1">
            <p className="text-[11px] text-foreground">
              <span className="font-medium">{GATE_OUTCOME_LABEL[rec.outcome]}</span> — {rec.text}
            </p>
            <Stamp by={rec.author} date={rec.date} />
          </div>
        )}
        {!rec && !recOpen && (
          <p className="text-[11px] text-muted-foreground">
            Nobody has written a recommendation. It is a judgement, not a calculation.
          </p>
        )}

        {recOpen ? (
          <div className="space-y-2 rounded-md border border-border/70 bg-background p-2">
            <Select value={recOutcome} onValueChange={(v) => setRecOutcome(v as GateOutcome)}>
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue placeholder="What should happen?" />
              </SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((o) => (
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
              placeholder="Why. Weigh the assessment entries against each other — say what matters most and what you are discounting."
              className="text-[11px]"
            />
            <div className="flex items-center gap-2">
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
              <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setRecOpen(false)}>
                Cancel
              </Button>
              {recText.trim() === "" && (
                <span className="text-[10px] text-muted-foreground">Reasoning is required.</span>
              )}
            </div>
          </div>
        ) : (
          writable && (
            <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={openRecommendation}>
              {rec ? "Edit recommendation" : "Add recommendation"}
            </Button>
          )
        )}
      </div>

      {/* ---------------------------------------------------------- step 2 */}
      <div className="space-y-1.5 border-t border-border/60 pt-2.5">
        <Label>Gate outcome</Label>
        {decided ? (
          <p className="text-[11px] text-foreground">
            {JOURNEY_STATUS_LABEL[m.journey_status]} · <Stamp by={m.gate_decided_by} date={m.gate_decided_date} />
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">No decision recorded.</p>
        )}

        {decOpen ? (
          <div className="space-y-2 rounded-md border border-border/70 bg-background p-2">
            <Select value={decOutcome} onValueChange={(v) => setDecOutcome(v as GateOutcome)}>
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue placeholder="Decide the outcome" />
              </SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((o) => (
                  <SelectItem key={o} value={o} className="text-xs">
                    {GATE_OUTCOME_LABEL[o]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {decOutcome === "go_with_conditions" && (
              <ConditionEditor rows={conditions} setRows={setConditions} />
            )}

            {decOutcome === "hold" && (
              <div className="space-y-1.5">
                <Input
                  value={holdTrigger}
                  onChange={(e) => setHoldTrigger(e.target.value)}
                  placeholder="e.g. Marketing completes consumer claim research"
                  className="h-7 text-[11px]"
                />
                <Input
                  type="date"
                  value={holdReview}
                  onChange={(e) => setHoldReview(e.target.value)}
                  className="h-7 font-mono text-[11px]"
                />
                <p className="text-[10px] text-muted-foreground">
                  The event is the real reason. The review date is what stops this sitting untouched for two years.
                </p>
              </div>
            )}

            {decOutcome === "no_go" && (
              <div className="space-y-1.5">
                <Textarea
                  value={noGoReason}
                  onChange={(e) => setNoGoReason(e.target.value)}
                  rows={2}
                  placeholder="Why not. Specific enough that nobody re-litigates it in six months."
                  className="text-[11px]"
                />
                <p className="text-[10px] text-muted-foreground">
                  Kept permanently, so this is not re-argued from scratch later.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="h-7 text-[11px]" disabled={blockers.length > 0} onClick={commitDecision}>
                Set gate
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setDecOpen(false)}>
                Cancel
              </Button>
              {blockers.length > 0 && decOutcome !== "" && (
                <span className="text-[10px] text-amber-700 dark:text-amber-400">{blockers[0]}</span>
              )}
            </div>
          </div>
        ) : (
          writable && (
            <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={openDecision}>
              {decided ? "Change gate outcome" : "Set gate outcome"}
            </Button>
          )
        )}

        {!writable && <p className="text-[10px] text-muted-foreground">{gateLockNote(m)}</p>}
      </div>

      {/* ------------------------------------------------- outcome payload */}
      {m.journey_status === "go_with_conditions" && (
        <div className="space-y-2 border-t border-border/60 pt-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <Label>Conditions</Label>
            {writable && !condOpen && m.gate_conditions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCondDraft(m.gate_conditions);
                  setCondOpen(true);
                }}
                className="text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                Edit
              </button>
            )}
          </div>

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
                <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setCondOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {m.gate_conditions.map((c) => {
                const late = !c.met && datePassed(c.due_date);
                return (
                  <li
                    key={c.condition_id}
                    className={cn(
                      "flex items-start gap-2 rounded-md border p-2",
                      late ? "border-amber-500/50 bg-amber-500/5" : "border-border/70 bg-muted/30",
                    )}
                  >
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
                      <p className={cn("text-[11px] text-foreground", c.met && "line-through opacity-70")}>{c.text}</p>
                      <div className="flex flex-wrap items-center gap-x-2 font-mono text-[10px] text-muted-foreground">
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
          )}

          {/* Every condition met earns a prompt, never an automatic flip. */}
          {complete && !condOpen && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-provenance-judgement/40 bg-provenance-judgement/10 p-2">
              <span className="text-[11px] text-foreground">
                All {m.gate_conditions.length} conditions met. Move to Go?
              </span>
              {writable ? (
                <Button
                  size="sm"
                  className="h-6 text-[11px]"
                  onClick={() => setGateOutcome(m.material_id, "go", {})}
                >
                  Move to Go
                </Button>
              ) : (
                <span className="text-[10px] text-muted-foreground">{gateLockNote(m)}</span>
              )}
            </div>
          )}
        </div>
      )}

      {m.journey_status === "hold" && (
        <div className="space-y-1 border-t border-border/60 pt-2.5">
          <Label>On hold until</Label>
          <p className="text-[11px] text-foreground">{m.hold_trigger_event ?? "No trigger recorded."}</p>
          <p className={cn("font-mono text-[10px]", reviewLate ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
            Review {formatDate(m.hold_review_date)}
            {reviewLate && " · overdue"}
          </p>
        </div>
      )}

      {m.journey_status === "no_go" && (
        <div className="space-y-1.5 border-t border-border/60 pt-2.5">
          <Label>No-go reason</Label>
          <p className="text-[11px] leading-relaxed text-foreground">{m.no_go_reason ?? "No reason recorded."}</p>
          {writable && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-[11px]"
              onClick={() => reopenGate(m.material_id, null)}
            >
              <RotateCcw className="h-3 w-3" /> Reopen
            </Button>
          )}
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        The gate is a judgement, not an output. Nothing here is derived from the assessment scores, and a gate never
        advances itself — {todayIso() && "someone decides"}.
      </p>
    </div>
  );
};

export default BriefGate;
