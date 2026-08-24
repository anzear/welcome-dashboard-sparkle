/**
 * THE SHARED COVERAGE STEP — one definition of what a coverage request asks.
 *
 * Wherever coverage is requested (the material profile, the dashboard's Add
 * Material modal, Available now), the same two questions are asked: Run as,
 * required, and an optional question the coverage should answer. Both places
 * import this rather than keeping their own version.
 */
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft } from "lucide-react";

/** Pathway node position the run starts from. Same run, different entry point. */
export type CoverageRunAs = "Feedstock" | "Material";

export const RUN_AS_OPTIONS: {
  value: CoverageRunAs;
  label: string;
  description: string;
  Icon: typeof ArrowRight;
}[] = [
  {
    value: "Feedstock",
    label: "Feedstock",
    description: "The input a pathway starts from. Run this way to see what can be made from it.",
    Icon: ArrowRight,
  },
  {
    value: "Material",
    label: "Material",
    description: "The output a pathway arrives at. Run this way to see what it can be made from.",
    Icon: ArrowLeft,
  },
];

export const COVERAGE_QUESTION_PLACEHOLDER =
  "e.g. suppliers outside the EU, or routes that avoid palm";

export const RunAsPicker: React.FC<{
  value: CoverageRunAs | "";
  onChange: (value: CoverageRunAs) => void;
}> = ({ value, onChange }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-semibold">Run as *</Label>
    <div className="grid grid-cols-2 gap-2">
      {RUN_AS_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        const Icon = option.Icon;
        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            onClick={() => onChange(option.value)}
            className={`h-auto flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-left whitespace-normal transition-all hover:bg-background ${
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border/40 bg-background hover:border-muted-foreground/30"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                {option.label}
              </span>
            </span>
            <span className="text-[10px] leading-snug text-muted-foreground">{option.description}</span>
          </Button>
        );
      })}
    </div>
  </div>
);

export const CoverageQuestionField: React.FC<{
  id?: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ id = "coverage-question", value, onChange }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-[11px] font-medium">
      What should the coverage answer? <span className="text-muted-foreground">(optional)</span>
    </Label>
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={COVERAGE_QUESTION_PLACEHOLDER}
      className="min-h-[70px] text-xs"
    />
  </div>
);

/** Both questions together, in order. */
export const CoverageStep: React.FC<{
  runAs: CoverageRunAs | "";
  onRunAsChange: (value: CoverageRunAs) => void;
  question: string;
  onQuestionChange: (value: string) => void;
  questionFieldId?: string;
}> = ({ runAs, onRunAsChange, question, onQuestionChange, questionFieldId }) => (
  <div className="space-y-3">
    <RunAsPicker value={runAs} onChange={onRunAsChange} />
    <CoverageQuestionField id={questionFieldId} value={question} onChange={onQuestionChange} />
  </div>
);

export default CoverageStep;
