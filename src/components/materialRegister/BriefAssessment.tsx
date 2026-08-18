import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { NEUTRAL_LABEL, TEAM_LABEL, contributorById } from "@/config/assessmentCriteria";
import { today, useRegister } from "@/components/materialRegister/registerStore";
import { Missing, nf, provenanceLine, shortDate } from "@/components/materialRegister/primitives";
import { VCG_RULE } from "@/components/materialRegister/vcgSignals";
import { ScoreRail } from "@/components/materialRegister/assessmentPrimitives";
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


/** Small split dot. A marker beside the range, never the word "split". */
const SplitDot: React.FC = () => (
  <span
    title="Teams disagree"
    aria-label="Teams disagree"
    className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"
  />
);

/** One recorded entry: person, team, score, reason. Never initials and a number. */
const EntryLine: React.FC<{ entry: AssessmentEntry; isMine: boolean; onEdit?: () => void }> = ({
  entry,
  isMine,
  onEdit,
}) => {
  const [open, setOpen] = useState(false);
  const name = contributorById(entry.user_id)?.name ?? entry.user_id;
  return (
    <div className="flex items-start gap-2 py-[3px] text-[11px]">
      <span
        className={cn("shrink-0 whitespace-nowrap", isMine ? "font-medium text-foreground" : "text-foreground")}
        title={isMine ? "Your entry" : undefined}
      >
        {name}
      </span>
      <span className="shrink-0 whitespace-nowrap text-[10px] text-muted-foreground">
        {TEAM_LABEL[entry.team]}
      </span>
      {entry.score === null ? (
        <span className="shrink-0 text-[10px] font-normal text-muted-foreground/80">{NEUTRAL_LABEL}</span>
      ) : (
        <span className="shrink-0 font-mono tabular-nums font-medium text-provenance-judgement">
          {entry.score}
        </span>
      )}
      {entry.note ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "min-w-0 flex-1 text-left text-[11px] text-muted-foreground hover:text-foreground",
            !open && "truncate",
          )}
          title={open ? undefined : entry.note}
        >
          {entry.note}
          {open && (
            <span className="ml-2 font-mono text-[10px] text-muted-foreground/70">
              {shortDate(entry.assessed_at)}
            </span>
          )}
        </button>
      ) : (
        <span className="min-w-0 flex-1" title={shortDate(entry.assessed_at)} />
      )}
      {isMine && onEdit && (
        <button type="button" onClick={onEdit} className={cn(LINK, "shrink-0")}>
          Edit
        </button>
      )}
    </div>
  );
};

/** One judged criterion: a row, not a box. Everyone's entries, then your own act. */
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
  const [showAll, setShowAll] = useState(false);

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

  // Every figure below is derived. Nothing here is a fixed sentence about a state.
  const others = state.entries.filter((e) => e.user_id !== currentUser.user_id);
  const ordered = mine ? [mine, ...others] : others;
  const shown = showAll ? ordered : ordered.slice(0, 3);
  const hidden = ordered.length - shown.length;

  const range =
    state.scoredCount === 0
      ? null
      : state.low === state.high
        ? String(state.low)
        : `${state.low}–${state.high}`;

  return (
    <div className="border-l-2 border-provenance-judgement/70 pl-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1 text-[11px] font-medium text-foreground">
          {criterion.label}
          {criterion.helper && (
            <button
              type="button"
              tabIndex={0}
              title={criterion.helper}
              aria-label={`About ${criterion.label}`}
              className="text-muted-foreground/60 hover:text-foreground"
            >
              <Info className="h-3 w-3" />
            </button>
          )}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {ordered.length === 0 ? (
            <Missing />
          ) : (
            <>
              <span>
                <span className="font-mono tabular-nums text-foreground">{ordered.length}</span>{" "}
                {ordered.length === 1 ? "entry" : "entries"}
              </span>
              {range && (
                <>
                  <span className="text-border" aria-hidden>
                    ·
                  </span>
                  <span className="font-mono tabular-nums text-foreground">{range}</span>
                </>
              )}
              {state.flag === "split" && <SplitDot />}
            </>
          )}
        </span>
      </div>

      {ordered.length > 0 && (
        <div className="mt-1 divide-y divide-border/40">
          {shown.map((e) => (
            <EntryLine
              key={e.user_id}
              entry={e}
              isMine={e.user_id === currentUser.user_id}
              onEdit={
                e.user_id === currentUser.user_id
                  ? () => {
                      setEditing(true);
                      setBlocked(false);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {hidden > 0 && (
        <button type="button" onClick={() => setShowAll(true)} className={cn(LINK, "mt-1")}>
          {hidden} more
        </button>
      )}
      {showAll && ordered.length > 3 && (
        <button type="button" onClick={() => setShowAll(false)} className={cn(LINK, "mt-1")}>
          Show fewer
        </button>
      )}

      {!editing && !mine && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1.5 inline-flex h-6 items-center rounded-md border border-border bg-background px-2 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Add your assessment
        </button>
      )}

      {editing && (
        <div className="mt-2 space-y-1.5">
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
              stop();
            }}
          />
          {criterion.anchors && (
            <p className="text-[10px] leading-snug text-muted-foreground/80">{criterion.anchors}</p>
          )}
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
            {value !== null && !needsReason && dirty && (
              <button
                type="button"
                onClick={commit}
                className="inline-flex h-6 items-center rounded-md border border-border bg-foreground px-2.5 text-[10px] font-medium text-background"
              >
                Save
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

      <CriterionDocuments
        materialId={materialId}
        criterionId={criterion.criterion_id}
        criterionLabel={criterion.label}
      />
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
