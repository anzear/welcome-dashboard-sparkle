import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, FolderPlus, ArrowRight, ArrowLeft } from "lucide-react";
import {
  RunAsPicker,
  CoverageQuestionField,
  type CoverageRunAs,
} from "@/components/coverage/CoverageStep";
import type { MaterialRole } from "@/types/materialPrioritisation";
import { MATERIAL_ROLE_LABEL } from "@/types/materialPrioritisation";
import { materials as portfolioMaterials } from "@/data/materialPrioritisationMock";
import { readPortfolioAdditions } from "@/lib/portfolioAdditions";
import { VCG_DATABASE_MATERIALS } from "@/data/vcgMaterialDatabase";
import { readPendingCoverage } from "@/lib/pendingCoverage";


/** Pathway node position the run starts from. Shared with the coverage step. */
export type MaterialRunAs = CoverageRunAs;
/** Two different acts. Coverage is research we do; portfolio is internal tracking. */
export type MaterialAddIntent = "coverage" | "portfolio";

interface MaterialAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (value: string) => void;
  runAs: MaterialRunAs | "";
  onRunAsChange: (value: MaterialRunAs) => void;
  /** Optional question the coverage should answer — coverage path only. */
  coverageQuestion?: string;
  onCoverageQuestionChange?: (value: string) => void;
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

const ROLES: { value: MaterialRole; description: string }[] = [
  { value: "existing", description: "You buy or use it today" },
  { value: "new", description: "You are considering it" },
];

/** Materials the system already knows: portfolio rows, covered materials, VCG database. */
type KnownState = "portfolio" | "available" | "active" | "database";
interface KnownMaterial {
  name: string;
  state: KnownState;
  /** A coverage request is already in for this material, awaiting set-up. */
  pending?: boolean;
  /** Pathway node position, used to build the brief link for covered materials. */
  category?: "feedstock" | "product";
}

const KNOWN_STATE_LABEL: Record<KnownState, string> = {
  portfolio: "In your portfolio",
  active: "Coverage active",
  available: "Coverage available",
  database: "In our database",
};

/** Pending overrides the displayed state: it is the fact that governs the action. */
const stateLabel = (k: KnownMaterial) =>
  k.pending ? "Coverage requested" : KNOWN_STATE_LABEL[k.state];



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
  // A pending request is a fact about a material, whatever else it is.
  const pendingEntries = readPendingCoverage();
  pendingEntries.forEach((p) => {
    const key = p.name.toLowerCase();
    const existing = byName.get(key);
    byName.set(key, { name: p.name, state: existing?.state ?? "database", ...existing, pending: true });
  });
  const own = [...byName.values()].filter((k) => k.state !== "database" || k.pending);
  const covered = new Set([...byName.keys()]);
  // Database entries only surface where the customer has nothing of their own.
  const database = VCG_DATABASE_MATERIALS.filter((n) => !covered.has(n.toLowerCase())).map(
    (n): KnownMaterial => ({ name: n, state: "database" }),
  );
  return [...own, ...database];

}

const OWN_SUGGESTION_CAP = 6;
const DATABASE_SUGGESTION_CAP = 5;

export default function MaterialAddDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  runAs = "",
  coverageQuestion = "",
  onCoverageQuestionChange,
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
  const { ownSuggestions, dbSuggestions } = useMemo(() => {
    if (!suggestionsOpen || query.length < 2) return { ownSuggestions: [], dbSuggestions: [] };
    const hits = known.filter(
      (k) => k.name.toLowerCase().includes(query) && k.name.toLowerCase() !== query,
    );
    // Closest matches first: a leading match beats a match buried mid-name.
    const closeness = (k: KnownMaterial) =>
      (k.name.toLowerCase().startsWith(query) ? 0 : 1) * 1000 + k.name.length;
    const sortByCloseness = (list: KnownMaterial[]) =>
      [...list].sort((a, b) => closeness(a) - closeness(b));
    return {
      // The customer's own materials always come first and are never crowded out.
      ownSuggestions: sortByCloseness(
        hits.filter((k) => k.state !== "database" || k.pending),
      ).slice(0, OWN_SUGGESTION_CAP),
      dbSuggestions: sortByCloseness(
        hits.filter((k) => k.state === "database" && !k.pending),
      ).slice(0, DATABASE_SUGGESTION_CAP),
    };
  }, [known, query, suggestionsOpen]);


  /** An exact match tells us whether this act is already done for that material. */
  const match = known.find((k) => k.name.toLowerCase() === query) || null;
  // Blocking is independent of the chosen action: it is a fact about the material.
  const coveragePending = Boolean(match?.pending);
  const coverageBlocked = match?.state === "active" || coveragePending;
  const portfolioBlocked = match?.state === "portfolio";
  const briefHref = match
    ? `/landscape/${match.category || "product"}/${encodeURIComponent(match.name)}/material-brief`
    : "#";


  const nameEntered = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-[42rem] max-w-[calc(100vw-2rem)] p-8 bg-gradient-to-br from-card to-card/95 border border-border/40 shadow-xl">
        <DialogHeader className="space-y-3 -mb-2">
          <DialogTitle className="text-2xl font-semibold text-foreground">Add Material</DialogTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Coverage is research we run for you; the portfolio is what you track yourself.
            Start by typing a material.
          </p>
        </DialogHeader>
        <div className="space-y-4">
          {/* STEP 1 — the material comes first. No blocking here: the action is not chosen yet. */}
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
              {ownSuggestions.length + dbSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-[calc(100%+2px)] max-h-72 overflow-y-auto rounded-md border border-border/60 bg-popover shadow-lg">
                  {[
                    ...ownSuggestions,
                    ...dbSuggestions,
                  ].map((s, index) => (
                    <div key={s.name}>
                      {/* Divider marks where the customer's own materials end. */}
                      {index === ownSuggestions.length && ownSuggestions.length > 0 && (
                        <div className="border-t border-border/60 px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/30">
                          From our database
                        </div>
                      )}
                      <button
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
                          {stateLabel(s)}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>

              )}
            </div>
          </div>

          {dualPath ? (
            nameEntered && (() => {
              // STEP 2 — the two actions are a selection, not a submission.
              // Both stay clickable so the user can switch; coverage stays dominant.
              const actionChosen = effectiveIntent === "coverage" || isPortfolio;
              // A material already tracked, or one whose coverage is already
              // active/pending, already carries a role — coverage never re-asks.
              const coverageNeedsRole =
                effectiveIntent === "coverage" && !portfolioBlocked && !coverageBlocked;
              const coverageRoleOk = !coverageNeedsRole || !!role;
              const coverageComplete =
                effectiveIntent === "coverage" && runAs && !coverageBlocked && coverageRoleOk;
              const portfolioComplete = isPortfolio && role && !portfolioBlocked;
              const canConfirm = coverageComplete || portfolioComplete;
              // The hint tells the user what is still missing rather than leaving it blank.
              const missingHint =
                coveragePending && effectiveIntent === "coverage"
                  ? `A coverage request is already in for ${match?.name}.`
                  : coverageBlocked && effectiveIntent === "coverage"
                    ? `Coverage is already active for ${match?.name}.`
                    : portfolioBlocked && isPortfolio
                      ? `${match?.name} is already tracked in your portfolio.`
                      : !actionChosen
                        ? "Choose an action to continue."
                        : effectiveIntent === "coverage" && !runAs
                          ? "Choose how to run it."
                          : effectiveIntent === "coverage" && !coverageRoleOk
                            ? "Choose a role."
                            : isPortfolio && !role
                              ? "Choose a role."
                              : "";

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Button
                        type="button"
                        onClick={() => {
                          onIntentChange?.("coverage");
                        }}
                        className={`w-full h-9 bg-success hover:bg-success/90 rounded-md text-success-foreground ${
                          effectiveIntent === "coverage" ? "ring-2 ring-success/40 ring-offset-1 ring-offset-card" : "opacity-70"
                        }`}
                      >
                        <Search className="w-3.5 h-3.5 mr-1.5" />
                        Request coverage
                      </Button>
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        VCG researches this material and builds its brief.
                      </p>
                      {coveragePending ? (
                        <p className="text-xs text-amber-700">
                          A coverage request is already in for {match?.name}.
                        </p>
                      ) : coverageBlocked ? (
                        <p className="text-xs text-amber-700">
                          Coverage is already active for {match?.name}.{" "}
                          <Link to={briefHref} className="underline font-medium">
                            Open its brief
                          </Link>
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          onIntentChange?.("portfolio");
                          onRunAsChange("" as MaterialRunAs);
                        }}
                        className={`w-full h-9 border-2 rounded-md ${
                          isPortfolio ? "ring-2 ring-foreground/30 ring-offset-1 ring-offset-card" : "opacity-70"
                        }`}
                      >
                        <FolderPlus className="w-3.5 h-3.5 mr-1.5" />
                        Add to portfolio
                      </Button>
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        Track this material internally, without coverage.
                      </p>
                      {portfolioBlocked && (
                        <p className="text-xs text-amber-700">
                          {match?.name} is already tracked in your portfolio.{" "}
                          <Link to="/material-prioritisation" className="underline font-medium">
                            Open it in the register
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* STEP 3 — the shared coverage step, or the portfolio role. */}
                  {effectiveIntent === "coverage" && (
                    <div className="space-y-3">
                      <RunAsPicker value={runAs} onChange={onRunAsChange} />
                      <CoverageQuestionField
                        value={coverageQuestion}
                        onChange={(v) => onCoverageQuestionChange?.(v)}
                      />
                    </div>
                  )}


                  {/* Role — asked on the portfolio path, and on the coverage path
                      when the material is brand new to the portfolio. A material
                      already tracked already carries its role; coverage never re-asks. */}
                  {(isPortfolio || coverageNeedsRole) && (
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
                      {isPortfolio && (
                        <p className="text-xs text-muted-foreground">
                          The rest is filled in inside the Material Portfolio.
                        </p>
                      )}
                    </div>
                  )}

                  {/* FOOTER — Cancel and a confirm button whose label matches the chosen action. */}
                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      className="flex-1 h-9 border-2 rounded-md"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={!canConfirm}
                      onClick={isPortfolio ? onSubmitPortfolio : onSubmit}
                      className="flex-1 h-9 bg-success hover:bg-success/90 rounded-md text-success-foreground disabled:opacity-50"
                    >
                      Confirm
                    </Button>
                  </div>
                  {!canConfirm && missingHint && (
                    <p className="text-xs text-muted-foreground text-center -mt-1">{missingHint}</p>
                  )}
                </div>
              );
            })()
          ) : (
            <>
              {/* Legacy coverage-only caller: the shared coverage step. */}
              <div className="space-y-3">
                <RunAsPicker value={runAs} onChange={onRunAsChange} />
                <CoverageQuestionField
                  value={coverageQuestion}
                  onChange={(v) => onCoverageQuestionChange?.(v)}
                />
              </div>


              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-9 border-2 rounded-md">
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={onSubmit}
                  disabled={!name.trim() || !runAs}
                  className="flex-1 h-9 bg-success hover:bg-success/90 rounded-md text-success-foreground"
                >
                  Request coverage
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
