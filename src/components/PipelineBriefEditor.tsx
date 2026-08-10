import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  X,
  Link as LinkIcon,
  Target,
  Scale,
  ChevronDown,
  Paperclip,
  Upload,
} from "lucide-react";
import {
  usePipelineBriefStore,
  type PipelineBrief,
} from "@/store/pipelineBriefStore";
import {
  newId as uid,
  type PropertyRow,
  type Attachment,
  type Goal,
  type Criterion,
} from "@/store/companyBriefStore";

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

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

interface Props {
  brief: PipelineBrief;
  userName: string;
  defaultOpen?: boolean;
}

const PipelineBriefEditor: React.FC<Props> = ({ brief, userName, defaultOpen = true }) => {
  const updateContent = usePipelineBriefStore((s) => s.updateContent);
  const c = brief.content;

  const patch = (p: Partial<typeof c>) => updateContent(brief.id, p, userName);

  const [openMaterial, setOpenMaterial] = useState(defaultOpen);
  const [openGoals, setOpenGoals] = useState(false);
  const [openPriorities, setOpenPriorities] = useState(false);

  const totalWeight = useMemo(
    () => c.criteria.reduce((s, x) => s + (Number.isFinite(x.weight) ? x.weight : 0), 0),
    [c.criteria]
  );

  // Properties
  const addProperty = (preset?: string) =>
    patch({ properties: [...c.properties, { id: uid(), property: preset ?? "", value: "", unit: "", note: "" }] });
  const updateProperty = (id: string, p: Partial<PropertyRow>) =>
    patch({ properties: c.properties.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  const removeProperty = (id: string) =>
    patch({ properties: c.properties.filter((r) => r.id !== id) });

  // Attachments
  const addLink = () =>
    patch({ attachments: [...c.attachments, { id: uid(), kind: "link", label: "", url: "" }] });
  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const current = usePipelineBriefStore.getState().briefs[brief.id]?.content.attachments ?? [];
        updateContent(
          brief.id,
          {
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
          },
          userName
        );
      };
      reader.readAsDataURL(file);
    });
  };
  const updateLink = (id: string, p: Partial<Attachment>) =>
    patch({ attachments: c.attachments.map((r) => (r.id === id ? ({ ...r, ...p } as Attachment) : r)) });
  const removeLink = (id: string) =>
    patch({ attachments: c.attachments.filter((r) => r.id !== id) });

  // Goals
  const addGoal = () =>
    patch({ goals: [...c.goals, { id: uid(), text: "", tags: [], date: "", trl: "" }] });
  const updateGoal = (id: string, p: Partial<Goal>) =>
    patch({ goals: c.goals.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  const removeGoal = (id: string) => patch({ goals: c.goals.filter((r) => r.id !== id) });
  const toggleGoalTag = (id: string, tag: string) =>
    patch({
      goals: c.goals.map((r) =>
        r.id === id
          ? { ...r, tags: r.tags.includes(tag) ? r.tags.filter((t) => t !== tag) : [...r.tags, tag] }
          : r
      ),
    });

  // Criteria
  const addCriterion = () =>
    patch({ criteria: [...c.criteria, { id: uid(), name: "", weight: 0, note: "" }] });
  const updateCriterion = (id: string, p: Partial<Criterion>) =>
    patch({ criteria: c.criteria.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  const removeCriterion = (id: string) =>
    patch({ criteria: c.criteria.filter((r) => r.id !== id) });
  const normalizeWeights = () => {
    if (c.criteria.length === 0) return;
    const sum = c.criteria.reduce((s, x) => s + (x.weight || 0), 0);
    if (sum <= 0) {
      const even = Math.round(100 / c.criteria.length);
      patch({ criteria: c.criteria.map((r) => ({ ...r, weight: even })) });
      return;
    }
    patch({ criteria: c.criteria.map((r) => ({ ...r, weight: Math.round((r.weight / sum) * 100) })) });
  };

  const totalColor =
    totalWeight === 100
      ? "text-primary"
      : totalWeight > 100
      ? "text-amber-600"
      : "text-muted-foreground";

  return (
    <div className="space-y-4">
      {/* BLOCK 1 */}
      <section className="rounded-lg border border-border bg-background p-4">
        <SectionHeading
          icon={<Target className="w-3.5 h-3.5" />}
          title="Material Brief"
          open={openMaterial}
          onToggle={() => setOpenMaterial((v) => !v)}
        />
        {openMaterial && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Describe your target material, requirements, and context.
              </Label>
              <Textarea
                value={c.materialDescription}
                onChange={(e) => patch({ materialDescription: e.target.value })}
                placeholder="What are you trying to source or develop? Include performance, sustainability, or use-case context."
                className="min-h-[100px] text-sm"
              />
            </div>

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
              {c.properties.length === 0 ? (
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
                  {c.properties.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_0.7fr_1.6fr_28px] gap-2 items-center"
                    >
                      <Input value={row.property} onChange={(e) => updateProperty(row.id, { property: e.target.value })} placeholder="e.g. Purity" className="h-8 text-sm" />
                      <Input value={row.value} onChange={(e) => updateProperty(row.id, { value: e.target.value })} placeholder="≥ 99.5" className="h-8 text-sm" />
                      <Input value={row.unit} onChange={(e) => updateProperty(row.id, { unit: e.target.value })} placeholder="%" className="h-8 text-sm" />
                      <Input value={row.note} onChange={(e) => updateProperty(row.id, { note: e.target.value })} placeholder="Optional context" className="h-8 text-sm" />
                      <Button variant="ghost" size="icon" onClick={() => removeProperty(row.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  <div className="pt-1">
                    <Button variant="outline" size="sm" onClick={() => addProperty()} className="gap-1.5 h-7 text-xs">
                      <Plus className="w-3 h-3" /> Add property
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Constraints</Label>
              <Textarea
                value={c.constraints}
                onChange={(e) => patch({ constraints: e.target.value })}
                placeholder="Cost ceilings, regulatory requirements, sustainability commitments, certifications, supply terms…"
                className="min-h-[70px] text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium text-foreground">Attachments & links</Label>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={addLink} className="gap-1.5 h-7 text-xs">
                    <LinkIcon className="w-3 h-3" /> Add link
                  </Button>
                  <Label
                    htmlFor={`brief-file-upload-${brief.id}`}
                    className="inline-flex items-center gap-1.5 h-7 px-3 text-xs rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <Upload className="w-3 h-3" /> Upload file
                  </Label>
                  <input
                    id={`brief-file-upload-${brief.id}`}
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
              {c.attachments.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    No attachments yet. Add a link or upload specs, standards, or reference documents.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {c.attachments.map((l) => (
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
                          <a href={l.dataUrl} download={l.fileName} className="truncate text-foreground hover:underline" title={l.fileName}>
                            {l.fileName}
                          </a>
                          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums shrink-0">
                            {formatBytes(l.size)}
                          </span>
                        </div>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => removeLink(l.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
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


      {/* BLOCK 3 */}
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
        {openPriorities && (
          <>
            {c.criteria.length === 0 ? (
              <EmptyState
                message="No criteria yet. Add what you'll weigh pathways against."
                addLabel="Add criterion"
                onAdd={addCriterion}
              />
            ) : (
              <div className="space-y-3">
                {c.criteria.map((cr) => (
                  <div
                    key={cr.id}
                    className="grid grid-cols-1 md:grid-cols-[1.2fr_2fr_1.4fr_28px] gap-3 items-start md:items-center rounded-md border border-border bg-muted/20 p-2.5"
                  >
                    <Input value={cr.name} onChange={(e) => updateCriterion(cr.id, { name: e.target.value })} placeholder="Criterion name" className="h-8 text-sm" />
                    <div className="flex items-center gap-3">
                      <Slider value={[cr.weight]} onValueChange={(v) => updateCriterion(cr.id, { weight: v[0] })} min={0} max={100} step={1} className="flex-1" />
                      <span className="text-xs font-semibold tabular-nums text-foreground w-10 text-right">{cr.weight}%</span>
                    </div>
                    <Input value={cr.note} onChange={(e) => updateCriterion(cr.id, { note: e.target.value })} placeholder="Why this matters (optional)" className="h-8 text-sm" />
                    <Button variant="ghost" size="icon" onClick={() => removeCriterion(cr.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
              <Button variant="outline" size="sm" onClick={addCriterion} className="gap-1.5 h-7 text-xs">
                <Plus className="w-3 h-3" /> Add custom criterion
              </Button>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${totalColor}`}>
                  Total: <span className="font-semibold tabular-nums">{totalWeight}%</span>
                  {totalWeight !== 100 ? " — not 100%" : ""}
                </span>
                <Button variant="ghost" size="sm" onClick={normalizeWeights} className="h-7 text-xs" disabled={c.criteria.length === 0}>
                  Normalize to 100%
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default PipelineBriefEditor;
