import React, { useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BriefGate from "@/components/materialRegister/BriefGate";
import PositionBlock from "@/components/materialRegister/PositionBlock";
import { StatusPill } from "@/components/materialRegister/primitives";
import { blankMaterial } from "@/components/materialRegister/materialEntry";
import {
  CURRENT_USER,
  RegisterProvider,
  useRegister,
} from "@/components/materialRegister/registerStore";
import { hasOverdueCondition, holdReviewOverdue } from "@/components/materialRegister/gate";

const UNASSIGNED = "__unassigned__";

const SummaryField: React.FC<{
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}> = ({ label, children, hint, className = "" }) => (
  <div className={`min-w-0 px-4 py-3 ${className}`}>
    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {label}
    </div>
    <div className="flex min-h-8 items-center">{children}</div>
    {hint && <div className="mt-1 text-[10px] leading-[13px] text-muted-foreground">{hint}</div>}
  </div>
);

const StatusOverviewContent: React.FC<{ materialName: string }> = ({ materialName }) => {
  const { data, visible, openId, openBrief, addMaterials, updateMaterial } = useRegister();
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current || !materialName) return;
    const match = data.find((material) => material.name.trim().toLowerCase() === materialName.toLowerCase());
    bootstrapped.current = true;
    if (match) {
      openBrief(match.material_id);
      return;
    }
    const [id] = addMaterials([{ ...blankMaterial(), name: materialName }], {
      batchOrigin: "real_transition",
      source: CURRENT_USER,
    });
    if (id) openBrief(id);
  }, [addMaterials, data, materialName, openBrief]);

  const material = data.find((item) => item.material_id === openId);
  const row = visible.find((item) => item.m.material_id === openId);
  const ownerNames = useMemo(
    () => [...new Set(data.map((item) => item.owner).filter((owner): owner is string => Boolean(owner)))].sort(),
    [data],
  );
  const periodSuggestions = useMemo(
    () => [...new Set(data.map((item) => item.priority_period).filter((period): period is string => Boolean(period)))].sort(),
    [data],
  );

  if (!material) return null;

  const commitPeriod = (next: string | null) => {
    if (next === material.priority_period) return;
    updateMaterial(material.material_id, { priority_period: next }, ["priority_period"], [
      {
        material_id: material.material_id,
        event_type: "priority_change",
        field: "priority_period",
        from_value: material.priority_period,
        to_value: next,
      },
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm">
        <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-[190px_190px_325px_1fr]">
          <SummaryField label="Status" hint="Set in the Status panel">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusPill
                status={material.journey_status}
                entered={material.provenance.journey_status?.origin === "entered"}
              />
              {(hasOverdueCondition(material) || holdReviewOverdue(material)) && (
                <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                  {hasOverdueCondition(material) ? "Condition overdue" : "Review overdue"}
                </span>
              )}
            </div>
          </SummaryField>

          <SummaryField label="Owner">
            <Select
              value={material.owner ?? UNASSIGNED}
              onValueChange={(value) => {
                const next = value === UNASSIGNED ? null : value;
                if (next === material.owner) return;
                updateMaterial(material.material_id, { owner: next }, ["owner"], [
                  {
                    material_id: material.material_id,
                    event_type: "owner_change",
                    field: "owner",
                    from_value: material.owner,
                    to_value: next,
                  },
                ]);
              }}
            >
              <SelectTrigger className="h-8 w-full bg-background text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="portfolio-type">
                {ownerNames.map((owner) => (
                  <SelectItem key={owner} value={owner} className="text-xs">
                    {owner}
                  </SelectItem>
                ))}
                <SelectItem value={UNASSIGNED} className="text-xs">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </SummaryField>

          <SummaryField label="Priority period" hint={material.priority_period ? undefined : "Not prioritised"}>
            <Input
              list="overview-priority-periods"
              defaultValue={material.priority_period ?? ""}
              key={`${material.material_id}-${material.priority_period ?? ""}`}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              onBlur={(event) => commitPeriod(event.currentTarget.value.trim() || null)}
              placeholder="e.g. H2 2026"
              className="h-8 bg-background text-[11px] tabular-nums"
            />
            <datalist id="overview-priority-periods">
              {periodSuggestions.map((period) => <option key={period} value={period} />)}
            </datalist>
          </SummaryField>

          <SummaryField label="Position">
            <PositionBlock
              materialId={material.material_id}
              gapMeasure={row?.gapMeasure ?? null}
              gapSize={row?.gapSize ?? 0}
              variant="inline"
            />
          </SummaryField>
        </div>
      </div>

      <section className="space-y-3 rounded-lg border border-border/70 bg-card p-4 shadow-sm">
        <div className="border-b border-border/70 pb-1.5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Status</h2>
          <p className="pt-1 text-xs leading-snug text-muted-foreground">Set by the owner.</p>
        </div>
        <BriefGate material={material} />
      </section>
    </div>
  );
};

const MaterialStatusOverview: React.FC<{ materialName: string }> = ({ materialName }) => (
  <RegisterProvider>
    <StatusOverviewContent materialName={materialName} />
  </RegisterProvider>
);

export default MaterialStatusOverview;