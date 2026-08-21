import { cn } from "@/lib/utils";

/**
 * ONE candidate treatment, defined once and reused everywhere.
 * Filled = existing material. Outlined (warm) = replacement candidate.
 * Never violet, never the VCG-computed colour.
 */
export const ROLE_CHIP_BASE =
  "inline-flex items-center whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[10px] font-medium";
export const ROLE_CHIP_EXISTING = "bg-amber-700/10 text-amber-900/80 dark:text-amber-200/80";
export const ROLE_CHIP_CANDIDATE =
  "border border-amber-700/40 bg-transparent text-amber-800/80 dark:text-amber-300/80";

export const roleChipClass = (isExisting: boolean) =>
  cn(ROLE_CHIP_BASE, isExisting ? ROLE_CHIP_EXISTING : ROLE_CHIP_CANDIDATE);

/** Small legend markers matching the same filled/outlined language. */
export const ROLE_MARKER_EXISTING = "inline-block h-2 w-2 rounded-sm bg-amber-700/50";
export const ROLE_MARKER_CANDIDATE =
  "inline-block h-2 w-2 rounded-sm border border-amber-700/50 bg-transparent";

export function RoleChip({
  isExisting,
  children,
  className,
  title,
}: {
  isExisting: boolean;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span className={cn(roleChipClass(isExisting), className)} title={title}>
      {children}
    </span>
  );
}
