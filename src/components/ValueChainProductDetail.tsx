import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, Box, List, CheckCircle2, AlertCircle, TestTube, Sprout, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import xyloseMolecule from '@/assets/xylose-molecule.png';
import productMarketChart from '@/assets/product-market-scatter-new.png';

interface ValueChainProductDetailProps {
  topic: string | undefined;
  category?: string;
}

interface ProductTableItem {
  name: string;
  category: string;
  marketSize: string;
  marketGrowth: string;
  growthPeriod: string;
  status: string;
}

export const ValueChainProductDetail: React.FC<ValueChainProductDetailProps> = ({ topic, category }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  
  const productData = {
    name: topic || 'Xylose',
    category: 'Bio-based Sugars',
    description: 'Xylose is a five-carbon sugar derived from lignocellulosic biomass through hydrolysis processes. It serves as a key intermediate for various bio-based chemicals and materials, with applications in food, pharmaceuticals, and industrial biotechnology.',
    marketSizeEurope: '€2.4B',
    marketSizeGlobal: '€8.7B',
    marketGrowthEurope: '6.8%',
    marketGrowthGlobal: '7.2%',
    growthPeriod: '2024-2030',
  };

  // Sample products that can be made from Sugar Beet
  const productsFromFeedstock: ProductTableItem[] = [
    { name: 'Xylose', category: 'Primary', marketSize: '€2.4B', marketGrowth: '6.8%', growthPeriod: '2024-2030', status: 'Commercial' },
    { name: 'Xylitol', category: 'Secondary', marketSize: '€1.8B', marketGrowth: '5.2%', growthPeriod: '2024-2030', status: 'Commercial' },
    { name: 'Furfural', category: 'Secondary', marketSize: '€890M', marketGrowth: '7.1%', growthPeriod: '2024-2030', status: 'Pilot' },
    { name: 'Levulinic Acid', category: 'Derivatives', marketSize: '€420M', marketGrowth: '8.3%', growthPeriod: '2024-2030', status: 'Lab' },
    { name: 'Bio-ethanol', category: 'By-products', marketSize: '€3.2B', marketGrowth: '4.5%', growthPeriod: '2024-2030', status: 'Commercial' },
    { name: 'Lactic Acid', category: 'Secondary', marketSize: '€2.1B', marketGrowth: '6.9%', growthPeriod: '2024-2030', status: 'Commercial' },
    { name: 'Succinic Acid', category: 'Derivatives', marketSize: '€680M', marketGrowth: '9.2%', growthPeriod: '2024-2030', status: 'Pilot' },
    { name: 'Bio-PE', category: 'Derivatives', marketSize: '€1.5B', marketGrowth: '11.4%', growthPeriod: '2024-2030', status: 'Research' },
  ];

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Commercial':
        return { text: 'Commercial', icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />, bgClass: 'bg-green-100', textClass: 'text-green-800', borderClass: 'border-green-300' };
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

  const isFromFeedstock = category === 'Feedstock';

  // Pagination logic
  const totalPages = Math.ceil(productsFromFeedstock.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = productsFromFeedstock.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return isFromFeedstock ? (
    <TooltipProvider>
    <div className="grid gap-3" style={{ gridTemplateColumns: '380px 1fr' }}>
      <div className="flex flex-col border border-gray-300 rounded-lg bg-white overflow-hidden shadow-md max-h-[360px]" style={{ width: '380px', minWidth: '380px', maxWidth: '380px' }}>
        <div className="px-3 h-8 border-b border-gray-300 bg-gradient-to-b from-gray-100 to-gray-50 flex items-center">
          <h3 className="font-semibold text-[10px] text-gray-800 uppercase tracking-wider">
            Product Market Analysis
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-3 overflow-hidden bg-gradient-to-br from-white to-gray-50/30">
          <img
            src={productMarketChart}
            alt="Product Market Analysis"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
      </div>

      <div className="flex flex-col border border-gray-300 rounded-lg bg-white shadow-md max-h-[360px]">
      <div className="overflow-auto bg-white flex-1">
        <Table>
          <TableHeader className="sticky top-0 bg-gradient-to-b from-gray-100 to-gray-50 z-10">
            <TableRow className="border-b border-gray-300">
              <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-left">Material</TableHead>
              <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-center">
                <div className="flex items-center justify-center gap-1.5">
                  Market Size
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
                      <p className="text-xs">European Union market size</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-center">Expected Growth</TableHead>
              <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-center">Period</TableHead>
              <TableHead className="h-8 py-1.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentProducts.map((product, index) => {
              const statusDisplay = getStatusDisplay(product.status);
              return (
                <TableRow key={index} className="bg-white hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100 last:border-0 h-[60px]">
                  <TableCell className="py-2.5 bg-white h-[60px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase tracking-wide text-gray-500 font-medium leading-none">
                        {product.category}
                      </span>
                      <span className="text-xs font-semibold text-gray-900 leading-tight whitespace-nowrap">
                        {product.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 bg-white h-[60px]">
                    <div className="flex items-center justify-center h-full">
                      <span className="text-xs text-gray-700 font-medium">{product.marketSize}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 bg-white h-[60px]">
                    <div className="flex items-center justify-center h-full">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs px-2 py-1 rounded-md font-semibold">
                        {product.marketGrowth}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 bg-white h-[60px]">
                    <div className="flex items-center justify-center h-full">
                      <span className="text-[10px] text-gray-500 leading-none">{product.growthPeriod}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 bg-white h-[60px]">
                    <div className="flex items-center justify-center h-full">
                      <button className="flex items-center gap-0.5 bg-gray-100 hover:bg-gray-200 rounded px-1 py-0.5 transition-colors">
                        <List className="w-2.5 h-2.5 text-gray-600" />
                        <span className="text-[9px] font-medium text-gray-600">4</span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination controls */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-gray-300 bg-gradient-to-b from-white to-gray-50 flex-shrink-0 rounded-b-lg">
        <div className="text-[10px] text-gray-600 font-medium">
          Showing {startIndex + 1}-{Math.min(endIndex, productsFromFeedstock.length)} of {productsFromFeedstock.length} products
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="h-6 w-6 p-0 hover:bg-blue-50 transition-colors border-gray-300"
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
            className="h-6 w-6 p-0 hover:bg-blue-50 transition-colors border-gray-300"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      </div>
    </div>
    </TooltipProvider>
  ) : (
    // Original profile view for non-feedstock routes
    <div className="flex gap-6">
      {/* Left side - Product image */}
      <div className="flex flex-col border border-gray-300 rounded-lg bg-white shadow-md p-3" style={{ width: '320px', height: '270px' }}>
        <div className="space-y-1 mb-2 flex-shrink-0">
          <h3 className="text-base font-bold text-gray-900">{productData.name}</h3>
          <p className="text-xs text-gray-600">{productData.category}</p>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg p-2 overflow-hidden">
          <img
            src={xyloseMolecule}
            alt={`${productData.name} molecule`}
            className="max-w-full h-auto"
            style={{ maxHeight: '170px' }}
          />
        </div>
      </div>
      
      {/* Right side - Product details */}
      <div className="flex-1 space-y-3">
        <div className="border border-gray-300 rounded-lg bg-white shadow-md p-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-1.5">Description</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            {productData.description}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Europe Market */}
          <div className="border border-gray-300 rounded-lg bg-white shadow-md p-3 relative">
            <button className="absolute top-2 right-2 flex items-center gap-1 bg-gray-100 hover:bg-gray-200 rounded px-1.5 py-0.5 transition-colors">
              <List className="w-3 h-3 text-gray-600" />
              <span className="text-[10px] font-medium text-gray-600">4</span>
            </button>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-blue-700" />
              </div>
              <h4 className="text-xs font-semibold text-gray-900">Europe Market</h4>
            </div>
            <div className="space-y-1.5">
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Market Size</p>
                <p className="text-base font-bold text-blue-700">{productData.marketSizeEurope}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Expected Growth</p>
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] px-1.5 py-0.5 rounded-md">
                    {productData.marketGrowthEurope}
                  </Badge>
                  <span className="text-[10px] text-gray-500">{productData.growthPeriod}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Global Market */}
          <div className="border border-gray-300 rounded-lg bg-white shadow-md p-3 relative">
            <button className="absolute top-2 right-2 flex items-center gap-1 bg-gray-100 hover:bg-gray-200 rounded px-1.5 py-0.5 transition-colors">
              <List className="w-3 h-3 text-gray-600" />
              <span className="text-[10px] font-medium text-gray-600">4</span>
            </button>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                <Globe className="w-3.5 h-3.5 text-purple-700" />
              </div>
              <h4 className="text-xs font-semibold text-gray-900">Global Market</h4>
            </div>
            <div className="space-y-1.5">
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Market Size</p>
                <p className="text-base font-bold text-purple-700">{productData.marketSizeGlobal}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Expected Growth</p>
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] px-1.5 py-0.5 rounded-md">
                    {productData.marketGrowthGlobal}
                  </Badge>
                  <span className="text-[10px] text-gray-500">{productData.growthPeriod}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};