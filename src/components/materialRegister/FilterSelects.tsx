import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { JOURNEY_STATUS_LABEL, type EntryType, type JourneyStatus } from "@/types/materialPrioritisation";
import MultiSelectFilter from "@/components/materialRegister/MultiSelectFilter";
import { tagVocabulary, UNTAGGED } from "@/components/materialRegister/tags";
import { ENTRY_TYPE_LABEL, UNASSIGNED_OWNER, useRegister } from "@/components/materialRegister/registerStore";

/** The register's filter controls. Shared scope: any view mounting this filters the same set. */
const FilterSelects: React.FC<{ className?: string }> = ({ className }) => {
  const { data, filters, setFilters } = useRegister();

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
    };
  }, [data]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
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
        label="Product"
        options={options.products}
        selected={filters.products}
        onChange={(v) => setFilters((f) => ({ ...f, products: v }))}
      />
      <MultiSelectFilter
        label="Application"
        options={options.applications}
        selected={filters.applications}
        onChange={(v) => setFilters((f) => ({ ...f, applications: v }))}
      />
      <MultiSelectFilter
        label="Tags"
        options={options.tags}
        selected={filters.tags}
        onChange={(v) => setFilters((f) => ({ ...f, tags: v }))}
      />
    </div>
  );
};

export default FilterSelects;
