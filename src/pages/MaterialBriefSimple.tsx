import React, { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MaterialBrief from "@/components/materialRegister/MaterialBrief";
import ResearchSpace from "@/components/materialRegister/ResearchSpace";
import ViewingAsSwitcher from "@/components/materialRegister/ViewingAsSwitcher";
import { prototypeBriefSeed } from "@/components/materialRegister/materialEntry";
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
  const { data, openId, openBrief, addMaterials, updateMaterial, assessmentState, saveAssessment } = useRegister();
  const bootstrapped = useRef(false);

  // Prototype: seed one set of driver judgements so the Drivers card reads as
  // evaluated. Skipped the moment anyone has judged a criterion themselves.
  const seedDrivers = (materialId: string) => {
    const scores: [string, number, string][] = [
      ["regulatory_pressure", 3, "EU pressure is steady but not forcing a switch this year."],
      ["market_pull", 4, "Two beverage customers have asked for a bio-based grade."],
      ["competitive_advantage", 3, "Comparable to incumbents; no clear edge yet."],
      ["economic_case", 2, "Current bio-based quotes sit above the price ceiling."],
      ["supply_security", 3, "Three qualified producers in Europe; single-source risk remains."],
      ["sustainability_impact", 5, "Cradle-to-gate figures clearly beat the incumbent."],
      ["product_performance", 4, "Bench trials hold viscosity within spec; stability run pending."],
    ];
    scores.forEach(([criterionId, score, note]) => {
      if (assessmentState(materialId, criterionId).scoredCount === 0) {
        saveAssessment(materialId, criterionId, score, note);
      }
    });
  };

  useEffect(() => {
    if (bootstrapped.current || !name) return;
    const hit = data.find((m) => m.name.trim().toLowerCase() === name.toLowerCase());
    if (hit) {
      bootstrapped.current = true;
      // Prototype: a row that was created blank (e.g. by an earlier visit) gets
      // the worked-example profile so the brief never reads empty.
      const { name: _n, ...seedPatch } = prototypeBriefSeed(hit.name);
      if (!hit.material_class) {
        updateMaterial(hit.material_id, seedPatch);
      } else if (!hit.recommendation) {
        // Existing seeded row predates the mock recommendation — add just that.
        updateMaterial(hit.material_id, { recommendation: seedPatch.recommendation });
      }
      seedDrivers(hit.material_id);
      openBrief(hit.material_id);
      return;
    }
    bootstrapped.current = true;
    const [id] = addMaterials([prototypeBriefSeed(name)], {
      batchOrigin: "real_transition",
      source: CURRENT_USER,
    });
    if (id) {
      seedDrivers(id);
      openBrief(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, data, openBrief, addMaterials, updateMaterial]);

  const [view, setView] = React.useState<"brief" | "research">("research");

  const tabs: { id: "brief" | "research"; label: string }[] = [
    { id: "research", label: "Research Space" },
    { id: "brief", label: "Material Profile" },
  ];

  const toggle = (
    <div className="flex items-center justify-between gap-4">
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
  );

  return (
    <div className="portfolio-type h-full w-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-4">
        {openId ? (
          <MaterialBrief
            onBack={() => navigate(-1)}
            tabsSlot={toggle}
            bodyReplacement={
              view === "research" ? (
                <ResearchSpace />
              ) : undefined
            }
          />
        ) : null}
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
