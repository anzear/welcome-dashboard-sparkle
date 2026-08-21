import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
  JOURNEY_STATUS_LABEL,
  type JourneyStatus,
} from "@/types/materialPrioritisation";
import MultiSelectFilter from "@/components/materialRegister/MultiSelectFilter";
import { ENTRY_TYPES } from "@/components/materialRegister/materialEntry";
import { tagVocabulary, UNTAGGED } from "@/components/materialRegister/tags";
import {
  NO_ENTRY_TYPE,
  NO_PRIORITY,
  NO_PRODUCT_LINE,
  NOT_SCORED,
  UNASSIGNED_OWNER,
  useRegister,
} from "@/components/materialRegister/registerStore";
import { PRODUCT_LINES, useProductLines } from "@/components/materialRegister/productLines";

export type FilterKey =
  | "statuses"
  | "owners"
  | "entryTypes"
  | "classes"
  | "products"
  | "applications"
  | "tags"
  | "productLines"
  | "priorityPeriods"
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
  const { data, filters, setFilters, rolePreset, judgedCriteria } = useRegister();
  /** The controlled list can grow while the filter is mounted. */
  useProductLines();


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
      entryTypes: [
        ...ENTRY_TYPES.map((e) => ({
          value: e.id as string,
          label: `${e.label} (${data.filter((m) => m.entry_type === e.id).length})`,
        })),
        {
          value: NO_ENTRY_TYPE,
          label: `Not set (${data.filter((m) => m.entry_type === null).length})`,
        },
      ],
      classes: uniq(data.map((m) => m.material_class)).map((v) => ({ value: v, label: v })),

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
        { value: UNTAGGED, label: `Untagged (${data.filter((m) => m.tags.length === 0).length})` },
      ],
      // Controlled workspace list, not a free-text search over tags.
      productLines: [
        ...PRODUCT_LINES.map((line) => ({
          value: line,
          label: `${line} (${data.filter((m) => (m.product_lines ?? []).some((v) => v === line)).length})`,
        })),
        {
          value: NO_PRODUCT_LINE,
          label: `No product line (${data.filter((m) => (m.product_lines ?? []).length === 0).length})`,
        },
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

  /**
   * Replacement type is a property of replacement candidates. In the existing
   * materials scope there is nothing for it to act on, so it is offered but
   * disabled rather than silently doing nothing.
   */
  const entryTypeDisabled = rolePreset === "existing";

  const controls: [FilterKey, string, { value: string; label: string }[], string[]][] = [
    ["statuses", "Status", options.statuses, filters.statuses],
    ["owners", "Owner", options.owners, filters.owners],
    ["entryTypes", "Replacement type", options.entryTypes, filters.entryTypes],
    ["classes", "Material category", options.classes, filters.classes],
    ["products", "Applications", options.products, filters.products],
    ["applications", "Product category", options.applications, filters.applications],
    ["productLines", "Product line", options.productLines, filters.productLines],
    ["tags", "Tags", options.tags, filters.tags],
    ["priorityPeriods", "Priority period", options.priorityPeriods, filters.priorityPeriods],
  ];

  const active = controls.filter(([k]) => shown(k));

  const evidenceSection = (
    <div className="mt-2 space-y-1.5 border-t border-border/60 pt-2">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-provenance-judgement">Evidence</div>
      {/* Presence only. Document volume is not a virtue and is never filtered on. */}
      <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
        <input
          type="checkbox"
          checked={filters.hasDocuments}
          onChange={(e) => setFilters((f) => ({ ...f, hasDocuments: e.target.checked }))}
          className="h-3 w-3"
        />
        Has supporting documents
      </label>
    </div>
  );

  /** Coverage of team judgement. "Not assessed" is the one word for zero entries. */
  const assessmentSection = (
    <div className="mt-2 space-y-1.5 border-t border-border/60 pt-2">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-provenance-judgement">
        Assessment
      </div>
      <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
        <input
          type="checkbox"
          checked={filters.notAssessed}
          onChange={(e) => setFilters((f) => ({ ...f, notAssessed: e.target.checked }))}
          className="h-3 w-3"
        />
        Not assessed
      </label>
      <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
        <input
          type="checkbox"
          checked={filters.teamsDisagree}
          onChange={(e) => setFilters((f) => ({ ...f, teamsDisagree: e.target.checked }))}
          className="h-3 w-3"
        />
        Teams disagree
      </label>
    </div>
  );

  const gateActive =
    filters.gateOverdueCondition ||
    filters.gateHoldReviewOverdue ||
    filters.gateRecommendation !== "any";
  const activeCount =
    active.reduce((n, [, , , sel]) => n + sel.length, 0) +
    (gateActive ? 1 : 0) +
    (filters.hasDocuments ? 1 : 0) +
    (filters.notAssessed ? 1 : 0) +
    (filters.teamsDisagree ? 1 : 0) +
    Object.values(filters.criterionScores).filter((v) => v.length > 0).length;

  /**
   * Gate section. The five statuses are categories — filtered, never ranked or
   * summed. Overdue is a fact about a date, not a score.
   */

  const gateSection = (
    <div className="mt-2 space-y-1.5 border-t border-border/60 pt-2">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-provenance-judgement">Gate</div>
      <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
        <input
          type="checkbox"
          checked={filters.gateOverdueCondition}
          onChange={(e) => setFilters((f) => ({ ...f, gateOverdueCondition: e.target.checked }))}
          className="h-3 w-3"
        />
        Has overdue condition
      </label>
      <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
        <input
          type="checkbox"
          checked={filters.gateHoldReviewOverdue}
          onChange={(e) => setFilters((f) => ({ ...f, gateHoldReviewOverdue: e.target.checked }))}
          className="h-3 w-3"
        />
        Hold review overdue
      </label>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">Recommendation</span>
        <div className="inline-flex overflow-hidden rounded-md border border-border">
          {(["any", "yes", "no"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, gateRecommendation: v }))}
              className={cn(
                "px-1.5 py-0.5 text-[10px] capitalize transition-colors",
                filters.gateRecommendation === v
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "any" ? "Any" : v === "yes" ? "Exists" : "None"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * One filter per judged criterion: the 1–5 values plus "Not scored". Nothing
   * recorded is its own value — never a zero and never folded into a low score.
   */
  const criterionScoreSection = (
    <div className="mt-2 space-y-1.5 border-t border-border/60 pt-2">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-provenance-judgement">
        Driver scores
      </div>
      {judgedCriteria.map((c) => {
        const sel = filters.criterionScores[c.criterion_id] ?? [];
        return (
          <div key={c.criterion_id} className="flex items-center justify-between gap-2">
            <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground" title={c.label}>
              {c.label}
            </span>
            <MultiSelectFilter
              label={sel.length > 0 ? `${sel.length} chosen` : "Any"}
              options={[
                ...[1, 2, 3, 4, 5].map((v) => ({ value: String(v), label: String(v) })),
                { value: NOT_SCORED, label: "Not scored" },
              ]}
              selected={sel}
              onChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  criterionScores: { ...f.criterionScores, [c.criterion_id]: v },
                }))
              }
            />
          </div>
        );
      })}
    </div>
  );

  if (variant === "popover") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors",
              activeCount > 0
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
              className,
            )}
          >
            <Filter className="h-3 w-3 opacity-70" />
            Filters
            {activeCount > 0 && (
              <span className="tabular-nums text-primary">{activeCount}</span>
            )}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="portfolio-type w-64 p-2">
          <div className="space-y-1.5">
            {active.map(([key, label, opts, sel]) => {
              const off = key === "entryTypes" && entryTypeDisabled;
              return (
                <div key={key} className="space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-[11px] text-muted-foreground", off && "opacity-50")}>
                      {label}
                    </span>
                    <MultiSelectFilter
                      label={sel.length > 0 ? `${sel.length} chosen` : "Any"}
                      options={opts}
                      selected={sel}
                      onChange={(v) => setFilters((f) => ({ ...f, [key]: v }))}
                      disabled={off}
                    />
                  </div>
                  {off && (
                    <div className="text-[10px] leading-tight text-muted-foreground">
                      Applies to replacement candidates only.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {gateSection}
          {assessmentSection}
          {criterionScoreSection}
          {evidenceSection}
          
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() =>
                setFilters((f) => {
                  const next = { ...f };
                  active.forEach(([k]) => ((next as any)[k] = []));
                  next.gateOverdueCondition = false;
                  next.gateHoldReviewOverdue = false;
                  next.gateRecommendation = "any";
                  next.hasDocuments = false;
                  next.notAssessed = false;
                  next.teamsDisagree = false;
                  
                  next.criterionScores = {};
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
          disabled={key === "entryTypes" && entryTypeDisabled}
        />
      ))}
    </div>
  );
};

export default FilterSelects;

