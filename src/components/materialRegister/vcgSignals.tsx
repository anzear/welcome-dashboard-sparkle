import React from "react";
import { cn } from "@/lib/utils";
import {
  COMPETITOR_ACTIVITY_LABEL,
  formatSupplierAvailability,
  SUBSTITUTABILITY_LABEL,
  type CompetitorActivity,
  type Material,
  type SubstitutabilityReadiness,
  type SupplierAvailability,
} from "@/types/materialPrioritisation";

/**
 * VCG signals — the only place --provenance-vcg is used. These are flags, not
 * intelligence: they say whether something exists, never what it is. Nothing
 * expands, nothing reveals detail on hover. "Not assessed" always renders an em
 * dash: VCG has not run the check, which is never zero and never blank.
 */
export const VCG_RULE = "border-l-2 border-provenance-vcg/70";

const NotAssessed: React.FC<{ title?: string }> = ({ title }) => (
  <span className="font-mono text-[12px] text-muted-foreground/50" title={title ?? "Not assessed by VCG"}>
    —
  </span>
);

export const SubstitutabilityChip: React.FC<{ value: SubstitutabilityReadiness }> = ({ value }) => {
  if (value === "not_assessed") return <NotAssessed />;
  return (
    <span className="inline-flex items-center rounded-sm border border-provenance-vcg/40 bg-provenance-vcg/10 px-1.5 py-0.5 text-[10px] font-medium text-provenance-vcg">
      {SUBSTITUTABILITY_LABEL[value]}
    </span>
  );
};

export const SupplierAvailabilityValue: React.FC<{ value: SupplierAvailability; className?: string }> = ({
  value,
  className,
}) => {
  const text = formatSupplierAvailability(value);
  if (text === null) return <NotAssessed />;
  return (
    <span className={cn("font-mono text-[13px] font-medium tabular-nums text-provenance-vcg", className)}>
      {text}
    </span>
  );
};

export const CompetitorActivityMark: React.FC<{ value: CompetitorActivity; withLabel?: boolean }> = ({
  value,
  withLabel,
}) => {
  if (value === "not_assessed") return <NotAssessed />;
  const detected = value === "detected";
  return (
    <span className="inline-flex items-center gap-1.5" title={COMPETITOR_ACTIVITY_LABEL[value]}>
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full",
          detected ? "bg-provenance-vcg" : "border border-provenance-vcg/60",
        )}
      />
      {withLabel && (
        <span className="text-[11px] text-provenance-vcg">{COMPETITOR_ACTIVITY_LABEL[value]}</span>
      )}
    </span>
  );
};

/** One shared VCG data date per material. */
export const vcgStamp = (m: Material): string => {
  if (!m.vcg_data_date) return "VCG data · date not recorded";
  const d = new Date(m.vcg_data_date);
  const shown = Number.isNaN(d.getTime())
    ? m.vcg_data_date
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `VCG data · ${shown}`;
};

/**
 * VCG signals are not live yet. Until the intelligence layer runs, every place
 * that would show a signal says so plainly instead of showing an empty value:
 * a missing signal and an unbuilt signal are not the same statement.
 */
export const VCG_COMING_SOON = "Coming soon";

export const ComingSoonTag: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <span
    title={title ?? "VCG signals are not live yet"}
    className={cn(
      "inline-flex items-center rounded-sm border border-provenance-vcg/30 bg-provenance-vcg/[0.07] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest text-provenance-vcg/80",
      className,
    )}
  >
    {VCG_COMING_SOON}
  </span>
);

/** Table-cell form: quiet, aligned with the numbers, never mistaken for data. */
export const ComingSoonCell: React.FC = () => (
  <span
    className="text-[10px] uppercase tracking-widest text-provenance-vcg/60"
    title="VCG signals are not live yet"
  >
    Soon
  </span>
);
