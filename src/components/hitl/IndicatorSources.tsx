import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MAX_SOURCES, isValidSourceUrl, sourceDisplay, type IndicatorSource } from "@/lib/hitlStore";

export function SourcesPopover({ sources, onEdit, label }: { sources: IndicatorSource[]; onEdit?: () => void; label?: string }) {
  if (!sources.length) return <span className="text-[10px] text-muted-foreground">—</span>;
  const text = label ?? `${sources.length} ${sources.length === 1 ? "source" : "sources"}`;
  return <Popover>
    <PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-6 whitespace-nowrap px-2 text-[10px] underline decoration-dotted">{text}</Button></PopoverTrigger>
    <PopoverContent align="start" className="w-80 space-y-2 p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sources</p>
      <ul className="space-y-1.5">
        {sources.map((source, index) => <li key={`${source.url}-${index}`}>
          <Tooltip><TooltipTrigger asChild>
            <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-xs text-primary hover:underline">
              <span className="truncate">{sourceDisplay(source)}</span><ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </TooltipTrigger><TooltipContent className="max-w-sm break-all text-[10px]">{source.url}</TooltipContent></Tooltip>
        </li>)}
      </ul>
      {onEdit && <Button variant="outline" size="sm" className="h-7 w-full text-[10px]" onClick={onEdit}>Edit sources</Button>}
    </PopoverContent>
  </Popover>;
}

export function SourcesEditor({ sources, onChange, requiredMessage }: { sources: IndicatorSource[]; onChange: (next: IndicatorSource[]) => void; requiredMessage?: string | null }) {
  const update = (index: number, patch: Partial<IndicatorSource>) => onChange(sources.map((source, i) => (i === index ? { ...source, ...patch } : source)));
  return <div className="space-y-2">
    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Sources</Label>
    {sources.length === 0 && <p className="text-xs text-muted-foreground">No sources yet.</p>}
    {sources.map((source, index) => {
      const invalid = source.url.trim().length > 0 && !isValidSourceUrl(source.url);
      return <div key={index} className="space-y-1">
        <div className="flex items-start gap-2">
          <Input value={source.url} onChange={event => update(index, { url: event.target.value })} placeholder="https://…" className="h-8 flex-1 text-xs" aria-label={`Source URL ${index + 1}`} />
          <Input value={source.label ?? ""} onChange={event => update(index, { label: event.target.value || null })} placeholder="Label (optional)" className="h-8 w-44 text-xs" aria-label={`Source label ${index + 1}`} />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label={`Remove source ${index + 1}`} onClick={() => onChange(sources.filter((_, i) => i !== index))}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
        {invalid && <p className="text-[10px] text-destructive">Enter a full URL</p>}
      </div>;
    })}
    {requiredMessage && <p className="text-[10px] text-destructive">{requiredMessage}</p>}
    <Button variant="outline" size="sm" className="h-7 text-[10px]" disabled={sources.length >= MAX_SOURCES} onClick={() => onChange([...sources, { url: "", label: null }])}><Plus className="mr-1 h-3 w-3" />Add source</Button>
  </div>;
}

// Trimmed, empty rows dropped — the shape stored on the record.
export const cleanSources = (sources: IndicatorSource[]): IndicatorSource[] =>
  sources.map(source => ({ url: source.url.trim(), label: source.label?.trim() || null })).filter(source => source.url.length > 0);
export const sourcesValid = (sources: IndicatorSource[]): boolean => cleanSources(sources).every(source => isValidSourceUrl(source.url));
