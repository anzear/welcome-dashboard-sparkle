import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Globe, MapPin, Calendar, Users, DollarSign, X, Bell, BellOff, FileText, Beaker, FolderOpen, Mail, Phone, ListChecks, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
interface CompanyDetailModalProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTracked?: boolean;
  onToggleTracking?: (companyId: string) => void;
}
export const CompanyDetailModal = ({
  company,
  open,
  onOpenChange,
  isTracked = false,
  onToggleTracking
}: CompanyDetailModalProps) => {
  const [showActivityDetails, setShowActivityDetails] = useState(false);
  if (!company) return null;

  // Generate mock contact info if not available
  const mockContactEmail = company.contact_email || `contact@${company.company_name.toLowerCase().replace(/\s+/g, '')}.com`;
  const mockContactPhone = company.contact_phone || `+1 ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;

  // Mock data for patents, projects, and publications
  const mockPatents = Array.from({
    length: company.patents_count || 0
  }, (_, i) => ({
    id: i + 1,
    title: `Patent ${i + 1}: Lactic Acid ${['Fermentation Process', 'Purification Method', 'PLA Polymerization', 'Optical Purity Enhancement', 'Continuous Production'][i % 5]}`,
    date: `${2020 + Math.floor(i / 3)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    status: ['Granted', 'Pending', 'Filed'][i % 3]
  }));
  const mockProjects = Array.from({
    length: company.projects_count || 0
  }, (_, i) => ({
    id: i + 1,
    title: `Project ${i + 1}: ${['Bio-based Lactic Acid Scale-Up', 'PLA Feedstock Optimization', 'Fermentation Yield Improvement', 'Downstream Purification R&D', 'Circular Lactic Acid Pathway'][i % 5]}`,
    date: `${2018 + Math.floor(i / 5)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    status: ['Active', 'Completed', 'In Progress'][i % 3]
  }));
  const mockPublications = Array.from({
    length: company.publications_count || 0
  }, (_, i) => ({
    id: i + 1,
    title: `Publication ${i + 1}: ${['Advances in Lactic Acid Fermentation', 'PLA Bioplastics from Renewable Feedstock', 'Optically Pure L-Lactic Acid Production', 'Cost-effective Lactic Acid Recovery'][i % 4]}`,
    date: `${2019 + Math.floor(i / 2)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    journal: ['Green Chemistry', 'Biotechnology & Bioengineering', 'Journal of Chemical Technology', 'Bioresource Technology'][i % 4]
  }));

  // Get company type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feedstock':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'technology':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'product':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'market_uptaker':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'feedstock':
        return 'Potential Feedstock Supplier';
      case 'technology':
        return 'Technology Provider';
      case 'product':
        return 'Product Producer';
      case 'market_uptaker':
        return 'Market Off-taker';
      default:
        return 'Company';
    }
  };
  const getCompanySize = (revenue?: string) => {
    if (!revenue) return 'Unknown';

    // Extract numeric values from revenue string (e.g., "$10M - $25M")
    const numbers = revenue.match(/\d+/g);
    if (!numbers || numbers.length === 0) return 'Unknown';

    // Get the average or first number and check if it's in millions or billions
    const value = parseInt(numbers[0]);
    const isBillion = revenue.toLowerCase().includes('b');
    const actualValue = isBillion ? value * 1000 : value;
    if (actualValue < 10) return 'SME';
    if (actualValue < 50) return 'Medium';
    if (actualValue < 500) return 'Large';
    return 'Enterprise';
  };
  const getMatchReason = (type: string, sector: string, application: string) => {
    switch (type) {
      case 'feedstock':
        return `Supplies fermentable sugars via ${application}, a key feedstock for lactic acid fermentation. Strong ${sector} capabilities make them a reliable upstream partner.`;
      case 'technology':
        return `Provides ${application} solutions critical for efficient lactic acid production. Their ${sector} expertise enables high-yield, optically pure lactic acid conversion.`;
      case 'product':
        return `Produces lactic acid through ${application}, serving PLA bioplastics and food-grade markets. Established ${sector} operations with proven commercial scale.`;
      case 'market_uptaker':
        return `Utilizes lactic acid for ${application} in their ${sector} operations. Represents a high-value downstream demand channel for bio-based lactic acid.`;
      default:
        return `This company operates in ${sector} with focus on ${application}.`;
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0">
        {/* Header */}
        <DialogHeader className="border-b px-3 py-2.5 space-y-0">
          <DialogTitle className="flex items-center gap-1.5 text-sm font-semibold">
            {company.entity_type === 'company' ? <Building2 className="h-3.5 w-3.5 text-gray-600 flex-shrink-0" /> : <Folder className="h-3.5 w-3.5 text-gray-600 flex-shrink-0" />}
            {company.company_name}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-3 py-3 space-y-3 bg-white max-h-[70vh] overflow-y-auto">
          
          {/* Company/Project Info Section */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {/* For Projects: Show Scale */}
            {company.entity_type === 'project' && <>
                <div className="flex flex-col">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wide mb-0.5">Scale</p>
                  <div className="flex items-center gap-1">
                    <Folder className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px]">{company.scale || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wide mb-0.5">Country</p>
                  <p className="text-[10px]">{company.country}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wide mb-0.5">Source</p>
                  <a href={company.source || '#'} target="_blank" rel="noopener noreferrer" className="text-[10px] hover:underline break-all text-muted-foreground">
                    {company.source || 'N/A'}
                  </a>
                </div>

                <div className="flex flex-col">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wide mb-0.5">Partners</p>
                  {company.partners ? <div className="flex flex-col gap-0.5">
                      {company.partners.split(',').map((partner, index) => <p key={index} className="text-[10px]">{partner.trim()}</p>)}
                    </div> : <p className="text-[10px]">N/A</p>}
                </div>
              </>}

            {/* For Companies: Show original fields */}
            {company.entity_type === 'company' && <>
                {company.annual_revenue && <div className="flex flex-col">
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wide mb-0.5">Size</p>
                    <p className="text-[10px]">{getCompanySize(company.annual_revenue)}</p>
                  </div>}

                {company.website && <div className="flex flex-col">
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wide mb-0.5">Website</p>
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-[10px] hover:underline break-all text-primary">
                      {company.website}
                    </a>
                  </div>}

                {(company.contact_phone || mockContactPhone) && <div className="flex flex-col">
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wide mb-0.5">Phone</p>
                    <a href={`tel:${mockContactPhone}`} className="text-[10px] hover:underline text-primary">
                      {mockContactPhone}
                    </a>
                  </div>}

                {(company.contact_email || mockContactEmail) && <div className="flex flex-col">
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wide mb-0.5">Email</p>
                    <a href={`mailto:${mockContactEmail}`} className="text-[10px] hover:underline break-all text-primary">
                      {mockContactEmail}
                    </a>
                  </div>}

                <div className="flex flex-col">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wide mb-0.5">Address</p>
                  <p className="text-[10px]">
                    Dunajska 59, Ljubljana, Slovenia, 1000
                  </p>
                </div>

                <div />
              </>}
          </div>


          {/* Supporting Evidence Section */}
          <div className={`p-2.5 rounded-lg border ${company.entity_type === 'project' ? 'bg-gray-50 border-gray-200' : company.company_type === 'feedstock' ? 'bg-green-50 border-green-200' : company.company_type === 'technology' ? 'bg-blue-50 border-blue-200' : company.company_type === 'product' ? 'bg-purple-50 border-purple-200' : 'bg-orange-50 border-orange-200'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Supporting Evidence</h3>
              <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-muted/50 border border-border text-muted-foreground">
                <FileText className="w-2.5 h-2.5" />
                <span className="text-[9px] font-medium">3</span>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mb-2 italic">
              Selected for lactic acid value chain due to strong {company.application} capabilities in {company.country} with proven {company.sector} track record.
            </p>
            <div className="space-y-1">
              <div className="bg-background/80 rounded px-2 py-1.5 border border-border/40 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] font-medium text-foreground truncate">
                    {company.entity_type === 'project' ? `${company.company_name} Achieves Lactic Acid Scale-Up Milestone` : `${company.company_name} Expands Lactic Acid Capacity in ${company.country}`}
                  </h4>
                  <p className="text-[9px] text-muted-foreground truncate">
                    {company.entity_type === 'project' ? `Pilot results show high-purity L-lactic acid output via ${company.application}.` : `New fermentation facility targeting 50 kta lactic acid production.`}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5 gap-0.5 flex-shrink-0" onClick={() => window.open(company.website || 'https://example.com', '_blank')}>
                  <Globe className="h-2.5 w-2.5" />
                  View
                </Button>
              </div>
              <div className="bg-background/80 rounded px-2 py-1.5 border border-border/40 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] font-medium text-foreground truncate">Lactic Acid via {company.sector}: {company.company_name} Case Study</h4>
                  <p className="text-[9px] text-muted-foreground truncate">Demonstrated cost-competitive {company.application} with 99%+ optical purity.</p>
                </div>
                <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5 gap-0.5 flex-shrink-0" onClick={() => window.open(company.website || 'https://example.com', '_blank')}>
                  <Globe className="h-2.5 w-2.5" />
                  View
                </Button>
              </div>
              <div className="bg-background/80 rounded px-2 py-1.5 border border-border/40 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] font-medium text-foreground truncate">
                    {company.entity_type === 'project' ? `EU Horizon Funding Backs ${company.company_name} for PLA Feedstock` : `${company.company_name} Signs Offtake for Bio-based Lactic Acid`}
                  </h4>
                  <p className="text-[9px] text-muted-foreground truncate">
                    {company.entity_type === 'project' ? `€12M grant for sustainable lactic acid pathway development.` : `Multi-year supply agreement for food-grade and PLA-grade lactic acid.`}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5 gap-0.5 flex-shrink-0" onClick={() => window.open(company.website || 'https://example.com', '_blank')}>
                  <Globe className="h-2.5 w-2.5" />
                  View
                </Button>
              </div>
            </div>
          </div>


        </div>
      </DialogContent>
    </Dialog>;
};