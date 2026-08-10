import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  INTELLIGENCE_STATUS_LABEL,
  JOURNEY_STATUS_LABEL,
  targetDateOf,
  type FieldProvenance,
  type JourneyStatus,
  type Material,
} from "@/types/materialPrioritisation";
import { BLOCKER_CATEGORIES } from "@/components/materialRegister/BulkActionDialog";
import { nf, provenanceLine, StatusPill } from "@/components/materialRegister/primitives";
import PositionBlock from "@/components/materialRegister/PositionBlock";
import MaterialHistory from "@/components/materialRegister/MaterialHistory";
import BriefDriverScores from "@/components/materialRegister/BriefDriverScores";
import BriefStepCards from "@/components/materialRegister/BriefStepCards";
import { cleanTags, formatTags, hasTag, normalizeTag, tagVocabulary, TAG_MAX_LENGTH } from "@/components/materialRegister/tags";

import {
  CURRENT_USER,
  ENTRY_TYPE_LABEL,
  MEASURES,
  today,
  useRegister,
} from "@/components/materialRegister/registerStore";

const STATUS_ORDER = Object.keys(JOURNEY_STATUS_LABEL) as JourneyStatus[];
const UNASSIGNED = "__unassigned__";

/* ------------------------------------------------------------------ type scale
 * Three data tiers only: value (text-sm mono tabular), label (text-[11px] muted),
 * provenance (text-[10px] faint). Section headers sit above all three.
 * ---------------------------------------------------------------------------- */

const Section: React.FC<{
  title: string;
  note?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, note, children, className }) => (
  <section className={cn("space-y-3", className)}>
    <div className="border-b border-border/60 pb-1.5">
      <h2 className="text-[14px] font-semibold tracking-tight text-foreground">{title}</h2>
      {note && <p className="pt-0.5 text-[11px] leading-snug text-muted-foreground/60">{note}</p>}
    </div>
    {children}
  </section>
);

const GroupLabel: React.FC<{ children: React.ReactNode; first?: boolean }> = ({ children, first }) => (
  <div
    className={cn(
      "sm:col-span-2",
      first ? "" : "mt-2 border-t border-border/50 pt-4",
    )}
  >
    <span className="text-[12px] font-medium text-muted-foreground">{children}</span>
  </div>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-sm border border-border/70 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
    {children}
  </span>
);

/** One data row: label + provenance on the left, value right-aligned in a fixed column. */
const DataRow: React.FC<{
  label: React.ReactNode;
  provenance: React.ReactNode;
  value: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
  wide?: boolean;
}> = ({ label, provenance, value, onClick, children, wide }) => (
  <div
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={
      onClick
        ? (e) => {
            if (e.key === "Enter") onClick();
          }
        : undefined
    }
    className={cn(
      "group grid min-h-[46px] grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 rounded-sm px-1 py-1",
      wide && "sm:col-span-2",
      onClick && "cursor-pointer hover:bg-muted/40",
    )}

  >
    <div className="min-w-0">
      <div className="text-[13px] leading-snug text-muted-foreground">
        {label}
        {onClick && (
          <span className="ml-1.5 text-[10px] text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/70">
            edit
          </span>
        )}
      </div>
      <div className="text-[11px] leading-snug text-muted-foreground/50">{provenance}</div>
    </div>
    <div className="min-w-0 justify-self-end break-words text-right">{value}</div>
    {children}
  </div>
);

const ValueText: React.FC<{ value: number | string | null; decimals?: number; computed?: boolean; entered?: boolean }> = ({
  value,
  decimals = 0,
  computed,
  entered,
}) => {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <span
      className={cn(
        "font-mono font-medium tabular-nums",
        typeof value === "number" ? "text-[15px]" : "text-[13px]",
        hasValue ? "text-foreground" : "text-muted-foreground/50",
        hasValue && computed && "border-b border-dotted border-muted-foreground/60",
      )}
    >
      {entered && hasValue && <span className="mr-0.5 text-primary/70">^</span>}
      {!hasValue ? "—" : typeof value === "number" ? nf(decimals).format(value) : value}
    </span>
  );
};

/** Read-only measured / computed figure. Provenance always visible. */
const Figure: React.FC<{
  label: string;
  value: number | string | null;
  decimals?: number;
  provenance?: FieldProvenance;
  computedInputs?: string;
  wide?: boolean;
}> = ({ label, value, decimals = 0, provenance, computedInputs, wide }) => {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <DataRow
      wide={wide}
      label={label}
      provenance={provenanceLine(provenance, hasValue, computedInputs)}
      value={
        <ValueText
          value={value}
          decimals={decimals}
          computed={(provenance?.origin ?? "ingested") === "computed"}
        />
      }
    />
  );
};

/** Editable figure. Whole row is the target; affordance appears on hover only. */
const EditableFigure: React.FC<{
  label: string;
  value: number | string | null;
  decimals?: number;
  provenance?: FieldProvenance;
  placeholder?: string;
  wide?: boolean;
  onSave: (raw: string) => void;
}> = ({ label, value, decimals = 0, provenance, placeholder, wide, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const hasValue = value !== null && value !== undefined && value !== "";

  const begin = () => {
    setDraft(value === null || value === undefined ? "" : String(value));
    setEditing(true);
  };

  const commit = () => {
    onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={cn("px-1 py-1", wide && "sm:col-span-2")}>
        <div className="text-[13px] text-muted-foreground">{label}</div>
        <div className="flex items-center gap-1 pt-1">
          <Input
            autoFocus
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="h-8 text-right font-mono text-xs tabular-nums"
          />
          <Button size="sm" className="h-7 text-[11px]" onClick={commit}>
            Save
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
        <div className="pt-0.5 text-[11px] text-muted-foreground/50">{provenanceLine(provenance, hasValue)}</div>
      </div>
    );
  }

  return (
    <DataRow
      wide={wide}
      label={label}
      provenance={provenanceLine(provenance, hasValue)}
      onClick={begin}
      value={
        <ValueText
          value={value}
          decimals={decimals}
          entered={provenance?.origin === "entered"}
        />
      }
    />
  );
};

/** Classification field. Text value, same right-aligned mono column. */
const DerivedField: React.FC<{
  label: string;
  value: string | null;
  provenance?: FieldProvenance;
  onSave: (v: string) => void;
  note?: string;
  placeholder?: string;
  wide?: boolean;
}> = ({ label, value, provenance, onSave, note, placeholder, wide }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const provText =
    provenance?.origin === "entered"
      ? `Entered by ${provenance.source ?? CURRENT_USER}${provenance.date ? ` · ${provenance.date}` : ""}`
      : (note ?? "Derived by VCG from our ontology");

  const commit = () => {
    onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={cn("px-1 py-1", wide && "sm:col-span-2")}>
        <div className="text-[13px] text-muted-foreground">{label}</div>
        <div className="flex items-center gap-1 pt-1">
          <Input
            autoFocus
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="h-7 text-xs"
          />
          <Button size="sm" className="h-7 text-[11px]" onClick={commit}>
            Save
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
        <div className="pt-0.5 text-[11px] text-muted-foreground/50">{provText}</div>
      </div>
    );
  }

  return (
    <DataRow
      wide={wide}
      label={label}
      provenance={provText}
      onClick={() => {
        setDraft(value ?? "");
        setEditing(true);
      }}
      value={<ValueText value={value} entered={provenance?.origin === "entered"} />}
    />
  );
};

/** Editable list of tags (application / product categories). */
const TagsField: React.FC<{
  label: string;
  values: string[];
  onSave: (v: string[]) => void;
  suggestions?: string[];
  /** Only the tag vocabulary spans both halves; category groups sit two per row. */
  wideField?: boolean;
}> = ({ label, values, onSave, suggestions = [], wideField }) => {

  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const add = (raw?: string) => {
    const v = normalizeTag(raw ?? draft);
    if (!v || hasTag(values, v)) {
      setDraft("");
      return;
    }
    onSave([...values, v]);
    setDraft("");
  };
  const q = draft.trim().toLowerCase();
  const matches = q
    ? suggestions.filter((s) => s.toLowerCase().includes(q) && !hasTag(values, s)).slice(0, 6)
    : [];
  return (
    <div className={cn("group min-h-[46px] px-1 py-1", wideField && "sm:col-span-2")}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[10px] text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/70"
          >
            edit
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1 pt-1">
        {values.length > 0 ? (
          values.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-sm border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[10px]"
            >
              {c}
              {open && (
                <button
                  type="button"
                  aria-label={`Remove ${c}`}
                  onClick={() => onSave(values.filter((x) => x !== c))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </span>
          ))
        ) : (
          <span className="font-mono text-[15px] text-muted-foreground/50">—</span>
        )}
      </div>
      {open && (
        <div className="flex items-center gap-1 pt-1.5">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
              if (e.key === "Escape") setOpen(false);
            }}
            maxLength={TAG_MAX_LENGTH}
            placeholder="Add…"
            className="h-7 max-w-[180px] text-xs"
          />
          <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => add()}>
            Add
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      )}
      {open && matches.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {matches.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-sm border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/** Compact labelled control for the decision bar. */
const BarField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({
  label,
  children,
  className,
}) => (
  <div className={cn("min-w-0 space-y-1", className)}>
    <div className="text-[11px] text-muted-foreground">{label}</div>
    {children}
  </div>
);

export const MaterialBrief: React.FC = () => {
  const { data, visible, rankTables, measureId, openBrief, closeBrief, openId, updateMaterial, countsFor } =
    useRegister();

  const tagSuggestions = useMemo(() => tagVocabulary(data).map((t) => t.tag), [data]);

  const index = visible.findIndex((r) => r.m.material_id === openId);
  const row = index >= 0 ? visible[index] : null;
  const material = data.find((m) => m.material_id === openId) ?? row?.m ?? null;

  const [draftStatus, setDraftStatus] = useState<JourneyStatus | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [draftBlockerCategory, setDraftBlockerCategory] = useState("");
  const [draftBlockerDetail, setDraftBlockerDetail] = useState("");
  const [draftBlockerCondition, setDraftBlockerCondition] = useState("");

  /** Header condenses once it sticks. */
  const sentinel = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { threshold: 1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  /** Records a numeric figure as entered, recomputing anything derived from it. */
  const saveFigure = (
    field: "annual_volume" | "unit_price" | "ghg_emission_factor" | "supplier_count",
    raw: string,
  ) => {
    const parsed = raw === "" ? null : Number(raw.replace(/[,\s]/g, ""));
    if (parsed !== null && !Number.isFinite(parsed)) return;
    const before = m[field];
    if (before === parsed) return;

    const patch: Partial<Material> = { [field]: parsed } as Partial<Material>;
    const provenance = { ...m.provenance };

    const volume = field === "annual_volume" ? parsed : m.annual_volume;
    const price = field === "unit_price" ? parsed : m.unit_price;
    const factor = field === "ghg_emission_factor" ? parsed : m.ghg_emission_factor;

    if (field === "annual_volume" || field === "unit_price") {
      patch.annual_spend = volume !== null && price !== null ? Math.round(volume * 1000 * price) : null;
      provenance.annual_spend = { origin: "computed", source: "volume x unit price", date: today() };
    }
    if (field === "annual_volume" || field === "ghg_emission_factor") {
      patch.ghg_contribution = volume !== null && factor !== null ? Math.round(volume * factor) : null;
      provenance.ghg_contribution = { origin: "computed", source: "emission factor x volume", date: today() };
    }
    patch.provenance = provenance;

    updateMaterial(m.material_id, patch, [field], [
      {
        material_id: m.material_id,
        event_type: "field_correction",
        field,
        from_value: before === null ? null : String(before),
        to_value: parsed === null ? null : String(parsed),
      },
    ]);
  };

  /** Records a free-text figure qualifier as entered. */
  const saveText = (field: "ghg_boundary" | "ghg_data_basis", raw: string) => {
    const next = raw === "" ? null : raw;
    if (next === m[field]) return;
    updateMaterial(m.material_id, { [field]: next } as Partial<Material>, [field], [
      {
        material_id: m.material_id,
        event_type: "field_correction",
        field,
        from_value: m[field],
        to_value: next,
      },
    ]);
  };

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
    const divergent = MEASURES.find((x) => x.id === row.gapMeasure)!;
    const divergentRank = row.ranks[divergent.id]!;
    const first = divergentRank < row.rank ? { m: divergent, r: divergentRank } : { m: active, r: row.rank };
    const second = divergentRank < row.rank ? { m: active, r: row.rank } : { m: divergent, r: divergentRank };
    return `Ranks ${first.r} on ${first.m.noun} but ${second.r} on ${second.m.noun}. ${row.gapSize} positions apart.`;
  };

  // One reading of the target date everywhere: planned date, else earliest need date.
  const targetDate = targetDateOf(m);

  return (
    <div className="pb-24">
      <div ref={sentinel} className="h-px" />

      {/* Header — full-width opaque bar, hairline beneath, above all page content */}
      <header
        className={cn(
          "sticky top-0 z-40 -mx-4 border-b border-border bg-background px-4 shadow-[0_1px_0_0_hsl(var(--border))] transition-all",
          stuck ? "py-2" : "pb-4 pt-2",
        )}
      >
        <div className="flex flex-nowrap items-center justify-between gap-4">

          <div className="min-w-0 leading-tight">
            {!stuck && (
              <div className="flex items-center gap-3 pb-0.5">
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
            )}

            <h1
              className={cn(
                "truncate font-semibold tracking-tight text-foreground transition-all",
                stuck ? "text-base" : "text-2xl",
              )}
            >
              {m.name}
            </h1>

            {!stuck && (
              <div className="font-mono text-[11px] leading-tight text-muted-foreground">
                {m.material_class ?? "Unclassified"} · CAS {m.cas_number ?? "—"} · {m.material_id}
              </div>
            )}


            {!stuck && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Their IDs</span>
                {m.customer_material_ids.length > 0 ? (
                  m.customer_material_ids.map((id) => <Chip key={id}>{id}</Chip>)
                ) : (
                  <span className="font-mono text-[10px] text-muted-foreground/50">No customer IDs</span>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <Button variant="outline" size="sm" className="h-8 text-[11px]">
              Export brief
            </Button>
            <Button size="sm" className="h-8 text-[11px]">
              Order intelligence
            </Button>
          </div>
        </div>
      </header>

      {/* Decision bar — the interactive layer above the reference material */}
      <div className="mt-4 border-b border-border bg-muted/30 px-3 py-3">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <BarField label="Status" className="w-[180px]">
            <Select
              value={draftStatus ?? m.journey_status}
              onValueChange={(v) => beginStatusChange(v as JourneyStatus)}
            >
              <SelectTrigger className="h-8 bg-background text-xs">
                <SelectValue asChild>
                  <span>
                    <StatusPill
                      status={draftStatus ?? m.journey_status}
                      entered={m.provenance.journey_status?.origin === "entered"}
                    />
                  </span>
                </SelectValue>
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
                Blocker: <span className="text-amber-700">{m.blocker_category}</span>
              </div>
            )}
          </BarField>

          <BarField label="Owner" className="w-[180px]">
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
              <SelectTrigger className="h-8 bg-background text-xs">
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
          </BarField>

          <BarField label="Priority" className="w-[220px]">
            <div className="flex items-center gap-2">
              <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-foreground">
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
                Selected
              </label>
              <Input
                value={m.priority_period ?? ""}
                onChange={(e) =>
                  updateMaterial(m.material_id, { priority_period: e.target.value || null }, ["priority_period"])
                }
                placeholder="Period"
                className="h-8 bg-background font-mono text-[11px]"
              />
            </div>
          </BarField>

          <BarField label="Target date" className="w-[140px]">
            <div className="flex h-8 items-center font-mono text-[13px] tabular-nums text-foreground">
              {targetDate ?? <span className="font-sans text-[12px] text-muted-foreground/60">Set date</span>}
            </div>
          </BarField>

          {draftStatus !== null && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">
                {JOURNEY_STATUS_LABEL[m.journey_status]} → {JOURNEY_STATUS_LABEL[draftStatus]}
              </span>
              <Button size="sm" className="h-7 text-[11px]" disabled={!canSaveStatus} onClick={saveStatusChange}>
                Save changes
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={cancelStatusChange}>
                Discard
              </Button>
            </div>
          )}
        </div>

        {draftStatus !== null && (
          <div className="mt-2.5 space-y-2 border-t border-border/60 pt-2.5">
            <Input
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Reason for change (optional)"
              className="h-7 bg-background text-[11px]"
            />

            {draftNeedsBlocker && (
              <div className="grid gap-2 rounded-sm border border-amber-500/30 bg-amber-500/5 p-2 sm:grid-cols-3">
                <Select value={draftBlockerCategory} onValueChange={setDraftBlockerCategory}>
                  <SelectTrigger className="h-8 bg-background text-xs">
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
                  className="h-7 bg-background text-[11px]"
                />
                <Input
                  value={draftBlockerCondition}
                  onChange={(e) => setDraftBlockerCondition(e.target.value)}
                  placeholder="What would have to change (optional)"
                  className="h-7 bg-background text-[11px]"
                />
              </div>
            )}

            {draftNeedsBlocker && !draftBlockerCategory && (
              <span className="text-[10px] text-amber-700">A blocker category is required for this status.</span>
            )}
          </div>
        )}
      </div>

      {/* Body — 55 / 45. Neither column scrolls. */}
      <div className="mt-8 grid items-start gap-x-10 gap-y-8 lg:grid-cols-[55fr_45fr]">

        {/* Left column */}
        <div className="space-y-10 self-start">
          <Section
            title="Figures"
            note="Measured and computed. Partial data is normal — a missing figure reads as no figure, never as zero."
          >
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <GroupLabel first>Volume and cost</GroupLabel>
              <EditableFigure
                label="Annual volume (t/yr)"
                value={m.annual_volume}
                provenance={m.provenance.annual_volume}
                placeholder="t/yr"
                onSave={(raw) => saveFigure("annual_volume", raw)}
              />
              <EditableFigure
                label="Unit price (EUR/kg)"
                value={m.unit_price}
                decimals={2}
                provenance={m.provenance.unit_price}
                placeholder="EUR/kg"
                onSave={(raw) => saveFigure("unit_price", raw)}
              />
              <Figure
                label="Annual spend (EUR)"
                value={m.annual_spend}
                provenance={m.provenance.annual_spend}
                computedInputs="volume x price"
              />

              <GroupLabel>Emissions</GroupLabel>
              <EditableFigure
                label="GHG emission factor (kgCO2e/kg)"
                value={m.ghg_emission_factor}
                decimals={2}
                provenance={m.provenance.ghg_emission_factor}
                placeholder="kgCO2e/kg"
                onSave={(raw) => saveFigure("ghg_emission_factor", raw)}
              />
              <Figure
                label="GHG contribution (tCO2e/yr)"
                value={m.ghg_contribution}
                provenance={m.provenance.ghg_contribution}
                computedInputs="volume x emission factor"
              />
              <EditableFigure
                label="GHG boundary"
                value={m.ghg_boundary}
                provenance={m.provenance.ghg_boundary}
                placeholder="e.g. Cradle-to-gate (A1-A3)"
                onSave={(raw) => saveText("ghg_boundary", raw)}
              />
              <EditableFigure
                label="GHG data basis"
                value={m.ghg_data_basis}
                provenance={m.provenance.ghg_data_basis}
                placeholder="e.g. Supplier-specific"
                onSave={(raw) => saveText("ghg_data_basis", raw)}
              />

              <GroupLabel>Supply</GroupLabel>
              <EditableFigure
                label="Suppliers"
                value={m.supplier_count}
                provenance={m.provenance.supplier_count}
                placeholder="count"
                onSave={(raw) => saveFigure("supplier_count", raw)}
              />
              <EditableFigure
                wide
                label="Supplier countries"
                value={m.supplier_countries.length > 0 ? m.supplier_countries.join(", ") : null}
                provenance={m.provenance.supplier_countries}
                placeholder="DE, FI, CN"
                onSave={(raw) => {
                  const next = raw
                    .split(",")
                    .map((x) => x.trim().toUpperCase())
                    .filter(Boolean);
                  updateMaterial(m.material_id, { supplier_countries: next }, ["supplier_countries"], [
                    {
                      material_id: m.material_id,
                      event_type: "field_correction",
                      field: "supplier_countries",
                      from_value: m.supplier_countries.join(", ") || null,
                      to_value: next.join(", ") || null,
                    },
                  ]);
                }}
              />
            </div>
          </Section>

          <Section title="Classification" note="Identity and classification. Corrections are written to the event log.">
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <DerivedField
                label="Name"
                value={m.name}
                provenance={m.provenance.name}
                note="Source: not recorded"
                placeholder="Material name"
                onSave={(v) =>
                  v &&
                  v !== m.name &&
                  updateMaterial(m.material_id, { name: v }, ["name"], [
                    {
                      material_id: m.material_id,
                      event_type: "field_correction",
                      field: "name",
                      from_value: m.name,
                      to_value: v,
                    },
                  ])
                }
              />
              <DerivedField
                label="CAS number"
                value={m.cas_number}
                provenance={m.provenance.cas_number}
                placeholder="e.g. 13463-67-7"
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
                label="Material class"
                value={m.material_class}
                provenance={m.provenance.material_class}
                placeholder="Material class"
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
              <TagsField
                wideField
                label="Tags"

                values={m.tags}
                suggestions={tagSuggestions}
                onSave={(v) => {
                  const next = cleanTags(v);
                  updateMaterial(m.material_id, { tags: next }, ["tags"], [
                    {
                      material_id: m.material_id,
                      event_type: "tags_change",
                      field: "tags",
                      from_value: formatTags(m.tags) || null,
                      to_value: formatTags(next) || null,
                    },
                  ]);
                }}
              />
              <TagsField
                label="Application categories"
                values={m.application_categories}
                onSave={(v) =>
                  updateMaterial(m.material_id, { application_categories: v }, ["application_categories"], [
                    {
                      material_id: m.material_id,
                      event_type: "field_correction",
                      field: "application_categories",
                      from_value: m.application_categories.join(", ") || null,
                      to_value: v.join(", ") || null,
                    },
                  ])
                }
              />
              <TagsField
                label="Product categories"
                values={m.product_categories}
                onSave={(v) =>
                  updateMaterial(m.material_id, { product_categories: v }, ["product_categories"], [
                    {
                      material_id: m.material_id,
                      event_type: "field_correction",
                      field: "product_categories",
                      from_value: m.product_categories.join(", ") || null,
                      to_value: v.join(", ") || null,
                    },
                  ])
                }
              />
              <div className="px-1 py-1 sm:col-span-2">
                <div className="text-[13px] text-muted-foreground">Entry type</div>
                <Select
                  value={m.entry_type}
                  onValueChange={(v) => {
                    if (v === m.entry_type) return;
                    updateMaterial(m.material_id, { entry_type: v as Material["entry_type"] }, ["entry_type"], [
                      {
                        material_id: m.material_id,
                        event_type: "field_correction",
                        field: "entry_type",
                        from_value: ENTRY_TYPE_LABEL[m.entry_type] ?? m.entry_type,
                        to_value: ENTRY_TYPE_LABEL[v as Material["entry_type"]] ?? v,
                      },
                    ]);
                  }}
                >
                  <SelectTrigger className="mt-1 h-8 max-w-[240px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ENTRY_TYPE_LABEL) as Material["entry_type"][]).map((k) => (
                      <SelectItem key={k} value={k} className="text-xs">
                        {ENTRY_TYPE_LABEL[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          {/* What the replacement has to achieve. Nothing stated is not a zero target. */}
          <Section
            title="Requirements"
            note="What the replacement has to achieve. A requirement nobody stated stays empty."
          >
            {m.requirements === null ? (
              <p className="text-[11px] text-muted-foreground/70">No requirements recorded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {(
                  [
                    ["Target volume", m.requirements.target_volume, "t/yr", 0],
                    ["Price ceiling", m.requirements.price_ceiling, "EUR/kg", 2],
                    ["GHG reduction target", m.requirements.ghg_reduction_target, "%", 0],
                  ] as [string, number | null, string, number][]
                ).map(([label, value, unit, decimals]) => (
                  <div key={label} className="min-w-0">
                    <div className="font-mono text-sm tabular-nums text-foreground">
                      {value === null ? (
                        <span className="font-sans text-[12px] text-muted-foreground/50">—</span>
                      ) : (
                        `${nf(decimals).format(value)} ${unit}`
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{label}</div>
                  </div>
                ))}
                <div className="min-w-0">
                  <div className="font-mono text-sm tabular-nums text-foreground">
                    {m.requirements.earliest_need_date ?? (
                      <span className="font-sans text-[12px] text-muted-foreground/50">—</span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">Earliest need date</div>
                </div>
                <div className="col-span-2 min-w-0">
                  <div className="text-[12px] text-foreground">
                    {m.requirements.required_certifications.length > 0
                      ? m.requirements.required_certifications.join(", ")
                      : <span className="text-muted-foreground/50">—</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">Required certifications</div>
                </div>
                {m.requirements.notes && (
                  <div className="col-span-2 min-w-0">
                    <div className="text-[12px] leading-snug text-foreground">{m.requirements.notes}</div>
                    <div className="text-[11px] text-muted-foreground">Notes</div>
                  </div>
                )}
              </div>
            )}
          </Section>

        </div>

        {/* Right column */}
        <div className="space-y-10 self-start">
          <Section title="Position" note="Four separate positions. Never combined into one score.">
            <PositionBlock
              materialId={m.material_id}
              gapMeasure={row?.gapMeasure ?? null}
              gapSize={row?.gapSize ?? 0}
              variant="detail"
            />
            {gapSentence() && <p className="pt-2 text-[11px] text-amber-700">{gapSentence()}</p>}
          </Section>

          <div className="-mx-3 rounded-md bg-primary/5 px-3 py-3">
            <Section title="Scores" note="These are judgements recorded by your team, not measured data.">
              <BriefDriverScores materialId={m.material_id} />
            </Section>
          </div>

          {/* Where the outside search stands. "Not ordered" is a state, not a gap. */}
          <Section title="Intelligence" note="Whether a market and supplier search has been ordered for this material.">
            <div className="text-sm text-foreground">{INTELLIGENCE_STATUS_LABEL[m.intelligence_status]}</div>
            <dl className="pt-2 space-y-1 text-[11px] text-muted-foreground">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground/60">Ordered</dt>
                <dd className="font-mono tabular-nums">
                  {m.intelligence_ordered_date ?? <span className="font-sans text-muted-foreground/50">—</span>}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground/60">Delivered</dt>
                <dd className="font-mono tabular-nums">
                  {m.intelligence_delivered_date ?? <span className="font-sans text-muted-foreground/50">—</span>}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground/60">Scope</dt>
                <dd className="min-w-0">
                  {m.intelligence_scope ?? <span className="text-muted-foreground/50">Not stated</span>}
                </dd>
              </div>
            </dl>
          </Section>


          <Section title="History" note="The record of decisions. Newest first.">
            <MaterialHistory materialId={m.material_id} />
          </Section>
        </div>
      </div>

      {/* Requirements — one quiet full-width row beneath both columns */}
      <div className="mt-10 border-t border-border/60 pt-3">
        <BriefStepCards material={m} scoredCount={countsFor(m.material_id).scored_count ?? 0} />
      </div>
    </div>
  );
};

export default MaterialBrief;
