import React, { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import MaterialBrief from "@/components/materialRegister/MaterialBrief";
import ViewingAsSwitcher from "@/components/materialRegister/ViewingAsSwitcher";
import { RegisterProvider, useRegister } from "@/components/materialRegister/registerStore";

/**
 * Material brief reached from the value chain. Renders the exact same brief as
 * the Material Portfolio — same gate, assessment, comments and history — for the
 * material named in the route.
 */
const Inner: React.FC = () => {
  const { topic } = useParams();
  const name = topic ? decodeURIComponent(topic) : "";
  const { ordered, openId, openBrief } = useRegister();

  const target = useMemo(() => {
    if (!ordered.length) return null;
    const hit = ordered.find(
      (r) => r.m.name.toLowerCase() === name.toLowerCase(),
    );
    return hit ?? ordered[0];
  }, [ordered, name]);

  useEffect(() => {
    if (target && !openId) openBrief(target.m.material_id);
  }, [target, openId, openBrief]);

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
