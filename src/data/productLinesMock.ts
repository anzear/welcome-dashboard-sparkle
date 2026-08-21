// Product line assignment across the register. Company-entered field values, with real
// overlap: surfactants and solvents run across several brand lines, specialty
// materials usually sit in one, and a handful carry no product line at all.

import type { FieldProvenance, Material } from "@/types/materialPrioritisation";
import { PRODUCT_LINES, cleanProductLines } from "@/components/materialRegister/productLines";

const LOAD_SOURCE = "Material master 2026-01";
const LOAD_DATE = "2026-01-18";

/** Broad-use groups sit in several lines; specialties in one. */
const BY_GROUP: Record<string, string[][]> = {
  Surfactants: [
    ["Persil", "Pril", "Bref"],
    ["Persil", "Somat"],
    ["Pril", "Perwoll"],
    ["Persil", "Pril", "Perwoll"],
  ],
  Solvents: [
    ["Bref", "Pril"],
    ["Bref", "Somat", "Pril"],
  ],
  Builders: [["Somat", "Persil"]],
  Chelants: [
    ["Somat", "Persil"],
    ["Persil"],
    ["Somat"],
  ],
  Enzymes: [["Persil", "Somat"]],
  Rheology: [
    ["Pril", "Bref"],
    ["Perwoll"],
    ["Pril"],
  ],
  Conditioning: [["Perwoll"], ["Perwoll", "Persil"]],
  Emollients: [["Perwoll"], ["Pril"], ["Perwoll", "Pril"]],
  Preservatives: [["Bref"], ["Pril"], ["Persil"]],
  Opacifiers: [["Pril"], ["Perwoll"]],
  Fragrance: [["Bref", "Perwoll"]],
  "pH control": [["Bref"]],
};

/** Deliberately left without a product line — the master is never complete. */
const NO_LINE = new Set(["MAT-0007", "MAT-0019", "MAT-0028", "MAT-0036", "MAT-0051", "MAT-0068"]);

const provenance: FieldProvenance = {
  origin: "ingested",
  source: LOAD_SOURCE,
  date: LOAD_DATE,
} as FieldProvenance;

export function applyProductLines(rows: Material[]): Material[] {
  const counters = new Map<string, number>();
  return rows.map((m, i) => {
    if (NO_LINE.has(m.material_id)) return m;
    const group = (m.tags ?? []).find((t) => BY_GROUP[t]) ?? null;
    const options = group ? BY_GROUP[group] : null;
    let lines: string[];
    if (options) {
      const n = counters.get(group!) ?? 0;
      counters.set(group!, n + 1);
      lines = options[n % options.length];
    } else {
      lines = [PRODUCT_LINES[i % PRODUCT_LINES.length]];
    }
    return {
      ...m,
      product_lines: cleanProductLines(lines),
      provenance: {
        ...m.provenance,
        product_lines: m.provenance?.product_lines ?? provenance,
      },
    };
  });
}
