import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowRightLeft, RotateCcw } from "lucide-react";

interface FlowItemData {
  name: string;
  category1: string;
  category2: string;
  description: string;
  alternatives: { name: string; description?: string }[];
}

interface PathwayFlowPopoverProps {
  type: 'feedstock' | 'technology' | 'product' | 'application';
  data: FlowItemData;
  originalValue?: string;
  onSwap: (newValue: string) => void;
  onRestore?: () => void;
  children: React.ReactNode;
}

const typeColors: Record<string, string> = {
  feedstock: 'text-primary',
  technology: 'text-blue-600',
  product: 'text-violet-600',
  application: 'text-amber-600',
};

const PathwayFlowPopover = ({ type, data, originalValue, onSwap, onRestore, children }: PathwayFlowPopoverProps) => {
  const [open, setOpen] = useState(false);
  const isSwapped = originalValue && originalValue !== data.name;

  return (
    <>
      <button
        className="w-full text-left cursor-pointer hover:ring-2 hover:ring-primary/30 rounded-md transition-all"
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[480px] p-0 gap-0">
          <div className="px-5 py-4 border-b border-border">
            <DialogTitle className="text-[9px] font-bold uppercase tracking-wider mb-1">
              <span className={typeColors[type]}>{type}</span>
            </DialogTitle>
            <h4 className="text-sm font-semibold text-foreground mb-2">{data.name}</h4>

            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-medium">
                {data.category1}
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-medium">
                {data.category2}
              </span>
            </div>

            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {data.description}
            </p>
          </div>

          {/* Restore original option */}
          {isSwapped && onRestore && (
            <div className="px-5 pt-4 pb-1">
              <button
                onClick={() => {
                  onRestore();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left group"
              >
                <RotateCcw className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-medium text-primary block">Restore original: {originalValue}</span>
                </div>
              </button>
            </div>
          )}

          {data.alternatives.length > 0 && (
            <div className="px-5 py-4">
              <h5 className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                Alternatives ({data.alternatives.length})
              </h5>
              <div className="grid grid-cols-2 gap-2">
                {data.alternatives.map((alt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onSwap(alt.name);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-primary/5 hover:border-primary/30 transition-colors text-left group"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium text-foreground block">{alt.name}</span>
                      {alt.description && (
                        <span className="text-[8px] text-muted-foreground">{alt.description}</span>
                      )}
                    </div>
                    <ArrowRightLeft className="w-3 h-3 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PathwayFlowPopover;
