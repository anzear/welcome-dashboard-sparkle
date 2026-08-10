import React from "react";
import { cn } from "@/lib/utils";
import { DRIVER_QUESTIONS } from "@/config/driverQuestions";
import { useRegister } from "@/components/materialRegister/registerStore";
import { ScoreScale, signed } from "@/components/materialRegister/scorePrimitives";

/**
 * Section 3 of the brief. Judgement, kept in its own tint and its own type —
 * it never sits beside the measured figures or borrows their typography.
 */
const BriefDriverScores: React.FC<{ materialId: string }> = ({ materialId }) => {
  const { scoreFor, setScore, countsFor } = useRegister();
  const counts = countsFor(materialId);

  return (
    <div className="space-y-1.5">
      <div className="divide-y divide-primary/15 rounded-sm border border-dashed border-primary/30 bg-background/60">
        {DRIVER_QUESTIONS.map((q) => {
          const rec = scoreFor(materialId, q.id);
          const v = rec?.score ?? null;
          return (
            <div key={q.id} className="px-2 py-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-foreground" title={q.helper}>
                  {q.label}
                </span>
                <div className="flex items-center gap-2">
                  <ScoreScale
                    value={v}
                    size="sm"
                    ariaLabel={`${q.label} score`}
                    onChange={(next) => setScore(materialId, q.id, next, rec?.note ?? null)}
                  />
                  <span
                    className={cn(
                      "w-14 text-right text-[10px]",
                      v === null ? "text-muted-foreground/60" : "text-muted-foreground",
                    )}
                  >
                    {v === null ? "Not scored" : signed(v)}
                  </span>
                </div>
              </div>
              {rec?.note && <p className="mt-0.5 text-[10px] italic text-muted-foreground">{rec.note}</p>}
              {rec && v !== null && (
                <p className="text-[9px] text-muted-foreground/70">
                  scored by {rec.scored_by} on {rec.scored_at.slice(0, 10)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {counts.scored_count === null ? (
          "No judgements recorded yet — nothing here is zero."
        ) : (
          <>
            {counts.strong_drivers} strong {counts.strong_drivers === 1 ? "driver" : "drivers"},{" "}
            {counts.strong_constraints} strong{" "}
            {counts.strong_constraints === 1 ? "constraint" : "constraints"}, {counts.scored_count} of 12 scored
          </>
        )}
      </p>
    </div>
  );
};

export default BriefDriverScores;
