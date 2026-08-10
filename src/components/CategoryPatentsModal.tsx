import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, FileText, ArrowLeft, Calendar, Building2, Globe } from "lucide-react";

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

interface Subcategory {
  n: string;
  v: number;
}

interface CategoryPatentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  totalPatents: number;
  share: string;
  cagr: string;
  subcategories: Subcategory[];
  topic?: string;
}

const TOP_IP_POOL = [
  'BASF SE', 'Novozymes A/S', 'DSM', 'Cargill Inc.', 'ADM',
  'Südzucker AG', 'DuPont', 'Corbion', 'NatureWorks', 'Toray Industries',
  'Mitsubishi Chemical', 'Evonik',
];

const getTopIPHolders = (category: string, total: number) => {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  const picks: { name: string; count: number }[] = [];
  const used = new Set<number>();
  let share = 0.26;
  for (let i = 0; i < 3; i++) {
    let idx = (hash + i * 5) % TOP_IP_POOL.length;
    while (used.has(idx)) idx = (idx + 1) % TOP_IP_POOL.length;
    used.add(idx);
    picks.push({ name: TOP_IP_POOL[idx], count: Math.max(1, Math.round(total * share)) });
    share -= 0.07;
  }
  return picks;
};

const generateCategoryPatents = (category: string, subs: Subcategory[], total: number, topic: string): Patent[] => {
  const templates = [
    `Novel ${topic} Extraction from {sub} via Enzymatic Hydrolysis`,
    `Improved Pre-treatment Method for {sub} in ${topic} Production`,
    `High-Efficiency {sub} Processing for Bio-based ${topic}`,
    `Integrated {sub} Biorefinery for ${topic} Synthesis`,
    `Continuous {sub} Conversion System for ${topic} Manufacturing`,
    `Sustainable {sub} Valorisation for ${topic} Recovery`,
    `Advanced {sub} Fractionation in ${topic} Downstream Processing`,
    `{sub}-Derived ${topic} Purification Using Membrane Filtration`,
    `Low-Energy {sub} Deconstruction for ${topic} Intermediates`,
    `Automated Quality Control for {sub}-Based ${topic} Feedstock`,
    `Catalytic {sub} Transformation for Enhanced ${topic} Yield`,
    `Green Solvent System for {sub} in ${topic} Applications`,
  ];

  const companies = [
    'BASF SE', 'Novozymes A/S', 'DSM', 'Cargill Inc.', 'ADM',
    'Südzucker AG', 'Clariant AG', 'DuPont', 'Evonik Industries',
    'Novamont S.p.A.', 'TotalEnergies', 'Braskem S.A.'
  ];

  const patents: Patent[] = [];
  let idx = 0;

  for (const sub of subs) {
    const count = Math.max(3, Math.round((sub.v / total) * Math.min(total, 30)));
    for (let i = 0; i < count && patents.length < Math.min(total, 40); i++) {
      const template = templates[idx % templates.length];
      const title = template.replace(/\{sub\}/g, sub.n);
      const filingYear = 2018 + Math.floor(Math.random() * 6);
      const isGranted = Math.random() > 0.45;
      patents.push({
        title,
        company: companies[idx % companies.length],
        filingYear,
        grantedYear: isGranted ? filingYear + 1 + Math.floor(Math.random() * 2) : null,
        status: isGranted ? 'Granted' : 'Filed',
        jurisdiction: 3 + Math.floor(Math.random() * 15),
        subcategory: sub.n,
        abstract: `This invention relates to ${title.toLowerCase()}, providing improvements in efficiency and sustainability for industrial-scale ${topic.toLowerCase()} production using ${sub.n.toLowerCase()}.`,
        inventors: [`Dr. ${['A', 'B', 'C', 'D', 'E'][idx % 5]}. ${['Mueller', 'Zhang', 'Patel', 'Tanaka', 'Nielsen'][idx % 5]}`],
        cpcCodes: [`C${12 + (idx % 4)}P ${(idx % 20) + 1}/${(idx * 3 + 2) % 30}`],
      });
      idx++;
    }
  }
  return patents;
};

const CategoryPatentsModal = ({
  open,
  onOpenChange,
  categoryName,
  totalPatents,
  share,
  cagr,
  subcategories,
  topic = 'Lactic Acid',
}: CategoryPatentsModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSub, setSelectedSub] = useState<string>('all');
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null);

  const allPatents = useMemo(() => {
    return generateCategoryPatents(categoryName, subcategories, totalPatents, topic);
  }, [categoryName, subcategories, totalPatents, topic]);

  const filteredPatents = useMemo(() => {
    let filtered = allPatents;
    if (selectedSub !== 'all') {
      filtered = filtered.filter(p => p.subcategory === selectedSub);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(lower) ||
        p.company.toLowerCase().includes(lower)
      );
    }
    return filtered;
  }, [allPatents, selectedSub, searchTerm]);

  const handleClose = () => {
    setSelectedPatent(null);
    setSearchTerm('');
    setSelectedSub('all');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[620px] p-0 gap-0 max-h-[80vh] overflow-hidden flex flex-col">
        {selectedPatent ? (
          <>
            <div className="px-4 py-3 border-b border-border flex-shrink-0">
              <button
                onClick={() => setSelectedPatent(null)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to {categoryName} patents
              </button>
              <DialogTitle className="text-sm font-semibold text-foreground leading-snug">
                {selectedPatent.title}
              </DialogTitle>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
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

              <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Applicant</p>
                <p className="text-[11px] font-medium text-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  {selectedPatent.company}
                </p>
              </div>

              {selectedPatent.subcategory && (
                <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Subcategory</p>
                  <p className="text-[11px] font-medium text-foreground">{selectedPatent.subcategory}</p>
                </div>
              )}

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
            <div className="px-4 py-3 border-b border-border flex-shrink-0">
              <DialogTitle className="text-[9px] font-bold uppercase tracking-wider text-primary mb-0.5">Patent Category</DialogTitle>
              <h4 className="text-sm font-semibold text-foreground">{categoryName}</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {totalPatents.toLocaleString()} patents · {share} share · <span className="text-primary font-medium">{cagr} CAGR</span>
              </p>
            </div>

            <div className="px-4 py-2.5 border-b border-border flex-shrink-0 bg-muted/20">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Top 3 IP Holders
              </p>
              <div className="grid grid-cols-3 gap-2">
                {getTopIPHolders(categoryName, totalPatents).map((org, i) => (
                  <div key={org.name} className="bg-background rounded border border-border/40 px-2 py-1.5">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[8px] font-bold text-primary">#{i + 1}</span>
                      <span className="text-[10px] font-semibold text-foreground truncate">{org.name}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground">{org.count} patents</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-2 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Select value={selectedSub} onValueChange={setSelectedSub}>
                  <SelectTrigger className="h-6 w-[160px] text-[9px] border-border bg-background [&>svg]:h-2.5 [&>svg]:w-2.5">
                    <SelectValue placeholder="All subcategories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[10px]">All subcategories</SelectItem>
                    {subcategories.map(sub => (
                      <SelectItem key={sub.n} value={sub.n} className="text-[10px]">
                        {sub.n} ({sub.v})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
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

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 px-4 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground" style={{ width: '45%' }}>Patent</th>
                    <th className="text-left py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Subcategory</th>
                    <th className="text-center py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Filing</th>
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
                      <td className="py-1.5 px-4" style={{ maxWidth: '260px' }}>
                        <div className="font-medium text-[10px] text-foreground line-clamp-2 hover:text-primary transition-colors">{patent.title}</div>
                        <div className="text-[9px] text-muted-foreground mt-0.5">{patent.company}</div>
                      </td>
                      <td className="py-1.5">
                        <span className="text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{patent.subcategory}</span>
                      </td>
                      <td className="text-center py-1.5 text-[11px] text-muted-foreground">{patent.filingYear}</td>
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

export default CategoryPatentsModal;
