import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ReviewStatus = "accepted" | "rejected" | "review_pending";
export type PathwayStatus = "approved" | "needs_approval" | "locked" | "hidden" | "deleted";
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
  hq_city: "HQ city",
  country: "Country",
  role: "Role",
  role_node: "Role node",
  evidence: "Relevance",
  "secondary_nodes.feedstock": "Secondary feedstock",
  "secondary_nodes.process_technology": "Secondary process",
  "secondary_nodes.product": "Secondary product",
  "secondary_nodes.application_market": "Secondary application",
  "profile_fields.employees": "Employees",
  "profile_fields.founded": "Founded",
  color_token: "Colour",
  description: "Description",
  is_archived: "Archived",
  value: "Value",
  unit: "Unit",
  value_date: "Value date",
  corrected_value: "Corrected value",
  correction_note: "Correction note",
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
export interface IndicatorTarget { feedstock: string | null; process: string | null; product: string | null; application: string | null; }
export type AuditEntityType = "pathway" | "group" | "company" | "paper_match" | "patent_match" | "indicator_value";
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
  group_id: string | null;
  visibility_scope: VisibilityScope;
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
  hq_city: string | null;
  country: string | null;
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
  { ...common("pw-001", 14), feedstock: "Wheat straw", process_technology: "Steam explosion and enzymatic hydrolysis", product: "Cellulosic ethanol", application_market: "Road transport fuel", status: "needs_approval", group_id: "grp-005", visibility_scope: "all" },
  { ...common("pw-002", 13), feedstock: "Kraft lignin", process_technology: "Catalytic depolymerisation", product: "Bio-phenols", application_market: "Phenolic resins", status: "approved", group_id: "grp-002", visibility_scope: "all" },
  { ...common("pw-003", 12), feedstock: "Whey permeate", process_technology: "Fermentation", product: "Lactic acid", application_market: "Biodegradable packaging", status: "needs_approval", group_id: null, visibility_scope: ["VCG.AI"] },
  { ...common("pw-004", 11, "Jon Goriup", null), feedstock: "Forestry residues", process_technology: "Fast pyrolysis", product: "Bio-oil", application_market: "Industrial heat", status: "locked", group_id: "grp-003", visibility_scope: "all" },
  { ...common("pw-005", 10), feedstock: "Sugar beet pulp", process_technology: "Enzymatic hydrolysis and fermentation", product: "Succinic acid", application_market: "Bio-based polymers", status: "approved", group_id: "grp-002", visibility_scope: "all" },
  { ...common("pw-006", 9), feedstock: "Used cooking oil", process_technology: "Hydroprocessing", product: "Renewable diesel", application_market: "Heavy-duty road transport", status: "hidden", group_id: "grp-005", visibility_scope: ["VCG.AI", "BioCampus Straubing GmbH"] },
  { ...common("pw-007", 8, "Jon Goriup", null), feedstock: "Corn stover", process_technology: "Dilute acid pretreatment and fermentation", product: "Cellulosic ethanol", application_market: "Sustainable aviation fuel blending", status: "needs_approval", group_id: "grp-001", visibility_scope: "all" },
  { ...common("pw-008", 7), feedstock: "Crude glycerol", process_technology: "Microbial fermentation", product: "1,3-propanediol", application_market: "Polytrimethylene terephthalate", status: "deleted", group_id: null, visibility_scope: "all" },
  { ...common("pw-009", 6), feedstock: "Miscanthus", process_technology: "Organosolv fractionation", product: "Cellulose pulp", application_market: "Moulded fibre packaging", status: "approved", group_id: "grp-004", visibility_scope: "all" },
  { ...common("pw-010", 5), feedstock: "Algal biomass", process_technology: "Lipid extraction and transesterification", product: "Fatty acid methyl esters", application_market: "Marine fuel", status: "needs_approval", group_id: null, visibility_scope: ["VCG.AI"] },
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
const companyAssignments: { role: CompanyRole; pathway: number; status: ReviewStatus; secondary_nodes: EvidenceNodes; evidence: string | null; note: string | null }[] = [
  { role: "feedstock_supplier", pathway: 0, status: "rejected", secondary_nodes: { feedstock: null, process_technology: "Steam explosion and enzymatic hydrolysis", product: "Cellulosic ethanol", application_market: null }, evidence: "Company product page and registry filing", note: "Confirm commercial activity in Europe" },
  { role: "product_manufacturer", pathway: 1, status: "accepted", secondary_nodes: { feedstock: "Kraft lignin", process_technology: "Fermentation", product: null, application_market: null }, evidence: null, note: null },
  { role: "application_offtaker", pathway: 2, status: "review_pending", secondary_nodes: { feedstock: null, process_technology: null, product: "Lactic acid", application_market: null }, evidence: null, note: null },
  { role: "feedstock_supplier", pathway: 3, status: "rejected", secondary_nodes: { feedstock: null, process_technology: null, product: null, application_market: null }, evidence: "Company product page and registry filing", note: null },
  { role: "product_manufacturer", pathway: 4, status: "accepted", secondary_nodes: { feedstock: "Sugar beet pulp", process_technology: "Enzymatic hydrolysis and fermentation", product: null, application_market: "Bio-based polymers" }, evidence: null, note: "Confirm commercial activity in Europe" },
  { role: "application_offtaker", pathway: 5, status: "review_pending", secondary_nodes: { feedstock: null, process_technology: null, product: null, application_market: null }, evidence: null, note: null },
  { role: "feedstock_supplier", pathway: 6, status: "accepted", secondary_nodes: { feedstock: null, process_technology: "Fermentation", product: "Cellulosic ethanol", application_market: null }, evidence: "Company product page and registry filing", note: null },
  { role: "product_manufacturer", pathway: 7, status: "review_pending", secondary_nodes: { feedstock: null, process_technology: null, product: null, application_market: null }, evidence: null, note: null },
];
const seedCompanies: Company[] = companyRows.map((row, index) => {
  const assignment = companyAssignments[index];
  const pathway = seedPathways[assignment.pathway];
  const position = assignment.role === "feedstock_supplier" ? "feedstock" : assignment.role === "product_manufacturer" ? "product" : "application_market";
  const allowed = new Set(allowedSecondaryPositions(assignment.role));
  const secondary_nodes = Object.fromEntries((Object.keys(assignment.secondary_nodes) as (keyof EvidenceNodes)[]).map(key => [key, allowed.has(key) ? assignment.secondary_nodes[key] : null])) as unknown as EvidenceNodes;
  return { ...common(`co-${String(index + 1).padStart(3, "0")}`, 13 - index), name: row[0], website: row[1], registry_id: row[2], hq_city: row[3], country: row[4], profile_fields: { employees: index === 2 ? null : 45 + index * 18, founded: 2008 + index }, role: assignment.role, role_node: pathway[position], secondary_nodes, status: assignment.status, evidence: assignment.evidence, note: assignment.note };
});

const ppStatuses: ReviewStatus[] = ["review_pending", "accepted", "review_pending", "rejected", "review_pending", "accepted", "accepted", "review_pending", "rejected", "review_pending", "accepted", "review_pending"];
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
  pathways.filter(pathway => pathway.status !== "deleted").forEach(pathway => pathwayNodePositions.forEach(position => {
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
  return pathways.filter(pathway => pathway.status !== "deleted" && positions.every(position => normalizedNode(pathway[matchToPathwayPosition[position]]) === normalizedNode(match.nodes[position]))).map(pathway => pathway.id);
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
  return pathways.filter(pathway => pathway.status !== "deleted" && normalizedNode(pathway[position]) === normalizedNode(company.role_node)).map(pathway => pathway.id);
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

export interface IndicatorDefinition { key: string; label: string; scope: IndicatorScope; value_type: IndicatorValueType; unit: string; }
export const INDICATORS: IndicatorDefinition[] = [
  { key: "feedstock_price", label: "Feedstock price (Europe)", scope: "feedstock", value_type: "decimal", unit: "EUR/t" },
  { key: "feedstock_availability", label: "Feedstock availability (Europe)", scope: "feedstock", value_type: "decimal", unit: "kt/yr" },
  { key: "process_trl", label: "Process TRL", scope: "process", value_type: "trl", unit: "TRL" },
  { key: "product_price", label: "Product price", scope: "product", value_type: "decimal", unit: "EUR/t" },
  { key: "product_availability", label: "Product availability (Europe)", scope: "product", value_type: "decimal", unit: "kt/yr" },
  { key: "market_size_eu", label: "Market size (EU)", scope: "product", value_type: "decimal", unit: "EUR m" },
  { key: "market_size_global", label: "Market size (Global)", scope: "product", value_type: "decimal", unit: "EUR m" },
  { key: "market_growth_eu", label: "Market growth (EU)", scope: "product", value_type: "decimal", unit: "%/yr" },
  { key: "market_growth_global", label: "Market growth (Global)", scope: "product", value_type: "decimal", unit: "%/yr" },
  { key: "market_concentration", label: "Market concentration", scope: "product", value_type: "decimal", unit: "index" },
  { key: "production_trl", label: "Production TRL", scope: "production", value_type: "trl", unit: "TRL" },
  { key: "production_ip_count", label: "Production IP count", scope: "production", value_type: "count", unit: "patents" },
  { key: "production_research_count", label: "Production research count", scope: "production", value_type: "count", unit: "papers" },
  { key: "application_trl", label: "Application TRL", scope: "application", value_type: "trl", unit: "TRL" },
  { key: "application_ip_count", label: "Application IP count", scope: "application", value_type: "count", unit: "patents" },
  { key: "application_research_count", label: "Application research count", scope: "application", value_type: "count", unit: "papers" },
];
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
  return pathways.filter(pathway => pathway.status !== "deleted" && keys.every(key => normalizedNode(pathway[targetToPathwayPosition[key]]) === normalizedNode(iv.target[key]))).map(pathway => pathway.id);
}
export function targetLabel(iv: TargetedValue): string {
  const values = SCOPE_TARGET_KEYS[iv.scope].map(key => iv.target[key]?.trim() || "—");
  if (iv.scope === "production" || iv.scope === "application") return values.join(" → ");
  return `${SCOPE_LABELS[iv.scope]} · ${values[0]}`;
}
export const sameIndicatorTarget = (a: IndicatorTarget, b: IndicatorTarget) => indicatorTargetKeys.every(key => normalizedNode(a[key]) === normalizedNode(b[key]));
export function findIndicatorValue(values: IndicatorValue[], indicator_key: string, target: IndicatorTarget): IndicatorValue | null {
  return values.find(item => item.indicator_key === indicator_key && sameIndicatorTarget(item.target, target)) ?? null;
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
  ["iv-002", "feedstock_availability", 0, 1250, "accepted", 13],
  ["iv-003", "production_ip_count", 0, 0, "review_pending", 12],
  ["iv-004", "process_trl", 2, 7, "accepted", 12],
  ["iv-005", "product_price", 2, 1480, "accepted", 11],
  ["iv-006", "product_availability", 2, 310, "review_pending", 11],
  ["iv-007", "market_size_eu", 2, null, "review_pending", 10],
  ["iv-008", "market_size_global", 2, 4200, "accepted", 10],
  ["iv-009", "market_growth_eu", 2, -1.4, "review_pending", 9],
  ["iv-010", "market_growth_global", 2, 4.6, "accepted", 9],
  ["iv-011", "market_concentration", 2, 0.42, "accepted", 8],
  ["iv-012", "production_trl", 2, 6, "review_pending", 8],
  ["iv-013", "production_research_count", 2, 128, "accepted", 7],
  ["iv-014", "application_trl", 2, 5, "review_pending", 7],
  ["iv-015", "application_ip_count", 2, 34, "accepted", 6],
  ["iv-016", "application_research_count", 2, 12, "rejected", 6],
  ["iv-017", "product_price", 0, 640, "review_pending", 5],
  ["iv-018", "product_availability", 0, null, "accepted", 5],
  ["iv-019", "feedstock_price", 4, 44, "accepted", 4],
  ["iv-020", "process_trl", 1, 4, "review_pending", 4],
  ["iv-021", "application_trl", 0, 8, "accepted", 3],
  ["iv-022", "production_trl", 0, 7, "accepted", 3],
  ["iv-023", "production_ip_count", 2, 210, "accepted", 2],
  ["iv-024", "application_ip_count", 0, 76, "review_pending", 2],
  ["iv-025", "market_size_eu", 0, 2600, "review_pending", 1],
];
const seedCorrections: Record<string, { value: number; note: string; at: string }> = {
  "iv-002": { value: 1180, note: "Corrected from verified source appendix", at: "2026-01-08T10:00:00.000Z" },
  "iv-005": { value: 1520, note: "Aligned with published regional dataset", at: "2026-02-14T11:30:00.000Z" },
  "iv-009": { value: 3.2, note: "Updated against source table", at: "2026-09-13T09:00:00.000Z" },
};
const seedIndicatorValues: IndicatorValue[] = indicatorSeeds.reduce<IndicatorValue[]>((rows, [id, key, pathwayIndex, value, status, day], index) => {
  const definition = indicatorDefinition(key);
  if (!definition) return rows;
  const target = targetForPathway(definition.scope, seedPathways[pathwayIndex]);
  if (findIndicatorValue(rows, key, target)) return rows;
  const correction = seedCorrections[id];
  rows.push({
    ...common(id, day), indicator_key: key, scope: definition.scope, target, value, unit: definition.unit,
    value_date: id === "iv-018" ? null : iso(1 + (index % 12)), status,
    corrected_value: correction?.value ?? null, correction_note: correction?.note ?? null, corrected_at: correction?.at ?? null,
  });
  return rows;
}, []);

const auditSeed = (id: string, timestamp: string, actor: string, entity_type: AuditEntityType, entity_id: string, field: string | null, prior_value: unknown, new_value: unknown, operation: AuditOperation, extra: Partial<AuditEntry> = {}): AuditEntry => ({
  id, created_at: timestamp, updated_at: timestamp, status_changed_at: timestamp, last_actor: actor, trace_id: `tr_seed${id.slice(-3)}91de7c`, timestamp, actor, entity_type, entity_id, field, prior_value, new_value, operation, note: null, reverts_entry_id: null, ...extra,
});

// Every latest seed value mirrors its record. audit-002 is superseded by audit-003;
// audit-004 is already reverted by audit-005.
const seedAuditEntries: AuditEntry[] = [
  auditSeed("audit-001", iso(4, 9), "Anže", "pathway", "pw-001", "status", "approved", "needs_approval", "update", { note: "Flagged for a final definition check" }),
  auditSeed("audit-002", iso(5, 10), "Anže", "pathway", "pw-002", "group_id", null, "grp-002", "update"),
  auditSeed("audit-004", iso(7, 8), "Anže", "indicator_value", "iv-003", "value", 0, 24, "update"),
  auditSeed("audit-005", iso(7, 12), "Jon Goriup", "indicator_value", "iv-003", "value", 24, 0, "revert", { reverts_entry_id: "audit-004" }),
  auditSeed("audit-006", iso(8, 9), "Jon Goriup", "company", "co-001", "status", "accepted", "review_pending", "update", { note: "Evidence requires verification" }),
  auditSeed("audit-007", iso(8, 13), "Anže", "patent_match", "pp-002", "status", "review_pending", "accepted", "accept"),
  auditSeed("audit-008", iso(9, 10), "Jon Goriup", "company", "co-003", "registry_id", "AT-OLD-110", null, "update"),
  auditSeed("audit-009", iso(9, 15), "Anže", "pathway", "pw-004", "status", "approved", "locked", "deactivate", { note: "Reserved for sales and marketing" }),
  auditSeed("audit-010", iso(10, 9), "Jon Goriup", "indicator_value", "iv-007", "value", 1900, null, "update", { note: "Source no longer reports this value" }),
  auditSeed("audit-011", iso(10, 14), "Anže", "company", "co-004", "status", "review_pending", "rejected", "reject"),
  auditSeed("audit-012", iso(11, 10), "Jon Goriup", "paper_match", "pp-001", "note", null, "Check pathway specificity", "update"),
  auditSeed("audit-013", iso(12, 11), "Anže", "pathway", "pw-003", "visibility_scope", "all", ["VCG.AI"], "update"),
  auditSeed("audit-014", iso(13, 9), "Jon Goriup", "indicator_value", "iv-009", "corrected_value", null, 3.2, "update", { note: "Updated against source table" }),
  auditSeed("audit-015", iso(14, 10), "Anže", "paper_match", "pp-003", "status", "accepted", "review_pending", "update"),
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
      const field = target.entity_type === "group" ? "is_archived" : "status";
      const status = target.entity_type === "pathway" ? "deleted" : target.entity_type === "group" ? true : "rejected";
      return recordChange({ entity_type: target.entity_type, entity_id: target.entity_id, field, prior_value: field in record ? record[field as keyof HitlRecord] : null, new_value: status, operation: "revert", reverts_entry_id: target.id, note: `Reverted ${target.operation} entry ${target.id}` });
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
