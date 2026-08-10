import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, TrendingUp, Users, Calendar, ArrowRight, X, FileText, Building2, Globe, Download, Filter, BookOpen, Scale, ScrollText, Microscope, BarChart3, Gavel, Zap, Bookmark, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Pathway {
  feedstock: string;
  technology: string;
  product: string;
  application: string;
  trl: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
  topic?: string;
}

interface CombinedPathway {
  id: string;
  pathways: Pathway[];
}

interface Project {
  id: string;
  name: string;
  owner: string;
  goal: string;
  pathways: Pathway[];
}

const PATHWAYS_DATA: Pathway[] = [
  { feedstock: "Corn Cobs", technology: "Acid Hydrolysis", product: "Xylose", application: "Food Sweetener", trl: "TRL 9", category1: "Agricultural Waste", category2: "Chemical Technology", category3: "Food & Nutrition", category4: "Food & Nutrition" },
  { feedstock: "Wheat Straw", technology: "Enzymatic Hydrolysis", product: "Xylose", application: "Pharmaceutical Intermediate", trl: "TRL 7", category1: "Agricultural Waste", category2: "Biotechnology", category3: "Biochemicals", category4: "Pharma & Healthcare" },
  { feedstock: "Sugarcane Bagasse", technology: "Steam Explosion", product: "Xylose", application: "Xylitol Production", trl: "TRL 8", category1: "Agricultural Waste", category2: "Thermochemical", category3: "Food & Nutrition", category4: "Food & Nutrition" },
  { feedstock: "Rice Husks", technology: "Alkaline Pre-treatment", product: "Xylose", application: "Bioethanol Feedstock", trl: "TRL 6", category1: "Agricultural Waste", category2: "Chemical Technology", category3: "Fuels & Energy", category4: "Transportation" },
  { feedstock: "Birch Wood", technology: "Dilute Acid Hydrolysis", product: "Xylose", application: "Cosmetic Ingredient", trl: "TRL 5", category1: "Forestry Waste", category2: "Chemical Technology", category3: "Biochemicals", category4: "Personal Care" },
  { feedstock: "Xylose", technology: "Fermentation", product: "Xylitol", application: "Sugar-Free Products", trl: "TRL 8", category1: "Biochemicals", category2: "Biotechnology", category3: "Food Additives", category4: "Food & Nutrition" },
];

// Available topics for the overview section
const AVAILABLE_TOPICS = [
  { name: "Xylose", pathwayCount: 31 },
  { name: "Succinic Acid", pathwayCount: 24 },
];

const TopicLandscape = () => {
  const { category, topic } = useParams<{ category: string; topic: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const projectName = (location.state as any)?.projectName;
  const projectDescription = (location.state as any)?.projectDescription;
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    category: string;
    items: Array<{name: string; description: string; examples: string[]}>
  }>({
    isOpen: false,
    category: "",
    items: []
  });
  
  // State for filtering technologies/products/markets by pie chart selection
  const [selectedTechnologyCategory, setSelectedTechnologyCategory] = useState<string | null>(null);
  const [selectedProductCategory, setSelectedProductCategory] = useState<string | null>(null);
  const [selectedMarketCategory, setSelectedMarketCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeValueChainTab, setActiveValueChainTab] = useState("feedstock");
  const [showPathways, setShowPathways] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(() => {
    // Initialize with current topic from URL
    return topic ? new Set([decodeURIComponent(topic)]) : new Set();
  });
  
  // State for project saving
  const [projects, setProjects] = useState<Project[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [pathwayToSave, setPathwayToSave] = useState<Pathway | null>(null);
  const [createNewProject, setCreateNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectOwner, setNewProjectOwner] = useState("");
  const [newProjectGoal, setNewProjectGoal] = useState("");
  
  // Drag and drop state for combining pathways
  const [draggedPathwayIndex, setDraggedPathwayIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [combinedPathways, setCombinedPathways] = useState<CombinedPathway[]>([]);
  const [orderedPathways, setOrderedPathways] = useState<Pathway[]>(PATHWAYS_DATA);
  
  // Move pathway up or down
  const movePathway = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...orderedPathways];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setOrderedPathways(newOrder);
  };
  
  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase.from('projects').select('*');
      if (data && !error) {
        setProjects(data.map(p => ({
          ...p,
          pathways: Array.isArray(p.pathways) ? (p.pathways as unknown as Pathway[]) : []
        })));
      }
    };
    fetchProjects();
  }, []);
  
  const handleSavePathway = (pathway: Pathway) => {
    setPathwayToSave({ ...pathway, topic: topic ? decodeURIComponent(topic) : 'Unknown' });
    setSaveDialogOpen(true);
  };
  
  const saveToProject = async () => {
    if (!pathwayToSave) return;
    
    if (createNewProject) {
      if (!newProjectName || !newProjectOwner || !newProjectGoal) {
        toast({ title: "Missing Information", description: "Please fill in all project fields", variant: "destructive" });
        return;
      }
      
      const { error } = await supabase.from('projects').insert({
        name: newProjectName,
        owner: newProjectOwner,
        goal: newProjectGoal,
        pathways: JSON.parse(JSON.stringify([pathwayToSave])),
        topic: pathwayToSave.topic,
        category: category
      });
      
      if (error) {
        toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
      } else {
        toast({ title: "Success", description: `Pathway saved to new project "${newProjectName}"` });
        setSaveDialogOpen(false);
        setNewProjectName("");
        setNewProjectOwner("");
        setNewProjectGoal("");
        setCreateNewProject(false);
        // Refresh projects
        const { data } = await supabase.from('projects').select('*');
        if (data) setProjects(data.map(p => ({ ...p, pathways: Array.isArray(p.pathways) ? (p.pathways as unknown as Pathway[]) : [] })));
      }
    } else {
      if (!selectedProjectId) {
        toast({ title: "Select a Project", description: "Please select a project to save to", variant: "destructive" });
        return;
      }
      
      const project = projects.find(p => p.id === selectedProjectId);
      if (!project) return;
      
      const updatedPathways = [...project.pathways, pathwayToSave];
      
      const { error } = await supabase.from('projects').update({ pathways: JSON.parse(JSON.stringify(updatedPathways)) }).eq('id', selectedProjectId);
      
      if (error) {
        toast({ title: "Error", description: "Failed to save pathway", variant: "destructive" });
      } else {
        toast({ title: "Success", description: `Pathway saved to "${project.name}"` });
        setSaveDialogOpen(false);
        // Refresh projects
        const { data } = await supabase.from('projects').select('*');
        if (data) setProjects(data.map(p => ({ ...p, pathways: Array.isArray(p.pathways) ? (p.pathways as unknown as Pathway[]) : [] })));
      }
    }
  };
  
  // State for action popup
  const [actionPopup, setActionPopup] = useState<{
    isOpen: boolean;
    itemName: string;
    category: string;
  }>({
    isOpen: false,
    itemName: "",
    category: ""
  });

  const handleBack = () => {
    navigate(-1);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Feedstock":
        return "text-success";
      case "Process": 
        return "text-product-blue";
      case "Product":
        return "text-application-purple";
      case "Market Application":
        return "text-orange-500";
      default:
        return "text-success";
    }
  };

  // Mock data for demonstration
  const landscapeData = {
    overview: {
      totalProjects: 24,
      activeCompanies: 12,
      marketValue: "$2.3B",
      growthRate: "15.2%"
    },
    keyPlayers: [
      "Novozymes", "DSM", "Evonik", "BASF", "DuPont"
    ],
    recentDevelopments: [
      "New biorefinery facility announced in Germany",
      "Partnership between major chemical companies",
      "Breakthrough in enzyme technology efficiency"
    ]
  };

  // Technology breakdown data for pie chart
  const technologyData = [
    { name: "Biochemical", value: 18, fill: "hsl(var(--product-blue))" },
    { name: "Chemical", value: 15, fill: "hsl(var(--product-blue) / 0.9)" },
    { name: "Physicochemical", value: 12, fill: "hsl(var(--product-blue) / 0.8)" },
    { name: "Mechanical", value: 10, fill: "hsl(var(--product-blue) / 0.7)" },
    { name: "Thermomechanical", value: 9, fill: "hsl(var(--product-blue) / 0.6)" },
    { name: "Thermochemical", value: 8, fill: "hsl(var(--product-blue) / 0.5)" },
    { name: "Physical", value: 6, fill: "hsl(var(--product-blue) / 0.4)" },
    { name: "Hybrid", value: 5, fill: "hsl(var(--product-blue) / 0.3)" }
  ];

  // Products breakdown data for pie chart
  const productsData = [
    { name: "Chemicals", value: 12, fill: "hsl(var(--application-purple))" },
    { name: "Fuels", value: 8, fill: "hsl(var(--application-purple) / 0.85)" },
    { name: "Materials", value: 6, fill: "hsl(var(--application-purple) / 0.7)" },
    { name: "Food & Feed", value: 4, fill: "hsl(var(--application-purple) / 0.55)" },
    { name: "Pharmaceuticals", value: 2, fill: "hsl(var(--application-purple) / 0.4)" },
    { name: "Cosmetics", value: 2, fill: "hsl(var(--application-purple) / 0.25)" }
  ];

  // Markets breakdown data for pie chart
  const marketsData = [
    { name: "Automotive", value: 15, fill: "hsl(var(--application-orange))" },
    { name: "Packaging", value: 12, fill: "hsl(var(--application-orange) / 0.85)" },
    { name: "Construction", value: 10, fill: "hsl(var(--application-orange) / 0.7)" },
    { name: "Textiles", value: 8, fill: "hsl(var(--application-orange) / 0.55)" },
    { name: "Electronics", value: 6, fill: "hsl(var(--application-orange) / 0.4)" },
    { name: "Agriculture", value: 4, fill: "hsl(var(--application-orange) / 0.25)" }
  ];

  // Detailed data for modals
  const detailedTechnologies = [
    { 
      name: "Biochemical", 
      description: "Processes using biological catalysts like enzymes and microorganisms", 
      examples: ["Fermentation", "Enzymatic conversion", "Microbial transformation"],
      trlData: { 1: 0, 2: 5, 3: 8, 4: 12, 5: 10, 6: 8, 7: 2, 8: 3, 9: 1 }
    },
    { 
      name: "Chemical", 
      description: "Traditional chemical conversion processes", 
      examples: ["Acid hydrolysis", "Base catalysis", "Oxidation reactions"],
      trlData: { 1: 0, 2: 4, 3: 6, 4: 10, 5: 8, 6: 6, 7: 2, 8: 4, 9: 1 }
    },
    { 
      name: "Physicochemical", 
      description: "Combined physical and chemical processes", 
      examples: ["Steam explosion", "Supercritical extraction", "Ionic liquid treatment"],
      trlData: { 1: 0, 2: 3, 3: 5, 4: 8, 5: 6, 6: 4, 7: 1, 8: 3, 9: 0 }
    },
    { 
      name: "Mechanical", 
      description: "Physical size reduction and separation techniques", 
      examples: ["Grinding", "Pressing", "Screening"],
      trlData: { 1: 0, 2: 2, 3: 4, 4: 6, 5: 5, 6: 4, 7: 1, 8: 2, 9: 1 }
    },
    { 
      name: "Thermomechanical", 
      description: "Heat-assisted mechanical processing", 
      examples: ["Steam refining", "Extrusion", "Hot pressing"],
      trlData: { 1: 0, 2: 3, 3: 5, 4: 7, 5: 4, 6: 3, 7: 1, 8: 2, 9: 0 }
    },
    { 
      name: "Thermochemical", 
      description: "High-temperature chemical conversion", 
      examples: ["Pyrolysis", "Gasification", "Combustion"],
      trlData: { 1: 0, 2: 2, 3: 3, 4: 5, 5: 3, 6: 2, 7: 1, 8: 1, 9: 0 }
    },
    { 
      name: "Physical", 
      description: "Separation based on physical properties", 
      examples: ["Filtration", "Distillation", "Crystallization"],
      trlData: { 1: 0, 2: 1, 3: 2, 4: 2, 5: 1, 6: 1, 7: 0, 8: 1, 9: 0 }
    },
    { 
      name: "Hybrid", 
      description: "Combination of multiple processing approaches", 
      examples: ["Integrated biorefineries", "Sequential processing", "Multi-step conversion"],
      trlData: { 1: 0, 2: 1, 3: 2, 4: 1, 5: 1, 6: 1, 7: 0, 8: 1, 9: 0 }
    }
  ];

  const detailedProducts = [
    { 
      name: "Chemicals", 
      description: "Basic and specialty chemical compounds", 
      examples: ["Organic acids", "Alcohols", "Polymers", "Solvents"],
      trlData: { 1: 0, 2: 3, 3: 6, 4: 8, 5: 7, 6: 5, 7: 2, 8: 3, 9: 1 }
    },
    { 
      name: "Fuels", 
      description: "Energy carriers and transportation fuels", 
      examples: ["Bioethanol", "Biodiesel", "Biogas", "Hydrogen"],
      trlData: { 1: 0, 2: 2, 3: 4, 4: 6, 5: 5, 6: 4, 7: 1, 8: 2, 9: 0 }
    },
    { 
      name: "Materials", 
      description: "Structural and functional materials", 
      examples: ["Bioplastics", "Composites", "Fibers", "Packaging materials"],
      trlData: { 1: 0, 2: 4, 3: 7, 4: 9, 5: 6, 6: 4, 7: 2, 8: 3, 9: 1 }
    },
    { 
      name: "Food & Feed", 
      description: "Nutritional products for human and animal consumption", 
      examples: ["Protein extracts", "Nutritional supplements", "Animal feed", "Food additives"],
      trlData: { 1: 0, 2: 2, 3: 3, 4: 4, 5: 3, 6: 2, 7: 1, 8: 2, 9: 0 }
    },
    { 
      name: "Pharmaceuticals", 
      description: "Therapeutic and medicinal compounds", 
      examples: ["Active ingredients", "Excipients", "Nutraceuticals", "Bioactive compounds"],
      trlData: { 1: 0, 2: 1, 3: 2, 4: 2, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0 }
    },
    { 
      name: "Cosmetics", 
      description: "Personal care and cosmetic ingredients", 
      examples: ["Natural extracts", "Emulsifiers", "Preservatives", "Active ingredients"],
      trlData: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 2, 6: 2, 7: 1, 8: 1, 9: 1 }
    }
  ];

  const detailedMarkets = [
    { 
      name: "Automotive", 
      description: "Transportation industry applications", 
      examples: ["Bio-based lubricants", "Interior materials", "Fuel additives", "Composite parts"],
      trlData: { 1: 0, 2: 3, 3: 5, 4: 7, 5: 5, 6: 4, 7: 1, 8: 2, 9: 0 }
    },
    { 
      name: "Packaging", 
      description: "Product packaging and containment", 
      examples: ["Biodegradable films", "Food packaging", "Protective materials", "Labels"],
      trlData: { 1: 0, 2: 2, 3: 4, 4: 6, 5: 4, 6: 3, 7: 1, 8: 2, 9: 1 }
    },
    { 
      name: "Construction", 
      description: "Building and infrastructure materials", 
      examples: ["Insulation materials", "Adhesives", "Coatings", "Structural components"],
      trlData: { 1: 0, 2: 2, 3: 3, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1, 9: 0 }
    },
    { 
      name: "Textiles", 
      description: "Fabric and fiber applications", 
      examples: ["Natural fibers", "Dyes", "Finishing agents", "Technical textiles"],
      trlData: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 2, 6: 2, 7: 1, 8: 1, 9: 0 }
    },
    { 
      name: "Electronics", 
      description: "Electronic device components and materials", 
      examples: ["Biodegradable circuits", "Natural insulators", "Conductive materials", "Packaging"],
      trlData: { 1: 0, 2: 1, 3: 2, 4: 2, 5: 1, 6: 1, 7: 0, 8: 1, 9: 0 }
    },
    { 
      name: "Agriculture", 
      description: "Farming and crop production aids", 
      examples: ["Bio-fertilizers", "Pesticides", "Soil amendments", "Plant growth regulators"],
      trlData: { 1: 0, 2: 2, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0 }
    }
  ];

  const handleTechnologyClick = (data: any, index: number) => {
    // Set the selected technology category to filter the list
    setSelectedTechnologyCategory(data.name);
  };

  const handleProductClick = (data: any, index: number) => {
    // Set the selected product category to filter the list
    setSelectedProductCategory(data.name);
  };

  const handleMarketClick = (data: any, index: number) => {
    // Set the selected market category to filter the list
    setSelectedMarketCategory(data.name);
  };

  // Helper functions to get filtered categories
  const getFilteredTechnologies = () => {
    if (!selectedTechnologyCategory) {
      return detailedTechnologies; // Show all if none selected
    }
    return detailedTechnologies.filter(tech => tech.name === selectedTechnologyCategory);
  };

  // Calculate overall TRL distribution across all technologies
  const getOverallTrlDistribution = () => {
    const overallTrl = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    detailedTechnologies.forEach(tech => {
      for (let i = 1; i <= 9; i++) {
        overallTrl[i] += tech.trlData[i];
      }
    });
    return overallTrl;
  };

  const getFilteredProducts = () => {
    if (!selectedProductCategory) {
      return detailedProducts; // Show all if none selected
    }
    return detailedProducts.filter(product => product.name === selectedProductCategory);
  };

  const getFilteredMarkets = () => {
    if (!selectedMarketCategory) {
      return detailedMarkets; // Show all if none selected
    }
    return detailedMarkets.filter(market => market.name === selectedMarketCategory);
  };

  const resetTechnologyFilter = () => {
    setSelectedTechnologyCategory(null);
  };

  const resetProductFilter = () => {
    setSelectedProductCategory(null);
  };

  const resetMarketFilter = () => {
    setSelectedMarketCategory(null);
  };

  // Handler for opening action popup
  const handleItemClick = (itemName: string, category: string) => {
    setActionPopup({
      isOpen: true,
      itemName,
      category
    });
  };

  // Handler for closing action popup
  const closeActionPopup = () => {
    setActionPopup({
      isOpen: false,
      itemName: "",
      category: ""
    });
  };

  // Handle action selection
  const handleActionSelect = (action: string) => {
    console.log(`Selected ${action} for ${actionPopup.itemName} in ${actionPopup.category}`);
    
    // Add debugging
    alert(`Action: ${action}, Category: ${category}, Topic: ${topic}`);
    
    if (action === "landscape") {
      navigate(`/landscape/${encodeURIComponent(actionPopup.category)}/${encodeURIComponent(actionPopup.itemName)}`);
    } else if (action === "value-chain") {
      const targetUrl = `/landscape/${encodeURIComponent(category || '')}/${encodeURIComponent(topic || '')}/value-chain`;
      console.log("VALUE CHAIN TAB CLICKED!");
      console.log("Navigating to:", targetUrl);
      navigate(targetUrl);
    }
    
    closeActionPopup();
  };

  // Get category-specific colors
  const getCategoryColors = (category: string) => {
    switch (category) {
      case "Feedstock":
        return {
          borderColor: "border-success/30",
          backgroundColor: "bg-success/5",
          hoverBackgroundColor: "hover:bg-success/10",
          hoverBorderColor: "hover:border-success/50",
          iconBackgroundColor: "bg-success/20",
          hoverIconBackgroundColor: "group-hover:bg-success/30",
          iconColor: "text-success",
          gradientColor: "from-success/5"
        };
      case "Process":
        return {
          borderColor: "border-product-blue/30",
          backgroundColor: "bg-product-blue/5",
          hoverBackgroundColor: "hover:bg-product-blue/10",
          hoverBorderColor: "hover:border-product-blue/50",
          iconBackgroundColor: "bg-product-blue/20",
          hoverIconBackgroundColor: "group-hover:bg-product-blue/30",
          iconColor: "text-product-blue",
          gradientColor: "from-product-blue/5"
        };
      case "Product":
        return {
          borderColor: "border-application-purple/30",
          backgroundColor: "bg-application-purple/5",
          hoverBackgroundColor: "hover:bg-application-purple/10",
          hoverBorderColor: "hover:border-application-purple/50",
          iconBackgroundColor: "bg-application-purple/20",
          hoverIconBackgroundColor: "group-hover:bg-application-purple/30",
          iconColor: "text-application-purple",
          gradientColor: "from-application-purple/5"
        };
      case "Market Application":
      case "Application":
        return {
          borderColor: "border-application-orange/30",
          backgroundColor: "bg-application-orange/5",
          hoverBackgroundColor: "hover:bg-application-orange/10",
          hoverBorderColor: "hover:border-application-orange/50",
          iconBackgroundColor: "bg-application-orange/20",
          hoverIconBackgroundColor: "group-hover:bg-application-orange/30",
          iconColor: "text-application-orange",
          gradientColor: "from-application-orange/5"
        };
      default:
        return {
          borderColor: "border-muted-foreground/30",
          backgroundColor: "bg-muted/5",
          hoverBackgroundColor: "hover:bg-muted/10",
          hoverBorderColor: "hover:border-muted-foreground/50",
          iconBackgroundColor: "bg-muted-foreground/20",
          hoverIconBackgroundColor: "group-hover:bg-muted-foreground/30",
          iconColor: "text-muted-foreground",
          gradientColor: "from-muted/5"
        };
    }
  };

  const chartConfig = {
    biochemical: { label: "Biochemical", color: "hsl(var(--product-blue))" },
    chemical: { label: "Chemical", color: "hsl(var(--product-blue) / 0.9)" },
    physicochemical: { label: "Physicochemical", color: "hsl(var(--product-blue) / 0.8)" },
    mechanical: { label: "Mechanical", color: "hsl(var(--product-blue) / 0.7)" },
    thermomechanical: { label: "Thermomechanical", color: "hsl(var(--product-blue) / 0.6)" },
    thermochemical: { label: "Thermochemical", color: "hsl(var(--product-blue) / 0.5)" },
    physical: { label: "Physical", color: "hsl(var(--product-blue) / 0.4)" },
    hybrid: { label: "Hybrid", color: "hsl(var(--product-blue) / 0.3)" }
  };

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-muted border-b flex-shrink-0">
        <Progress value={25} className="h-1 rounded-none" />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-3 pb-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleBack} className="gap-1.5 h-7 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>
        </div>

        {/* Analysis Summary Card */}
        <Card className="bg-gradient-to-br from-card to-card/90 border border-border/40 shadow-lg backdrop-blur-sm">
          <CardContent className="p-3 pb-2 flex flex-col">
            {/* Title */}
            {/* Summary text */}
            <div className="text-left mb-4 flex-shrink-0">
              <h2 className="text-base font-semibold mb-2 text-foreground">
                {projectName ? (
                  <>Summary of Valorisation Opportunities: <span className="text-success">{projectName}</span></>
                ) : (
                  <>Summary of Valorisation Opportunities: <span className="text-success">{decodeURIComponent(topic || "")}</span></>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                {projectDescription || `Explore all technologies, products, and markets for ${decodeURIComponent(topic || "")} valorisation.`}
              </p>
            </div>

            {/* Breakdown Categories */}
            <div className="flex-shrink-0">
                  <div className="w-full bg-gradient-to-br from-primary/8 to-primary/4 border border-primary/30 rounded-lg shadow-sm">
                    {/* Two-column layout: Topics on left, Pathways on right */}
                    <div className="flex" style={{ minHeight: '450px' }}>
                      {/* Left Navigation Panel - Topics */}
                      <div className="w-56 border-r border-primary/20 px-3 pt-4 pb-3 flex-shrink-0 flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Topics {selectedTopics.size > 0 && <span className="text-primary">({selectedTopics.size})</span>}
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {AVAILABLE_TOPICS.map((topicItem, idx) => {
                            const isSelected = selectedTopics.has(topicItem.name);
                            return (
                              <div 
                                key={idx}
                                onClick={() => {
                                  const newSelected = new Set(selectedTopics);
                                  if (isSelected) {
                                    newSelected.delete(topicItem.name);
                                  } else {
                                    newSelected.add(topicItem.name);
                                  }
                                  setSelectedTopics(newSelected);
                                }}
                                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'bg-primary text-primary-foreground shadow-sm' 
                                    : 'bg-card hover:bg-muted/50 border border-border'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'bg-primary-foreground border-primary-foreground' : 'border-muted-foreground/40'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-sm font-medium truncate ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                                    {topicItem.name}
                                  </h4>
                                  <div className={`text-[10px] ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {topicItem.pathwayCount} pathways
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Content Panel - Pathways */}
                      <div className="flex-1 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-sm font-semibold text-primary">
                            {selectedTopics.size > 0 
                              ? Array.from(selectedTopics).join(' & ')
                              : 'Select Topics'}
                          </h3>
                          <span className="text-[10px] text-muted-foreground">
                            {selectedTopics.size > 0 
                              ? `${selectedTopics.size} topic${selectedTopics.size > 1 ? 's' : ''} selected`
                              : ''}
                          </span>
                        </div>

                        {/* Pathways Display */}
                        {selectedTopics.size === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">Select one or more topics to view pathways</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {/* Combined Pathways Section */}
                            {combinedPathways.length > 0 && (
                              <div className="mb-4">
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Extended Pathways</div>
                                {combinedPathways.map((combined, combIndex) => (
                                  <div 
                                    key={combined.id}
                                    className="bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/30 rounded-lg p-3 mb-2"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-md">
                                          Extended Pathway {combIndex + 1}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{combined.pathways.length} pathways combined</span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                                        onClick={() => setCombinedPathways(prev => prev.filter(p => p.id !== combined.id))}
                                      >
                                        <X className="w-3 h-3" />
                                        Remove
                                      </Button>
                                    </div>
                                    <div className="flex gap-1 overflow-x-auto pb-1">
                                      {combined.pathways.map((pw, pwIndex) => {
                                        const isFirst = pwIndex === 0;
                                        const isLast = pwIndex === combined.pathways.length - 1;
                                        
                                        return (
                                          <div key={pwIndex} className="flex items-center gap-1 flex-shrink-0">
                                            {/* Show feedstock only for first pathway */}
                                            {isFirst && (
                                              <>
                                                <div className="bg-green-50 border border-green-200 rounded p-1.5 min-w-[80px]">
                                                  <div className="text-[8px] text-green-700 font-medium">{pw.category1}</div>
                                                  <div className="text-[10px] font-semibold text-foreground truncate">{pw.feedstock}</div>
                                                </div>
                                                <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                              </>
                                            )}
                                            
                                            {/* Always show technology */}
                                            <div className="bg-blue-50 border border-blue-200 rounded p-1.5 min-w-[80px]">
                                              <div className="text-[8px] text-blue-700 font-medium">{pw.category2}</div>
                                              <div className="text-[10px] font-semibold text-foreground truncate">{pw.technology}</div>
                                            </div>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                            
                                            {/* Always show product */}
                                            <div className="bg-purple-50 border border-purple-200 rounded p-1.5 min-w-[80px]">
                                              <div className="text-[8px] text-purple-700 font-medium">{pw.category3}</div>
                                              <div className="text-[10px] font-semibold text-foreground truncate">{pw.product}</div>
                                            </div>
                                            
                                            {/* Show application only for last pathway */}
                                            {isLast && (
                                              <>
                                                <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                                <div className="bg-orange-50 border border-orange-200 rounded p-1.5 min-w-[80px]">
                                                  <div className="text-[8px] text-orange-700 font-medium">{pw.category4}</div>
                                                  <div className="text-[10px] font-semibold text-foreground truncate">{pw.application}</div>
                                                </div>
                                              </>
                                            )}
                                            
                                            {/* Connection arrow between pathways */}
                                            {!isLast && (
                                              <ArrowRight className="w-3 h-3 text-primary flex-shrink-0 mx-1" />
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Individual Pathways */}
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                              Pathways <span className="text-primary/70">(drag one onto another to combine)</span>
                            </div>
                            {orderedPathways.map((pathway, index) => (
                              <div 
                                key={`${pathway.feedstock}-${pathway.product}-${index}`}
                                draggable
                                onDragStart={(e) => {
                                  setDraggedPathwayIndex(index);
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragEnd={() => {
                                  setDraggedPathwayIndex(null);
                                  setDropTargetIndex(null);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  if (draggedPathwayIndex !== null && draggedPathwayIndex !== index) {
                                    setDropTargetIndex(index);
                                  }
                                }}
                                onDragLeave={() => setDropTargetIndex(null)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (draggedPathwayIndex !== null && draggedPathwayIndex !== index) {
                                    const draggedPathway = orderedPathways[draggedPathwayIndex];
                                    const targetPathway = orderedPathways[index];
                                    
                                    // Check if pathways can be combined: product of one must match feedstock of other
                                    const draggedProductMatchesTargetFeedstock = draggedPathway.product.toLowerCase() === targetPathway.feedstock.toLowerCase();
                                    const targetProductMatchesDraggedFeedstock = targetPathway.product.toLowerCase() === draggedPathway.feedstock.toLowerCase();
                                    
                                    if (!draggedProductMatchesTargetFeedstock && !targetProductMatchesDraggedFeedstock) {
                                      toast({
                                        title: "Cannot Combine Pathways",
                                        description: `The product of one pathway must match the feedstock of the other. "${draggedPathway.product}" doesn't connect to "${targetPathway.feedstock}" and "${targetPathway.product}" doesn't connect to "${draggedPathway.feedstock}".`,
                                        variant: "destructive",
                                      });
                                      setDraggedPathwayIndex(null);
                                      setDropTargetIndex(null);
                                      return;
                                    }
                                    
                                    // Order pathways so the first one's product matches the second one's feedstock
                                    const combinedOrder = draggedProductMatchesTargetFeedstock 
                                      ? [draggedPathway, targetPathway]
                                      : [targetPathway, draggedPathway];
                                    
                                    const newCombined: CombinedPathway = {
                                      id: `combined-${Date.now()}`,
                                      pathways: combinedOrder
                                    };
                                    setCombinedPathways(prev => [...prev, newCombined]);
                                    toast({
                                      title: "Pathways Combined",
                                      description: `Created extended pathway: ${combinedOrder[0].product} → ${combinedOrder[1].feedstock}`,
                                    });
                                  }
                                  setDraggedPathwayIndex(null);
                                  setDropTargetIndex(null);
                                }}
                                className={`bg-card border rounded-lg p-3 transition-all cursor-grab active:cursor-grabbing ${
                                  draggedPathwayIndex === index 
                                    ? 'opacity-50 border-primary shadow-lg' 
                                    : dropTargetIndex === index 
                                      ? 'border-primary border-2 bg-primary/5 shadow-md' 
                                      : 'border-border hover:shadow-sm'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col gap-0.5 mr-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-4 w-4 p-0"
                                        disabled={index === 0}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          movePathway(index, 'up');
                                        }}
                                      >
                                        <ChevronUp className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-4 w-4 p-0"
                                        disabled={index === orderedPathways.length - 1}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          movePathway(index, 'down');
                                        }}
                                      >
                                        <ChevronDown className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <span className={`px-2 py-0.5 ${index < 3 ? 'bg-green-200 text-green-900' : 'bg-gray-200 text-gray-800'} text-xs font-medium rounded-md`}>
                                      Pathway {index + 1}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{pathway.trl}</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSavePathway(pathway);
                                    }}
                                  >
                                    <Bookmark className="w-3 h-3" />
                                    Save
                                  </Button>
                                </div>
                                <div 
                                  className="grid grid-cols-4 gap-2 cursor-pointer"
                                  onClick={() => navigate(`/landscape/${category}/${topic}/value-chain/pathways/${index}`)}
                                >
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                    <div className="text-[10px] text-green-700 font-medium">{pathway.category1}</div>
                                    <div className="text-xs font-semibold text-foreground truncate">{pathway.feedstock}</div>
                                  </div>
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                    <div className="text-[10px] text-blue-700 font-medium">{pathway.category2}</div>
                                    <div className="text-xs font-semibold text-foreground truncate">{pathway.technology}</div>
                                  </div>
                                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                                    <div className="text-[10px] text-purple-700 font-medium">{pathway.category3}</div>
                                    <div className="text-xs font-semibold text-foreground truncate">{pathway.product}</div>
                                  </div>
                                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                                    <div className="text-[10px] text-orange-700 font-medium">{pathway.category4}</div>
                                    <div className="text-xs font-semibold text-foreground truncate">{pathway.application}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Popup Dialog */}
      <Dialog open={actionPopup.isOpen} onOpenChange={closeActionPopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              {actionPopup.itemName}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              What would you like to explore for this {actionPopup.category.toLowerCase()}?
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div 
                className={`group relative p-6 rounded-lg border-2 border-dashed ${getCategoryColors(actionPopup.category).borderColor} ${getCategoryColors(actionPopup.category).backgroundColor} ${getCategoryColors(actionPopup.category).hoverBackgroundColor} ${getCategoryColors(actionPopup.category).hoverBorderColor} transition-all duration-300 cursor-pointer text-center`}
                onClick={() => handleActionSelect("landscape")}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`p-3 rounded-full ${getCategoryColors(actionPopup.category).iconBackgroundColor} ${getCategoryColors(actionPopup.category).hoverIconBackgroundColor} transition-colors`}>
                    <MapPin className={`w-6 h-6 ${getCategoryColors(actionPopup.category).iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1 text-sm">Explore Landscape</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">View analysis & positioning</p>
                  </div>
                </div>
                <div className={`absolute inset-0 rounded-lg bg-gradient-to-t ${getCategoryColors(actionPopup.category).gradientColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
              
              <div 
                style={{
                  width: "100%",
                  padding: "24px",
                  border: "2px dashed #22c55e",
                  borderRadius: "8px",
                  backgroundColor: "#22c55e10",
                  cursor: "pointer",
                  textAlign: "center"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  alert("Value Chain clicked! Navigating...");
                  console.log("VALUE CHAIN CLICKED!");
                  
                  // Close popup immediately
                  setActionPopup({ isOpen: false, itemName: "", category: "" });
                  
                  // Navigate with a small delay
                  setTimeout(() => {
                    navigate("/landscape/Feedstock/Sugar%20Beet/value-chain");
                  }, 100);
                }}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-3 rounded-full bg-success/20 transition-colors">
                    <Users className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1 text-sm">Value Chain</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">Find partnerships</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal for detailed category information */}
      <Dialog open={modalData.isOpen} onOpenChange={(open) => setModalData(prev => ({...prev, isOpen: open}))}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {modalData.category} Details
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {modalData.items.map((item, index) => (
              <Card key={index} className="border border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-foreground">{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Examples:</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.examples.map((example, exampleIndex) => (
                        <span 
                          key={exampleIndex} 
                          className="inline-block px-3 py-1 text-xs bg-muted text-muted-foreground rounded-full border border-border/40"
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save to Project Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Pathway to Project</DialogTitle>
            <DialogDescription>
              Choose an existing project or create a new one to save this pathway.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {pathwayToSave && (
              <div className="p-3 bg-muted/30 rounded-lg text-sm">
                <div className="font-medium mb-1">Pathway from: {pathwayToSave.topic}</div>
                <div className="text-muted-foreground text-xs">
                  {pathwayToSave.feedstock} → {pathwayToSave.technology} → {pathwayToSave.product} → {pathwayToSave.application}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Button
                variant={!createNewProject ? "default" : "outline"}
                size="sm"
                onClick={() => setCreateNewProject(false)}
              >
                Existing Project
              </Button>
              <Button
                variant={createNewProject ? "default" : "outline"}
                size="sm"
                onClick={() => setCreateNewProject(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                New Project
              </Button>
            </div>
            
            {!createNewProject ? (
              <div className="space-y-2">
                <Label>Select Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} ({project.pathways.length} pathways)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {projects.length === 0 && (
                  <p className="text-xs text-muted-foreground">No projects yet. Create a new one!</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Project Name</Label>
                  <Input
                    id="new-name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g., Bioeconomy Research"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-owner">Owner</Label>
                  <Input
                    id="new-owner"
                    value={newProjectOwner}
                    onChange={(e) => setNewProjectOwner(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-goal">Goal</Label>
                  <Input
                    id="new-goal"
                    value={newProjectGoal}
                    onChange={(e) => setNewProjectGoal(e.target.value)}
                    placeholder="Project objective"
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveToProject}>
              <Bookmark className="w-4 h-4 mr-2" />
              Save Pathway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopicLandscape;