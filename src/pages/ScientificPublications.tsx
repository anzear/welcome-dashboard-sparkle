import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Search, ExternalLink, FlaskConical, ShoppingBag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import InstitutionPublicationsModal from "@/components/InstitutionPublicationsModal";
import CategoryPublicationsModal from "@/components/CategoryPublicationsModal";
import PublicationDetailModal from "@/components/PublicationDetailModal";

const ScientificPublications = () => {
  const { category, topic } = useParams();
  const navigate = useNavigate();
  const [selectedResearchType, setSelectedResearchType] = useState<string>("all");
  const [researchView, setResearchView] = useState<'production' | 'application'>('production');
  const [timeRange, setTimeRange] = useState<string>("5");
  
  const decodedTopic = decodeURIComponent(topic || "");
  const isFeedstockRoute = decodeURIComponent(category || "") === 'Feedstock';

  const productionTrend = [
    { year: "2015", publications: 6 },
    { year: "2016", publications: 8 },
    { year: "2017", publications: 10 },
    { year: "2018", publications: 12 },
    { year: "2019", publications: 11 },
    { year: "2020", publications: 14 },
    { year: "2021", publications: 17 },
    { year: "2022", publications: 19 },
    { year: "2023", publications: 23 },
    { year: "2024", publications: 22 }
  ];

  const applicationTrend = [
    { year: "2015", publications: 11 },
    { year: "2016", publications: 14 },
    { year: "2017", publications: 18 },
    { year: "2018", publications: 22 },
    { year: "2019", publications: 19 },
    { year: "2020", publications: 26 },
    { year: "2021", publications: 31 },
    { year: "2022", publications: 36 },
    { year: "2023", publications: 44 },
    { year: "2024", publications: 41 }
  ];

  const allPublicationTrend = researchView === 'production' ? productionTrend : applicationTrend;
  const totalPublicationsCount = researchView === 'production' ? 142 : 262;

  const publicationTrend = timeRange === '5' ? allPublicationTrend.slice(-5) : allPublicationTrend;

  const productionInstitutions = [
    { rank: 1, name: "ETH Zürich", country: "Switzerland", papers: 18, citations: 342, hIndex: 12, focus: "Bioprocess Engineering" },
    { rank: 2, name: "Wageningen University", country: "Netherlands", papers: 16, citations: 298, hIndex: 11, focus: "Biomass Conversion" },
    { rank: 3, name: "MIT", country: "United States", papers: 14, citations: 276, hIndex: 10, focus: "Synthetic Biology" },
    { rank: 4, name: "Technical University of Denmark", country: "Denmark", papers: 12, citations: 218, hIndex: 9, focus: "Enzyme Technology" },
    { rank: 5, name: "University of São Paulo", country: "Brazil", papers: 11, citations: 189, hIndex: 8, focus: "Sugarcane Biorefineries" },
    { rank: 6, name: "Chinese Academy of Sciences", country: "China", papers: 10, citations: 164, hIndex: 7, focus: "Catalytic Processes" },
    { rank: 7, name: "Imperial College London", country: "United Kingdom", papers: 9, citations: 152, hIndex: 7, focus: "Green Chemistry" },
    { rank: 8, name: "NREL", country: "United States", papers: 8, citations: 141, hIndex: 6, focus: "Bioenergy Systems" },
  ];

  const applicationInstitutions = [
    { rank: 1, name: "Stanford University", country: "United States", papers: 26, citations: 512, hIndex: 14, focus: "PLA Bioplastics" },
    { rank: 2, name: "KU Leuven", country: "Belgium", papers: 22, citations: 458, hIndex: 13, focus: "Food & Beverage Applications" },
    { rank: 3, name: "Tsinghua University", country: "China", papers: 21, citations: 421, hIndex: 12, focus: "Pharmaceutical Excipients" },
    { rank: 4, name: "Fraunhofer Institute", country: "Germany", papers: 19, citations: 387, hIndex: 11, focus: "Biomedical Polymers" },
    { rank: 5, name: "University of Tokyo", country: "Japan", papers: 17, citations: 334, hIndex: 10, focus: "Cosmetics & Personal Care" },
    { rank: 6, name: "Cornell University", country: "United States", papers: 15, citations: 289, hIndex: 9, focus: "Agricultural Films" },
    { rank: 7, name: "INRAE", country: "France", papers: 13, citations: 247, hIndex: 8, focus: "Food Acidulants" },
    { rank: 8, name: "Seoul National University", country: "South Korea", papers: 12, citations: 218, hIndex: 8, focus: "Textile Coatings" },
  ];

  const institutions = researchView === 'application' ? applicationInstitutions : productionInstitutions;

  const researchTypes = [
    { value: "all", label: "All Types" },
    { value: "meta-analysis", label: "Meta Analysis" },
    { value: "market", label: "Market Research" },
    { value: "techno-economics", label: "Techno-Economic Analysis" },
    { value: "sustainability", label: "Sustainability & LCA" },
    { value: "experimental", label: "Experimental" },
    { value: "review", label: "Review Papers" }
  ];

  const productionPublications = [
    { id: 1, title: "Advanced Biochemical Valorization of Sugar Beet Pulp for Sustainable Chemical Production", date: "3 Mar 2025", authors: ["Dr. Jane Smith", "Prof. John Doe", "Dr. Sarah Wilson"], summary: "License the developed technology to industrial partners and launch a pilot-scale production.", topics: ["Apple Pomace", "Waste Valorisation"], researchType: "experimental" },
    { id: 2, title: "Circular Economy Approaches in Sugar Beet Processing: A Comprehensive Review", date: "3 Mar 2025", authors: ["Dr. Michael Chen", "Prof. Lisa Brown", "Dr. David Park"], summary: "Comprehensive analysis of circular economy principles applied to sugar beet processing chains and waste stream optimization.", topics: ["Circular Economy", "Waste Valorisation", "Sustainability"], researchType: "meta-analysis" },
    { id: 3, title: "Techno-Economic Assessment of Sugar Beet Waste Biorefinery Concepts", date: "2 Mar 2025", authors: ["Dr. Emma Johnson", "Prof. Robert Taylor", "Dr. Anna Garcia"], summary: "Investigation of innovative fermentation technologies for converting sugar beet processing residues into value-added products.", topics: ["Techno-Economics", "Biorefinery"], researchType: "techno-economics" },
    { id: 4, title: "Life Cycle Assessment of Xylose Production from Agricultural Residues", date: "1 Mar 2025", authors: ["Dr. Lars Müller", "Prof. Ingrid Svensson"], summary: "Comprehensive sustainability assessment comparing environmental impacts of different xylose production pathways.", topics: ["LCA", "Sustainability"], researchType: "sustainability" },
    { id: 5, title: "European Market Analysis for Bio-based Chemicals from Hemicellulose Streams", date: "28 Feb 2025", authors: ["Dr. Pierre Dubois", "Prof. Maria Rossi"], summary: "Market sizing and competitive landscape analysis for bio-based chemicals derived from hemicellulose feedstocks in Europe.", topics: ["Market Analysis", "Bio-chemicals"], researchType: "market" },
  ];

  const applicationPublications = [
    { id: 101, title: "PLA-based Biodegradable Packaging for Fresh Food: Performance & Shelf-life Study", date: "5 Mar 2025", authors: ["Dr. Anna Bauer", "Prof. Hiroshi Tanaka"], summary: "Comparative analysis of PLA packaging films across dairy, produce, and bakery applications.", topics: ["PLA Packaging", "Food Contact"], researchType: "experimental" },
    { id: 102, title: "Lactic Acid as a Natural Preservative in Beverage Formulations", date: "4 Mar 2025", authors: ["Dr. Carlos Mendes", "Prof. Sofia Oliveira"], summary: "Evaluating shelf-life extension and flavor impact of lactic acid in functional beverages.", topics: ["Food Acidulant", "Preservation"], researchType: "experimental" },
    { id: 103, title: "Market Outlook for Bio-based PLA in Medical Devices 2025-2030", date: "2 Mar 2025", authors: ["Dr. Rachel Kim", "Prof. James Walker"], summary: "Five-year market forecast for resorbable PLA implants and surgical sutures.", topics: ["Medical Devices", "Market Analysis"], researchType: "market" },
    { id: 104, title: "Lactic Acid Esters in Cosmetic Emulsions: A Sustainability Review", date: "1 Mar 2025", authors: ["Dr. Élise Laurent", "Prof. Marco Bianchi"], summary: "Review of bio-based lactic acid esters replacing petrochemical emollients in skincare.", topics: ["Cosmetics", "Skin Care"], researchType: "review" },
    { id: 105, title: "Agricultural Mulch Films from PLA: Field Trials Across Climate Zones", date: "26 Feb 2025", authors: ["Dr. Wei Zhang", "Prof. Olivia Brown"], summary: "Multi-region field trials assessing PLA mulch performance vs. polyethylene baselines.", topics: ["Agriculture", "Mulch Films"], researchType: "experimental" },
  ];

  const publications = researchView === 'application' ? applicationPublications : productionPublications;

  const filteredPublications = selectedResearchType === "all" 
    ? publications 
    : publications.filter(p => p.researchType === selectedResearchType);

  // Heat matrix data - categories with sub-items for drill-down
  const years = ['2020', '2021', '2022', '2023', '2024'];

  interface HeatCategory {
    name: string;
    total: number;
    values: number[];
    subItems: { name: string; total: number; values: number[] }[];
  }

  const feedstockHeatData: HeatCategory[] = [
    { name: 'Lignocellulosic Biomass', total: 52, values: [8, 9, 10, 12, 13], subItems: [
      { name: 'Corn Stover', total: 20, values: [3, 4, 4, 5, 4] },
      { name: 'Wheat Straw', total: 18, values: [3, 3, 3, 4, 5] },
      { name: 'Wood Chips', total: 14, values: [2, 2, 3, 3, 4] },
    ]},
    { name: 'Sugar Crops', total: 42, values: [7, 8, 8, 9, 10], subItems: [
      { name: 'Sugar Beet Pulp', total: 18, values: [3, 3, 4, 4, 4] },
      { name: 'Sugarcane Bagasse', total: 14, values: [2, 3, 3, 3, 3] },
      { name: 'Sweet Sorghum', total: 10, values: [2, 2, 1, 2, 3] },
    ]},
    { name: 'Starch Sources', total: 38, values: [6, 7, 8, 8, 9], subItems: [
      { name: 'Corn Starch', total: 16, values: [3, 3, 3, 4, 3] },
      { name: 'Potato Starch', total: 12, values: [2, 2, 3, 2, 3] },
      { name: 'Cassava Starch', total: 10, values: [1, 2, 2, 2, 3] },
    ]},
    { name: 'Food Waste', total: 33, values: [5, 6, 6, 8, 8], subItems: [
      { name: 'Bread Waste', total: 13, values: [2, 2, 3, 3, 3] },
      { name: 'Fruit Pomace', total: 11, values: [2, 2, 2, 3, 2] },
      { name: 'Coffee Grounds', total: 9, values: [1, 2, 1, 2, 3] },
    ]},
    { name: 'Algal Biomass', total: 24, values: [4, 4, 5, 5, 6], subItems: [
      { name: 'Microalgae', total: 11, values: [2, 2, 2, 3, 2] },
      { name: 'Macroalgae', total: 7, values: [1, 1, 2, 1, 2] },
      { name: 'Cyanobacteria', total: 6, values: [1, 1, 1, 1, 2] },
    ]},
    { name: 'Oilseed Crops', total: 19, values: [3, 3, 4, 4, 5], subItems: [
      { name: 'Rapeseed', total: 8, values: [1, 1, 2, 2, 2] },
      { name: 'Soybean', total: 6, values: [1, 1, 1, 1, 2] },
      { name: 'Camelina', total: 5, values: [1, 1, 1, 1, 1] },
    ]},
  ];

  const technologyHeatData: HeatCategory[] = [
    { name: 'Fermentation', total: 58, values: [9, 10, 12, 13, 14], subItems: [
      { name: 'Batch Fermentation', total: 24, values: [4, 4, 5, 5, 6] },
      { name: 'Continuous Fermentation', total: 20, values: [3, 3, 4, 5, 5] },
      { name: 'Fed-batch Systems', total: 14, values: [2, 3, 3, 3, 3] },
    ]},
    { name: 'Catalytic Conversion', total: 42, values: [7, 8, 8, 9, 10], subItems: [
      { name: 'Heterogeneous Catalysis', total: 18, values: [3, 3, 3, 4, 5] },
      { name: 'Homogeneous Catalysis', total: 14, values: [2, 3, 3, 3, 3] },
      { name: 'Biocatalysis', total: 10, values: [2, 2, 2, 2, 2] },
    ]},
    { name: 'Extraction & Separation', total: 36, values: [6, 7, 7, 8, 8], subItems: [
      { name: 'Membrane Separation', total: 15, values: [2, 3, 3, 3, 4] },
      { name: 'Solvent Extraction', total: 12, values: [2, 2, 2, 3, 3] },
      { name: 'Distillation', total: 9, values: [2, 2, 2, 2, 1] },
    ]},
    { name: 'Purification', total: 30, values: [5, 5, 6, 7, 7], subItems: [
      { name: 'Crystallisation', total: 12, values: [2, 2, 2, 3, 3] },
      { name: 'Chromatography', total: 10, values: [2, 2, 2, 2, 2] },
      { name: 'Ion Exchange', total: 8, values: [1, 1, 2, 2, 2] },
    ]},
    { name: 'Enzymatic Hydrolysis', total: 23, values: [4, 4, 5, 5, 5], subItems: [
      { name: 'Cellulase Systems', total: 10, values: [2, 2, 2, 2, 2] },
      { name: 'Hemicellulase', total: 8, values: [1, 1, 2, 2, 2] },
      { name: 'Enzyme Cocktails', total: 5, values: [1, 1, 1, 1, 1] },
    ]},
    { name: 'Thermochemical Conversion', total: 20, values: [3, 4, 4, 4, 5], subItems: [
      { name: 'Pyrolysis', total: 9, values: [1, 2, 2, 2, 2] },
      { name: 'Gasification', total: 7, values: [1, 1, 2, 1, 2] },
      { name: 'Hydrothermal Liquefaction', total: 4, values: [1, 1, 0, 1, 1] },
    ]},
  ];

  const applicationHeatData: HeatCategory[] = [
    { name: 'Bioplastics & Packaging', total: 48, values: [7, 8, 10, 11, 12], subItems: [
      { name: 'PLA Production', total: 21, values: [3, 4, 4, 5, 5] },
      { name: 'Bio-based Films', total: 15, values: [2, 2, 3, 4, 4] },
      { name: 'Biodegradable Packaging', total: 12, values: [2, 2, 3, 2, 3] },
    ]},
    { name: 'Pharmaceuticals', total: 39, values: [6, 7, 8, 9, 9], subItems: [
      { name: 'Drug Intermediates', total: 17, values: [3, 3, 3, 4, 4] },
      { name: 'Excipients', total: 12, values: [2, 2, 3, 3, 2] },
      { name: 'Active Ingredients', total: 10, values: [1, 2, 2, 2, 3] },
    ]},
    { name: 'Food & Beverage', total: 35, values: [6, 6, 7, 8, 8], subItems: [
      { name: 'Food Additives', total: 15, values: [2, 3, 3, 3, 4] },
      { name: 'Fermented Foods', total: 11, values: [2, 2, 2, 3, 2] },
      { name: 'Preservatives', total: 9, values: [2, 1, 2, 2, 2] },
    ]},
    { name: 'Cosmetics & Personal Care', total: 28, values: [4, 5, 5, 6, 8], subItems: [
      { name: 'Skin Care Actives', total: 12, values: [2, 2, 2, 3, 3] },
      { name: 'Hair Care', total: 9, values: [1, 2, 2, 2, 2] },
      { name: 'Natural Fragrances', total: 7, values: [1, 1, 1, 1, 3] },
    ]},
    { name: 'Construction Materials', total: 18, values: [3, 3, 3, 4, 5], subItems: [
      { name: 'Bio-based Adhesives', total: 8, values: [1, 1, 2, 2, 2] },
      { name: 'Insulation Materials', total: 6, values: [1, 1, 1, 1, 2] },
      { name: 'Composite Materials', total: 4, values: [1, 1, 0, 1, 1] },
    ]},
    { name: 'Agriculture & Feed', total: 14, values: [2, 2, 3, 3, 4], subItems: [
      { name: 'Biofertilizers', total: 6, values: [1, 1, 1, 1, 2] },
      { name: 'Animal Feed Additives', total: 5, values: [1, 1, 1, 1, 1] },
      { name: 'Biopesticides', total: 3, values: [0, 0, 1, 1, 1] },
    ]},
  ];

  const productHeatData: HeatCategory[] = [
    { name: 'Organic Acids', total: 54, values: [8, 10, 11, 12, 13], subItems: [
      { name: 'Lactic Acid', total: 23, values: [3, 4, 5, 5, 6] },
      { name: 'Succinic Acid', total: 18, values: [3, 3, 4, 4, 4] },
      { name: 'Levulinic Acid', total: 13, values: [2, 3, 2, 3, 3] },
    ]},
    { name: 'Sugar Alcohols', total: 41, values: [7, 8, 8, 9, 9], subItems: [
      { name: 'Xylitol', total: 17, values: [3, 3, 3, 4, 4] },
      { name: 'Sorbitol', total: 14, values: [2, 3, 3, 3, 3] },
      { name: 'Mannitol', total: 10, values: [2, 2, 2, 2, 2] },
    ]},
    { name: 'Platform Chemicals', total: 34, values: [5, 6, 7, 8, 8], subItems: [
      { name: 'Furfural', total: 14, values: [2, 3, 3, 3, 3] },
      { name: 'HMF', total: 11, values: [2, 2, 2, 3, 2] },
      { name: '5-ALA', total: 9, values: [1, 1, 2, 2, 3] },
    ]},
    { name: 'Biopolymers', total: 28, values: [4, 5, 5, 6, 8], subItems: [
      { name: 'PHA', total: 12, values: [2, 2, 2, 3, 3] },
      { name: 'Cellulose Nanocrystals', total: 9, values: [1, 2, 2, 2, 2] },
      { name: 'Chitosan', total: 7, values: [1, 1, 1, 1, 3] },
    ]},
    { name: 'Biofuels', total: 22, values: [3, 4, 4, 5, 6], subItems: [
      { name: 'Bioethanol', total: 10, values: [1, 2, 2, 2, 3] },
      { name: 'Biodiesel', total: 7, values: [1, 1, 1, 2, 2] },
      { name: 'Biogas', total: 5, values: [1, 1, 1, 1, 1] },
    ]},
    { name: 'Specialty Chemicals', total: 17, values: [3, 3, 3, 4, 4], subItems: [
      { name: 'Bio-based Solvents', total: 7, values: [1, 1, 2, 1, 2] },
      { name: 'Surfactants', total: 6, values: [1, 1, 1, 2, 1] },
      { name: 'Flavors & Fragrances', total: 4, values: [1, 1, 0, 1, 1] },
    ]},
  ];

  const allSections = isFeedstockRoute ? [
    { title: 'Process Distribution', subtitle: 'Process × Year · Color = publication count', columnLabel: 'PROCESS', data: technologyHeatData, description: 'Highlighting where innovation is most intense across conversion process categories.', view: 'production' as const },
    { title: 'Product Distribution', subtitle: 'Product × Year · Color = publication count', columnLabel: 'PRODUCT', data: productHeatData, description: 'Research distribution across different products derived from this feedstock.', view: 'production' as const },
    { title: 'Application Distribution', subtitle: 'Application × Year · Color = publication count', columnLabel: 'APPLICATION', data: applicationHeatData, description: 'Research focus across market application areas.', view: 'application' as const },
  ] : [
    { title: 'Feedstock Distribution', subtitle: 'Feedstock × Year · Color = publication count', columnLabel: 'FEEDSTOCK', data: feedstockHeatData, description: 'Research distribution across different feedstock types.', view: 'production' as const },
    { title: 'Process Distribution', subtitle: 'Process × Year · Color = publication count', columnLabel: 'PROCESS', data: technologyHeatData, description: 'Highlighting where innovation is most intense across conversion process categories.', view: 'production' as const },
    { title: 'Application Distribution', subtitle: 'Application × Year · Color = publication count', columnLabel: 'APPLICATION', data: applicationHeatData, description: 'Research focus across market application areas.', view: 'application' as const },
  ];

  const sections = allSections.filter(s => s.view === researchView);

  const col1 = institutions.slice(0, 4);
  const col2 = institutions.slice(4, 8);

  // Drill-down state per section
  const [expandedCategory, setExpandedCategory] = useState<Record<string, string | null>>({});
  const [selectedInstitution, setSelectedInstitution] = useState<typeof institutions[0] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; total: number; subs: { name: string; total: number }[] } | null>(null);
  const [selectedPublicationDetail, setSelectedPublicationDetail] = useState<typeof publications[0] | null>(null);

  // Top 3 trending topics by YoY citation growth (changes with researchView)
  const getTopTrendingTopics = () => {
    const productionData = isFeedstockRoute ? technologyHeatData : feedstockHeatData;
    const activeData = researchView === 'application' ? applicationHeatData : productionData;
    const withGrowth = activeData.map(cat => {
      const lastYear = cat.values[cat.values.length - 1];
      const prevYear = cat.values[cat.values.length - 2];
      const growth = prevYear > 0 ? ((lastYear - prevYear) / prevYear) * 100 : 0;
      return { topic: cat, growth };
    });
    return withGrowth.sort((a, b) => b.growth - a.growth).slice(0, 3);
  };

  const topTrending = getTopTrendingTopics();

  // Hotspot card colors per group (mirrors IP HOTSPOTS in Patent Landscape)
  const groupStyles: Record<string, { container: string; dot: string; border: string; accent: string }> = {
    Feedstock: {
      container: 'bg-[hsl(142,60%,40%,0.06)] border border-[hsl(142,60%,40%,0.15)]',
      dot: 'bg-[hsl(142,60%,40%)]',
      border: 'border-l-[hsl(142,60%,40%)]',
      accent: 'text-[hsl(142,60%,40%)]',
    },
    Process: {
      container: 'bg-[hsl(217,91%,60%,0.06)] border border-[hsl(217,91%,60%,0.15)]',
      dot: 'bg-[hsl(217,91%,60%)]',
      border: 'border-l-[hsl(217,91%,60%)]',
      accent: 'text-[hsl(217,91%,60%)]',
    },
    Product: {
      container: 'bg-[hsl(262,83%,58%,0.06)] border border-[hsl(262,83%,58%,0.15)]',
      dot: 'bg-[hsl(262,83%,58%)]',
      border: 'border-l-[hsl(262,83%,58%)]',
      accent: 'text-[hsl(262,83%,58%)]',
    },
    Application: {
      container: 'bg-[hsl(36,95%,54%,0.06)] border border-[hsl(36,95%,54%,0.15)]',
      dot: 'bg-[hsl(36,95%,54%)]',
      border: 'border-l-[hsl(36,95%,54%)]',
      accent: 'text-[hsl(36,95%,54%)]',
    },
  };

  const renderHotspotGroup = (groupLabel: string, data: HeatCategory[]) => {
    const style = groupStyles[groupLabel] ?? groupStyles.Feedstock;
    const grandTotal = data.reduce((sum, d) => sum + d.total, 0);
    const sorted = [...data].sort((a, b) => b.total - a.total);

    return (
      <div key={groupLabel} className={`rounded-xl p-3 ${style.container}`}>
        <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
          {groupLabel}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {sorted.map((cat) => {
            const share = grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0;
            const last = cat.values[cat.values.length - 1];
            const prev = cat.values[cat.values.length - 2];
            const yoy = prev > 0 ? ((last - prev) / prev) * 100 : 0;
            const yoyStr = `${yoy >= 0 ? '+' : ''}${yoy.toFixed(1)}%`;
            const topSubs = [...cat.subItems].sort((a, b) => b.total - a.total).slice(0, 3);
            return (
              <div
                key={cat.name}
                onClick={() => setSelectedCategory({ name: cat.name, total: cat.total, subs: cat.subItems.map((s) => ({ name: s.name, total: s.total })) })}
                className={`border-l-4 ${style.border} bg-background rounded-lg p-3 cursor-pointer hover:bg-muted/40 transition-colors shadow-sm`}
              >
                <div className="flex items-start justify-between mb-0.5">
                  <div>
                    <div className="font-bold text-[11px] text-foreground">{cat.name}</div>
                    <div className="text-[9px] text-muted-foreground">{cat.total.toLocaleString()} publications</div>
                  </div>
                  <span className={`text-sm font-bold ${style.accent}`}>{share.toFixed(1)}%</span>
                </div>
                <div className={`text-[9px] font-semibold ${style.accent} mb-2`}>{yoyStr} YoY</div>
                <div className="space-y-1">
                  {topSubs.map((s) => (
                    <div key={s.name} className="flex justify-between text-[9px]">
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="font-medium text-foreground">{s.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
        <Button variant="outline" size="sm" onClick={() => navigate(`/landscape/${category}/${topic}/value-chain`)} className="gap-1.5 h-7 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
        <div />
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-6 pb-6 flex-1 min-h-0 flex flex-col">
        <div className="mb-2 flex-shrink-0">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Research Landscape: <span className="text-primary">{decodedTopic}</span></h2>
        </div>

        <Card className="bg-card border border-border/60 shadow-sm flex-1 min-w-0 flex flex-col">
          <CardContent className="px-5 py-4 pb-2 flex flex-col h-full">
            <div className="flex items-center bg-muted rounded-lg p-0.5 mb-2 flex-shrink-0 self-start">
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
            <p className="text-xs text-muted-foreground mb-2 flex-shrink-0">
              {researchView === 'production'
                ? `Research related to the production, extraction, and purification of ${decodedTopic} from biomass feedstocks.`
                : `Research related to the downstream use of ${decodedTopic} in end-market applications such as food, pharma, and materials.`
              }
            </p>

            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="space-y-3">

                {/* Publication Trend */}
                <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                  <div className="mb-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Research Publication Trend</h3>
                    <p className="text-xs text-muted-foreground">Innovation intensity across key regions, highlighting technological hotspots and market leaders.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-[3]">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="h-6 inline-flex items-center rounded-lg border border-border/40 bg-background px-2.5">
                          <span className="text-[8px] text-muted-foreground uppercase tracking-wide">Total:&nbsp;</span>
                          <span className="text-[11px] font-bold text-foreground leading-none">{totalPublicationsCount}</span>
                        </div>
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
                          <LineChart data={publicationTrend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
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
                            <Line type="monotone" dataKey="publications" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 2.5 }} activeDot={{ r: 4, stroke: "hsl(var(--primary))", strokeWidth: 2, fill: "hsl(var(--background))" }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="flex-[2] space-y-2">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Trending Topics</div>
                      {topTrending.map((t, i) => (
                        <div
                          key={t.topic.name}
                          className="rounded-lg border border-border/40 bg-background p-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => setSelectedCategory({ name: t.topic.name, total: t.topic.total, subs: t.topic.subItems.map(s => ({ name: s.name, total: s.total })) })}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-bold text-foreground">{t.topic.name}</div>
                              <div className="text-[8px] text-muted-foreground mt-0.5">{t.topic.total.toLocaleString()} publications</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {t.topic.subItems.slice(0, 2).map(sub => (
                                  <Badge key={sub.name} variant="secondary" className="text-[7px] px-1 py-0">{sub.name}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-bold text-primary">+{t.growth.toFixed(1)}%</div>
                              <div className="text-[7px] text-muted-foreground">YoY growth</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>


                {/* Research Hotspots - styled like IP HOTSPOTS */}
                <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Research Hotspots</h3>
                    <p className="text-[9px] text-muted-foreground">Share of total publications</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {sections.map((s) => {
                      const groupLabel = s.columnLabel.charAt(0) + s.columnLabel.slice(1).toLowerCase();
                      return renderHotspotGroup(groupLabel, s.data);
                    })}
                  </div>
                </div>

                {/* Leading Research Institutions */}
                <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                  <div className="mb-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Leading Research Institutions</h3>
                    <p className="text-xs text-muted-foreground">Top academic and research organizations driving scientific output in {decodedTopic} research.</p>
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
                                      <div className="h-full bg-foreground/60 rounded-full" style={{ width: `${inst.papers / 18 * 100}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-medium">{inst.papers.toLocaleString()}</span>
                                  </div>
                                </td>
                                <td className="text-center py-[3px]">
                                  <div className="flex items-center justify-center gap-1">
                                    <div className="w-10 h-1 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-primary rounded-full" style={{ width: `${inst.citations / 342 * 100}%` }}></div>
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
        <CategoryPublicationsModal
          open={!!selectedCategory}
          onOpenChange={() => setSelectedCategory(null)}
          categoryName={selectedCategory?.name || ''}
          totalPublications={selectedCategory?.total || 0}
          subcategories={selectedCategory?.subs || []}
          topic={decodedTopic}
        />
        <PublicationDetailModal
          open={!!selectedPublicationDetail}
          onOpenChange={() => setSelectedPublicationDetail(null)}
          publication={selectedPublicationDetail}
        />
      </div>
    </div>
  );
};

export default ScientificPublications;