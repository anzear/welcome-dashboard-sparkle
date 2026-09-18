import React, { useEffect, useMemo, useState } from "react";
import { Bookmark, Check, ChevronDown, ChevronsUpDown, Info, MessageSquarePlus, Minus, Pencil, PenLine, Plus, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PREDEFINED_PATHWAYS } from "@/pages/ValueChainPathways";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PathwayShortlistRows, hasGroupableClusters, type PathwayNote, type ShortlistPathway } from "@/components/pathway/PathwayShortlistRows";
import { CompanyShortlistTables, type ShortlistCompany } from "@/components/materialRegister/CompanyShortlistTables";
import { PatentShortlistTable, type ShortlistPatent } from "@/components/materialRegister/PatentShortlistTable";
import { PaperShortlistTable, type ShortlistPaper } from "@/components/materialRegister/PaperShortlistTable";
import { SHORTLIST_COMPANIES, SHORTLIST_PAPERS, SHORTLIST_PATENTS } from "@/components/materialRegister/shortlistMockData";
import BriefGate from "@/components/materialRegister/BriefGate";
// Shared validation checklist store lives in @/lib/pathwayValidationChecklist.
import { useRegister } from "@/components/materialRegister/registerStore";
import { StatusPill } from "@/components/materialRegister/primitives";
import {
  categoryLabel,
  readValidationComments,
  readPathwayValidationStatus,
  seedPathwayValidationStatuses,
  shortlistIdToPathwayIndex,
  type PathwayValidationStatus,
} from "@/lib/pathwayValidationComments";



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
  trlFrom: "4",
  trlTo: "7",
  materialGeographies: ["Europe", "North America"],
  feedstockGeographies: ["Europe"],
  priceCeiling: "2200",
  currency: "EUR",
  minimumProducers: "3",
  requiredVolume: "15000",
  volumeUnit: "tonnes/year",
};


type EvaluationStatus = "Met" | "Not met" | "Not set";

type EvidenceRecord = { name: string; source: string };










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


import { SHORTLIST_COMPANIES, SHORTLIST_PAPERS, SHORTLIST_PATENTS } from "@/components/materialRegister/shortlistMockData";


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
          <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="h-8 w-full justify-between bg-background text-xs font-normal">
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








/** Always expanded — shortlist sections never collapse. */
const ShortlistCard = ({ label, count, total, children, headerAction }: { label: string; count: number; /** When given, the badge reads "count of total". */ total?: number; children: React.ReactNode; headerAction?: React.ReactNode }) => (
  <div className="overflow-hidden rounded-lg border border-border bg-card">
    <div className="flex items-center justify-between px-4 py-3 pr-4">
      <span className="flex items-center gap-2 text-xs">
        <Bookmark className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
        <span className="font-semibold text-foreground">{label}</span>
        <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-[10px] tabular-nums">
          {total === undefined ? count : `${count} of ${total}`}
        </Badge>
      </span>
      {headerAction}
    </div>
    <div className="border-t border-border">{children}</div>
  </div>
);



const PATHWAY_ORDER_KEY = "vcg.workspace.pathwayPriorityOrder";

/** Reorders the shortlist to the stored priority order; unknown/new ids keep their place at the end. */
function applyStoredPathwayOrder(pathways: ShortlistPathway[]): ShortlistPathway[] {
  try {
    const raw = localStorage.getItem(PATHWAY_ORDER_KEY);
    if (!raw) return pathways;
    const order: string[] = JSON.parse(raw);
    if (!Array.isArray(order)) return pathways;
    const ranked = order.filter((id) => pathways.some((pathway) => pathway.id === id));
    return [
      ...ranked.map((id) => pathways.find((pathway) => pathway.id === id)!),
      ...pathways.filter((pathway) => !ranked.includes(pathway.id)),
    ];
  } catch {
    return pathways;
  }
}

function savePathwayOrder(orderedIds: string[]) {
  try {
    localStorage.setItem(PATHWAY_ORDER_KEY, JSON.stringify(orderedIds));
  } catch {
    /* storage unavailable — order stays session-only */
  }
}

const ResearchSpace: React.FC<{ category?: string; topic?: string }> = ({ category, topic }) => {

  const { allMaterials, openId } = useRegister();
  const material = allMaterials.find((item) => item.material_id === openId) ?? null;
  const applications = useMemo(
    () => Array.from(new Set(PREDEFINED_PATHWAYS.map((pathway) => pathway.application))).sort(),
    [],
  );
  const [thresholds, setThresholds] = useState<Thresholds>(INITIAL_THRESHOLDS);
  const [evidence, setEvidence] = useState<{ title: string; records: EvidenceRecord[] } | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, EvaluationStatus>>({});
  const [shortlistPathways, setShortlistPathways] = useState<ShortlistPathway[]>(() =>
    applyStoredPathwayOrder(SHORTLIST_PATHWAYS),
  );
  /** Row order is the priority order, top row highest. Persisted across visits. */
  const reorderPathways = (orderedIds: string[]) => {
    setShortlistPathways((current) =>
      orderedIds
        .map((id) => current.find((pathway) => pathway.id === id))
        .filter((pathway): pathway is ShortlistPathway => !!pathway),
    );
    savePathwayOrder(orderedIds);
  };
  /** All pathways analysed for this material, shortlisted or not. */
  const analysedPathwayTotal = useMemo(() => {
    const name = material?.name?.trim().toLowerCase();
    if (!name) return shortlistPathways.length;
    const matching = PREDEFINED_PATHWAYS.filter(
      (pathway) => pathway.product.trim().toLowerCase() === name,
    ).length;
    return Math.max(matching, shortlistPathways.length);
  }, [material?.name, shortlistPathways.length]);
  /** Grouped-by-applications is an opt-in view, toggled from the card header. Flat is the default. */
  const [pathwaysGrouped, setPathwaysGrouped] = useState(false);
  const [pathwayNotes, setPathwayNotes] = useState<Record<string, PathwayNote[]>>(INITIAL_PATHWAY_NOTES);
  const [shortlistCompanies, setShortlistCompanies] = useState<ShortlistCompany[]>(SHORTLIST_COMPANIES);
  const [shortlistPatents, setShortlistPatents] = useState<ShortlistPatent[]>(SHORTLIST_PATENTS);
  const [shortlistPapers, setShortlistPapers] = useState<ShortlistPaper[]>(SHORTLIST_PAPERS);
  const removePatent = (id: string) =>
    setShortlistPatents((current) => current.filter((patent) => patent.id !== id));
  const removePaper = (id: string) =>
    setShortlistPapers((current) => current.filter((paper) => paper.id !== id));
  const removePathway = (id: string) =>
    setShortlistPathways((current) => current.filter((pathway) => pathway.id !== id));
  const removeCompany = (id: string) =>
    setShortlistCompanies((current) => current.filter((company) => company.id !== id));


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

  /**
   * Validation Space comments on the pathway detail page show up here too, for
   * pathways that are on this shortlist. Read-only mirror, refreshed when a
   * comment is posted or the tab regains focus.
   */
  const [commentTick, setCommentTick] = useState(0);
  useEffect(() => {
    const refresh = () => setCommentTick((n) => n + 1);
    window.addEventListener("pathway-validation-comments-changed", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("pathway-validation-comments-changed", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  /** Seed diverse Validation Space statuses for the demo shortlist on first load. */
  useEffect(() => {
    if (!material?.name) return;
    const indices = shortlistPathways
      .map((p) => shortlistIdToPathwayIndex(p.id))
      .filter((i): i is string => i !== null);
    seedPathwayValidationStatuses(material.name, indices, ['Piloting', 'Lab testing', 'Parked', 'Integrated']);
    setCommentTick((n) => n + 1);
  }, [material?.name]);

  const mergedPathwayNotes = useMemo(() => {
    void commentTick;
    const merged: Record<string, PathwayNote[]> = { ...pathwayNotes };
    shortlistPathways.forEach((pathway) => {
      const index = shortlistIdToPathwayIndex(pathway.id);
      if (index === null) return;
      const validation = readValidationComments(material?.name, index).map((comment) => ({
        id: `validation-${comment.id}`,
        author: comment.author,
        timestamp: comment.createdAt.slice(0, 16).replace("T", " "),
        text: `[${categoryLabel(comment.categoryId)}] ${comment.text}`,
      }));
      if (validation.length === 0) return;
      merged[pathway.id] = [...(merged[pathway.id] ?? []), ...validation];
    });
    return merged;
  }, [pathwayNotes, shortlistPathways, material?.name, commentTick]);

  /** Status each shortlisted pathway got in its Validation Space. */
  const pathwayStatuses = useMemo(() => {
    void commentTick;
    const map: Record<string, PathwayValidationStatus> = {};
    shortlistPathways.forEach((pathway) => {
      const index = shortlistIdToPathwayIndex(pathway.id);
      if (index === null) return;
      map[pathway.id] = readPathwayValidationStatus(material?.name, index);
    });
    return map;
  }, [shortlistPathways, material?.name, commentTick]);

  /**
   * Function progression for the Status card. Read from the primary (top
   * priority) shortlisted pathway's Validation card checkboxes — read-only.
   */
  const validationProgress = useMemo(() => {
    const primary = shortlistPathways[0];
    if (!primary) return undefined;
    return {
      pathwayLabel: `${primary.feedstock} → ${primary.product}`,
      topic: material?.name,
      pathwayId: shortlistIdToPathwayIndex(primary.id) ?? primary.id,
    };
  }, [shortlistPathways, material?.name]);


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

type Row = {
  label: string;
  status: EvaluationStatus;
  helperText: React.ReactNode;
  finding: React.ReactNode;
  findingText: string;
  hasData: boolean;
};

  const scopeApplication = thresholds.applications[0] ?? "";

  const rows: Row[] = (() => {


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

        label: "TRL range",
        status: trlSet ? (trlInRange ? "Met" : "Not met") : "Not set",
        helperText: "Set a TRL range to evaluate.",
        finding: trlSet ? `Pathway at TRL ${PATHWAY_TRL} — ${trlInRange ? "within" : "outside"} your range of ${trlFrom}–${trlTo}.` : null,
        findingText: trlSet ? `Pathway at TRL ${PATHWAY_TRL} — ${trlInRange ? "within" : "outside"} your range of ${trlFrom}–${trlTo}.` : "Awaiting threshold",
        hasData: true,
      },
      {
        label: "Product geography",
        status: thresholds.materialGeographies.length === 0 ? "Not set" : productMatches.length > 0 ? "Met" : "Not met",
        helperText: "Select a geography to evaluate.",
        finding:
          productMatches.length > 0 ? (
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
        findingText: productMatches.length > 0
          ? `${productMatches.length} producer${productMatches.length === 1 ? "" : "s"} identified in ${listGeographies(thresholds.materialGeographies)}.`
          : `No producer identified in ${listGeographies(thresholds.materialGeographies)}.`,
        hasData: true,
      },
      {
        label: "Feedstock geography",
        status: thresholds.feedstockGeographies.length === 0 ? "Not set" : feedstockMatches.length > 0 ? "Met" : "Not met",
        helperText: "Select a geography to evaluate.",
        finding:
          feedstockMatches.length > 0 ? (
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
        findingText: feedstockMatches.length > 0
          ? `${feedstockMatches.length} verified feedstock supplier${feedstockMatches.length === 1 ? "" : "s"} identified in ${listGeographies(thresholds.feedstockGeographies)}.`
          : `No verified feedstock supplier identified in ${listGeographies(thresholds.feedstockGeographies)}.`,
        hasData: true,
      },
      {
        label: "Price ceiling",
        status: priceSet ? (priceBelow ? "Met" : "Not met") : "Not set",
        helperText: "Set a ceiling to evaluate.",
        finding: (
          <>
            <EvidenceLink
              label={`Indicative price EUR ${num(INDICATIVE_PRICE_EUR)}/t`}
              title="Price points"
              records={PRICE_RECORDS}
            />
            {` — ${priceBelow ? "below" : "above"} your ceiling of ${thresholds.currency} ${num(ceiling)}/t.`}
          </>
        ),
        findingText: `Indicative price EUR ${num(INDICATIVE_PRICE_EUR)}/t — ${priceBelow ? "below" : "above"} your ceiling of ${thresholds.currency} ${num(ceiling)}/t.`,
        hasData: true,
      },
      {
        label: "Producers",
        status: producersSet ? (identifiedProducers >= requiredProducers ? "Met" : "Not met") : "Not set",
        helperText: "Set a minimum to evaluate.",
        finding: (
          <>
            <EvidenceLink
              label={`${identifiedProducers} producer${identifiedProducers === 1 ? "" : "s"}`}
              title="Producers identified"
              records={PRODUCER_RECORDS.map(({ name, source }) => ({ name, source }))}
            />
            {` identified — ${requiredProducers} required.`}
          </>
        ),
        findingText: `${identifiedProducers} producer${identifiedProducers === 1 ? "" : "s"} identified — ${requiredProducers} required.`,
        hasData: true,
      },
      {
        label: "Volume",
        status: volumeSet ? (volumeAbove ? "Met" : "Not met") : "Not set",
        helperText: "Set a volume to evaluate.",
        finding: `Combined identified capacity ${num(IDENTIFIED_CAPACITY_TONNES)} t/yr — ${volumeAbove ? "above" : "below"} your minimum of ${num(volume)} ${volumeUnitLabel(volume, thresholds.volumeUnit)}.`,
        findingText: `Combined identified capacity ${num(IDENTIFIED_CAPACITY_TONNES)} t/yr — ${volumeAbove ? "above" : "below"} your minimum of ${num(volume)} ${volumeUnitLabel(volume, thresholds.volumeUnit)}.`,
        hasData: true,
      },
    ];
  })();


  const effectiveStatus = (row: { label: string; status: EvaluationStatus }) =>
    overrides[row.label] ?? row.status;

  const metCount = rows.filter((row) => effectiveStatus(row) === "Met").length;
  const notMetCount = rows.filter((row) => effectiveStatus(row) === "Not met").length;
  const notSetCount = rows.filter((row) => effectiveStatus(row) === "Not set").length;
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
      case "TRL range":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input aria-label="TRL from" type="number" min={1} max={9} placeholder="From" value={thresholds.trlFrom} onChange={(event) => patch("trlFrom", event.target.value)} className="h-8 bg-background text-xs" />
            <Input aria-label="TRL to" type="number" min={1} max={9} placeholder="To" value={thresholds.trlTo} onChange={(event) => patch("trlTo", event.target.value)} className="h-8 bg-background text-xs" />
          </div>
        );
      case "Product geography":
        return <MultiSelectChips label="product geography" options={GEOGRAPHY_OPTIONS} values={thresholds.materialGeographies} onChange={(value) => patch("materialGeographies", value)} />;
      case "Feedstock geography":
        return <MultiSelectChips label="feedstock geography" options={GEOGRAPHY_OPTIONS} values={thresholds.feedstockGeographies} onChange={(value) => patch("feedstockGeographies", value)} />;
      case "Price ceiling":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input aria-label="Price ceiling" type="number" min={0} placeholder="Amount" value={thresholds.priceCeiling} onChange={(event) => patch("priceCeiling", event.target.value)} className="h-8 bg-background text-xs" />
            <Select value={thresholds.currency} onValueChange={(value) => patch("currency", value)}><SelectTrigger className="h-8 bg-background text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EUR">EUR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent></Select>
          </div>
        );
      case "Producers":
        return (
          <div className="flex h-8 items-center rounded-md border border-input bg-background">
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-none" onClick={() => patch("minimumProducers", String(Math.max(0, (Number(thresholds.minimumProducers) || 0) - 1)))} aria-label="Decrease minimum producers"><Minus className="h-3.5 w-3.5" /></Button>
            <Input aria-label="Minimum number of producers" type="number" min={0} placeholder="Minimum" value={thresholds.minimumProducers} onChange={(event) => patch("minimumProducers", event.target.value)} className="h-7 border-0 bg-transparent px-1 text-center text-xs shadow-none focus-visible:ring-0" />
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-none" onClick={() => patch("minimumProducers", String((Number(thresholds.minimumProducers) || 0) + 1))} aria-label="Increase minimum producers"><Plus className="h-3.5 w-3.5" /></Button>
          </div>
        );
      case "Volume":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input aria-label="Volume" type="number" min={0} placeholder="Volume" value={thresholds.requiredVolume} onChange={(event) => patch("requiredVolume", event.target.value)} className="h-8 bg-background text-xs" />
            <Select value={thresholds.volumeUnit} onValueChange={(value) => patch("volumeUnit", value)}><SelectTrigger className="h-8 bg-background text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tonnes/year">tonnes/year</SelectItem><SelectItem value="kg/year">kg/year</SelectItem><SelectItem value="kt/year">kt/year</SelectItem></SelectContent></Select>
          </div>
        );
      default:
        return null;
    }
  };


  const anyThresholdSet = rows.some((row) => row.status !== "Not set");

  const companyDataFilled = material
    ? [material.annual_spend, material.annual_volume, material.ghg_contribution].filter(
        (value) => value !== null && value !== undefined,
      ).length
    : 0;
  const techFitUploaded = Boolean(material?.performance_targets_document);
  const registrationCount = material?.regulatory_registrations?.length ?? 0;
  const requirementsSet = rows.filter((row) => row.status !== "Not set").length;

  return (
    <div className="mt-5 space-y-6">
      <div className="flex items-stretch divide-x divide-border rounded-lg border border-border/70 bg-card px-4 py-2 shadow-sm">
        <div className="flex-1 pr-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Gate status</div>
          <div className="mt-0.5">
            <StatusPill status={material?.journey_status ?? "not_started"} />
          </div>
        </div>
        <div className="flex-1 px-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Company data</div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">{companyDataFilled} of 3 filled</div>
          <div className="text-[11px] text-muted-foreground">
            {techFitUploaded ? "Tech fit ✓" : "Tech fit –"} · {registrationCount} registration{registrationCount === 1 ? "" : "s"}
          </div>
        </div>
        <div className="flex-1 px-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Requirements</div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">{requirementsSet} of 6 set</div>
          <div className="text-[11px] text-muted-foreground">{metCount} met · {notMetCount} not met</div>
        </div>
        <div className="flex-1 pl-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Shortlisted</div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-foreground">
            <span>Pathways <span className="font-semibold">{shortlistPathways.length}</span></span>
            <span>Companies <span className="font-semibold">{shortlistCompanies.length}</span></span>
            <span>Patents <span className="font-semibold">{shortlistPatents.length}</span></span>
            <span>Papers <span className="font-semibold">{shortlistPapers.length}</span></span>
          </div>
        </div>
      </div>

      {material && (
        <section className="space-y-2 rounded-xl border border-border/70 bg-card p-3 shadow-sm">
          <div className="border-b border-border/70 pb-1">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Status</h2>
            <p className="pt-0.5 text-xs leading-snug text-muted-foreground">Set by the owner.</p>
          </div>
          <BriefGate material={material} validation={validationProgress} />
        </section>
      )}

      {countLine && <p className="text-xs text-muted-foreground">{countLine}</p>}

      <div className="overflow-hidden rounded-lg border border-border bg-card" aria-label="Threshold criteria">
          <div className="grid grid-cols-[55%_1fr_150px] border-b border-border">
            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground">Your requirements</div>
            <div className="col-span-2 border-l border-border px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-help items-center gap-1">
                      VCG.AI signal
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Shows how VCG.AI data compares against your requirements.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {rows.map((row) => {
            const overridden = overrides[row.label] !== undefined;
            const shown = overrides[row.label] ?? row.status;
            const displayText = overridden
              ? "Manually overridden"
              : !row.hasData
                ? "No data available"
                : row.status === "Not set"
                  ? "Awaiting threshold"
                  : row.findingText;
            const displayNode = overridden
              ? "Manually overridden"
              : !row.hasData
                ? "No data available"
                : row.status === "Not set"
                  ? "Awaiting threshold"
                  : row.finding;
            return (
              <div key={row.label} className="grid grid-cols-[55%_1fr_150px] border-b border-border">
                <div className="flex h-11 items-center gap-3 px-4">
                  <span className="w-[140px] shrink-0 truncate text-xs text-foreground">{row.label}</span>
                  <div className="min-w-0 flex-1">{renderInput(row.label)}</div>
                </div>
                <div className="flex h-11 items-center border-l border-border px-4 overflow-hidden">
                  <span className="block w-full truncate text-xs text-muted-foreground" title={displayText}>
                    {displayNode}
                  </span>
                </div>
                <div className="flex h-11 items-center justify-end gap-2 border-l border-border px-4">
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-[10px]",
                      overridden
                        ? cn(statusClasses[shown], "border-dashed")
                        : row.hasData
                          ? statusClasses[row.status]
                          : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {overridden || row.hasData ? shown : "No data"}
                  </Badge>
                  <DropdownMenu>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              aria-label={`Manual override for ${row.label}`}
                            >
                              <PenLine className={cn("h-3.5 w-3.5", overridden ? "text-primary" : "text-muted-foreground")} />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>{overridden ? "Manually overridden — click to change" : "Manual override"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DropdownMenuContent align="end" className="w-44">
                      {(["Met", "Not met", "Not set"] as EvaluationStatus[]).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          className="text-xs"
                          onSelect={() => setOverrides((prev) => ({ ...prev, [row.label]: status }))}
                        >
                          {status}
                          {overrides[row.label] === status && <Check className="ml-auto h-3 w-3" />}
                        </DropdownMenuItem>
                      ))}
                      {overridden && (
                        <DropdownMenuItem
                          className="text-xs text-muted-foreground"
                          onSelect={() =>
                            setOverrides((prev) => {
                              const next = { ...prev };
                              delete next[row.label];
                              return next;
                            })
                          }
                        >
                          Clear override
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}

          <div className="col-span-3 flex h-11 items-center justify-end px-4">
            {showSaved ? (
              <span className="text-xs text-muted-foreground">Thresholds saved.</span>
            ) : (
              <Button
                disabled={!anyThresholdSet}
                onClick={() => setShowSaved(true)}
                className="h-8 bg-foreground text-xs text-background hover:bg-foreground/90"
              >
                Save thresholds
              </Button>
            )}
          </div>
      </div>

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

        <ShortlistCard
          label="Pathways"
          count={shortlistPathways.length}
          total={analysedPathwayTotal}
          headerAction={
            hasGroupableClusters(shortlistPathways) ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-[10px] font-normal"
                onClick={() => setPathwaysGrouped((current) => !current)}
              >
                <ChevronDown className={pathwaysGrouped ? "h-3 w-3 -rotate-90" : "h-3 w-3"} />
                {pathwaysGrouped ? "Expand applications" : "Collapse applications"}
              </Button>
            ) : undefined
          }
        >
          <PathwayShortlistRows
            pathways={shortlistPathways}
            notes={mergedPathwayNotes}
            statuses={pathwayStatuses}
            currentUser={CURRENT_REVIEWER}
            onAddNote={addPathwayNote}
            onRemove={removePathway}
            onReorder={reorderPathways}
            grouped={pathwaysGrouped}
            category={category}
            topic={topic}
          />

        </ShortlistCard>


        <ShortlistCard label="Companies" count={shortlistCompanies.length}>
          <CompanyShortlistTables
            companies={shortlistCompanies}
            currentUser={CURRENT_REVIEWER}
            onRemove={removeCompany}
          />
        </ShortlistCard>


        <ShortlistCard label="Patents" count={shortlistPatents.length}>
          <PatentShortlistTable
            patents={shortlistPatents}
            currentUser={CURRENT_REVIEWER}
            onRemove={removePatent}
          />
        </ShortlistCard>

        <ShortlistCard label="Papers" count={shortlistPapers.length}>
          <PaperShortlistTable
            papers={shortlistPapers}
            currentUser={CURRENT_REVIEWER}
            onRemove={removePaper}
          />
        </ShortlistCard>
      </section>

    </div>
  );
};

export default ResearchSpace;
