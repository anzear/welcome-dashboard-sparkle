export type LookupKind = "paper" | "patent";

export interface LookupResult {
  title: string;
  year: number;
  authors_or_assignee: string;
  abstract: string;
  source: "Semantic Scholar" | "USPTO";
}

const paperTemplates = [
  ["Valorisation of lignocellulosic residues through integrated biorefining", "M. Novak, L. Weber, S. Chen"],
  ["Fermentative production of renewable platform chemicals from side streams", "A. Rossi, J. Lindström"],
  ["Process intensification for circular bio-based manufacturing", "E. García, P. Müller"],
] as const;
const patentTemplates = [
  ["Integrated process for conversion of renewable feedstocks", "BASF SE"],
  ["Continuous fermentation and product recovery system", "Novozymes A/S"],
  ["Catalytic upgrading of biomass-derived intermediates", "Fraunhofer-Gesellschaft"],
] as const;

const wait = () => new Promise(resolve => window.setTimeout(resolve, 600));
const pick = (value: string, length: number) => [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0) % length;

export async function lookupDoi(doi: string): Promise<LookupResult> {
  await wait();
  const value = doi.trim();
  if (!/^10\.\d{4,9}\/\S+$/i.test(value)) throw new Error("Invalid DOI format");
  if (value.toUpperCase().includes("FAIL")) throw new Error("No record found for this DOI");
  const template = paperTemplates[pick(value, paperTemplates.length)];
  return { title: template[0], year: 2021 + pick(value, 5), authors_or_assignee: template[1], abstract: "This peer-reviewed study examines conversion performance, resource efficiency and scale-up constraints for a European bioeconomy pathway using industrially relevant operating conditions.", source: "Semantic Scholar" };
}

export async function lookupPatent(id: string): Promise<LookupResult> {
  await wait();
  const value = id.trim().toUpperCase();
  if (!/^[A-Z]{2}[A-Z0-9]{6,12}$/.test(value)) throw new Error("Invalid patent ID format");
  if (value.includes("FAIL")) throw new Error("No record found for this patent ID");
  const template = patentTemplates[pick(value, patentTemplates.length)];
  return { title: template[0], year: 2019 + pick(value, 7), authors_or_assignee: template[1], abstract: "The disclosure describes an integrated reaction, separation and recovery sequence for producing purified bio-based intermediates from renewable raw materials.", source: "USPTO" };
}