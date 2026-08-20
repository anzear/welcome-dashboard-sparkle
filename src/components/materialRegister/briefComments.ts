/**
 * Mock comment threads for the material brief. Shared so the register can count
 * the people who have put something on the record without duplicating the seed.
 */
export interface BriefComment {
  id: string;
  author: string;
  at: string;
  body: string;
}

const MOCK_COMMENTS: { author: string; days: number; body: string }[][] = [
  [
    { author: "Sofia Rautio (R&D)", days: 9, body: "Bench trials on the renewable grade held viscosity within spec. Two formulations still need a stability run before we commit." },
    { author: "Marta Kowalczyk (Regulatory)", days: 5, body: "No barrier on the EU side, but the supplier's certification is due for renewal in Q1. Worth confirming before the gate." },
    { author: "Ingrid Haugen (Sustainability)", days: 2, body: "Cradle-to-gate figures came back better than the incumbent. I've attached the supplier statement to Strategic importance." },
  ],
  [
    { author: "Daniel Brandt (Procurement)", days: 12, body: "Only one qualified source at volume today. Price is workable, but we'd be single-sourced through next season." },
    { author: "Lotte Vermeer (Marketing)", days: 6, body: "Claim potential is real for the premium line — the tension is whether we can support it across all pack sizes." },
    { author: "Sofia Rautio (R&D)", days: 1, body: "Sensory panel flagged a slight odour shift. Fixable with the masking route, adds a step to the process." },
  ],
  [
    { author: "Ade Oyelaran (Procurement)", days: 15, body: "Two suppliers responded to the RFI. Lead times are long, so any switch needs a full season of notice." },
    { author: "Ingrid Haugen (Sustainability)", days: 7, body: "This one carries most of the category's footprint. Staying put is the expensive option here." },
    { author: "Marta Kowalczyk (Regulatory)", days: 3, body: "Watch the labelling implications — the classification differs from the incumbent in two markets." },
  ],
];

/** Deterministic mock thread so every material opens with a used comments card. */
export const seedComments = (materialId: string): BriefComment[] => {
  let h = 0;
  for (let i = 0; i < materialId.length; i++) h = (h * 31 + materialId.charCodeAt(i)) % 9973;
  const set = MOCK_COMMENTS[h % MOCK_COMMENTS.length];
  return set.map((c, i) => ({
    id: `${materialId}-seed-${i}`,
    author: c.author,
    at: new Date(Date.now() - c.days * 86400000).toISOString(),
    body: c.body,
  }));
};
