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

const MARKET = "market_pull";
const FUTURE = "strategic_importance";
const RISK = "risk_of_inaction";

/** Where each criterion tends to sit before material-specific variation. */
const TENDENCY: Record<string, number> = {
  [MARKET]: 3,
  [FUTURE]: 3,
  [RISK]: 4,
};

/**
 * Rationales are written per criterion, in the voice of the team recording them.
 * A 1–5 score is never seeded without one — that rule holds for mock data too.
 */
const RATIONALES: Record<string, { low: string[]; high: string[] }> = {
  [MARKET]: {
    low: [
      "Claim potential is thin. Nobody reads this one on pack.",
      "Functional ingredient, invisible to the shopper. No story to tell.",
      "Marketing has never once been asked about this ingredient.",
    ],
    high: [
      "A renewable version gives us the pack claim Persil has been asking for.",
      "Retail buyers keep asking what this is derived from. Answering it well sells.",
      "Clear differentiator — no competitor in the category has made this switch yet.",
    ],
  },
  [FUTURE]: {
    low: [
      "Buys three years at best, then we sit in this same meeting again.",
      "The only routes we know push the same problem downstream.",
      "No credible feedstock path that survives the next cost review.",
    ],
    high: [
      "Palm-derived. Cost curve goes the wrong way after 2028.",
      "Gets us ahead of the restriction that is clearly coming for this class.",
      "Cuts a real chunk of the Scope 3 line we have committed to.",
    ],
  },
  [RISK]: {
    low: [
      "Incumbent is stable. Three qualified suppliers, no regulatory pressure on it.",
      "Nothing is pushing us off this one. Prices have been flat for years.",
    ],
    high: [
      "Two of three suppliers in one region. One weather event takes us out.",
      "Single qualified source and it is already on a watch list.",
      "Sitting on a substance under review. Standing still is the exposure.",
    ],
  },
};

/**
 * Only the three carried-over criteria are seeded. Economic case and Supply
 * security are new: they start with no entries anywhere.
 */
const CARRIED_CRITERIA = JUDGED_CRITERIA.filter((c) =>
  [MARKET, FUTURE, RISK].includes(c.criterion_id),
);

const clamp = (v: number) => Math.min(5, Math.max(1, Math.round(v)));

const pick = <T,>(list: T[], r: () => number) => list[Math.floor(r() * list.length)]!;

const rationaleFor = (criterionId: string, score: number, r: () => number) =>
  pick(RATIONALES[criterionId]![score >= 4 ? "high" : score <= 2 ? "low" : r() < 0.5 ? "high" : "low"], r);

const at = (mi: number, ci: number, k: number, day: number) =>
  `2026-0${1 + ((mi + ci) % 6)}-${String(day).padStart(2, "0")}T09:${String(
    10 + ((mi * 7 + k * 13) % 45),
  ).padStart(2, "0")}:00Z`;

/**
 * Seeds a realistic multi-contributor picture: some criteria carry several
 * aligned entries, some are split across teams, plenty carry nothing at all, and
 * one criterion is answered Neutral by everyone. Absence is left absent — never
 * written as a score, and Neutral is not a score either.
 */
export const seedAssessments: Record<string, AssessmentEntry> = (() => {
  const out: Record<string, AssessmentEntry> = {};
  const r = rng(90210);

  const put = (
    materialId: string,
    criterionId: string,
    userIndex: number,
    score: number | null,
    note: string | null,
    stamp: string,
  ) => {
    const person = CONTRIBUTORS[userIndex % CONTRIBUTORS.length]!;
    out[assessmentKey(materialId, criterionId, person.user_id)] = {
      material_id: materialId,
      criterion_id: criterionId,
      user_id: person.user_id,
      team: person.team,
      score,
      note,
      assessed_at: stamp,
    };
  };

  seedMaterialsWithHistory.forEach((m, mi) => {
    /** Roughly a quarter of the register has no assessment at all. */
    if (r() < 0.24) return;

    CARRIED_CRITERIA.forEach((c, ci) => {
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
        const person = CONTRIBUTORS[(start + k) % CONTRIBUTORS.length]!;
        const swing = contested ? (k % 2 === 0 ? 1.8 : -1.8) : (r() - 0.5) * 1.4;
        const score = clamp(base + tilt + swing);
        /**
         * Procurement legitimately has no visibility on market and claim value.
         * That is Neutral, not a low score.
         */
        const neutral = c.criterion_id === MARKET && person.team === "procurement" && r() < 0.55;
        put(
          m.material_id,
          c.criterion_id,
          (start + k) % CONTRIBUTORS.length,
          neutral ? null : score,
          neutral ? (r() < 0.5 ? "No visibility on the consumer side from here." : null) : rationaleFor(c.criterion_id, score, r),
          at(mi, ci, k, 4 + Math.floor(r() * 24)),
        );
      }
    });
  });

  /* ------------------------------------------------------- deliberate patterns
   * Two materials read as clearly aligned, two as clearly split (one of them on
   * Risk of inaction), and one criterion is Neutral from everyone.
   * -------------------------------------------------------------------------- */

  const ids = seedMaterialsWithHistory.map((m) => m.material_id);
  const [a1, a2, d1, d2, n1] = [ids[1], ids[4], ids[7], ids[10], ids[13]];

  if (a1) {
    put(a1, FUTURE, 0, 4, "Palm-derived. Cost curve goes the wrong way after 2028.", at(1, 1, 0, 12));
    put(a1, FUTURE, 2, 4, "Two credible renewable routes already at pilot scale.", at(1, 1, 1, 13));
    put(a1, FUTURE, 3, 5, "Biggest single Scope 3 line we can actually move this year.", at(1, 1, 2, 14));
  }
  if (a2) {
    put(a2, RISK, 1, 5, "Two of three suppliers in one region. One weather event takes us out.", at(4, 2, 0, 9));
    put(a2, RISK, 5, 5, "Substance is already under review. Standing still is the exposure.", at(4, 2, 1, 10));
    put(a2, RISK, 3, 4, "Reputational exposure if a campaign group picks this up first.", at(4, 2, 2, 11));
  }
  if (d1) {
    put(d1, MARKET, 4, 5, "A renewable version gives us the pack claim Perwoll has been asking for.", at(7, 0, 0, 6));
    put(d1, MARKET, 2, 2, "Trial panels did not notice any difference worth claiming.", at(7, 0, 1, 7));
    put(d1, MARKET, 1, 1, "Claim potential is thin. Nobody reads this one on pack.", at(7, 0, 2, 8));
  }
  if (d2) {
    put(d2, RISK, 0, 5, "Single qualified source, twelve-week lead time and no second option.", at(10, 2, 0, 16));
    put(d2, RISK, 5, 4, "Regulatory exposure today, not hypothetical — dossier is open.", at(10, 2, 1, 17));
    put(d2, RISK, 3, 1, "Incumbent is stable. Prices flat, nothing pushing us off it.", at(10, 2, 2, 18));
  }
  if (n1) {
    /** All-neutral criterion: nobody in the room holds this view. Not a score. */
    put(n1, MARKET, 0, null, "No visibility on the consumer side from here.", at(13, 0, 0, 5));
    put(n1, MARKET, 1, null, null, at(13, 0, 1, 6));
    put(n1, MARKET, 2, null, "R&D cannot judge what a claim is worth on shelf.", at(13, 0, 2, 7));
  }

  return out;
})();
