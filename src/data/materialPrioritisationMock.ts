import { migrateJourneyStatus } from "@/types/materialPrioritisation";
import type {
  FieldProvenance,
  IntelligenceStatus,
  JourneyStatus,
  Material,
  MaterialRequirements,
} from "@/types/materialPrioritisation";

/**
 * One customer: a personal care and home care formulator. Every material's
 * applications (what it does in the formulation) and products (their SKU lines)
 * are plausible together — no industrial coatings, no shampoo in a PVC compound.
 *
 * The deliberate data spread is kept: missing figures, rank divergence, family
 * concentration on the alkyl polyglucosides, unscored materials, and several
 * materials with NO applications recorded — which is missing, not zero.
 */

/** Function in the formulation. */
type Application =
  | "Emulsification"
  | "Preservation"
  | "Chelation"
  | "Opacification"
  | "Surfactancy"
  | "Viscosity control"
  | "Fragrance carrier";

/** Their SKU lines. */
type Product =
  | "Shampoo base"
  | "Body wash"
  | "Liquid detergent"
  | "Surface cleaner"
  | "Hand soap"
  | "Conditioner";

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
  put("application_categories", row.apps, loaded);
  put("product_categories", row.prods, loaded);
  p.entry_type = loaded;

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
  put("supplier_count", row.sup, prov("ingested", "Procurement master data", "2026-02-02"));
  put("supplier_countries", row.countries, prov("ingested", "Procurement master data", "2026-02-02"));

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
    tags: [row.tag],
    application_categories: row.apps,
    product_categories: row.prods,
    entry_type: i % 9 === 4 ? "substitution" : "drop_in",
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
    supplier_count: row.sup,
    supplier_countries: row.countries,
    journey_status: migrateJourneyStatus(row.status),
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
  "product_categories",
  "annual_volume",
  "unit_price",
  "annual_spend",
  "ghg_emission_factor",
  "ghg_contribution",
  "ghg_boundary",
  "ghg_data_basis",
  "supplier_count",
  "supplier_countries",
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
