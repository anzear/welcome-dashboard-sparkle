import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, FolderPlus, ArrowRight, ArrowLeft } from "lucide-react";
import type { MaterialRole } from "@/types/materialPrioritisation";
import { MATERIAL_ROLE_LABEL } from "@/types/materialPrioritisation";
import { materials as portfolioMaterials } from "@/data/materialPrioritisationMock";
import { readPortfolioAdditions } from "@/lib/portfolioAdditions";
import { VCG_DATABASE_MATERIALS } from "@/data/vcgMaterialDatabase";

/** Pathway node position the run starts from. Same run, different entry point. */
export type MaterialRunAs = "Feedstock" | "Material";
/** Two different acts. Coverage is research we do; portfolio is internal tracking. */
export type MaterialAddIntent = "coverage" | "portfolio";

interface MaterialAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (value: string) => void;
  runAs: MaterialRunAs | "";
  onRunAsChange: (value: MaterialRunAs) => void;
  /** Omitted on legacy coverage-only callers, which keep the old single path. */
  intent?: MaterialAddIntent | "";
  onIntentChange?: (value: MaterialAddIntent) => void;
  role?: MaterialRole | "";
  onRoleChange?: (value: MaterialRole) => void;
  /** Requests coverage for the material. */
  onSubmit: () => void;
  /** Adds the material to the Material Portfolio, without coverage. */
  onSubmitPortfolio?: () => void;
  onCancel: () => void;
}

const RUN_AS: { value: MaterialRunAs; label: string; description: string; Icon: typeof ArrowRight }[] = [
  {
    value: "Feedstock",
    label: "Feedstock",
    description: "The input a pathway starts from. Run this way to see what can be made from it.",
    Icon: ArrowRight,
  },
  {
    value: "Material",
    label: "Material",
    description: "The output a pathway arrives at. Run this way to see what it can be made from.",
    Icon: ArrowLeft,
  },
];

const ROLES: { value: MaterialRole; description: string }[] = [
  { value: "existing", description: "You buy or use it today" },
  { value: "new", description: "You are considering it" },
];

const INTENTS: { value: MaterialAddIntent; label: string; description: string }[] = [
  {
    value: "coverage",
    label: "Request coverage",
    description: "VCG researches this material and builds its brief",
  },
  {
    value: "portfolio",
    label: "Add to portfolio",
    description: "Track this material internally, without coverage",
  },
];

/** Materials the system already knows: portfolio rows, covered materials, VCG database. */
type KnownState = "portfolio" | "available" | "active" | "database";
interface KnownMaterial {
  name: string;
  state: KnownState;
  /** Pathway node position, used to build the brief link for covered materials. */
  category?: "feedstock" | "product";
}

const KNOWN_STATE_LABEL: Record<KnownState, string> = {
  portfolio: "In your portfolio",
  active: "Coverage active",
  available: "Coverage available",
  database: "In our database",
};


function readCoveredMaterials(): KnownMaterial[] {
  const out: KnownMaterial[] = [];
  (["feedstock", "product"] as const).forEach((category) => {
    try {
      const raw = JSON.parse(window.localStorage.getItem(`portfolio_${category}`) || "[]");
      if (!Array.isArray(raw)) return;
      raw.forEach((item: unknown) => {
        const name = typeof item === "string" ? item : (item as { name?: string })?.name;
        if (name && name.trim()) out.push({ name: name.trim(), state: "active", category });
      });
    } catch {
      /* nothing stored yet */
    }
  });
  return out;
}

function knownMaterials(): KnownMaterial[] {
  const byName = new Map<string, KnownMaterial>();
  const put = (entry: KnownMaterial) => {
    const key = entry.name.toLowerCase();
    const existing = byName.get(key);
    // Coverage state wins over plain tracking: it is the stronger fact.
    if (!existing || (existing.state === "portfolio" && entry.state !== "portfolio")) {
      byName.set(key, { ...existing, ...entry });
    }
  };
  portfolioMaterials.forEach((m) =>
    put({ name: m.name, state: m.coverage_available ? "available" : "portfolio" }),
  );
  readPortfolioAdditions().forEach((a) => put({ name: a.name, state: "portfolio" }));
  readCoveredMaterials().forEach((c) => put(c));
  return [...byName.values()];
}

export default function MaterialAddDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  runAs = "",
  onRunAsChange,
  intent = "",
  onIntentChange,
  role = "",
  onRoleChange,
  onSubmit,
  onSubmitPortfolio,
  onCancel,
}: MaterialAddDialogProps) {
  const dualPath = Boolean(onSubmitPortfolio && onIntentChange && onRoleChange);
  const effectiveIntent = dualPath ? intent : "coverage";
  const isPortfolio = effectiveIntent === "portfolio";

  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const known = useMemo(() => (open ? knownMaterials() : []), [open]);

  const query = name.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (!suggestionsOpen || query.length < 2) return [];
    return known
      .filter((k) => k.name.toLowerCase().includes(query) && k.name.toLowerCase() !== query)
      .slice(0, 6);
  }, [known, query, suggestionsOpen]);

  /** An exact match tells us whether this act is already done for that material. */
  const match = known.find((k) => k.name.toLowerCase() === query) || null;
  const coverageBlocked = !isPortfolio && match?.state === "active";
  const portfolioBlocked =
    isPortfolio && (match?.state === "portfolio" || match?.state === "available");
  const briefHref = match
    ? `/landscape/${match.category || "product"}/${encodeURIComponent(match.name)}/material-brief`
    : "#";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-[42rem] max-w-[calc(100vw-2rem)] p-8 bg-gradient-to-br from-card to-card/95 border border-border/40 shadow-xl">
        <DialogHeader className="space-y-3 -mb-2">
          <DialogTitle className="text-2xl font-semibold text-foreground">Add Material</DialogTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose what you want to do with this material. Coverage is research we run for you;
            the portfolio is what you track yourself.
          </p>
        </DialogHeader>
        <div className="space-y-4">
          {/* The question comes first: the rest of the form depends on the answer. */}
          {dualPath && (
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">What would you like to do? *</Label>
            <div className="grid grid-cols-2 gap-2">
              {INTENTS.map((option) => {
                const isSelected = intent === option.value;
                const Icon = option.value === "coverage" ? Search : FolderPlus;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="ghost"
                    onClick={() => onIntentChange?.(option.value)}
                    className={`h-auto flex-col items-start gap-1 p-3 rounded-lg border-2 text-left transition-all hover:bg-background whitespace-normal ${
                      isSelected
                        ? "border-success bg-success/10"
                        : "border-border/40 bg-background hover:border-muted-foreground/30"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-success" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-semibold ${isSelected ? "text-success" : "text-foreground"}`}>
                        {option.label}
                      </span>
                    </span>
                    <span className="text-[10px] leading-snug text-muted-foreground">{option.description}</span>
                  </Button>
                );
              })}
            </div>
          </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="material-add-name" className="text-sm font-semibold">Material name *</Label>
            <div className="relative">
              <Input
                id="material-add-name"
                placeholder="e.g. Lactic Acid"
                value={name}
                autoComplete="off"
                onChange={(event) => {
                  onNameChange(event.target.value);
                  setSuggestionsOpen(true);
                }}
                onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
                className="border-2 border-success/20 focus:border-success/40 rounded-md h-9"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-[calc(100%+2px)] max-h-56 overflow-y-auto rounded-md border border-border/60 bg-popover shadow-lg">
                  {suggestions.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        onNameChange(s.name);
                        setSuggestionsOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted/60"
                    >
                      <span className="text-sm text-foreground">{s.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {KNOWN_STATE_LABEL[s.state]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {coverageBlocked && (
              <p className="text-xs text-amber-700">
                Coverage is already active for {match?.name}.{" "}
                <Link to={briefHref} className="underline font-medium">
                  Open its brief
                </Link>
              </p>
            )}
            {portfolioBlocked && (
              <p className="text-xs text-amber-700">
                {match?.name} is already tracked in your portfolio.{" "}
                <Link to="/material-prioritisation" className="underline font-medium">
                  Open it in the register
                </Link>
              </p>
            )}
          </div>

          {/* Run as belongs to coverage only: it is the pathway entry point. */}
          {effectiveIntent === "coverage" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Run as *</Label>
              <div className="grid grid-cols-2 gap-2">
                {RUN_AS.map((option) => {
                  const isSelected = runAs === option.value;
                  const Icon = option.Icon;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant="ghost"
                      onClick={() => onRunAsChange(option.value)}
                      className={`h-auto flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-left whitespace-normal transition-all hover:bg-background ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border/40 bg-background hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {option.label}
                        </span>
                      </span>
                      <span className="text-[10px] leading-snug text-muted-foreground">{option.description}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Role belongs to the portfolio only. Everything else is filled in later. */}
          {isPortfolio && (
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Role *</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((option) => {
                  const isSelected = role === option.value;
                  const selected = option.value === "existing"
                    ? "border-foreground/40 bg-muted"
                    : "border-amber-700/50 bg-amber-500/5";
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant="ghost"
                      onClick={() => onRoleChange?.(option.value)}
                      className={`h-auto flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all hover:bg-background ${
                        isSelected ? selected : "border-border/40 bg-background hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className="text-sm font-semibold text-foreground">
                        {MATERIAL_ROLE_LABEL[option.value]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{option.description}</span>
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                The rest is filled in inside the Material Portfolio.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-9 border-2 rounded-md">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={isPortfolio ? onSubmitPortfolio : onSubmit}
              disabled={
                !effectiveIntent ||
                !name.trim() ||
                coverageBlocked ||
                portfolioBlocked ||
                (isPortfolio ? !role : !runAs)
              }
              className="flex-1 h-9 bg-success hover:bg-success/90 rounded-md text-success-foreground"
            >
              {isPortfolio ? "Add to portfolio" : "Request coverage"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
