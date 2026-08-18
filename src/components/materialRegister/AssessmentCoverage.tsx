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
        this team has no visibility here — is recorded but never counted as a score. Open a material to record
        or change your own entry.{" "}
        <button
          type="button"
          onClick={() => setCriteriaOpen(true)}
          className="underline decoration-dotted hover:text-foreground"
        >
          {canEditCriteria ? "Edit criteria" : "View criteria"}
        </button>
        {canEditCriteria && " — a change applies to every material."}
      </p>

      <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
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
              <tr key={m.material_id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
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
