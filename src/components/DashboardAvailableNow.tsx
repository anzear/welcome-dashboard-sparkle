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
import { seededMaterials } from "@/components/materialRegister/registerStore";
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



export const DashboardAvailableNow: React.FC = () => {
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

  // Pagination — five available materials per page, CTA always in the sixth slot.
  // Not persisted: resets on reload.
  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(available.length / PAGE_SIZE));
  const [page, setPage] = useState(1);

  // Clamp page whenever the available list shrinks (e.g. after requesting coverage).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageMaterials = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return available.slice(start, start + PAGE_SIZE);
  }, [available, page]);

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
          {/* The way out of the section: register, unfiltered. One link, one count. */}
          <Link
            to="/material-prioritisation"
            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-foreground transition-colors hover:text-foreground/70"
          >
            View all <span className="tabular-nums">{trackedCount}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
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

      {/* One link, one count. No preview of the register here. */}
      <Link
        to="/material-prioritisation"
        className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="tabular-nums font-medium text-foreground">{trackedCount}</span>
        materials in your portfolio
        <ArrowRight className="h-3 w-3" />
      </Link>

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
