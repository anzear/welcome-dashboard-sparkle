import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRegister } from "@/components/materialRegister/registerStore";
import {
  canSetGate,
  formatDate,
  gateLockNote,
  holdReviewOverdue,
  outcomeBlockers,
} from "@/components/materialRegister/gate";
import ValidationChecklist from "@/components/pathway/ValidationChecklist";
import {
  VALIDATION_CHANGED_EVENT,
  VALIDATION_FUNCTIONS,
  countConfirmedFunctions,
  readValidationChecklist,
} from "@/lib/pathwayValidationChecklist";
import {
  JOURNEY_STATUS_LABEL,
  JOURNEY_STATUSES,
  type GateOutcome,
  type JourneyStatus,
  type Material,
} from "@/types/materialPrioritisation";

/**
 * THE GATE.
 *
 * The status is the headline: seven workflow stages. Nothing here is derived
 * from the assessment: every status is set by the owner, and detail is typed,
 * not suggested. The current stage carries one editable goal.
 */

/**
 * Four stages. NOT a sequence — the owner may set any stage at any time. There
 * is no ordering, locking, or left-to-right progression logic anywhere below.
 * The functions live as a checklist inside "In evaluation", not as stages.
 */
const STATUSES: JourneyStatus[] = JOURNEY_STATUSES;

/** Parked alone carries structured detail before the status is committed. */
const DETAIL_STAGES: JourneyStatus[] = ["parked"];

/** Categorical colour. Solid when set, quiet when not — never a gradient. */
const STATUS_FILL: Partial<Record<JourneyStatus, string>> = {
  not_started: "bg-muted-foreground text-background border-muted-foreground",
  in_evaluation: "bg-provenance-judgement text-white border-provenance-judgement",
  adopted: "bg-foreground text-background border-foreground",
  parked: "bg-amber-500 text-white border-amber-500",
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

/** Which pathway's Validation card this status card reads and writes. */
export interface GateValidationProgress {
  pathwayLabel: string;
  topic?: string;
  pathwayId: string | number;
}

const BriefGate: React.FC<{ material: Material; validation?: GateValidationProgress }> = ({
  material: m,
  validation,
}) => {
  const { currentUser, setGateOutcome, reopenGate } = useRegister();

  /**
   * Function progression. Each of the four functions is worth exactly
   * 100 / 4 = 25%, and counts only when BOTH its sub-items are ticked — no
   * partial credit. The bar reads ONLY the shared validation checklist; the
   * status stage never moves it. Exception: "Material integrated" is a manual
   * display override at 100%, leaving the checkboxes untouched.
   */
  const integrated = m.journey_status === "adopted";
  const evaluating = m.journey_status === "in_evaluation";

  const [confirmed, setConfirmed] = useState(() =>
    validation ? countConfirmedFunctions(readValidationChecklist(validation.topic, validation.pathwayId)) : 0,
  );

  useEffect(() => {
    if (!validation) return;
    const refresh = () =>
      setConfirmed(countConfirmedFunctions(readValidationChecklist(validation.topic, validation.pathwayId)));
    refresh();
    window.addEventListener(VALIDATION_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(VALIDATION_CHANGED_EVENT, refresh);
  }, [validation?.topic, validation?.pathwayId]);

  const total = VALIDATION_FUNCTIONS.length;
  const progressPercent = integrated ? 100 : Math.round((confirmed * 100) / total);


  const writable = canSetGate(m, currentUser.name);

  /** The status being drafted. Never seeded from a score or a recommendation. */
  const [pending, setPending] = useState<GateOutcome | null>(null);
  const [holdTrigger, setHoldTrigger] = useState("");
  const [holdReview, setHoldReview] = useState("");
  const [noGoReason, setNoGoReason] = useState("");


  const reviewLate = holdReviewOverdue(m);
  const decided = m.gate_decided_date !== null;

  const blockers = useMemo(
    () =>
      pending === null
        ? []
        : outcomeBlockers(pending, { conditions: [], holdTrigger, holdReview, noGoReason }),
    [pending, holdTrigger, holdReview, noGoReason],
  );

  const startPending = (o: GateOutcome) => {
    setPending(o);
    setHoldTrigger(o === "parked" ? (m.hold_trigger_event ?? "") : "");
    setHoldReview(o === "parked" ? (m.hold_review_date ?? "") : "");
    setNoGoReason(o === "parked" ? (m.no_go_reason ?? "") : "");
  };

  /** A click on a segment. Detail-carrying stages draft first, then commit. */
  const pickStatus = (s: JourneyStatus) => {
    if (!writable || s === m.journey_status) return;
    setPending(null);
    if (DETAIL_STAGES.includes(s)) {
      startPending(s as GateOutcome);
      return;
    }
    setGateOutcome(m.material_id, s, {});
  };

  const commitPending = () => {
    if (pending === null || blockers.length > 0) return;
    setGateOutcome(m.material_id, pending, {
      holdTrigger: holdTrigger.trim() || null,
      holdReview: holdReview || null,
      noGoReason: noGoReason.trim() || null,
    });
    setPending(null);
  };

  /** What the drafted status must carry, inline under the control. */
  const pendingDetail = pending && (
    <div className="space-y-2">
      {pending === "parked" && (
        <div className="space-y-1.5">
          <Textarea
            value={noGoReason}
            onChange={(e) => setNoGoReason(e.target.value)}
            rows={2}
            placeholder="Why this is parked. Specific enough that nobody re-litigates it in six months."
            className="text-[11px]"
          />
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

  const activeDetail = (
    <>


      {m.journey_status === "parked" && (
        <div className="space-y-1">
          {m.no_go_reason ? (
            <p className="text-[11px] leading-relaxed text-foreground">{m.no_go_reason}</p>
          ) : null}
          {m.hold_trigger_event || m.hold_review_date ? (
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
          ) : null}
          {!m.no_go_reason && !m.hold_trigger_event && !m.hold_review_date && (
            <p className="text-[11px] text-foreground">No reason recorded.</p>
          )}
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
    <div className="space-y-3">
      {/* Active flags first. Visual only — nothing here sends a notification. */}
      {(reviewLate || m.reopened) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {reviewLate && <Flag>Park review overdue</Flag>}
          {m.reopened && (
            <span className="rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              Reopened
            </span>
          )}
        </div>
      )}

      {/* The status is the headline. Seven stages, one row, no fixed order — any stage can be set at any time. */}
      <div className="space-y-1">
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
                  "flex-1 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
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

      {/*
        Function progression and checklist. Visible only under "In evaluation";
        hidden entirely for Not started, Material integrated and Parked. Both
        read and write the same store as the pathway Validation card.
      */}
      {validation && evaluating && (
        <div className="space-y-2 rounded-md border border-border">
          <div className="space-y-1 px-3 pt-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Function progression
              </span>
              <span className="tabular-nums text-[11px] font-semibold text-foreground">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/70 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] leading-snug text-muted-foreground">
              {confirmed} of {total} functions confirmed on {validation.pathwayLabel}. A function counts only when
              both of its sub-items are ticked.
            </p>
          </div>
          <div className="border-t border-border">
            <ValidationChecklist
              pathwayId={validation.pathwayId}
              topic={validation.topic}
              idPrefix="gate-validation"
            />
          </div>
        </div>
      )}

      {/* Material integrated is a manual display override: bar only, at 100%. */}
      {validation && integrated && (
        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Function progression
            </span>
            <span className="tabular-nums text-[11px] font-semibold text-foreground">100%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full rounded-full bg-emerald-600" />
          </div>
          <p className="text-[10px] leading-snug text-muted-foreground">
            Shown at 100% — status set to {JOURNEY_STATUS_LABEL.adopted}. The checklist is untouched underneath:{" "}
            {confirmed} of {total} functions confirmed on {validation.pathwayLabel}.
          </p>
        </div>
      )}

      {/* Detail belongs to a status, not to a section of its own. */}
      {pending !== null ? pendingDetail : activeDetail}

      {/* A parked decision that was reopened keeps its argument in plain sight. */}
      {m.previous_no_go && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Previously parked:</span> {m.previous_no_go.reason}{" "}
          <Stamp by={m.previous_no_go.author} date={m.previous_no_go.date} />
        </p>
      )}

    </div>
  );
};

export default BriefGate;
