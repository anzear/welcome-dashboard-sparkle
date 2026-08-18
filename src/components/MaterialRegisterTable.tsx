import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  INTELLIGENCE_STATUS_LABEL,
  JOURNEY_STATUS_LABEL,
  type JourneyStatus,
  type Material,
} from "@/types/materialPrioritisation";
import { completenessOf } from "@/components/materialRegister/completeness";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import FilterSelects from "@/components/materialRegister/FilterSelects";
import FilterChips from "@/components/materialRegister/FilterChips";
import { isProductLineTag } from "@/components/materialRegister/productLines";
import BulkActionDialog, { type BulkKind } from "@/components/materialRegister/BulkActionDialog";
import { Missing, NumCell, StatusPill } from "@/components/materialRegister/primitives";
import {
  hasOverdueCondition,
  holdReviewOverdue,
  overdueConditions,
} from "@/components/materialRegister/gate";

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
import ExportDecisionDialog from "@/components/materialRegister/ExportDecisionDialog";
import { Plus, SlidersHorizontal, X, ChevronDown, ChevronUp, GripVertical, AlertTriangle } from "lucide-react";

const HEAD =
  "sticky top-0 z-10 bg-muted/30 backdrop-blur-sm supports-[backdrop-filter]:bg-muted/40 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/60 align-bottom";

/** Pinned identity columns: they hold while the measures scroll. */
const STICK = "sticky";

/** Units live in the header, second line, faintest tier. */
const UNIT = "text-[10px] font-normal normal-case tracking-normal text-muted-foreground/50";



type OptionalColumn =
  | "rank"
  | "status"
  | "completeness"
  | "materialType"
  | "volume"
  | "spend"
  | "emissions"
  | "applications"
  | "priority"
  | "owner"
  | "intelligence"
  | "lastChange";

/** Every column except Material can be switched off, each with the reason it exists. */
const OPTIONAL_COLUMNS: [OptionalColumn, string, string][] = [
  ["rank", "Rank", "Position under the active measure"],
  ["status", "Status", "The gate decision recorded by the team"],
  ["completeness", "Data filled", "Share of expected fields recorded"],
  ["materialType", "Entry type", "How the material enters the portfolio"],
  ["volume", "Volume", "Tonnes per year"],
  ["spend", "Spend", "EUR per year"],
  ["emissions", "GHG contribution", "tCO2e per year"],
  ["applications", "Applications", "Application categories the material serves"],
  ["priority", "Priority", "Selected for a period"],
  ["owner", "Owner", "Person accountable"],
  ["intelligence", "Intelligence", "Whether a search has been requested"],
  ["lastChange", "Last change", "Age of the most recent real transition"],
];

/** Share of the expected record that is actually filled in. Never a score. */
const CompletenessCell: React.FC<{ m: Material }> = ({ m }) => {
  const c = completenessOf(m);
  const pct = Math.round(c.ratio * 100);
  return (
    <div
      className="flex items-center justify-end gap-2"
      title={
        c.missing.length === 0
          ? "All expected fields recorded"
          : `${c.filled} of ${c.total} fields recorded. Missing: ${c.missing.join(", ")}`
      }
    >
      <div className="h-1 w-10 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(pct, 2)}%`,
            backgroundColor: `hsl(${Math.round((pct / 100) * 130)} 72% 45%)`,
          }}
        />
      </div>

      <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">
        {pct}%
      </span>
    </div>
  );
};



/** Application categories as plain text, overflow folded into a count. */
const ApplicationsCell: React.FC<{ values: string[] | null }> = ({ values }) => {
  const list = values ?? [];
  if (list.length === 0) return <Missing />;
  const shown = list.slice(0, 2);
  const rest = list.length - shown.length;
  return (
    <span className="text-[11px] text-muted-foreground" title={list.join(", ")}>
      {shown.join(", ")}
      {rest > 0 && (
        <span className="ml-1 text-[10px] tabular-nums text-muted-foreground/70">+{rest}</span>
      )}
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
    onlyNoFigure,
    setOnlyNoFigure,
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
    scope,
    scopeLabel,
  } = useRegister();

  const [bulkKind, setBulkKind] = useState<BulkKind | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [cols, setCols] = useState<Record<OptionalColumn, boolean>>(
    () =>
      Object.fromEntries(OPTIONAL_COLUMNS.map(([k]) => [k, true])) as Record<
        OptionalColumn,
        boolean
      >,
  );
  /** Rank is pinned, so only the scrolling columns can be reordered. */
  const [colOrder, setColOrder] = useState<OptionalColumn[]>(() =>
    OPTIONAL_COLUMNS.map(([k]) => k).filter((k) => k !== "rank"),
  );
  const [dragKey, setDragKey] = useState<OptionalColumn | null>(null);

  const moveCol = (key: OptionalColumn, dir: -1 | 1) =>
    setColOrder((prev) => {
      const i = prev.indexOf(key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const dropCol = (target: OptionalColumn) =>
    setColOrder((prev) => {
      if (!dragKey || dragKey === target) return prev;
      const next = prev.filter((k) => k !== dragKey);
      next.splice(next.indexOf(target), 0, dragKey);
      return next;
    });


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
      products: uniq(data.flatMap((m) => m.application_areas ?? [])).map((v) => ({
        value: v,
        label: `${v} (${data.filter((m) => (m.application_areas ?? []).includes(v)).length})`,
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

  const firstNoFigureId =
    onlyNoFigure || onlyDivergent ? null : visible.find((r) => r.rank === null)?.m.material_id ?? null;

  const activeCol = (id: MeasureId) => measureId === id;
  const emphHead = (id: MeasureId) => (activeCol(id) ? "text-primary" : undefined);
  /** The active measure is marked once per column: header accent plus a faint tint. */
  const colTint = (_id: MeasureId) => undefined as string | undefined;

  // Always present: checkbox and Material. Everything else is switchable.
  const colCount = 2;
  const extraCols = OPTIONAL_COLUMNS.filter(([k]) => cols[k]).length;

  /** Pinned offset shifts when the rank column is switched off. */
  const materialLeft = cols.rank ? "left-[5rem]" : "left-8";

  /** Column order is user-controlled; rank and Material stay pinned at the front. */
  const orderedCols = colOrder.filter((k) => cols[k]);


  const headCell = (key: OptionalColumn) => {
    switch (key) {
      case "completeness":
        return <th className={cn(HEAD, "w-28 px-3 py-2.5 text-right")}>Data filled</th>;
      case "materialType":
        return <th className={cn(HEAD, "px-3 py-2.5 text-left")}>Entry type</th>;
      case "volume":
        return (
          <th className={cn(HEAD, "px-3 py-2.5 text-right", emphHead("volume"))}>
            Volume
            <div className={cn(UNIT, activeCol("volume") && "text-primary/60")}>t/yr</div>
          </th>
        );
      case "spend":
        return (
          <th className={cn(HEAD, "px-3 py-2.5 text-right", emphHead("spend"))}>
            Spend
            <div className={cn(UNIT, activeCol("spend") && "text-primary/60")}>EUR</div>
          </th>
        );
      case "emissions":
        return (
          <th className={cn(HEAD, "px-3 py-2.5 text-right", emphHead("emissions"))}>
            GHG contribution
            <div className={cn(UNIT, activeCol("emissions") && "text-primary/60")}>tCO2e/yr</div>
          </th>
        );
      case "applications":
        return (
          <th className={cn(HEAD, "px-3 py-2.5 text-left", emphHead("applications"))}>Applications</th>
        );
      case "status":
        return <th className={cn(HEAD, "px-3 py-2.5 text-left")}>Status</th>;
      case "priority":
        return <th className={cn(HEAD, "px-3 py-2.5 text-left")}>Priority</th>;
      case "intelligence":
        return <th className={cn(HEAD, "px-3 py-2.5 text-left")}>Intelligence</th>;
      case "owner":
        return <th className={cn(HEAD, "px-3 py-2.5 text-left")}>Owner</th>;
      case "lastChange":
        return <th className={cn(HEAD, "px-3 pr-8 py-2.5 text-left")}>Last change</th>;
      default:
        return null;
    }
  };

  const bodyCell = (key: OptionalColumn, m: Material) => {
    switch (key) {
      case "completeness":
        return (
          <td className="px-3 py-2 align-middle">
            <CompletenessCell m={m} />
          </td>
        );
      case "materialType":
        return (
          <td className="px-3 py-2 align-middle text-[12px] text-muted-foreground">
            {ENTRY_TYPE_LABEL[m.entry_type] ?? m.entry_type}
          </td>
        );
      case "volume":
        return (
          <td className={cn("px-3 py-2 text-right align-middle", colTint("volume"))}>
            <NumCell
              value={m.annual_volume}
              provenance={m.provenance.annual_volume}
              emphasis={activeCol("volume")}
            />
          </td>
        );
      case "spend":
        return (
          <td className={cn("px-3 py-2 text-right align-middle", colTint("spend"))}>
            <NumCell
              value={m.annual_spend}
              provenance={m.provenance.annual_spend}
              emphasis={activeCol("spend")}
            />
          </td>
        );
      case "emissions":
        return (
          <td className={cn("px-3 py-2 text-right align-middle", colTint("emissions"))}>
            <NumCell
              value={m.ghg_contribution}
              provenance={m.provenance.ghg_contribution}
              emphasis={activeCol("emissions")}
            />
          </td>
        );
      case "applications":
        return (
          <td className={cn("px-3 py-2 align-middle", colTint("applications"))}>
            <ApplicationsCell values={m.application_categories} />
          </td>
        );
      case "status":
        return (
          <td className="px-3 py-2 align-middle">
            <div className="flex items-center gap-1.5">
              <StatusPill
                status={m.journey_status}
                entered={m.provenance.journey_status?.origin === "entered"}
              />
              {(hasOverdueCondition(m) || holdReviewOverdue(m)) && (
                <span
                  title={
                    hasOverdueCondition(m)
                      ? `${overdueConditions(m).length} condition(s) overdue`
                      : "Hold review overdue"
                  }
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                </span>
              )}
              {m.reopened && (
                <span
                  title="Went no-go and was reopened"
                  className="rounded-sm border border-border bg-muted px-1 text-[9px] uppercase tracking-wide text-muted-foreground"
                >
                  Reopened
                </span>
              )}
            </div>
          </td>
        );
      case "priority":
        return (
          <td className="px-3 py-2 align-middle">
            {m.priority_period ? (
              <span className="text-[12px] text-foreground">{m.priority_period}</span>
            ) : (
              <Missing />
            )}
          </td>
        );
      case "intelligence":
        return (
          <td className="px-3 py-2 align-middle">
            <span className="text-[12px] text-muted-foreground">
              {INTELLIGENCE_STATUS_LABEL[m.intelligence_status]}
            </span>
          </td>
        );
      case "owner":
        return (
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
        );
      case "lastChange":
        return (
          <td className="whitespace-nowrap px-3 pr-8 py-2 align-middle">
            {m.last_change_batch_origin === "real_transition" && m.last_status_change_date ? (
              <>
                <div className="leading-[1.15] text-foreground/80" title={m.last_status_change_date}>
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
        );
      default:
        return null;
    }
  };





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
      {/* Toolbar — one quiet row: search is the only bordered element */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 pb-2">
        <Input
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder="Search name, CAS, customer ID"
          className="h-7 w-60 rounded-lg bg-card text-[11px]"
        />
        <FilterSelects variant="popover" />

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors",
                extraCols < OPTIONAL_COLUMNS.length
                  ? "border-primary/40 bg-primary/5 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <SlidersHorizontal className="h-3 w-3 opacity-70" />
              Columns
              {extraCols < OPTIONAL_COLUMNS.length && (
                <span className="tabular-nums text-primary">
                  {OPTIONAL_COLUMNS.length - extraCols}
                </span>
              )}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="portfolio-type max-h-[70vh] w-72 overflow-y-auto p-2">
            <div className="pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Optional columns
            </div>
            <p className="pb-1.5 text-[10px] leading-tight text-muted-foreground/80">
              Drag a row, or use the arrows, to change the column order. Rank stays pinned.
            </p>
            {(() => {
              const rank = OPTIONAL_COLUMNS.find(([k]) => k === "rank")!;
              const rest = colOrder
                .map((k) => OPTIONAL_COLUMNS.find(([kk]) => kk === k)!)
                .filter(Boolean);
              const rows: [OptionalColumn, string, string, boolean][] = [
                [rank[0], rank[1], rank[2], false],
                ...rest.map(([k, l, h]) => [k, l, h, true] as [OptionalColumn, string, string, boolean]),
              ];
              return rows.map(([key, label, hint, movable], idx) => (
                <div
                  key={key}
                  draggable={movable}
                  onDragStart={() => movable && setDragKey(key)}
                  onDragOver={(e) => {
                    if (movable && dragKey) e.preventDefault();
                  }}
                  onDrop={() => {
                    if (movable) dropCol(key);
                    setDragKey(null);
                  }}
                  onDragEnd={() => setDragKey(null)}
                  className={cn(
                    "flex items-start gap-1.5 rounded-sm px-1 py-1 hover:bg-muted/60",
                    dragKey === key && "opacity-50",
                  )}
                >
                  {movable ? (
                    <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/50" />
                  ) : (
                    <span className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  )}
                  <Checkbox
                    checked={cols[key]}
                    onCheckedChange={(v) => setCols((c) => ({ ...c, [key]: v === true }))}
                    className="mt-0.5 h-3.5 w-3.5"
                  />
                  <label
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => setCols((c) => ({ ...c, [key]: !c[key] }))}
                  >
                    <span className="block text-[11px] text-foreground">{label}</span>
                    <span className="block text-[10px] leading-tight text-muted-foreground">{hint}</span>
                  </label>
                  {movable && (
                    <span className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        aria-label={`Move ${label} left`}
                        disabled={idx <= 1}
                        onClick={() => moveCol(key, -1)}
                        className="rounded p-0.5 text-muted-foreground/70 hover:bg-muted hover:text-foreground disabled:opacity-25"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${label} right`}
                        disabled={idx === rows.length - 1}
                        onClick={() => moveCol(key, 1)}
                        className="rounded p-0.5 text-muted-foreground/70 hover:bg-muted hover:text-foreground disabled:opacity-25"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              ));
            })()}

          </PopoverContent>
        </Popover>

        {/* Rank by — dark pill toggle, right-aligned */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">Rank by</span>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setMeasureId("all")}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors",
                measureId === "all"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            {MEASURES.map((mm) => (
              <button
                key={mm.id}
                type="button"
                onClick={() => setMeasureId(mm.id)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors",
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
      </div>

      {/* Coverage readout on its own row below the toolbar */}
      <div className="flex items-center justify-end gap-2 pb-2 text-[11px] text-muted-foreground">
        {measureId !== "all" && missingCount > 0 && (
          <>
            <button
              type="button"
              onClick={() => setOnlyNoFigure((v) => !v)}
              className="underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              {onlyNoFigure ? "Show all" : `${missingCount} with no ${measure.noun} figure`}
            </button>
            <span className="text-border">·</span>
          </>
        )}
        <span>
          <span className="tabular-nums text-foreground">{visible.length}</span>
          {visible.length !== data.length && (
            <>
              {" of "}
              <span className="tabular-nums">{data.length}</span>
            </>
          )}{" "}
          {scope ? `${scopeLabel} materials` : "materials"}
        </span>
      </div>

      {/* Active filter chips only when something is on */}
      <FilterChips />




      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-border bg-muted/50 px-2 py-1.5 text-[11px]">
          <span className="font-medium text-foreground">
            <span className="tabular-nums">{selected.size}</span> selected
            {hiddenSelectedCount > 0 && (
              <span className="text-amber-700">
                {" "}
                — <span className="tabular-nums">{hiddenSelectedCount}</span> hidden by current filters
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
                ["owner", "Set owner"],
                ["priority_period", "Set priority period"],
                ["product_lines", "Product lines"],
                ["tags", "Tags"],
                ["entry_type", "Set entry type"],
                ["products", "Set application area"],
                ["applications", "Set application"],
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
            {/* Circulating a decision is open to anyone — it is not deciding. */}
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="rounded-sm border border-border bg-background px-2 py-0.5 font-medium text-foreground hover:bg-muted"
            >
              Export decisions
            </button>
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
          {/* Judgement stays per material: never settable across a selection. */}
          <p className="w-full text-[10px] text-muted-foreground">
            Bulk edits cover factual attributes only. Gate outcome, recommendation and assessment scores are
            set one material at a time.
          </p>
        </div>
      )}

      {exportNote && (
        <div className="mt-2 flex items-center gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2 py-1.5 text-[11px] text-emerald-800">
          <span>{exportNote}</span>
          <button type="button" className="ml-auto" onClick={() => setExportNote(null)}>
            <X className="h-3 w-3 opacity-60 hover:opacity-100" />
          </button>
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

      <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
        <table className="w-full min-w-[1500px] border-collapse text-[12px]">


          <thead>
            <tr>
              <th className={cn(HEAD, STICK, "left-0 z-30 w-8 px-2 py-2.5")}>
                <Checkbox
                  checked={headerChecked}
                  onCheckedChange={toggleAllVisible}
                  aria-label="Select all visible"
                  className="h-3.5 w-3.5"
                />
              </th>
              {cols.rank && (
                <th className={cn(HEAD, STICK, "left-8 z-30 w-12 px-2 pr-4 py-2.5 text-right text-foreground/80")}>#</th>
              )}
              <th
                className={cn(
                  HEAD,
                  STICK,
                  materialLeft,
                  "z-30 w-56 border-r border-border px-3 py-2.5 text-left",
                )}
              >
                Material
              </th>

              {orderedCols.map((key) => (
                <React.Fragment key={key}>{headCell(key)}</React.Fragment>
              ))}



            </tr>
          </thead>
          <tbody>
            {bothFilters && (
              <tr>
                <td
                  colSpan={colCount + extraCols}
                  className="px-3 py-6 text-center text-[11px] text-muted-foreground"
                >
                  No material can be both without a figure and divergent — a material with no{" "}
                  {measure.noun} figure has no position to diverge from. Turn off one filter.
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
                  {m.material_id === firstNoFigureId && (
                    <tr>
                      <td colSpan={colCount + extraCols} className="p-0">
                        <div className="border-t border-border px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                          No {measure.noun} figure recorded
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr
                    onClick={() => openBrief(m.material_id)}
                    className={cn(
                      "group h-[46px] cursor-pointer border-b border-border/40 transition-colors duration-150 last:border-0",
                      rank === null && "text-muted-foreground",
                      isSelected && "bg-muted/50",
                      highlightIds.has(m.material_id) && "bg-muted/70 ring-1 ring-inset ring-border",
                      "hover:bg-muted/30",
                    )}
                  >

                    <td
                      className={cn(STICK, "left-0 z-10 bg-card px-2 py-2 align-middle group-hover:bg-muted/30")}
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
                          "left-8 z-10 bg-card px-2 pr-4 py-2 text-right align-middle tabular-nums font-semibold text-foreground/90 group-hover:bg-muted/30",
                        )}
                      >
                        {rank === null ? <span className="text-muted-foreground/50">—</span> : rank}
                      </td>
                    )}
                    <td
                      className={cn(
                        STICK,
                        materialLeft,
                        "z-10 border-r border-border bg-card px-3 py-2 align-middle group-hover:bg-muted/30",
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

                    {orderedCols.map((key) => (
                      <React.Fragment key={key}>{bodyCell(key, m)}</React.Fragment>
                    ))}


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
          <span className="border-b border-dotted border-muted-foreground/60 tabular-nums">1 234</span> computed
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="text-muted-foreground">^</span> entered
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="text-amber-700">amber bar</span> rank divergence
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="text-muted-foreground/50">—</span> no value recorded
        </span>
        <span>
          Position bars: taller = better rank. Four independent scales, one per measure — never combined. Dotted
          outline = no figure recorded, not ranked last. A rank gap of{" "}
          {Math.round(DIVERGENCE_THRESHOLD_RATIO * 100)}% of the ranked population or more counts as divergent.
        </span>

      </div>

      <AddMaterialDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* Batch export follows the scope: selection is drawn from scoped rows only. */}
      <ExportDecisionDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        materials={selectedMaterials}
        onExported={(count) =>
          setExportNote(`Decision exported · ${count} material${count === 1 ? "" : "s"}`)
        }
      />


      <BulkActionDialog
        kind={bulkKind}
        materials={selectedMaterials}
        hiddenCount={hiddenSelectedCount}
        ownerOptions={ownerNames}
        productSuggestions={[...new Set(data.flatMap((m) => m.application_areas ?? []))].sort()}
        applicationSuggestions={[...new Set(data.flatMap((m) => m.application_categories ?? []))].sort()}
        tagSuggestions={[
          ...new Set(data.flatMap((m) => (m.tags ?? []).filter((t) => !isProductLineTag(t)))),
        ].sort()}
        periodSuggestions={[
          ...new Set(data.map((m) => m.priority_period).filter((v): v is string => Boolean(v))),
        ].sort()}

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
