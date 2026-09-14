import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PathwayStatusChip } from "./ReviewPrimitives";
import { useHitlStore, type Pathway } from "@/lib/hitlStore";
import { cn } from "@/lib/utils";

export type PathwayNodeKey = "feedstock" | "process_technology" | "product" | "application_market";

const nodeLabels: Record<PathwayNodeKey, string> = {
  feedstock: "Feedstock",
  process_technology: "Process/Technology",
  product: "Product",
  application_market: "Application/Market",
};
const nodeKeys = Object.keys(nodeLabels) as PathwayNodeKey[];

export function pathwaySearchText(pathway: Pathway | undefined): string {
  return pathway ? [pathway.id, ...nodeKeys.map(key => pathway[key])].join(" ").toLocaleLowerCase() : "";
}

export function PathwayRef({ pathwayId, variant, emphasisNode, emphasisNodes, showId = true, showStatus = true, pathway: suppliedPathway }: {
  pathwayId: string;
  variant: "inline" | "card";
  emphasisNode?: PathwayNodeKey;
  emphasisNodes?: PathwayNodeKey[];
  showId?: boolean;
  showStatus?: boolean;
  pathway?: Pathway;
}) {
  const store = useHitlStore();
  const pathway = suppliedPathway ?? store.pathways.find(item => item.id === pathwayId);
  const [open, setOpen] = useState(false);
  const emphasised = new Set(emphasisNodes ?? (emphasisNode ? [emphasisNode] : []));

  if (!pathway) return <span className="inline-flex min-w-0 items-center gap-2"><code className="shrink-0 font-mono text-[10px]">{pathwayId}</code><span className="truncate text-[10px] text-muted-foreground">pathway not found</span></span>;

  if (variant === "card") return <div className="rounded-md border bg-background p-3 text-left">
    <div className="mb-3 flex items-center justify-between gap-2">
      {showId ? <code className="font-mono text-[10px] font-medium">{pathway.id}{pathway.status === "deleted" && <span className="ml-1 font-sans text-muted-foreground">(deleted)</span>}</code> : <span />}
      {showStatus && <PathwayStatusChip status={pathway.status} />}
    </div>
    <div className="grid gap-2 sm:grid-cols-4">
      {nodeKeys.map(key => <div key={key} className={cn("min-w-0 pl-2", emphasised.has(key) && "border-l-2 border-l-foreground")}>
        <div className="text-[9px] text-muted-foreground">{nodeLabels[key]}</div>
        <div className={cn("mt-0.5 break-words text-[10px] leading-snug", emphasised.has(key) && "font-bold")}>{pathway[key]}</div>
      </div>)}
    </div>
  </div>;

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <span className="inline-flex min-w-0 max-w-full cursor-help items-center gap-1.5" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        {showId && <code className="shrink-0 font-mono text-[10px]">{pathway.id}{pathway.status === "deleted" && <span className="ml-1 font-sans text-muted-foreground">(deleted)</span>}</code>}
        <span className="min-w-0 truncate text-[10px]">
          {nodeKeys.map((key, index) => <span key={key}>{index > 0 && <span className="text-muted-foreground"> → </span>}<span className={cn(emphasised.has(key) && "font-bold")}>{pathway[key]}</span></span>)}
        </span>
      </span>
    </PopoverTrigger>
    <PopoverContent className="w-[min(92vw,720px)] p-0" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}><PathwayRef pathwayId={pathway.id} pathway={pathway} variant="card" emphasisNodes={[...emphasised]} /></PopoverContent>
  </Popover>;
}
