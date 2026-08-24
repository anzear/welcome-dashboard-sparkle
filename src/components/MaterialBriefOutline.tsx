import React from 'react';
import { BarChart3, Map as MapIcon, Network } from 'lucide-react';

/**
 * Sections of the value-chain page that the analysis has not produced yet.
 * Each one states its own gap in place — there is no wall, no lock and nothing
 * to act on here. The material brief above stays fully usable.
 */
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
    {children}
  </h3>
);

const EmptySection: React.FC<{
  icon: React.ReactNode;
  title: string;
  line: string;
}> = ({ icon, title, line }) => (
  <div className="rounded-xl border border-dashed border-border/70 bg-card p-4 space-y-2">
    <div className="flex items-center gap-1.5">
      {icon}
      <SectionLabel>{title}</SectionLabel>
    </div>
    <p className="text-[11px] text-muted-foreground leading-relaxed">{line}</p>
  </div>
);

const MaterialBriefOutline: React.FC = () => (
  <div className="space-y-3">
    <EmptySection
      icon={<BarChart3 className="w-3 h-3 text-muted-foreground" />}
      title="Pathway Readiness"
      line="The analysis has not produced readiness data for this material yet."
    />
    <EmptySection
      icon={<Network className="w-3 h-3 text-muted-foreground" />}
      title="Top Pathways Identified"
      line="The analysis has not produced pathways for this material yet."
    />
    <EmptySection
      icon={<MapIcon className="w-3 h-3 text-muted-foreground" />}
      title="Opportunity Map"
      line="The analysis has not produced an opportunity map for this material yet."
    />
  </div>
);

export default MaterialBriefOutline;
