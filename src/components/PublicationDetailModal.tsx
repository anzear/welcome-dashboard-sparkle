import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, FileText, Users } from "lucide-react";

interface PublicationDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publication: {
    title: string;
    date: string;
    authors: string[];
    summary: string;
    topics: string[];
    researchType: string;
  } | null;
}

const researchTypeLabels: Record<string, string> = {
  'experimental': 'Experimental',
  'review': 'Review',
  'meta-analysis': 'Meta Analysis',
  'market': 'Market Research',
  'techno-economics': 'Techno-Economic Analysis',
  'sustainability': 'Sustainability & LCA',
};

const PublicationDetailModal = ({ open, onOpenChange, publication }: PublicationDetailModalProps) => {
  if (!publication) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px] p-0 gap-0 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border flex-shrink-0">
          <DialogTitle className="text-sm font-semibold text-foreground leading-snug">
            {publication.title}
          </DialogTitle>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Research Type</p>
              <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <FileText className="w-3 h-3 text-muted-foreground" />
                {researchTypeLabels[publication.researchType] || publication.researchType}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Date Published</p>
              <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                {publication.date}
              </p>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">Authors</p>
            <div className="flex flex-wrap gap-1">
              {publication.authors.map((a, i) => (
                <span key={i} className="text-[10px] bg-background px-2 py-0.5 rounded border border-border/40 text-foreground">{a}</span>
              ))}
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">Topics</p>
            <div className="flex flex-wrap gap-1">
              {publication.topics.map((t, i) => (
                <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-medium">{t}</span>
              ))}
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">Abstract</p>
            <p className="text-[10px] text-foreground leading-relaxed">{publication.summary}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublicationDetailModal;
