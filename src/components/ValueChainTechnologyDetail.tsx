import React, { useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, TestTube, Sprout, List } from "lucide-react";
import trlChartLeft from '@/assets/trl-chart-left.png';

interface Technology {
  name: string;
  status: string;
  trl: string;
  description: string;
}

interface TechnologyWithCategory extends Technology {
  category: string;
}

interface TechnologyCategory {
  category: string;
  technologies: Technology[];
}

interface ValueChainTechnologyDetailProps {
  technologyData: TechnologyCategory[];
  expandedCategories?: Set<string>;
  onToggleCategory?: (category: string) => void;
}

const ITEMS_PER_PAGE = 4;

const getTRLColor = (trl: string): string => {
  // Extract the TRL numbers from strings like "TRL 8-9" or "TRL 6-7"
  const trlNumbers = trl.match(/\d+/g);
  if (!trlNumbers) return 'bg-gray-400';
  
  const avgTRL = trlNumbers.reduce((sum, num) => sum + parseInt(num), 0) / trlNumbers.length;
  
  if (avgTRL >= 8) return 'bg-gray-800'; // TRL 8-9: dark navy/black
  if (avgTRL >= 7) return 'bg-blue-700'; // TRL 7: dark blue
  if (avgTRL >= 6) return 'bg-blue-400'; // TRL 6: light blue
  return 'bg-gray-400'; // TRL 4-5: gray
};

export const ValueChainTechnologyDetail: React.FC<ValueChainTechnologyDetailProps> = ({
  technologyData,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Flatten all technologies with their category
  const allTechnologies = useMemo((): TechnologyWithCategory[] => {
    return technologyData.flatMap(categoryGroup =>
      categoryGroup.technologies.map(tech => ({
        ...tech,
        category: categoryGroup.category
      }))
    );
  }, [technologyData]);

  // Pagination calculations
  const totalPages = Math.ceil(allTechnologies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTechnologies = allTechnologies.slice(startIndex, endIndex);
  
  // Fill with nulls to maintain consistent height
  const filledTechnologies: (TechnologyWithCategory | null)[] = [...currentTechnologies];
  while (filledTechnologies.length < ITEMS_PER_PAGE) {
    filledTechnologies.push(null);
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Commercial':
        return { text: 'Commercial Use', icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />, bgClass: 'bg-blue-100', textClass: 'text-blue-800', borderClass: 'border-blue-300' };
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

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: '340px 1fr' }}>
      {/* Left side - Chart */}
      <div className="flex flex-col border border-gray-300 rounded-lg bg-white overflow-hidden shadow-md max-h-[360px]" style={{ width: '340px', minWidth: '340px', maxWidth: '340px' }}>
        <div className="px-3 h-8 border-b border-gray-300 bg-gradient-to-b from-gray-100 to-gray-50 flex items-center flex-shrink-0">
          <h3 className="font-semibold text-[10px] text-gray-800 uppercase tracking-wider">
            Process TRL Distribution
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-2 overflow-hidden bg-gradient-to-br from-white to-gray-50/30">
          <img
            src={trlChartLeft}
            alt="TRL Distribution"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
      </div>
      
      {/* Table with Pagination */}
      <div className="flex flex-col border border-gray-300 rounded-lg bg-white shadow-md max-h-[360px]">
        <div className="overflow-auto bg-white flex-1">
          <Table className="table-fixed">
            <TableHeader className="sticky top-0 bg-gradient-to-b from-gray-100 to-gray-50 z-10">
              <TableRow className="border-b border-gray-300">
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-left w-[25%]">Process</TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-left w-[10%]">TRL</TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-left w-[43%]">Description</TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-gray-800 uppercase tracking-wider text-center w-[14%]">Manufacturers</TableHead>
                <TableHead className="h-8 py-1.5 w-[8%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filledTechnologies.map((tech, index) => (
                <TableRow key={`tech-${index}`} className="bg-white hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100 h-[50px] box-border">
                  {tech ? (
                    <>
                      <TableCell className="px-2 bg-white text-gray-900 h-[50px] box-border align-middle">
                        <div className="flex flex-col justify-center h-full gap-0.5">
                          <span className="text-[9px] uppercase tracking-wide text-gray-500 font-medium leading-[1.2]">{tech.category}</span>
                          <span className="text-xs font-semibold text-gray-900 truncate leading-[1.2]">
                            {tech.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 bg-white text-gray-700 text-left font-medium h-[50px] box-border align-middle">
                        <span className={`inline-block px-2 py-0.5 rounded ${getTRLColor(tech.trl)} text-white font-semibold text-[9px] whitespace-nowrap`}>
                          TRL {(() => {
                            const trlStr = tech.trl.replace('TRL ', '');
                            const numbers = trlStr.split('-').map(n => parseInt(n.trim()));
                            return numbers.length > 1 ? Math.max(...numbers) : trlStr;
                          })()}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 bg-white text-gray-600 text-left h-[50px] box-border align-middle">
                        <div className="line-clamp-2 leading-[1.2] text-xs">{tech.description}</div>
                      </TableCell>
                      <TableCell className="px-2 bg-white text-center h-[50px] box-border align-middle">
                        <span className="text-xs font-semibold text-primary">
                          {Math.floor(Math.random() * 6) + 1}
                        </span>
                      </TableCell>
                      <TableCell className="pl-1 pr-2 bg-white h-[50px] box-border align-middle">
                        <div className="flex items-center justify-start h-full">
                          <button className="flex items-center gap-0.5 bg-gray-100 hover:bg-gray-200 rounded px-1 py-0.5 transition-colors">
                            <List className="w-2.5 h-2.5 text-gray-600" />
                            <span className="text-[9px] font-medium text-gray-600">4</span>
                          </button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="px-2 bg-white h-[50px] box-border">&nbsp;</TableCell>
                      <TableCell className="px-2 bg-white h-[50px] box-border">&nbsp;</TableCell>
                      <TableCell className="px-2 bg-white h-[50px] box-border">&nbsp;</TableCell>
                      <TableCell className="px-2 bg-white h-[50px] box-border">&nbsp;</TableCell>
                      <TableCell className="px-2 bg-white h-[50px] box-border">&nbsp;</TableCell>
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
            Showing {startIndex + 1}-{Math.min(endIndex, allTechnologies.length)} of {allTechnologies.length} technologies
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-6 w-6 p-0 hover:bg-blue-50 transition-colors border-gray-300"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};