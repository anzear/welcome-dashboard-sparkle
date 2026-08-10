import React, { useState } from "react";
import { cn } from "@/lib/utils";
import MaterialRegisterTable from "@/components/MaterialRegisterTable";

const TABS = [
  { id: "register", label: "Register" },
  { id: "grid", label: "Prioritisation Grid" },
  { id: "scoring", label: "Driver Scoring" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const Placeholder: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex min-h-[280px] items-center justify-center rounded-md border border-dashed border-border">
    <p className="text-xs text-muted-foreground">{label} — coming in a later round.</p>
  </div>
);

const MaterialPrioritisation: React.FC = () => {
  const [tab, setTab] = useState<TabId>("register");

  return (
    <div className="w-full space-y-4 p-4">
      <header className="space-y-0.5">
        <h1 className="text-base font-semibold tracking-tight text-foreground">Material Prioritisation</h1>
        <p className="text-xs text-muted-foreground">Your material portfolio, ranked and tracked.</p>
      </header>

      <div className="inline-flex items-center gap-1 rounded-md bg-muted p-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-[4px] px-2.5 py-1 text-[11px] font-medium transition-colors",
              tab === t.id
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "register" && <MaterialRegisterTable />}
      {tab === "grid" && <Placeholder label="Prioritisation Grid" />}
      {tab === "scoring" && <Placeholder label="Driver Scoring" />}
    </div>
  );
};

export default MaterialPrioritisation;
