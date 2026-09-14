import type { CompanyMatch, Pathway } from "@/lib/hitlStore";
import type { PathwayNodeKey } from "@/components/hitl/PathwayRef";

const roleMap = {
  feedstock_supplier: { positionKey: "feedstock", positionLabel: "Feedstock", verb: "Supplies" },
  product_manufacturer: { positionKey: "product", positionLabel: "Product", verb: "Produces" },
  application_offtaker: { positionKey: "application_market", positionLabel: "Application/Market", verb: "Offtakes" },
} as const;

export function roleNode(match: CompanyMatch, pathway?: Pathway): { positionKey: PathwayNodeKey; positionLabel: string; value: string | null; verb: string } {
  const mapping = roleMap[match.role];
  return { ...mapping, value: pathway?.[mapping.positionKey] ?? null };
}
