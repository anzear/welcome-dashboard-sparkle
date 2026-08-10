import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Sprout, TestTube, Box, TrendingUp, FileText, Scale, Download, Calendar, User, Tag, RefreshCw, Zap, BookOpen } from "lucide-react";
import PathwayChat from '@/components/PathwayChat';
import { ValueChainFeedstockDetail } from '@/components/ValueChainFeedstockDetail';
import { ValueChainTechnologyDetail } from '@/components/ValueChainTechnologyDetail';
import { ValueChainProductDetail } from '@/components/ValueChainProductDetail';
import { ValueChainMarketDetail } from '@/components/ValueChainMarketDetail';

const ValueChainOverview = () => {
  const { category, topic } = useParams<{category: string;topic: string;}>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(4);
  const [resourceTab, setResourceTab] = useState('resources');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const itemsPerPage = 4;

  // Active detail view state
  const [activeDetailType, setActiveDetailType] = useState<'feedstock' | 'technology' | 'products' | 'market' | null>(null);

  const handleCardClick = (type: 'feedstock' | 'technology' | 'products' | 'market') => {
    setActiveDetailType(activeDetailType === type ? null : type);
    setCurrentPage(1);
    setExpandedCategories(new Set());

    // Scroll to detail section after state update
    setTimeout(() => {
      const detailElement = document.getElementById('detail-section');
      if (detailElement) {
        detailElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStep < 4) {
          handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 1) {
          setCurrentStep(currentStep - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  const handleViewMore = () => {
    setIsTransitioning(true);

    // Wait for animation, then navigate
    setTimeout(() => {
      navigate(`/landscape/${category}/${topic}/value-chain/pathways`);
    }, 400);
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const pathwaySteps = [
  {
    id: 'feedstock',
    title: 'Feedstock',
    count: '12',
    icon: Sprout,
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    iconBgColor: 'bg-green-100',
    keyPoint: 'Top 3 commercially proven',
    details: 'Multiple opportunities exist with top three sources proven in commercial applications.',
    status: 'complete' as const
  },
  {
    id: 'technology',
    title: 'Process',
    count: '8',
    icon: TestTube,
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    iconBgColor: 'bg-blue-100',
    keyPoint: '71% of technologies in TRL 7-9',
    details: 'Five technologies ready for deployment. Others in development show strong future potential.',
    status: 'info' as const
  },
  {
    id: 'products',
    title: 'Products',
    count: '1',
    icon: Box,
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    iconBgColor: 'bg-purple-100',
    keyPoint: topic || 'Selected product',
    details: 'Your selected product with VCG support for valorisation potential assessment.',
    status: 'complete' as const
  },
  {
    id: 'application',
    title: 'Application',
    count: '12',
    icon: TrendingUp,
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    iconBgColor: 'bg-orange-100',
    keyPoint: '5 Billion EUR market potential',
    details: 'Strong market potential across 25 markets with 4 high-growth segments.',
    status: 'complete' as const
  }];


  // Data from modal
  const feedstockData = [
  { name: 'Corn Cobs', category: 'By-Product', status: 'Commercial', price: '€45-60/ton', quantity: '12.5 million tons/year' },
  { name: 'Wheat Straw', category: 'Residue', status: 'Commercial', price: '€30-45/ton', quantity: '38.2 million tons/year' },
  { name: 'Rice Straw', category: 'Residue', status: 'Pilot', price: '€25-35/ton', quantity: '2.8 million tons/year' },
  { name: 'Bagasse', category: 'By-Product', status: 'Commercial', price: '€20-30/ton', quantity: '8.4 million tons/year' },
  { name: 'Hardwood Chips', category: 'Wood Biomass', status: 'Commercial', price: '€65-85/ton', quantity: '156 million tons/year' },
  { name: 'Birch Wood', category: 'Wood Biomass', status: 'Lab', price: '€70-90/ton', quantity: '18.3 million tons/year' },
  { name: 'Cotton Stalks', category: 'Residue', status: 'Pilot', price: '€35-50/ton', quantity: '1.2 million tons/year' },
  { name: 'Oat Hulls', category: 'By-Product', status: 'Lab', price: '€40-55/ton', quantity: '3.6 million tons/year' },
  { name: 'Paper Mill Sludge', category: 'Industrial Waste', status: 'Research', price: '€15-25/ton', quantity: '4.8 million tons/year' },
  { name: 'Municipal Solid Waste', category: 'Waste', status: 'Research', price: '€10-20/ton', quantity: '225 million tons/year' },
  { name: 'Algae Biomass', category: 'Marine Biomass', status: 'Lab', price: '€150-250/ton', quantity: '0.8 million tons/year' },
  { name: 'Used Cooking Oil', category: 'Waste', status: 'Pilot', price: '€400-600/ton', quantity: '12 million tons/year' }];


  const technologyData = [
  {
    category: 'Biochemical',
    technologies: [
    { name: 'Alcoholic Fermentation', status: 'Commercial', trl: 'TRL 8-9', description: 'Converting sugars to ethanol using microorganisms' },
    { name: 'Lactic Acid Fermentation', status: 'Commercial', trl: 'TRL 8-9', description: 'Microbial conversion of sugars to lactic acid' },
    { name: 'Dark Fermentation', status: 'Pilot', trl: 'TRL 6-7', description: 'Hydrogen production through anaerobic fermentation' },
    { name: 'Enzymatic Hydrolysis', status: 'Pilot', trl: 'TRL 7-8', description: 'Breaking down complex sugars using enzymes' },
    { name: 'Anaerobic Digestion', status: 'Pilot', trl: 'TRL 6-7', description: 'Biogas production from organic matter' },
    { name: 'Microbial Conversion', status: 'Lab', trl: 'TRL 4-5', description: 'Using microbes to transform biomass compounds' },
    { name: 'Bio-oxidation', status: 'Lab', trl: 'TRL 4-5', description: 'Microbial oxidation of organic compounds' },
    { name: 'Photobiological', status: 'Research', trl: 'TRL 2-3', description: 'Light-driven biological conversion processes' }]

  },
  {
    category: 'Chemical',
    technologies: [
    { name: 'Acid Hydrolysis', status: 'Commercial', trl: 'TRL 8-9', description: 'Breaking down polymers using acids' },
    { name: 'Chemical Oxidation', status: 'Pilot', trl: 'TRL 6-7', description: 'Oxidative degradation of organic matter' },
    { name: 'Catalytic Conversion', status: 'Pilot', trl: 'TRL 6-7', description: 'Catalyst-based chemical transformation' },
    { name: 'Chemical Synthesis', status: 'Lab', trl: 'TRL 4-5', description: 'Direct chemical production of target compounds' },
    { name: 'Electrolysis', status: 'Research', trl: 'TRL 3-4', description: 'Electrochemical splitting of molecules' }]

  },
  {
    category: 'Physiochemical',
    technologies: [
    { name: 'Steam Explosion', status: 'Commercial', trl: 'TRL 8-9', description: 'High-pressure steam treatment and rapid decompression' },
    { name: 'Liquid Hot Water', status: 'Commercial', trl: 'TRL 8-9', description: 'Hot water treatment under pressure' },
    { name: 'Ammonia Fiber Expansion', status: 'Pilot', trl: 'TRL 6-7', description: 'Ammonia-based biomass swelling and breakdown' },
    { name: 'Wet Oxidation', status: 'Pilot', trl: 'TRL 6-7', description: 'Oxidation in aqueous medium at high temperature' },
    { name: 'Ionic Liquid Pretreatment', status: 'Lab', trl: 'TRL 4-5', description: 'Dissolution using ionic liquids' },
    { name: 'Deep Eutectic Solvents', status: 'Lab', trl: 'TRL 3-4', description: 'Green solvent-based extraction' }]

  },
  {
    category: 'Mechanical',
    technologies: [
    { name: 'Milling', status: 'Commercial', trl: 'TRL 9', description: 'Mechanical size reduction and grinding' },
    { name: 'Extrusion', status: 'Pilot', trl: 'TRL 6-7', description: 'High shear and temperature processing' },
    { name: 'High Pressure Homogenization', status: 'Lab', trl: 'TRL 4-5', description: 'Cell disruption through high pressure' },
    { name: 'Ultrasonic Treatment', status: 'Research', trl: 'TRL 3-4', description: 'Sound wave-based cell wall disruption' }]

  },
  {
    category: 'Thermomechanical',
    technologies: [
    { name: 'Refining', status: 'Pilot', trl: 'TRL 6-7', description: 'Combined thermal and mechanical processing' },
    { name: 'Steam Refining', status: 'Lab', trl: 'TRL 4-5', description: 'Steam-assisted mechanical treatment' },
    { name: 'Thermomechanical Pulping', status: 'Research', trl: 'TRL 3-4', description: 'Heat and pressure fiber separation' }]

  },
  {
    category: 'Thermochemical',
    technologies: [
    { name: 'Pyrolysis', status: 'Commercial', trl: 'TRL 8-9', description: 'Thermal decomposition without oxygen' },
    { name: 'Gasification', status: 'Commercial', trl: 'TRL 8-9', description: 'High-temperature conversion to syngas' },
    { name: 'Torrefaction', status: 'Pilot', trl: 'TRL 6-7', description: 'Mild thermal treatment for upgrading' },
    { name: 'Hydrothermal Carbonization', status: 'Pilot', trl: 'TRL 6-7', description: 'Wet thermal conversion to biochar' },
    { name: 'Hydrothermal Liquefaction', status: 'Pilot', trl: 'TRL 6-7', description: 'Conversion to bio-oil in hot water' },
    { name: 'Catalytic Pyrolysis', status: 'Lab', trl: 'TRL 4-5', description: 'Catalyst-enhanced thermal decomposition' },
    { name: 'Microwave Pyrolysis', status: 'Research', trl: 'TRL 3-4', description: 'Microwave-assisted thermal breakdown' }]

  },
  {
    category: 'Physical',
    technologies: [
    { name: 'Solvent Extraction', status: 'Commercial', trl: 'TRL 8-9', description: 'Separation using organic solvents' },
    { name: 'Supercritical Fluid Extraction', status: 'Pilot', trl: 'TRL 6-7', description: 'Extraction using supercritical CO2' },
    { name: 'Membrane Separation', status: 'Pilot', trl: 'TRL 6-7', description: 'Selective separation through membranes' },
    { name: 'Adsorption', status: 'Lab', trl: 'TRL 4-5', description: 'Surface-based compound capture' },
    { name: 'Crystallization', status: 'Lab', trl: 'TRL 4-5', description: 'Purification through crystal formation' }]

  },
  {
    category: 'Hybrid',
    technologies: [
    { name: 'Steam Explosion + Enzymatic', status: 'Commercial', trl: 'TRL 8-9', description: 'Combined physical and biological treatment' },
    { name: 'Chemical + Enzymatic', status: 'Pilot', trl: 'TRL 6-7', description: 'Sequential chemical and enzymatic processing' },
    { name: 'Ultrasound + Chemical', status: 'Lab', trl: 'TRL 4-5', description: 'Sonication-assisted chemical conversion' },
    { name: 'Microwave + Chemical', status: 'Research', trl: 'TRL 3-4', description: 'Microwave-enhanced chemical reactions' }]

  }];


  const marketData = [
  {
    application: 'Agricultural Applications',
    subcategories: [
    { name: 'Crop Production', price: '€2.50/kg' },
    { name: 'Pest Management', price: '€3.20/kg' },
    { name: 'Soil Health Management', price: '€1.80/kg' }]

  },
  {
    application: 'Pharmaceuticals',
    subcategories: [
    { name: 'Drug Development', price: '€45.00/kg' },
    { name: 'Therapeutic Compounds', price: '€38.50/kg' },
    { name: 'Medical Devices', price: '€52.00/kg' }]

  },
  {
    application: 'Nutraceuticals',
    subcategories: [
    { name: 'Dietary Supplements', price: '€12.50/kg' },
    { name: 'Functional Foods', price: '€8.70/kg' },
    { name: 'Sports Nutrition', price: '€15.20/kg' }]

  },
  {
    application: 'Cosmetics',
    subcategories: [
    { name: 'Skin Care', price: '€22.00/kg' },
    { name: 'Anti-aging Products', price: '€35.50/kg' },
    { name: 'Natural Cosmetics', price: '€18.80/kg' }]

  },
  {
    application: 'Food & Beverage',
    subcategories: [
    { name: 'Food Additives', price: '€6.50/kg' },
    { name: 'Beverages', price: '€4.20/kg' },
    { name: 'Preservatives', price: '€8.90/kg' }]

  }];


  const visibleSteps = pathwaySteps.slice(0, currentStep);

  return (
    <div className={`h-full bg-background overflow-hidden transition-all duration-400 ${isTransitioning ? 'animate-fade-out opacity-50' : ''}`}>
      <div className="h-full pt-4 px-4 pb-4 max-w-[1600px] mx-auto flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="sm" onClick={handleBackToDashboard} className="gap-1.5 h-7 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
        <div className="flex gap-2">
          <button
              onClick={handleViewMore}
              disabled={currentStep < 4}
              style={currentStep >= 4 ? { backgroundColor: '#000000', color: '#ffffff' } : {}}
              className={`h-9 px-4 rounded-md flex items-center transition-colors ${
              currentStep < 4 ?
              'bg-gray-300 text-gray-500 cursor-not-allowed' :
              'hover:bg-gray-800'}`
              }>

            <span className="text-sm font-medium">View More</span>
            <ArrowRight className="ml-2 w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="max-w-[1400px] mx-auto flex-1 min-h-0">
        <div className="flex gap-4 mb-4 h-full">
          {/* Left Panel - Pathways */}
          <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <User className="w-3.5 h-3.5" />
              <span>Created by: <span className="font-medium text-gray-700">VCG Analysis Team</span></span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date Created: <span className="font-medium text-gray-700">2025-09-30</span></span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Last Updated: <span className="font-medium text-gray-700">2025-10-15</span></span>
            </div>
          </div>

          <div className="mb-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {topic} Valorisation Potential
            </h1>
          </div>
          
          













          
          
          <div className="relative border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="mb-[14px]">
              <p className="text-sm text-gray-600">
                VCG has identified the creation of <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">{topic}</span> from sustainable inputs is <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">possible</span>. Explore the feedstock, technology, and market
              </p>
              <p className="text-sm text-gray-600">
                applications to understand the complete valorisation potential.
              </p>
            </div>
            <div className="flex gap-3 h-[328px]">
              {visibleSteps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isLatest = index === currentStep - 1 && currentStep < 4;
                      const isPrevious = index < currentStep - 1;
                      const allCardsShown = currentStep === 4;

                      return (
                        <button
                          key={step.id}
                          className={`
                      border-2 rounded-xl flex flex-col text-left
                      ${allCardsShown ? 'shadow-sm hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all duration-300' : 'cursor-default shadow-[0_2px_8px_rgba(0,0,0,0.05)]'}
                      ${allCardsShown ? `w-1/4 h-full p-4 ${step.bgColor} border-gray-200/60` : isLatest ? `flex-[1.5] h-full p-6 ${step.bgColor} border-gray-200/60` : `flex-1 h-full p-4 opacity-95 ${step.bgColor} border-gray-200/50`}
                      ${isPrevious && !allCardsShown ? 'max-w-[320px]' : ''}
                      ${allCardsShown ? 'active:translate-y-0 active:shadow-sm' : ''}
                    `}
                          onClick={() => {
                            if (allCardsShown) {
                              handleCardClick(step.id === 'application' ? 'market' : step.id as 'feedstock' | 'technology' | 'products' | 'market');
                            }
                          }}
                          disabled={!allCardsShown}>

                    <div className="flex items-start justify-between mb-4">
                      <div className={`${isLatest && !allCardsShown ? 'w-14 h-14' : 'w-10 h-10'} ${step.iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <StepIcon className={`${isLatest && !allCardsShown ? 'w-7 h-7' : 'w-5 h-5'} ${step.textColor}`} />
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className={`${isLatest && !allCardsShown ? 'text-2xl' : 'text-base'} font-bold ${step.textColor} mb-3`}>
                          {step.title} ({step.count})
                        </h3>
                        
                        <div className={`mb-4 ${allCardsShown ? 'min-h-[56px]' : 'min-h-[48px]'} border-l-4 ${step.textColor.replace('text-', 'border-')} pl-3 flex items-start`}>
                          <p className={`text-sm font-semibold ${step.textColor} leading-relaxed`}>
                            {step.keyPoint}
                          </p>
                        </div>
                        
                        <p className={`${isLatest && !allCardsShown ? 'text-sm' : 'text-xs'} text-gray-600 leading-relaxed mb-4 ${allCardsShown ? 'min-h-[84px]' : ''}`}>
                          {step.details}
                        </p>
                      </div>
                    
                      {allCardsShown &&
                            <div className="mt-auto pt-3 border-t border-gray-300/50">
                          <p className="text-xs text-gray-500 font-medium flex items-center gap-1 group-hover:text-gray-700 transition-colors">
                            Details shown below
                            <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                          </p>
                        </div>
                            }
                    </div>
                    
                    {isLatest && !allCardsShown &&
                          <div className="border-t border-gray-200 pt-4 mt-6 flex justify-between items-center">
                        <span className="text-gray-400 text-sm font-normal">{currentStep}/4</span>
                        {currentStep < 4 &&
                            <Button
                              onClick={handleNext}
                              className="bg-green-600 hover:bg-green-700 text-white h-10 px-6 transition-all">

                            <span className="text-sm font-medium">Next</span>
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                            }
                      </div>
                          }
                    
                    {allCardsShown && index === visibleSteps.length - 1 &&
                          <div className="mt-4">
                        {/* Counter hidden when all cards are shown */}
                      </div>
                          }
                  </button>);

                    })}
            </div>
          </div>
          
          {/* Detailed content section - shows below cards when clicked */}
          {activeDetailType && currentStep === 4 &&
                <div id="detail-section" className="mt-6 animate-fade-in">
              <div className={`border border-gray-200 rounded-lg bg-gray-50 p-6 border-l-4 ${
                  activeDetailType === 'feedstock' ? 'border-l-green-600' :
                  activeDetailType === 'technology' ? 'border-l-blue-600' :
                  activeDetailType === 'products' ? 'border-l-purple-600' :
                  'border-l-orange-600'}`
                  }>
                <div className="mb-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activeDetailType === 'feedstock' ? 'bg-green-100' :
                      activeDetailType === 'technology' ? 'bg-blue-100' :
                      activeDetailType === 'products' ? 'bg-purple-100' :
                      'bg-orange-100'}`
                      }>
                    {activeDetailType === 'feedstock' && <Sprout className="w-5 h-5 text-green-700" />}
                    {activeDetailType === 'technology' && <Zap className="w-5 h-5 text-blue-700" />}
                    {activeDetailType === 'products' && <Box className="w-5 h-5 text-purple-700" />}
                    {activeDetailType === 'market' && <TrendingUp className="w-5 h-5 text-orange-700" />}
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold capitalize ${
                        activeDetailType === 'feedstock' ? 'text-green-700' :
                        activeDetailType === 'technology' ? 'text-blue-700' :
                        activeDetailType === 'products' ? 'text-purple-700' :
                        'text-orange-700'}`
                        }>
                      {activeDetailType === 'market' ? 'Application' : activeDetailType} Details
                    </h2>
                    <p className="text-sm text-gray-600">
                      {activeDetailType === 'feedstock' ?
                          category === 'Feedstock' ? `Key information on ${topic} as a Feedstock.` : 'Feedstocks that can be used for Xylose production.' :
                          activeDetailType === 'technology' ?
                          category === 'Feedstock' ? `Technologies that can be used for ${topic} valorisation.` : 'Technologies that can be used for Xylose production.' :
                          activeDetailType === 'products' ?
                          category === 'Feedstock' ? `Products that can be created from ${topic}.` : 'Key information on Xylose as a product.' :
                          category === 'Feedstock' ? `Markets where products created from ${topic} can be applied.` : 'Markets where Xylose can be applied.'
                          }
                    </p>
                  </div>
                </div>
                  {activeDetailType === 'feedstock' &&
                    <ValueChainFeedstockDetail
                      feedstockData={feedstockData}
                      currentPage={currentPage}
                      itemsPerPage={itemsPerPage}
                      totalPages={Math.ceil(feedstockData.length / itemsPerPage)}
                      onPreviousPage={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      onNextPage={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(feedstockData.length / itemsPerPage)))}
                      category={category}
                      topic={topic} />

                    }
                  {activeDetailType === 'technology' &&
                    <ValueChainTechnologyDetail
                      technologyData={technologyData}
                      expandedCategories={expandedCategories}
                      onToggleCategory={toggleCategory} />

                    }
                  {activeDetailType === 'products' &&
                    <ValueChainProductDetail topic={topic} category={category} />
                    }
                  {activeDetailType === 'market' &&
                    <ValueChainMarketDetail
                      marketData={marketData}
                      expandedCategories={expandedCategories}
                      onToggleCategory={toggleCategory}
                      topic={topic}
                      category={category} />

                    }
              </div>
            </div>
                }
            </div>
          </div>
          
          {/* Right Panel - Resources & Analytics */}
          <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded-lg shadow-md p-4">
            <Tabs value={resourceTab} onValueChange={setResourceTab} className="flex flex-col h-full">
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger
                    value="opinions"
                    className="bg-green-50 text-green-700 data-[state=active]:bg-green-100 data-[state=active]:text-green-800">

                  Collab
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="resources" className="flex flex-col flex-1 mt-0 space-y-3">
                <div className="space-y-2">
                  <div className="mb-4">
                    <div className="mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        Resources & Analytics for {topic}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600">
                      Click on any of the items below to see relevant resources and market analytics for this product.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {/* Patents */}
                    <div
                        className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-all duration-200 h-[60px]"
                        onClick={() => navigate(`/landscape/patent`)}>

                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors flex-shrink-0">
                          <FileText className="w-4 h-4 text-gray-700" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">Patents</span>
                          <span className="text-[10px] text-gray-600 leading-tight">IP Landscape</span>
                        </div>
                      </div>
                    </div>

                    {/* Publications */}
                    <div
                        className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-all duration-200 h-[60px]"
                        onClick={() => navigate(`/landscape/publications`)}>

                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-gray-700" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">Publications</span>
                          <span className="text-[10px] text-gray-600 leading-tight">Research and Scientific Literature</span>
                        </div>
                      </div>
                    </div>

                    {/* Market Activity */}
                    <div className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg cursor-not-allowed opacity-50 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">Market Activity</span>
                      </div>
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Soon</span>
                    </div>

                    {/* Regulations */}
                    <div className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg cursor-not-allowed opacity-50 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Scale className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">Regulations</span>
                      </div>
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Soon</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-gray-200 mt-auto">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-bold text-gray-900">260+</span> records | <span className="font-bold text-gray-900">Global</span> coverage | Updated September 30, 2025
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="opinions" className="flex flex-col flex-1 mt-0 overflow-hidden">
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Collab & Insights for {topic}
                  </h3>
                  <p className="text-xs text-gray-600">
                    Share insights from your analysis and research findings with your team.
                  </p>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <PathwayChat pathwayId={`value-chain-${category}-${topic}`} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      </div>
    </div>);

};

export default ValueChainOverview;