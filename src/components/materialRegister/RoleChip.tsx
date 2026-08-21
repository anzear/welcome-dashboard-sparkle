import { cn } from "@/lib/utils";

/**
 * ONE candidate treatment, defined once and reused everywhere.
 * Filled = existing material. Outlined (warm) = replacement candidate.
 * Never violet, never the VCG-computed colour.
 */
export const ROLE_CHIP_BASE =
  "inline-flex items-center whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[10px] font-medium";
export const ROLE_CHIP_EXISTING = "bg-muted text-muted-foreground";
export const ROLE_CHIP_CANDIDATE =
  "border border-amber-700/40 bg-transparent text-amber-800/80 dark:text-amber-300/80";
/** Unset value — quiet grey text, no box or border. */
export const ROLE_CHIP_NOT_SET = "text-muted-foreground/60";

export const roleChipClass = (isExisting: boolean) =>
  cn(ROLE_CHIP_BASE, isExisting ? ROLE_CHIP_EXISTING : ROLE_CHIP_CANDIDATE);

/** Small legend markers matching the same filled/outlined language. */
export const ROLE_MARKER_EXISTING = "inline-block h-2 w-2 rounded-sm bg-muted-foreground/60";
export const ROLE_MARKER_CANDIDATE =
  "inline-block h-2 w-2 rounded-sm border border-amber-700/50 bg-transparent";

export function RoleChip({
  isExisting,
  notSet,
  children,
  className,
  title,
}: {
  isExisting: boolean;
  notSet?: boolean;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const variant = notSet
    ? ROLE_CHIP_NOT_SET
    : isExisting
      ? ROLE_CHIP_EXISTING
      : ROLE_CHIP_CANDIDATE;
  return (
    <span className={cn(ROLE_CHIP_BASE, variant, className)} title={title}>
      {children}
    </span>
  );
}
