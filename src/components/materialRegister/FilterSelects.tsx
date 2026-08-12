import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  JOURNEY_STATUS_LABEL,
  type EntryType,
  type JourneyStatus,
} from "@/types/materialPrioritisation";
import MultiSelectFilter from "@/components/materialRegister/MultiSelectFilter";
import { tagVocabulary, UNTAGGED } from "@/components/materialRegister/tags";
import {
  ENTRY_TYPE_LABEL,
  NO_PRIORITY,
  UNASSIGNED_OWNER,
  useRegister,
} from "@/components/materialRegister/registerStore";

export type FilterKey =
  | "statuses"
  | "owners"
  | "entryTypes"
  | "classes"
  | "products"
  | "applications"
  | "tags"
  | "priorityPeriods";

/**
 * The register's filter controls. Shared scope: any view mounting this filters the
 * same set. `include` narrows which controls a screen offers without changing the
 * shared filter state. `variant="popover"` folds them all behind one button.
 */
const FilterSelects: React.FC<{
  className?: string;
  include?: FilterKey[];
  variant?: "inline" | "popover";
}> = ({ className, include, variant = "inline" }) => {
  const { data, filters, setFilters } = useRegister();


  const options = useMemo(() => {
    const uniq = (vals: (string | null)[]) =>
      [...new Set(vals.filter((v): v is string => Boolean(v)))].sort((a, b) => a.localeCompare(b));
    return {
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
      classes: uniq(data.map((m) => m.material_class)).map((v) => ({ value: v, label: v })),

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
        { value: UNTAGGED, label: `Untagged (${data.filter((m) => m.tags.length === 0).length})` },
      ],
      priorityPeriods: [
        ...uniq(data.map((m) => m.priority_period)).map((v) => ({
          value: v,
          label: `${v} (${data.filter((m) => m.priority_period === v).length})`,
        })),
        {
          value: NO_PRIORITY,
          label: `Not prioritised (${data.filter((m) => m.priority_period === null).length})`,
        },
      ],
    };
  }, [data]);

  const shown = (key: FilterKey) => !include || include.includes(key);

  const controls: [FilterKey, string, { value: string; label: string }[], string[]][] = [
    ["statuses", "Status", options.statuses, filters.statuses],
    ["owners", "Owner", options.owners, filters.owners],
    ["entryTypes", "Material type", options.entryTypes, filters.entryTypes],
    ["classes", "Material category", options.classes, filters.classes],
    ["products", "Product", options.products, filters.products],
    ["applications", "Application", options.applications, filters.applications],
    ["tags", "Tags", options.tags, filters.tags],
    ["priorityPeriods", "Priority period", options.priorityPeriods, filters.priorityPeriods],
  ];

  const active = controls.filter(([k]) => shown(k));
  const activeCount = active.reduce((n, [, , , sel]) => n + sel.length, 0);

  if (variant === "popover") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition-colors",
              activeCount > 0
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
              className,
            )}
          >
            <Filter className="h-3 w-3 opacity-70" />
            Filters
            {activeCount > 0 && (
              <span className="font-mono tabular-nums text-primary">{activeCount}</span>
            )}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-2">
          <div className="space-y-1.5">
            {active.map(([key, label, opts, sel]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">{label}</span>
                <MultiSelectFilter
                  label={sel.length > 0 ? `${sel.length} chosen` : "Any"}
                  options={opts}
                  selected={sel}
                  onChange={(v) => setFilters((f) => ({ ...f, [key]: v }))}
                />
              </div>
            ))}
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() =>
                setFilters((f) => {
                  const next = { ...f };
                  active.forEach(([k]) => ((next as any)[k] = []));
                  return next;
                })
              }
              className="mt-2 w-full rounded-sm border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted"
            >
              Clear all
            </button>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {active.map(([key, label, opts, sel]) => (
        <MultiSelectFilter
          key={key}
          label={label}
          options={opts}
          selected={sel}
          onChange={(v) => setFilters((f) => ({ ...f, [key]: v }))}
        />
      ))}
    </div>
  );
};

export default FilterSelects;

