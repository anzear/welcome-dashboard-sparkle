import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Calendar, ChevronRight, ChevronDown, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyNotifications } from "@/components/CompanyNotifications";
import { ActivityNotifications } from "@/components/ActivityNotifications";
import { TopicCommentsProvider } from "@/components/TopicCommentsPopover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import IntelligenceGate from "./components/IntelligenceGate";

import Analytics from "./pages/Analytics";
import AnalysisManagement from "./pages/AnalysisManagement";
import OrganizationManagement from "./pages/OrganizationManagement";
import TopicLandscape from "./pages/TopicLandscape";
import PatentLandscape from "./pages/PatentLandscape";
import ScientificPublications from "./pages/ScientificPublications";
import MarketActivity from "./pages/MarketActivity";
import MarketActivityReview from "./pages/MarketActivityReview";
import ValueChain from "./pages/ValueChain";
import ValueChainPathways from "./pages/ValueChainPathways";
import ValueChainPathwaysFunnel from "./pages/ValueChainPathwaysFunnel";
import PathwayDetail from "./pages/PathwayDetail";
import PathwayIPLandscape from "./pages/PathwayIPLandscape";
import PathwayResearchLandscape from "./pages/PathwayResearchLandscape";
import InnovationProjects from "./pages/InnovationProjects";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Projects from "./pages/Projects";
import SavedCompanies from "./pages/SavedCompanies";
import Workspace from "./pages/Workspace";
import SuperAdmin from "./pages/SuperAdmin";
import Settings from "./pages/Settings";
import MaterialPipeline from "./pages/MaterialPipeline";
import MaterialInventory from "./pages/MaterialInventory";
import MaterialBrief from "./pages/MaterialBrief";
import DecisionsSpace from "./pages/DecisionsSpace";
import ValidationSpace from "./pages/ValidationSpace";
import MaterialBriefSimple from "./pages/MaterialBriefSimple";
import Login from "./pages/Login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

const HeaderBreadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const match = location.pathname.match(/\/landscape\/([^/]+)\/([^/]+)/);
  if (!match) {
    // Show "Dashboard" on the home page
    if (location.pathname === '/') {
      return (
        <div className="flex items-center gap-2 text-xs text-foreground font-medium ml-3">
          Dashboard
        </div>
      );
    }
    return null;
  }
  
  const category = decodeURIComponent(match[1]);
  const topic = decodeURIComponent(match[2]);
  const path = location.pathname;
  
  const isPathways = path.includes('/pathways');
  const isPathwayDetail = path.match(/\/pathways\/(\d+)/);
  const pathwayId = isPathwayDetail?.[1];
  const isMarketActivity = path.includes('/market-activity');
  const isMarketReview = path.includes('/market-activity/review');
  const isPatents = path.includes('/patents') && !path.includes('/pathways');
  const isPublications = path.includes('/publications') && !path.includes('/pathways');
  const isIPLandscape = path.includes('/ip-landscape');
  const isResearchLandscape = path.includes('/research-landscape');
  const isInnovationProjects = path.includes('/innovation-projects');
  const isMaterialBrief = path.includes('/material-brief');
  
  
  // Check if navigated from a pathway context
  const navState = location.state as any;
  const fromPathway = navState?.fromPathway;
  const sourcePathwayId = navState?.pathwayId || pathwayId;
  
  // Build breadcrumb segments
  const segments: { label: string; onClick?: () => void }[] = [];
  
  // Always start with Dashboard > Topic
  segments.push({ label: 'Dashboard', onClick: () => navigate('/') });
  const execSummaryLabel = category === 'Feedstock' ? 'Feedstock Overview' : 'Material Overview';
  segments.push({ label: execSummaryLabel, onClick: () => navigate(`/landscape/${match[1]}/${match[2]}/value-chain`) });
  
  // Pathway context (either from URL or navigation state)
  const hasPathwayContext = isPathways || isIPLandscape || isResearchLandscape || isInnovationProjects || fromPathway;
  
  if (hasPathwayContext) {
    segments.push({ label: 'Pathway Explorer', onClick: () => navigate(`/landscape/${match[1]}/${match[2]}/value-chain/pathways`) });
    
    const isOnSubPage = isIPLandscape || isResearchLandscape || isInnovationProjects || (isMarketActivity && fromPathway);
    const isPlainPathwayProfile = isPathwayDetail && !isOnSubPage;
    
    if (isOnSubPage) {
      const pid = sourcePathwayId || '1';
      segments.push({ label: 'Pathway Profile', onClick: () => navigate(`/landscape/${match[1]}/${match[2]}/value-chain/pathways/${pid}`) });
    } else if (isPlainPathwayProfile) {
      segments.push({ label: 'Pathway Profile' }); // current page, no click
    }
  }
  
  // Current page (sub-pages) - prefix with "Pathway" when from pathway context
  const prefix = hasPathwayContext ? 'Pathway ' : '';
  
  if (isMarketReview) {
    segments.push({ label: `${prefix}Market Players`, onClick: () => navigate(`/landscape/${match[1]}/${match[2]}/market-activity`) });
    segments.push({ label: 'Review' });
  } else if (isMarketActivity) {
    segments.push({ label: `${prefix}Market Players` });
  } else if (isPatents) {
    segments.push({ label: 'IP Landscape' });
  } else if (isPublications) {
    segments.push({ label: 'Research Landscape' });
  } else if (isIPLandscape) {
    segments.push({ label: 'Pathway IP Landscape' });
  } else if (isResearchLandscape) {
    segments.push({ label: 'Pathway Research Landscape' });
  } else if (isInnovationProjects) {
    segments.push({ label: 'Pathway Innovation Projects' });
  } else if (isMaterialBrief) {
    segments.push({ label: 'Material Brief' });
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground ml-3">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3 h-3" />}
            {isLast || !seg.onClick ? (
              <span className={isLast ? "text-foreground font-medium" : ""}>{seg.label}</span>
            ) : (
              <button onClick={seg.onClick} className="hover:text-foreground transition-colors">{seg.label}</button>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const ContentArea = ({ location }: { location: ReturnType<typeof useLocation> }) => {
  return (
    <div
      data-comments-scroll-root
      className="flex-1 min-h-0 bg-background overflow-hidden relative"
    >
      <div
        data-comments-content-inner
        key={location.pathname}
        className="animate-page-in h-full relative"
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/material-pipeline" element={<MaterialPipeline />} />
          <Route path="/material-inventory" element={<MaterialPipeline />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/saved-companies" element={<SavedCompanies />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/analysis-management" element={<AnalysisManagement />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/organization/:id" element={<OrganizationManagement />} />
          <Route path="/landscape/:category/:topic" element={<IntelligenceGate><TopicLandscape /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/value-chain" element={<IntelligenceGate><ValueChain /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/value-chain/analysis" element={<IntelligenceGate><ValueChain /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/material-brief" element={<MaterialBrief />} />
          <Route path="/landscape/:category/:topic/decisions-space" element={<IntelligenceGate><DecisionsSpace /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/priorities" element={<IntelligenceGate><ValidationSpace /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/validation-space" element={<IntelligenceGate><ValidationSpace /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/material-brief-simple" element={<MaterialBriefSimple />} />
          <Route path="/landscape/:category/:topic/value-chain/pathways/funnel" element={<IntelligenceGate><ValueChainPathwaysFunnel /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/value-chain/pathways" element={<IntelligenceGate><ValueChainPathways /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/value-chain/pathways/:pathwayId" element={<IntelligenceGate><PathwayDetail /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/value-chain/pathways/:pathwayId/ip-landscape" element={<IntelligenceGate><PathwayIPLandscape /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/value-chain/pathways/:pathwayId/research-landscape" element={<IntelligenceGate><PathwayResearchLandscape /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/value-chain/pathways/:pathwayId/innovation-projects" element={<IntelligenceGate><InnovationProjects /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/publications" element={<IntelligenceGate><ScientificPublications /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/patents" element={<IntelligenceGate><PatentLandscape /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/market-activity" element={<IntelligenceGate><MarketActivity /></IntelligenceGate>} />
          <Route path="/landscape/:category/:topic/market-activity/review" element={<IntelligenceGate><MarketActivityReview /></IntelligenceGate>} />

          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/auth';

  if (isAuthRoute) {
    return (
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes location={location}>
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <TopicCommentsProvider>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset className="!m-0 !ml-0 !p-0 bg-transparent flex flex-col h-screen overflow-hidden">
          <div className="pointer-events-none fixed inset-x-0 top-12 z-50 border-t border-primary/8" />
          <header className="sticky top-0 z-40 bg-card/70 backdrop-blur-lg flex-shrink-0">
            <div className="h-12 flex items-center px-4">
              <div className="flex items-center">
                <SidebarTrigger className="p-2 hover:bg-muted rounded-lg transition-colors" />
                <HeaderBreadcrumb />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <ActivityNotifications />
              </div>
            </div>
          </header>
          <ContentArea location={location} />
        </SidebarInset>
      </SidebarProvider>
      </TopicCommentsProvider>
    </TooltipProvider>
  );
};


const AppWrapper = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
);

export default AppWrapper;
