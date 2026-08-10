import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  JOURNEY_STATUS_LABEL,
  type EntryType,
  type JourneyStatus,
} from "@/types/materialPrioritisation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import MultiSelectFilter from "@/components/materialRegister/MultiSelectFilter";
import BulkActionDialog, { type BulkKind } from "@/components/materialRegister/BulkActionDialog";
import { Missing, NumCell, StatusPill } from "@/components/materialRegister/primitives";
import {
  EMPTY_FILTERS,
  ENTRY_TYPE_LABEL,
  MEASURES,
  UNASSIGNED_OWNER,
  useRegister,
  type Filters,
  type Measure,
  type MeasureId,
  type RankedRow,
} from "@/components/materialRegister/registerStore";
import AddMaterialDialog from "@/components/materialRegister/AddMaterialDialog";
import { Plus, X } from "lucide-react";

const HEAD =
  "sticky top-0 z-10 bg-muted/60 backdrop-blur-sm text-[11px] font-medium text-muted-foreground border-b border-border align-bottom";

/** Pinned identity columns: they hold while the measures scroll. */
const STICK = "sticky bg-muted/60";

/** Units live in the header, second line, faintest tier. */
const UNIT = "text-[10px] font-normal text-muted-foreground/50";


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
  const [showLastChange, setShowLastChange] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

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
      groups: uniq(data.map((m) => m.customer_material_group)).map((v) => ({ value: v, label: v })),
    };
  }, [data]);

  const ownerNames = options.owners.filter((o) => o.value !== UNASSIGNED_OWNER).map((o) => o.value);

  const firstUnrankedId =
    onlyUnranked || onlyDivergent ? null : visible.find((r) => r.rank === null)?.m.material_id ?? null;

  const activeCol = (id: MeasureId) => measureId === id;
  const emphHead = (id: MeasureId) => (activeCol(id) ? "text-primary" : undefined);
  const colCount = 11;
  const extraCols = (activeCol("multi_application") ? 1 : 0) + (showLastChange ? 1 : 0);
  const otherMeasures = MEASURES.filter((mm) => mm.id !== measureId);

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

  const chipTooltip = (row: RankedRow, mm: Measure) => {
    const other = row.ranks[mm.id];
    if (other === null) return `${mm.label}: no figure — unranked`;
    if (row.gapMeasure === mm.id && row.rank !== null) {
      const a = MEASURES.find((x) => x.id === measureId)!;
      const first = other < row.rank ? { m: mm, r: other } : { m: a, r: row.rank };
      const second = other < row.rank ? { m: a, r: row.rank } : { m: mm, r: other };
      return `Ranks ${first.r}${ordinal(first.r)} on ${first.m.noun} but ${second.r}${ordinal(second.r)} on ${second.m.noun}. ${row.gapSize} positions apart.`;
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

          <button
            type="button"
            aria-pressed={onlyDivergent}
            onClick={() => setOnlyDivergent((v) => !v)}
            className={cn(
              "rounded-sm border bg-background px-2 py-1 text-[11px] font-medium transition-colors",
              onlyDivergent
                ? "border-amber-400/60 text-amber-700"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            Divergent only (<span className="font-mono tabular-nums">{divergentCount}</span>)
          </button>

          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={showLastChange}
              onChange={(e) => setShowLastChange(e.target.checked)}
              className="h-3 w-3"
            />
            Last change
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-2">
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search name, CAS, customer ID"
            className="h-7 w-56 bg-background text-[11px]"
          />
          {filters.search.trim() !== "" && (
            <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px]">
              “{filters.search}”
              <button type="button" onClick={() => setFilters((f) => ({ ...f, search: "" }))}>
                <X className="h-3 w-3 opacity-60 hover:opacity-100" />
              </button>
            </span>
          )}
          {activeChips.map((c) => (
            <span
              key={`${c.kind}-${c.value}`}
              className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px]"
            >
              {c.label}
              <button type="button" onClick={() => removeChip(c.kind, c.value)}>
                <X className="h-3 w-3 opacity-60 hover:opacity-100" />
              </button>
            </span>
          ))}
          {(activeChips.length > 0 || filters.search.trim() !== "") && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      </div>


      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-[11px]">
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
      </div>

      <div className="overflow-x-auto overflow-y-auto rounded-md border border-border pr-4 max-h-[calc(100vh-16rem)]">
        <table className="w-full border-collapse text-xs">
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
              <th className={cn(HEAD, STICK, "left-8 z-30 w-12 px-2 pr-4 py-2 text-right text-foreground/80")}>#</th>
              <th
                className={cn(
                  HEAD,
                  STICK,
                  "left-[5rem] z-30 w-56 border-r border-border px-3 py-2 text-left",
                )}
              >
                Material
              </th>
              <th className={cn(HEAD, "w-[9.5rem] px-3 py-2 text-left")}>Other rankings</th>
              <th className={cn(HEAD, "px-3 py-2 text-right", emphHead("volume"))}>
                Annual volume
                <div className={cn(UNIT, activeCol("volume") && "text-primary/60")}>(t/yr)</div>
              </th>
              <th className={cn(HEAD, "px-3 py-2 text-right")}>
                Unit price
                <div className={UNIT}>(EUR/kg)</div>
              </th>
              <th className={cn(HEAD, "px-3 py-2 text-right", emphHead("spend"))}>
                Annual spend
                <div className={cn(UNIT, activeCol("spend") && "text-primary/60")}>(EUR)</div>
              </th>
              <th className={cn(HEAD, "px-3 py-2 text-right", emphHead("emissions"))}>
                GHG contribution
                <div className={cn(UNIT, activeCol("emissions") && "text-primary/60")}>(tCO2e/yr)</div>
              </th>
              {activeCol("multi_application") && (
                <th className={cn(HEAD, "px-3 py-2 text-right text-primary")}>Applications</th>
              )}
              <th className={cn(HEAD, "px-3 py-2 text-right")}>Suppliers</th>
              <th className={cn(HEAD, "px-3 py-2 text-left")}>Status</th>

              <th className={cn(HEAD, "px-3 py-2 text-left")}>Owner</th>
              {showLastChange && <th className={cn(HEAD, "px-3 py-2 text-left")}>Last change</th>}
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
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary underline decoration-dotted underline-offset-2"
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
                      "cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40",
                      rank === null && "text-muted-foreground",
                      isSelected && "bg-primary/5",
                      highlightIds.has(m.material_id) &&
                        "bg-primary/10 ring-1 ring-inset ring-primary/40",
                    )}
                  >
                    <td className="px-2 py-1.5 align-top" onClick={(e) => e.stopPropagation()}>
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
                      <div
                        className={cn(
                          "font-medium leading-tight",
                          rank === null ? "text-foreground/70" : "text-foreground",
                        )}
                      >
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
                        <span>
                          {m.provenance.owner?.origin === "entered" && (
                            <span className="mr-0.5 text-primary/70">^</span>
                          )}
                          {m.owner}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">Unassigned</span>
                      )}
                    </td>
                    {showLastChange && (
                      <td className="whitespace-nowrap px-3 py-1.5 align-top">
                        {m.last_change_batch_origin === "real_transition" && m.last_status_change_date ? (
                          <>
                            <div
                              className="leading-tight text-foreground/80"
                              title={m.last_status_change_date}
                            >
                              {relativeAge(m.last_status_change_date)}
                            </div>
                            <div className="text-[10px] leading-tight text-muted-foreground">
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

      <AddMaterialDialog open={addOpen} onOpenChange={setAddOpen} />

      <BulkActionDialog
        kind={bulkKind}
        materials={selectedMaterials}
        hiddenCount={hiddenSelectedCount}
        ownerOptions={ownerNames}
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

function ordinal(n: number) {
  const r10 = n % 10;
  const r100 = n % 100;
  if (r10 === 1 && r100 !== 11) return "st";
  if (r10 === 2 && r100 !== 12) return "nd";
  if (r10 === 3 && r100 !== 13) return "rd";
  return "th";
}

export default MaterialRegisterTable;
