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
import { Button } from "@/components/ui/button";


const TABS = [
  { id: "register", label: "Register" },
  { id: "grid", label: "Visualisation" },
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
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-1.5 h-7 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>
          {tab === "register" && (
            <Button size="sm" className="gap-1.5 h-7 text-xs bg-foreground text-background hover:bg-foreground/90" onClick={() => setAddOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
              Add material
            </Button>
          )}
        </div>

        <header className="space-y-1">
          <h1 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Material Portfolio
          </h1>
          <p className="text-xs text-muted-foreground">Your material portfolio, ranked and tracked.</p>
        </header>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-md px-3 py-1 text-[11px] font-medium transition-colors",
                  tab === t.id ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
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
