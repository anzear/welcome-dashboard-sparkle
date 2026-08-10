import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type MaterialObjective = "Source" | "Produce" | "Valorise";

interface MaterialAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (value: string) => void;
  synonyms: string;
  onSynonymsChange: (value: string) => void;
  objective: MaterialObjective | "";
  onObjectiveChange: (value: MaterialObjective) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const OBJECTIVES: { value: MaterialObjective; label: string; description: string }[] = [
  { value: "Source", label: "Source", description: "Find suppliers" },
  { value: "Produce", label: "Produce", description: "Manufacture" },
  { value: "Valorise", label: "Valorise", description: "Utilise waste" },
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
  onSubmit,
  onCancel,
}: MaterialAddDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-[42rem] max-w-[calc(100vw-2rem)] p-8 bg-gradient-to-br from-card to-card/95 border border-border/40 shadow-xl">
        <DialogHeader className="space-y-3 -mb-2">
          <DialogTitle className="text-2xl font-semibold text-foreground">Add Material</DialogTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Add a material you already know directly into your portfolio. Fill in the brief later.
          </p>
        </DialogHeader>
        <div className="space-y-4">
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

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-9 border-2 rounded-md">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!name.trim() || !objective}
              className="flex-1 h-9 bg-success hover:bg-success/90 rounded-md text-success-foreground"
            >
              Add Material
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
