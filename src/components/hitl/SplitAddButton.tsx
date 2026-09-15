import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface SplitAddButtonItem {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  separatorBefore?: boolean;
}

export function SplitAddButton({ label, icon: Icon, onClick, items, ariaLabel }: { label: string; icon: LucideIcon; onClick: () => void; items: SplitAddButtonItem[]; ariaLabel: string }) {
  return <div className="inline-flex">
    <Button size="sm" className="h-9 rounded-r-none pr-3 text-xs" onClick={onClick}><Icon className="mr-1 h-3.5 w-3.5" />{label}</Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="sm" className="h-9 w-9 rounded-l-none border-l border-primary-foreground/20 p-0" aria-label={ariaLabel}><ChevronDown className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">{items.map(item => <div key={item.label}>{item.separatorBefore && <DropdownMenuSeparator />}<DropdownMenuItem onSelect={item.onSelect}><item.icon className="mr-2 h-3.5 w-3.5" />{item.label}</DropdownMenuItem></div>)}</DropdownMenuContent>
    </DropdownMenu>
  </div>;
}