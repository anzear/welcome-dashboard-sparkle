import { EMPTY_GATE } from "@/types/materialPrioritisation";
import { cleanTags } from "@/components/materialRegister/tags";
import { materials as seedMaterials } from "@/data/materialPrioritisationMock";
import type {
  EntryType,
  FieldProvenance,
  JourneyStatus,
  Material,
  MaterialRequirements,
  ProvenanceOrigin,
} from "@/types/materialPrioritisation";

export const ENTRY_TYPES: { id: EntryType; label: string; description: string }[] = [
  {
    id: "drop_in",
    label: "Drop-in",
    description: "Same material, renewable or circular source",
  },
  {
    id: "substitution",
    label: "Substitution",
    description: "Different chemistry, replaces an existing material",
  },
  {
    id: "new_material",
    label: "New material",
    description: "Nothing being replaced",
  },
];

/** Panel A only makes sense when something is actually being replaced. */
export const showsReplacedPanel = (t: EntryType) => t !== "new_material";

/** Classes already in the register — the ontology the fake lookup resolves against. */
export const SEEDED_CLASSES: string[] = [
  ...new Set(seedMaterials.map((m) => m.material_class).filter((v): v is string => Boolean(v))),
].sort((a, b) => a.localeCompare(b));

const CAS_TO_CLASS = new Map<string, string>();
seedMaterials.forEach((m) => {
  if (m.cas_number && m.material_class && !CAS_TO_CLASS.has(m.cas_number)) {
    CAS_TO_CLASS.set(m.cas_number, m.material_class);
  }
});

export interface OntologyResult {
  material_class: string | null;
  /** false when the CAS is not in the ontology — a warning, never a blocker. */
  found: boolean;
}

/**
 * Simulated VCG ontology lookup. Exact CAS hits resolve to the class already on
 * record; anything else returns a deterministic proposal flagged as not found, so
 * a guess never reads as a confirmed classification.
 */
export function lookupCas(cas: string | null): OntologyResult {
  const key = (cas ?? "").trim();
  if (!key) return { material_class: null, found: false };
  const hit = CAS_TO_CLASS.get(key);
  if (hit) return { material_class: hit, found: true };
  if (!/^\d{2,7}-\d{2}-\d$/.test(key)) return { material_class: null, found: false };
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) % 100000;
  return { material_class: SEEDED_CLASSES[h % SEEDED_CLASSES.length] ?? null, found: false };
}

export const today = () => new Date().toISOString().slice(0, 10);

export const provenanceOf = (
  origin: ProvenanceOrigin,
  source: string,
  date: string = today(),
): FieldProvenance => ({ origin, source, date });

/** "" and whitespace are null. Never 0. */
export const toNullString = (v: string | null | undefined): string | null => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

export interface NumberParse {
  value: number | null;
  error: boolean;
}

/** Blank parses to null. Unparseable is an error, not a zero. */
export function parseNumberCell(raw: string | null | undefined): NumberParse {
  const t = (raw ?? "").trim();
  if (t === "") return { value: null, error: false };
  const cleaned = t.replace(/\s/g, "").replace(/,/g, ".").replace(/[€$]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return { value: null, error: true };
  return { value: n, error: false };
}

export const splitList = (raw: string | null | undefined): string[] =>
  (raw ?? "")
    .split(/[;|]/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Both derived figures: present only when both inputs are present. */
export const computeSpend = (volume: number | null, price: number | null): number | null =>
  volume === null || price === null ? null : Math.round(volume * 1000 * price);

export const computeGhg = (volume: number | null, factor: number | null): number | null =>
  volume === null || factor === null ? null : Math.round(volume * factor);

export const emptyRequirements = (): MaterialRequirements => ({
  target_volume: null,
  price_ceiling: null,
  ghg_reduction_target: null,
  required_certifications: [],
  earliest_need_date: null,
  notes: null,
});

export const requirementsOrNull = (r: MaterialRequirements): MaterialRequirements | null => {
  const stated =
    r.target_volume !== null ||
    r.price_ceiling !== null ||
    r.ghg_reduction_target !== null ||
    r.required_certifications.length > 0 ||
    r.earliest_need_date !== null ||
    (r.notes !== null && r.notes.trim() !== "");
  return stated ? r : null;
};

/** A blank register row. Every figure starts null so nothing reads as measured. */
export function blankMaterial(entry_type: EntryType = "drop_in"): Omit<Material, "material_id"> {
  return {
    ...EMPTY_GATE,
    gate_conditions: [],
    customer_material_ids: [],
    name: "",
    cas_number: null,
    material_class: null,
    tags: [],
    application_categories: [],
    product_categories: [],
    entry_type,
    annual_volume: null,
    unit_price: null,
    annual_spend: null,
    ghg_emission_factor: null,
    ghg_contribution: null,
    ghg_boundary: null,
    ghg_data_basis: null,
    // VCG has not looked at a freshly added material yet. Not assessed, never zero.
    substitutability_readiness: "not_assessed" as const,
    supplier_availability: { value: null, capped: false, assessed: false },
    competitor_activity: "not_assessed" as const,
    vcg_data_date: null,
    journey_status: "under_evaluation" as JourneyStatus,
    requirements: null,
    blocker_category: null,
    blocker_detail: null,
    blocker_date: null,
    blocker_condition: null,
    owner: null,
    priority_period: null,
    intelligence_status: "not_ordered",
    intelligence_ordered_date: null,
    intelligence_delivered_date: null,
    intelligence_scope: null,
    last_status_change_date: null,
    last_status_user: null,
    last_change_batch_origin: null,
    provenance: {},
  };
}

/* ---------------------------------------------------------------- CSV support */

export interface CsvColumn {
  field: string;
  label: string;
  kind: "text" | "number" | "list" | "status" | "entry_type" | "date";
  example1: string;
  example2: string;
}

export const CSV_COLUMNS: CsvColumn[] = [
  { field: "name", label: "Name", kind: "text", example1: "Propylene glycol", example2: "Sorbitol" },
  { field: "cas_number", label: "CAS number", kind: "text", example1: "57-55-6", example2: "50-70-4" },
  { field: "material_class", label: "Material class", kind: "text", example1: "Glycol solvent", example2: "Polyol" },
  {
    field: "customer_material_ids",
    label: "Customer material IDs",
    kind: "list",
    example1: "SKU-10001;SKU-10002",
    example2: "SKU-24110",
  },
  {
    field: "tags",
    label: "Tags",
    kind: "list",
    example1: "Solvents;Q3 review",
    example2: "Humectants",
  },
  {
    field: "application_categories",
    label: "Application categories",
    kind: "list",
    example1: "Cleaning formulations;Personal care",
    example2: "Personal care",
  },
  {
    field: "product_categories",
    label: "Product categories",
    kind: "list",
    example1: "Hard surface cleaner",
    example2: "Skin care",
  },
  {
    field: "entry_type",
    label: "Entry type",
    kind: "entry_type",
    example1: "drop_in",
    example2: "substitution",
  },
  { field: "annual_volume", label: "Annual volume (t/yr)", kind: "number", example1: "4200", example2: "" },
  { field: "unit_price", label: "Unit price (EUR/kg)", kind: "number", example1: "1.42", example2: "2.10" },
  { field: "annual_spend", label: "Annual spend (EUR)", kind: "number", example1: "", example2: "" },
  {
    field: "ghg_emission_factor",
    label: "GHG emission factor (kgCO2e/kg)",
    kind: "number",
    example1: "3.1",
    example2: "",
  },
  { field: "ghg_contribution", label: "GHG contribution (tCO2e/yr)", kind: "number", example1: "", example2: "" },
  {
    field: "ghg_boundary",
    label: "GHG boundary",
    kind: "text",
    example1: "Cradle-to-gate (A1-A3)",
    example2: "",
  },
  { field: "ghg_data_basis", label: "GHG data basis", kind: "text", example1: "Supplier-specific", example2: "" },
  { field: "journey_status", label: "Gate status", kind: "status", example1: "under_evaluation", example2: "" },
  { field: "owner", label: "Owner", kind: "text", example1: "L. Haugen", example2: "" },
  { field: "target_volume", label: "Target volume (t/yr)", kind: "number", example1: "1000", example2: "" },
  { field: "price_ceiling", label: "Price ceiling (EUR/kg)", kind: "number", example1: "1.80", example2: "" },
  {
    field: "ghg_reduction_target",
    label: "GHG reduction target (%)",
    kind: "number",
    example1: "30",
    example2: "",
  },
  {
    field: "required_certifications",
    label: "Required certifications",
    kind: "list",
    example1: "ISCC PLUS;RSPO",
    example2: "",
  },
  { field: "earliest_need_date", label: "Earliest need date", kind: "date", example1: "2026-09-01", example2: "" },
  { field: "notes", label: "Notes", kind: "text", example1: "Two plants qualified already", example2: "" },
];

export const CERTIFICATIONS = [
  "ISCC PLUS",
  "RSPO",
  "REDcert2",
  "Bonsucro",
  "FSC",
  "Ecocert / COSMOS",
  "EU Ecolabel",
];

const csvCell = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function templateCsv(): string {
  const header = CSV_COLUMNS.map((c) => c.field).join(",");
  const r1 = CSV_COLUMNS.map((c) => csvCell(c.example1)).join(",");
  const r2 = CSV_COLUMNS.map((c) => csvCell(c.example2)).join(",");
  return [header, r1, r2].join("\n") + "\n";
}

/** Minimal RFC4180-ish parser: quoted fields, embedded commas and newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Auto-match headers on obvious names. Anything unmatched stays unmapped. */
export function autoMatch(headers: string[]): (string | null)[] {
  return headers.map((h) => {
    const n = norm(h);
    const exact = CSV_COLUMNS.find((c) => norm(c.field) === n || norm(c.label) === n);
    if (exact) return exact.field;
    const loose = CSV_COLUMNS.find((c) => n !== "" && (norm(c.field).includes(n) || n.includes(norm(c.field))));
    return loose ? loose.field : null;
  });
}

export const STATUS_VALUES: JourneyStatus[] = [
  "under_evaluation",
  "go",
  "go_with_conditions",
  "hold",
  "no_go",
];

export type CellState = "clean" | "warning" | "error";

export interface ParsedCell {
  raw: string;
  state: CellState;
  message: string | null;
}

export interface ParsedRow {
  index: number;
  cells: Record<string, ParsedCell>;
  values: Record<string, string>;
  state: CellState;
  /** Existing register row this looks like, matched on CAS first then name. */
  duplicateOf: { material_id: string; name: string; matchedOn: "cas_number" | "name" } | null;
  /** Per-row decision for a duplicate. */
  resolution: "add" | "merge";
}

export function validateRows(
  rows: string[][],
  mapping: (string | null)[],
  existing: Material[],
): ParsedRow[] {
  const byCas = new Map<string, Material>();
  const byName = new Map<string, Material>();
  existing.forEach((m) => {
    if (m.cas_number) byCas.set(m.cas_number.trim(), m);
    byName.set(m.name.trim().toLowerCase(), m);
  });

  return rows.map((cols, index) => {
    const values: Record<string, string> = {};
    mapping.forEach((field, i) => {
      if (field) values[field] = cols[i] ?? "";
    });

    const cells: Record<string, ParsedCell> = {};
    let state: CellState = "clean";
    const bump = (s: CellState) => {
      if (s === "error" || (s === "warning" && state === "clean")) state = s;
    };

    CSV_COLUMNS.forEach((c) => {
      const raw = values[c.field] ?? "";
      let cellState: CellState = "clean";
      let message: string | null = null;

      if (c.field === "name" && raw.trim() === "") {
        cellState = "error";
        message = "Name is required";
      } else if (c.kind === "number" && raw.trim() !== "") {
        const p = parseNumberCell(raw);
        if (p.error) {
          cellState = "error";
          message = "Not a number";
        }
      } else if (c.field === "material_class" && raw.trim() !== "" && !SEEDED_CLASSES.includes(raw.trim())) {
        cellState = "warning";
        message = "Unrecognised material class — imported as given";
      } else if (c.field === "cas_number" && raw.trim() !== "" && !lookupCas(raw).found) {
        cellState = "warning";
        message = "CAS not found in the VCG ontology";
      } else if (c.kind === "status" && raw.trim() !== "" && !STATUS_VALUES.includes(raw.trim() as JourneyStatus)) {
        cellState = "warning";
        message = "Unknown status — imported as Not started";
      } else if (
        c.kind === "entry_type" &&
        raw.trim() !== "" &&
        !ENTRY_TYPES.some((e) => e.id === raw.trim())
      ) {
        cellState = "warning";
        message = "Unknown entry type — imported as drop-in substitute";
      }

      cells[c.field] = { raw, state: cellState, message };
      bump(cellState);
    });

    const cas = (values.cas_number ?? "").trim();
    const name = (values.name ?? "").trim();
    let duplicateOf: ParsedRow["duplicateOf"] = null;
    const casHit = cas ? byCas.get(cas) : undefined;
    const nameHit = name ? byName.get(name.toLowerCase()) : undefined;
    if (casHit) duplicateOf = { material_id: casHit.material_id, name: casHit.name, matchedOn: "cas_number" };
    else if (nameHit) duplicateOf = { material_id: nameHit.material_id, name: nameHit.name, matchedOn: "name" };

    if (duplicateOf) {
      const target = cas && casHit ? "cas_number" : "name";
      cells[target] = {
        ...cells[target],
        state: cells[target].state === "error" ? "error" : "warning",
        message: `Duplicate of ${duplicateOf.name} in the register`,
      };
      bump("warning");
    }

    return { index, cells, values, state, duplicateOf, resolution: "add" };
  });
}

/** Turns a validated row into a register row. Blank stays null throughout. */
export function rowToMaterial(row: ParsedRow, filename: string): Omit<Material, "material_id"> {
  const v = row.values;
  const num = (f: string) => parseNumberCell(v[f]).value;

  const entryRaw = (v.entry_type ?? "").trim();
  const entry_type: EntryType = ENTRY_TYPES.some((e) => e.id === entryRaw)
    ? (entryRaw as EntryType)
    : "drop_in";
  const statusRaw = (v.journey_status ?? "").trim();
  const journey_status: JourneyStatus = STATUS_VALUES.includes(statusRaw as JourneyStatus)
    ? (statusRaw as JourneyStatus)
    : "under_evaluation";

  const annual_volume = num("annual_volume");
  const unit_price = num("unit_price");
  const ghg_emission_factor = num("ghg_emission_factor");
  const spendGiven = num("annual_spend");
  const ghgGiven = num("ghg_contribution");
  const annual_spend = spendGiven !== null ? spendGiven : computeSpend(annual_volume, unit_price);
  const ghg_contribution = ghgGiven !== null ? ghgGiven : computeGhg(annual_volume, ghg_emission_factor);

  const base = blankMaterial(entry_type);
  const ingested = provenanceOf("ingested", filename);
  const computed = (inputs: string) => provenanceOf("computed", inputs);

  const provenance: Record<string, FieldProvenance> = {};
  [
    "annual_volume",
    "unit_price",
    "ghg_emission_factor",
    "target_volume",
    "price_ceiling",
    "ghg_reduction_target",
  ].forEach((f) => {
    if (parseNumberCell(v[f]).value !== null) provenance[f] = ingested;
  });
  if (annual_spend !== null)
    provenance.annual_spend = spendGiven !== null ? ingested : computed("annual volume x unit price");
  if (ghg_contribution !== null)
    provenance.ghg_contribution = ghgGiven !== null ? ingested : computed("emission factor x annual volume");
  if (toNullString(v.journey_status)) provenance.journey_status = ingested;
  if (toNullString(v.owner)) provenance.owner = ingested;
  if (toNullString(v.material_class)) provenance.material_class = ingested;
  provenance.entry_type = ingested;

  const requirements = requirementsOrNull({
    target_volume: num("target_volume"),
    price_ceiling: num("price_ceiling"),
    ghg_reduction_target: num("ghg_reduction_target"),
    required_certifications: splitList(v.required_certifications),
    earliest_need_date: toNullString(v.earliest_need_date),
    notes: toNullString(v.notes),
  });

  return {
    ...base,
    name: (v.name ?? "").trim(),
    cas_number: toNullString(v.cas_number),
    material_class: toNullString(v.material_class),
    customer_material_ids: splitList(v.customer_material_ids),
    tags: cleanTags(splitList(v.tags)),
    application_categories: splitList(v.application_categories),
    product_categories: splitList(v.product_categories),
    entry_type,
    annual_volume,
    unit_price,
    annual_spend,
    ghg_emission_factor,
    ghg_contribution,
    ghg_boundary: toNullString(v.ghg_boundary),
    ghg_data_basis: toNullString(v.ghg_data_basis),
    journey_status,
    requirements,
    owner: toNullString(v.owner),
    provenance,
  };
}

export function rowsToCsv(headers: string[], rows: string[][]): string {
  return [headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n") + "\n";
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
