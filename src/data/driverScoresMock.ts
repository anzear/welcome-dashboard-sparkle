import { DRIVER_QUESTIONS, scoreKey } from "@/config/driverQuestions";
import { seedMaterialsWithHistory } from "@/data/materialEventsMock";
import type { DriverScore } from "@/types/materialPrioritisation";

/** Deterministic PRNG so the seeded judgement set is stable between reloads. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const SCORERS = ["K. Brandt", "L. Haugen", "M. Oyelaran", "R. Delacroix", "S. Rautio"];

/** Where each question tends to sit before material-specific variation. */
const TENDENCY: Record<string, number> = {
  business_importance: 5,
  regulatory_position: 4,
  market_pull: 5,
  environmental_impact: 5,
  feedstock_availability: 3,
  cost: 2,
  product_performance: 2,
  process_impact: 2,
  internal_readiness: 2,
  timing_pressure: 4,
  competitor_activity: 4,
};

const NOTES: Record<string, string[]> = {
  regulatory_position: ["REACH restriction dossier under review.", "Watch-list entry expected next cycle."],
  cost: ["Bio-based grade quoted at a 40% premium.", "Premium narrowing but still material."],
  market_pull: ["Two key accounts asked for a renewable variant.", "Tender language now references bio-content."],
  internal_readiness: ["No owner assigned in the category team.", "Lab capacity booked out until Q4."],
  product_performance: ["Solvency drops in the current formulation.", "Comparable performance in first screening."],
  feedstock_availability: ["Certified feedstock volume is limited.", "Multiple suppliers offer mass-balance grades."],
};

const clamp = (n: number) => Math.max(1, Math.min(5, Math.round(n)));

function buildSeed(): DriverScore[] {
  const rand = rng(20260810);
  const out: DriverScore[] = [];
  const materials = seedMaterialsWithHistory;

  materials.forEach((m, mi) => {
    // A handful fully scored, several barely started, several with none at all.
    let coverage: number;
    if (mi % 7 === 0 && mi < 42) coverage = 12;
    else if (mi % 5 === 3) coverage = 0;
    else if (mi % 4 === 1) coverage = 3 + Math.floor(rand() * 2);
    else coverage = 7 + Math.floor(rand() * 5);
    if (coverage === 0) return;

    const order = DRIVER_QUESTIONS.map((q) => q.question_id);
    // Stable shuffle of which questions got answered.
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const chosen = new Set(order.slice(0, coverage));
    const scorer = SCORERS[mi % SCORERS.length];
    const monthsBack = Math.floor(rand() * 8);
    const scoredAt = new Date(Date.UTC(2026, 7 - monthsBack, 2 + Math.floor(rand() * 26), 9, 30))
      .toISOString();

    const values: Record<string, number> = {};
    DRIVER_QUESTIONS.forEach((q) => {
      if (!chosen.has(q.question_id)) return;
      values[q.question_id] = clamp(TENDENCY[q.question_id] + (rand() * 4 - 2));
    });


    // Realistic tensions: forced by regulation but not ready; wanted but costly.
    if (values.regulatory_position !== undefined && values.regulatory_position >= 3 && values.internal_readiness !== undefined) {
      values.internal_readiness = clamp(1 + rand() * 1.4);
    }
    if (values.market_pull !== undefined && values.market_pull >= 3 && values.cost !== undefined) {
      values.cost = clamp(1 + rand());
    }
    if (values.environmental_impact !== undefined && values.environmental_impact >= 4 && values.process_impact !== undefined) {
      values.process_impact = clamp(1 + rand() * 1.4);
    }

    Object.entries(values).forEach(([questionId, score]) => {
      const pool = NOTES[questionId];
      const note = pool && rand() < 0.3 ? pool[Math.floor(rand() * pool.length)] : null;
      out.push({
        material_id: m.material_id,
        question_id: questionId,
        score,
        note,
        scored_by: scorer,
        scored_at: scoredAt,
      });
    });
  });

  return out;
}

export const seedDriverScores: Record<string, DriverScore> = Object.fromEntries(
  buildSeed().map((s) => [scoreKey(s.material_id, s.question_id), s]),
);
