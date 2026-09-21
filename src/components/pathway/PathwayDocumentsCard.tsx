import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DOCUMENT_REGISTRY_CHANGED_EVENT,
  GENERAL_SOURCE,
  readSubRegistry,
  registerDocuments,
  type RegisteredDocument,
  unregisterDocument,
} from "@/lib/documentRegistry";

/** Mock files so the tagged list can be reviewed with real-looking data. */
const MOCK_PATHWAY_DOCUMENTS: RegisteredDocument[] = [
  { id: "pw-gen-1", name: "Pathway-validation-checklist.pdf", uploader: "K. Brandt", date: "4 Sept 2026", source: GENERAL_SOURCE },
  { id: "pw-gen-2", name: "Lab-conformance-results.xlsx", uploader: "M. Feld", date: "11 Sept 2026", source: GENERAL_SOURCE },
  { id: "rd-doc-1", name: "Lab-trial-report-Q3.pdf", uploader: "K. Brandt", date: "4 Sept 2026", source: "Status · R&D" },
  { id: "pr-doc-1", name: "Supplier-quotes-comparison.xlsx", uploader: "A. Vermeer", date: "9 Sept 2026", source: "Status · Procurement" },
  { id: "pw-co-1", name: "Capacity-and-pricing.xlsx", uploader: "A. Novak", date: "12 Sept 2026", source: "Company · Corbion" },
  { id: "pw-pt-1", name: "Claim-chart-EP3421.pdf", uploader: "K. Brandt", date: "8 Sept 2026", source: "Patent · EP3421567A1" },
  { id: "pw-pp-1", name: "Yield-data-annotated.pdf", uploader: "M. Feld", date: "3 Sept 2026", source: "Paper · Continuous fermentation of lactic acid" },
];

/**
 * Every file attached anywhere on this pathway. Files uploaded here are tagged
 * "General"; files uploaded on the Status checklist or on a shortlisted company,
 * patent or paper appear with a tag naming where they came from.
 */
export function PathwayDocumentsCard({
  registryKey,
  currentUser,
}: {
  registryKey: string;
  currentUser: string;
}) {
  const seed = useMemo(() => MOCK_PATHWAY_DOCUMENTS, []);
  const [documents, setDocuments] = useState<RegisteredDocument[]>(() => readSubRegistry(registryKey, seed));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Persist the mock starting list once, so later uploads append to it.
    if (readSubRegistry(registryKey).length === 0) writeSubRegistry(registryKey, seed);
    const refresh = () => setDocuments(readSubRegistry(registryKey, seed));
    refresh();
    window.addEventListener(DOCUMENT_REGISTRY_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(DOCUMENT_REGISTRY_CHANGED_EVENT, refresh);
  }, [registryKey, seed]);


  return (
    <div className="mt-3 overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="flex items-center gap-2 text-[10px]">
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-bold uppercase tracking-widest text-foreground">Documents</span>
          <span className="text-[10px] normal-case tracking-normal text-muted-foreground">
            Every file attached to this pathway, tagged with where it was uploaded
          </span>
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            const names = Array.from(event.target.files ?? []).map((file) => file.name);
            if (names.length > 0) registerDocuments(names, currentUser, GENERAL_SOURCE);
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
          <p className="px-3 py-2 text-[10px] text-muted-foreground">No documents attached to this pathway yet.</p>
        ) : (
          <div className="divide-y divide-border/40">
            {documents.map((document) => (
              <div key={document.id} className="flex h-10 items-center gap-3 px-3">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-foreground" title={document.name}>
                  {document.name}
                </span>
                <span
                  className={`max-w-[240px] shrink-0 truncate rounded-full border px-2 py-0.5 text-[9px] font-medium ${
                    document.source === GENERAL_SOURCE
                      ? "border-border bg-muted/50 text-muted-foreground"
                      : "border-border bg-background text-foreground"
                  }`}
                  title={document.source}
                >
                  {document.source}
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
                  onClick={() => {
                    unregisterDocument(document.id);
                    setDocuments((current) => current.filter((item) => item.id !== document.id));
                  }}
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

export default PathwayDocumentsCard;
