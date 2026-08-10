import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Upload, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export type EvidenceSlotId =
  | "target_spec"
  | "product_requirements"
  | "sustainability_targets"
  | "customer_requirements"
  | "regulatory"
  | "strategy";

export type EvidenceState = Record<EvidenceSlotId, { link: string | null; requested: boolean }>;

export const EVIDENCE_SLOTS: {
  id: EvidenceSlotId;
  title: string;
  hint: string;
  contributors: string;
}[] = [
  {
    id: "target_spec",
    title: "Target material specification",
    hint: "target technical spec, desired properties, performance targets, candidate datasheets",
    contributors: "R&D, Procurement",
  },
  {
    id: "product_requirements",
    title: "Product requirements",
    hint: "formulation requirements, quality spec, application requirements",
    contributors: "R&D, Product, Quality",
  },
  {
    id: "sustainability_targets",
    title: "Sustainability targets",
    hint: "renewable carbon target, PCF target, Scope 3 reduction goal, circularity ambition",
    contributors: "Sustainability",
  },
  {
    id: "customer_requirements",
    title: "Customer requirements",
    hint: "customer spec, tender requirement, key account brief, customer sustainability requirement",
    contributors: "Sales, Product",
  },
  {
    id: "regulatory",
    title: "Regulatory & compliance requirements",
    hint: "REACH, FDA / food-contact, CLP, regional restrictions, certification requirements",
    contributors: "Regulatory, Quality",
  },
  {
    id: "strategy",
    title: "Strategy",
    hint: "innovation roadmap, sustainability roadmap, business case, investment rationale",
    contributors: "Strategy, Business Unit",
  },
];

export const emptyEvidence = (): EvidenceState =>
  EVIDENCE_SLOTS.reduce((acc, s) => {
    acc[s.id] = { link: null, requested: false };
    return acc;
  }, {} as EvidenceState);

export const evidenceFilledCount = (e: EvidenceState) =>
  EVIDENCE_SLOTS.filter((s) => e[s.id]?.link).length;

const MaterialRequirementsDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: EvidenceState;
  onSave: (v: EvidenceState) => void;
}> = ({ open, onOpenChange, value, onSave }) => {
  const [draft, setDraft] = useState<EvidenceState>(value);
  const [editing, setEditing] = useState<EvidenceSlotId | null>(null);
  const [linkText, setLinkText] = useState("");

  const filled = evidenceFilledCount(draft);
  const pct = Math.round((filled / EVIDENCE_SLOTS.length) * 100);

  const set = (id: EvidenceSlotId, patch: Partial<EvidenceState[EvidenceSlotId]>) =>
    setDraft((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <div className="flex items-start gap-3 border-b border-border bg-muted/40 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card">
            <Upload className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">
              <span className="mr-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Step 3 ·
              </span>
              Material Requirements
            </div>
            <p className="text-[12px] text-muted-foreground">Upload supporting docs</p>
          </div>
          <div className="pt-1 text-[12px] tabular-nums text-muted-foreground">{pct}%</div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Material requirements
              </div>
            </div>
            <p className="mt-1 max-w-2xl text-[12px] text-muted-foreground">
              Upload or link the documents that define what this material must achieve, what it should be
              benchmarked against, and what constraints must be considered.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {EVIDENCE_SLOTS.map((s) => {
                const st = draft[s.id];
                const state = st?.link ? "attached" : st?.requested ? "requested" : "empty";
                return (
                  <div key={s.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[12px] font-semibold text-foreground">{s.title}</div>
                      <span
                        className={cn(
                          "shrink-0 text-[10px]",
                          state === "attached"
                            ? "text-emerald-600"
                            : state === "requested"
                              ? "text-amber-600"
                              : "text-muted-foreground",
                        )}
                      >
                        {state}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-primary/80">{s.hint}</p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">Contributors: {s.contributors}</p>

                    {st?.link && (
                      <p className="mt-1.5 truncate text-[11px] text-foreground" title={st.link}>
                        {st.link}
                      </p>
                    )}

                    {editing === s.id ? (
                      <div className="mt-2 flex gap-2">
                        <Input
                          autoFocus
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          placeholder="Paste a link or file name"
                          className="h-8 text-[12px]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              set(s.id, { link: linkText.trim() || null });
                              setEditing(null);
                              setLinkText("");
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="h-8 text-[11px]"
                          onClick={() => {
                            set(s.id, { link: linkText.trim() || null });
                            setEditing(null);
                            setLinkText("");
                          }}
                        >
                          Attach
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[11px]"
                          onClick={() => {
                            setEditing(s.id);
                            setLinkText(st?.link ?? "");
                          }}
                        >
                          <Upload className="mr-1.5 h-3 w-3" />
                          Upload / link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[11px]"
                          onClick={() => set(s.id, { requested: !st?.requested })}
                        >
                          <UserPlus className="mr-1.5 h-3 w-3" />
                          {st?.requested ? "Requested" : "Request"}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <div className="text-[12px] font-semibold text-foreground">Evidence readiness</div>
              <div className="text-[11px] text-muted-foreground">
                {filled === 0
                  ? "No evidence uploaded"
                  : `${filled} of ${EVIDENCE_SLOTS.length} areas covered`}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
          <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-[12px]"
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialRequirementsDialog;
