import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Material } from "@/types/materialPrioritisation";
import { useRegister } from "@/components/materialRegister/registerStore";
import { scoreTone, signed } from "@/components/materialRegister/scorePrimitives";
import { LENS_VARS, type AxisVar } from "@/components/materialRegister/gridAxes";
import { nf } from "@/components/materialRegister/primitives";

/** The four lens columns carried on the right of the reading table. */
const LENS_COLUMNS = ["spend", "emissions", "volume", "applications"];

/**
 * Reading view: every driver score for every material in one table, with the
 * lens figures alongside. Sortable by any column. Editing happens in the
 * scoring matrix — nothing here writes.
 */
const DriverListView: React.FC<{ materials: Material[]; onOpenScoring: () => void }> = ({
  materials,
  onOpenScoring,
}) => {
  const { questions, scoreFor, openBrief } = useRegister();
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });

  const lenses = useMemo(
    () => LENS_COLUMNS.map((id) => LENS_VARS.find((v) => v.id === id) as AxisVar),
    [],
  );

  const valueFor = (m: Material, key: string): number | string | null => {
    if (key === "name") return m.name;
    const lens = lenses.find((l) => l.id === key);
    if (lens)
      return lens.value(m, { strong_drivers: null, strong_constraints: null, scored_count: null }, {
        score: () => null,
      });
    return scoreFor(m.material_id, key)?.score ?? null;
  };

  const rows = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...materials].sort((a, b) => {
      const va = valueFor(a, sort.key);
      const vb = valueFor(b, sort.key);
      if (typeof va === "string" || typeof vb === "string")
        return String(va).localeCompare(String(vb)) * dir;
      // Missing values sort last under either direction: absent is not a low value.
      if (va === null && vb === null) return a.name.localeCompare(b.name);
      if (va === null) return 1;
      if (vb === null) return -1;
      return (va - vb) * dir || a.name.localeCompare(b.name);
    });
  }, [materials, sort, lenses]);

  const toggle = (key: string) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));

  const HEAD = "px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground";
  const arrow = (key: string) => (sort.key === key ? (sort.dir === "asc" ? " ↑" : " ↓") : "");

  return (
    <section className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          A reading view: driver patterns across the portfolio, two at a time not required.
        </p>
        <button
          type="button"
          onClick={onOpenScoring}
          className="text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          Edit scores in the scoring matrix
        </button>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-muted/60">
            <tr>
              <th
                className={cn(HEAD, "sticky left-0 z-20 w-56 border-r border-border bg-muted/60 text-left")}
              >
                <button type="button" onClick={() => toggle("name")}>
                  Material{arrow("name")}
                </button>
              </th>
              {questions.map((q) => (
                <th key={q.question_id} className={cn(HEAD, "text-center")} title={q.label}>
                  <button type="button" onClick={() => toggle(q.question_id)} className="font-mono">
                    {q.short}
                    {arrow(q.question_id)}
                  </button>
                </th>
              ))}
              {lenses.map((l) => (
                <th key={l.id} className={cn(HEAD, "border-l border-border text-right")}>
                  <button type="button" onClick={() => toggle(l.id)}>
                    {l.label}
                    {arrow(l.id)}
                  </button>
                  <div className="text-[9px] font-normal normal-case tracking-normal text-muted-foreground/60">
                    {l.unit}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.material_id} className="border-t border-border/60 hover:bg-muted/30">
                <td className="sticky left-0 z-10 border-r border-border/60 bg-background px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => openBrief(m.material_id)}
                    className="text-left font-medium text-foreground hover:text-primary"
                  >
                    {m.name}
                  </button>
                  <div className="text-[10px] text-muted-foreground">
                    {m.material_class ?? "Unclassified"}
                  </div>
                </td>
                {questions.map((q) => {
                  const s = scoreFor(m.material_id, q.question_id)?.score ?? null;
                  return (
                    <td key={q.question_id} className="px-2 py-1.5 text-center">
                      <span
                        className={cn(
                          "inline-flex h-5 w-7 items-center justify-center rounded-[3px] font-mono tabular-nums",
                          scoreTone(s),
                        )}
                        title={s === null ? "No judgement recorded" : `${q.label} ${signed(s)}`}
                      >
                        {s === null ? "" : signed(s)}
                      </span>
                    </td>
                  );
                })}
                {lenses.map((l) => {
                  const v = l.value(
                    m,
                    { strong_drivers: null, strong_constraints: null, scored_count: null },
                    { score: () => null },
                  );
                  return (
                    <td
                      key={l.id}
                      className="border-l border-border/60 px-2 py-1.5 text-right font-mono tabular-nums"
                    >
                      {v === null ? (
                        <span className="text-muted-foreground/50">—</span>
                      ) : (
                        nf(l.id === "price" || l.id === "ghg_factor" ? 2 : 0).format(v)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default DriverListView;
