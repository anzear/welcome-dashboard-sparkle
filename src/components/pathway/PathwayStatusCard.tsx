import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type PathwayStatus =
  | "todo"
  | "in_validation"
  | "validated"
  | "validated_with_conditions"
  | "rejected"
  | "parked";

export const PATHWAY_STATUS_LABEL: Record<PathwayStatus, string> = {
  todo: "To do",
  in_validation: "In validation",
  validated: "Validated",
  validated_with_conditions: "Validated with conditions",
  rejected: "Rejected",
  parked: "Parked",
};

export const PATHWAY_STATUSES: PathwayStatus[] = [
  "todo",
  "in_validation",
  "validated",
  "validated_with_conditions",
  "rejected",
  "parked",
];

const storageKey = (topic: string | undefined, pathwayId: string) =>
  `vcg.pathway.status.${topic ? encodeURIComponent(topic) : "default"}.${pathwayId}`;

interface PathwayStatusCardProps {
  pathwayId: string;
  topic?: string;
}

export const PathwayStatusCard: React.FC<PathwayStatusCardProps> = ({
  pathwayId,
  topic,
}) => {
  const [status, setStatus] = useState<PathwayStatus>("todo");

  useEffect(() => {
    const stored = localStorage.getItem(storageKey(topic, pathwayId));
    if (stored && PATHWAY_STATUSES.includes(stored as PathwayStatus)) {
      setStatus(stored as PathwayStatus);
    }
  }, [topic, pathwayId]);

  const commit = (next: PathwayStatus) => {
    setStatus(next);
    localStorage.setItem(storageKey(topic, pathwayId), next);
  };

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
          Pathway status
        </span>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-medium border pathway-status pathway-status--",
            status
          )}
        >
          {PATHWAY_STATUS_LABEL[status]}
        </Badge>
      </div>
      <Select value={status} onValueChange={(value) => commit(value as PathwayStatus)}>
        <SelectTrigger
          aria-label="Pathway status"
          className="h-7 w-[220px] shrink-0 text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PATHWAY_STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {PATHWAY_STATUS_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PathwayStatusCard;
