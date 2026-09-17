import React, { useMemo, useState } from "react";
import { Check, ChevronsUpDown, MessageSquarePlus, Minus, Pencil, Plus, Star, X } from "lucide-react";
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

type PathwayItem = {
  id: string;
  feedstock: string;
  process: string;
  product: string;
  application: string;
};

type Rating = { user: string; value: number };

type CompanyItem = {
  id: string;
  name: string;
  role: string;
  location: string;
  size?: string;
  connectsTo: string;
  ratings: Rating[];
};

const CURRENT_REVIEWER = "A. Weber";

const PATHWAY_ITEMS: PathwayItem[] = [
  { id: "pathway-1", feedstock: "Whey permeate", process: "Fermentation", product: "Lactic Acid", application: "PLA packaging" },
  { id: "pathway-2", feedstock: "Corn stover", process: "Enzymatic hydrolysis + fermentation", product: "Lactic Acid", application: "Biodegradable films" },
  { id: "pathway-3", feedstock: "Sugarcane molasses", process: "Fermentation", product: "Lactic Acid", application: "Food preservation" },
];

const COMPANY_GROUPS: { id: string; label: string; items: CompanyItem[] }[] = [
  {
    id: "producer",
    label: "Producer",
    items: [
      {
        id: "company-1",
        name: "Corbion",
        role: "Producer",
        location: "Gorinchem, Netherlands",
        size: "250 employees",
        connectsTo: "Lactic Acid",
        ratings: [
          { user: "K. Brandt", value: 4 },
          { user: "M. Rossi", value: 5 },
        ],
      },
      {
        id: "company-2",
        name: "Jungbunzlauer",
        role: "Producer",
        location: "Basel, Switzerland",
        connectsTo: "Lactic Acid",
        ratings: [{ user: "K. Brandt", value: 3 }],
      },
    ],
  },
  {
    id: "supplier",
    label: "Supplier",
    items: [
      {
        id: "company-3",
        name: "Arla Foods Ingredients",
        role: "Supplier",
        location: "Viby, Denmark",
        size: "1 200 employees",
        connectsTo: "Whey permeate",
        ratings: [{ user: "M. Rossi", value: 4 }],
      },
    ],
  },
  {
    id: "offtaker",
    label: "Offtaker",
    items: [
      {
        id: "company-4",
        name: "Amcor Flexibles",
        role: "Offtaker",
        location: "Zurich, Switzerland",
        size: "400 employees",
        connectsTo: "PLA packaging",
        ratings: [],
      },
    ],
  },
];

const PATENT_ITEMS: ShortlistItem[] = [
  { id: "patent-1", name: "EP 3 412 789 B1", detail: "Continuous purification of fermentation-derived lactic acid" },
  { id: "patent-2", name: "WO 2024/118632 A1", detail: "Low-carbon lactic acid from agricultural residues" },
];

const PAPER_ITEMS: ShortlistItem[] = [
  { id: "paper-1", name: "Commercial-scale lactic acid fermentation", detail: "Process yield and cost assessment across renewable feedstocks" },
  { id: "paper-2", name: "European lactic acid supply outlook", detail: "Producer capacity, geography and market availability review" },
];


const statusClasses: Record<EvaluationStatus, string> = {
  Match: "border-success/30 bg-success/10 text-success",
  "No match": "border-destructive/30 bg-destructive/10 text-destructive",
  "No data": "border-border bg-muted text-muted-foreground",
  "Not set": "border-warning/30 bg-warning/10 text-warning",
};

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

const ShortlistEntry = ({
  name,
  right,
  children,
}: {
  name: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) => {
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
        <div className="min-w-0 flex-1">{children}</div>
        <div className="flex shrink-0 items-start gap-2">
          {right}
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={openEditor} aria-label={note ? `Edit note for ${name}` : `Add note for ${name}`} title={note ? "Edit note" : "Add note"}>
            {note ? <Pencil className="h-3.5 w-3.5" /> : <MessageSquarePlus className="h-3.5 w-3.5" />}
          </Button>
        </div>
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

const ShortlistRow = ({ item }: { item: ShortlistItem }) => (
  <ShortlistEntry name={item.name}>
    <div className="text-xs font-semibold text-foreground">{item.name}</div>
    <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
  </ShortlistEntry>
);

const PathwayRow = ({ item }: { item: PathwayItem }) => (
  <ShortlistEntry name={`${item.feedstock} → ${item.product}`}>
    <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-foreground">
      <span>{item.feedstock}</span>
      <span className="text-muted-foreground">→</span>
      <span>{item.process}</span>
      <span className="text-muted-foreground">→</span>
      <span>{item.product}</span>
      <span className="text-muted-foreground">→</span>
      <span>{item.application}</span>
    </div>
  </ShortlistEntry>
);

const RatingControl = ({ value, onChange, name }: { value: number; onChange: (value: number) => void; name: string }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        aria-label={`Rate ${name} ${star} of 5`}
        className="p-0.5"
      >
        <Star className={cn("h-3.5 w-3.5", star <= value ? "fill-foreground text-foreground" : "text-muted-foreground/50")} />
      </button>
    ))}
  </div>
);

const CompanyRow = ({ item }: { item: CompanyItem }) => {
  const [myRating, setMyRating] = useState(0);

  return (
    <ShortlistEntry name={item.name}>
      <div className="text-xs font-semibold text-foreground">{item.name}</div>
      <p className="mt-0.5 text-xs text-muted-foreground">{item.role} · {item.location}</p>
      {item.size && <p className="mt-0.5 text-xs text-muted-foreground">{item.size}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px] font-normal">{item.connectsTo}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Your rating</span>
          <RatingControl value={myRating} onChange={setMyRating} name={item.name} />
          {myRating > 0 && <span className="text-[10px] text-muted-foreground">{CURRENT_REVIEWER}: {myRating}</span>}
        </div>
        {item.ratings.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {item.ratings.map((rating) => (
              <span key={rating.user} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                {rating.user}: {rating.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </ShortlistEntry>
  );
};

const ShortlistCard = ({ label, count, children, defaultOpen = false }: { label: string; count: number; children: React.ReactNode; defaultOpen?: boolean }) => (
  <Accordion type="single" collapsible defaultValue={defaultOpen ? label : undefined} className="overflow-hidden rounded-lg border border-border bg-card">
    <AccordionItem value={label} className="border-b-0">
      <AccordionTrigger className="px-4 py-3 text-xs hover:no-underline">
        <span className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{label}</span>
          <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-[10px]">{count}</Badge>
        </span>
      </AccordionTrigger>
      <AccordionContent className="border-t border-border pb-0">{children}</AccordionContent>
    </AccordionItem>
  </Accordion>
);



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

      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Shortlisted items</h3>

        <ShortlistCard label="Pathways" count={PATHWAY_ITEMS.length} defaultOpen>
          {PATHWAY_ITEMS.map((item) => <PathwayRow key={item.id} item={item} />)}
        </ShortlistCard>

        <ShortlistCard label="Companies" count={COMPANY_GROUPS.reduce((total, group) => total + group.items.length, 0)}>
          {COMPANY_GROUPS.map((group) => (
            <div key={group.id} className="border-t border-border first:border-t-0">
              <div className="flex items-center gap-2 bg-muted/40 px-4 py-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{group.label}</span>
                <Badge variant="secondary" className="h-4 min-w-4 justify-center px-1.5 text-[10px]">{group.items.length}</Badge>
              </div>
              {group.items.map((item) => <CompanyRow key={item.id} item={item} />)}
            </div>
          ))}
        </ShortlistCard>

        <ShortlistCard label="Patents" count={PATENT_ITEMS.length}>
          {PATENT_ITEMS.map((item) => <ShortlistRow key={item.id} item={item} />)}
        </ShortlistCard>

        <ShortlistCard label="Papers" count={PAPER_ITEMS.length}>
          {PAPER_ITEMS.map((item) => <ShortlistRow key={item.id} item={item} />)}
        </ShortlistCard>
      </section>

    </div>
  );
};

export default ResearchSpace;