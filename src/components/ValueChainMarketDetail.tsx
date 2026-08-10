import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Info, List } from "lucide-react";
import marketApplicationsChart from '@/assets/market-applications-chart.png';

interface MarketSubcategory {
  name: string;
  price: string;
}

interface MarketApplication {
  application: string;
  subcategories: MarketSubcategory[];
}

interface FlatMarketRow {
  category: string;
  application: string;
  price: string;
}

interface ValueChainMarketDetailProps {
  marketData: MarketApplication[];
  expandedCategories: Set<string>;
  onToggleCategory: (category: string) => void;
  topic?: string;
  category?: string;
}


export const ValueChainMarketDetail: React.FC<ValueChainMarketDetailProps> = ({
  marketData,
  topic,
  category,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Flatten the data structure
  const flattenedData: FlatMarketRow[] = marketData.flatMap((market) =>
    market.subcategories.map((subcat) => ({
      category: market.application,
      application: subcat.name,
      price: subcat.price,
    }))
  );

  // Pagination
  const totalPages = Math.ceil(flattenedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = flattenedData.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <TooltipProvider>
      <div className="grid gap-3" style={{ gridTemplateColumns: '280px 1fr' }}>
        {/* Left side - Chart */}
        <div className="flex flex-col border border-gray-300 rounded-lg bg-white overflow-hidden shadow-md" style={{ width: '280px', minWidth: '280px', maxWidth: '280px', maxHeight: '360px' }}>
          <div className="px-3 h-8 border-b border-gray-300 bg-gradient-to-b from-gray-100 to-gray-50 flex items-center">
            <h3 className="font-semibold text-[10px] text-gray-800 uppercase tracking-wider">
              Market Size Distribution
            </h3>
          </div>
          <div className="flex-1 flex items-center justify-center p-2 overflow-hidden bg-gradient-to-br from-white to-gray-50/30">
            <img
              src={marketApplicationsChart}
              alt="Market Applications Distribution"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
        
        {/* Table */}
        <div className="flex flex-col border border-gray-300 rounded-lg bg-white shadow-md max-h-[360px]">
          <div className="overflow-auto bg-white flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-gradient-to-b from-gray-100 to-gray-50 z-10">
                <TableRow className="border-b border-gray-300">
                  <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-left">
                    Market Application
                  </TableHead>
                  {category !== 'Feedstock' && (
                    <>
                      <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-right pr-6">
                        {`${topic || 'Xylose'} Price`}
                      </TableHead>
                      <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-center">
                        Off-takers
                      </TableHead>
                      <TableHead className="h-8 py-1.5 w-[80px]">
                      </TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((row, index) => (
                  <TableRow 
                    key={`${row.category}-${row.application}-${index}`} 
                    className="bg-white hover:bg-gray-50/80 transition-colors duration-150 border-b border-gray-100"
                  >
                    <TableCell className="text-xs py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] uppercase tracking-wide text-gray-500 font-medium">{row.category}</span>
                        <span className="text-xs font-semibold text-gray-900">{row.application}</span>
                      </div>
                    </TableCell>
                    {category !== 'Feedstock' && (
                      <>
                        <TableCell className="text-xs py-2 text-gray-700 font-medium text-right pr-6">
                          {row.price}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-center">
                          <span className="text-xs font-semibold text-primary">
                            {Math.floor(Math.random() * 12) + 3}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <div className="flex items-center justify-center">
                            <button className="flex items-center gap-0.5 bg-gray-100 hover:bg-gray-200 rounded px-1 py-0.5 transition-colors">
                              <List className="w-2.5 h-2.5 text-gray-600" />
                              <span className="text-[9px] font-medium text-gray-600">4</span>
                            </button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between bg-gray-50">
            <span className="text-xs text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, flattenedData.length)} of {flattenedData.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="h-7 px-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="h-7 px-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};