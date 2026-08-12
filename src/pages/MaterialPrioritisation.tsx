import React, { useState } from "react";
import { cn } from "@/lib/utils";
import MaterialRegisterTable from "@/components/MaterialRegisterTable";
import MaterialBrief from "@/components/materialRegister/MaterialBrief";
import DriverScoring from "@/components/materialRegister/DriverScoring";
import Prioritisation from "@/components/materialRegister/Prioritisation";
import { RegisterProvider, useRegister } from "@/components/materialRegister/registerStore";
import AddMaterialDialog from "@/components/materialRegister/AddMaterialDialog";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";


const TABS = [
  { id: "register", label: "Register" },
  { id: "grid", label: "Prioritisation" },
  { id: "scoring", label: "Driver Scoring" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const Inner: React.FC = () => {
  const [tab, setTab] = useState<TabId>("register");
  const navigate = useNavigate();

  const [addOpen, setAddOpen] = useState(false);
  const { openId } = useRegister();

  if (openId) {
    return (
      <div className="h-full w-full overflow-y-auto">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-4">
          <MaterialBrief />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1400px] space-y-4 px-6 pb-16 pt-4">
        <header className="space-y-1">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Dashboard
          </button>
          <h1 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Material Prioritisation
          </h1>
          <p className="text-xs text-muted-foreground">Your material portfolio, ranked and tracked.</p>
        </header>


        <div className="flex items-center gap-3">

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
        {tab === "grid" && <Prioritisation onOpenScoring={() => setTab("scoring")} />}
        {tab === "scoring" && <DriverScoring />}
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
