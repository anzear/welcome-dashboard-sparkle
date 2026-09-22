import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

/** Fired whenever a pathway status changes, so shortlist rows can re-read it. */
export const PATHWAY_STATUS_CHANGED_EVENT = "vcg:pathway-status-changed";

export function readPathwayStatus(topic: string | undefined, pathwayId: string): PathwayStatus {
  const stored = localStorage.getItem(storageKey(topic, pathwayId));
  return stored && PATHWAY_STATUSES.includes(stored as PathwayStatus)
    ? (stored as PathwayStatus)
    : "todo";
}

interface PathwayStatusCardProps {
  pathwayId: string;
  topic?: string;
}

export const PathwayStatusCard: React.FC<PathwayStatusCardProps> = ({
  pathwayId,
  topic,
}) => {
  const [status, setStatus] = useState<PathwayStatus>("todo");
  const [conditions, setConditions] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(storageKey(topic, pathwayId));
    if (stored && PATHWAY_STATUSES.includes(stored as PathwayStatus)) {
      setStatus(stored as PathwayStatus);
    } else {
      setStatus("todo");
    }
    setConditions(localStorage.getItem(`${storageKey(topic, pathwayId)}.conditions`) ?? "");
    setRejectionReason(
      localStorage.getItem(`${storageKey(topic, pathwayId)}.rejectionReason`) ?? ""
    );
  }, [topic, pathwayId]);

  const commit = (next: PathwayStatus) => {
    setStatus(next);
    localStorage.setItem(storageKey(topic, pathwayId), next);
    window.dispatchEvent(new Event(PATHWAY_STATUS_CHANGED_EVENT));
  };

  const commitConditions = (next: string) => {
    setConditions(next);
    localStorage.setItem(`${storageKey(topic, pathwayId)}.conditions`, next);
  };

  const commitRejectionReason = (next: string) => {
    setRejectionReason(next);
    localStorage.setItem(`${storageKey(topic, pathwayId)}.rejectionReason`, next);
  };

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
            Pathway status
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-medium border pathway-status",
              `pathway-status--${status}`
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

      {status === "validated_with_conditions" && (
        <div className="mt-2.5 border-t border-border/60 pt-2.5">
          <label
            htmlFor="pathway-conditions"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Conditions
          </label>
          <Textarea
            id="pathway-conditions"
            value={conditions}
            onChange={(event) => commitConditions(event.target.value)}
            placeholder="Describe the conditions that must be met, e.g. supplier audit, regulatory clearance, pilot volumes…"
            className="mt-1 min-h-[64px] text-xs"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Saved automatically with this pathway.
          </p>
        </div>
      )}

      {status === "rejected" && (
        <div className="mt-2.5 border-t border-border/60 pt-2.5">
          <label
            htmlFor="pathway-rejection-reason"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Reason for rejection
          </label>
          <Textarea
            id="pathway-rejection-reason"
            value={rejectionReason}
            onChange={(event) => commitRejectionReason(event.target.value)}
            placeholder="Describe why this pathway was rejected, e.g. feedstock unavailable, cost too high, regulatory blocker…"
            className="mt-1 min-h-[64px] text-xs"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Saved automatically with this pathway.
          </p>
        </div>
      )}
    </div>
  );
};

export default PathwayStatusCard;
