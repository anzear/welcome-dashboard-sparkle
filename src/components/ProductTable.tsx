import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Beaker, Zap, Rocket, CheckCircle, TestTube, Box, UtensilsCrossed, Search, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, DollarSign, Star, Info } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProductTableProps {
  selectedProduct?: string | null;
  onProductClick?: (productName: string) => void;
  selectedCategories?: string[];
  onClearCategories?: () => void;
}

type SortField = 'name' | 'price' | 'marketSize' | 'growthRate' | 'stage';
type SortDirection = 'asc' | 'desc';

const ProductTable: React.FC<ProductTableProps> = ({ selectedProduct, onProductClick, selectedCategories = [], onClearCategories }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('marketSize');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const itemsPerPage = 5;

  const allProducts = [
    { name: 'Ethanol', marketSize: '$89.1B', growthRate: 4.2, growthPeriod: '2020-2030', price: '$0.65/L', category: 'Chemicals', stage: 'Commercial' },
    { name: 'Bioethanol', marketSize: '$65.8B', growthRate: 6.2, growthPeriod: '2021-2031', price: '$0.68/L', category: 'Fuels', stage: 'Commercial' },
    { name: 'Hydrogen', marketSize: '$174B', growthRate: 9.8, growthPeriod: '2019-2029', price: '$3.50/kg', category: 'Fuels', stage: 'Pilot' },
    { name: 'Animal Feed', marketSize: '$460B', growthRate: 2.1, growthPeriod: '2020-2028', price: '$0.28/kg', category: 'Food & Feed', stage: 'Commercial' },
    { name: 'Functional Foods', marketSize: '$279B', growthRate: 7.3, growthPeriod: '2022-2032', price: '$12.00/kg', category: 'Food & Feed', stage: 'Commercial' },
    { name: 'Acetic Acid', marketSize: '$15.6B', growthRate: 3.8, growthPeriod: '2020-2027', price: '$1.20/kg', category: 'Chemicals', stage: 'Commercial' },
    { name: 'Lactic Acid', marketSize: '$3.9B', growthRate: 8.5, growthPeriod: '2020-2029', price: '$1.80/kg', category: 'Chemicals', stage: 'Commercial' },
    { name: 'Bioplastics', marketSize: '$13.3B', growthRate: 11.2, growthPeriod: '2021-2030', price: '$2.45/kg', category: 'Materials', stage: 'Pilot' },
    { name: 'Citric Acid', marketSize: '$3.2B', growthRate: 5.4, growthPeriod: '2020-2028', price: '$1.45/kg', category: 'Chemicals', stage: 'Commercial' },
    { name: 'Succinic Acid', marketSize: '$0.8B', growthRate: 12.3, growthPeriod: '2021-2029', price: '$3.20/kg', category: 'Chemicals', stage: 'Lab' },
    { name: 'Biodiesel', marketSize: '$39.7B', growthRate: 4.8, growthPeriod: '2020-2029', price: '$0.95/L', category: 'Fuels', stage: 'Commercial' },
    { name: 'Biogas', marketSize: '$33.1B', growthRate: 7.1, growthPeriod: '2021-2030', price: '$0.45/m³', category: 'Fuels', stage: 'Commercial' },
    { name: 'Methanol', marketSize: '$31.2B', growthRate: 3.5, growthPeriod: '2020-2027', price: '$0.38/L', category: 'Fuels', stage: 'Commercial' },
    { name: 'Renewable Diesel', marketSize: '$65.4B', growthRate: 8.9, growthPeriod: '2022-2031', price: '$1.15/L', category: 'Fuels', stage: 'Commercial' },
    { name: 'Bio-based Polymers', marketSize: '$20.9B', growthRate: 9.7, growthPeriod: '2021-2030', price: '$2.80/kg', category: 'Materials', stage: 'Pilot' },
    { name: 'Biocomposites', marketSize: '$6.2B', growthRate: 11.8, growthPeriod: '2020-2029', price: '$4.50/kg', category: 'Materials', stage: 'Pilot' },
    { name: 'Bio-fibers', marketSize: '$4.8B', growthRate: 6.9, growthPeriod: '2021-2028', price: '$2.15/kg', category: 'Materials', stage: 'Lab' },
    { name: 'Natural Rubber', marketSize: '$18.3B', growthRate: 4.2, growthPeriod: '2020-2028', price: '$1.85/kg', category: 'Materials', stage: 'Commercial' },
    { name: 'Cellulose Nanocrystals', marketSize: '$0.3B', growthRate: 18.5, growthPeriod: '2022-2032', price: '$12.50/kg', category: 'Materials', stage: 'Research' },
    { name: 'Dietary Supplements', marketSize: '$151.9B', growthRate: 6.8, growthPeriod: '2021-2030', price: '$18.50/kg', category: 'Food & Feed', stage: 'Commercial' },
    { name: 'Prebiotics', marketSize: '$7.1B', growthRate: 9.3, growthPeriod: '2020-2029', price: '$8.75/kg', category: 'Food & Feed', stage: 'Commercial' },
    { name: 'Pectin', marketSize: '$1.4B', growthRate: 5.7, growthPeriod: '2021-2028', price: '$4.20/kg', category: 'Food & Feed', stage: 'Commercial' },
    { name: 'Food Additives', marketSize: '$52.8B', growthRate: 4.9, growthPeriod: '2020-2027', price: '$6.80/kg', category: 'Food & Feed', stage: 'Commercial' },
    { name: 'Sweeteners', marketSize: '$18.6B', growthRate: 3.2, growthPeriod: '2020-2028', price: '$3.95/kg', category: 'Food & Feed', stage: 'Commercial' },
    { name: 'Organic Acids', marketSize: '$8.9B', growthRate: 7.4, growthPeriod: '2021-2029', price: '$2.30/kg', category: 'Chemicals', stage: 'Commercial' },
    { name: 'Glycerol', marketSize: '$2.8B', growthRate: 4.1, growthPeriod: '2020-2027', price: '$1.25/kg', category: 'Chemicals', stage: 'Commercial' },
    { name: 'Industrial Enzymes', marketSize: '$7.0B', growthRate: 6.2, growthPeriod: '2021-2030', price: '$15.20/kg', category: 'Chemicals', stage: 'Commercial' },
    { name: 'Bio-based Solvents', marketSize: '$4.2B', growthRate: 8.7, growthPeriod: '2020-2029', price: '$2.65/L', category: 'Chemicals', stage: 'Pilot' },
    { name: 'Platform Chemicals', marketSize: '$89.7B', growthRate: 5.8, growthPeriod: '2021-2031', price: '$1.95/kg', category: 'Chemicals', stage: 'Commercial' },
    { name: 'Biofertilizers', marketSize: '$2.9B', growthRate: 11.5, growthPeriod: '2022-2030', price: '$3.40/kg', category: 'Food & Feed', stage: 'Commercial' },
    { name: 'Protein Concentrates', marketSize: '$12.4B', growthRate: 8.2, growthPeriod: '2021-2029', price: '$9.80/kg', category: 'Food & Feed', stage: 'Commercial' },
    { name: 'Biomaterials', marketSize: '$5.7B', growthRate: 10.3, growthPeriod: '2020-2030', price: '$7.25/kg', category: 'Materials', stage: 'Lab' },
    { name: 'Renewable Fibers', marketSize: '$3.1B', growthRate: 9.1, growthPeriod: '2021-2028', price: '$4.85/kg', category: 'Materials', stage: 'Research' }
  ];

  // Process and filter products
  const processedProducts = useMemo(() => {
    let filtered = allProducts;
    
    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => selectedCategories.includes(product.category));
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort products
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          // Extract numeric value from price string
          aValue = parseFloat(a.price.replace(/[$\/a-zA-Z³]/g, ''));
          bValue = parseFloat(b.price.replace(/[$\/a-zA-Z³]/g, ''));
          break;
        case 'marketSize':
          // Extract numeric value from market size
          aValue = parseFloat(a.marketSize.replace(/[$B]/g, ''));
          bValue = parseFloat(b.marketSize.replace(/[$B]/g, ''));
          break;
        case 'growthRate':
          aValue = a.growthRate;
          bValue = b.growthRate;
          break;
        case 'stage':
          const stageOrder: { [key: string]: number } = { 'Research': 1, 'Lab': 2, 'Pilot': 3, 'Commercial': 4 };
          aValue = stageOrder[a.stage] || 0;
          bValue = stageOrder[b.stage] || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [selectedCategories, searchTerm, sortField, sortDirection]);

  const filteredProducts = processedProducts;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when categories, search, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-3 h-3 text-primary" /> : 
      <ArrowDown className="w-3 h-3 text-primary" />;
  };

  const isHighGrowth = (growthRate: number) => growthRate > 8;
  const isLargeMarket = (marketSize: string) => {
    const value = parseFloat(marketSize.replace(/[$B]/g, ''));
    return value > 50;
  };

  const formatMarketSize = (marketSize: string) => {
    const value = parseFloat(marketSize.replace(/[$B]/g, ''));
    if (value >= 1000) return `$${(value/1000).toFixed(1)}T`;
    if (value >= 1) return `$${value.toFixed(1)}B`;
    return marketSize;
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Research': return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-150 font-medium';
      case 'Lab': return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-150 font-medium';
      case 'Pilot': return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-150 font-medium';
      case 'Commercial': return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-150 font-medium';
      default: return 'bg-muted text-muted-foreground border-border hover:bg-muted/80';
    }
  };

  const getStageStars = (stage: string) => {
    switch (stage) {
      case 'Research': return 1;
      case 'Lab': return 2;
      case 'Pilot': return 3;
      case 'Commercial': return 4;
      default: return 0;
    }
  };

  const renderStars = (stage: string, category: string, productName: string) => {
    const starCount = getStageStars(stage);
    
    const getStarColor = (category: string) => {
      switch (category) {
        case 'Chemicals': return 'text-violet-500 fill-violet-500';
        case 'Fuels': return 'text-blue-500 fill-blue-500';
        case 'Materials': return 'text-emerald-500 fill-emerald-500';
        case 'Food & Feed': return 'text-amber-500 fill-amber-500';
        default: return 'text-slate-700 fill-slate-700';
      }
    };

    const getMaturityExplanation = (stage: string, productName: string) => {
      const explanations = {
        'Commercial': `${productName} has achieved full commercial scale with established market presence, proven supply chains, and widespread adoption.`,
        'Pilot': `${productName} is in pilot-scale testing phase with demonstrated technical feasibility but not yet at full commercial scale.`,
        'Lab': `${productName} is in laboratory-scale development with promising results but requires further scaling and optimization.`,
        'Research': `${productName} is in early research phase with basic concept validation but significant development work remaining.`
      };
      return explanations[stage as keyof typeof explanations] || 'Maturity level assessment not available.';
    };

    const handleInfoClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      alert(`${stage} Maturity Level: ${getMaturityExplanation(stage, productName)}`);
    };
    
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">
          {[...Array(4)].map((_, index) => (
            <Star
              key={index}
              className={`w-3 h-3 ${
                index < starCount
                  ? getStarColor(category)
                  : 'text-gray-300 fill-gray-300'
              }`}
            />
          ))}
        </div>
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={handleInfoClick}
                className="ml-1 transition-all duration-200 hover:bg-muted/60 rounded-full p-0.5 relative"
                title={`${stage}: ${getMaturityExplanation(stage, productName)}`}
              >
                <Info className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="max-w-xs p-3 text-sm bg-background border border-border shadow-lg z-[9999]"
              sideOffset={5}
            >
              <p className="font-medium mb-1">{stage} Maturity Level</p>
              <p className="text-muted-foreground">{getMaturityExplanation(stage, productName)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'Research': return <Beaker className="w-3 h-3" />;
      case 'Lab': return <Zap className="w-3 h-3" />;
      case 'Pilot': return <Rocket className="w-3 h-3" />;
      case 'Commercial': return <CheckCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Chemicals': return <TestTube className="w-4 h-4 text-violet-500" />;
      case 'Fuels': return <Zap className="w-4 h-4 text-blue-500" />;
      case 'Materials': return <Box className="w-4 h-4 text-emerald-500" />;
      case 'Food & Feed': return <UtensilsCrossed className="w-4 h-4 text-amber-500" />;
      default: return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Chemicals': return 'hover:bg-violet-50/40';
      case 'Fuels': return 'hover:bg-blue-50/40';
      case 'Materials': return 'hover:bg-emerald-50/40';
      case 'Food & Feed': return 'hover:bg-amber-50/40';
      default: return '';
    }
  };

  const getCategoryTextColor = (category: string) => {
    switch (category) {
      case 'Chemicals': return 'group-hover:text-violet-600';
      case 'Fuels': return 'group-hover:text-blue-600';
      case 'Materials': return 'group-hover:text-emerald-600';
      case 'Food & Feed': return 'group-hover:text-amber-600';
      default: return '';
    }
  };

  const getCategoryIndicator = (category: string) => {
    switch (category) {
      case 'Chemicals': return <div className="w-1 h-3 bg-violet-500 flex-shrink-0 rounded-full"></div>;
      case 'Fuels': return <div className="w-1 h-3 bg-blue-500 flex-shrink-0 rounded-full"></div>;
      case 'Materials': return <div className="w-1 h-3 bg-emerald-500 flex-shrink-0 rounded-full"></div>;
      case 'Food & Feed': return <div className="w-1 h-3 bg-amber-500 flex-shrink-0 rounded-full"></div>;
      default: return null;
    }
  };

  return (
    <div className="bg-gradient-card border border-border/40 rounded-xl shadow-soft p-3">
      {/* Search and Controls */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>
        
        {selectedCategories.length > 0 && (
          <div className="p-3 bg-card/50 rounded-lg border border-border/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedCategories.map(category => (
                    <div key={category} className="flex items-center gap-1 bg-muted/60 rounded-md px-2 py-1">
                      {getCategoryIcon(category)}
                      <span className="text-xs font-medium text-foreground">{category}</span>
                    </div>
                  ))}
                </div>
                <span className="text-xs font-medium text-foreground">
                  ({filteredProducts.length} products)
                </span>
              </div>
              <button
                onClick={onClearCategories}
                className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-muted/60 transition-all duration-200 text-muted-foreground hover:text-foreground"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs table-fixed">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[24%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border/40 bg-muted/20">
              <th className="text-left py-2 px-3 font-semibold text-foreground text-xs tracking-wide">
                <button 
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  Product
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="text-center py-2 px-3 font-semibold text-foreground text-xs tracking-wide">
                <button 
                  onClick={() => handleSort('price')}
                  className="flex items-center gap-2 hover:text-primary transition-colors mx-auto"
                >
                  Price Range
                  {getSortIcon('price')}
                </button>
              </th>
              <th className="text-center py-2 px-3 font-semibold text-foreground text-xs tracking-wide">
                <button 
                  onClick={() => handleSort('marketSize')}
                  className="flex items-center gap-2 hover:text-primary transition-colors mx-auto"
                >
                  Market Size
                  {getSortIcon('marketSize')}
                </button>
              </th>
              <th className="text-center py-2 px-3 font-semibold text-foreground text-xs tracking-wide">
                <button 
                  onClick={() => handleSort('growthRate')}
                  className="flex items-center gap-2 hover:text-primary transition-colors mx-auto"
                >
                  Growth Rate (%)
                  {getSortIcon('growthRate')}
                </button>
              </th>
              <th className="text-center py-2 px-3 font-semibold text-foreground text-xs tracking-wide">
                <button 
                  onClick={() => handleSort('stage')}
                  className="flex items-center gap-2 hover:text-primary transition-colors mx-auto"
                >
                  Technology Maturity
                  {getSortIcon('stage')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.map((product, index) => (
               <tr 
                key={product.name}
                className={`border-b border-border/20 cursor-pointer transition-all duration-200 hover:shadow-soft group ${
                  selectedProduct === product.name ? 'bg-muted/60 shadow-soft' : ''
                } ${index === currentProducts.length - 1 ? 'border-b-0' : ''} ${getCategoryColor(product.category)}`}
                onClick={() => onProductClick?.(product.name)}
              >
                <td className="py-1.5 px-3 font-semibold text-foreground text-xs transition-colors duration-200 relative">
                  <div className="flex items-center gap-2">
                    {getCategoryIndicator(product.category)}
                    <span className={`flex items-center gap-2 transition-colors duration-200 ${getCategoryTextColor(product.category)}`}>
                      {product.name}
                      {isHighGrowth(product.growthRate) && (
                        <span title="High Growth Product">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="py-1.5 px-3 text-center text-muted-foreground text-xs font-medium">{product.price}</td>
                <td className="py-1.5 px-3 text-center text-xs font-bold text-foreground relative">
                  <div className="flex items-center justify-center gap-1">
                    {formatMarketSize(product.marketSize)}
                  </div>
                </td>
                <td className="py-1.5 px-3 text-center text-xs">
                  <div className={`font-bold text-xs ${isHighGrowth(product.growthRate) ? 'text-green-600' : 'text-foreground'}`}>
                    {product.growthRate}%
                  </div>
                  <div className="text-[8px] text-muted-foreground bg-muted/30 rounded px-1 py-0.5 mt-0.5 inline-block font-medium">
                    {product.growthPeriod}
                  </div>
                </td>
                <td className="py-1.5 px-3 text-center text-xs">
                  <div className="flex items-center justify-center gap-3 ml-2">
                    <span className="text-foreground font-medium min-w-[70px] text-left">
                      {product.stage}
                    </span>
                    {renderStars(product.stage, product.category, product.name)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <div className="text-xs text-muted-foreground font-medium">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-3 py-2 text-xs border border-border/50 rounded-md hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-soft hover:scale-105 font-medium"
            >
              <ChevronLeft className="w-3 h-3" />
              Previous
            </button>
            <span className="text-xs text-muted-foreground px-3 py-2 bg-muted/20 rounded-md font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-3 py-2 text-xs border border-border/50 rounded-md hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-soft hover:scale-105 font-medium"
            >
              Next
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;