import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, Zap, Package, Target, Filter, ChevronDown, Download } from "lucide-react";
import { PortfolioFunnelChart } from "@/components/PortfolioFunnelChart";
import PathwayResourcesTab from "@/components/PathwayResourcesTab";
import PathwayOpinionsTab from "@/components/PathwayOpinionsTab";

interface CustomPathway {
  feedstock: string;
  technology: string;
  product: string;
  application: string;
  trl: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
  patents?: string;
  isCustom?: boolean;
}

const PREDEFINED_PATHWAYS: CustomPathway[] = [
  { feedstock: "Corn Starch", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "PLA Packaging", trl: "TRL 9", patents: "45 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Packaging" },
  { feedstock: "Sugarcane Molasses", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Food Acidulant", trl: "TRL 9", patents: "38 Patents", category1: "Industrial side-streams", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Whey Permeate", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Skin Care (AHA)", trl: "TRL 9", patents: "22 Patents", category1: "Industrial side-streams", category2: "Fermentation", category3: "Chemicals", category4: "Personal Care" },
  { feedstock: "Fructose", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "PLA Packaging", trl: "TRL 9", patents: "30 Patents", category1: "Intermediates/precursors", category2: "Fermentation", category3: "Chemicals", category4: "Packaging" },
  { feedstock: "Fructose", technology: "Acid-Catalysed Dehydration", product: "HMF", application: "Platform Chemical", trl: "TRL 7", patents: "52 Patents", category1: "Intermediates/precursors", category2: "Chemical Technology", category3: "Chemicals", category4: "Chemical Industry" },
  { feedstock: "Cassava Starch", technology: "Heterofermentation", product: "Lactic Acid", application: "PLA Fiber", trl: "TRL 8", patents: "12 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Textiles" },
  { feedstock: "Corn Stover", technology: "Simultaneous Saccharification & Fermentation", product: "Lactic Acid", application: "Green Solvents", trl: "TRL 7", patents: "18 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Chemical Industry" },
  { feedstock: "Fructose", technology: "Catalytic Hydrogenation", product: "Sorbitol", application: "Food Additive", trl: "TRL 8", patents: "15 Patents", category1: "Intermediates/precursors", category2: "Chemical Technology", category3: "Food Additives", category4: "Food & Beverage" },
  { feedstock: "Glucose Syrup", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Pharmaceutical Excipient", trl: "TRL 9", patents: "28 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Pharma & Healthcare" },
  { feedstock: "Fructose", technology: "Fermentation (Engineered Yeast)", product: "Ethanol", application: "Biofuel", trl: "TRL 8", patents: "20 Patents", category1: "Intermediates/precursors", category2: "Fermentation", category3: "Fuels & Energy", category4: "Transportation" },
  { feedstock: "Rice Bran", technology: "Solid-State Fermentation", product: "Lactic Acid", application: "Animal Feed Additive", trl: "TRL 6", patents: "8 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Agriculture" },
  { feedstock: "Fructose", technology: "Oxidation (Au/TiO₂ Catalyst)", product: "Gluconic Acid", application: "Concrete Admixture", trl: "TRL 5", patents: "11 Patents", category1: "Intermediates/precursors", category2: "Chemical Technology", category3: "Chemicals", category4: "Construction" },
  { feedstock: "Sugar Beet Pulp", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Dairy Starter Culture", trl: "TRL 9", patents: "30 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Fructose", technology: "Acid Dehydration + Hydrogenation", product: "Levulinic Acid", application: "Green Solvent Precursor", trl: "TRL 6", patents: "25 Patents", category1: "Intermediates/precursors", category2: "Chemical Technology", category3: "Chemicals", category4: "Chemical Industry" },
  { feedstock: "Corn Starch", technology: "Ring-Opening Polymerization", product: "PLA Polymer", application: "3D Printing Filament", trl: "TRL 8", patents: "32 Patents", category1: "Bio-based primary feedstocks", category2: "Polymerization", category3: "Materials", category4: "Advanced Manufacturing" },
  { feedstock: "Food Waste", technology: "Mixed-Culture Fermentation", product: "Lactic Acid", application: "Green Cleaning Products", trl: "TRL 5", patents: "5 Patents", category1: "Waste streams", category2: "Fermentation", category3: "Chemicals", category4: "Household" },
  { feedstock: "Fructose", technology: "Isomerisation + Fermentation", product: "Succinic Acid", application: "Biodegradable Polymer", trl: "TRL 5", patents: "14 Patents", category1: "Intermediates/precursors", category2: "Fermentation", category3: "Chemicals", category4: "Materials" },
  { feedstock: "Microalgae Biomass", technology: "Photofermentation", product: "Lactic Acid", application: "Cosmetic Peel", trl: "TRL 3", patents: "3 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Personal Care" },
  { feedstock: "Fructose", technology: "Electrochemical Oxidation", product: "2,5-FDCA", application: "PEF Bottle Monomer", trl: "TRL 4", patents: "18 Patents", category1: "Intermediates/precursors", category2: "Chemical Technology", category3: "Chemicals", category4: "Packaging" },
  { feedstock: "Corn Stover", technology: "Gas Fermentation (CO₂)", product: "Lactic Acid", application: "Carbon-Negative PLA", trl: "TRL 2", patents: "2 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Materials", category4: "Packaging" },
];

export default function ValueChainPathwaysFunnel() {
  const { category, topic } = useParams();
  const navigate = useNavigate();
  const decodedTopic = decodeURIComponent(topic || '');
  const decodedCategory = decodeURIComponent(category || '');
  
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<string[]>([]);
  const [openFilterSection, setOpenFilterSection] = useState<string | null>(null);

  const allPathways = PREDEFINED_PATHWAYS;

  const toggleTech = (tech: string) => {
    setSelectedTech(prev => 
      prev.includes(tech) 
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    );
  };

  const toggleProduct = (product: string) => {
    setSelectedProduct(prev => 
      prev.includes(product) 
        ? prev.filter(p => p !== product)
        : [...prev, product]
    );
  };

  const toggleApplication = (app: string) => {
    setSelectedApplication(prev => 
      prev.includes(app) 
        ? prev.filter(a => a !== app)
        : [...prev, app]
    );
  };

  const clearAllFilters = () => {
    setSelectedTech([]);
    setSelectedProduct([]);
    setSelectedApplication([]);
  };

  const getMatchingPathwaysCount = () => {
    if (selectedTech.length === 0 && selectedProduct.length === 0 && selectedApplication.length === 0) {
      return allPathways.length;
    }

    return allPathways.filter(pathway => {
      const techMatch = selectedTech.length === 0 || selectedTech.some(tech => 
        pathway.category2?.toLowerCase().includes(tech.toLowerCase())
      );
      const productMatch = selectedProduct.length === 0 || selectedProduct.some(prod => 
        pathway.category3?.toLowerCase().includes(prod.toLowerCase())
      );
      const appMatch = selectedApplication.length === 0 || selectedApplication.some(app => 
        pathway.category4?.toLowerCase().includes(app.toLowerCase()) ||
        pathway.application?.toLowerCase().includes(app.toLowerCase())
      );

      return techMatch && productMatch && appMatch;
    }).length;
  };

  const handleNext = () => {
    navigate(`/landscape/${category}/${topic}/value-chain/pathways`);
  };

  const handleExportAnalysis = () => {
    // Export analysis logic would go here
    console.log('Exporting analysis...');
  };

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/landscape/${category}/${topic}/value-chain`)}
          className="gap-1.5 h-7 text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
        <Button 
          onClick={handleNext}
          className="flex items-center gap-2 h-8 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-6 pb-6 flex-1 min-h-0 flex flex-col">
        <div className="mb-2 flex-shrink-0">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pathway Portfolio: <span className="text-primary">{decodedTopic}</span></h2>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto">
            <Card className="bg-card border border-border/60 shadow-sm">
              <CardContent className="px-5 py-4">
                <div className="space-y-2">
                  <h2 className="text-base font-bold text-foreground">
                    Valorisation Pathways for {decodedTopic}
                  </h2>
                  <PortfolioFunnelChart 
                    pathways={allPathways} 
                    selectedStage={selectedFunnelStage}
                    onStageSelect={setSelectedFunnelStage}
                  />
                </div>
              </CardContent>
            </Card>

            {selectedFunnelStage && (
              <Card className="bg-card border border-border/60 shadow-sm animate-in slide-in-from-top duration-300">
                <CardContent className="px-5 py-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {selectedFunnelStage} Stage Pathways
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Detailed breakdown of pathways at the {selectedFunnelStage.toLowerCase()} development stage
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2">
                    {allPathways
                      .filter(pathway => {
                        const trlNumber = parseInt(pathway.trl.replace('TRL ', ''));
                        if (selectedFunnelStage === 'Commercial') return trlNumber === 9;
                        if (selectedFunnelStage === 'Pilot') return trlNumber >= 7 && trlNumber <= 8;
                        if (selectedFunnelStage === 'Lab') return trlNumber >= 4 && trlNumber <= 6;
                        if (selectedFunnelStage === 'Research') return trlNumber >= 1 && trlNumber <= 3;
                        return false;
                      })
                      .map((pathway, idx) => (
                        <Card key={idx} className="p-4 hover:shadow-md transition-shadow bg-muted/30 border border-border/60">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary">
                                    {parseInt(pathway.trl.replace('TRL ', '')) >= 8 ? 'Commercial' : parseInt(pathway.trl.replace('TRL ', '')) >= 6 ? 'Pilot' : parseInt(pathway.trl.replace('TRL ', '')) >= 4 ? 'Lab' : 'Research'}
                                  </span>
                                  {pathway.patents && (
                                    <span className="text-xs font-medium text-muted-foreground">{pathway.patents}</span>
                                  )}
                                </div>
                                <h4 className="font-semibold text-sm text-foreground mb-1">
                                  {pathway.feedstock} → {pathway.product}
                                </h4>
                                <p className="text-xs text-muted-foreground mb-1">
                                  <span className="font-medium">Technology:</span> {pathway.technology}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Application:</span> {pathway.application}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {[pathway.category1, pathway.category2, pathway.category3, pathway.category4].map((cat, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{cat}</span>
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="bg-card border border-border/60 shadow-sm p-4 w-72 flex-shrink-0 flex flex-col overflow-hidden">
            <Tabs defaultValue="resources" className="flex flex-col h-full">
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="opinions">Collab</TabsTrigger>
              </TabsList>
              <TabsContent value="resources" className="flex-1 overflow-y-auto mt-0">
                <PathwayResourcesTab productName={decodedTopic} />
              </TabsContent>
              <TabsContent value="opinions" className="flex-1 overflow-hidden mt-0">
                <PathwayOpinionsTab pathwayId={`${category}-${topic}`} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}

