import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { NEUTRAL_LABEL, TEAM_LABEL, contributorById, initialsOf } from "@/config/assessmentCriteria";
import { today, useRegister } from "@/components/materialRegister/registerStore";
import { Missing, nf, provenanceLine, shortDate } from "@/components/materialRegister/primitives";
import CriterionRail from "@/components/materialRegister/CriterionRail";
import CriterionDocuments from "@/components/materialRegister/CriterionDocuments";
import CriteriaSetDialog from "@/components/materialRegister/CriteriaSetDialog";
import { Info, SlidersHorizontal, Pencil } from "lucide-react";
import type { AssessmentEntry, AssessmentCriterion, Material } from "@/types/materialPrioritisation";

/** One link treatment for the whole component. */
const LINK =
  "text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground";

type FigureField = "annual_volume" | "unit_price" | "ghg_emission_factor";

const FIG_LABELS: Record<FigureField, { label: string; suffix: string; decimals: number }> = {
  annual_volume: { label: "Volume", suffix: "t/yr", decimals: 0 },
  unit_price: { label: "Unit price", suffix: "EUR/kg", decimals: 2 },
  ghg_emission_factor: { label: "Emission factor", suffix: "kg CO2e/kg", decimals: 2 },
};

const Num: React.FC<{ value: number | null; suffix: string; decimals?: number }> = ({
  value,
  suffix,
  decimals = 0,
}) =>
  value === null ? (
    <Missing />
  ) : (
    <span className="font-mono tabular-nums text-[10px] text-foreground">
      {nf(decimals).format(value)} <span className="text-muted-foreground">{suffix}</span>
    </span>
  );

/**
 * Company figures. Resting state is a single context line; editing expands in
 * place. Spend and GHG contribution are computed and never edited directly.
 */
const FiguresStrip: React.FC<{ m: Material }> = ({ m }) => {
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
    const pushText = (field: "ghg_boundary" | "ghg_data_basis", next: string | null) => {
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

    const useVol = v ?? m.annual_volume;
    const usePrice = p ?? m.unit_price;
    const useFactor = f ?? m.ghg_emission_factor;
    patch.annual_spend =
      useVol !== null && usePrice !== null ? Math.round(useVol * 1000 * usePrice) : null;
    provenance.annual_spend = { origin: "computed", source: "volume x unit price", date: today() };
    patch.ghg_contribution =
      useVol !== null && useFactor !== null ? Math.round(useVol * useFactor) : null;
    provenance.ghg_contribution = {
      origin: "computed",
      source: "emission factor x volume",
      date: today(),
    };
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
      <div className="space-y-2.5 pb-1">
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
          <button type="button" onClick={reset} className={LINK}>
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
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-[10px] text-muted-foreground">Spend</span>
      <Num value={m.annual_spend} suffix="EUR/yr" />
      <span className="text-[10px] text-border" aria-hidden>
        ·
      </span>
      <span className="text-[10px] text-muted-foreground">Volume</span>
      <Num value={m.annual_volume} suffix="t/yr" />
      <span className="text-[10px] text-border" aria-hidden>
        ·
      </span>
      <span className="text-[10px] text-muted-foreground">GHG</span>
      <Num value={m.ghg_contribution} suffix="tCO2e/yr" />
      <button type="button" onClick={() => setEditing(true)} className={cn(LINK, "inline-flex items-center gap-1")}>
        <Pencil className="h-3 w-3" />
        Edit
      </button>
      <span className="ml-auto text-[9px] uppercase tracking-widest text-muted-foreground/70">
        Company data
      </span>
    </div>
  );
};

/** VCG signals are not live: plain low-contrast text, no chip. */
const VcgStrip: React.FC = () => (
  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
    <span className="text-[10px] text-muted-foreground/70">Substitutability</span>
    <Missing />
    <span className="text-[10px] text-muted-foreground/70">Suppliers</span>
    <Missing />
    <span className="text-[10px] text-muted-foreground/70">Competitors</span>
    <Missing />
    <span className="text-[10px] text-muted-foreground/50">Not yet assessed</span>
    <span className="ml-auto text-[9px] uppercase tracking-widest text-provenance-vcg/70">VCG data</span>
  </div>
);


/** Small split dot. A marker beside the count, never the word "split". */
const SplitDot: React.FC = () => (
  <span
    title="Teams gave different scores"
    aria-label="Teams gave different scores"
    className="inline-block h-1.5 w-1.5 rounded-full bg-provenance-judgement"
  />
);

/** One recorded reason. The rail already carries the score, so it is not repeated. */
const RationaleLine: React.FC<{ entry: AssessmentEntry; isMine: boolean }> = ({ entry, isMine }) => {
  const name = contributorById(entry.user_id)?.name ?? entry.user_id;
  return (
    <div className="flex items-start gap-2" title={`${name} · ${shortDate(entry.assessed_at)}`}>
      <span
        className={cn(
          "w-6 shrink-0 font-mono text-[10px]",
          isMine ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
        )}
      >
        {initialsOf(name)}
      </span>
      <span className="w-20 shrink-0 text-[10px] text-muted-foreground/70">{TEAM_LABEL[entry.team]}</span>
      <span className="min-w-0 flex-1 text-[11px] leading-snug text-foreground/90">
        {entry.note ?? <span className="text-muted-foreground/60">No reason recorded</span>}
      </span>
    </div>
  );
};

/** One judged criterion: header, rail, reasons. The rail is the row. */
const JudgementRow: React.FC<{ criterion: AssessmentCriterion; materialId: string }> = ({
  criterion,
  materialId,
}) => {
  const { assessmentState, myEntry, saveAssessment, clearAssessment, currentUser } = useRegister();
  const state = assessmentState(materialId, criterion.criterion_id);
  const mine = myEntry(materialId, criterion.criterion_id);

  const savedValue: number | "neutral" | null = mine ? (mine.score === null ? "neutral" : mine.score) : null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<number | "neutral" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  const value = draft ?? savedValue;
  const noteValue = note ?? mine?.note ?? "";
  const needsReason = value !== null && value !== "neutral" && noteValue.trim() === "";
  const dirty =
    value !== savedValue || (mine ? (mine.note ?? "") !== noteValue.trim() : noteValue.trim() !== "");

  const stop = () => {
    setDraft(null);
    setNote(null);
    setBlocked(false);
    setEditing(false);
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
    stop();
  };

  const scored = state.entries.filter((e) => e.score !== null);
  const neutral = state.entries.filter((e) => e.score === null);
  const withReasons = mine
    ? [mine, ...state.entries.filter((e) => e.user_id !== currentUser.user_id)]
    : state.entries;

  return (
    <div className="border-l-2 border-provenance-judgement/60 pl-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-foreground">
          {criterion.label}
          {criterion.helper && (
            <button
              type="button"
              tabIndex={0}
              title={criterion.helper}
              aria-label={`About ${criterion.label}`}
              className="text-muted-foreground/50 hover:text-foreground"
            >
              <Info className="h-3 w-3" />
            </button>
          )}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
          {state.entries.length > 0 && (
            <span>
              <span className="font-mono tabular-nums">{state.entries.length}</span>{" "}
              {state.entries.length === 1 ? "entry" : "entries"}
            </span>
          )}
          {state.flag === "split" && <SplitDot />}
        </span>
      </div>

      <div className="mt-2.5">
        <CriterionRail
          criterionId={criterion.criterion_id}
          criterionLabel={criterion.label}
          scored={scored}
          neutral={neutral}
          currentUserId={currentUser.user_id}
          draft={editing && typeof value === "number" ? value : null}
          onPick={(v) => {
            setDraft(v);
            setBlocked(false);
            setEditing(true);
          }}
          onEditMine={() => {
            setEditing(true);
            setBlocked(false);
          }}
        />
      </div>

      {state.entries.length === 0 && !editing && (
        <p className="mt-1.5 text-[10px] text-muted-foreground/60">Nobody has judged this yet.</p>
      )}

      {editing && (
        <div className="mt-2.5 space-y-1.5">
          {criterion.anchors && (
            <p className="text-[10px] leading-snug text-muted-foreground/70">{criterion.anchors}</p>
          )}
          <input
            autoFocus
            value={noteValue}
            onChange={(e) => {
              setNote(e.target.value);
              setBlocked(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !needsReason && dirty) commit();
              if (e.key === "Escape") stop();
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
            {value !== null && !needsReason && dirty && (
              <button
                type="button"
                onClick={commit}
                className="inline-flex h-6 items-center rounded-md border border-border bg-foreground px-2.5 text-[10px] font-medium text-background"
              >
                Save
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setDraft("neutral");
                setBlocked(false);
              }}
              className={cn(
                LINK,
                value === "neutral" && "text-foreground",
              )}
            >
              {NEUTRAL_LABEL}
            </button>
            {mine && (
              <button
                type="button"
                onClick={() => {
                  clearAssessment(materialId, criterion.criterion_id);
                  stop();
                }}
                className={LINK}
              >
                Remove mine
              </button>
            )}
            <button type="button" onClick={stop} className={LINK}>
              Cancel
            </button>
            {needsReason && value !== null && (
              <span className="text-[10px] text-muted-foreground">
                A rationale is required for a 1–5 score.
              </span>
            )}
            <span className="ml-auto text-[10px] text-muted-foreground/70">
              {currentUser.name} · {TEAM_LABEL[currentUser.team]}
            </span>
          </div>
        </div>
      )}

      {withReasons.length > 0 && (
        <div className="mt-2.5 space-y-1">
          {withReasons.map((e) => (
            <RationaleLine key={e.user_id} entry={e} isMine={e.user_id === currentUser.user_id} />
          ))}
        </div>
      )}

      <div className="mt-1.5">
        <CriterionDocuments
          materialId={materialId}
          criterionId={criterion.criterion_id}
          criterionLabel={criterion.label}
        />
      </div>
    </div>
  );
};


/**
 * The assessment card. Two reference rows read from data we hold sit as a quiet
 * context strip; the judged criteria are rows with one border level. Nothing is
 * combined into a score.
 */
const BriefAssessment: React.FC<{ material: Material }> = ({ material }) => {
  const { assessmentSummary, criteria, canEditCriteria } = useRegister();
  const summary = assessmentSummary(material.material_id);
  const [criteriaOpen, setCriteriaOpen] = useState(false);

  const judged = criteria.filter((c) => c.kind === "judgement");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <span>
          <span className="font-mono tabular-nums text-foreground">{summary.criteriaAssessed}</span> of{" "}
          <span className="font-mono tabular-nums">{summary.criteriaTotal}</span> scored
        </span>
        <span className="text-border" aria-hidden>
          ·
        </span>
        <span>
          <span className="font-mono tabular-nums text-foreground">{summary.contributors.length}</span>{" "}
          {summary.contributors.length === 1 ? "person" : "people"}
        </span>
        <button
          type="button"
          onClick={() => setCriteriaOpen(true)}
          className={cn(LINK, "inline-flex items-center gap-1")}
        >
          <SlidersHorizontal className="h-3 w-3" />
          {canEditCriteria ? "Edit criteria" : "View criteria"}
        </button>
      </div>

      {/* Context, not work: smaller type, no borders, no cards. */}
      <div className="space-y-1">
        <FiguresStrip m={material} />
        <VcgStrip />
      </div>

      <div className="divide-y divide-border/60">
        {judged.map((c) => (
          <div key={c.criterion_id} className="py-2.5 first:pt-1">
            <JudgementRow criterion={c} materialId={material.material_id} />
          </div>
        ))}
      </div>

      <CriteriaSetDialog open={criteriaOpen} onOpenChange={setCriteriaOpen} />
    </div>
  );
};

export default BriefAssessment;
