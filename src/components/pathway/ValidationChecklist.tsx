import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VALIDATION_CHANGED_EVENT,
  VALIDATION_CURRENT_USER,
  VALIDATION_FUNCTIONS,
  functionStatus,
  readValidationChecklist,
  setFunctionStatus,
  statusesFor,
  validationStatusClass,
  writeValidationChecklist,
  type ValidationChecklist as Checklist,
  type ValidationFunction,
  type ValidationStatus,
} from "@/lib/pathwayValidationChecklist";

/**
 * Jira-style function statuses. One component, used by both the Pathway Profile
 * Validation card and the Workspace Status card — they share the same store, so
 * a change on either surface shows on the other.
 */
export function ValidationChecklist({
  pathwayId,
  topic,
  idPrefix = "validation",
}: {
  pathwayId: string | number;
  topic?: string;
  idPrefix?: string;
}) {
  const [checklist, setChecklist] = useState<Checklist>(() => readValidationChecklist(topic, pathwayId));

  useEffect(() => {
    const refresh = () => setChecklist(readValidationChecklist(topic, pathwayId));
    refresh();
    window.addEventListener(VALIDATION_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(VALIDATION_CHANGED_EVENT, refresh);
  }, [topic, pathwayId]);

  const update = (fn: ValidationFunction, status: ValidationStatus) => {
    const next = setFunctionStatus(checklist, fn, status, VALIDATION_CURRENT_USER);
    setChecklist(next);
    writeValidationChecklist(topic, pathwayId, next);
  };

  return (
    <div className="divide-y divide-border/40">
      {VALIDATION_FUNCTIONS.map((fn) => {
        const status = functionStatus(checklist, fn);
        const state = checklist[fn];
        const id = `${idPrefix}-${pathwayId}-${fn}`.replace(/[^a-zA-Z0-9-]/g, "-");
        return (
          <div key={fn} className="flex h-10 items-center gap-3 px-3">
            <span className="w-28 shrink-0 text-[11px] font-semibold text-foreground">{fn}</span>

            <Select value={status} onValueChange={(value) => update(fn, value as ValidationStatus)}>
              <SelectTrigger
                id={id}
                aria-label={`${fn} status`}
                className={`h-6 w-[160px] shrink-0 rounded-full border px-2.5 text-[10px] font-medium ${validationStatusClass(fn, status)}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusesFor(fn).map((option) => (
                  <SelectItem key={option} value={option} className="text-[11px]">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {state ? (
              <span className="truncate text-[10px] text-muted-foreground">
                {state.by} · {state.date}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">Not set</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ValidationChecklist;
