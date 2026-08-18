import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, FileText, Paperclip, Plus, Trash2, Upload, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface RequirementDoc {
  id: string;
  name: string;
  description: string;
  fileName: string | null;
  /** true = nobody uploaded it yet, it was requested from someone */
  requested: boolean;
  requestedFrom: string;
}

export type EvidenceState = RequirementDoc[];

export const emptyEvidence = (): EvidenceState => [];

/** Documents actually attached (a request with no file does not count). */
export const evidenceFilledCount = (e: EvidenceState) =>
  (e ?? []).filter((d) => d.fileName).length;

export const evidenceRequestedCount = (e: EvidenceState) =>
  (e ?? []).filter((d) => d.requested && !d.fileName).length;

const newId = () => Math.random().toString(36).slice(2, 10);

const blankDoc = (requested: boolean): RequirementDoc => ({
  id: newId(),
  name: "",
  description: "",
  fileName: null,
  requested,
  requestedFrom: "",
});

const DocRow: React.FC<{
  doc: RequirementDoc;
  onChange: (patch: Partial<RequirementDoc>) => void;
  onRemove: () => void;
}> = ({ doc, onChange, onRemove }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-start gap-2">
        <div className="mt-1.5 shrink-0 text-muted-foreground">
          {doc.fileName ? <FileText className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            value={doc.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Document name"
            className="h-8 text-[12px]"
          />
          <Textarea
            value={doc.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="What this document covers and why it matters"
            rows={2}
            className="min-h-0 resize-none text-[11px]"
          />

          {doc.requested && (
            <Input
              value={doc.requestedFrom}
              onChange={(e) => onChange({ requestedFrom: e.target.value })}
              placeholder="Requested from (person, team or function)"
              className="h-8 text-[11px]"
            />
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onChange({ fileName: f.name });
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-1.5 h-3 w-3" />
              {doc.fileName ? "Replace file" : "Upload file"}
            </Button>
            {doc.fileName ? (
              <>
                <span className="min-w-0 truncate text-[11px] text-foreground" title={doc.fileName}>
                  {doc.fileName}
                </span>
                <button
                  type="button"
                  onClick={() => onChange({ fileName: null })}
                  className="text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
                >
                  remove file
                </button>
              </>
            ) : (
              <span
                className={cn(
                  "text-[10px]",
                  doc.requested ? "text-amber-600" : "text-muted-foreground",
                )}
              >
                {doc.requested ? "requested — not received" : "no file attached"}
              </span>
            )}
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove document"
              className="ml-auto text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MaterialRequirementsDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: EvidenceState;
  onSave: (v: EvidenceState) => void;
}> = ({ open, onOpenChange, value, onSave }) => {
  const [draft, setDraft] = useState<EvidenceState>(value ?? []);

  const attached = evidenceFilledCount(draft);
  const requested = evidenceRequestedCount(draft);

  const patch = (id: string, p: Partial<RequirementDoc>) =>
    setDraft((prev) => prev.map((d) => (d.id === id ? { ...d, ...p } : d)));

  const uploads = draft.filter((d) => !d.requested);
  const requests = draft.filter((d) => d.requested);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <div className="flex items-start gap-3 border-b border-border bg-muted/40 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card">
            <Upload className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">Material requirements</div>
            <p className="text-[12px] text-muted-foreground">
              Upload any document, give it a name and a short description. Requests work the same way.
            </p>
          </div>
          <div className="pt-1 text-right text-[11px] tabular-nums text-muted-foreground">
            <div>{attached} attached</div>
            {requested > 0 && <div className="text-amber-600">{requested} requested</div>}
          </div>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
          <section>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Uploaded documents
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setDraft((p) => [...p, blankDoc(false)])}
              >
                <Plus className="mr-1.5 h-3 w-3" />
                Add document
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {uploads.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted-foreground">
                  No documents yet.
                </p>
              ) : (
                uploads.map((d) => (
                  <DocRow
                    key={d.id}
                    doc={d}
                    onChange={(p) => patch(d.id, p)}
                    onRemove={() => setDraft((prev) => prev.filter((x) => x.id !== d.id))}
                  />
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Requested documents
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setDraft((p) => [...p, blankDoc(true)])}
              >
                <UserPlus className="mr-1.5 h-3 w-3" />
                Request document
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {requests.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted-foreground">
                  Nothing requested. Name what is missing and who should provide it.
                </p>
              ) : (
                requests.map((d) => (
                  <DocRow
                    key={d.id}
                    doc={d}
                    onChange={(p) => patch(d.id, p)}
                    onRemove={() => setDraft((prev) => prev.filter((x) => x.id !== d.id))}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
          <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-[12px]"
            onClick={() => {
              onSave(draft.filter((d) => d.name.trim() || d.fileName || d.description.trim()));
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
