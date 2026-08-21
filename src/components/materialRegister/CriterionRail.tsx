import React from "react";
import { cn } from "@/lib/utils";
import { SCORE_POINTS, TEAM_LABEL, initialsOf, contributorById } from "@/config/assessmentCriteria";
import { shortDate } from "@/components/materialRegister/primitives";
import type { AssessmentEntry, MaterialRole } from "@/types/materialPrioritisation";

/** Short ends of the 1-5 scale. Replaces the permanent anchor paragraph. */
export const RAIL_ENDS: Record<string, { low: string; high: string }> = {
  risk_of_inaction: { low: "Incumbent fine", high: "Pressure is real" },
  market_pull: { low: "No demand signal", high: "Customers asking" },
  economic_case: { low: "Worse economics", high: "Economics improve" },
  supply_security: { low: "No improvement", high: "Materially more secure" },
};

/** Same scale, same criteria — the question is why to replace, not why to add. */
export const RAIL_ENDS_EXISTING: Record<string, { low: string; high: string }> = {
  risk_of_inaction: { low: "No pressure", high: "Pressure is real" },
  market_pull: { low: "No demand signal", high: "Customers pushing" },
  economic_case: { low: "Economics hold up", high: "Economics deteriorating" },
  supply_security: { low: "Supply secure", high: "Supply fragile" },
};

const FALLBACK_ENDS = { low: "Weak case", high: "Strong case" };

export const railEnds = (criterionId: string, role: MaterialRole = "new") =>
  (role === "existing" ? RAIL_ENDS_EXISTING[criterionId] : RAIL_ENDS[criterionId]) ??
  RAIL_ENDS[criterionId] ??
  FALLBACK_ENDS;


/** Position of a score on the track, as a percentage of the usable width. */
const pct = (score: number) => ((score - 1) / (SCORE_POINTS.length - 1)) * 100;

const nameOf = (entry: AssessmentEntry) => contributorById(entry.user_id)?.name ?? entry.user_id;

const entryTitle = (entry: AssessmentEntry) =>
  `${nameOf(entry)} (${TEAM_LABEL[entry.team]}) · ${entry.score}${
    entry.note ? ` — ${entry.note}` : ""
  } · ${shortDate(entry.assessed_at)}`;

/**
 * The score rail. A 1-5 track carrying one dot per contributor, a spread bar
 * when they disagree. The middle of a spread is never marked: there is no
 * average here.
 */
const CriterionRail: React.FC<{
  criterionId: string;
  criterionLabel: string;
  /** Every entry carries a 1–5 score. */
  scored: AssessmentEntry[];
  currentUserId: string;
  /** Score being drafted right now, before it is saved. */
  draft: number | null;
  /** Open the inline editor at this score. */
  onPick: (score: number) => void;
  /** Reopen the current user's own entry. */
  onEditMine: () => void;
  /** Keep the pick positions visible — used while scoring. */
  picking?: boolean;
  /** Only the wording of the ends changes with the material's role. */
  role?: MaterialRole;
}> = ({
  criterionId,
  criterionLabel,
  scored,
  currentUserId,
  draft,
  onPick,
  onEditMine,
  picking = false,
  role = "new",
}) => {
  const ends = railEnds(criterionId, role);

  const empty = scored.length === 0;
  const low = empty ? null : Math.min(...scored.map((e) => e.score as number));
  const high = empty ? null : Math.max(...scored.map((e) => e.score as number));
  const spread = low !== null && high !== null && high > low;

  /** Contributors sharing a score nudge apart so every dot stays its own. */
  const byScore = new Map<number, AssessmentEntry[]>();
  scored.forEach((e) => {
    const s = e.score as number;
    byScore.set(s, [...(byScore.get(s) ?? []), e]);
  });

  return (
    <div className="group/rail">
      <div className="flex items-center gap-3">
        <span className="w-2 shrink-0 tabular-nums text-[10px] text-muted-foreground/70">1</span>

        <div className="relative mx-2.5 h-5 flex-1">
          {/* track */}
          <div
            className={cn(
              "absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full",
              empty ? "bg-border/50" : "bg-border",
            )}
          />

          {/* tick positions */}
          {SCORE_POINTS.map((p) => (
            <span
              key={`tick-${p}`}
              aria-hidden
              className={cn(
                "absolute top-1/2 h-[6px] w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full",
                empty ? "bg-border/50" : "bg-border",
              )}
              style={{ left: `${pct(p)}%` }}
            />
          ))}

          {/* spread bar — the disagreement, with no midpoint marked */}
          {spread && (
            <div
              className="absolute top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-provenance-judgement/25"
              style={{ left: `${pct(low!)}%`, width: `${pct(high!) - pct(low!)}%` }}
            />
          )}

          {/* pick zones — a ghost dot appears on hover, and on the drafted score */}
          {SCORE_POINTS.map((p) => (
            <button
              key={`pick-${p}`}
              type="button"
              aria-label={`Score ${criterionLabel} ${p}`}
              onClick={() => onPick(p)}
              className="absolute top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ left: `${pct(p)}%` }}
            >
              <span
                className={cn(
                  "h-[18px] w-[18px] rounded-full border border-dashed transition-opacity",
                  draft === p
                    ? "border-provenance-judgement bg-provenance-judgement/20 opacity-100"
                    : cn(
                        "border-provenance-judgement/50 group-hover/rail:opacity-70",
                        picking ? "opacity-60" : "opacity-25",
                      ),
                )}
              />
            </button>
          ))}

          {/* one dot per contributor */}
          {[...byScore.entries()].map(([score, list]) =>
            list.map((e, i) => {
              const isMine = e.user_id === currentUserId;
              const nudge = (i - (list.length - 1) / 2) * 9;
              return (
                <button
                  key={e.user_id}
                  type="button"
                  title={entryTitle(e)}
                  onClick={() => (isMine ? onEditMine() : undefined)}
                  className={cn(
                    "absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-provenance-judgement",
                    isMine
                      ? "cursor-pointer ring-2 ring-provenance-judgement/35 ring-offset-1 ring-offset-card"
                      : "cursor-default",
                  )}
                  style={{ left: `calc(${pct(score)}% + ${nudge}px)` }}
                />
              );
            }),
          )}
        </div>

        <span className="w-2 shrink-0 tabular-nums text-[10px] text-muted-foreground/70">5</span>

      </div>

      {/* initials under their dot */}
      <div className="mt-0.5 flex items-start gap-3">
        <span className="w-2 shrink-0" aria-hidden />
        <div className="relative mx-2.5 h-3 flex-1">
          {[...byScore.entries()].map(([score, list]) => (
            <span
              key={`ini-${score}`}
              className="absolute -translate-x-1/2 whitespace-nowrap tabular-nums text-[9px] font-medium text-muted-foreground"
              style={{ left: `${pct(score)}%` }}
            >
              {list.map((e) => initialsOf(nameOf(e))).join(" ")}
            </span>
          ))}
        </div>
        <span className="w-2 shrink-0" aria-hidden />
      </div>

      <div className="mt-0.5 flex items-baseline gap-3">
        <span className="w-2 shrink-0" aria-hidden />
        <div className="mx-2.5 flex flex-1 justify-between text-[9px] text-muted-foreground/60">
          <span>{ends.low}</span>
          <span>{ends.high}</span>
        </div>
        <span className="w-2 shrink-0" aria-hidden />
      </div>
    </div>
  );
};

export default CriterionRail;
