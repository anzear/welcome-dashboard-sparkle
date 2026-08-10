import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { DRIVER_QUESTIONS } from "@/config/driverQuestions";
import { useRegister } from "@/components/materialRegister/registerStore";
import { ScoreScale, signed } from "@/components/materialRegister/scorePrimitives";

/** Thin read-only -5..+5 track with a centre tick and one filled marker. */
const ScoreTrack: React.FC<{ value: number | null }> = ({ value }) => {
  const pct = value === null ? null : ((value + 5) / 10) * 100;
  const negative = value !== null && value < 0;
  return (
    <div className="relative h-3 w-full min-w-[72px]">
      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      {value !== null && value !== 0 && (
        <div
          className={cn(
            "absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full",
            negative ? "bg-orange-600/70" : "bg-teal-600/70",
          )}
          style={
            negative
              ? { right: "50%", width: `${50 - pct!}%` }
              : { left: "50%", width: `${pct! - 50}%` }
          }
        />
      )}
      <div className="absolute left-1/2 top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 bg-border" />
      {value !== null && (
        <div
          className={cn(
            "absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full",
            value === 0
              ? "bg-muted-foreground/60"
              : negative
                ? "bg-orange-600"
                : "bg-teal-600",
          )}
          style={{ left: `${pct}%` }}
        />
      )}
    </div>
  );
};

/**
 * Section 3 of the brief. Judgement, kept in its own tint and its own type —
 * one compact row per question at rest, expanding to the 11-point control on click.
 */
const BriefDriverScores: React.FC<{ materialId: string }> = ({ materialId }) => {
  const { scoreFor, setScore, countsFor } = useRegister();
  const counts = countsFor(materialId);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">
        {counts.scored_count === null ? (
          "No judgements recorded yet — nothing here is zero."
        ) : (
          <>
            <span className="font-mono tabular-nums text-foreground">{counts.strong_drivers}</span> strong{" "}
            {counts.strong_drivers === 1 ? "driver" : "drivers"},{" "}
            <span className="font-mono tabular-nums text-foreground">{counts.strong_constraints}</span> strong{" "}
            {counts.strong_constraints === 1 ? "constraint" : "constraints"},{" "}
            <span className="font-mono tabular-nums text-foreground">{counts.scored_count}</span> of{" "}
            <span className="font-mono tabular-nums">{DRIVER_QUESTIONS.length}</span> scored
          </>
        )}
      </p>

      <div className="divide-y divide-primary/10">
        {DRIVER_QUESTIONS.map((q) => {
          const rec = scoreFor(materialId, q.id);
          const v = rec?.score ?? null;
          const expanded = openId === q.id;
          return (
            <div key={q.id} className="py-1.5">
              <button
                type="button"
                onClick={() => setOpenId(expanded ? null : q.id)}
                className="grid w-full grid-cols-[1fr_auto_2.25rem] items-center gap-2 rounded-sm px-1 text-left hover:bg-primary/5"
                title={q.helper}
              >
                <span className="text-[11px] leading-snug text-foreground">{q.label}</span>
                <span className="w-24 sm:w-28">
                  <ScoreTrack value={v} />
                </span>
                <span
                  className={cn(
                    "text-right font-mono text-[11px] tabular-nums",
                    v === null ? "text-muted-foreground/50" : "text-foreground",
                  )}
                >
                  {v === null ? "—" : signed(v)}
                </span>
              </button>

              {v === null && !expanded && (
                <p className="px-1 pt-0.5 text-[10px] text-muted-foreground/70">Not scored</p>
              )}

              {expanded && (
                <div className="px-1 pt-1.5">
                  <ScoreScale
                    value={v}
                    size="sm"
                    ariaLabel={`${q.label} score`}
                    onChange={(next) => {
                      setScore(materialId, q.id, next, rec?.note ?? null);
                      setOpenId(null);
                    }}
                  />
                </div>
              )}

              {rec?.note && <p className="px-1 pt-0.5 text-[10px] italic text-muted-foreground">{rec.note}</p>}
              {rec && v !== null && (
                <p className="px-1 text-[10px] text-muted-foreground/70">
                  scored by {rec.scored_by} on {rec.scored_at.slice(0, 10)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BriefDriverScores;
