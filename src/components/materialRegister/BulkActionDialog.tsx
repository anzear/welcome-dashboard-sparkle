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
import { JOURNEY_STATUS_LABEL, type JourneyStatus, type Material } from "@/types/materialPrioritisation";

export type BulkKind = "status" | "owner" | "tag";

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
  blocker_category?: string | null;
  blocker_detail?: string | null;
}

interface Props {
  kind: BulkKind | null;
  materials: Material[];
  hiddenCount: number;
  ownerOptions: string[];
  onCancel: () => void;
  onApply: (payload: BulkPayload) => void;
}

const UNASSIGNED = "__unassigned__";

const currentLabel = (kind: BulkKind, m: Material) => {
  if (kind === "status") return JOURNEY_STATUS_LABEL[m.journey_status];
  if (kind === "owner") return m.owner ?? "Unassigned";
  return m.customer_material_group ?? "No tag";
};

export const BulkActionDialog: React.FC<Props> = ({
  kind,
  materials,
  hiddenCount,
  ownerOptions,
  onCancel,
  onApply,
}) => {
  const [value, setValue] = useState<string>("");
  const [blockerCategory, setBlockerCategory] = useState<string>("");
  const [blockerDetail, setBlockerDetail] = useState<string>("");
  const [showList, setShowList] = useState(false);

  // reset when the action changes
  React.useEffect(() => {
    setValue("");
    setBlockerCategory("");
    setBlockerDetail("");
    setShowList(false);
  }, [kind]);

  const targetLabel = useMemo(() => {
    if (!kind || !value) return null;
    if (kind === "status") return JOURNEY_STATUS_LABEL[value as JourneyStatus];
    if (kind === "owner") return value === UNASSIGNED ? "Unassigned" : value;
    return value;
  }, [kind, value]);

  const breakdown = useMemo(() => {
    if (!kind) return [];
    const counts = new Map<string, number>();
    materials.forEach((m) => {
      const l = currentLabel(kind, m);
      counts.set(l, (counts.get(l) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [kind, materials]);

  const requiresBlocker = kind === "status" && (value === "parked" || value === "rejected");
  const canApply = Boolean(value) && (!requiresBlocker || Boolean(blockerCategory));

  const title =
    kind === "status"
      ? `Set status for ${materials.length} materials`
      : kind === "owner"
        ? `Set owner for ${materials.length} materials`
        : `Set tag for ${materials.length} materials`;

  return (
    <Dialog open={kind !== null} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            Nothing is written until you press Apply. Bulk-set values are recorded as entered data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {kind === "status" ? "New status" : kind === "owner" ? "New owner" : "Tag"}
            </div>
            {kind === "tag" ? (
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. Q3 review batch"
                className="h-8 text-xs"
              />
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
                value: kind === "owner" && value === UNASSIGNED ? null : value,
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
