import { useCallback, useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Stages of supplier engagement — one ordered ladder, "Not engaged" is the unset state. */
export const ENGAGEMENT_STAGES = [
  "Not engaged",
  "Contacted",
  "RFQ/RFP issued",
  "Under evaluation",
  "Sampling / testing",
  "Negotiation",
  "Qualified supplier",
] as const;

export type EngagementStage = (typeof ENGAGEMENT_STAGES)[number];

const STORAGE_KEY = "vcg.workspace.companyEngagementStages";

function readStages(): Record<string, EngagementStage> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, EngagementStage>) : {};
  } catch {
    return {};
  }
}

/** localStorage-backed engagement stage per company id, shared across tables. */
export function useEngagementStages() {
  const [stages, setStages] = useState<Record<string, EngagementStage>>(readStages);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stages));
    } catch {
      // ignore quota errors in the prototype
    }
  }, [stages]);

  const setStage = useCallback((companyId: string, stage: EngagementStage) => {
    setStages((current) => ({ ...current, [companyId]: stage }));
  }, []);

  return { stages, setStage };
}

/** Compact dropdown for picking a company's engagement stage. */
export function EngagementStageSelect({
  value,
  onChange,
  companyName,
}: {
  value: EngagementStage;
  onChange: (stage: EngagementStage) => void;
  companyName: string;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as EngagementStage)}>
      <SelectTrigger
        aria-label={`Engagement stage for ${companyName}`}
        className="h-8 w-full border-transparent bg-transparent px-2 text-[10px] shadow-none hover:border-input hover:bg-background focus:border-input focus:bg-background"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ENGAGEMENT_STAGES.map((stage) => (
          <SelectItem key={stage} value={stage} className="text-[10px]">
            {stage}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
