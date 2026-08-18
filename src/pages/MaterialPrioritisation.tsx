import React, { useState } from "react";
import { cn } from "@/lib/utils";
import MaterialRegisterTable from "@/components/MaterialRegisterTable";
import MaterialBrief from "@/components/materialRegister/MaterialBrief";
import AssessmentCoverage from "@/components/materialRegister/AssessmentCoverage";
import ViewingAsSwitcher from "@/components/materialRegister/ViewingAsSwitcher";
import Prioritisation from "@/components/materialRegister/Prioritisation";
import ScopeSelector from "@/components/materialRegister/ScopeSelector";
import PortfolioOverview, { type OverviewTab } from "@/components/materialRegister/PortfolioOverview";
import {
  RegisterProvider,
  useRegister,
  EMPTY_FILTERS,
} from "@/components/materialRegister/registerStore";
import AddMaterialDialog from "@/components/materialRegister/AddMaterialDialog";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";


const TABS = [
  { id: "register", label: "Register" },
  { id: "grid", label: "Visualisation" },
  { id: "assessment", label: "Assessment" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Tier 1 is the overview; the tabs are Tier 2 and are always scoped. */
type View = "overview" | TabId;

const Inner: React.FC = () => {
  const [view, setView] = useState<View>("overview");
  const navigate = useNavigate();

  const [addOpen, setAddOpen] = useState(false);
  const { openId, setScope, setFilters } = useRegister();

  /** Drilling in sets scope and filters, then opens the tab the rule belongs to. */
  const enter: React.ComponentProps<typeof PortfolioOverview>["onEnter"] = (tab, opts) => {
    setScope(opts?.scope ?? null);
    setFilters({ ...EMPTY_FILTERS, ...(opts?.filters ?? {}) });
    setView(tab as OverviewTab);
  };

  const backToOverview = () => {
    setScope(null);
    setFilters(EMPTY_FILTERS);
    setView("overview");
  };

  if (openId) {
    return (
      <div className="h-full w-full overflow-y-auto">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-4">
          <div className="mb-3 flex justify-end">
            <ViewingAsSwitcher />
          </div>
          <MaterialBrief />
        </div>
      </div>
    );
  }

  const overview = view === "overview";

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1400px] space-y-4 px-6 pb-16 pt-4">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (overview ? navigate("/") : backToOverview())}
            className="gap-1.5 h-7 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {overview ? "Back" : "Portfolio overview"}
          </Button>
          <div className="ml-auto flex items-center gap-3">
            <ViewingAsSwitcher />
            {view === "register" && (
              <Button
                size="sm"
                className="gap-1.5 h-7 text-xs bg-foreground text-background hover:bg-foreground/90"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Add material
              </Button>
            )}
          </div>
        </div>

        <header className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {overview ? "Portfolio overview" : "Material Portfolio"}
            </h1>
            {/* The overview is global on purpose: it is what you read to decide
                which scope to enter, so the selector only exists on the tabs. */}
            {!overview && <ScopeSelector />}
          </div>
          <p className="text-xs text-muted-foreground">
            {overview
              ? "What is true about the portfolio right now."
              : "Your material portfolio, ranked and tracked."}
          </p>
        </header>

        {overview ? (
          <PortfolioOverview onEnter={enter} />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setView(t.id)}
                    className={cn(
                      "rounded-md px-3 py-1 text-[11px] font-medium transition-colors",
                      view === t.id
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <AddMaterialDialog open={addOpen} onOpenChange={setAddOpen} />

            {view === "register" && <MaterialRegisterTable />}
            {view === "grid" && <Prioritisation />}
            {view === "assessment" && <AssessmentCoverage />}
          </>
        )}
      </div>
    </div>
  );
};


const MaterialPrioritisation: React.FC = () => (
  <RegisterProvider>
    <Inner />
  </RegisterProvider>
);

export default MaterialPrioritisation;
