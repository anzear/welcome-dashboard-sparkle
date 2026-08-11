import React from "react";
import { X } from "lucide-react";
import { JOURNEY_STATUS_LABEL, type EntryType, type JourneyStatus } from "@/types/materialPrioritisation";
import {
  EMPTY_FILTERS,
  ENTRY_TYPE_LABEL,
  NO_BLOCKER,
  NO_PRIORITY,
  UNASSIGNED_OWNER,
  useRegister,
  type Filters,
} from "@/components/materialRegister/registerStore";
import { UNTAGGED } from "@/components/materialRegister/tags";

const labelFor = (kind: keyof Filters, value: string) => {
  if (kind === "statuses") return JOURNEY_STATUS_LABEL[value as JourneyStatus];
  if (kind === "owners") return value === UNASSIGNED_OWNER ? "Unassigned" : value;
  if (kind === "entryTypes") return ENTRY_TYPE_LABEL[value as EntryType] ?? value;
  if (kind === "tags" && value === UNTAGGED) return "Untagged";
  if (kind === "priorityPeriods" && value === NO_PRIORITY) return "Not prioritised";
  if (kind === "blockers" && value === NO_BLOCKER) return "No blocker";
  return value;
};

/** Active register filters, shown wherever a view inherits that scope. */
const FilterChips: React.FC = () => {
  const { filters, setFilters } = useRegister();

  const chips: { kind: keyof Filters; value: string; label: string }[] = [];
  (
    [
      "classes",
      "statuses",
      "owners",
      "entryTypes",
      "products",
      "applications",
      "tags",
      "priorityPeriods",
      
      "blockers",
      "countries",
    ] as const
  ).forEach((k) => {
    filters[k].forEach((v) => chips.push({ kind: k, value: v, label: labelFor(k, v) }));
  });

  const hasSearch = filters.search.trim() !== "";
  if (chips.length === 0 && !hasSearch) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {hasSearch && (
        <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 text-[10px]">
          “{filters.search}”
          <button type="button" onClick={() => setFilters((f) => ({ ...f, search: "" }))}>
            <X className="h-3 w-3 opacity-60 hover:opacity-100" />
          </button>
        </span>
      )}
      {chips.map((c) => (
        <span
          key={`${c.kind}-${c.value}`}
          className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 text-[10px]"
        >
          {c.label}
          <button
            type="button"
            onClick={() =>
              setFilters((f) => ({ ...f, [c.kind]: (f[c.kind] as string[]).filter((v) => v !== c.value) }))
            }
          >
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
  );
};

export default FilterChips;
