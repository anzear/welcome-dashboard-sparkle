import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, FileText, Lightbulb, BookOpen, TrendingUp, AlertCircle, CheckCircle2, BarChart3, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PathwayResourcesTabProps {
  productName?: string;
  pathwayNumber?: number;
  showFooter?: boolean;
}

const PathwayResourcesTab = ({ productName = "Product", pathwayNumber, showFooter = true }: PathwayResourcesTabProps) => {
  const navigate = useNavigate();
  const { category, topic } = useParams<{ category: string; topic: string }>();

  const handleMarketActivityClick = () => {
    navigate(`/landscape/${category}/${topic}/market-activity`, {
      state: { productName, pathwayNumber, fromPathway: true, pathwayId }
    });
  };

  const pathwayId = window.location.pathname.match(/\/pathways\/(\d+)/)?.[1] || '0';

  const handleIPLandscapeClick = () => {
    navigate(`/landscape/${category}/${topic}/value-chain/pathways/${pathwayId}/ip-landscape`);
  };

  return (
    <div className="space-y-1.5">
      <button
        onClick={handleMarketActivityClick}
        className="w-full rounded-lg border border-border/60 bg-card px-4 py-3 text-left hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-foreground">Market Players</span>
          <span className="text-xs font-bold text-primary tabular-nums">325</span>
        </div>
        <p className="text-[9px] text-muted-foreground mt-0.5">Companies & startups across the value chain</p>
      </button>

      <button
        onClick={handleIPLandscapeClick}
        className="w-full rounded-lg border border-border/60 bg-card px-4 py-3 text-left hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-foreground">IP Landscape</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[7px] font-semibold">Medium</span>
          </div>
          <span className="text-xs font-bold text-primary tabular-nums">147</span>
        </div>
        <p className="text-[9px] text-muted-foreground mt-0.5">Patents & intellectual property filings</p>
      </button>

      <button
        onClick={() => navigate(`/landscape/${category}/${topic}/value-chain/pathways/${pathwayId}/research-landscape`)}
        className="w-full rounded-lg border border-border/60 bg-card px-4 py-3 text-left hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-foreground">Research Landscape</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[7px] font-semibold">High</span>
          </div>
          <span className="text-xs font-bold text-primary tabular-nums">89</span>
        </div>
        <p className="text-[9px] text-muted-foreground mt-0.5">Scientific publications & academic research</p>
      </button>

      <button
        onClick={() => navigate(`/landscape/${category}/${topic}/value-chain/pathways/${pathwayId}/innovation-projects`)}
        className="w-full rounded-lg border border-border/60 bg-card px-4 py-3 text-left hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-foreground">Innovation Projects</span>
          <span className="text-xs font-bold text-primary tabular-nums">15</span>
        </div>
        <p className="text-[9px] text-muted-foreground mt-0.5">Funded projects & innovation initiatives</p>
      </button>

      {showFooter && (
        <div className="pt-1">
          <p className="text-[9px] text-muted-foreground/60 text-right"><span className="font-semibold text-muted-foreground/80">732</span> records | Updated Sep 2025</p>
        </div>
      )}
    </div>
  );
};

export default PathwayResourcesTab;
