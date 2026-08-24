import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, FolderPlus } from "lucide-react";
import type { MaterialRole } from "@/types/materialPrioritisation";
import { MATERIAL_ROLE_LABEL } from "@/types/materialPrioritisation";

export type MaterialObjective = "Source" | "Produce" | "Valorise";
/** Two different acts. Coverage is research we do; portfolio is internal tracking. */
export type MaterialAddIntent = "coverage" | "portfolio";

interface MaterialAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (value: string) => void;
  synonyms: string;
  onSynonymsChange: (value: string) => void;
  objective: MaterialObjective | "";
  onObjectiveChange: (value: MaterialObjective) => void;
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

const OBJECTIVES: { value: MaterialObjective; label: string; description: string }[] = [
  { value: "Source", label: "Source", description: "Find suppliers" },
  { value: "Produce", label: "Produce", description: "Manufacture" },
  { value: "Valorise", label: "Valorise", description: "Utilise waste" },
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

export default function MaterialAddDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  synonyms,
  onSynonymsChange,
  objective,
  onObjectiveChange,
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
            <Input
              id="material-add-name"
              placeholder="e.g. Lactic Acid"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              className="border-2 border-success/20 focus:border-success/40 rounded-md h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="material-add-synonyms" className="text-sm font-semibold">Material synonyms</Label>
            <Input
              id="material-add-synonyms"
              placeholder="e.g. common names, abbreviations..."
              value={synonyms}
              onChange={(event) => onSynonymsChange(event.target.value)}
              className="border-2 border-success/20 focus:border-success/40 rounded-md h-9"
            />
            <p className="text-xs text-muted-foreground">Separate multiple synonyms with commas</p>
          </div>

          {/* Objective belongs to coverage only. */}
          {effectiveIntent === "coverage" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Select my objective *</Label>
              <div className="grid grid-cols-3 gap-2">
                {OBJECTIVES.map((option) => {
                  const isSelected = objective === option.value;
                  const selectedBorder = option.value === "Source"
                    ? "border-primary bg-primary/10"
                    : option.value === "Produce"
                      ? "border-application-purple bg-application-purple/10"
                      : "border-success bg-success/10";
                  const selectedText = option.value === "Source"
                    ? "text-primary"
                    : option.value === "Produce"
                      ? "text-application-purple"
                      : "text-success";

                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant="ghost"
                      onClick={() => onObjectiveChange(option.value)}
                      className={`h-auto flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all hover:bg-background ${
                        isSelected ? selectedBorder : "border-border/40 bg-background hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className={`text-sm font-semibold ${isSelected ? selectedText : "text-foreground"}`}>
                        {option.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{option.description}</span>
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
                (isPortfolio ? !role : !objective)
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
