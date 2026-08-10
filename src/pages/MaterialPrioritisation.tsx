import React, { useState } from "react";
import { cn } from "@/lib/utils";
import MaterialRegisterTable from "@/components/MaterialRegisterTable";
import MaterialBrief from "@/components/materialRegister/MaterialBrief";
import DriverScoring from "@/components/materialRegister/DriverScoring";
import PrioritisationGrid from "@/components/materialRegister/PrioritisationGrid";
import { RegisterProvider, useRegister } from "@/components/materialRegister/registerStore";
import AddMaterialDialog from "@/components/materialRegister/AddMaterialDialog";
import { Plus } from "lucide-react";

const TABS = [
  { id: "register", label: "Register" },
  { id: "grid", label: "Prioritisation Grid" },
  { id: "scoring", label: "Driver Scoring" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const Inner: React.FC = () => {
  const [tab, setTab] = useState<TabId>("register");
  const [addOpen, setAddOpen] = useState(false);
  const { openId } = useRegister();

  if (openId) {
    return (
      <div className="h-full w-full overflow-y-auto p-4">
        <MaterialBrief />
      </div>
    );
  }

  return (
    <div className="h-full w-full space-y-4 overflow-y-auto p-4 pb-16">
      <header className="space-y-0.5">
        <h1 className="text-base font-semibold tracking-tight text-foreground">Material Prioritisation</h1>
        <p className="text-xs text-muted-foreground">Your material portfolio, ranked and tracked.</p>
      </header>

      <div className="flex items-center gap-3 rounded-t-md bg-muted/30 px-2 py-1.5">
        <div className="inline-flex items-center gap-1 rounded-md bg-muted p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-[4px] px-2.5 py-1 text-[11px] font-medium transition-colors",
                tab === t.id ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "register" && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="ml-auto inline-flex items-center gap-1 rounded-sm bg-foreground px-2 py-1 text-[11px] font-medium text-background hover:bg-foreground/90"
          >
            <Plus className="h-3 w-3" /> Add material
          </button>
        )}
      </div>
      <AddMaterialDialog open={addOpen} onOpenChange={setAddOpen} />


      {tab === "register" && <MaterialRegisterTable />}
      {tab === "grid" && <PrioritisationGrid />}
      {tab === "scoring" && <DriverScoring />}
    </div>
  );
};

const MaterialPrioritisation: React.FC = () => (
  <RegisterProvider>
    <Inner />
  </RegisterProvider>
);

export default MaterialPrioritisation;
