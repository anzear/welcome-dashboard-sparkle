import { useState } from "react";
import { ChevronDown, ChevronRight, RefreshCw, Eye } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ActorStamp, ValueCell } from "./ReviewPrimitives";
import { lastReconfirmation, reconfirmCount, seenAgainOf, type PaperPatentMatch } from "@/lib/hitlStore";

type ProvenanceRow = PaperPatentMatch;

/** The run that introduced the record, with its run_id. Separate from Re-confirmed. */
export function FirstSeenCell({ record }: { record: ProvenanceRow }) {
  if (!record.first_seen_run_id) return <ValueCell value={null} />;
  return <span className="flex flex-col gap-0.5">
    <ActorStamp name={record.last_actor ?? "System"} timestamp={record.created_at} />
    <code className="font-mono text-[9px] text-muted-foreground">{record.first_seen_run_id}</code>
  </span>;
}

/** Timestamp of the most recent re-confirmation, em dash when never re-confirmed. */
export function ReconfirmedCell({ record }: { record: ProvenanceRow }) {
  const last = lastReconfirmation(record);
  if (!last) return <ValueCell value={null} />;
  return <Tooltip><TooltipTrigger asChild><span className="flex flex-col gap-0.5">
    <span className="font-mono text-[10px]">{format(new Date(last.timestamp), "dd MMM yyyy, HH:mm")}</span>
    <code className="font-mono text-[9px] text-muted-foreground">{last.run_id}</code>
  </span></TooltipTrigger><TooltipContent className="font-mono text-xs">Re-confirmed {reconfirmCount(record)}× · latest {last.timestamp}</TooltipContent></Tooltip>;
}

export function ReconfirmedMarker({ record }: { record: ProvenanceRow }) {
  const count = reconfirmCount(record);
  if (count === 0) return null;
  return <Badge variant="outline" className="ml-1 inline-flex h-6 items-center gap-1 whitespace-nowrap border-border px-2 text-[10px] font-medium text-muted-foreground"><RefreshCw className="h-3 w-3 shrink-0" />Re-confirmed ×{count}</Badge>;
}

/** Rejected records a re-run found again. Collapsed, so reconsideration is deliberate. */
export function PreviouslyRejectedPanel({ records, onOpen, onHistory }: { records: ProvenanceRow[]; onOpen: (id: string) => void; onHistory: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const found = records.filter(record => record.status === "rejected" && seenAgainOf(record).count > 0);
  if (found.length === 0) return null;
  const Chevron = open ? ChevronDown : ChevronRight;
  const title = (record: ProvenanceRow) => record.title;
  return <div className="mb-3 rounded-md border">
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex w-full items-center gap-2 px-3 py-2 text-left">
      <Chevron className="h-3.5 w-3.5 text-muted-foreground" />
      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Previously rejected, found again ({found.length})</span>
    </button>
    {open && <div className="space-y-1 border-t px-3 py-2">
      <p className="text-xs text-muted-foreground">Still rejected. A re-run never reinstates a rejected record — reconsider each one deliberately.</p>
      {found.map(record => <div key={record.id} className="flex flex-wrap items-center gap-2 py-1">
        <Button variant="link" className="h-auto p-0 text-xs" onClick={() => onOpen(record.id)}>{title(record)}</Button>
        <Badge variant="outline" className="h-5 whitespace-nowrap px-2 text-[9px] font-normal text-muted-foreground">Seen again ×{seenAgainOf(record).count}</Badge>
        <code className="font-mono text-[9px] text-muted-foreground">{seenAgainOf(record).run_ids.slice(-1)[0]}</code>
        <Button variant="link" className="h-auto p-0 text-[10px]" onClick={() => onHistory(record.id)}>History</Button>
      </div>)}
    </div>}
  </div>;
}
