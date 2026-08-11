import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { Material } from "@/types/materialPrioritisation";
import { useRegister } from "@/components/materialRegister/registerStore";
import { ScoreScale } from "@/components/materialRegister/scorePrimitives";
import type { AxisVar } from "@/components/materialRegister/gridAxes";

export interface UnplottedGroup {
  /** The axis whose value is missing. */
  axis: AxisVar;
  cause: string;
  materials: Material[];
}

/** Number entry for one missing figure. Saving writes the field and its event. */
const FigureInput: React.FC<{ m: Material; axis: AxisVar; onSaved: (id: string) => void }> = ({
  m,
  axis,
  onSaved,
}) => {
  const { updateMaterial } = useRegister();
  const [value, setValue] = useState("");
  const field = axis.field as keyof Material;

  const save = () => {
    const n = Number(value);
    if (value.trim() === "" || !Number.isFinite(n)) return;
    updateMaterial(
      m.material_id,
      { [field]: n } as Partial<Material>,
      [field as string],
      [
        {
          material_id: m.material_id,
          event_type: "field_correction",
          field: field as string,
          from_value: null,
          to_value: String(n),
        },
      ],
    );
    onSaved(m.material_id);
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
        }}
        inputMode="decimal"
        placeholder="—"
        aria-label={`${axis.label} for ${m.name}`}
        className="h-7 w-28 rounded-sm border border-border bg-background px-1.5 text-right font-mono text-[11px] tabular-nums"
      />
      <span className="text-[10px] text-muted-foreground">{axis.unit}</span>
      <button
        type="button"
        onClick={save}
        className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] font-medium hover:bg-muted"
      >
        Save
      </button>
    </span>
  );
};

/**
 * Every material the current axes cannot place, grouped by what is missing, with
 * the missing item editable in place. A gap is a task, never an error.
 */
const UnplottedList: React.FC<{
  groups: UnplottedGroup[];
  total: number;
  onSaved: (id: string) => void;
}> = ({ groups, total, onSaved }) => {
  const { setScore, openBrief } = useRegister();

  return (
    <section className="rounded-md border border-border bg-card">
      <header className="flex flex-wrap items-baseline gap-x-3 border-b border-border px-3 py-2">
        <h2 className="text-[13px] font-semibold text-foreground">
          <span className="font-mono tabular-nums">{total}</span> not plotted
        </h2>
        <p className="text-[11px] text-muted-foreground">Add what you have. Nothing here is an error.</p>
      </header>

      {total === 0 ? (
        <p className="px-3 py-3 text-[11px] text-muted-foreground">
          Everything in scope has a value on both axes.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {groups.map((g) => (
            <div key={g.axis.id} className="px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <span className="font-mono tabular-nums">{g.materials.length}</span> {g.cause}
              </p>
              <ul className="mt-1.5 divide-y divide-border/60">
                {g.materials.map((m) => (
                  <li
                    key={m.material_id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => openBrief(m.material_id)}
                      className="w-56 shrink-0 text-left text-[11px] font-medium text-foreground hover:text-primary"
                    >
                      {m.name}
                    </button>
                    <span className="w-40 shrink-0 text-[10px] text-muted-foreground">
                      {m.material_class ?? "Unclassified"}
                    </span>
                    {g.axis.questionId ? (
                      <ScoreScale
                        size="sm"
                        value={null}
                        ariaLabel={`${g.axis.label} for ${m.name}`}
                        onChange={(v) => {
                          setScore(m.material_id, g.axis.questionId as string, v, null);
                          onSaved(m.material_id);
                        }}
                      />
                    ) : g.axis.field ? (
                      <FigureInput m={m} axis={g.axis} onSaved={onSaved} />
                    ) : (
                      <button
                        type="button"
                        onClick={() => openBrief(m.material_id)}
                        className={cn(
                          "text-[11px] text-muted-foreground underline decoration-dotted",
                          "underline-offset-2 hover:text-foreground",
                        )}
                      >
                        Add {g.axis.noun} on the brief
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default UnplottedList;
