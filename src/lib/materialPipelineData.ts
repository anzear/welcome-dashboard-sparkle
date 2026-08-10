// Reads the existing material portfolio records and their brief state.
// No new storage is introduced here — this only projects the data we already
// have (portfolio entries + material_brief_v2_* state) into row shapes.

export type PipelineCategory = "Feedstock" | "Product";
export type EntryType = "Source" | "Produce" | "Valorise";

export const DRIVER_KEYS = [
  "regulatory",
  "supplySecurity",
  "internalMandate",
  "performanceUpside",
  "marketPull",
  "marketingClaim",
  "sustainabilityImprovement",
  "costOpportunity",
] as const;
export type DriverKey = (typeof DRIVER_KEYS)[number];

export const DRIVER_LABELS: Record<DriverKey, string> = {
  regulatory: "Regulatory pressure",
  supplySecurity: "Supply security",
  internalMandate: "Internal mandate",
  performanceUpside: "Performance upside",
  marketPull: "Market pull",
  marketingClaim: "Marketing claim",
  sustainabilityImprovement: "Sustainability improvement",
  costOpportunity: "Cost / economic opportunity",
};

export type MaterialRow = {
  id: string;
  name: string;
  category: PipelineCategory;
  materialClass: string;
  entryType: EntryType;
  customerMaterialIds: string;
  customerMaterialGroup: string;
  applicationCategories: string[];
  annualVolume: number | null; // t/yr
  unitPrice: number | null; // EUR/kg
  unitPriceComputed: boolean;
  annualSpend: number | null; // EUR
  annualSpendComputed: boolean;
  ghgFactor: number | null; // kgCO2e/kg
  ghgFactorComputed: boolean;
  ghgContribution: number | null; // tCO2e/yr
  ghgContributionComputed: boolean;
  supplierCount: number | null;
  journeyStatus: string;
  owner: string;
  prioritySelected: boolean;
  priorityPeriod: string;
  applicationCount: number | null;
  driverTotal: number | null; // sum of the eight driver ratings (0-40)
  drivers: Record<DriverKey, number | null>; // individual driver ratings (0-5)
  intent: "replace" | "introduce" | null; // Substitute Source vs Introduce new material
  href: string;
};

export const JOURNEY_STATUS_META: Record<string, { label: string; chip: string }> = {
  not_started: { label: "Not started", chip: "bg-muted text-muted-foreground border-border" },
  under_evaluation: { label: "Under evaluation", chip: "bg-sky-500/10 text-sky-700 border-sky-500/30" },
  in_testing: { label: "In testing", chip: "bg-violet-500/10 text-violet-700 border-violet-500/30" },
  qualified: { label: "Qualified", chip: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  sourcing: { label: "Sourcing", chip: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  in_use: { label: "In-use", chip: "bg-teal-500/10 text-teal-700 border-teal-500/30" },
  parked: { label: "Parked", chip: "bg-muted text-muted-foreground border-border" },
  rejected: { label: "Rejected", chip: "bg-rose-500/10 text-rose-700 border-rose-500/30" },
};

const num = (v: unknown): number | null => {
  if (v === "" || v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const readJson = (key: string): any => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

function projectRow(raw: any, category: PipelineCategory): MaterialRow | null {
  const name = typeof raw === "string" ? raw : raw?.name;
  if (!name || name === "K") return null;

  const brief = readJson(`material_brief_v2_${category}_${name}`) || {};
  const details = brief.details || {};
  const scoring = brief.scoring || {};
  const team: any[] = Array.isArray(brief.team) ? brief.team : [];

  const applicationCategories: string[] = Array.isArray(details.applicationAreas)
    ? details.applicationAreas.filter(Boolean)
    : [];

  const volume = num(scoring.volume);

  // Spend: entered either per ton or as an annual total.
  const spendInput = num(scoring.spend);
  let unitPrice: number | null = null;
  let unitPriceComputed = false;
  let annualSpend: number | null = null;
  let annualSpendComputed = false;
  if (spendInput != null) {
    if (scoring.spendMode === "total") {
      annualSpend = spendInput;
      if (volume != null && volume > 0) {
        unitPrice = spendInput / (volume * 1000);
        unitPriceComputed = true;
      }
    } else {
      unitPrice = spendInput / 1000; // EUR per ton -> EUR per kg
      if (volume != null) {
        annualSpend = unitPrice * volume * 1000;
        annualSpendComputed = true;
      }
    }
  }

  // GHG: entered either as a factor per ton/kg or as an annual total.
  const ghgInput = num(scoring.ghg);
  let ghgFactor: number | null = null;
  let ghgFactorComputed = false;
  let ghgContribution: number | null = null;
  let ghgContributionComputed = false;
  if (ghgInput != null) {
    if (scoring.ghgMode === "total") {
      ghgContribution = ghgInput;
      if (volume != null && volume > 0) {
        ghgFactor = ghgInput / volume;
        ghgFactorComputed = true;
      }
    } else {
      ghgFactor = ghgInput;
      if (volume != null) {
        ghgContribution = ghgInput * volume;
        ghgContributionComputed = true;
      }
    }
  }

  const ownerMember = team.find((m) => m?.id === details.transitionOwnerId);
  const owner = ownerMember?.name || team.find((m) => m?.role === "Owner")?.name || "";

  return {
    id: `${category}::${name}`,
    name,
    category,
    materialClass: details.category || "",
    entryType: (raw?.objective as EntryType) || (category === "Feedstock" ? "Source" : "Produce"),
    customerMaterialIds: typeof raw?.synonyms === "string" ? raw.synonyms : "",
    customerMaterialGroup: applicationCategories[0] || "",
    applicationCategories,
    annualVolume: volume,
    unitPrice,
    unitPriceComputed,
    annualSpend,
    annualSpendComputed,
    ghgFactor,
    ghgFactorComputed,
    ghgContribution,
    ghgContributionComputed,
    supplierCount: num(scoring.supplierCount),
    journeyStatus: typeof brief.workStatus === "string" ? brief.workStatus : "not_started",
    owner,
    prioritySelected: brief.prioritySelected === "yes",
    priorityPeriod: typeof brief.priorityPeriod === "string" ? brief.priorityPeriod : "",
    applicationCount: applicationCategories.length ? applicationCategories.length : null,
    intent: details.intent === "replace" || details.intent === "introduce" ? details.intent : null,
    driverTotal: (() => {
      const stars = scoring.stars && typeof scoring.stars === "object" ? scoring.stars : null;
      if (!stars) return null;
      const vals = Object.values(stars).map((v) => num(v) ?? 0);
      const sum = vals.reduce((a, b) => a + b, 0);
      return sum > 0 ? sum : null;
    })(),
    drivers: (() => {
      const stars = scoring.stars && typeof scoring.stars === "object" ? scoring.stars : {};
      const out = {} as Record<DriverKey, number | null>;
      DRIVER_KEYS.forEach((k) => {
        const v = num((stars as any)[k]);
        out[k] = v != null && v > 0 ? v : null;
      });
      return out;
    })(),
    href: `/landscape/${encodeURIComponent(category)}/${encodeURIComponent(name)}/material-brief-simple`,
  };
}

export function loadMaterialRows(): MaterialRow[] {
  if (typeof window === "undefined") return [];
  const out: MaterialRow[] = [];
  ([
    ["portfolio_feedstock", "Feedstock"],
    ["portfolio_product", "Product"],
  ] as const).forEach(([key, category]) => {
    const arr = readJson(key);
    if (Array.isArray(arr)) {
      arr.forEach((raw) => {
        const row = projectRow(raw, category);
        if (row) out.push(row);
      });
    }
  });
  return out;
}
