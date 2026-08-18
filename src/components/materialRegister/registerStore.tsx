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
  CRITERIA,
  CRITERION_LABEL,
  DEFAULT_CONTRIBUTOR,
  assessmentKey,
} from "@/config/assessmentCriteria";
import {
  JOURNEY_STATUS_LABEL,
  type AssessmentCriterion,
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
  type DocumentFileType,
  type SupportingDocument,
} from "@/types/materialPrioritisation";
import type { BulkPayload } from "@/components/materialRegister/BulkActionDialog";
import { ENTRY_TYPES } from "@/components/materialRegister/materialEntry";
import { addTags, formatTags, removeTags, tagKey, UNTAGGED } from "@/components/materialRegister/tags";
import { applyProductLines } from "@/data/productLinesMock";
import {
  inScope,
  isProductLineTag,
  productLineCounts,
  scopeLabel as labelForScope,
  type Scope,
} from "@/components/materialRegister/productLines";


export const CURRENT_USER = "You";

/**
 * The criterion set is shared, so a change to it is not a change to one
 * material. These are kept apart from material History for that reason.
 */
export interface CriterionSetEvent {
  event_id: string;
  action: "added" | "edited" | "removed";
  criterion_id: string;
  label: string;
  detail: string | null;
  changed_by: string;
  changed_at: string;
}


export type RankMeasureId = "spend" | "emissions" | "volume" | "applications";
export type MeasureId = RankMeasureId | "all";

export interface Measure {
  id: RankMeasureId;
  label: string;
  /** compact chip label */
  short: string;
  /** label used in the no-figure divider, lower-case */
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
  /** Application areas, matched with ANY. */
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
  /** Evidence. Presence of supporting documents only — volume is never filtered. */
  hasDocuments: boolean;
  /** Zero assessment entries from anyone. The one word for this state. */
  notAssessed: boolean;
  /** Either an overdue condition or an overdue hold review. */
  gateOverdue: boolean;
  /** Carries a split flag on at least one judged criterion. */
  teamsDisagree: boolean;
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
  hasDocuments: false,
  notAssessed: false,
  gateOverdue: false,
  teamsDisagree: false,
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
  /** The whole register, unscoped. Only briefs and lookups use this. */
  allMaterials: Material[];
  scope: Scope;
  setScope: (next: Scope) => void;
  scopeCounts: { lines: { value: string; label: string; count: number }[]; untagged: number };
  scopeLabel: string;
  scopedTotal: number;
  totalCount: number;
  measureId: MeasureId;
  setMeasureId: (id: MeasureId) => void;
  measure: Measure | null;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  filtersActive: boolean;
  onlyNoFigure: boolean;
  setOnlyNoFigure: React.Dispatch<React.SetStateAction<boolean>>;
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
  /**
   * THE CRITERION SET. One shared set, used by every material. Editing a
   * criterion changes it everywhere, and removing one deletes every entry and
   * document recorded against it. Only a material owner may change the set.
   */
  criteria: AssessmentCriterion[];
  judgedCriteria: AssessmentCriterion[];
  criterionLabelOf: (id: string) => string;
  criteriaEvents: CriterionSetEvent[];
  /** True when this person owns at least one material in the portfolio. */
  canEditCriteria: boolean;
  /** How many entries and documents a removal would destroy, portfolio-wide. */
  criterionFootprint: (criterionId: string) => {
    materials: number;
    entries: number;
    documents: number;
  };
  addCriterion: (draft: { label: string; helper: string; anchors: string }) => boolean;
  updateCriterion: (
    criterionId: string,
    patch: { label: string; helper: string; anchors: string },
  ) => boolean;
  removeCriterion: (criterionId: string) => boolean;
  /** Sparse entry map. A missing key means that person has no view recorded. */
  assessments: Record<string, AssessmentEntry>;
  entriesFor: (materialId: string, criterionId: string) => AssessmentEntry[];
  myEntry: (materialId: string, criterionId: string) => AssessmentEntry | null;
  /**
   * Records or replaces the current user's entry on one criterion. score null =
   * Neutral. A 1–5 score without a rationale is refused; returns false.
   */
  saveAssessment: (
    materialId: string,
    criterionId: string,
    score: number | null,
    note: string | null,
  ) => boolean;
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
    /** Neutral entries recorded. Never part of criteriaAssessed. */
    neutralEntries: number;
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
  /**
   * Supporting documents. Criterion-level evidence, shared with everyone on the
   * material. Mock records: no storage, no preview, no download.
   */
  documents: SupportingDocument[];
  documentsFor: (materialId: string, criterionId: string) => SupportingDocument[];
  documentCount: (materialId: string, criterionId: string) => number;
  hasAnyDocuments: (materialId: string) => boolean;
  addDocument: (
    materialId: string,
    criterionId: string,
    file: { filename: string; file_type: DocumentFileType; size: string },
    note: string | null,
  ) => void;
  canDeleteDocument: (doc: SupportingDocument) => boolean;
  deleteDocument: (documentId: string) => void;
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
export const seededMaterials = applyProductLines(gateSeed.materials);

const SCOPE_KEY = "material-portfolio-scope";

const readScope = (): Scope => {
  try {
    const raw = window.localStorage.getItem(SCOPE_KEY);
    return raw && raw !== "" ? raw : null;
  } catch {
    return null;
  }
};

export const RegisterProvider: React.FC<{ rows?: Material[]; children: React.ReactNode }> = ({
  rows = seededMaterials,
  children,
}) => {
  const [data, setData] = useState<Material[]>(rows);
  /** Product line scope. Narrows every list and every count below it, never a material. */
  const [scope, setScopeState] = useState<Scope>(() => readScope());

  const setScope = (next: Scope) => {
    setScopeState(next);
    try {
      if (next === null) window.localStorage.removeItem(SCOPE_KEY);
      else window.localStorage.setItem(SCOPE_KEY, next);
    } catch {
      /* scope is a view preference; a storage failure must not break the view */
    }
  };

  /** Everything downstream reads this list. `allMaterials` stays whole for briefs. */
  const scoped = useMemo(() => data.filter((m) => inScope(m, scope)), [data, scope]);
  const scopeCounts = useMemo(() => productLineCounts(data), [data]);
  const [events, setEvents] = useState<MaterialEvent[]>([...seedEvents, ...gateSeed.events]);
  const [assessments, setAssessments] = useState<Record<string, AssessmentEntry>>(seedAssessments);
  /** Criterion-level evidence. Shared across the team, mock records only. */
  const [documents, setDocuments] = useState<SupportingDocument[]>(seedDocuments);
  const [currentUserId, setCurrentUserId] = useState<string>(DEFAULT_CONTRIBUTOR.user_id);
  /** One shared criterion set. Every material reads this list. */
  const [criteria, setCriteria] = useState<AssessmentCriterion[]>(CRITERIA);
  const [criteriaEvents, setCriteriaEvents] = useState<CriterionSetEvent[]>([]);
  const judgedCriteria = useMemo(() => criteria.filter((c) => c.kind === "judgement"), [criteria]);
  const judgedCriteriaRef = judgedCriteria;
  const [measureId, setMeasureId] = useState<MeasureId>("spend");
  const [priorityPeriod, setPriorityPeriod] = useState("H2 2026");

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [onlyNoFigure, setOnlyNoFigure] = useState(false);
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
    filters.gateRecommendation !== "any" ||
    filters.hasDocuments ||
    filters.notAssessed ||
    filters.gateOverdue ||
    filters.teamsDisagree;

  const documentedIds = useMemo(
    () => new Set(documents.map((d) => d.material_id)),
    [documents],
  );

  /** Materials somebody has recorded at least one assessment entry for. */
  const assessedIds = useMemo(
    () => new Set(Object.values(assessments).map((e) => e.material_id)),
    [assessments],
  );

  /**
   * Split flag: entries on one judged criterion spanning more than two points.
   * Computed here from the entries so the filter needs no ordering with the
   * per-criterion reader below.
   */
  const disagreeIds = useMemo(() => {
    const byKey = new Map<string, number[]>();
    Object.values(assessments).forEach((e) => {
      if (!judgedCriteriaRef.some((c) => c.criterion_id === e.criterion_id)) return;
      /** Neutral is no visibility, not a low score — it can never make a split. */
      if (e.score === null) return;
      const key = `${e.material_id}::${e.criterion_id}`;
      const list = byKey.get(key) ?? [];
      list.push(e.score);
      byKey.set(key, list);
    });
    const ids = new Set<string>();
    byKey.forEach((scores, key) => {
      if (scores.length < 2) return;
      if (Math.max(...scores) - Math.min(...scores) > 2) ids.add(key.split("::")[0]);
    });
    return ids;
  }, [assessments, judgedCriteriaRef]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return scoped.filter((m) => {
      if (q) {
        const hay = [m.name, m.cas_number ?? "", ...(m.customer_material_ids ?? [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.classes.length && !filters.classes.includes(m.material_class ?? "")) return false;
      if (filters.statuses.length && !filters.statuses.includes(m.journey_status)) return false;
      if (filters.hasDocuments && !documentedIds.has(m.material_id)) return false;
      if (filters.notAssessed && assessedIds.has(m.material_id)) return false;
      if (filters.gateOverdue && !hasOverdueCondition(m) && !holdReviewOverdue(m)) return false;
      if (filters.teamsDisagree && !disagreeIds.has(m.material_id)) return false;
      if (filters.gateOverdueCondition && !hasOverdueCondition(m)) return false;
      if (filters.gateHoldReviewOverdue && !holdReviewOverdue(m)) return false;
      if (filters.gateRecommendation === "yes" && m.recommendation === null) return false;
      if (filters.gateRecommendation === "no" && m.recommendation !== null) return false;
      if (filters.owners.length && !filters.owners.includes(m.owner ?? UNASSIGNED_OWNER)) return false;
      if (filters.entryTypes.length && !filters.entryTypes.includes(m.entry_type)) return false;
      if (
        filters.products.length &&
        !(m.application_areas ?? []).some((c) => filters.products.includes(c))
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
  }, [scoped, filters, documentedIds, assessedIds, disagreeIds]);

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
  const bothFilters = onlyNoFigure && onlyDivergent;

  const visible = bothFilters
    ? []
    : ordered.filter(
        (r) =>
          (!onlyNoFigure || r.rank === null) &&
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
          next.application_areas = nextList(m.application_areas ?? []);
          next.provenance.application_areas = enteredProvenance();
        } else if (payload.kind === "applications") {
          next.application_categories = nextList(m.application_categories ?? []);
          next.provenance.application_categories = enteredProvenance();
        } else if (payload.kind === "product_lines" || payload.kind === "tags") {
          // Tags are one array with two types; each action touches only its own partition.
          const isLine = payload.kind === "product_lines";
          const mine = (m.tags ?? []).filter((t) => isProductLineTag(t) === isLine);
          const others = (m.tags ?? []).filter((t) => isProductLineTag(t) !== isLine);
          next.tags = [...others, ...nextList(mine)];
          next.provenance.tags = enteredProvenance();
        } else if (payload.kind === "entry_type") {
          next.entry_type = payload.value as Material["entry_type"];
          next.provenance.entry_type = enteredProvenance();
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
        if (payload.kind === "entry_type") {
          return {
            material_id: m.material_id,
            event_type: "field_correction",
            field: "entry_type",
            from_value: m.entry_type,
            to_value: payload.value,
            batch_id: batchId,
          } as EventInput;
        }
        if (payload.kind === "product_lines" || payload.kind === "tags") {
          const isLine = payload.kind === "product_lines";
          const mine = (m.tags ?? []).filter((t) => isProductLineTag(t) === isLine);
          return {
            material_id: m.material_id,
            event_type: "field_correction",
            field: "tags",
            from_value: formatTags(mine) || null,
            to_value: formatTags(nextList(mine)) || null,
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
        const field = payload.kind === "products" ? "application_areas" : "application_categories";
        const existing = (payload.kind === "products" ? m.application_areas : m.application_categories) ?? [];
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
            ? "Application areas"
            : payload.kind === "applications"
              ? "Application categories"
              : payload.kind === "priority_period"
                ? "Priority period"
                : payload.kind === "entry_type"
                  ? "Entry type"
                  : payload.kind === "product_lines"
                    ? "Product lines"
                    : payload.kind === "tags"
                      ? "Tags"
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
  const prioritySetCount = scoped.filter(inPrioritySet).length;

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
   * Spread across the recorded 1–5 scores. No entry is not a score, and Neutral
   * is not a score either — neither enters the spread. The entries are never
   * averaged; the flag reports how far apart people sit, nothing more.
   */
  const assessmentState = (materialId: string, criterionId: string): AssessmentState => {
    const entries = entriesFor(materialId, criterionId);
    const values = entries.map((e) => e.score).filter((s): s is number => s !== null);
    const neutralCount = entries.length - values.length;
    const teams = Array.from(new Set(entries.map((e) => e.team)));
    if (values.length === 0) {
      return {
        flag: entries.length === 0 ? "not_assessed" : "neutral_only",
        entries,
        low: null,
        high: null,
        spread: null,
        scoredCount: 0,
        neutralCount,
        teams,
      };
    }
    const low = Math.min(...values);
    const high = Math.max(...values);
    const spread = high - low;
    const flag =
      values.length === 1 ? "single_view" : spread <= 1 ? "aligned" : spread === 2 ? "mixed" : "split";
    return { flag, entries, low, high, spread, scoredCount: values.length, neutralCount, teams };
  };

  const assessmentSummary = (materialId: string) => {
    const mine = Object.values(assessments).filter((e) => e.material_id === materialId);
    const contributors = Array.from(new Set(mine.map((e) => e.user_id)));
    const teams = Array.from(new Set(mine.map((e) => e.team)));
    /** Only a 1–5 score counts as assessed. Neutral is a recorded absence of view. */
    const criteriaAssessed = judgedCriteria.filter((c) =>
      mine.some((e) => e.criterion_id === c.criterion_id && e.score !== null),
    ).length;
    const neutralEntries = mine.filter((e) => e.score === null).length;
    const splits = judgedCriteria.filter(
      (c) => assessmentState(materialId, c.criterion_id).flag === "split",
    ).length;
    const lastAssessedAt = mine.reduce<string | null>(
      (latest, e) => (latest === null || e.assessed_at > latest ? e.assessed_at : latest),
      null,
    );
    return {
      criteriaAssessed,
      criteriaTotal: judgedCriteria.length,
      contributors,
      teams,
      splits,
      neutralEntries,
      entryCount: mine.length,
      lastAssessedAt,
    };
  };

  const criterionCoverage = (criterionId: string, rowsIn: Material[]) =>
    rowsIn.filter((m) =>
      Object.values(assessments).some(
        (e) => e.material_id === m.material_id && e.criterion_id === criterionId && e.score !== null,
      ),
    ).length;

  /* ----------------------------------------------------- supporting documents
   * Evidence sits on a criterion, never on a person's entry and never on the
   * material as a whole. Nothing here counts toward a score or coverage.
   * -------------------------------------------------------------------------- */

  const documentsFor = (materialId: string, criterionId: string) =>
    documents
      .filter((d) => d.material_id === materialId && d.criterion_id === criterionId)
      .sort((a, b) => b.uploaded_date.localeCompare(a.uploaded_date));

  const documentCount = (materialId: string, criterionId: string) =>
    documents.filter((d) => d.material_id === materialId && d.criterion_id === criterionId).length;

  const hasAnyDocuments = (materialId: string) =>
    documents.some((d) => d.material_id === materialId);

  /** Anyone can attach — holding the evidence does not require holding a view. */
  const addDocument = (
    materialId: string,
    criterionId: string,
    file: { filename: string; file_type: DocumentFileType; size: string },
    note: string | null,
  ) => {
    setDocuments((prev) => [
      ...prev,
      {
        document_id: `doc-${Date.now()}-${prev.length + 1}`,
        material_id: materialId,
        criterion_id: criterionId,
        filename: file.filename,
        file_type: file.file_type,
        size: file.size,
        note,
        uploaded_by: currentUser.name,
        uploaded_date: todayIso(),
      },
    ]);
  };

  /** The uploader may remove their own; the material owner may remove any. */
  const canDeleteDocument = (doc: SupportingDocument) => {
    const m = data.find((x) => x.material_id === doc.material_id);
    return doc.uploaded_by === currentUser.name || (m?.owner ?? null) === currentUser.name;
  };

  /** Immediate and final. No soft delete, no recovery. */
  const deleteDocument = (documentId: string) =>
    setDocuments((prev) => prev.filter((d) => d.document_id !== documentId));



  /**
   * A 1–5 score cannot be saved without a rationale — a score with no reason
   * cannot be challenged six months later. Neutral (score null) may be saved
   * with no note. Returns false when the save was refused.
   */
  const saveAssessment = (
    materialId: string,
    criterionId: string,
    score: number | null,
    note: string | null,
  ): boolean => {
    const cleanNote = note?.trim() ? note.trim() : null;
    if (score !== null && cleanNote === null) return false;
    const key = assessmentKey(materialId, criterionId, currentUserId);
    setAssessments((prev) => ({
      ...prev,
      [key]: {
        material_id: materialId,
        criterion_id: criterionId,
        user_id: currentUserId,
        team: currentUser.team,
        score,
        note: cleanNote,
        assessed_at: new Date().toISOString(),
      },
    }));
    // Assessment entries carry their own stamps in the Assessment card. History
    // is the record of decisions, not of opinions, so nothing is written here.
    return true;
  };

  const clearAssessment = (materialId: string, criterionId: string) => {
    const key = assessmentKey(materialId, criterionId, currentUserId);
    if (!assessments[key]) return;
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

  /**
   * Back to under evaluation. From a no-go this clears the live reason but keeps
   * the argument on the record; from any other status it simply reopens.
   */
  const reopenGate = (materialId: string, note: string | null) => {
    const m = data.find((x) => x.material_id === materialId);
    if (!m || !gateWritable(m) || m.journey_status === "under_evaluation") return;
    const stamp = todayIso();
    patchMaterial(materialId, (prev) => ({
      ...prev,
      journey_status: "under_evaluation",
      reopened: prev.journey_status === "no_go" ? true : prev.reopened,
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
        from_value: m.journey_status,
        to_value: "under_evaluation",
        reason: note?.trim() ? note.trim() : null,
        changed_by: currentUser.name,
      },
    ]);
  };


  /* --------------------------------------------------------- the criterion set
   * Shared by every material. An edit rewrites the question the whole portfolio
   * has been answering, and a removal destroys the answers. Owner-only.
   * -------------------------------------------------------------------------- */

  /** Only a material owner may change the set the whole portfolio is scored on. */
  const canEditCriteria = data.some((m) => (m.owner ?? null) === currentUser.name);

  const criterionLabelOf = (id: string) =>
    criteria.find((c) => c.criterion_id === id)?.label ?? CRITERION_LABEL[id] ?? id;

  const criterionFootprint = (criterionId: string) => {
    const entries = Object.values(assessments).filter((e) => e.criterion_id === criterionId);
    return {
      materials: new Set(entries.map((e) => e.material_id)).size,
      entries: entries.length,
      documents: documents.filter((d) => d.criterion_id === criterionId).length,
    };
  };

  const logCriterionChange = (
    action: CriterionSetEvent["action"],
    criterion_id: string,
    label: string,
    detail: string | null,
  ) =>
    setCriteriaEvents((prev) => [
      {
        event_id: `cse-${Date.now()}-${prev.length + 1}`,
        action,
        criterion_id,
        label,
        detail,
        changed_by: currentUser.name,
        changed_at: new Date().toISOString(),
      },
      ...prev,
    ]);

  const addCriterion = (draft: { label: string; helper: string; anchors: string }) => {
    if (!canEditCriteria) return false;
    const label = draft.label.trim();
    if (!label) return false;
    const criterion_id = `crit_${Date.now().toString(36)}`;
    setCriteria((prev) => [
      ...prev,
      {
        criterion_id,
        label,
        kind: "judgement",
        helper: draft.helper.trim(),
        anchors: draft.anchors.trim() || undefined,
      },
    ]);
    logCriterionChange("added", criterion_id, label, "Added to every material, with no entries yet.");
    return true;
  };

  const updateCriterion = (
    criterionId: string,
    patch: { label: string; helper: string; anchors: string },
  ) => {
    if (!canEditCriteria) return false;
    const existing = criteria.find((c) => c.criterion_id === criterionId);
    if (!existing || existing.kind !== "judgement") return false;
    const label = patch.label.trim();
    if (!label) return false;
    setCriteria((prev) =>
      prev.map((c) =>
        c.criterion_id === criterionId
          ? { ...c, label, helper: patch.helper.trim(), anchors: patch.anchors.trim() || undefined }
          : c,
      ),
    );
    logCriterionChange(
      "edited",
      criterionId,
      label,
      existing.label === label ? "Wording changed." : `Renamed from "${existing.label}".`,
    );
    return true;
  };

  /** Removal is portfolio-wide and final: the entries and documents go with it. */
  const removeCriterion = (criterionId: string) => {
    if (!canEditCriteria) return false;
    const existing = criteria.find((c) => c.criterion_id === criterionId);
    if (!existing || existing.kind !== "judgement") return false;
    const { entries, materials } = criterionFootprint(criterionId);
    setCriteria((prev) => prev.filter((c) => c.criterion_id !== criterionId));
    setAssessments((prev) => {
      const next: Record<string, AssessmentEntry> = {};
      Object.entries(prev).forEach(([k, e]) => {
        if (e.criterion_id !== criterionId) next[k] = e;
      });
      return next;
    });
    setDocuments((prev) => prev.filter((d) => d.criterion_id !== criterionId));
    logCriterionChange(
      "removed",
      criterionId,
      existing.label,
      entries === 0
        ? "Removed from every material. No entries existed."
        : `Removed from every material, with ${entries} ${entries === 1 ? "entry" : "entries"} across ${materials} ${materials === 1 ? "material" : "materials"}.`,
    );
    return true;
  };


  const value: Store = {
    data: scoped,
    allMaterials: data,
    scope,
    setScope,
    scopeCounts,
    scopeLabel: labelForScope(scope),
    scopedTotal: scoped.length,
    totalCount: data.length,
    measureId,
    setMeasureId,
    measure,
    filters,
    setFilters,
    filtersActive,
    onlyNoFigure,
    setOnlyNoFigure,
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
    criteria,
    judgedCriteria,
    criterionLabelOf,
    criteriaEvents,
    canEditCriteria,
    criterionFootprint,
    addCriterion,
    updateCriterion,
    removeCriterion,
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
    documents,
    documentsFor,
    documentCount,
    hasAnyDocuments,
    addDocument,
    canDeleteDocument,
    deleteDocument,

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
