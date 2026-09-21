import { NODE_LABELS, cleanNodeList, sortedRoles, type Company, type CompanyRole } from "@/lib/hitlStore";
import type { PathwayNodeKey } from "@/components/hitl/PathwayRef";

const labels: Record<CompanyRole, string> = {
  feedstock_supplier: "Feedstock supplier",
  product_manufacturer: "Product manufacturer",
  application_offtaker: "Application offtaker",
};

const positions = {
  feedstock_supplier: { positionKey: "feedstock", positionLabel: NODE_LABELS.feedstock, verb: "Supplies" },
  product_manufacturer: { positionKey: "product", positionLabel: NODE_LABELS.product, verb: "Produces" },
  application_offtaker: { positionKey: "application_market", positionLabel: NODE_LABELS.application_market, verb: "Offtakes" },
} satisfies Record<CompanyRole, { positionKey: PathwayNodeKey; positionLabel: string; verb: string }>;

export const companyRoleLabels = labels;
export type CompanyRoleNodeRef = { role: CompanyRole; roleLabel: string; positionKey: PathwayNodeKey; positionLabel: string; verb: string; values: string[]; value: string };

type CompanyRoleData = Pick<Company, "roles" | "role_nodes">;

// One entry per role the company holds, in a stable order.
export function roleNodeRefs(company: CompanyRoleData): CompanyRoleNodeRef[] {
  return sortedRoles(company.roles).map(role => {
    const values = cleanNodeList(company.role_nodes[role]);
    return { ...positions[role], role, roleLabel: labels[role], values, value: values.join(", ") };
  });
}
export function roleNodePositionKeys(company: CompanyRoleData): PathwayNodeKey[] {
  return roleNodeRefs(company).map(ref => ref.positionKey);
}
export function roleNodesSummary(company: CompanyRoleData): string {
  return roleNodeRefs(company).map(ref => `${ref.positionLabel} · ${ref.value || "not set"}`).join(" · ");
}
