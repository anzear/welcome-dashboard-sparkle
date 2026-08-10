import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FileText, Calendar, Building2, Globe } from "lucide-react";

interface Patent {
  title: string;
  company: string;
  filingYear: number;
  grantedYear: number | null;
  status: string;
  jurisdiction: number;
  abstract?: string;
  inventors?: string[];
  cpcCodes?: string[];
  subcategory?: string;
}

interface PatentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patent: Patent | null;
  topic?: string;
}

const PatentDetailModal = ({ open, onOpenChange, patent, topic = 'Lactic Acid' }: PatentDetailModalProps) => {
  if (!patent) return null;

  // Generate mock details if not present
  const abstract = patent.abstract || `This invention relates to ${patent.title.toLowerCase()}, providing improvements in efficiency and sustainability for industrial-scale ${topic.toLowerCase()} production.`;
  const inventors = patent.inventors || [`Dr. ${patent.company.split(' ')[0]} Research Team`];
  const cpcCodes = patent.cpcCodes || [`C12P 7/56`];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px] p-0 gap-0 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border flex-shrink-0">
          <DialogTitle className="text-sm font-semibold text-foreground leading-snug">
            {patent.title}
          </DialogTitle>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Status</p>
              <div className="flex items-center gap-1">
                {patent.status === 'Granted' ? (
                  <span className="text-primary text-[11px] font-semibold flex items-center gap-1">✓ Granted</span>
                ) : (
                  <span className="text-muted-foreground text-[11px] font-semibold flex items-center gap-1"><FileText className="w-3 h-3" /> Filed</span>
                )}
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Jurisdictions</p>
              <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <Globe className="w-3 h-3 text-muted-foreground" />
                {patent.jurisdiction} countries
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Filing Year</p>
              <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                {patent.filingYear}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Granted Year</p>
              <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                {patent.grantedYear || '—'}
              </p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Applicant</p>
            <p className="text-[11px] font-medium text-foreground flex items-center gap-1">
              <Building2 className="w-3 h-3 text-muted-foreground" />
              {patent.company}
            </p>
          </div>

          {patent.subcategory && (
            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Subcategory</p>
              <p className="text-[11px] font-medium text-foreground">{patent.subcategory}</p>
            </div>
          )}

          <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">Inventors</p>
            <div className="flex flex-wrap gap-1">
              {inventors.map((inv, i) => (
                <span key={i} className="text-[10px] bg-background px-2 py-0.5 rounded border border-border/40 text-foreground">{inv}</span>
              ))}
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">CPC Classification</p>
            <div className="flex flex-wrap gap-1">
              {cpcCodes.map((code, i) => (
                <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-mono">{code}</span>
              ))}
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">Abstract</p>
            <p className="text-[10px] text-foreground leading-relaxed">{abstract}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatentDetailModal;
