import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, X, Link as LinkIcon, Building2, Target, Scale, ChevronDown, Paperclip, Upload, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useCompanyBriefStore,
  makeBriefKey,
  newId as uid,
  type PropertyRow,
  type Attachment,
  type Goal,
  type Criterion,
  type MaterialStatus,
} from "@/store/companyBriefStore";

const MATERIAL_STATUS_OPTIONS: { value: Exclude<MaterialStatus, "">; label: string; dot: string; description: string }[] = [
  { value: "exploration", label: "Exploration", dot: "bg-sky-500", description: "Scouting candidates and gathering intel" },
  { value: "development", label: "Development", dot: "bg-violet-500", description: "Active lab work and iteration" },
  { value: "validation", label: "Validation", dot: "bg-amber-500", description: "Testing performance against targets" },
  { value: "pilot", label: "Pilot", dot: "bg-orange-500", description: "Scale-up trials with partners" },
  { value: "commercial", label: "Commercial", dot: "bg-emerald-500", description: "Ready or in production use" },
  { value: "on_hold", label: "On hold", dot: "bg-muted-foreground", description: "Paused or deprioritized" },
];

const URGENCY_LEVELS: { label: string; bar: string }[] = [
  { label: "Low", bar: "bg-emerald-500" },
  { label: "Moderate", bar: "bg-lime-500" },
  { label: "Elevated", bar: "bg-amber-500" },
  { label: "High", bar: "bg-orange-500" },
  { label: "Critical", bar: "bg-rose-500" },
];

const PROPERTY_SUGGESTIONS = [
  "Purity",
  "Melt flow index",
  "Viscosity",
  "Molecular weight",
  "Tensile strength",
  "Biodegradability",
  "Color",
];

const GOAL_TAG_SUGGESTIONS = [
  "Cost parity",
  "Replace incumbent",
  "Lower carbon footprint",
  "Secure supply",
  "Enter new market",
  "Improve performance",
  "Reduce CAPEX",
];

const SectionHeading: React.FC<{
  icon: React.ReactNode;
  title: string;
  hint?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}> = ({ icon, title, hint, open, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={open}
    className={`w-full flex items-center justify-between gap-3 text-left ${open ? "mb-3" : ""}`}
  >
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="flex items-center gap-2">
      {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
      <ChevronDown
        className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
      />
    </div>
  </button>
);

const EmptyState: React.FC<{ message: string; onAdd: () => void; addLabel: string }> = ({
  message,
  onAdd,
  addLabel,
}) => (
  <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-center">
    <p className="text-xs text-muted-foreground mb-2">{message}</p>
    <Button size="sm" variant="outline" onClick={onAdd} className="gap-1.5 h-7 text-xs">
      <Plus className="w-3 h-3" />
      {addLabel}
    </Button>
  </div>
);

interface Props {
  topic?: string;
  category?: string;
  prioritiesOnly?: boolean;
  materialOnly?: boolean;
}

const CompanyBrief: React.FC<Props> = ({ topic, category, prioritiesOnly = false, materialOnly = false }) => {
  const briefKey = makeBriefKey(category, topic);
  const updateBrief = useCompanyBriefStore((s) => s.updateBrief);
  const brief = useCompanyBriefStore((s) => s.briefs[briefKey]);

  useEffect(() => {
    if (!brief) useCompanyBriefStore.getState().getBrief(briefKey);
  }, [brief, briefKey]);

  const safeBrief = brief ?? useCompanyBriefStore.getState().getBrief(briefKey);

  const materialStatus = (safeBrief.materialStatus ?? "") as MaterialStatus;
  const urgency = safeBrief.urgency ?? 0;
  const materialDescription = safeBrief.materialDescription;
  const constraints = safeBrief.constraints;
  const properties = safeBrief.properties;
  const links = safeBrief.attachments;
  const goals = safeBrief.goals;
  const criteria = safeBrief.criteria;

  const setMaterialStatus = (v: MaterialStatus) => updateBrief(briefKey, { materialStatus: v });
  const setUrgency = (v: number) => updateBrief(briefKey, { urgency: v });
  const setMaterialDescription = (v: string) => updateBrief(briefKey, { materialDescription: v });
  const setConstraints = (v: string) => updateBrief(briefKey, { constraints: v });

  // Collapsible state per block
  const [openMaterial, setOpenMaterial] = useState(materialOnly);
  const [openGoals, setOpenGoals] = useState(false);
  const [openPriorities, setOpenPriorities] = useState(prioritiesOnly);

  const totalWeight = useMemo(
    () => criteria.reduce((sum, c) => sum + (Number.isFinite(c.weight) ? c.weight : 0), 0),
    [criteria]
  );

  // -------- Property handlers
  const addProperty = (preset?: string) =>
    updateBrief(briefKey, {
      properties: [...properties, { id: uid(), property: preset ?? "", value: "", unit: "", note: "" }],
    });
  const updateProperty = (id: string, patch: Partial<PropertyRow>) =>
    updateBrief(briefKey, {
      properties: properties.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  const removeProperty = (id: string) =>
    updateBrief(briefKey, { properties: properties.filter((r) => r.id !== id) });

  // -------- Attachment handlers
  const addLink = () =>
    updateBrief(briefKey, {
      attachments: [...links, { id: uid(), kind: "link", label: "", url: "" }],
    });
  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const current = useCompanyBriefStore.getState().briefs[briefKey]?.attachments ?? [];
        updateBrief(briefKey, {
          attachments: [
            ...current,
            {
              id: uid(),
              kind: "file",
              label: "",
              fileName: file.name,
              size: file.size,
              dataUrl: typeof reader.result === "string" ? reader.result : "",
            },
          ],
        });
      };
      reader.readAsDataURL(file);
    });
  };
  const updateLink = (id: string, patch: Partial<Attachment>) =>
    updateBrief(briefKey, {
      attachments: links.map((r) => (r.id === id ? ({ ...r, ...patch } as Attachment) : r)),
    });
  const removeLink = (id: string) =>
    updateBrief(briefKey, { attachments: links.filter((r) => r.id !== id) });
  const formatBytes = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  };

  // -------- Goal handlers
  const addGoal = () =>
    updateBrief(briefKey, {
      goals: [...goals, { id: uid(), text: "", tags: [], date: "", trl: "" }],
    });
  const updateGoal = (id: string, patch: Partial<Goal>) =>
    updateBrief(briefKey, {
      goals: goals.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  const removeGoal = (id: string) =>
    updateBrief(briefKey, { goals: goals.filter((r) => r.id !== id) });
  const toggleGoalTag = (id: string, tag: string) =>
    updateBrief(briefKey, {
      goals: goals.map((r) =>
        r.id === id
          ? { ...r, tags: r.tags.includes(tag) ? r.tags.filter((t) => t !== tag) : [...r.tags, tag] }
          : r
      ),
    });

  // -------- Criterion handlers
  const addCriterion = () =>
    updateBrief(briefKey, {
      criteria: [...criteria, { id: uid(), name: "", weight: 0, note: "" }],
    });
  const updateCriterion = (id: string, patch: Partial<Criterion>) =>
    updateBrief(briefKey, {
      criteria: criteria.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  const removeCriterion = (id: string) =>
    updateBrief(briefKey, { criteria: criteria.filter((r) => r.id !== id) });
  const normalizeWeights = () => {
    if (criteria.length === 0) return;
    const sum = criteria.reduce((s, c) => s + (c.weight || 0), 0);
    if (sum <= 0) {
      const even = Math.round(100 / criteria.length);
      updateBrief(briefKey, { criteria: criteria.map((r) => ({ ...r, weight: even })) });
      return;
    }
    updateBrief(briefKey, {
      criteria: criteria.map((r) => ({ ...r, weight: Math.round((r.weight / sum) * 100) })),
    });
  };

  const totalColor =
    totalWeight === 100
      ? "text-primary"
      : totalWeight > 100
      ? "text-amber-600"
      : "text-muted-foreground";

  return (
    <Card className="border-primary/30 bg-card shadow-sm">
      <CardHeader className="pb-3 border-b border-border/60 bg-primary/5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-semibold">Company Brief</CardTitle>
          </div>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Data privacy information"
                  className="w-6 h-6 rounded-full inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs text-xs leading-relaxed">
                Your data stays yours. The information entered in this Company Brief will not be
                used to train AI models and is never shared with anyone. It is owned solely by the
                company that inputs it.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-xs">
          Capture your targets, goals, and what matters most. Fill in what fits your company — every
          field is optional.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* ───── BLOCK 1: Material Brief ───── */}
        {!prioritiesOnly && (
        <section className="rounded-lg border border-border bg-background p-4">

          <SectionHeading
            icon={<Target className="w-3.5 h-3.5" />}
            title="Material Brief"
            open={openMaterial}
            onToggle={() => setOpenMaterial((v) => !v)}
          />

          {openMaterial && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Material status</Label>
                <Select value={materialStatus || undefined} onValueChange={(v) => setMaterialStatus(v as MaterialStatus)}>
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue placeholder="Select current stage…" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <span className="inline-flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${o.dot}`} />
                          <span className="font-medium">{o.label}</span>
                          <span className="text-[10px] text-muted-foreground">— {o.description}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs text-muted-foreground">Research urgency</Label>
                  <span className="text-[10px] font-semibold tabular-nums text-foreground">
                    {urgency === 0 ? "Not set" : URGENCY_LEVELS[urgency - 1].label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[urgency]}
                    min={0}
                    max={5}
                    step={1}
                    onValueChange={(vals) => setUrgency(vals[0] ?? 0)}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-0.5">
                    {URGENCY_LEVELS.map((l, i) => (
                      <span
                        key={l.label}
                        className={`w-1.5 h-3 rounded-sm ${i < urgency ? l.bar : "bg-muted"}`}
                        title={l.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-[9px] uppercase tracking-wider text-muted-foreground mt-1">
                  <span>Backlog</span>
                  <span>Critical</span>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Describe your target material, requirements, and context.
              </Label>
              <Textarea
                value={materialDescription}
                onChange={(e) => setMaterialDescription(e.target.value)}
                placeholder="What are you trying to source or develop? Include performance, sustainability, or use-case context."
                className="min-h-[100px] text-sm"
              />
            </div>

            {/* Target properties */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium text-foreground">Target properties</Label>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {PROPERTY_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addProperty(s)}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-background hover:bg-muted text-foreground transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>

              {properties.length === 0 ? (
                <EmptyState
                  message="No target properties yet. Add the ones that matter for your application."
                  addLabel="Add property"
                  onAdd={() => addProperty()}
                />
              ) : (
                <div className="space-y-1.5">
                  <div className="hidden md:grid grid-cols-[1.4fr_1fr_0.7fr_1.6fr_28px] gap-2 px-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    <span>Property</span>
                    <span>Target value</span>
                    <span>Unit</span>
                    <span>Note</span>
                    <span />
                  </div>
                  {properties.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_0.7fr_1.6fr_28px] gap-2 items-center"
                    >
                      <Input
                        value={row.property}
                        onChange={(e) => updateProperty(row.id, { property: e.target.value })}
                        placeholder="e.g. Purity"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={row.value}
                        onChange={(e) => updateProperty(row.id, { value: e.target.value })}
                        placeholder="≥ 99.5"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={row.unit}
                        onChange={(e) => updateProperty(row.id, { unit: e.target.value })}
                        placeholder="%"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={row.note}
                        onChange={(e) => updateProperty(row.id, { note: e.target.value })}
                        placeholder="Optional context"
                        className="h-8 text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProperty(row.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        aria-label="Remove property"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addProperty()}
                      className="gap-1.5 h-7 text-xs"
                    >
                      <Plus className="w-3 h-3" /> Add property
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Constraints</Label>
              <Textarea
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="Cost ceilings, regulatory requirements, sustainability commitments, certifications, supply terms…"
                className="min-h-[70px] text-sm"
              />
            </div>

            {/* Attachments & links */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium text-foreground">
                  Attachments & links
                </Label>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addLink}
                    className="gap-1.5 h-7 text-xs"
                  >
                    <LinkIcon className="w-3 h-3" /> Add link
                  </Button>
                  <Label
                    htmlFor="company-brief-file-upload"
                    className="inline-flex items-center gap-1.5 h-7 px-3 text-xs rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <Upload className="w-3 h-3" /> Upload file
                  </Label>
                  <input
                    id="company-brief-file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
              {links.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    No attachments yet. Add a link or upload specs, standards, or reference documents.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {links.map((l) => (
                    <div
                      key={l.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_2fr_28px] gap-2 items-center"
                    >
                      <Input
                        value={l.label}
                        onChange={(e) => updateLink(l.id, { label: e.target.value })}
                        placeholder={l.kind === "file" ? "Label (optional)" : "Label (e.g. Internal spec)"}
                        className="h-8 text-sm"
                      />
                      {l.kind === "link" ? (
                        <div className="relative">
                          <LinkIcon className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <Input
                            value={l.url}
                            onChange={(e) => updateLink(l.id, { url: e.target.value })}
                            placeholder="https://…"
                            className="h-8 text-sm pl-8"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-border bg-muted/30 text-sm overflow-hidden">
                          <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <a
                            href={l.dataUrl}
                            download={l.fileName}
                            className="truncate text-foreground hover:underline"
                            title={l.fileName}
                          >
                            {l.fileName}
                          </a>
                          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums shrink-0">
                            {formatBytes(l.size)}
                          </span>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLink(l.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        aria-label="Remove attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </section>
        )}



        {/* ───── BLOCK 3: Weighted Priorities ───── */}
        {!materialOnly && (
        <section className="rounded-lg border border-border bg-background p-4">

          <SectionHeading
            icon={<Scale className="w-3.5 h-3.5" />}
            title="Weighted Priorities"
            open={openPriorities}
            onToggle={() => setOpenPriorities((v) => !v)}
            hint={
              <span className={totalColor}>
                Total: <span className="font-semibold tabular-nums">{totalWeight}%</span>
                {totalWeight !== 100 ? " · doesn't sum to 100%" : ""}
              </span>
            }
          />

          {openPriorities && (<>
          <p className="text-xs text-muted-foreground mb-3">
            These priorities and weights are applied on each pathway's detail page, where every pathway is scored against them to produce its weighted fit score.
          </p>



          {criteria.length === 0 ? (
            <EmptyState
              message="No criteria yet. Add what you'll weigh pathways against."
              addLabel="Add criterion"
              onAdd={addCriterion}
            />
          ) : (
            <div className="space-y-3">
              {criteria.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-1 md:grid-cols-[1.2fr_2fr_1.4fr_28px] gap-3 items-start md:items-center rounded-md border border-border bg-muted/20 p-2.5"
                >
                  <Input
                    value={c.name}
                    onChange={(e) => updateCriterion(c.id, { name: e.target.value })}
                    placeholder="Criterion name"
                    className="h-8 text-sm"
                  />
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[c.weight]}
                      onValueChange={(v) => updateCriterion(c.id, { weight: v[0] })}
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs font-semibold tabular-nums text-foreground w-10 text-right">
                      {c.weight}%
                    </span>
                  </div>
                  <Input
                    value={c.note}
                    onChange={(e) => updateCriterion(c.id, { note: e.target.value })}
                    placeholder="Why this matters (optional)"
                    className="h-8 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCriterion(c.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    aria-label="Remove criterion"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={addCriterion}
              className="gap-1.5 h-7 text-xs"
            >
              <Plus className="w-3 h-3" /> Add custom criterion
            </Button>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${totalColor}`}>
                Total: <span className="font-semibold tabular-nums">{totalWeight}%</span>
                {totalWeight !== 100 ? " — not 100%" : ""}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={normalizeWeights}
                className="h-7 text-xs"
                disabled={criteria.length === 0}
              >
                Normalize to 100%
              </Button>
            </div>
          </div>
          </>)}
        </section>
        )}

      </CardContent>
    </Card>
  );
};

export default CompanyBrief;
