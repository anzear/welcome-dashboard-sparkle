import { Archive, Check, Clock, Copy, EyeOff, Lock, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PathwayStatus, ReviewStatus } from "@/lib/hitlStore";

const reviewConfig: Record<ReviewStatus, { label: string; icon: typeof Check; className: string }> = {
  accepted: { label: "Accepted", icon: Check, className: "border-primary/25 bg-primary/10 text-primary" },
  rejected: { label: "Rejected", icon: X, className: "border-destructive/25 bg-destructive/10 text-destructive" },
  review_pending: { label: "Review pending", icon: Clock, className: "border-border bg-muted text-muted-foreground" },
};

export function ReviewStatusChip({ status }: { status: ReviewStatus }) {
  const config = reviewConfig[status];
  const Icon = config.icon;
  return <Badge variant="outline" className={cn("h-5 gap-1 px-1.5 text-[10px] font-medium", config.className)}><Icon className="h-3 w-3" />{config.label}</Badge>;
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
  return <Badge variant="outline" className={cn("h-5 gap-1 px-1.5 text-[10px] font-medium", config.className)}>{Icon && <Icon className="h-3 w-3" />}{config.label}</Badge>;
}

export function ValueCell({ value, unit }: { value: string | number | null | undefined; unit?: string | null }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground" title="null (no value)">—</span>;
  return <span>{value}{unit ? ` ${unit}` : ""}</span>;
}

export function TraceId({ value }: { value: string | null | undefined }) {
  if (value === null || value === undefined) return <ValueCell value={null} />;
  const short = `${value.slice(0, 8)}…`;
  return (
    <span className="group/trace inline-flex min-w-0 items-center gap-1 font-mono text-[10px]">
      <Tooltip><TooltipTrigger asChild><span className="max-w-28 truncate">{short}</span></TooltipTrigger><TooltipContent className="font-mono text-xs">{value}</TooltipContent></Tooltip>
      <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/trace:opacity-100 focus:opacity-100" onClick={() => void navigator.clipboard.writeText(value)} aria-label="Copy trace ID"><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Copy trace ID</TooltipContent></Tooltip>
    </span>
  );
}

export function ActorStamp({ name, timestamp }: { name: string; timestamp: string }) {
  const relative = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  return <Tooltip><TooltipTrigger asChild><span className="text-[11px] text-muted-foreground">{name} · {relative}</span></TooltipTrigger><TooltipContent className="font-mono text-xs">{timestamp}</TooltipContent></Tooltip>;
}
