import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { materials as seedMaterials } from "@/data/materialPrioritisationMock";
import {
  JOURNEY_STATUS_LABEL,
  type EntryType,
  type FieldProvenance,
  type JourneyStatus,
  type Material,
} from "@/types/materialPrioritisation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import MultiSelectFilter from "@/components/materialRegister/MultiSelectFilter";
import BulkActionDialog, {
  type BulkKind,
  type BulkPayload,
} from "@/components/materialRegister/BulkActionDialog";
import { X } from "lucide-react";

const CURRENT_USER = "You";

const nf = (decimals = 0) =>
  new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });

const Missing = () => (
  <span className="text-muted-foreground/50" title="No value recorded — unranked">
    —
  </span>
);

interface NumProps {
  value: number | null;
  decimals?: number;
  provenance?: FieldProvenance;
  emphasis?: boolean;
}

/**
 * Numeric cell. null renders as a muted em-dash (never 0, never bottom-ranked).
 * Computed values carry a dotted underline; entered judgements are marked with a
 * caret so they never read as a measurement.
 */
const NumCell: React.FC<NumProps> = ({ value, decimals = 0, provenance, emphasis }) => {
  if (value === null || value === undefined) return <Missing />;

  const origin = provenance?.origin ?? "ingested";
  const title = provenance
    ? `${origin}${provenance.source ? ` · ${provenance.source}` : ""}${provenance.date ? ` · ${provenance.date}` : ""}`
    : undefined;

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        origin === "computed" && "border-b border-dotted border-muted-foreground/60",
        emphasis && "font-medium text-foreground",
      )}
      title={title}
    >
      {origin === "entered" && <span className="mr-0.5 text-primary/70">^</span>}
      {nf(decimals).format(value)}
    </span>
  );
};

const STATUS_STYLES: Record<JourneyStatus, string> = {
  not_started: "bg-muted text-muted-foreground border-border",
  under_evaluation: "bg-primary/10 text-primary border-primary/20",
  in_testing: "bg-primary/10 text-primary border-primary/20",
  qualified: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  sourcing: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  in_use: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  parked: "bg-muted text-foreground/60 border-border",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const StatusPill: React.FC<{ status: JourneyStatus; entered?: boolean }> = ({ status, entered }) => (
  <span
    className={cn(
      "inline-flex items-center whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
      STATUS_STYLES[status],
    )}
    title={entered ? "entered judgement" : undefined}
  >
    {entered && <span className="mr-0.5 text-primary/70">^</span>}
    {JOURNEY_STATUS_LABEL[status]}
  </span>
);

const HEAD =
  "sticky top-0 z-10 bg-muted/60 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border";

type MeasureId = "spend" | "emissions" | "volume" | "multi_application";

interface Measure {
  id: MeasureId;
  label: string;
  /** compact chip label */
  short: string;
  /** label used in the unranked divider, lower-case */
  noun: string;
  value: (m: Material) => number | null;
}

const MEASURES: Measure[] = [
  { id: "spend", label: "Spend", short: "SPD", noun: "spend", value: (m) => m.annual_spend },
  { id: "emissions", label: "Emissions", short: "GHG", noun: "emissions", value: (m) => m.ghg_contribution },
  { id: "volume", label: "Volume", short: "VOL", noun: "volume", value: (m) => m.annual_volume },
  {
    id: "multi_application",
    label: "Multi-application",
    short: "APP",
    noun: "application",
    value: (m) => (m.application_categories && m.application_categories.length > 0 ? m.application_categories.length : null),
  },
];

/** A gap counts as divergent at or above this share of the ranked population. */
export const DIVERGENCE_THRESHOLD_RATIO = 0.25;

const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
  substitute_material_source: "Substitute material source",
  new_material: "New material",
};

const UNASSIGNED_OWNER = "__unassigned__";

interface RankTable {
  ranks: Record<string, number | null>;
  rankedCount: number;
  order: Material[];
  unranked: Material[];
}

/** Descending ranking. Ties share a rank, next rank skips. Missing value → null. */
function computeRanks(rows: Material[], measure: Measure): RankTable {
  const ranked = rows.filter((m) => measure.value(m) !== null);
  const unranked = rows.filter((m) => measure.value(m) === null);

  ranked.sort((a, b) => {
    const diff = (measure.value(b) as number) - (measure.value(a) as number);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
  unranked.sort((a, b) => a.name.localeCompare(b.name));

  const ranks: Record<string, number | null> = {};
  let lastValue: number | null = null;
  let lastRank = 0;
  ranked.forEach((m, i) => {
    const v = measure.value(m) as number;
    const rank = lastValue !== null && v === lastValue ? lastRank : i + 1;
    lastValue = v;
    lastRank = rank;
    ranks[m.material_id] = rank;
  });
  unranked.forEach((m) => {
    ranks[m.material_id] = null;
  });

  return { ranks, rankedCount: ranked.length, order: ranked, unranked };
}

interface RankedRow {
  m: Material;
  rank: number | null;
  ranks: Record<MeasureId, number | null>;
  gapMeasure: MeasureId | null;
  gapSize: number;
}

interface Filters {
  search: string;
  classes: string[];
  statuses: string[];
  owners: string[];
  entryTypes: string[];
  groups: string[];
}

const EMPTY_FILTERS: Filters = {
  search: "",
  classes: [],
  statuses: [],
  owners: [],
  entryTypes: [],
  groups: [],
};

const today = () => new Date().toISOString().slice(0, 10);

export const MaterialRegisterTable: React.FC<{ rows?: Material[] }> = ({ rows = seedMaterials }) => {
  const [data, setData] = useState<Material[]>(rows);
  const [measureId, setMeasureId] = useState<MeasureId>("spend");
  const [onlyUnranked, setOnlyUnranked] = useState(false);
  const [onlyDivergent, setOnlyDivergent] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [onlySelected, setOnlySelected] = useState(false);
  const [bulkKind, setBulkKind] = useState<BulkKind | null>(null);
  const [toast, setToast] = useState<{ message: string; snapshot: Material[] } | null>(null);

  const measure = MEASURES.find((x) => x.id === measureId)!;

  // ---- filter option sets, from the data itself
  const options = useMemo(() => {
    const uniq = (vals: (string | null)[]) =>
      [...new Set(vals.filter((v): v is string => Boolean(v)))].sort((a, b) => a.localeCompare(b));
    return {
      classes: uniq(data.map((m) => m.material_class)).map((v) => ({ value: v, label: v })),
      statuses: (Object.keys(JOURNEY_STATUS_LABEL) as JourneyStatus[]).map((s) => ({
        value: s,
        label: JOURNEY_STATUS_LABEL[s],
      })),
      owners: [
        ...uniq(data.map((m) => m.owner)).map((v) => ({ value: v, label: v })),
        { value: UNASSIGNED_OWNER, label: "Unassigned" },
      ],
      entryTypes: uniq(data.map((m) => m.entry_type)).map((v) => ({
        value: v,
        label: ENTRY_TYPE_LABEL[v as EntryType] ?? v,
      })),
      groups: uniq(data.map((m) => m.customer_material_group)).map((v) => ({ value: v, label: v })),
    };
  }, [data]);

  const ownerNames = useMemo(
    () => options.owners.filter((o) => o.value !== UNASSIGNED_OWNER).map((o) => o.value),
    [options.owners],
  );

  const filtersActive =
    filters.search.trim() !== "" ||
    filters.classes.length > 0 ||
    filters.statuses.length > 0 ||
    filters.owners.length > 0 ||
    filters.entryTypes.length > 0 ||
    filters.groups.length > 0;

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return data.filter((m) => {
      if (q) {
        const hay = [m.name, m.cas_number ?? "", ...(m.customer_material_ids ?? [])]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.classes.length && !filters.classes.includes(m.material_class ?? "")) return false;
      if (filters.statuses.length && !filters.statuses.includes(m.journey_status)) return false;
      if (filters.owners.length) {
        const key = m.owner ?? UNASSIGNED_OWNER;
        if (!filters.owners.includes(key)) return false;
      }
      if (filters.entryTypes.length && !filters.entryTypes.includes(m.entry_type)) return false;
      if (filters.groups.length && !filters.groups.includes(m.customer_material_group ?? "")) return false;
      return true;
    });
  }, [data, filters]);

  const { ordered, rankedCount, total, rankTables } = useMemo(() => {
    const tables = {} as Record<MeasureId, RankTable>;
    MEASURES.forEach((mm) => {
      tables[mm.id] = computeRanks(filtered, mm);
    });

    const active = tables[measureId];
    const threshold = active.rankedCount * DIVERGENCE_THRESHOLD_RATIO;

    const build = (m: Material, rank: number | null): RankedRow => {
      const ranks = {} as Record<MeasureId, number | null>;
      MEASURES.forEach((mm) => {
        ranks[mm.id] = tables[mm.id].ranks[m.material_id] ?? null;
      });

      let gapMeasure: MeasureId | null = null;
      let gapSize = 0;
      if (rank !== null) {
        MEASURES.forEach((mm) => {
          if (mm.id === measureId) return;
          const other = ranks[mm.id];
          if (other === null) return;
          const d = Math.abs(other - rank);
          if (d > gapSize) {
            gapSize = d;
            gapMeasure = mm.id;
          }
        });
      }
      const flagged = gapMeasure !== null && gapSize >= threshold && gapSize > 0;

      return { m, rank, ranks, gapMeasure: flagged ? gapMeasure : null, gapSize };
    };

    const orderedRows: RankedRow[] = [
      ...active.order.map((m) => build(m, active.ranks[m.material_id] ?? null)),
      ...active.unranked.map((m) => build(m, null)),
    ];

    return {
      ordered: orderedRows,
      rankedCount: active.rankedCount,
      total: filtered.length,
      rankTables: tables,
    };
  }, [filtered, measureId]);

  const missingCount = total - rankedCount;
  const divergentCount = ordered.filter((r) => r.gapMeasure !== null).length;

  const bothFilters = onlyUnranked && onlyDivergent;
  const visible = bothFilters
    ? []
    : ordered.filter(
        (r) =>
          (!onlyUnranked || r.rank === null) &&
          (!onlyDivergent || r.gapMeasure !== null) &&
          (!onlySelected || selected.has(r.m.material_id)),
      );

  const firstUnrankedId =
    onlyUnranked || onlyDivergent ? null : visible.find((r) => r.rank === null)?.m.material_id ?? null;

  const activeCol = (id: MeasureId) => measureId === id;
  const emphHead = (id: MeasureId) => (activeCol(id) ? "text-primary" : undefined);

  const colCount = 11;

  const otherMeasures = MEASURES.filter((mm) => mm.id !== measureId);

  // ---- selection
  const visibleIds = visible.map((r) => r.m.material_id);
  const visibleSelectedCount = visibleIds.filter((id) => selected.has(id)).length;
  const headerChecked: boolean | "indeterminate" =
    visibleIds.length > 0 && visibleSelectedCount === visibleIds.length
      ? true
      : visibleSelectedCount > 0
        ? "indeterminate"
        : false;

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (visibleSelectedCount === visibleIds.length) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedMaterials = data.filter((m) => selected.has(m.material_id));
  const hiddenSelectedCount = selectedMaterials.filter(
    (m) => !visibleIds.includes(m.material_id),
  ).length;

  // ---- bulk write
  const entered = (): FieldProvenance => ({ origin: "entered", source: CURRENT_USER, date: today() });

  const applyBulk = (payload: BulkPayload) => {
    const ids = new Set(selected);
    const snapshot = data.filter((m) => ids.has(m.material_id)).map((m) => ({ ...m }));
    const stamp = today();

    setData((prev) =>
      prev.map((m) => {
        if (!ids.has(m.material_id)) return m;
        const next: Material = {
          ...m,
          provenance: { ...m.provenance },
          last_status_change_date: stamp,
          last_status_user: CURRENT_USER,
          last_change_batch_origin: "real_transition",
        };

        if (payload.kind === "status") {
          next.journey_status = payload.value as JourneyStatus;
          next.provenance.journey_status = entered();
          if (payload.blocker_category) {
            next.blocker_category = payload.blocker_category;
            next.blocker_detail = payload.blocker_detail ?? null;
            next.blocker_date = stamp;
            next.provenance.blocker_category = entered();
          }
        } else if (payload.kind === "owner") {
          next.owner = payload.value;
          next.provenance.owner = entered();
        } else {
          next.customer_material_group = payload.value;
          next.provenance.customer_material_group = entered();
        }
        return next;
      }),
    );

    const noun = payload.kind === "status" ? "Status" : payload.kind === "owner" ? "Owner" : "Tag";
    setToast({ message: `${noun} updated for ${ids.size} materials.`, snapshot });
    setBulkKind(null);
  };

  const undo = () => {
    if (!toast) return;
    const byId = new Map(toast.snapshot.map((m) => [m.material_id, m]));
    setData((prev) => prev.map((m) => byId.get(m.material_id) ?? m));
    setToast(null);
  };

  const chipTooltip = (row: RankedRow, mm: Measure) => {
    const other = row.ranks[mm.id];
    if (other === null) return `${mm.label}: no figure — unranked`;
    if (row.gapMeasure === mm.id && row.rank !== null) {
      const a = MEASURES.find((x) => x.id === measureId)!;
      const first = other < row.rank ? { m: mm, r: other } : { m: a, r: row.rank };
      const second = other < row.rank ? { m: a, r: row.rank } : { m: mm, r: other };
      return `Ranks ${first.r}${ordinal(first.r)} on ${first.m.noun} but ${second.r}${ordinal(
        second.r,
      )} on ${second.m.noun}. ${row.gapSize} positions apart.`;
    }
    return `${mm.label}: rank ${other} of ${rankTables[mm.id].rankedCount} ranked`;
  };

  const labelFor = (kind: keyof Filters, value: string) => {
    if (kind === "statuses") return JOURNEY_STATUS_LABEL[value as JourneyStatus];
    if (kind === "owners") return value === UNASSIGNED_OWNER ? "Unassigned" : value;
    if (kind === "entryTypes") return ENTRY_TYPE_LABEL[value as EntryType] ?? value;
    return value;
  };

  const activeChips: { kind: keyof Filters; value: string; label: string }[] = [];
  (["classes", "statuses", "owners", "entryTypes", "groups"] as const).forEach((k) => {
    filters[k].forEach((v) => activeChips.push({ kind: k, value: v, label: labelFor(k, v) }));
  });

  const removeChip = (kind: keyof Filters, value: string) =>
    setFilters((f) => ({ ...f, [kind]: (f[kind] as string[]).filter((v) => v !== value) }));

  return (
    <div className="w-full">
      {/* Rank control */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Ranked by</span>
          <div className="inline-flex items-center gap-1 rounded-md bg-muted p-0.5">
            {MEASURES.map((mm) => (
              <button
                key={mm.id}
                type="button"
                aria-pressed={measureId === mm.id}
                onClick={() => setMeasureId(mm.id)}
                className={cn(
                  "rounded-[4px] px-2.5 py-1 text-[11px] font-medium transition-colors",
                  measureId === mm.id
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mm.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-baseline gap-2 text-[11px] text-muted-foreground">
          <span>
            Ranking <span className="font-mono tabular-nums">{rankedCount}</span> of{" "}
            <span className="font-mono tabular-nums">{total}</span>
            {filtersActive ? " filtered" : ""}
          </span>
          {missingCount > 0 && (
            <button
              type="button"
              onClick={() => setOnlyUnranked((v) => !v)}
              className="text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              {onlyUnranked ? "Show all" : `${missingCount} missing`}
            </button>
          )}
        </div>

        <button
          type="button"
          aria-pressed={onlyDivergent}
          onClick={() => setOnlyDivergent((v) => !v)}
          className={cn(
            "rounded-sm border px-2 py-0.5 text-[11px] font-medium transition-colors",
            onlyDivergent
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          Divergent only (<span className="font-mono tabular-nums">{divergentCount}</span>)
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
        <Input
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder="Search name, CAS, customer ID"
          className="h-7 w-56 text-[11px]"
        />
        <MultiSelectFilter
          label="Class"
          options={options.classes}
          selected={filters.classes}
          onChange={(v) => setFilters((f) => ({ ...f, classes: v }))}
        />
        <MultiSelectFilter
          label="Status"
          options={options.statuses}
          selected={filters.statuses}
          onChange={(v) => setFilters((f) => ({ ...f, statuses: v }))}
        />
        <MultiSelectFilter
          label="Owner"
          options={options.owners}
          selected={filters.owners}
          onChange={(v) => setFilters((f) => ({ ...f, owners: v }))}
        />
        <MultiSelectFilter
          label="Entry type"
          options={options.entryTypes}
          selected={filters.entryTypes}
          onChange={(v) => setFilters((f) => ({ ...f, entryTypes: v }))}
        />
        <MultiSelectFilter
          label="Group"
          options={options.groups}
          selected={filters.groups}
          onChange={(v) => setFilters((f) => ({ ...f, groups: v }))}
        />
      </div>

      {(activeChips.length > 0 || filters.search.trim() !== "") && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          {filters.search.trim() !== "" && (
            <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 text-[10px]">
              “{filters.search}”
              <button type="button" onClick={() => setFilters((f) => ({ ...f, search: "" }))}>
                <X className="h-3 w-3 opacity-60 hover:opacity-100" />
              </button>
            </span>
          )}
          {activeChips.map((c) => (
            <span
              key={`${c.kind}-${c.value}`}
              className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 text-[10px]"
            >
              {c.label}
              <button type="button" onClick={() => removeChip(c.kind, c.value)}>
                <X className="h-3 w-3 opacity-60 hover:opacity-100" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-[11px]">
          <span className="font-medium text-foreground">
            <span className="font-mono tabular-nums">{selected.size}</span> selected
            {hiddenSelectedCount > 0 && (
              <span className="text-amber-700">
                {" "}
                — <span className="font-mono tabular-nums">{hiddenSelectedCount}</span> hidden by current
                filters
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setOnlySelected((v) => !v)}
            className="text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            {onlySelected ? "Show all rows" : "Show selected"}
          </button>
          <span className="ml-auto flex items-center gap-1.5">
            {(["status", "owner", "tag"] as BulkKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setBulkKind(k)}
                className="rounded-sm border border-border bg-background px-2 py-0.5 font-medium text-foreground hover:bg-muted"
              >
                Set {k}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setSelected(new Set());
                setOnlySelected(false);
              }}
              className="text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              Clear selection
            </button>
          </span>
        </div>
      )}

      {toast && (
        <div className="mt-2 flex items-center gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2 py-1.5 text-[11px] text-emerald-800">
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={undo}
            className="underline decoration-dotted underline-offset-2 hover:opacity-80"
          >
            Undo
          </button>
          <button type="button" onClick={() => setToast(null)} className="ml-auto">
            <X className="h-3 w-3 opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-2 py-2">
        <div className="text-xs font-medium text-foreground">
          <span className="font-mono tabular-nums">{visible.length}</span> of{" "}
          <span className="font-mono tabular-nums">{data.length}</span> materials
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="border-b border-dotted border-muted-foreground/60 font-mono">1 234</span> computed
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-primary/70">^</span> entered
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="rounded-sm bg-amber-500/10 px-1 font-mono text-amber-700">GHG 6</span> rank divergence
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-muted-foreground/50">—</span> no value (unranked)
          </span>
        </div>
      </div>

      <div className="max-h-[calc(100vh-16rem)] overflow-auto rounded-md border border-border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className={cn(HEAD, "w-8 px-2 py-2")}>
                <Checkbox
                  checked={headerChecked}
                  onCheckedChange={toggleAllVisible}
                  aria-label="Select all visible"
                  className="h-3.5 w-3.5"
                />
              </th>
              <th className={cn(HEAD, "w-10 px-2 py-2 text-right")}>#</th>
              <th className={cn(HEAD, "px-3 py-2 text-left")}>Material</th>
              <th className={cn(HEAD, "px-3 py-2 text-left")}>Other rankings</th>
              <th className={cn(HEAD, "px-3 py-2 text-right", emphHead("volume"))}>Annual volume (t/yr)</th>
              <th className={cn(HEAD, "px-3 py-2 text-right")}>Unit price (EUR/kg)</th>
              <th className={cn(HEAD, "px-3 py-2 text-right", emphHead("spend"))}>Annual spend (EUR)</th>
              <th className={cn(HEAD, "px-3 py-2 text-right", emphHead("emissions"))}>
                GHG contribution (tCO2e/yr)
              </th>
              {activeCol("multi_application") && (
                <th className={cn(HEAD, "px-3 py-2 text-right text-primary")}>Applications</th>
              )}
              <th className={cn(HEAD, "px-3 py-2 text-right")}>Suppliers</th>
              <th className={cn(HEAD, "px-3 py-2 text-left")}>Status</th>
              <th className={cn(HEAD, "px-3 py-2 text-left")}>Owner</th>
            </tr>
          </thead>
          <tbody>
            {bothFilters && (
              <tr>
                <td
                  colSpan={colCount + (activeCol("multi_application") ? 1 : 0)}
                  className="px-3 py-6 text-center text-[11px] text-muted-foreground"
                >
                  No material can be both unranked and divergent — an unranked material has no{" "}
                  {measure.noun} position to diverge from. Turn off one filter.
                </td>
              </tr>
            )}
            {!bothFilters && visible.length === 0 && (
              <tr>
                <td
                  colSpan={colCount + (activeCol("multi_application") ? 1 : 0)}
                  className="px-3 py-6 text-center text-[11px] text-muted-foreground"
                >
                  No materials match the current filters.
                </td>
              </tr>
            )}
            {visible.map((row) => {
              const { m, rank } = row;
              const isSelected = selected.has(m.material_id);
              return (
                <React.Fragment key={m.material_id}>
                  {m.material_id === firstUnrankedId && (
                    <tr>
                      <td colSpan={colCount + (activeCol("multi_application") ? 1 : 0)} className="p-0">
                        <div className="border-t border-border px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                          Unranked — no {measure.noun} figure
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr
                    className={cn(
                      "border-b border-border/60 last:border-0 hover:bg-muted/40",
                      rank === null && "text-muted-foreground",
                      isSelected && "bg-primary/5",
                    )}
                  >
                    <td className="px-2 py-1.5 align-top">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(m.material_id)}
                        aria-label={`Select ${m.name}`}
                        className="h-3.5 w-3.5"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right align-top font-mono tabular-nums text-muted-foreground">
                      {rank === null ? <span className="text-muted-foreground/50">—</span> : rank}
                    </td>
                    <td className="px-3 py-1.5 align-top">
                      <div className={cn("font-medium leading-tight", rank === null ? "text-foreground/70" : "text-foreground")}>
                        {m.name}
                      </div>
                      <div className="text-[10px] leading-tight text-muted-foreground">
                        {m.material_class ?? "Unclassified"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 align-top">
                      <span className="inline-flex items-center gap-1">
                        {otherMeasures.map((mm) => {
                          const other = row.ranks[mm.id];
                          const amber = row.gapMeasure === mm.id;
                          return (
                            <span
                              key={mm.id}
                              title={chipTooltip(row, mm)}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-sm px-1 py-0.5 font-mono text-[10px] tabular-nums",
                                amber ? "bg-amber-500/10 text-amber-700" : "text-muted-foreground/70",
                              )}
                            >
                              <span>{mm.short}</span>
                              {other === null ? (
                                <span className="text-muted-foreground/50">—</span>
                              ) : (
                                <span className={amber ? "font-medium" : undefined}>{other}</span>
                              )}
                            </span>
                          );
                        })}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right align-top">
                      <NumCell
                        value={m.annual_volume}
                        provenance={m.provenance.annual_volume}
                        emphasis={activeCol("volume")}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right align-top">
                      <NumCell value={m.unit_price} decimals={2} provenance={m.provenance.unit_price} />
                    </td>
                    <td className="px-3 py-1.5 text-right align-top">
                      <NumCell
                        value={m.annual_spend}
                        provenance={m.provenance.annual_spend}
                        emphasis={activeCol("spend")}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right align-top">
                      <NumCell
                        value={m.ghg_contribution}
                        provenance={m.provenance.ghg_contribution}
                        emphasis={activeCol("emissions")}
                      />
                    </td>
                    {activeCol("multi_application") && (
                      <td className="px-3 py-1.5 text-right align-top">
                        {m.application_categories && m.application_categories.length > 0 ? (
                          <span
                            className="font-mono tabular-nums font-medium text-foreground"
                            title={m.application_categories.join(", ")}
                          >
                            {m.application_categories.length}
                          </span>
                        ) : (
                          <Missing />
                        )}
                      </td>
                    )}
                    <td className="px-3 py-1.5 text-right align-top">
                      <NumCell value={m.supplier_count} provenance={m.provenance.supplier_count} />
                    </td>
                    <td className="px-3 py-1.5 align-top">
                      <StatusPill
                        status={m.journey_status}
                        entered={m.provenance.journey_status?.origin === "entered"}
                      />
                    </td>
                    <td className="px-3 py-1.5 align-top">
                      {m.owner ? (
                        <span className={m.provenance.owner?.origin === "entered" ? "italic" : undefined}>
                          {m.provenance.owner?.origin === "entered" && (
                            <span className="mr-0.5 not-italic text-primary/70">^</span>
                          )}
                          {m.owner}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">Unassigned</span>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <BulkActionDialog
        kind={bulkKind}
        materials={selectedMaterials}
        hiddenCount={hiddenSelectedCount}
        ownerOptions={ownerNames}
        onCancel={() => setBulkKind(null)}
        onApply={applyBulk}
      />
    </div>
  );
};

function ordinal(n: number) {
  const r10 = n % 10;
  const r100 = n % 100;
  if (r10 === 1 && r100 !== 11) return "st";
  if (r10 === 2 && r100 !== 12) return "nd";
  if (r10 === 3 && r100 !== 13) return "rd";
  return "th";
}

export default MaterialRegisterTable;
