import React, { useMemo, useState } from "react";
import { Check, CheckCircle2, ChevronsUpDown, Minus, Plus, X } from "lucide-react";
import { PREDEFINED_PATHWAYS } from "@/pages/ValueChainPathways";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const GEOGRAPHY_OPTIONS = [
  "Europe",
  "European Union",
  "United Kingdom",
  "North America",
  "United States",
  "Canada",
  "Latin America",
  "Asia-Pacific",
  "China",
  "India",
  "Middle East",
  "Africa",
];

type Thresholds = {
  applications: string[];
  trlFrom: string;
  trlTo: string;
  materialGeographies: string[];
  feedstockGeographies: string[];
  priceCeiling: string;
  currency: string;
  minimumProducers: number;
  requiredVolume: string;
  volumeUnit: string;
};

const INITIAL_THRESHOLDS: Thresholds = {
  applications: [],
  trlFrom: "1",
  trlTo: "9",
  materialGeographies: [],
  feedstockGeographies: [],
  priceCeiling: "",
  currency: "EUR",
  minimumProducers: 1,
  requiredVolume: "",
  volumeUnit: "tonnes/year",
};

const FieldHeading = ({ label, description }: { label: string; description: string }) => (
  <div className="space-y-1">
    <div className="text-xs font-semibold text-foreground">{label}</div>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

const MultiSelectChips = ({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (next: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);

  const toggle = (option: string) => {
    onChange(values.includes(option) ? values.filter((value) => value !== option) : [...values, option]);
  };

  return (
    <div className="space-y-2">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <span key={value} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-foreground">
              {value}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 rounded-full"
                onClick={() => toggle(value)}
                aria-label={`Remove ${value}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="h-9 w-full justify-between text-xs font-normal">
            {values.length > 0 ? `${values.length} selected` : `Select ${label.toLowerCase()}`}
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem key={option} value={option} onSelect={() => toggle(option)}>
                    <Check className={cn("mr-2 h-3.5 w-3.5", values.includes(option) ? "opacity-100" : "opacity-0")} />
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const ResearchSpace: React.FC = () => {
  const applications = useMemo(
    () => Array.from(new Set(PREDEFINED_PATHWAYS.map((pathway) => pathway.application))).sort(),
    [],
  );
  const [thresholds, setThresholds] = useState<Thresholds>(INITIAL_THRESHOLDS);
  const [saved, setSaved] = useState(false);

  const patch = <K extends keyof Thresholds>(key: K, value: Thresholds[K]) => {
    setThresholds((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="mt-5 space-y-5">
      <header>
        <h2 className="text-lg font-semibold text-foreground">Research Space</h2>
        <p className="mt-1 text-xs text-muted-foreground">Set thresholds to evaluate this material against available data.</p>
      </header>

      <section className="rounded-lg border border-border bg-card">
        <div className="flex items-start justify-between gap-6 border-b border-border px-5 py-4">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Thresholds</h3>
            <p className="mt-1 text-xs text-muted-foreground">Define each criterion independently before evaluating the research landscape.</p>
          </div>
          {saved && (
            <div className="flex shrink-0 items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Thresholds set
              </span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSaved(false)}>Edit</Button>
            </div>
          )}
        </div>

        {!saved && (
          <div className="p-5">
            <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
              <div className="space-y-2">
                <FieldHeading label="Applications" description="Limits evaluation to selected Application nodes." />
                <MultiSelectChips label="Applications" options={applications} values={thresholds.applications} onChange={(value) => patch("applications", value)} />
              </div>

              <div className="space-y-2">
                <FieldHeading label="Production scale (TRL)" description="Includes pathways within this technology readiness range." />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[10px] uppercase tracking-widest text-muted-foreground" htmlFor="trl-from">TRL from</label><Input id="trl-from" type="number" min={1} max={9} value={thresholds.trlFrom} onChange={(event) => patch("trlFrom", event.target.value)} className="h-9" /></div>
                  <div className="space-y-1"><label className="text-[10px] uppercase tracking-widest text-muted-foreground" htmlFor="trl-to">TRL to</label><Input id="trl-to" type="number" min={1} max={9} value={thresholds.trlTo} onChange={(event) => patch("trlTo", event.target.value)} className="h-9" /></div>
                </div>
              </div>

              <div className="space-y-2">
                <FieldHeading label="Material supply geography" description="Filters where the material itself must be available." />
                <MultiSelectChips label="Material supply geography" options={GEOGRAPHY_OPTIONS} values={thresholds.materialGeographies} onChange={(value) => patch("materialGeographies", value)} />
              </div>

              <div className="space-y-2">
                <FieldHeading label="Feedstock supply geography" description="Filters where production feedstocks must be available." />
                <MultiSelectChips label="Feedstock supply geography" options={GEOGRAPHY_OPTIONS} values={thresholds.feedstockGeographies} onChange={(value) => patch("feedstockGeographies", value)} />
              </div>

              <div className="space-y-2">
                <FieldHeading label="Price ceiling per tonne" description="Sets the maximum acceptable material price." />
                <div className="grid grid-cols-[1fr_100px] gap-2">
                  <Input type="number" min={0} placeholder="Enter amount" value={thresholds.priceCeiling} onChange={(event) => patch("priceCeiling", event.target.value)} className="h-9" />
                  <Select value={thresholds.currency} onValueChange={(value) => patch("currency", value)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EUR">EUR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent></Select>
                </div>
              </div>

              <div className="space-y-2">
                <FieldHeading label="Minimum number of producers" description="Requires at least this many identified producers." />
                <div className="flex h-9 w-40 items-center rounded-md border border-input bg-background">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-9 rounded-none" onClick={() => patch("minimumProducers", Math.max(0, thresholds.minimumProducers - 1))} aria-label="Decrease minimum producers"><Minus className="h-3.5 w-3.5" /></Button>
                  <Input aria-label="Minimum number of producers" type="number" min={0} value={thresholds.minimumProducers} onChange={(event) => patch("minimumProducers", Math.max(0, Number(event.target.value)))} className="h-8 border-0 px-1 text-center shadow-none focus-visible:ring-0" />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-9 rounded-none" onClick={() => patch("minimumProducers", thresholds.minimumProducers + 1)} aria-label="Increase minimum producers"><Plus className="h-3.5 w-3.5" /></Button>
                </div>
              </div>

              <div className="space-y-2">
                <FieldHeading label="Required volume" description="Sets the minimum annual volume needed." />
                <div className="grid grid-cols-[1fr_150px] gap-2">
                  <Input type="number" min={0} placeholder="Enter volume" value={thresholds.requiredVolume} onChange={(event) => patch("requiredVolume", event.target.value)} className="h-9" />
                  <Select value={thresholds.volumeUnit} onValueChange={(value) => patch("volumeUnit", value)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tonnes/year">tonnes/year</SelectItem><SelectItem value="kg/year">kg/year</SelectItem><SelectItem value="kt/year">kt/year</SelectItem></SelectContent></Select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end border-t border-border pt-4">
              <Button onClick={() => setSaved(true)} className="h-9 bg-foreground text-xs text-background hover:bg-foreground/90">Set thresholds</Button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-xs text-muted-foreground">Results will appear here once thresholds are set.</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Shortlisted items</h3>
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-xs text-muted-foreground">Pathways, companies, patents, and papers matching your thresholds will appear here.</p>
        </div>
      </section>
    </div>
  );
};

export default ResearchSpace;