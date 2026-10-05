import { useRef, useState } from "react";
import { Info, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type PriceMethod = "Reported" | "Derived" | "Derived + estimated" | "Estimated";
export type AvailabilityMethod = "Reported" | "Summed" | "Summed + estimated" | "Estimated";
export type IndicatorMethod = PriceMethod | AvailabilityMethod;

export interface IndicatorMeta {
  method: IndicatorMethod | null;
  justification: string | null;
  asOf: string | null;
  sources?: IndicatorSourceRef[] | null;
}

export interface IndicatorSourceRef { url: string; title: string | null; snippet: string | null; year: string | null }

const hostOf = (url: string) => { try { return new URL(url).hostname; } catch { return url; } };
export const sourceDomain = (url: string) => hostOf(url).replace(/^www\./, "");
export const faviconUrl = (url: string) => `https://www.google.com/s2/favicons?sz=32&domain=${hostOf(url)}`;
export function sourceTitle(src: IndicatorSourceRef): string {
  if (src.title) return src.title;
  let segs: string[] = [];
  try { segs = new URL(src.url).pathname.split("/").filter(Boolean); } catch { /* ignore */ }
  const last = segs[segs.length - 1];
  if (!last) return sourceDomain(src.url);
  const t = decodeURIComponent(last).split("?")[0].replace(/\.[a-z0-9]+$/i, "").replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : sourceDomain(src.url);
}
const dedupe = (list: IndicatorSourceRef[]) => list.filter((s, i) => list.findIndex(o => o.url === s.url) === i);

const PRODUCT_PRICE_URLS = [
  "https://www.indexbox.io/store/european-union-2-ethyl-anthraquinone-market-analysis-forecast-size-trends-and-insights/",
  "https://www.seair.co.in/ethyl-anthraquinone-import-data.aspx",
  "https://www.eximpedia.app/products/anthraquinone-import-export-data",
  "https://www.sigmaaldrich.com/IT/it/product/aldrich/e12206",
  "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/01-99/ch29-2026-eng.pdf",
  "https://www.zauba.com/import-ANTHRAQUINONE-hs-code.html",
  "https://www.volza.com/p/anthraquinone/import/hsn-code-2914/",
  "https://cymitquimica.com/products/3D-FE31197/84-51-5/2-ethyl-anthraquinone/",
  "https://www.volza.com/p/anthraquinone/import/import-in-india/",
  "https://www.cpachem.com/shop/a/116653/sb49710.100mg",
  "https://cymitquimica.com/products/3D-FE31197/2-ethyl-anthraquinone/",
  "https://www.seair.co.in/anthraquinone-import-data.aspx",
  "https://www.credlix.com/hts-code/2914696000",
  "https://www.tariffcheck.in/hs/29146100",
  "https://www.futuremarketinsights.com/reports/2-ethyl-anthraquinone-market",
];
const bare = (url: string): IndicatorSourceRef => ({ url, title: null, snippet: null, year: null });
const PLACEHOLDER_SOURCES: Record<string, IndicatorSourceRef[]> = {
  "Feedstock price (Europe)": [
    { url: "https://example-tradestats.org/monthly/residue-spot-prices", title: "Monthly spot prices for agricultural residues", snippet: "Dry-mass spot quotes for bulk lots across European markets.", year: "2025" },
    bare("https://example-agrimarkets.net/prices/europe/residues-exw"),
    bare("https://example-tradestats.org/datasets/feedstock_prices_2025.csv"),
  ],
  "Feedstock availability (Europe)": [
    { url: "https://example-journal.net/articles/residue-to-crop-ratios", title: "Residue-to-crop ratios for European cereal systems", snippet: "Peer-reviewed estimates of harvestable residue per hectare.", year: null },
    bare("https://example-agristats.eu/tables/national-residue-volumes"),
    bare("https://example-agristats.eu/tables/cropped-area-2024"),
  ],
  "Product availability (Europe)": [bare("https://example-industryreport.com/fermentation-capacity-europe"), bare("https://example-industryreport.com/global-capacity-outlook")],
  "Market size (EU)": [bare("https://example-industryreport.com/reports/eu-market-value"), bare("https://example-marketwatch.org/eu/producer-prices")],
  "Market size (Global)": [bare("https://example-tradestats.org/global/volumes-2024"), bare("https://example-pricing.net/contract-averages"), bare("https://example-tradestats.org/conversion-factors")],
  "Market growth (EU)": [bare("https://example-industryreport.com/eu-forecast-2024-2029"), bare("https://example-marketwatch.org/growth-tables")],
  "Market growth (Global)": [bare("https://example-journal.net/articles/bio-based-acids-growth"), bare("https://example-marketwatch.org/analogue-markets")],
  "Production TRL": [bare("https://example-industryreport.com/plants/commercial-fermentation"), bare("https://example-journal.net/articles/process-qualification")],
  "Application TRL": [bare("https://example-journal.net/articles/pilot-line-trials"), bare("https://example-pilotnetwork.org/projects/demonstrations")],
};

export const METHOD_DEFINITIONS: Record<IndicatorMethod, string> = {
  Reported: "Value stated directly in a source.",
  Derived: "Calculated from reported inputs. No estimated inputs.",
  "Derived + estimated": "Calculated, with at least one estimated input or conversion factor.",
  Summed: "Sum of reported figures. No estimated terms.",
  "Summed + estimated": "Sum including at least one estimated term.",
  Estimated: "Built from proxy, analogue, allocation or ratio. Screening estimate.",
};

const isEstimated = (m: IndicatorMethod) => m.toLowerCase().includes("estimated");

/** Prototype sample metadata. Rows not listed carry neither method nor justification. */
export const KEY_INDICATOR_META: Record<string, IndicatorMeta> = {
  "Feedstock price (Europe)": {
    method: "Reported" satisfies PriceMethod, asOf: "2025-03",
    justification: "Spot price on a dry mass basis, EXW, quoted for bulk lots in the European market.\nTaken from monthly trade statistics published in 2025. Transport and handling are excluded.",
  },
  "Feedstock availability (Europe)": {
    method: "Summed + estimated" satisfies AvailabilityMethod, asOf: "2024",
    justification: "Sum of national residue volumes on a dry mass basis from 2024 agricultural statistics. Two member states without reported figures were estimated from cropped area and a residue-to-crop ratio from a peer-reviewed study. Competing uses are not deducted.",
  },
  "Product price": {
    method: "Derived" satisfies PriceMethod, asOf: "2025-01",
    justification: "Contract price for pure substance (≥99% grade), EXW Europe. Derived from reported 2025 import unit values in trade statistics, converted from EUR/kg to EUR/t.",
  },
  "Product availability (Europe)": {
    method: "Estimated" satisfies AvailabilityMethod, asOf: "2024",
    justification: "No reported European production figure is available. Volume is allocated from global capacity using Europe's share of installed fermentation capacity from a 2024 industry report. Expressed as pure substance.",
  },
  "Market size (EU)": {
    method: "Reported" satisfies PriceMethod, asOf: "2024",
    justification: "Market value at producer prices, all grades combined, as stated in a 2024 industry report. Includes food, pharmaceutical and polymer applications.",
  },
  "Market size (Global)": {
    method: "Derived + estimated" satisfies PriceMethod, asOf: "2024",
    justification: "Global volume from 2024 trade statistics multiplied by an average contract price. Regions without price data use an estimated conversion factor from European prices. Pure substance basis.",
  },
  "Market growth (EU)": {
    method: "Reported" satisfies PriceMethod, asOf: "2024",
    justification: "Annual growth in market value at producer prices as stated in a 2024 industry report, covering a five-year forecast window. Nominal terms, not inflation-adjusted.",
  },
  "Market growth (Global)": {
    method: "Estimated" satisfies PriceMethod, asOf: "2024",
    justification: "Proxy from the growth of an analogue bio-based acid market reported in a 2023 peer-reviewed study, adjusted to 2024. Value basis, nominal terms.",
  },
  "Production TRL": {
    method: null, asOf: null,
    justification: "TRL 8 on the EU Horizon scale: system complete and qualified. Supported by evidence of continuous commercial-scale fermentation plants operating in 2024 according to an industry report, and process qualification described in a peer-reviewed study.",
  },
  "Application TRL": {
    method: null, asOf: null,
    justification: "TRL 7 on the EU Horizon scale: system prototype demonstrated in an operational environment. Supported by 2024 pilot-line trials described in a peer-reviewed study. No qualified commercial product yet identified.",
  },
};

Object.entries(KEY_INDICATOR_META).forEach(([label, meta]) => {
  meta.sources = !meta.justification ? null : label === "Product price" ? PRODUCT_PRICE_URLS.map(bare) : PLACEHOLDER_SOURCES[label] ?? null;
});

function Favicon({ url, className }: { url: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] uppercase text-muted-foreground", className)}>{sourceDomain(url)[0]}</span>;
  return <img src={faviconUrl(url)} alt="" onError={() => setFailed(true)} className={cn("h-4 w-4 shrink-0 rounded-full", className)} />;
}

const chipClass = (m: IndicatorMethod) => cn(
  "inline-block whitespace-nowrap rounded-[4px] border border-border bg-transparent px-[6px] py-px text-[11px] font-medium leading-tight text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring",
  isEstimated(m) && "border-dashed",
);

export function MethodChip({ method }: { method: IndicatorMethod }) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} title={METHOD_DEFINITIONS[method]} className={chipClass(method)}>{method}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px] text-xs">{METHOD_DEFINITIONS[method]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function JustificationButton({ label, value, meta }: { label: string; value: string; meta: IndicatorMeta }) {
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  if (!meta.justification) return null;
  const sources = dedupe(meta.sources ?? []);
  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label={`Show justification for ${label}`}
          className={cn("flex h-4 w-4 items-center justify-center text-muted-foreground opacity-40 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 outline-none", open && "opacity-100")}
        >
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent role="dialog" side="left" align="start" collisionPadding={8} className="w-[360px] p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] font-semibold">{label}</span>
            <span className="text-[13px] tabular-nums">{value}</span>
          </div>
          {meta.method && (
            <div className="flex items-start gap-2">
              <span className={chipClass(meta.method)}>{meta.method}</span>
              <span className="text-xs text-muted-foreground">{METHOD_DEFINITIONS[meta.method]}</span>
            </div>
          )}
          {meta.asOf && <span className="text-[11px] text-muted-foreground">As of {meta.asOf}</span>}
          <p className="max-h-[240px] overflow-y-auto whitespace-pre-line text-[13px] leading-[1.5] text-foreground">{meta.justification}</p>
          {meta.method && isEstimated(meta.method) && (
            <span className="text-[11px] text-muted-foreground">Screening estimate. Not a reported figure.</span>
          )}
          {sources.length > 0 && (
            <div className="mt-1 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => { setOpen(false); setDrawer(true); }}
                className="inline-flex h-7 items-center gap-1.5 rounded-[14px] border border-border bg-transparent pl-1.5 pr-2.5 outline-none transition-colors hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span className="flex">
                  {sources.slice(0, 3).map((src, i) => <Favicon key={src.url} url={src.url} className={cn("ring-1 ring-background", i > 0 && "-ml-1.5")} />)}
                </span>
                <span className="text-xs font-medium">Sources · {sources.length}</span>
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
    <Sheet open={drawer} onOpenChange={setDrawer}>
      <SheetContent
        side="right"
        overlayClassName="bg-black/20"
        className="flex w-full flex-col gap-0 p-0 min-[720px]:w-[420px] min-[720px]:max-w-[420px] [&>button:last-child]:hidden"
        onOpenAutoFocus={e => { e.preventDefault(); headerRef.current?.focus(); }}
        onCloseAutoFocus={e => { e.preventDefault(); triggerRef.current?.focus(); }}
      >
        <div ref={headerRef} tabIndex={-1} className="border-b border-border p-4 outline-none">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-semibold">Sources</SheetTitle>
            <button type="button" aria-label="Close" onClick={() => setDrawer(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <SheetDescription className="mt-1 truncate text-xs text-muted-foreground">
            <span className="text-[13px] text-foreground">{label}</span> {value} · {sources.length} sources
          </SheetDescription>
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {sources.map(src => (
            <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer" className="flex gap-2.5 rounded-lg p-3 transition-colors hover:bg-accent">
              <Favicon url={src.url} className="mt-0.5" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[11px] text-muted-foreground">{sourceDomain(src.url)}</span>
                <span className="line-clamp-2 text-[13px] font-medium text-foreground">{sourceTitle(src)}</span>
                {src.snippet && <span className="line-clamp-2 text-xs text-muted-foreground">{src.snippet}</span>}
                {src.year && <span className="text-[11px] text-muted-foreground">{src.year}</span>}
              </span>
            </a>
          ))}
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
