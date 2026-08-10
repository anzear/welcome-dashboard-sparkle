import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sprout, TestTube, Box, TrendingUp, CheckCircle2, AlertCircle, XCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, MapPin, Globe, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import feedstockRegionsChart from '@/assets/feedstock-regions-chart.png';
import trlDistributionChart from '@/assets/trl-distribution-chart.png';
import trlChartLeft from '@/assets/trl-chart-left.png';
import marketApplicationsChart from '@/assets/market-applications-chart.png';
import xyloseMolecule from '@/assets/xylose-molecule.png';

interface ValueChainDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'feedstock' | 'technology' | 'products' | 'market' | null;
}

const ValueChainDetailModal = ({ isOpen, onClose, type }: ValueChainDetailModalProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set()); // Start with no categories expanded
  
  if (!type) return null;

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // TRL distribution data for bar chart
  const trlDistribution = [
    { range: 'TRL 2-3', count: 3, color: '#e5e7eb' },
    { range: 'TRL 3-4', count: 5, color: '#d1d5db' },
    { range: 'TRL 4-5', count: 8, color: '#9ca3af' },
    { range: 'TRL 6-7', count: 14, color: '#60a5fa' },
    { range: 'TRL 7-8', count: 2, color: '#3b82f6' },
    { range: 'TRL 8-9', count: 10, color: '#1e40af' },
  ];

  const feedstockData = [
    { name: 'Corn Cobs', status: 'Commercial', price: '€45-60/ton', quantity: '12.5 million tons/year' },
    { name: 'Wheat Straw', status: 'Commercial', price: '€30-45/ton', quantity: '38.2 million tons/year' },
    { name: 'Rice Straw', status: 'Pilot', price: '€25-35/ton', quantity: '2.8 million tons/year' },
    { name: 'Bagasse', status: 'Commercial', price: '€20-30/ton', quantity: '8.4 million tons/year' },
    { name: 'Hardwood Chips', status: 'Commercial', price: '€65-85/ton', quantity: '156 million tons/year' },
    { name: 'Birch Wood', status: 'Lab', price: '€70-90/ton', quantity: '18.3 million tons/year' },
    { name: 'Cotton Stalks', status: 'Pilot', price: '€35-50/ton', quantity: '1.2 million tons/year' },
    { name: 'Oat Hulls', status: 'Lab', price: '€40-55/ton', quantity: '3.6 million tons/year' },
    { name: 'Paper Mill Sludge', status: 'Research', price: '€15-25/ton', quantity: '4.8 million tons/year' },
    { name: 'Municipal Solid Waste', status: 'Research', price: '€10-20/ton', quantity: '225 million tons/year' },
    { name: 'Algae Biomass', status: 'Lab', price: '€150-250/ton', quantity: '0.8 million tons/year' },
    { name: 'Used Cooking Oil', status: 'Pilot', price: '€400-600/ton', quantity: '12 million tons/year' },
  ];

  const getStatusDisplay = (status: string, context?: 'feedstock' | 'technology') => {
    switch (status) {
      case 'Commercial':
        if (context === 'technology') {
          return { text: 'Commercial Use', icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />, bgClass: 'bg-blue-100', textClass: 'text-blue-800', borderClass: 'border-blue-300' };
        }
        return { text: 'Commercial Use', icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />, bgClass: 'bg-green-100', textClass: 'text-green-800', borderClass: 'border-green-300' };
      case 'Pilot':
        return { text: 'Pilot Scale', icon: <AlertCircle className="w-3.5 h-3.5 text-gray-600" />, bgClass: 'bg-gray-100', textClass: 'text-gray-700', borderClass: 'border-gray-300' };
      case 'Lab':
        return { text: 'Lab Research', icon: <TestTube className="w-3.5 h-3.5 text-gray-500" />, bgClass: 'bg-gray-50', textClass: 'text-gray-600', borderClass: 'border-gray-200' };
      case 'Research':
        return { text: 'Early Research', icon: <Sprout className="w-3.5 h-3.5 text-gray-400" />, bgClass: 'bg-white', textClass: 'text-gray-500', borderClass: 'border-gray-200' };
      default:
        return { text: status, icon: null, bgClass: 'bg-gray-100', textClass: 'text-gray-700', borderClass: 'border-gray-300' };
    }
  };

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
        { name: 'Photobiological', status: 'Research', trl: 'TRL 2-3', description: 'Light-driven biological conversion processes' },
      ]
    },
    { 
      category: 'Chemical',
      technologies: [
        { name: 'Acid Hydrolysis', status: 'Commercial', trl: 'TRL 8-9', description: 'Breaking down polymers using acids' },
        { name: 'Chemical Oxidation', status: 'Pilot', trl: 'TRL 6-7', description: 'Oxidative degradation of organic matter' },
        { name: 'Catalytic Conversion', status: 'Pilot', trl: 'TRL 6-7', description: 'Catalyst-based chemical transformation' },
        { name: 'Chemical Synthesis', status: 'Lab', trl: 'TRL 4-5', description: 'Direct chemical production of target compounds' },
        { name: 'Electrolysis', status: 'Research', trl: 'TRL 3-4', description: 'Electrochemical splitting of molecules' },
      ]
    },
    { 
      category: 'Physiochemical',
      technologies: [
        { name: 'Steam Explosion', status: 'Commercial', trl: 'TRL 8-9', description: 'High-pressure steam treatment and rapid decompression' },
        { name: 'Liquid Hot Water', status: 'Commercial', trl: 'TRL 8-9', description: 'Hot water treatment under pressure' },
        { name: 'Ammonia Fiber Expansion', status: 'Pilot', trl: 'TRL 6-7', description: 'Ammonia-based biomass swelling and breakdown' },
        { name: 'Wet Oxidation', status: 'Pilot', trl: 'TRL 6-7', description: 'Oxidation in aqueous medium at high temperature' },
        { name: 'Ionic Liquid Pretreatment', status: 'Lab', trl: 'TRL 4-5', description: 'Dissolution using ionic liquids' },
        { name: 'Deep Eutectic Solvents', status: 'Lab', trl: 'TRL 3-4', description: 'Green solvent-based extraction' },
      ]
    },
    { 
      category: 'Mechanical',
      technologies: [
        { name: 'Milling', status: 'Commercial', trl: 'TRL 9', description: 'Mechanical size reduction and grinding' },
        { name: 'Extrusion', status: 'Pilot', trl: 'TRL 6-7', description: 'High shear and temperature processing' },
        { name: 'High Pressure Homogenization', status: 'Lab', trl: 'TRL 4-5', description: 'Cell disruption through high pressure' },
        { name: 'Ultrasonic Treatment', status: 'Research', trl: 'TRL 3-4', description: 'Sound wave-based cell wall disruption' },
      ]
    },
    { 
      category: 'Thermomechanical',
      technologies: [
        { name: 'Refining', status: 'Pilot', trl: 'TRL 6-7', description: 'Combined thermal and mechanical processing' },
        { name: 'Steam Refining', status: 'Lab', trl: 'TRL 4-5', description: 'Steam-assisted mechanical treatment' },
        { name: 'Thermomechanical Pulping', status: 'Research', trl: 'TRL 3-4', description: 'Heat and pressure fiber separation' },
      ]
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
        { name: 'Microwave Pyrolysis', status: 'Research', trl: 'TRL 3-4', description: 'Microwave-assisted thermal breakdown' },
      ]
    },
    { 
      category: 'Physical',
      technologies: [
        { name: 'Solvent Extraction', status: 'Commercial', trl: 'TRL 8-9', description: 'Separation using organic solvents' },
        { name: 'Supercritical Fluid Extraction', status: 'Pilot', trl: 'TRL 6-7', description: 'Extraction using supercritical CO2' },
        { name: 'Membrane Separation', status: 'Pilot', trl: 'TRL 6-7', description: 'Selective separation through membranes' },
        { name: 'Adsorption', status: 'Lab', trl: 'TRL 4-5', description: 'Surface-based compound capture' },
        { name: 'Crystallization', status: 'Lab', trl: 'TRL 4-5', description: 'Purification through crystal formation' },
      ]
    },
    { 
      category: 'Hybrid',
      technologies: [
        { name: 'Steam Explosion + Enzymatic', status: 'Commercial', trl: 'TRL 8-9', description: 'Combined physical and biological treatment' },
        { name: 'Chemical + Enzymatic', status: 'Pilot', trl: 'TRL 6-7', description: 'Sequential chemical and enzymatic processing' },
        { name: 'Ultrasound + Chemical', status: 'Lab', trl: 'TRL 4-5', description: 'Sonication-assisted chemical conversion' },
        { name: 'Microwave + Chemical', status: 'Research', trl: 'TRL 3-4', description: 'Microwave-enhanced chemical reactions' },
      ]
    },
  ];

  const marketData = [
    {
      application: 'Agricultural Applications',
      totalSize: '€147B',
      subcategories: [
        { name: 'Crop Production', size: '€85.2B', growth: '5.4%', period: '2024-2030' },
        { name: 'Pest Management', size: '€38.5B', growth: '6.2%', period: '2024-2030' },
        { name: 'Soil Health Management', size: '€23.3B', growth: '4.8%', period: '2024-2030' },
      ],
    },
    {
      application: 'Pharmaceuticals',
      totalSize: '€218B',
      subcategories: [
        { name: 'Drug Development', size: '€125B', growth: '8.5%', period: '2024-2030' },
        { name: 'Therapeutic Compounds', size: '€65B', growth: '7.8%', period: '2024-2030' },
        { name: 'Medical Devices', size: '€28B', growth: '8.6%', period: '2024-2030' },
      ],
    },
    {
      application: 'Nutraceuticals',
      totalSize: '€151.9B',
      subcategories: [
        { name: 'Dietary Supplements', size: '€95.2B', growth: '7.2%', period: '2024-2030' },
        { name: 'Functional Foods', size: '€42.7B', growth: '6.3%', period: '2024-2030' },
        { name: 'Sports Nutrition', size: '€14B', growth: '6.8%', period: '2024-2030' },
      ],
    },
    {
      application: 'Cosmetics',
      totalSize: '€126B',
      subcategories: [
        { name: 'Skin Care', size: '€72B', growth: '7.8%', period: '2024-2030' },
        { name: 'Anti-aging Products', size: '€38.5B', growth: '8.2%', period: '2024-2030' },
        { name: 'Natural Cosmetics', size: '€15.5B', growth: '6.5%', period: '2024-2030' },
      ],
    },
    {
      application: 'Food & Beverage',
      totalSize: '€85.2B',
      subcategories: [
        { name: 'Food Additives', size: '€48.7B', growth: '5.6%', period: '2024-2030' },
        { name: 'Beverages', size: '€25.3B', growth: '5.1%', period: '2024-2030' },
        { name: 'Preservatives', size: '€11.2B', growth: '5.5%', period: '2024-2030' },
      ],
    },
  ];

  // Calculate market insights
  const calculateTotalMarketSize = () => {
    const total = marketData.reduce((sum, market) => {
      const value = parseFloat(market.totalSize.replace('€', '').replace('B', ''));
      return sum + value;
    }, 0);
    return `€${total.toFixed(1)}B`;
  };

  const getHighestGrowthMarket = () => {
    let highestAvgGrowth = 0;
    let topMarket = '';
    
    marketData.forEach(market => {
      const avgGrowth = market.subcategories.reduce((sum, sub) => {
        return sum + parseFloat(sub.growth.replace('%', ''));
      }, 0) / market.subcategories.length;
      
      if (avgGrowth > highestAvgGrowth) {
        highestAvgGrowth = avgGrowth;
        topMarket = market.application;
      }
    });
    
    return { market: topMarket, growth: highestAvgGrowth.toFixed(1) };
  };

  const getMarketAverageGrowth = (marketApp: typeof marketData[0]) => {
    const avgGrowth = marketApp.subcategories.reduce((sum, sub) => {
      return sum + parseFloat(sub.growth.replace('%', ''));
    }, 0) / marketApp.subcategories.length;
    return avgGrowth.toFixed(1);
  };

  // Calculate which technology categories have the most commercial technologies
  const getCommercialTechCount = (category: typeof technologyData[0]) => {
    return category.technologies.filter(tech => tech.status === 'Commercial').length;
  };

  const maxCommercialCount = Math.max(...technologyData.map(getCommercialTechCount));

  const details = {
    feedstock: {
      icon: <Sprout className="w-6 h-6" />,
      title: 'Feedstock (12)',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      signal: 'positive',
      description: 'Multiple feedstock opportunities exist for polyphenol production across several industries. Click on any industry to explore available sources.',
      items: feedstockData,
    },
    technology: {
      icon: <TestTube className="w-6 h-6" />,
      title: 'Technology (8)',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      signal: 'neutral',
      description: 'Five valorisation technologies are ready for deployment (TRL 7–9). Others, while still in development, show strong potential for future market and professional applications.',
      items: technologyData,
    },
    products: {
      icon: <Box className="w-6 h-6" />,
      title: 'Products (1)',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
      signal: 'positive',
      description: 'This is your selected product. VCG supports the identification and assessment of its valorisation potential.',
      productData: {
        name: 'Xylose',
        category: 'Bio-based Sugars',
        description: 'Xylose is a five-carbon sugar derived from lignocellulosic biomass through hydrolysis processes. It serves as a key intermediate for various bio-based chemicals and materials, with applications in food, pharmaceuticals, and industrial biotechnology.',
        marketSizeEurope: '€2.4B',
        marketSizeGlobal: '€8.7B',
        marketGrowthEurope: '6.8%',
        marketGrowthGlobal: '7.2%',
        growthPeriod: '2024-2030',
      },
    },
    market: {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Application (12)',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      signal: 'positive',
      description: 'Xylose has a strong market potential of 5 billion EUR, with 25 identified markets. With 4 high-growth segments, widespread adoption is expected across these market',
      items: marketData,
    },
  };

  const detail = details[type];
  
  // Pagination logic
  const totalPages = Math.ceil(feedstockData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = feedstockData.slice(startIndex, endIndex);
  
  // Fill empty rows to maintain consistent table height
  const filledItems = [...currentItems];
  while (filledItems.length < itemsPerPage) {
    filledItems.push(null);
  }

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'positive':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'neutral':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'negative':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  return (
    <TooltipProvider>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[70vh] flex flex-col overflow-hidden bg-white shadow-lg border-0">
        <DialogHeader className="flex-shrink-0 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className={`${detail.bgColor} p-2 rounded-lg`}>
              <div className={detail.color}>
                {detail.icon}
              </div>
            </div>
            <div className="flex-1">
              <DialogTitle className={`text-base font-semibold flex items-center gap-2 ${detail.color}`}>
                {detail.title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs mt-1.5 text-gray-600 leading-relaxed">
            {detail.description}
          </DialogDescription>
        </DialogHeader>

        {/* Feedstock, Technology, and Market specific layout */}
        {type === 'feedstock' || type === 'technology' || type === 'market' ? (
          <div className="flex-1 flex flex-col pt-2 overflow-hidden">
            <div className="grid gap-3" style={{ gridTemplateColumns: '280px 1fr' }}>
              {/* Left side - Chart */}
              <div className="flex flex-col border border-gray-300 rounded-lg bg-white overflow-hidden shadow-md" style={{ width: '280px', minWidth: '280px', maxWidth: '280px', maxHeight: '360px' }}>
                <div className="px-3 h-8 border-b border-gray-300 bg-gradient-to-b from-gray-100 to-gray-50 flex items-center">
                  <h3 className="font-semibold text-[10px] text-gray-800 uppercase tracking-wider">
                    {type === 'technology' ? 'Technology TRL Distribution' : type === 'market' ? 'Market Size Distribution' : 'Feedstock Sources Distribution'}
                  </h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-2 overflow-hidden bg-gradient-to-br from-white to-gray-50/30">
                  <img
                    src={type === 'technology' ? trlChartLeft : type === 'market' ? marketApplicationsChart : feedstockRegionsChart}
                    alt={type === 'technology' ? 'TRL Distribution' : type === 'market' ? 'Market Applications Distribution' : 'Feedstock Regions'} 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>
              </div>
              
              {/* Table */}
              <div className={`flex flex-col border border-gray-200 rounded-lg bg-white shadow-sm ${type === 'feedstock' ? 'max-h-[360px]' : 'h-fit self-start'}`}>
                
                <div className="overflow-auto bg-white">
                  <Table>
                    {type === 'feedstock' && (
                      <TableHeader className="sticky top-0 bg-gradient-to-b from-gray-50 to-gray-100 z-10">
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="font-semibold text-[10px] h-8 py-2 text-gray-700 uppercase tracking-wider text-left">Feedstock</TableHead>
                          <TableHead className="font-semibold text-[10px] h-8 py-2 text-gray-700 uppercase tracking-wider text-left">
                            <div className="flex items-center gap-1.5">
                              Quantity (EU)
                              <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                  <button type="button" className="inline-flex items-center">
                                    <Info className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent 
                                  className="max-w-xs bg-gray-900 text-white border-gray-700 z-[100]"
                                  sideOffset={5}
                                >
                                  <p className="text-xs">Estimated quantities of specific feedstocks available in Europe annually</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-[10px] h-8 py-2 text-gray-700 uppercase tracking-wider text-left">Price</TableHead>
                          <TableHead className="font-semibold text-[10px] h-8 py-2 text-gray-700 uppercase tracking-wider text-left">Xylose Production</TableHead>
                        </TableRow>
                      </TableHeader>
                    )}
                    {type === 'market' && (
                      <TableHeader className="sticky top-0 bg-gradient-to-b from-gray-50 to-gray-100 z-10">
                        {/* Column Headers */}
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="font-semibold text-[10px] h-8 py-2 text-gray-700 uppercase tracking-wider text-center">
                            Market Application ({marketData.length})
                          </TableHead>
                          <TableHead className="font-semibold text-[10px] h-8 py-2 text-gray-700 uppercase tracking-wider text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              Total Market Size
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-gray-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                  <p>The cumulative market size of market applications. For example, the Pharmaceuticals market size is the sum of its subcategories (Drug Development, Therapeutic Compounds, and Medical Devices).</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-[10px] h-8 py-2 text-gray-700 uppercase tracking-wider text-center">
                            <div className="flex items-center justify-center gap-1">
                              Expected Growth
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-gray-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                  <p>The category&apos;s expected growth is the average from its subcategories. For example, the Pharmaceuticals expected growth is the average of Drug Development, Therapeutic Compounds, and Medical Devices growth rates.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-[10px] h-8 py-2 text-gray-700 uppercase tracking-wider text-center">
                            Period
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                    )}
                    <TableBody>
                      {type === 'feedstock' ? (
                        filledItems.map((item, index) => (
                          <TableRow key={index} className="bg-white hover:bg-gray-50/80 transition-all duration-150 border-b border-gray-100 last:border-0">
                            {item ? (
                              <>
                                <TableCell className="font-semibold text-xs py-1.5 bg-white text-gray-900">{item.name}</TableCell>
                                <TableCell className="text-xs py-1.5 bg-white text-gray-600 text-left">{item.quantity}</TableCell>
                                <TableCell className="text-xs py-1.5 bg-white text-gray-700 text-left font-medium">{item.price}</TableCell>
                                <TableCell className="py-1.5 bg-white">
                                  {(() => {
                                    const statusDisplay = getStatusDisplay(item.status, 'feedstock');
                                    return (
                                      <Badge 
                                        variant="outline" 
                                        className={`flex items-center gap-1 w-fit ${statusDisplay.bgClass} ${statusDisplay.textClass} ${statusDisplay.borderClass} px-2 py-1 rounded-md font-medium shadow-sm`}
                                      >
                                        {statusDisplay.icon}
                                        <span className="text-[10px]">{statusDisplay.text}</span>
                                      </Badge>
                                    );
                                  })()}
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell className="py-1.5 bg-white h-[34px]">&nbsp;</TableCell>
                                <TableCell className="py-1.5 bg-white h-[34px]">&nbsp;</TableCell>
                                <TableCell className="py-1.5 bg-white h-[34px]">&nbsp;</TableCell>
                                <TableCell className="py-1.5 bg-white h-[34px]">&nbsp;</TableCell>
                              </>
                            )}
                          </TableRow>
                        ))
                      ) : type === 'market' ? (
                        [...marketData]
                          .sort((a, b) => {
                            const aGrowth = parseFloat(getMarketAverageGrowth(a));
                            const bGrowth = parseFloat(getMarketAverageGrowth(b));
                            return bGrowth - aGrowth; // highest growth first
                          })
                          .flatMap((marketApp, appIndex) => {
                            const isHighestGrowth = appIndex === 0;
                            return [
                          // Application header row
                          <TableRow 
                            key={`app-${appIndex}`} 
                            className={`cursor-pointer transition-colors ${
                              isHighestGrowth 
                                ? 'bg-orange-50 hover:bg-orange-100' 
                                : 'bg-gray-50 hover:bg-gray-100'
                            } ${
                              appIndex === marketData.length - 1 && !expandedCategories.has(marketApp.application)
                                ? 'border-b-2 border-gray-300'
                                : 'border-b border-gray-200'
                            }`}
                            onClick={() => toggleCategory(marketApp.application)}
                          >
                            <TableCell className={`font-bold text-xs py-2 ${isHighestGrowth ? 'text-orange-700' : 'text-gray-900'}`}>
                              <div className="flex items-center gap-1.5">
                                {expandedCategories.has(marketApp.application) ? (
                                  <ChevronDown className={`w-3.5 h-3.5 ${isHighestGrowth ? 'text-orange-700' : 'text-gray-900'}`} />
                                ) : (
                                  <ChevronRight className={`w-3.5 h-3.5 ${isHighestGrowth ? 'text-orange-700' : 'text-gray-900'}`} />
                                )}
                                {marketApp.application}
                                {isHighestGrowth && (
                                  <TrendingUp className="w-3.5 h-3.5 text-orange-700" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className={`font-semibold text-xs py-2 text-center ${isHighestGrowth ? 'text-orange-700' : 'text-gray-900'}`}>{marketApp.totalSize}</TableCell>
                            <TableCell className={`text-xs py-2 text-center ${isHighestGrowth ? 'text-orange-700' : 'text-gray-900'}`}>
                              {getMarketAverageGrowth(marketApp)}%
                            </TableCell>
                            <TableCell className="text-xs py-2 text-gray-600 text-center">
                              
                            </TableCell>
                          </TableRow>,
                          // Subcategory rows - only show if expanded
                          ...(expandedCategories.has(marketApp.application) ? marketApp.subcategories.map((subcat, subcatIndex) => (
                            <TableRow 
                              key={`subcat-${appIndex}-${subcatIndex}`} 
                              className={`bg-white hover:bg-gray-50/80 transition-all duration-150 ${
                                appIndex === marketData.length - 1 && subcatIndex === marketApp.subcategories.length - 1
                                  ? 'border-b-2 border-gray-300'
                                  : 'border-b border-gray-100'
                              }`}
                            >
                              <TableCell className="text-xs py-1.5 bg-white text-gray-900 pl-8">{subcat.name}</TableCell>
                              <TableCell className="text-xs py-1.5 bg-white text-gray-700 font-medium text-center">{subcat.size}</TableCell>
                              <TableCell className="text-xs py-1.5 bg-white text-gray-600 text-center">
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300 rounded-sm text-[10px] px-2 py-0.5">
                                  {subcat.growth}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-[10px] py-1.5 bg-white text-gray-500 text-center">
                                {subcat.period}
                              </TableCell>
                            </TableRow>
                          )) : [])
                        ];
                      })
                      ) : (
                        technologyData.flatMap((categoryGroup, catIndex) => [
                          // Category header row
                          <TableRow 
                            key={`cat-${catIndex}`} 
                            className="bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleCategory(categoryGroup.category)}
                          >
                            <TableCell colSpan={4} className="font-bold text-xs py-2 text-gray-900 uppercase tracking-wide">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  {expandedCategories.has(categoryGroup.category) ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                  {categoryGroup.category} ({categoryGroup.technologies.length})
                                </div>
                                {getCommercialTechCount(categoryGroup) === maxCommercialCount && maxCommercialCount > 0 && (
                                  <div className="text-blue-600 text-[10px] font-semibold flex items-center gap-1 normal-case">
                                    <TrendingUp className="w-3 h-3" />
                                    Most Commercial
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>,
                          // Column header row - only show if expanded
                          ...(expandedCategories.has(categoryGroup.category) ? [
                            <TableRow key={`header-${catIndex}`} className="bg-gradient-to-b from-gray-50 to-gray-100 border-b border-gray-200">
                              <TableHead className="font-semibold text-[10px] h-8 py-2 text-gray-700 uppercase tracking-wider text-left">Process</TableHead>
                              <TableHead className="font-semibold text-[10px] h-8 py-2 text-gray-700 uppercase tracking-wider text-left">TRL</TableHead>
                              <TableHead className="font-semibold text-[10px] h-8 py-2 text-gray-700 uppercase tracking-wider text-left">Description</TableHead>
                              <TableHead className="font-semibold text-[10px] h-8 py-2 text-gray-700 uppercase tracking-wider text-left">Readiness</TableHead>
                            </TableRow>
                          ] : []),
                          // Technology rows - only show if expanded
                          ...(expandedCategories.has(categoryGroup.category) ? categoryGroup.technologies.map((tech, techIndex) => (
                            <TableRow key={`tech-${catIndex}-${techIndex}`} className="bg-white hover:bg-gray-50/80 transition-all duration-150 border-b border-gray-100">
                              <TableCell className="text-xs py-1.5 bg-white text-gray-900 pl-6 font-medium">{tech.name}</TableCell>
                              <TableCell className="text-xs py-1.5 bg-white text-gray-700 font-medium">{tech.trl}</TableCell>
                              <TableCell className="text-[10px] py-1.5 bg-white text-gray-600 max-w-xs">{tech.description}</TableCell>
                              <TableCell className="py-1.5 bg-white">
                                {(() => {
                                  const statusDisplay = getStatusDisplay(tech.status, 'technology');
                                  return (
                                    <Badge 
                                      variant="outline" 
                                      className={`flex items-center gap-1 w-fit ${statusDisplay.bgClass} ${statusDisplay.textClass} ${statusDisplay.borderClass} px-2 py-1 rounded-md font-medium shadow-sm`}
                                    >
                                      {statusDisplay.icon}
                                      <span className="text-[10px]">{statusDisplay.text}</span>
                                    </Badge>
                                  );
                                })()}
                              </TableCell>
                            </TableRow>
                          )) : [])
                        ])
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination controls - only for feedstock */}
                {type === 'feedstock' && (
                  <div className="flex items-center justify-between px-3 py-1.5 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 flex-shrink-0 rounded-b-lg">
                    <div className="text-[10px] text-gray-600 font-medium">
                      Showing {startIndex + 1}-{Math.min(endIndex, feedstockData.length)} of {feedstockData.length} feedstocks
                    </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="h-6 w-6 p-0 hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-[10px] text-gray-700 min-w-[80px] text-center font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="h-6 w-6 p-0 hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : type === 'products' ? (
          /* Products type - single product with image and profile */
          <div className="flex-1 flex flex-col pt-2 overflow-hidden">
            <div className="border border-gray-200 rounded-lg bg-white p-4">
              <div className="flex gap-4 items-stretch">
                {/* Left side - Product Image */}
                <div className="flex-shrink-0 flex items-stretch">
                  <div className="w-64 border border-gray-200 rounded-lg bg-gradient-to-br from-purple-50 to-white p-4 flex items-center justify-center shadow-sm">
                    <img 
                      src={xyloseMolecule} 
                      alt="Xylose Molecule" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Right side - Product Profile */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-purple-900 mb-1">{details.products.productData.name}</h3>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 rounded-sm text-[10px] px-2 py-0.5">
                      {details.products.productData.category}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Product Description</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {details.products.productData.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-blue-50 to-white relative">
                      <MapPin className="absolute top-2 right-2 w-4 h-4 text-blue-400" />
                      <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">Market Size - Europe</div>
                      <div className="text-lg font-bold text-blue-700">{details.products.productData.marketSizeEurope}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Growth: <span className="font-semibold text-green-600">{details.products.productData.marketGrowthEurope}</span>
                        <span className="text-gray-400 ml-1">({details.products.productData.growthPeriod})</span>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-purple-50 to-white relative">
                      <Globe className="absolute top-2 right-2 w-4 h-4 text-purple-400" />
                      <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">Market Size - Global</div>
                      <div className="text-lg font-bold text-purple-700">{details.products.productData.marketSizeGlobal}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Growth: <span className="font-semibold text-green-600">{details.products.productData.marketGrowthGlobal}</span>
                        <span className="text-gray-400 ml-1">({details.products.productData.growthPeriod})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
};

export default ValueChainDetailModal;