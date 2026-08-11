import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  INTELLIGENCE_STATUS_LABEL,
  JOURNEY_STATUS_LABEL,
  type JourneyStatus,
} from "@/types/materialPrioritisation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import FilterSelects from "@/components/materialRegister/FilterSelects";
import FilterChips from "@/components/materialRegister/FilterChips";
import BulkActionDialog, { type BulkKind } from "@/components/materialRegister/BulkActionDialog";
import { Missing, NumCell, StatusPill } from "@/components/materialRegister/primitives";
import { tagVocabulary, UNTAGGED } from "@/components/materialRegister/tags";
import {
  DIVERGENCE_THRESHOLD_RATIO,
  ENTRY_TYPE_LABEL,
  MEASURES,
  UNASSIGNED_OWNER,
  useRegister,
  type MeasureId,
} from "@/components/materialRegister/registerStore";
import AddMaterialDialog from "@/components/materialRegister/AddMaterialDialog";
import PositionBlock from "@/components/materialRegister/PositionBlock";
import { Plus, SlidersHorizontal, X } from "lucide-react";

const HEAD =
  "sticky top-0 z-10 bg-muted/60 backdrop-blur-sm text-[11px] font-medium text-muted-foreground border-b border-border align-bottom";

/** Pinned identity columns: they hold while the measures scroll. */
const STICK = "sticky bg-muted/60";

/** Units live in the header, second line, faintest tier. */
const UNIT = "text-[10px] font-normal text-muted-foreground/50";

type OptionalColumn =
  | "position"
  | "materialType"
  | "materialCategory"
  | "volume"
  | "spend"
  | "emissions"
  | "suppliers"
  | "applications"
  | "status"
  | "priority"
  | "owner"
  | "intelligence"
  | "lastChange";

/** Every column except Material can be switched off, each with the reason it exists. */
const OPTIONAL_COLUMNS: [OptionalColumn, string, string][] = [
  ["position", "Position", "Rank under all four measures"],
  ["materialType", "Material type", "How the material enters the portfolio"],
  ["materialCategory", "Material category", "Class the material belongs to"],
  ["volume", "Volume", "Tonnes per year"],
  ["spend", "Spend", "EUR per year"],
  ["emissions", "GHG contribution", "tCO2e per year"],
  ["suppliers", "Suppliers", "Count of qualified suppliers"],
  ["applications", "Applications", "Application categories the material serves"],
  ["status", "Status", "Where the material sits in the journey"],
  ["priority", "Priority", "Selected for a period"],
  ["owner", "Owner", "Person accountable"],
  ["intelligence", "Intelligence", "Whether a search has been requested"],
  ["lastChange", "Last change", "Age of the most recent real transition"],
];

/** Application categories as chips, overflow folded into a count. */
const ApplicationsCell: React.FC<{ values: string[] | null }> = ({ values }) => {
  const list = values ?? [];
  if (list.length === 0) return <Missing />;
  const shown = list.slice(0, 2);
  const rest = list.length - shown.length;
  return (
    <span className="inline-flex flex-wrap items-center gap-1" title={list.join(", ")}>
      {shown.map((v) => (
        <span key={v} className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {v}
        </span>
      ))}
      {rest > 0 && <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">+{rest}</span>}
    </span>
  );
};



export const MaterialRegisterTable: React.FC = () => {
  const {
    data,
    measureId,
    setMeasureId,
    measure,
    filters,
    setFilters,
    filtersActive,
    onlyUnranked,
    setOnlyUnranked,
    onlyDivergent,
    setOnlyDivergent,
    onlySelected,
    setOnlySelected,
    selected,
    setSelected,
    ordered,
    visible,
    rankTables,
    rankedCount,
    filteredTotal,
    missingCount,
    divergentCount,
    bothFilters,
    openBrief,
    applyBulk,
    toast,
    setToast,
    undo,
    highlightIds,
  } = useRegister();

  const [bulkKind, setBulkKind] = useState<BulkKind | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [cols, setCols] = useState<Record<OptionalColumn, boolean>>(
    () =>
      Object.fromEntries(OPTIONAL_COLUMNS.map(([k]) => [k, true])) as Record<
        OptionalColumn,
        boolean
      >,
  );

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
        label: ENTRY_TYPE_LABEL[v] ?? v,
      })),
      products: uniq(data.flatMap((m) => m.product_categories ?? [])).map((v) => ({
        value: v,
        label: `${v} (${data.filter((m) => (m.product_categories ?? []).includes(v)).length})`,
      })),
      applications: uniq(data.flatMap((m) => m.application_categories ?? [])).map((v) => ({
        value: v,
        label: `${v} (${data.filter((m) => (m.application_categories ?? []).includes(v)).length})`,
      })),
      tags: [
        ...tagVocabulary(data).map((t) => ({ value: t.tag, label: `${t.tag} (${t.count})` })),
        {
          value: UNTAGGED,
          label: `Untagged (${data.filter((m) => m.tags.length === 0).length})`,
        },
      ],
    };
  }, [data]);

  const ownerNames = options.owners.filter((o) => o.value !== UNASSIGNED_OWNER).map((o) => o.value);

  const firstUnrankedId =
    onlyUnranked || onlyDivergent ? null : visible.find((r) => r.rank === null)?.m.material_id ?? null;

  const activeCol = (id: MeasureId) => measureId === id;
  const emphHead = (id: MeasureId) => (activeCol(id) ? "text-primary" : undefined);
  /** The active measure is marked once per column: header accent plus a faint tint. */
  const colTint = (id: MeasureId) => (activeCol(id) ? "bg-primary/[0.05]" : undefined);

  // Always present: checkbox and Material. Everything else is switchable.
  const colCount = 2;
  const extraCols = OPTIONAL_COLUMNS.filter(([k]) => cols[k]).length;

  const materialLeft = "left-8";
  const positionLeft = "left-[16rem]";


  const visibleIds = visible.map((r) => r.m.material_id);
  const visibleSelectedCount = visibleIds.filter((id) => selected.has(id)).length;
  const headerChecked: boolean | "indeterminate" =
    visibleIds.length > 0 && visibleSelectedCount === visibleIds.length
      ? true
      : visibleSelectedCount > 0
        ? "indeterminate"
        : false;

  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (visibleSelectedCount === visibleIds.length) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedMaterials = data.filter((m) => selected.has(m.material_id));
  const hiddenSelectedCount = selectedMaterials.filter((m) => !visibleIds.includes(m.material_id)).length;


  return (
    <div className="w-full">
      {/* Control band — one tint, one hairline beneath */}
      <div className="space-y-1.5 border-b border-border bg-muted/30 px-2 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Ranked by</span>
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
                      ? "bg-primary text-primary-foreground shadow-sm"
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
              <span className="font-mono tabular-nums">{filteredTotal}</span>
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




          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <SlidersHorizontal className="h-3 w-3" /> Columns
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="max-h-[70vh] w-60 overflow-y-auto p-2">
              <div className="pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                Optional columns
              </div>
              {OPTIONAL_COLUMNS.map(([key, label, hint]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-start gap-2 rounded-sm px-1 py-1 hover:bg-muted/60"
                >
                  <Checkbox
                    checked={cols[key]}
                    onCheckedChange={(v) => setCols((c) => ({ ...c, [key]: v === true }))}
                    className="mt-0.5 h-3.5 w-3.5"
                  />
                  <span className="min-w-0">
                    <span className="block text-[11px] text-foreground">{label}</span>
                    <span className="block text-[10px] leading-tight text-muted-foreground">{hint}</span>
                  </span>
                </label>
              ))}
            </PopoverContent>
          </Popover>

        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search name, CAS, customer ID"
            className="h-7 w-56 bg-background text-[11px]"
          />
          <FilterSelects className="ml-auto" />
        </div>

        <FilterChips />


      </div>


      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-border bg-muted/50 px-2 py-1.5 text-[11px]">
          <span className="font-medium text-foreground">
            <span className="font-mono tabular-nums">{selected.size}</span> selected
            {hiddenSelectedCount > 0 && (
              <span className="text-amber-700">
                {" "}
                — <span className="font-mono tabular-nums">{hiddenSelectedCount}</span> hidden by current filters
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
            {(
              [
                ["status", "Set status"],
                ["owner", "Set owner"],
                ["products", "Set product"],
                ["applications", "Set application"],
                ["priority_period", "Set priority period"],
                ["intelligence", "Order intelligence"],
              ] as [BulkKind, string][]

            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setBulkKind(k)}
                className="rounded-sm border border-border bg-background px-2 py-0.5 font-medium text-foreground hover:bg-muted"
              >
                {label}
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
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[1500px] border-collapse text-xs">

          <thead>
            <tr>
              <th className={cn(HEAD, STICK, "left-0 z-30 w-8 px-2 py-2")}>
                <Checkbox
                  checked={headerChecked}
                  onCheckedChange={toggleAllVisible}
                  aria-label="Select all visible"
                  className="h-3.5 w-3.5"
                />
              </th>
              <th
                className={cn(
                  HEAD,
                  STICK,
                  materialLeft,
                  "z-30 w-56 border-r border-border px-3 py-2 text-left",
                )}
              >
                Material
              </th>
              {cols.position && (
                <th className={cn(HEAD, STICK, positionLeft, "z-30 w-[100px] border-r border-border px-3 pb-2 pt-3 text-left")}>
                  <div className="leading-none">Position</div>
                  {/* Key letters only — one per bar slot, aligned to their positions */}
                  <div className={cn(UNIT, "mt-3 flex w-[60px] justify-between font-mono")}>
                    <span title="Spend">S</span>
                    <span title="Emissions">E</span>
                    <span title="Volume">V</span>
                    <span title="Applications">A</span>
                  </div>
                </th>
              )}
              {cols.materialType && <th className={cn(HEAD, "px-3 py-2 text-left")}>Material type</th>}
              {cols.materialCategory && (
                <th className={cn(HEAD, "px-3 py-2 text-left")}>Material category</th>
              )}
              {cols.volume && (
                <th className={cn(HEAD, "px-3 py-2 text-right", emphHead("volume"))}>
                  Volume
                  <div className={cn(UNIT, activeCol("volume") && "text-primary/60")}>(t/yr)</div>
                </th>
              )}
              {cols.spend && (
                <th className={cn(HEAD, "px-3 py-2 text-right", emphHead("spend"))}>
                  Spend
                  <div className={cn(UNIT, activeCol("spend") && "text-primary/60")}>(EUR)</div>
                </th>
              )}
              {cols.emissions && (
                <th className={cn(HEAD, "px-3 py-2 text-right", emphHead("emissions"))}>
                  GHG contribution
                  <div className={cn(UNIT, activeCol("emissions") && "text-primary/60")}>(tCO2e/yr)</div>
                </th>
              )}
              {cols.suppliers && <th className={cn(HEAD, "px-3 py-2 text-right")}>Suppliers</th>}
              {cols.applications && (
                <th className={cn(HEAD, "px-3 py-2 text-left", emphHead("applications"))}>Applications</th>
              )}
              {cols.status && <th className={cn(HEAD, "px-3 py-2 text-left")}>Status</th>}
              {cols.priority && <th className={cn(HEAD, "px-3 py-2 text-left")}>Priority</th>}
              {cols.owner && <th className={cn(HEAD, "px-3 py-2 text-left")}>Owner</th>}
              {cols.intelligence && <th className={cn(HEAD, "px-3 py-2 text-left")}>Intelligence</th>}
              {cols.lastChange && <th className={cn(HEAD, "px-3 pr-8 py-2 text-left")}>Last change</th>}

            </tr>
          </thead>
          <tbody>
            {bothFilters && (
              <tr>
                <td
                  colSpan={colCount + extraCols}
                  className="px-3 py-6 text-center text-[11px] text-muted-foreground"
                >
                  No material can be both unranked and divergent — an unranked material has no {measure.noun}{" "}
                  position to diverge from. Turn off one filter.
                </td>
              </tr>
            )}
            {!bothFilters && visible.length === 0 && (
              <tr>
                <td
                  colSpan={colCount + extraCols}
                  className="px-3 py-6 text-center text-[11px] text-muted-foreground"
                >
                  <div>No materials match the current filters.</div>
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-foreground underline decoration-dotted underline-offset-2"
                  >
                    <Plus className="h-3 w-3" /> Add material
                  </button>
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
                      <td colSpan={colCount + extraCols} className="p-0">
                        <div className="border-t border-border px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                          Unranked — no {measure.noun} figure
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr
                    onClick={() => openBrief(m.material_id)}
                    className={cn(
                      "group h-[46px] cursor-pointer border-b border-border/40 last:border-0",
                      rank === null && "text-muted-foreground",
                      isSelected && "bg-muted/50",
                      highlightIds.has(m.material_id) && "bg-muted/70 ring-1 ring-inset ring-border",
                      "hover:bg-muted/30",
                    )}
                  >

                    <td
                      className={cn(STICK, "left-0 z-10 bg-background px-2 py-2 align-middle group-hover:bg-muted/30")}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(m.material_id)}
                        aria-label={`Select ${m.name}`}
                        className="h-3.5 w-3.5"
                      />
                    </td>
                    {cols.rank && (
                      <td
                        className={cn(
                          STICK,
                          "left-8 z-10 bg-background px-2 pr-4 py-2 text-right align-middle font-mono tabular-nums font-medium text-foreground/90 group-hover:bg-muted/30",
                        )}
                      >
                        {rank === null ? <span className="text-muted-foreground/50">—</span> : rank}
                      </td>
                    )}
                    <td
                      className={cn(
                        STICK,
                        materialLeft,
                        "z-10 border-r border-border/60 bg-background px-3 py-2 align-middle group-hover:bg-muted/30",
                      )}
                    >
                      <div
                        className={cn(
                          "font-medium leading-[1.15]",
                          rank === null ? "text-foreground/70" : "text-foreground",
                        )}
                      >
                        {m.name}
                      </div>
                      <div className="text-[10px] leading-[1.15] text-muted-foreground">
                        {m.material_class ?? "Unclassified"}
                      </div>
                    </td>
                    {cols.position && (
                      <td
                        className={cn(
                          STICK,
                          positionLeft,
                          "z-10 w-[100px] border-r border-border/60 bg-background px-3 py-2 align-middle group-hover:bg-muted/30",
                        )}
                      >
                        <PositionBlock
                          materialId={m.material_id}
                          gapMeasure={row.gapMeasure}
                          gapSize={row.gapSize}
                        />
                      </td>
                    )}

                    {cols.volume && (
                      <td className={cn("px-3 py-2 text-right align-middle", colTint("volume"))}>
                        <NumCell
                          value={m.annual_volume}
                          provenance={m.provenance.annual_volume}
                          emphasis={activeCol("volume")}
                        />
                      </td>
                    )}
                    {cols.price && (
                      <td className="px-3 py-2 text-right align-middle">
                        <NumCell value={m.unit_price} decimals={2} provenance={m.provenance.unit_price} />
                      </td>
                    )}
                    {cols.spend && (
                      <td className={cn("px-3 py-2 text-right align-middle", colTint("spend"))}>
                        <NumCell
                          value={m.annual_spend}
                          provenance={m.provenance.annual_spend}
                          emphasis={activeCol("spend")}
                        />
                      </td>
                    )}
                    {cols.emissions && (
                      <td className={cn("px-3 py-2 text-right align-middle", colTint("emissions"))}>
                        <NumCell
                          value={m.ghg_contribution}
                          provenance={m.provenance.ghg_contribution}
                          emphasis={activeCol("emissions")}
                        />
                      </td>
                    )}
                    {activeCol("applications") && (
                      <td className={cn("px-3 py-2 text-right align-middle", colTint("applications"))}>
                        {m.application_categories && m.application_categories.length > 0 ? (
                          <span
                            className="font-mono font-medium tabular-nums text-foreground"
                            title={m.application_categories.join(", ")}
                          >
                            {m.application_categories.length}
                          </span>
                        ) : (
                          <Missing />
                        )}
                      </td>
                    )}

                    {cols.suppliers && (
                      <td className="px-3 py-2 text-right align-middle">
                        <NumCell value={m.supplier_count} provenance={m.provenance.supplier_count} />
                      </td>
                    )}
                    {cols.status && (
                      <td className="px-3 py-2 align-middle">
                        <StatusPill
                          status={m.journey_status}
                          entered={m.provenance.journey_status?.origin === "entered"}
                        />
                      </td>
                    )}

                    {cols.tags && (
                      <td className="px-3 py-2 align-middle">
                        <TagsCell tags={m.tags} />
                      </td>
                    )}
                    {cols.priority && (
                      <td className="px-3 py-2 align-middle">
                        {m.priority_selected ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
                            {m.priority_period ?? "Selected"}
                          </span>
                        ) : (
                          <Missing />
                        )}
                      </td>
                    )}
                    {cols.target && (
                      <td className="whitespace-nowrap px-3 py-2 align-middle">
                        {(() => {
                          const iso = targetDateOf(m);
                          const rel = relativeDate(iso);
                          if (!iso || !rel) return <Missing />;
                          return (
                            <>
                              <div className="font-mono text-[11px] tabular-nums leading-[1.15] text-foreground/85">
                                {iso}
                              </div>
                              <div
                                className={cn(
                                  "text-[10px] leading-[1.15]",
                                  rel.overdue ? "text-amber-700" : "text-muted-foreground",
                                )}
                              >
                                {rel.label}
                              </div>
                            </>
                          );
                        })()}
                      </td>
                    )}
                    {cols.intelligence && (
                      <td className="px-3 py-2 align-middle">
                        <span className="text-[11px] text-muted-foreground">
                          {INTELLIGENCE_STATUS_LABEL[m.intelligence_status]}
                        </span>
                      </td>
                    )}
                    {cols.owner && (
                      <td className="px-3 py-2 align-middle">
                        {m.owner ? (
                          <span>
                            {m.provenance.owner?.origin === "entered" && (
                              <span className="mr-0.5 text-muted-foreground/70">^</span>
                            )}
                            {m.owner}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">Unassigned</span>
                        )}
                      </td>
                    )}
                    {cols.lastChange && (
                      <td className="whitespace-nowrap px-3 pr-8 py-2 align-middle">
                        {m.last_change_batch_origin === "real_transition" && m.last_status_change_date ? (
                          <>
                            <div
                              className="leading-[1.15] text-foreground/80"
                              title={m.last_status_change_date}
                            >
                              {relativeAge(m.last_status_change_date)}
                            </div>
                            <div className="text-[10px] leading-[1.15] text-muted-foreground">
                              {m.last_status_user ?? "—"}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground/60" title="Only a baselining event on record">
                            Never changed
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reference, not chrome. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-[10px] text-muted-foreground/70">
        <span className="inline-flex items-center gap-1">
          <span className="border-b border-dotted border-muted-foreground/60 font-mono">1 234</span> computed
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="text-muted-foreground">^</span> entered
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="text-amber-700">amber bar</span> rank divergence
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="text-muted-foreground/50">—</span> no value (unranked)
        </span>
        <span>
          Position bars: taller = better rank. Four independent scales, one per measure — never combined. Dotted
          outline = no figure recorded, not ranked last. A rank gap of{" "}
          {Math.round(DIVERGENCE_THRESHOLD_RATIO * 100)}% of the ranked population or more counts as divergent.
        </span>

      </div>

      <AddMaterialDialog open={addOpen} onOpenChange={setAddOpen} />


      <BulkActionDialog
        kind={bulkKind}
        materials={selectedMaterials}
        hiddenCount={hiddenSelectedCount}
        ownerOptions={ownerNames}
        tagSuggestions={tagVocabulary(data).map((t) => t.tag)}
        onCancel={() => setBulkKind(null)}
        onApply={(payload) => {
          applyBulk(payload, new Set(selected));
          setBulkKind(null);
        }}
      />
    </div>
  );
};

/** Relative age of a change. Never aggregated, never counted per person. */
function relativeAge(iso: string) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const days = Math.max(0, Math.floor((Date.now() - t) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 730) return `${Math.round(days / 30)} months ago`;
  return `${Math.round(days / 365)} years ago`;
}


export default MaterialRegisterTable;
