import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, Building2, Calendar, Users, BookOpen, ExternalLink, FileText } from "lucide-react";

interface Publication {
  title: string;
  date: string;
  authors: string[];
  summary: string;
  topics: string[];
  researchType: string;
  journal?: string;
  doi?: string;
  citations?: number;
}

interface InstitutionPublicationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: string;
  country: string;
  focus: string;
  totalPapers: number;
  citations: number;
  hIndex: number;
  topic?: string;
}

const researchTypeLabels: Record<string, string> = {
  'experimental': 'Experimental',
  'review': 'Review',
  'meta-analysis': 'Meta Analysis',
  'market': 'Market Research',
  'techno-economics': 'Techno-Economic Analysis',
  'sustainability': 'Sustainability & LCA',
};

const generateInstitutionPublications = (institution: string, totalPapers: number, topic: string): Publication[] => {
  const templates = [
    { title: `Novel Bioprocess Optimization for ${topic} Production Using Advanced Fermentation`, type: 'experimental', journal: 'Biotechnology & Bioengineering' },
    { title: `Comprehensive Review of ${topic} Synthesis Pathways and Industrial Applications`, type: 'review', journal: 'Chemical Reviews' },
    { title: `Techno-Economic Assessment of ${topic} Manufacturing at Commercial Scale`, type: 'techno-economics', journal: 'Green Chemistry' },
    { title: `Life Cycle Assessment of Bio-based ${topic} Production from Renewable Feedstocks`, type: 'sustainability', journal: 'Journal of Cleaner Production' },
    { title: `Market Dynamics and Growth Projections for ${topic} in Global Markets`, type: 'market', journal: 'Industrial Biotechnology' },
    { title: `Metabolic Engineering Strategies for Enhanced ${topic} Yield in Microbial Systems`, type: 'experimental', journal: 'Metabolic Engineering' },
    { title: `Catalytic Conversion Routes for Sustainable ${topic} Production`, type: 'experimental', journal: 'ACS Catalysis' },
    { title: `Enzymatic Hydrolysis Optimization for ${topic} Recovery from Biomass`, type: 'experimental', journal: 'Bioresource Technology' },
    { title: `Environmental Impact Analysis of ${topic} Biorefineries: A Systematic Review`, type: 'sustainability', journal: 'Renewable & Sustainable Energy Reviews' },
    { title: `Downstream Processing Innovations for High-Purity ${topic} Isolation`, type: 'experimental', journal: 'Separation and Purification Technology' },
    { title: `Comparative Analysis of Fermentation Strategies for ${topic} Production`, type: 'meta-analysis', journal: 'Applied Microbiology and Biotechnology' },
    { title: `Scale-up Challenges and Solutions in ${topic} Biomanufacturing`, type: 'techno-economics', journal: 'Biochemical Engineering Journal' },
    { title: `Membrane-Based Separation Technologies for ${topic} Purification`, type: 'experimental', journal: 'Journal of Membrane Science' },
    { title: `Integrated Biorefinery Concepts for Co-production of ${topic} and Bioenergy`, type: 'review', journal: 'Biofuels, Bioproducts and Biorefining' },
    { title: `Machine Learning Applications in ${topic} Process Optimization`, type: 'experimental', journal: 'Computers & Chemical Engineering' },
  ];

  const authorPools = [
    ['Dr. A. Schmidt', 'Prof. M. Weber', 'Dr. K. Lindström'],
    ['Dr. S. Patel', 'Prof. J. Nakamura', 'Dr. L. Rossi'],
    ['Dr. H. Zhang', 'Prof. R. Andersson', 'Dr. C. Dubois'],
    ['Dr. T. Kim', 'Prof. E. Morales', 'Dr. F. Ivanova'],
    ['Dr. P. Chen', 'Prof. G. Taylor', 'Dr. N. Müller'],
  ];

  const topicSets = [
    ['Fermentation', 'Bioprocess'],
    ['Catalysis', 'Green Chemistry'],
    ['LCA', 'Sustainability'],
    ['Market Analysis', 'Economics'],
    ['Metabolic Engineering', 'Strain Development'],
    ['Separation', 'Purification'],
    ['Scale-up', 'Industrial'],
    ['Biomass', 'Feedstock'],
  ];

  const count = Math.min(templates.length, 15);
  const pubs: Publication[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < count; i++) {
    const t = templates[i];
    const authPool = authorPools[i % authorPools.length];
    const numAuthors = 2 + (i % 2);
    const day = 1 + (i * 3) % 28;
    const monthIdx = i % 12;
    const year = i < 5 ? 2025 : 2024;
    pubs.push({
      title: t.title,
      date: `${day} ${months[monthIdx]} ${year}`,
      authors: authPool.slice(0, numAuthors),
      summary: `Research conducted at ${institution} investigating ${t.title.toLowerCase().slice(0, 80)}...`,
      topics: topicSets[i % topicSets.length],
      researchType: t.type,
      journal: t.journal,
      doi: `10.1000/example.${year}.${i + 1}`,
      citations: Math.floor(Math.random() * 150) + 5,
    });
  }

  return pubs;
};

const InstitutionPublicationsModal = ({
  open,
  onOpenChange,
  institution,
  country,
  focus,
  totalPapers,
  citations,
  hIndex,
  topic = 'Lactic Acid',
}: InstitutionPublicationsModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);

  const allPublications = useMemo(() =>
    generateInstitutionPublications(institution, totalPapers, topic),
    [institution, totalPapers, topic]
  );

  const filteredPublications = useMemo(() => {
    let filtered = allPublications;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.authors.some(a => a.toLowerCase().includes(q)) ||
        p.topics.some(t => t.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [allPublications, searchQuery]);

  const handleClose = () => {
    setSearchQuery('');
    setSelectedPublication(null);
    onOpenChange(false);
  };

  if (selectedPublication) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[620px] p-0 gap-0 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedPublication(null)}>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Button>
              <DialogTitle className="text-sm font-semibold text-foreground leading-snug">
                {selectedPublication.title}
              </DialogTitle>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Research Type</p>
                <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3 text-muted-foreground" />
                  {researchTypeLabels[selectedPublication.researchType] || selectedPublication.researchType}
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Date Published</p>
                <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  {selectedPublication.date}
                </p>
              </div>
              {selectedPublication.journal && (
                <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Journal</p>
                  <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-muted-foreground" />
                    {selectedPublication.journal}
                  </p>
                </div>
              )}
              {selectedPublication.citations !== undefined && (
                <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Citations</p>
                  <p className="text-[11px] font-semibold text-foreground">{selectedPublication.citations}</p>
                </div>
              )}
            </div>

            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Institution</p>
              <p className="text-[11px] font-medium text-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3 text-muted-foreground" />
                {institution}
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">Authors</p>
              <div className="flex flex-wrap gap-1">
                {selectedPublication.authors.map((author, i) => (
                  <span key={i} className="text-[10px] bg-background px-2 py-0.5 rounded border border-border/40 text-foreground">{author}</span>
                ))}
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">Topics</p>
              <div className="flex flex-wrap gap-1">
                {selectedPublication.topics.map((t, i) => (
                  <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-medium">{t}</span>
                ))}
              </div>
            </div>

            {selectedPublication.doi && (
              <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">DOI</p>
                <p className="text-[10px] font-mono text-primary">{selectedPublication.doi}</p>
              </div>
            )}

            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">Abstract</p>
              <p className="text-[10px] text-foreground leading-relaxed">{selectedPublication.summary}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[620px] p-0 gap-0 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border flex-shrink-0">
          <DialogTitle className="text-sm font-semibold text-foreground">{institution}</DialogTitle>
          <p className="text-[10px] text-muted-foreground mt-0.5">{country} · {focus}</p>
        </div>

        <div className="px-4 py-2 border-b border-border flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Papers</div>
              <div className="text-sm font-bold text-foreground">{totalPapers.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Citations</div>
              <div className="text-sm font-bold text-primary">{citations.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search publications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-7 text-[10px]"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-2">
          <div className="text-[9px] text-muted-foreground mb-2">
            Showing {filteredPublications.length} of {allPublications.length} publications
          </div>
          <div className="space-y-1.5">
            {filteredPublications.map((pub, idx) => (
              <div
                key={idx}
                className="border border-border/40 rounded-lg p-2.5 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setSelectedPublication(pub)}
              >
                <div className="text-[11px] font-semibold text-foreground leading-snug mb-1">{pub.title}</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] text-muted-foreground">{pub.date}</span>
                  <span className="text-[9px] text-muted-foreground">·</span>
                  <span className="text-[9px] text-muted-foreground">{pub.authors.slice(0, 2).join(', ')}{pub.authors.length > 2 ? ' et al.' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 font-medium">
                    {researchTypeLabels[pub.researchType] || pub.researchType}
                  </Badge>
                  {pub.journal && (
                    <span className="text-[8px] text-muted-foreground italic">{pub.journal}</span>
                  )}
                  {pub.citations !== undefined && (
                    <span className="text-[8px] text-muted-foreground ml-auto">{pub.citations} citations</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstitutionPublicationsModal;
