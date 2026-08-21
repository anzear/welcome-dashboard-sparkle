import { JUDGED_CRITERIA } from "@/config/assessmentCriteria";
import { seedMaterialsWithHistory } from "@/data/materialEventsMock";
import { seedAssessments } from "@/data/assessmentMock";
import type { DocumentFileType, SupportingDocument } from "@/types/materialPrioritisation";

type Template = {
  filename: string;
  file_type: DocumentFileType;
  size: string;
  note: string | null;
  by: string;
  date: string;
};

/** Files as they actually get named inside a company, notes as a person writes them. */
const TEMPLATES: Template[] = [
  {
    filename: "Persil_alt_surfactant_feasibility_2024.pdf",
    file_type: "pdf",
    size: "1.4 MB",
    note: "Concluded C12-C14 swap fails at low temp wash",
    by: "L. Haugen",
    date: "2026-02-04",
  },
  {
    filename: "RE_ Supplier capacity SE Asia.msg",
    file_type: "msg",
    size: "88 KB",
    note: "Supplier confirmed no capacity before 2027",
    by: "N. Kowalczyk",
    date: "2026-01-22",
  },
  {
    filename: "Q3_regulatory_watchlist_surfactants.xlsx",
    file_type: "xlsx",
    size: "412 KB",
    note: "Two of our grades appear on the 2027 watchlist",
    by: "M. Oyelaran",
    date: "2026-03-11",
  },
  {
    filename: "Consumer_claim_test_biobased_2025.pptx",
    file_type: "pptx",
    size: "6.2 MB",
    note: "Claim tested well on shampoo, weak on hand wash",
    by: "A. Vermeer",
    date: "2025-11-19",
  },
  {
    filename: "Coco_glucoside_lowtemp_wash_results.docx",
    file_type: "docx",
    size: "740 KB",
    note: "Foam profile held at 20C, viscosity did not",
    by: "K. Brandt",
    date: "2026-02-27",
  },
  {
    filename: "Pilot_line_trial_notes_Feb26.docx",
    file_type: "docx",
    size: "310 KB",
    note: "Two blocked nozzles on the second run",
    by: "S. Rautio",
    date: "2026-02-14",
  },
  {
    filename: "Cost_delta_biobased_vs_petro_2026.xlsx",
    file_type: "xlsx",
    size: "196 KB",
    note: "Gap sits at 34% before volume commitment",
    by: "L. Haugen",
    date: "2026-01-30",
  },
  {
    filename: "Supplier_audit_report_Lonza_2025.pdf",
    file_type: "pdf",
    size: "2.8 MB",
    note: "Audit passed, mass balance certification pending",
    by: "N. Kowalczyk",
    date: "2025-12-08",
  },
  {
    filename: "FW_ Legal view on palm-free claim.msg",
    file_type: "msg",
    size: "64 KB",
    note: "Legal will not sign off palm-free wording yet",
    by: "A. Vermeer",
    date: "2026-03-02",
  },
  {
    filename: "Stability_panel_photos_wk8.png",
    file_type: "png",
    size: "1.1 MB",
    note: "Phase separation visible at week 8",
    by: "K. Brandt",
    date: "2026-01-17",
  },
  {
    filename: "Scope3_recalculation_memo_2026.pdf",
    file_type: "pdf",
    size: "980 KB",
    note: "Emission factor drops 18% with the bio route",
    by: "M. Oyelaran",
    date: "2026-02-20",
  },
  {
    filename: "Second_source_qualification_plan.xlsx",
    file_type: "xlsx",
    size: "148 KB",
    note: "Qualification runs to Q1 2027 at the earliest",
    by: "S. Rautio",
    date: "2026-03-06",
  },
];

/** Documents seed only where assessments exist, and only on a handful of criteria. */
const CARRIED = ["regulatory_pressure", "supply_security", "sustainability_impact", "product_performance"];
const CRIT = JUDGED_CRITERIA.filter((c) => CARRIED.includes(c.criterion_id)).map(
  (c) => c.criterion_id,
);

const hasEntries = (materialId: string, criterionId: string) =>
  Object.values(seedAssessments).some(
    (e) => e.material_id === materialId && e.criterion_id === criterionId,
  );

const materialsWithEntries = seedMaterialsWithHistory.filter((m) =>
  CRIT.some((c) => hasEntries(m.material_id, c)),
);
const materialsWithout = seedMaterialsWithHistory.filter(
  (m) => !CRIT.some((c) => hasEntries(m.material_id, c)),
);

/**
 * Roughly a dozen materials carry evidence, weighted to those already assessed.
 * Thin evidence is left thin — an empty criterion stays empty rather than being
 * padded out. One document lands on a criterion nobody has scored: evidence
 * arriving before opinion is normal.
 */
export const seedDocuments: SupportingDocument[] = (() => {
  const out: SupportingDocument[] = [];
  let t = 0;
  const next = () => TEMPLATES[t++ % TEMPLATES.length];

  const push = (materialId: string, criterionId: string) => {
    const tpl = next();
    out.push({
      document_id: `doc-${out.length + 1}`,
      material_id: materialId,
      criterion_id: criterionId,
      filename: tpl.filename,
      file_type: tpl.file_type,
      size: tpl.size,
      note: tpl.note,
      uploaded_by: tpl.by,
      uploaded_date: tpl.date,
    });
  };

  const pool = [...materialsWithEntries];

  /** ~6 materials: one document on one criterion. */
  pool.slice(0, 6).forEach((m, i) => push(m.material_id, CRIT[i % CRIT.length]));

  /** ~4 materials: documents across two criteria. */
  pool.slice(6, 10).forEach((m, i) => {
    push(m.material_id, CRIT[i % CRIT.length]);
    push(m.material_id, CRIT[(i + 1) % CRIT.length]);
  });

  /** 2 materials: several on one criterion, one of them past the collapse. */
  const deep = pool.slice(10, 12);
  if (deep[0]) {
    for (let k = 0; k < 6; k += 1) push(deep[0].material_id, CRIT[0]);
  }
  if (deep[1]) {
    for (let k = 0; k < 3; k += 1) push(deep[1].material_id, CRIT[2]);
  }

  /** One document where nobody has scored that criterion yet. */
  const unscored = materialsWithout[0];
  if (unscored) push(unscored.material_id, CRIT[1]);

  return out;
})();
