import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import MaterialRegisterTable from "@/components/MaterialRegisterTable";
import MaterialBrief from "@/components/materialRegister/MaterialBrief";
import AssessmentCoverage from "@/components/materialRegister/AssessmentCoverage";
import ViewingAsSwitcher from "@/components/materialRegister/ViewingAsSwitcher";
import Prioritisation from "@/components/materialRegister/Prioritisation";
import ScopeSelector from "@/components/materialRegister/ScopeSelector";
import { RegisterProvider, useRegister } from "@/components/materialRegister/registerStore";
import AddMaterialDialog from "@/components/materialRegister/AddMaterialDialog";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = [
  { id: "register", label: "Register" },
  { id: "grid", label: "Visualisation" },
  { id: "assessment", label: "Assessment" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const Inner: React.FC = () => {
  const [view, setView] = useState<TabId>("register");
  const [addOpen, setAddOpen] = useState(false);
  const { openId } = useRegister();

  if (openId) {
    return (
      <div className="portfolio-type h-full w-full overflow-y-auto">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-4">
          <div className="mb-3 flex justify-end">
            <ViewingAsSwitcher />
          </div>
          <MaterialBrief />
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-type h-full w-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1400px] space-y-4 px-6 pb-16 pt-4">
        <div className="flex items-center justify-end gap-3">
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

        <header className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Material Portfolio
            </h1>
            <ScopeSelector />
          </div>
          <p className="text-xs text-muted-foreground">
            Your material portfolio, ranked and tracked.
          </p>
        </header>

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
