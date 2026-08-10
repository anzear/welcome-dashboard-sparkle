import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PropertyRow = {
  id: string;
  property: string;
  value: string;
  unit: string;
  note: string;
};

export type Attachment =
  | { id: string; kind: "link"; label: string; url: string }
  | { id: string; kind: "file"; label: string; fileName: string; size: number; dataUrl: string };

export type Goal = {
  id: string;
  text: string;
  tags: string[];
  date: string;
  trl: string;
};

export type Criterion = {
  id: string;
  name: string;
  weight: number;
  note: string;
};

export type MaterialStatus =
  | ""
  | "exploration"
  | "development"
  | "validation"
  | "pilot"
  | "commercial"
  | "on_hold";

export type CompanyBriefData = {
  materialStatus: MaterialStatus;
  urgency: number; // 0 = unset, 1..5 scale
  materialDescription: string;
  constraints: string;
  properties: PropertyRow[];
  attachments: Attachment[];
  goals: Goal[];
  criteria: Criterion[];
};

export type PropertyAssessment = {
  value: string;
  status: "" | "met" | "partial" | "not_met";
  note: string;
};

export type PriorityStatus = "" | "go" | "open" | "blocked";

export type PriorityMeta = {
  status: PriorityStatus;
  updatedAt: string; // ISO
  updatedBy: string;
};

export type PathwayScores = {
  priorityScores: Record<string, number>; // criterionId -> 0..100
  priorityNotes: Record<string, string>; // criterionId -> note
  priorityMeta: Record<string, PriorityMeta>; // criterionId -> status/updatedAt/updatedBy
  propertyAssessments: Record<string, PropertyAssessment>; // propertyId -> assessment
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const makeDefaultCriteria = (): Criterion[] => [
  { id: uid(), name: "Cost", weight: 20, note: "" },
  { id: uid(), name: "Supply security", weight: 20, note: "" },
  { id: uid(), name: "Scalability", weight: 20, note: "" },
  { id: uid(), name: "Sustainability", weight: 20, note: "" },
  { id: uid(), name: "Customer acceptance", weight: 20, note: "" },
];

const emptyBrief = (): CompanyBriefData => ({
  materialStatus: "",
  urgency: 0,
  materialDescription: "",
  constraints: "",
  properties: [],
  attachments: [],
  goals: [],
  criteria: makeDefaultCriteria(),
});

type State = {
  briefs: Record<string, CompanyBriefData>;
  pathwayScores: Record<string, Record<string, PathwayScores>>;
};

type Actions = {
  getBrief: (briefKey: string) => CompanyBriefData;
  updateBrief: (briefKey: string, patch: Partial<CompanyBriefData>) => void;
  getPathwayScores: (briefKey: string, pathwayId: string) => PathwayScores;
  setPriorityScore: (
    briefKey: string,
    pathwayId: string,
    criterionId: string,
    score: number,
    userName: string
  ) => void;
  setPriorityNote: (
    briefKey: string,
    pathwayId: string,
    criterionId: string,
    note: string,
    userName: string
  ) => void;
  setPriorityStatus: (
    briefKey: string,
    pathwayId: string,
    criterionId: string,
    status: PriorityStatus,
    userName: string
  ) => void;
  setPropertyAssessment: (
    briefKey: string,
    pathwayId: string,
    propertyId: string,
    patch: Partial<PropertyAssessment>
  ) => void;
};

const emptyScores = (): PathwayScores => ({
  priorityScores: {},
  priorityNotes: {},
  priorityMeta: {},
  propertyAssessments: {},
});

const touchMeta = (
  current: PathwayScores,
  criterionId: string,
  patch: Partial<PriorityMeta>,
  userName: string
): Record<string, PriorityMeta> => {
  const prev = current.priorityMeta?.[criterionId] ?? {
    status: "" as PriorityStatus,
    updatedAt: "",
    updatedBy: "",
  };
  return {
    ...(current.priorityMeta ?? {}),
    [criterionId]: {
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString(),
      updatedBy: userName || prev.updatedBy || "User",
    },
  };
};

export const useCompanyBriefStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      briefs: {},
      pathwayScores: {},

      getBrief: (briefKey) => {
        const existing = get().briefs[briefKey];
        if (existing) return existing;
        const fresh = emptyBrief();
        set((s) => ({ briefs: { ...s.briefs, [briefKey]: fresh } }));
        return fresh;
      },

      updateBrief: (briefKey, patch) =>
        set((s) => {
          const current = s.briefs[briefKey] ?? emptyBrief();
          return { briefs: { ...s.briefs, [briefKey]: { ...current, ...patch } } };
        }),

      getPathwayScores: (briefKey, pathwayId) => {
        const existing = get().pathwayScores[briefKey]?.[pathwayId];
        if (!existing) return emptyScores();
        return {
          priorityScores: existing.priorityScores ?? {},
          priorityNotes: existing.priorityNotes ?? {},
          priorityMeta: existing.priorityMeta ?? {},
          propertyAssessments: existing.propertyAssessments ?? {},
        };
      },

      setPriorityScore: (briefKey, pathwayId, criterionId, score, userName) =>
        set((s) => {
          const briefBucket = s.pathwayScores[briefKey] ?? {};
          const current: PathwayScores = { ...emptyScores(), ...(briefBucket[pathwayId] ?? {}) };
          return {
            pathwayScores: {
              ...s.pathwayScores,
              [briefKey]: {
                ...briefBucket,
                [pathwayId]: {
                  ...current,
                  priorityScores: { ...current.priorityScores, [criterionId]: score },
                  priorityMeta: touchMeta(current, criterionId, {}, userName),
                },
              },
            },
          };
        }),

      setPriorityNote: (briefKey, pathwayId, criterionId, note, userName) =>
        set((s) => {
          const briefBucket = s.pathwayScores[briefKey] ?? {};
          const current: PathwayScores = { ...emptyScores(), ...(briefBucket[pathwayId] ?? {}) };
          return {
            pathwayScores: {
              ...s.pathwayScores,
              [briefKey]: {
                ...briefBucket,
                [pathwayId]: {
                  ...current,
                  priorityNotes: { ...current.priorityNotes, [criterionId]: note },
                  priorityMeta: touchMeta(current, criterionId, {}, userName),
                },
              },
            },
          };
        }),

      setPriorityStatus: (briefKey, pathwayId, criterionId, status, userName) =>
        set((s) => {
          const briefBucket = s.pathwayScores[briefKey] ?? {};
          const current: PathwayScores = { ...emptyScores(), ...(briefBucket[pathwayId] ?? {}) };
          return {
            pathwayScores: {
              ...s.pathwayScores,
              [briefKey]: {
                ...briefBucket,
                [pathwayId]: {
                  ...current,
                  priorityMeta: touchMeta(current, criterionId, { status }, userName),
                },
              },
            },
          };
        }),

      setPropertyAssessment: (briefKey, pathwayId, propertyId, patch) =>
        set((s) => {
          const briefBucket = s.pathwayScores[briefKey] ?? {};
          const current: PathwayScores = { ...emptyScores(), ...(briefBucket[pathwayId] ?? {}) };
          const prev = current.propertyAssessments[propertyId] ?? {
            value: "",
            status: "" as const,
            note: "",
          };
          return {
            pathwayScores: {
              ...s.pathwayScores,
              [briefKey]: {
                ...briefBucket,
                [pathwayId]: {
                  ...current,
                  propertyAssessments: {
                    ...current.propertyAssessments,
                    [propertyId]: { ...prev, ...patch },
                  },
                },
              },
            },
          };
        }),
    }),
    {
      name: "vcg-company-brief-store",
      version: 2,
      migrate: (persisted: any) => {
        if (!persisted) return persisted;
        const fresh = makeDefaultCriteria();
        if (persisted.briefs) {
          for (const k of Object.keys(persisted.briefs)) {
            persisted.briefs[k] = { ...persisted.briefs[k], criteria: fresh.map(c => ({ ...c, id: uid() })) };
          }
        }
        return persisted;
      },
    }
  )
);

export const makeBriefKey = (category?: string, topic?: string) =>
  `${category || "unknown"}|${topic || "unknown"}`;

export const newId = uid;
