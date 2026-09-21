import { useEffect, useState } from "react";
import ValidationChecklist from "@/components/pathway/ValidationChecklist";
import {
  VALIDATION_CHANGED_EVENT,
  VALIDATION_FUNCTIONS,
  countConfirmedFunctions,
  readValidationChecklist,
} from "@/lib/pathwayValidationChecklist";

export function PathwayValidationCard({ pathwayId, topic }: { pathwayId: string; topic?: string }) {
  const [confirmedCount, setConfirmedCount] = useState(() =>
    countConfirmedFunctions(readValidationChecklist(topic, pathwayId)),
  );


  useEffect(() => {
    const refresh = () => setConfirmedCount(countConfirmedFunctions(readValidationChecklist(topic, pathwayId)));
    refresh();
    window.addEventListener(VALIDATION_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(VALIDATION_CHANGED_EVENT, refresh);
  }, [topic, pathwayId]);

  const total = VALIDATION_FUNCTIONS.length;
  const percent = Math.round((confirmedCount / total) * 100);

  return (
    <div className="mb-3 overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Status</span>
        <span className="text-[10px] text-muted-foreground">
          {confirmedCount} of {total} functions confirmed · {percent}%
        </span>
      </div>

      <div className="border-t border-border/40 px-3 py-2">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Validation progression"
        >
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="border-t border-border">
        <ValidationChecklist pathwayId={pathwayId} topic={topic} idPrefix="pathway-validation" />
      </div>

    </div>
  );
}

export default PathwayValidationCard;
