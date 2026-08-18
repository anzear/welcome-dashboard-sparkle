import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, FileText, Image, Mail, Paperclip, Presentation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRegister } from "@/components/materialRegister/registerStore";
import { shortDate } from "@/components/materialRegister/primitives";
import type { DocumentFileType, SupportingDocument } from "@/types/materialPrioritisation";

const ICON: Record<DocumentFileType, React.ElementType> = {
  pdf: FileText,
  docx: FileText,
  xlsx: FileSpreadsheet,
  pptx: Presentation,
  msg: Mail,
  png: Image,
};

const EXT_TYPE: Record<string, DocumentFileType> = {
  pdf: "pdf",
  doc: "docx",
  docx: "docx",
  xls: "xlsx",
  xlsx: "xlsx",
  csv: "xlsx",
  ppt: "pptx",
  pptx: "pptx",
  msg: "msg",
  eml: "msg",
  png: "png",
  jpg: "png",
  jpeg: "png",
};

const typeOf = (filename: string): DocumentFileType =>
  EXT_TYPE[filename.split(".").pop()?.toLowerCase() ?? ""] ?? "pdf";

/** Mock size string. Nothing is stored, so the number is only ever indicative. */
const sizeOf = (bytes: number) =>
  bytes >= 1_000_000 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const DocIcon: React.FC<{ type: DocumentFileType; className?: string }> = ({ type, className }) => {
  const Cmp = ICON[type];
  return <Cmp className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground", className)} />;
};

/** Metadata and the note. Deliberately not "Open" — there is no file behind it. */
const DetailsDialog: React.FC<{ doc: SupportingDocument | null; onClose: () => void }> = ({ doc, onClose }) => (
  <Dialog open={doc !== null} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="text-[11px] font-bold uppercase tracking-widest">Document details</DialogTitle>
      </DialogHeader>
      {doc && (
        <div className="space-y-2 text-[11px]">
          <div className="flex items-start gap-2">
            <DocIcon type={doc.file_type} />
            <span className="break-all font-medium text-foreground">{doc.filename}</span>
          </div>
          {doc.note ? (
            <p className="leading-snug text-foreground">“{doc.note}”</p>
          ) : (
            <p className="text-muted-foreground">No note recorded.</p>
          )}
          <div className="border-t border-border/70 pt-2 font-mono text-[10px] text-muted-foreground">
            {doc.uploaded_by} · {shortDate(doc.uploaded_date)} · {doc.file_type.toUpperCase()}
          </div>
          <p className="text-[10px] leading-snug text-muted-foreground">
            Demo record. The file itself is not stored here and cannot be opened or downloaded.
          </p>
        </div>
      )}
    </DialogContent>
  </Dialog>
);

/** File plus an optional one line. No category, no tag, no description field. */
const AttachDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  criterionLabel: string;
  onAttach: (file: { filename: string; file_type: DocumentFileType; size: string }, note: string | null) => void;
}> = ({ open, onOpenChange, criterionLabel, onAttach }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<{ filename: string; file_type: DocumentFileType; size: string } | null>(
    null,
  );
  const [note, setNote] = useState("");

  const reset = () => {
    setPicked(null);
    setNote("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[11px] font-bold uppercase tracking-widest">
            Attach document · {criterionLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setPicked({ filename: f.name, file_type: typeOf(f.name), size: sizeOf(f.size) });
            }}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => inputRef.current?.click()}
            >
              Choose file
            </Button>
            {picked ? (
              <span className="flex min-w-0 items-center gap-1.5 text-[11px]">
                <DocIcon type={picked.file_type} />
                <span className="truncate text-foreground">{picked.filename}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{picked.size}</span>
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">No file chosen</span>
            )}
          </div>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What this document shows (optional)"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />

          <p className="text-[10px] leading-snug text-muted-foreground">
            The document is recorded against this criterion and visible to everyone working on the material.
            Demo only — the file is not stored.
          </p>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-[11px]"
              disabled={picked === null}
              onClick={() => {
                if (!picked) return;
                onAttach(picked, note.trim() || null);
                reset();
                onOpenChange(false);
              }}
            >
              Attach
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * The evidence behind one judged criterion. Documents are criterion-level and
 * shared: whoever holds the file can attach it, whether or not they scored.
 */
const CriterionDocuments: React.FC<{
  materialId: string;
  criterionId: string;
  criterionLabel: string;
}> = ({ materialId, criterionId, criterionLabel }) => {
  const { documentsFor, addDocument, canDeleteDocument, deleteDocument } = useRegister();
  const docs = documentsFor(materialId, criterionId);
  const [attachOpen, setAttachOpen] = useState(false);
  const [details, setDetails] = useState<SupportingDocument | null>(null);
  const [showAll, setShowAll] = useState(false);

  const shown = showAll ? docs : docs.slice(0, 3);

  return (
    <div className="space-y-1.5 pt-1.5">
      {docs.length === 0 ? (
        <button
          type="button"
          aria-label={`Attach a document to ${criterionLabel}`}
          title="Attach document"
          onClick={() => setAttachOpen(true)}
          className="inline-flex items-center text-muted-foreground/70 hover:text-foreground"
        >
          <Paperclip className="h-3 w-3" />
        </button>
      ) : (
        <>
          <ul className="space-y-1">
            {shown.map((d) => (
              <li key={d.document_id} className="flex items-start gap-2">
                <DocIcon type={d.file_type} className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[10px] text-foreground" title={d.filename}>
                    {d.filename}
                  </div>
                  {d.note && <div className="text-[10px] leading-snug text-muted-foreground/90">“{d.note}”</div>}
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {d.uploaded_by} · {shortDate(d.uploaded_date)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setDetails(d)}
                    className="text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
                  >
                    Details
                  </button>
                  {canDeleteDocument(d) && (
                    <button
                      type="button"
                      aria-label={`Delete ${d.filename}`}
                      onClick={() => deleteDocument(d.document_id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            {docs.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                {showAll ? "Show fewer" : `Show all ${docs.length}`}
              </button>
            )}
            <button
              type="button"
              onClick={() => setAttachOpen(true)}
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              <Paperclip className="h-3 w-3" />
              Attach document
            </button>
          </div>
        </>
      )}

      <AttachDialog
        open={attachOpen}
        onOpenChange={setAttachOpen}
        criterionLabel={criterionLabel}
        onAttach={(file, note) => addDocument(materialId, criterionId, file, note)}
      />
      <DetailsDialog doc={details} onClose={() => setDetails(null)} />
    </div>
  );
};

export default CriterionDocuments;
