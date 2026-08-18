import React from "react";
import { TEAM_LABEL } from "@/config/assessmentCriteria";
import { useRegister } from "@/components/materialRegister/registerStore";

/**
 * Who the session is acting as. Assessment entries are recorded against this
 * person, and each person holds at most one entry per criterion.
 */
const ViewingAsSwitcher: React.FC = () => {
  const { currentUser, setCurrentUser, contributors } = useRegister();

  return (
    <label className="inline-flex items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Viewing as
      </span>
      <select
        value={currentUser.user_id}
        onChange={(e) => setCurrentUser(e.target.value)}
        aria-label="Viewing as"
        className="h-7 rounded-lg border border-border bg-card px-2 text-[11px] text-foreground"
      >
        {contributors.map((c) => (
          <option key={c.user_id} value={c.user_id}>
            {c.name} — {TEAM_LABEL[c.team]}
          </option>
        ))}
      </select>
    </label>
  );
};

export default ViewingAsSwitcher;
