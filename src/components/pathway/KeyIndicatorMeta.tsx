import { useState } from "react";
import { Info } from "lucide-react";
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
}

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
  if (!meta.justification) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
