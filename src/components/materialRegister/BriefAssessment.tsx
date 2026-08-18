import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { CRITERIA, TEAM_LABEL, contributorById } from "@/config/assessmentCriteria";
import { useRegister } from "@/components/materialRegister/registerStore";
import { Missing, nf, shortDate } from "@/components/materialRegister/primitives";
import {
  CompetitorActivityMark,
  SubstitutabilityChip,
  SupplierAvailabilityValue,
  VCG_RULE,
} from "@/components/materialRegister/vcgSignals";
import { ContributorMark, FlagChip, ScoreRail } from "@/components/materialRegister/assessmentPrimitives";
import type { AssessmentCriterion, Material } from "@/types/materialPrioritisation";

const Num: React.FC<{ value: number | null; suffix: string; decimals?: number }> = ({
  value,
  suffix,
  decimals = 0,
}) =>
  value === null ? (
    <Missing />
  ) : (
    <span className="font-mono tabular-nums text-[11px] text-foreground">
      {nf(decimals).format(value)} <span className="text-muted-foreground">{suffix}</span>
    </span>
  );

/** Evidence rows are read off data already held. Nobody scores them. */
const EvidenceRow: React.FC<{ criterion: AssessmentCriterion; m: Material }> = ({ criterion, m }) => (
  <div
    className={cn(
      "space-y-1.5 rounded-md border border-border/70 bg-muted/30 p-2.5",
      criterion.source === "vcg" && VCG_RULE,
    )}
  >
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11px] font-medium text-foreground">{criterion.label}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {criterion.source === "vcg" ? "VCG data" : "Company data"}
      </span>
    </div>

    {criterion.source === "figures" ? (
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-[10px] text-muted-foreground">Spend</span>
        <Num value={m.annual_spend} suffix="EUR/yr" />
        <span className="text-[10px] text-muted-foreground">Volume</span>
        <Num value={m.annual_volume} suffix="t/yr" />
        <span className="text-[10px] text-muted-foreground">GHG</span>
        <Num value={m.ghg_contribution} suffix="tCO2e/yr" />
      </div>
    ) : (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="text-[10px] text-muted-foreground">Substitutability</span>
        <SubstitutabilityChip value={m.substitutability_readiness} />
        <span className="text-[10px] text-muted-foreground">Suppliers</span>
        <SupplierAvailabilityValue value={m.supplier_availability} />
        <span className="text-[10px] text-muted-foreground">Competitors</span>
        <CompetitorActivityMark value={m.competitor_activity} withLabel />
      </div>
    )}
    <p className="text-[10px] leading-snug text-muted-foreground">{criterion.helper}</p>
  </div>
);

/** One judged criterion: everyone's entries, plus the current user's own rail. */
const JudgementRow: React.FC<{ criterion: AssessmentCriterion; materialId: string }> = ({
  criterion,
  materialId,
}) => {
  const { assessmentState, myEntry, saveAssessment, clearAssessment, currentUser } = useRegister();
  const state = assessmentState(materialId, criterion.criterion_id);
  const mine = myEntry(materialId, criterion.criterion_id);
  const [note, setNote] = useState<string | null>(null);
  const noteValue = note ?? mine?.note ?? "";

  return (
    <div className="space-y-2 rounded-md border border-border/70 border-l-2 border-l-provenance-judgement/70 bg-card p-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-foreground">{criterion.label}</span>
        <FlagChip state={state} />
      </div>

      <p className="text-[10px] leading-snug text-muted-foreground">{criterion.helper}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        {state.entries.length === 0 ? (
          <span className="text-[10px] text-muted-foreground">No entries yet.</span>
        ) : (
          state.entries.map((e) => (
            <ContributorMark key={e.user_id} entry={e} name={contributorById(e.user_id)?.name ?? e.user_id} />
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2">
        <span className="text-[10px] text-muted-foreground">
          {mine ? "Your entry" : "Add your entry"}
          <span className="ml-1 text-muted-foreground/70">
            ({currentUser.name}, {TEAM_LABEL[currentUser.team]})
          </span>
        </span>
        <ScoreRail
          size="sm"
          value={mine?.score ?? null}
          ariaLabel={`${criterion.label} score`}
          onPick={(v) => saveAssessment(materialId, criterion.criterion_id, v, mine?.note ?? null)}
          onClear={() => clearAssessment(materialId, criterion.criterion_id)}
        />
        {mine && (
          <span className="font-mono text-[10px] text-muted-foreground">{shortDate(mine.assessed_at)}</span>
        )}
      </div>

      {mine && (
        <input
          value={noteValue}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            if ((mine.note ?? "") !== noteValue)
              saveAssessment(materialId, criterion.criterion_id, mine.score, noteValue.trim() || null);
          }}
          placeholder="Why this score (optional)"
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}
    </div>
  );
};

/**
 * The assessment card: two evidence criteria read from data we hold, three judged
 * by people. Five separate readings — they are never combined into one score.
 */
const BriefAssessment: React.FC<{ material: Material }> = ({ material }) => {
  const { assessmentSummary } = useRegister();
  const summary = assessmentSummary(material.material_id);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <span>
          <span className="font-mono tabular-nums text-foreground">{summary.criteriaAssessed}</span> of{" "}
          <span className="font-mono tabular-nums">{summary.criteriaTotal}</span> judged criteria have entries
        </span>
        <span className="text-border">·</span>
        <span>
          <span className="font-mono tabular-nums text-foreground">{summary.contributors.length}</span>{" "}
          {summary.contributors.length === 1 ? "person" : "people"}
          {summary.teams.length > 0 && ` across ${summary.teams.map((t) => TEAM_LABEL[t]).join(", ")}`}
        </span>
        {summary.splits > 0 && (
          <>
            <span className="text-border">·</span>
            <span className="text-amber-700 dark:text-amber-400">
              <span className="font-mono tabular-nums">{summary.splits}</span> split
            </span>
          </>
        )}
      </div>

      {CRITERIA.map((c) =>
        c.kind === "evidence" ? (
          <EvidenceRow key={c.criterion_id} criterion={c} m={material} />
        ) : (
          <JudgementRow key={c.criterion_id} criterion={c} materialId={material.material_id} />
        ),
      )}
    </div>
  );
};

export default BriefAssessment;
