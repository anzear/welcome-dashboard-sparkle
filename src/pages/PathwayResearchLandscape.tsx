import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Search, ExternalLink, FlaskConical, ShoppingBag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import InstitutionPublicationsModal from "@/components/InstitutionPublicationsModal";
import PublicationDetailModal from "@/components/PublicationDetailModal";

const dataByView = {
  production: {
    trend: [
      { year: "2020", publications: 1200 },
      { year: "2021", publications: 3200 },
      { year: "2022", publications: 1800 },
      { year: "2023", publications: 4500 },
      { year: "2024", publications: 2400 },
    ],
    totalPublications: 13100,
    growthPercent: 22,
    growthTopic: "Bioprocess Optimization",
    growthDescription: "Focus on enzymatic hydrolysis efficiency and fermentation scale-up",
    institutions: [
      { rank: 1, name: "ETH Zürich", country: "Switzerland", papers: 620, citations: 9200, hIndex: 41, focus: "Bioprocess Engineering" },
      { rank: 2, name: "Wageningen University", country: "Netherlands", papers: 580, citations: 8100, hIndex: 38, focus: "Biomass Conversion" },
      { rank: 3, name: "Technical University of Denmark", country: "Denmark", papers: 460, citations: 6200, hIndex: 33, focus: "Enzyme Technology" },
      { rank: 4, name: "University of São Paulo", country: "Brazil", papers: 430, citations: 5400, hIndex: 30, focus: "Sugarcane Biorefineries" },
      { rank: 5, name: "NREL", country: "United States", papers: 380, citations: 7100, hIndex: 35, focus: "Bioenergy Systems" },
      { rank: 6, name: "Chinese Academy of Sciences", country: "China", papers: 360, citations: 4800, hIndex: 28, focus: "Catalytic Processes" },
      { rank: 7, name: "Lund University", country: "Sweden", papers: 320, citations: 4200, hIndex: 26, focus: "Metabolic Engineering" },
      { rank: 8, name: "VTT Technical Research Centre", country: "Finland", papers: 290, citations: 3600, hIndex: 24, focus: "Industrial Biotechnology" },
    ],
    publications: [
      { id: 1, title: "Optimized Enzymatic Hydrolysis of Lignocellulosic Biomass for Lactic Acid Production", date: "12 Feb 2025", authors: ["Dr. A. Müller", "Prof. K. Jensen"], summary: "Novel enzyme cocktails achieving 92% conversion efficiency in pilot-scale reactors.", topics: ["Enzymatic Hydrolysis", "Scale-up"], researchType: "experimental" },
      { id: 2, title: "Continuous Fermentation Strategies for Bio-based Lactic Acid Manufacturing", date: "8 Feb 2025", authors: ["Dr. L. Chen", "Dr. M. Park"], summary: "Comparison of batch vs continuous fermentation for industrial-scale lactic acid production.", topics: ["Fermentation", "Process Design"], researchType: "techno-economics" },
      { id: 3, title: "Metabolic Engineering of Lactobacillus for Enhanced Optical Purity", date: "1 Feb 2025", authors: ["Prof. S. Tanaka", "Dr. R. Kim"], summary: "CRISPR-based modifications achieving >99.5% L-lactic acid optical purity.", topics: ["Metabolic Engineering", "Strain Development"], researchType: "experimental" },
      { id: 4, title: "Life Cycle Assessment of Biochemical Lactic Acid Production Routes", date: "28 Jan 2025", authors: ["Dr. E. Rossi", "Prof. H. Weber"], summary: "Comparative environmental impact of sugar and lignocellulose-based production pathways.", topics: ["LCA", "Sustainability"], researchType: "sustainability" },
      { id: 5, title: "Review: Advances in Downstream Processing of Bio-based Lactic Acid", date: "22 Jan 2025", authors: ["Dr. P. Dubois", "Prof. A. Singh"], summary: "State-of-the-art purification and separation technologies for polymer-grade lactic acid.", topics: ["Downstream Processing", "Purification"], researchType: "review" },
    ],
  },
  application: {
    trend: [
      { year: "2020", publications: 900 },
      { year: "2021", publications: 2100 },
      { year: "2022", publications: 2800 },
      { year: "2023", publications: 3600 },
      { year: "2024", publications: 3100 },
    ],
    totalPublications: 12500,
    growthPercent: 31,
    growthTopic: "PLA Composites",
    growthDescription: "Growing research on polylactic acid blends and composite materials",
    institutions: [
      { rank: 1, name: "MIT", country: "United States", papers: 540, citations: 8800, hIndex: 39, focus: "Polymer Science" },
      { rank: 2, name: "Imperial College London", country: "United Kingdom", papers: 490, citations: 7500, hIndex: 36, focus: "Green Chemistry" },
      { rank: 3, name: "KAIST", country: "South Korea", papers: 420, citations: 5900, hIndex: 32, focus: "Advanced Materials" },
      { rank: 4, name: "University of Tokyo", country: "Japan", papers: 390, citations: 5200, hIndex: 30, focus: "Biodegradable Polymers" },
      { rank: 5, name: "TU Eindhoven", country: "Netherlands", papers: 350, citations: 4600, hIndex: 28, focus: "Material Engineering" },
      { rank: 6, name: "Tsinghua University", country: "China", papers: 330, citations: 4100, hIndex: 26, focus: "Packaging Science" },
      { rank: 7, name: "ETH Zürich", country: "Switzerland", papers: 300, citations: 3800, hIndex: 25, focus: "Sustainable Plastics" },
      { rank: 8, name: "Georgia Tech", country: "United States", papers: 270, citations: 3400, hIndex: 23, focus: "Biomedical Applications" },
    ],
    publications: [
      { id: 1, title: "High-Performance PLA Nanocomposites for Flexible Packaging Applications", date: "10 Feb 2025", authors: ["Dr. Y. Kim", "Prof. J. Liu"], summary: "Cellulose nanocrystal reinforced PLA films with improved barrier properties.", topics: ["PLA", "Packaging"], researchType: "experimental" },
      { id: 2, title: "Market Analysis of Bio-based Lactic Acid Derivatives in Cosmetics", date: "5 Feb 2025", authors: ["Dr. C. Martin", "Dr. F. Bauer"], summary: "Assessment of lactate ester market dynamics in the personal care sector.", topics: ["Market Analysis", "Cosmetics"], researchType: "market" },
      { id: 3, title: "Biodegradation Kinetics of PLA-based Medical Implants", date: "30 Jan 2025", authors: ["Prof. M. Patel", "Dr. S. Ivanova"], summary: "In-vivo degradation study of stereocomplexed PLA for orthopedic fixation.", topics: ["Biomedical", "Degradation"], researchType: "experimental" },
      { id: 4, title: "Techno-Economic Analysis of Lactide Production for PLA Manufacturing", date: "25 Jan 2025", authors: ["Dr. R. Andersson", "Prof. T. Nakamura"], summary: "Cost modeling of ring-opening polymerization routes at commercial scale.", topics: ["Techno-Economics", "PLA"], researchType: "techno-economics" },
      { id: 5, title: "Review: Lactic Acid as Platform Chemical for Sustainable Chemistry", date: "18 Jan 2025", authors: ["Prof. G. Morales", "Dr. H. Zhang"], summary: "Comprehensive review of lactic acid conversion pathways to value-added chemicals.", topics: ["Platform Chemical", "Green Chemistry"], researchType: "review" },
    ],
  },
};

const researchTypes = [
  { value: "all", label: "All Types" },
  { value: "meta-analysis", label: "Meta Analysis" },
  { value: "market", label: "Market Research" },
  { value: "techno-economics", label: "Techno-Economic Analysis" },
  { value: "sustainability", label: "Sustainability & LCA" },
  { value: "experimental", label: "Experimental" },
  { value: "review", label: "Review Papers" },
];

const PathwayResearchLandscape = () => {
  const { category, topic, pathwayId } = useParams();
  const navigate = useNavigate();
  const [selectedResearchType, setSelectedResearchType] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("5");
  const [researchView, setResearchView] = useState<'production' | 'application'>('production');
  const [selectedInstitution, setSelectedInstitution] = useState<typeof data.institutions[0] | null>(null);
  const [selectedPublicationDetail, setSelectedPublicationDetail] = useState<typeof data.publications[0] | null>(null);

  const decodedTopic = decodeURIComponent(topic || "");
  const data = dataByView[researchView];

  const filteredPublications = selectedResearchType === "all"
    ? data.publications
    : data.publications.filter(p => p.researchType === selectedResearchType);

  const col1 = data.institutions.slice(0, 4);
  const col2 = data.institutions.slice(4, 8);
  const maxPapers = Math.max(...data.institutions.map(i => i.papers));
  const maxCitations = Math.max(...data.institutions.map(i => i.citations));

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 pb-3 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/landscape/${category}/${topic}/value-chain/pathways/${pathwayId}`)}
          className="gap-1.5 h-7 text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-6 pb-6 flex-1 min-h-0 flex flex-col">
        <div className="mb-2 flex-shrink-0">
          <h1 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pathway Research Landscape: <span className="text-primary">Pathway {pathwayId} for {decodedTopic}</span></h1>
        </div>

        <Card className="bg-card border border-border/60 shadow-sm flex-1 min-h-0 flex flex-col">
          <CardContent className="px-4 py-3 flex h-full min-h-0 flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="space-y-4">
              {/* Production / Application toggle */}
              <div className="inline-flex w-fit items-center bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setResearchView('production')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${researchView === 'production' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <FlaskConical className="w-3 h-3" />
                  Production
                </button>
                <button
                  onClick={() => setResearchView('application')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${researchView === 'application' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <ShoppingBag className="w-3 h-3" />
                  Application
                </button>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                {researchView === 'production'
                  ? `Research related to the production, extraction, and purification of ${decodedTopic} from biomass feedstocks for this pathway.`
                  : `Research related to the downstream use of ${decodedTopic} in end-market applications such as food, pharma, and materials for this pathway.`}
              </p>
              {/* Research Publication Trend */}
              <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                <div className="mb-2">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Research Publication Trend</h3>
                  <p className="text-xs text-muted-foreground">Publication volume over time for research in this pathway.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-end mb-1.5">
                      <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="h-6 w-auto text-[9px] border-border gap-1 px-1.5 py-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5" className="text-[10px]">Last 5 years</SelectItem>
                          <SelectItem value="10" className="text-[10px]">Last 10 years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.trend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                          <XAxis dataKey="year" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => v.toLocaleString()} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload?.length) {
                                return (
                                  <div className="bg-card border border-border rounded-lg p-1.5 shadow-lg text-[9px]">
                                    <p className="font-semibold text-foreground mb-0.5">{`${payload[0].value?.toLocaleString()} publications`}</p>
                                    <p className="text-muted-foreground">{`In ${label}`}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line type="monotone" dataKey="publications" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }} activeDot={{ r: 4, stroke: "hsl(var(--primary))", strokeWidth: 2, fill: "hsl(var(--background))" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="w-[140px] space-y-2 flex-shrink-0">
                    <div className="rounded-lg border border-border/40 bg-background p-3 text-center">
                      <div className="text-[8px] text-muted-foreground uppercase tracking-wide">Total Publications</div>
                      <div className="text-lg font-bold text-foreground mt-0.5">{data.totalPublications.toLocaleString()}</div>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-background p-3 text-center">
                      <div className="text-[8px] text-muted-foreground uppercase tracking-wide">Growth Rate (3Y)</div>
                      <div className="text-lg font-bold text-primary mt-0.5">+{data.growthPercent}%</div>
                      <div className="text-[8px] text-muted-foreground mt-0.5">over the last 3 years</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leading Research Institutions */}
              <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                <div className="mb-2">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Leading Research Institutions</h3>
                  <p className="text-xs text-muted-foreground">Top academic and research organizations driving research output for this pathway.</p>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
                  {[col1, col2].map((col, colIdx) => (
                    <React.Fragment key={colIdx}>
                      {colIdx === 1 && <div className="w-px bg-border/60" />}
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-[3px] text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">Institution</th>
                            <th className="text-center py-[3px] text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">Papers</th>
                            <th className="text-center py-[3px] text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">Citations</th>
                            
                          </tr>
                        </thead>
                        <tbody>
                          {col.map((inst) => (
                            <tr key={inst.rank} className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedInstitution(inst)}>
                              <td className="py-[3px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-muted-foreground w-3 font-medium">{inst.rank}</span>
                                  <div>
                                    <span className="font-medium text-foreground text-[10px]">{inst.name}</span>
                                    <div className="text-[8px] text-muted-foreground">{inst.country} · {inst.focus}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="text-center py-[3px]">
                                <div className="flex items-center justify-center gap-1">
                                  <div className="w-10 h-1 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-foreground/60 rounded-full" style={{ width: `${inst.papers / maxPapers * 100}%` }}></div>
                                  </div>
                                  <span className="text-[10px] font-medium">{inst.papers.toLocaleString()}</span>
                                </div>
                              </td>
                              <td className="text-center py-[3px]">
                                <div className="flex items-center justify-center gap-1">
                                  <div className="w-10 h-1 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${inst.citations / maxCitations * 100}%` }}></div>
                                  </div>
                                  <span className="text-[10px] text-primary font-medium">{inst.citations.toLocaleString()}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Latest Publications */}
              <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Latest Publications</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Search" className="pl-7 w-44 h-7 text-[10px]" />
                    </div>
                    <Select value={selectedResearchType} onValueChange={setSelectedResearchType}>
                      <SelectTrigger className="w-40 h-7 text-[10px]">
                        <SelectValue placeholder="Research Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {researchTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select defaultValue="date">
                      <SelectTrigger className="w-24 h-7 text-[10px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="citations">Citations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {filteredPublications.map((pub) => (
                    <div key={pub.id} className="border-l-2 border-l-border border border-border/30 bg-background rounded-lg p-3 hover:border-border/60 transition-colors cursor-pointer" onClick={() => setSelectedPublicationDetail(pub)}>
                      <div className="grid grid-cols-[2fr_auto_1fr_2fr_auto] gap-4 items-start">
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-foreground leading-snug">{pub.title}</div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            <Badge variant="outline" className="text-[8px] px-1.5 py-0.5 font-medium">
                              {researchTypes.find(t => t.value === pub.researchType)?.label || pub.researchType}
                            </Badge>
                            {pub.topics.map((t, i) => (
                              <Badge key={i} variant="secondary" className="text-[8px] px-1.5 py-0.5">{t}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-[9px] text-muted-foreground whitespace-nowrap pt-0.5">{pub.date}</div>
                        <div className="text-[9px] text-muted-foreground pt-0.5">{pub.authors.join(", ")}</div>
                        <div className="text-[9px] text-muted-foreground leading-snug pt-0.5">{pub.summary}</div>
                        <div className="flex-shrink-0 pt-0.5">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0"><ExternalLink className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs">Previous</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs">Next</Button>
                  </div>
                  <div className="text-[9px] text-muted-foreground">Page 1 of 10</div>
                </div>
              </div>
              </div>
            </div>
          </CardContent>
          </Card>
        </div>
        <InstitutionPublicationsModal
          open={!!selectedInstitution}
          onOpenChange={() => setSelectedInstitution(null)}
          institution={selectedInstitution?.name || ''}
          country={selectedInstitution?.country || ''}
          focus={selectedInstitution?.focus || ''}
          totalPapers={selectedInstitution?.papers || 0}
          citations={selectedInstitution?.citations || 0}
          hIndex={selectedInstitution?.hIndex || 0}
          topic={decodedTopic}
        />
        <PublicationDetailModal
          open={!!selectedPublicationDetail}
          onOpenChange={() => setSelectedPublicationDetail(null)}
          publication={selectedPublicationDetail}
        />
      </div>
  );
};

export default PathwayResearchLandscape;