import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ReviewStatus = "accepted" | "rejected" | "review_pending";
export type PathwayStatus = "approved" | "needs_approval" | "locked" | "hidden" | "deleted";
export type VisibilityScope = "all" | string[];
export type CompanyRole = "feedstock_supplier" | "product_manufacturer" | "application_offtaker";
export type IndicatorName = "GHG impact" | "Yield" | "Technology TRL" | "Pathway TRL" | "Feedstock availability" | "Price" | "EU market size" | "Global market size" | "CAGR";
export type AuditEntityType = "pathway" | "company" | "company_match" | "paper_patent_match" | "indicator_value";
export type AuditOperation = "create" | "update" | "deactivate" | "link_add" | "link_remove" | "accept" | "reject" | "revert";
export const STALENESS_DAYS = 180;

export interface CommonRecord {
  id: string;
  created_at: string;
  updated_at: string;
  status_changed_at: string;
  last_actor: string | null;
  trace_id: string | null;
}
export interface Pathway extends CommonRecord {
  feedstock: string;
  process_technology: string;
  product: string;
  application_market: string;
  status: PathwayStatus;
  group: string | null;
  visibility_scope: VisibilityScope;
}
export interface Company extends CommonRecord {
  name: string;
  website: string | null;
  registry_id: string | null;
  hq_city: string | null;
  country: string | null;
  profile_fields: Record<string, string | number | null>;
}
export interface CompanyMatch extends CommonRecord {
  company_id: string;
  company_name: string;
  pathway_id: string;
  role: CompanyRole;
  status: ReviewStatus;
  note: string | null;
  evidence: string | null;
}
export interface PaperPatentMatch extends CommonRecord {
  kind: "paper" | "patent";
  external_id: string;
  title: string;
  pathway_id: string;
  status: ReviewStatus;
  matched_at: string;
  note: string | null;
  year: number | null;
  authors_or_assignee: string | null;
  abstract: string | null;
  source: "Semantic Scholar" | "USPTO" | null;
}
export interface IndicatorValue extends CommonRecord {
  pathway_id: string;
  indicator: IndicatorName;
  value: number | null;
  unit: string | null;
  value_date: string | null;
  status: ReviewStatus;
  corrected_value: number | null;
  correction_note: string | null;
  corrected_at: string | null;
}

export const displayedValue = (indicatorValue: IndicatorValue): number | null => {
  if (indicatorValue.corrected_value !== null) return indicatorValue.corrected_value;
  if (indicatorValue.status === "rejected") return null;
  return indicatorValue.value;
};

export const isStale = (indicatorValue: IndicatorValue): boolean => {
  if (indicatorValue.corrected_at === null) return false;
  const correctedAt = new Date(indicatorValue.corrected_at).getTime();
  return Number.isFinite(correctedAt) && Date.now() - correctedAt > STALENESS_DAYS * 86_400_000;
};
export interface AuditEntry extends CommonRecord {
  timestamp: string;
  actor: string;
  entity_type: AuditEntityType;
  entity_id: string;
  field: string | null;
  prior_value: unknown | null;
  new_value: unknown | null;
  operation: AuditOperation;
  note: string | null;
  reverts_entry_id: string | null;
}
export interface HitlCurrentUser { name: string; role: "Super Admin" | "User"; }
export type HitlRecord = Pathway | Company | CompanyMatch | PaperPatentMatch | IndicatorValue;
export interface RecordChangeInput {
  entity_type: AuditEntityType;
  entity_id: string;
  field: string | null;
  prior_value: unknown | null;
  new_value: unknown | null;
  operation: AuditOperation;
  note?: string | null;
  trace_id?: string | null;
  reverts_entry_id?: string | null;
}

const readField = (record: HitlRecord, field: string): unknown => {
  const [root, nested] = field.split(".");
  if (root === "profile_fields" && nested && "profile_fields" in record) return record.profile_fields[nested] ?? null;
  return root in record ? record[root as keyof HitlRecord] : null;
};

const writeField = <T extends HitlRecord>(record: T, field: string, value: unknown): T => {
  const [root, nested] = field.split(".");
  if (root === "profile_fields" && nested && "profile_fields" in record) {
    return { ...record, profile_fields: { ...record.profile_fields, [nested]: value } } as T;
  }
  return { ...record, [field]: value } as T;
};

const iso = (day: number, hour = 9) => `2026-09-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00.000Z`;
const common = (id: string, day: number, actor: string | null = "Anže", trace: string | null = `trace-${id}-8f4a91c2`) => ({
  id, created_at: iso(Math.max(1, day - 3)), updated_at: iso(day), status_changed_at: iso(day), last_actor: actor, trace_id: trace,
});

const seedPathways: Pathway[] = [
  { ...common("pw-001", 14), feedstock: "Wheat straw", process_technology: "Steam explosion and enzymatic hydrolysis", product: "Cellulosic ethanol", application_market: "Road transport fuel", status: "needs_approval", group: "Advanced biofuels", visibility_scope: "all" },
  { ...common("pw-002", 13), feedstock: "Kraft lignin", process_technology: "Catalytic depolymerisation", product: "Bio-phenols", application_market: "Phenolic resins", status: "approved", group: "Bio-based chemicals", visibility_scope: "all" },
  { ...common("pw-003", 12), feedstock: "Whey permeate", process_technology: "Fermentation", product: "Lactic acid", application_market: "Biodegradable packaging", status: "needs_approval", group: null, visibility_scope: ["VCG.AI"] },
  { ...common("pw-004", 11, "Jon Goriup", null), feedstock: "Forestry residues", process_technology: "Fast pyrolysis", product: "Bio-oil", application_market: "Industrial heat", status: "locked", group: "Thermochemical routes", visibility_scope: "all" },
  { ...common("pw-005", 10), feedstock: "Sugar beet pulp", process_technology: "Enzymatic hydrolysis and fermentation", product: "Succinic acid", application_market: "Bio-based polymers", status: "approved", group: "Bio-based chemicals", visibility_scope: "all" },
  { ...common("pw-006", 9), feedstock: "Used cooking oil", process_technology: "Hydroprocessing", product: "Renewable diesel", application_market: "Heavy-duty road transport", status: "hidden", group: null, visibility_scope: ["VCG.AI", "BioCampus Straubing GmbH"] },
  { ...common("pw-007", 8, "Jon Goriup", null), feedstock: "Corn stover", process_technology: "Dilute acid pretreatment and fermentation", product: "Cellulosic ethanol", application_market: "Sustainable aviation fuel blending", status: "needs_approval", group: "Advanced biofuels", visibility_scope: "all" },
  { ...common("pw-008", 7), feedstock: "Crude glycerol", process_technology: "Microbial fermentation", product: "1,3-propanediol", application_market: "Polytrimethylene terephthalate", status: "deleted", group: null, visibility_scope: "all" },
  { ...common("pw-009", 6), feedstock: "Miscanthus", process_technology: "Organosolv fractionation", product: "Cellulose pulp", application_market: "Moulded fibre packaging", status: "approved", group: "Fibre products", visibility_scope: "all" },
  { ...common("pw-010", 5), feedstock: "Algal biomass", process_technology: "Lipid extraction and transesterification", product: "Fatty acid methyl esters", application_market: "Marine fuel", status: "needs_approval", group: null, visibility_scope: ["VCG.AI"] },
];

const companyRows = [
  ["Nordic Enzymes", "https://nordic-enzymes.example", "DK-482910", "Copenhagen", "Denmark"],
  ["Rhein BioCarbon", "https://rhein-biocarbon.example", "DE-HRB-77120", "Cologne", "Germany"],
  ["Alpine Fermentation", "https://alpine-fermentation.example", null, "Graz", "Austria"],
  ["Baltic Fibre Works", "https://baltic-fibre.example", "LV-402034", "Riga", "Latvia"],
  ["Circular Oils Europe", null, "NL-908172", "Rotterdam", "Netherlands"],
  ["GreenRoute Fuels", "https://greenroute.example", null, "Ghent", "Belgium"],
  ["Danube Biopolymers", "https://danube-biopolymers.example", "HU-011829", null, "Hungary"],
  ["Atlantic Algae", "https://atlantic-algae.example", "PT-521908", "Porto", "Portugal"],
] as const;
const seedCompanies: Company[] = companyRows.map((row, index) => ({ ...common(`co-${String(index + 1).padStart(3, "0")}`, 13 - index), name: row[0], website: row[1], registry_id: row[2], hq_city: row[3], country: row[4], profile_fields: { employees: index === 2 ? null : 45 + index * 18, founded: 2008 + index } }));

const matchStatuses: ReviewStatus[] = ["review_pending", "accepted", "review_pending", "rejected", "accepted", "review_pending", "accepted", "review_pending", "rejected", "accepted", "review_pending", "accepted"];
const roles: CompanyRole[] = ["feedstock_supplier", "product_manufacturer", "application_offtaker"];
const seedCompanyMatches: CompanyMatch[] = Array.from({ length: 12 }, (_, index) => {
  const company = seedCompanies[index % seedCompanies.length];
  return { ...common(`cm-${String(index + 1).padStart(3, "0")}`, 14 - (index % 8)), company_id: company.id, company_name: company.name, pathway_id: seedPathways[index % seedPathways.length].id, role: roles[index % roles.length], status: matchStatuses[index], note: index % 4 === 0 ? "Confirm commercial activity in Europe" : null, evidence: index % 3 === 0 ? "Company product page and registry filing" : null };
});

const ppStatuses: ReviewStatus[] = ["review_pending", "accepted", "review_pending", "rejected", "review_pending", "accepted", "accepted", "review_pending", "rejected", "review_pending", "accepted", "review_pending"];
const paperTitles = ["Enzymatic fractionation of agricultural residues for advanced biorefineries", "Fermentative conversion of side streams into renewable platform chemicals", "Process intensification routes for circular bio-based production"];
const patentTitles = ["Integrated conversion process for renewable intermediates", "Continuous fermentation system for bio-based organic acids", "Catalytic upgrading of lignocellulosic feedstocks"];
const seedPaperPatentMatches: PaperPatentMatch[] = Array.from({ length: 12 }, (_, index) => {
  const kind = index % 2 === 0 ? "paper" : "patent";
  return {
    ...common(`pp-${String(index + 1).padStart(3, "0")}`, 13 - (index % 7)), kind,
    external_id: kind === "paper" ? `10.1016/j.biortech.202${index}.10${index}42` : `EP${3201400 + index}A1`,
    title: kind === "paper" ? paperTitles[(index / 2) % paperTitles.length] : patentTitles[Math.floor(index / 2) % patentTitles.length],
    pathway_id: seedPathways[index % seedPathways.length].id, status: ppStatuses[index], matched_at: iso(10 + (index % 5)), note: index % 5 === 0 ? "Check pathway specificity" : null,
    year: index === 6 ? null : 2019 + (index % 6),
    authors_or_assignee: index === 9 ? null : kind === "paper" ? ["M. Novak, L. Weber, S. Chen", "A. Rossi, J. Lindström", "E. García, P. Müller"][index % 3] : ["BASF SE", "Novozymes A/S", "Fraunhofer-Gesellschaft"][index % 3],
    abstract: index === 4 ? null : kind === "paper" ? "This study evaluates integrated conversion routes for residual biomass, focusing on resource efficiency, product yield and industrial scale-up constraints." : "A process and apparatus for converting renewable feedstocks into purified bio-based intermediates using an integrated reaction and separation sequence.",
    source: index === 11 ? null : kind === "paper" ? "Semantic Scholar" : "USPTO",
  };
});

const indicators: IndicatorName[] = ["GHG impact", "Yield", "Technology TRL", "Pathway TRL", "Feedstock availability", "Price", "EU market size", "Global market size", "CAGR"];
const units: Record<IndicatorName, string> = { "GHG impact": "kg CO₂e/t", Yield: "%", "Technology TRL": "TRL", "Pathway TRL": "TRL", "Feedstock availability": "kt/yr", Price: "€/t", "EU market size": "€m", "Global market size": "€m", CAGR: "%" };
const indicatorStatuses: ReviewStatus[] = ["review_pending", "accepted", "review_pending", "rejected", "accepted", "review_pending", "accepted", "review_pending", "rejected", "accepted", "review_pending", "accepted", "review_pending", "accepted", "rejected", "review_pending", "accepted", "review_pending", "accepted", "review_pending"];
const seedIndicatorValues: IndicatorValue[] = Array.from({ length: 20 }, (_, index) => {
  const indicator = indicators[index % indicators.length];
  const deliberateValue = index === 2 || index === 15 ? 0 : index === 6 || index === 17 ? null : Number((18.5 + index * 4.7).toFixed(1));
  const correctedValues: Record<number, { value: number; note: string; at: string }> = {
    1: { value: 24.1, note: "Corrected from verified source appendix", at: "2026-01-08T10:00:00.000Z" },
    4: { value: 39.8, note: "Aligned with published regional dataset", at: "2026-02-14T11:30:00.000Z" },
    8: { value: 61.4, note: "Updated against source table", at: "2026-09-13T09:00:00.000Z" },
  };
  const correction = correctedValues[index];
  return { ...common(`iv-${String(index + 1).padStart(3, "0")}`, 14 - (index % 9)), pathway_id: seedPathways[index % seedPathways.length].id, indicator, value: deliberateValue, unit: units[indicator], value_date: index === 17 ? null : iso(1 + (index % 12)), status: indicatorStatuses[index], corrected_value: correction?.value ?? null, correction_note: correction?.note ?? null, corrected_at: correction?.at ?? null };
});

const auditSeed = (id: string, timestamp: string, actor: string, entity_type: AuditEntityType, entity_id: string, field: string | null, prior_value: unknown, new_value: unknown, operation: AuditOperation, extra: Partial<AuditEntry> = {}): AuditEntry => ({
  id, created_at: timestamp, updated_at: timestamp, status_changed_at: timestamp, last_actor: actor, trace_id: `tr_seed${id.slice(-3)}91de7c`, timestamp, actor, entity_type, entity_id, field, prior_value, new_value, operation, note: null, reverts_entry_id: null, ...extra,
});

// Every latest seed value mirrors its record. audit-002 is superseded by audit-003;
// audit-004 is already reverted by audit-005.
const seedAuditEntries: AuditEntry[] = [
  auditSeed("audit-001", iso(4, 9), "Anže", "pathway", "pw-001", "status", "approved", "needs_approval", "update", { note: "Flagged for a final definition check" }),
  auditSeed("audit-002", iso(5, 10), "Anže", "pathway", "pw-002", "group", null, "Renewable chemicals", "update"),
  auditSeed("audit-003", iso(6, 11), "Jon Goriup", "pathway", "pw-002", "group", "Renewable chemicals", "Bio-based chemicals", "update", { note: "Aligned with portfolio taxonomy" }),
  auditSeed("audit-004", iso(7, 8), "Anže", "indicator_value", "iv-003", "value", 0, 12.5, "update"),
  auditSeed("audit-005", iso(7, 12), "Jon Goriup", "indicator_value", "iv-003", "value", 12.5, 0, "revert", { reverts_entry_id: "audit-004" }),
  auditSeed("audit-006", iso(8, 9), "Jon Goriup", "company_match", "cm-001", "status", "accepted", "review_pending", "update", { note: "Evidence requires verification" }),
  auditSeed("audit-007", iso(8, 13), "Anže", "paper_patent_match", "pp-002", "status", "review_pending", "accepted", "accept"),
  auditSeed("audit-008", iso(9, 10), "Jon Goriup", "company", "co-003", "registry_id", "AT-OLD-110", null, "update"),
  auditSeed("audit-009", iso(9, 15), "Anže", "pathway", "pw-004", "status", "approved", "locked", "deactivate", { note: "Reserved for sales and marketing" }),
  auditSeed("audit-010", iso(10, 9), "Jon Goriup", "indicator_value", "iv-007", "value", 47.3, null, "update", { note: "Source no longer reports this value" }),
  auditSeed("audit-011", iso(10, 14), "Anže", "company_match", "cm-004", "status", "review_pending", "rejected", "reject"),
  auditSeed("audit-012", iso(11, 10), "Jon Goriup", "paper_patent_match", "pp-001", "note", null, "Check pathway specificity", "update"),
  auditSeed("audit-013", iso(12, 11), "Anže", "pathway", "pw-003", "visibility_scope", "all", ["VCG.AI"], "update"),
  auditSeed("audit-014", iso(13, 9), "Jon Goriup", "indicator_value", "iv-009", "corrected_value", null, 61.4, "update", { note: "Updated against source table" }),
  auditSeed("audit-015", iso(14, 10), "Anže", "paper_patent_match", "pp-003", "status", "accepted", "review_pending", "link_add"),
  auditSeed("audit-016", "2026-01-08T10:00:00.000Z", "Jon Goriup", "indicator_value", "iv-002", "corrected_value", null, 24.1, "update", { note: "Corrected from verified source appendix" }),
  auditSeed("audit-017", "2026-02-14T11:30:00.000Z", "Anže", "indicator_value", "iv-005", "corrected_value", null, 39.8, "update", { note: "Aligned with published regional dataset" }),
];

interface HitlStoreValue {
  currentUser: HitlCurrentUser;
  pathways: Pathway[];
  companies: Company[];
  companyMatches: CompanyMatch[];
  paperPatentMatches: PaperPatentMatch[];
  indicatorValues: IndicatorValue[];
  auditEntries: AuditEntry[];
  recordChange: (input: RecordChangeInput) => AuditEntry;
  revertEntry: (entryId: string) => AuditEntry | null;
  getHistory: (entityType: AuditEntityType, entityId: string) => AuditEntry[];
  isSuperseded: (entry: AuditEntry) => AuditEntry[];
  revertedBy: (entry: AuditEntry) => AuditEntry | null;
  getRecord: (entityType: AuditEntityType, entityId: string) => HitlRecord | null;
}
const HitlStoreContext = createContext<HitlStoreValue | null>(null);

export function HitlStoreProvider({ children }: { children: ReactNode }) {
  const [pathways, setPathways] = useState(seedPathways);
  const [companies, setCompanies] = useState(seedCompanies);
  const [companyMatches, setCompanyMatches] = useState(seedCompanyMatches);
  const [paperPatentMatches, setPaperPatentMatches] = useState(seedPaperPatentMatches);
  const [indicatorValues, setIndicatorValues] = useState(seedIndicatorValues);
  const [auditEntries, setAuditEntries] = useState(seedAuditEntries);
  const currentUser: HitlCurrentUser = useMemo(() => ({ name: "Jon Goriup", role: "Super Admin" }), []);

  const getRecord = useCallback((entityType: AuditEntityType, entityId: string): HitlRecord | null => {
    const collections: Record<AuditEntityType, HitlRecord[]> = {
      pathway: pathways, company: companies, company_match: companyMatches,
      paper_patent_match: paperPatentMatches, indicator_value: indicatorValues,
    };
    return collections[entityType].find(item => item.id === entityId) ?? null;
  }, [pathways, companies, companyMatches, paperPatentMatches, indicatorValues]);

  const recordChange = useCallback((input: RecordChangeInput): AuditEntry => {
    const now = new Date().toISOString();
    const entryId = `audit-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
    const entry: AuditEntry = {
      id: entryId, created_at: now, updated_at: now, status_changed_at: now,
      last_actor: currentUser.name, trace_id: input.trace_id ?? null,
      timestamp: now, actor: currentUser.name, entity_type: input.entity_type,
      entity_id: input.entity_id, field: input.field, prior_value: input.prior_value,
      new_value: input.new_value, operation: input.operation, note: input.note ?? null,
      reverts_entry_id: input.reverts_entry_id ?? null,
    };
    const apply = <T extends HitlRecord>(items: T[]): T[] => {
      if ((input.operation === "create" || input.operation === "link_add") && input.field === null) {
        return [...items, input.new_value as T];
      }
      return items.map(item => {
        if (item.id !== input.entity_id || input.field === null) return item;
        return {
          ...writeField(item, input.field, input.new_value),
          updated_at: now,
          last_actor: currentUser.name,
          ...(input.field === "status" ? { status_changed_at: now } : {}),
        };
      });
    };
    if (input.entity_type === "pathway") setPathways(apply);
    if (input.entity_type === "company") setCompanies(apply);
    if (input.entity_type === "company_match") setCompanyMatches(apply);
    if (input.entity_type === "paper_patent_match") setPaperPatentMatches(apply);
    if (input.entity_type === "indicator_value") setIndicatorValues(apply);
    setAuditEntries(items => [...items, entry]);
    return entry;
  }, [currentUser.name]);

  const revertedBy = useCallback((entry: AuditEntry) => auditEntries.find(item => item.reverts_entry_id === entry.id) ?? null, [auditEntries]);
  const isSuperseded = useCallback((entry: AuditEntry) => auditEntries
    .filter(item => item.entity_type === entry.entity_type && item.entity_id === entry.entity_id && item.field === entry.field && new Date(item.timestamp).getTime() > new Date(entry.timestamp).getTime())
    .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp)), [auditEntries]);
  const getHistory = useCallback((entityType: AuditEntityType, entityId: string) => auditEntries
    .filter(item => item.entity_type === entityType && item.entity_id === entityId)
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)), [auditEntries]);

  const revertEntry = useCallback((entryId: string): AuditEntry | null => {
    const target = auditEntries.find(item => item.id === entryId);
    if (!target || auditEntries.some(item => item.reverts_entry_id === entryId)) return null;
    const record = getRecord(target.entity_type, target.entity_id);
    if (!record) return null;
    if (target.operation === "create" || target.operation === "link_add") {
      const status = target.entity_type === "pathway" ? "deleted" : "rejected";
      return recordChange({ entity_type: target.entity_type, entity_id: target.entity_id, field: "status", prior_value: "status" in record ? record.status : null, new_value: status, operation: "revert", reverts_entry_id: target.id, note: `Reverted ${target.operation} entry ${target.id}` });
    }
    const field = target.operation === "link_remove" ? "status" : target.field;
    if (!field) return null;
    const currentValue = readField(record, field);
    return recordChange({ entity_type: target.entity_type, entity_id: target.entity_id, field, prior_value: currentValue, new_value: target.prior_value, operation: "revert", reverts_entry_id: target.id, trace_id: target.trace_id, note: `Reverted entry ${target.id}` });
  }, [auditEntries, getRecord, recordChange]);

  const value = useMemo<HitlStoreValue>(() => ({
    currentUser, pathways, companies, companyMatches, paperPatentMatches, indicatorValues, auditEntries,
    recordChange, revertEntry, getHistory, isSuperseded, revertedBy, getRecord,
  }), [currentUser, pathways, companies, companyMatches, paperPatentMatches, indicatorValues, auditEntries, recordChange, revertEntry, getHistory, isSuperseded, revertedBy, getRecord]);
  return <HitlStoreContext.Provider value={value}>{children}</HitlStoreContext.Provider>;
}

export function useHitlStore() {
  const context = useContext(HitlStoreContext);
  if (!context) throw new Error("useHitlStore must be used within HitlStoreProvider");
  return context;
}
