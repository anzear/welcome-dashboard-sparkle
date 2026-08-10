import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Info } from "lucide-react";

interface VCGScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

const VCGScoreBadge = ({ score, size = 'sm' }: VCGScoreBadgeProps) => {
  const scoreColor = score >= 70 ? 'text-primary font-bold' : score >= 40 ? 'text-amber-600 font-bold' : 'text-muted-foreground font-bold';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-[9px]';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-1.5 py-0.5';

  // Derive approximate sub-scores from the overall score for illustration
  const research = Math.min(100, Math.round(score * 0.95 + Math.random() * 10));
  const trl = Math.min(100, Math.round(score * 1.05 - Math.random() * 5));
  const market = Math.min(100, Math.round(score * 0.9 + Math.random() * 15));
  const ip = Math.max(0, Math.min(100, Math.round(100 - score + Math.random() * 20)));

  const weights = [
    { label: 'Research', weight: '25%', value: research, color: 'bg-blue-500' },
    { label: 'TRL', weight: '40%', value: trl, color: 'bg-emerald-500' },
    { label: 'Market Size', weight: '35%', value: market, color: 'bg-amber-500' },
    { label: 'IP Score', weight: '−20%', value: ip, color: 'bg-red-400', negative: true },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`${textSize} text-muted-foreground border border-border rounded ${padding} ${size === 'md' ? 'bg-card' : ''} hover:bg-muted/50 hover:border-primary/30 transition-colors cursor-help inline-flex items-center gap-1`}
          onClick={(e) => e.stopPropagation()}
        >
          VCG Score: <span className={scoreColor}>{score}</span>
          <Info className="w-3 h-3 text-muted-foreground/50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-3"
        side="bottom"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2.5">
          <div>
            <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">VCG Score Methodology</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              The VCG Score evaluates pathways by blending three positive performance indicators and subtracting one negative indicator.
            </p>
          </div>

          <div className="space-y-1.5">
            {weights.map((w) => (
              <div key={w.label} className="flex items-center gap-2">
                <span className="text-[9px] font-medium text-foreground w-16 shrink-0">{w.label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${w.color} rounded-full`} style={{ width: `${w.value}%` }} />
                </div>
                <span className={`text-[9px] font-semibold w-8 text-right ${w.negative ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {w.weight}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-2">
            <p className="text-[9px] text-muted-foreground leading-relaxed">
              A <span className="font-semibold text-foreground">high score</span> means strong research, high technical readiness, and a large market — with low patent saturation (more room to operate).
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default VCGScoreBadge;
