import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRegister } from "@/components/materialRegister/registerStore";
import { StatusPill } from "@/components/materialRegister/primitives";
import { JUDGED_CRITERIA } from "@/config/assessmentCriteria";
import {
  LINK_SECTION_LABEL,
  MATERIAL_ROLE_LABEL,
  oppositeRole,
  type Material,
} from "@/types/materialPrioritisation";

/**
 * Links between opposite roles. A link is a statement of candidacy only: it
 * carries no decision and no score, and nothing about either side is derived
 * from the other.
 */
const BriefLinks: React.FC<{ material: Material }> = ({ material }) => {
  const { toggleLink, linkCandidates, linkedMaterials, entriesFor, openBrief } = useRegister();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const linked = linkedMaterials(material.material_id);
  const candidates = useMemo(
    () => (adding ? linkCandidates(material.material_id, query).slice(0, 8) : []),
    [adding, query, material.material_id, material.linked_material_ids, linkCandidates],
  );

  /** Filled criteria = criteria with at least one entry. Never a score. */
  const filledCount = (id: string) =>
    JUDGED_CRITERIA.filter((c) => entriesFor(id, c.criterion_id).length > 0).length;

  const other = MATERIAL_ROLE_LABEL[oppositeRole(material.role)].toLowerCase();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {LINK_SECTION_LABEL[material.role]}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-6 gap-1 text-[11px]"
          onClick={() => {
            setAdding((v) => !v);
            setQuery("");
          }}
        >
          <Plus className="h-3 w-3" />
          Link {other}
        </Button>
      </div>

      {adding && (
        <div className="rounded-md border border-border/70 bg-muted/20 p-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${other}s by name`}
            className="h-7 text-[11px]"
          />
          <ul className="mt-1.5 max-h-44 space-y-0.5 overflow-y-auto">
            {candidates.length === 0 ? (
              <li className="px-1 py-1 text-[11px] text-muted-foreground">No match.</li>
            ) : (
              candidates.map((c) => (
                <li key={c.material_id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded px-1 py-1 text-left hover:bg-muted"
                    onClick={() => {
                      toggleLink(material.material_id, c.material_id, true);
                      setQuery("");
                      setAdding(false);
                    }}
                  >
                    <span className="truncate text-[11px] text-foreground">{c.name}</span>
                    <span className="ml-auto shrink-0">
                      <StatusPill status={c.journey_status} />
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {linked.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Nothing linked yet. Links are recorded by hand, never inferred.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {linked.map((l) => (
            <li key={l.material_id} className="flex items-center gap-2 py-1.5">
              <button
                type="button"
                onClick={() => openBrief(l.material_id)}
                className="truncate text-left text-[11px] text-foreground hover:underline"
              >
                {l.name}
              </button>
              <span className="ml-auto shrink-0">
                <StatusPill status={l.journey_status} />
              </span>
              <span
                className="shrink-0 tabular-nums text-[10px] text-muted-foreground"
                title="Criteria with at least one entry"
              >
                {filledCount(l.material_id)}/{JUDGED_CRITERIA.length}
              </span>
              {confirmId === l.material_id ? (
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="text-[10px] font-medium text-destructive hover:underline"
                    onClick={() => {
                      toggleLink(material.material_id, l.material_id, false);
                      setConfirmId(null);
                    }}
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    className="text-[10px] text-muted-foreground hover:underline"
                    onClick={() => setConfirmId(null)}
                  >
                    Keep
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  aria-label={`Remove link to ${l.name}`}
                  className={cn("shrink-0 opacity-50 hover:opacity-100")}
                  onClick={() => setConfirmId(l.material_id)}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BriefLinks;
