import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { groupById, pathwaysInGroup, useHitlStore, type Group } from "@/lib/hitlStore";
import { cn } from "@/lib/utils";

const dots: Record<Group["color_token"], string> = {
  "group-violet": "bg-group-violet-fill",
  "group-fuchsia": "bg-group-fuchsia-fill",
  "group-rose": "bg-group-rose-fill",
  "group-indigo": "bg-group-indigo-fill",
  "group-bronze": "bg-group-bronze-fill",
};

export function GroupChip({ groupId, group, onClick }: { groupId?: string | null; group?: Group | null; onClick?: () => void }) {
  const store = useHitlStore();
  const value = group ?? groupById(store.groups, groupId ?? null);
  if (!value) return <span className="text-muted-foreground">—</span>;
  const visibility = value.visibility_scope === "all" ? "All users" : `${value.visibility_scope.length} organisations: ${value.visibility_scope.join(", ")}`;
  const content = <span className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-md border bg-background px-2 text-xs", value.is_archived && "text-muted-foreground")}>
    <span className={cn("h-2 w-2 shrink-0 rounded-full", dots[value.color_token])} />
    {value.is_system && <Lock className="h-3 w-3 shrink-0" />}{value.name}{value.is_archived && " (archived)"}
  </span>;
  return <Tooltip><TooltipTrigger asChild>{onClick ? <button type="button" onClick={onClick}>{content}</button> : content}</TooltipTrigger><TooltipContent>{visibility} · {pathwaysInGroup(store.pathways, value.id).length} pathways</TooltipContent></Tooltip>;
}