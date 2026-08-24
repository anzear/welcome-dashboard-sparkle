import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Target, Package, Settings2, FolderOpen, Beaker, Plus, CheckCircle, Play, ChevronDown, MapPin, Users, TrendingUp, GitBranch, Recycle, Sprout, Trash2, Sparkles, Eye, Clock, Search, Compass, BookMarked, ArrowRight } from "lucide-react";
import RequestItemModal from "@/components/RequestItemModal";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { computeBriefCompletion } from "@/components/MaterialBriefForm";
import { usePipelineBriefStore, BRIEF_PALETTE, PIPELINE_BRIEFS_EVENT } from "@/store/pipelineBriefStore";
import { useCurrentUser } from "@/lib/currentUser";
import MaterialAddDialog, { type MaterialAddIntent } from "@/components/MaterialAddDialog";
import { addPortfolioAddition } from "@/lib/portfolioAdditions";
import type { MaterialRole } from "@/types/materialPrioritisation";


const VCGWelcomeWidget = () => {
  const navigate = useNavigate();
  const [showAllFeedstock, setShowAllFeedstock] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);

  // State for portfolio items from localStorage
  const [feedstockItems, setFeedstockItems] = useState<any[]>([]);
  const [productItems, setProductItems] = useState<any[]>([]);

  // Helper to normalize portfolio items (string or object)
  const normalizeItem = (item: any) => {
    if (typeof item === 'string') {
      return { name: item, synonyms: '', objective: 'Valorise' as const };
    }
    return item;
  };

  // Load items from localStorage on mount
  useEffect(() => {
    const loadPortfolioItems = () => {
      // Feedstock: normalize and ensure Fructose has full object data
      let feedstock = JSON.parse(localStorage.getItem('portfolio_feedstock') || '[{"name":"Fructose","synonyms":"","objective":"Valorise","category":"Side Stream","isNew":false}]');
      feedstock = feedstock.filter((item: any) => {
        const name = typeof item === 'string' ? item : item?.name;
        return name && name !== 'K';
      });
      const normalizedFeedstock = feedstock.map((item: any) => {
        if (typeof item === 'string' && item === 'Fructose') {
          return { name: 'Fructose', synonyms: '', objective: 'Valorise', category: 'Side Stream', isNew: false };
        }
        return item;
      });
      const hasFructose = normalizedFeedstock.some((item: any) =>
        (typeof item === 'string' ? item : item?.name) === 'Fructose'
      );
      if (!hasFructose) {
        normalizedFeedstock.unshift({ name: 'Fructose', synonyms: '', objective: 'Valorise', category: 'Side Stream', isNew: false });
      }
      setFeedstockItems(normalizedFeedstock);
      localStorage.setItem('portfolio_feedstock', JSON.stringify(normalizedFeedstock));

      // Products: normalize and ensure Lactic Acid has full object data, preserve Sulphuric Acid position
      let products = JSON.parse(localStorage.getItem('portfolio_product') || '[{"name":"Lactic Acid","synonyms":"","objective":"Produce","category":"Chemical","isNew":false}]');

      // Remove any string-only Lactic Acid and replace with full object
      products = products.map((item: any) => {
        if (typeof item === 'string' && item === 'Lactic Acid') {
          return { name: 'Lactic Acid', synonyms: '', objective: 'Produce', category: 'Chemical', isNew: false };
        }
        return item;
      });

      // Find if Lactic Acid exists as object
      const lacticIndex = products.findIndex((item: any) =>
        (typeof item === 'string' ? item : item?.name) === 'Lactic Acid'
      );

      const lacticAcidObj = { name: 'Lactic Acid', synonyms: '', objective: 'Produce', category: 'Chemical', isNew: false };

      if (lacticIndex === -1) {
        // Lactic Acid missing — add at top
        products.unshift(lacticAcidObj);
      } else if (lacticIndex !== 0) {
        // Lactic Acid exists but not at top — move to top
        const [item] = products.splice(lacticIndex, 1);
        products.unshift(item);
      }

      // Ensure Sulphuric Acid stays at index 2 (third position)
      const sulphuricIndex = products.findIndex((item: any) =>
        (typeof item === 'string' ? item : item?.name) === 'Sulphuric Acid'
      );
      if (sulphuricIndex !== -1 && sulphuricIndex !== 2 && products.length > 2) {
        const [sulphuricItem] = products.splice(sulphuricIndex, 1);
        products.splice(2, 0, sulphuricItem);
      }

      setProductItems(products);
      localStorage.setItem('portfolio_product', JSON.stringify(products));
    };

    loadPortfolioItems();

    // Listen for portfolio updates
    const handlePortfolioUpdate = () => {
      loadPortfolioItems();
    };

    window.addEventListener('portfolioUpdated', handlePortfolioUpdate);

    return () => {
      window.removeEventListener('portfolioUpdated', handlePortfolioUpdate);
    };
  }, []);

  // Material Prioritization state
  type Discovery = {
    id: string;
    name: string;
    objective: "Source" | "Produce" | "Valorise" | "";
    context: string;
    createdAt: number;
    owner: string;
    contributors: number;
    briefId?: string;
    status?: "Ordered";
  };
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [showDiscoveryDialog, setShowDiscoveryDialog] = useState(false);
  const [discoveryName, setDiscoveryName] = useState("");
  const [discoveryObjective, setDiscoveryObjective] = useState<"Source" | "Produce" | "Valorise" | "">("");
  const [discoveryContext, setDiscoveryContext] = useState("");
  const [discoveryBriefMode, setDiscoveryBriefMode] = useState<"none" | "existing" | "new">("none");
  const [discoveryBriefId, setDiscoveryBriefId] = useState<string>("");
  const [discoveryNewBriefName, setDiscoveryNewBriefName] = useState("");
  const [, setBriefsTick] = useState(0);
  const currentUser = useCurrentUser();
  const briefOrder = usePipelineBriefStore((s) => s.order);
  const briefsMap = usePipelineBriefStore((s) => s.briefs);
  const createBrief = usePipelineBriefStore((s) => s.create);
  const allBriefs = useMemo(
    () => briefOrder.map((id) => briefsMap[id]).filter(Boolean),
    [briefOrder, briefsMap]
  );

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("portfolio_discoveries");
        setDiscoveries(raw ? JSON.parse(raw) : []);
      } catch {
        setDiscoveries([]);
      }
    };
    load();
    window.addEventListener("discoveriesUpdated", load);
    const bh = () => setBriefsTick((t) => t + 1);
    window.addEventListener(PIPELINE_BRIEFS_EVENT, bh);
    return () => {
      window.removeEventListener("discoveriesUpdated", load);
      window.removeEventListener(PIPELINE_BRIEFS_EVENT, bh);
    };
  }, []);

  const resetDiscoveryForm = () => {
    setDiscoveryName("");
    setDiscoveryObjective("");
    setDiscoveryContext("");
    setDiscoveryBriefMode("none");
    setDiscoveryBriefId("");
    setDiscoveryNewBriefName("");
  };

  const handleStartDiscovery = () => {
    const name = discoveryName.trim() || "Untitled discovery";
    let briefId: string | undefined;
    if (discoveryBriefMode === "existing" && discoveryBriefId) {
      briefId = discoveryBriefId;
    } else if (discoveryBriefMode === "new" && discoveryNewBriefName.trim()) {
      const b = createBrief(discoveryNewBriefName.trim(), currentUser.name);
      briefId = b.id;
    }
    const newDiscovery: Discovery = {
      id: `disc-${Date.now()}`,
      name,
      objective: discoveryObjective,
      context: discoveryContext.trim(),
      createdAt: Date.now(),
      owner: currentUser.name || "Jon Doe",
      contributors: 1,
      briefId,
    };
    const existing: Discovery[] = (() => {
      try { return JSON.parse(localStorage.getItem("portfolio_discoveries") || "[]"); } catch { return []; }
    })();
    const updated = [newDiscovery, ...existing];
    localStorage.setItem("portfolio_discoveries", JSON.stringify(updated));
    setDiscoveries(updated);
    window.dispatchEvent(new Event("discoveriesUpdated"));
    setShowDiscoveryDialog(false);
    resetDiscoveryForm();
    navigate("/material-pipeline");
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

  // State for analysis form
  const [analysisName, setAnalysisName] = useState("");
  const [analysisOwner, setAnalysisOwner] = useState("");

  // State for goal/context dialog
  const [showPathSelection, setShowPathSelection] = useState(false);
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [selectedPath, setSelectedPath] = useState<"know" | "ai" | "browse" | null>(null);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [showBrowseTypeSelection, setShowBrowseTypeSelection] = useState(false);
  const [showBrowseCategories, setShowBrowseCategories] = useState(false);
  const [selectedBrowseType, setSelectedBrowseType] = useState<"feedstock" | "product" | null>(null);
  const [selectedCategoryInBrowse, setSelectedCategoryInBrowse] = useState<string | null>(null);
  const [selectedBrowseCategory, setSelectedBrowseCategory] = useState<{type: "feedstock" | "product";category: string;} | null>(null);
  const [userGoal, setUserGoal] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [showCustomItemDialog, setShowCustomItemDialog] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemCategory, setCustomItemCategory] = useState<"Feedstock" | "Product">("Feedstock");
  const [customItemSubcategory, setCustomItemSubcategory] = useState("");
  const [customItemDescription, setCustomItemDescription] = useState("");
  const [customItemSynonyms, setCustomItemSynonyms] = useState("");
  const [customItemObjective, setCustomItemObjective] = useState<"Source" | "Produce" | "Valorise" | "">("Source");
  // The add flow serves two different acts: coverage (research) or portfolio (internal tracking).
  const [customItemIntent, setCustomItemIntent] = useState<MaterialAddIntent | "">("");
  const [customItemRole, setCustomItemRole] = useState<MaterialRole | "">("");

  // State for dynamic suggestions
  const [currentSuggestions, setCurrentSuggestions] = useState<{
    feedstocks: string[];
    products: string[];
  }>({ feedstocks: [], products: [] });

  // Grouped library data for browse
  const browseLibrary = {
    feedstocks: {
      "Agricultural Residues": ['Corn Stover', 'Wheat Straw', 'Rice Husk', 'Sugarcane Bagasse'],
      "Forestry & Plant-Based": ['Wood Biomass', 'Cotton', 'Hemp', 'Bamboo'],
      "Food & Organic Waste": ['Food Waste', 'Agricultural Waste', 'Algae'],
      "Municipal Solid Waste": ['Mixed MSW', 'Paper Waste', 'Cardboard'],
      "Industrial By-products": ['Steel Slag', 'Fly Ash', 'Chemical Residues'],
      "Marine Resources": ['Seaweed', 'Kelp', 'Fish Waste', 'Shellfish Waste'],
      "Animal By-products": ['Manure', 'Bone Meal', 'Blood Meal', 'Feather Meal'],
      "Oil & Fat Sources": ['Used Cooking Oil', 'Tallow', 'Animal Fats'],
      "Aquatic Plants": ['Water Hyacinth', 'Duckweed', 'Azolla'],
      "Energy Crops": ['Miscanthus', 'Switchgrass', 'Willow', 'Poplar']
    },
    products: {
      "Chemicals": ['Organic Acids', 'Enzymes', 'Bio-surfactants', 'Bio-solvents', 'Amino Acids'],
      "Materials & Polymers": ['Bioplastics', 'Bio-polymers', 'Bio-oils'],
      "Energy & Fuels": ['Bio-ethanol', 'Bio-fuels'],
      "Nutrition & Health": ['Vitamins'],
      "Pharmaceuticals": ['Antibiotics', 'Vaccines', 'Therapeutic Proteins'],
      "Food Ingredients": ['Sweeteners', 'Preservatives', 'Flavor Compounds'],
      "Cosmetics & Personal Care": ['Bio-actives', 'Emulsifiers', 'Moisturizers'],
      "Agricultural Products": ['Bio-fertilizers', 'Bio-pesticides', 'Growth Promoters'],
      "Construction Materials": ['Bio-composites', 'Insulation Materials', 'Adhesives'],
      "Textiles": ['Bio-fibers', 'Bio-dyes', 'Textile Coatings']
    }
  };

  // Generate mock AI suggestions based on user goal
  const generateSuggestions = (goal: string) => {
    // In a real implementation, this would call an AI service
    // For now, return mock suggestions based on keywords
    const lowerGoal = goal.toLowerCase();

    const suggestions = {
      feedstocks: [] as string[],
      products: [] as string[]
    };

    if (lowerGoal.includes('drone') || lowerGoal.includes('metal') || lowerGoal.includes('sustainable')) {
      suggestions.feedstocks = ['Recycled Aluminum', 'Bio-based Carbon Fiber', 'Recycled Steel', 'Hemp Fiber', 'Bamboo Fiber', 'Flax', 'Jute', 'Kenaf'];
      suggestions.products = ['Lightweight Alloys', 'Composite Materials', 'Bio-plastics', 'Carbon Neutral Metals', 'Structural Composites', 'Advanced Ceramics'];
    } else if (lowerGoal.includes('packaging')) {
      suggestions.feedstocks = ['Recycled Paper', 'Bamboo', 'Corn Starch', 'Seaweed', 'Sugarcane Bagasse', 'Mushroom Mycelium'];
      suggestions.products = ['Biodegradable Film', 'Compostable Containers', 'Paper-based Solutions', 'Molded Fiber', 'Bio-coatings'];
    } else {
      suggestions.feedstocks = ['Corn Stover', 'Wheat Straw', 'Wood Biomass', 'Algae', 'Agricultural Waste', 'Food Waste'];
      suggestions.products = ['Lactic Acid', 'Bioplastics', 'Organic Acids', 'Enzymes', 'Bio-surfactants', 'Bio-solvents'];
    }

    return suggestions;
  };

  const handleAddSuggestion = (item: string | object, category: string, objective?: "Source" | "Produce" | "Valorise") => {
    const storageKey = `portfolio_${category.toLowerCase()}`;
    const currentItems = JSON.parse(localStorage.getItem(storageKey) || '[]');

    const itemName = typeof item === 'string' ? item : (item as any).name;
    const itemObjective = objective || (typeof item === 'object' ? (item as any).objective : undefined);

    const exists = currentItems.some((existing: any) => {
      const existingName = typeof existing === 'string' ? existing : existing?.name;
      return existingName === itemName;
    });

    if (!exists) {
      const newItem = typeof item === 'object' ? item : {
        name: item,
        synonyms: '',
        objective: itemObjective || (category.toLowerCase() === 'feedstock' ? 'Valorise' : 'Produce')
      };
      currentItems.push(newItem);
      localStorage.setItem(storageKey, JSON.stringify(currentItems));
      window.dispatchEvent(new Event('portfolioUpdated'));

      setSelectedItem(itemName);
      setShowItemSelection(false);

      // Show toast with icon inline and better text distribution
      toast("Analysis in Progress", {
        description:
        <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
            <span>
              We are looking through all relevant documentation for your selection. 
              VCG will notify when the analysis for <span className="font-semibold text-success">{itemName}</span> will be 
              available in your portfolio for review.
            </span>
          </div>,

        duration: 6000
      });
    }
  };

  // Mock saved analyses
  const savedAnalyses = [
  { id: 1, name: "Q4 2024 Market Analysis", owner: "John Doe", date: "Dec 15, 2024" },
  { id: 2, name: "Competitive Landscape Study", owner: "Jane Smith", date: "Nov 28, 2024" }];


  const handleTopicClick = (itemName: string, category: string) => {
    navigate(`/landscape/${encodeURIComponent(category)}/${encodeURIComponent(itemName)}/value-chain`);
  };

  // Handler for closing action popup
  const closeActionPopup = () => {
    setActionPopup({
      isOpen: false,
      itemName: "",
      category: ""
    });
  };

  // Handle starting a new analysis
  const handleStartAnalysis = () => {
    console.log(`Starting analysis: ${analysisName} for ${actionPopup.itemName} (Owner: ${analysisOwner})`);
    navigate(`/landscape/${encodeURIComponent(actionPopup.category)}/${encodeURIComponent(actionPopup.itemName)}/value-chain`);
    closeActionPopup();
  };

  // Handle selecting a saved analysis
  const handleSelectSavedAnalysis = (analysisId: number) => {
    console.log(`Loading saved analysis: ${analysisId}`);
    navigate(`/landscape/${encodeURIComponent(actionPopup.category)}/${encodeURIComponent(actionPopup.itemName)}/value-chain`);
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

  const resetCustomItemForm = () => {
    setCustomItemName("");
    setCustomItemSubcategory("");
    setCustomItemDescription("");
    setCustomItemSynonyms("");
    setCustomItemObjective("Source");
    setCustomItemIntent("");
    setCustomItemRole("");
  };

  /** Portfolio path — internal tracking only, no coverage is requested. */
  const handleAddToPortfolio = () => {
    const itemName = customItemName.trim();
    if (!itemName || !customItemRole) return;
    const added = addPortfolioAddition({
      name: itemName,
      synonyms: customItemSynonyms.trim(),
      role: customItemRole,
    });
    toast(added ? "Added to your portfolio" : "Already in your portfolio", {
      description: added
        ? `${itemName} is now in the Material Portfolio register. Fill in the rest there.`
        : `${itemName} is already tracked in the Material Portfolio.`,
      duration: 6000,
    });
    setShowCustomItemDialog(false);
    resetCustomItemForm();
  };

  const handleCustomItemSubmit = () => {
    if (!customItemName.trim() || !customItemObjective) return;

    const resolvedCategory = customItemObjective === "Produce" ? "Product" : "Feedstock";
    const storageKey = `portfolio_${resolvedCategory.toLowerCase()}`;
    const existingItems = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const itemName = customItemName.trim();
    const newItem = {
      name: itemName,
      synonyms: customItemSynonyms.trim(),
      objective: customItemObjective,
      category: resolvedCategory,
      isNew: true,
    };
    const exists = existingItems.some((item: any) =>
      typeof item === "string" ? item === itemName : item.name === itemName
    );

    if (!exists) {
      localStorage.setItem(storageKey, JSON.stringify([newItem, ...existingItems]));
      const timestampKey = `portfolio_${resolvedCategory.toLowerCase()}_timestamps`;
      const timestamps = JSON.parse(localStorage.getItem(timestampKey) || "{}");
      timestamps[itemName] = Date.now();
      localStorage.setItem(timestampKey, JSON.stringify(timestamps));
      window.dispatchEvent(new CustomEvent("portfolioUpdated", {
        detail: { category: resolvedCategory, itemName },
      }));
      toast("Analysis in Progress", {
        description: (
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
            <span>
              We are looking through all relevant documentation for your selection.
              VCG will notify when the analysis for <span className="font-semibold text-success">{itemName}</span> will be available in your portfolio for review.
            </span>
          </div>
        ),
        duration: 6000,
      });
    }

    setShowCustomItemDialog(false);
    resetCustomItemForm();
  };

  const ITEMS_PER_PAGE = 5;
  interface CategoryItem {
    name: string;
    count: number | string;
    isApproved?: boolean;
    approvedAt?: string;
  }

  // Check if an item is new (added in the last 24 hours)
  const isNewItem = (category: string, itemName: string) => {
    const timestampKey = `portfolio_${category.toLowerCase()}_timestamps`;
    const timestamps = JSON.parse(localStorage.getItem(timestampKey) || '{}');
    const timestamp = timestamps[itemName];
    if (!timestamp) return false;
    const hoursSinceAdded = (Date.now() - timestamp) / (1000 * 60 * 60);
    return hoursSinceAdded < 24; // New if added within 24 hours
  };

  // Function to categorize feedstock items
  const categorizeFeedstock = (name: string): string => {
    // You can customize this logic based on your needs
    const biomassKeywords = ['biomass', 'algae', 'wood', 'bamboo'];
    const primaryKeywords = ['sugar', 'fructose', 'glucose'];
    const secondaryKeywords = ['digestate', 'spent grain', 'husk'];

    const lowerName = name.toLowerCase();

    if (biomassKeywords.some((keyword) => lowerName.includes(keyword))) {
      return 'Biomass';
    } else if (primaryKeywords.some((keyword) => lowerName.includes(keyword))) {
      return 'Primary Feedstock';
    } else if (secondaryKeywords.some((keyword) => lowerName.includes(keyword))) {
      return 'Secondary Feedstock';
    }
    return 'Tertiary Feedstock';
  };

  // Generate dynamic data from localStorage state
  const feedstockData: CategoryItem[] = feedstockItems.map((item) => {
    const name = typeof item === 'string' ? item : item.name;
    return {
      name,
      count: Math.floor(Math.random() * 50)
    };
  });

  // Group feedstock by category
  const groupedFeedstock = feedstockData.reduce((acc, item) => {
    const category = categorizeFeedstock(item.name);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, CategoryItem[]>);

  const feedstockCategories = ['Biomass', 'Primary Feedstock', 'Secondary Feedstock', 'Tertiary Feedstock'];

  const productsData: CategoryItem[] = productItems.map((item) => {
    const name = typeof item === 'string' ? item : item.name;
    return {
      name,
      count: Math.floor(Math.random() * 10)
    };
  });

  // Deterministic Produce/Source assignment for product items
  const productTagFor = (name: string): "PRODUCE" | "SOURCE" => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return h % 2 === 0 ? "PRODUCE" : "SOURCE";
  };

  // ── Material brief progress ───────────────────────────────────────────────
  // Mirrors the section-completion logic in MaterialBriefForm.tsx
  const [briefTick, setBriefTick] = useState(0);
  useEffect(() => {
    const onStorage = () => setBriefTick(t => t + 1);
    window.addEventListener('storage', onStorage);
    window.addEventListener('materialBriefUpdated', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('materialBriefUpdated', onStorage);
    };
  }, []);

  const getBriefStatus = (name: string, category: 'Feedstock' | 'Product') => {
    void briefTick;
    const raw = localStorage.getItem(`material-brief-v2-${category}-${name}`);
    if (!raw) return { completed: 0, total: 6, label: 'Not started' as const };
    let d: any = {};
    try { d = JSON.parse(raw); } catch { /* */ }
    const { completed, total } = computeBriefCompletion(d);
    const label = completed === 0 ? 'Not started' : completed === total ? 'Complete' : 'In progress';
    return { completed, total, label };
  };


  const topicCards = [
    ...feedstockItems.map((item) => {
      const normalized = normalizeItem(item);
      const isNew = !!(typeof item === 'object' && item?.isNew);
      return {
        name: normalized.name,
        category: "FEEDSTOCK" as const,
        tag: (normalized.objective || "VALORISE").toUpperCase() as "SOURCE" | "PRODUCE" | "VALORISE",
        description: `Analysis tracking for ${normalized.name}. Monitor supply chain dynamics, pricing trends, and market developments.`,
        status: isNew ? "brief-pending" : (Math.random() > 0.5 ? "new-updates" : "tracking"),
        insights: isNew ? 0 : Math.floor(Math.random() * 8) + 1,
        lastUpdated: isNew ? null : ["2 hours ago", "Yesterday", "3 days ago", "1 day ago", "5 days ago", "4 hours ago"][Math.floor(Math.random() * 6)],
        hasNotification: !isNew && Math.random() > 0.7,
        isNew,
      };
    }),
    ...productItems.map((item) => {
      const normalized = normalizeItem(item);
      const isNew = !!(typeof item === 'object' && item?.isNew);
      return {
        name: normalized.name,
        category: "PRODUCT" as const,
        tag: (normalized.objective || productTagFor(normalized.name)).toUpperCase() as "SOURCE" | "PRODUCE" | "VALORISE",
        description: `Product intelligence for ${normalized.name}. Track applications, regulatory changes, and competitive landscape.`,
        status: isNew ? "brief-pending" : (Math.random() > 0.6 ? "recently-viewed" : "new-updates"),
        insights: isNew ? 0 : Math.floor(Math.random() * 8) + 1,
        lastUpdated: isNew ? null : ["2 hours ago", "Yesterday", "3 days ago", "1 day ago", "5 days ago", "4 hours ago"][Math.floor(Math.random() * 6)],
        hasNotification: !isNew && Math.random() > 0.7,
        isNew,
      };
    })
  ];


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new-updates":
        return (
          <div className="flex items-center gap-1 text-xs text-primary font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            New updates
          </div>);

      case "tracking":
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
            <Eye className="w-3.5 h-3.5" />
            Tracking
          </div>);

      case "recently-viewed":
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
            <Clock className="w-3.5 h-3.5" />
            Recently viewed
          </div>);

      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {/* YOUR TOPICS Header — coverage we hold, not the Material Portfolio */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">YOUR TOPICS</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Materials VCG is tracking for you. Start anywhere — each topic tells a story.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-[11px] text-muted-foreground hover:text-foreground h-6 px-2 gap-1"
          onClick={() => {
            setSelectedPath("know");
            setCustomItemCategory("Feedstock");
            setCustomItemSubcategory("");
            setCustomItemObjective("Source");
            setShowCustomItemDialog(true);
          }}
        >
          <Plus className="w-3 h-3" />
          Add
        </Button>
      </div>

      {/* Dialogs */}
      <Dialog open={showPathSelection} onOpenChange={setShowPathSelection}>
        <DialogTrigger asChild>
          <span className="hidden" />
        </DialogTrigger>
              <DialogContent className="sm:max-w-2xl p-8 bg-gradient-to-br from-card to-card/95 border border-border/40 shadow-xl">
                 <DialogHeader className="space-y-3 mb-6">
                   <DialogTitle className="text-2xl font-semibold text-foreground">
                     Request New Topics
                   </DialogTitle>
                   <p className="text-sm text-muted-foreground leading-relaxed">
                     Choose how you'd like to add new feedstocks or products topics to your analysis portfolio.
                   </p>
                 </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Option 1: I know what I want */}
                  <button
              onClick={() => {
                setSelectedPath("know");
                setShowPathSelection(false);
                setCustomItemCategory("Feedstock");
                setCustomItemSubcategory("");
                setShowCustomItemDialog(true);
              }}
              className="group flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 border-border/40 hover:border-primary/50 bg-background hover:bg-primary/5 transition-all duration-200 text-center shadow-sm hover:shadow-md h-64">
              
                    <div className="flex-shrink-0 p-3 rounded-xl bg-success/10 border border-success/20 group-hover:bg-success/20 transition-colors">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-semibold text-base text-foreground">I know what I want</h3>
                      <p className="text-[11px] text-muted-foreground leading-tight px-1">
                        Choose your use case and add the specific feedstocks or products you want to analyze.
                      </p>
                    </div>
                  </button>
                  
                  {/* Option 3: Browse Library */}
                  <button
              onClick={() => {
                setSelectedPath("browse");
                setShowPathSelection(false);
                setShowBrowseTypeSelection(true);
              }}
              className="group flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 border-border/40 hover:border-primary/50 bg-background hover:bg-primary/5 transition-all duration-200 text-center shadow-sm hover:shadow-md h-64">
              
                    <div className="flex-shrink-0 p-3 rounded-xl bg-success/10 border border-success/20 group-hover:bg-success/20 transition-colors">
                      <FolderOpen className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-semibold text-base text-foreground">Browse our library</h3>
                      <p className="text-[11px] text-muted-foreground leading-tight px-1">
                        Explore our complete database of available feedstocks and products.
                      </p>
                    </div>
                  </button>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Category Selection Dialog - For "I know what I want" path */}
            <Dialog open={showCategorySelection} onOpenChange={setShowCategorySelection}>
              <DialogContent className="sm:max-w-2xl p-8 bg-gradient-to-br from-card to-card/95 border border-border/40 shadow-xl">
                <DialogHeader className="space-y-3 mb-6">
                  <DialogTitle className="text-2xl font-semibold text-foreground">
                    What would you like to add?
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Choose the type of item you want to add to your portfolio.
                  </p>
                </DialogHeader>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* Option 1: Valorise a side stream */}
                  <button
              onClick={() => {
                setCustomItemCategory("Feedstock");
                setCustomItemSubcategory("Valorise a side stream");
                setShowCategorySelection(false);
                setShowCustomItemDialog(true);
              }}
              className="group flex items-center gap-4 py-2.5 px-3 rounded-xl border-2 border-border/40 hover:border-primary/50 bg-background hover:bg-primary/5 transition-all duration-200 shadow-sm hover:shadow-md">
              
                    <div className="flex-shrink-0 p-3 rounded-xl bg-success/10 border border-success/20 group-hover:bg-success/20 transition-colors">
                      <Trash2 className="w-4 h-4 text-success" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-sm text-foreground">Valorise a side stream</h3>
                    </div>
                  </button>
                  
                  {/* Option 2: Valorise an intermediate */}
                  <button
              onClick={() => {
                setCustomItemCategory("Feedstock");
                setCustomItemSubcategory("Valorise an intermediate");
                setShowCategorySelection(false);
                setShowCustomItemDialog(true);
              }}
              className="group flex items-center gap-4 py-2.5 px-3 rounded-xl border-2 border-border/40 hover:border-primary/50 bg-background hover:bg-primary/5 transition-all duration-200 shadow-sm hover:shadow-md">
              
                    <div className="flex-shrink-0 p-3 rounded-xl bg-success/10 border border-success/20 group-hover:bg-success/20 transition-colors">
                      <GitBranch className="w-4 h-4 text-success" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-sm text-foreground">Valorise an intermediate</h3>
                    </div>
                  </button>
                  
                  {/* Option 3: Produce circular biobase material */}
                  <button
              onClick={() => {
                setCustomItemCategory("Product");
                setCustomItemSubcategory("Produce circular biobase material");
                setShowCategorySelection(false);
                setShowCustomItemDialog(true);
              }}
              className="group flex items-center gap-4 py-2.5 px-3 rounded-xl border-2 border-border/40 hover:border-primary/50 bg-background hover:bg-primary/5 transition-all duration-200 shadow-sm hover:shadow-md">
              
                    <div className="flex-shrink-0 p-3 rounded-xl bg-application-purple/10 border border-application-purple/20 group-hover:bg-application-purple/20 transition-colors">
                      <Recycle className="w-4 h-4 text-application-purple" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-sm text-foreground">Produce circular biobase material</h3>
                    </div>
                  </button>
                  
                  {/* Option 4: Source circular biobase raw material */}
                  <button
              onClick={() => {
                setCustomItemCategory("Product");
                setCustomItemSubcategory("Source circular biobase raw material");
                setShowCategorySelection(false);
                setShowCustomItemDialog(true);
              }}
              className="group flex items-center gap-4 py-2.5 px-3 rounded-xl border-2 border-border/40 hover:border-primary/50 bg-background hover:bg-primary/5 transition-all duration-200 shadow-sm hover:shadow-md">
              
                    <div className="flex-shrink-0 p-3 rounded-xl bg-application-purple/10 border border-application-purple/20 group-hover:bg-application-purple/20 transition-colors">
                      <Sprout className="w-4 h-4 text-application-purple" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-sm text-foreground">Source circular biobase raw material</h3>
                    </div>
                  </button>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Goal/Context Dialog */}
            <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
              <DialogContent className="sm:max-w-2xl p-8 bg-gradient-to-br from-card to-card/95 border border-border/40 shadow-xl">
                <DialogHeader className="space-y-3 mb-4">
                  <DialogTitle className="text-2xl font-semibold">
                    Tell us about Your Project
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Help us understand what you're working on and what you're trying to achieve. This will help you get more relevant results.
                  </p>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <Label htmlFor="user-goal" className="text-sm font-semibold">
                      What are you working on?
                    </Label>
                    <Textarea
                id="user-goal"
                placeholder="Example: I am working on looking for sustainable supply for drone manufacturing. I am especially interested in feedstocks or inputs to produce sustainable metals. What products and feedstocks should I run?"
                value={userGoal}
                onChange={(e) => setUserGoal(e.target.value)}
                className="h-32 resize-none border-2 border-success/20 focus:border-success/40 bg-background rounded-xl" />
              
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                variant="outline"
                onClick={() => {
                  setShowGoalDialog(false);
                  setUserGoal("");
                }}
                className="px-8 border-2">
                
                      Cancel
                    </Button>
                    <Button
                onClick={() => {
                  // Generate suggestions before opening the selection dialog
                  const suggestions = generateSuggestions(userGoal);
                  setCurrentSuggestions(suggestions);
                  setShowGoalDialog(false);
                  setShowItemSelection(true);
                }}
                disabled={!userGoal.trim()}
                className="bg-success hover:bg-success/90 px-8">
                
                      Continue
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* AI Suggestions Dialog */}
            <Dialog
        open={showItemSelection}
        onOpenChange={(open) => {
          if (open && !currentSuggestions.feedstocks.length && !currentSuggestions.products.length) {
            // Initialize suggestions when dialog opens
            const suggestions = generateSuggestions(userGoal);
            setCurrentSuggestions(suggestions);
          }
          setShowItemSelection(open);
        }}>
        
              <DialogContent className="sm:max-w-2xl p-8 bg-gradient-to-br from-card to-card/95 border border-border/40 shadow-xl">
                <DialogHeader className="pb-4 space-y-3 -mb-2">
                  <DialogTitle className="text-2xl font-semibold">
                    {selectedPath === "ai" ? "Your Tailored Suggestions" :
              selectedPath === "browse" && selectedBrowseCategory ? selectedBrowseCategory.category :
              "Select Items"}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedPath === "ai" ?
              "Based on your goal, we've identified these relevant topics. Click on any suggestion to add it to your portfolio." :
              selectedPath === "browse" && selectedBrowseCategory ?
              `Browse ${selectedBrowseCategory.type === "feedstock" ? "feedstocks" : "products"} in this category. Click on any item to add it to your portfolio.` :
              "Click on any item to add it to your portfolio."}
                  </p>
                  {selectedPath === "browse" && selectedBrowseCategory &&
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowItemSelection(false);
                setSelectedBrowseCategory(null);
                setShowBrowseCategories(true);
              }}
              className="text-xs text-muted-foreground hover:text-foreground">
              
                      ← Back to categories
                    </Button>
            }
                </DialogHeader>
                
                <div className={selectedPath === "browse" ? "" : "grid grid-cols-2 gap-6"}>
                  {/* Feedstock Suggestions - Left Column or Full Width for Browse Feedstock */}
                  {(selectedPath === "ai" || selectedPath === "browse" && selectedBrowseCategory?.type === "feedstock") &&
            <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-success/10 border border-success/20 shadow-sm">
                        <Settings2 className="w-4 h-4 text-success" />
                      </div>
                      <h3 className="font-semibold text-base text-foreground">
                        {selectedPath === "ai" ? "Recommended Feedstocks" : selectedBrowseCategory?.category}
                      </h3>
                      <Badge variant="secondary" className="text-xs bg-success/10 text-success border-success/20">
                        {selectedPath === "browse" && selectedBrowseCategory?.type === "feedstock" ?
                  browseLibrary.feedstocks[selectedBrowseCategory.category]?.length || 0 :
                  currentSuggestions.feedstocks.length}
                      </Badge>
                    </div>
                    
                    {selectedPath === "browse" && selectedBrowseCategory && selectedBrowseCategory.type === "feedstock" ?
              // Show only selected category for browse
              <div className="space-y-1">
                        {browseLibrary.feedstocks[selectedBrowseCategory.category]?.map((feedstock, index) =>
                <button
                  key={index}
                  onClick={() => {
                    handleAddSuggestion(feedstock, 'Feedstock');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-success/5 hover:bg-success/10 transition-colors cursor-pointer text-left text-xs">
                  
                             <span className="text-xs text-foreground">{feedstock}</span>
                             <Plus className="w-3.5 h-3.5 text-success" />
                           </button>
                )}
                      </div> :
              selectedPath === "ai" ?
              // Flat list for AI suggestions
              <div className="space-y-1">
                        {currentSuggestions.feedstocks.map((feedstock, index) =>
                <button
                  key={index}
                  onClick={() => {
                    handleAddSuggestion(feedstock, 'Feedstock');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-success/5 hover:bg-success/10 transition-colors cursor-pointer text-left text-xs">
                  
                             <span className="text-xs text-foreground">{feedstock}</span>
                             <Plus className="w-3.5 h-3.5 text-success" />
                           </button>
                )}
                      </div> :
              null}
                  </div>
            }

                  {/* Product Suggestions - Right Column or Full Width for Browse Product */}
                  {(selectedPath === "ai" || selectedPath === "browse" && selectedBrowseCategory?.type === "product") &&
            <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-application-purple/10 border border-application-purple/20 shadow-sm">
                        <Package className="w-4 h-4 text-application-purple" />
                      </div>
                      <h3 className="font-semibold text-base text-foreground">
                        {selectedPath === "ai" ? "Recommended Products" : selectedBrowseCategory?.category}
                      </h3>
                      <Badge variant="secondary" className="text-xs bg-application-purple/10 text-application-purple border-application-purple/20">
                        {selectedPath === "browse" && selectedBrowseCategory && selectedBrowseCategory.type === "product" ?
                  browseLibrary.products[selectedBrowseCategory.category]?.length || 0 :
                  selectedPath === "ai" ?
                  currentSuggestions.products.length :
                  0}
                      </Badge>
                    </div>
                    
                    {selectedPath === "browse" && selectedBrowseCategory && selectedBrowseCategory.type === "product" ?
              // Show only selected category for browse
              <div className="space-y-1">
                        {browseLibrary.products[selectedBrowseCategory.category]?.map((product, index) =>
                <button
                  key={index}
                  onClick={() => {
                    handleAddSuggestion(product, 'Product');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-application-purple/5 hover:bg-application-purple/10 transition-colors cursor-pointer text-left text-xs">
                  
                             <span className="text-xs text-foreground">{product}</span>
                             <Plus className="w-3.5 h-3.5 text-application-purple" />
                           </button>
                )}
                      </div> :
              selectedPath === "ai" ?
              // Flat list for AI suggestions
              <div className="space-y-1">
                        {currentSuggestions.products.map((product, index) =>
                <button
                  key={index}
                  onClick={() => {
                    handleAddSuggestion(product, 'Product');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-application-purple/5 hover:bg-application-purple/10 transition-colors cursor-pointer text-left text-xs">
                  
                             <span className="text-xs text-foreground">{product}</span>
                             <Plus className="w-3.5 h-3.5 text-application-purple" />
                           </button>
                )}
                      </div> :
              null}
                  </div>
            }
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Step 3: Confirmation - Now handled by toast notification */}
            
            {/* Browse Type Selection Dialog - For "Browse library" path */}
            <Dialog open={showBrowseTypeSelection} onOpenChange={setShowBrowseTypeSelection}>
              <DialogContent className="sm:max-w-2xl p-8 bg-gradient-to-br from-card to-card/95 border border-border/40 shadow-xl">
                <DialogHeader className="space-y-3 mb-6">
                  <DialogTitle className="text-2xl font-semibold text-foreground">
                    What would you like to browse?
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Choose the type of items you want to explore.
                  </p>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Feedstock Option */}
                  <button
              onClick={() => {
                setSelectedBrowseType("feedstock");
                setSelectedCategoryInBrowse(null);
                setShowBrowseTypeSelection(false);
                setShowBrowseCategories(true);
              }}
              className="group flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 border-border/40 hover:border-primary/50 bg-background hover:bg-primary/5 transition-all duration-200 text-center shadow-sm hover:shadow-md h-64">
              
                    <div className="flex-shrink-0 p-3 rounded-xl bg-success/10 border border-success/20 group-hover:bg-success/20 transition-colors">
                      <Settings2 className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-semibold text-base text-foreground">Browse Feedstocks</h3>
                      <p className="text-[11px] text-muted-foreground leading-tight px-1">
                        Explore available feedstock categories and items.
                      </p>
                    </div>
                  </button>
                  
                  {/* Product Option */}
                  <button
              onClick={() => {
                setSelectedBrowseType("product");
                setSelectedCategoryInBrowse(null);
                setShowBrowseTypeSelection(false);
                setShowBrowseCategories(true);
              }}
              className="group flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 border-border/40 hover:border-primary/50 bg-background hover:bg-primary/5 transition-all duration-200 text-center shadow-sm hover:shadow-md h-64">
              
                    <div className="flex-shrink-0 p-3 rounded-xl bg-application-purple/10 border border-application-purple/20 group-hover:bg-application-purple/20 transition-colors">
                      <Package className="w-6 h-6 text-application-purple" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-semibold text-base text-foreground">Browse Materials</h3>
                      <p className="text-[11px] text-muted-foreground leading-tight px-1">
                        Explore available material categories and items.
                      </p>
                    </div>
                  </button>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Browse Categories Dialog - Step 2: Show Categories */}
            <Dialog open={showBrowseCategories} onOpenChange={(open) => {
        setShowBrowseCategories(open);
        if (!open) setSelectedCategoryInBrowse(null);
      }}>
              <DialogContent className="sm:max-w-3xl p-6 bg-gradient-to-br from-card to-card/95 border border-border/40 shadow-xl">
                <DialogHeader className="space-y-2 mb-3">
                  <div className="flex items-center gap-3">
                    <DialogTitle className="text-2xl font-semibold">
                      {selectedBrowseType === "feedstock" ? "Feedstock Categories" : "Material Categories"}
                    </DialogTitle>
                    <Badge variant="secondary" className={`text-sm rounded-sm ${selectedBrowseType === "feedstock" ? "bg-success/10 text-success border-success/20" : "bg-application-purple/10 text-application-purple border-application-purple/20"}`}>
                      {selectedBrowseType === "feedstock" ?
                Object.keys(browseLibrary.feedstocks).length :
                Object.keys(browseLibrary.products).length}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Click on any category to browse topics within it.
                  </p>
                </DialogHeader>
                
                {/* Search Bar */}
                <div className="mb-3">
                  <Input
              placeholder="Search categories..."
              className="w-full h-9" />
            
                </div>
                
                {/* Two Column Layout: Categories Left, Items Right */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Categories Column */}
                  <div className="space-y-3">
                  <div className="divide-y divide-border max-h-[220px] overflow-y-auto">
                    {selectedBrowseType === "feedstock" ?
                Object.entries(browseLibrary.feedstocks).map(([category, items]) =>
                <button
                  key={category}
                  onClick={() => setSelectedCategoryInBrowse(category)}
                  className={`w-full flex items-center justify-between px-3 py-3 transition-colors cursor-pointer text-left ${
                  selectedCategoryInBrowse === category ? 'bg-success/10' : 'hover:bg-muted/30'}`
                  }>
                  
                          <span className="text-sm text-foreground font-medium">{category}</span>
                          <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
                        </button>
                ) :
                Object.entries(browseLibrary.products).map(([category, items]) =>
                <button
                  key={category}
                  onClick={() => setSelectedCategoryInBrowse(category)}
                  className={`w-full flex items-center justify-between px-3 py-3 transition-colors cursor-pointer text-left ${
                  selectedCategoryInBrowse === category ? 'bg-application-purple/10' : 'hover:bg-muted/30'}`
                  }>
                  
                          <span className="text-sm text-foreground font-medium">{category}</span>
                          <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
                        </button>
                )}
                  </div>
                </div>
                
                {/* Items Column */}
                <div className="space-y-2">
                  {selectedCategoryInBrowse ?
              <div className="space-y-1 max-h-[220px] overflow-y-auto">
                        {selectedBrowseType === "feedstock" ?
                browseLibrary.feedstocks[selectedCategoryInBrowse]?.map((item, index) =>
                <button
                  key={index}
                  onClick={() => {
                    handleAddSuggestion(item, 'Feedstock');
                    setShowBrowseCategories(false);
                    setSelectedCategoryInBrowse(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-success/5 hover:bg-success/10 transition-colors cursor-pointer text-left">
                  
                              <span className="text-sm text-foreground">{item}</span>
                              <Plus className="w-4 h-4 text-success" />
                            </button>
                ) :
                browseLibrary.products[selectedCategoryInBrowse]?.map((item, index) =>
                <button
                  key={index}
                  onClick={() => {
                    handleAddSuggestion(item, 'Product');
                    setShowBrowseCategories(false);
                    setSelectedCategoryInBrowse(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-application-purple/5 hover:bg-application-purple/10 transition-colors cursor-pointer text-left">
                  
                              <span className="text-sm text-foreground">{item}</span>
                              <Plus className="w-4 h-4 text-application-purple" />
                            </button>
                )}
                      </div> :

              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                      Select a category to view items
                    </div>
              }
                </div>
              </div>
              </DialogContent>
            </Dialog>
            
            <MaterialAddDialog
              open={showCustomItemDialog}
              onOpenChange={(open) => { setShowCustomItemDialog(open); if (!open) resetCustomItemForm(); }}
              name={customItemName}
              onNameChange={setCustomItemName}
              synonyms={customItemSynonyms}
              onSynonymsChange={setCustomItemSynonyms}
              objective={customItemObjective}
              onObjectiveChange={setCustomItemObjective}
              intent={customItemIntent}
              onIntentChange={setCustomItemIntent}
              role={customItemRole}
              onRoleChange={setCustomItemRole}
              onSubmit={handleCustomItemSubmit}
              onSubmitPortfolio={handleAddToPortfolio}
              onCancel={() => { setShowCustomItemDialog(false); resetCustomItemForm(); }}
            />

            {/* Action Popup Dialog */}
            <Dialog open={actionPopup.isOpen} onOpenChange={(open) => {
        if (!open) {
          setActionPopup({ isOpen: false, itemName: "", category: "" });
          setAnalysisName("");
          setAnalysisOwner("");
        }
      }}>
              <DialogContent className="sm:max-w-3xl p-8 bg-gradient-to-br from-card to-card/95 border border-border/40 shadow-xl">
                <DialogHeader className="space-y-3 mb-6">
                  <DialogTitle className="text-2xl font-semibold">What would you like to do?</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose an action for <span className="font-semibold text-foreground">{actionPopup.itemName}</span>
                  </p>
                </DialogHeader>
                
                <div className="space-y-3">
                  <button
              onClick={() => {
                setActionPopup({ ...actionPopup, isOpen: false });
                handleStartAnalysis();
              }}
              className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border/40 hover:border-success/50 bg-background hover:bg-success/5 transition-all duration-200 text-left shadow-sm hover:shadow-md">
              
                    <div className="p-3 rounded-xl bg-success/10 shadow-sm">
                      <Play className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-foreground mb-0.5">Start New Analysis</h3>
                      <p className="text-sm text-muted-foreground">Begin a fresh value chain analysis</p>
                    </div>
                  </button>

                  {savedAnalyses.length > 0 &&
            <div className="space-y-2 pt-2">
                      <p className="text-sm text-muted-foreground font-medium">Or select a saved analysis:</p>
                      {savedAnalyses.map((analysis) =>
              <button
                key={analysis.id}
                onClick={() => {
                  setActionPopup({ ...actionPopup, isOpen: false });
                  handleSelectSavedAnalysis(analysis.id);
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-border/40 hover:border-success/50 bg-background hover:bg-success/5 transition-all duration-200 text-left shadow-sm hover:shadow-md">
                
                          <div>
                            <h4 className="text-base font-medium text-foreground">{analysis.name}</h4>
                            <p className="text-sm text-muted-foreground">{analysis.owner} • {analysis.date}</p>
                          </div>
                        </button>
              )}
                    </div>
            }
                </div>
              </DialogContent>
            </Dialog>

          {/* Topic Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {discoveries.length > 0 && (() => {
              const inProgress = discoveries.filter((d: any) => d.status !== "Ordered").length;
              const ordered = discoveries.filter((d: any) => d.status === "Ordered").length;
              return (
                <Card
                  className="bg-muted/30 border border-dashed border-border/70 hover:border-primary/40 hover:bg-muted/40 hover:shadow-sm transition-all duration-200 cursor-pointer relative shadow-none"
                  onClick={() => navigate("/material-pipeline")}
                >
                  <div className="p-4">
                    <p className="text-[10px] font-semibold tracking-wider mb-1.5 text-muted-foreground inline-flex items-center gap-1">
                      <Compass className="w-3 h-3" /> DISCOVERY
                    </p>
                    <h3 className="text-sm font-bold text-muted-foreground mb-1.5">
                      Material Prioritization
                    </h3>
                    <div className="border-t border-dashed border-border/50 pt-2 mt-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50 opacity-60" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary/70" />
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {inProgress} in progress{ordered > 0 ? ` · ${ordered} ordered` : ""}
                          </span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })()}
            {topicCards.map((topic, index) =>
        <Card
          key={index}
          className="bg-card border border-border/60 hover:border-border hover:shadow-md transition-all duration-200 cursor-pointer relative"
          onClick={() => handleTopicClick(topic.name, topic.category === "FEEDSTOCK" ? "Feedstock" : "Product")}>
          
                {(() => {
            const cat = topic.category === 'FEEDSTOCK' ? 'Feedstock' : 'Product';
            const { label } = getBriefStatus(topic.name, cat);
            if (label !== 'Complete') return null;
            return (
              <div
                className="absolute top-3 right-3 w-2 h-2 rounded-full bg-success ring-2 ring-success/20"
                title="Intelligence layer activated"
              />
            );
          })()}
                <div className="p-4">
                  <p className={`text-[10px] font-semibold tracking-wider mb-1.5 ${
            topic.tag === "VALORISE" ? "text-success" :
            topic.tag === "PRODUCE" ? "text-application-purple" :
            "text-primary"}`
            }>
                    {topic.tag}
                  </p>
                  <h3 className="text-sm font-bold text-foreground mb-1.5">{topic.name}</h3>

                  {!topic.isNew && topic.lastUpdated && (
                    <div className="flex items-center gap-1.5 mb-2 -mt-0.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                      </span>
                      <span className="text-[10px] font-medium text-foreground/80">
                        New market signal
                      </span>
                      <span className="text-[10px] text-muted-foreground">· {topic.lastUpdated}</span>
                    </div>
                  )}

                  {(() => {
                    const cat = topic.category === 'FEEDSTOCK' ? 'Feedstock' : 'Product';
                    const { completed, total, label } = getBriefStatus(topic.name, cat);
                    const pct = Math.round((completed / total) * 100);
                    const barColor =
                      label === 'Complete' ? 'bg-success' :
                      label === 'In progress' ? 'bg-warning' :
                      'bg-muted-foreground/30';
                    const labelColor =
                      label === 'Complete' ? 'text-success' :
                      label === 'In progress' ? 'text-warning' :
                      'text-muted-foreground';
                    return (
                      <div className="border-t border-border/40 pt-2 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Material brief
                          </span>
                          <span className={`text-[9px] font-semibold ${labelColor} tabular-nums`}>
                            {label} · {completed}/{total}
                          </span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full ${barColor} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {topic.isNew && completed === 0 && (
                          <span className="text-[10px] text-primary font-medium inline-flex items-center gap-1">
                            <Plus className="w-2.5 h-2.5" />
                            Start building material brief
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </Card>
        )}
          </div>

      {/* Material Prioritization Dialog */}
      <Dialog open={showDiscoveryDialog} onOpenChange={(open) => { setShowDiscoveryDialog(open); if (!open) resetDiscoveryForm(); }}>
        <DialogContent className="sm:max-w-2xl p-8 bg-gradient-to-br from-card to-card/95 border border-border/40 shadow-xl">
          <DialogHeader className="space-y-3 -mb-2">
            <DialogTitle className="text-2xl font-semibold text-foreground">Start Material Prioritization</DialogTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Find which materials are worth researching. Weigh how strongly a material needs to be sourced, produced, or valorised — compared to others across your company. Start now and finish later; nothing has to be complete.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="discovery-name" className="text-sm font-semibold">Discovery Name</Label>
              <Input
                id="discovery-name"
                placeholder="Untitled discovery"
                value={discoveryName}
                onChange={(e) => setDiscoveryName(e.target.value)}
                className="border-2 border-success/20 focus:border-success/40 rounded-md h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Objective</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "Source", label: "Source", desc: "Find suppliers", color: "primary" },
                  { value: "Produce", label: "Produce", desc: "Manufacture", color: "application-purple" },
                  { value: "Valorise", label: "Valorise", desc: "Utilise waste", color: "success" },
                ] as const).map((option) => {
                  const isSelected = discoveryObjective === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setDiscoveryObjective(isSelected ? "" : option.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? option.value === "Source"
                            ? "border-primary bg-primary/10"
                            : option.value === "Produce"
                              ? "border-application-purple bg-application-purple/10"
                              : "border-success bg-success/10"
                          : "border-border/40 bg-background hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className={`text-sm font-semibold ${
                        isSelected
                          ? option.value === "Source"
                            ? "text-primary"
                            : option.value === "Produce"
                              ? "text-application-purple"
                              : "text-success"
                          : "text-foreground"
                      }`}>{option.label}</span>
                      <span className="text-[10px] text-muted-foreground">{option.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="discovery-context" className="text-sm font-semibold">Context</Label>
              <Textarea
                id="discovery-context"
                placeholder="What's driving this? The problem, opportunity, or pressure behind it — cost, regulation, supply risk, sustainability, new market…"
                value={discoveryContext}
                onChange={(e) => setDiscoveryContext(e.target.value)}
                className="border-2 border-success/20 focus:border-success/40 rounded-md min-h-[96px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold inline-flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-primary" /> Brief <span className="text-[10px] font-normal text-muted-foreground">(optional)</span>
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Attach a shared brief — useful when several materials address the same need.
              </p>
              <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5">
                {([
                  { value: "none", label: "No brief" },
                  { value: "existing", label: "Use existing" },
                  { value: "new", label: "Create new" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDiscoveryBriefMode(opt.value)}
                    className={`text-[11px] px-3 py-1 rounded-[5px] ${discoveryBriefMode === opt.value ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {discoveryBriefMode === "existing" && (
                allBriefs.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic px-1 pt-1">
                    No briefs yet — switch to "Create new".
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-md border border-border divide-y divide-border mt-1">
                    {allBriefs.map((b) => {
                      const p = BRIEF_PALETTE[b.color] || BRIEF_PALETTE.emerald;
                      const active = discoveryBriefId === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setDiscoveryBriefId(b.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${active ? `${p.bg}` : "hover:bg-muted/50"}`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${p.dot} shrink-0`} />
                          <span className={`text-sm flex-1 truncate ${active ? `${p.text} font-semibold` : ""}`}>{b.name}</span>
                          {active && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                        </button>
                      );
                    })}
                  </div>
                )
              )}
              {discoveryBriefMode === "new" && (
                <Input
                  value={discoveryNewBriefName}
                  onChange={(e) => setDiscoveryNewBriefName(e.target.value)}
                  placeholder="Brief name (e.g. Replace incumbent X)"
                  className="border-2 border-success/20 focus:border-success/40 rounded-md h-9 mt-1"
                />
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => { setShowDiscoveryDialog(false); resetDiscoveryForm(); }}
                className="flex-1 h-9 border-2 rounded-md"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartDiscovery}
                className="flex-1 h-9 rounded-md bg-success hover:bg-success/90 text-success-foreground"
              >
                Start Discovery
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Popup Dialog */}
      <Dialog open={actionPopup.isOpen} onOpenChange={closeActionPopup}>
        <DialogContent className="sm:max-w-lg p-6 bg-gradient-to-br from-card to-card/95 border border-border/40 shadow-xl">
          <DialogHeader className="space-y-2 mb-4">
            <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
              Let's Get Started
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mb-4">
            Create a new value chain analysis for <span className="font-semibold text-foreground">{actionPopup.itemName}</span>
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
                <Label htmlFor="analysis-name" className="text-xs font-semibold text-foreground">
                  Name Your Analysis
                </Label>
                <Input
                id="analysis-name"
                placeholder="Enter analysis name"
                value={analysisName}
                onChange={(e) => setAnalysisName(e.target.value)}
                className="h-9 text-xs border border-border/40 rounded-lg focus-visible:border-primary/50" />
              
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="analysis-owner" className="text-xs font-semibold text-foreground">
                  Analysis Owner
                </Label>
                <Select value={analysisOwner} onValueChange={setAnalysisOwner}>
                  <SelectTrigger id="analysis-owner" className="h-9 text-xs border border-border/40 rounded-lg">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john-doe">John Doe</SelectItem>
                    <SelectItem value="jane-smith">Jane Smith</SelectItem>
                    <SelectItem value="bob-johnson">Bob Johnson</SelectItem>
                    <SelectItem value="alice-williams">Alice Williams</SelectItem>
                  </SelectContent>
                </Select>
            </div>

            {/* OR Divider */}
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-gradient-to-r from-card via-card to-card px-3 text-muted-foreground font-medium tracking-wider">OR</span>
              </div>
            </div>

            {/* Saved Analyses */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">
                Start from a Saved Value Chain Analysis
              </Label>
              <div className="space-y-2">
                {savedAnalyses.map((analysis) =>
                <div
                  key={analysis.id}
                  onClick={() => handleSelectSavedAnalysis(analysis.id)}
                  className="p-3 rounded-lg bg-background/50 border border-border/30 hover:bg-muted/10 hover:border-border/50 cursor-pointer transition-all duration-200">
                  
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-foreground">{analysis.name}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {analysis.owner} • {analysis.date}
                        </p>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground -rotate-90 flex-shrink-0" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStartAnalysis}
              className="w-full mt-4 h-9 text-xs font-medium rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200"
              disabled={!analysisName || !analysisOwner}>
              
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Start analysis
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default VCGWelcomeWidget;