import React, { useMemo, useState } from "react";
import { Check, CheckCircle2, ChevronsUpDown, MessageSquarePlus, Minus, Pencil, Plus, X } from "lucide-react";
import { PREDEFINED_PATHWAYS } from "@/pages/ValueChainPathways";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

type EvaluationStatus = "Match" | "No match" | "No data" | "Not set";


type ShortlistItem = { id: string; name: string; detail: string };
type ShortlistGroup = { id: string; label: string; items: ShortlistItem[] };

const SHORTLIST_GROUPS: ShortlistGroup[] = [
  {
    id: "pathways",
    label: "Pathways",
    items: [
      { id: "pathway-1", name: "Whey permeate fermentation", detail: "Whey permeate → Lactic acid" },
      { id: "pathway-2", name: "Corn stover bioconversion", detail: "Corn stover → Lactic acid" },
      { id: "pathway-3", name: "Sugarcane molasses fermentation", detail: "Sugarcane molasses → Lactic acid" },
    ],
  },
  {
    id: "companies",
    label: "Companies",
    items: [
      { id: "company-1", name: "Corbion", detail: "Producer · Gorinchem, Netherlands" },
      { id: "company-2", name: "Jungbunzlauer", detail: "Producer · Basel, Switzerland" },
      { id: "company-3", name: "Galactic", detail: "Producer · Brussels, Belgium" },
    ],
  },
  {
    id: "patents",
    label: "Patents",
    items: [
      { id: "patent-1", name: "EP 3 412 789 B1", detail: "Continuous purification of fermentation-derived lactic acid" },
      { id: "patent-2", name: "WO 2024/118632 A1", detail: "Low-carbon lactic acid from agricultural residues" },
    ],
  },
  {
    id: "papers",
    label: "Papers",
    items: [
      { id: "paper-1", name: "Commercial-scale lactic acid fermentation", detail: "Process yield and cost assessment across renewable feedstocks" },
      { id: "paper-2", name: "European lactic acid supply outlook", detail: "Producer capacity, geography and market availability review" },
    ],
  },
];

const statusClasses: Record<EvaluationStatus, string> = {
  Match: "border-success/30 bg-success/10 text-success",
  "No match": "border-destructive/30 bg-destructive/10 text-destructive",
  "No data": "border-border bg-muted text-muted-foreground",
  "Not set": "border-warning/30 bg-warning/10 text-warning",
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

const ShortlistRow = ({ item }: { item: ShortlistItem }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");

  const openEditor = () => {
    setDraft(note);
    setEditing(true);
  };

  const saveNote = () => {
    setNote(draft.trim());
    setEditing(false);
  };

  return (
    <div className="border-t border-border px-4 py-3 first:border-t-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-foreground">{item.name}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={openEditor} aria-label={note ? `Edit note for ${item.name}` : `Add note for ${item.name}`} title={note ? "Edit note" : "Add note"}>
          {note ? <Pencil className="h-3.5 w-3.5" /> : <MessageSquarePlus className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {editing && (
        <div className="mt-3 space-y-2">
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add a note…" className="min-h-20 text-xs" autoFocus />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="button" size="sm" className="h-7 bg-foreground text-xs text-background hover:bg-foreground/90" onClick={saveNote}>Save note</Button>
          </div>
        </div>
      )}

      {note && !editing && (
        <div className="mt-3 flex items-start justify-between gap-3 border-l-2 border-border pl-3">
          <p className="text-xs text-muted-foreground">{note}</p>
          <Button type="button" variant="link" className="h-auto shrink-0 p-0 text-[10px]" onClick={openEditor}>Edit</Button>
        </div>
      )}
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

  const evaluationRows = useMemo<{ label: string; status: EvaluationStatus; explanation: string }[]>(() => {
    if (!saved) {
      return [
        { label: "Applications", status: "Not set", explanation: "Set threshold to evaluate." },
        { label: "Production scale (TRL)", status: "Not set", explanation: "Set threshold to evaluate." },
        { label: "Material supply geography", status: "Not set", explanation: "Set threshold to evaluate." },
        { label: "Feedstock supply geography", status: "Not set", explanation: "Set threshold to evaluate." },
        { label: "Price ceiling per tonne", status: "Not set", explanation: "Set threshold to evaluate." },
        { label: "Minimum number of producers", status: "Not set", explanation: "Set threshold to evaluate." },
        { label: "Required volume", status: "Not set", explanation: "Set threshold to evaluate." },
      ];
    }
    return [
      {
        label: "Applications",
        status: thresholds.applications.length > 0 ? "Match" : "Not set",
        explanation: thresholds.applications.length > 0 ? `${thresholds.applications.join(", ")} selected for evaluation.` : "Set threshold to evaluate.",
      },
      {
        label: "Production scale (TRL)",
        status: thresholds.trlFrom && thresholds.trlTo ? "Match" : "Not set",
        explanation: thresholds.trlFrom && thresholds.trlTo ? `Evaluating pathways between TRL ${thresholds.trlFrom} and TRL ${thresholds.trlTo}.` : "Set threshold to evaluate.",
      },
      {
        label: "Material supply geography",
        status: thresholds.materialGeographies.length > 0 ? "Match" : "Not set",
        explanation: thresholds.materialGeographies.length > 0 ? `Producers found in ${thresholds.materialGeographies.slice(0, 2).join(" and ")}.` : "Set threshold to evaluate.",
      },
      {
        label: "Feedstock supply geography",
        status: thresholds.feedstockGeographies.length > 0 ? "No match" : "Not set",
        explanation: thresholds.feedstockGeographies.length > 0 ? "No verified feedstock supplier was found in the selected region." : "Set threshold to evaluate.",
      },
      {
        label: "Price ceiling per tonne",
        status: thresholds.priceCeiling ? "No data" : "Not set",
        explanation: thresholds.priceCeiling ? "No price data is available for this material." : "Set threshold to evaluate.",
      },
      {
        label: "Minimum number of producers",
        status: thresholds.minimumProducers > 0 ? "Match" : "Not set",
        explanation: thresholds.minimumProducers > 0 ? `${thresholds.minimumProducers} producers required; four are identified.` : "Set threshold to evaluate.",
      },
      {
        label: "Required volume",
        status: thresholds.requiredVolume ? "Match" : "Not set",
        explanation: thresholds.requiredVolume ? `Minimum required volume set to ${thresholds.requiredVolume} ${thresholds.volumeUnit}.` : "Set threshold to evaluate.",
      },
    ];
  }, [saved, thresholds]);

  return (
    <div className="mt-5 space-y-5">
      <section className="overflow-hidden rounded-lg border border-border bg-card" aria-label="Threshold criteria">
        {evaluationRows.map((row, index) => (
          <div key={row.label} className={cn("px-5 py-4", index !== evaluationRows.length - 1 && "border-b border-border")}>
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground">{row.label}</div>
                {row.label === "Applications" && (
                  <MultiSelectChips label="Applications" options={applications} values={thresholds.applications} onChange={(value) => patch("applications", value)} />
                )}
                {row.label === "Production scale (TRL)" && (
                  <div className="grid max-w-md grid-cols-2 gap-3">
                    <div className="space-y-1"><label className="text-[10px] uppercase tracking-widest text-muted-foreground" htmlFor="trl-from">TRL from</label><Input id="trl-from" type="number" min={1} max={9} value={thresholds.trlFrom} onChange={(event) => patch("trlFrom", event.target.value)} className="h-9" /></div>
                    <div className="space-y-1"><label className="text-[10px] uppercase tracking-widest text-muted-foreground" htmlFor="trl-to">TRL to</label><Input id="trl-to" type="number" min={1} max={9} value={thresholds.trlTo} onChange={(event) => patch("trlTo", event.target.value)} className="h-9" /></div>
                  </div>
                )}
                {row.label === "Material supply geography" && (
                  <MultiSelectChips label="Material supply geography" options={GEOGRAPHY_OPTIONS} values={thresholds.materialGeographies} onChange={(value) => patch("materialGeographies", value)} />
                )}
                {row.label === "Feedstock supply geography" && (
                  <MultiSelectChips label="Feedstock supply geography" options={GEOGRAPHY_OPTIONS} values={thresholds.feedstockGeographies} onChange={(value) => patch("feedstockGeographies", value)} />
                )}
                {row.label === "Price ceiling per tonne" && (
                  <div className="grid max-w-md grid-cols-[1fr_100px] gap-2">
                    <Input type="number" min={0} placeholder="Enter amount" value={thresholds.priceCeiling} onChange={(event) => patch("priceCeiling", event.target.value)} className="h-9" />
                    <Select value={thresholds.currency} onValueChange={(value) => patch("currency", value)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EUR">EUR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent></Select>
                  </div>
                )}
                {row.label === "Minimum number of producers" && (
                  <div className="flex h-9 w-40 items-center rounded-md border border-input bg-background">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-9 rounded-none" onClick={() => patch("minimumProducers", Math.max(0, thresholds.minimumProducers - 1))} aria-label="Decrease minimum producers"><Minus className="h-3.5 w-3.5" /></Button>
                    <Input aria-label="Minimum number of producers" type="number" min={0} value={thresholds.minimumProducers} onChange={(event) => patch("minimumProducers", Math.max(0, Number(event.target.value)))} className="h-8 border-0 px-1 text-center shadow-none focus-visible:ring-0" />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-9 rounded-none" onClick={() => patch("minimumProducers", thresholds.minimumProducers + 1)} aria-label="Increase minimum producers"><Plus className="h-3.5 w-3.5" /></Button>
                  </div>
                )}
                {row.label === "Required volume" && (
                  <div className="grid max-w-md grid-cols-[1fr_150px] gap-2">
                    <Input type="number" min={0} placeholder="Enter volume" value={thresholds.requiredVolume} onChange={(event) => patch("requiredVolume", event.target.value)} className="h-9" />
                    <Select value={thresholds.volumeUnit} onValueChange={(value) => patch("volumeUnit", value)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tonnes/year">tonnes/year</SelectItem><SelectItem value="kg/year">kg/year</SelectItem><SelectItem value="kt/year">kt/year</SelectItem></SelectContent></Select>
                  </div>
                )}
              </div>
              <Badge variant="outline" className={cn("shrink-0 text-[10px]", statusClasses[row.status])}>{row.status}</Badge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{row.explanation}</p>
          </div>
        ))}
        <div className="flex justify-end border-t border-border px-5 py-4">
          <Button onClick={() => setSaved(true)} className="h-9 bg-foreground text-xs text-background hover:bg-foreground/90">Set thresholds</Button>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Shortlisted items</h3>
        <Accordion type="multiple" defaultValue={["pathways"]} className="overflow-hidden rounded-lg border border-border bg-card">
          {SHORTLIST_GROUPS.map((group) => (
            <AccordionItem key={group.id} value={group.id} className="border-b border-border last:border-b-0">
              <AccordionTrigger className="px-4 py-3 text-xs hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{group.label}</span>
                  <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-[10px]">{group.items.length}</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="border-t border-border pb-0">
                {group.items.map((item) => <ShortlistRow key={item.id} item={item} />)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
};

export default ResearchSpace;