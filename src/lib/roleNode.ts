import type { Company, CompanyRole } from "@/lib/hitlStore";
import type { PathwayNodeKey } from "@/components/hitl/PathwayRef";

const labels: Record<CompanyRole, string> = {
  feedstock_supplier: "Feedstock supplier",
  product_manufacturer: "Product manufacturer",
  application_offtaker: "Application offtaker",
};

const positions = {
  feedstock_supplier: { positionKey: "feedstock", positionLabel: "Feedstock", verb: "Supplies" },
  product_manufacturer: { positionKey: "product", positionLabel: "Product", verb: "Produces" },
  application_offtaker: { positionKey: "application_market", positionLabel: "Application/Market", verb: "Offtakes" },
} satisfies Record<CompanyRole, { positionKey: PathwayNodeKey; positionLabel: string; verb: string }>;

export const companyRoleLabels = labels;
export function roleNode(company: Pick<Company, "role" | "role_node">) {
  return { ...positions[company.role], roleLabel: labels[company.role], value: company.role_node };
}