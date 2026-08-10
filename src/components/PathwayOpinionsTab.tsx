import React from 'react';
import PathwayChat from "@/components/PathwayChat";

interface PathwayOpinionsTabProps {
  pathwayId: string;
}

const PathwayOpinionsTab = ({ pathwayId }: PathwayOpinionsTabProps) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-2 px-0.5 flex-shrink-0">
        <h3 className="font-bold text-foreground text-sm leading-none mb-0.5">Collab</h3>
        <p className="text-xs text-muted-foreground leading-tight">
          Share insights from your analysis and research findings with your team.
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <PathwayChat pathwayId={pathwayId} />
      </div>
    </div>
  );
};

export default PathwayOpinionsTab;
