import React, { createContext, useContext, useMemo, useState } from "react";
import { materials as seedMaterials } from "@/data/materialPrioritisationMock";
import {
  JOURNEY_STATUS_LABEL,
  type FieldProvenance,
  type JourneyStatus,
  type Material,
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
  value: (m: Material) => number | null;
}

export const MEASURES: Measure[] = [
  { id: "spend", label: "Spend", short: "SPD", noun: "spend", value: (m) => m.annual_spend },
  { id: "emissions", label: "Emissions", short: "GHG", noun: "emissions", value: (m) => m.ghg_contribution },
  { id: "volume", label: "Volume", short: "VOL", noun: "volume", value: (m) => m.annual_volume },
  {
    id: "multi_application",
    label: "Multi-application",
    short: "APP",
    noun: "application",
    value: (m) =>
      m.application_categories && m.application_categories.length > 0 ? m.application_categories.length : null,
  },
];

/** A gap counts as divergent at or above this share of the ranked population. */
export const DIVERGENCE_THRESHOLD_RATIO = 0.25;

export const UNASSIGNED_OWNER = "__unassigned__";

export const ENTRY_TYPE_LABEL: Record<string, string> = {
  substitute_material_source: "Substitute material source",
  new_material: "New material",
};

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
  updateMaterial: (id: string, patch: Partial<Material>, enteredFields?: string[]) => void;
  applyBulk: (payload: BulkPayload, ids: Set<string>) => void;
  toast: { message: string; snapshot: Material[] } | null;
  setToast: React.Dispatch<React.SetStateAction<{ message: string; snapshot: Material[] } | null>>;
  undo: () => void;
}

const Ctx = createContext<Store | null>(null);

export const useRegister = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRegister must be used inside RegisterProvider");
  return v;
};

export const RegisterProvider: React.FC<{ rows?: Material[]; children: React.ReactNode }> = ({
  rows = seedMaterials,
  children,
}) => {
  const [data, setData] = useState<Material[]>(rows);
  const [measureId, setMeasureId] = useState<MeasureId>("spend");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [onlyUnranked, setOnlyUnranked] = useState(false);
  const [onlyDivergent, setOnlyDivergent] = useState(false);
  const [onlySelected, setOnlySelected] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; snapshot: Material[] } | null>(null);

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

  const updateMaterial = (id: string, patch: Partial<Material>, enteredFields: string[] = []) => {
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
  };

  const applyBulk = (payload: BulkPayload, ids: Set<string>) => {
    const snapshot = data.filter((m) => ids.has(m.material_id)).map((m) => ({ ...m }));
    const stamp = today();

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

    const noun = payload.kind === "status" ? "Status" : payload.kind === "owner" ? "Owner" : "Tag";
    setToast({ message: `${noun} updated for ${ids.size} materials.`, snapshot });
  };

  const undo = () => {
    if (!toast) return;
    const byId = new Map(toast.snapshot.map((m) => [m.material_id, m]));
    setData((prev) => prev.map((m) => byId.get(m.material_id) ?? m));
    setToast(null);
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
    toast,
    setToast,
    undo,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export { JOURNEY_STATUS_LABEL };
