import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";


import { ItemNotesControl } from "@/components/materialRegister/itemNotes";
import {
  DocumentAttachControl,
  mockSeedByIndex,
  useItemDocuments,
} from "@/components/materialRegister/itemDocuments";
import {
  BAND_LABEL,
  PATHWAY_CHIP_ANCHOR,
  PATHWAY_CHIP_NEUTRAL,
  getViability,
  getViabilityColor,
  hasTRL,
  pathwayChipCls,
} from "./pathwayRowStyles";
import {
  PATHWAY_STATUS_CHANGED_EVENT,
  PATHWAY_STATUS_LABEL,
  readPathwayStatus,
  type PathwayStatus,
} from "./PathwayStatusCard";
import { cn } from "@/lib/utils";


export type ShortlistPathway = {
  id: string;
  /** Node identities — clustering matches on these, never on label text. */
  feedstockId: string;
  processId: string;
  productId: string;
  applicationId: string;
  feedstock: string;
  process: string;
  product: string;
  application: string;
  /** e.g. "TRL 9"; absent means the pathway has no assigned status. */
  trl?: string;
  /** Colleague who shortlisted this pathway. */
  savedBy?: string;
};


export type PathwayNote = { id: string; author: string; timestamp: string; text: string };


/** Live-reads the pathway's own status (To do … Parked) set in the Workspace. */
function usePathwayStatus(topic: string | undefined, pathwayId: string): PathwayStatus {
  const [status, setStatus] = useState(() => readPathwayStatus(topic, pathwayId));
  useEffect(() => {
    const sync = () => setStatus(readPathwayStatus(topic, pathwayId));
    sync();
    window.addEventListener(PATHWAY_STATUS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PATHWAY_STATUS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [topic, pathwayId]);
  return status;
}

function EvaluationStatusBadges({ topic, pathwayId }: { topic?: string; pathwayId: string }) {
  const status = usePathwayStatus(topic, pathwayId);
  return (
    <span
      title={`Pathway status: ${PATHWAY_STATUS_LABEL[status]}`}
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-semibold pathway-status",
        `pathway-status--${status}`,
      )}
    >
      {PATHWAY_STATUS_LABEL[status]}
    </span>
  );
}

const COLS =
  "grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_150px_88px_120px_110px_32px]";

/** Existing table-header treatment, reused so the grid header matches the app. */
const HEAD_CLS = "text-[8px] font-semibold uppercase tracking-widest text-muted-foreground";



/** Mirrors the Pathway Explorer badge: band colour and TRL on one line. */
function StatusBadge({ trl }: { trl?: string }) {
  if (!hasTRL(trl)) {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border bg-muted px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        Not assessed
      </span>
    );
  }
  const viability = getViability(trl);
  const colors = getViabilityColor(viability);
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap leading-tight rounded-md border px-2 py-1 ${colors.border} ${colors.text}`}
    >
      <span className="text-[9px] font-bold uppercase tracking-wider">
        {BAND_LABEL[viability as string] ?? viability}
      </span>
      <span className="text-[8px] opacity-80">{trl}</span>
    </span>
  );
}


/** Consecutive clusters by node identity — grouping never matches on label text. */
function clusterRuns(pathways: ShortlistPathway[]): { key: string; members: ShortlistPathway[] }[] {
  const out: { key: string; members: ShortlistPathway[] }[] = [];
  pathways.forEach((p) => {
    const key = `${p.feedstockId}|${p.processId}|${p.productId}`;
    const last = out[out.length - 1];
    if (last && last.key === key) last.members.push(p);
    else out.push({ key, members: [p] });
  });
  return out;
}

/** True when at least one cluster holds two or more pathways. */
export function hasGroupableClusters(pathways: ShortlistPathway[]): boolean {
  return clusterRuns(pathways).some((run) => run.members.length > 1);
}

type Props = {
  pathways: ShortlistPathway[];
  notes: Record<string, PathwayNote[]>;
  onAddNote: (pathwayId: string, text: string) => void;
  /** Removes the pathway from the shortlist (bookmark is always in the filled state here). */
  onRemove: (pathwayId: string) => void;
  currentUser: string;
  /** Grouped is a secondary view the user opts into from the card header. Flat is the default. */
  grouped: boolean;
  /** Drag-to-reorder: row order is the priority order, top row highest. */
  onReorder?: (orderedIds: string[]) => void;
  /** Landscape context used to link each row to its pathway profile. */
  category?: string;
  topic?: string;
};


export function PathwayShortlistRows({
  pathways,
  notes,
  onAddNote,
  onRemove,
  currentUser,
  grouped,
  onReorder,
  category,
  topic,
}: Props) {

  const navigate = useNavigate();
  const pathwayHref = (id: string) =>
    category && topic
      ? `/landscape/${encodeURIComponent(category)}/${encodeURIComponent(topic)}/value-chain/pathways/${id}`
      : null;

  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  /** Cursor-following hint, offset below and to the left so it never covers the node value. */
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  /** Groups the user expanded individually while the grouped view is on. Session-only. */
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  /** Mock example attachments so the layout can be reviewed. */
  const { documents, addDocuments, removeDocument } = useItemDocuments(
    mockSeedByIndex(
      pathways.map((p) => p.id),
      {
        0: [
          { name: "Fermentation-route-techno-economics.pdf", uploader: "K. Brandt", date: "4 Sept 2026" },
          { name: "Supplier-capacity-matrix.xlsx", uploader: "A. Novak", date: "11 Sept 2026" },
        ],
        2: [{ name: "Pilot-trial-summary-Q3.docx", uploader: "M. Feld", date: "2 Sept 2026" }],
      },
    ),
    (itemId) => {
      const p = pathways.find((item) => item.id === itemId);
      return `Pathway · ${p ? `${p.feedstock} → ${p.product}` : itemId}`;
    },
  );


  /**
   * Consecutive clusters by node identity. Every pathway appears exactly once, in
   * order; clusters never span non-matching rows.
   */
  const runs = useMemo(() => clusterRuns(pathways), [pathways]);

  /** Moves the dragged pathway to the drop target's position and reports the new order. */
  const commitDrop = (targetId: string) => {
    const sourceId = dragId;
    setDragId(null);
    setOverId(null);
    if (!sourceId || !onReorder || sourceId === targetId) return;
    const ids = pathways.map((p) => p.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    onReorder(ids);
  };

  const chip = (label: string, cls: string) => <div className={pathwayChipCls(cls)}>{label}</div>;

  const flatRow = (p: ShortlistPathway) => {
    return (
      <div
        key={p.id}
        draggable={!!onReorder}
        onDragStart={(e) => {
          setDragId(p.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={(e) => {
          if (!onReorder || !dragId) return;
          e.preventDefault();
          setOverId(p.id);
        }}
        onDragLeave={() => setOverId((current) => (current === p.id ? null : current))}
        onDrop={(e) => {
          e.preventDefault();
          commitDrop(p.id);
        }}
        onDragEnd={() => {
          setDragId(null);
          setOverId(null);
        }}
        onMouseMove={(e) => {
          if (!pathwayHref(p.id)) return;
          setTip({ x: e.clientX - 150, y: e.clientY + 22 });
        }}
        onMouseLeave={() => setTip(null)}
        onClick={(e) => {
          // Whole row opens the pathway profile; drag handle and row controls opt out.
          const href = pathwayHref(p.id);
          if (!href) return;
          if ((e.target as HTMLElement).closest("[data-row-control]")) return;
          navigate(href);
        }}
        className={`group transition-colors hover:bg-muted/30 ${pathwayHref(p.id) ? "cursor-pointer" : ""} ${
          dragId === p.id ? "opacity-50" : ""
        } ${overId === p.id && dragId && dragId !== p.id ? "bg-muted/50" : ""}`}
      >
        <div className={`h-[56px] pr-4 grid ${COLS} items-center gap-2`}>
          <div className="flex items-center justify-center" data-row-control>
            <span
              title="Drag to change priority — top row is highest"
              className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground cursor-grab active:cursor-grabbing hover:bg-muted hover:text-foreground"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </span>
          </div>
          {chip(p.feedstock, PATHWAY_CHIP_NEUTRAL)}
          {chip(p.process, PATHWAY_CHIP_NEUTRAL)}
          {pathwayHref(p.id) ? (
            <Link
              to={pathwayHref(p.id)!}
              className={`${pathwayChipCls(PATHWAY_CHIP_ANCHOR)} mx-3 hover:ring-1 hover:ring-emerald-300`}
            >
              {p.product}
            </Link>
          ) : (
            <div className={`${pathwayChipCls(PATHWAY_CHIP_ANCHOR)} mx-3`}>{p.product}</div>
          )}
          {chip(p.application, PATHWAY_CHIP_NEUTRAL)}

          <div className="flex items-center">
            <StatusBadge trl={p.trl} />
          </div>
          <div className="flex items-center">
            <EvaluationStatusBadges topic={topic} pathwayId={p.id} />
          </div>
          <div className="flex items-center gap-2" data-row-control>
            <div className="flex w-[55px] items-center">
              <ItemNotesControl
                itemLabel={`Pathway · ${p.feedstock} → ${p.product}`}
                title={`${p.feedstock} → ${p.product}`}
                teamNotes={(notes[p.id] ?? []).slice().reverse()}
                currentUser={currentUser}
                storeLocally={false}
                onPost={(_label, text) => onAddNote(p.id, text)}
              />
            </div>
            <div className="flex w-[55px] items-center">
              <DocumentAttachControl
                itemLabel={`${p.feedstock} → ${p.product}`}
                documents={documents[p.id] ?? []}
                onUpload={(names) => addDocuments(p.id, names, currentUser)}
                onRemove={(documentId) => removeDocument(p.id, documentId)}
              />
            </div>
          </div>
          <div
            className="truncate text-right text-[10px] text-muted-foreground"
            title={p.savedBy ? `Saved by ${p.savedBy}` : undefined}
          >
            {p.savedBy ?? ""}
          </div>
          <div className="flex items-center justify-end" data-row-control>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
              title="Remove from shortlist"
              aria-label={`Remove ${p.feedstock} → ${p.product} from shortlist`}
              onClick={() => onRemove(p.id)}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`h-8 pr-4 grid ${COLS} items-center gap-2 border-b border-border/50`}>
        <span />
        <span className={HEAD_CLS}>Feedstock</span>
        <span className={HEAD_CLS}>Process</span>
        <span className={`${HEAD_CLS} mx-3`}>Product</span>
        <span className={HEAD_CLS}>Application</span>
        <span className={HEAD_CLS}>Maturity</span>
        <span className={HEAD_CLS}>Status</span>
        <span className={HEAD_CLS}>Activity</span>
        <span className={`${HEAD_CLS} text-right`}>Owner</span>
        <span />
      </div>
      <div className="divide-y divide-border/50">
        {runs.map(({ key, members }) => {
          if (members.length < 2 || !grouped || expandedGroups.has(key)) {
            // Flat default: one row per pathway.
            return members.map((p) => flatRow(p));
          }

          // Collapsed cluster: shared three chips, summary chip in the fourth position.
          const head = members[0];
          const aggregateNotes = members.reduce((sum, m) => sum + (notes[m.id] ?? []).length, 0);

          return (
            <div
              key={key}
              className="group cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedGroups((prev) => new Set(prev).add(key))}
            >
              <div className={`h-[56px] pr-4 grid ${COLS} items-center gap-2`}>
                <span />
                {chip(head.feedstock, PATHWAY_CHIP_NEUTRAL)}
                {chip(head.process, PATHWAY_CHIP_NEUTRAL)}
                <div className={`${pathwayChipCls(PATHWAY_CHIP_ANCHOR)} mx-3`}>{head.product}</div>
                <div className="text-[10px] font-medium text-muted-foreground truncate border border-dashed border-border rounded-md px-2 py-2 text-center">
                  {members.length} applications
                </div>
                <span />
                <span />
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {aggregateNotes > 0 && (
                    <span
                      className="text-[9px] tabular-nums"
                      title={`${aggregateNotes} notes across ${members.length} pathways — expand to open them`}
                    >
                      {aggregateNotes} in group
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </div>
                <span />
                <span />
              </div>
            </div>
          );
        })}
      </div>

      {tip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-border bg-popover px-2 py-1 text-[10px] text-muted-foreground shadow-sm"
          style={{ left: tip.x, top: tip.y }}
        >
          Open pathway profile
        </div>
      )}
    </>
  );
}

