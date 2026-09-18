import { useMemo, useState } from "react";
import { ChevronDown, GripVertical, MessageSquare, MessageSquarePlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  BAND_LABEL,
  PATHWAY_CHIP_ANCHOR,
  PATHWAY_CHIP_NEUTRAL,
  getViability,
  getViabilityColor,
  hasTRL,
  pathwayChipCls,
} from "./pathwayRowStyles";

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
};

export type PathwayNote = { id: string; author: string; timestamp: string; text: string };

export type ValidationStatus = "TBD" | "Go" | "Uncertain" | "No-Go";

const VALIDATION_STATUS_CLS: Record<ValidationStatus, string> = {
  Go: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Uncertain: "bg-amber-100 text-amber-700 border-amber-300",
  "No-Go": "bg-red-100 text-red-700 border-red-300",
  TBD: "bg-muted/60 text-muted-foreground border-border",
};

/** Mirrors the 4-level status set in the pathway's Validation Space. */
function ValidationStatusBadge({ status }: { status: ValidationStatus }) {
  return (
    <span
      title="Pathway status set in the Validation Space"
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${VALIDATION_STATUS_CLS[status]}`}
    >
      {status}
    </span>
  );
}

const COLS =
  "grid-cols-[24px_32px_minmax(0,1.4fr)_minmax(0,1.5fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_96px_120px]";

/** Mirrors the Pathway Explorer badge: band colour, bold label, TRL beneath. */
function StatusBadge({ trl }: { trl?: string }) {
  if (!hasTRL(trl)) {
    return (
      <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        Not assessed
      </span>
    );
  }
  const viability = getViability(trl);
  const colors = getViabilityColor(viability);
  return (
    <span className={`inline-flex flex-col items-center leading-tight rounded-md border px-2 py-1 ${colors.border} ${colors.text}`}>
      <span className="text-[9px] font-bold uppercase tracking-wider">
        {BAND_LABEL[viability as string] ?? viability}
      </span>
      <span className="text-[8px] opacity-80">{trl}</span>
    </span>
  );
}

function NotesButton({ count, onClick }: { count: number; onClick: () => void }) {
  const has = count > 0;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={has ? `${count} note${count === 1 ? "" : "s"}` : "Add a note"}
      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
    >
      {has ? <MessageSquare className="w-3.5 h-3.5 fill-current" /> : <MessageSquarePlus className="w-3.5 h-3.5" />}
      {has && <span className="text-[10px] tabular-nums font-medium">{count}</span>}
    </button>
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
  /** Validation Space status per pathway id; absent id renders as TBD. */
  statuses?: Record<string, ValidationStatus>;
  /** Drag-to-reorder: row order is the priority order, top row highest. */
  onReorder?: (orderedIds: string[]) => void;
};

export function PathwayShortlistRows({ pathways, notes, onAddNote, onRemove, currentUser, grouped, statuses, onReorder }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  /** Groups the user expanded individually while the grouped view is on. Session-only. */
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [notesFor, setNotesFor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  /**
   * Consecutive clusters by node identity. Every pathway appears exactly once, in
   * order; clusters never span non-matching rows.
   */
  const runs = useMemo(() => clusterRuns(pathways), [pathways]);

  const toggle = (ids: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });

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

  const sheetPathway = pathways.find((p) => p.id === notesFor) ?? null;
  const sheetNotes = notesFor ? [...(notes[notesFor] ?? [])].reverse() : [];

  const chip = (label: string, cls: string) => <div className={pathwayChipCls(cls)}>{label}</div>;

  const flatRow = (p: ShortlistPathway) => {
    const count = (notes[p.id] ?? []).length;
    return (
      <div key={p.id} className="group hover:bg-muted/30 transition-colors">
        <div className={`px-4 py-4 grid ${COLS} items-center gap-2`}>
          <div className="flex items-center justify-center">
            <Checkbox
              className="h-3 w-3"
              aria-label="Select pathway"
              checked={selected.has(p.id)}
              onCheckedChange={(v) => toggle([p.id], v === true)}
            />
          </div>
          <div className="flex justify-center">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-semibold tabular-nums bg-muted text-muted-foreground">
              {rowIndex.get(p.id)}
            </span>
          </div>
          {chip(p.feedstock, PATHWAY_CHIP_NEUTRAL)}
          {chip(p.process, PATHWAY_CHIP_NEUTRAL)}
          {chip(p.product, PATHWAY_CHIP_ANCHOR)}
          {chip(p.application, PATHWAY_CHIP_NEUTRAL)}
          <div className="flex items-center justify-center">
            <StatusBadge trl={p.trl} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <ValidationStatusBadge status={statuses?.[p.id] ?? "TBD"} />
            <NotesButton count={count} onClick={() => setNotesFor(p.id)} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="divide-y divide-border/50">
        {runs.map(({ key, members }) => {
          if (members.length < 2 || !grouped || expandedGroups.has(key)) {
            // Flat default: one row per pathway.
            return members.map((p) => flatRow(p));
          }

          // Collapsed cluster: shared three chips, summary chip in the fourth position.
          const head = members[0];
          const ids = members.map((m) => m.id);
          const allSelected = ids.every((id) => selected.has(id));
          const someSelected = !allSelected && ids.some((id) => selected.has(id));
          const aggregateNotes = members.reduce((sum, m) => sum + (notes[m.id] ?? []).length, 0);

          return (
            <div
              key={key}
              className="group cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedGroups((prev) => new Set(prev).add(key))}
            >
              <div className={`px-4 py-4 grid ${COLS} items-center gap-2`}>
                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    className="h-3 w-3"
                    aria-label="Select all pathways in this group"
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={(v) => toggle(ids, v === true)}
                  />
                </div>
                <span />
                {chip(head.feedstock, PATHWAY_CHIP_NEUTRAL)}
                {chip(head.process, PATHWAY_CHIP_NEUTRAL)}
                {chip(head.product, PATHWAY_CHIP_ANCHOR)}
                <div className="text-[10px] font-medium text-muted-foreground truncate border border-dashed border-border rounded-md px-2 py-2 text-center">
                  {members.length} applications
                </div>
                <span />
                <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
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
              </div>
            </div>
          );
        })}
      </div>

      <Sheet
        open={!!notesFor}
        onOpenChange={(o) => {
          if (!o) {
            setNotesFor(null);
            setDraft("");
          }
        }}
      >
        <SheetContent className="w-[440px] sm:max-w-[440px]">
          <SheetHeader>
            <SheetTitle className="text-[10px] font-bold uppercase tracking-widest">Pathway notes</SheetTitle>
          </SheetHeader>
          {sheetPathway && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {chip(sheetPathway.feedstock, PATHWAY_CHIP_NEUTRAL)}
                {chip(sheetPathway.process, PATHWAY_CHIP_NEUTRAL)}
                {chip(sheetPathway.product, PATHWAY_CHIP_ANCHOR)}
                {chip(sheetPathway.application, PATHWAY_CHIP_NEUTRAL)}
              </div>

              <div className="space-y-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Add a note on this pathway…"
                  className="text-xs min-h-[72px]"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={!draft.trim()}
                    onClick={() => {
                      onAddNote(sheetPathway.id, draft.trim());
                      setDraft("");
                    }}
                  >
                    Add note
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {sheetNotes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No notes on this pathway yet.</p>
                ) : (
                  sheetNotes.map((n) => (
                    <div key={n.id} className="rounded-md border border-border/60 bg-muted/40 px-3 py-2">
                      <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-muted-foreground">
                        <span>{n.author}</span>
                        <span>{n.timestamp}</span>
                      </div>
                      <p className="mt-1 text-xs text-foreground/85 leading-relaxed">{n.text}</p>
                    </div>
                  ))
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Signed in as {currentUser}.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
