import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  EVENT_FIELD_LABEL,
  JOURNEY_STATUS_LABEL,
  type JourneyStatus,
  type MaterialEvent,
} from "@/types/materialPrioritisation";
import { useRegister } from "@/components/materialRegister/registerStore";
import { DRIVER_QUESTION_LABEL } from "@/config/driverQuestions";

const statusLabel = (v: string | null) =>
  v && v in JOURNEY_STATUS_LABEL ? JOURNEY_STATUS_LABEL[v as JourneyStatus] : (v ?? "—");

const fieldLabel = (f: string) => EVENT_FIELD_LABEL[f] ?? DRIVER_QUESTION_LABEL[f] ?? f;

const signedValue = (v: string | null) => {
  if (v === null || v === "") return "no score";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return n > 0 ? `+${n}` : String(n);
};

/** One plain sentence per event. No counts, no aggregates, no per-person metrics. */
export function eventSentence(e: MaterialEvent): string {
  switch (e.event_type) {
    case "status_change":
      return e.from_value === null
        ? `Status recorded as ${statusLabel(e.to_value)}`
        : `Status changed from ${statusLabel(e.from_value)} to ${statusLabel(e.to_value)}`;
    case "owner_change":
      return `Owner changed from ${e.from_value ?? "Unassigned"} to ${e.to_value ?? "Unassigned"}`;
    case "priority_change":
      return e.to_value
        ? `Selected as priority for ${e.to_value}`
        : "Removed from priority";
    case "blocker_set":
      return `Blocker recorded on ${statusLabel(e.from_value) !== "—" ? "status change" : "this material"}`;
    case "score_change":
      return e.from_value === null
        ? `${fieldLabel(e.field)} scored ${signedValue(e.to_value)}`
        : `${fieldLabel(e.field)} changed from ${signedValue(e.from_value)} to ${signedValue(e.to_value)}`;
    case "tags_change":
      return `Tags changed from ${e.from_value ?? "none"} to ${e.to_value ?? "none"}`;
    case "field_correction":
      if (e.field === "material_added") return `Material added to the register as ${e.to_value ?? "—"}`;
      if (e.field === "customer_material_ids")
        return `Customer material IDs merged in: ${e.to_value ?? "—"}`;
      return `${fieldLabel(e.field)} corrected from ${e.from_value ?? "no value"} to ${e.to_value ?? "no value"}`;
    default:
      return `${fieldLabel(e.field)} changed`;
  }
}

const dayKey = (iso: string) => iso.slice(0, 10);

const dayLabel = (key: string) => {
  const d = new Date(`${key}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const timeLabel = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const Label: React.FC<{ children: React.ReactNode; tone?: "muted" | "bulk" }> = ({ children, tone = "muted" }) => (
  <span
    className={cn(
      "ml-1 inline-flex items-center rounded-sm border px-1 py-[1px] text-[9px] uppercase tracking-widest",
      tone === "bulk"
        ? "border-primary/30 bg-primary/5 text-primary/80"
        : "border-border bg-muted/60 text-muted-foreground",
    )}
  >
    {children}
  </span>
);

export const MaterialHistory: React.FC<{ materialId: string }> = ({ materialId }) => {
  const { eventsFor } = useRegister();
  const [showBaselining, setShowBaselining] = useState(false);

  const all = useMemo(() => eventsFor(materialId), [eventsFor, materialId]);
  const baseliningCount = all.filter((e) => e.batch_origin === "baselining").length;
  const shown = showBaselining ? all : all.filter((e) => e.batch_origin !== "baselining");

  const groups = useMemo(() => {
    const out: { key: string; events: MaterialEvent[] }[] = [];
    shown.forEach((e) => {
      const k = dayKey(e.changed_at);
      const last = out[out.length - 1];
      if (last && last.key === k) last.events.push(e);
      else out.push({ key: k, events: [e] });
    });
    return out;
  }, [shown]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            checked={showBaselining}
            onChange={(e) => setShowBaselining(e.target.checked)}
            className="h-3 w-3 accent-[hsl(var(--primary))]"
          />
          Show baselining events
        </label>
        {!showBaselining && baseliningCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            <span className="font-mono tabular-nums">{baseliningCount}</span> baselining event
            {baseliningCount === 1 ? "" : "s"} hidden
          </span>
        )}
      </div>

      {all.length === 0 && <p className="text-[11px] text-muted-foreground">No recorded changes yet.</p>}

      {all.length > 0 && shown.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          Nothing but the baselined starting position. No decisions recorded since the file was loaded.
        </p>
      )}

      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.key}>
            <div className="sticky top-0 bg-background/90 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
              {dayLabel(g.key)}
            </div>
            <ul className="space-y-1.5">
              {g.events.map((e) => {
                const baselined = e.batch_origin === "baselining";
                return (
                  <li
                    key={e.event_id}
                    className={cn(
                      "border-l-2 pl-2",
                      baselined ? "border-border text-muted-foreground/70" : "border-primary/30",
                    )}
                    title={timeLabel(e.changed_at)}
                  >
                    <div className="text-[11px] leading-snug">
                      <span className={baselined ? undefined : "text-foreground"}>{eventSentence(e)}</span>
                      <span className="text-muted-foreground"> by {e.changed_by}</span>
                      {baselined && <Label>Baselined</Label>}
                      {e.batch_id && !baselined && <Label tone="bulk">Bulk change</Label>}
                    </div>

                    {e.blocker_category && (
                      <div className="pt-0.5">
                        <div className="text-[11px] font-medium text-amber-700">{e.blocker_category}</div>
                        {e.blocker_detail && (
                          <div className="text-[10px] text-muted-foreground">{e.blocker_detail}</div>
                        )}
                        {e.blocker_condition && (
                          <div className="text-[10px] text-muted-foreground">
                            Would need: {e.blocker_condition}
                          </div>
                        )}
                      </div>
                    )}

                    {e.reason && <div className="pt-0.5 text-[10px] italic text-muted-foreground">{e.reason}</div>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaterialHistory;
