import React, { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MaterialBrief from "@/components/materialRegister/MaterialBrief";
import ViewingAsSwitcher from "@/components/materialRegister/ViewingAsSwitcher";
import { blankMaterial } from "@/components/materialRegister/materialEntry";
import {
  CURRENT_USER,
  RegisterProvider,
  useRegister,
} from "@/components/materialRegister/registerStore";

/**
 * Material brief reached from the dashboard / value chain. Renders the exact same
 * structure as the brief inside the Material Portfolio, but always for the
 * material named in the route. If that material is not yet on the register it is
 * added as an empty row first, so the brief still belongs to the right material.
 */
const Inner: React.FC = () => {
  const navigate = useNavigate();
  const { topic } = useParams();
  const name = topic ? decodeURIComponent(topic).trim() : "";
  const { data, openId, openBrief, addMaterials } = useRegister();
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current || !name) return;
    const hit = data.find((m) => m.name.trim().toLowerCase() === name.toLowerCase());
    if (hit) {
      bootstrapped.current = true;
      openBrief(hit.material_id);
      return;
    }
    bootstrapped.current = true;
    const [id] = addMaterials([{ ...blankMaterial(), name }], {
      batchOrigin: "real_transition",
      source: CURRENT_USER,
    });
    if (id) openBrief(id);
  }, [name, data, openBrief, addMaterials]);

  const [view, setView] = React.useState<"brief" | "research">("brief");

  const tabs: { id: "brief" | "research"; label: string }[] = [
    { id: "brief", label: "Material brief" },
    { id: "research", label: "Research space" },
  ];

  return (
    <div className="portfolio-type h-full w-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-1 rounded-md bg-muted p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setView(t.id)}
                className={`rounded px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
                  view === t.id
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <ViewingAsSwitcher />
        </div>
        {view === "brief" ? (
          openId ? <MaterialBrief onBack={() => navigate(-1)} /> : null
        ) : (
          <div className="rounded-lg border bg-card px-6 py-16 text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Research space
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {name ? `Research space for ${name} is coming soon.` : "Coming soon."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const MaterialBriefSimple: React.FC = () => (
  <RegisterProvider>
    <Inner />
  </RegisterProvider>
);

export default MaterialBriefSimple;
