import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Star, Target, Upload } from "lucide-react";

export type StepState = "completed" | "in_progress" | "not_started";

export type BriefStep = {
  step: number;
  title: string;
  description: string;
  state: StepState;
  icon: React.ComponentType<{ className?: string }>;
};

const STATE_LABEL: Record<StepState, string> = {
  completed: "Completed",
  in_progress: "In progress",
  not_started: "Not started",
};

/**
 * Three-step progress cards. Content is placeholder for now — each card's
 * substance arrives in later passes.
 */
const DEFAULT_STEPS: BriefStep[] = [
  {
    step: 1,
    title: "Material Details",
    description: "Identify the material & intent",
    state: "completed",
    icon: Target,
  },
  {
    step: 2,
    title: "Strategic Scoring",
    description: "Rate priority drivers 1–5",
    state: "completed",
    icon: Star,
  },
  {
    step: 3,
    title: "Material Requirements",
    description: "Upload supporting docs",
    state: "not_started",
    icon: Upload,
  },
];

const BriefStepCards: React.FC<{ steps?: BriefStep[] }> = ({ steps = DEFAULT_STEPS }) => (
  <div className="grid gap-3 sm:grid-cols-3">
    {steps.map((s) => {
      const Icon = s.icon;
      const done = s.state === "completed";
      return (
        <div
          key={s.step}
          className={cn(
            "rounded-lg border border-border p-4",
            done ? "bg-muted/40" : "bg-card"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
              <Icon className="h-4 w-4 text-foreground" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Step {s.step}
            </span>
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold text-foreground">{s.title}</div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">{s.description}</div>
          </div>

          <div className="mt-3">
            {done ? (
              <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground">
                <CheckCircle2 className="h-3 w-3" />
                {STATE_LABEL[s.state]}
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {STATE_LABEL[s.state]}
              </span>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

export default BriefStepCards;
