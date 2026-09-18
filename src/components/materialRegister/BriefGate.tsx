import React, { useMemo, useState } from "react";
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
import {
  JOURNEY_STATUS_LABEL,
  type GateOutcome,
  type GoalStage,
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

/** The seven stages, in workflow order. */
const STATUSES: JourneyStatus[] = [
  "not_started",
  "in_evaluation",
  "in_testing",
  "in_development",
  "in_deployment",
  "adopted",
  "parked",
];

/** Parked alone carries structured detail before the status is committed. */
const DETAIL_STAGES: JourneyStatus[] = ["parked"];

/** Categorical colour. Solid when set, quiet when not — never a gradient. */
const STATUS_FILL: Record<JourneyStatus, string> = {
  not_started: "bg-muted-foreground text-background border-muted-foreground",
  in_evaluation: "bg-provenance-judgement text-white border-provenance-judgement",
  in_testing: "bg-violet-600 text-white border-violet-600",
  in_development: "bg-emerald-600 text-white border-emerald-600",
  in_deployment: "bg-sky-600 text-white border-sky-600",
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

/** Read-only summary of one pathway's validation checkboxes. */
export interface GateValidationProgress {
  pathwayLabel: string;
  confirmed: number;
  total: number;
}

const BriefGate: React.FC<{ material: Material; validation?: GateValidationProgress }> = ({
  material: m,
  validation,
}) => {
  const { currentUser, saveStageGoal, setGateOutcome, reopenGate } = useRegister();

  /** "Material integrated" is a manual override: the bar reads 100%, the checkboxes do not change. */
  const integrated = m.journey_status === "adopted";
  const progressPercent = integrated
    ? 100
    : validation && validation.total > 0
      ? Math.round((validation.confirmed / validation.total) * 100)
      : 0;

  const writable = canSetGate(m, currentUser.name);

  /** The status being drafted. Never seeded from a score or a recommendation. */
  const [pending, setPending] = useState<GateOutcome | null>(null);
  const [holdTrigger, setHoldTrigger] = useState("");
  const [holdReview, setHoldReview] = useState("");
  const [noGoReason, setNoGoReason] = useState("");

  const [goalOpen, setGoalOpen] = useState(false);
  const [goalText, setGoalText] = useState("");

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
    setGoalOpen(false);
    setGoalText("");
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

  /** What the status that is actually set carries. Only ever the active one. */
  const currentGoal = m.journey_status === "parked" ? undefined : m.stage_goals?.[m.journey_status];

  const activeDetail = (
    <>
      {m.journey_status !== "parked" &&
        (goalOpen ? (
          <div className="space-y-2">
            <Textarea
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              rows={3}
              placeholder="What's the goal for this stage."
              className="text-[11px]"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="h-7 text-[11px]"
                disabled={goalText.trim() === ""}
                onClick={() => {
                  saveStageGoal(m.material_id, m.journey_status as GoalStage, goalText.trim());
                  setGoalOpen(false);
                }}
              >
                Save goal
              </Button>
              <button type="button" onClick={() => setGoalOpen(false)} className={LINK}>
                Cancel
              </button>
            </div>
          </div>
        ) : currentGoal ? (
          <div className="space-y-1">
            <p
              role={writable ? "button" : undefined}
              tabIndex={writable ? 0 : undefined}
              onClick={() => {
                if (!writable) return;
                setGoalText(currentGoal.text);
                setGoalOpen(true);
              }}
              className={cn(
                "text-[11px] leading-relaxed text-foreground",
                writable && "cursor-text hover:text-foreground/80",
              )}
            >
              {currentGoal.text}
            </p>
            <Stamp by={currentGoal.author} date={currentGoal.date} />
          </div>
        ) : (
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[11px] text-muted-foreground">No goal set for this stage.</span>
            {writable && (
              <button
                type="button"
                onClick={() => {
                  setGoalText("");
                  setGoalOpen(true);
                }}
                className={LINK}
              >
                Add
              </button>
            )}
          </div>
        ))}

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

      {/* The status is the headline. Seven stages, one row, in workflow order. */}
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

      {/* Function progression, read from the pathway validation checkboxes. */}
      {validation && (
        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Function progression
            </span>
            <span className="tabular-nums text-[11px] font-semibold text-foreground">
              {progressPercent}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", integrated ? "bg-emerald-600" : "bg-foreground/70")}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] leading-snug text-muted-foreground">
            {integrated ? (
              <>
                Forced to 100% — status set to {JOURNEY_STATUS_LABEL.adopted}. Checkboxes unchanged:{" "}
                {validation.confirmed} of {validation.total} confirmed on {validation.pathwayLabel}.
              </>
            ) : (
              <>
                {validation.confirmed} of {validation.total} functions confirmed on {validation.pathwayLabel}.
              </>
            )}
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
