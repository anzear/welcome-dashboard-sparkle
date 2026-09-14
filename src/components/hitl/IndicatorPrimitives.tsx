import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PathwayRef } from "./PathwayRef";
import {
  SCOPE_DESCRIPTIONS, SCOPE_LABELS, SCOPE_TARGET_KEYS, TARGET_POSITION_LABELS, affectedPathwayIds, indicatorTargetKeys,
  targetValues, useHitlStore, type IndicatorScope, type IndicatorTarget, type IndicatorValue,
} from "@/lib/hitlStore";
import { cn } from "@/lib/utils";

export type TargetedValue = Pick<IndicatorValue, "scope" | "target">;

export function ScopeChip({ scope }: { scope: IndicatorScope }) {
  return <Tooltip><TooltipTrigger asChild>
    <span className="inline-flex">
      <Badge variant="outline" className="h-5 cursor-help gap-1.5 whitespace-nowrap border-border bg-muted/40 px-1.5 text-[9px] font-medium text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70" />{SCOPE_LABELS[scope]}
      </Badge>
    </span>
  </TooltipTrigger><TooltipContent className="text-xs">{SCOPE_DESCRIPTIONS[scope]}</TooltipContent></Tooltip>;
}

function TargetGrid({ iv }: { iv: TargetedValue }) {
  const keys = SCOPE_TARGET_KEYS[iv.scope];
  return <div className="rounded-md border bg-background p-3 text-left">
    <div className="mb-3 flex items-center gap-2"><ScopeChip scope={iv.scope} /><span className="text-[9px] text-muted-foreground">{SCOPE_DESCRIPTIONS[iv.scope]}</span></div>
    <div className="grid gap-2 sm:grid-cols-4">
      {indicatorTargetKeys.map(key => {
        const filled = keys.includes(key) && Boolean(iv.target[key]?.trim());
        return <div key={key} className={cn("min-w-0 pl-2", filled && "border-l-2 border-l-foreground")}>
          <div className="text-[9px] text-muted-foreground">{TARGET_POSITION_LABELS[key]}</div>
          <div className={cn("mt-0.5 break-words text-[10px] leading-snug", filled ? "font-bold" : "text-muted-foreground")}>{filled ? iv.target[key] : "any"}</div>
        </div>;
      })}
    </div>
  </div>;
}

export function TargetRef({ iv }: { iv: TargetedValue }) {
  const store = useHitlStore();
  const values = targetValues(iv);
  const applicationPathway = iv.scope === "application" ? store.pathways.find(pathway => affectedPathwayIds(iv, store.pathways).includes(pathway.id)) : undefined;
  const body = iv.scope === "application" && applicationPathway
    ? <PathwayRef pathwayId={applicationPathway.id} variant="inline" showId={false} showStatus={false} />
    : iv.scope === "production" || iv.scope === "application"
      ? <span className="block min-w-0">
          <span className="block truncate text-[10px] font-bold">{values.join(" → ") || "—"}</span>
          {iv.scope === "production" && <span className="block text-[9px] text-muted-foreground">{SCOPE_DESCRIPTIONS.production}</span>}
        </span>
      : <span className="block min-w-0 truncate text-[10px]"><span className="text-muted-foreground">{SCOPE_LABELS[iv.scope]} · </span><span className="font-bold">{values[0] ?? "—"}</span></span>;
  return <Popover>
    <PopoverTrigger asChild><span className="inline-flex min-w-0 max-w-full cursor-help items-center">{body}</span></PopoverTrigger>
    <PopoverContent className="w-[min(92vw,720px)] p-0"><TargetGrid iv={iv} /></PopoverContent>
  </Popover>;
}

export function AffectedPathways({ iv }: { iv: TargetedValue }) {
  const store = useHitlStore();
  const ids = affectedPathwayIds(iv, store.pathways);
  const emphasis = targetValues(iv);
  return <Popover>
    <PopoverTrigger asChild>
      <Button type="button" variant="link" className={cn("h-auto whitespace-nowrap p-0 text-[10px]", ids.length === 0 && "text-muted-foreground no-underline")}>{ids.length} pathway{ids.length === 1 ? "" : "s"}</Button>
    </PopoverTrigger>
    <PopoverContent className="w-[min(94vw,720px)] space-y-2 p-3">
      <p className="text-[10px] text-muted-foreground">Pathways containing the target nodes</p>
      {ids.length === 0 ? <p className="text-[10px] text-muted-foreground">No pathway contains the target nodes.</p>
        : <div className="max-h-64 space-y-1.5 overflow-y-auto">{ids.map(id => <div key={id} className="min-w-0"><PathwayRef pathwayId={id} variant="inline" emphasisValues={emphasis} /></div>)}</div>}
    </PopoverContent>
  </Popover>;
}

export function targetSearchText(target: IndicatorTarget): string {
  return indicatorTargetKeys.map(key => target[key] ?? "").join(" ");
}
