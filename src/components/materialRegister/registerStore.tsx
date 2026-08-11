import React, { createContext, useContext, useMemo, useState } from "react";
import { seedEvents, seedMaterialsWithHistory } from "@/data/materialEventsMock";
import { seedDriverScores } from "@/data/driverScoresMock";
import {
  DRIVER_QUESTIONS,
  scoreKey,
  shortForLabel,
  slugForLabel,
  type DriverQuestion,
  type QuestionSetEvent,
} from "@/config/driverQuestions";
import {
  JOURNEY_STATUS_LABEL,
  type FieldProvenance,
  type JourneyStatus,
  type Material,
  type DriverCounts,
  type DriverScore,
  type BatchOrigin,
  type MaterialEvent,
  type MaterialEventType,
} from "@/types/materialPrioritisation";
import type { BulkPayload } from "@/components/materialRegister/BulkActionDialog";
import { ENTRY_TYPES } from "@/components/materialRegister/materialEntry";
import { addTags, formatTags, removeTags, tagKey, UNTAGGED } from "@/components/materialRegister/tags";


export const CURRENT_USER = "You";

export type MeasureId = "spend" | "emissions" | "volume" | "applications";

export interface Measure {
  id: MeasureId;
  label: string;
  /** compact chip label */
  short: string;
  /** label used in the unranked divider, lower-case */
  noun: string;
  /** axis / figure unit for the measure */
  unit: string;
  /** decimals when a single figure is printed */
  decimals?: number;
  value: (m: Material) => number | null;
}

export const MEASURES: Measure[] = [
  { id: "spend", label: "Spend", short: "SPD", noun: "spend", unit: "EUR", value: (m) => m.annual_spend },
  {
    id: "emissions",
    label: "Emissions",
    short: "GHG",
    noun: "emissions",
    unit: "tCO2e/yr",
    value: (m) => m.ghg_contribution,
  },
  { id: "volume", label: "Volume", short: "VOL", noun: "volume", unit: "t/yr", value: (m) => m.annual_volume },
  {
    id: "applications",
    label: "Applications",
    short: "APP",
    noun: "applications",
    unit: "applications",
    // An empty array is NO APPLICATIONS RECORDED, never zero applications:
    // those materials stay unranked on this measure.
    value: (m) =>
      m.application_categories && m.application_categories.length > 0 ? m.application_categories.length : null,
  },
];

/** A gap counts as divergent at or above this share of the ranked population. */
export const DIVERGENCE_THRESHOLD_RATIO = 0.5;

export const UNASSIGNED_OWNER = "__unassigned__";

export const ENTRY_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  ENTRY_TYPES.map((e) => [e.id, e.label]),
);

export interface RankTable {
  ranks: Record<string, number | null>;
  rankedCount: number;
  order: Material[];
  unranked: Material[];
}

/** Descending ranking. Ties share a rank, next rank skips. Missing value → null. */
export function computeRanks(rows: Material[], measure: Measure): RankTable {
  const ranked = rows.filter((m) => measure.value(m) !== null);
  const unranked = rows.filter((m) => measure.value(m) === null);

  ranked.sort((a, b) => {
    const diff = (measure.value(b) as number) - (measure.value(a) as number);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
  unranked.sort((a, b) => a.name.localeCompare(b.name));

  const ranks: Record<string, number | null> = {};
  let lastValue: number | null = null;
  let lastRank = 0;
  ranked.forEach((m, i) => {
    const v = measure.value(m) as number;
    const rank = lastValue !== null && v === lastValue ? lastRank : i + 1;
    lastValue = v;
    lastRank = rank;
    ranks[m.material_id] = rank;
  });
  unranked.forEach((m) => {
    ranks[m.material_id] = null;
  });

  return { ranks, rankedCount: ranked.length, order: ranked, unranked };
}

export interface RankedRow {
  m: Material;
  rank: number | null;
  ranks: Record<MeasureId, number | null>;
  gapMeasure: MeasureId | null;
  gapSize: number;
}


export interface Filters {
  search: string;
  classes: string[];
  statuses: string[];
  owners: string[];
  entryTypes: string[];
  /** Tag values, matched with ANY. May include UNTAGGED. */
  tags: string[];
  /** Product categories, matched with ANY. */
  products: string[];
  /** Application categories, matched with ANY. */
  applications: string[];
  /** Priority periods, matched with ANY. May include NO_PRIORITY. */
  priorityPeriods: string[];
  /** Blocker categories, matched with ANY. May include NO_BLOCKER. */
  blockers: string[];
  /** Supplier countries, matched with ANY. */
  countries: string[];
}

export const NO_PRIORITY = "__no_priority__";
export const NO_BLOCKER = "__no_blocker__";

export const EMPTY_FILTERS: Filters = {
  search: "",
  classes: [],
  statuses: [],
  owners: [],
  entryTypes: [],
  tags: [],
  products: [],
  applications: [],
  priorityPeriods: [],
  blockers: [],
  countries: [],
};

export const today = () => new Date().toISOString().slice(0, 10);

export const enteredProvenance = (): FieldProvenance => ({
  origin: "entered",
  source: CURRENT_USER,
  date: today(),
});

/** What a caller supplies; the store stamps id, user, timestamp and origin. */
export interface EventInput {
  material_id: string;
  event_type: MaterialEventType;
  field: string;
  from_value: string | null;
  to_value: string | null;
  reason?: string | null;
  blocker_category?: string | null;
  blocker_detail?: string | null;
  blocker_condition?: string | null;
  batch_id?: string | null;
  changed_by?: string;
  /** Baselining records a starting position, not a decision the team made. */
  batch_origin?: BatchOrigin;
}

interface Store {

  data: Material[];
  measureId: MeasureId;
  setMeasureId: (id: MeasureId) => void;
  measure: Measure;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  filtersActive: boolean;
  onlyUnranked: boolean;
  setOnlyUnranked: React.Dispatch<React.SetStateAction<boolean>>;
  onlyDivergent: boolean;
  setOnlyDivergent: React.Dispatch<React.SetStateAction<boolean>>;
  onlySelected: boolean;
  setOnlySelected: React.Dispatch<React.SetStateAction<boolean>>;
  selected: Set<string>;
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  ordered: RankedRow[];
  visible: RankedRow[];
  rankTables: Record<MeasureId, RankTable>;
  rankedCount: number;
  filteredTotal: number;
  missingCount: number;
  divergentCount: number;
  bothFilters: boolean;
  /** open brief */
  openId: string | null;
  openBrief: (id: string) => void;
  closeBrief: () => void;
  updateMaterial: (
    id: string,
    patch: Partial<Material>,
    enteredFields?: string[],
    events?: EventInput[],
  ) => void;
  applyBulk: (payload: BulkPayload, ids: Set<string>) => void;
  /**
   * Appends new register rows. Drafts arrive with their own provenance so entered,
   * computed and ingested figures stay distinct. Returns the assigned ids.
   */
  addMaterials: (
    drafts: Omit<Material, "material_id">[],
    opts: { batchOrigin: BatchOrigin; source: string; batchId?: string },
  ) => string[];
  /** Rolls an import batch back: drops the rows and the batch's events. */
  removeMaterials: (ids: string[], batchId: string) => void;
  /** Folds incoming customer IDs into an existing row instead of duplicating it. */
  mergeCustomerIds: (materialId: string, ids: string[], source: string, batchId: string) => void;
  /** Rows added a moment ago, highlighted briefly in the register. */
  highlightIds: Set<string>;
  events: MaterialEvent[];
  eventsFor: (id: string) => MaterialEvent[];
  recordEvents: (inputs: EventInput[]) => void;
  /** Sparse judgement map. A missing key means no judgement, never a zero. */
  scores: Record<string, DriverScore>;
  scoreFor: (materialId: string, questionId: string) => DriverScore | null;
  setScore: (materialId: string, questionId: string, score: number, note: string | null) => void;
  /** Clears a judgement back to null. Null is absence, never a zero. */
  clearScore: (materialId: string, questionId: string) => void;
  /**
   * One driver, one value (or null to clear), applied to every selected material.
   * Writes one event per changed material under a shared batch_id so Undo can
   * revert the whole judgement in a single action.
   */
  applyScoreBulk: (questionId: string, value: number | null, ids: Set<string>) => void;
  countsFor: (materialId: string) => DriverCounts;
  questionCoverage: (questionId: string, rows: Material[]) => number;
  /**
   * Account-level driver question set, shared by every material. Active
   * questions in display order; archived ones keep their scores but leave the
   * brief, the matrix, exports and the derived counts.
   */
  questions: DriverQuestion[];
  archivedQuestions: DriverQuestion[];
  allQuestions: DriverQuestion[];
  canEditQuestionSet: boolean;
  addQuestion: (label: string, helper: string | null) => string;
  renameQuestion: (questionId: string, label: string) => void;
  setQuestionHelper: (questionId: string, helper: string | null) => void;
  archiveQuestion: (questionId: string) => void;
  restoreQuestion: (questionId: string) => void;
  reorderQuestions: (ids: string[]) => void;
  questionSetEvents: QuestionSetEvent[];
  /** Period the priority set is being assembled for. Free text. */
  priorityPeriod: string;
  setPriorityPeriod: (v: string) => void;
  prioritySetCount: number;
  inPrioritySet: (m: Material) => boolean;
  /** Sets or clears priority_period for a set of materials in one batch. */
  applyPriority: (ids: Set<string>, add: boolean) => void;
  toast: {
    message: string;
    snapshot: Material[];
    batchId?: string;
    scoreSnapshot?: Record<string, DriverScore>;
  } | null;
  setToast: React.Dispatch<
    React.SetStateAction<{
      message: string;
      snapshot: Material[];
      batchId?: string;
      scoreSnapshot?: Record<string, DriverScore>;
    } | null>
  >;
  undo: () => void;

}

const Ctx = createContext<Store | null>(null);

export const useRegister = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRegister must be used inside RegisterProvider");
  return v;
};

export const RegisterProvider: React.FC<{ rows?: Material[]; children: React.ReactNode }> = ({
  rows = seedMaterialsWithHistory,
  children,
}) => {
  const [data, setData] = useState<Material[]>(rows);
  const [events, setEvents] = useState<MaterialEvent[]>(seedEvents);
  const [scores, setScores] = useState<Record<string, DriverScore>>(seedDriverScores);
  const [questionSet, setQuestionSet] = useState<DriverQuestion[]>(DRIVER_QUESTIONS);
  const [questionSetEvents, setQuestionSetEvents] = useState<QuestionSetEvent[]>([]);
  const canEditQuestionSet = true;
  const [measureId, setMeasureId] = useState<MeasureId>("spend");
  const [priorityPeriod, setPriorityPeriod] = useState("H2 2026");

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [onlyUnranked, setOnlyUnranked] = useState(false);
  const [onlyDivergent, setOnlyDivergent] = useState(false);
  const [onlySelected, setOnlySelected] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{
    message: string;
    snapshot: Material[];
    batchId?: string;
    /** Judgement map before a bulk score, so Undo can restore it wholesale. */
    scoreSnapshot?: Record<string, DriverScore>;
  } | null>(null);


  const measure = MEASURES.find((x) => x.id === measureId)!;

  const filtersActive =
    filters.search.trim() !== "" ||
    filters.classes.length > 0 ||
    filters.statuses.length > 0 ||
    filters.owners.length > 0 ||
    filters.entryTypes.length > 0 ||
    filters.products.length > 0 ||
    filters.applications.length > 0 ||
    filters.tags.length > 0 ||
    filters.priorityPeriods.length > 0 ||
    filters.blockers.length > 0 ||
    filters.countries.length > 0;

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return data.filter((m) => {
      if (q) {
        const hay = [m.name, m.cas_number ?? "", ...(m.customer_material_ids ?? [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.classes.length && !filters.classes.includes(m.material_class ?? "")) return false;
      if (filters.statuses.length && !filters.statuses.includes(m.journey_status)) return false;
      if (filters.owners.length && !filters.owners.includes(m.owner ?? UNASSIGNED_OWNER)) return false;
      if (filters.entryTypes.length && !filters.entryTypes.includes(m.entry_type)) return false;
      if (
        filters.products.length &&
        !(m.product_categories ?? []).some((c) => filters.products.includes(c))
      )
        return false;
      if (
        filters.applications.length &&
        !(m.application_categories ?? []).some((c) => filters.applications.includes(c))
      )
        return false;
      if (filters.tags.length) {
        const wantUntagged = filters.tags.includes(UNTAGGED);
        const keys = new Set(filters.tags.filter((t) => t !== UNTAGGED).map(tagKey));
        const anyMatch =
          (wantUntagged && m.tags.length === 0) || m.tags.some((t) => keys.has(tagKey(t)));
        if (!anyMatch) return false;
      }
      if (filters.priorityPeriods.length) {
        const key = m.priority_period ?? NO_PRIORITY;
        if (!filters.priorityPeriods.includes(key)) return false;
      }
      if (filters.blockers.length && !filters.blockers.includes(m.blocker_category ?? NO_BLOCKER)) return false;
      if (filters.countries.length && !(m.supplier_countries ?? []).some((c) => filters.countries.includes(c)))
        return false;
      return true;
    });
  }, [data, filters]);

  const { ordered, rankTables, rankedCount } = useMemo(() => {
    const tables = {} as Record<MeasureId, RankTable>;
    MEASURES.forEach((mm) => {
      tables[mm.id] = computeRanks(filtered, mm);
    });

    const active = tables[measureId];
    const threshold = active.rankedCount * DIVERGENCE_THRESHOLD_RATIO;

    const build = (m: Material, rank: number | null): RankedRow => {
      const ranks = {} as Record<MeasureId, number | null>;
      MEASURES.forEach((mm) => {
        ranks[mm.id] = tables[mm.id].ranks[m.material_id] ?? null;
      });

      let gapMeasure: MeasureId | null = null;
      let gapSize = 0;
      if (rank !== null) {
        MEASURES.forEach((mm) => {
          if (mm.id === measureId) return;
          const other = ranks[mm.id];
          if (other === null) return;
          const d = Math.abs(other - rank);
          if (d > gapSize) {
            gapSize = d;
            gapMeasure = mm.id;
          }
        });
      }
      const flagged = gapMeasure !== null && gapSize >= threshold && gapSize > 0;
      return { m, rank, ranks, gapMeasure: flagged ? gapMeasure : null, gapSize };
    };

    return {
      ordered: [
        ...active.order.map((m) => build(m, active.ranks[m.material_id] ?? null)),
        ...active.unranked.map((m) => build(m, null)),
      ],
      rankTables: tables,
      rankedCount: active.rankedCount,
    };
  }, [filtered, measureId]);

  const filteredTotal = filtered.length;
  const missingCount = filteredTotal - rankedCount;
  const divergentCount = ordered.filter((r) => r.gapMeasure !== null).length;
  const bothFilters = onlyUnranked && onlyDivergent;

  const visible = bothFilters
    ? []
    : ordered.filter(
        (r) =>
          (!onlyUnranked || r.rank === null) &&
          (!onlyDivergent || r.gapMeasure !== null) &&
          (!onlySelected || selected.has(r.m.material_id)),
      );

  const eventsFor = (id: string) =>
    events
      .filter((e) => e.material_id === id)
      .sort((a, b) => b.changed_at.localeCompare(a.changed_at));

  let eventSeq = 0;
  const buildEvent = (input: EventInput, at: string): MaterialEvent => ({
    event_id: `EVT-L-${Date.now()}-${eventSeq++}`,
    material_id: input.material_id,
    event_type: input.event_type,
    field: input.field,
    from_value: input.from_value,
    to_value: input.to_value,
    reason: input.reason?.trim() ? input.reason.trim() : null,
    blocker_category: input.blocker_category ?? null,
    blocker_detail: input.blocker_detail ?? null,
    blocker_condition: input.blocker_condition ?? null,
    changed_by: input.changed_by ?? CURRENT_USER,
    changed_at: at,
    batch_origin: input.batch_origin ?? "real_transition",
    batch_id: input.batch_id ?? null,
  });

  /** Appends events and re-stamps each material's last-change fields from them. */
  const recordEvents = (inputs: EventInput[]) => {
    if (inputs.length === 0) return;
    const at = new Date().toISOString();
    const written = inputs.map((i) => buildEvent(i, at));
    setEvents((prev) => [...prev, ...written]);

    const byMaterial = new Map<string, MaterialEvent>();
    written.forEach((e) => byMaterial.set(e.material_id, e));
    setData((prev) =>
      prev.map((m) => {
        const e = byMaterial.get(m.material_id);
        if (!e) return m;
        return {
          ...m,
          last_status_change_date: e.changed_at,
          last_status_user: e.changed_by,
          last_change_batch_origin: e.batch_origin,
        };
      }),
    );
  };

  const updateMaterial = (
    id: string,
    patch: Partial<Material>,
    enteredFields: string[] = [],
    eventInputs: EventInput[] = [],
  ) => {
    setData((prev) =>
      prev.map((m) => {
        if (m.material_id !== id) return m;
        const provenance = { ...m.provenance };
        enteredFields.forEach((f) => {
          provenance[f] = enteredProvenance();
        });
        return { ...m, ...patch, provenance };
      }),
    );
    recordEvents(eventInputs);
  };

  const applyBulk = (payload: BulkPayload, ids: Set<string>) => {
    const snapshot = data.filter((m) => ids.has(m.material_id)).map((m) => ({ ...m }));
    const stamp = today();
    const batchId = `BATCH-${Date.now()}`;

    /** Multi-value actions add rather than overwrite. */
    const nextList = (existing: string[]) =>
      payload.mode === "remove"
        ? removeTags(existing, payload.values ?? [])
        : addTags(existing, payload.values ?? []);

    setData((prev) =>
      prev.map((m) => {
        if (!ids.has(m.material_id)) return m;
        const next: Material = {
          ...m,
          provenance: { ...m.provenance },
          last_status_change_date: stamp,
          last_status_user: CURRENT_USER,
          last_change_batch_origin: "real_transition",
        };

        if (payload.kind === "status") {
          next.journey_status = payload.value as JourneyStatus;
          next.provenance.journey_status = enteredProvenance();
          if (payload.blocker_category) {
            next.blocker_category = payload.blocker_category;
            next.blocker_detail = payload.blocker_detail ?? null;
            next.blocker_date = stamp;
            next.provenance.blocker_category = enteredProvenance();
          }
        } else if (payload.kind === "owner") {
          next.owner = payload.value;
          next.provenance.owner = enteredProvenance();
        } else if (payload.kind === "products") {
          next.product_categories = nextList(m.product_categories ?? []);
          next.provenance.product_categories = enteredProvenance();
        } else if (payload.kind === "applications") {
          next.application_categories = nextList(m.application_categories ?? []);
          next.provenance.application_categories = enteredProvenance();
        } else if (payload.kind === "priority_period") {
          next.priority_period = payload.value && payload.value.trim() ? payload.value.trim() : null;
          next.provenance.priority_period = enteredProvenance();
        } else if (payload.kind === "intelligence") {
          if (m.intelligence_status === "not_ordered") {
            next.intelligence_status = "requested";
            next.intelligence_ordered_date = stamp;
            next.provenance.intelligence_status = enteredProvenance();
          }
        }
        return next;
      }),
    );

    // One event per affected material, all sharing this batch_id.
    recordEvents(
      snapshot.map((m) => {
        if (payload.kind === "status") {
          return {
            material_id: m.material_id,
            event_type: payload.blocker_category ? "blocker_set" : "status_change",
            field: "journey_status",
            from_value: m.journey_status,
            to_value: payload.value,
            blocker_category: payload.blocker_category ?? null,
            blocker_detail: payload.blocker_detail ?? null,
            blocker_condition: null,
            batch_id: batchId,
          } as EventInput;
        }
        if (payload.kind === "owner") {
          return {
            material_id: m.material_id,
            event_type: "owner_change",
            field: "owner",
            from_value: m.owner,
            to_value: payload.value,
            batch_id: batchId,
          } as EventInput;
        }
        if (payload.kind === "priority_period") {
          return {
            material_id: m.material_id,
            event_type: "priority_change",
            field: "priority_period",
            from_value: m.priority_period,
            to_value: payload.value && payload.value.trim() ? payload.value.trim() : null,
            batch_id: batchId,
          } as EventInput;
        }
        if (payload.kind === "intelligence") {
          return {
            material_id: m.material_id,
            event_type: "field_correction",
            field: "intelligence_status",
            from_value: m.intelligence_status,
            to_value: m.intelligence_status === "not_ordered" ? "requested" : m.intelligence_status,
            batch_id: batchId,
          } as EventInput;
        }
        const field = payload.kind === "products" ? "product_categories" : "application_categories";
        const existing = (payload.kind === "products" ? m.product_categories : m.application_categories) ?? [];
        return {
          material_id: m.material_id,
          event_type: "field_correction",
          field,
          from_value: formatTags(existing) || null,
          to_value: formatTags(nextList(existing)) || null,
          batch_id: batchId,
        } as EventInput;
      }),
    );

    const noun =
      payload.kind === "status"
        ? "Status"
        : payload.kind === "owner"
          ? "Owner"
          : payload.kind === "products"
            ? "Product categories"
            : payload.kind === "applications"
              ? "Application categories"
              : payload.kind === "priority_period"
                ? "Priority period"
                : "Intelligence";
    setToast({ message: `${noun} updated for ${ids.size} materials.`, snapshot, batchId });
  };


  const nextIds = (count: number, taken: Material[]) => {
    let max = 0;
    taken.forEach((m) => {
      const n = Number(m.material_id.replace(/\D/g, ""));
      if (Number.isFinite(n) && n > max) max = n;
    });
    return Array.from({ length: count }, (_, i) => `MAT-${String(max + 1 + i).padStart(4, "0")}`);
  };

  const addMaterials = (
    drafts: Omit<Material, "material_id">[],
    opts: { batchOrigin: BatchOrigin; source: string; batchId?: string },
  ) => {
    if (drafts.length === 0) return [];
    const ids = nextIds(drafts.length, data);
    const rowsToAdd: Material[] = drafts.map((d, i) => ({ ...d, material_id: ids[i] }));
    setData((prev) => [...prev, ...rowsToAdd]);
    recordEvents(
      rowsToAdd.map((m) => ({
        material_id: m.material_id,
        event_type: "field_correction" as MaterialEventType,
        field: "material_added",
        from_value: null,
        to_value: m.name,
        reason: opts.batchOrigin === "baselining" ? `Loaded from ${opts.source}` : null,
        batch_id: opts.batchId ?? null,
        batch_origin: opts.batchOrigin,
      })),
    );
    setHighlightIds(new Set(ids));
    window.setTimeout(() => setHighlightIds(new Set()), 4000);
    return ids;
  };

  const removeMaterials = (ids: string[], batchId: string) => {
    const drop = new Set(ids);
    setData((prev) => prev.filter((m) => !drop.has(m.material_id)));
    setEvents((prev) => prev.filter((e) => e.batch_id !== batchId));
    setSelected((prev) => new Set([...prev].filter((id) => !drop.has(id))));
    setHighlightIds(new Set());
  };

  const mergeCustomerIds = (materialId: string, incoming: string[], source: string, batchId: string) => {
    setData((prev) =>
      prev.map((m) => {
        if (m.material_id !== materialId) return m;
        const merged = [...new Set([...m.customer_material_ids, ...incoming])];
        return {
          ...m,
          customer_material_ids: merged,
          provenance: {
            ...m.provenance,
            customer_material_ids: { origin: "ingested", source, date: today() },
          },
        };
      }),
    );
    recordEvents([
      {
        material_id: materialId,
        event_type: "field_correction",
        field: "customer_material_ids",
        from_value: null,
        to_value: incoming.join(", "),
        reason: `Merged from ${source}`,
        batch_id: batchId,
        batch_origin: "baselining",
      },
    ]);
  };

  const inPrioritySet = (m: Material) => m.priority_period === priorityPeriod;
  const prioritySetCount = data.filter(inPrioritySet).length;

  /** Priority set changes: one event per material, all sharing one batch_id. */
  const applyPriority = (ids: Set<string>, add: boolean) => {
    const snapshot = data.filter((m) => ids.has(m.material_id)).map((m) => ({ ...m }));
    const batchId = `BATCH-${Date.now()}`;

    setData((prev) =>
      prev.map((m) => {
        if (!ids.has(m.material_id)) return m;
        return {
          ...m,
          priority_period: add ? priorityPeriod : null,
          provenance: {
            ...m.provenance,
            priority_period: enteredProvenance(),
          },
        };
      }),
    );

    recordEvents(
      snapshot.map((m) => ({
        material_id: m.material_id,
        event_type: "priority_change",
        field: "priority_period",
        from_value: m.priority_period,
        to_value: add ? priorityPeriod : null,
        batch_id: batchId,
      })),
    );

    setToast({
      message: add
        ? `${ids.size} materials added to the ${priorityPeriod} priority set.`
        : `${ids.size} materials removed from the priority set.`,
      snapshot,
      batchId,
    });
  };

  /** Undo removes the batch's events rather than writing compensating ones. */
  const undo = () => {
    if (!toast) return;
    const byId = new Map(toast.snapshot.map((m) => [m.material_id, m]));
    setData((prev) => prev.map((m) => byId.get(m.material_id) ?? m));
    if (toast.scoreSnapshot) setScores(toast.scoreSnapshot);
    if (toast.batchId) setEvents((prev) => prev.filter((e) => e.batch_id !== toast.batchId));
    setToast(null);
  };


  const activeQuestions = useMemo(
    () => questionSet.filter((q) => !q.archived).sort((a, b) => a.order - b.order),
    [questionSet],
  );
  const archivedQuestions = useMemo(
    () => questionSet.filter((q) => q.archived).sort((a, b) => a.order - b.order),
    [questionSet],
  );

  const logQuestionSet = (
    action: QuestionSetEvent["action"],
    question_id: string,
    from_label: string | null,
    to_label: string | null,
  ) =>
    setQuestionSetEvents((prev) => [
      {
        event_id: `QSE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        action,
        question_id,
        from_label,
        to_label,
        changed_by: CURRENT_USER,
        changed_at: new Date().toISOString(),
      },
      ...prev,
    ]);

  /** A new question appears on every material as unscored — never zero. */
  const addQuestion = (label: string, helper: string | null) => {
    const clean = label.trim();
    const id = slugForLabel(clean, questionSet.map((q) => q.question_id));
    const order = questionSet.reduce((max, q) => Math.max(max, q.order), 0) + 1;
    setQuestionSet((prev) => [
      ...prev,
      {
        question_id: id,
        label: clean,
        short: shortForLabel(clean),
        helper: helper && helper.trim() ? helper.trim() : null,
        order,
        archived: false,
        archived_at: null,
        created_by: CURRENT_USER,
        created_at: today(),
      },
    ]);
    logQuestionSet("added", id, null, clean);
    return id;
  };

  /** Renaming touches the label only. question_id never changes, so no score is orphaned. */
  const renameQuestion = (questionId: string, label: string) => {
    const clean = label.trim();
    const current = questionSet.find((q) => q.question_id === questionId);
    if (!current || !clean || clean === current.label) return;
    setQuestionSet((prev) =>
      prev.map((q) => (q.question_id === questionId ? { ...q, label: clean, short: shortForLabel(clean) } : q)),
    );
    logQuestionSet("renamed", questionId, current.label, clean);
  };

  const setQuestionHelper = (questionId: string, helper: string | null) => {
    const clean = helper && helper.trim() ? helper.trim() : null;
    setQuestionSet((prev) => prev.map((q) => (q.question_id === questionId ? { ...q, helper: clean } : q)));
  };

  /** Archive, never delete. Scores are retained and return intact on restore. */
  const archiveQuestion = (questionId: string) => {
    const current = questionSet.find((q) => q.question_id === questionId);
    if (!current) return;
    setQuestionSet((prev) =>
      prev.map((q) =>
        q.question_id === questionId ? { ...q, archived: true, archived_at: new Date().toISOString() } : q,
      ),
    );
    logQuestionSet("archived", questionId, current.label, current.label);
  };

  const restoreQuestion = (questionId: string) => {
    const current = questionSet.find((q) => q.question_id === questionId);
    if (!current) return;
    setQuestionSet((prev) =>
      prev.map((q) => (q.question_id === questionId ? { ...q, archived: false, archived_at: null } : q)),
    );
    logQuestionSet("restored", questionId, current.label, current.label);
  };

  const reorderQuestions = (ids: string[]) => {
    setQuestionSet((prev) =>
      prev.map((q) => {
        const i = ids.indexOf(q.question_id);
        return i === -1 ? q : { ...q, order: i + 1 };
      }),
    );
    logQuestionSet("reordered", ids[0] ?? "", null, null);
  };

  const scoreFor = (materialId: string, questionId: string) =>
    scores[scoreKey(materialId, questionId)] ?? null;

  /**
   * Counts of judgements only. Never summed, averaged or weighted into an index.
   * A material with nothing scored has null counts, not zeroes.
   */
  const countsFor = (materialId: string): DriverCounts => {
    const values = activeQuestions
      .map((q) => scores[scoreKey(materialId, q.question_id)]?.score ?? null)
      .filter(
        (v): v is number => v !== null,
      );
    if (values.length === 0) {
      return { strong_drivers: null, strong_constraints: null, scored_count: null };
    }
    return {
      strong_drivers: values.filter((v) => v >= 3).length,
      strong_constraints: values.filter((v) => v <= -3).length,
      scored_count: values.length,
    };
  };

  const questionCoverage = (questionId: string, rows: Material[]) =>
    rows.filter((m) => (scores[scoreKey(m.material_id, questionId)]?.score ?? null) !== null).length;

  const setScore = (materialId: string, questionId: string, score: number, note: string | null) => {
    const key = scoreKey(materialId, questionId);
    const previous = scores[key]?.score ?? null;
    setScores((prev) => ({
      ...prev,
      [key]: {
        material_id: materialId,
        question_id: questionId,
        score,
        note: note && note.trim() ? note.trim() : null,
        scored_by: CURRENT_USER,
        scored_at: new Date().toISOString(),
      },
    }));
    if (previous === score) return;
    recordEvents([
      {
        material_id: materialId,
        event_type: "score_change",
        field: questionId,
        from_value: previous === null ? null : String(previous),
        to_value: String(score),
        reason: note && note.trim() ? note.trim() : null,
      },
    ]);
  };

  const clearScore = (materialId: string, questionId: string) => {
    const key = scoreKey(materialId, questionId);
    const previous = scores[key]?.score ?? null;
    if (previous === null) return;
    setScores((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    recordEvents([
      {
        material_id: materialId,
        event_type: "score_change",
        field: questionId,
        from_value: String(previous),
        to_value: null,
      },
    ]);
  };

  const applyScoreBulk = (questionId: string, value: number | null, ids: Set<string>) => {
    if (ids.size === 0) return;
    const batchId = `BATCH-${Date.now()}`;
    const scoreSnapshot = { ...scores };
    const stamp = new Date().toISOString();
    const changed: string[] = [];

    setScores((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        const key = scoreKey(id, questionId);
        const previous = prev[key]?.score ?? null;
        if (previous === value) return;
        changed.push(id);
        if (value === null) delete next[key];
        else
          next[key] = {
            material_id: id,
            question_id: questionId,
            score: value,
            note: prev[key]?.note ?? null,
            scored_by: CURRENT_USER,
            scored_at: stamp,
          };
      });
      return next;
    });

    // One event per material that actually moved, all under the same batch.
    recordEvents(
      changed.map((id) => ({
        material_id: id,
        event_type: "score_change" as const,
        field: questionId,
        from_value: (() => {
          const p = scoreSnapshot[scoreKey(id, questionId)]?.score ?? null;
          return p === null ? null : String(p);
        })(),
        to_value: value === null ? null : String(value),
        batch_id: batchId,
      })),
    );

    const label = questionSet.find((q) => q.question_id === questionId)?.label ?? questionId;
    setToast({
      message:
        value === null
          ? `${label} cleared for ${changed.length} of ${ids.size} materials.`
          : `${label} set to ${value > 0 ? `+${value}` : value} for ${changed.length} of ${ids.size} materials.`,
      snapshot: data,
      batchId,
      scoreSnapshot,
    });
  };

  const value: Store = {
    data,
    measureId,
    setMeasureId,
    measure,
    filters,
    setFilters,
    filtersActive,
    onlyUnranked,
    setOnlyUnranked,
    onlyDivergent,
    setOnlyDivergent,
    onlySelected,
    setOnlySelected,
    selected,
    setSelected,
    ordered,
    visible,
    rankTables,
    rankedCount,
    filteredTotal,
    missingCount,
    divergentCount,
    bothFilters,
    openId,
    openBrief: setOpenId,
    closeBrief: () => setOpenId(null),
    updateMaterial,
    applyBulk,
    addMaterials,
    removeMaterials,
    mergeCustomerIds,
    highlightIds,
    events,
    eventsFor,
    recordEvents,
    scores,
    scoreFor,
    setScore,
    clearScore,
    applyScoreBulk,
    countsFor,
    questionCoverage,
    questions: activeQuestions,
    archivedQuestions,
    allQuestions: questionSet,
    canEditQuestionSet,
    addQuestion,
    renameQuestion,
    setQuestionHelper,
    archiveQuestion,
    restoreQuestion,
    reorderQuestions,
    questionSetEvents,
    priorityPeriod,
    setPriorityPeriod,
    prioritySetCount,
    inPrioritySet,
    applyPriority,

    toast,
    setToast,
    undo,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export { JOURNEY_STATUS_LABEL };
