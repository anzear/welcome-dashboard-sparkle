import React from 'react';
import { Lock, BarChart3, Map as MapIcon, Network } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Disabled / empty preview of how the value-chain dashboard looks once the
 * intelligence layer is unlocked for a material. Mirrors the structure of
 * the unlocked Sulphuric-Acid-style page (Hero, Pathway Readiness, Top 3
 * Pathways, Opportunity Map) but renders only skeletons and is fully
 * non-interactive.
 */
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
    {children}
  </h3>
);

const MaterialBriefOutline: React.FC = () => {
  return (
    <div className="relative">
      {/* Lock banner */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Lock className="w-3 h-3 text-muted-foreground" />
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Intelligence layer — locked
          </h3>
        </div>
      </div>

      <div
        className="space-y-3 pointer-events-none select-none opacity-60 grayscale-[40%]"
        aria-hidden="true"
      >
        {/* Hero card */}
        <div className="rounded-xl border border-dashed border-border/70 bg-card p-4">
          <div className="flex items-start gap-5">
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex gap-1.5">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-14 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-6 w-1/3" />
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-11/12" />
                <Skeleton className="h-2.5 w-3/4" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-2 w-12" />
            </div>
          </div>
        </div>

        {/* Pathway Readiness */}
        <div className="rounded-xl border border-dashed border-border/70 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3 text-muted-foreground" />
              <SectionLabel>Pathway Readiness</SectionLabel>
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {['Research', 'Lab', 'Pilot', 'Commercial'].map((label) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-end gap-1 h-16">
                  {[0.3, 0.55, 0.8, 0.45, 0.65].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-muted-foreground/20 rounded-sm"
                      style={{ height: `${h * 100}%` }}
                    />
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground text-center uppercase tracking-wider">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 Pathways */}
        <div className="rounded-xl border border-dashed border-border/70 bg-card p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Network className="w-3 h-3 text-muted-foreground" />
              <SectionLabel>Top 3 Pathways Identified</SectionLabel>
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 p-2.5"
              >
                <div className="w-6 h-6 rounded-md bg-muted-foreground/15 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground">#{i}</span>
                </div>
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-2.5 w-2/5" />
                  <Skeleton className="h-2 w-3/5" />
                </div>
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-10 rounded-full" />
                  <Skeleton className="h-5 w-10 rounded-full" />
                  <Skeleton className="h-5 w-10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunity Map */}
        <div className="rounded-xl border border-dashed border-border/70 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapIcon className="w-3 h-3 text-muted-foreground" />
              <SectionLabel>Opportunity Map</SectionLabel>
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="relative h-44 rounded-lg border border-border/40 bg-gradient-to-br from-muted/20 to-muted/5 overflow-hidden">
            {/* Grid lines */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="border border-border/20" />
              ))}
            </div>
            {/* Bubble placeholders */}
            {[
              { t: '15%', l: '20%', s: 18 },
              { t: '40%', l: '55%', s: 28 },
              { t: '65%', l: '35%', s: 14 },
              { t: '30%', l: '78%', s: 22 },
              { t: '70%', l: '70%', s: 16 },
            ].map((b, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-muted-foreground/25"
                style={{ top: b.t, left: b.l, width: b.s, height: b.s }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialBriefOutline;
