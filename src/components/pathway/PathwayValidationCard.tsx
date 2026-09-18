import { useEffect, useRef, useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { makeDocument, type ItemDocument } from "@/components/materialRegister/itemDocuments";

const FUNCTIONS = ["R&D", "Procurement", "Sustainability", "Regulatory"] as const;
type FunctionName = (typeof FUNCTIONS)[number];

/** Who confirmed a function, and when. Absent means not confirmed. */
type Confirmation = { by: string; date: string };
type Confirmations = Partial<Record<FunctionName, Confirmation>>;

const CURRENT_USER = "A. Novak";

/** Mock starting point: two functions confirmed, two still open. */
const MOCK_CONFIRMATIONS: Confirmations = {
  "R&D": { by: "K. Brandt", date: "4 Sept 2026" },
  Sustainability: { by: "M. Feld", date: "11 Sept 2026" },
};

const MOCK_DOCUMENTS: ItemDocument[] = [
  { id: "pv-doc-1", name: "Pathway-validation-checklist.pdf", uploader: "K. Brandt", date: "4 Sept 2026" },
  { id: "pv-doc-2", name: "Lab-conformance-results.xlsx", uploader: "M. Feld", date: "11 Sept 2026" },
];

const todayLabel = () =>
  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function PathwayValidationCard({ pathwayId, topic }: { pathwayId: string; topic?: string }) {
  const storageKey = `pathway-validation-confirmations:${topic || "default"}:${pathwayId}`;
  const [confirmations, setConfirmations] = useState<Confirmations>(MOCK_CONFIRMATIONS);
  const [documents, setDocuments] = useState<ItemDocument[]>(MOCK_DOCUMENTS);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setConfirmations(stored ? (JSON.parse(stored) as Confirmations) : MOCK_CONFIRMATIONS);
    } catch {
      setConfirmations(MOCK_CONFIRMATIONS);
    }
  }, [storageKey]);

  const toggle = (name: FunctionName, checked: boolean) => {
    setConfirmations((current) => {
      const next: Confirmations = { ...current };
      if (checked) next[name] = { by: CURRENT_USER, date: todayLabel() };
      else delete next[name];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="mb-3 overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Validation</span>
        <span className="text-[10px] text-muted-foreground">
          {Object.keys(confirmations).length} of {FUNCTIONS.length} functions confirmed
        </span>
      </div>

      <div className="divide-y divide-border/40 border-t border-border">
        {FUNCTIONS.map((name) => {
          const confirmation = confirmations[name];
          return (
            <div key={name} className="flex h-10 items-center gap-2.5 px-3">
              <Checkbox
                className="h-3.5 w-3.5"
                id={`validation-${pathwayId}-${name}`}
                checked={!!confirmation}
                onCheckedChange={(value) => toggle(name, value === true)}
              />
              <label
                htmlFor={`validation-${pathwayId}-${name}`}
                className="cursor-pointer text-[11px] font-medium text-foreground"
              >
                {name}
              </label>
              {confirmation ? (
                <span className="text-[10px] text-foreground/70">
                  Confirmed by {confirmation.by} · {confirmation.date}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">Not confirmed</span>
              )}
            </div>
          );
        })}
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
