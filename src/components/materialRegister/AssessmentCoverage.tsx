import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEAM_LABEL } from "@/config/assessmentCriteria";
import CriteriaSetDialog from "@/components/materialRegister/CriteriaSetDialog";
import { useRegister } from "@/components/materialRegister/registerStore";
import FilterSelects from "@/components/materialRegister/FilterSelects";
import FilterChips from "@/components/materialRegister/FilterChips";
import { Paperclip, X, ChevronLeft, ChevronRight } from "lucide-react";
import { CoverageMark, FlagChip } from "@/components/materialRegister/assessmentPrimitives";
import { shortDate } from "@/components/materialRegister/primitives";


type SortId = "register" | "coverage" | "splits" | "recent";

/**
 * Coverage view. It shows whether a criterion has been assessed and how far the
 * entries sit apart — never the scores themselves. Scoring happens on the
 * material's own page, so the row opens the brief.
 */
const AssessmentCoverage: React.FC = () => {
  const {
    ordered,
    data,
    filters,
    setFilters,
    openBrief,
    assessmentState,
    assessmentSummary,
    criterionCoverage,
    documentCount,
    currentUser,
    scope,
    scopeLabel,
    judgedCriteria,
    canEditCriteria,
    saveAssessment,
    clearAssessment,
  } = useRegister();

  const [sort, setSort] = useState<SortId>("register");
  const [gapsOnly, setGapsOnly] = useState(false);
  const [criteriaOpen, setCriteriaOpen] = useState(false);


  const rows = useMemo(() => {
    const base = ordered.map(({ m }) => ({ m, summary: assessmentSummary(m.material_id) }));
    const filtered = gapsOnly ? base.filter((r) => r.summary.criteriaAssessed < r.summary.criteriaTotal) : base;
    const sorted = [...filtered];
    if (sort === "coverage") sorted.sort((a, b) => a.summary.criteriaAssessed - b.summary.criteriaAssessed);
    if (sort === "splits") sorted.sort((a, b) => b.summary.splits - a.summary.splits);
    if (sort === "recent")
      sorted.sort((a, b) => (b.summary.lastAssessedAt ?? "").localeCompare(a.summary.lastAssessedAt ?? ""));
    return sorted;
  }, [ordered, gapsOnly, sort, assessmentSummary]);

  const rowMaterials = useMemo(() => rows.map((r) => r.m), [rows]);

  // ------------------------------------------------------- bulk entry (staged)
  /** Value staged for one criterion. "clear" withdraws the current user's entry. */
  type Staged = { value: number | "neutral" | "clear"; note: string };

  const [selected, setSelected] = useState<string[]>([]);
  const [staged, setStaged] = useState<Record<string, Staged>>({});
  const [criterionIdx, setCriterionIdx] = useState(0);

  const criterion = judgedCriteria[Math.min(criterionIdx, judgedCriteria.length - 1)];
  const current = criterion ? staged[criterion.criterion_id] : undefined;
  const selectedMaterials = useMemo(
    () => selected.map((id) => data.find((m) => m.material_id === id)).filter(Boolean) as typeof data,
    [selected, data],
  );
  const stagedCount = Object.keys(staged).length;
  /** A 1–5 score is refused without a rationale, in bulk exactly as on the brief. */
  const stagedIncomplete = Object.values(staged).some(
    (s) => typeof s.value === "number" && s.note.trim() === "",
  );

  const toggleRow = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allShownSelected = rows.length > 0 && rows.every((r) => selected.includes(r.m.material_id));

  const clearSelection = () => {
    setSelected([]);
    setStaged({});
  };

  const setValue = (value: Staged["value"] | null) => {
    if (!criterion) return;
    setStaged((prev) => {
      const next = { ...prev };
      if (value === null) delete next[criterion.criterion_id];
      else next[criterion.criterion_id] = { value, note: prev[criterion.criterion_id]?.note ?? "" };
      return next;
    });
  };

  const setNote = (note: string) => {
    if (!criterion) return;
    setStaged((prev) =>
      prev[criterion.criterion_id]
        ? { ...prev, [criterion.criterion_id]: { ...prev[criterion.criterion_id], note } }
        : prev,
    );
  };

  const applyStaged = () => {
    if (stagedIncomplete || stagedCount === 0 || selected.length === 0) return;
    for (const materialId of selected) {
      for (const [criterionId, s] of Object.entries(staged)) {
        if (s.value === "clear") clearAssessment(materialId, criterionId);
        else if (s.value === "neutral") saveAssessment(materialId, criterionId, null, null);
        else saveAssessment(materialId, criterionId, s.value, s.note);
      }
    }
    clearSelection();
  };

  const VALUES: Staged["value"][] = [1, 2, 3, 4, 5];



  const SORTS: { id: SortId; label: string }[] = [
    { id: "register", label: "Register order" },
    { id: "coverage", label: "Least assessed" },
    { id: "splits", label: "Most split" },
    { id: "recent", label: "Recently assessed" },
  ];

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <Input
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder="Search name, CAS, customer ID"
          className="h-7 w-60 rounded-lg bg-card text-[11px]"
        />
        <FilterSelects variant="popover" />
        <button
          type="button"
          onClick={() => setGapsOnly((v) => !v)}
          className={cn(
            "inline-flex h-7 items-center rounded-lg border px-2.5 text-[11px] font-medium transition-colors",
            gapsOnly
              ? "border-primary/40 bg-primary/5 text-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          Gaps only
        </button>

        <div className="ml-auto flex items-center gap-1 rounded-lg bg-muted p-1">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={sort === s.id}
              onClick={() => setSort(s.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                sort === s.id ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full text-right text-[11px] text-muted-foreground">
        Recording as <span className="text-foreground">{currentUser.name}</span> ·{" "}
        {TEAM_LABEL[currentUser.team]}
        <span className="text-border"> · </span>
        <span className="font-mono tabular-nums text-foreground">{rows.length}</span>
        {rows.length !== data.length && (
          <>
            {" of "}
            <span className="font-mono tabular-nums">{data.length}</span>
          </>
        )}{" "}
        {scope ? `${scopeLabel} materials` : "materials"}
      </div>

      <FilterChips />

      <CriteriaSetDialog open={criteriaOpen} onOpenChange={setCriteriaOpen} />

      <p className="text-[11px] text-muted-foreground">
        A filled marker means at least one 1–5 score has been recorded; a dashed one means none has. Neutral —
        this team has no visibility here — is recorded but never counted as a score. Tick materials to score
        them in bulk, or open one to score it on its profile.{" "}
        <button
          type="button"
          onClick={() => setCriteriaOpen(true)}
          className="underline decoration-dotted hover:text-foreground"
        >
          {canEditCriteria ? "Edit criteria" : "View criteria"}
        </button>
        {canEditCriteria && " — a change applies to every material."}
      </p>

      {selected.length > 0 && criterion && (
        <div className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-foreground">
                Set scores
              </div>
              <div className="text-[11px] text-muted-foreground">
                <span className="font-mono tabular-nums text-foreground">{selected.length}</span> material
                {selected.length === 1 ? "" : "s"} selected · tick more rows below to add, or remove them here.
              </div>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Clear selection <X className="h-3 w-3" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {selectedMaterials.map((m) => (
              <button
                key={m.material_id}
                type="button"
                onClick={() => toggleRow(m.material_id)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-foreground hover:border-foreground/40"
                title={`Remove ${m.name} from the selection`}
              >
                {m.name} <X className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Criterion
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCriterionIdx((i) => Math.max(0, i - 1))}
                  disabled={criterionIdx === 0}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground disabled:opacity-40 hover:text-foreground"
                  aria-label="Previous criterion"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <Select
                  value={criterion.criterion_id}
                  onValueChange={(v) =>
                    setCriterionIdx(judgedCriteria.findIndex((c) => c.criterion_id === v))
                  }
                >
                  <SelectTrigger className="h-7 flex-1 rounded-md bg-card text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {judgedCriteria.map((c) => (
                      <SelectItem key={c.criterion_id} value={c.criterion_id} className="text-[11px]">
                        {c.label}
                        {staged[c.criterion_id] ? " ·  staged" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => setCriterionIdx((i) => Math.min(judgedCriteria.length - 1, i + 1))}
                  disabled={criterionIdx >= judgedCriteria.length - 1}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground disabled:opacity-40 hover:text-foreground"
                  aria-label="Next criterion"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Criterion {criterionIdx + 1} of {judgedCriteria.length}
                {criterion.anchors ? ` · ${criterion.anchors}` : ""}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Value
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {VALUES.map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setValue(current?.value === v ? null : v)}
                    aria-pressed={current?.value === v}
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-md border font-mono text-[11px] tabular-nums transition-colors",
                      current?.value === v
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {v}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setValue(current?.value === "neutral" ? null : "neutral")}
                  aria-pressed={current?.value === "neutral"}
                  className={cn(
                    "inline-flex h-7 items-center rounded-md border px-2 text-[11px] transition-colors",
                    current?.value === "neutral"
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  Neutral
                </button>
                <button
                  type="button"
                  onClick={() => setValue(current?.value === "clear" ? null : "clear")}
                  aria-pressed={current?.value === "clear"}
                  className={cn(
                    "inline-flex h-7 items-center rounded-md border px-2 text-[11px] transition-colors",
                    current?.value === "clear"
                      ? "border-destructive/60 bg-destructive/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  Clear entry
                </button>
              </div>
              <div className="text-[10px] text-muted-foreground">{criterion.helper}</div>
            </div>
          </div>

          {typeof current?.value === "number" && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Rationale · required
              </div>
              <Textarea
                value={current.note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Why this score holds for every material selected"
                className="rounded-md bg-card text-[11px]"
              />
              <div className="text-[10px] text-muted-foreground">
                The same rationale is written on each selected material.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] text-muted-foreground">
              <span className="font-mono tabular-nums text-foreground">{stagedCount}</span> criteri
              {stagedCount === 1 ? "on" : "a"} staged. Nothing is written until you save.
              {stagedIncomplete && (
                <span className="text-destructive"> A 1–5 score needs a rationale.</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={clearSelection}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-[11px]"
                disabled={stagedCount === 0 || stagedIncomplete}
                onClick={applyStaged}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}


      <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="w-8 px-3 py-2">
                <Checkbox
                  checked={allShownSelected}
                  onCheckedChange={(v) =>
                    setSelected(v ? rows.map((r) => r.m.material_id) : [])
                  }
                  aria-label="Select all shown materials"
                />
              </th>
              <th className="w-[210px] px-3 py-2 font-semibold text-muted-foreground">Material</th>

              {judgedCriteria.map((c) => (
                <th key={c.criterion_id} className="px-3 py-2 font-semibold text-muted-foreground">
                  <div className="leading-tight">{c.label}</div>
                  <div className="font-mono text-[10px] font-normal tabular-nums opacity-70">
                    {criterionCoverage(c.criterion_id, rowMaterials)}/{rowMaterials.length}
                  </div>
                </th>
              ))}
              <th className="w-[130px] px-3 py-2 text-right font-semibold text-muted-foreground">
                Last changed
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ m, summary }) => (
              <tr
                key={m.material_id}
                className={cn(
                  "border-b border-border/60 last:border-0 hover:bg-muted/30",
                  selected.includes(m.material_id) && "bg-primary/5",
                )}
              >
                <td className="px-3 py-1.5">
                  <Checkbox
                    checked={selected.includes(m.material_id)}
                    onCheckedChange={() => toggleRow(m.material_id)}
                    aria-label={`Select ${m.name}`}
                  />
                </td>
                <td className="px-3 py-1.5">

                  <button
                    type="button"
                    onClick={() => openBrief(m.material_id)}
                    className="max-w-[190px] truncate text-left font-medium text-foreground underline decoration-dotted underline-offset-2 hover:text-primary"
                    title={`Open ${m.name}`}
                  >
                    {m.name}
                  </button>
                </td>
                {judgedCriteria.map((c) => {
                  const state = assessmentState(m.material_id, c.criterion_id);
                  const docs = documentCount(m.material_id, c.criterion_id);
                  return (
                    <td key={c.criterion_id} className="px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <CoverageMark state={state} />
                        {state.entries.length > 0 && <FlagChip state={state} />}
                        {/* Presence of evidence, not a metric: never sorted or scored. */}
                        {docs > 0 && (
                          <span
                            className="inline-flex items-center gap-0.5 text-muted-foreground"
                            title={`${docs} supporting document${docs === 1 ? "" : "s"}`}
                          >
                            <Paperclip className="h-3 w-3" />
                            <span className="font-mono text-[10px] tabular-nums">{docs}</span>
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="px-3 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                  {summary.lastAssessedAt ? shortDate(summary.lastAssessedAt) : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={judgedCriteria.length + 2} className="px-3 py-6 text-center text-muted-foreground">
                  No materials match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssessmentCoverage;
