import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
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

  return (
    <div className="portfolio-type h-full w-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-4">
        <div className="mb-3 flex justify-end">
          <ViewingAsSwitcher />
        </div>
        {openId ? <MaterialBrief /> : null}
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
