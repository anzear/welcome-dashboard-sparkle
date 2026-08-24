/**
 * AVAILABLE NOW — materials that sit in the Material Portfolio and that VCG has
 * coverage ready for, where the customer has not taken it yet.
 *
 * This is not the portfolio and it is not Your topics. Materials that already
 * have coverage never appear here; they are topics. Availability is a state VCG
 * sets on the material — nothing here derives it.
 *
 * The section always shows. When nothing is available the only thing on the
 * grid is the "Request another material" action tile, which opens the same Add
 * Material modal used everywhere else, pre-set to the Request coverage path.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RoleChip } from "@/components/materialRegister/RoleChip";
import RequestCoverageDialog from "@/components/materialRegister/RequestCoverageDialog";
import MaterialAddDialog, {
  type MaterialAddIntent,
  type MaterialRunAs,
} from "@/components/MaterialAddDialog";
import { seededMaterials, MEASURES, type RankMeasureId } from "@/components/materialRegister/registerStore";
import { useCriteriaSet } from "@/components/materialRegister/criteriaStore";
import { nf } from "@/components/materialRegister/primitives";
import { seedAssessments } from "@/data/assessmentMock";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  addPortfolioAddition,
  portfolioAdditionRows,
  PORTFOLIO_ADDITIONS_EVENT,
} from "@/lib/portfolioAdditions";
import {
  addPendingCoverage,
  readLegacyRequestedIds,
  readPendingCoverage,
  PENDING_COVERAGE_EVENT,
} from "@/lib/pendingCoverage";
import { MATERIAL_ROLE_LABEL, type Material, type MaterialRole } from "@/types/materialPrioritisation";


/** Pending requests live in one place so Your topics can show them. */
const readRequested = (): string[] => [
  ...readLegacyRequestedIds(),
  ...readPendingCoverage()
    .map((e) => e.materialId)
    .filter((id): id is string => Boolean(id)),
];

/**
 * SORT OPTIONS — the register's measures plus one option per active driver.
 * A driver option is prefixed so a criterion id can never collide with a measure.
 */
const DRIVER_PREFIX = "driver:";
type SortId = "recent" | RankMeasureId | string;

/** What the card prints, and the number it is sorted on. */
interface CardValue {
  key: number;
  text: string;
}

export const DashboardAvailableNow: React.FC = () => {
  const { criteria } = useCriteriaSet();
  const [requested, setRequested] = useState<string[]>(() => readRequested());

  const [additions, setAdditions] = useState<Material[]>(() => portfolioAdditionRows(seededMaterials));
  const [target, setTarget] = useState<Material | null>(null);

  // Add Material modal state — same modal used everywhere else.
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addName, setAddName] = useState("");
  const [addRunAs, setAddRunAs] = useState<MaterialRunAs | "">("Feedstock");
  const [addIntent, setAddIntent] = useState<MaterialAddIntent | "">("coverage");
  const [addRole, setAddRole] = useState<MaterialRole | "">("");

  const refresh = useCallback(() => {
    setAdditions(portfolioAdditionRows(seededMaterials));
    setRequested(readRequested());
  }, []);

  useEffect(() => {
    window.addEventListener(PORTFOLIO_ADDITIONS_EVENT, refresh);
    window.addEventListener(PENDING_COVERAGE_EVENT, refresh);
    return () => {
      window.removeEventListener(PORTFOLIO_ADDITIONS_EVENT, refresh);
      window.removeEventListener(PENDING_COVERAGE_EVENT, refresh);
    };
  }, [refresh]);


  const allMaterials = useMemo(() => [...seededMaterials, ...additions], [additions]);

  const available = useMemo(
    () =>
      allMaterials.filter(
        (m) =>
          m.coverage_available &&
          m.intelligence_status === "not_ordered" &&
          !requested.includes(m.material_id),
      ),
    [allMaterials, requested],
  );

  const trackedCount = allMaterials.length;

  /**
   * SORT — the same measures the register ranks by, one at a time, highest
   * first. The default keeps the list exactly as it arrives (most recently made
   * available first) and shows no value line. A material with no figure for the
   * active measure, or no entries for the active driver, is never treated as
   * zero and never sorted lowest by value: it sits after the sorted ones,
   * ordered by name, with an em dash in place of a value. Nothing is hidden.
   */
  const [sortId, setSortId] = useState<SortId>("recent");
  const judgedCriteria = useMemo(
    () => criteria.filter((c) => c.kind === "judgement" && !c.hidden),
    [criteria],
  );
  // A criterion that gets hidden while selected drops the sort back to default.
  const activeCriterion = sortId.startsWith(DRIVER_PREFIX)
    ? judgedCriteria.find((c) => c.criterion_id === sortId.slice(DRIVER_PREFIX.length)) ?? null
    : null;
  const activeMeasure = MEASURES.find((mm) => mm.id === sortId) ?? null;
  const sortActive = Boolean(activeMeasure || activeCriterion);

  /** The value shown on the card, and the key sorted on. Null is not zero. */
  const valueFor = useCallback(
    (m: Material): CardValue | null => {
      if (activeMeasure) {
        const v = activeMeasure.value(m);
        if (v === null) return null;
        return { key: v, text: `${nf(activeMeasure.decimals ?? 0)(v)} ${activeMeasure.unit}` };
      }
      if (activeCriterion) {
        const scores = Object.values(seedAssessments)
          .filter(
            (e) =>
              e.material_id === m.material_id && e.criterion_id === activeCriterion.criterion_id,
          )
          .map((e) => e.score);
        if (scores.length === 0) return null;
        const high = Math.max(...scores);
        const low = Math.min(...scores);
        // Disagreement is reported as the recorded range, never a derived number.
        return { key: high, text: low === high ? `${high} of 5` : `${low}–${high} of 5` };
      }
      return null;
    },
    [activeMeasure, activeCriterion],
  );

  const sorted = useMemo(() => {
    if (!sortActive) return available;
    const withValue = available.map((m) => ({ m, v: valueFor(m) }));
    const scored = withValue.filter((r) => r.v !== null);
    const missing = withValue.filter((r) => r.v === null);
    scored.sort((a, b) =>
      b.v!.key !== a.v!.key ? b.v!.key - a.v!.key : a.m.name.localeCompare(b.m.name),
    );
    missing.sort((a, b) => a.m.name.localeCompare(b.m.name));
    return [...scored, ...missing].map((r) => r.m);
  }, [available, sortActive, valueFor]);

  // Pagination — five available materials per page, CTA always in the sixth slot.
  // Not persisted: resets on reload.
  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const [page, setPage] = useState(1);

  // Clamp page whenever the available list shrinks (e.g. after requesting coverage).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageMaterials = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);


  const confirmRequest = (m: Material) => {
    // Records the request as a pending topic. The register row is untouched.
    addPendingCoverage({ name: m.name, materialId: m.material_id });
    setRequested(readRequested());
    toast("Coverage requested", {
      description: `${m.name} now sits under Your topics as a pending topic. Our team will contact you to set it up.`,
      duration: 6000,
    });
  };


  const resetAddForm = () => {
    setAddName("");
    setAddRunAs("Feedstock");
    // Coverage is the section's purpose — keep it as the default on reopen.
    setAddIntent("coverage");
    setAddRole("");
  };

  const openAddDialog = () => {
    // Always open on the Request coverage path — that is what this section is about.
    setAddIntent("coverage");
    setShowAddDialog(true);
  };

  /** Coverage path — the request becomes a pending topic under Your topics. */
  const handleCoverageSubmit = () => {
    if (!addName.trim() || !addRunAs) return;
    const itemName = addName.trim();
    const match = allMaterials.find((m) => m.name.toLowerCase() === itemName.toLowerCase());
    const added = addPendingCoverage({
      name: itemName,
      materialId: match?.material_id,
      runAs: addRunAs,
    });
    setRequested(readRequested());
    toast(added ? "Coverage requested" : "A request is already in", {
      description: (
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
          <span>
            <span className="font-semibold text-success">{itemName}</span> sits under Your topics as
            a pending topic. Our team will contact you to set this up.
          </span>
        </div>
      ),
      duration: 6000,
    });

    setShowAddDialog(false);
    resetAddForm();
  };


  /** Portfolio path — internal tracking only, no coverage is requested. */
  const handlePortfolioSubmit = () => {
    const itemName = addName.trim();
    if (!itemName || !addRole) return;
    const added = addPortfolioAddition({
      name: itemName,
      role: addRole,
    });
    toast(added ? "Added to your portfolio" : "Already in your portfolio", {
      description: added
        ? `${itemName} is now in the Material Portfolio register. Fill in the rest there.`
        : `${itemName} is already tracked in the Material Portfolio.`,
      duration: 6000,
    });
    setShowAddDialog(false);
    resetAddForm();
  };

  return (
    <div className="w-full space-y-4">
      <section className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Available now
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Materials in your portfolio where our data is ready.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* One sort at a time, highest first. Quiet: a dropdown, not a row. */}
            <Select
              value={sortId}
              onValueChange={(v) => {
                setSortId(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-6 w-auto gap-1 border-none bg-transparent px-1 text-[11px] text-muted-foreground shadow-none hover:text-foreground focus:ring-0 focus:ring-offset-0">
                <span className="text-muted-foreground/70">Sort</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" className="text-[11px]">
                <SelectItem value="recent" className="text-[11px]">
                  Recently available
                </SelectItem>
                <SelectGroup>
                  <SelectLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Figures
                  </SelectLabel>
                  {MEASURES.map((mm) => (
                    <SelectItem key={mm.id} value={mm.id} className="text-[11px]">
                      {mm.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Drivers
                  </SelectLabel>
                  {judgedCriteria.map((c) => (
                    <SelectItem
                      key={c.criterion_id}
                      value={`${DRIVER_PREFIX}${c.criterion_id}`}
                      className="text-[11px]"
                    >
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* The way out of the section: register, unfiltered. One link, one count. */}
            <Link
              to="/material-prioritisation"
              className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-foreground transition-colors hover:text-foreground/70"
            >
              View all <span className="tabular-nums">{trackedCount}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>



        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pageMaterials.map((m) => (
            <div
              key={m.material_id}
              className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-semibold leading-snug text-foreground">{m.name}</h3>
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-success/15">
                  <Sparkles className="h-2.5 w-2.5 text-success" />
                </div>
              </div>
              <RoleChip isExisting={m.role === "existing"} className="self-start">
                {MATERIAL_ROLE_LABEL[m.role]}
              </RoleChip>
              <Button
                size="sm"
                className="mt-auto h-7 w-full bg-foreground text-[11px] text-background hover:bg-foreground/90"
                onClick={() => setTarget(m)}
              >
                Request coverage
              </Button>
            </div>
          ))}

          {/* Request another material — an action, not a material. */}
          <button
            type="button"
            onClick={openAddDialog}
            className="group flex flex-col items-start gap-2 rounded-xl border border-dashed border-border/60 bg-transparent p-3.5 text-left transition-colors hover:border-foreground/40 hover:bg-muted/30"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-border/60 text-muted-foreground transition-colors group-hover:border-foreground/40 group-hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-xs font-semibold leading-snug text-foreground">
              Request another material
            </h3>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Coverage can be requested for any material, whether or not it is in your portfolio.
            </p>
          </button>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/50 transition-colors enabled:hover:border-foreground/40 enabled:hover:text-foreground disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="tabular-nums">
              {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/50 transition-colors enabled:hover:border-foreground/40 enabled:hover:text-foreground disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </section>



      {target && (
        <RequestCoverageDialog
          open={Boolean(target)}
          onOpenChange={(o) => !o && setTarget(null)}
          materialName={target.name}
          role={target.role}
          onConfirm={() => confirmRequest(target)}
        />
      )}

      <MaterialAddDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) resetAddForm();
        }}
        name={addName}
        onNameChange={setAddName}
        runAs={addRunAs}
        onRunAsChange={setAddRunAs}
        intent={addIntent}
        onIntentChange={setAddIntent}
        role={addRole}
        onRoleChange={setAddRole}
        onSubmit={handleCoverageSubmit}
        onSubmitPortfolio={handlePortfolioSubmit}
        onCancel={() => {
          setShowAddDialog(false);
          resetAddForm();
        }}
      />
    </div>
  );
};

export default DashboardAvailableNow;
