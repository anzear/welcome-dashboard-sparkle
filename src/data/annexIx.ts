// RED II Annex IX Part A reference data.
//
// The Annex IX Part A flag lives on the FEEDSTOCK, never on the pathway.
// Group membership for the system group "Annex IX Part A" is derived at render
// time from this table — it is never stored as a saved selection.

export interface FeedstockAnnexInfo {
  /** true when the feedstock is listed in RED II Annex IX Part A. */
  annexIxPartA: boolean;
  /** Letter of the Annex IX Part A entry, e.g. "e". null when not listed. */
  annexIxPoint: string | null;
}

/** Explicit reference table. Anything absent is treated as not listed. */
export const FEEDSTOCK_ANNEX_IX: Record<string, FeedstockAnnexInfo> = {
  // Food-crop / food-chain materials — do NOT qualify.
  'Corn Starch': { annexIxPartA: false, annexIxPoint: null },
  'Sugarcane Molasses': { annexIxPartA: false, annexIxPoint: null },
  'Whey Permeate': { annexIxPartA: false, annexIxPoint: null },
  'Glucose Syrup': { annexIxPartA: false, annexIxPoint: null },
  'Potato Starch': { annexIxPartA: false, annexIxPoint: null },
  'Cassava Starch': { annexIxPartA: false, annexIxPoint: null },
  'Fructose': { annexIxPartA: false, annexIxPoint: null },
  'Sorghum Grain': { annexIxPartA: false, annexIxPoint: null },

  // Qualifying feedstocks.
  'Wheat Straw': { annexIxPartA: true, annexIxPoint: 'e' },
  'Corn Stover': { annexIxPartA: true, annexIxPoint: 'q' },
  'Corn Cobs': { annexIxPartA: true, annexIxPoint: 'n' },
  'Sugarcane Bagasse': { annexIxPartA: true, annexIxPoint: 'j' },
  'Rice Husk': { annexIxPartA: true, annexIxPoint: 'm' },
  'Nut Shells': { annexIxPartA: true, annexIxPoint: 'l' },
  'Household Biowaste': { annexIxPartA: true, annexIxPoint: 'c' },
  'Biomass Fraction of Mixed Municipal Waste': { annexIxPartA: true, annexIxPoint: 'b' },
  'Industrial Food Processing Waste': { annexIxPartA: true, annexIxPoint: 'd' },
  'Grape Marc and Wine Lees': { annexIxPartA: true, annexIxPoint: 'k' },
  'Crude Glycerine': { annexIxPartA: true, annexIxPoint: 'i' },
  'Softwood Sawdust': { annexIxPartA: true, annexIxPoint: 'o' },
  'Waste Paper and Cardboard Reject': { annexIxPartA: true, annexIxPoint: 'p' },
  'Empty Palm Fruit Bunches': { annexIxPartA: true, annexIxPoint: 'g' },
  'Sewage Sludge': { annexIxPartA: true, annexIxPoint: 'f' },
  'Cultivated Microalgae (ponds/photobioreactors)': { annexIxPartA: true, annexIxPoint: 'a' },
};

export const annexIxInfo = (feedstock: string): FeedstockAnnexInfo =>
  FEEDSTOCK_ANNEX_IX[feedstock] ?? { annexIxPartA: false, annexIxPoint: null };

interface AnnexRow {
  feedstock: string;
  technology: string;
  product: string;
  application: string;
  trl: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
  patents?: string;
}

/** Existing lactic acid application pool with its own readiness ceiling. */
const APP_POOL: Record<string, { trl: number | null; cat4: string }> = {
  'PLA Packaging': { trl: 9, cat4: 'Packaging' },
  'Food Acidulant': { trl: 9, cat4: 'Food & Beverage' },
  'Green Solvents': { trl: 7, cat4: 'Chemical Industry' },
  'Bio-based Solvent': { trl: 6, cat4: 'Chemical Industry' },
  'PLA Fiber': { trl: 8, cat4: 'Textiles' },
  'PLA Film': { trl: 7, cat4: 'Packaging' },
  'Compostable Cutlery': { trl: 8, cat4: 'Packaging' },
  'Compostable Bag': { trl: 6, cat4: 'Packaging' },
  'Animal Feed Additive': { trl: 6, cat4: 'Agriculture' },
  'Silage Preservative': { trl: 7, cat4: 'Agriculture' },
  'Soil pH Amendment': { trl: 6, cat4: 'Agriculture' },
  'Descaling Agent': { trl: 7, cat4: 'Chemical Industry' },
  'Industrial Descaler': { trl: 8, cat4: 'Chemical Industry' },
  'Textile Dyeing Aid': { trl: 8, cat4: 'Textiles' },
  'Cement Retarder': { trl: 5, cat4: 'Construction' },
  'Bio-based Ink': { trl: 4, cat4: 'Advanced Manufacturing' },
  'Herbicide Adjuvant': { trl: 3, cat4: 'Agriculture' },
  'Carbon-Capture Polymer': { trl: null, cat4: 'Environmental' },
  'Pharmaceutical Excipient': { trl: null, cat4: 'Pharma & Healthcare' },
};

interface Triple {
  feedstock: string;
  technology: string;
  trl: number;
  category1: string;
  category2: string;
  apps: string[];
}

const TRIPLES: Triple[] = [
  { feedstock: 'Wheat Straw', technology: 'Enzymatic Hydrolysis + Homofermentation', trl: 6, category1: 'Agricultural residues', category2: 'Fermentation', apps: ['PLA Packaging', 'Green Solvents', 'Silage Preservative', 'PLA Film', 'Descaling Agent'] },
  { feedstock: 'Corn Stover', technology: 'Enzymatic Hydrolysis + Homofermentation', trl: 5, category1: 'Agricultural residues', category2: 'Fermentation', apps: ['PLA Packaging', 'Bio-based Solvent', 'Animal Feed Additive', 'Cement Retarder'] },
  { feedstock: 'Corn Cobs', technology: 'Dilute Acid Pretreatment + Fermentation', trl: 5, category1: 'Agricultural residues', category2: 'Fermentation', apps: ['PLA Film', 'Soil pH Amendment', 'Industrial Descaler'] },
  { feedstock: 'Sugarcane Bagasse', technology: 'Enzymatic Hydrolysis + Homofermentation', trl: 6, category1: 'Agricultural residues', category2: 'Fermentation', apps: ['PLA Packaging', 'Food Acidulant', 'Textile Dyeing Aid', 'Cement Retarder', 'Green Solvents', 'Compostable Cutlery'] },
  { feedstock: 'Rice Husk', technology: 'Alkaline Pretreatment + Fermentation', trl: 4, category1: 'Agricultural residues', category2: 'Fermentation', apps: ['Bio-based Ink', 'Soil pH Amendment', 'Compostable Bag'] },
  { feedstock: 'Nut Shells', technology: 'Steam Explosion + Fermentation', trl: 3, category1: 'Agricultural residues', category2: 'Fermentation', apps: ['Herbicide Adjuvant', 'Bio-based Ink'] },
  { feedstock: 'Household Biowaste', technology: 'Mixed Culture Fermentation', trl: 5, category1: 'Waste streams', category2: 'Fermentation', apps: ['Soil pH Amendment', 'Compostable Bag', 'Cement Retarder', 'Silage Preservative'] },
  { feedstock: 'Biomass Fraction of Mixed Municipal Waste', technology: 'Mixed Culture Fermentation', trl: 4, category1: 'Waste streams', category2: 'Fermentation', apps: ['Soil pH Amendment', 'Cement Retarder', 'Carbon-Capture Polymer'] },
  { feedstock: 'Industrial Food Processing Waste', technology: 'Open Fermentation', trl: 5, category1: 'Industrial side-streams', category2: 'Fermentation', apps: ['Animal Feed Additive', 'Silage Preservative', 'Descaling Agent', 'Food Acidulant'] },
  { feedstock: 'Grape Marc and Wine Lees', technology: 'Enzymatic Hydrolysis + Fermentation', trl: 4, category1: 'Industrial side-streams', category2: 'Fermentation', apps: ['Bio-based Ink', 'Compostable Bag', 'Soil pH Amendment'] },
  { feedstock: 'Crude Glycerine', technology: 'Catalytic Hydrothermal Conversion', trl: 4, category1: 'Industrial side-streams', category2: 'Chemical Conversion', apps: ['Green Solvents', 'Industrial Descaler', 'Pharmaceutical Excipient'] },
  { feedstock: 'Softwood Sawdust', technology: 'Organosolv Pretreatment + Fermentation', trl: 4, category1: 'Forestry residues', category2: 'Fermentation', apps: ['PLA Film', 'Bio-based Ink', 'Compostable Cutlery'] },
  { feedstock: 'Waste Paper and Cardboard Reject', technology: 'Enzymatic Hydrolysis + Fermentation', trl: 4, category1: 'Waste streams', category2: 'Fermentation', apps: ['Compostable Bag', 'PLA Film', 'Soil pH Amendment'] },
  { feedstock: 'Empty Palm Fruit Bunches', technology: 'Enzymatic Hydrolysis + Fermentation', trl: 4, category1: 'Agricultural residues', category2: 'Fermentation', apps: ['PLA Film', 'Textile Dyeing Aid', 'Cement Retarder'] },
  { feedstock: 'Sewage Sludge', technology: 'Alkaline Fermentation', trl: 3, category1: 'Waste streams', category2: 'Fermentation', apps: ['Soil pH Amendment', 'Carbon-Capture Polymer'] },
  { feedstock: 'Cultivated Microalgae (ponds/photobioreactors)', technology: 'Hydrolysis + Fermentation', trl: 3, category1: 'Bio-based primary feedstocks', category2: 'Fermentation', apps: ['Carbon-Capture Polymer', 'Bio-based Ink', 'Pharmaceutical Excipient'] },
];

/**
 * Row TRL is the lower of the triple TRL and the application TRL.
 * Applications with no readiness figure leave the row without a TRL — those
 * rows render as an em-dash and are excluded from the band cards.
 */
export const ANNEX_IX_PATHWAYS: AnnexRow[] = TRIPLES.flatMap((t) =>
  t.apps.map((app) => {
    const pool = APP_POOL[app];
    const trl = pool.trl === null ? null : Math.min(t.trl, pool.trl);
    return {
      feedstock: t.feedstock,
      technology: t.technology,
      product: 'Lactic Acid',
      application: app,
      trl: trl === null ? '' : `TRL ${trl}`,
      category1: t.category1,
      category2: t.category2,
      category3: 'Chemicals',
      category4: pool.cat4,
    };
  }),
);
