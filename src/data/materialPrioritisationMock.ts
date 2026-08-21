import { EMPTY_GATE, migrateEntryType, migrateJourneyStatus, SUPPLIER_CEILING } from "@/types/materialPrioritisation";
import type {
  CompetitorActivity,
  SubstitutabilityReadiness,
  SupplierAvailability,
  FieldProvenance,
  IntelligenceStatus,
  JourneyStatus,
  Material,
  MaterialRequirements,
} from "@/types/materialPrioritisation";

/**
 * One customer: a personal care and home care formulator. Every material's
 * application categories (the product categories it is used in) and application areas (their SKU lines)
 * are plausible together — no industrial coatings, no shampoo in a PVC compound.
 *
 * The deliberate data spread is kept: missing figures, rank divergence, family
 * concentration on the alkyl polyglucosides, unscored materials, and several
 * materials with NO applications recorded — which is missing, not zero.
 */

/**
 * Product category the material ends up in. Never a function or a performance
 * claim — a category is where the material is used, not what it does there.
 */
type ApplicationCategory =
  | "Laundry detergents"
  | "Dishwashing"
  | "Surface cleaners"
  | "Hair care"
  | "Skin & body care"
  | "Hand hygiene";

/**
 * Legacy formulation-function marker kept only to say whether the customer file
 * recorded a category at all. An empty list stays missing, never zero.
 */
type Application = string;

/** Their SKU lines (application areas). */
type Product =
  | "Shampoo base"
  | "Body wash"
  | "Liquid detergent"
  | "Surface cleaner"
  | "Hand soap"
  | "Conditioner";

/** Each SKU line rolls up to exactly one product category. */
const PRODUCT_CATEGORY: Record<Product, ApplicationCategory> = {
  "Shampoo base": "Hair care",
  Conditioner: "Hair care",
  "Body wash": "Skin & body care",
  "Hand soap": "Hand hygiene",
  "Liquid detergent": "Laundry detergents",
  "Surface cleaner": "Surface cleaners",
};

/**
 * Product categories a material serves. Rows whose source file recorded no
 * application at all keep an empty list — missing, not zero.
 */
const categoriesFor = (row: { apps: Application[]; prods: Product[] }): ApplicationCategory[] =>
  row.apps.length === 0 ? [] : Array.from(new Set(row.prods.map((pr) => PRODUCT_CATEGORY[pr])));

interface Row {
  name: string;
  cas: string | null;
  cls: string | null;
  tag: string;
  /** tonnes per year */
  vol: number | null;
  /** EUR per kg */
  price: number | null;
  /** kg CO2e per kg */
  ghg: number | null;
  /** Legacy value set; migrated to the five gate statuses on projection. */
  status: string;
  owner: string | null;
  apps: Application[];
  prods: Product[];
  /** Planned date for the change. Undated is a real state. */
  target?: string;
  intel?: IntelligenceStatus;
  intelScope?: string;
  priority?: string;
  req?: Partial<MaterialRequirements>;
  /** Fields whose value exists but whose origin was never captured. */
  unknownOrigin?: string[];
  /** Replacement candidates are marked; everything else is an existing material. */
  role?: "new";
  /** Replacement type. Only ever set on a candidate, and not on all of them. */
  etype?: "new_material" | "substitution";
  /** Names of the existing materials this candidate is a replacement for. */
  linkTo?: string[];
}

const rows: Row[] = [
  // ---------------------------------------------------------------- Surfactants
  {
    name: "Sodium laureth sulfate", cas: "9004-82-4", cls: "Ethoxylated alkyl sulfate", tag: "Surfactants",
    vol: 3100, price: 1.35, ghg: 2.6, status: "under_evaluation", owner: "M. Oyelaran",
    apps: ["Surfactancy"], prods: ["Shampoo base", "Body wash"],
    target: "2026-06-30", intel: "delivered", intelScope: "Bio-based and sulfate-free surfactant suppliers, EU",
    priority: "H2 2026",
    req: { target_volume: 3100, price_ceiling: 1.6, ghg_reduction_target: 30, required_certifications: ["RSPO MB", "ISCC PLUS"], earliest_need_date: "2027-01-01", notes: "Foam profile must hold at 12% active." },
  },
  {
    name: "Sodium lauryl sulfate", cas: "151-21-3", cls: "Alkyl sulfate", tag: "Surfactants",
    vol: 1450, price: 1.28, ghg: 2.45, status: "not_started", owner: null,
    apps: ["Surfactancy"], prods: ["Liquid detergent", "Hand soap"],
  },
  {
    name: "Cocamidopropyl betaine", cas: "61789-40-0", cls: "Amphoteric betaine", tag: "Surfactants",
    vol: 1850, price: 1.68, ghg: 2.2, status: "in_testing", owner: "S. Rautio",
    apps: ["Surfactancy", "Viscosity control"], prods: ["Shampoo base", "Hand soap"],
    target: "2026-09-15", intel: "in_progress", intelScope: "Coconut-free amphoteric routes",
  },
  {
    name: "Coco glucoside", cas: "141464-42-8", cls: "Alkyl polyglucoside", tag: "Surfactants",
    vol: 950, price: 2.1, ghg: 1.9, status: "qualified", owner: "S. Rautio",
    apps: ["Surfactancy"], prods: ["Body wash", "Hand soap"],
    target: "2026-05-01", priority: "H2 2026",
  },
  {
    name: "Decyl glucoside", cas: "141464-42-8", cls: "Alkyl polyglucoside", tag: "Surfactants",
    vol: 610, price: 2.28, ghg: 1.95, status: "in_use", owner: "S. Rautio",
    apps: ["Surfactancy"], prods: ["Surface cleaner", "Body wash"],
  },
  {
    name: "Lauryl glucoside", cas: "110615-47-9", cls: "Alkyl polyglucoside", tag: "Surfactants",
    vol: 430, price: 2.34, ghg: null, status: "under_evaluation", owner: "S. Rautio",
    apps: ["Surfactancy"], prods: ["Shampoo base"],
    intel: "requested", intelScope: "Palm-free C12 glucoside supply",
  },
  {
    name: "Caprylyl glucoside", cas: "68515-73-1", cls: "Alkyl polyglucoside", tag: "Surfactants",
    vol: 155, price: 2.75, ghg: 2.05, status: "not_started", owner: null,
    apps: ["Surfactancy"], prods: ["Surface cleaner"],
  },
  {
    name: "Sodium C14-16 olefin sulfonate", cas: "68439-57-6", cls: "Olefin sulfonate", tag: "Surfactants",
    vol: 780, price: 1.42, ghg: 2.5, status: "not_started", owner: null,
    apps: [], prods: ["Liquid detergent"],
  },
  {
    name: "C12-C14 fatty alcohol", cas: "80206-82-2", cls: "C12-C14 fatty alcohol", tag: "Surfactants",
    vol: 2400, price: 1.95, ghg: 2.85, status: "sourcing", owner: "K. Brandt",
    apps: ["Surfactancy"], prods: ["Liquid detergent", "Body wash"],
    target: "2026-07-01", intel: "delivered", intelScope: "Certified palm kernel alcohols, second source",
    priority: "H2 2026",
  },
  {
    name: "Cocamide MEA", cas: "68140-00-1", cls: "Fatty acid alkanolamide", tag: "Rheology",
    vol: 320, price: 2.55, ghg: 2.7, status: "not_started", owner: null,
    apps: ["Viscosity control"], prods: ["Shampoo base"],
  },
  {
    name: "Nonylphenol ethoxylate", cas: "9016-45-9", cls: "Alkylphenol ethoxylate", tag: "Surfactants",
    vol: 210, price: 2.05, ghg: 3.4, status: "rejected", owner: "K. Brandt",
    apps: ["Surfactancy"], prods: ["Surface cleaner"],
  },

  // -------------------------------------------------------------- Preservatives
  {
    name: "Phenoxyethanol", cas: "122-99-6", cls: "Aromatic ether preservative", tag: "Preservatives",
    vol: 260, price: 3.55, ghg: 3.9, status: "under_evaluation", owner: "L. Haugen",
    apps: ["Preservation"], prods: ["Shampoo base", "Conditioner", "Body wash"],
    target: "2026-03-31", intel: "delivered", intelScope: "Fermentation-route preservative systems",
  },
  {
    name: "Benzyl alcohol", cas: "100-51-6", cls: "Aromatic alcohol preservative", tag: "Preservatives",
    vol: 180, price: 2.9, ghg: 2.8, status: "not_started", owner: null,
    apps: ["Preservation", "Fragrance carrier"], prods: ["Body wash", "Hand soap"],
  },
  {
    name: "Sodium benzoate", cas: "532-32-1", cls: "Benzoate salt preservative", tag: "Preservatives",
    vol: 320, price: null, ghg: 1.95, status: "not_started", owner: null,
    apps: ["Preservation"], prods: ["Liquid detergent", "Surface cleaner"],
  },
  {
    name: "Methylisothiazolinone", cas: "2682-20-4", cls: "Isothiazolinone biocide", tag: "Preservatives",
    vol: null, price: 14.2, ghg: null, status: "rejected", owner: "S. Rautio",
    apps: ["Preservation"], prods: ["Surface cleaner"],
  },

  // ------------------------------------------------------------------ Chelants
  {
    name: "Tetrasodium EDTA", cas: "64-02-8", cls: "Aminopolycarboxylate chelant", tag: "Chelants",
    vol: 720, price: 1.95, ghg: 3.35, status: "under_evaluation", owner: "M. Oyelaran",
    apps: ["Chelation"], prods: ["Liquid detergent", "Surface cleaner"],
    target: "2026-04-30", priority: "H2 2026",
    req: { target_volume: 720, price_ceiling: 2.4, required_certifications: ["Readily biodegradable (OECD 301)"], earliest_need_date: "2026-10-01", notes: "Must hold chelation at pH 9 wash conditions." },
  },
  {
    name: "Trisodium GLDA", cas: "51981-21-6", cls: "Biodegradable chelant", tag: "Chelants",
    vol: null, price: 2.6, ghg: 2.15, status: "in_testing", owner: "M. Oyelaran",
    apps: ["Chelation"], prods: ["Liquid detergent"],
    intel: "in_progress", intelScope: "GLDA capacity outlook to 2028",
  },
  {
    name: "Sodium gluconate", cas: "527-07-1", cls: "Gluconate chelant", tag: "Chelants",
    vol: 540, price: null, ghg: 1.45, status: "not_started", owner: null,
    apps: ["Chelation"], prods: ["Surface cleaner"],
  },
  {
    name: "Sodium phytate", cas: "14306-25-3", cls: "Phytate chelant", tag: "Chelants",
    vol: 40, price: 8.6, ghg: null, status: "not_started", owner: null,
    apps: [], prods: ["Conditioner"],
  },
  {
    name: "Sodium citrate", cas: "68-04-2", cls: "Citrate builder", tag: "Builders",
    vol: 880, price: 1.15, ghg: 1.55, status: "not_started", owner: null,
    apps: ["Chelation"], prods: ["Liquid detergent", "Surface cleaner"],
  },
  {
    name: "Citric acid", cas: "77-92-9", cls: "Hydroxy acid", tag: "pH control",
    vol: 640, price: 1.32, ghg: 1.6, status: "in_use", owner: "K. Brandt",
    apps: ["Chelation"], prods: ["Surface cleaner", "Liquid detergent"],
  },

  // --------------------------------------------------- Humectants and solvents
  {
    name: "Glycerine (vegetable)", cas: "56-81-5", cls: "Polyol humectant", tag: "Emollients",
    vol: 2600, price: 1.05, ghg: 1.35, status: "sourcing", owner: "L. Haugen",
    apps: [], prods: ["Shampoo base", "Body wash", "Conditioner"],
    target: "2026-02-28", priority: "H1 2027",
  },
  {
    name: "Propylene glycol", cas: "57-55-6", cls: "Glycol solvent", tag: "Solvents",
    vol: 1400, price: 1.42, ghg: 3.1, status: "under_evaluation", owner: "L. Haugen",
    apps: ["Fragrance carrier"], prods: ["Conditioner", "Surface cleaner"],
    target: "2026-11-30", intel: "requested", intelScope: "Bio-PG availability in Europe",
  },
  {
    name: "Isopropyl alcohol", cas: "67-63-0", cls: "Short-chain alcohol solvent", tag: "Solvents",
    vol: 1900, price: 1.08, ghg: 1.85, status: "sourcing", owner: "M. Oyelaran",
    apps: ["Fragrance carrier"], prods: ["Surface cleaner"],
    target: "2026-12-31",
  },
  {
    name: "d-Limonene", cas: "5989-27-5", cls: "Terpene solvent", tag: "Fragrance",
    vol: 240, price: 5.4, ghg: 1.15, status: "in_testing", owner: "L. Haugen",
    apps: ["Fragrance carrier"], prods: ["Surface cleaner", "Liquid detergent"],
    intel: "delivered", intelScope: "Citrus feedstock volatility",
  },

  // ------------------------------------------------------ Emulsifiers, emollients
  {
    name: "Glyceryl stearate", cas: "31566-31-1", cls: "Nonionic emulsifier", tag: "Emollients",
    vol: 340, price: 3.2, ghg: 2.9, status: "under_evaluation", owner: "A. Vermeer",
    apps: ["Emulsification"], prods: ["Conditioner"],
  },
  {
    name: "Cetearyl alcohol", cas: "67762-27-0", cls: "Fatty alcohol emulsifier", tag: "Emollients",
    vol: 620, price: 2.4, ghg: 2.75, status: "in_testing", owner: "A. Vermeer",
    apps: ["Emulsification", "Viscosity control"], prods: ["Conditioner", "Body wash"],
    target: "2026-08-31", priority: "H2 2026",
  },
  {
    name: "Sorbitan oleate", cas: "1338-43-8", cls: "Sorbitan ester emulsifier", tag: "Emollients",
    vol: 85, price: 4.35, ghg: null, status: "not_started", owner: null,
    apps: ["Emulsification"], prods: ["Conditioner"],
  },
  {
    name: "PEG-40 hydrogenated castor oil", cas: "61788-85-0", cls: "Ethoxylated castor oil", tag: "Emollients",
    vol: 210, price: 4.9, ghg: 3.15, status: "under_evaluation", owner: "A. Vermeer",
    apps: ["Emulsification"], prods: ["Shampoo base"],
    intel: "requested", intelScope: "Ethoxylate-free solubiliser options",
  },
  {
    name: "Isopropyl myristate", cas: "110-27-0", cls: "Ester emollient", tag: "Emollients",
    vol: 130, price: 3.75, ghg: 2.6, status: "not_started", owner: null,
    apps: [], prods: ["Body wash"],
  },

  // ------------------------------------------------------------- Conditioning
  {
    name: "Dimethicone (350 cSt)", cas: "63148-62-9", cls: "Silicone fluid", tag: "Conditioning",
    vol: 420, price: 6.2, ghg: 5.4, status: "parked", owner: "N. Kowalczyk",
    apps: [], prods: ["Conditioner", "Shampoo base"],
    unknownOrigin: ["ghg_emission_factor"],
  },
  {
    name: "Behentrimonium chloride", cas: "17301-53-0", cls: "Quaternary ammonium conditioner", tag: "Conditioning",
    vol: 180, price: 5.1, ghg: 4.2, status: "under_evaluation", owner: "N. Kowalczyk",
    apps: ["Emulsification"], prods: ["Conditioner"],
    target: "2027-03-31",
  },
  {
    name: "Guar hydroxypropyltrimonium chloride", cas: "65497-29-2", cls: "Cationic guar", tag: "Conditioning",
    vol: 95, price: 7.4, ghg: 2.1, status: "in_testing", owner: "N. Kowalczyk",
    apps: ["Viscosity control"], prods: ["Shampoo base", "Conditioner"],
    intel: "in_progress", intelScope: "Guar price and origin risk",
  },
  {
    name: "Polyquaternium-10", cas: "68610-92-4", cls: "Cationic cellulose", tag: "Conditioning",
    vol: 70, price: 9.2, ghg: null, status: "not_started", owner: null,
    apps: ["Viscosity control"], prods: ["Shampoo base"],
  },

  // ---------------------------------------------------------------- Rheology
  {
    name: "Xanthan gum", cas: "11138-66-2", cls: "Biopolymer thickener", tag: "Rheology",
    vol: 240, price: 4.6, ghg: 2.3, status: "qualified", owner: null,
    apps: ["Viscosity control"], prods: ["Hand soap", "Surface cleaner"],
    target: "2026-01-31",
  },
  {
    name: "Carbomer", cas: "9003-01-4", cls: "Crosslinked polyacrylate", tag: "Rheology",
    vol: 110, price: 8.9, ghg: 6.1, status: "not_started", owner: null,
    apps: [], prods: ["Hand soap"],
  },
  {
    name: "Acrylates copolymer", cas: "25133-97-5", cls: "Acrylates copolymer", tag: "Rheology",
    vol: 300, price: 3.3, ghg: 3.6, status: "parked", owner: "A. Vermeer",
    apps: ["Viscosity control", "Opacification"], prods: ["Body wash"],
  },

  // --------------------------------------------------------------- Opacifiers
  {
    name: "Glycol distearate", cas: "627-83-8", cls: "Wax opacifier", tag: "Opacifiers",
    vol: 150, price: 3.05, ghg: 2.85, status: "not_started", owner: null,
    apps: ["Opacification"], prods: ["Shampoo base", "Body wash"],
  },
  {
    name: "Titanium dioxide (rutile)", cas: "13463-67-7", cls: "Titanium dioxide pigment", tag: "Opacifiers",
    vol: 240, price: 3.05, ghg: 8.4, status: "under_evaluation", owner: "A. Vermeer",
    apps: ["Opacification"], prods: ["Hand soap", "Surface cleaner"],
    // Priority set for a later period on purpose — the register must still show it.
    priority: "H1 2027", target: "2027-01-31",
    intel: "delivered", intelScope: "TiO2 replacement opacifiers for rinse-off",
    req: { target_volume: 240, ghg_reduction_target: 50, required_certifications: [], earliest_need_date: "2027-06-30", notes: "Whiteness must match the current hand soap standard." },
  },
  {
    name: "Mica", cas: "12001-26-2", cls: "Mineral pearlescent", tag: "Opacifiers",
    vol: 35, price: 6.4, ghg: null, status: "not_started", owner: null,
    apps: ["Opacification"], prods: ["Body wash"],
    unknownOrigin: ["unit_price"],
  },

  // ------------------------------------------------------------------ Builders
  {
    name: "Sodium chloride", cas: "7647-14-5", cls: "Inorganic salt", tag: "Rheology",
    vol: 2100, price: 0.18, ghg: 0.25, status: "not_started", owner: null,
    apps: ["Viscosity control"], prods: ["Shampoo base", "Body wash"],
  },
  {
    name: "Protease enzyme blend", cas: null, cls: "Detergent enzyme", tag: "Enzymes",
    vol: 45, price: 11.8, ghg: 3.05, status: "in_testing", owner: "M. Oyelaran",
    apps: [], prods: ["Liquid detergent"],
    intel: "in_progress", intelScope: "Enzyme supplier landscape outside DK",
  },

  // ======================================================= Replacement candidates
  // Bio-based and circular alternatives the team is looking at against the book
  // above. Candidates carry a replacement type; a few have none recorded yet.
  // Volumes are often absent — nothing is bought at scale yet, and that gap is
  // real, never a zero.

  // -------------------------------------------- Sugar and amino-acid surfactants
  {
    name: "Sodium coco-sulfate (RSPO segregated)", cas: "97375-27-4", cls: "Alkyl sulfate", tag: "Surfactants",
    vol: 420, price: 1.92, ghg: 1.85, status: "in_testing", owner: "S. Rautio",
    role: "new", etype: "substitution", linkTo: ["Sodium lauryl sulfate", "Sodium laureth sulfate"],
    apps: ["Surfactancy"], prods: ["Shampoo base", "Hand soap"],
    target: "2026-10-31", priority: "H2 2026",
  },
  {
    name: "Sodium lauroyl methyl isethionate", cas: "1191945-24-4", cls: "Isethionate surfactant", tag: "Surfactants",
    vol: 180, price: 3.45, ghg: 2.15, status: "under_evaluation", owner: "S. Rautio",
    role: "new", etype: "new_material", linkTo: ["Sodium laureth sulfate"],
    apps: ["Surfactancy"], prods: ["Shampoo base", "Body wash"],
  },
  {
    name: "Disodium cocoyl glutamate", cas: "68187-32-6", cls: "Amino acid surfactant", tag: "Surfactants",
    vol: 95, price: 4.6, ghg: 2.05, status: "under_evaluation", owner: "A. Vermeer",
    role: "new", etype: "new_material", linkTo: ["Sodium laureth sulfate", "Cocamidopropyl betaine"],
    apps: ["Surfactancy"], prods: ["Shampoo base", "Body wash"],
    intel: "requested", intelScope: "Amino acid surfactant capacity, EU and JP",
  },
  {
    name: "Sodium methyl cocoyl taurate", cas: "61791-42-2", cls: "Taurate surfactant", tag: "Surfactants",
    vol: null, price: 5.2, ghg: null, status: "not_started", owner: null,
    role: "new", etype: "new_material", linkTo: ["Sodium lauryl sulfate"],
    apps: ["Surfactancy"], prods: ["Hand soap"],
  },
  {
    name: "Sodium lauroyl sarcosinate", cas: "137-16-6", cls: "Amino acid surfactant", tag: "Surfactants",
    vol: 60, price: 5.85, ghg: 2.45, status: "under_evaluation", owner: "S. Rautio",
    role: "new", linkTo: ["Sodium lauryl sulfate"],
    apps: [], prods: ["Shampoo base"],
  },
  {
    name: "Sodium cocoyl isethionate", cas: "61789-32-0", cls: "Isethionate surfactant", tag: "Surfactants",
    vol: 130, price: 3.9, ghg: null, status: "in_testing", owner: "K. Brandt",
    role: "new", etype: "substitution", linkTo: ["Sodium C14-16 olefin sulfonate"],
    apps: ["Surfactancy"], prods: ["Hand soap", "Body wash"],
    target: "2027-02-28",
  },
  {
    name: "Sodium lauryl glucose carboxylate", cas: "383178-66-3", cls: "Alkyl polyglucoside", tag: "Surfactants",
    vol: 75, price: 4.15, ghg: 1.75, status: "under_evaluation", owner: "S. Rautio",
    role: "new", etype: "new_material", linkTo: ["Sodium laureth sulfate", "Coco glucoside"],
    apps: ["Surfactancy"], prods: ["Shampoo base"],
  },
  {
    name: "Sodium C10-16 alkyl glucoside (sugar beet)", cas: "141464-42-8", cls: "Alkyl polyglucoside", tag: "Surfactants",
    vol: 260, price: 2.55, ghg: 1.4, status: "qualified", owner: "S. Rautio",
    role: "new", etype: "substitution", linkTo: ["Coco glucoside", "Decyl glucoside", "Lauryl glucoside"],
    apps: ["Surfactancy"], prods: ["Body wash", "Surface cleaner"],
    priority: "H2 2026", target: "2026-09-30",
  },
  {
    name: "Lauramidopropyl betaine (coconut-free)", cas: "4292-10-8", cls: "Amphoteric betaine", tag: "Surfactants",
    vol: 210, price: 2.35, ghg: 1.95, status: "in_testing", owner: "S. Rautio",
    role: "new", etype: "substitution", linkTo: ["Cocamidopropyl betaine"],
    apps: ["Surfactancy", "Viscosity control"], prods: ["Shampoo base", "Hand soap"],
  },

  // ------------------------------------------------------------- Biosurfactants
  {
    name: "Rhamnolipid biosurfactant", cas: "4348-76-9", cls: "Glycolipid biosurfactant", tag: "Surfactants",
    vol: 18, price: 12.4, ghg: 1.55, status: "under_evaluation", owner: "S. Rautio",
    role: "new", etype: "new_material", linkTo: ["Sodium C14-16 olefin sulfonate", "Nonylphenol ethoxylate"],
    apps: ["Surfactancy"], prods: ["Surface cleaner", "Liquid detergent"],
    intel: "in_progress", intelScope: "Fermentation biosurfactant scale-up, 2027-2029",
  },
  {
    name: "Sophorolipid biosurfactant", cas: "148409-20-8", cls: "Glycolipid biosurfactant", tag: "Surfactants",
    vol: null, price: 14.9, ghg: null, status: "under_evaluation", owner: "L. Haugen",
    role: "new", etype: "new_material", linkTo: ["Nonylphenol ethoxylate"],
    apps: [], prods: ["Surface cleaner"],
  },
  {
    name: "Mannosylerythritol lipid", cas: "74381-53-6", cls: "Glycolipid biosurfactant", tag: "Surfactants",
    vol: 6, price: 26.5, ghg: null, status: "not_started", owner: null,
    role: "new", linkTo: [],
    apps: ["Surfactancy"], prods: ["Conditioner"],
  },

  // ------------------------------------------------------- Fatty alcohol routes
  {
    name: "C12-C14 fatty alcohol (used cooking oil route)", cas: "80206-82-2", cls: "C12-C14 fatty alcohol", tag: "Surfactants",
    vol: 880, price: 2.45, ghg: 1.25, status: "in_testing", owner: "K. Brandt",
    role: "new", etype: "substitution", linkTo: ["C12-C14 fatty alcohol"],
    apps: ["Surfactancy"], prods: ["Liquid detergent", "Body wash"],
    target: "2026-12-31", priority: "H2 2026",
    req: { target_volume: 900, price_ceiling: 2.3, ghg_reduction_target: 45, required_certifications: ["ISCC PLUS"], earliest_need_date: "2027-01-01", notes: "Needs mass balance chain of custody through the sulfation step." },
  },
  {
    name: "C12-C14 fatty alcohol (algal oil route)", cas: "80206-82-2", cls: "C12-C14 fatty alcohol", tag: "Surfactants",
    vol: null, price: 4.8, ghg: 0.95, status: "under_evaluation", owner: "L. Haugen",
    role: "new", etype: "substitution", linkTo: ["C12-C14 fatty alcohol"],
    apps: ["Surfactancy"], prods: ["Liquid detergent"],
  },
  {
    name: "C16-C18 fatty alcohol (shea stearin)", cas: "67762-27-0", cls: "Fatty alcohol emulsifier", tag: "Emollients",
    vol: 240, price: 3.1, ghg: 1.6, status: "in_testing", owner: "A. Vermeer",
    role: "new", etype: "substitution", linkTo: ["Cetearyl alcohol", "Glyceryl stearate"],
    apps: ["Emulsification"], prods: ["Conditioner", "Body wash"],
    target: "2027-01-31",
  },
  {
    name: "Cocoyl glycinate emulsifier blend", cas: null, cls: "Nonionic emulsifier", tag: "Emollients",
    vol: 45, price: 6.3, ghg: null, status: "not_started", owner: null,
    role: "new", etype: "new_material", linkTo: ["PEG-40 hydrogenated castor oil"],
    apps: ["Emulsification"], prods: ["Shampoo base"],
  },
  {
    name: "Polyglyceryl-4 caprate", cas: "160391-93-5", cls: "Polyglycerol ester emulsifier", tag: "Emollients",
    vol: 30, price: 7.8, ghg: 2.2, status: "under_evaluation", owner: "A. Vermeer",
    role: "new", etype: "new_material", linkTo: ["PEG-40 hydrogenated castor oil", "Sorbitan oleate"],
    apps: ["Emulsification"], prods: ["Conditioner"],
  },
  {
    name: "Coco-caprylate ester", cas: "107898-54-4", cls: "Ester emollient", tag: "Emollients",
    vol: 55, price: 4.4, ghg: 1.7, status: "not_started", owner: null,
    role: "new", etype: "substitution", linkTo: ["Isopropyl myristate"],
    apps: [], prods: ["Body wash"],
  },

  // ------------------------------------------------- Humectants and glycol routes
  {
    name: "Glycerine (used cooking oil derived)", cas: "56-81-5", cls: "Polyol humectant", tag: "Emollients",
    vol: 1250, price: 1.28, ghg: 0.75, status: "sourcing", owner: "L. Haugen",
    role: "new", etype: "substitution", linkTo: ["Glycerine (vegetable)"],
    apps: ["Emulsification"], prods: ["Shampoo base", "Body wash", "Conditioner"],
    target: "2026-09-30", priority: "H1 2027",
    intel: "delivered", intelScope: "Waste-oil glycerine supply, EU refiners",
  },
  {
    name: "1,3-Propanediol (fermentation)", cas: "504-63-2", cls: "Diol solvent", tag: "Solvents",
    vol: 640, price: 2.65, ghg: 1.15, status: "in_testing", owner: "L. Haugen",
    role: "new", etype: "substitution", linkTo: ["Propylene glycol"],
    apps: ["Fragrance carrier"], prods: ["Conditioner", "Surface cleaner"],
    target: "2026-11-30", priority: "H2 2026",
  },
  {
    name: "Bio-based 1,2-propanediol (glycerol route)", cas: "57-55-6", cls: "Glycol solvent", tag: "Solvents",
    vol: null, price: 2.2, ghg: 1.45, status: "under_evaluation", owner: "M. Oyelaran",
    role: "new", etype: "substitution", linkTo: ["Propylene glycol"],
    apps: ["Fragrance carrier"], prods: ["Surface cleaner"],
  },
  {
    name: "Betaine (sugar beet molasses)", cas: "107-43-7", cls: "Polyol humectant", tag: "Emollients",
    vol: 120, price: 3.35, ghg: 1.05, status: "under_evaluation", owner: "A. Vermeer",
    role: "new", etype: "new_material", linkTo: ["Glycerine (vegetable)"],
    apps: [], prods: ["Shampoo base", "Conditioner"],
  },

  // ------------------------------------------------------------- Solvent routes
  {
    name: "Bio-based isopropyl alcohol (fermentation)", cas: "67-63-0", cls: "Short-chain alcohol solvent", tag: "Solvents",
    vol: 780, price: 1.72, ghg: 0.85, status: "sourcing", owner: "M. Oyelaran",
    role: "new", etype: "substitution", linkTo: ["Isopropyl alcohol"],
    apps: ["Fragrance carrier"], prods: ["Surface cleaner"],
    target: "2026-12-31",
  },
  {
    name: "Bio-ethanol (agricultural residue)", cas: "64-17-5", cls: "Short-chain alcohol solvent", tag: "Solvents",
    vol: 1600, price: 1.15, ghg: 0.55, status: "qualified", owner: "M. Oyelaran",
    role: "new", etype: "substitution", linkTo: ["Isopropyl alcohol"],
    apps: ["Fragrance carrier"], prods: ["Surface cleaner", "Hand soap"],
    priority: "H2 2026",
  },
  {
    name: "Ethyl lactate", cas: "97-64-3", cls: "Lactate ester solvent", tag: "Solvents",
    vol: 90, price: 3.6, ghg: null, status: "under_evaluation", owner: "L. Haugen",
    role: "new", etype: "new_material", linkTo: ["Propylene glycol", "Isopropyl alcohol"],
    apps: ["Fragrance carrier"], prods: ["Surface cleaner"],
  },
  {
    name: "Orange terpene distillate (circular)", cas: "5989-27-5", cls: "Terpene solvent", tag: "Fragrance",
    vol: 140, price: 4.9, ghg: 0.95, status: "in_testing", owner: "L. Haugen",
    role: "new", linkTo: ["d-Limonene"],
    apps: ["Fragrance carrier"], prods: ["Surface cleaner", "Liquid detergent"],
  },

  // --------------------------------------------- Chelants, preservatives, rheology
  {
    name: "Tetrasodium iminodisuccinate", cas: "144538-83-0", cls: "Biodegradable chelant", tag: "Chelants",
    vol: 310, price: 2.35, ghg: 1.9, status: "in_testing", owner: "M. Oyelaran",
    role: "new", etype: "substitution", linkTo: ["Tetrasodium EDTA"],
    apps: ["Chelation"], prods: ["Liquid detergent", "Surface cleaner"],
    target: "2026-10-31", priority: "H2 2026",
  },
  {
    name: "Sodium polyaspartate", cas: "181828-06-8", cls: "Biodegradable chelant", tag: "Chelants",
    vol: null, price: 3.15, ghg: null, status: "under_evaluation", owner: "M. Oyelaran",
    role: "new", etype: "new_material", linkTo: ["Tetrasodium EDTA", "Sodium citrate"],
    apps: ["Chelation"], prods: ["Liquid detergent"],
  },
  {
    name: "Lactobacillus ferment filtrate", cas: null, cls: "Fermentation-route preservative", tag: "Preservatives",
    vol: 35, price: 9.4, ghg: null, status: "under_evaluation", owner: "N. Kowalczyk",
    role: "new", etype: "new_material", linkTo: ["Phenoxyethanol", "Methylisothiazolinone"],
    apps: ["Preservation"], prods: ["Body wash", "Shampoo base"],
    intel: "requested", intelScope: "Ferment preservative efficacy dossiers",
  },
  {
    name: "Sodium levulinate / anisate blend", cas: null, cls: "Organic acid preservative", tag: "Preservatives",
    vol: 60, price: 6.1, ghg: 1.85, status: "in_testing", owner: "N. Kowalczyk",
    role: "new", etype: "substitution", linkTo: ["Phenoxyethanol", "Benzyl alcohol"],
    apps: ["Preservation"], prods: ["Body wash", "Hand soap"],
  },
  {
    name: "Cellulose nanofibre rheology modifier", cas: "9004-34-6", cls: "Biopolymer thickener", tag: "Rheology",
    vol: 12, price: 16.8, ghg: null, status: "under_evaluation", owner: "A. Vermeer",
    role: "new", etype: "substitution", linkTo: ["Carbomer", "Acrylates copolymer"],
    apps: ["Viscosity control"], prods: ["Hand soap", "Body wash"],
  },
  {
    name: "Sclerotium gum", cas: "39464-87-4", cls: "Biopolymer thickener", tag: "Rheology",
    vol: 22, price: 11.2, ghg: 2.05, status: "not_started", owner: null,
    role: "new", linkTo: [],
    apps: [], prods: ["Hand soap"],
  },
  {
    name: "Rice starch opacifier", cas: "9005-25-8", cls: "Starch opacifier", tag: "Opacifiers",
    vol: 70, price: 2.15, ghg: 1.25, status: "under_evaluation", owner: "A. Vermeer",
    role: "new", etype: "substitution", linkTo: ["Titanium dioxide (rutile)", "Glycol distearate"],
    apps: ["Opacification"], prods: ["Hand soap", "Body wash"],
    intel: "delivered", intelScope: "Non-TiO2 opacifiers for rinse-off",
  },
];


const LOAD_SOURCE = "Customer material master (load 2025-11-20)";
const LOAD_DATE = "2025-11-20";
const ERP_SOURCE = "ERP extract 2026-Q1";
const ERP_DATE = "2026-01-18";

const prov = (
  origin: FieldProvenance["origin"],
  source: string | null,
  date: string | null,
): FieldProvenance => ({ origin, source, date });

const round = (n: number, d = 2) => Number(n.toFixed(d));

const emptyRequirements = (): MaterialRequirements => ({
  target_volume: null,
  price_ceiling: null,
  ghg_reduction_target: null,
  required_certifications: [],
  earliest_need_date: null,
  notes: null,
});

/**
 * VCG signals per material. Deterministic, deliberately uneven: VCG coverage is
 * never complete, and the gap is a real reportable state, not a zero.
 */
const VCG_DATES = ["2025-11-14", "2025-12-03", "2025-12-19", "2026-01-09", "2026-01-27", "2026-02-12"];

interface VcgSignals {
  substitutability_readiness: SubstitutabilityReadiness;
  supplier_availability: SupplierAvailability;
  competitor_activity: CompetitorActivity;
  vcg_data_date: string;
}

function vcgSignalsFor(i: number, name: string): VcgSignals {
  const h = [...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
  const vcg_data_date = VCG_DATES[h % VCG_DATES.length];

  // Roughly eight of the 42 materials have not been assessed at all.
  if (i % 5 === 3) {
    return {
      substitutability_readiness: "not_assessed",
      supplier_availability: { value: null, capped: false, assessed: false },
      competitor_activity: "not_assessed",
      vcg_data_date,
    };
  }

  const bucket = h % 10;
  const readiness: SubstitutabilityReadiness =
    bucket < 4 ? "established" : bucket < 8 ? "emerging" : "none_found";

  // Established paths carry more detected suppliers; none found mostly carries 0.
  const raw =
    readiness === "established"
      ? 4 + (h % 9)
      : readiness === "emerging"
        ? 1 + (h % 5)
        : h % 7 === 0
          ? 1
          : 0;
  const capped = raw > SUPPLIER_CEILING;
  const supplier_availability: SupplierAvailability = {
    value: capped ? SUPPLIER_CEILING + 1 : raw,
    capped,
    assessed: true,
  };

  const competitor_activity: CompetitorActivity = h % 3 === 0 ? "detected" : "none_detected";

  return { substitutability_readiness: readiness, supplier_availability, competitor_activity, vcg_data_date };
}

export const materials: Material[] = rows.map((row, i) => {
  const annual_spend = row.vol !== null && row.price !== null ? round(row.vol * 1000 * row.price, 0) : null;
  const ghg_contribution = row.vol !== null && row.ghg !== null ? round(row.vol * row.ghg, 0) : null;

  const isBlocked = row.status === "parked" || row.status === "rejected";
  const statusDate = `2026-0${(i % 7) + 1}-${String((i % 27) + 1).padStart(2, "0")}`;
  const supplierSpecific = i % 4 === 1;
  const enteredPrice = i % 5 === 0;

  const unknown = new Set(row.unknownOrigin ?? []);
  const p: Record<string, FieldProvenance> = {};
  const put = (field: string, value: unknown, provenance: FieldProvenance) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value) && value.length === 0) return;
    p[field] = unknown.has(field) ? prov("unknown", null, null) : provenance;
  };

  const loaded = prov("ingested", LOAD_SOURCE, LOAD_DATE);
  const erp = prov("ingested", ERP_SOURCE, ERP_DATE);

  // Identity, as loaded from their file.
  put("name", row.name, loaded);
  put("cas_number", row.cas, loaded);
  put("material_class", row.cls, loaded);
  put("tags", [row.tag], loaded);
  put("customer_material_ids", ["x"], loaded);
  put("application_categories", categoriesFor(row), loaded);
  put("application_areas", row.prods, loaded);
  // Role and replacement type are company-entered choices, never ingested or computed.
  p.role = prov("entered", row.owner ?? "Category buyer", LOAD_DATE);
  const entryType = row.role === "new" ? migrateEntryType(row.etype ?? null) : null;
  if (entryType !== null) p.entry_type = prov("entered", row.owner ?? "Category buyer", LOAD_DATE);

  // Measured figures.
  put("annual_volume", row.vol, erp);
  put(
    "unit_price",
    row.price,
    enteredPrice ? prov("entered", "Category buyer estimate", "2026-02-06") : erp,
  );
  put("annual_spend", annual_spend, prov("computed", "annual volume x unit price", ERP_DATE));
  const ghgProv = supplierSpecific
    ? prov("entered", "Supplier questionnaire", "2025-11-30")
    : prov("ingested", "ecoinvent 3.10", "2025-11-30");
  put("ghg_emission_factor", row.ghg, ghgProv);
  put("ghg_contribution", ghg_contribution, prov("computed", "emission factor x annual volume", ERP_DATE));
  put("ghg_boundary", row.ghg !== null ? "Cradle-to-gate (A1-A3)" : null, ghgProv);
  put("ghg_data_basis", row.ghg !== null ? (supplierSpecific ? "Supplier-specific" : "Secondary database") : null, ghgProv);
  // VCG signals share one data date per material.
  const vcg = vcgSignalsFor(i, row.name);
  const vcgProv = prov("computed", "VCG data peek", vcg.vcg_data_date);
  p.substitutability_readiness = vcgProv;
  p.supplier_availability = vcgProv;
  p.competitor_activity = vcgProv;

  // Positions and decisions.
  const decided = prov("entered", row.owner ?? "System import", statusDate);
  put("journey_status", migrateJourneyStatus(row.status), row.status === "not_started" ? loaded : decided);
  put("owner", row.owner, decided);
  put("priority_period", row.priority ?? null, decided);
  put("intelligence_status", row.intel && row.intel !== "not_ordered" ? row.intel : null, decided);

  const intel: IntelligenceStatus = row.intel ?? "not_ordered";
  const orderedDate = intel === "not_ordered" ? null : `2026-0${(i % 5) + 1}-${String((i % 20) + 5).padStart(2, "0")}`;

  return {
    material_id: `MAT-${String(i + 1).padStart(4, "0")}`,
    customer_material_ids:
      i % 6 === 0
        ? [`SKU-${10000 + i * 7}`, `SKU-${10000 + i * 7 + 3}`, `SKU-${10000 + i * 7 + 11}`]
        : i % 3 === 0
          ? [`SKU-${20000 + i * 5}`, `SKU-${20000 + i * 5 + 2}`]
          : [`SKU-${30000 + i * 3}`],
    name: row.name,
    cas_number: row.cas,
    material_class: row.cls,
    /** The book the company buys today, plus the candidates set against it. */
    role: row.role === "new" ? ("new" as const) : ("existing" as const),
    /** Links are filled in below, from both sides of each pair. */
    linked_material_ids: [],
    tags: [row.tag],
    product_lines: [],
    application_categories: categoriesFor(row),
    application_areas: row.prods,
    /** Replacement type belongs to candidates only. Existing materials hold none. */
    entry_type: entryType,
    requirements: (() => {
      const base = row.req ? { ...emptyRequirements(), ...row.req } : null;
      // Migrate the old `target` field into earliest_need_date when the
      // requirements don't already state one.
      if (row.target && (!base || base.earliest_need_date === null)) {
        return { ...(base ?? emptyRequirements()), earliest_need_date: row.target };
      }
      return base;
    })(),
    annual_volume: row.vol,
    unit_price: row.price,
    annual_spend,
    ghg_emission_factor: row.ghg,
    ghg_contribution,
    ghg_boundary: row.ghg !== null ? "Cradle-to-gate (A1-A3)" : null,
    ghg_data_basis: row.ghg !== null ? (supplierSpecific ? "Supplier-specific" : "Secondary database") : null,
    substitutability_readiness: vcg.substitutability_readiness,
    supplier_availability: vcg.supplier_availability,
    competitor_activity: vcg.competitor_activity,
    vcg_data_date: vcg.vcg_data_date,
    journey_status: migrateJourneyStatus(row.status),
    ...EMPTY_GATE,
    gate_conditions: [],
    blocker_category: isBlocked ? (row.status === "rejected" ? "Regulatory / compliance" : "Supply availability") : null,
    blocker_detail: isBlocked
      ? row.status === "rejected"
        ? "Substance under restriction review; substitution mandated instead of re-sourcing."
        : "No renewable grade meets the sensory and stability spec at the volumes we run."
      : null,
    blocker_date: isBlocked ? statusDate : null,
    blocker_condition: isBlocked
      ? row.status === "rejected"
        ? "Reopen if an approved-use derogation is granted."
        : "Reopen if a supplier qualifies a bio-based grade within spec."
      : null,
    owner: row.owner,
    priority_period: row.priority ?? null,
    intelligence_status: intel,
    intelligence_ordered_date: orderedDate,
    intelligence_delivered_date: intel === "delivered" ? `2026-0${(i % 4) + 4}-${String((i % 24) + 4).padStart(2, "0")}` : null,
    intelligence_scope: row.intelScope ?? null,
    last_status_change_date: row.status === "not_started" ? null : statusDate,
    last_status_user: row.status === "not_started" ? null : (row.owner ?? "System import"),
    last_change_batch_origin: row.status === "not_started" ? "baselining" : "real_transition",
    provenance: p,
  };
});

/**
 * A rendered value with no provenance entry is a defect, not a state. Checked in
 * development so the seed can never drift back into printing "not recorded" for
 * a field that plainly holds a value.
 */
const PROVENANCE_TRACKED: (keyof Material)[] = [
  "name",
  "cas_number",
  "material_class",
  "tags",
  "application_categories",
  "application_areas",
  "annual_volume",
  "unit_price",
  "annual_spend",
  "ghg_emission_factor",
  "ghg_contribution",
  "ghg_boundary",
  "ghg_data_basis",
  "owner",
];

export function findMissingProvenance(list: Material[] = materials): string[] {
  const gaps: string[] = [];
  list.forEach((m) => {
    PROVENANCE_TRACKED.forEach((f) => {
      const v = m[f] as unknown;
      const populated = Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "";
      if (populated && !m.provenance[f as string]) gaps.push(`${m.material_id}.${String(f)}`);
    });
  });
  return gaps;
}

if (import.meta.env.DEV) {
  const gaps = findMissingProvenance();
  if (gaps.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[material register] values rendered without provenance: ${gaps.join(", ")}`);
  }
}
