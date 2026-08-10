// Fake demo rows for the Material Pipeline list.
// These are display-only and never written into the real portfolio storage.
import { DRIVER_KEYS, type DriverKey, type MaterialRow } from "./materialPipelineData";

export const DEMO_FLAG_KEY = "material_pipeline_demo_rows";

type Seed = {
  name: string;
  materialClass: string;
  entryType: MaterialRow["entryType"];
  category: MaterialRow["category"];
  ids: string;
  group: string;
  apps: string[];
  volume: number | null;
  pricePerKg: number | null;
  ghgFactor: number | null;
  suppliers: number | null;
  status: string;
  owner: string;
  priority?: string | false;
};

const SEEDS: Seed[] = [
  { name: "Bio-based 1,3-Propanediol", materialClass: "Diol", entryType: "Source", category: "Feedstock", ids: "PDO-1042", group: "Personal care", apps: ["Personal care", "Coatings", "Textiles"], volume: 4200, pricePerKg: 2.35, ghgFactor: 1.8, suppliers: 3, status: "under_evaluation", owner: "A. Novak", priority: "H2 2026" },
  { name: "Recycled PET Flake", materialClass: "Polyester", entryType: "Source", category: "Feedstock", ids: "RPET-220", group: "Packaging", apps: ["Packaging", "Textiles"], volume: 18500, pricePerKg: 1.12, ghgFactor: 0.9, suppliers: 7, status: "sourcing", owner: "M. Fischer" },
  { name: "Succinic Acid", materialClass: "Dicarboxylic acid", entryType: "Source", category: "Feedstock", ids: "SUC-081", group: "Polymers", apps: ["Polymers", "Coatings"], volume: 2600, pricePerKg: 2.9, ghgFactor: 2.4, suppliers: 2, status: "in_testing", owner: "L. Rossi" },
  { name: "Cellulose Nanofibre", materialClass: "Biopolymer", entryType: "Produce", category: "Product", ids: "CNF-014", group: "Composites", apps: ["Composites", "Packaging", "Coatings", "Paper"], volume: 320, pricePerKg: 14.5, ghgFactor: 3.1, suppliers: 1, status: "under_evaluation", owner: "A. Novak" },
  { name: "Sunflower Lecithin", materialClass: "Phospholipid", entryType: "Source", category: "Feedstock", ids: "LEC-556", group: "Food ingredients", apps: ["Food", "Personal care"], volume: 900, pricePerKg: 4.1, ghgFactor: 1.3, suppliers: 4, status: "qualified", owner: "S. Dubois", priority: "H1 2027" },
  { name: "Bio-Ethylene", materialClass: "Olefin", entryType: "Produce", category: "Product", ids: "BET-330", group: "Polymers", apps: ["Polymers"], volume: 26000, pricePerKg: 1.65, ghgFactor: 0.6, suppliers: 2, status: "not_started", owner: "M. Fischer" },
  { name: "Chitin from Insect Frass", materialClass: "Biopolymer", entryType: "Valorise", category: "Feedstock", ids: "CHT-902", group: "Agriculture", apps: ["Agriculture", "Personal care"], volume: null, pricePerKg: null, ghgFactor: 2.0, suppliers: 1, status: "under_evaluation", owner: "L. Rossi" },
  { name: "Bio-Naphtha", materialClass: "Hydrocarbon", entryType: "Source", category: "Feedstock", ids: "BNP-118", group: "Polymers", apps: ["Polymers", "Fuels"], volume: 12000, pricePerKg: 1.95, ghgFactor: 0.4, suppliers: 5, status: "in_use", owner: "S. Dubois" },
  { name: "Rice Husk Silica", materialClass: "Mineral", entryType: "Valorise", category: "Feedstock", ids: "RHS-047", group: "Rubber", apps: ["Rubber", "Composites"], volume: 5400, pricePerKg: 0.85, ghgFactor: 0.7, suppliers: 3, status: "parked", owner: "A. Novak" },
  { name: "Isobutanol", materialClass: "Alcohol", entryType: "Produce", category: "Product", ids: "IBA-771", group: "Solvents", apps: ["Solvents", "Coatings", "Fuels"], volume: 3100, pricePerKg: 2.05, ghgFactor: 1.6, suppliers: null, status: "rejected", owner: "M. Fischer" },
  { name: "Mycelium Leather Substrate", materialClass: "Biocomposite", entryType: "Produce", category: "Product", ids: "MYC-206", group: "Textiles", apps: ["Textiles", "Automotive"], volume: 45, pricePerKg: null, ghgFactor: null, suppliers: 1, status: "under_evaluation", owner: "S. Dubois", priority: "H2 2026" },
  { name: "Bio-based Adipic Acid", materialClass: "Dicarboxylic acid", entryType: "Source", category: "Feedstock", ids: "ADP-388", group: "Polymers", apps: ["Polymers", "Coatings", "Textiles"], volume: 7600, pricePerKg: 2.6, ghgFactor: 2.9, suppliers: 2, status: "in_testing", owner: "L. Rossi" },
];

// Deterministic pseudo driver totals so the demo compare view has crossings.
function hashOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000;
  return h;
}

function driversFor(name: string): Record<DriverKey, number | null> {
  const out = {} as Record<DriverKey, number | null>;
  DRIVER_KEYS.forEach((k, i) => {
    const h = hashOf(name + k + i);
    out[k] = h % 11 === 0 ? null : 1 + (h % 5);
  });
  return out;
}

function driverTotalFor(name: string): number | null {
  const h = hashOf(name);
  if (h % 7 === 0) return null; // some materials simply have no ratings yet
  return 8 + (h % 33);
}

export function getDemoRows(): MaterialRow[] {
  return SEEDS.map((s) => {
    const spend = s.volume != null && s.pricePerKg != null ? s.pricePerKg * s.volume * 1000 : null;
    const ghgContribution = s.volume != null && s.ghgFactor != null ? s.ghgFactor * s.volume : null;
    return {
      id: `demo::${s.name}`,
      name: s.name,
      category: s.category,
      materialClass: s.materialClass,
      entryType: s.entryType,
      customerMaterialIds: s.ids,
      customerMaterialGroup: s.group,
      applicationCategories: s.apps,
      annualVolume: s.volume,
      unitPrice: s.pricePerKg,
      unitPriceComputed: false,
      annualSpend: spend,
      annualSpendComputed: spend != null,
      ghgFactor: s.ghgFactor,
      ghgFactorComputed: false,
      ghgContribution,
      ghgContributionComputed: ghgContribution != null,
      supplierCount: s.suppliers,
      journeyStatus: s.status,
      owner: s.owner,
      prioritySelected: !!s.priority,
      priorityPeriod: typeof s.priority === "string" ? s.priority : "",
      applicationCount: s.apps.length ? s.apps.length : null,
      driverTotal: driverTotalFor(s.name),
      drivers: driversFor(s.name),
      intent: s.entryType === "Source" ? "replace" : "introduce",
      href: `/landscape/${encodeURIComponent(s.category)}/${encodeURIComponent(s.name)}/material-brief-simple`,
      isDemo: true,
    } as MaterialRow & { isDemo: true };
  });
}
