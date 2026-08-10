import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, TestTube, Sprout, Info, Weight, Euro, List } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import feedstockRegionsChart from '@/assets/feedstock-regions-chart.png';
import sugarBeetImage from '@/assets/sugar-beet.jpg';

interface FeedstockItem {
  name: string;
  category: string;
  status: string;
  price: string;
  quantity: string;
}

const getSourceColor = (feedstock: string): string => {
  const feedstockLower = feedstock.toLowerCase();
  
  // Orange/tan for grain residues
  if (feedstockLower.includes('corn') || feedstockLower.includes('wheat')) {
    return 'bg-orange-400';
  }
  // Blue for rice/other grains
  if (feedstockLower.includes('rice')) {
    return 'bg-blue-400';
  }
  // Green for sugarcane/bagasse
  if (feedstockLower.includes('bagasse') || feedstockLower.includes('sugar')) {
    return 'bg-green-500';
  }
  // Dark teal for wood
  if (feedstockLower.includes('wood') || feedstockLower.includes('chip')) {
    return 'bg-teal-700';
  }
  // Default gray
  return 'bg-gray-400';
};

interface ValueChainFeedstockDetailProps {
  feedstockData: FeedstockItem[];
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  category?: string;
  topic?: string;
}

export const ValueChainFeedstockDetail: React.FC<ValueChainFeedstockDetailProps> = ({
  feedstockData,
  currentPage,
  itemsPerPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  category,
  topic,
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = feedstockData.slice(startIndex, endIndex);
  
  const filledItems = [...currentItems];
  while (filledItems.length < itemsPerPage) {
    filledItems.push(null);
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Commercial':
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

  // Check if we're coming from a feedstock route
  const isFromFeedstock = category === 'Feedstock' && topic;
  
  // Feedstock profile data for specific feedstocks
  const getFeedstockProfile = (feedstockName: string) => {
    const profiles: Record<string, any> = {
      'Sugar Beet': {
        category: 'Energy Crops',
        description: 'Sugar beet is a versatile energy crop rich in fermentable sugars, making it an excellent feedstock for biorefinery applications. It offers high sugar content and efficient conversion for xylose production.',
        availability: '156M tons/year',
        price: '€25-40/ton',
        sugarContent: '16-20%',
        region: 'Europe'
      }
    };
    return profiles[feedstockName] || {
      category: 'Biomass Feedstock',
      description: `${feedstockName} is a valuable feedstock for biorefinery applications, offering sustainable sourcing and efficient conversion potential for xylose production.`,
      availability: 'Variable',
      price: 'Market-dependent',
      region: 'Multiple regions'
    };
  };

  return (
    <TooltipProvider>
      {isFromFeedstock ? (
        // Feedstock Profile Layout
        <div className="flex gap-6">
          {/* Left side - Feedstock Profile */}
          <div className="flex flex-col border border-gray-300 rounded-lg bg-white shadow-md p-3" style={{ width: '320px', height: '270px' }}>
            <div className="space-y-1 mb-2 flex-shrink-0">
              <h3 className="text-base font-bold text-gray-900">{topic}</h3>
              <p className="text-xs text-gray-600">{getFeedstockProfile(topic!).category}</p>
            </div>
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg overflow-hidden">
              <img
                src={sugarBeetImage}
                alt={`${topic} feedstock`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* Right side - Feedstock details */}
          <div className="flex-1 space-y-3">
            <div className="border border-gray-300 rounded-lg bg-white shadow-md p-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-1.5">Description</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {getFeedstockProfile(topic!).description}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Availability */}
              <div className="border border-gray-300 rounded-lg bg-white shadow-md p-3 pb-[19px] flex flex-col relative">
                <button className="absolute top-2 right-2 flex items-center gap-1 bg-gray-100 hover:bg-gray-200 rounded px-1.5 py-0.5 transition-colors">
                  <List className="w-3 h-3 text-gray-600" />
                  <span className="text-[10px] font-medium text-gray-600">4</span>
                </button>
                <div className="flex-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Weight className="w-3.5 h-3.5 text-green-700" />
                      </div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider">Availability in Europe</p>
                    </div>
                    <div className="mt-[3px]">
                    <p className="text-sm font-bold text-green-700">156 Million</p>
                    <p className="text-[10px] text-gray-600 mb-1">tonnes per year</p>
                    <div className="bg-green-50 rounded px-1.5 py-1 mt-[4px]">
                      <p className="text-[9px] text-gray-500 leading-tight">
                        Tonnage estimates are indicative and based on analytics of public data sources. Actual volumes may vary based on seasonal and regional factors.
                      </p>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Price Range */}
              <div className="border border-gray-300 rounded-lg bg-white shadow-md p-3 pb-[19px] flex flex-col relative">
                <button className="absolute top-2 right-2 flex items-center gap-1 bg-gray-100 hover:bg-gray-200 rounded px-1.5 py-0.5 transition-colors">
                  <List className="w-3 h-3 text-gray-600" />
                  <span className="text-[10px] font-medium text-gray-600">4</span>
                </button>
                <div className="flex-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Euro className="w-3.5 h-3.5 text-green-700" />
                      </div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider">Price Range</p>
                    </div>
                    <div className="mt-[3px]">
                    <p className="text-sm font-bold text-green-700">€25-40</p>
                    <p className="text-[10px] text-gray-600 mb-1">per tonne</p>
                    <div className="bg-green-50 rounded px-1.5 py-1 mt-[4px]">
                      <p className="text-[9px] text-gray-500 leading-tight">
                        Price varies based on market conditions, quality, and seasonal availability. Prices may fluctuate based on regional demand.
                      </p>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Original Chart & Table Layout
        <div className="grid gap-3" style={{ gridTemplateColumns: '240px 1fr' }}>
          {/* Left side - Chart */}
          <div className="flex flex-col border border-gray-300 rounded-lg bg-white overflow-hidden shadow-md max-h-[360px]" style={{ width: '240px', minWidth: '240px', maxWidth: '240px' }}>
            <div className="px-3 h-8 border-b border-gray-300 bg-gradient-to-b from-gray-100 to-gray-50 flex items-center">
              <h3 className="font-semibold text-[10px] text-gray-800 uppercase tracking-wider">
                Feedstock Sources Distribution
              </h3>
            </div>
            <div className="flex-1 flex items-center justify-center p-2 overflow-hidden bg-gradient-to-br from-white to-gray-50/30">
              <img
                src={feedstockRegionsChart}
                alt="Feedstock Regions"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
      
      {/* Table */}
      <div className="flex flex-col border border-gray-300 rounded-lg bg-white shadow-md max-h-[360px] min-w-0 w-full">
        <div className="overflow-auto bg-white flex-1">
          <Table className="w-full table-fixed">
            <TableHeader className="sticky top-0 bg-gradient-to-b from-gray-100 to-gray-50 z-10">
              <TableRow className="border-b border-gray-300">
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-left w-[25%]">Feedstock</TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-left w-[25%]">
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
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-left w-[15%]">Price</TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-center w-[12%]">Producers</TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-left w-[18%]">Xylose Production</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filledItems.map((item, index) => (
                <TableRow key={index} className="bg-white hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100 last:border-0">
                  {item ? (
                    <>
                      <TableCell className="font-semibold text-xs py-2 bg-white text-gray-900">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] uppercase tracking-wide text-gray-500 font-medium">
                            {item.category}
                          </span>
                          <span className="text-xs font-semibold text-gray-900">
                            {item.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs py-2 bg-white text-gray-600 text-left">{item.quantity}</TableCell>
                      <TableCell className="text-xs py-2 bg-white text-gray-700 text-left font-medium">{item.price}</TableCell>
                      <TableCell className="text-xs py-2 bg-white text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          {Math.floor(Math.random() * 8) + 2}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 bg-white">
                        {(() => {
                          const statusDisplay = getStatusDisplay(item.status);
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
                      <TableCell className="py-2 bg-white">&nbsp;</TableCell>
                      <TableCell className="py-2 bg-white">&nbsp;</TableCell>
                      <TableCell className="py-2 bg-white">&nbsp;</TableCell>
                      <TableCell className="py-2 bg-white">&nbsp;</TableCell>
                      <TableCell className="py-2 bg-white">&nbsp;</TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination controls */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-gray-300 bg-gradient-to-b from-white to-gray-50 flex-shrink-0 rounded-b-lg">
          <div className="text-[10px] text-gray-600 font-medium">
            Showing {startIndex + 1}-{Math.min(endIndex, feedstockData.length)} of {feedstockData.length} feedstocks
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousPage}
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
              onClick={onNextPage}
              disabled={currentPage === totalPages}
              className="h-6 w-6 p-0 hover:bg-blue-50 transition-colors border-gray-300"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
        </div>
      )}
    </TooltipProvider>
  );
};