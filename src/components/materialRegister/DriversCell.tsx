import React from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TEAM_LABEL, contributorById } from "@/config/assessmentCriteria";
import { useRegister } from "@/components/materialRegister/registerStore";
import type { AssessmentCriterion, Material } from "@/types/materialPrioritisation";

/**
 * Seven independent readings, side by side. Each criterion is a small vertical
 * bar sitting in a faint full-height track (the 1–5 scale). The solid portion
 * is what every contributor agrees on at minimum; the paler portion above it is
 * the contested range. An empty track means nothing is recorded — not a score
 * of 1, not a zero. The bars are never summed, averaged, weighted, connected or
 * combined into any value, visual or numeric.
 */

/** Team judgement is never drawn in the computed-data colour. One neutral treatment. */
const SOLID = "bg-provenance-judgement";
const PALE = "bg-provenance-judgement/25";
const TRACK_BG = "bg-border/25";

/** Track height in px — the full 1–5 scale. */
const TRACK_H = 28;
/** Bar width in px — wide enough to read individually. */
const BAR_W = 7;

/** Map a score (1–5) to a pixel height from the base. */
const scoreToHeight = (score: number) => (score / 5) * TRACK_H;

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
              <span className="tabular-nums font-medium">{e.score}</span>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

/**
 * One criterion's vertical bar inside its full-height track.
 * Solid fill = agreed minimum. Pale fill = contested range above it.
 * No fill = nothing recorded. Standalone: no connection to neighbours.
 */
const Slot: React.FC<{
  criterion: AssessmentCriterion;
  state: SlotState;
  active: boolean;
  dimmed: boolean;
  onOpen: () => void;
}> = ({ criterion, state, active, dimmed, onOpen }) => {
  const empty = state.low === null;
  const low = state.low ?? 0;
  const high = state.high ?? 0;
  const solidH = scoreToHeight(low);
  const paleH = empty ? 0 : scoreToHeight(high) - solidH;

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
              : low === high
                ? `score ${low}`
                : `scores ${low} to ${high}`
          }`}
          className={cn(
            "relative flex-shrink-0 rounded-[2px] outline-none transition-opacity focus-visible:ring-1 focus-visible:ring-ring",
            dimmed ? "opacity-35 hover:opacity-70" : "opacity-100",
            active && "opacity-100",
          )}
          style={{ width: BAR_W, height: TRACK_H }}
        >
          {/* Faint full-height track — always visible so an empty bar still has a position. */}
          <span className={cn("absolute inset-0 rounded-[2px]", TRACK_BG)} />
          {/* Solid fill: base to lowest recorded score. */}
          {!empty && solidH > 0 && (
            <span
              className={cn("absolute bottom-0 left-0 right-0 rounded-b-[2px]", SOLID, active && "ring-1 ring-provenance-judgement/40")}
              style={{ height: solidH }}
            />
          )}
          {/* Pale fill: lowest to highest (contested range). */}
          {!empty && paleH > 0 && (
            <span
              className={cn("absolute left-0 right-0", PALE)}
              style={{ bottom: solidH, height: paleH }}
            />
          )}
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
    <div className="flex items-end gap-[5px]">
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

/** What the bars mean, sat in the header so the reading rule is never guessed. */
export const DriversLegend: React.FC = () => {
  const { judgedCriteria } = useRegister();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="How to read the drivers bars"
          className="text-muted-foreground/60 hover:text-foreground"
        >
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="portfolio-type w-72 p-3 text-[11px] leading-snug">
        <div className="pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Reading the bars
        </div>
        <p className="text-muted-foreground">
          One bar per criterion, always the same left-to-right order. Each bar sits in a faint
          full-height track representing the 1 to 5 scale. The solid portion is what every
          contributor agrees on at minimum; the paler portion above it is the contested range. An
          empty track means nothing is recorded — not a score of 1, not a zero. The bars are never
          combined.
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
