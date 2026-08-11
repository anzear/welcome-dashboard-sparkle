import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  JOURNEY_STATUS_LABEL,
  targetDateOf,
  type EntryType,
  type JourneyStatus,
} from "@/types/materialPrioritisation";
import MultiSelectFilter from "@/components/materialRegister/MultiSelectFilter";
import { tagVocabulary, UNTAGGED } from "@/components/materialRegister/tags";
import {
  ENTRY_TYPE_LABEL,
  NO_PRIORITY,
  TARGET_DATE_BANDS,
  UNASSIGNED_OWNER,
  targetDateBand,
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
 * shared filter state.
 */
const FilterSelects: React.FC<{ className?: string; include?: FilterKey[] }> = ({ className, include }) => {
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
      targetDates: TARGET_DATE_BANDS.map((b) => {
        const count = data.filter((m) => {
          const band = targetDateBand(targetDateOf(m));
          return b.value === "next_90" ? band === "next_30" || band === "next_90" : band === b.value;
        }).length;
        return { value: b.value, label: `${b.label} (${count})` };
      }),
    };
  }, [data]);

  const shown = (key: FilterKey) => !include || include.includes(key);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {shown("statuses") && (
        <MultiSelectFilter
          label="Status"
          options={options.statuses}
          selected={filters.statuses}
          onChange={(v) => setFilters((f) => ({ ...f, statuses: v }))}
        />
      )}
      {shown("owners") && (
        <MultiSelectFilter
          label="Owner"
          options={options.owners}
          selected={filters.owners}
          onChange={(v) => setFilters((f) => ({ ...f, owners: v }))}
        />
      )}
      {shown("entryTypes") && (
        <MultiSelectFilter
          label="Material type"
          options={options.entryTypes}
          selected={filters.entryTypes}
          onChange={(v) => setFilters((f) => ({ ...f, entryTypes: v }))}
        />
      )}
      {shown("classes") && (
        <MultiSelectFilter
          label="Material category"
          options={options.classes}
          selected={filters.classes}
          onChange={(v) => setFilters((f) => ({ ...f, classes: v }))}
        />
      )}
      {shown("products") && (
        <MultiSelectFilter
          label="Product"
          options={options.products}
          selected={filters.products}
          onChange={(v) => setFilters((f) => ({ ...f, products: v }))}
        />
      )}
      {shown("applications") && (
        <MultiSelectFilter
          label="Application"
          options={options.applications}
          selected={filters.applications}
          onChange={(v) => setFilters((f) => ({ ...f, applications: v }))}
        />
      )}
      {shown("tags") && (
        <MultiSelectFilter
          label="Tags"
          options={options.tags}
          selected={filters.tags}
          onChange={(v) => setFilters((f) => ({ ...f, tags: v }))}
        />
      )}
      {shown("priorityPeriods") && (
        <MultiSelectFilter
          label="Priority period"
          options={options.priorityPeriods}
          selected={filters.priorityPeriods}
          onChange={(v) => setFilters((f) => ({ ...f, priorityPeriods: v }))}
        />
      )}

    </div>
  );
};

export default FilterSelects;
