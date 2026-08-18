import React, { useState } from "react";
import { Check, ChevronDown, Layers, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRegister } from "@/components/materialRegister/registerStore";
import { SCOPE_UNTAGGED } from "@/components/materialRegister/productLines";

/**
 * Product line scope. It narrows every list and every count below it, and states
 * itself at all times — a scoped view that looks unscoped produces wrong
 * conclusions about coverage.
 */
const ScopeSelector: React.FC = () => {
  const { scope, setScope, scopeCounts, scopeLabel, scopedTotal, totalCount } = useRegister();
  const [open, setOpen] = useState(false);

  const choose = (next: string | null) => {
    setScope(next);
    setOpen(false);
  };

  const Row: React.FC<{ label: string; count: number; value: string | null }> = ({
    label,
    count,
    value,
  }) => {
    const active = scope === value;
    return (
      <button
        type="button"
        onClick={() => choose(value)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] hover:bg-muted/60",
          active && "bg-muted",
        )}
      >
        <Check className={cn("h-3 w-3", active ? "text-primary" : "text-transparent")} />
        <span className="flex-1 text-foreground">{label}</span>
        <span className="font-mono tabular-nums text-muted-foreground">{count}</span>
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors",
              scope
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <Layers className="h-3 w-3 opacity-70" />
            {scope ? (
              <>
                {scopeLabel}
                <span className="text-muted-foreground">
                  · <span className="font-mono tabular-nums">{scopedTotal}</span> materials
                </span>
              </>
            ) : (
              <>
                All materials ·{" "}
                <span className="font-mono tabular-nums text-foreground">{totalCount}</span>
              </>
            )}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-60 p-1.5">
          <div className="px-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Product line
          </div>
          <Row label="All materials" count={totalCount} value={null} />
          <div className="my-1 h-px bg-border" />
          {scopeCounts.lines.map((l) => (
            <Row key={l.value} label={l.label} count={l.count} value={l.value} />
          ))}
          {scopeCounts.untagged > 0 && (
            <>
              <div className="my-1 h-px bg-border" />
              <Row label="Untagged" count={scopeCounts.untagged} value={SCOPE_UNTAGGED} />
            </>
          )}
          <p className="px-2 pb-1 pt-2 text-[10px] leading-tight text-muted-foreground">
            Scope narrows every list and count below it. A material brief always shows the whole
            material, including its other product lines.
          </p>
        </PopoverContent>
      </Popover>

      {scope && (
        <button
          type="button"
          onClick={() => choose(null)}
          className="inline-flex h-7 items-center gap-1 rounded-lg px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          clear
        </button>
      )}
    </div>
  );
};

export default ScopeSelector;
