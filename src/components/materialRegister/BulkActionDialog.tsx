import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { JOURNEY_STATUS_LABEL, type JourneyStatus, type Material } from "@/types/materialPrioritisation";
import { cleanTags, hasTag, normalizeTag } from "@/components/materialRegister/tags";
import { ENTRY_TYPES } from "@/components/materialRegister/materialEntry";
import { PRODUCT_LINES, useProductLines } from "@/components/materialRegister/productLines";
import ProductLinePicker, { ProductLineChips } from "@/components/materialRegister/ProductLinePicker";

export type BulkKind =
  | "status"
  | "owner"
  | "products"
  | "applications"
  | "priority_period"
  | "entry_type"
  | "product_lines"
  | "tags"
  | "intelligence";

/** Sentinel for the bulk "clear type" choice — Select needs a non-empty value. */
export const CLEAR_ENTRY_TYPE = "__clear_type__";

/** Multi-value actions add by default; remove is an explicit mode. */
export type BulkMode = "add" | "remove";

export const BLOCKER_CATEGORIES = [
  "Technical performance",
  "Regulatory / compliance",
  "Supply availability",
  "Cost gap",
  "Customer approval",
  "Internal capacity",
];

const STATUS_ORDER: JourneyStatus[] = [
  "under_evaluation",
  "go",
  "go_with_conditions",
  "hold",
  "no_go",
];

export interface BulkPayload {
  kind: BulkKind;
  value: string | null;
  /** Values to add or remove for the multi-value actions. */
  values?: string[];
  mode?: BulkMode;
  blocker_category?: string | null;
  blocker_detail?: string | null;
}

interface Props {
  kind: BulkKind | null;
  materials: Material[];
  hiddenCount: number;
  ownerOptions: string[];
  /** Vocabulary in use across the register, for autocomplete. */
  productSuggestions: string[];
  applicationSuggestions: string[];
  /** General tag vocabulary in use, for autocomplete on the tag action. */
  tagSuggestions: string[];
  /** Priority periods already in use. */
  periodSuggestions: string[];
  onCancel: () => void;
  onApply: (payload: BulkPayload) => void;
}

const UNASSIGNED = "__unassigned__";

const MULTI: Record<string, { field: keyof Material; noun: string }> = {
  products: { field: "application_areas", noun: "application" },
  applications: { field: "application_categories", noun: "product category" },
  product_lines: { field: "product_lines", noun: "product line" },
  tags: { field: "tags", noun: "tag" },
};

/** Each action reads only its own field — product line and tags are separate. */
const valuesOf = (m: Material, kind: BulkKind): string[] => {
  const cfg = MULTI[kind];
  if (!cfg) return [];
  return ((m[cfg.field] as string[] | null) ?? []) as string[];
};

/** Vocabulary present on the selection, with counts — the only removable set. */
function vocabulary(materials: Material[], kind: BulkKind) {
  const seen = new Map<string, { value: string; count: number }>();
  materials.forEach((m) =>
    cleanTags(valuesOf(m, kind)).forEach((v) => {
      const k = v.toLowerCase();
      const hit = seen.get(k);
      if (hit) hit.count += 1;
      else seen.set(k, { value: v, count: 1 });
    }),
  );
  return [...seen.values()].sort((a, b) => a.value.localeCompare(b.value));
}

export const BulkActionDialog: React.FC<Props> = ({
  kind,
  materials,
  hiddenCount,
  ownerOptions,
  productSuggestions,
  applicationSuggestions,
  tagSuggestions,
  periodSuggestions,
  onCancel,
  onApply,
}) => {
  const [value, setValue] = useState<string>("");
  const [values, setValues] = useState<string[]>([]);
  const [mode, setMode] = useState<BulkMode>("add");
  const [draft, setDraft] = useState("");
  const [asLine, setAsLine] = useState(false);
  const productLines = useProductLines();
  const [blockerCategory, setBlockerCategory] = useState<string>("");
  const [blockerDetail, setBlockerDetail] = useState<string>("");
  const [showList, setShowList] = useState(false);

  // reset when the action changes
  React.useEffect(() => {
    setValue("");
    setValues([]);
    setMode("add");
    setDraft("");
    setBlockerCategory("");
    setBlockerDetail("");
    setShowList(false);
    setAsLine(false);
  }, [kind]);

  const isMulti = Boolean(kind && MULTI[kind]);
  const cfgNoun = kind && MULTI[kind] ? MULTI[kind].noun : "";
  const suggestions =
    kind === "products"
      ? productSuggestions
      : kind === "applications"
        ? applicationSuggestions
        : kind === "product_lines"
          ? [...PRODUCT_LINES]
          : kind === "tags"
            ? tagSuggestions
            : [];

  const selectionVocab = useMemo(
    () => (isMulti && kind ? vocabulary(materials, kind) : []),
    [isMulti, kind, materials],
  );

  const addMatches = useMemo(() => {
    if (!isMulti) return [];
    const q = draft.trim().toLowerCase();
    const available = suggestions.filter((t) => !hasTag(values, t));
    // The tag vocabulary is offered before anything is typed.
    if (!q) return kind === "tags" ? available.slice(0, 12) : [];
    return available.filter((t) => t.toLowerCase().includes(q)).slice(0, 8);
  }, [draft, suggestions, values, isMulti, kind, productLines]);

  const addValue = (raw: string) => {
    const t = normalizeTag(raw);
    setDraft("");
    if (!t) return;
    if (hasTag(values, t)) return;
    setValues((prev) => [...prev, t]);
  };

  /** Per-value consequence sentence: who gains it, who already has it. */
  const multiEffects = useMemo(() => {
    if (!isMulti || !kind) return [];
    return cleanTags(values).map((v) => {
      const have = materials.filter((m) => hasTag(valuesOf(m, kind), v)).length;
      return {
        value: v,
        sentence:
          mode === "add"
            ? `${materials.length - have} will gain it. ${have} already have it.`
            : `${have} will lose it. ${materials.length - have} do not have it.`,
      };
    });
  }, [isMulti, kind, values, materials, mode]);

  /** Priority period: state exactly what is replaced and what does not change. */
  const periodEffect = useMemo(() => {
    if (kind !== "priority_period") return null;
    const target = value.trim() || null;
    const none = materials.filter((m) => m.priority_period === null).length;
    const same = materials.filter((m) => m.priority_period === target).length;
    const other = new Map<string, number>();
    materials.forEach((m) => {
      if (m.priority_period !== null && m.priority_period !== target) {
        const k = m.priority_period ?? "an unnamed period";
        other.set(k, (other.get(k) ?? 0) + 1);
      }
    });
    return { target, none, same, other: [...other.entries()].sort((a, b) => b[1] - a[1]) };
  }, [kind, value, materials]);

  const intelligenceEffect = useMemo(() => {
    if (kind !== "intelligence") return null;
    const none = materials.filter((m) => m.intelligence_status === "not_ordered").length;
    return { none, already: materials.length - none };
  }, [kind, materials]);

  const clearingType = kind === "entry_type" && value === CLEAR_ENTRY_TYPE;
  const requiresBlocker = kind === "status" && (value === "hold" || value === "no_go");
  const canApply =
    kind === "intelligence"
      ? materials.length > 0
      : isMulti
        ? cleanTags(values).length > 0
        : kind === "priority_period"
          ? materials.length > 0
          : Boolean(value) && (!requiresBlocker || Boolean(blockerCategory));

  const title =
    kind === "status"
      ? `Set status for ${materials.length} materials`
      : kind === "owner"
        ? `Set owner for ${materials.length} materials`
        : kind === "products"
          ? `${mode === "add" ? "Add" : "Remove"} applications — ${materials.length} materials`
          : kind === "applications"
            ? `${mode === "add" ? "Add" : "Remove"} product categories — ${materials.length} materials`
            : kind === "product_lines"
              ? `${mode === "add" ? "Add" : "Remove"} product lines — ${materials.length} materials`
              : kind === "tags"
              ? `${mode === "add" ? "Add" : "Remove"} tags — ${materials.length} materials`
              : kind === "priority_period"
              ? `${value.trim() ? "Set" : "Clear"} priority period for ${materials.length} materials`
              : kind === "entry_type"
                ? `${clearingType ? "Clear" : "Set"} type for ${materials.length} materials`
                : `Request coverage for ${materials.length} materials`;

  const targetLabel = useMemo(() => {
    if (!kind || isMulti || !value) return null;
    if (kind === "status") return JOURNEY_STATUS_LABEL[value as JourneyStatus];
    if (kind === "owner") return value === UNASSIGNED ? "Unassigned" : value;
    if (kind === "entry_type")
      return value === CLEAR_ENTRY_TYPE
        ? "Not set"
        : (ENTRY_TYPES.find((e) => e.id === value)?.label ?? value);
    return null;
  }, [kind, isMulti, value]);

  const breakdown = useMemo(() => {
    if (kind !== "status" && kind !== "owner" && kind !== "entry_type") return [];
    const counts = new Map<string, number>();
    materials.forEach((m) => {
      const l =
        kind === "status"
          ? JOURNEY_STATUS_LABEL[m.journey_status]
          : kind === "entry_type"
            ? (ENTRY_TYPES.find((e) => e.id === m.entry_type)?.label ?? "Not set")
            : (m.owner ?? "Unassigned");
      counts.set(l, (counts.get(l) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [kind, materials]);

  return (
    <Dialog open={kind !== null} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="portfolio-type max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            {isMulti
              ? mode === "add"
                ? "Values are added, never overwritten. Nothing is written until you press Apply."
                : "Only values present on the selection can be removed. Nothing is written until you press Apply."
              : "Nothing is written until you press Apply. Bulk-set values are recorded as entered data."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          {isMulti && (
            <div className="inline-flex items-center gap-1 rounded-md bg-muted p-0.5">
              {(["add", "remove"] as BulkMode[]).map((mm) => (
                <button
                  key={mm}
                  type="button"
                  onClick={() => {
                    setMode(mm);
                    setValues([]);
                    setDraft("");
                  }}
                  className={
                    mode === mm
                      ? "rounded-[4px] bg-foreground px-2.5 py-1 text-[11px] font-medium text-background shadow-sm"
                      : "rounded-[4px] px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  }
                >
                  {mm === "add" ? "Add" : "Remove"}
                </button>
              ))}
            </div>
          )}

          {kind !== "intelligence" && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {kind === "status"
                  ? "New status"
                  : kind === "owner"
                    ? "New owner"
                    : kind === "priority_period"
                      ? "Priority period"
                      : kind === "entry_type"
                        ? "New type"
                        : `${mode === "add" ? "Values to add" : "Values to remove"}`}
              </div>

              {isMulti ? (
                mode === "add" && kind === "product_lines" ? (
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-1.5 py-1.5">
                      <ProductLineChips
                        values={values}
                        onRemove={(v) => setValues(values.filter((x) => x !== v))}
                        emptyLabel="No product line chosen"
                      />
                      <ProductLinePicker values={values} onChange={setValues} />
                    </div>
                    <p className="text-[10px] leading-tight text-muted-foreground">
                      Chosen from the workspace list. New values are added from inside the picker.
                    </p>
                  </div>
                ) : mode === "add" ? (
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1 rounded-md border border-input bg-background px-1.5 py-1">
                      {values.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 text-[10px]"
                        >
                          {t}
                          <button
                            type="button"
                            aria-label={`Remove ${t}`}
                            onClick={() => setValues(values.filter((x) => x !== t))}
                          >
                            <X className="h-3 w-3 opacity-60 hover:opacity-100" />
                          </button>
                        </span>
                      ))}
                      <input
                        value={draft}
                        maxLength={60}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addValue(draft);
                          }
                          if (e.key === "Backspace" && draft === "" && values.length)
                            setValues(values.slice(0, -1));
                        }}
                        onBlur={() => addValue(draft)}
                        placeholder={values.length === 0 ? `Type a ${cfgNoun} and press Enter` : ""}
                        className="min-w-[10rem] flex-1 bg-transparent px-1 py-0.5 text-[11px] outline-none placeholder:text-muted-foreground/60"
                      />
                    </div>
                    {addMatches.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70">
                          {draft.trim() ? "Matches" : `Existing ${cfgNoun}s`}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {addMatches.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => addValue(t)}
                              className="rounded-sm border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : selectionVocab.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    No {cfgNoun} recorded on the selected materials.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {selectionVocab.map(({ value: v, count }) => {
                      const on = hasTag(values, v);
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setValues(on ? values.filter((x) => x !== v) : [...values, v])}
                          className={
                            on
                              ? "rounded-sm bg-foreground px-1.5 py-0.5 text-[10px] text-background"
                              : "rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                          }
                        >
                          {v} <span className="tabular-nums opacity-70">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : kind === "priority_period" ? (
                <div className="space-y-1">
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. H2 2026 — empty clears it"
                    className="h-8 text-xs"
                  />
                  {periodSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {periodSuggestions.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setValue(p)}
                          className="rounded-sm border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select a value" />
                  </SelectTrigger>
                  <SelectContent className="portfolio-type">
                    {kind === "entry_type"
                      ? [
                          ...ENTRY_TYPES.map((e) => (
                            <SelectItem key={e.id} value={e.id} className="text-xs">
                              {e.label}
                            </SelectItem>
                          )),
                          <SelectItem key="clear" value={CLEAR_ENTRY_TYPE} className="text-xs">
                            Clear type (not set)
                          </SelectItem>,
                        ]
                      : kind === "status"
                      ? STATUS_ORDER.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {JOURNEY_STATUS_LABEL[s]}
                          </SelectItem>
                        ))
                      : [
                          ...ownerOptions.map((o) => (
                            <SelectItem key={o} value={o} className="text-xs">
                              {o}
                            </SelectItem>
                          )),
                          <SelectItem key={UNASSIGNED} value={UNASSIGNED} className="text-xs">
                            Unassigned
                          </SelectItem>,
                        ]}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {requiresBlocker && (
            <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">
                Blocker required
              </div>
              <Select value={blockerCategory} onValueChange={setBlockerCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Blocker category (required)" />
                </SelectTrigger>
                <SelectContent className="portfolio-type">
                  {BLOCKER_CATEGORIES.map((b) => (
                    <SelectItem key={b} value={b} className="text-xs">
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={blockerDetail}
                onChange={(e) => setBlockerDetail(e.target.value)}
                placeholder="Blocker detail (optional)"
                className="h-8 text-xs"
              />
            </div>
          )}

          {isMulti
            ? multiEffects.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    What will happen
                  </div>
                  <ul className="space-y-0.5 text-[11px]">
                    {multiEffects.map((e) => (
                      <li key={e.value}>
                        {mode === "add" ? "Add" : "Remove"} '{e.value}'{" "}
                        {mode === "add" ? "to" : "from"} {materials.length} materials?{" "}
                        <span className="text-muted-foreground">{e.sentence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            : kind === "priority_period"
              ? periodEffect && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      What will happen
                    </div>
                    <ul className="space-y-0.5 text-[11px]">
                      <li>
                        {periodEffect.target === null
                          ? `Clear priority period for ${materials.length} materials?`
                          : `Set priority period to ${periodEffect.target} for ${materials.length} materials?`}
                      </li>
                      {periodEffect.none > 0 && (
                        <li className="text-muted-foreground">
                          <span className="tabular-nums">{periodEffect.none}</span> already not
                          prioritised.
                        </li>
                      )}
                      {periodEffect.other.map(([p, n]) => (
                        <li key={p} className="text-muted-foreground">
                          <span className="tabular-nums">{n}</span> currently in {p} —{" "}
                          {periodEffect.target === null ? "this removes it" : "this replaces it"}.
                        </li>
                      ))}
                      {periodEffect.same > 0 && periodEffect.target !== null && (
                        <li className="text-muted-foreground">
                          <span className="tabular-nums">{periodEffect.same}</span> already in{" "}
                          {periodEffect.target} — no change.
                        </li>
                      )}
                    </ul>
                  </div>
                )
              : kind === "intelligence"
                ? intelligenceEffect && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        What will happen
                      </div>
                      <ul className="space-y-0.5 text-[11px] text-muted-foreground">
                        <li>
                          <span className="tabular-nums">{intelligenceEffect.none}</span> will be marked
                          coverage requested.
                        </li>
                        <li>
                          <span className="tabular-nums">{intelligenceEffect.already}</span> already have
                          coverage requested — no change.
                        </li>
                      </ul>
                    </div>
                  )
                : (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        What will be overwritten
                      </div>
                      <ul className="space-y-0.5 tabular-nums text-[11px]">
                        {breakdown.map(([label, count]) => {
                          const noChange = targetLabel !== null && label === targetLabel;
                          return (
                            <li key={label} className={noChange ? "text-muted-foreground" : "text-foreground"}>
                              <span className="tabular-nums">{count}</span> x {label}
                              {targetLabel ? (noChange ? " (no change)" : ` -> ${targetLabel}`) : ""}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

          {hiddenCount > 0 && (
            <p className="text-[11px] text-amber-700">
              {hiddenCount} of these are not visible under your current filters.
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={() => setShowList((v) => !v)}
              className="text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              {showList ? "Hide affected materials" : `Show affected materials (${materials.length})`}
            </button>
            {showList && (
              <ul className="mt-1 max-h-40 overflow-auto rounded-sm border border-border p-2 text-[11px] text-muted-foreground">
                {materials.map((m) => (
                  <li key={m.material_id}>{m.name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={!canApply}
            onClick={() =>
              onApply({
                kind: kind!,
                value: isMulti
                  ? null
                  : kind === "owner" && value === UNASSIGNED
                    ? null
                    : kind === "priority_period"
                      ? value.trim() || null
                      : kind === "intelligence"
                        ? null
                        : clearingType
                          ? null
                          : value,
                values: isMulti ? cleanTags(values) : undefined,
                mode: isMulti ? mode : undefined,
                blocker_category: requiresBlocker ? blockerCategory : undefined,
                blocker_detail: requiresBlocker ? blockerDetail || null : undefined,
              })
            }
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkActionDialog;
