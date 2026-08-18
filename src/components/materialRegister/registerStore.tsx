import React, { createContext, useContext, useMemo, useState } from "react";
import { seedEvents, seedMaterialsWithHistory } from "@/data/materialEventsMock";
import { applyGateSeed } from "@/data/gateMock";
import { seedAssessments } from "@/data/assessmentMock";
import { seedDocuments } from "@/data/documentsMock";
import {
  canSetGate,
  hasOverdueCondition,
  holdReviewOverdue,
  statusForOutcome,
  todayIso,
} from "@/components/materialRegister/gate";
import {
  CONTRIBUTORS,
  CRITERION_LABEL,
  DEFAULT_CONTRIBUTOR,
  JUDGED_CRITERIA,
  assessmentKey,
} from "@/config/assessmentCriteria";
import {
  JOURNEY_STATUS_LABEL,
  type AssessmentEntry,
  type AssessmentState,
  type Contributor,
  type FieldProvenance,
  type GateCondition,
  type GateOutcome,
  type JourneyStatus,
  type Material,
  type BatchOrigin,
  type MaterialEvent,
  type MaterialEventType,
  type TeamId,
} from "@/types/materialPrioritisation";
import type { BulkPayload } from "@/components/materialRegister/BulkActionDialog";
import { ENTRY_TYPES } from "@/components/materialRegister/materialEntry";
import { addTags, formatTags, removeTags, tagKey, UNTAGGED } from "@/components/materialRegister/tags";


export const CURRENT_USER = "You";


export type RankMeasureId = "spend" | "emissions" | "volume" | "applications";
export type MeasureId = RankMeasureId | "all";

export interface Measure {
  id: RankMeasureId;
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
  ranks: Record<RankMeasureId, number | null>;
  gapMeasure: RankMeasureId | null;
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
  /** VCG substitutability readiness values, matched with ANY. */
  vcgSubstitutability: string[];
  /** VCG competitor activity values, matched with ANY. */
  vcgCompetitor: string[];
  /** Inclusive range over the VCG supplier count. Never matches not-assessed. */
  vcgSuppliersMin: number | null;
  vcgSuppliersMax: number | null;
  /** Deliberately outside the range: not assessed is not a number. */
  vcgSuppliersNotAssessed: boolean;
  /** Gate section. The five statuses are categories, never an ordered scale. */
  gateOverdueCondition: boolean;
  gateHoldReviewOverdue: boolean;
  /** yes / no / any — a recommendation either exists or it does not. */
  gateRecommendation: "yes" | "no" | "any";
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
  vcgSubstitutability: [],
  vcgCompetitor: [],
  vcgSuppliersMin: null,
  vcgSuppliersMax: null,
  vcgSuppliersNotAssessed: false,
  gateOverdueCondition: false,
  gateHoldReviewOverdue: false,
  gateRecommendation: "any",
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
  measure: Measure | null;
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
  rankTables: Record<RankMeasureId, RankTable>;
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
  /**
   * Who the session is acting as. Every assessment entry is recorded against
   * this person, and each person holds at most one entry per criterion.
   */
  currentUser: Contributor;
  setCurrentUser: (userId: string) => void;
  contributors: Contributor[];
  /** Sparse entry map. A missing key means that person has no view recorded. */
  assessments: Record<string, AssessmentEntry>;
  entriesFor: (materialId: string, criterionId: string) => AssessmentEntry[];
  myEntry: (materialId: string, criterionId: string) => AssessmentEntry | null;
  /** Records or replaces the current user's entry on one criterion. */
  saveAssessment: (materialId: string, criterionId: string, score: number, note: string | null) => void;
  /** Withdraws the current user's entry. Absence, never a zero. */
  clearAssessment: (materialId: string, criterionId: string) => void;
  /** Spread and flag for one criterion. Counts only — entries are never averaged. */
  assessmentState: (materialId: string, criterionId: string) => AssessmentState;
  /** Per-material roll-up: criteria covered, contributors, split criteria. */
  assessmentSummary: (materialId: string) => {
    criteriaAssessed: number;
    criteriaTotal: number;
    contributors: string[];
    teams: TeamId[];
    splits: number;
    entryCount: number;
    lastAssessedAt: string | null;
  };
  /**
   * THE GATE. Two separate acts: a recommendation the owner writes, and an
   * outcome the owner sets. Neither is derived from the assessment entries, and
   * a gate never advances itself.
   */
  canSetGate: (m: Material) => boolean;
  /** Writes or rewrites the recommendation. Blocked when the text is empty. */
  saveRecommendation: (materialId: string, outcome: GateOutcome, text: string) => void;
  /** Records the decision and whatever that outcome has to carry with it. */
  setGateOutcome: (
    materialId: string,
    outcome: GateOutcome,
    payload: {
      conditions?: GateCondition[];
      holdTrigger?: string | null;
      holdReview?: string | null;
      noGoReason?: string | null;
    },
  ) => void;
  /** Anyone can tick a condition met. The person who ticked it is stamped. */
  toggleCondition: (materialId: string, conditionId: string, met: boolean) => void;
  /** Owner-only condition edits on a live gate. */
  saveConditions: (materialId: string, conditions: GateCondition[]) => void;
  /** Sends a no-go material back to under evaluation. The old reason survives. */
  reopenGate: (materialId: string, note: string | null) => void;
  /** How many of the given rows carry at least one entry on that criterion. */
  criterionCoverage: (criterionId: string, rows: Material[]) => number;
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
    assessmentSnapshot?: Record<string, AssessmentEntry>;
  } | null;
  setToast: React.Dispatch<
    React.SetStateAction<{
      message: string;
      snapshot: Material[];
      batchId?: string;
      assessmentSnapshot?: Record<string, AssessmentEntry>;
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

/** The register as seeded, with gate positions and their events folded in. */
const gateSeed = applyGateSeed(seedMaterialsWithHistory);
export const seededMaterials = gateSeed.materials;

export const RegisterProvider: React.FC<{ rows?: Material[]; children: React.ReactNode }> = ({
  rows = seededMaterials,
  children,
}) => {
  const [data, setData] = useState<Material[]>(rows);
  const [events, setEvents] = useState<MaterialEvent[]>([...seedEvents, ...gateSeed.events]);
  const [assessments, setAssessments] = useState<Record<string, AssessmentEntry>>(seedAssessments);
  const [currentUserId, setCurrentUserId] = useState<string>(DEFAULT_CONTRIBUTOR.user_id);
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
    /** Entry map before a batch change, so Undo can restore it wholesale. */
    assessmentSnapshot?: Record<string, AssessmentEntry>;
  } | null>(null);



  const measure = measureId === "all" ? null : MEASURES.find((x) => x.id === measureId)!;

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
    filters.vcgSubstitutability.length > 0 ||
    filters.vcgCompetitor.length > 0 ||
    filters.vcgSuppliersMin !== null ||
    filters.vcgSuppliersMax !== null ||
    filters.vcgSuppliersNotAssessed ||
    filters.gateOverdueCondition ||
    filters.gateHoldReviewOverdue ||
    filters.gateRecommendation !== "any";

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return data.filter((m) => {
      if (q) {
        const hay = [m.name, m.cas_number ?? "", ...(m.customer_material_ids ?? [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.classes.length && !filters.classes.includes(m.material_class ?? "")) return false;
      if (filters.statuses.length && !filters.statuses.includes(m.journey_status)) return false;
      if (filters.gateOverdueCondition && !hasOverdueCondition(m)) return false;
      if (filters.gateHoldReviewOverdue && !holdReviewOverdue(m)) return false;
      if (filters.gateRecommendation === "yes" && m.recommendation === null) return false;
      if (filters.gateRecommendation === "no" && m.recommendation !== null) return false;
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

      // VCG signals. Not assessed is its own state and never falls inside the range.
      if (
        filters.vcgSubstitutability.length &&
        !filters.vcgSubstitutability.includes(m.substitutability_readiness)
      )
        return false;
      if (filters.vcgCompetitor.length && !filters.vcgCompetitor.includes(m.competitor_activity)) return false;

      const hasRange = filters.vcgSuppliersMin !== null || filters.vcgSuppliersMax !== null;
      if (hasRange || filters.vcgSuppliersNotAssessed) {
        const sa = m.supplier_availability;
        const assessed = sa?.assessed && sa.value !== null;
        const inRange =
          hasRange && assessed
            ? (filters.vcgSuppliersMin === null || sa.value! >= filters.vcgSuppliersMin) &&
              (filters.vcgSuppliersMax === null || sa.value! <= filters.vcgSuppliersMax)
            : false;
        const notAssessedMatch = filters.vcgSuppliersNotAssessed && !assessed;
        if (!inRange && !notAssessedMatch) return false;
      }
      return true;
    });
  }, [data, filters]);

  const { ordered, rankTables, rankedCount } = useMemo(() => {
    const tables = {} as Record<RankMeasureId, RankTable>;
    MEASURES.forEach((mm) => {
      tables[mm.id] = computeRanks(filtered, mm);
    });

    if (measureId === "all") {
      const buildAll = (m: Material): RankedRow => {
        const ranks = {} as Record<RankMeasureId, number | null>;
        MEASURES.forEach((mm) => {
          ranks[mm.id] = tables[mm.id].ranks[m.material_id] ?? null;
        });
        return { m, rank: null, ranks, gapMeasure: null, gapSize: 0 };
      };
      return {
        ordered: filtered.map((m) => buildAll(m)),
        rankTables: tables,
        rankedCount: 0,
      };
    }

    const active = tables[measureId];
    const threshold = active.rankedCount * DIVERGENCE_THRESHOLD_RATIO;

    const build = (m: Material, rank: number | null): RankedRow => {
      const ranks = {} as Record<RankMeasureId, number | null>;
      MEASURES.forEach((mm) => {
        ranks[mm.id] = tables[mm.id].ranks[m.material_id] ?? null;
      });

      let gapMeasure: RankMeasureId | null = null;
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

  const inPrioritySet = (m: Material) => m.priority_period !== null;
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
    if (toast.assessmentSnapshot) setAssessments(toast.assessmentSnapshot);
    if (toast.batchId) setEvents((prev) => prev.filter((e) => e.batch_id !== toast.batchId));
    setToast(null);
  };


  const currentUser =
    CONTRIBUTORS.find((c) => c.user_id === currentUserId) ?? DEFAULT_CONTRIBUTOR;

  const entriesFor = (materialId: string, criterionId: string): AssessmentEntry[] =>
    Object.values(assessments)
      .filter((e) => e.material_id === materialId && e.criterion_id === criterionId)
      .sort((a, b) => a.assessed_at.localeCompare(b.assessed_at));

  const myEntry = (materialId: string, criterionId: string): AssessmentEntry | null =>
    assessments[assessmentKey(materialId, criterionId, currentUserId)] ?? null;

  /**
   * Spread across the recorded entries. No entry is not a score, and the entries
   * are never averaged — the flag reports how far apart people sit, nothing more.
   */
  const assessmentState = (materialId: string, criterionId: string): AssessmentState => {
    const entries = entriesFor(materialId, criterionId);
    if (entries.length === 0) {
      return { flag: "not_assessed", entries, low: null, high: null, spread: null, teams: [] };
    }
    const values = entries.map((e) => e.score);
    const low = Math.min(...values);
    const high = Math.max(...values);
    const spread = high - low;
    const teams = Array.from(new Set(entries.map((e) => e.team)));
    const flag =
      entries.length === 1 ? "single_view" : spread <= 1 ? "aligned" : spread === 2 ? "mixed" : "split";
    return { flag, entries, low, high, spread, teams };
  };

  const assessmentSummary = (materialId: string) => {
    const mine = Object.values(assessments).filter((e) => e.material_id === materialId);
    const contributors = Array.from(new Set(mine.map((e) => e.user_id)));
    const teams = Array.from(new Set(mine.map((e) => e.team)));
    const criteriaAssessed = JUDGED_CRITERIA.filter((c) =>
      mine.some((e) => e.criterion_id === c.criterion_id),
    ).length;
    const splits = JUDGED_CRITERIA.filter(
      (c) => assessmentState(materialId, c.criterion_id).flag === "split",
    ).length;
    const lastAssessedAt = mine.reduce<string | null>(
      (latest, e) => (latest === null || e.assessed_at > latest ? e.assessed_at : latest),
      null,
    );
    return {
      criteriaAssessed,
      criteriaTotal: JUDGED_CRITERIA.length,
      contributors,
      teams,
      splits,
      entryCount: mine.length,
      lastAssessedAt,
    };
  };

  const criterionCoverage = (criterionId: string, rowsIn: Material[]) =>
    rowsIn.filter((m) =>
      Object.values(assessments).some(
        (e) => e.material_id === m.material_id && e.criterion_id === criterionId,
      ),
    ).length;

  const saveAssessment = (
    materialId: string,
    criterionId: string,
    score: number,
    note: string | null,
  ) => {
    const key = assessmentKey(materialId, criterionId, currentUserId);
    const previous = assessments[key]?.score ?? null;
    setAssessments((prev) => ({
      ...prev,
      [key]: {
        material_id: materialId,
        criterion_id: criterionId,
        user_id: currentUserId,
        team: currentUser.team,
        score,
        note,
        assessed_at: new Date().toISOString(),
      },
    }));
    // Assessment entries carry their own stamps in the Assessment card. History
    // is the record of decisions, not of opinions, so nothing is written here.
  };

  const clearAssessment = (materialId: string, criterionId: string) => {
    const key = assessmentKey(materialId, criterionId, currentUserId);
    const previous = assessments[key]?.score ?? null;
    if (previous === null) return;
    setAssessments((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };


  // ------------------------------------------------------------------ the gate

  const gateWritable = (m: Material) => canSetGate(m, currentUser.name);

  const patchMaterial = (id: string, fn: (m: Material) => Material) =>
    setData((prev) => prev.map((m) => (m.material_id === id ? fn(m) : m)));

  const saveRecommendation = (materialId: string, outcome: GateOutcome, text: string) => {
    const m = data.find((x) => x.material_id === materialId);
    if (!m || !gateWritable(m) || text.trim() === "") return;
    const rec = { outcome, text: text.trim(), author: currentUser.name, date: todayIso() };
    patchMaterial(materialId, (prev) => ({ ...prev, recommendation: rec }));
    recordEvents([
      {
        material_id: materialId,
        event_type: "recommendation",
        field: "recommendation",
        from_value: m.recommendation?.outcome ?? null,
        to_value: outcome,
        reason: rec.text,
        changed_by: currentUser.name,
      },
    ]);
  };

  const setGateOutcome: Store["setGateOutcome"] = (materialId, outcome, payload) => {
    const m = data.find((x) => x.material_id === materialId);
    if (!m || !gateWritable(m)) return;
    const stamp = todayIso();
    patchMaterial(materialId, (prev) => ({
      ...prev,
      journey_status: statusForOutcome(outcome),
      gate_decided_by: currentUser.name,
      gate_decided_date: stamp,
      gate_conditions: outcome === "go_with_conditions" ? (payload.conditions ?? prev.gate_conditions) : prev.gate_conditions,
      hold_trigger_event: outcome === "hold" ? (payload.holdTrigger ?? null) : prev.hold_trigger_event,
      hold_review_date: outcome === "hold" ? (payload.holdReview ?? null) : prev.hold_review_date,
      no_go_reason: outcome === "no_go" ? (payload.noGoReason ?? null) : prev.no_go_reason,
      provenance: { ...prev.provenance, journey_status: enteredProvenance() },
    }));

    const written: EventInput[] = [
      {
        material_id: materialId,
        event_type: "gate_outcome",
        field: "journey_status",
        from_value: m.journey_status,
        to_value: outcome,
        changed_by: currentUser.name,
      },
    ];
    if (outcome === "go_with_conditions") {
      (payload.conditions ?? []).forEach((c) => {
        const existing = m.gate_conditions.find((x) => x.condition_id === c.condition_id);
        if (existing && existing.text === c.text && existing.due_date === c.due_date && existing.owner === c.owner)
          return;
        written.push({
          material_id: materialId,
          event_type: "condition_change",
          field: "gate_condition",
          from_value: existing?.text ?? null,
          to_value: c.text,
          reason: `Due ${c.due_date} · ${c.owner}`,
          changed_by: currentUser.name,
        });
      });
      m.gate_conditions
        .filter((c) => !(payload.conditions ?? []).some((n) => n.condition_id === c.condition_id))
        .forEach((c) =>
          written.push({
            material_id: materialId,
            event_type: "condition_change",
            field: "gate_condition",
            from_value: c.text,
            to_value: null,
            changed_by: currentUser.name,
          }),
        );
    }
    if (outcome === "hold") {
      if ((payload.holdTrigger ?? null) !== m.hold_trigger_event)
        written.push({
          material_id: materialId,
          event_type: "hold_change",
          field: "hold_trigger_event",
          from_value: m.hold_trigger_event,
          to_value: payload.holdTrigger ?? null,
          changed_by: currentUser.name,
        });
      if ((payload.holdReview ?? null) !== m.hold_review_date)
        written.push({
          material_id: materialId,
          event_type: "hold_change",
          field: "hold_review_date",
          from_value: m.hold_review_date,
          to_value: payload.holdReview ?? null,
          changed_by: currentUser.name,
        });
    }
    if (outcome === "no_go" && (payload.noGoReason ?? null) !== m.no_go_reason)
      written.push({
        material_id: materialId,
        event_type: "no_go_reason",
        field: "no_go_reason",
        from_value: m.no_go_reason,
        to_value: payload.noGoReason ?? null,
        changed_by: currentUser.name,
      });
    recordEvents(written);
  };

  /** Ticking a condition is open to anyone — it reports a fact, not a decision. */
  const toggleCondition = (materialId: string, conditionId: string, met: boolean) => {
    const m = data.find((x) => x.material_id === materialId);
    const condition = m?.gate_conditions.find((c) => c.condition_id === conditionId);
    if (!m || !condition) return;
    const stamp = todayIso();
    patchMaterial(materialId, (prev) => ({
      ...prev,
      gate_conditions: prev.gate_conditions.map((c) =>
        c.condition_id === conditionId
          ? { ...c, met, met_date: met ? stamp : null, met_by: met ? currentUser.name : null }
          : c,
      ),
    }));
    recordEvents([
      {
        material_id: materialId,
        event_type: "condition_met",
        field: "gate_condition",
        from_value: met ? null : condition.text,
        to_value: met ? condition.text : null,
        changed_by: currentUser.name,
      },
    ]);
  };

  const saveConditions = (materialId: string, conditions: GateCondition[]) => {
    const m = data.find((x) => x.material_id === materialId);
    if (!m || !gateWritable(m)) return;
    setGateOutcome(materialId, "go_with_conditions", { conditions });
  };

  /** Reopening clears the live reason but keeps the argument on the record. */
  const reopenGate = (materialId: string, note: string | null) => {
    const m = data.find((x) => x.material_id === materialId);
    if (!m || !gateWritable(m) || m.journey_status !== "no_go") return;
    const stamp = todayIso();
    patchMaterial(materialId, (prev) => ({
      ...prev,
      journey_status: "under_evaluation",
      reopened: true,
      previous_no_go: prev.no_go_reason
        ? {
            reason: prev.no_go_reason,
            author: prev.gate_decided_by ?? prev.owner ?? "Unknown",
            date: prev.gate_decided_date ?? stamp,
          }
        : prev.previous_no_go,
      no_go_reason: null,
      gate_decided_by: currentUser.name,
      gate_decided_date: stamp,
      provenance: { ...prev.provenance, journey_status: enteredProvenance() },
    }));
    recordEvents([
      {
        material_id: materialId,
        event_type: "reopen",
        field: "reopen",
        from_value: "no_go",
        to_value: "under_evaluation",
        reason: note?.trim() ? note.trim() : null,
        changed_by: currentUser.name,
      },
    ]);
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
    currentUser,
    setCurrentUser: setCurrentUserId,
    contributors: CONTRIBUTORS,
    assessments,
    entriesFor,
    myEntry,
    saveAssessment,
    clearAssessment,
    canSetGate: gateWritable,
    saveRecommendation,
    setGateOutcome,
    toggleCondition,
    saveConditions,
    reopenGate,
    assessmentState,
    assessmentSummary,
    criterionCoverage,

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
