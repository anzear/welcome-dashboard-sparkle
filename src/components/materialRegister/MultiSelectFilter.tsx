import React from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";

export interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** A filter that cannot apply in the current scope is offered but not usable. */
  disabled?: boolean;
}

export const MultiSelectFilter: React.FC<Props> = ({ label, options, selected, onChange, disabled = false }) => {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[11px] font-medium transition-colors",
            disabled && "cursor-not-allowed opacity-50",
            selected.length > 0
              ? "border-primary/40 bg-primary/5 text-foreground"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
          {selected.length > 0 && (
            <span className="tabular-nums text-primary">{selected.length}</span>
          )}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="portfolio-type max-h-72 w-56 overflow-auto p-1">
        {options.length === 0 && (
          <div className="px-2 py-1.5 text-[11px] text-muted-foreground">No values</div>
        )}
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-[11px] hover:bg-muted"
          >
            <Checkbox
              checked={selected.includes(o.value)}
              onCheckedChange={() => toggle(o.value)}
              className="h-3.5 w-3.5"
            />
            <span className="truncate">{o.label}</span>
          </label>
        ))}
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="mt-1 w-full rounded-sm px-2 py-1 text-left text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted"
          >
            Clear
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelectFilter;
