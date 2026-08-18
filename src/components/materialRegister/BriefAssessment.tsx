import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { TEAM_LABEL, contributorById } from "@/config/assessmentCriteria";
import { today, useRegister } from "@/components/materialRegister/registerStore";
import { Missing, nf, provenanceLine, shortDate } from "@/components/materialRegister/primitives";
import { ComingSoonTag, VCG_RULE } from "@/components/materialRegister/vcgSignals";
import { ContributorMark, FlagChip, ScoreRail } from "@/components/materialRegister/assessmentPrimitives";
import CriterionDocuments from "@/components/materialRegister/CriterionDocuments";
import CriteriaSetDialog from "@/components/materialRegister/CriteriaSetDialog";
import { SlidersHorizontal, Pencil } from "lucide-react";
import type { AssessmentCriterion, Material } from "@/types/materialPrioritisation";

type FigureField = "annual_volume" | "unit_price" | "ghg_emission_factor";

const FIG_LABELS: Record<FigureField, { label: string; suffix: string; decimals: number }> = {
  annual_volume: { label: "Volume", suffix: "t/yr", decimals: 0 },
  unit_price: { label: "Unit price", suffix: "EUR/kg", decimals: 2 },
  ghg_emission_factor: { label: "Emission factor", suffix: "kg CO2e/kg", decimals: 2 },
};

/**
 * Editable figures evidence. Spend and GHG contribution are computed from the
 * three entered values and never edited directly. Every change is logged as a
 * field correction; derived fields carry a computed provenance stamp.
 */
const FiguresEvidence: React.FC<{ m: Material }> = ({ m }) => {
  const { updateMaterial } = useRegister();
  const [editing, setEditing] = useState(false);
  const [vol, setVol] = useState(m.annual_volume?.toString() ?? "");
  const [price, setPrice] = useState(m.unit_price?.toString() ?? "");
  const [factor, setFactor] = useState(m.ghg_emission_factor?.toString() ?? "");
  const [boundary, setBoundary] = useState(m.ghg_boundary ?? "");
  const [basis, setBasis] = useState(m.ghg_data_basis ?? "");

  const num = (s: string): number | null => {
    if (s.trim() === "") return null;
    const n = Number(s.replace(/[,\s]/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  const reset = () => {
    setVol(m.annual_volume?.toString() ?? "");
    setPrice(m.unit_price?.toString() ?? "");
    setFactor(m.ghg_emission_factor?.toString() ?? "");
    setBoundary(m.ghg_boundary ?? "");
    setBasis(m.ghg_data_basis ?? "");
    setEditing(false);
  };

  const save = () => {
    const v = num(vol);
    const p = num(price);
    const f = num(factor);
    const b = boundary.trim() === "" ? null : boundary.trim();
    const db = basis.trim() === "" ? null : basis.trim();

    const patch: Partial<Material> = {};
    const provenance = { ...m.provenance };
    const events: {
      material_id: string;
      event_type: "field_correction";
      field: string;
      from_value: string | null;
      to_value: string | null;
    }[] = [];

    const pushNum = (field: FigureField, next: number | null) => {
      const before = m[field];
      if (before === next) return;
      patch[field] = next as never;
      events.push({
        material_id: m.material_id,
        event_type: "field_correction",
        field,
        from_value: before === null ? null : String(before),
        to_value: next === null ? null : String(next),
      });
    };
    const pushText = (
      field: "ghg_boundary" | "ghg_data_basis",
      next: string | null,
    ) => {
      if (m[field] === next) return;
      patch[field] = next as never;
      events.push({
        material_id: m.material_id,
        event_type: "field_correction",
        field,
        from_value: m[field],
        to_value: next,
      });
    };

    pushNum("annual_volume", v);
    pushNum("unit_price", p);
    pushNum("ghg_emission_factor", f);
    pushText("ghg_boundary", b);
    pushText("ghg_data_basis", db);

    if (events.length === 0) {
      setEditing(false);
      return;
    }

    // Recompute derived figures from the resolved set.
    const useVol = v ?? m.annual_volume;
    const usePrice = p ?? m.unit_price;
    const useFactor = f ?? m.ghg_emission_factor;
    if (useVol !== null && usePrice !== null) {
      patch.annual_spend = Math.round(useVol * 1000 * usePrice);
      provenance.annual_spend = { origin: "computed", source: "volume x unit price", date: today() };
    } else {
      patch.annual_spend = null;
      provenance.annual_spend = { origin: "computed", source: "volume x unit price", date: today() };
    }
    if (useVol !== null && useFactor !== null) {
      patch.ghg_contribution = Math.round(useVol * useFactor);
      provenance.ghg_contribution = { origin: "computed", source: "emission factor x volume", date: today() };
    } else {
      patch.ghg_contribution = null;
      provenance.ghg_contribution = { origin: "computed", source: "emission factor x volume", date: today() };
    }
    patch.provenance = provenance;

    updateMaterial(
      m.material_id,
      patch,
      events.map((e) => e.field),
      events,
    );
    setEditing(false);
  };

  const Field: React.FC<{ field: FigureField }> = ({ field }) => {
    const meta = FIG_LABELS[field];
    const val = field === "annual_volume" ? vol : field === "unit_price" ? price : factor;
    const set = field === "annual_volume" ? setVol : field === "unit_price" ? setPrice : setFactor;
    const raw = m[field];
    const has = raw !== null && raw !== undefined;
    return (
      <div className="space-y-0.5">
        <div className="text-[10px] text-muted-foreground">{meta.label}</div>
        <div className="flex items-center gap-1">
          <input
            value={val}
            inputMode="decimal"
            onChange={(e) => set(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") reset();
            }}
            className="h-7 w-24 rounded-md border border-input bg-background px-2 text-right font-mono text-[11px] tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-[10px] text-muted-foreground">{meta.suffix}</span>
        </div>
        <div className="text-[10px] text-muted-foreground/50">
          {provenanceLine(m.provenance[field], has)}
        </div>
      </div>
    );
  };

  if (editing) {
    return (
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-3">
          <Field field="annual_volume" />
          <Field field="unit_price" />
          <Field field="ghg_emission_factor" />
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground">GHG boundary</div>
            <input
              value={boundary}
              onChange={(e) => setBoundary(e.target.value)}
              placeholder="e.g. Cradle-to-gate"
              className="h-7 w-full rounded-md border border-input bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground">GHG data basis</div>
            <input
              value={basis}
              onChange={(e) => setBasis(e.target.value)}
              placeholder="e.g. Supplier-specific"
              className="h-7 w-full rounded-md border border-input bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            className="inline-flex h-6 items-center rounded-md border border-border bg-foreground px-2.5 text-[10px] font-medium text-background"
          >
            Save figures
          </button>
          <button
            type="button"
            onClick={reset}
            className="text-[10px] text-muted-foreground underline decoration-dotted hover:text-foreground"
          >
            Cancel
          </button>
          <span className="ml-auto text-[10px] text-muted-foreground/70">
            Spend & GHG contribution recompute on save
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-[10px] text-muted-foreground">Spend</span>
        <Num value={m.annual_spend} suffix="EUR/yr" />
        <span className="text-[10px] text-muted-foreground">Volume</span>
        <Num value={m.annual_volume} suffix="t/yr" />
        <span className="text-[10px] text-muted-foreground">GHG</span>
        <Num value={m.ghg_contribution} suffix="tCO2e/yr" />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground underline decoration-dotted hover:text-foreground"
        >
          <Pencil className="h-3 w-3" />
          Edit figures
        </button>
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground">
        Measured and computed. Partial data is normal — a missing figure reads as no figure, never as zero. Spend
        and GHG contribution recompute from the entered values.
      </p>
    </div>
  );
};

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
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {criterion.source === "vcg" ? "VCG data" : "Company data"}
        {criterion.source === "vcg" && <ComingSoonTag />}
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-muted-foreground">
        <span>Substitutability</span>
        <span aria-hidden>·</span>
        <span>Suppliers</span>
        <span aria-hidden>·</span>
        <span>Competitors</span>
      </div>
    )}
    <p className="text-[10px] leading-snug text-muted-foreground">
      {criterion.source === "vcg"
        ? "These signals are not live yet. Nothing here is scored or read into the assessment until VCG runs the check."
        : criterion.helper}
    </p>
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

  /** Draft, because a 1–5 score cannot be committed until a rationale exists. */
  const savedValue: number | "neutral" | null = mine ? (mine.score === null ? "neutral" : mine.score) : null;
  const [draft, setDraft] = useState<number | "neutral" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  const value = draft ?? savedValue;
  const noteValue = note ?? mine?.note ?? "";
  const needsReason = value !== null && value !== "neutral" && noteValue.trim() === "";
  const dirty = value !== savedValue || (mine ? (mine.note ?? "") !== noteValue.trim() : noteValue.trim() !== "");

  const reset = () => {
    setDraft(null);
    setNote(null);
    setBlocked(false);
  };

  const commit = () => {
    if (value === null) return;
    const ok = saveAssessment(
      materialId,
      criterion.criterion_id,
      value === "neutral" ? null : value,
      noteValue.trim() || null,
    );
    if (!ok) {
      setBlocked(true);
      return;
    }
    reset();
  };

  return (
    <div className="space-y-2 rounded-md border border-border/70 border-l-2 border-l-provenance-judgement/70 bg-card p-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-foreground">{criterion.label}</span>
        <FlagChip state={state} />
      </div>

      <p className="text-[10px] leading-snug text-muted-foreground">{criterion.helper}</p>
      {criterion.anchors && (
        <p className="text-[10px] leading-snug text-muted-foreground/80">{criterion.anchors}</p>
      )}

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
          value={value}
          ariaLabel={`${criterion.label} score`}
          onPick={(v) => {
            setDraft(v);
            setBlocked(false);
          }}
          onNeutral={() => {
            setDraft("neutral");
            setBlocked(false);
          }}
          onClear={() => {
            if (mine) clearAssessment(materialId, criterion.criterion_id);
            reset();
          }}
        />
        {mine && !dirty && (
          <span className="font-mono text-[10px] text-muted-foreground">{shortDate(mine.assessed_at)}</span>
        )}
      </div>

      {value !== null && (
        <div className="space-y-1">
          <input
            value={noteValue}
            onChange={(e) => {
              setNote(e.target.value);
              setBlocked(false);
            }}
            placeholder={
              value === "neutral"
                ? "Why no visibility (optional)"
                : "Why this score — required before it can be saved"
            }
            className={cn(
              "w-full rounded-md border bg-background px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring",
              blocked && needsReason ? "border-amber-500/70" : "border-input",
            )}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={commit}
              disabled={!dirty || needsReason}
              className="inline-flex h-6 items-center rounded-md border border-border bg-foreground px-2.5 text-[10px] font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mine ? "Save change" : "Save entry"}
            </button>
            {dirty && (
              <button
                type="button"
                onClick={reset}
                className="text-[10px] text-muted-foreground underline decoration-dotted hover:text-foreground"
              >
                Discard
              </button>
            )}
            {needsReason && (
              <span className="text-[10px] text-amber-700 dark:text-amber-400">
                A rationale is required for a 1–5 score. Optional on Neutral.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Evidence sits beside the rationale it supports, not in a separate card. */}
      <CriterionDocuments
        materialId={materialId}
        criterionId={criterion.criterion_id}
        criterionLabel={criterion.label}
      />
    </div>
  );
};

/**
 * The assessment card: two evidence criteria read from data we hold, three judged
 * by people. Five separate readings — they are never combined into one score.
 */
const BriefAssessment: React.FC<{ material: Material }> = ({ material }) => {
  const { assessmentSummary, criteria, canEditCriteria } = useRegister();
  const summary = assessmentSummary(material.material_id);
  const [criteriaOpen, setCriteriaOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <span>
          <span className="font-mono tabular-nums text-foreground">{summary.criteriaAssessed}</span> of{" "}
          <span className="font-mono tabular-nums">{summary.criteriaTotal}</span> judged criteria have scores
        </span>
        <span className="text-border">·</span>
        <span>
          <span className="font-mono tabular-nums text-foreground">{summary.contributors.length}</span>{" "}
          {summary.contributors.length === 1 ? "person" : "people"}
          {summary.teams.length > 0 && ` across ${summary.teams.map((t) => TEAM_LABEL[t]).join(", ")}`}
        </span>
        {summary.neutralEntries > 0 && (
          <>
            <span className="text-border">·</span>
            <span>
              <span className="font-mono tabular-nums">{summary.neutralEntries}</span> neutral (not counted as
              scores)
            </span>
          </>
        )}
        {summary.splits > 0 && (
          <>
            <span className="text-border">·</span>
            <span className="text-amber-700 dark:text-amber-400">
              <span className="font-mono tabular-nums">{summary.splits}</span> split
            </span>
          </>
        )}
        <span className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCriteriaOpen(true)}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground underline decoration-dotted hover:text-foreground"
          >
            <SlidersHorizontal className="h-3 w-3" />
            {canEditCriteria ? "Edit criteria" : "View criteria"}
          </button>
        </span>
      </div>

      <CriteriaSetDialog open={criteriaOpen} onOpenChange={setCriteriaOpen} />

      {criteria.map((c) =>
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
