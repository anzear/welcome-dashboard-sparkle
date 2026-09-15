import { Calculator, Check, Clock, Eye, EyeOff, Link, Lock, Pencil, Plus, Undo2, Unlink, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { sourceDisplay, type AuditOperation, type IndicatorSource, type ReviewStatus, type VisibilityState } from "@/lib/hitlStore";

const reviewConfig: Record<ReviewStatus, { label: string; icon: typeof Check; className: string }> = {
  review_pending: { label: "Review pending", icon: Clock, className: "border-border bg-muted text-muted-foreground" },
  approved: { label: "Approved", icon: Check, className: "border-primary/25 bg-primary/10 text-primary" },
  rejected: { label: "Rejected", icon: X, className: "border-destructive/25 bg-destructive/10 text-destructive" },
};

export function ReviewStatusChip({ status }: { status: ReviewStatus }) {
  const config = reviewConfig[status];
  const Icon = config.icon;
  return <Badge variant="outline" className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs font-medium", config.className)}><Icon className="h-3 w-3 shrink-0" />{config.label}</Badge>;
}

const visibilityConfig: Record<VisibilityState, { label: string; icon: typeof Check; className: string }> = {
  visible: { label: "Visible", icon: Eye, className: "border-primary/25 bg-primary/10 text-primary" },
  locked: { label: "Locked", icon: Lock, className: "border-border bg-secondary text-secondary-foreground" },
  hidden: { label: "Hidden", icon: EyeOff, className: "border-border bg-secondary text-secondary-foreground" },
};

export function VisibilityChip({ state }: { state: VisibilityState }) {
  const config = visibilityConfig[state];
  const Icon = config.icon;
  return <Badge variant="outline" className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs font-medium", config.className)}><Icon className="h-3 w-3 shrink-0" />{config.label}</Badge>;
}

export function ComputedChip() {
  return <Badge variant="outline" className="inline-flex h-6 items-center gap-1 whitespace-nowrap border-border px-2 text-xs font-medium text-muted-foreground"><Calculator className="h-3 w-3 shrink-0" />Computed</Badge>;
}

export function ValueCell({ value, unit }: { value: string | number | null | undefined; unit?: string | null }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground" title="null (no value)">—</span>;
  return <span>{value}{unit ? ` ${unit}` : ""}</span>;
}

const operationConfig: Record<AuditOperation, { label: string; icon: typeof Plus; className: string }> = {
  create: { label: "Create", icon: Plus, className: "border-border text-muted-foreground" },
  update: { label: "Update", icon: Pencil, className: "border-border text-muted-foreground" },
  link_add: { label: "Link add", icon: Link, className: "border-border text-muted-foreground" },
  link_remove: { label: "Link remove", icon: Unlink, className: "border-border text-muted-foreground" },
  approve: { label: "Approve", icon: Check, className: "border-primary/30 bg-primary/5 text-primary" },
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
  if (Array.isArray(value) && value.every(item => item && typeof item === "object" && "url" in (item as object))) {
    const sources = value as IndicatorSource[];
    return <Tooltip><TooltipTrigger asChild><span className="text-[10px] underline decoration-dotted">{sources.length} {sources.length === 1 ? "source" : "sources"}</span></TooltipTrigger><TooltipContent className="max-w-sm space-y-1 break-all text-[10px]">{sources.length ? sources.map(source => <p key={source.url}>{sourceDisplay(source)} — {source.url}</p>) : <p>No sources</p>}</TooltipContent></Tooltip>;
  }
  const full = jsonPreview(value as object);
  const preview = full.length > 80 ? `${full.slice(0, 77)}…` : full;
  return <Tooltip><TooltipTrigger asChild><code className="inline-block max-w-44 truncate font-mono text-[10px]">{preview}</code></TooltipTrigger><TooltipContent className="max-w-sm break-all font-mono text-[10px]">{full}</TooltipContent></Tooltip>;
}

export function ValueDiff({ prior_value, new_value }: { prior_value: unknown; new_value: unknown }) {
  return <span className="inline-flex max-w-full items-center gap-1.5 text-[10px]"><DiffValue value={prior_value} /><span className="text-muted-foreground">→</span><DiffValue value={new_value} /></span>;
}

export function ActorStamp({ name, timestamp }: { name: string; timestamp: string }) {
  const relative = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  return <Tooltip><TooltipTrigger asChild><span className="text-[11px] text-muted-foreground">{name} · {relative}</span></TooltipTrigger><TooltipContent className="font-mono text-xs">{timestamp}</TooltipContent></Tooltip>;
}
