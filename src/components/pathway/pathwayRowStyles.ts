/**
 * Shared row styling for pathway node rows (Pathway Explorer treatment).
 * Kept in one place so the shortlist rows and the explorer rows stay identical.
 */
export const getTRLNumber = (trl: string) => parseInt(trl.replace("TRL ", ""), 10);

/** A pathway with no TRL is unknown — never 0 and never a band. */
export const hasTRL = (trl?: string) => !!trl && !Number.isNaN(getTRLNumber(trl));

export const getViability = (trl?: string) => {
  if (!hasTRL(trl)) return null;
  const n = getTRLNumber(trl as string);
  if (n >= 9) return "Commercial";
  if (n >= 5) return "Pilot";
  return "Lab";
};

export const getViabilityColor = (viability: string | null) => {
  switch (viability) {
    case "Commercial":
      return { text: "text-green-700", bg: "bg-green-50", border: "border-green-200" };
    case "Pilot":
      return { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" };
    case "Lab":
      return { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
    default:
      return { text: "text-muted-foreground", bg: "bg-muted", border: "border-border" };
  }
};

export const BAND_LABEL: Record<string, string> = {
  Commercial: "COMMERCIAL",
  Pilot: "PILOT TO SCALE-UP",
  Lab: "LAB TO PILOT",
};

/** Node chip class, identical to the Pathway Explorer table rows. */
export const pathwayChipCls = (extra = "") =>
  `text-[10px] font-medium truncate border rounded-md px-2 py-2 text-center ${extra}`;

export const PATHWAY_CHIP_NEUTRAL = "border-border bg-background text-foreground";
/** Anchor (product) node: the explorer's reserved emerald fill. */
export const PATHWAY_CHIP_ANCHOR = "border-emerald-300 bg-emerald-50 text-emerald-800";
