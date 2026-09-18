import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ReviewStatus = "review_pending" | "approved" | "rejected";
export type VisibilityState = "visible" | "locked" | "hidden";
export const VISIBILITY_STATES: VisibilityState[] = ["visible", "locked", "hidden"];
export const VISIBILITY_MEANINGS: Record<VisibilityState, string> = {
  visible: "Default. Usable in Pathway Explorer, included in counts and benchmarks.",
  locked: "Shown but not usable. Not included in counts or benchmarks.",
  hidden: "Not shown in Pathway Explorer, counts or benchmarks.",
};

export const VISIBILITY_LABELS: Record<VisibilityState, string> = { visible: "Visible", locked: "Locked", hidden: "Hidden" };
export interface PathwayVisibility { default: VisibilityState; overrides: Record<string, VisibilityState>; }
// Legacy pathway lifecycle values migrated onto the unified review status plus visibility state.
type LegacyPathwayStatus = "approved" | "needs_approval" | "locked" | "hidden" | "deleted" | ReviewStatus;
type LegacyAvailability = "active" | "locked" | "hidden" | "deleted";
const availabilityToVisibility = (availability: LegacyAvailability): VisibilityState => availability === "active" ? "visible" : availability === "deleted" ? "hidden" : availability;
export const migratePathwayStatus = (status: LegacyPathwayStatus, scope: "all" | string[] = "all"): { status: ReviewStatus; visibility: PathwayVisibility } => {
  const availability: LegacyAvailability = status === "locked" || status === "hidden" || status === "deleted" ? status : "active";
  const reviewStatus: ReviewStatus = status === "needs_approval" ? "review_pending" : status === "locked" || status === "hidden" || status === "deleted" ? "approved" : status;
  const state = availabilityToVisibility(availability);
  if (scope === "all") return { status: reviewStatus, visibility: { default: state, overrides: {} } };
  return { status: reviewStatus, visibility: { default: "visible", overrides: Object.fromEntries(scope.map(org => [org, state])) } };
};
export const effectiveVisibility = (pathway: Pathway, organisation: string): VisibilityState => pathway.visibility.overrides[organisation] ?? pathway.visibility.default;
export const visibilitySummary = (pathway: Pathway | PathwayVisibility): string => {
  const visibility = "visibility" in pathway ? pathway.visibility : pathway;
  const entries = Object.entries(visibility.overrides);
  const base = `${VISIBILITY_LABELS[visibility.default]}${entries.length ? "" : visibility.default === "visible" ? " to all" : " for all"}`;
  if (!entries.length) return base;
  const groupedStates = VISIBILITY_STATES.filter(state => state !== visibility.default && entries.some(([, value]) => value === state));
  const parts = groupedStates.map(state => { const count = entries.filter(([, value]) => value === state).length; return `${VISIBILITY_LABELS[state]} for ${count} organisation${count === 1 ? "" : "s"}`; });
  return [base, ...parts].join(" · ");
};
export type VisibilityScope = "all" | string[];
export type GroupColorToken = "group-violet" | "group-fuchsia" | "group-rose" | "group-indigo" | "group-bronze";
export type CompanyRole = "feedstock_supplier" | "product_manufacturer" | "application_offtaker";
export interface EvidenceNodes {
  feedstock: string | null;
  process_technology: string | null;
  product: string | null;
  application_market: string | null;
}
export const NODE_LABELS = {
  feedstock: "Feedstock",
  process_technology: "Process",
  product: "Product",
  application_market: "Application",
} as const satisfies Record<keyof EvidenceNodes, string>;
export const FIELD_LABELS: Record<string, string> = {
  status: "Status",
  note: "Note",
  visibility: "Visibility",
  visibility_scope: "Visibility",
  feedstock: "Feedstock",
  process_technology: "Process",
  product: "Product",
  application_market: "Application",
  group_id: "Group",
  "nodes.feedstock": "Feedstock",
  "nodes.process": "Process",
  "nodes.product": "Product",
  "nodes.application": "Application",
  name: "Name",
  website: "Website",
  registry_id: "Registry ID",
  address: "Address",
  postal_code: "Postal code",
  relevance_url: "Relevance URL",
  country: "Country",
  city: "City",
  industry_sector: "Industry sector",
  role: "Role",
  role_node: "Role node",
  evidence: "Relevance",
  "secondary_nodes.feedstock": "Secondary feedstock",
  "secondary_nodes.process_technology": "Secondary process",
  "secondary_nodes.product": "Secondary product",
  "secondary_nodes.application_market": "Secondary application",
  "profile_fields.revenue": "Revenue",
  color_token: "Colour",
  description: "Description",
  is_archived: "Archived",
  value: "Value",
  unit: "Unit",
  value_date: "Value date",
  corrected_value: "Corrected value",
  correction_note: "Correction note",
  corrected_at: "Corrected at",
  justification: "Justification",
  method_tag: "Method",
  method_detail: "Method detail",
  sources: "Sources",
};
export interface MatchNodes {
  feedstock: string | null;
  process: string | null;
  product: string | null;
  application: string | null;
}
export type MatchNodePosition = keyof MatchNodes;
export const matchNodePositions: MatchNodePosition[] = ["feedstock", "process", "product", "application"];
export const MATCH_NODE_LABELS: Record<MatchNodePosition, string> = {
  feedstock: NODE_LABELS.feedstock,
  process: NODE_LABELS.process_technology,
  product: NODE_LABELS.product,
  application: NODE_LABELS.application_market,
};
export const matchToPathwayPosition: Record<MatchNodePosition, keyof EvidenceNodes> = {
  feedstock: "feedstock", process: "process_technology", product: "product", application: "application_market",
};
export const emptyMatchNodes = (): MatchNodes => ({ feedstock: null, process: null, product: null, application: null });
export type PathwayNodePosition = keyof EvidenceNodes;
export const pathwayNodePositions: PathwayNodePosition[] = ["feedstock", "process_technology", "product", "application_market"];
const normalizedNode = (value: string | null) => value?.trim().toLocaleLowerCase() ?? null;
export interface NodeValueMetadata { value: string; positions: { position: PathwayNodePosition; pathwayCount: number }[]; pathwayCount: number; mostCommonPosition: PathwayNodePosition; }
export function allowedSecondaryPositions(role: CompanyRole): (keyof EvidenceNodes)[] {
  if (role === "feedstock_supplier") return [];
  if (role === "product_manufacturer") return ["feedstock", "process_technology"];
  return ["feedstock", "process_technology", "product"];
}

export type IndicatorScope = "feedstock" | "process" | "product" | "production" | "application";
export type IndicatorValueType = "trl" | "count" | "decimal";
export type MethodTag = "reported" | "summed" | "derived" | "estimated" | "expert_judgement";
export const METHOD_TAGS: { value: MethodTag; label: string }[] = [
  { value: "reported", label: "Reported" },
  { value: "summed", label: "Summed" },
  { value: "derived", label: "Derived" },
  { value: "estimated", label: "Estimated" },
  { value: "expert_judgement", label: "Expert judgement" },
];
export const methodTagLabel = (value: MethodTag | null): string => METHOD_TAGS.find(item => item.value === value)?.label ?? "not set";
export interface IndicatorTarget { feedstock: string | null; process: string | null; product: string | null; application: string | null; }
export type AuditEntityType = "pathway" | "group" | "company" | "paper_match" | "patent_match" | "indicator_value";
export type AuditOperation = "create" | "update" | "link_add" | "link_remove" | "approve" | "reject" | "revert";
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
  status: ReviewStatus;
  group_id: string | null;
  visibility: PathwayVisibility;
}
export interface Group extends CommonRecord {
  name: string;
  color_token: GroupColorToken;
  visibility_scope: VisibilityScope;
  description: string | null;
  is_system: boolean;
  is_archived: boolean;
}
export interface Company extends CommonRecord {
  name: string;
  website: string | null;
  registry_id: string | null;
  address: string | null;
  postal_code: string | null;
  relevance_url: string | null;
  country: string | null;
  city: string | null;
  industry_sector: string | null;
  profile_fields: Record<string, string | number | null>;
  role: CompanyRole;
  role_node: string;
  secondary_nodes: EvidenceNodes;
  status: ReviewStatus;
  evidence: string | null;
  note: string | null;
}
export interface PaperPatentMatch extends CommonRecord {
  kind: "paper" | "patent";
  external_id: string;
  title: string;
  nodes: MatchNodes;
  status: ReviewStatus;
  matched_at: string;
  note: string | null;
  year: number | null;
  authors_or_assignee: string | null;
  abstract: string | null;
  source: "Semantic Scholar" | "USPTO" | null;
}
export interface IndicatorSource { url: string; label: string | null; }
export const sourceDomain = (url: string): string => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };
export const sourceDisplay = (source: IndicatorSource): string => source.label?.trim() || sourceDomain(source.url);
export const isValidSourceUrl = (url: string): boolean => /^https?:\/\//i.test(url.trim());
export const MAX_SOURCES = 10;
// "https://a [Label] | https://b" → source list. Used by bulk import only.
export function parseSourceList(raw: string): IndicatorSource[] {
  return raw.split("|").map(part => part.trim()).filter(Boolean).map(part => {
    const match = part.match(/^(\S+)\s*(?:\[(.*)\])?$/);
    return { url: (match?.[1] ?? part).trim(), label: match?.[2]?.trim() || null };
  });
}
export const formatSourceList = (sources: IndicatorSource[]): string => sources.map(source => source.label ? `${source.url} [${source.label}]` : source.url).join(" | ");
export const sameSources = (a: IndicatorSource[], b: IndicatorSource[]): boolean => a.length === b.length && a.every((source, index) => source.url === b[index].url && (source.label ?? null) === (b[index].label ?? null));

export interface IndicatorValue extends CommonRecord {
  indicator_key: string;
  scope: IndicatorScope;
  target: IndicatorTarget;
  value: number | null;
  unit: string | null;
  value_date: string | null;
  status: ReviewStatus;
  corrected_value: number | null;
  correction_note: string | null;
  corrected_at: string | null;
  justification: string | null;
  method_tag: MethodTag | null;
  sources: IndicatorSource[];
  method_detail: string | null;
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
export type HitlRecord = Pathway | Group | Company | PaperPatentMatch | IndicatorValue;
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
  if (root === "secondary_nodes" && nested && "secondary_nodes" in record) return record.secondary_nodes[nested as keyof EvidenceNodes] ?? null;
  if (root === "nodes" && nested && "nodes" in record) return record.nodes[nested as MatchNodePosition] ?? null;
  return root in record ? record[root as keyof HitlRecord] : null;
};

const writeField = <T extends HitlRecord>(record: T, field: string, value: unknown): T => {
  const [root, nested] = field.split(".");
  if (root === "profile_fields" && nested && "profile_fields" in record) {
    return { ...record, profile_fields: { ...record.profile_fields, [nested]: value } } as T;
  }
  if (root === "secondary_nodes" && nested && "secondary_nodes" in record) {
    return { ...record, secondary_nodes: { ...record.secondary_nodes, [nested]: value } } as T;
  }
  if (root === "nodes" && nested && "nodes" in record) {
    return { ...record, nodes: { ...record.nodes, [nested]: value } } as T;
  }
  return { ...record, [field]: value } as T;
};

const iso = (day: number, hour = 9) => `2026-09-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00.000Z`;
const common = (id: string, day: number, actor: string | null = "Anže", trace: string | null = `trace-${id}-8f4a91c2`) => ({
  id, created_at: iso(Math.max(1, day - 3)), updated_at: iso(day), status_changed_at: iso(day), last_actor: actor, trace_id: trace,
});
export const GROUP_COLOR_TOKENS: GroupColorToken[] = ["group-violet", "group-fuchsia", "group-rose", "group-indigo", "group-bronze"];
export const organisations = () => ["VCG.AI", "BioCampus Straubing GmbH", "Packaging Excellence Stuttgart", "Smart Cities and Communities", "Regio Augsburg Wirtschaft GmbH"];
const seedGroups: Group[] = [
  { ...common("grp-001", 14), name: "Advanced biofuels", color_token: "group-violet", visibility_scope: "all", description: null, is_system: false, is_archived: false },
  { ...common("grp-002", 13), name: "Bio-based chemicals", color_token: "group-fuchsia", visibility_scope: "all", description: null, is_system: false, is_archived: false },
  { ...common("grp-003", 12), name: "Thermochemical routes", color_token: "group-rose", visibility_scope: "all", description: null, is_system: false, is_archived: false },
  { ...common("grp-004", 11), name: "Fibre products", color_token: "group-indigo", visibility_scope: "all", description: null, is_system: false, is_archived: false },
  { ...common("grp-005", 10), name: "Annex IX Part A", color_token: "group-bronze", visibility_scope: "all", description: "RED II Annex IX Part A feedstock eligibility, rule-derived", is_system: true, is_archived: false },
];
export const groupById = (groups: Group[], groupId: string | null) => groupId ? groups.find(group => group.id === groupId) ?? null : null;
export const pathwaysInGroup = (pathways: Pathway[], groupId: string) => pathways.filter(pathway => pathway.group_id === groupId);

const seedPathways: Pathway[] = [
  { ...common("pw-001", 14), feedstock: "Wheat straw", process_technology: "Steam explosion and enzymatic hydrolysis", product: "Cellulosic ethanol", application_market: "Road transport fuel", ...migratePathwayStatus("needs_approval", "all"), group_id: "grp-005" },
  { ...common("pw-002", 13), feedstock: "Kraft lignin", process_technology: "Catalytic depolymerisation", product: "Bio-phenols", application_market: "Phenolic resins", ...migratePathwayStatus("approved", "all"), group_id: "grp-002" },
  { ...common("pw-003", 12), feedstock: "Whey permeate", process_technology: "Fermentation", product: "Lactic acid", application_market: "Biodegradable packaging", ...migratePathwayStatus("needs_approval", ["VCG.AI"]), group_id: null },
  { ...common("pw-004", 11, "Jon Goriup", null), feedstock: "Forestry residues", process_technology: "Fast pyrolysis", product: "Bio-oil", application_market: "Industrial heat", ...migratePathwayStatus("locked", "all"), group_id: "grp-003" },
  { ...common("pw-005", 10), feedstock: "Sugar beet pulp", process_technology: "Enzymatic hydrolysis and fermentation", product: "Succinic acid", application_market: "Bio-based polymers", ...migratePathwayStatus("approved", "all"), group_id: "grp-002" },
  { ...common("pw-006", 9), feedstock: "Used cooking oil", process_technology: "Hydroprocessing", product: "Renewable diesel", application_market: "Heavy-duty road transport", ...migratePathwayStatus("hidden", ["VCG.AI", "BioCampus Straubing GmbH"]), group_id: "grp-005" },
  { ...common("pw-007", 8, "Jon Goriup", null), feedstock: "Corn stover", process_technology: "Dilute acid pretreatment and fermentation", product: "Cellulosic ethanol", application_market: "Sustainable aviation fuel blending", ...migratePathwayStatus("needs_approval", "all"), group_id: "grp-001" },
  { ...common("pw-008", 7), feedstock: "Crude glycerol", process_technology: "Microbial fermentation", product: "1,3-propanediol", application_market: "Polytrimethylene terephthalate", ...migratePathwayStatus("deleted", "all"), group_id: null },
  { ...common("pw-009", 6), feedstock: "Miscanthus", process_technology: "Organosolv fractionation", product: "Cellulose pulp", application_market: "Moulded fibre packaging", ...migratePathwayStatus("approved", "all"), group_id: "grp-004" },
  { ...common("pw-010", 5), feedstock: "Algal biomass", process_technology: "Lipid extraction and transesterification", product: "Fatty acid methyl esters", application_market: "Marine fuel", ...migratePathwayStatus("needs_approval", ["VCG.AI"]), group_id: null },
];

const companyRows = [
  ["Nordic Enzymes", "https://nordic-enzymes.example", "DK-482910", "Havnegade 12", "1058", "https://nordic-enzymes.example/about", "Denmark", "Copenhagen", "Industrial biotechnology"],
  ["Rhein BioCarbon", "https://rhein-biocarbon.example", "DE-HRB-77120", "Rheinuferstrasse 8", "50678", "https://rhein-biocarbon.example/company", "Germany", "Cologne", "Chemicals"],
  ["Alpine Fermentation", "https://alpine-fermentation.example", null, "Grazbachgasse 45", "8010", null, "Austria", "Graz", "Industrial biotechnology"],
  ["Baltic Fibre Works", "https://baltic-fibre.example", "LV-402034", "Brivibas iela 103", "1001", "https://baltic-fibre.example/contact", "Latvia", "Riga", "Pulp and paper"],
  ["Circular Oils Europe", null, "NL-908172", "Waalhaven 22", "3087", "https://registry.example/nl-908172", "Netherlands", "Rotterdam", null],
  ["GreenRoute Fuels", "https://greenroute.example", null, "Havenlaan 17", "9000", null, "Belgium", "Ghent", "Chemicals"],
  ["Danube Biopolymers", "https://danube-biopolymers.example", "HU-011829", null, null, "https://danube-biopolymers.example/imprint", "Hungary", null, "Packaging"],
  ["Atlantic Algae", "https://atlantic-algae.example", "PT-521908", "Rua do Porto 210", "4050", "https://atlantic-algae.example/about", "Portugal", "Porto", null],
] as const;
const companyAssignments: { role: CompanyRole; pathway: number; status: ReviewStatus; secondary_nodes: EvidenceNodes; evidence: string | null; note: string | null }[] = [
  { role: "feedstock_supplier", pathway: 0, status: "rejected", secondary_nodes: { feedstock: null, process_technology: "Steam explosion and enzymatic hydrolysis", product: "Cellulosic ethanol", application_market: null }, evidence: "Company product page and registry filing", note: "Confirm commercial activity in Europe" },
  { role: "product_manufacturer", pathway: 1, status: "approved", secondary_nodes: { feedstock: "Kraft lignin", process_technology: "Fermentation", product: null, application_market: null }, evidence: null, note: null },
  { role: "application_offtaker", pathway: 2, status: "review_pending", secondary_nodes: { feedstock: null, process_technology: null, product: "Lactic acid", application_market: null }, evidence: null, note: null },
  { role: "feedstock_supplier", pathway: 3, status: "rejected", secondary_nodes: { feedstock: null, process_technology: null, product: null, application_market: null }, evidence: "Company product page and registry filing", note: null },
  { role: "product_manufacturer", pathway: 4, status: "approved", secondary_nodes: { feedstock: "Sugar beet pulp", process_technology: "Enzymatic hydrolysis and fermentation", product: null, application_market: "Bio-based polymers" }, evidence: null, note: "Confirm commercial activity in Europe" },
  { role: "application_offtaker", pathway: 5, status: "review_pending", secondary_nodes: { feedstock: null, process_technology: null, product: null, application_market: null }, evidence: null, note: null },
  { role: "feedstock_supplier", pathway: 6, status: "approved", secondary_nodes: { feedstock: null, process_technology: "Fermentation", product: "Cellulosic ethanol", application_market: null }, evidence: "Company product page and registry filing", note: null },
  { role: "product_manufacturer", pathway: 7, status: "review_pending", secondary_nodes: { feedstock: null, process_technology: null, product: null, application_market: null }, evidence: null, note: null },
];
const seedCompanies: Company[] = companyRows.map((row, index) => {
  const assignment = companyAssignments[index];
  const pathway = seedPathways[assignment.pathway];
  const position = assignment.role === "feedstock_supplier" ? "feedstock" : assignment.role === "product_manufacturer" ? "product" : "application_market";
  const allowed = new Set(allowedSecondaryPositions(assignment.role));
  const secondary_nodes = Object.fromEntries((Object.keys(assignment.secondary_nodes) as (keyof EvidenceNodes)[]).map(key => [key, allowed.has(key) ? assignment.secondary_nodes[key] : null])) as unknown as EvidenceNodes;
  return { ...common(`co-${String(index + 1).padStart(3, "0")}`, 13 - index), name: row[0], website: row[1], registry_id: row[2], address: row[3], postal_code: row[4], relevance_url: row[5], country: row[6], city: row[7], industry_sector: row[8], profile_fields: { revenue: index === 2 ? null : `€${(4 + index * 2.5).toFixed(1)}M` }, role: assignment.role, role_node: pathway[position], secondary_nodes, status: assignment.status, evidence: assignment.evidence, note: assignment.note };
});

const ppStatuses: ReviewStatus[] = ["review_pending", "approved", "review_pending", "rejected", "review_pending", "approved", "approved", "review_pending", "rejected", "review_pending", "approved", "review_pending"];
const paperTitles = ["Enzymatic fractionation of agricultural residues for advanced biorefineries", "Fermentative conversion of side streams into renewable platform chemicals", "Process intensification routes for circular bio-based production"];
const patentTitles = ["Integrated conversion process for renewable intermediates", "Continuous fermentation system for bio-based organic acids", "Catalytic upgrading of lignocellulosic feedstocks"];
const seedPaperPatentMatches: PaperPatentMatch[] = Array.from({ length: 12 }, (_, index) => {
  const kind = index % 2 === 0 ? "paper" : "patent";
  const pathway = seedPathways[index % seedPathways.length];
  const legacyScope = index === 4 || index === 9 ? null : index % 2 === 0 ? "production" : "application";
  const legacyNodes: EvidenceNodes = index === 0
    ? { feedstock: pathway.feedstock, process_technology: null, product: null, application_market: null }
    : index === 6
      ? { feedstock: null, process_technology: null, product: pathway.product, application_market: null }
      : legacyScope === "application"
        ? { feedstock: null, process_technology: null, product: pathway.product, application_market: pathway.application_market }
        : { feedstock: null, process_technology: pathway.process_technology, product: pathway.product, application_market: null };
  const legacyValues = [...new Map(Object.values(legacyNodes).filter((value): value is string => Boolean(value?.trim())).map(value => [value.trim().toLocaleLowerCase(), value.trim()])).values()];
  const nodes = migrateLegacyMatchedNodes(legacyValues, seedPathways);
  return {
    ...common(`pp-${String(index + 1).padStart(3, "0")}`, 13 - (index % 7)), kind,
    external_id: kind === "paper" ? `10.1016/j.biortech.202${index}.10${index}42` : `EP${3201400 + index}A1`,
    title: kind === "paper" ? paperTitles[(index / 2) % paperTitles.length] : patentTitles[Math.floor(index / 2) % patentTitles.length],
    nodes, status: ppStatuses[index], matched_at: iso(10 + (index % 5)), note: index % 5 === 0 ? "Check pathway specificity" : null,
    year: index === 6 ? null : 2019 + (index % 6),
    authors_or_assignee: index === 9 ? null : kind === "paper" ? ["M. Novak, L. Weber, S. Chen", "A. Rossi, J. Lindström", "E. García, P. Müller"][index % 3] : ["BASF SE", "Novozymes A/S", "Fraunhofer-Gesellschaft"][index % 3],
    abstract: index === 4 ? null : kind === "paper" ? "This study evaluates integrated conversion routes for residual biomass, focusing on resource efficiency, product yield and industrial scale-up constraints." : "A process and apparatus for converting renewable feedstocks into purified bio-based intermediates using an integrated reaction and separation sequence.",
    source: index === 11 ? null : kind === "paper" ? "Semantic Scholar" : "USPTO",
  };
});

export function allNodeValues(pathways: Pathway[]): NodeValueMetadata[] {
  const values = new Map<string, { value: string; pathwayIds: Set<string>; positions: Map<PathwayNodePosition, Set<string>> }>();
  pathways.forEach(pathway => pathwayNodePositions.forEach(position => {
    const value = pathway[position].trim(); const key = normalizedNode(value);
    if (!key) return;
    const current = values.get(key) ?? { value, pathwayIds: new Set<string>(), positions: new Map<PathwayNodePosition, Set<string>>() };
    current.pathwayIds.add(pathway.id);
    const ids = current.positions.get(position) ?? new Set<string>(); ids.add(pathway.id); current.positions.set(position, ids); values.set(key, current);
  }));
  return [...values.values()].map(item => {
    const positions = pathwayNodePositions.map(position => ({ position, pathwayCount: item.positions.get(position)?.size ?? 0 })).filter(entry => entry.pathwayCount > 0).sort((a, b) => b.pathwayCount - a.pathwayCount || pathwayNodePositions.indexOf(a.position) - pathwayNodePositions.indexOf(b.position));
    return { value: item.value, pathwayCount: item.pathwayIds.size, positions, mostCommonPosition: positions[0]?.position ?? "feedstock" };
  }).sort((a, b) => pathwayNodePositions.indexOf(a.mostCommonPosition) - pathwayNodePositions.indexOf(b.mostCommonPosition) || a.value.localeCompare(b.value));
}
function migrateLegacyMatchedNodes(values: string[], pathways: Pathway[]): MatchNodes {
  const nodes = emptyMatchNodes();
  const metadata = allNodeValues(pathways);
  values.forEach(raw => {
    const value = raw.trim();
    const meta = metadata.find(item => normalizedNode(item.value) === normalizedNode(value));
    if (!meta) return;
    const candidates = meta.positions.map(item => matchNodePositions[pathwayNodePositions.indexOf(item.position)]).filter((position): position is MatchNodePosition => Boolean(position));
    const free = candidates.find(position => nodes[position] === null);
    if (free) nodes[free] = meta.value;
  });
  return nodes;
}
export function filledPositions(match: Pick<PaperPatentMatch, "nodes">): MatchNodePosition[] {
  return matchNodePositions.filter(position => Boolean(match.nodes[position]?.trim()));
}
export function hasNoNodes(match: Pick<PaperPatentMatch, "nodes">): boolean { return filledPositions(match).length === 0; }
export function derivedPathwayIds(match: Pick<PaperPatentMatch, "nodes">, pathways: Pathway[]): string[] {
  const positions = filledPositions(match);
  if (!positions.length) return [];
  return pathways.filter(pathway => positions.every(position => normalizedNode(pathway[matchToPathwayPosition[position]]) === normalizedNode(match.nodes[position]))).map(pathway => pathway.id);
}
export interface PathwayScope { production: boolean; application: boolean; productionPositions: MatchNodePosition[]; applicationHit: boolean; }
export function pathwayScope(match: Pick<PaperPatentMatch, "nodes">, pathway: Pathway): PathwayScope {
  const filled = filledPositions(match);
  const productionPositions = filled.filter(position => position !== "application" && normalizedNode(pathway[matchToPathwayPosition[position]]) === normalizedNode(match.nodes[position]));
  const applicationHit = filled.includes("application") && normalizedNode(pathway.application_market) === normalizedNode(match.nodes.application);
  return { production: productionPositions.length > 0, application: applicationHit, productionPositions, applicationHit };
}
export function scopeSummary(match: Pick<PaperPatentMatch, "nodes">, pathways: Pathway[]) {
  return derivedPathwayIds(match, pathways).reduce((counts, id) => { const pathway = pathways.find(item => item.id === id); if (!pathway) return counts; const scope = pathwayScope(match, pathway); return { production: counts.production + Number(scope.production), application: counts.application + Number(scope.application) }; }, { production: 0, application: 0 });
}

const rolePositions = {
  feedstock_supplier: { positionKey: "feedstock", positionLabel: NODE_LABELS.feedstock, verb: "Supplies" },
  product_manufacturer: { positionKey: "product", positionLabel: NODE_LABELS.product, verb: "Produces" },
  application_offtaker: { positionKey: "application_market", positionLabel: NODE_LABELS.application_market, verb: "Offtakes" },
} as const;
export function rolePosition(role: CompanyRole) { return rolePositions[role]; }
export function derivedCompanyPathwayIds(company: Pick<Company, "role" | "role_node">, pathways: Pathway[]): string[] {
  const position = rolePosition(company.role).positionKey;
  return pathways.filter(pathway => normalizedNode(pathway[position]) === normalizedNode(company.role_node)).map(pathway => pathway.id);
}
export type CompanyFit = { level: "exact" | "strong" | "broad"; matched: (keyof EvidenceNodes)[]; differing: (keyof EvidenceNodes)[]; unknown: (keyof EvidenceNodes)[] };
export function computeFit(company: Pick<Company, "role" | "secondary_nodes">, pathway: Pathway): CompanyFit | null {
  const positions = allowedSecondaryPositions(company.role);
  if (!positions.length) return null;
  const matched = positions.filter(key => normalizedNode(company.secondary_nodes[key]) !== null && normalizedNode(company.secondary_nodes[key]) === normalizedNode(pathway[key]));
  const differing = positions.filter(key => normalizedNode(company.secondary_nodes[key]) !== null && normalizedNode(company.secondary_nodes[key]) !== normalizedNode(pathway[key]));
  const unknown = positions.filter(key => normalizedNode(company.secondary_nodes[key]) === null);
  return { level: matched.length > 0 && differing.length === 0 ? "exact" : matched.length > 0 && differing.length > 0 ? "strong" : "broad", matched, differing, unknown };
}

export interface IndicatorDefinition { key: string; label: string; scope: IndicatorScope; value_type: IndicatorValueType; unit: string; units: string[]; computed: boolean; }
export const INDICATORS: IndicatorDefinition[] = [
  { key: "feedstock_price", label: "Feedstock price (Europe)", scope: "feedstock", value_type: "decimal", unit: "EUR/t", units: ["EUR/t", "EUR/kg", "USD/t"], computed: false },
  { key: "feedstock_availability", label: "Feedstock availability (Europe)", scope: "feedstock", value_type: "decimal", unit: "kt/yr", units: ["kt/yr", "t/yr", "Mt/yr"], computed: false },
  { key: "process_trl", label: "Process TRL", scope: "process", value_type: "trl", unit: "TRL", units: ["TRL"], computed: false },
  { key: "product_price", label: "Product price", scope: "product", value_type: "decimal", unit: "EUR/t", units: ["EUR/t", "EUR/kg", "USD/t"], computed: false },
  { key: "product_availability", label: "Product availability (Europe)", scope: "product", value_type: "decimal", unit: "kt/yr", units: ["kt/yr", "t/yr", "Mt/yr"], computed: false },
  { key: "market_size_eu", label: "Market size (EU)", scope: "product", value_type: "decimal", unit: "EUR m", units: ["EUR m", "EUR bn", "USD m", "USD bn"], computed: false },
  { key: "market_size_global", label: "Market size (Global)", scope: "product", value_type: "decimal", unit: "EUR m", units: ["EUR m", "EUR bn", "USD m", "USD bn"], computed: false },
  { key: "market_growth_eu", label: "Market growth (EU)", scope: "product", value_type: "decimal", unit: "%/yr", units: ["%/yr"], computed: false },
  { key: "market_growth_global", label: "Market growth (Global)", scope: "product", value_type: "decimal", unit: "%/yr", units: ["%/yr"], computed: false },
  { key: "market_concentration", label: "Market concentration", scope: "product", value_type: "decimal", unit: "HHI", units: ["HHI", "CR4 %"], computed: false },
  { key: "production_trl", label: "Production TRL", scope: "production", value_type: "trl", unit: "TRL", units: ["TRL"], computed: false },
  { key: "production_ip_count", label: "Production IP count", scope: "production", value_type: "count", unit: "patents", units: ["patents"], computed: true },
  { key: "production_research_count", label: "Production research count", scope: "production", value_type: "count", unit: "papers", units: ["papers"], computed: true },
  { key: "application_trl", label: "Application TRL", scope: "application", value_type: "trl", unit: "TRL", units: ["TRL"], computed: false },
  { key: "application_ip_count", label: "Application IP count", scope: "application", value_type: "count", unit: "patents", units: ["patents"], computed: true },
  { key: "application_research_count", label: "Application research count", scope: "application", value_type: "count", unit: "papers", units: ["papers"], computed: true },
];
export const COMPUTED_RULES: Record<string, string> = {
  production_ip_count: "Number of approved patent matches whose derived pathways include a pathway with this production triple.",
  production_research_count: "Number of approved paper matches whose derived pathways include a pathway with this production triple.",
  application_ip_count: "Approved patent matches with a derived pathway equal to this pathway and application scope true.",
  application_research_count: "Approved paper matches with a derived pathway equal to this pathway and application scope true.",
};
export const UNIT_ALIASES: Record<string, string> = {
  "€/t": "EUR/t", "eur/tonne": "EUR/t", "kt/a": "kt/yr", "eur million": "EUR m", "eur billion": "EUR bn", "% p.a.": "%/yr",
};
// Normalises an imported unit for an indicator: alias map, then exact match against the accepted list.
export function normalizeUnit(indicator_key: string, raw: string | null): string | null {
  const definition = indicatorDefinition(indicator_key);
  if (!definition) return null;
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return definition.units[0];
  const exact = definition.units.find(unit => unit.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  const alias = UNIT_ALIASES[trimmed.toLowerCase()] ?? UNIT_ALIASES[trimmed];
  if (alias && definition.units.includes(alias)) return alias;
  if (trimmed === "%" && definition.units.includes("%/yr")) return "%/yr";
  return null;
}
export const unitForStorage = (indicator_key: string, raw: string | null): string => normalizeUnit(indicator_key, raw) ?? indicatorDefinition(indicator_key)?.units[0] ?? "";
export const isComputedIndicator = (key: string): boolean => indicatorDefinition(key)?.computed === true;
export const COMPUTED_INDICATOR_ERROR = "Computed indicator — not editable";
export const INDICATOR_SCOPES: IndicatorScope[] = ["feedstock", "process", "product", "production", "application"];
export const SCOPE_LABELS: Record<IndicatorScope, string> = { feedstock: "Feedstock", process: "Process", product: "Product", production: "Production", application: "Application" };
export const SCOPE_DESCRIPTIONS: Record<IndicatorScope, string> = {
  feedstock: `Node level · one ${NODE_LABELS.feedstock} value`,
  process: `Node level · one ${NODE_LABELS.process_technology} value`,
  product: `Node level · one ${NODE_LABELS.product} value`,
  production: `${NODE_LABELS.feedstock} → ${NODE_LABELS.process_technology} → ${NODE_LABELS.product}`,
  application: "Whole pathway",
};
export type IndicatorTargetKey = keyof IndicatorTarget;
export const SCOPE_TARGET_KEYS: Record<IndicatorScope, IndicatorTargetKey[]> = {
  feedstock: ["feedstock"], process: ["process"], product: ["product"],
  production: ["feedstock", "process", "product"], application: ["feedstock", "process", "product", "application"],
};
export const indicatorTargetKeys: IndicatorTargetKey[] = ["feedstock", "process", "product", "application"];
export const TARGET_POSITION_LABELS: Record<IndicatorTargetKey, string> = { feedstock: NODE_LABELS.feedstock, process: NODE_LABELS.process_technology, product: NODE_LABELS.product, application: NODE_LABELS.application_market };
export const targetToPathwayPosition: Record<IndicatorTargetKey, PathwayNodePosition> = { feedstock: "feedstock", process: "process_technology", product: "product", application: "application_market" };
export const emptyIndicatorTarget: IndicatorTarget = { feedstock: null, process: null, product: null, application: null };
export const indicatorDefinition = (key: string): IndicatorDefinition | undefined => INDICATORS.find(item => item.key === key);
export const indicatorLabel = (key: string): string => indicatorDefinition(key)?.label ?? key;
export const indicatorsForScope = (scope: IndicatorScope): IndicatorDefinition[] => INDICATORS.filter(item => item.scope === scope);
type TargetedValue = Pick<IndicatorValue, "scope" | "target">;
export const filledTargetKeys = (iv: TargetedValue): IndicatorTargetKey[] => SCOPE_TARGET_KEYS[iv.scope].filter(key => Boolean(iv.target[key]?.trim()));
export const targetValues = (iv: TargetedValue): string[] => filledTargetKeys(iv).map(key => (iv.target[key] ?? "").trim());
export function affectedPathwayIds(iv: TargetedValue, pathways: Pathway[]): string[] {
  const keys = filledTargetKeys(iv);
  if (keys.length !== SCOPE_TARGET_KEYS[iv.scope].length) return [];
  return pathways.filter(pathway => keys.every(key => normalizedNode(pathway[targetToPathwayPosition[key]]) === normalizedNode(iv.target[key]))).map(pathway => pathway.id);
}
export function targetLabel(iv: TargetedValue): string {
  const values = SCOPE_TARGET_KEYS[iv.scope].map(key => iv.target[key]?.trim() || "—");
  if (iv.scope === "production" || iv.scope === "application") return values.join(" → ");
  return `${SCOPE_LABELS[iv.scope]} · ${values[0]}`;
}
export const sameIndicatorTarget = (a: IndicatorTarget, b: IndicatorTarget) => indicatorTargetKeys.every(key => normalizedNode(a[key]) === normalizedNode(b[key]));
export function findIndicatorValue(values: IndicatorValue[], indicator_key: string, target: IndicatorTarget): IndicatorValue | null {
  if (isComputedIndicator(indicator_key)) return null;
  return values.find(item => item.indicator_key === indicator_key && sameIndicatorTarget(item.target, target)) ?? null;
}
// Computed count indicators: never stored, always derived live from approved paper / patent matches.
export function computedMatches(indicator_key: string, target: IndicatorTarget, matches: PaperPatentMatch[], pathways: Pathway[]): PaperPatentMatch[] {
  if (!isComputedIndicator(indicator_key)) return [];
  const kind: PaperPatentMatch["kind"] = indicator_key.includes("_ip_") ? "patent" : "paper";
  const application = indicator_key.startsWith("application_");
  const scope: IndicatorScope = application ? "application" : "production";
  const keys = SCOPE_TARGET_KEYS[scope];
  if (keys.some(key => !target[key]?.trim())) return [];
  const targeted = pathways.filter(pathway => keys.every(key => normalizedNode(pathway[targetToPathwayPosition[key]]) === normalizedNode(target[key])));
  if (!targeted.length) return [];
  return matches.filter(match => {
    if (match.kind !== kind || match.status !== "approved") return false;
    const derived = derivedPathwayIds(match, pathways);
    return targeted.some(pathway => derived.includes(pathway.id) && (!application || pathwayScope(match, pathway).application));
  });
}
export function computedValue(indicator_key: string, target: IndicatorTarget, matches: PaperPatentMatch[], pathways: Pathway[]): number {
  return computedMatches(indicator_key, target, matches, pathways).length;
}
export function targetForPathway(scope: IndicatorScope, pathway: Pick<Pathway, PathwayNodePosition>): IndicatorTarget {
  const keys = SCOPE_TARGET_KEYS[scope];
  return {
    feedstock: keys.includes("feedstock") ? pathway.feedstock : null,
    process: keys.includes("process") ? pathway.process_technology : null,
    product: keys.includes("product") ? pathway.product : null,
    application: keys.includes("application") ? pathway.application_market : null,
  };
}

// Seed migration: legacy pathway-keyed rows mapped onto the indicator registry
// (Technology TRL → Process TRL, Pathway TRL → Application TRL, Price → Product price,
// CAGR → Market growth (EU); GHG impact and Yield dropped), deduped by (indicator_key, target).
type IndicatorSeed = [id: string, key: string, pathwayIndex: number, value: number | null, status: ReviewStatus, day: number];
const indicatorSeeds: IndicatorSeed[] = [
  ["iv-001", "feedstock_price", 0, 82.5, "review_pending", 14],
  ["iv-002", "feedstock_availability", 0, 1250, "approved", 13],
  
  ["iv-004", "process_trl", 2, 7, "approved", 12],
  ["iv-005", "product_price", 2, 1480, "approved", 11],
  ["iv-006", "product_availability", 2, 310, "review_pending", 11],
  ["iv-007", "market_size_eu", 2, null, "review_pending", 10],
  ["iv-008", "market_size_global", 2, 4200, "approved", 10],
  ["iv-009", "market_growth_eu", 2, -1.4, "review_pending", 9],
  ["iv-010", "market_growth_global", 2, 4.6, "approved", 9],
  ["iv-011", "market_concentration", 2, 0.42, "approved", 8],
  ["iv-012", "production_trl", 2, 6, "review_pending", 8],
  ["iv-014", "application_trl", 2, 5, "review_pending", 7],
  ["iv-017", "product_price", 0, 640, "review_pending", 5],
  ["iv-018", "product_availability", 0, null, "approved", 5],
  ["iv-019", "feedstock_price", 4, 44, "approved", 4],
  ["iv-020", "process_trl", 1, 4, "review_pending", 4],
  ["iv-021", "application_trl", 0, 8, "approved", 3],
  ["iv-022", "production_trl", 0, 7, "approved", 3],
  ["iv-025", "market_size_eu", 0, 2600, "review_pending", 1],
];
const seedCorrections: Record<string, { value: number; note: string; at: string }> = {
  "iv-002": { value: 1180, note: "Corrected from verified source appendix", at: "2026-01-08T10:00:00.000Z" },
  "iv-005": { value: 1520, note: "Aligned with published regional dataset", at: "2026-02-14T11:30:00.000Z" },
  "iv-009": { value: 3.2, note: "Updated against source table", at: "2026-09-13T09:00:00.000Z" },
};
const seedJustifications: Record<string, string> = {
  feedstock_price: "Average of three 2025 European spot quotes for the specified feedstock.",
  feedstock_availability: "Available European volume after competing uses and collection losses.",
  process_trl: "Highest maturity demonstrated for this process at the named node.",
  product_price: "Average of recent European contract and spot references for this product grade.",
  product_availability: "Total commercially available European volume reported for the latest year.",
  market_size_eu: "European demand multiplied by the representative annual selling price.",
  market_size_global: "Published global sales estimate reconciled across two market sources.",
  market_growth_eu: "Year-on-year change derived from the latest two comparable European observations.",
  market_growth_global: "Reported global annual market growth for the relevant product category.",
  market_concentration: "Supplier shares were normalized before calculating the concentration index.",
  production_trl: "Lowest demonstrated maturity across the feedstock, process and product chain.",
  production_ip_count: "Active patent families matched to all three production nodes.",
  production_research_count: "Peer-reviewed papers matching the complete production target.",
  application_trl: "Commercial readiness assessed for the complete pathway and end application.",
  application_ip_count: "Active patent families matching the pathway including its application.",
  application_research_count: "Peer-reviewed papers matching all pathway nodes and the application.",
};
// Plausible source pools; a few seed rows deliberately stay empty.
const seedSourcePools: IndicatorSource[][] = [
  [{ url: "https://ec.europa.eu/eurostat/databrowser/view/apro_cpsh1", label: "Eurostat crop statistics" }],
  [{ url: "https://www.fao.org/faostat/en/#data/QCL", label: "FAOSTAT 2025" }, { url: "https://www.icis.com/explore/commodities/chemicals/pricing/", label: "ICIS pricing" }],
  [{ url: "https://www.grandviewresearch.com/industry-analysis/lactic-acid-market", label: "Market research summary" }],
  [{ url: "https://reports.example.com/annual-2025.pdf", label: "Company annual report" }, { url: "https://ec.europa.eu/eurostat/databrowser/view/ds-045409", label: "Eurostat trade data" }, { url: "https://www.iea.org/reports/bioenergy", label: "IEA bioenergy" }],
  [],
];
const seedMethodTags: MethodTag[] = ["reported", "summed", "derived", "estimated", "expert_judgement"];
const seedIndicatorValues: IndicatorValue[] = indicatorSeeds.reduce<IndicatorValue[]>((rows, [id, key, pathwayIndex, value, status, day], index) => {
  const definition = indicatorDefinition(key);
  if (!definition || definition.computed) return rows;
  const target = targetForPathway(definition.scope, seedPathways[pathwayIndex]);
  if (findIndicatorValue(rows, key, target)) return rows;
  const correction = seedCorrections[id];
  rows.push({
    ...common(id, day), indicator_key: key, scope: definition.scope, target, value, unit: definition.unit,
    value_date: id === "iv-018" ? null : iso(1 + (index % 12)), status,
    corrected_value: correction?.value ?? null, correction_note: correction?.note ?? null, corrected_at: correction?.at ?? null,
    justification: index % 7 === 6 ? null : seedJustifications[key] ?? null,
    method_tag: correction ? "reported" : index % 6 === 5 ? null : seedMethodTags[index % seedMethodTags.length],
    sources: seedSourcePools[index % seedSourcePools.length],
    method_detail: index % 2 === 0 ? `${seedJustifications[key] ?? "Source observations were reviewed"} Reference period: 2024–2025.` : null,
  });
  return rows;
}, []);

const auditSeed = (id: string, timestamp: string, actor: string, entity_type: AuditEntityType, entity_id: string, field: string | null, prior_value: unknown, new_value: unknown, operation: AuditOperation, extra: Partial<AuditEntry> = {}): AuditEntry => ({
  id, created_at: timestamp, updated_at: timestamp, status_changed_at: timestamp, last_actor: actor, trace_id: `tr_seed${id.slice(-3)}91de7c`, timestamp, actor, entity_type, entity_id, field, prior_value, new_value, operation, note: null, reverts_entry_id: null, ...extra,
});

// Every latest seed value mirrors its record. audit-002 is superseded by audit-003.
const seedAuditEntries: AuditEntry[] = [
  auditSeed("audit-001", iso(4, 9), "Anže", "pathway", "pw-001", "status", "approved", "review_pending", "update", { note: "Flagged for a final definition check" }),
  auditSeed("audit-002", iso(5, 10), "Anže", "pathway", "pw-002", "group_id", null, "grp-001", "update"),
  auditSeed("audit-003", iso(6, 10), "Jon Goriup", "pathway", "pw-002", "group_id", "grp-001", "grp-002", "update"),
  auditSeed("audit-006", iso(8, 9), "Jon Goriup", "company", "co-001", "status", "review_pending", "rejected", "reject", { note: "Evidence requires verification" }),
  auditSeed("audit-007", iso(8, 13), "Anže", "patent_match", "pp-002", "status", "review_pending", "approved", "approve"),
  auditSeed("audit-008", iso(9, 10), "Jon Goriup", "company", "co-003", "registry_id", "AT-OLD-110", null, "update"),
  auditSeed("audit-009", iso(9, 15), "Anže", "pathway", "pw-004", "visibility", { default: "visible", overrides: {} }, { default: "locked", overrides: {} }, "update", { note: "Visibility restricted" }),
  auditSeed("audit-010", iso(10, 9), "Jon Goriup", "indicator_value", "iv-007", "value", 1900, null, "update", { note: "Source no longer reports this value" }),
  auditSeed("audit-011", iso(10, 14), "Anže", "company", "co-004", "status", "review_pending", "rejected", "reject"),
  auditSeed("audit-012", iso(11, 10), "Jon Goriup", "paper_match", "pp-001", "note", null, "Check pathway specificity", "update"),
  auditSeed("audit-013", iso(12, 11), "Anže", "pathway", "pw-003", "visibility", { default: "visible", overrides: {} }, { default: "visible", overrides: { "VCG.AI": "locked" } }, "update"),
  auditSeed("audit-014", iso(13, 9), "Jon Goriup", "indicator_value", "iv-009", "corrected_value", null, 3.2, "update", { note: "Updated against source table" }),
  auditSeed("audit-015", iso(14, 10), "Anže", "paper_match", "pp-003", "status", "approved", "review_pending", "update"),
  auditSeed("audit-016", "2026-01-08T10:00:00.000Z", "Jon Goriup", "indicator_value", "iv-002", "corrected_value", null, 1180, "update", { note: "Corrected from verified source appendix" }),
  auditSeed("audit-017", "2026-02-14T11:30:00.000Z", "Anže", "indicator_value", "iv-005", "corrected_value", null, 1520, "update", { note: "Aligned with published regional dataset" }),
];

interface HitlStoreValue {
  currentUser: HitlCurrentUser;
  pathways: Pathway[];
  groups: Group[];
  companies: Company[];
  paperPatentMatches: PaperPatentMatch[];
  paperMatches: () => PaperPatentMatch[];
  patentMatches: () => PaperPatentMatch[];
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
  const [groups, setGroups] = useState(seedGroups);
  const [companies, setCompanies] = useState(seedCompanies);
  const [paperPatentMatches, setPaperPatentMatches] = useState(seedPaperPatentMatches);
  const [indicatorValues, setIndicatorValues] = useState(seedIndicatorValues);
  const [auditEntries, setAuditEntries] = useState(seedAuditEntries);
  const currentUser: HitlCurrentUser = useMemo(() => ({ name: "Jon Goriup", role: "Super Admin" }), []);

  const getRecord = useCallback((entityType: AuditEntityType, entityId: string): HitlRecord | null => {
    const collections: Record<AuditEntityType, HitlRecord[]> = {
      pathway: pathways, group: groups, company: companies,
      paper_match: paperPatentMatches, patent_match: paperPatentMatches, indicator_value: indicatorValues,
    };
    return collections[entityType].find(item => item.id === entityId) ?? null;
  }, [pathways, groups, companies, paperPatentMatches, indicatorValues]);

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
    if (input.entity_type === "group") setGroups(apply);
    if (input.entity_type === "company") setCompanies(apply);
    if (input.entity_type === "paper_match" || input.entity_type === "patent_match") setPaperPatentMatches(apply);
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
      const field = target.entity_type === "group" ? "is_archived" : target.entity_type === "pathway" ? "visibility" : "status";
      const status: unknown = target.entity_type === "pathway" ? { default: "hidden", overrides: {} } : target.entity_type === "group" ? true : "rejected";
      return recordChange({ entity_type: target.entity_type, entity_id: target.entity_id, field, prior_value: field in record ? record[field as keyof HitlRecord] : null, new_value: status, operation: "revert", reverts_entry_id: target.id, note: target.entity_type === "pathway" ? "reverted creation" : `Reverted ${target.operation} entry ${target.id}` });
    }
    const field = target.operation === "link_remove" ? "status" : target.field;
    if (!field) return null;
    const currentValue = readField(record, field);
    return recordChange({ entity_type: target.entity_type, entity_id: target.entity_id, field, prior_value: currentValue, new_value: target.prior_value, operation: "revert", reverts_entry_id: target.id, trace_id: target.trace_id, note: `Reverted entry ${target.id}` });
  }, [auditEntries, getRecord, recordChange]);

  const paperMatches = useCallback(() => paperPatentMatches.filter(item => item.kind === "paper"), [paperPatentMatches]);
  const patentMatches = useCallback(() => paperPatentMatches.filter(item => item.kind === "patent"), [paperPatentMatches]);
  const value = useMemo<HitlStoreValue>(() => ({
    currentUser, pathways, groups, companies, paperPatentMatches, indicatorValues, auditEntries,
    paperMatches, patentMatches, recordChange, revertEntry, getHistory, isSuperseded, revertedBy, getRecord,
  }), [currentUser, pathways, groups, companies, paperPatentMatches, indicatorValues, auditEntries, paperMatches, patentMatches, recordChange, revertEntry, getHistory, isSuperseded, revertedBy, getRecord]);
  return <HitlStoreContext.Provider value={value}>{children}</HitlStoreContext.Provider>;
}

export function useHitlStore() {
  const context = useContext(HitlStoreContext);
  if (!context) throw new Error("useHitlStore must be used within HitlStoreProvider");
  return context;
}
