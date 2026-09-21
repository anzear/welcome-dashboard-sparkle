import { useEffect, useRef, useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { makeDocument, type ItemDocument } from "@/components/materialRegister/itemDocuments";
import ValidationChecklist from "@/components/pathway/ValidationChecklist";
import {
  VALIDATION_CHANGED_EVENT,
  VALIDATION_CURRENT_USER as CURRENT_USER,
  VALIDATION_FUNCTIONS,
  countConfirmedFunctions,
  readValidationChecklist,
} from "@/lib/pathwayValidationChecklist";

const MOCK_DOCUMENTS: ItemDocument[] = [
  { id: "pv-doc-1", name: "Pathway-validation-checklist.pdf", uploader: "K. Brandt", date: "4 Sept 2026" },
  { id: "pv-doc-2", name: "Lab-conformance-results.xlsx", uploader: "M. Feld", date: "11 Sept 2026" },
];

export function PathwayValidationCard({ pathwayId, topic }: { pathwayId: string; topic?: string }) {
  const [confirmedCount, setConfirmedCount] = useState(() =>
    countConfirmedFunctions(readValidationChecklist(topic, pathwayId)),
  );
  const [documents, setDocuments] = useState<ItemDocument[]>(MOCK_DOCUMENTS);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => setConfirmedCount(countConfirmedFunctions(readValidationChecklist(topic, pathwayId)));
    refresh();
    window.addEventListener(VALIDATION_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(VALIDATION_CHANGED_EVENT, refresh);
  }, [topic, pathwayId]);

  const total = VALIDATION_FUNCTIONS.length;
  const percent = Math.round((confirmedCount / total) * 100);

  return (
    <div className="mb-3 overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Work Space</span>
        <span className="text-[10px] text-muted-foreground">
          {confirmedCount} of {total} functions confirmed · {percent}%
        </span>
      </div>

      <div className="border-t border-border/40 px-3 py-2">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Validation progression"
        >
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="border-t border-border">
        <ValidationChecklist pathwayId={pathwayId} topic={topic} idPrefix="pathway-validation" />
      </div>

      <div className="border-t border-border">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Pathway documents
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
                  ...files.map((file) => makeDocument(file.name, CURRENT_USER)),
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

        {documents.length === 0 ? (
          <p className="px-3 pb-2 text-[10px] text-muted-foreground">No documents attached to this pathway yet.</p>
        ) : (
          <div className="divide-y divide-border/40 border-t border-border/40">
            {documents.map((document) => (
              <div key={document.id} className="flex h-10 items-center gap-3 px-3">
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

export default PathwayValidationCard;
