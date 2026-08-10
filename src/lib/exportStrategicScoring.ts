import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ScoringExportInput = {
  volume: number | "";
  volumeUnit: string;
  ghg: number | "";
  ghgMode: "fxv" | "total";
  spend: number | "";
  spendMode: "fxv" | "total";
  spendCurrency: string;
  supplierCount: number | "";
  supplierCountries: { id: string; country: string; share: number | "" }[];
  stars: Record<string, number>;
  supplySource: "single" | "multi";
  priorityNote: string;
  productGated: boolean;
};

const STAR_TITLES: Record<string, string> = {
  regulatory: "Regulatory pressure",
  supplySecurity: "Supply security",
  internalMandate: "Internal mandate",
  performanceUpside: "Performance upside",
  marketPull: "Market pull",
  marketingClaim: "Marketing claim",
  sustainabilityImprovement: "Sustainability improvement",
  costOpportunity: "Cost / Economic opportunity",
};

const dash = (v: unknown) => (v === "" || v === undefined || v === null ? "—" : String(v));

const ghgTotal = (s: ScoringExportInput) =>
  typeof s.ghg === "number"
    ? s.ghgMode === "fxv"
      ? typeof s.volume === "number"
        ? s.volume * s.ghg
        : 0
      : s.ghg
    : 0;

const spendTotal = (s: ScoringExportInput) =>
  typeof s.spend === "number"
    ? s.spendMode === "fxv"
      ? typeof s.volume === "number"
        ? s.volume * s.spend
        : 0
      : s.spend
    : 0;

export function buildScoringRows(
  s: ScoringExportInput,
  meta: { material: string; score: number; tier: string }
): string[][] {
  return [
    ["Material", meta.material, ""],
    ["Priority score", String(meta.score), "0–100"],
    ["Priority tier", meta.tier, ""],
    ["Volume (target)", dash(s.volume), s.volumeUnit],
    ["Volume source data", (s as any).volumeSource || "—", ""],
    ["GHG input", dash(s.ghg), s.ghgMode === "fxv" ? "per ton" : "total"],
    ["GHG total", ghgTotal(s).toLocaleString(), "tCO₂e/yr"],
    ["GHG source data", (s as any).ghgSource || "—", ""],
    ["Spend input", dash(s.spend), `${s.spendMode === "fxv" ? "per ton" : "total"} (${s.spendCurrency})`],
    ["Spend total", spendTotal(s).toLocaleString(), `${s.spendCurrency}/yr`],
    ["Spend source data", (s as any).spendSource || "—", ""],
    ["Suppliers", dash(s.supplierCount), "count"],
    ...(s.supplierCountries.length
      ? s.supplierCountries.map((c) => [
          "Supplier country",
          c.country || "—",
          c.share === "" ? "— % of volume" : `${c.share}% of volume`,
        ])
      : [["Supplier country", "—", ""]]),
    ["Suppliers source data", (s as any).suppliersSource || "—", ""],
    ["Supply source", s.supplySource === "single" ? "Single source" : "Multi source", ""],
     ...Object.keys(STAR_TITLES).map((k) => [STAR_TITLES[k], `${s.stars[k] ?? 0}`, "of 5"]),
     ["Product gated", s.productGated ? "Yes" : "No", ""],
    ["Priority note", s.priorityNote || "—", ""],
  ];
}

const fileBase = (material: string) =>
  `strategic-scoring-${(material || "material").replace(/[^a-z0-9-_]+/gi, "_")}`;

export function exportScoringCsv(s: ScoringExportInput, meta: { material: string; score: number; tier: string }) {
  const rows = [["Field", "Value", "Unit / detail"], ...buildScoringRows(s, meta)];
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileBase(meta.material)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportScoringPdf(s: ScoringExportInput, meta: { material: string; score: number; tier: string }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Strategic Scoring Results", margin, margin);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(
    `${meta.material || "Material"}   |   Priority ${meta.score} (${meta.tier})   |   Generated: ${new Date().toLocaleString()}`,
    margin,
    margin + 18
  );
  autoTable(doc, {
    head: [["Field", "Value", "Unit / detail"]],
    body: buildScoringRows(s, meta),
    startY: margin + 34,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 5, textColor: 50 },
    headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: { 0: { cellWidth: 190 }, 2: { cellWidth: 130 } },
  });
  doc.save(`${fileBase(meta.material)}.pdf`);
}
