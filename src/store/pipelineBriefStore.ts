import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  makeDefaultCriteria,
  newId as uid,
  type PropertyRow,
  type Attachment,
  type Goal,
  type Criterion,
} from "./companyBriefStore";

export interface PipelineBriefContent {
  materialDescription: string;
  constraints: string;
  properties: PropertyRow[];
  attachments: Attachment[];
  goals: Goal[];
  criteria: Criterion[];
}

export interface PipelineBrief {
  id: string;
  name: string;
  color: string; // palette key
  content: PipelineBriefContent;
  lastEditedBy: string;
  lastEditedAt: number;
  createdAt: number;
}

const PALETTE = [
  "emerald",
  "violet",
  "amber",
  "rose",
  "sky",
  "fuchsia",
  "teal",
  "orange",
  "indigo",
  "lime",
];

export const BRIEF_PALETTE: Record<
  string,
  { dot: string; bg: string; text: string; border: string; ring: string }
> = {
  emerald: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", ring: "ring-emerald-200" },
  violet:  { dot: "bg-violet-500",  bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200",  ring: "ring-violet-200" },
  amber:   { dot: "bg-amber-500",   bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   ring: "ring-amber-200" },
  rose:    { dot: "bg-rose-500",    bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200",    ring: "ring-rose-200" },
  sky:     { dot: "bg-sky-500",     bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200",     ring: "ring-sky-200" },
  fuchsia: { dot: "bg-fuchsia-500", bg: "bg-fuchsia-50", text: "text-fuchsia-700", border: "border-fuchsia-200", ring: "ring-fuchsia-200" },
  teal:    { dot: "bg-teal-500",    bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200",    ring: "ring-teal-200" },
  orange:  { dot: "bg-orange-500",  bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  ring: "ring-orange-200" },
  indigo:  { dot: "bg-indigo-500",  bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200",  ring: "ring-indigo-200" },
  lime:    { dot: "bg-lime-500",    bg: "bg-lime-50",    text: "text-lime-700",    border: "border-lime-200",    ring: "ring-lime-200" },
};

interface State {
  briefs: Record<string, PipelineBrief>;
  order: string[];
}
interface Actions {
  list: () => PipelineBrief[];
  get: (id: string) => PipelineBrief | undefined;
  create: (name: string, userName: string) => PipelineBrief;
  rename: (id: string, name: string, userName: string) => void;
  updateContent: (
    id: string,
    patch: Partial<PipelineBriefContent>,
    userName: string
  ) => void;
  remove: (id: string) => void;
}

const EVT = "pipelineBriefsUpdated";

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

export const PIPELINE_BRIEFS_EVENT = EVT;

export const usePipelineBriefStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      briefs: {},
      order: [],

      list: () => get().order.map((id) => get().briefs[id]).filter(Boolean) as PipelineBrief[],
      get: (id) => get().briefs[id],

      create: (name, userName) => {
        const id = uid();
        const idx = get().order.length;
        const color = PALETTE[idx % PALETTE.length];
        const now = Date.now();
        const brief: PipelineBrief = {
          id,
          name: name?.trim() || "Untitled brief",
          color,
          content: {
            materialDescription: "",
            constraints: "",
            properties: [],
            attachments: [],
            goals: [],
            criteria: makeDefaultCriteria(),
          },
          lastEditedBy: userName || "Jon Doe",
          lastEditedAt: now,
          createdAt: now,
        };
        set((s) => ({
          briefs: { ...s.briefs, [id]: brief },
          order: [...s.order, id],
        }));
        emit();
        return brief;
      },

      rename: (id, name, userName) => {
        set((s) => {
          const b = s.briefs[id];
          if (!b) return s as any;
          return {
            briefs: {
              ...s.briefs,
              [id]: {
                ...b,
                name: name?.trim() || "Untitled brief",
                lastEditedBy: userName || b.lastEditedBy,
                lastEditedAt: Date.now(),
              },
            },
          };
        });
        emit();
      },

      updateContent: (id, patch, userName) => {
        set((s) => {
          const b = s.briefs[id];
          if (!b) return s as any;
          return {
            briefs: {
              ...s.briefs,
              [id]: {
                ...b,
                content: { ...b.content, ...patch },
                lastEditedBy: userName || b.lastEditedBy,
                lastEditedAt: Date.now(),
              },
            },
          };
        });
        emit();
      },

      remove: (id) => {
        set((s) => {
          const { [id]: _, ...rest } = s.briefs;
          return { briefs: rest, order: s.order.filter((x) => x !== id) };
        });
        emit();
      },
    }),
    { name: "vcg-pipeline-brief-store" }
  )
);
