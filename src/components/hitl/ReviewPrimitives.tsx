import { Archive, Check, Clock, Copy, EyeOff, Link, Lock, Pencil, Plus, Undo2, Unlink, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AuditOperation, PathwayStatus, ReviewStatus } from "@/lib/hitlStore";
import { useTraceSheet } from "./TraceSheetContext";

const reviewConfig: Record<ReviewStatus, { label: string; icon: typeof Check; className: string }> = {
  accepted: { label: "Accepted", icon: Check, className: "border-primary/25 bg-primary/10 text-primary" },
  rejected: { label: "Rejected", icon: X, className: "border-destructive/25 bg-destructive/10 text-destructive" },
  review_pending: { label: "Review pending", icon: Clock, className: "border-border bg-muted text-muted-foreground" },
};

export function ReviewStatusChip({ status }: { status: ReviewStatus }) {
  const config = reviewConfig[status];
  const Icon = config.icon;
  return <Badge variant="outline" className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs font-medium", config.className)}><Icon className="h-3 w-3 shrink-0" />{config.label}</Badge>;
}

const pathwayConfig: Record<PathwayStatus, { label: string; icon?: typeof Clock; className: string }> = {
  approved: { label: "Approved", icon: Check, className: "border-primary/25 bg-primary/10 text-primary" },
  needs_approval: { label: "Needs approval", icon: Clock, className: "border-border bg-muted text-muted-foreground" },
  locked: { label: "Locked", icon: Lock, className: "border-border bg-secondary text-secondary-foreground" },
  hidden: { label: "Hidden", icon: EyeOff, className: "border-border bg-secondary text-secondary-foreground" },
  deleted: { label: "Deleted", icon: Archive, className: "border-destructive/25 bg-destructive/10 text-destructive" },
};

export function PathwayStatusChip({ status }: { status: PathwayStatus }) {
  const config = pathwayConfig[status];
  const Icon = config.icon;
  return <Badge variant="outline" className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs font-medium", config.className)}>{Icon && <Icon className="h-3 w-3 shrink-0" />}{config.label}</Badge>;
}

export function ValueCell({ value, unit }: { value: string | number | null | undefined; unit?: string | null }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground" title="null (no value)">—</span>;
  return <span>{value}{unit ? ` ${unit}` : ""}</span>;
}

const operationConfig: Record<AuditOperation, { label: string; icon: typeof Plus; className: string }> = {
  create: { label: "Create", icon: Plus, className: "border-border text-muted-foreground" },
  update: { label: "Update", icon: Pencil, className: "border-border text-muted-foreground" },
  deactivate: { label: "Deactivate", icon: Archive, className: "border-border text-muted-foreground" },
  link_add: { label: "Link add", icon: Link, className: "border-border text-muted-foreground" },
  link_remove: { label: "Link remove", icon: Unlink, className: "border-border text-muted-foreground" },
  accept: { label: "Accept", icon: Check, className: "border-primary/30 bg-primary/5 text-primary" },
  reject: { label: "Reject", icon: X, className: "border-destructive/30 bg-destructive/5 text-destructive" },
  revert: { label: "Revert", icon: Undo2, className: "border-warning/40 bg-warning/10 text-warning-foreground" },
};

export function OperationChip({ operation }: { operation: AuditOperation }) {
  const config = operationConfig[operation];
  const Icon = config.icon;
  return <Badge variant="outline" className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs font-medium", config.className)}><Icon className="h-3 w-3 shrink-0" />{config.label}</Badge>;
}

const jsonPreview = (value: object) => JSON.stringify(value);
function DiffValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || typeof value === "string" || typeof value === "number") return <ValueCell value={value as string | number | null | undefined} />;
  if (typeof value === "boolean") return <span>{String(value)}</span>;
  if (Array.isArray(value) && value.every(item => typeof item === "string")) return <span className="max-w-80 break-words text-[10px]">{value.length ? value.join(", ") : "—"}</span>;
  const full = jsonPreview(value as object);
  const preview = full.length > 80 ? `${full.slice(0, 77)}…` : full;
  return <Tooltip><TooltipTrigger asChild><code className="inline-block max-w-44 truncate font-mono text-[10px]">{preview}</code></TooltipTrigger><TooltipContent className="max-w-sm break-all font-mono text-[10px]">{full}</TooltipContent></Tooltip>;
}

export function ValueDiff({ prior_value, new_value }: { prior_value: unknown; new_value: unknown }) {
  return <span className="inline-flex max-w-full items-center gap-1.5 text-[10px]"><DiffValue value={prior_value} /><span className="text-muted-foreground">→</span><DiffValue value={new_value} /></span>;
}

export function TraceId({ value }: { value: string | null | undefined }) {
  const { openTrace } = useTraceSheet();
  if (value === null || value === undefined) return <Tooltip><TooltipTrigger asChild><span className="whitespace-nowrap text-[10px] text-muted-foreground">no trace · human-created</span></TooltipTrigger><TooltipContent>This record was created or edited manually and has no originating LLM call.</TooltipContent></Tooltip>;
  const short = `${value.slice(0, 8)}…`;
  return (
    <span className="group/trace inline-flex min-w-0 items-center gap-1 font-mono text-[10px]">
       <Tooltip><TooltipTrigger asChild><Button type="button" variant="link" className="h-auto max-w-28 truncate p-0 font-mono text-[10px]" onClick={() => openTrace(value)}>{short}</Button></TooltipTrigger><TooltipContent className="font-mono text-xs">Open trace · {value}</TooltipContent></Tooltip>
      <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/trace:opacity-100 focus:opacity-100" onClick={() => void navigator.clipboard.writeText(value)} aria-label="Copy trace ID"><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Copy trace ID</TooltipContent></Tooltip>
    </span>
  );
}

export function ActorStamp({ name, timestamp }: { name: string; timestamp: string }) {
  const relative = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  return <Tooltip><TooltipTrigger asChild><span className="text-[11px] text-muted-foreground">{name} · {relative}</span></TooltipTrigger><TooltipContent className="font-mono text-xs">{timestamp}</TooltipContent></Tooltip>;
}
