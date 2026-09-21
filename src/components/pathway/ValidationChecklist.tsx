import { useEffect, useRef, useState } from "react";
import { FileText, MessageSquare, MessageSquarePlus, Paperclip, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VALIDATION_CHANGED_EVENT,
  VALIDATION_CURRENT_USER,
  VALIDATION_FUNCTIONS,
  functionStatus,
  readValidationChecklist,
  setFunctionStatus,
  statusesFor,
  validationStatusClass,
  writeValidationChecklist,
  type ValidationChecklist as Checklist,
  type ValidationFunction,
  type ValidationStatus,
} from "@/lib/pathwayValidationChecklist";
import {
  VALIDATION_EXTRAS_CHANGED_EVENT,
  addFunctionDocuments,
  addFunctionNote,
  extrasFor,
  readValidationExtras,
  removeFunctionDocument,
  removeFunctionNote,
  writeValidationExtras,
  type ValidationExtras,
} from "@/lib/pathwayValidationExtras";

/**
 * One status dropdown per function, plus per-row document uploads and notes.
 * Used by both the Pathway Profile Validation card and the Workspace Status
 * card — they share the same stores, so a change on either surface shows on the
 * other.
 */
export function ValidationChecklist({
  pathwayId,
  topic,
  idPrefix = "validation",
}: {
  pathwayId: string | number;
  topic?: string;
  idPrefix?: string;
}) {
  const [checklist, setChecklist] = useState<Checklist>(() => readValidationChecklist(topic, pathwayId));
  const [extras, setExtras] = useState<ValidationExtras>(() => readValidationExtras(topic, pathwayId));

  useEffect(() => {
    const refresh = () => {
      setChecklist(readValidationChecklist(topic, pathwayId));
      setExtras(readValidationExtras(topic, pathwayId));
    };
    refresh();
    window.addEventListener(VALIDATION_CHANGED_EVENT, refresh);
    window.addEventListener(VALIDATION_EXTRAS_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(VALIDATION_CHANGED_EVENT, refresh);
      window.removeEventListener(VALIDATION_EXTRAS_CHANGED_EVENT, refresh);
    };
  }, [topic, pathwayId]);

  const update = (fn: ValidationFunction, status: ValidationStatus) => {
    const next = setFunctionStatus(checklist, fn, status, VALIDATION_CURRENT_USER);
    setChecklist(next);
    writeValidationChecklist(topic, pathwayId, next);
  };

  const saveExtras = (next: ValidationExtras) => {
    setExtras(next);
    writeValidationExtras(topic, pathwayId, next);
  };

  return (
    <div className="divide-y divide-border/40">
      {VALIDATION_FUNCTIONS.map((fn) => {
        const status = functionStatus(checklist, fn);
        const state = checklist[fn];
        const rowExtras = extrasFor(extras, fn);
        const id = `${idPrefix}-${pathwayId}-${fn}`.replace(/[^a-zA-Z0-9-]/g, "-");
        return (
          <div key={fn} className="flex h-10 items-center gap-3 px-3">
            <span className="w-28 shrink-0 text-[11px] font-semibold text-foreground">{fn}</span>

            <Select value={status} onValueChange={(value) => update(fn, value as ValidationStatus)}>
              <SelectTrigger
                id={id}
                aria-label={`${fn} status`}
                className={`h-6 w-[230px] shrink-0 rounded-full border px-2.5 text-[10px] font-medium ${validationStatusClass(fn, status)}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusesFor(fn).map((option) => (
                  <SelectItem key={option} value={option} className="text-[11px]">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {state ? (
              <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
                {state.by} · {state.date}
              </span>
            ) : (
              <span className="min-w-0 flex-1 text-[10px] text-muted-foreground">Not set</span>
            )}

            <FunctionDocuments
              fn={fn}
              documents={rowExtras.documents}
              onUpload={(names) => saveExtras(addFunctionDocuments(extras, fn, names, VALIDATION_CURRENT_USER))}
              onRemove={(documentId) => saveExtras(removeFunctionDocument(extras, fn, documentId))}
            />
            <FunctionNotes
              fn={fn}
              notes={rowExtras.notes}
              onAdd={(text) => saveExtras(addFunctionNote(extras, fn, text, VALIDATION_CURRENT_USER))}
              onRemove={(noteId) => saveExtras(removeFunctionNote(extras, fn, noteId))}
            />
          </div>
        );
      })}
    </div>
  );
}

function FunctionDocuments({
  fn,
  documents,
  onUpload,
  onRemove,
}: {
  fn: ValidationFunction;
  documents: { id: string; name: string; uploader: string; date: string }[];
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
          aria-label={`Documents for ${fn}`}
          title={count > 0 ? `${count} document${count === 1 ? "" : "s"} attached` : "Attach a document"}
          className="flex h-6 shrink-0 items-center gap-1 rounded-md px-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Paperclip className={count > 0 ? "h-3.5 w-3.5 text-foreground" : "h-3.5 w-3.5"} />
          {count > 0 && <span className="text-[10px] font-medium tabular-nums">{count}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {fn} documents
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

function FunctionNotes({
  fn,
  notes,
  onAdd,
  onRemove,
}: {
  fn: ValidationFunction;
  notes: { id: string; author: string; date: string; text: string }[];
  onAdd: (text: string) => void;
  onRemove: (noteId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const count = notes.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notes for ${fn}`}
          title={count > 0 ? `${count} note${count === 1 ? "" : "s"}` : "Add a note"}
          className="flex h-6 shrink-0 items-center gap-1 rounded-md px-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {count > 0 ? (
            <MessageSquare className="h-3.5 w-3.5 fill-current text-foreground" />
          ) : (
            <MessageSquarePlus className="h-3.5 w-3.5" />
          )}
          {count > 0 && <span className="text-[10px] font-medium tabular-nums">{count}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{fn} notes</p>

        <div className="mt-2 space-y-1.5">
          {count === 0 ? (
            <p className="text-[10px] text-muted-foreground">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-md border border-border/60 bg-muted/30 px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] text-muted-foreground">
                    {note.author} · {note.date}
                  </span>
                  <button
                    type="button"
                    title="Remove note"
                    aria-label="Remove note"
                    onClick={() => onRemove(note.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <p className="mt-0.5 text-[10px] text-foreground">{note.text}</p>
              </div>
            ))
          )}
        </div>

        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add your note…"
          className="mt-2 min-h-16 text-[11px]"
        />
        <Button
          type="button"
          size="sm"
          className="mt-2 h-7 w-full text-[10px] font-normal"
          disabled={draft.trim().length === 0}
          onClick={() => {
            onAdd(draft);
            setDraft("");
          }}
        >
          Post note
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export default ValidationChecklist;
