import { ComingSoonTag, VCG_RULE } from "@/components/materialRegister/vcgSignals";
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
  type FieldProvenance,
  type JourneyStatus,
  type Material,
} from "@/types/materialPrioritisation";
import { BLOCKER_CATEGORIES } from "@/components/materialRegister/BulkActionDialog";
import { nf, provenanceLine, provenanceStamp, StatusPill } from "@/components/materialRegister/primitives";
import PositionBlock from "@/components/materialRegister/PositionBlock";
import MaterialHistory from "@/components/materialRegister/MaterialHistory";
import BriefAssessment from "@/components/materialRegister/BriefAssessment";
import BriefGate from "@/components/materialRegister/BriefGate";
import ExportDecisionDialog from "@/components/materialRegister/ExportDecisionDialog";
import { hasOverdueCondition, holdReviewOverdue } from "@/components/materialRegister/gate";
import { cleanTags, formatTags, hasTag, normalizeTag, tagVocabulary, TAG_MAX_LENGTH } from "@/components/materialRegister/tags";
import { isProductLineTag } from "@/components/materialRegister/productLines";

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
  <section className={cn("space-y-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm", className)}>
    <div className="border-b border-border/70 pb-1.5">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground">{title}</h2>
      {note && <p className="pt-1 text-xs leading-snug text-muted-foreground">{note}</p>}
    </div>
    {children}
  </section>
);

/**
 * VCG signals card — announced, not yet live. The three signals are named so the
 * team knows what is coming, but no value is shown: an unbuilt signal must never
 * read as a measured one.
 */
const VcgSignalsCard: React.FC<{ material: Material }> = ({ material }) => {
  const rows: [string, string][] = [
    ["Substitutability", "Whether a commercial substitution path exists today"],
    ["Suppliers", "How many suppliers VCG can find for an alternative"],
    ["Competitor activity", "Whether competitor movement is detectable"],
  ];

  return (
    <section
      className={cn(
        "space-y-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm",
        VCG_RULE,
      )}
    >
      <div className="border-b border-border/70 pb-1.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-provenance-vcg">VCG signals</h2>
          <ComingSoonTag />
        </div>
        <p className="pt-1 text-xs leading-snug text-muted-foreground">
          Computed by VCG from our data — not measurements taken by your team. Not live yet, so nothing here
          feeds a decision.
        </p>
      </div>

      <div className="divide-y divide-border/50">
        {rows.map(([label, what]) => (
          <div key={label} className="flex items-start justify-between gap-4 py-2">
            <div>
              <div className="text-xs font-medium text-foreground">{label}</div>
              <div className="pt-0.5 text-[10px] leading-snug text-muted-foreground">{what}</div>
            </div>
            <div className="shrink-0 pt-0.5">
              <ComingSoonTag />
            </div>
          </div>
        ))}
      </div>

      <p className="border-t border-border/50 pt-2.5 text-xs leading-snug text-muted-foreground">
        Signals only. Pathway detail, supplier identity, and competitor breakdown will sit behind an
        intelligence order.
      </p>
      <Button
        size="sm"
        disabled
        className="h-7 bg-foreground text-xs text-background hover:bg-foreground/90"
      >
        Order intelligence
      </Button>
    </section>
  );
};

const GroupLabel: React.FC<{ children: React.ReactNode; first?: boolean }> = ({ children, first }) => (
  <div
    className={cn(
      "sm:col-span-2",
      first ? "" : "mt-2 border-t border-border/50 pt-4",
    )}
  >
    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</span>
  </div>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-sm border border-border/70 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
    {children}
  </span>
);

/** Header classification group: a quiet label with its values beside it. */
const HeadGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <span className="flex flex-wrap items-center gap-1.5">
    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">{label}</span>
    {children}
  </span>
);

const NoneYet: React.FC = () => (
  <span className="font-mono text-[10px] text-muted-foreground/50" title="Nothing recorded">
    —
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
  field?: string;
  value: number | string | null;
  decimals?: number;
  provenance?: FieldProvenance;
  computedInputs?: string;
  wide?: boolean;
}> = ({ label, field, value, decimals = 0, provenance, computedInputs, wide }) => {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <DataRow
      wide={wide}
      label={label}
      provenance={field ? provenanceStamp(field, provenance, hasValue, computedInputs) : provenanceLine(provenance, hasValue, computedInputs)}
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
  field?: string;
  value: number | string | null;
  decimals?: number;
  provenance?: FieldProvenance;
  placeholder?: string;
  wide?: boolean;
  onSave: (raw: string) => void;
}> = ({ label, field, value, decimals = 0, provenance, placeholder, wide, onSave }) => {
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
        <div className="pt-0.5 text-[11px] text-muted-foreground/50">
          {field ? provenanceStamp(field, provenance, hasValue) : provenanceLine(provenance, hasValue)}
        </div>
      </div>
    );
  }

  return (
    <DataRow
      wide={wide}
      label={label}
      provenance={field ? provenanceStamp(field, provenance, hasValue) : provenanceLine(provenance, hasValue)}
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

/** Editable list of tags (application / application areas). */
const TagsField: React.FC<{
  label: string;
  values: string[];
  onSave: (v: string[]) => void;
  suggestions?: string[];
  /** Only the tag vocabulary spans both halves; category groups sit two per row. */
  wideField?: boolean;
  /** Tags carry a type: product line tags render as brand lines, never as general tags. */
  typedTags?: boolean;
}> = ({ label, values, onSave, suggestions = [], wideField, typedTags }) => {

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
          [...values]
            .sort((a, b) =>
              typedTags
                ? Number(isProductLineTag(b)) - Number(isProductLineTag(a))
                : 0,
            )
            .map((c) => (
            <span
              key={c}
              className={cn(
                "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px]",
                typedTags && isProductLineTag(c)
                  ? "border-primary/40 bg-primary/10 font-medium text-foreground"
                  : "border-border/70 bg-muted/50",
              )}
            >
              {typedTags && isProductLineTag(c) && (
                <span className="text-[9px] uppercase tracking-wider text-primary">line</span>
              )}
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
  const {
    data,
    allMaterials,
    visible,
    rankTables,
    measureId,
    openBrief,
    closeBrief,
    openId,
    updateMaterial,
    assessmentSummary,
  } = useRegister();

  const tagSuggestions = useMemo(() => tagVocabulary(allMaterials).map((t) => t.tag), [allMaterials]);

  const index = visible.findIndex((r) => r.m.material_id === openId);
  const row = index >= 0 ? visible[index] : null;
  // Scope narrows the list, never the material: the brief reads the whole register.
  const material = allMaterials.find((m) => m.material_id === openId) ?? row?.m ?? null;

  const [draftStatus, setDraftStatus] = useState<JourneyStatus | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [draftBlockerCategory, setDraftBlockerCategory] = useState("");
  const [draftBlockerDetail, setDraftBlockerDetail] = useState("");
  const [draftBlockerCondition, setDraftBlockerCondition] = useState("");
  const [comments, setComments] = useState<
    Record<string, { id: string; author: string; at: string; body: string }[]>
  >({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  /** Export is a confirm-and-complete act: a dialog, then a one-line receipt. */
  const [exportOpen, setExportOpen] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);


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

  /** Periods already in use, offered as autocomplete. Null is not prioritised. */
  const periodSuggestions = [
    ...new Set(data.map((x) => x.priority_period).filter((v): v is string => Boolean(v))),
  ].sort();

  /** A period is the whole of priority: setting it joins the set, clearing it leaves. */
  const commitPeriod = (next: string | null) => {
    updateMaterial(m.material_id, { priority_period: next }, ["priority_period"], [
      {
        material_id: m.material_id,
        event_type: "priority_change",
        field: "priority_period",
        from_value: m.priority_period,
        to_value: next,
      },
    ]);
  };



  /** Records a numeric figure as entered, recomputing anything derived from it. */
  const saveFigure = (
    field: "annual_volume" | "unit_price" | "ghg_emission_factor",
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

  const draftNeedsBlocker = draftStatus === "hold" || draftStatus === "no_go";
  const canSaveStatus = draftStatus !== null && (!draftNeedsBlocker || draftBlockerCategory !== "");

  const beginStatusChange = (next: JourneyStatus) => {
    if (next === m.journey_status) {
      setDraftStatus(null);
      return;
    }
    setDraftStatus(next);
    setStatusReason("");
    setDraftBlockerCategory(next === "hold" || next === "no_go" ? (m.blocker_category ?? "") : "");
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
    if (!row || row.gapMeasure === null || row.rank === null || measureId === "all") return null;
    const active = MEASURES.find((x) => x.id === measureId)!;
    const divergent = MEASURES.find((x) => x.id === row.gapMeasure)!;
    const divergentRank = row.ranks[divergent.id]!;
    const first = divergentRank < row.rank ? { m: divergent, r: divergentRank } : { m: active, r: row.rank };
    const second = divergentRank < row.rank ? { m: active, r: row.rank } : { m: divergent, r: divergentRank };
    return `Ranks ${first.r} on ${first.m.noun} but ${second.r} on ${second.m.noun}. ${row.gapSize} positions apart.`;
  };

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
        <div className="grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-2">
          {/* Top-left: back button aligned with pagination */}
          {!stuck && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={closeBrief}
                className="h-7 gap-1.5 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            </div>
          )}

          {/* Top-right: pagination sits above the action buttons */}
          <div className="flex shrink-0 items-center justify-end gap-3 whitespace-nowrap">
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

          {/* Bottom-left: title metadata */}
          <div className="min-w-0 leading-tight">
            {!stuck && (
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Material profile
              </div>
            )}

            <h1
              className={cn(
                "truncate font-semibold tracking-tight text-foreground transition-all",
                stuck ? "text-sm" : "text-lg",
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
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">IDs</span>
                {m.customer_material_ids.length > 0 ? (
                  m.customer_material_ids.map((id) => <Chip key={id}>{id}</Chip>)
                ) : (
                  <span className="font-mono text-[10px] text-muted-foreground/50">No customer IDs</span>
                )}
              </div>
            )}

            {/* Classification, read here and corrected in the dialog. */}
            {!stuck && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2">
                <HeadGroup label="Tags">
                  {m.tags.length > 0 ? (
                    m.tags.map((t) => (
                      <Chip key={t}>
                        {isProductLineTag(t) && (
                          <span className="mr-1 text-[8px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                            Line
                          </span>
                        )}
                        {t}
                      </Chip>
                    ))
                  ) : (
                    <NoneYet />
                  )}
                </HeadGroup>
                <HeadGroup label="Categories">
                  {m.application_categories.length > 0 ? (
                    m.application_categories.map((t) => <Chip key={t}>{t}</Chip>)
                  ) : (
                    <NoneYet />
                  )}
                </HeadGroup>
                <HeadGroup label="Areas">
                  {m.application_areas.length > 0 ? (
                    m.application_areas.map((t) => <Chip key={t}>{t}</Chip>)
                  ) : (
                    <NoneYet />
                  )}
                </HeadGroup>
                <HeadGroup label="Entry type">
                  <span className="text-[11px] text-foreground">
                    {ENTRY_TYPE_LABEL[m.entry_type] ?? m.entry_type}
                  </span>
                </HeadGroup>
              </div>
            )}
          </div>

          {/* Bottom-right: action buttons under pagination */}
          <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setExportOpen(true)}
            >
              Export decision
            </Button>
            <Button size="sm" className="h-7 bg-foreground text-xs text-background hover:bg-foreground/90">
              Order intelligence
            </Button>
          </div>
        </div>

        {exportNote && (
          <div className="mt-2 flex items-center gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2 py-1.5 text-[11px] text-emerald-800">
            <span>{exportNote}</span>
            <button type="button" className="ml-auto" onClick={() => setExportNote(null)}>
              <X className="h-3 w-3 opacity-60 hover:opacity-100" />
            </button>
          </div>
        )}
      </header>

      <ExportDecisionDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        materials={m ? [m] : []}
        onExported={() => setExportNote("Decision exported · 1 material")}
      />


      {/* Decision bar — the interactive layer above the reference material */}
      <div className="mt-4 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm">

        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          {/* Read-only here. The gate is set in the Gate card, by the owner only. */}
          <BarField label="Gate status" className="w-[180px]">
            <div className="flex h-8 flex-wrap items-center gap-1.5">
              <StatusPill status={m.journey_status} entered={m.provenance.journey_status?.origin === "entered"} />
              {(hasOverdueCondition(m) || holdReviewOverdue(m)) && (
                <span
                  className="text-[10px] font-medium text-amber-700 dark:text-amber-400"
                  title={hasOverdueCondition(m) ? "Condition overdue" : "Hold review overdue"}
                >
                  {hasOverdueCondition(m) ? "Condition overdue" : "Review overdue"}
                </span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground">Set in the Gate card</div>
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

          <BarField label="Priority period" className="w-[220px]">
            <div className="flex items-center gap-2">
              <Input
                list="priority-periods-in-use"
                defaultValue={m.priority_period ?? ""}
                key={m.material_id + (m.priority_period ?? "")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                onBlur={(e) => {
                  const next = e.target.value.trim() || null;
                  if (next === (m.priority_period ?? null)) return;
                  commitPeriod(next);
                }}
                placeholder="Not prioritised"
                className="h-8 bg-background font-mono text-[11px]"
              />
              <datalist id="priority-periods-in-use">
                {periodSuggestions.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              {m.priority_period !== null && (
                <button
                  type="button"
                  onClick={() => commitPeriod(null)}
                  className="shrink-0 text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </BarField>


          {draftStatus === null && (
            <div className="ml-auto" title="Calculated by the platform from the figures. Four separate positions, never combined into one score.">
              <div className="pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Position</div>
              <PositionBlock
                materialId={m.material_id}
                gapMeasure={row?.gapMeasure ?? null}
                gapSize={row?.gapSize ?? 0}
                variant="inline"
              />
            </div>
          )}

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

      </div>

      {/* Body — 55 / 45. Neither column scrolls. */}
      <div className="mt-4 grid items-start gap-x-4 gap-y-4 lg:grid-cols-[55fr_45fr]">

        {/* Left column */}
        <div className="space-y-4 self-start">
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
                typedTags
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
                label="Application areas"
                values={m.application_areas}
                onSave={(v) =>
                  updateMaterial(m.material_id, { application_areas: v }, ["application_areas"], [
                    {
                      material_id: m.material_id,
                      event_type: "field_correction",
                      field: "application_areas",
                      from_value: m.application_areas.join(", ") || null,
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

          <Section
            title="Figures"
            note="Measured and computed. Partial data is normal — a missing figure reads as no figure, never as zero."
          >
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <GroupLabel first>Volume and cost</GroupLabel>
              <EditableFigure
                label="Annual volume (t/yr)"
                field="annual_volume"
                value={m.annual_volume}
                provenance={m.provenance.annual_volume}
                placeholder="t/yr"
                onSave={(raw) => saveFigure("annual_volume", raw)}
              />
              <EditableFigure
                label="Unit price (EUR/kg)"
                field="unit_price"
                value={m.unit_price}
                decimals={2}
                provenance={m.provenance.unit_price}
                placeholder="EUR/kg"
                onSave={(raw) => saveFigure("unit_price", raw)}
              />
              <Figure
                label="Annual spend (EUR)"
                field="annual_spend"
                value={m.annual_spend}
                provenance={m.provenance.annual_spend}
                computedInputs="volume x price"
              />

              <GroupLabel>Emissions</GroupLabel>
              <EditableFigure
                label="GHG emission factor (kgCO2e/kg)"
                field="ghg_emission_factor"
                value={m.ghg_emission_factor}
                decimals={2}
                provenance={m.provenance.ghg_emission_factor}
                placeholder="kgCO2e/kg"
                onSave={(raw) => saveFigure("ghg_emission_factor", raw)}
              />
              <Figure
                label="GHG contribution (tCO2e/yr)"
                field="ghg_contribution"
                value={m.ghg_contribution}
                provenance={m.provenance.ghg_contribution}
                computedInputs="volume x emission factor"
              />
              <EditableFigure
                label="GHG boundary"
                field="ghg_boundary"
                value={m.ghg_boundary}
                provenance={m.provenance.ghg_boundary}
                placeholder="e.g. Cradle-to-gate (A1-A3)"
                onSave={(raw) => saveText("ghg_boundary", raw)}
              />
              <EditableFigure
                label="GHG data basis"
                field="ghg_data_basis"
                value={m.ghg_data_basis}
                provenance={m.provenance.ghg_data_basis}
                placeholder="e.g. Supplier-specific"
                onSave={(raw) => saveText("ghg_data_basis", raw)}
              />
            </div>
          </Section>

          {/* VCG signals — ours, computed, deliberately slim. */}
          <VcgSignalsCard material={m} />
        </div>

        {/* Right column */}
        <div className="space-y-4 self-start">
          {/* The gate sits above the assessment: a decision, not a measurement. */}
          <Section
            title="Gate"
            note="Two acts, kept apart. The owner recommends and reasons; the owner decides. Neither is calculated from the assessment."
          >
            <BriefGate material={m} />
          </Section>

          <Section
            title="Assessment"
            note="Five criteria. Two are read from data we already hold; three are judged by people, one entry each. They are never combined into a single score."
          >
            <BriefAssessment material={m} />
          </Section>





          <Section title="Comments" note="Published to the team. Everyone with access to this material can see them.">
            <div className="space-y-3">
              {(comments[m.material_id] ?? []).length === 0 ? (
                <p className="text-[11px] text-muted-foreground">No comments yet.</p>
              ) : (
                <ul className="space-y-3">
                  {(comments[m.material_id] ?? []).map((c) => (
                    <li key={c.id} className="border-l-2 border-border/70 pl-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-medium text-foreground">{c.author}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {new Date(c.at).toLocaleString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-foreground">{c.body}</p>
                    </li>
                  ))}
                </ul>
              )}

              <textarea
                value={draft[m.material_id] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [m.material_id]: e.target.value }))}
                rows={3}
                placeholder="Write a comment for the team…"
                className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-[12px] leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Visible to all team members.</span>
                <button
                  type="button"
                  disabled={!(draft[m.material_id] ?? "").trim()}
                  onClick={() => {
                    const body = (draft[m.material_id] ?? "").trim();
                    if (!body) return;
                    setComments((prev) => ({
                      ...prev,
                      [m.material_id]: [
                        ...(prev[m.material_id] ?? []),
                        { id: `${Date.now()}`, author: "You", at: new Date().toISOString(), body },
                      ],
                    }));
                    setDraft((d) => ({ ...d, [m.material_id]: "" }));
                  }}
                  className="rounded-md bg-foreground px-3 py-1.5 text-[11px] font-medium text-background disabled:opacity-40"
                >
                  Publish
                </button>
              </div>
            </div>
          </Section>

        </div>
      </div>

      {/* History — one full-width row beneath both columns */}
      <div className="mt-10 border-t border-border/60 pt-3">
        <Section title="History" note="The record of decisions. Newest first.">
          <MaterialHistory materialId={m.material_id} />
        </Section>
      </div>

    </div>
  );
};

export default MaterialBrief;
