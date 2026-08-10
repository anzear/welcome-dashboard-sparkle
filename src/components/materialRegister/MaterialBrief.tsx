import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  JOURNEY_STATUS_LABEL,
  type FieldProvenance,
  type JourneyStatus,
  type Material,
} from "@/types/materialPrioritisation";
import { BLOCKER_CATEGORIES } from "@/components/materialRegister/BulkActionDialog";
import { nf, provenanceLine, StatusPill } from "@/components/materialRegister/primitives";
import MaterialHistory from "@/components/materialRegister/MaterialHistory";
import BriefDriverScores from "@/components/materialRegister/BriefDriverScores";
import BriefStepCards from "@/components/materialRegister/BriefStepCards";

import {
  CURRENT_USER,
  ENTRY_TYPE_LABEL,
  MEASURES,
  today,
  useRegister,
  type MeasureId,
} from "@/components/materialRegister/registerStore";

const STATUS_ORDER = Object.keys(JOURNEY_STATUS_LABEL) as JourneyStatus[];
const UNASSIGNED = "__unassigned__";

const SectionTitle: React.FC<{ children: React.ReactNode; note?: string }> = ({ children, note }) => (
  <div className="mb-2">
    <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</h2>
    {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
  </div>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 text-[10px]">
    {children}
  </span>
);

interface FigureProps {
  label: string;
  value: number | string | null;
  decimals?: number;
  provenance?: FieldProvenance;
  computedInputs?: string;
}

/** Measured / computed figure. Monospace, right-aligned, provenance always shown. */
const Figure: React.FC<FigureProps> = ({ label, value, decimals = 0, provenance, computedInputs }) => {
  const hasValue = value !== null && value !== undefined && value !== "";
  const origin = provenance?.origin ?? "ingested";
  return (
    <div className="border-t border-border/60 px-3 py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span
          className={cn(
            "text-right font-mono text-xs tabular-nums",
            hasValue ? "text-foreground" : "text-muted-foreground/50",
            hasValue && origin === "computed" && "border-b border-dotted border-muted-foreground/60",
          )}
        >
          {!hasValue ? "—" : typeof value === "number" ? nf(decimals).format(value) : value}
        </span>
      </div>
      <div className="pt-0.5 text-[10px] text-muted-foreground/80">
        {provenanceLine(provenance, hasValue, computedInputs)}
      </div>
    </div>
  );
};

const DerivedField: React.FC<{
  label: string;
  value: string | null;
  provenance?: FieldProvenance;
  onSave: (v: string) => void;
}> = ({ label, value, provenance, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  return (
    <div className="border-t border-border/60 px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(value ?? "");
              setEditing(true);
            }}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            <Pencil className="h-3 w-3" /> Correct this
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex items-center gap-1 pt-1">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="h-7 text-xs" />
          <Button
            size="sm"
            className="h-7 text-[11px]"
            onClick={() => {
              onSave(draft.trim());
              setEditing(false);
            }}
          >
            Save
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="font-mono text-xs text-foreground">
          {provenance?.origin === "entered" && <span className="mr-0.5 text-primary/70">^</span>}
          {value ?? <span className="text-muted-foreground/50">—</span>}
        </div>
      )}
      <div className="pt-0.5 text-[10px] text-muted-foreground/80">
        {provenance?.origin === "entered"
          ? `Entered by ${provenance.source ?? CURRENT_USER}${provenance.date ? ` · ${provenance.date}` : ""}`
          : "Derived by VCG from our ontology"}
      </div>
    </div>
  );
};

export const MaterialBrief: React.FC = () => {
  const { data, visible, rankTables, measureId, openBrief, closeBrief, openId, updateMaterial, countsFor } =
    useRegister();


  const index = visible.findIndex((r) => r.m.material_id === openId);
  const row = index >= 0 ? visible[index] : null;
  const material = data.find((m) => m.material_id === openId) ?? row?.m ?? null;

  const [draftStatus, setDraftStatus] = useState<JourneyStatus | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [draftBlockerCategory, setDraftBlockerCategory] = useState("");
  const [draftBlockerDetail, setDraftBlockerDetail] = useState("");
  const [draftBlockerCondition, setDraftBlockerCondition] = useState("");


  const ownerNames = useMemo(
    () => [...new Set(data.map((m) => m.owner).filter((o): o is string => Boolean(o)))].sort(),
    [data],
  );

  if (!material) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={closeBrief}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back to register
        </button>
        <p className="text-xs text-muted-foreground">This material is not in the current view.</p>
      </div>
    );
  }

  const m: Material = material;
  const draftNeedsBlocker = draftStatus === "parked" || draftStatus === "rejected";
  const canSaveStatus = draftStatus !== null && (!draftNeedsBlocker || draftBlockerCategory !== "");

  const beginStatusChange = (next: JourneyStatus) => {
    if (next === m.journey_status) {
      setDraftStatus(null);
      return;
    }
    setDraftStatus(next);
    setStatusReason("");
    setDraftBlockerCategory(next === "parked" || next === "rejected" ? (m.blocker_category ?? "") : "");
    setDraftBlockerDetail(m.blocker_detail ?? "");
    setDraftBlockerCondition(m.blocker_condition ?? "");
  };

  const cancelStatusChange = () => {
    setDraftStatus(null);
    setStatusReason("");
  };

  /** One Save. No modal, no wizard, no confirmation step. */
  const saveStatusChange = () => {
    if (!draftStatus || !canSaveStatus) return;
    const stamp = today();
    const blockerFields = draftNeedsBlocker
      ? {
          blocker_category: draftBlockerCategory,
          blocker_detail: draftBlockerDetail.trim() || null,
          blocker_condition: draftBlockerCondition.trim() || null,
          blocker_date: stamp,
        }
      : {};

    updateMaterial(
      m.material_id,
      {
        journey_status: draftStatus,
        ...blockerFields,
      },
      draftNeedsBlocker ? ["journey_status", "blocker_category"] : ["journey_status"],
      [
        {
          material_id: m.material_id,
          event_type: draftNeedsBlocker ? "blocker_set" : "status_change",
          field: "journey_status",
          from_value: m.journey_status,
          to_value: draftStatus,
          reason: statusReason,
          blocker_category: draftNeedsBlocker ? draftBlockerCategory : null,
          blocker_detail: draftNeedsBlocker ? draftBlockerDetail.trim() || null : null,
          blocker_condition: draftNeedsBlocker ? draftBlockerCondition.trim() || null : null,
        },
      ],
    );
    setDraftStatus(null);
    setStatusReason("");
  };


  const gapSentence = () => {
    if (!row || row.gapMeasure === null || row.rank === null) return null;
    const active = MEASURES.find((x) => x.id === measureId)!;
    const other = MEASURES.find((x) => x.id === row.gapMeasure)!;
    const otherRank = row.ranks[other.id]!;
    const first = otherRank < row.rank ? { m: other, r: otherRank } : { m: active, r: row.rank };
    const second = otherRank < row.rank ? { m: active, r: row.rank } : { m: other, r: otherRank };
    return `Ranks ${first.r} on ${first.m.noun} but ${second.r} on ${second.m.noun}. ${row.gapSize} positions apart.`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeBrief}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Back to register
            </button>
            {index >= 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <button
                  type="button"
                  disabled={index <= 0}
                  onClick={() => openBrief(visible[index - 1].m.material_id)}
                  className="rounded-sm border border-border p-0.5 disabled:opacity-40"
                  aria-label="Previous material"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  disabled={index >= visible.length - 1}
                  onClick={() => openBrief(visible[index + 1].m.material_id)}
                  className="rounded-sm border border-border p-0.5 disabled:opacity-40"
                  aria-label="Next material"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
                <span className="font-mono tabular-nums">
                  {index + 1} of {visible.length}
                </span>
              </span>
            )}
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-foreground">{m.name}</h1>
          <div className="font-mono text-[10px] text-muted-foreground">
            {m.material_class ?? "Unclassified"} · CAS {m.cas_number ?? "—"} · {m.material_id}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Their IDs</span>
            {m.customer_material_ids.length > 0 ? (
              m.customer_material_ids.map((id) => <Chip key={id}>{id}</Chip>)
            ) : (
              <span className="text-[10px] text-muted-foreground/50">—</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <StatusPill status={m.journey_status} entered={m.provenance.journey_status?.origin === "entered"} />
            <span>{m.owner ?? "Unassigned"}</span>
            <span>
              {m.priority_selected ? "Priority" : "Not prioritised"}
              {m.priority_selected && m.priority_period ? ` · ${m.priority_period}` : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-[11px]">
            Export brief
          </Button>
          <Button size="sm" className="h-7 text-[11px]">
            Order intelligence
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Section 1 — Figures */}
        <section className="rounded-md border border-border lg:col-span-2">
          <div className="px-3 pt-3">
            <SectionTitle note="Measured and computed. Partial data is normal — a missing figure reads as no figure, never as zero.">
              Figures
            </SectionTitle>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3">
            <Figure
              label="Annual volume (t/yr)"
              value={m.annual_volume}
              provenance={m.provenance.annual_volume}
            />
            <Figure
              label="Unit price (EUR/kg)"
              value={m.unit_price}
              decimals={2}
              provenance={m.provenance.unit_price}
            />
            <Figure
              label="Annual spend (EUR)"
              value={m.annual_spend}
              provenance={m.provenance.annual_spend}
              computedInputs="volume x price"
            />
            <Figure
              label="GHG emission factor (kgCO2e/kg)"
              value={m.ghg_emission_factor}
              decimals={2}
              provenance={m.provenance.ghg_emission_factor}
            />
            <Figure
              label="GHG contribution (tCO2e/yr)"
              value={m.ghg_contribution}
              provenance={m.provenance.ghg_contribution}
              computedInputs="volume x emission factor"
            />
            <Figure label="GHG boundary" value={m.ghg_boundary} provenance={m.provenance.ghg_boundary} />
            <Figure label="GHG data basis" value={m.ghg_data_basis} provenance={m.provenance.ghg_data_basis} />
            <Figure label="Suppliers" value={m.supplier_count} provenance={m.provenance.supplier_count} />
            <Figure
              label="Supplier countries"
              value={m.supplier_countries.length > 0 ? m.supplier_countries.join(", ") : null}
              provenance={m.provenance.supplier_countries}
            />
          </div>
        </section>

        {/* Step cards — content filled in later */}
        <div className="lg:col-span-2">
          <BriefStepCards material={m} scoredCount={countsFor(m.material_id).scored_count ?? 0} />
        </div>


        {/* Section 3 — Scores (judgement, never typeset like the figures above) */}
        <section className="rounded-md border border-dashed border-primary/30 bg-primary/5 p-3">
          <SectionTitle note="These are judgements recorded by your team, not measured data.">Scores</SectionTitle>
          <BriefDriverScores materialId={m.material_id} />
        </section>


        {/* Section 2 — Classification */}
        <section className="rounded-md border border-border lg:col-span-2">
          <div className="px-3 pt-3">
            <SectionTitle>Classification</SectionTitle>
          </div>
          <div className="grid sm:grid-cols-2">
            <Figure label="Name" value={m.name} provenance={m.provenance.name} />
            <DerivedField
              label="CAS number — Derived by VCG"
              value={m.cas_number}
              provenance={m.provenance.cas_number}
              onSave={(v) =>
                updateMaterial(m.material_id, { cas_number: v || null }, ["cas_number"], [
                  {
                    material_id: m.material_id,
                    event_type: "field_correction",
                    field: "cas_number",
                    from_value: m.cas_number,
                    to_value: v || null,
                  },
                ])
              }

            />
            <DerivedField
              label="Material class — Derived by VCG"
              value={m.material_class}
              provenance={m.provenance.material_class}
              onSave={(v) =>
                updateMaterial(m.material_id, { material_class: v || null }, ["material_class"], [
                  {
                    material_id: m.material_id,
                    event_type: "field_correction",
                    field: "material_class",
                    from_value: m.material_class,
                    to_value: v || null,
                  },
                ])
              }

            />
            <Figure
              label="Customer material group"
              value={m.customer_material_group}
              provenance={m.provenance.customer_material_group}
            />
            <div className="border-t border-border/60 px-3 py-2">
              <div className="text-[11px] text-muted-foreground">Application categories</div>
              <div className="flex flex-wrap gap-1 pt-1">
                {m.application_categories.length > 0 ? (
                  m.application_categories.map((c) => <Chip key={c}>{c}</Chip>)
                ) : (
                  <span className="text-[10px] text-muted-foreground/50">—</span>
                )}
              </div>
            </div>
            <div className="border-t border-border/60 px-3 py-2">
              <div className="text-[11px] text-muted-foreground">Product categories</div>
              <div className="flex flex-wrap gap-1 pt-1">
                {m.product_categories.length > 0 ? (
                  m.product_categories.map((c) => <Chip key={c}>{c}</Chip>)
                ) : (
                  <span className="text-[10px] text-muted-foreground/50">—</span>
                )}
              </div>
            </div>
            <Figure
              label="Entry type"
              value={ENTRY_TYPE_LABEL[m.entry_type] ?? m.entry_type}
              provenance={m.provenance.entry_type}
            />
          </div>
        </section>

        {/* Section 4 — Position */}
        <section className="rounded-md border border-border p-3">
          <SectionTitle note="Four separate positions. Never combined into one score.">Position</SectionTitle>
          <div className="space-y-1.5">
            {MEASURES.map((mm) => {
              const rank = rankTables[mm.id].ranks[m.material_id] ?? null;
              const amber = row?.gapMeasure === mm.id || (row?.gapMeasure && mm.id === measureId);
              return (
                <div
                  key={mm.id}
                  className={cn(
                    "flex items-baseline justify-between gap-2 rounded-sm px-1.5 py-1 text-[11px]",
                    amber ? "bg-amber-500/10 text-amber-700" : "text-muted-foreground",
                  )}
                >
                  <span>{mm.label}</span>
                  <span className="font-mono tabular-nums">
                    {rank === null ? (
                      <span className="text-muted-foreground/50">— No figure</span>
                    ) : (
                      <>
                        <span className={cn("text-xs", amber ? "font-medium" : "text-foreground")}>{rank}</span> of{" "}
                        {rankTables[mm.id].rankedCount} ranked
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          {gapSentence() && <p className="pt-2 text-[11px] text-amber-700">{gapSentence()}</p>}
        </section>

        {/* Section 5 — Where it stands */}
        <section className="order-2 rounded-md border border-border p-3 lg:col-span-2">
          <SectionTitle note="Recorded judgement. Every change is written to the event log.">
            Where it stands
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</div>
              <Select
                value={draftStatus ?? m.journey_status}
                onValueChange={(v) => beginStatusChange(v as JourneyStatus)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {JOURNEY_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {draftStatus === null && m.blocker_category && (
                <div className="text-[10px] text-muted-foreground">
                  Blocker on record: <span className="text-amber-700">{m.blocker_category}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Owner</div>
              <Select
                value={m.owner ?? UNASSIGNED}
                onValueChange={(v) => {
                  const next = v === UNASSIGNED ? null : v;
                  if (next === m.owner) return;
                  updateMaterial(m.material_id, { owner: next }, ["owner"], [
                    {
                      material_id: m.material_id,
                      event_type: "owner_change",
                      field: "owner",
                      from_value: m.owner,
                      to_value: next,
                    },
                  ]);
                }}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ownerNames.map((o) => (
                    <SelectItem key={o} value={o} className="text-xs">
                      {o}
                    </SelectItem>
                  ))}
                  <SelectItem value={UNASSIGNED} className="text-xs">
                    Unassigned
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Priority</div>
              <label className="flex items-center gap-2 text-[11px]">
                <Checkbox
                  checked={m.priority_selected}
                  onCheckedChange={(c) => {
                    const on = Boolean(c);
                    updateMaterial(
                      m.material_id,
                      { priority_selected: on },
                      ["priority_selected"],
                      [
                        {
                          material_id: m.material_id,
                          event_type: "priority_change",
                          field: "priority_selected",
                          from_value: on ? null : (m.priority_period ?? "current period"),
                          to_value: on ? (m.priority_period ?? "current period") : null,
                        },
                      ],
                    );
                  }}
                  className="h-3.5 w-3.5"
                />
                Selected as priority
              </label>
              <Input
                value={m.priority_period ?? ""}
                onChange={(e) =>
                  updateMaterial(m.material_id, { priority_period: e.target.value || null }, ["priority_period"])
                }
                placeholder="Period, e.g. 2026 H2"
                className="h-7 text-[11px]"
              />
            </div>
          </div>

          {draftStatus !== null && (
            <div className="mt-3 space-y-2 rounded-sm border border-border bg-muted/40 p-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {JOURNEY_STATUS_LABEL[m.journey_status]} → {JOURNEY_STATUS_LABEL[draftStatus]}
              </div>
              <Input
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reason for change (optional)"
                className="h-7 text-[11px]"
              />

              {draftNeedsBlocker && (
                <div className="grid gap-2 rounded-sm border border-amber-500/30 bg-amber-500/5 p-2 sm:grid-cols-3">
                  <Select value={draftBlockerCategory} onValueChange={setDraftBlockerCategory}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Blocker category (required)" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOCKER_CATEGORIES.map((b) => (
                        <SelectItem key={b} value={b} className="text-xs">
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={draftBlockerDetail}
                    onChange={(e) => setDraftBlockerDetail(e.target.value)}
                    placeholder="Blocker detail (optional)"
                    className="h-7 text-[11px]"
                  />
                  <Input
                    value={draftBlockerCondition}
                    onChange={(e) => setDraftBlockerCondition(e.target.value)}
                    placeholder="What would have to change (optional)"
                    className="h-7 text-[11px]"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button size="sm" className="h-7 text-[11px]" disabled={!canSaveStatus} onClick={saveStatusChange}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={cancelStatusChange}>
                  Cancel
                </Button>
                {draftNeedsBlocker && !draftBlockerCategory && (
                  <span className="text-[10px] text-amber-700">A blocker category is required for this status.</span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Section 6 — History */}
        <section className="order-7 rounded-md border border-border p-3">
          <SectionTitle note="The record of decisions. Newest first.">History</SectionTitle>
          <MaterialHistory materialId={m.material_id} />
        </section>

      </div>
    </div>
  );
};

export default MaterialBrief;
