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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PathwayShortlistRows, type PathwayNote, type ShortlistPathway } from "@/components/pathway/PathwayShortlistRows";


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
  minimumProducers: string;
  requiredVolume: string;
  volumeUnit: string;
};

const INITIAL_THRESHOLDS: Thresholds = {
  applications: [],
  trlFrom: "",
  trlTo: "",
  materialGeographies: [],
  feedstockGeographies: [],
  priceCeiling: "",
  currency: "EUR",
  minimumProducers: "",
  requiredVolume: "",
  volumeUnit: "tonnes/year",
};


type EvaluationStatus = "Met" | "Not met" | "Not set";

type EvidenceRecord = { name: string; source: string };


type ShortlistItem = { id: string; name: string; detail: string };




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

/** Shortlisted pathways — node ids drive grouping, labels are display only. */
const SHORTLIST_PATHWAYS: ShortlistPathway[] = [
  {
    id: "pathway-1",
    feedstockId: "fs-whey", processId: "pr-ferm", productId: "pd-la", applicationId: "ap-pla",
    feedstock: "Whey permeate", process: "Fermentation", product: "Lactic Acid", application: "PLA packaging",
    trl: "TRL 9",
  },
  {
    id: "pathway-2",
    feedstockId: "fs-whey", processId: "pr-ferm", productId: "pd-la", applicationId: "ap-food",
    feedstock: "Whey permeate", process: "Fermentation", product: "Lactic Acid", application: "Food preservation",
    trl: "TRL 7",
  },
  {
    id: "pathway-3",
    feedstockId: "fs-whey", processId: "pr-ferm", productId: "pd-la", applicationId: "ap-skin",
    feedstock: "Whey permeate", process: "Fermentation", product: "Lactic Acid", application: "Skin care (AHA)",
  },
  {
    id: "pathway-4",
    feedstockId: "fs-stover", processId: "pr-hydro-ferm", productId: "pd-la", applicationId: "ap-films",
    feedstock: "Corn stover", process: "Enzymatic hydrolysis + fermentation", product: "Lactic Acid",
    application: "Biodegradable films",
    trl: "TRL 5",
  },
];

const INITIAL_PATHWAY_NOTES: Record<string, PathwayNote[]> = {
  "pathway-1": [
    { id: "note-1", author: "K. Brandt", timestamp: "2026-08-14 10:12", text: "Corbion confirmed food-grade capacity for this route." },
    { id: "note-2", author: "M. Rossi", timestamp: "2026-08-21 15:40", text: "Ask about minimum order volumes before the next call." },
  ],
  "pathway-4": [
    { id: "note-3", author: "A. Weber", timestamp: "2026-09-02 09:05", text: "Pilot only — revisit once a second supplier is verified." },
  ],
};


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
  Met: "border-success/30 bg-success/10 text-success",
  "Not met": "border-destructive/30 bg-destructive/10 text-destructive",
  "Not set": "border-border bg-muted text-muted-foreground",
};

// ---- Mock evidence held by the platform ----
const PATHWAY_TRL = 6;

const PRODUCER_RECORDS: (EvidenceRecord & { country: string; regions: string[]; capacity: number })[] = [
  { name: "Corbion", country: "Netherlands", regions: ["Europe", "European Union"], capacity: 4500, source: "corbion.com" },
  { name: "NatureWorks", country: "United States", regions: ["North America", "United States"], capacity: 3500, source: "natureworksllc.com" },
  { name: "Purac Americas", country: "United States", regions: ["North America", "United States"], capacity: 2500, source: "purac.com" },
  { name: "Cargill Bioindustrial", country: "United States", regions: ["North America", "United States"], capacity: 1500, source: "cargill.com" },
];

const FEEDSTOCK_SUPPLIER_RECORDS: (EvidenceRecord & { regions: string[] })[] = [
  { name: "Arla Foods Ingredients", regions: ["Europe", "European Union"], source: "arlafoodsingredients.com" },
  { name: "Südzucker", regions: ["Europe", "European Union"], source: "suedzucker.de" },
];

const PRICE_RECORDS: EvidenceRecord[] = [
  { name: "Spot quotation EUR 1,420/t — Q1 2026", source: "ICIS bio-acids report" },
  { name: "Contract quotation EUR 1,480/t — Q1 2026", source: "Producer disclosure, Corbion" },
];

const INDICATIVE_PRICE_EUR = 1450;

const CURRENCY_TO_EUR: Record<string, number> = { EUR: 1, USD: 0.92, GBP: 1.17 };

const VOLUME_TO_TONNES: Record<string, number> = { "tonnes/year": 1, "kg/year": 0.001, "kt/year": 1000 };

const IDENTIFIED_CAPACITY_TONNES = PRODUCER_RECORDS.reduce((total, record) => total + record.capacity, 0);

const num = (value: number) => value.toLocaleString("en-US");

const listGeographies = (values: string[]) =>
  values.length <= 1 ? values[0] : `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;

const volumeUnitLabel = (value: number, unit: string) => {
  if (value !== 1) return unit;
  return unit.replace("tonnes/year", "tonne/year").replace("kg/year", "kg/year").replace("kt/year", "kt/year");
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
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="h-9 w-full justify-between bg-background text-xs font-normal">
            <span className="truncate">{values.length > 0 ? `${values.length} selected` : `Select ${label.toLowerCase()}`}</span>
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
  const [evidence, setEvidence] = useState<{ title: string; records: EvidenceRecord[] } | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [shortlistPathways, setShortlistPathways] = useState<ShortlistPathway[]>(SHORTLIST_PATHWAYS);
  const [pathwayNotes, setPathwayNotes] = useState<Record<string, PathwayNote[]>>(INITIAL_PATHWAY_NOTES);

  const removePathway = (id: string) =>
    setShortlistPathways((current) => current.filter((pathway) => pathway.id !== id));

  const addPathwayNote = (id: string, text: string) =>
    setPathwayNotes((current) => ({
      ...current,
      [id]: [
        ...(current[id] ?? []),
        {
          id: `note-${Date.now()}`,
          author: CURRENT_REVIEWER,
          timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          text,
        },
      ],
    }));


  const patch = <K extends keyof Thresholds>(key: K, value: Thresholds[K]) => {
    setShowSaved(false);
    setThresholds((current) => ({ ...current, [key]: value }));
  };


  const EvidenceLink = ({ label, title, records }: { label: string; title: string; records: EvidenceRecord[] }) => (
    <Button
      type="button"
      variant="link"
      className="h-auto p-0 text-xs font-semibold text-foreground underline"
      onClick={() => setEvidence({ title, records })}
    >
      {label}
    </Button>
  );

  type Row = { label: string; status: EvaluationStatus; line: React.ReactNode | null };

  const rows: Row[] = (() => {
    const appCount = thresholds.applications.length;

    const trlFrom = Number(thresholds.trlFrom);
    const trlTo = Number(thresholds.trlTo);
    // A range covering the whole 1–9 span excludes nothing, so it is not a threshold.
    const trlSet =
      thresholds.trlFrom !== "" &&
      thresholds.trlTo !== "" &&
      !Number.isNaN(trlFrom) &&
      !Number.isNaN(trlTo) &&
      !(trlFrom <= 1 && trlTo >= 9);
    const trlInRange = PATHWAY_TRL >= trlFrom && PATHWAY_TRL <= trlTo;

    const matchesGeography = (regions: string[], country: string | undefined, selected: string[]) =>
      selected.some((geography) => regions.includes(geography) || country === geography);

    const productMatches = PRODUCER_RECORDS.filter((record) =>
      matchesGeography(record.regions, record.country, thresholds.materialGeographies),
    );
    const feedstockMatches = FEEDSTOCK_SUPPLIER_RECORDS.filter((record) =>
      matchesGeography(record.regions, undefined, thresholds.feedstockGeographies),
    );

    const ceiling = Number(thresholds.priceCeiling);
    const priceSet = thresholds.priceCeiling !== "" && !Number.isNaN(ceiling) && ceiling > 0;
    const ceilingEur = ceiling * (CURRENCY_TO_EUR[thresholds.currency] ?? 1);
    const priceBelow = INDICATIVE_PRICE_EUR <= ceilingEur;

    const requiredProducers = Number(thresholds.minimumProducers);
    // A minimum of 1 excludes nothing.
    const producersSet =
      thresholds.minimumProducers !== "" && !Number.isNaN(requiredProducers) && requiredProducers > 1;
    const identifiedProducers = PRODUCER_RECORDS.length;

    const volume = Number(thresholds.requiredVolume);
    const volumeSet = thresholds.requiredVolume !== "" && !Number.isNaN(volume) && volume > 0;
    const requiredTonnes = volume * (VOLUME_TO_TONNES[thresholds.volumeUnit] ?? 1);
    const volumeAbove = IDENTIFIED_CAPACITY_TONNES >= requiredTonnes;

    return [
      {
        label: "Applications",
        status: appCount > 0 ? "Met" : "Not set",
        line: appCount > 0 ? `Evaluated against ${appCount} selected application${appCount === 1 ? "" : "s"}.` : "Select an application to evaluate.",
      },
      {
        label: "TRL range",
        status: trlSet ? (trlInRange ? "Met" : "Not met") : "Not set",
        line: trlSet
          ? `Pathway at TRL ${PATHWAY_TRL} — ${trlInRange ? "within" : "outside"} your range of ${trlFrom}–${trlTo}.`
          : "Set a TRL range to evaluate.",
      },
      {
        label: "Product geography",
        status: thresholds.materialGeographies.length === 0 ? "Not set" : productMatches.length > 0 ? "Met" : "Not met",
        line:
          thresholds.materialGeographies.length === 0 ? (
            "Select a geography to evaluate."
          ) : productMatches.length > 0 ? (
            <>
              <EvidenceLink
                label={`${productMatches.length} producer${productMatches.length === 1 ? "" : "s"}`}
                title="Producers identified"
                records={productMatches.map(({ name, source }) => ({ name, source }))}
              />
              {` identified in ${listGeographies(thresholds.materialGeographies)}.`}
            </>
          ) : (
            `No producer identified in ${listGeographies(thresholds.materialGeographies)}.`
          ),
      },
      {
        label: "Feedstock geography",
        status: thresholds.feedstockGeographies.length === 0 ? "Not set" : feedstockMatches.length > 0 ? "Met" : "Not met",
        line:
          thresholds.feedstockGeographies.length === 0 ? (
            "Select a geography to evaluate."
          ) : feedstockMatches.length > 0 ? (
            <>
              <EvidenceLink
                label={`${feedstockMatches.length} verified feedstock supplier${feedstockMatches.length === 1 ? "" : "s"}`}
                title="Verified feedstock suppliers"
                records={feedstockMatches.map(({ name, source }) => ({ name, source }))}
              />
              {` identified in ${listGeographies(thresholds.feedstockGeographies)}.`}
            </>
          ) : (
            `No verified feedstock supplier identified in ${listGeographies(thresholds.feedstockGeographies)}.`
          ),
      },
      {
        label: "Price ceiling",
        status: priceSet ? (priceBelow ? "Met" : "Not met") : "Not set",
        line: priceSet ? (
          <>
            <EvidenceLink
              label={`Indicative price EUR ${num(INDICATIVE_PRICE_EUR)}/t`}
              title="Price points"
              records={PRICE_RECORDS}
            />
            {` — ${priceBelow ? "below" : "above"} your ceiling of ${thresholds.currency} ${num(ceiling)}/t.`}
          </>
        ) : (
          "Set a ceiling to evaluate."
        ),
      },
      {
        label: "Producers",
        status: producersSet ? (identifiedProducers >= requiredProducers ? "Met" : "Not met") : "Not set",
        line: producersSet ? (
          <>
            <EvidenceLink
              label={`${identifiedProducers} producer${identifiedProducers === 1 ? "" : "s"}`}
              title="Producers identified"
              records={PRODUCER_RECORDS.map(({ name, source }) => ({ name, source }))}
            />
            {` identified — ${requiredProducers} required.`}
          </>
        ) : (
          "Set a minimum to evaluate."
        ),
      },
      {
        label: "Volume",
        status: volumeSet ? (volumeAbove ? "Met" : "Not met") : "Not set",
        line: volumeSet
          ? `Combined identified capacity ${num(IDENTIFIED_CAPACITY_TONNES)} t/yr — ${volumeAbove ? "above" : "below"} your minimum of ${num(volume)} ${volumeUnitLabel(volume, thresholds.volumeUnit)}.`
          : "Set a volume to evaluate.",
      },
    ];
  })();


  const metCount = rows.filter((row) => row.status === "Met").length;
  const notMetCount = rows.filter((row) => row.status === "Not met").length;
  const notSetCount = rows.filter((row) => row.status === "Not set").length;
  const verdict =
    notMetCount > 0
      ? "Does not meet your requirements"
      : notSetCount > 0
        ? "Incomplete — set remaining thresholds"
        : "Meets your requirements";
  const verdictClass =
    notMetCount > 0 ? "text-destructive" : notSetCount > 0 ? "text-muted-foreground" : "text-success";
  const countLine =
    notSetCount === rows.length
      ? null
      : [
          metCount > 0 ? `${metCount} met` : null,
          notMetCount > 0 ? `${notMetCount} not met` : null,
          notSetCount > 0 ? `${notSetCount} not set` : null,
        ]
          .filter(Boolean)
          .join(" · ");


  const renderInput = (label: string) => {
    switch (label) {
      case "Applications":
        return <MultiSelectChips label="applications" options={applications} values={thresholds.applications} onChange={(value) => patch("applications", value)} />;
      case "TRL range":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input aria-label="TRL from" type="number" min={1} max={9} placeholder="From" value={thresholds.trlFrom} onChange={(event) => patch("trlFrom", event.target.value)} className="h-9 bg-background text-xs" />
            <Input aria-label="TRL to" type="number" min={1} max={9} placeholder="To" value={thresholds.trlTo} onChange={(event) => patch("trlTo", event.target.value)} className="h-9 bg-background text-xs" />
          </div>
        );
      case "Product geography":
        return <MultiSelectChips label="product geography" options={GEOGRAPHY_OPTIONS} values={thresholds.materialGeographies} onChange={(value) => patch("materialGeographies", value)} />;
      case "Feedstock geography":
        return <MultiSelectChips label="feedstock geography" options={GEOGRAPHY_OPTIONS} values={thresholds.feedstockGeographies} onChange={(value) => patch("feedstockGeographies", value)} />;
      case "Price ceiling":
        return (
          <div className="grid grid-cols-[1fr_88px] gap-2">
            <Input type="number" min={0} placeholder="Amount" value={thresholds.priceCeiling} onChange={(event) => patch("priceCeiling", event.target.value)} className="h-9 bg-background text-xs" />
            <Select value={thresholds.currency} onValueChange={(value) => patch("currency", value)}><SelectTrigger className="h-9 bg-background text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EUR">EUR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent></Select>
          </div>
        );
      case "Producers":
        return (
          <div className="flex h-9 items-center rounded-md border border-input bg-background">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => patch("minimumProducers", String(Math.max(0, (Number(thresholds.minimumProducers) || 0) - 1)))} aria-label="Decrease minimum producers"><Minus className="h-3.5 w-3.5" /></Button>
            <Input aria-label="Minimum number of producers" type="number" min={0} placeholder="Minimum" value={thresholds.minimumProducers} onChange={(event) => patch("minimumProducers", event.target.value)} className="h-8 border-0 bg-transparent px-1 text-center text-xs shadow-none focus-visible:ring-0" />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => patch("minimumProducers", String((Number(thresholds.minimumProducers) || 0) + 1))} aria-label="Increase minimum producers"><Plus className="h-3.5 w-3.5" /></Button>
          </div>
        );
      case "Volume":
        return (
          <div className="grid grid-cols-[1fr_118px] gap-2">
            <Input type="number" min={0} placeholder="Volume" value={thresholds.requiredVolume} onChange={(event) => patch("requiredVolume", event.target.value)} className="h-9 bg-background text-xs" />
            <Select value={thresholds.volumeUnit} onValueChange={(value) => patch("volumeUnit", value)}><SelectTrigger className="h-9 bg-background text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tonnes/year">tonnes/year</SelectItem><SelectItem value="kg/year">kg/year</SelectItem><SelectItem value="kt/year">kt/year</SelectItem></SelectContent></Select>
          </div>
        );
      default:
        return null;
    }
  };

  const anyThresholdSet = rows.some((row) => row.status !== "Not set");


  return (
    <div className="mt-5 space-y-6">
      <div className="px-1">
        <p className={cn("text-base font-semibold", verdictClass)}>{verdict}</p>
        {countLine && <p className="mt-1 text-sm text-muted-foreground">{countLine}</p>}
      </div>
      <section className="overflow-hidden rounded-lg border border-border bg-card" aria-label="Threshold criteria">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={cn(
              "grid min-h-[56px] grid-cols-[130px_264px_minmax(0,1fr)_84px] items-center gap-4 px-5 py-2",
              index !== rows.length - 1 && "border-b border-border",
            )}
          >
            <div className="truncate whitespace-nowrap text-xs text-foreground">{row.label}</div>
            <div>{renderInput(row.label)}</div>
            <p className="text-xs text-muted-foreground">{row.line}</p>
            <div className="flex justify-end">
              <Badge variant="outline" className={cn("text-[10px]", statusClasses[row.status])}>{row.status}</Badge>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-end border-t border-border px-5 py-3">
          {showSaved ? (
            <span className="text-xs text-muted-foreground">Thresholds saved.</span>
          ) : (
            <Button
              disabled={!anyThresholdSet}
              onClick={() => setShowSaved(true)}
              className="h-9 bg-foreground text-xs text-background hover:bg-foreground/90"
            >
              Save thresholds
            </Button>
          )}
        </div>
      </section>


      <Sheet open={evidence !== null} onOpenChange={(open) => !open && setEvidence(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-sm">{evidence?.title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 divide-y divide-border">
            {evidence?.records.map((record) => (
              <div key={record.name} className="py-3">
                <div className="text-xs font-semibold text-foreground">{record.name}</div>
                <p className="mt-0.5 text-xs text-muted-foreground">Source: {record.source}</p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Shortlisted items</h3>

        <ShortlistCard label="Pathways" count={shortlistPathways.length} defaultOpen>
          <PathwayShortlistRows
            pathways={shortlistPathways}
            notes={pathwayNotes}
            currentUser={CURRENT_REVIEWER}
            onAddNote={addPathwayNote}
            onRemove={removePathway}
          />
        </ShortlistCard>


        <ShortlistCard label="Companies" count={shortlistCompanies.length}>
          <CompanyShortlistTables
            companies={shortlistCompanies}
            currentUser={CURRENT_REVIEWER}
            onRemove={removeCompany}
          />
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