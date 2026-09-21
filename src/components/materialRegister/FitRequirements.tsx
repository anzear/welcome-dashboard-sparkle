/**
 * Technical fit and Regulatory fit, shown in the Workspace directly below the
 * requirements table. Same row styling as requirements, but there is no VCG.AI
 * signal here — the status is set manually by the team.
 */
import React, { useRef, useState } from "react";
import { Check, FileText, PenLine, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useRegister } from "@/components/materialRegister/registerStore";
import type { Material } from "@/types/materialPrioritisation";

type FitStatus = "Met" | "Not met" | "Not set";

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
  "No constraint",
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

export const FitRequirements: React.FC<{ material: Material }> = ({ material }) => {
  const { updateMaterial } = useRegister();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const doc = material.performance_targets_document ?? null;
  const registrations = material.regulatory_registrations ?? [];
  const [technicalStatus, setTechnicalStatus] = useState<FitStatus>("Met");
  const [regulatoryStatus, setRegulatoryStatus] = useState<FitStatus>("Not set");

  const record = (
    field: "performance_targets_document" | "regulatory_registrations",
    before: string | null,
    after: string | null,
  ) => ({
    material_id: material.material_id,
    event_type: "field_correction" as const,
    field,
    from_value: before,
    to_value: after,
  });

  const setDocument = (next: Material["performance_targets_document"]) => {
    updateMaterial(
      material.material_id,
      { performance_targets_document: next },
      ["performance_targets_document"],
      [record("performance_targets_document", doc?.filename ?? null, next?.filename ?? null)],
    );
  };

  const toggleRegistration = (option: string) => {
    const next =
      option === "No constraint"
        ? registrations.includes(option)
          ? []
          : [option]
        : registrations.includes(option)
          ? registrations.filter((item) => item !== option)
          : [...registrations.filter((item) => item !== "No constraint"), option];
    updateMaterial(
      material.material_id,
      { regulatory_registrations: next },
      ["regulatory_registrations"],
      [record("regulatory_registrations", registrations.join(", ") || null, next.join(", ") || null)],
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

      {/* Technical fit — performance targets document */}
      <div className="grid grid-cols-[1fr_180px] border-b border-border">
        <div className="flex min-h-11 items-center gap-3 px-4 py-2">
          <span className="w-[140px] shrink-0 text-xs text-foreground">Technical fit</span>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const bytes = file.size;
                const size =
                  bytes >= 1_000_000
                    ? `${(bytes / 1_048_576).toFixed(1)} MB`
                    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
                setDocument({ filename: file.name, size });
                event.target.value = "";
              }}
            />
            {doc ? (
              <>
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 truncate text-[11px] text-foreground" title={doc.filename}>
                  {doc.filename}
                </span>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{doc.size}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  aria-label="Remove performance targets document"
                  onClick={() => setDocument(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <span className="text-[11px] text-muted-foreground">No performance targets attached.</span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto h-7 shrink-0 gap-1.5 px-2 text-[10px]"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </Button>
          </div>
        </div>
        <StatusCell label="Technical fit" value={technicalStatus} onChange={setTechnicalStatus} />
      </div>

      {/* Regulatory fit — registrations needed */}
      <div className="grid grid-cols-[1fr_180px]">
        <div className="flex min-h-11 items-center gap-3 px-4 py-2">
          <span className="w-[140px] shrink-0 text-xs text-foreground">Regulatory fit</span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {REGISTRATION_OPTIONS.map((option) => {
              const selected = registrations.includes(option);
              return (
                <Button
                  key={option}
                  type="button"
                  variant={selected ? "secondary" : "outline"}
                  size="sm"
                  aria-pressed={selected}
                  onClick={() => toggleRegistration(option)}
                  className={cn(
                    "h-6 rounded-full px-2.5 text-[10px] font-normal",
                    selected && "border border-foreground/20",
                  )}
                >
                  {option}
                </Button>
              );
            })}
          </div>
        </div>
        <StatusCell label="Regulatory fit" value={regulatoryStatus} onChange={setRegulatoryStatus} />
      </div>
    </div>
  );
};

export default FitRequirements;
