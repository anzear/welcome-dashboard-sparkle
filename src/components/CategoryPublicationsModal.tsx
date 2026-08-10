import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowLeft, Calendar, BookOpen, FileText, Building2 } from "lucide-react";

const TOP_ORG_POOL = [
  'MIT', 'Stanford University', 'ETH Zürich', 'Wageningen University',
  'Tsinghua University', 'TU Delft', 'KAIST', 'Imperial College London',
  'University of Tokyo', 'NREL', 'Fraunhofer Institute', 'CSIRO',
];

const getTopOrganisations = (category: string, total: number) => {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  const picks: { name: string; count: number }[] = [];
  const used = new Set<number>();
  let share = 0.28;
  for (let i = 0; i < 3; i++) {
    let idx = (hash + i * 7) % TOP_ORG_POOL.length;
    while (used.has(idx)) idx = (idx + 1) % TOP_ORG_POOL.length;
    used.add(idx);
    picks.push({ name: TOP_ORG_POOL[idx], count: Math.max(1, Math.round(total * share)) });
    share -= 0.08;
  }
  return picks;
};

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

interface Subcategory {
  name: string;
  total: number;
}

interface CategoryPublicationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  totalPublications: number;
  subcategories: Subcategory[];
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

const generateCategoryPublications = (category: string, subs: Subcategory[], total: number, topic: string): Publication[] => {
  const types = Object.keys(researchTypeLabels);
  const journals = [
    'Biotechnology & Bioengineering', 'Green Chemistry', 'Bioresource Technology',
    'Chemical Reviews', 'ACS Catalysis', 'Journal of Cleaner Production',
    'Metabolic Engineering', 'Applied Microbiology and Biotechnology',
    'Renewable & Sustainable Energy Reviews', 'Separation and Purification Technology',
  ];
  const authorPools = [
    ['Dr. A. Schmidt', 'Prof. M. Weber'], ['Dr. S. Patel', 'Prof. J. Nakamura'],
    ['Dr. H. Zhang', 'Prof. R. Andersson'], ['Dr. T. Kim', 'Prof. E. Morales'],
    ['Dr. P. Chen', 'Prof. G. Taylor'], ['Dr. L. Rossi', 'Prof. K. Lindström'],
  ];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pubs: Publication[] = [];
  const count = Math.min(20, total);
  const normalizedSubs = subs.length > 0 ? subs : [{ name: category, total }];

  for (let i = 0; i < count; i++) {
    const sub = normalizedSubs[i % normalizedSubs.length];
    const type = types[i % types.length];
    const pool = authorPools[i % authorPools.length];
    const year = i < 8 ? 2025 : 2024;
    const day = 1 + (i * 3) % 28;
    pubs.push({
      title: `${researchTypeLabels[type]} Study on ${sub.name} for ${topic} ${category} Applications`,
      date: `${day} ${months[i % 12]} ${year}`,
      authors: [...pool, `Dr. ${String.fromCharCode(65 + i % 10)}. ${sub.name.split(' ')[0]}`],
      summary: `Research investigating the role of ${sub.name.toLowerCase()} in ${category.toLowerCase()} processes for ${topic.toLowerCase()} production and applications.`,
      topics: [sub.name, category],
      researchType: type,
      journal: journals[i % journals.length],
      doi: `10.1000/${category.toLowerCase().replace(/\s/g, '-')}.${year}.${i + 1}`,
      citations: Math.floor(Math.random() * 120) + 5,
    });
  }
  return pubs;
};

const CategoryPublicationsModal = ({
  open, onOpenChange, categoryName, totalPublications, subcategories, topic = 'Lactic Acid',
}: CategoryPublicationsModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSub, setSelectedSub] = useState<string>('all');
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);

  const allPublications = useMemo(() =>
    generateCategoryPublications(categoryName, subcategories, totalPublications, topic),
    [categoryName, subcategories, totalPublications, topic]
  );

  const filteredPublications = useMemo(() => {
    let filtered = allPublications;
    if (selectedSub !== 'all') {
      filtered = filtered.filter(p => p.topics.some(t => t === selectedSub));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.authors.some(a => a.toLowerCase().includes(q)) ||
        p.topics.some(t => t.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [allPublications, searchQuery, selectedSub]);

  const handleClose = () => {
    setSearchQuery('');
    setSelectedSub('all');
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
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">Authors</p>
              <div className="flex flex-wrap gap-1">
                {selectedPublication.authors.map((a, i) => (
                  <span key={i} className="text-[10px] bg-background px-2 py-0.5 rounded border border-border/40 text-foreground">{a}</span>
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
          <DialogTitle className="text-sm font-semibold text-foreground">{categoryName}</DialogTitle>
          <p className="text-[10px] text-muted-foreground mt-0.5">{totalPublications.toLocaleString()} publications</p>
        </div>

        <div className="px-4 py-2.5 border-b border-border flex-shrink-0 bg-muted/20">
          <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Top 3 Organisations
          </p>
          <div className="grid grid-cols-3 gap-2">
            {getTopOrganisations(categoryName, totalPublications).map((org, i) => (
              <div key={org.name} className="bg-background rounded border border-border/40 px-2 py-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[8px] font-bold text-primary">#{i + 1}</span>
                  <span className="text-[10px] font-semibold text-foreground truncate">{org.name}</span>
                </div>
                <p className="text-[9px] text-muted-foreground">{org.count} publications</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-2 border-b border-border flex-shrink-0 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search publications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-7 text-[10px]"
            />
          </div>
          {subcategories.length > 0 && (
            <Select value={selectedSub} onValueChange={setSelectedSub}>
              <SelectTrigger className="h-7 w-[160px] text-[10px]">
                <SelectValue placeholder="All subcategories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px]">All subcategories</SelectItem>
                {subcategories.map(s => (
                  <SelectItem key={s.name} value={s.name} className="text-[10px]">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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

export default CategoryPublicationsModal;
