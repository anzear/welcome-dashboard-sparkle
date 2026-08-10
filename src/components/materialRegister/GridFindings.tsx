import React, { useMemo } from "react";
import { useRegister, type Measure, type RankedRow } from "@/components/materialRegister/registerStore";
import { BriefLink, Expandable, fmtMeasureCompact, ordinal } from "@/components/materialRegister/gridPrimitives";
import { MEASURES } from "@/components/materialRegister/registerStore";

const Card: React.FC<{ title: string; lead: React.ReactNode; children?: React.ReactNode }> = ({
  title,
  lead,
  children,
}) => (
  <div className="rounded-md border border-border bg-card p-2.5">
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
    <p className="mt-1 text-[11px] leading-snug text-foreground">{lead}</p>
    {children && <div className="mt-1.5 space-y-1">{children}</div>}
  </div>
);

/** Three plain-language findings. Counts and sentences only — no scores, no ranking. */
const GridFindings: React.FC<{ rows: RankedRow[]; measure: Measure }> = ({ rows, measure }) => {
  const { rankTables } = useRegister();

  const stalled = useMemo(() => {
    const ranked = rows.filter((r) => r.rank !== null);
    const cut = Math.ceil(ranked.length / 3);
    return ranked
      .filter((r) => (r.rank as number) <= cut && r.m.journey_status === "not_started" && !r.m.owner)
      .sort((a, b) => (a.rank as number) - (b.rank as number));
  }, [rows]);

  const divergent = useMemo(() => rows.filter((r) => r.gapMeasure !== null), [rows]);

  const concentrated = useMemo(() => {
    const byClass = new Map<string, RankedRow[]>();
    rows.forEach((r) => {
      const key = r.m.material_class ?? "Unclassified";
      byClass.set(key, [...(byClass.get(key) ?? []), r]);
    });
    return [...byClass.entries()]
      .filter(([, group]) => group.length >= 3)
      .map(([cls, group]) => {
        const withFigure = group.filter((r) => measure.value(r.m) !== null);
        const combined = withFigure.reduce((sum, r) => sum + (measure.value(r.m) as number), 0);
        return { cls, group, withFigure, combined };
      })
      .sort((a, b) => b.combined - a.combined);
  }, [rows, measure]);

  const example = divergent[0];
  const exampleSentence = (() => {
    if (!example || !example.gapMeasure || example.rank === null) return null;
    const other = MEASURES.find((mm) => mm.id === example.gapMeasure)!;
    const otherRank = example.ranks[other.id] as number;
    const a = { r: example.rank, noun: measure.noun };
    const b = { r: otherRank, noun: other.noun };
    const first = b.r < a.r ? b : a;
    const second = b.r < a.r ? a : b;
    return `${example.m.name}: ${first.r}${ordinal(first.r)} on ${first.noun}, ${second.r}${ordinal(second.r)} on ${second.noun}.`;
  })();

  return (
    <div className="grid gap-2 md:grid-cols-3">
      <Card
        title="High exposure, nothing happening"
        lead={
          <>
            <span className="font-mono tabular-nums">{stalled.length}</span> materials sit in the top third on{" "}
            {measure.noun}, are not started and have no owner.
          </>
        }
      >
        {stalled.length > 0 && (
          <Expandable
            count={stalled.length}
            summary={`Top third of ${rankTables[measure.id].rankedCount} ranked on ${measure.noun}`}
          >
            {stalled.map((r) => (
              <div key={r.m.material_id} className="flex items-baseline justify-between gap-2">
                <BriefLink m={r.m} />
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {r.rank}
                  {ordinal(r.rank as number)}
                </span>
              </div>
            ))}
          </Expandable>
        )}
      </Card>

      <Card
        title="Ranks differently depending on the measure"
        lead={
          <>
            <span className="font-mono tabular-nums">{divergent.length}</span> materials carry a rank gap wide enough
            to change the argument.
          </>
        }
      >
        {exampleSentence && <p className="text-[10px] text-muted-foreground">{exampleSentence}</p>}
        {divergent.length > 0 && (
          <Expandable count={divergent.length} summary="Materials with a divergent rank">
            {divergent.map((r) => (
              <BriefLink key={r.m.material_id} m={r.m} />
            ))}
          </Expandable>
        )}
      </Card>

      <Card
        title="Concentrated exposure"
        lead={
          concentrated.length === 0 ? (
            <>No material class holds three or more materials in this scope.</>
          ) : (
            <>
              {concentrated[0].group.length} {concentrated[0].cls.toLowerCase()},{" "}
              {fmtMeasureCompact(concentrated[0].combined, measure)} combined — one exposure, not{" "}
              {concentrated[0].group.length}.
            </>
          )
        }
      >
        {concentrated.map((c) => (
          <Expandable
            key={c.cls}
            count={c.group.length}
            summary={
              <>
                {c.cls} · {fmtMeasureCompact(c.combined, measure)} ·{" "}
                <span className="font-mono tabular-nums">{c.withFigure.length}</span> of{" "}
                <span className="font-mono tabular-nums">{c.group.length}</span> have a figure
              </>
            }
          >
            {c.group.map((r) => (
              <div key={r.m.material_id} className="flex items-baseline justify-between gap-2">
                <BriefLink m={r.m} />
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {measure.value(r.m) === null ? "—" : fmtMeasureCompact(measure.value(r.m) as number, measure)}
                </span>
              </div>
            ))}
          </Expandable>
        ))}
      </Card>
    </div>
  );
};

export default GridFindings;
