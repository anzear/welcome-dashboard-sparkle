import React from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TEAM_LABEL, contributorById } from "@/config/assessmentCriteria";
import { useRegister } from "@/components/materialRegister/registerStore";
import type { AssessmentCriterion, Material } from "@/types/materialPrioritisation";

/**
 * Seven independent readings, side by side. Each slot is its own five-step track:
 * the filled position carries the score, the filled width carries the level of
 * disagreement. Nothing is summed, averaged, weighted or joined into a shape —
 * there is deliberately no line, outline or shared container across the slots,
 * because the strip must never read as one overall score.
 */

const STEPS = [1, 2, 3, 4, 5];

/** Team judgement is never drawn in the computed-data colour. One neutral treatment. */
const FILL = "bg-provenance-judgement";
const TRACK = "bg-border/70";
const TRACK_EMPTY = "bg-border/30";

type SlotState = {
  low: number | null;
  high: number | null;
  entries: { user_id: string; team: string; score: number | null; note: string | null }[];
};

const SlotTooltip: React.FC<{ criterion: AssessmentCriterion; state: SlotState }> = ({
  criterion,
  state,
}) => (
  <div className="max-w-[16rem] space-y-1.5">
    <div className="text-[10px] font-semibold uppercase tracking-widest">{criterion.label}</div>
    {state.entries.length === 0 ? (
      <p className="text-[11px] leading-snug opacity-80">
        No score recorded. Empty is not a score of 1 and not a zero.
      </p>
    ) : (
      <ul className="space-y-1">
        {state.entries.map((e) => {
          const person = contributorById(e.user_id);
          return (
            <li key={e.user_id} className="text-[11px] leading-snug">
              <span className="font-medium">{person?.name ?? e.user_id}</span>
              <span className="opacity-70">
                {" · "}
                {person?.role ?? TEAM_LABEL[e.team as keyof typeof TEAM_LABEL] ?? e.team}
                {" · "}
              </span>
              <span className="tabular-nums font-medium">{e.score === null ? "Neutral" : e.score}</span>
              {e.note && <div className="opacity-80">{e.note}</div>}
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

/** One criterion's five-step track. Standalone: no connection to its neighbours. */
const Slot: React.FC<{
  criterion: AssessmentCriterion;
  state: SlotState;
  active: boolean;
  dimmed: boolean;
  onOpen: () => void;
}> = ({ criterion, state, active, dimmed, onOpen }) => {
  const empty = state.low === null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          aria-label={`${criterion.label}: ${
            empty
              ? "no score recorded"
              : state.low === state.high
                ? `score ${state.low}`
                : `scores ${state.low} to ${state.high}`
          }`}
          className={cn(
            "flex items-end gap-[1px] rounded-sm py-1 outline-none transition-opacity focus-visible:ring-1 focus-visible:ring-ring",
            dimmed ? "opacity-40 hover:opacity-70" : "opacity-100",
            active && "opacity-100",
          )}
        >
          {STEPS.map((s) => {
            const filled = !empty && s >= (state.low as number) && s <= (state.high as number);
            return (
              <span
                key={s}
                className={cn(
                  "block w-[2px] rounded-[1px]",
                  filled ? cn(FILL, "h-[11px]") : empty ? cn(TRACK_EMPTY, "h-[7px]") : cn(TRACK, "h-[7px]"),
                  active && filled && "h-[13px]",
                )}
              />
            );
          })}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="portfolio-type">
        <SlotTooltip criterion={criterion} state={state} />
      </TooltipContent>
    </Tooltip>
  );
};

/** All active criteria, always in the same order, always all present. */
export const DriversCell: React.FC<{ m: Material }> = ({ m }) => {
  const { judgedCriteria, assessmentState, driverCriterionId, openBriefAtCriterion } = useRegister();
  const anyActive = driverCriterionId !== null;
  return (
    <div className="flex items-end gap-[4px]">
      {judgedCriteria.map((c) => {
        const st = assessmentState(m.material_id, c.criterion_id);
        const active = c.criterion_id === driverCriterionId;
        return (
          <Slot
            key={c.criterion_id}
            criterion={c}
            state={{ low: st.low, high: st.high, entries: st.entries }}
            active={active}
            dimmed={anyActive && !active}
            onOpen={() => openBriefAtCriterion(m.material_id, c.criterion_id)}
          />
        );
      })}
    </div>
  );
};

/** Compact value for a single pulled-out criterion. A number, a range, or an em dash. */
export const CriterionValueCell: React.FC<{ m: Material; criterionId: string }> = ({
  m,
  criterionId,
}) => {
  const { assessmentState } = useRegister();
  const st = assessmentState(m.material_id, criterionId);
  if (st.low === null)
    return (
      <span className="text-muted-foreground/60" title="No score recorded">
        &mdash;
      </span>
    );
  return (
    <span className="tabular-nums text-foreground" title={`${st.scoredCount} score(s) recorded`}>
      {st.low === st.high ? st.low : `${st.low}\u2013${st.high}`}
    </span>
  );
};

/** What the strip means, sat in the header so the reading rule is never guessed. */
export const DriversLegend: React.FC = () => {
  const { judgedCriteria } = useRegister();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="How to read the drivers strip"
          className="text-muted-foreground/60 hover:text-foreground"
        >
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="portfolio-type w-72 p-3 text-[11px] leading-snug">
        <div className="pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Reading the strip
        </div>
        <p className="text-muted-foreground">
          One track per criterion, always the same left-to-right order. The filled position is the
          score; the filled width is how far apart people sit. An empty, faint track means nothing is
          recorded — not a score of 1, not a zero. The slots are never combined.
        </p>
        <ol className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
          {judgedCriteria.map((c, i) => (
            <li key={c.criterion_id}>
              <span className="tabular-nums opacity-60">{i + 1}.</span> {c.label}
            </li>
          ))}
        </ol>
      </PopoverContent>
    </Popover>
  );
};

export default DriversCell;
