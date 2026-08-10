import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, FileText, ArrowLeft, ExternalLink, Calendar, Building2, Globe } from "lucide-react";

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
}

interface IPHolderPatentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: string;
  totalPatents: number;
  grantedCount: number;
  filedCount: number;
  patents: Patent[];
  topic?: string;
}

// Generate mock patents for an organization based on their counts
const generateOrgPatents = (org: string, total: number, granted: number, filed: number, topic: string): Patent[] => {
  const patentTitles = [
    `Improved ${topic} Production Process Using Novel Catalyst System`,
    `Method for Enhanced ${topic} Yield via Controlled Fermentation`,
    `Continuous ${topic} Purification and Recovery Apparatus`,
    `Bio-based ${topic} Synthesis from Renewable Feedstock`,
    `High-Purity ${topic} Isolation Using Membrane Technology`,
    `Integrated ${topic} Biorefinery Process Design`,
    `Novel Enzyme Complex for ${topic} Conversion Efficiency`,
    `Sustainable ${topic} Manufacturing with Reduced Energy Input`,
    `Advanced Crystallisation Method for ${topic} Products`,
    `${topic} Quality Control System Using In-Line Sensors`,
    `Waste Valorisation Process for ${topic} By-Products`,
    `Scalable ${topic} Production from Lignocellulosic Biomass`,
    `Microorganism Strain for Enhanced ${topic} Biosynthesis`,
    `Downstream Processing Innovation for ${topic} Recovery`,
    `Circular Economy Approach to ${topic} Manufacturing`,
    `Automated ${topic} Process Optimisation Platform`,
    `Green Chemistry Route for ${topic} Derivative Synthesis`,
    `${topic} Polymerisation Catalyst with Improved Selectivity`,
    `Low-Carbon ${topic} Production via Electrochemical Pathway`,
    `${topic} Fermentation Broth Clarification Method`,
  ];

  const patents: Patent[] = [];
  for (let i = 0; i < total; i++) {
    const isGranted = i < granted;
    const filingYear = 2018 + Math.floor(Math.random() * 6);
    patents.push({
      title: patentTitles[i % patentTitles.length] + (i >= patentTitles.length ? ` (Variant ${Math.floor(i / patentTitles.length) + 1})` : ''),
      company: org,
      filingYear,
      grantedYear: isGranted ? filingYear + 1 + Math.floor(Math.random() * 2) : null,
      status: isGranted ? 'Granted' : 'Filed',
      jurisdiction: 3 + Math.floor(Math.random() * 15),
      abstract: `This invention relates to ${patentTitles[i % patentTitles.length].toLowerCase()}, providing significant improvements in efficiency, yield, and sustainability for industrial-scale ${topic.toLowerCase()} production.`,
      inventors: [`Inventor ${String.fromCharCode(65 + (i % 8))}. ${['Smith', 'Mueller', 'Zhang', 'Patel', 'Tanaka', 'Nielsen', 'Dubois', 'Kim'][i % 8]}`],
      cpcCodes: [`C${12 + (i % 4)}P ${(i % 20) + 1}/${(i * 3 + 2) % 30}`],
    });
  }
  return patents;
};

const IPHolderPatentsModal = ({
  open,
  onOpenChange,
  organization,
  totalPatents,
  grantedCount,
  filedCount,
  patents: providedPatents,
  topic = 'Lactic Acid',
}: IPHolderPatentsModalProps) => {
  const [activeTab, setActiveTab] = useState<'all' | 'granted' | 'filed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null);

  // Use provided patents or generate mock ones
  const allPatents = useMemo(() => {
    if (providedPatents.length > 0) return providedPatents;
    return generateOrgPatents(organization, totalPatents, grantedCount, filedCount, topic);
  }, [providedPatents, organization, totalPatents, grantedCount, filedCount, topic]);

  const filteredPatents = useMemo(() => {
    let filtered = allPatents;
    if (activeTab === 'granted') filtered = filtered.filter(p => p.status === 'Granted');
    if (activeTab === 'filed') filtered = filtered.filter(p => p.status === 'Filed');
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(lower) ||
        p.company.toLowerCase().includes(lower)
      );
    }
    return filtered;
  }, [allPatents, activeTab, searchTerm]);

  const handleClose = () => {
    setSelectedPatent(null);
    setSearchTerm('');
    setActiveTab('all');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[600px] p-0 gap-0 max-h-[80vh] overflow-hidden flex flex-col">
        {selectedPatent ? (
          <>
            {/* Patent Detail View */}
            <div className="px-4 py-3 border-b border-border flex-shrink-0">
              <button
                onClick={() => setSelectedPatent(null)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to {organization} patents
              </button>
              <DialogTitle className="text-sm font-semibold text-foreground leading-snug">
                {selectedPatent.title}
              </DialogTitle>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
              {/* Status & Key Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Status</p>
                  <div className="flex items-center gap-1">
                    {selectedPatent.status === 'Granted' ? (
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
                    {selectedPatent.jurisdiction} countries
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Filing Year</p>
                  <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    {selectedPatent.filingYear}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Granted Year</p>
                  <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    {selectedPatent.grantedYear || '—'}
                  </p>
                </div>
              </div>

              {/* Applicant */}
              <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Applicant</p>
                <p className="text-[11px] font-medium text-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  {selectedPatent.company}
                </p>
              </div>

              {/* Inventors */}
              {selectedPatent.inventors && selectedPatent.inventors.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">Inventors</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedPatent.inventors.map((inv, i) => (
                      <span key={i} className="text-[10px] bg-background px-2 py-0.5 rounded border border-border/40 text-foreground">{inv}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* CPC Codes */}
              {selectedPatent.cpcCodes && selectedPatent.cpcCodes.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">CPC Classification</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedPatent.cpcCodes.map((code, i) => (
                      <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-mono">{code}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Abstract */}
              {selectedPatent.abstract && (
                <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">Abstract</p>
                  <p className="text-[10px] text-foreground leading-relaxed">{selectedPatent.abstract}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* List View Header */}
            <div className="px-4 py-3 border-b border-border flex-shrink-0">
              <DialogTitle className="text-[9px] font-bold uppercase tracking-wider text-primary mb-0.5">IP Holder</DialogTitle>
              <h4 className="text-sm font-semibold text-foreground">{organization}</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">{totalPatents} patents · {grantedCount} granted · {filedCount} filed</p>
            </div>

            {/* Tabs + Search */}
            <div className="px-4 py-2 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-1">
                  {([
                    { key: 'all' as const, label: 'All', count: totalPatents },
                    { key: 'granted' as const, label: 'Granted', count: grantedCount },
                    { key: 'filed' as const, label: 'Filed', count: filedCount },
                  ]).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                        activeTab === tab.key
                          ? 'bg-foreground text-background shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {tab.key === 'granted' && <span className="text-primary">✓</span>}
                      {tab.key === 'filed' && <FileText className="w-2.5 h-2.5" />}
                      {tab.label}
                      <span className="opacity-70">{tab.count}</span>
                    </button>
                  ))}
                </div>
                <div className="relative w-44">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search patents..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-6 pr-6 h-6 !text-[9px] border-border w-full"
                  />
                  {searchTerm && (
                    <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="absolute right-0.5 top-1/2 -translate-y-1/2 h-4 w-4 p-0 hover:bg-muted">
                      <X className="h-2 w-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Patent List */}
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 px-4 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground" style={{ width: '50%' }}>Patent</th>
                    <th className="text-center py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Filing</th>
                    <th className="text-center py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Granted</th>
                    <th className="text-center py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="text-center py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Jurisd.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatents.map((patent, index) => (
                    <tr
                      key={index}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedPatent(patent)}
                    >
                      <td className="py-1.5 px-4" style={{ maxWidth: '280px' }}>
                        <div className="font-medium text-[10px] text-foreground line-clamp-2 hover:text-primary transition-colors">{patent.title}</div>
                        <div className="text-[9px] text-muted-foreground mt-0.5">Applicant: {patent.company}</div>
                      </td>
                      <td className="text-center py-1.5 text-[11px] text-muted-foreground">{patent.filingYear}</td>
                      <td className="text-center py-1.5 text-[11px] text-muted-foreground">{patent.grantedYear || ''}</td>
                      <td className="text-center py-1.5">
                        {patent.status === 'Granted' ? (
                          <div className="inline-flex items-center gap-0.5 text-primary text-[10px] font-medium"><span>✓</span><span>Granted</span></div>
                        ) : (
                          <div className="text-muted-foreground text-[10px]">Filed</div>
                        )}
                      </td>
                      <td className="text-center py-1.5"><span className="text-[10px] text-muted-foreground">{patent.jurisdiction}</span></td>
                    </tr>
                  ))}
                  {filteredPatents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-[10px] text-muted-foreground">No patents found matching your criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IPHolderPatentsModal;
