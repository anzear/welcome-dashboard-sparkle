import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CompanyBriefData, PathwayScores } from "@/store/companyBriefStore";

export interface PathwayInfo {
  feedstock?: string;
  process?: string;
  material?: string;
  application?: string;
  trl?: string;
}

interface ExportArgs {
  category?: string;
  topic?: string;
  pathwayLabel?: string;
  pathwayInfo?: PathwayInfo;
  brief: CompanyBriefData;
  scores: PathwayScores;
}

const statusLabel: Record<string, string> = {
  met: "Met",
  partial: "Partial",
  not_met: "Not met",
  "": "—",
};

const priorityStatusLabel: Record<string, string> = {
  go: "Go",
  open: "Open",
  blocked: "Blocked",
  "": "—",
};

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
};



export function exportCompanyPdf({
  category,
  topic,
  pathwayLabel,
  pathwayInfo,
  brief,
  scores,
}: ExportArgs) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  const addPageIfNeeded = (needed = 60) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const h1 = (text: string) => {
    addPageIfNeeded(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(20);
    doc.text(text, margin, y);
    y += 20;
  };

  const h2 = (text: string) => {
    addPageIfNeeded(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text(text, margin, y);
    y += 14;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  };

  const para = (text: string) => {
    if (!text) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(140);
      addPageIfNeeded(16);
      doc.text("—", margin, y);
      y += 14;
      return;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    lines.forEach((ln: string) => {
      addPageIfNeeded(14);
      doc.text(ln, margin, y);
      y += 13;
    });
    y += 4;
  };

  const table = (head: string[][], body: string[][]) => {
    autoTable(doc, {
      head,
      body,
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 4, textColor: 50 },
      headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawPage: () => {
        y = margin;
      },
    });
    // @ts-expect-error lastAutoTable injected by plugin
    y = doc.lastAutoTable.finalY + 16;
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text("Company Evaluation Report", margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  const meta = [
    category ? `Category: ${category}` : null,
    topic ? `Topic: ${topic}` : null,
    pathwayLabel ? `Pathway: ${pathwayLabel}` : null,
    `Generated: ${new Date().toLocaleString()}`,
  ]
    .filter(Boolean)
    .join("   |   ");
  doc.text(meta, margin, y);
  y += 20;

  // ============ COMPANY BRIEF ============
  h1("Company Brief");

  h2("Material Description");
  para(brief.materialDescription);

  h2("Constraints");
  para(brief.constraints);

  h2("Target Properties");
  if (brief.properties.length === 0) {
    para("No properties defined.");
  } else {
    table(
      [["Property", "Target value", "Unit", "Note"]],
      brief.properties.map((p) => [p.property || "—", p.value || "—", p.unit || "—", p.note || ""])
    );
  }

  h2("Goals");
  if (brief.goals.length === 0) {
    para("No goals defined.");
  } else {
    table(
      [["Goal", "Tags", "Target date", "TRL"]],
      brief.goals.map((g) => [g.text || "—", (g.tags || []).join(", "), g.date || "—", g.trl || "—"])
    );
  }

  h2("Weighted Priorities");
  if (brief.criteria.length === 0) {
    para("No priorities defined.");
  } else {
    const totalW = brief.criteria.reduce((s, c) => s + (c.weight || 0), 0);
    table(
      [["Priority", "Weight", "Normalized", "Note"]],
      brief.criteria.map((c) => [
        c.name || "Untitled",
        `${c.weight || 0}%`,
        totalW > 0 ? `${Math.round(((c.weight || 0) / totalW) * 100)}%` : "—",
        c.note || "",
      ])
    );
  }

  h2("Attachments");
  if (brief.attachments.length === 0) {
    para("No attachments.");
  } else {
    table(
      [["Type", "Label", "Reference"]],
      brief.attachments.map((a) =>
        a.kind === "link"
          ? ["Link", a.label || "—", a.url]
          : ["File", a.label || "—", `${a.fileName} (${Math.round(a.size / 1024)} KB)`]
      )
    );
  }

  // ============ COMPANY EVALUATION ============
  doc.addPage();
  y = margin;
  h1(`Pathway Evaluation — ${pathwayLabel || "Pathway"}`);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Evaluating: ${pathwayLabel || "—"}${topic ? `  |  Topic: ${topic}` : ""}`,
    margin,
    y
  );
  y += 16;
  doc.setTextColor(60);

  h2("Pathway Overview");
  table(
    [["Feedstock", "Process", "Material", "Application", "TRL"]],
    [[
      pathwayInfo?.feedstock || "—",
      pathwayInfo?.process || "—",
      pathwayInfo?.material || topic || "—",
      pathwayInfo?.application || "—",
      pathwayInfo?.trl || "—",
    ]]
  );

  h2("Target Properties Check");
  if (brief.properties.length === 0) {
    para("No properties to evaluate.");
  } else {
    table(
      [["Property", "Target", "Unit", "This pathway", "Status", "Note"]],
      brief.properties.map((p) => {
        const a = scores.propertyAssessments?.[p.id] ?? { value: "", status: "", note: "" };
        return [
          p.property || "—",
          p.value || "—",
          p.unit || "—",
          a.value || "—",
          statusLabel[a.status] ?? "—",
          a.note || "",
        ];
      })
    );
  }

  h2("Company Fit Score");
  const totalW = brief.criteria.reduce((s, c) => s + (c.weight || 0), 0);
  let fit = 0;
  if (totalW > 0) {
    const weighted = brief.criteria.reduce(
      (sum, c) => sum + (c.weight || 0) * (scores.priorityScores?.[c.id] ?? 0),
      0
    );
    fit = Math.round(weighted / totalW);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(fit >= 70 ? 22 : fit >= 40 ? 180 : 100, fit >= 70 ? 130 : fit >= 40 ? 130 : 100, fit >= 70 ? 60 : 30);
  doc.text(`${fit}`, margin, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("WEIGHTED FIT (0-100)", margin + 40, y);
  y += 26;
  doc.setTextColor(60);

  if (brief.criteria.length === 0) {
    para("No priorities to score.");
  } else {
    table(
      [["Priority", "Weight", "Score", "Status", "Note", "Updated by", "Updated at"]],
      brief.criteria.map((c) => {
        const meta = scores.priorityMeta?.[c.id];
        return [
          c.name || "Untitled",
          `${c.weight || 0}%`,
          String(scores.priorityScores?.[c.id] ?? 0),
          priorityStatusLabel[meta?.status ?? ""] ?? "—",
          scores.priorityNotes?.[c.id] ?? "",
          meta?.updatedBy || "—",
          fmtDate(meta?.updatedAt || ""),
        ];
      })
    );
  }

  const safeTopic = (topic || "company").replace(/[^a-z0-9-_]+/gi, "_");
  doc.save(`company-evaluation-${safeTopic}-${pathwayLabel || "pathway"}.pdf`);
}
