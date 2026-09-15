import type { ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface BulkActionItem {
  label: string;
  onSelect: () => void;
  separatorBefore?: boolean;
}

export function BulkActionsButton({ items }: { items: BulkActionItem[] }) {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-9 whitespace-nowrap text-xs">Bulk actions <ChevronDown className="ml-1 h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end">{items.map(item => <div key={item.label}>{item.separatorBefore && <DropdownMenuSeparator />}<DropdownMenuItem onSelect={item.onSelect}>{item.label}</DropdownMenuItem></div>)}</DropdownMenuContent>
  </DropdownMenu>;
}

export function SectionSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="relative w-80 shrink-0"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input className="h-9 pl-9 text-xs" placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} /></div>;
}

export function SectionFilterSelect({ value, onChange, label, children, className }: { value: string; onChange: (value: string) => void; label: string; children: ReactNode; className?: string }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className={cn("h-9 w-44 shrink-0 text-xs", className)}><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select>;
}

export function SectionToolbar({ title, description, actions, filters, filtersActive, onReset, count, total, bulkBar }: { title: string; description: string; actions?: ReactNode; filters: ReactNode; filtersActive: boolean; onReset: () => void; count: number; total: number; bulkBar?: ReactNode }) {
  return <div className="border-b">
    <div className="flex min-h-[60px] items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0"><h2 className="text-sm font-semibold text-foreground">{title}</h2><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
    <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3 xl:flex-nowrap xl:overflow-x-auto">
      {filters}
      <div className="ml-auto flex h-9 shrink-0 items-center gap-3 whitespace-nowrap pl-1">
        {filtersActive && <Button variant="link" className="h-9 px-0 text-xs text-muted-foreground" onClick={onReset}>Reset filters</Button>}
        <span className="text-xs text-muted-foreground"><span className="tabular-nums">{count}</span> of <span className="tabular-nums">{total}</span> rows</span>
      </div>
    </div>
    {bulkBar}
  </div>;
}

export function SectionBulkBar({ count, children, onClear }: { count: number; children: ReactNode; onClear: () => void }) {
  if (count === 0) return null;
  return <div className="sticky top-0 z-10 flex items-center gap-2 border-t bg-background px-4 py-2 shadow-sm"><span className="text-xs font-medium">{count} selected</span>{children}<Button variant="link" size="sm" className="h-7 text-xs" onClick={onClear}>Clear selection</Button></div>;
}