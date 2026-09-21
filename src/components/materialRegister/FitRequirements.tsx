/**
 * Technical fit and Regulatory fit, shown in the Workspace directly below the
 * requirements table. Same row styling as requirements, but there is no VCG.AI
 * signal here — the status is set manually by the team. Each row has a paperclip
 * attachment control, the same as the validation checklist and other boxes;
 * uploads are registered in the material-wide document registry with a
 * "Technical fit" / "Regulatory fit" source tag.
 */
import React, { useRef, useState } from "react";
import { Check, FileText, Paperclip, PenLine, Plus, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useRegister } from "@/components/materialRegister/registerStore";
import {
  registerDocuments,
  unregisterDocument,
  type RegisteredDocument,
} from "@/lib/documentRegistry";
import type { Material } from "@/types/materialPrioritisation";

type FitStatus = "Met" | "Not met" | "Not set";

const CURRENT_USER = "You";

const statusClasses: Record<FitStatus, string> = {
  Met: "border-success/30 bg-success/10 text-success",
  "Not met": "border-destructive/30 bg-destructive/10 text-destructive",
  "Not set": "border-border bg-muted text-muted-foreground",
};

const REGISTRATION_OPTIONS = [
  "EU REACH",
  "UK REACH",
  "US TSCA inventory listing",
  "K-REACH",
] as const;

const StatusCell: React.FC<{
  label: string;
  value: FitStatus;
  onChange: (next: FitStatus) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex min-h-11 items-center justify-end gap-2 border-l border-border px-4">
    <Badge variant="outline" className={cn("shrink-0 text-[10px]", statusClasses[value])}>
      {value}
    </Badge>
    <DropdownMenu>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                aria-label={`Set status for ${label}`}
              >
                <PenLine className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Set status</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end" className="w-40">
        {(["Met", "Not met", "Not set"] as FitStatus[]).map((status) => (
          <DropdownMenuItem key={status} className="text-xs" onSelect={() => onChange(status)}>
            {status}
            {value === status && <Check className="ml-auto h-3 w-3" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

/** Paperclip attachments control — same pattern as the validation checklist rows. */
const FitAttachments: React.FC<{
  label: string;
  sourceTag: string;
  documents: RegisteredDocument[];
  onChange: (next: RegisteredDocument[]) => void;
}> = ({ label, sourceTag, documents, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const count = documents.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Documents for ${label}`}
          title={count > 0 ? `${count} document${count === 1 ? "" : "s"} attached` : "Attach a document"}
          className="flex h-6 shrink-0 items-center gap-1 rounded-md px-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Paperclip className={count > 0 ? "h-3.5 w-3.5 text-foreground" : "h-3.5 w-3.5"} />
          {count > 0 && <span className="text-[10px] font-medium tabular-nums">{count}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label} documents
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
                  onClick={() => {
                    unregisterDocument(document.id);
                    onChange(documents.filter((item) => item.id !== document.id));
                  }}
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
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg"
          onChange={(event) => {
            const names = Array.from(event.target.files ?? []).map((file) => file.name);
            if (names.length > 0) {
              onChange([...documents, ...registerDocuments(names, CURRENT_USER, sourceTag)]);
            }
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
};

export const FitRequirements: React.FC<{ material: Material }> = ({ material }) => {
  const { updateMaterial } = useRegister();
  const registrations = material.regulatory_registrations ?? [];
  const [technicalStatus, setTechnicalStatus] = useState<FitStatus>("Met");
  const [regulatoryStatus, setRegulatoryStatus] = useState<FitStatus>("Not set");
  const [technicalNote, setTechnicalNote] = useState("");
  const [technicalDocs, setTechnicalDocs] = useState<RegisteredDocument[]>(() =>
    material.performance_targets_document
      ? [
          {
            id: "fit-tech-doc-1",
            name: material.performance_targets_document.filename,
            uploader: "K. Brandt",
            date: "6 Sept 2026",
            source: "Technical fit",
          },
        ]
      : [],
  );
  const [regulatoryDocs, setRegulatoryDocs] = useState<RegisteredDocument[]>([]);

  const [customDraft, setCustomDraft] = useState("");

  const allOptions = [
    ...REGISTRATION_OPTIONS,
    ...registrations.filter((item) => !REGISTRATION_OPTIONS.includes(item as never)),
  ];

  const setRegistrations = (next: string[]) => {
    updateMaterial(
      material.material_id,
      { regulatory_registrations: next },
      ["regulatory_registrations"],
      [
        {
          material_id: material.material_id,
          event_type: "field_correction" as const,
          field: "regulatory_registrations",
          from_value: registrations.join(", ") || null,
          to_value: next.join(", ") || null,
        },
      ],
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card" aria-label="Fit criteria">
      <div className="grid grid-cols-[1fr_180px] border-b border-border">
        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground">
          Technical and regulatory fit
        </div>
        <div className="border-l border-border px-4 py-2 text-right text-[10px] font-bold uppercase tracking-widest text-foreground">
          Status
        </div>
      </div>

      {/* Technical fit — free-text notes + status + attachments */}
      <div className="grid grid-cols-[1fr_180px_44px] border-b border-border">
        <div className="flex min-h-11 items-center gap-3 px-4 py-2">
          <span className="w-[140px] shrink-0 text-xs text-foreground">Technical fit</span>
          <Input
            value={technicalNote}
            onChange={(event) => setTechnicalNote(event.target.value)}
            placeholder="Add notes on technical fit..."
            className="h-7 flex-1 text-xs"
          />
        </div>
        <StatusCell label="Technical fit" value={technicalStatus} onChange={setTechnicalStatus} />
        <div className="flex items-center justify-center border-l border-border">
          <FitAttachments
            label="Technical fit"
            sourceTag="Technical fit"
            documents={technicalDocs}
            onChange={setTechnicalDocs}
          />
        </div>
      </div>

      {/* Regulatory fit — registrations needed + attachments */}
      <div className="grid grid-cols-[1fr_180px]">
        <div className="flex min-h-11 items-center gap-3 px-4 py-2">
          <span className="w-[140px] shrink-0 text-xs text-foreground">Regulatory fit</span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {allOptions.map((option) => {
              const selected = registrations.includes(option);
              return (
                <Button
                  key={option}
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-pressed={selected}
                  onClick={() =>
                    setRegistrations(
                      selected
                        ? registrations.filter((item) => item !== option)
                        : [...registrations, option],
                    )
                  }
                  className={cn(
                    "h-6 gap-1 rounded-full px-2.5 text-[10px] font-normal",
                    selected
                      ? "border-transparent bg-foreground font-medium text-background shadow-sm hover:bg-foreground/90 hover:text-background"
                      : "text-muted-foreground",
                  )}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {option}
                </Button>
              );
            })}

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 rounded-full border border-dashed border-border px-2.5 text-[10px] font-normal text-muted-foreground"
                >
                  <Plus className="h-3 w-3" />
                  Add regulation
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Add regulation
                </p>
                <form
                  className="mt-2 flex items-center gap-1.5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const value = customDraft.trim();
                    if (!value || registrations.includes(value)) {
                      setCustomDraft("");
                      return;
                    }
                    setRegistrations([...registrations, value]);
                    setCustomDraft("");
                  }}
                >
                  <Input
                    value={customDraft}
                    onChange={(event) => setCustomDraft(event.target.value)}
                    placeholder="e.g. China IECSC"
                    className="h-7 text-[11px]"
                  />
                  <Button type="submit" size="sm" className="h-7 px-2 text-[10px]">
                    Add
                  </Button>
                </form>
              </PopoverContent>
            </Popover>

            <span className="ml-auto">
              <FitAttachments
                label="Regulatory fit"
                sourceTag="Regulatory fit"
                documents={regulatoryDocs}
                onChange={setRegulatoryDocs}
              />
            </span>
          </div>
        </div>
        <StatusCell label="Regulatory fit" value={regulatoryStatus} onChange={setRegulatoryStatus} />
      </div>
    </div>
  );
};

export default FitRequirements;
