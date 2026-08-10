import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, ChevronLeft, ChevronRight, Bookmark, ChevronRight as ChevronRightIcon, CheckCircle, Building2, Folder } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyDetailModal } from "@/components/CompanyDetailModal";
import { CompaniesMap } from "@/components/CompaniesMap";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import React from "react";

interface Company {
  id: string;
  company_name: string;
  company_type: string;
  entity_type: 'company' | 'project';
  country: string;
  sector: string;
  application: string;
  state: string;
  fit: number;
  website?: string;
  headquarters?: string;
  address?: string;
  founded?: number;
  employee_range?: string;
  annual_revenue?: string;
  description?: string;
  patents_count?: number;
  projects_count?: number;
  publications_count?: number;
  contact_email?: string;
  contact_phone?: string;
  // Project-specific fields
  scale?: 'Industrial' | 'Pilot' | 'N/A';
  source?: string;
  partners?: string;
}

const MarketActivityReview = () => {
  const { category, topic } = useParams<{ category: string; topic: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get passed state
  const { savedCompanies: savedCompanyIds = [], companies: allCompanies = [], pathwayNumber } = location.state || {};
  
  const [savedCompanies, setSavedCompanies] = useState<Set<string>>(new Set(savedCompanyIds));
  const [companies] = useState<Company[]>(allCompanies);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trackedCompanies, setTrackedCompanies] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>('feedstock');

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const handleSaveCompany = (companyId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSavedCompanies(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      
      return newSet;
    });
  };

  const handleBackToEditing = () => {
    navigate(`/landscape/${category}/${topic}/market-activity`, {
      state: { 
        savedCompanies: Array.from(savedCompanies),
        pathwayNumber 
      }
    });
  };

  const handleFinalise = () => {
    navigate(`/landscape/${category}/${topic}/value-chain/pathways/${pathwayNumber || 1}`);
  };

  const getAllSavedCompanies = () => {
    return companies.filter(company => savedCompanies.has(company.id));
  };

  const getSavedCompaniesByType = (type: string) => {
    if (type === 'all') return getAllSavedCompanies();
    if (type === 'projects') {
      return companies.filter(company => savedCompanies.has(company.id) && company.entity_type === 'project');
    }
    return companies.filter(company => savedCompanies.has(company.id) && company.company_type === type && company.entity_type === 'company');
  };

  const getTotalSavedCount = () => {
    return savedCompanies.size;
  };

  const getCountByType = (type: string) => {
    if (type === 'all') return savedCompanies.size;
    if (type === 'projects') {
      return companies.filter(company => savedCompanies.has(company.id) && company.entity_type === 'project').length;
    }
    return companies.filter(company => savedCompanies.has(company.id) && company.company_type === type && company.entity_type === 'company').length;
  };

  const getCompanySize = (revenue?: string) => {
    if (!revenue) return 'Unknown';
    
    const numbers = revenue.match(/\d+/g);
    if (!numbers || numbers.length === 0) return 'Unknown';
    
    const value = parseInt(numbers[0]);
    const isBillion = revenue.toLowerCase().includes('b');
    const actualValue = isBillion ? value * 1000 : value;
    
    if (actualValue < 10) return 'SME';
    if (actualValue < 50) return 'Medium';
    if (actualValue < 500) return 'Large';
    return 'Enterprise';
  };

  const getCategoryLabel = (type: string) => {
    switch(type) {
      case 'feedstock': return 'Feedstock';
      case 'technology': return 'Technology';
      case 'product': return 'Product';
      case 'market_uptaker': return 'Market Off-taker';
      default: return type;
    }
  };

  const SavedCompaniesTable = ({ companyType }: { companyType: string }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const savedCompaniesList = getSavedCompaniesByType(companyType);

    // Calculate pagination
    const totalPages = Math.max(1, Math.ceil(savedCompaniesList.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCompanies = savedCompaniesList.slice(startIndex, endIndex);

    // Reset to page 1 when company type or items per page changes
    useEffect(() => {
      setCurrentPage(1);
    }, [companyType, itemsPerPage]);

    return (
      <div className="flex flex-col h-full min-h-0 border border-border/60 rounded-lg bg-card shadow-sm overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Table className="table-fixed w-full">
            <colgroup>
              <col style={{ width: '80px' }} />
              <col style={{ width: 'auto' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '60px' }} />
            </colgroup>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow className="border-b border-border">
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-muted-foreground uppercase tracking-widest text-center">Save</TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-muted-foreground uppercase tracking-widest text-left">
                  {companyType === 'projects' ? 'Project Name' : 'Company Name'}
                </TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-muted-foreground uppercase tracking-widest text-left">Country</TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-muted-foreground uppercase tracking-widest text-left">
                  {companyType === 'projects' ? 'Scale' : 'Size'}
                </TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-muted-foreground uppercase tracking-widest text-center">Fit Score</TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-muted-foreground uppercase tracking-widest text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savedCompaniesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[10px] text-muted-foreground">
                    No saved companies
                  </TableCell>
                </TableRow>
              ) : (
                currentCompanies.map((company) => {
                  const companyType = company.company_type;
                  
                  return (
                    <TableRow key={company.id} className="hover:bg-muted/20 transition-colors duration-200 border-b border-border/30 last:border-0">
                      <TableCell className="text-center py-2">
                        <button
                          onClick={(e) => handleSaveCompany(company.id, e)}
                          className="p-0 bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
                          title={savedCompanies.has(company.id) ? 'Remove from saved' : 'Save company'}
                        >
                          <Bookmark className={`w-4 h-4 ${savedCompanies.has(company.id) ? 'fill-green-600 text-green-600' : 'text-muted-foreground'}`} />
                        </button>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-semibold text-foreground">{company.company_name}</span>
                          {company.entity_type !== 'project' && (
                            <div className="flex gap-1 items-center text-[10px] whitespace-nowrap">
                              <span className="text-muted-foreground font-medium">{company.sector}</span>
                              <ChevronRightIcon className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                              <span className="text-muted-foreground/70">{company.application}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] py-2 text-muted-foreground">{company.country}</TableCell>
                      <TableCell className="text-[10px] py-2 text-muted-foreground">
                        {companyType === 'projects' ? (company.scale === 'N/A' ? 'Unknown' : company.scale || 'Unknown') : getCompanySize(company.annual_revenue)}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <Badge 
                          variant="outline"
                          className={
                            company.fit >= 90 
                              ? companyType === 'feedstock'
                                ? 'bg-green-50 text-green-700 border-green-300 px-2.5 py-0.5 rounded-md font-semibold shadow-sm text-[10px]'
                                : companyType === 'technology'
                                ? 'bg-blue-50 text-blue-700 border-blue-300 px-2.5 py-0.5 rounded-md font-semibold shadow-sm text-[10px]'
                                : companyType === 'product'
                                ? 'bg-purple-50 text-purple-700 border-purple-300 px-2.5 py-0.5 rounded-md font-semibold shadow-sm text-[10px]'
                                : companyType === 'market_uptaker'
                                ? 'bg-orange-50 text-orange-700 border-orange-300 px-2.5 py-0.5 rounded-md font-semibold shadow-sm text-[10px]'
                                : 'bg-muted text-foreground border-border px-2.5 py-0.5 rounded-md font-semibold shadow-sm text-[10px]'
                              : 'bg-muted text-muted-foreground border-border px-2.5 py-0.5 rounded-md font-medium shadow-sm text-[10px]'
                          }
                        >
                          {company.fit >= 90 ? 'Exact' : 'General'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCompanyClick(company)}
                          className="h-6 w-6 p-0 hover:bg-muted"
                        >
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/60 bg-muted/20 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
            {savedCompaniesList.length === 0 ? (
              <span>No companies saved</span>
            ) : (
              <>
                <span>Showing {startIndex + 1}</span>
                <span>-</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="h-5 w-[50px] text-[10px] border-border px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5" className="text-[10px]">5</SelectItem>
                    <SelectItem value="10" className="text-[10px]">10</SelectItem>
                    <SelectItem value="20" className="text-[10px]">20</SelectItem>
                    <SelectItem value="50" className="text-[10px]">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>of {savedCompaniesList.length} companies</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || savedCompaniesList.length === 0}
              className="h-6 w-6 p-0 border-border"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] text-muted-foreground min-w-[80px] text-center font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || savedCompaniesList.length === 0}
              className="h-6 w-6 p-0 border-border"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      <div className="p-4 pb-4 flex-1 min-h-0 overflow-hidden">
        <div className="max-w-full mx-auto h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleBackToEditing} className="gap-1.5 h-7 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
            <Button 
              variant="default" 
              size="sm"
              className="bg-foreground hover:bg-foreground/90 text-background transition-all shadow-sm hover:shadow-md px-6"
              onClick={handleFinalise}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalise
            </Button>
          </div>

          {/* Main Content Container */}
          <div className="relative flex-1 min-h-0">
            <Card className="bg-gradient-to-br from-card to-card/90 border border-border/40 shadow-lg backdrop-blur-sm h-full flex flex-col overflow-hidden">
              <CardContent className="px-6 pt-6 pb-4 flex flex-col overflow-hidden h-full">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg">
                <span className="text-lg font-bold text-foreground">2</span>
              </div>
              <h2 className="text-base font-bold text-foreground">
                Saved Candidates ({getTotalSavedCount()})
              </h2>
            </div>
            <p className="text-[9px] text-muted-foreground">
              Review and manage your saved candidates for potential partnerships and collaborations.
            </p>
          </div>
          
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-muted/30 p-1 rounded-lg">
                <TabsTrigger 
                  value="feedstock"
                  className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm transition-all"
                >
                  <span className="text-xs font-medium">Feedstock Providers ({getCountByType('feedstock')})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="technology"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all"
                >
                  <span className="text-xs font-medium">Technology Providers ({getCountByType('technology')})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="product"
                  className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm transition-all"
                >
                  <span className="text-xs font-medium">Product Producers ({getCountByType('product')})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="market_uptaker"
                  className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm transition-all"
                >
                  <span className="text-xs font-medium">Market Off-takers ({getCountByType('market_uptaker')})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="projects"
                  className="data-[state=active]:bg-muted data-[state=active]:text-foreground transition-all"
                >
                  <span className="text-xs font-medium">Projects ({getCountByType('projects')})</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {activeTab === 'projects' ? (
              <div className="flex-1 overflow-hidden">
                <SavedCompaniesTable companyType={activeTab} />
              </div>
            ) : (
              <div className="grid gap-4 items-stretch flex-1 overflow-hidden min-h-0 max-h-full" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                <div className="h-full overflow-hidden">
                  <SavedCompaniesTable companyType={activeTab} />
                </div>
                <div className="h-full overflow-hidden">
                  <CompaniesMap companies={getSavedCompaniesByType(activeTab)} savedCompanies={savedCompanies} useSavedView={true} />
                </div>
              </div>
            )}
          </div>
         </CardContent>
       </Card>
       </div>

       <CompanyDetailModal
         company={selectedCompany}
         open={isModalOpen}
         onOpenChange={setIsModalOpen}
         isTracked={selectedCompany ? trackedCompanies.has(selectedCompany.id) : false}
         onToggleTracking={(companyId) => {
           setTrackedCompanies(prev => {
             const newSet = new Set(prev);
             if (newSet.has(companyId)) {
               newSet.delete(companyId);
             } else {
               newSet.add(companyId);
             }
             return newSet;
           });
         }}
       />
        </div>
      </div>
    </div>
  );
};

export default MarketActivityReview;
