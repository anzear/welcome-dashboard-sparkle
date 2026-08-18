import React, { useMemo, useState } from "react";

import type { Material } from "@/types/materialPrioritisation";
import { useRegister } from "@/components/materialRegister/registerStore";
import type { AxisVar } from "@/components/materialRegister/gridAxes";

/** One material, one entry. The entry states every gap the material has. */
export interface UnplottedEntry {
  m: Material;
  /** Axes with no value for this material. One or two. */
  gaps: AxisVar[];
  /** Value on the axis it does have, used to put highest exposure first. */
  sortValue: number | null;
}

const FIRST_PAGE = 12;

/** Number entry for one missing figure. Enter or blur commits; blank commits nothing. */
const FigureInput: React.FC<{
  m: Material;
  axis: AxisVar;
  onCommitted: () => void;
}> = ({ m, axis, onCommitted }) => {
  const { updateMaterial } = useRegister();
  const [value, setValue] = useState("");
  const field = axis.field as keyof Material;

  const commit = () => {
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
    onCommitted();
  };

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
      }}
      onBlur={commit}
      inputMode="decimal"
      placeholder="—"
      aria-label={`${axis.label} (${axis.unit}) for ${m.name}`}
      className="h-7 w-[90px] shrink-0 rounded-sm border border-border bg-background px-1.5 text-right font-mono text-[11px] tabular-nums"
    />
  );
};

/** One row: the material and every value it is missing, editable in place. */
const GapRow: React.FC<{ entry: UnplottedEntry; onSaved: (id: string) => void }> = ({
  entry,
  onSaved,
}) => {
  const [saved, setSaved] = useState(false);
  const { m, gaps } = entry;

  const confirm = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
    onSaved(m.material_id);
  };

  return (
    <li className="grid grid-cols-1 gap-x-6 gap-y-2 px-4 py-3 transition-colors hover:bg-muted/40 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium text-foreground" title={m.name}>
          {m.name}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">
          {m.material_class ?? "Unclassified"}
          {saved && <span className="ml-2 text-foreground">Saved</span>}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {gaps.map((axis) => (
          <div key={axis.id} className="flex items-center justify-end gap-3">
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {axis.label}
              {axis.kind === "measured" ? ` (${axis.unit})` : ""}
            </label>
            {axis.field ? (
              <FigureInput m={m} axis={axis} onCommitted={confirm} />
            ) : (
              <span className="font-mono text-[11px] text-muted-foreground">—</span>
            )}
          </div>
        ))}
      </div>
    </li>
  );
};


/**
 * Every material the current axes cannot place. One card per material, with each
 * missing value editable where it stands. A gap is a task, never an error.
 */
const UnplottedList: React.FC<{
  entries: UnplottedEntry[];
  /** Materials in scope, for the "all plotted" line. */
  totalMaterials: number;
  onSaved: (id: string) => void;
}> = ({ entries, totalMaterials, onSaved }) => {
  const [showAll, setShowAll] = useState(false);

  const summary = useMemo(() => {
    const perAxis = new Map<string, number>();
    let both = 0;
    entries.forEach((e) => {
      e.gaps.forEach((a) => perAxis.set(a.noun, (perAxis.get(a.noun) ?? 0) + 1));
      if (e.gaps.length > 1) both += 1;
    });
    const parts = [...perAxis.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([noun, n]) => `${n} missing ${noun}`);
    if (both > 0) parts.push(`${both} missing both`);
    return parts.join(", ");
  }, [entries]);

  if (entries.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground">
        All <span className="font-mono tabular-nums">{totalMaterials}</span> materials are plotted.
      </p>
    );
  }

  const visible = showAll ? entries : entries.slice(0, FIRST_PAGE);
  const rest = entries.length - visible.length;

  return (
    <section>
      <header className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="font-mono tabular-nums">{entries.length}</span> materials not plotted
        </h2>
        <p className="text-[10px] text-muted-foreground/70">
          Add what you have. Nothing here is an error.
        </p>
      </header>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {summary}
        <span className="text-muted-foreground/70"> · Highest exposure first.</span>
      </p>

      <ul className="mt-3 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        {visible.map((e) => (
          <GapRow key={e.m.material_id} entry={e} onSaved={onSaved} />
        ))}
      </ul>


      {rest > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-3 text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          Show <span className="font-mono tabular-nums">{rest}</span> more
        </button>
      )}
    </section>
  );
};

export default UnplottedList;
