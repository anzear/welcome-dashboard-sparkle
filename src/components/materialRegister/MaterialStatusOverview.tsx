import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CURRENT_USER,
  RegisterProvider,
  useRegister,
} from "@/components/materialRegister/registerStore";
import { JOURNEY_STATUS_LABEL, JOURNEY_STATUSES, type JourneyStatus } from "@/types/materialPrioritisation";
import { prototypeBriefSeed } from "@/components/materialRegister/materialEntry";
import { hasOverdueCondition, holdReviewOverdue } from "@/components/materialRegister/gate";

/**
 * Status strip shown on the value-chain hero: the material's register status
 * and internal deadline. Internal deadline is editable inline, and the status can
 * be set straight from the dropdown.
 */
const SummaryField: React.FC<{ label: string; children: React.ReactNode; hint?: React.ReactNode }> = ({
  label,
  children,
  hint,
}) => (
  <div className="px-4 py-3">
    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{label}</div>
    {children}
    {hint ? <div className="mt-1.5 text-[10px] text-muted-foreground">{hint}</div> : null}
  </div>
);

const StatusOverviewContent: React.FC<{ materialName: string }> = ({ materialName }) => {
  const { allMaterials, addMaterials, updateMaterial } = useRegister();

  const material = useMemo(
    () =>
      allMaterials.find((m) => m.name.toLowerCase() === materialName.trim().toLowerCase()) ?? null,
    [allMaterials, materialName],
  );

  // The register is the source of truth for status/owner/period. When the
  // viewed material has no row yet, add a blank one so the strip stays live.
  useEffect(() => {
    if (!materialName.trim() || material) return;
    addMaterials([prototypeBriefSeed(materialName.trim())], {
      batchOrigin: "real_transition",
      source: CURRENT_USER,
    });
  }, [material, materialName, addMaterials]);


  const periods = useMemo(
    () =>
      Array.from(new Set(allMaterials.map((m) => m.priority_period).filter(Boolean) as string[])).sort(),
    [allMaterials],
  );

  const [period, setPeriod] = useState(material?.priority_period ?? "");
  useEffect(() => setPeriod(material?.priority_period ?? ""), [material?.material_id, material?.priority_period]);

  if (!material) return null;

  const commitStatus = (value: string) => {
    const next = value as JourneyStatus;
    if (next === material.journey_status) return;
    updateMaterial(material.material_id, { journey_status: next }, ["journey_status"], [
      {
        material_id: material.material_id,
        event_type: "status_change",
        field: "journey_status",
        from_value: material.journey_status,
        to_value: next,
        changed_by: CURRENT_USER,
      },
    ]);
  };

  const commitPeriod = () => {
    const next = period.trim() ? period.trim() : null;
    if (next === material.priority_period) return;
    updateMaterial(material.material_id, { priority_period: next }, ["priority_period"], [
      {
        material_id: material.material_id,
        event_type: "priority_change",
        field: "priority_period",
        from_value: material.priority_period,
        to_value: next,
        changed_by: CURRENT_USER,
      },
    ]);
  };

  const overdue =
    hasOverdueCondition(material) ? "Condition overdue"
    : holdReviewOverdue(material) ? "Review overdue"
    : null;

  return (
    <div className="grid sm:grid-cols-2 divide-x divide-border/60 border-t border-border/60">
      <SummaryField
        label="Status"
        hint={overdue ? <span className="text-amber-600">{overdue}</span> : null}
      >
        <Select value={material.journey_status} onValueChange={commitStatus}>
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-50 bg-popover">
            {JOURNEY_STATUSES.map((status) => (
              <SelectItem key={status} value={status} className="text-xs">
                {JOURNEY_STATUS_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SummaryField>

      <SummaryField
        label="Internal deadline"
        hint={material.priority_period ? undefined : "Not prioritised"}
      >
        <Input
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          onBlur={commitPeriod}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitPeriod();
            }
          }}
          placeholder="e.g. H2 2026"
          list={`periods-${material.material_id}`}
          className="h-8 text-xs"
        />
        <datalist id={`periods-${material.material_id}`}>
          {periods.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </SummaryField>
    </div>
  );
};

const MaterialStatusOverview: React.FC<{ materialName: string }> = ({ materialName }) => (
  <RegisterProvider>
    <StatusOverviewContent materialName={materialName} />
  </RegisterProvider>
);

export default MaterialStatusOverview;
