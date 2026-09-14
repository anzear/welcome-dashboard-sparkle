import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type ReviewStatus = "accepted" | "rejected" | "review_pending";
export type PathwayStatus = "approved" | "needs_approval" | "locked" | "hidden" | "deleted";
export type VisibilityScope = "all" | string[];
export type CompanyRole = "feedstock_supplier" | "product_manufacturer" | "application_offtaker";
export type IndicatorName = "GHG impact" | "Yield" | "Technology TRL" | "Pathway TRL" | "Feedstock availability" | "Price" | "EU market size" | "Global market size" | "CAGR";
export type AuditEntityType = "pathway" | "company" | "company_match" | "paper_patent_match" | "indicator_value";
export type AuditOperation = "create" | "update" | "deactivate" | "link_add" | "link_remove" | "accept" | "reject" | "revert";

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
}
export interface AuditEntry {
  id: string;
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
  trace_id: string | null;
}
export interface HitlCurrentUser { name: string; role: "Super Admin" | "User"; }

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
const seedPaperPatentMatches: PaperPatentMatch[] = Array.from({ length: 12 }, (_, index) => ({
  ...common(`pp-${String(index + 1).padStart(3, "0")}`, 13 - (index % 7)), kind: index % 2 === 0 ? "paper" : "patent", external_id: index % 2 === 0 ? `10.1016/j.biortech.202${index}.10${index}42` : `EP${3201400 + index}A1`, title: index % 2 === 0 ? `Process performance for bioeconomy pathway ${index + 1}` : `Integrated conversion process for renewable intermediates ${index + 1}`, pathway_id: seedPathways[index % seedPathways.length].id, status: ppStatuses[index], matched_at: iso(10 + (index % 5)), note: index % 5 === 0 ? "Check pathway specificity" : null,
}));

const indicators: IndicatorName[] = ["GHG impact", "Yield", "Technology TRL", "Pathway TRL", "Feedstock availability", "Price", "EU market size", "Global market size", "CAGR"];
const units: Record<IndicatorName, string> = { "GHG impact": "kg CO₂e/t", Yield: "%", "Technology TRL": "TRL", "Pathway TRL": "TRL", "Feedstock availability": "kt/yr", Price: "€/t", "EU market size": "€m", "Global market size": "€m", CAGR: "%" };
const indicatorStatuses: ReviewStatus[] = ["review_pending", "accepted", "review_pending", "rejected", "accepted", "review_pending", "accepted", "review_pending", "rejected", "accepted", "review_pending", "accepted", "review_pending", "accepted", "rejected", "review_pending", "accepted", "review_pending", "accepted", "review_pending"];
const seedIndicatorValues: IndicatorValue[] = Array.from({ length: 20 }, (_, index) => {
  const indicator = indicators[index % indicators.length];
  const deliberateValue = index === 2 || index === 15 ? 0 : index === 6 || index === 17 ? null : Number((18.5 + index * 4.7).toFixed(1));
  return { ...common(`iv-${String(index + 1).padStart(3, "0")}`, 14 - (index % 9)), pathway_id: seedPathways[index % seedPathways.length].id, indicator, value: deliberateValue, unit: units[indicator], value_date: index === 17 ? null : iso(1 + (index % 12)), status: indicatorStatuses[index], corrected_value: index === 8 ? 61.4 : null, correction_note: index === 8 ? "Updated against source table" : null };
});

const operations: AuditOperation[] = ["create", "update", "accept", "reject", "link_add", "link_remove", "deactivate", "revert"];
const entityTypes: AuditEntityType[] = ["pathway", "company", "company_match", "paper_patent_match", "indicator_value"];
const seedAuditEntries: AuditEntry[] = Array.from({ length: 15 }, (_, index) => ({
  id: `audit-${String(index + 1).padStart(3, "0")}`, timestamp: iso(14 - (index % 10), 8 + (index % 7)), actor: index % 2 === 0 ? "Jon Goriup" : "Anže", entity_type: entityTypes[index % entityTypes.length], entity_id: index % 5 === 0 ? seedPathways[index % seedPathways.length].id : `entity-${index + 1}`, field: index % 3 === 0 ? "status" : null, prior_value: index % 3 === 0 ? "review_pending" : null, new_value: index % 3 === 0 ? "accepted" : null, operation: operations[index % operations.length], note: index % 4 === 0 ? "Reviewed against primary evidence" : null, reverts_entry_id: index === 7 ? "audit-003" : null, trace_id: index % 6 === 0 ? null : `trace-audit-${index + 1}-91de7c40`,
}));

interface HitlStoreValue {
  currentUser: HitlCurrentUser;
  pathways: Pathway[];
  companies: Company[];
  companyMatches: CompanyMatch[];
  paperPatentMatches: PaperPatentMatch[];
  indicatorValues: IndicatorValue[];
  auditEntries: AuditEntry[];
  updatePathway: (id: string, patch: Partial<Pathway>) => void;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  updateCompanyMatch: (id: string, patch: Partial<CompanyMatch>) => void;
  updatePaperPatentMatch: (id: string, patch: Partial<PaperPatentMatch>) => void;
  updateIndicatorValue: (id: string, patch: Partial<IndicatorValue>) => void;
  addAuditEntry: (entry: AuditEntry) => void;
}
const HitlStoreContext = createContext<HitlStoreValue | null>(null);

export function HitlStoreProvider({ children }: { children: ReactNode }) {
  const [pathways, setPathways] = useState(seedPathways);
  const [companies, setCompanies] = useState(seedCompanies);
  const [companyMatches, setCompanyMatches] = useState(seedCompanyMatches);
  const [paperPatentMatches, setPaperPatentMatches] = useState(seedPaperPatentMatches);
  const [indicatorValues, setIndicatorValues] = useState(seedIndicatorValues);
  const [auditEntries, setAuditEntries] = useState(seedAuditEntries);
  const value = useMemo<HitlStoreValue>(() => ({
    currentUser: { name: "Jon Goriup", role: "Super Admin" }, pathways, companies, companyMatches, paperPatentMatches, indicatorValues, auditEntries,
    updatePathway: (id, patch) => setPathways(items => items.map(item => item.id === id ? { ...item, ...patch } : item)),
    updateCompany: (id, patch) => setCompanies(items => items.map(item => item.id === id ? { ...item, ...patch } : item)),
    updateCompanyMatch: (id, patch) => setCompanyMatches(items => items.map(item => item.id === id ? { ...item, ...patch } : item)),
    updatePaperPatentMatch: (id, patch) => setPaperPatentMatches(items => items.map(item => item.id === id ? { ...item, ...patch } : item)),
    updateIndicatorValue: (id, patch) => setIndicatorValues(items => items.map(item => item.id === id ? { ...item, ...patch } : item)),
    addAuditEntry: entry => setAuditEntries(items => [entry, ...items]),
  }), [pathways, companies, companyMatches, paperPatentMatches, indicatorValues, auditEntries]);
  return <HitlStoreContext.Provider value={value}>{children}</HitlStoreContext.Provider>;
}

export function useHitlStore() {
  const context = useContext(HitlStoreContext);
  if (!context) throw new Error("useHitlStore must be used within HitlStoreProvider");
  return context;
}
