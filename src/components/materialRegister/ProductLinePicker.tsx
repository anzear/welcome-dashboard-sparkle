import React, { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  canonicalProductLine,
  registerProductLine,
  useProductLines,
} from "@/components/materialRegister/productLines";
import { tagKey } from "@/components/materialRegister/tags";

/**
 * Product line assignment. Values come from the controlled workspace list, so
 * typing filters what already exists — adding a new value is a deliberate
 * secondary action, not the default path.
 */
export const ProductLinePicker: React.FC<{
  values: string[];
  onChange: (next: string[]) => void;
  triggerLabel?: string;
  align?: "start" | "end";
}> = ({ values, onChange, triggerLabel = "Assign", align = "start" }) => {
  const lines = useProductLines();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const query = q.trim().toLowerCase();
  const matches = query ? lines.filter((l) => l.toLowerCase().includes(query)) : lines;
  const has = (l: string) => values.some((v) => tagKey(v) === tagKey(l));

  const toggle = (l: string) => {
    const c = canonicalProductLine(l);
    onChange(has(c) ? values.filter((v) => tagKey(v) !== tagKey(c)) : [...values, c]);
  };

  const commitNew = () => {
    const stored = registerProductLine(draft);
    setDraft("");
    setAdding(false);
    if (!stored) return;
    if (!has(stored)) onChange([...values, stored]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-[11px]">
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="portfolio-type w-64 p-1.5">
        <div className="px-1 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          Product line
        </div>
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter product lines"
          className="h-7 text-[11px]"
        />
        <div className="max-h-52 overflow-y-auto pt-1">
          {matches.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => toggle(l)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] hover:bg-muted/60"
            >
              <Check className={cn("h-3 w-3", has(l) ? "text-primary" : "text-transparent")} />
              <span className="flex-1 text-foreground">{l}</span>
            </button>
          ))}
          {matches.length === 0 && (
            <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
              No product line matches that.
            </div>
          )}
        </div>
        <div className="mt-1 border-t border-border pt-1">
          {adding ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitNew();
                  }
                  if (e.key === "Escape") setAdding(false);
                }}
                placeholder="New product line"
                className="h-7 text-[11px]"
              />
              <Button size="sm" className="h-7 text-[11px]" onClick={commitNew}>
                Add
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[10px] text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
              Add new product line
            </button>
          )}
          <p className="px-2 pb-1 pt-1 text-[10px] leading-tight text-muted-foreground">
            The list is shared by the whole workspace.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/** Assigned product lines as company-entered chips. No assignment shows empty. */
export const ProductLineChips: React.FC<{
  values: string[];
  onRemove?: (value: string) => void;
  emptyLabel?: string;
}> = ({ values, onRemove, emptyLabel = "No product line" }) => {
  if (values.length === 0)
    return <span className="text-[11px] text-muted-foreground/60">{emptyLabel}</span>;
  return (
    <>
      {values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground"
        >
          {v}
          {onRemove && (
            <button type="button" aria-label={`Remove ${v}`} onClick={() => onRemove(v)}>
              <X className="h-2.5 w-2.5 opacity-60 hover:opacity-100" />
            </button>
          )}
        </span>
      ))}
    </>
  );
};

export default ProductLinePicker;
