import React, { createContext, useContext, useMemo, useState } from "react";
import { seedEvents, seedMaterialsWithHistory } from "@/data/materialEventsMock";
import { seedDriverScores } from "@/data/driverScoresMock";
import { DRIVER_QUESTIONS, scoreKey } from "@/config/driverQuestions";
import {
  JOURNEY_STATUS_LABEL,
  type FieldProvenance,
  type JourneyStatus,
  type Material,
  type DriverCounts,
  type DriverScore,
  type MaterialEvent,
  type MaterialEventType,
} from "@/types/materialPrioritisation";
import type { BulkPayload } from "@/components/materialRegister/BulkActionDialog";


export const CURRENT_USER = "You";

export type MeasureId = "spend" | "emissions" | "volume" | "multi_application";

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
    id: "multi_application",
    label: "Multi-application",
    short: "APP",
    noun: "application",
    unit: "applications",
    value: (m) =>
      m.application_categories && m.application_categories.length > 0 ? m.application_categories.length : null,
  },
];

/** A gap counts as divergent at or above this share of the ranked population. */
export const DIVERGENCE_THRESHOLD_RATIO = 0.25;

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
  groups: string[];
}

export const EMPTY_FILTERS: Filters = {
  search: "",
  classes: [],
  statuses: [],
  owners: [],
  entryTypes: [],
  groups: [],
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
  events: MaterialEvent[];
  eventsFor: (id: string) => MaterialEvent[];
  recordEvents: (inputs: EventInput[]) => void;
  /** Sparse judgement map. A missing key means no judgement, never a zero. */
  scores: Record<string, DriverScore>;
  scoreFor: (materialId: string, questionId: string) => DriverScore | null;
  setScore: (materialId: string, questionId: string, score: number, note: string | null) => void;
  countsFor: (materialId: string) => DriverCounts;
  questionCoverage: (questionId: string, rows: Material[]) => number;
  /** Period the priority set is being assembled for. Free text. */
  priorityPeriod: string;
  setPriorityPeriod: (v: string) => void;
  prioritySetCount: number;
  inPrioritySet: (m: Material) => boolean;
  /** Sets or clears priority_selected for a set of materials in one batch. */
  applyPriority: (ids: Set<string>, add: boolean) => void;
  toast: { message: string; snapshot: Material[]; batchId?: string } | null;
  setToast: React.Dispatch<
    React.SetStateAction<{ message: string; snapshot: Material[]; batchId?: string } | null>
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
  const [measureId, setMeasureId] = useState<MeasureId>("spend");
  const [priorityPeriod, setPriorityPeriod] = useState("H2 2026");

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [onlyUnranked, setOnlyUnranked] = useState(false);
  const [onlyDivergent, setOnlyDivergent] = useState(false);
  const [onlySelected, setOnlySelected] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    snapshot: Material[];
    batchId?: string;
  } | null>(null);


  const measure = MEASURES.find((x) => x.id === measureId)!;

  const filtersActive =
    filters.search.trim() !== "" ||
    filters.classes.length > 0 ||
    filters.statuses.length > 0 ||
    filters.owners.length > 0 ||
    filters.entryTypes.length > 0 ||
    filters.groups.length > 0;

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
      if (filters.groups.length && !filters.groups.includes(m.customer_material_group ?? "")) return false;
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
    batch_origin: "real_transition",
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
        } else {
          next.customer_material_group = payload.value;
          next.provenance.customer_material_group = enteredProvenance();
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
        return {
          material_id: m.material_id,
          event_type: "field_correction",
          field: "customer_material_group",
          from_value: m.customer_material_group,
          to_value: payload.value,
          batch_id: batchId,
        } as EventInput;
      }),
    );

    const noun = payload.kind === "status" ? "Status" : payload.kind === "owner" ? "Owner" : "Tag";
    setToast({ message: `${noun} updated for ${ids.size} materials.`, snapshot, batchId });
  };

  const inPrioritySet = (m: Material) => m.priority_selected && m.priority_period === priorityPeriod;
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
          priority_selected: add,
          priority_period: add ? priorityPeriod : null,
          provenance: {
            ...m.provenance,
            priority_selected: enteredProvenance(),
            priority_period: enteredProvenance(),
          },
        };
      }),
    );

    recordEvents(
      snapshot.map((m) => ({
        material_id: m.material_id,
        event_type: "priority_change",
        field: "priority_selected",
        from_value: m.priority_selected ? (m.priority_period ?? "current period") : null,
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
    if (toast.batchId) setEvents((prev) => prev.filter((e) => e.batch_id !== toast.batchId));
    setToast(null);
  };


  const scoreFor = (materialId: string, questionId: string) =>
    scores[scoreKey(materialId, questionId)] ?? null;

  /**
   * Counts of judgements only. Never summed, averaged or weighted into an index.
   * A material with nothing scored has null counts, not zeroes.
   */
  const countsFor = (materialId: string): DriverCounts => {
    const values = DRIVER_QUESTIONS.map((q) => scores[scoreKey(materialId, q.id)]?.score ?? null).filter(
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
    events,
    eventsFor,
    recordEvents,
    scores,
    scoreFor,
    setScore,
    countsFor,
    questionCoverage,
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
