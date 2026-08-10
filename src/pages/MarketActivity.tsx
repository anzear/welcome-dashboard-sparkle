import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, ChevronLeft, ChevronRight, Plus, ChevronRight as ChevronRightIcon, Search, X, Bookmark, Filter, Bell, BellOff, ChevronDown, Building2, Folder, FolderKanban, StickyNote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyDetailModal } from "@/components/CompanyDetailModal";
import { CompaniesMap } from "@/components/CompaniesMap";
import { useState, useEffect, useMemo, useRef } from "react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const TAG_OPTIONS = [
  { value: 'very_interested', label: 'Very Interested', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'interested', label: 'Interested', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'neutral', label: 'Neutral', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-red-50 text-red-700 border-red-200' },
];
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
  producer_status?: 'Commercial' | 'Pilot' | 'Lab' | 'Research';
}
const MarketActivity = () => {
  const {
    category,
    topic
  } = useParams<{
    category: string;
    topic: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedCompanies, setSavedCompanies] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [trackedCompanies, setTrackedCompanies] = useState<Set<string>>(new Set());
  const [companyFilter, setCompanyFilter] = useState<string[]>(['all']);
  const [activeTab, setActiveTab] = useState<string>('suppliers');
  const [notesPopoverCompanyId, setNotesPopoverCompanyId] = useState<string | null>(null);
  const [noteTag, setNoteTag] = useState('neutral');
  const [noteText, setNoteText] = useState('');
  const [tableHoveredCompanyId, setTableHoveredCompanyId] = useState<string | null>(null);
  const [mapHoveredCompanyId, setMapHoveredCompanyId] = useState<string | null>(null);
  const mapHighlightedCompanyId = tableHoveredCompanyId ?? mapHoveredCompanyId;
  // Pagination state per company type, lifted up so the map can show only the current page
  const [tablePages, setTablePages] = useState<Record<string, { page: number; perPage: number }>>({});
  const getPagedCompanies = (companyType: string) => {
    const all = filterCompaniesByType(companyType);
    const { page = 1, perPage = 10 } = tablePages[companyType] || {};
    const start = (page - 1) * perPage;
    return all.slice(start, start + perPage);
  };

  const handleSaveNotes = async (company: Company) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to save notes');
      return;
    }
    // Ensure company is saved first
    if (!savedCompanies.has(company.id)) {
      setSavedCompanies(prev => new Set(prev).add(company.id));
    }
    await supabase.from('saved_companies').upsert({
      user_id: user.id,
      company_name: company.company_name,
      country: company.country,
      size: getCompanySize(company.annual_revenue),
      feedstock: company.application,
      sector: company.sector,
      topic_key: `${category}-${topic}`,
      category: company.company_type,
      tag: noteTag,
      notes: noteText,
    }, { onConflict: 'user_id,company_name,topic_key' });
    toast.success('Notes saved');
    setNotesPopoverCompanyId(null);
    setNoteTag('neutral');
    setNoteText('');
  };

  // Get context from navigation state (product/pathway info)
  const {
    productName,
    pathwayNumber,
    fromPathway,
    pathwayId: sourcePathwayId,
    savedCompanies: initialSavedCompanies
  } = (location.state as any) || {};

  // Initialize saved companies from navigation state if returning from review page
  useEffect(() => {
    if (initialSavedCompanies && Array.isArray(initialSavedCompanies)) {
      setSavedCompanies(new Set(initialSavedCompanies));
    }
  }, [initialSavedCompanies]);
  const decodedTopic = decodeURIComponent(topic || "");
  const displayContext = pathwayNumber ? `Pathway ${pathwayNumber}` : productName || decodedTopic;

  // Function to get company size from revenue
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

  // Generate comprehensive mock data
  const mockCompanies = useMemo(() => {
    const DATA_VERSION = 8; // Force regeneration
    const companies: Company[] = [];
    const countries = ['Germany', 'France', 'United Kingdom', 'Netherlands', 'Sweden', 'Switzerland', 'Italy', 'Spain', 'Poland', 'Denmark', 'Finland', 'Belgium', 'Austria', 'Norway', 'Ireland', 'Portugal', 'Czech Republic', 'Hungary', 'Greece', 'Romania'];
    const feedstockNames = ['CornBase Industries', 'SugarBeet Biomass', 'Cargill BioFeed', 'Starch Solutions Europe', 'GreenSugars GmbH', 'AgriStarch Corp', 'Beet Processing Ltd', 'Cassava BioResources', 'Wheat Glucose Systems', 'Dextrose Global', 'Molasses Biotech', 'Sucrose Enterprises', 'Glucose Feedstock Ltd', 'Cellulose Resources', 'Ligno Sugars International'];
    const techNames = ['Fermentation Dynamics', 'LactiPure Technologies', 'BioReactor Systems', 'NovaBio Catalysts', 'PureFerm Solutions', 'Membrane Separation Inc', 'Enzymatic Process Corp', 'Downstream Tech GmbH', 'ContinuousFerm Ltd', 'Crystallization Systems', 'pH Control Innovations', 'LacticFlow Engineering'];
    const productNames = ['NatureWorks LLC', 'Corbion Biochem', 'Galactic SA', 'Musashino Chemical', 'Purac Biochem', 'LacticChem Global', 'TotalEnergies Corbion', 'BioAmber Lactic', 'Henan Jindan', 'Jungbunzlauer AG'];
    const marketNames = ['Danone Bio-Packaging', 'BASF Bioplastics', 'Nestlé Sustainable Packaging', 'Tetra Pak Materials', 'NovaPack Solutions', 'PLA Fiber Industries', 'BioPharma Excipients', 'Cosmetic Actives International', 'Green Packaging Corp', 'Food Preservatives Ltd'];
    const feedstockSectors = ['Starch Processing', 'Sugar Beet Refining', 'Agricultural Processing', 'Glucose Production', 'Biomass Conversion', 'Carbohydrate Processing', 'Dextrose Manufacturing'];
    const techSectors = ['Fermentation Technology', 'Separation & Purification', 'Bioprocess Engineering', 'Enzyme Technology', 'Continuous Fermentation', 'Downstream Processing', 'Membrane Technology'];
    const productSectors = ['Lactic Acid Production', 'PLA Manufacturing', 'Lactide Synthesis', 'Bio-based Chemicals', 'Biochemical Manufacturing', 'Organic Acid Production'];
    const marketSectors = ['Bioplastics & PLA', 'Food Preservation', 'Pharmaceutical Excipients', 'Personal Care', 'Biodegradable Packaging', 'Textile Fibers', 'Industrial Solvents'];
    const feedstockApps = ['Corn Starch Hydrolysis', 'Sugar Beet Processing', 'Cassava Starch', 'Glucose Syrup Production', 'Dextrose from Wheat', 'Molasses Processing', 'Cellulosic Sugars', 'Sucrose Refining', 'Lignocellulosic Biomass'];
    const techApps = ['Lactic Acid Fermentation', 'Lactobacillus Optimization', 'Membrane Purification', 'Reactive Distillation', 'Continuous Fermentation', 'Crystallization & Recovery', 'Optical Purity Control'];
    const productApps = ['L-Lactic Acid Production', 'D-Lactic Acid Synthesis', 'PLA Polymerization', 'Lactide Manufacturing', 'Food-grade Lactic Acid', 'Technical-grade Lactic Acid'];
    const marketApps = ['PLA Bioplastics', 'Food Acidulant & Preservative', 'Pharmaceutical Formulations', 'Cosmetic pH Regulators', 'Biodegradable Packaging', 'Textile PLA Fibers'];

    // CRITICAL: First 10 projects across ALL categories must have Pilot/Industrial only
    const fixedScales: ('Pilot' | 'Industrial')[] = ['Pilot', 'Industrial', 'Pilot', 'Industrial', 'Pilot', 'Industrial', 'Pilot', 'Industrial', 'Pilot', 'Industrial'];
    let projectCount = 0;

    // Generate Feedstock Providers (120 companies)
    for (let i = 0; i < 120; i++) {
      const isProject = i < 10 ? true : Math.random() > 0.3;
      let scaleValue: 'Pilot' | 'Industrial' | 'N/A' = 'Pilot';
      if (isProject) {
        if (projectCount < 10) {
          scaleValue = fixedScales[projectCount];
        } else {
          scaleValue = ['Pilot', 'Industrial'][i % 2] as 'Pilot' | 'Industrial';
        }
        projectCount++;
      }
      companies.push({
        id: `feedstock-${i}-v${DATA_VERSION}`,
        company_type: 'feedstock',
        entity_type: isProject ? 'project' : 'company',
        company_name: i < feedstockNames.length ? feedstockNames[i] : `${feedstockNames[i % feedstockNames.length]} ${countries[i % countries.length].split(' ')[0]}`,
        country: countries[i % countries.length],
        sector: feedstockSectors[i % feedstockSectors.length],
        application: feedstockApps[i % feedstockApps.length],
        state: i % 10 === 0 ? 'Pending' : 'Active',
        fit: 70 + Math.floor(Math.random() * 30),
        website: isProject ? undefined : `https://feedstock${i}.com`,
        headquarters: isProject ? undefined : `${countries[i % countries.length]}`,
        address: isProject ? undefined : `${i * 10} Industrial Way`,
        founded: isProject ? undefined : 2000 + i % 25,
        employee_range: isProject ? undefined : ['10-50', '50-100', '100-200', '200-500', '500-1000', '1000-5000'][i % 6],
        annual_revenue: isProject ? undefined : ['$10M - $25M', '$25M - $50M', '$50M - $100M', '$100M - $250M', '$250M - $500M'][i % 5],
        description: isProject ? undefined : `Feedstock provider specializing in ${feedstockApps[i % feedstockApps.length]} for biochemical production.`,
        patents_count: isProject ? undefined : 11,
        projects_count: isProject ? undefined : 30,
        publications_count: isProject ? undefined : 3,
        scale: isProject ? scaleValue : undefined,
        source: isProject ? `https://project-source${i}.org/feedstock-proj` : undefined,
        partners: isProject ? 'Fraunhofer, Institute of Science, Italbiotec' : undefined
      });
    }

    // Generate Technology Providers (150 companies)
    for (let i = 0; i < 150; i++) {
      const isProject = i < 3 ? true : Math.random() > 0.3;
      let scaleValue: 'Pilot' | 'Industrial' | 'N/A' = 'Pilot';
      if (isProject) {
        if (projectCount < 10) {
          scaleValue = fixedScales[projectCount];
        } else {
          scaleValue = ['Pilot', 'Industrial'][i % 2] as 'Pilot' | 'Industrial';
        }
        projectCount++;
      }
      companies.push({
        id: `tech-${i}-v${DATA_VERSION}`,
        company_type: 'technology',
        entity_type: isProject ? 'project' : 'company',
        company_name: i < techNames.length ? techNames[i] : `${techNames[i % techNames.length]} ${countries[i % countries.length].split(' ')[0]}`,
        country: countries[i % countries.length],
        sector: techSectors[i % techSectors.length],
        application: techApps[i % techApps.length],
        state: i % 12 === 0 ? 'Pending' : 'Active',
        fit: 75 + Math.floor(Math.random() * 25),
        website: isProject ? undefined : `https://tech${i}.com`,
        headquarters: isProject ? undefined : `${countries[i % countries.length]}`,
        address: isProject ? undefined : `${i * 20} Innovation Blvd`,
        founded: isProject ? undefined : 2005 + i % 20,
        employee_range: isProject ? undefined : ['10-50', '50-100', '100-200', '200-500', '500-1000'][i % 5],
        annual_revenue: isProject ? undefined : ['$5M - $15M', '$15M - $25M', '$25M - $50M', '$50M - $100M', '$100M - $250M'][i % 5],
        description: isProject ? undefined : `Technology provider offering ${techApps[i % techApps.length]} solutions for bio-based chemical production.`,
        patents_count: isProject ? undefined : 11,
        projects_count: isProject ? undefined : 30,
        publications_count: isProject ? undefined : 3,
        scale: isProject ? scaleValue : undefined,
        source: isProject ? `https://project-source${i}.org/tech-proj` : undefined,
        partners: isProject ? 'Fraunhofer, Institute of Science, Italbiotec' : undefined
      });
    }

    // Generate Product Producers (130 companies)
    const producerStatuses: ('Commercial' | 'Pilot' | 'Lab' | 'Research')[] = ['Commercial', 'Pilot', 'Lab', 'Research'];
    for (let i = 0; i < 130; i++) {
      const isProject = i < 2 ? true : Math.random() > 0.3;
      let scaleValue: 'Pilot' | 'Industrial' | 'N/A' = 'Pilot';
      if (isProject) {
        if (projectCount < 10) {
          scaleValue = fixedScales[projectCount];
        } else {
          scaleValue = ['Industrial', 'Pilot'][i % 2] as 'Pilot' | 'Industrial';
        }
        projectCount++;
      }
      companies.push({
        id: `product-${i}-v${DATA_VERSION}`,
        company_type: 'product',
        entity_type: isProject ? 'project' : 'company',
        company_name: i < productNames.length ? productNames[i] : `${productNames[i % productNames.length]} ${countries[i % countries.length].split(' ')[0]}`,
        country: countries[i % countries.length],
        sector: productSectors[i % productSectors.length],
        application: productApps[i % productApps.length],
        state: i % 15 === 0 ? 'Pending' : 'Active',
        fit: 72 + Math.floor(Math.random() * 28),
        website: isProject ? undefined : `https://product${i}.com`,
        headquarters: isProject ? undefined : `${countries[i % countries.length]}`,
        address: isProject ? undefined : `${i * 30} Manufacturing Dr`,
        founded: isProject ? undefined : 2008 + i % 17,
        employee_range: isProject ? undefined : ['50-100', '100-200', '200-500', '500-1000', '1000-5000'][i % 5],
        annual_revenue: isProject ? undefined : ['$25M - $50M', '$50M - $100M', '$100M - $250M', '$250M - $500M', '$500M - $1B'][i % 5],
        description: isProject ? undefined : `Producer of ${productApps[i % productApps.length]} for various industrial applications.`,
        patents_count: isProject ? undefined : 11,
        projects_count: isProject ? undefined : 30,
        publications_count: isProject ? undefined : 3,
        scale: isProject ? scaleValue : undefined,
        source: isProject ? `https://project-source${i}.org/product-proj` : undefined,
        partners: isProject ? 'Fraunhofer, Institute of Science, Italbiotec' : undefined,
        producer_status: producerStatuses[i % 4]
      });
    }

    // Generate Market Off-takers (140 companies)
    for (let i = 0; i < 140; i++) {
      const isProject = i < 1 ? true : Math.random() > 0.3;
      let scaleValue: 'Pilot' | 'Industrial' | 'N/A' = 'Pilot';
      if (isProject) {
        if (projectCount < 10) {
          scaleValue = fixedScales[projectCount];
        } else {
          scaleValue = ['Pilot', 'Industrial'][i % 2] as 'Pilot' | 'Industrial';
        }
        projectCount++;
      }
      companies.push({
        id: `market-${i}-v${DATA_VERSION}`,
        company_type: 'market_uptaker',
        entity_type: isProject ? 'project' : 'company',
        company_name: i < marketNames.length ? marketNames[i] : `${marketNames[i % marketNames.length]} ${countries[i % countries.length].split(' ')[0]}`,
        country: countries[i % countries.length],
        sector: marketSectors[i % marketSectors.length],
        application: marketApps[i % marketApps.length],
        state: i % 20 === 0 ? 'Pending' : 'Active',
        fit: 68 + Math.floor(Math.random() * 32),
        website: isProject ? undefined : `https://market${i}.com`,
        headquarters: isProject ? undefined : `${countries[i % countries.length]}`,
        address: isProject ? undefined : `${i * 40} Commerce St`,
        founded: isProject ? undefined : 1995 + i % 30,
        employee_range: isProject ? undefined : ['100-200', '200-500', '500-1000', '1000-5000', '5000-10000'][i % 5],
        annual_revenue: isProject ? undefined : ['$100M - $250M', '$250M - $500M', '$500M - $1B', '$1B - $5B', '$5B - $10B'][i % 5],
        description: isProject ? undefined : `Market uptaker utilizing bio-based ${marketApps[i % marketApps.length]} in their product portfolio.`,
        patents_count: isProject ? undefined : 11,
        projects_count: isProject ? undefined : 30,
        publications_count: isProject ? undefined : 3,
        scale: isProject ? scaleValue : undefined,
        source: isProject ? `https://project-source${i}.org/market-proj` : undefined,
        partners: isProject ? 'Fraunhofer, Institute of Science, Italbiotec' : undefined
      });
    }
    console.log(`Generated ${companies.length} companies (version ${DATA_VERSION})`);
    const allProjects = companies.filter(c => c.entity_type === 'project');
    console.log(`Total projects: ${allProjects.length}`);
    console.log('First 10 project scales:', allProjects.slice(0, 10).map((p, i) => `${i}: ${p.scale}`).join(', '));
    return companies;
  }, []);
  useEffect(() => {
    // For demo purposes, use mock data directly
    // In production, you would fetch from Supabase
    setCompanies(mockCompanies);
    setLoading(false);
  }, [mockCompanies]);
  const handleBack = () => {
    if (fromPathway && sourcePathwayId) {
      navigate(`/landscape/${category}/${topic}/value-chain/pathways/${sourcePathwayId}`);
    } else {
      navigate(`/landscape/${category}/${topic}/value-chain`);
    }
  };
  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };
  const handleSaveCompany = async (companyId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const company = companies.find(c => c.id === companyId);
    const wasSaved = savedCompanies.has(companyId);
    
    setSavedCompanies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      return newSet;
    });

    // Persist to database
    if (!wasSaved && company) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('saved_companies').upsert({
          user_id: user.id,
          company_name: company.company_name,
          country: company.country,
          size: getCompanySize(company.annual_revenue),
          feedstock: company.application,
          sector: company.sector,
          topic_key: `${category}-${topic}`,
          category: company.company_type,
          tag: 'neutral',
          notes: '',
        }, { onConflict: 'user_id,company_name,topic_key' });
      }
    } else if (wasSaved) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('saved_companies')
          .delete()
          .eq('user_id', user.id)
          .eq('company_name', company?.company_name || '')
          .eq('topic_key', `${category}-${topic}`);
      }
    }
  };
  const handleSaveMappings = () => {
    // Navigate to review page with saved companies
    navigate(`/landscape/${category}/${topic}/market-activity/review`, {
      state: {
        savedCompanies: Array.from(savedCompanies),
        companies: companies,
        pathwayNumber: location.state?.pathwayNumber || 1
      }
    });
  };
  const handleFinalise = () => {
    // Navigate back to pathway detail page
    const pathwayNumber = location.state?.pathwayNumber || 1;
    navigate(`/landscape/${category}/${topic}/value-chain/pathways/${pathwayNumber}`);
  };
  const filterCompaniesByType = (type: string) => {
    let filtered = type === 'projects' ? companies.filter(company => company.entity_type === 'project') : companies.filter(company => company.company_type === type && company.entity_type === 'company');

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(company => company.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Apply country filter
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(company => company.country === selectedCountry);
    }

    // Apply size filter
    if (selectedSize !== 'all') {
      filtered = filtered.filter(company => getCompanySize(company.annual_revenue) === selectedSize);
    }

    // Apply company filter (online/offline/projects)
    if (!companyFilter.includes('all')) {
      if (companyFilter.includes('online')) {
        const onlineFiltered = filtered.filter(company => company.website);
        if (companyFilter.length === 1) {
          filtered = onlineFiltered;
        } else {
          // Multiple filters selected - combine results
          let combinedFiltered = onlineFiltered;
          if (companyFilter.includes('offline')) {
            combinedFiltered = [...combinedFiltered, ...filtered.filter(company => !company.website)];
          }
          if (companyFilter.includes('projects')) {
            combinedFiltered = [...combinedFiltered, ...filtered.filter(company => (company.projects_count || 0) > 0)];
          }
          // Remove duplicates
          filtered = Array.from(new Map(combinedFiltered.map(c => [c.id, c])).values());
        }
      } else if (companyFilter.includes('offline')) {
        const offlineFiltered = filtered.filter(company => !company.website);
        if (companyFilter.length === 1) {
          filtered = offlineFiltered;
        } else {
          let combinedFiltered = offlineFiltered;
          if (companyFilter.includes('projects')) {
            combinedFiltered = [...combinedFiltered, ...filtered.filter(company => (company.projects_count || 0) > 0)];
          }
          filtered = Array.from(new Map(combinedFiltered.map(c => [c.id, c])).values());
        }
      } else if (companyFilter.includes('projects')) {
        filtered = filtered.filter(company => (company.projects_count || 0) > 0);
      }
    }

    // Sort by fit score
    filtered.sort((a, b) => {
      const aIsExact = a.fit >= 90;
      const bIsExact = b.fit >= 90;
      if (aIsExact && !bIsExact) return -1;
      if (!aIsExact && bIsExact) return 1;

      return b.fit - a.fit;
    });
    return filtered;
  };
  const getSavedCountByType = (type: string) => {
    if (type === 'projects') {
      return companies.filter(company => company.entity_type === 'project' && savedCompanies.has(company.id)).length;
    }
    return companies.filter(company => company.company_type === type && company.entity_type === 'company' && savedCompanies.has(company.id)).length;
  };
  const getAllSavedCompanies = (filterType?: string) => {
    if (!filterType) return companies.filter(company => savedCompanies.has(company.id));
    if (filterType === 'projects') return companies.filter(company => company.entity_type === 'project' && savedCompanies.has(company.id));
    return companies.filter(company => company.company_type === filterType && company.entity_type === 'company' && savedCompanies.has(company.id));
  };
  const getTotalSavedCount = () => {
    return savedCompanies.size;
  };
  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'feedstock':
        return 'Feedstock';
      case 'technology':
        return 'Technology';
      case 'product':
        return 'Product';
      case 'market_uptaker':
        return 'Market Off-taker';
      default:
        return type;
    }
  };

  // Get unique countries and size categories from all companies
  const uniqueCountries = useMemo(() => {
    return Array.from(new Set(companies.map(c => c.country))).sort();
  }, [companies]);
  const uniqueSizes = ['Startups', 'SME', 'Medium', 'Large', 'Enterprise'];
  const SavedCompaniesTable = ({ companyType }: { companyType?: string }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const savedCompaniesList = getAllSavedCompanies(companyType);

    // Calculate pagination
    const totalPages = Math.max(1, Math.ceil(savedCompaniesList.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCompanies = savedCompaniesList.slice(startIndex, endIndex);
    return <div className="flex flex-col border border-border/60 rounded-lg bg-card shadow-sm">
        <div className="overflow-auto bg-card flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow className="border-b border-border">
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-muted-foreground uppercase tracking-widest text-center w-[60px]">Save</TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-muted-foreground uppercase tracking-widest text-left">Company Name</TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-muted-foreground uppercase tracking-widest text-left">Country</TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-muted-foreground uppercase tracking-widest text-left">Size</TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-muted-foreground uppercase tracking-widest text-left">Specialization</TableHead>
                <TableHead className="font-semibold text-[10px] h-8 py-1.5 text-muted-foreground uppercase tracking-widest text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savedCompaniesList.length === 0 ? <TableRow>
                  <TableCell colSpan={6} className="py-12">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
                        <Bookmark className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-medium text-foreground mb-1">No saved companies yet</p>
                        <p className="text-[10px] text-muted-foreground">Click the + button next to companies above to save them for later review</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow> : currentCompanies.map(company => {
              const categoryColor = company.company_type === 'feedstock' ? 'bg-green-100 text-green-700' : company.company_type === 'technology' ? 'bg-blue-100 text-blue-700' : company.company_type === 'product' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700';
              return <React.Fragment key={company.id}>
                      <TableRow className="hover:bg-muted/20 transition-colors duration-200 border-b-0">
                      <TableCell className="text-center py-3 w-[60px]" rowSpan={2}>
                        <button onClick={e => handleSaveCompany(company.id, e)} className="p-0 bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity" title={savedCompanies.has(company.id) ? 'Remove from saved' : 'Save company'}>
                          <Bookmark className={`w-4 h-4 ${savedCompanies.has(company.id) ? 'fill-green-600 text-green-600' : 'text-muted-foreground'}`} />
                        </button>
                      </TableCell>
                      <TableCell className="py-1 pb-0">
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[9px] font-medium ${company.company_type === 'feedstock' ? 'text-green-700' : company.company_type === 'technology' ? 'text-blue-700' : company.company_type === 'product' ? 'text-purple-700' : 'text-orange-700'}`}>
                            {getCategoryLabel(company.company_type)}
                          </span>
                          <span className="text-[11px] font-semibold text-foreground">{company.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] py-1 pb-0 bg-white text-muted-foreground" rowSpan={2}>{company.country}</TableCell>
                      <TableCell className="text-[10px] py-1 pb-0 bg-white text-muted-foreground" rowSpan={2}>{getCompanySize(company.annual_revenue)}</TableCell>
                      <TableCell className="text-[10px] py-1 pb-0 bg-white text-muted-foreground" rowSpan={2}>
                        {company.application}
                      </TableCell>
                  <TableCell className="text-center py-1 pb-0" rowSpan={2}>
                        <div className="flex items-center justify-center gap-0.5">
                          <Popover open={notesPopoverCompanyId === company.id} onOpenChange={(open) => {
                            if (open) {
                              setNotesPopoverCompanyId(company.id);
                              setNoteTag('neutral');
                              setNoteText('');
                            } else {
                              setNotesPopoverCompanyId(null);
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted" title="Add notes & tag">
                                <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2.5" side="left" align="start">
                              <div className="space-y-2">
                                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Rating</p>
                                <Select value={noteTag} onValueChange={setNoteTag}>
                                  <SelectTrigger className="h-6 text-[10px]"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {TAG_OPTIONS.map(t => (
                                      <SelectItem key={t.value} value={t.value} className="text-[10px]">{t.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Notes</p>
                                <Textarea
                                  placeholder="Add evaluation notes..."
                                  value={noteText}
                                  onChange={e => setNoteText(e.target.value)}
                                  className="text-[10px] min-h-[50px] py-1"
                                />
                                <Button size="sm" className="w-full h-6 text-[9px]" onClick={() => handleSaveNotes(company)}>
                                  Save
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button variant="ghost" size="sm" onClick={() => handleCompanyClick(company)} className="h-6 w-6 p-0 hover:bg-muted">
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/20 transition-colors duration-200 border-b border-border/30 last:border-0">
                      <TableCell className="py-1 pt-0">
                        <div className="flex gap-1 items-center text-[10px]">
                          <span className="text-muted-foreground font-medium">{company.sector}</span>
                          <ChevronRightIcon className="h-3 w-3 text-muted-foreground/50" />
                          <span className="text-muted-foreground/70">{company.application}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                    </React.Fragment>;
            })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/60 bg-muted/20">
          <div className="text-[10px] text-muted-foreground font-medium">
            {savedCompaniesList.length === 0 ? 'No companies saved' : `Showing ${startIndex + 1}-${Math.min(endIndex, savedCompaniesList.length)} of ${savedCompaniesList.length} companies`}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || savedCompaniesList.length === 0} className="h-6 w-6 p-0 border-border">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] text-muted-foreground min-w-[80px] text-center font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || savedCompaniesList.length === 0} className="h-6 w-6 p-0 border-border">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>;
  };
  const renderCompanyTable = (companyType: string) => {
    const pageState = tablePages[companyType] || { page: 1, perPage: 10 };
    const currentPage = pageState.page;
    const itemsPerPage = pageState.perPage;
    const setCurrentPage = (updater: number | ((prev: number) => number)) => {
      setTablePages(prev => {
        const cur = prev[companyType] || { page: 1, perPage: 10 };
        const next = typeof updater === 'function' ? (updater as (p: number) => number)(cur.page) : updater;
        return { ...prev, [companyType]: { ...cur, page: next } };
      });
    };
    const setItemsPerPage = (n: number) => {
      setTablePages(prev => ({ ...prev, [companyType]: { page: 1, perPage: n } }));
    };
    const filteredCompanies = filterCompaniesByType(companyType);

    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCompanies = filteredCompanies.slice(startIndex, endIndex);

    if (loading) {
      return <div className="flex items-center justify-center h-full border border-border rounded-lg bg-card">
          <p className="text-xs text-muted-foreground">Loading companies...</p>
        </div>;
    }
    if (filteredCompanies.length === 0) {
      return <div className="flex items-center justify-center h-full border border-border rounded-lg bg-card">
          <p className="text-xs text-muted-foreground">No companies found for this category.</p>
        </div>;
    }
    return <div className="flex flex-col h-full min-h-0 border border-border/60 rounded-lg bg-card shadow-sm overflow-hidden" onMouseLeave={() => setTableHoveredCompanyId(null)}>
        <div className="overflow-y-auto flex-1 min-h-0">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow className="border-b border-border">
                <TableHead className="font-semibold text-[8px] h-7 py-1 text-muted-foreground uppercase tracking-widest text-center w-[60px]">Save</TableHead>
                <TableHead className="font-semibold text-[8px] h-7 py-1 text-muted-foreground uppercase tracking-widest text-left">
                  {companyType === 'projects' ? 'Project Name' : 'Company Name'}
                </TableHead>
                <TableHead className="font-semibold text-[8px] h-7 py-1 text-muted-foreground uppercase tracking-widest text-left w-[120px]">Country</TableHead>
                <TableHead className="font-semibold text-[8px] h-7 py-1 text-muted-foreground uppercase tracking-widest text-left w-[100px]">
                  {companyType === 'projects' ? 'Scale' : 'Size'}
                </TableHead>
                {activeTab === 'producers' && (
                  <TableHead className="font-semibold text-[8px] h-7 py-1 text-muted-foreground uppercase tracking-widest text-left w-[100px]">Scale</TableHead>
                )}
                {activeTab !== 'producers' && (
                  <TableHead className="font-semibold text-[8px] h-7 py-1 text-muted-foreground uppercase tracking-widest text-left w-[160px]">
                    {activeTab === 'suppliers' ? 'Feedstock' : activeTab === 'offtakers' ? 'Application' : 'Sector'}
                  </TableHead>
                )}
                <TableHead className="font-semibold text-[8px] h-7 py-1 text-muted-foreground uppercase tracking-widest text-center w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 ? <TableRow>
                   <TableCell colSpan={activeTab === 'producers' ? 6 : activeTab !== 'producers' ? 6 : 5} className="text-center py-6 text-[10px] text-muted-foreground">
                    No companies found
                  </TableCell>
                </TableRow> : currentCompanies.map(company => {
              const companyType = company.company_type;
              return <TableRow key={company.id} className={`transition-colors border-b border-border/30 last:border-0 ${tableHoveredCompanyId === company.id ? 'bg-primary/10' : 'hover:bg-muted/20'}`} onMouseEnter={() => setTableHoveredCompanyId(company.id)} onMouseLeave={() => setTableHoveredCompanyId(null)}>
                       <TableCell className="text-center py-1.5 w-[60px]">
                        <button type="button" onClick={e => handleSaveCompany(company.id, e)} className="p-0 bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity" title={savedCompanies.has(company.id) ? 'Remove from saved' : 'Save company'}>
                          <Bookmark className={`w-4 h-4 ${savedCompanies.has(company.id) ? 'fill-green-600 text-green-600' : 'text-muted-foreground'}`} />
                        </button>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <span className="text-[10px] font-semibold text-foreground">{company.company_name}</span>
                      </TableCell>
                      <TableCell className="text-[10px] py-1.5 text-muted-foreground w-[120px]">{company.country}</TableCell>
                      <TableCell className="text-[10px] py-1.5 text-muted-foreground w-[100px]">
                        {companyType === 'projects' ? company.scale === 'N/A' ? 'Unknown' : company.scale || 'Unknown' : getCompanySize(company.annual_revenue)}
                      </TableCell>
                      {activeTab === 'producers' && (
                        <TableCell className="py-1.5 w-[100px]">
                          <Badge variant="outline" className={`text-[8px] px-1.5 py-0 font-medium ${
                            company.producer_status === 'Commercial' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            company.producer_status === 'Pilot' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            company.producer_status === 'Lab' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-violet-50 text-violet-700 border-violet-200'
                          }`}>
                            {company.producer_status || 'Unknown'}
                          </Badge>
                        </TableCell>
                      )}
                      {activeTab !== 'producers' && (
                        <TableCell className="py-1.5 w-[160px]">
                          <span className="text-[9px] text-muted-foreground">{company.application}</span>
                        </TableCell>
                      )}
                      <TableCell className="text-center py-1.5 w-[60px]">
                        <div className="flex items-center justify-center gap-0.5">
                          <Button type="button" variant="ghost" size="sm" onClick={e => {
                            e.stopPropagation();
                            handleCompanyClick(company);
                          }} className="h-5 w-5 p-0 hover:bg-muted">
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>;
            })}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/60 bg-muted/20 flex-shrink-0">
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-medium">
            <span>Showing {startIndex + 1}</span>
            <span>-</span>
            <Select value={itemsPerPage.toString()} onValueChange={value => setItemsPerPage(Number(value))}>
              <SelectTrigger className="h-5 w-[42px] text-[9px] border-border px-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5" className="text-[9px]">5</SelectItem>
                <SelectItem value="10" className="text-[9px]">10</SelectItem>
                <SelectItem value="20" className="text-[9px]">20</SelectItem>
                <SelectItem value="50" className="text-[9px]">50</SelectItem>
              </SelectContent>
            </Select>
            <span>of {filteredCompanies.length} companies</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="h-5 w-5 p-0 border-border">
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-[9px] text-muted-foreground min-w-[70px] text-center font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="h-5 w-5 p-0 border-border">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>;
  };
  return <div className="h-full min-h-0 bg-background flex flex-col overflow-y-auto">
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
        <Button variant="outline" size="sm" onClick={handleBack} className="gap-1.5 h-7 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
        <div />
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-6 pb-6 flex flex-col">
        <div className="mb-2 flex-shrink-0">
          <h1 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{fromPathway ? 'Pathway ' : ''}Market Players: <span className="text-primary">{fromPathway ? `Pathway ${sourcePathwayId} for ` : ''}{decodedTopic}</span> · <span className="text-foreground">{companies.length} players identified</span></h1>
        </div>

        <Card className="bg-card border border-border/60 shadow-sm flex flex-col flex-shrink-0 h-[560px]">
          <CardContent className="px-4 py-3 flex flex-col overflow-hidden h-full">

            <div className="flex-1 min-h-0 flex flex-col relative">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0 relative">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <TabsList className="inline-flex h-8 gap-0 bg-muted rounded-lg p-0.5 items-center w-auto">
                    <TabsTrigger value="suppliers" className="h-7 px-3 text-[10px] font-medium flex items-center justify-center gap-1 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm transition-all">
                      Feedstock Suppliers ({filterCompaniesByType('feedstock').length})
                    </TabsTrigger>
                    <TabsTrigger value="producers" className="h-7 px-3 text-[10px] font-medium flex items-center justify-center gap-1 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm transition-all">
                      Product Producers ({filterCompaniesByType('product').length})
                    </TabsTrigger>
                    <TabsTrigger value="uptakers" className="h-7 px-3 text-[10px] font-medium flex items-center justify-center gap-1 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm transition-all">
                      Market Off-takers ({filterCompaniesByType('market_uptaker').length})
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="h-7 px-3 text-[10px] font-medium flex items-center justify-center gap-1 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm transition-all">
                      <FolderKanban className="h-3 w-3" />
                      Projects ({filterCompaniesByType('projects').length})
                    </TabsTrigger>
                  </TabsList>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2 flex-shrink-0">
                  Explore companies and projects in Europe that can help implement your pathway. Click the + button to save them for review.
                </p>


                <TabsContent value="producers" className="absolute inset-0 flex flex-col mt-0 data-[state=inactive]:hidden" style={{ top: '60px' }}>
                  <div className="mb-3 flex-shrink-0">
                    <div className="grid gap-2" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input placeholder="Search companies..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-7 pr-7 h-7 !text-[10px] border-border w-full" />
                        {searchTerm && <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="absolute right-0.5 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-muted"><X className="h-2.5 w-2.5" /></Button>}
                      </div>
                      <div className="flex gap-1.5 items-center justify-end">
                        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                          <SelectTrigger className="w-[120px] h-7 text-[8px] border-border"><SelectValue placeholder="All Countries" /></SelectTrigger>
                          <SelectContent>{[['all', 'All Countries'], ...uniqueCountries.map(c => [c, c])].map(([v, l]) => <SelectItem key={v} value={v} className="text-[9px]">{l}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={selectedSize} onValueChange={setSelectedSize}>
                          <SelectTrigger className="w-[130px] h-7 text-[8px] border-border"><SelectValue placeholder="All Company Sizes" /></SelectTrigger>
                          <SelectContent>{[['all', 'All Company Sizes'], ...uniqueSizes.map(s => [s, s])].map(([v, l]) => <SelectItem key={v} value={v} className="text-[9px]">{l}</SelectItem>)}</SelectContent>
                        </Select>
                        {(searchTerm || selectedCountry !== 'all' || selectedSize !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setSelectedCountry('all'); setSelectedSize('all'); }} className="h-7 text-[8px] px-2 text-muted-foreground hover:text-foreground hover:bg-muted">Clear</Button>}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2 flex-1 min-h-0" style={{ gridTemplateColumns: '1.5fr 1fr', height: '100%' }}>
                    {renderCompanyTable('product')}
                    <CompaniesMap companies={getPagedCompanies('product')} savedCompanies={savedCompanies} hoveredCompanyId={mapHighlightedCompanyId} onPinHover={setMapHoveredCompanyId} />
                  </div>
                </TabsContent>

                <TabsContent value="uptakers" className="absolute inset-0 flex flex-col mt-0 data-[state=inactive]:hidden" style={{ top: '60px' }}>
                  <div className="mb-3 flex-shrink-0">
                    <div className="grid gap-2" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input placeholder="Search companies..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-7 pr-7 h-7 !text-[10px] border-border w-full" />
                        {searchTerm && <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="absolute right-0.5 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-muted"><X className="h-2.5 w-2.5" /></Button>}
                      </div>
                      <div className="flex gap-1.5 items-center justify-end">
                        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                          <SelectTrigger className="w-[120px] h-7 text-[8px] border-border"><SelectValue placeholder="All Countries" /></SelectTrigger>
                          <SelectContent>{[['all', 'All Countries'], ...uniqueCountries.map(c => [c, c])].map(([v, l]) => <SelectItem key={v} value={v} className="text-[9px]">{l}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={selectedSize} onValueChange={setSelectedSize}>
                          <SelectTrigger className="w-[130px] h-7 text-[8px] border-border"><SelectValue placeholder="All Company Sizes" /></SelectTrigger>
                          <SelectContent>{[['all', 'All Company Sizes'], ...uniqueSizes.map(s => [s, s])].map(([v, l]) => <SelectItem key={v} value={v} className="text-[9px]">{l}</SelectItem>)}</SelectContent>
                        </Select>
                        {(searchTerm || selectedCountry !== 'all' || selectedSize !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setSelectedCountry('all'); setSelectedSize('all'); }} className="h-7 text-[8px] px-2 text-muted-foreground hover:text-foreground hover:bg-muted">Clear</Button>}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2 flex-1 min-h-0" style={{ gridTemplateColumns: '1.5fr 1fr', height: '100%' }}>
                    {renderCompanyTable('market_uptaker')}
                    <CompaniesMap companies={getPagedCompanies('market_uptaker')} savedCompanies={savedCompanies} hoveredCompanyId={mapHighlightedCompanyId} onPinHover={setMapHoveredCompanyId} />
                  </div>
                </TabsContent>

                <TabsContent value="suppliers" className="absolute inset-0 flex flex-col mt-0 data-[state=inactive]:hidden" style={{ top: '60px' }}>
                  <div className="mb-3 flex-shrink-0">
                    <div className="grid gap-2" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input placeholder="Search suppliers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-7 pr-7 h-7 !text-[10px] border-border w-full" />
                        {searchTerm && <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="absolute right-0.5 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-muted"><X className="h-2.5 w-2.5" /></Button>}
                      </div>
                      <div className="flex gap-1.5 items-center justify-end">
                        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                          <SelectTrigger className="w-[120px] h-7 text-[8px] border-border"><SelectValue placeholder="All Countries" /></SelectTrigger>
                          <SelectContent>{[['all', 'All Countries'], ...uniqueCountries.map(c => [c, c])].map(([v, l]) => <SelectItem key={v} value={v} className="text-[9px]">{l}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={selectedSize} onValueChange={setSelectedSize}>
                          <SelectTrigger className="w-[130px] h-7 text-[8px] border-border"><SelectValue placeholder="All Company Sizes" /></SelectTrigger>
                          <SelectContent>{[['all', 'All Company Sizes'], ...uniqueSizes.map(s => [s, s])].map(([v, l]) => <SelectItem key={v} value={v} className="text-[9px]">{l}</SelectItem>)}</SelectContent>
                        </Select>
                        {(searchTerm || selectedCountry !== 'all' || selectedSize !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setSelectedCountry('all'); setSelectedSize('all'); }} className="h-7 text-[8px] px-2 text-muted-foreground hover:text-foreground hover:bg-muted">Clear</Button>}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2 flex-1 min-h-0" style={{ gridTemplateColumns: '1.5fr 1fr', height: '100%' }}>
                    {renderCompanyTable('feedstock')}
                    <CompaniesMap companies={getPagedCompanies('feedstock')} savedCompanies={savedCompanies} hoveredCompanyId={mapHighlightedCompanyId} onPinHover={setMapHoveredCompanyId} />
                  </div>
                </TabsContent>

                <TabsContent value="projects" className="absolute inset-0 flex flex-col mt-0 data-[state=inactive]:hidden" style={{ top: '60px' }}>
                  <div className="mb-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input placeholder="Search projects..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-7 pr-7 h-7 !text-[10px] border-border w-full" />
                        {searchTerm && <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="absolute right-0.5 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-muted"><X className="h-2.5 w-2.5" /></Button>}
                      </div>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger className="w-[120px] h-7 text-[8px] border-border"><SelectValue placeholder="All Countries" /></SelectTrigger>
                        <SelectContent>{[['all', 'All Countries'], ...uniqueCountries.map(c => [c, c])].map(([v, l]) => <SelectItem key={v} value={v} className="text-[9px]">{l}</SelectItem>)}</SelectContent>
                      </Select>
                      {(searchTerm || selectedCountry !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setSelectedCountry('all'); setSelectedSize('all'); }} className="h-7 text-[8px] px-2 text-muted-foreground hover:text-foreground hover:bg-muted">Clear</Button>}
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    {renderCompanyTable('projects')}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

          </CardContent>
        </Card>

        {/* Shortlisted Companies Section - filtered by active tab */}
        {(() => {
          const tabTypeMap: Record<string, string> = { suppliers: 'feedstock', producers: 'product', uptakers: 'market_uptaker', projects: 'projects' };
          const currentType = tabTypeMap[activeTab] || 'feedstock';
          const tabLabelMap: Record<string, string> = { suppliers: 'Feedstock Suppliers', producers: 'Product Producers', uptakers: 'Market Off-takers', projects: 'Projects' };
          const filteredSavedCount = getAllSavedCompanies(currentType).length;
          if (filteredSavedCount === 0) return null;
          return (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Bookmark className="w-3 h-3 fill-primary text-primary" />
                  Shortlisted {tabLabelMap[activeTab]}
                  <span className="text-foreground">· {filteredSavedCount} saved</span>
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[9px] px-2 gap-1"
                  onClick={() => navigate('/saved-companies')}
                >
                  View All Saved
                </Button>
              </div>
              <SavedCompaniesTable companyType={currentType} />
            </div>
          );
        })()}
      </div>

      <CompanyDetailModal company={selectedCompany} open={isModalOpen} onOpenChange={setIsModalOpen} isTracked={selectedCompany ? trackedCompanies.has(selectedCompany.id) : false} onToggleTracking={companyId => {
          setTrackedCompanies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(companyId)) {
              newSet.delete(companyId);
            } else {
              newSet.add(companyId);
            }
            return newSet;
          });
        }} />
    </div>;
};
export default MarketActivity;