import React, { useMemo, useState } from "react";
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
import { cleanTags, hasTag, normalizeTag, tagVocabulary } from "@/components/materialRegister/tags";

export type BulkKind = "status" | "owner" | "add_tags" | "remove_tags";

export const BLOCKER_CATEGORIES = [
  "Technical performance",
  "Regulatory / compliance",
  "Supply availability",
  "Cost gap",
  "Customer approval",
  "Internal capacity",
];

const STATUS_ORDER: JourneyStatus[] = [
  "not_started",
  "under_evaluation",
  "in_testing",
  "qualified",
  "sourcing",
  "in_use",
  "parked",
  "rejected",
];

export interface BulkPayload {
  kind: BulkKind;
  value: string | null;
  /** Tags to add or remove. Empty for status / owner actions. */
  tags?: string[];
  blocker_category?: string | null;
  blocker_detail?: string | null;
}

interface Props {
  kind: BulkKind | null;
  materials: Material[];
  hiddenCount: number;
  ownerOptions: string[];
  /** Every tag in use across the register, for autocomplete. */
  tagSuggestions: string[];
  onCancel: () => void;
  onApply: (payload: BulkPayload) => void;
}

const UNASSIGNED = "__unassigned__";

const currentLabel = (kind: BulkKind, m: Material) => {
  if (kind === "status") return JOURNEY_STATUS_LABEL[m.journey_status];
  return m.owner ?? "Unassigned";
};

export const BulkActionDialog: React.FC<Props> = ({
  kind,
  materials,
  hiddenCount,
  ownerOptions,
  tagSuggestions,
  onCancel,
  onApply,
}) => {
  const [value, setValue] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [blockerCategory, setBlockerCategory] = useState<string>("");
  const [blockerDetail, setBlockerDetail] = useState<string>("");
  const [showList, setShowList] = useState(false);

  // reset when the action changes
  React.useEffect(() => {
    setValue("");
    setTags([]);
    setDraft("");
    setBlockerCategory("");
    setBlockerDetail("");
    setShowList(false);
  }, [kind]);

  const isTagAction = kind === "add_tags" || kind === "remove_tags";

  /** Tags present on the selection, with counts — the only removable set. */
  const selectionTags = useMemo(() => tagVocabulary(materials), [materials]);

  const addMatches = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    return tagSuggestions.filter((t) => t.toLowerCase().includes(q) && !hasTag(tags, t)).slice(0, 6);
  }, [draft, tagSuggestions, tags]);

  const addTag = (raw: string) => {
    const t = normalizeTag(raw);
    setDraft("");
    if (!t || hasTag(tags, t)) return;
    setTags((prev) => [...prev, t]);
  };

  const targetLabel = useMemo(() => {
    if (!kind || isTagAction || !value) return null;
    if (kind === "status") return JOURNEY_STATUS_LABEL[value as JourneyStatus];
    return value === UNASSIGNED ? "Unassigned" : value;
  }, [kind, isTagAction, value]);

  const breakdown = useMemo(() => {
    if (!kind || isTagAction) return [];
    const counts = new Map<string, number>();
    materials.forEach((m) => {
      const l = currentLabel(kind, m);
      counts.set(l, (counts.get(l) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [kind, isTagAction, materials]);

  /** Per-tag consequence sentence: who gains it, who already has it. */
  const tagEffects = useMemo(() => {
    if (!isTagAction) return [];
    return cleanTags(tags).map((t) => {
      const have = materials.filter((m) => hasTag(m.tags, t)).length;
      return kind === "add_tags"
        ? { tag: t, sentence: `${materials.length - have} will gain the tag. ${have} already have it.` }
        : { tag: t, sentence: `${have} will lose the tag. ${materials.length - have} do not have it.` };
    });
  }, [isTagAction, kind, tags, materials]);

  const requiresBlocker = kind === "status" && (value === "parked" || value === "rejected");
  const canApply = isTagAction
    ? cleanTags(tags).length > 0
    : Boolean(value) && (!requiresBlocker || Boolean(blockerCategory));

  const title =
    kind === "status"
      ? `Set status for ${materials.length} materials`
      : kind === "owner"
        ? `Set owner for ${materials.length} materials`
        : kind === "add_tags"
          ? `Add tags to ${materials.length} materials`
          : `Remove tags from ${materials.length} materials`;

  return (
    <Dialog open={kind !== null} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            {kind === "add_tags"
              ? "Tags are added, never overwritten. Nothing is written until you press Apply."
              : kind === "remove_tags"
                ? "Only tags present on the selection can be removed. Nothing is written until you press Apply."
                : "Nothing is written until you press Apply. Bulk-set values are recorded as entered data."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {kind === "status"
                ? "New status"
                : kind === "owner"
                  ? "New owner"
                  : kind === "add_tags"
                    ? "Tags to add"
                    : "Tags to remove"}
            </div>

            {kind === "add_tags" ? (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-input bg-background px-1.5 py-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 text-[10px]"
                    >
                      {t}
                      <button type="button" aria-label={`Remove ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))}>
                        <X className="h-3 w-3 opacity-60 hover:opacity-100" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={draft}
                    maxLength={40}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(draft);
                      }
                      if (e.key === "Backspace" && draft === "" && tags.length) setTags(tags.slice(0, -1));
                    }}
                    onBlur={() => addTag(draft)}
                    placeholder={tags.length === 0 ? "Type a tag and press Enter" : ""}
                    className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-[11px] outline-none placeholder:text-muted-foreground/60"
                  />
                </div>
                {addMatches.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {addMatches.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => addTag(t)}
                        className="rounded-sm border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : kind === "remove_tags" ? (
              selectionTags.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">No tags on the selected materials.</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {selectionTags.map(({ tag, count }) => {
                    const on = hasTag(tags, tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTags(on ? tags.filter((x) => x !== tag) : [...tags, tag])}
                        className={
                          on
                            ? "rounded-sm bg-foreground px-1.5 py-0.5 text-[10px] text-background"
                            : "rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        }
                      >
                        {tag} <span className="tabular-nums opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select a value" />
                </SelectTrigger>
                <SelectContent>
                  {kind === "status"
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

          {requiresBlocker && (
            <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">
                Blocker required
              </div>
              <Select value={blockerCategory} onValueChange={setBlockerCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Blocker category (required)" />
                </SelectTrigger>
                <SelectContent>
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

          {isTagAction ? (
            tagEffects.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  What will happen
                </div>
                <ul className="space-y-0.5 text-[11px]">
                  {tagEffects.map((e) => (
                    <li key={e.tag}>
                      {kind === "add_tags" ? "Add" : "Remove"} '{e.tag}'{" "}
                      {kind === "add_tags" ? "to" : "from"} {materials.length} materials?{" "}
                      <span className="text-muted-foreground">{e.sentence}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          ) : (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                What will be overwritten
              </div>
              <ul className="space-y-0.5 font-mono text-[11px]">
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
                value: isTagAction ? null : kind === "owner" && value === UNASSIGNED ? null : value,
                tags: isTagAction ? cleanTags(tags) : undefined,
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
