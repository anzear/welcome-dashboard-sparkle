/**
 * AVAILABLE NOW — materials that sit in the Material Portfolio and that VCG has
 * coverage ready for, where the customer has not taken it yet.
 *
 * This is not the portfolio and it is not Your topics. Materials that already
 * have coverage never appear here; they are topics. Availability is a state VCG
 * sets on the material — nothing here derives it.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RoleChip } from "@/components/materialRegister/RoleChip";
import RequestCoverageDialog from "@/components/materialRegister/RequestCoverageDialog";
import { seededMaterials } from "@/components/materialRegister/registerStore";
import { portfolioAdditionRows, PORTFOLIO_ADDITIONS_EVENT } from "@/lib/portfolioAdditions";
import { MATERIAL_ROLE_LABEL, type Material } from "@/types/materialPrioritisation";

const REQUESTED_KEY = "material_coverage_requested";

const readRequested = (): string[] => {
  try {
    const raw = JSON.parse(window.localStorage.getItem(REQUESTED_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
};

/** One line on what the coverage would give them, kept role-aware. */
const coverageLine = (m: Material) =>
  m.role === "existing"
    ? `Alternatives to ${m.name}, who supplies them and where the routes stand today.`
    : `Whether ${m.name} is real at your volumes — routes, suppliers and who else is moving.`;

export const DashboardAvailableNow: React.FC = () => {
  const [requested, setRequested] = useState<string[]>(() => readRequested());
  const [additions, setAdditions] = useState<Material[]>(() => portfolioAdditionRows(seededMaterials));
  const [target, setTarget] = useState<Material | null>(null);

  const refresh = useCallback(() => {
    setAdditions(portfolioAdditionRows(seededMaterials));
  }, []);

  useEffect(() => {
    window.addEventListener(PORTFOLIO_ADDITIONS_EVENT, refresh);
    return () => window.removeEventListener(PORTFOLIO_ADDITIONS_EVENT, refresh);
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

  const confirmRequest = (m: Material) => {
    const next = [...new Set([...requested, m.material_id])];
    try {
      window.localStorage.setItem(REQUESTED_KEY, JSON.stringify(next));
    } catch {
      /* a storage failure must not block the request being shown as made */
    }
    setRequested(next);
    toast("Coverage requested", {
      description: `VCG is building the material brief for ${m.name}. It appears under Your topics when ready.`,
      duration: 6000,
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Empty means hidden — never an empty state. */}
      {available.length > 0 && (
        <section className="space-y-2">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Available now
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Materials in your portfolio where our data is ready.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((m) => (
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
                <p className="text-[11px] leading-relaxed text-muted-foreground">{coverageLine(m)}</p>
                <Button
                  size="sm"
                  className="mt-auto h-7 w-full bg-foreground text-[11px] text-background hover:bg-foreground/90"
                  onClick={() => setTarget(m)}
                >
                  Request coverage
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

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
    </div>
  );
};

export default DashboardAvailableNow;
