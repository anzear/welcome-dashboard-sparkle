import { CONTRIBUTORS, JUDGED_CRITERIA, assessmentKey } from "@/config/assessmentCriteria";
import { seedMaterialsWithHistory } from "@/data/materialEventsMock";
import type { AssessmentEntry, Material, TeamId } from "@/types/materialPrioritisation";

/** Deterministic PRNG so the seeded assessment set is stable between reloads. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const REGULATORY = "regulatory_pressure";
const MARKET = "market_pull";
const ADVANTAGE = "competitive_advantage";
const ECONOMIC = "economic_case";
const SUPPLY = "supply_security";
const SUSTAINABILITY = "sustainability_impact";
const PERFORMANCE = "product_performance";

/**
 * How thoroughly each criterion tends to be looked at, and where it tends to sit
 * before material-specific variation. Coverage differs on purpose: the per-column
 * completion counts must not read as a flat wall.
 */
const CRITERION_PROFILE: Record<string, { coverage: number; base: number; teams: TeamId[] }> = {
  [REGULATORY]: { coverage: 0.88, base: 3.6, teams: ["regulatory", "procurement", "sustainability"] },
  [MARKET]: { coverage: 0.72, base: 3.2, teams: ["marketing", "procurement", "rnd"] },
  [ADVANTAGE]: { coverage: 0.42, base: 3.0, teams: ["marketing", "rnd"] },
  [ECONOMIC]: { coverage: 0.64, base: 2.6, teams: ["procurement", "marketing"] },
  [SUPPLY]: { coverage: 0.76, base: 3.1, teams: ["procurement", "regulatory"] },
  [SUSTAINABILITY]: { coverage: 0.9, base: 3.8, teams: ["sustainability", "rnd", "regulatory"] },
  [PERFORMANCE]: { coverage: 0.46, base: 2.9, teams: ["rnd", "marketing"] },
};

/**
 * Rationale fragments, written in the voice of the function recording them. Each
 * one is completed with the material's own name or class, so no two records read
 * as the same sentence. A 1-5 score is never seeded without one.
 */
type Phrase = (name: string, cls: string) => string;

const RATIONALES: Record<string, { low: Phrase[]; high: Phrase[] }> = {
  [REGULATORY]: {
    low: [
      (n) => `Nothing on the horizon for ${n}. It has never appeared on a watchlist we track.`,
      (_n, c) => `The ${c.toLowerCase()} class is settled in the EU. No dossier open, no consultation running.`,
      (n) => `${n} was reviewed in 2023 and cleared. Switching buys us no regulatory cover.`,
    ],
    high: [
      (n) => `${n} sits in a group flagged in the last SVHC screening. We would rather move first than be told to.`,
      (_n, c) => `A restriction on the ${c.toLowerCase()} family is under consultation and likely to land inside two years.`,
      (n) => `Two customer accounts already exclude ${n} in their own specifications, ahead of any regulation.`,
    ],
  },
  [MARKET]: {
    low: [
      (n) => `${n} is invisible on pack. No shopper has ever asked what it is.`,
      (n) => `Panels could not tell the ${n} variant from the current one. Nothing to say on shelf.`,
      (_n, c) => `A ${c.toLowerCase()} claim tested weakly in the last concept screen.`,
    ],
    high: [
      (n) => `Retail buyers ask about ${n} at every range review. Answering it well wins listings.`,
      (n) => `A renewable ${n} gives the laundry line the pack claim marketing has been asking for.`,
      (n) => `Two tenders this year scored us down specifically on ${n}.`,
    ],
  },
  [ADVANTAGE]: {
    low: [
      (n) => `Three competitors have already switched away from ${n}. We would be catching up, not leading.`,
      (_n, c) => `Any ${c.toLowerCase()} route here is open to everyone. No defensible position in it.`,
    ],
    high: [
      (n) => `Nobody in the category has moved on ${n} yet. First mover holds the claim for a season.`,
      (_n, c) => `The ${c.toLowerCase()} route is tied up in a supply agreement we could take exclusively.`,
      (n) => `Our formulation know-how on ${n} is hard to copy quickly.`,
    ],
  },
  [ECONOMIC]: {
    low: [
      (n) => `The alternative to ${n} lands 30% above it at contract volume. Nothing in the price supports that.`,
      (n) => `Switching ${n} triggers a line change we cannot amortise inside three years.`,
      (_n, c) => `${c} pricing is at a historic low. Any move looks expensive against it today.`,
    ],
    high: [
      (n) => `${n} has drifted up three quarters running. The alternative is now the cheaper of the two.`,
      (n) => `Dosage drops by about a fifth on the ${n} replacement, which more than covers the unit premium.`,
      (_n, c) => `${c} volumes are large enough that even a small unit gain is worth chasing.`,
    ],
  },
  [SUPPLY]: {
    low: [
      (n) => `Only one qualified plant makes ${n} to our spec, and it is in a single region.`,
      (n) => `Lead time on ${n} is twelve weeks with no buffer agreed.`,
      (_n, c) => `The ${c.toLowerCase()} market is thin. Switching would trade one bottleneck for another.`,
    ],
    high: [
      (n) => `Four suppliers can hold the ${n} spec, two of them inside the EU.`,
      (n) => `Moving off ${n} takes us out of the palm kernel price cycle altogether.`,
      (_n, c) => `${c} capacity is being added in Europe through 2027, so the second source gets easier.`,
    ],
  },
  [SUSTAINABILITY]: {
    low: [
      (n) => `The saving on ${n} is inside the uncertainty of the factor itself. Not claimable.`,
      (_n, c) => `A ${c.toLowerCase()} switch moves the burden upstream rather than removing it.`,
      (n) => `${n} volumes are too small for the change to register in the Scope 3 line.`,
    ],
    high: [
      (n) => `Roughly a 45% cut in the factor on ${n}, and the volume is big enough for it to show.`,
      (n) => `${n} is one of the five largest lines in our Scope 3 inventory. Any real cut here counts.`,
      (_n, c) => `The ${c.toLowerCase()} route runs on residue feedstock, so the reduction survives a critical review.`,
    ],
  },
  [PERFORMANCE]: {
    low: [
      (n) => `Viscosity collapsed without ${n} at 20 C. Foam held, the body did not.`,
      (n) => `The ${n} replacement separated at week eight in the stability panel.`,
      (_n, c) => `${c} behaviour is what the whole formulation hangs on. The alternative is not there yet.`,
    ],
    high: [
      (n) => `Straight swap for ${n} at the same loading. Sensory panel could not separate them.`,
      (n) => `Mildness improved measurably against ${n} in the last patch test round.`,
      (_n, c) => `The ${c.toLowerCase()} alternative held the spec across all three pilot runs.`,
    ],
  },
};

const NEUTRAL_NOTES: Record<string, string[]> = {
  [MARKET]: [
    "No visibility on the consumer side from here.",
    "Procurement cannot judge what a claim is worth on shelf.",
  ],
  [PERFORMANCE]: ["Not our call — formulation owns this one."],
  [ADVANTAGE]: ["We do not see competitor formulations from this seat."],
  [SUSTAINABILITY]: ["Waiting on the recalculated factor before taking a position."],
  [REGULATORY]: ["Regulatory affairs has this under review; no position from marketing."],
  [ECONOMIC]: ["No costed offer on the file yet."],
  [SUPPLY]: [],
};

const clamp = (v: number) => Math.min(5, Math.max(1, Math.round(v)));

const pick = <T,>(list: T[], r: () => number) => list[Math.floor(r() * list.length)]!;

const rationaleFor = (criterionId: string, score: number, m: Material, r: () => number) => {
  const pools = RATIONALES[criterionId]!;
  const side = score >= 4 ? pools.high : score <= 2 ? pools.low : r() < 0.5 ? pools.high : pools.low;
  return pick(side, r)(m.name, m.material_class ?? m.tags[0] ?? "material");
};

const at = (mi: number, ci: number, k: number, day: number) =>
  `2026-0${1 + ((mi + ci) % 6)}-${String(day).padStart(2, "0")}T09:${String(
    10 + ((mi * 7 + k * 13) % 45),
  ).padStart(2, "0")}:00Z`;

/**
 * Seeds an uneven picture on purpose. Roughly a quarter of the register carries
 * entries on most criteria, half carry two to four, and a quarter carry none at
 * all. Within that, some cells hold one view, some hold several that agree, and
 * some hold several that plainly do not. Absence stays absent — never written as
 * a score, and Neutral is not a score either.
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

  /** Contributors whose function plausibly holds a view on this criterion. */
  const panelFor = (criterionId: string) => {
    const teams = CRITERION_PROFILE[criterionId]?.teams ?? [];
    const preferred = CONTRIBUTORS.filter((c) => teams.includes(c.team));
    return preferred.length > 0 ? preferred : CONTRIBUTORS;
  };

  seedMaterialsWithHistory.forEach((m, mi) => {
    /** Depth of the record: thorough, partial, or nothing recorded yet. */
    const roll = r();
    const depth = roll < 0.25 ? "most" : roll < 0.75 ? "some" : "none";
    if (depth === "none") return;

    /** A partial record only carries two to four criteria. */
    const budget = depth === "most" ? JUDGED_CRITERIA.length : 2 + Math.floor(r() * 3);
    let used = 0;

    /** Rotate the order so a partial record does not always drop the same tail. */
    const order = JUDGED_CRITERIA.map((c, i) => ({ c, i })).sort(
      (a, b) => ((a.i + mi * 3) % JUDGED_CRITERIA.length) - ((b.i + mi * 3) % JUDGED_CRITERIA.length),
    );

    order.forEach(({ c, i: ci }) => {
      if (used >= budget) return;
      const profile = CRITERION_PROFILE[c.criterion_id] ?? { coverage: 0.5, base: 3, teams: [] };
      const threshold = depth === "most" ? Math.min(1, profile.coverage * 1.3) : profile.coverage * 0.8;
      if (r() > threshold) return;
      used += 1;

      /** One view, several that agree, or several that do not. */
      const shape = r() < 0.32 ? "single" : r() < 0.62 ? "aligned" : "split";
      const panel = panelFor(c.criterion_id);
      const start = Math.floor(r() * panel.length);
      const count = shape === "single" ? 1 : 2 + Math.floor(r() * 2);
      /** Materials early in the register skew a little more favourable. */
      const tilt = mi < 22 ? 0.6 : mi < 48 ? 0 : -0.5;
      const centre = clamp(profile.base + tilt);
      const wide = r() < 0.4;

      for (let k = 0; k < count; k += 1) {
        const person = panel[(start + k) % panel.length]!;
        const userIndex = CONTRIBUTORS.findIndex((x) => x.user_id === person.user_id);
        let score: number;
        if (shape === "aligned") score = centre;
        else if (shape === "split")
          score = wide ? (k % 2 === 0 ? 5 : 1) : clamp(centre + (k % 2 === 0 ? 1 : -1));
        else score = clamp(profile.base + tilt + (r() - 0.5) * 1.6);

        /** Some functions genuinely have no visibility here. That is Neutral. */
        const neutralPool = NEUTRAL_NOTES[c.criterion_id] ?? [];
        const neutral = shape !== "split" && neutralPool.length > 0 && r() < 0.12;
        put(
          m.material_id,
          c.criterion_id,
          userIndex,
          neutral ? null : score,
          neutral ? pick(neutralPool, r) : rationaleFor(c.criterion_id, score, m, r),
          at(mi, ci, k, 4 + Math.floor(r() * 24)),
        );
      }
    });
  });

  /* ------------------------------------------------------- deliberate patterns
   * Two materials read as clearly aligned, two as clearly split, and one
   * criterion is answered Neutral by everyone who looked at it.
   * -------------------------------------------------------------------------- */

  const ids = seedMaterialsWithHistory.map((m) => m.material_id);
  const [a1, a2, d1, d2, n1] = [ids[1], ids[4], ids[7], ids[10], ids[13]];

  if (a1) {
    put(a1, SUSTAINABILITY, 3, 4, "Palm-derived today. The residue route cuts the factor by about a third.", at(1, 1, 0, 12));
    put(a1, SUSTAINABILITY, 2, 4, "Two renewable routes already at pilot scale, both audited.", at(1, 1, 1, 13));
    put(a1, SUSTAINABILITY, 6, 4, "Largest single Scope 3 line we can actually move this year.", at(1, 1, 2, 14));
  }
  if (a2) {
    put(a2, SUPPLY, 1, 5, "Two of three suppliers sit in one region. One weather event takes us out.", at(4, 2, 0, 9));
    put(a2, SUPPLY, 5, 5, "Already under substance review. Standing still is the exposure.", at(4, 2, 1, 10));
    put(a2, SUPPLY, 7, 5, "Second source qualification is realistic inside a year, and worth doing.", at(4, 2, 2, 11));
  }
  if (d1) {
    put(d1, MARKET, 8, 5, "A sulfate-free version gives the shampoo line a claim buyers keep asking for.", at(7, 0, 0, 6));
    put(d1, MARKET, 2, 3, "Trial panels noticed a foam difference, but not one they minded.", at(7, 0, 1, 7));
    put(d1, MARKET, 1, 1, "Claim potential is thin. Nobody reads this one on pack.", at(7, 0, 2, 8));
  }
  if (d2) {
    put(d2, ECONOMIC, 0, 5, "Incumbent price has run away from us. The alternative is now cheaper per wash.", at(10, 3, 0, 16));
    put(d2, ECONOMIC, 7, 4, "Holds up even without a volume commitment, which is unusual here.", at(10, 3, 1, 17));
    put(d2, ECONOMIC, 4, 1, "Only true at spot. Contract renewal wipes the whole gain out.", at(10, 3, 2, 18));
  }
  if (n1) {
    /** All-neutral criterion: nobody who looked at it holds a view. Not a score. */
    put(n1, ADVANTAGE, 0, null, "We do not see competitor formulations from this seat.", at(13, 0, 0, 5));
    put(n1, ADVANTAGE, 1, null, "No competitor benchmark on file for this one.", at(13, 0, 1, 6));
    put(n1, ADVANTAGE, 6, null, "R&D cannot judge what a rival could or could not copy.", at(13, 0, 2, 7));
  }

  return out;
})();
