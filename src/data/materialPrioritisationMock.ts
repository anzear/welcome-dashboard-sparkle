import type { FieldProvenance, JourneyStatus, Material } from "@/types/materialPrioritisation";

type Row = [
  name: string,
  cas: string | null,
  materialClass: string | null,
  group: string | null,
  volume: number | null,
  price: number | null,
  ghgFactor: number | null,
  suppliers: number | null,
  countries: string[],
  status: JourneyStatus,
  owner: string | null,
];

const rows: Row[] = [
  // Solvents
  ["Propylene glycol", "57-55-6", "Glycol solvent", "Solvents", 4200, 1.42, 3.1, 4, ["DE", "BE", "US"], "under_evaluation", "L. Haugen"],
  ["Dipropylene glycol methyl ether", "34590-94-8", "Glycol ether solvent", "Solvents", 860, 2.35, null, 2, ["NL", "US"], "not_started", null],
  ["Isopropyl alcohol", "67-63-0", "Short-chain alcohol solvent", "Solvents", 6100, 1.08, 1.85, 5, ["DE", "SA", "CN"], "sourcing", "M. Oyelaran"],
  ["Ethyl acetate", "141-78-6", "Acetate ester solvent", "Solvents", 2750, 1.21, 2.4, 3, ["FR", "IN"], "not_started", null],
  ["N-Methyl-2-pyrrolidone", "872-50-4", "Lactam solvent", "Solvents", 320, 4.6, 6.2, 1, ["DE"], "rejected", "K. Brandt"],
  ["Dimethyl glutarate", "1119-40-0", "Dibasic ester solvent", "Solvents", 180, 3.95, null, 1, ["FR"], "not_started", null],
  ["d-Limonene", "5989-27-5", "Terpene solvent", "Solvents", 240, 5.4, 1.15, 2, ["BR", "US"], "in_testing", "L. Haugen"],
  ["Butyl glycol", "111-76-2", "Glycol ether solvent", "Solvents", 1400, 1.77, 2.95, 3, ["DE", "BE"], "not_started", null],

  // Surfactants — family concentration on alkyl polyglucoside
  ["Coco glucoside", "141464-42-8", "Alkyl polyglucoside", "Surfactants", 950, 2.1, 1.9, 3, ["DE", "MY"], "qualified", "S. Rautio"],
  ["Decyl glucoside", "141464-42-8", "Alkyl polyglucoside", "Surfactants", 610, 2.28, 1.95, 2, ["DE", "MY"], "in_use", "S. Rautio"],
  ["Lauryl glucoside", "110615-47-9", "Alkyl polyglucoside", "Surfactants", 430, 2.34, null, 2, ["FR", "ID"], "under_evaluation", "S. Rautio"],
  ["Caprylyl glucoside", "68515-73-1", "Alkyl polyglucoside", "Surfactants", 155, 2.75, 2.05, 1, ["DE"], "not_started", null],
  ["Sodium laureth sulfate", "9004-82-4", "Ethoxylated alkyl sulfate", "Surfactants", 3100, 1.35, 2.6, 4, ["DE", "TR", "MY"], "under_evaluation", "M. Oyelaran"],
  ["Cocamidopropyl betaine", "61789-40-0", "Amphoteric betaine", "Surfactants", 1850, 1.68, 2.2, 3, ["DE", "MY"], "not_started", null],
  ["C12-C14 fatty alcohol", "80206-82-2", "C12-C14 fatty alcohol", "Surfactants", 2400, 1.95, 2.85, 3, ["MY", "ID", "DE"], "sourcing", "K. Brandt"],
  ["Nonylphenol ethoxylate", "9016-45-9", "Alkylphenol ethoxylate", "Surfactants", 210, 2.05, 3.4, 1, ["CN"], "parked", "K. Brandt"],

  // Plasticisers
  ["Diisononyl phthalate", "28553-12-0", "Phthalate ester", "Plasticisers", 5400, 1.62, 2.75, 3, ["DE", "PL"], "under_evaluation", "R. Delacroix"],
  ["Dioctyl terephthalate", "6422-86-2", "Terephthalate ester", "Plasticisers", 4800, 1.55, 2.55, 2, ["DE", "KR"], "in_testing", "R. Delacroix"],
  ["Diisobutyl phthalate", "84-69-5", "Phthalate ester", "Plasticisers", 720, 1.85, null, 1, ["PL"], "rejected", "R. Delacroix"],
  ["Acetyl tributyl citrate", "77-90-7", "Citrate ester", "Plasticisers", 380, 3.25, 1.7, 2, ["FR", "US"], "qualified", null],
  ["Epoxidised soybean oil", "8013-07-8", "Epoxidised vegetable oil", "Plasticisers", 640, 2.15, 1.25, 2, ["NL", "AR"], "in_use", "R. Delacroix"],

  // Pigments
  ["Titanium dioxide (rutile)", "13463-67-7", "Titanium dioxide pigment", "Pigments", 3900, 3.05, 8.4, 4, ["DE", "FI", "CN"], "not_started", null],
  ["Carbon black N330", "1333-86-4", "Furnace carbon black", "Pigments", 1250, 1.45, 3.2, 3, ["DE", "IN"], "not_started", null],
  ["Iron oxide red", "1309-37-1", "Synthetic iron oxide pigment", "Pigments", 480, 1.9, null, 2, ["DE", "CN"], "not_started", null],
  ["Copper phthalocyanine blue 15:3", "147-14-8", "Phthalocyanine pigment", "Pigments", 95, 12.4, 9.6, 1, ["CN"], "under_evaluation", "A. Vermeer"],
  ["Ultramarine blue", "57455-37-5", "Ultramarine pigment", "Pigments", 60, null, 4.1, 1, ["DE"], "not_started", null],

  // Resins
  ["Bisphenol A epoxy resin", "25068-38-6", "Bisphenol A epoxy resin", "Resins", 2100, 3.4, 5.8, 3, ["DE", "KR"], "under_evaluation", "A. Vermeer"],
  ["Styrene acrylic emulsion", null, "Styrene acrylic dispersion", "Resins", 5200, 1.32, 2.35, 4, ["DE", "NL"], "in_testing", "A. Vermeer"],
  ["Alkyd resin (long oil)", "63148-69-6", "Alkyd resin", "Resins", 1600, 2.05, null, 2, ["NL", "ES"], "not_started", null],
  ["Rosin ester tackifier", "8050-31-5", "Rosin ester resin", "Resins", 420, 2.85, 1.35, 2, ["CN", "BR"], "qualified", null],
  ["Polyurethane dispersion", null, "Aliphatic polyurethane dispersion", "Resins", 780, 4.2, 4.35, 2, ["DE", "US"], "not_started", null],

  // Waxes
  ["Paraffin wax 58/60", "8002-74-2", "Fully refined paraffin wax", "Waxes", 1900, 1.28, 2.9, 3, ["DE", "AE"], "under_evaluation", "N. Kowalczyk"],
  ["Microcrystalline wax", "63231-60-7", "Microcrystalline petroleum wax", "Waxes", 340, 2.4, 3.05, 1, ["US"], "not_started", null],
  ["Carnauba wax T1", "8015-86-9", "Vegetable wax", "Waxes", 85, 9.8, 1.1, 2, ["BR"], "in_use", "N. Kowalczyk"],
  ["Fischer-Tropsch wax", "8002-74-2", "Synthetic hydrocarbon wax", "Waxes", null, 3.15, 3.6, 1, ["ZA"], "parked", "N. Kowalczyk"],

  // Preservatives
  ["Phenoxyethanol", "122-99-6", "Aromatic ether preservative", "Preservatives", 260, 3.55, 3.9, 2, ["DE", "IN"], "not_started", null],
  ["Benzoic acid", "65-85-0", "Aromatic acid preservative", "Preservatives", 410, 1.75, 2.1, 3, ["NL", "CN"], "not_started", null],
  ["Methylisothiazolinone", "2682-20-4", "Isothiazolinone biocide", "Preservatives", null, 14.2, null, 1, ["DE"], "rejected", "S. Rautio"],
  ["Sodium benzoate", "532-32-1", "Benzoate salt preservative", "Preservatives", 320, null, 1.95, 2, ["NL", "CN"], "not_started", null],

  // Chelating agents
  ["Tetrasodium EDTA", "64-02-8", "Aminopolycarboxylate chelant", "Chelating agents", 720, 1.95, 3.35, 3, ["DE", "CN"], "under_evaluation", "M. Oyelaran"],
  ["Trisodium GLDA", "51981-21-6", "Biodegradable chelant", "Chelating agents", null, 2.6, 2.15, 2, ["NL"], "in_testing", "M. Oyelaran"],
  ["Sodium gluconate", "527-07-1", "Gluconate chelant", "Chelating agents", 540, null, 1.45, 2, ["CN", "FR"], "not_started", null],
];

const APPLICATIONS = [
  ["Cleaning formulations", "Personal care"],
  ["Coatings", "Adhesives"],
  ["Lubricants"],
  ["Polymer compounding", "Coatings"],
  ["Personal care"],
  ["Industrial cleaning", "Coatings"],
];

const PRODUCTS = [
  ["Hard surface cleaners"],
  ["Waterborne architectural paint", "Wood coatings"],
  ["PVC compounds", "Flooring"],
  ["Shampoo base", "Body wash"],
  ["Hot-melt adhesives"],
  ["Automotive refinish"],
];

const prov = (
  origin: FieldProvenance["origin"],
  source: string | null,
  date: string | null,
): FieldProvenance => ({ origin, source, date });

const round = (n: number, d = 2) => Number(n.toFixed(d));

export const materials: Material[] = rows.map((row, i) => {
  const [name, cas, materialClass, group, volume, price, ghgFactor, suppliers, countries, status, owner] = row;

  const annual_spend = volume !== null && price !== null ? round(volume * 1000 * price, 0) : null;
  const ghg_contribution = volume !== null && ghgFactor !== null ? round(volume * ghgFactor, 0) : null;

  const isBlocked = status === "parked" || status === "rejected";
  const statusDate = `2026-0${(i % 7) + 1}-${String((i % 27) + 1).padStart(2, "0")}`;

  const provenance: Record<string, FieldProvenance> = {
    annual_volume: prov("ingested", "ERP extract 2026-Q1", "2026-01-18"),
    unit_price: prov(i % 5 === 0 ? "entered" : "ingested", i % 5 === 0 ? "Category buyer estimate" : "ERP extract 2026-Q1", "2026-01-18"),
    annual_spend: prov("computed", "volume x unit price", "2026-01-18"),
    ghg_emission_factor: prov(
      i % 4 === 1 ? "entered" : "ingested",
      i % 4 === 1 ? "Supplier questionnaire" : "ecoinvent 3.10",
      "2025-11-30",
    ),
    ghg_contribution: prov("computed", "emission factor x volume", "2026-01-18"),
    supplier_count: prov("ingested", "Procurement master data", "2026-02-02"),
  };

  return {
    material_id: `MAT-${String(i + 1).padStart(4, "0")}`,
    customer_material_ids:
      i % 6 === 0
        ? [`SKU-${10000 + i * 7}`, `SKU-${10000 + i * 7 + 3}`, `SKU-${10000 + i * 7 + 11}`]
        : i % 3 === 0
          ? [`SKU-${20000 + i * 5}`, `SKU-${20000 + i * 5 + 2}`]
          : [`SKU-${30000 + i * 3}`],
    name,
    cas_number: cas,
    material_class: materialClass,
    customer_material_group: group,
    application_categories: APPLICATIONS[i % APPLICATIONS.length],
    product_categories: PRODUCTS[i % PRODUCTS.length],
    entry_type: i % 9 === 4 ? "new_material" : "substitute_material_source",
    annual_volume: volume,
    unit_price: price,
    annual_spend,
    ghg_emission_factor: ghgFactor,
    ghg_contribution,
    ghg_boundary: ghgFactor !== null ? "Cradle-to-gate (A1-A3)" : null,
    ghg_data_basis: ghgFactor !== null ? (i % 4 === 1 ? "Supplier-specific" : "Secondary database") : null,
    supplier_count: suppliers,
    supplier_countries: countries,
    journey_status: status,
    blocker_category: isBlocked ? (status === "rejected" ? "Regulatory restriction" : "No qualified alternative") : null,
    blocker_detail: isBlocked
      ? status === "rejected"
        ? "Substance under REACH authorisation review; substitution mandated instead of re-sourcing."
        : "No renewable grade meets the specified drop point tolerance."
      : null,
    blocker_date: isBlocked ? statusDate : null,
    blocker_condition: isBlocked
      ? status === "rejected"
        ? "Reopen if an approved-use derogation is granted."
        : "Reopen if a supplier qualifies a bio-based grade within spec."
      : null,
    owner,
    priority_selected: i % 5 === 1,
    priority_period: i % 5 === 1 ? (i % 2 === 0 ? "H2 2026" : "H1 2027") : null,
    last_status_change_date: status === "not_started" ? null : statusDate,
    last_status_user: status === "not_started" ? null : (owner ?? "System import"),
    last_change_batch_origin: status === "not_started" ? "baselining" : "real_transition",
    provenance,
  };
});
