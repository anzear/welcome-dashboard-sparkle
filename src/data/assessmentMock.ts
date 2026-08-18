import { CONTRIBUTORS, JUDGED_CRITERIA, assessmentKey } from "@/config/assessmentCriteria";
import { seedMaterialsWithHistory } from "@/data/materialEventsMock";
import type { AssessmentEntry } from "@/types/materialPrioritisation";

/** Deterministic PRNG so the seeded assessment set is stable between reloads. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Where each criterion tends to sit before material-specific variation. */
const TENDENCY: Record<string, number> = {
  technical_feasibility: 3,
  commercial_viability: 3,
  strategic_fit: 4,
};

const clamp = (v: number) => Math.min(5, Math.max(1, Math.round(v)));

/**
 * Seeds a realistic multi-contributor picture: some criteria carry several
 * aligned entries, some are split across teams, and plenty carry nothing at all.
 * Absence is left absent — never written as a score.
 */
export const seedAssessments: Record<string, AssessmentEntry> = (() => {
  const out: Record<string, AssessmentEntry> = {};
  const r = rng(90210);

  seedMaterialsWithHistory.forEach((m, mi) => {
    /** Roughly a quarter of the register has no assessment at all. */
    if (r() < 0.24) return;

    JUDGED_CRITERIA.forEach((c, ci) => {
      /** Not every criterion gets looked at on every material. */
      if (r() < 0.22) return;

      const contributorCount = r() < 0.34 ? 1 : r() < 0.8 ? 2 : 3;
      const start = Math.floor(r() * CONTRIBUTORS.length);
      const base = TENDENCY[c.criterion_id] ?? 3;
      /** Materials early in the register skew a little more favourable. */
      const tilt = mi < 12 ? 0.7 : mi < 26 ? 0 : -0.6;
      /** Some criteria genuinely divide the room. */
      const contested = r() < 0.28;

      for (let k = 0; k < contributorCount; k += 1) {
        const person = CONTRIBUTORS[(start + k) % CONTRIBUTORS.length];
        const swing = contested ? (k % 2 === 0 ? 1.8 : -1.8) : (r() - 0.5) * 1.4;
        const score = clamp(base + tilt + swing);
        const day = 4 + Math.floor(r() * 24);
        out[assessmentKey(m.material_id, c.criterion_id, person.user_id)] = {
          material_id: m.material_id,
          criterion_id: c.criterion_id,
          user_id: person.user_id,
          team: person.team,
          score,
          note:
            r() < 0.18
              ? ["Based on the 2025 trial batch.", "Supplier quote still pending.", "Needs a claims review."][
                  Math.floor(r() * 3)
                ]
              : null,
          assessed_at: `2026-0${1 + ((mi + ci) % 6)}-${String(day).padStart(2, "0")}T09:${String(
            10 + ((mi * 7 + k * 13) % 45),
          ).padStart(2, "0")}:00Z`,
        };
      }
    });
  });

  return out;
})();
