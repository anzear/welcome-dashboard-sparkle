import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Target, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegister, UNASSIGNED_OWNER } from "@/components/materialRegister/registerStore";
import type { Material } from "@/types/materialPrioritisation";

/** Entry type — the three values the customer chooses between. */
const INTENTS = [
  { value: "drop_in", label: "Drop-in" },
  { value: "substitution", label: "Substitution" },
  { value: "new_material", label: "New material" },
] as const;

const Req = () => <span className="text-destructive"> *</span>;

const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({
  children,
  required,
}) => (
  <div className="mb-1.5 text-[12px] font-semibold text-foreground">
    {children}
    {required && <Req />}
  </div>
);

const MaterialDetailsDialog: React.FC<{
  material: Material;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}> = ({ material, open, onOpenChange }) => {
  const { data, updateMaterial } = useRegister();

  const classes = useMemo(
    () => Array.from(new Set(data.map((m) => m.material_class).filter(Boolean) as string[])).sort(),
    [data],
  );
  const owners = useMemo(
    () => Array.from(new Set(data.map((m) => m.owner).filter(Boolean) as string[])).sort(),
    [data],
  );
  const applicationOptions = useMemo(
    () => Array.from(new Set(data.flatMap((m) => m.application_categories))).sort(),
    [data],
  );

  const [name, setName] = useState(material.name);
  const [intent, setIntent] = useState<string>(
    material.entry_type,
  );
  const [materialClass, setMaterialClass] = useState<string>(material.material_class ?? "");
  const [apps, setApps] = useState<string[]>(material.application_categories);
  const [custom, setCustom] = useState("");
  const [owner, setOwner] = useState<string>(material.owner ?? UNASSIGNED_OWNER);

  const complete = [name.trim(), materialClass, apps.length > 0 ? "y" : "", owner !== UNASSIGNED_OWNER ? "y" : ""];
  const pct = Math.round((complete.filter(Boolean).length / complete.length) * 100);

  const addApp = (v: string) => {
    const t = v.trim();
    if (!t || apps.includes(t)) return;
    setApps((prev) => [...prev, t]);
  };

  const save = () => {
    const nextOwner = owner === UNASSIGNED_OWNER ? null : owner;
    updateMaterial(
      material.material_id,
      {
        name: name.trim() || material.name,
        entry_type: intent as Material["entry_type"],
        material_class: materialClass || null,
        application_categories: apps,
        owner: nextOwner,
      },
      ["name", "entry_type", "material_class", "application_categories", "owner"],
      material.owner !== nextOwner
        ? [
            {
              material_id: material.material_id,
              event_type: "owner_change",
              field: "owner",
              from_value: material.owner,
              to_value: nextOwner,
            },
          ]
        : [],
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="portfolio-type max-w-3xl gap-0 overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border bg-muted/40 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card">
            <Target className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">
              <span className="mr-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Step 1 ·
              </span>
              Material Details
            </div>
            <p className="text-[12px] text-muted-foreground">Identify the material &amp; intent</p>
          </div>
          <div className="pt-1 text-[12px] tabular-nums text-muted-foreground">{pct}%</div>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="grid gap-5 rounded-lg border border-border p-4 sm:grid-cols-2">
            <div>
              <FieldLabel required>Material name / identifier</FieldLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" />
            </div>

            <div>
              <FieldLabel required>Material intent</FieldLabel>
              <div className="inline-flex rounded-md bg-muted p-0.5">
                {INTENTS.map((i) => (
                  <button
                    key={i.value}
                    type="button"
                    onClick={() => setIntent(i.value)}
                    className={cn(
                      "rounded-[5px] px-3 py-1.5 text-[12px] transition-colors",
                      intent === i.value
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel required>Category</FieldLabel>
              <Select value={materialClass} onValueChange={setMaterialClass}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="portfolio-type z-50 bg-popover">
                  {classes.map((c) => (
                    <SelectItem key={c} value={c} className="text-[13px]">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel required>Product categories</FieldLabel>
              <Select value="" onValueChange={addApp}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue placeholder="Select a product category" />
                </SelectTrigger>
                <SelectContent className="portfolio-type z-50 bg-popover">
                  {applicationOptions.map((a) => (
                    <SelectItem key={a} value={a} className="text-[13px]">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 flex gap-2">
                <Input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="Add custom application area"
                  className="h-9 text-[13px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addApp(custom);
                      setCustom("");
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 text-[12px]"
                  onClick={() => {
                    addApp(custom);
                    setCustom("");
                  }}
                >
                  + Add
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {apps.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 text-[11px]"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => setApps((prev) => prev.filter((x) => x !== a))}
                      aria-label={`Remove ${a}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Transition ownership
              </div>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              The person accountable for driving this material transition.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="min-w-[220px]">
                <FieldLabel required>Transition owner</FieldLabel>
                <Select value={owner} onValueChange={setOwner}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="portfolio-type z-50 bg-popover">
                    <SelectItem value={UNASSIGNED_OWNER} className="text-[13px]">
                      Unassigned
                    </SelectItem>
                    {owners.map((o) => (
                      <SelectItem key={o} value={o} className="text-[13px]">
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" className="h-9 text-[12px]" disabled>
                <Users className="mr-1.5 h-3.5 w-3.5" />
                Manage team
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
          <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" className="h-8 text-[12px]" onClick={save}>
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialDetailsDialog;
