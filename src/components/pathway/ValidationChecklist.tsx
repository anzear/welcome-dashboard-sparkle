import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FUNCTION_SUBITEMS,
  VALIDATION_CHANGED_EVENT,
  VALIDATION_CURRENT_USER,
  VALIDATION_FUNCTIONS,
  functionConfirmation,
  readValidationChecklist,
  subItemsDone,
  toggleSubItem,
  writeValidationChecklist,
  type ValidationChecklist as Checklist,
  type ValidationFunction,
} from "@/lib/pathwayValidationChecklist";

/**
 * The function checklist. One component, used by both the Pathway Profile
 * Validation card and the Workspace Status card — they share the same store, so
 * a tick on either surface shows on the other.
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

  const toggle = (fn: ValidationFunction, subItem: string, checked: boolean) => {
    const next = toggleSubItem(checklist, fn, subItem, checked, VALIDATION_CURRENT_USER);
    setChecklist(next);
    writeValidationChecklist(topic, pathwayId, next);
  };

  return (
    <div className="divide-y divide-border/40">
      {VALIDATION_FUNCTIONS.map((fn) => {
        const confirmation = functionConfirmation(checklist, fn);
        const done = subItemsDone(checklist, fn);
        return (
          <div key={fn} className="py-1.5">
            <div className="flex flex-wrap items-baseline gap-2 px-3">
              <span className="text-[11px] font-semibold text-foreground">{fn}</span>
              {confirmation ? (
                <span className="text-[10px] text-foreground/70">
                  Confirmed by {confirmation.by} · {confirmation.date}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  {done} of {FUNCTION_SUBITEMS[fn].length} done
                </span>
              )}
            </div>

            <div className="mt-0.5">
              {FUNCTION_SUBITEMS[fn].map((sub) => {
                const stamp = checklist[fn]?.[sub];
                const id = `${idPrefix}-${pathwayId}-${fn}-${sub}`.replace(/\s+/g, "-");
                return (
                  <div key={sub} className="flex h-8 items-center gap-2.5 pl-8 pr-3">
                    <Checkbox
                      className="h-3.5 w-3.5"
                      id={id}
                      checked={!!stamp}
                      onCheckedChange={(value) => toggle(fn, sub, value === true)}
                    />
                    <label htmlFor={id} className="cursor-pointer text-[11px] text-foreground">
                      {sub}
                    </label>
                    {stamp ? (
                      <span className="text-[10px] text-foreground/70">
                        {stamp.by} · {stamp.date}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Not confirmed</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ValidationChecklist;
