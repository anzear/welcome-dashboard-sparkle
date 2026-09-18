import { useRef, useState } from "react";
import { FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** One attached file. Prototype only — nothing is stored server-side. */
export type ItemDocument = {
  id: string;
  name: string;
  uploader: string;
  /** Display date, e.g. "12 Sept 2026". */
  date: string;
};

export type DocumentMap = Record<string, ItemDocument[]>;

const today = () =>
  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function makeDocument(name: string, uploader: string): ItemDocument {
  return { id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, uploader, date: today() };
}

/**
 * Per-item document state for one shortlist table. Keyed by item id; documents
 * live alongside notes and never replace them.
 */
export function useItemDocuments(seed: DocumentMap = {}) {
  const [documents, setDocuments] = useState<DocumentMap>(seed);

  const addDocuments = (itemId: string, names: string[], uploader: string) =>
    setDocuments((current) => ({
      ...current,
      [itemId]: [...(current[itemId] ?? []), ...names.map((name) => makeDocument(name, uploader))],
    }));

  const removeDocument = (itemId: string, documentId: string) =>
    setDocuments((current) => ({
      ...current,
      [itemId]: (current[itemId] ?? []).filter((document) => document.id !== documentId),
    }));

  return { documents, addDocuments, removeDocument };
}

/**
 * Compact attach control: paperclip with a count, opening the attached file list
 * and an upload picker. Sits beside the note field as its own control.
 */
export function DocumentAttachControl({
  itemLabel,
  documents,
  onUpload,
  onRemove,
}: {
  itemLabel: string;
  documents: ItemDocument[];
  onUpload: (names: string[]) => void;
  onRemove: (documentId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const count = documents.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={count > 0 ? `${count} document${count === 1 ? "" : "s"} attached` : "Attach a document"}
          aria-label={`Documents for ${itemLabel}`}
          className="flex shrink-0 items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Paperclip className={count > 0 ? "h-3.5 w-3.5 text-foreground" : "h-3.5 w-3.5"} />
          {count > 0 && <span className="text-[10px] font-medium tabular-nums">{count}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Documents</p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground" title={itemLabel}>
          {itemLabel}
        </p>

        <div className="mt-2 space-y-1.5">
          {count === 0 ? (
            <p className="text-[10px] text-muted-foreground">No documents attached yet.</p>
          ) : (
            documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2 py-1.5"
              >
                <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[10px] font-medium text-foreground" title={document.name}>
                    {document.name}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {document.uploader} · {document.date}
                  </div>
                </div>
                <button
                  type="button"
                  title="Remove document"
                  aria-label={`Remove ${document.name}`}
                  onClick={() => onRemove(document.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            const names = Array.from(event.target.files ?? []).map((file) => file.name);
            if (names.length > 0) onUpload(names);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 h-7 w-full gap-1.5 text-[10px] font-normal"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3 w-3" />
          Upload document
        </Button>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Work Space level documents — general research files for the whole material,
 * not scoped to any shortlisted item.
 */
export function WorkSpaceDocumentsCard({
  currentUser,
  seed = [],
}: {
  currentUser: string;
  seed?: ItemDocument[];
}) {
  const [documents, setDocuments] = useState<ItemDocument[]>(seed);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="flex items-center gap-2 text-xs">
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold text-foreground">Documents</span>
          <span className="text-[10px] text-muted-foreground">General files for this material</span>
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length > 0) {
              setDocuments((current) => [
                ...current,
                ...files.map((file) => makeDocument(file.name, currentUser)),
              ]);
            }
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-[10px] font-normal"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3 w-3" />
          Upload document
        </Button>
      </div>

      <div className="border-t border-border">
        {documents.length === 0 ? (
          <p className="px-4 py-3 text-[10px] text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <div className="divide-y divide-border/40">
            {documents.map((document) => (
              <div key={document.id} className="flex h-11 items-center gap-3 px-4">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-foreground" title={document.name}>
                  {document.name}
                </span>
                <span className="w-24 shrink-0 text-[10px] text-muted-foreground">{document.date}</span>
                <span className="w-24 shrink-0 truncate text-[10px] text-muted-foreground">{document.uploader}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  title="Delete document"
                  aria-label={`Delete ${document.name}`}
                  onClick={() => setDocuments((current) => current.filter((item) => item.id !== document.id))}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Prototype helper: attaches mock example files to rows by position so the
 * layout can be reviewed with real-looking file names.
 */
export function mockSeedByIndex(
  ids: string[],
  entries: Record<number, { name: string; uploader: string; date: string }[]>,
): DocumentMap {
  const seed: DocumentMap = {};
  Object.entries(entries).forEach(([index, files]) => {
    const id = ids[Number(index)];
    if (!id) return;
    seed[id] = files.map((file, position) => ({ id: `${id}-doc-${position}`, ...file }));
  });
  return seed;
}
