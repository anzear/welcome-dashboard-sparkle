import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Sparkles, TrendingUp, Building2, Briefcase, Zap, X, Bell, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FilterSection from "./FilterSection";
import biotechImage from "@/assets/biotech-lab.jpg";
import renewableEnergyImage from "@/assets/renewable-energy.jpg";
import sustainableMaterialsImage from "@/assets/sustainable-materials.jpg";
import businessPartnershipImage from "@/assets/business-partnership.jpg";

interface NewsArticle {
  title: string;
  excerpt: string;
  date: string;
  category: string;
  feedstock: string[];
  products: string[];
  applications: string[];
  publication: string;
}

const DashboardNewsWidget = () => {
  const [selectedFeedstock, setSelectedFeedstock] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const feedstockOptions = [{
    id: "primary-biomass",
    name: "Primary Biomass", 
    description: "Dedicated energy crops and fresh biomass materials"
  }, {
    id: "side-streams-waste",
    name: "Side-Streams & Waste",
    description: "Industrial by-products, agricultural residues, and waste materials"
  }, {
    id: "intermediates-precursors",
    name: "Intermediates/precursors",
    description: "Processed biomass feedstocks and intermediate compounds"
  }];

  const productOptions = [{
    id: "food-beverage-ingredients",
    name: "Food & Beverage Ingredients",
    description: "Natural ingredients, additives, and functional food components"
  }, {
    id: "feed-ingredients", 
    name: "Feed Ingredients",
    description: "Animal nutrition products and feed supplements"
  }, {
    id: "chemicals-intermediates",
    name: "Chemicals & Intermediates",
    description: "Bio-based chemicals and chemical intermediates"
  }, {
    id: "materials-polymers",
    name: "Materials & Polymers", 
    description: "Sustainable materials, bio-based composites and polymers"
  }, {
    id: "fertilisers-soil-inputs",
    name: "Fertilisers & Soil Inputs",
    description: "Organic fertilizers and soil enhancement products"
  }, {
    id: "health-pharma-cosmetic",
    name: "Health, Pharma & Cosmetic Ingredients",
    description: "Pharmaceutical, health and cosmetic ingredients"
  }, {
    id: "fibers",
    name: "Fibers",
    description: "Bio-based fibers and textile materials"
  }, {
    id: "energy-fuels",
    name: "Energy & Fuels",
    description: "Biofuels, renewable energy, and energy storage solutions"
  }];

  const applicationOptions = [{
    id: "food-beverage",
    name: "Food & Beverage",
    description: "Food processing, beverages, and culinary applications"
  }, {
    id: "feed-animal-nutrition",
    name: "Feed & Animal Nutrition",
    description: "Animal nutrition products and feed supplements"
  }, {
    id: "agriculture-crop-inputs",
    name: "Agriculture & Crop Inputs",
    description: "Farming, crop production, and agricultural inputs"
  }, {
    id: "nutraceuticals-supplements",
    name: "Nutraceuticals & Supplements",
    description: "Health supplements and functional nutrition products"
  }, {
    id: "cosmetics-personal-care",
    name: "Cosmetics & Personal Care",
    description: "Cosmetics, skincare, and personal hygiene products"
  }, {
    id: "pharma",
    name: "Pharma",
    description: "Pharmaceutical applications and drug development"
  }, {
    id: "packaging",
    name: "Packaging",
    description: "Sustainable packaging materials and solutions"
  }, {
    id: "construction-building-materials",
    name: "Construction & Building Materials",
    description: "Building materials and construction industry applications"
  }, {
    id: "automotive-aerospace-materials",
    name: "Automotive & Aerospace Materials",
    description: "Vehicle and aerospace manufacturing components"
  }, {
    id: "consumer-durable-goods",
    name: "Consumer & Durable Goods",
    description: "Consumer products and durable household items"
  }, {
    id: "textiles-apparel",
    name: "Textiles & Apparel",
    description: "Fabric production and clothing manufacturing"
  }, {
    id: "mobility",
    name: "Mobility",
    description: "Transportation and mobility solutions"
  }, {
    id: "energy-power",
    name: "Energy & Power",
    description: "Energy production, storage and power applications"
  }, {
    id: "household-goods-electronics",
    name: "Household Goods & Electronics",
    description: "Consumer electronics and household products"
  }, {
    id: "chemicals-industrial-applications",
    name: "Chemicals & Industrial Applications",
    description: "Industrial chemicals and specialized applications"
  }, {
    id: "environmental-solutions",
    name: "Environmental Solutions",
    description: "Environmental remediation and sustainability solutions"
  }];

  // Sample news data for dashboard
  const newsContent = {
    Market: [{
      title: "Global Bio-Based Chemicals Market Reaches $89B",
      excerpt: "Strong growth driven by sustainable feedstock utilization and increasing...",
      date: "2024-01-15",
      category: "Market Analysis",
      feedstock: ["primary-biomass"],
      products: ["chemicals"],
      applications: ["chemicals-speciality"],
      publication: "BioBusiness Today"
    }, {
      title: "Food Ingredients Market Expansion in Asia-Pacific",
      excerpt: "Plant-based proteins and natural additives see 15% growth year-over-year",
      date: "2024-01-14",
      category: "Regional Markets",
      feedstock: ["side-streams-waste"],
      products: ["food-food-ingredients"],
      applications: ["food-beverage"],
      publication: "Asia Food Industry Weekly"
    }, {
      title: "Sustainable Materials Pricing Achieves Parity",
      excerpt: "Bio-based polymers now cost-competitive with traditional plastics",
      date: "2024-01-13",
      category: "Price Analysis",
      feedstock: ["intermediates"],
      products: ["materials"],
      applications: ["automotive"],
      publication: "Green Materials Report"
    }, {
      title: "Renewable Energy Sector Drives Biofuel Demand",
      excerpt: "Advanced biofuels market projected to reach $45B by 2028",
      date: "2024-01-12",
      category: "Energy Markets",
      feedstock: ["primary-biomass", "side-streams-waste"],
      products: ["fuels-energy"],
      applications: ["fuel-energy", "automotive"],
      publication: "Renewable Energy Journal"
    }, {
      title: "Personal Care Industry Embraces Natural Ingredients",
      excerpt: "Consumer preference for bio-based cosmetics drives 12% market growth",
      date: "2024-01-11",
      category: "Consumer Trends",
      feedstock: ["primary-biomass"],
      products: ["chemicals"],
      applications: ["chemicals-speciality"],
      publication: "Cosmetics & Toiletries Magazine"
    }],
    Regulations: [{
      title: "EU Passes Comprehensive Circular Economy Act",
      excerpt: "New legislation mandates waste-to-value conversion targets for all industries",
      date: "2024-01-15",
      category: "Policy Update",
      feedstock: [],
      products: ["materials"],
      applications: [],
      publication: "European Environment Agency"
    }, {
      title: "FDA Approves New Bio-Chemical Standards",
      excerpt: "Regulatory framework for bio-based specialty chemicals gets major update",
      date: "2024-01-15",
      category: "Regulatory Framework",
      feedstock: [],
      products: ["chemicals"],
      applications: [],
      publication: "Food Safety Magazine"
    }, {
      title: "USDA Announces Biofuel Subsidies Program",
      excerpt: "New federal incentives boost renewable energy sector investment",
      date: "2024-01-15",
      category: "Government Policy",
      feedstock: [],
      products: ["fuels-energy"],
      applications: [],
      publication: "Government Energy News"
    }],
    Partnerships: [{
      title: "Global Food Giants Partner on Waste Valorization",
      excerpt: "Major food processors collaborate to convert side-streams into valuable products",
      date: "2024-01-15",
      category: "Industry Alliance",
      feedstock: [],
      products: [],
      applications: ["food-beverage"],
      publication: "Food Industry News"
    }, {
      title: "Automotive Manufacturers Join Bio-Materials Initiative",
      excerpt: "Leading car makers partner to develop sustainable automotive components",
      date: "2024-01-15",
      category: "Industry Collaboration",
      feedstock: [],
      products: [],
      applications: ["automotive"],
      publication: "Automotive Manufacturing Today"
    }, {
      title: "Tech Giants Form Green Chemistry Consortium",
      excerpt: "Major technology companies unite for sustainable chemical innovation",
      date: "2024-01-15",
      category: "Tech Partnership",
      feedstock: [],
      products: [],
      applications: ["chemicals-speciality"],
      publication: "Tech Industry Daily"
    }, {
      title: "Retail Leaders Launch Sustainable Packaging Alliance",
      excerpt: "Top retailers commit to bio-based packaging materials by 2025",
      date: "2024-01-15",
      category: "Retail Alliance",
      feedstock: [],
      products: ["materials"],
      applications: [],
      publication: "Retail Business Weekly"
    }],
    Innovation: [{
      title: "Breakthrough in Cellulose-to-Chemical Conversion",
      excerpt: "New enzyme technology increases conversion efficiency by 40%",
      date: "2024-01-15",
      category: "Biotechnology",
      feedstock: ["side-streams-waste"],
      products: [],
      applications: [],
      publication: "BioTech Innovation Quarterly"
    }, {
      title: "Next-Gen Biofuel Production Technology Unveiled",
      excerpt: "Revolutionary process doubles energy output from organic waste streams",
      date: "2024-01-15",
      category: "Energy Innovation",
      feedstock: [],
      products: ["fuels-energy"],
      applications: [],
      publication: "Energy Innovation Today"
    }, {
      title: "AI-Powered Bio-Materials Discovery Platform Launched",
      excerpt: "Machine learning accelerates sustainable material development by 300%",
      date: "2024-01-15",
      category: "Tech Innovation",
      feedstock: [],
      products: ["materials"],
      applications: [],
      publication: "AI in Manufacturing Today"
    }, {
      title: "Revolutionary Plastic-Eating Enzyme Developed",
      excerpt: "Breakthrough biotechnology offers solution to plastic waste crisis",
      date: "2024-01-15",
      category: "Environmental Tech",
      feedstock: ["side-streams-waste"],
      products: [],
      applications: [],
      publication: "Environmental Technology Review"
    }, {
      title: "Quantum Computing Accelerates Green Chemistry Research",
      excerpt: "New quantum algorithms identify optimal bio-based chemical pathways",
      date: "2024-01-15",
      category: "Quantum Science",
      feedstock: [],
      products: ["chemicals"],
      applications: [],
      publication: "Quantum Science Journal"
    }]
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Market":
        return TrendingUp;
      case "Regulations":
        return Building2;
      case "Partnerships":
        return Briefcase;
      case "Innovation":
        return Zap;
      default:
        return TrendingUp;
    }
  };

  const toggleSelection = (item: string, selectedItems: string[], setter: (items: string[]) => void) => {
    if (selectedItems.includes(item)) {
      setter(selectedItems.filter(i => i !== item));
    } else {
      setter([...selectedItems, item]);
    }
  };

  const getFilterOptions = (type: string) => {
    switch (type) {
      case "Feedstock":
        return feedstockOptions;
      case "Product":
        return productOptions;
      case "Market Application":
        return applicationOptions;
      default:
        return [];
    }
  };

  const getSelectedItems = (type: string) => {
    switch (type) {
      case "Feedstock":
        return selectedFeedstock;
      case "Product":
        return selectedProducts;
      case "Market Application":
        return selectedApplications;
      default:
        return [];
    }
  };

  const getSetter = (type: string) => {
    switch (type) {
      case "Feedstock":
        return setSelectedFeedstock;
      case "Product":
        return setSelectedProducts;
      case "Market Application":
        return setSelectedApplications;
      default:
        return () => {};
    }
  };

  const getDisplayName = (id: string, type: 'feedstock' | 'product' | 'application') => {
    const options = type === 'feedstock' ? feedstockOptions : 
                   type === 'product' ? productOptions : 
                   applicationOptions;
    return options.find(option => option.id === id)?.name || id;
  };

  const getArticleTags = (article: NewsArticle) => {
    const tags = [];
    
    // Show the primary category of the article (what it's mainly about)
    // Don't prioritize based on user selection - show what the article is actually about
    if (article.feedstock.length > 0 && article.products.length === 0 && article.applications.length === 0) {
      // Pure feedstock article
      tags.push(
        { type: 'category', value: 'Feedstock', color: 'bg-emerald-100 text-emerald-700' },
        { type: 'item', value: getDisplayName(article.feedstock[0], 'feedstock'), color: 'bg-emerald-50 text-emerald-600' }
      );
    } else if (article.products.length > 0 && article.feedstock.length === 0 && article.applications.length === 0) {
      // Pure product article
      tags.push(
        { type: 'category', value: 'Material', color: 'bg-purple-100 text-purple-700' },
        { type: 'item', value: getDisplayName(article.products[0], 'product'), color: 'bg-purple-50 text-purple-600' }
      );
    } else if (article.applications.length > 0 && article.feedstock.length === 0 && article.products.length === 0) {
      // Pure application article
      tags.push(
        { type: 'category', value: 'Market Application', color: 'bg-orange-100 text-orange-700' },
        { type: 'item', value: getDisplayName(article.applications[0], 'application'), color: 'bg-orange-50 text-orange-600' }
      );
    } else {
      // Mixed article - show the most relevant based on content
      if (article.products.length > 0) {
        tags.push(
          { type: 'category', value: 'Material', color: 'bg-purple-100 text-purple-700' },
          { type: 'item', value: getDisplayName(article.products[0], 'product'), color: 'bg-purple-50 text-purple-600' }
        );
      } else if (article.applications.length > 0) {
        tags.push(
          { type: 'category', value: 'Market Application', color: 'bg-orange-100 text-orange-700' },
          { type: 'item', value: getDisplayName(article.applications[0], 'application'), color: 'bg-orange-50 text-orange-600' }
        );
      } else if (article.feedstock.length > 0) {
        tags.push(
          { type: 'category', value: 'Feedstock', color: 'bg-emerald-100 text-emerald-700' },
          { type: 'item', value: getDisplayName(article.feedstock[0], 'feedstock'), color: 'bg-emerald-50 text-emerald-600' }
        );
      }
    }
    
    return tags.slice(0, 2);
  };

  const getArticleImage = (article: NewsArticle) => {
    // Return appropriate image based on article category and content
    if (article.products.includes("fuels-energy") || article.applications.includes("fuel-energy")) {
      return renewableEnergyImage;
    }
    if (article.products.includes("materials") || article.applications.includes("automotive")) {
      return sustainableMaterialsImage;
    }
    if (article.category.includes("Partnership") || article.category.includes("Alliance")) {
      return businessPartnershipImage;
    }
    // Default to biotech for other articles
    return biotechImage;
  };

  const filterCategories = ["Feedstock", "Product", "Market Application"];

  const filterArticles = (articles: NewsArticle[]) => {
    // If no filters selected, show first 3 from current tab
    if (selectedFeedstock.length === 0 && selectedProducts.length === 0 && selectedApplications.length === 0) {
      return articles.slice(0, 3);
    }
    
    // Filter articles based on user selections
    const filtered = articles.filter(article => {
      const feedstockMatch = selectedFeedstock.length === 0 || selectedFeedstock.some(fs => article.feedstock.includes(fs));
      const productMatch = selectedProducts.length === 0 || selectedProducts.some(p => article.products.includes(p));
      const applicationMatch = selectedApplications.length === 0 || selectedApplications.some(app => article.applications.includes(app));
      return feedstockMatch && productMatch && applicationMatch;
    });
    
    // Return minimum 1, maximum 3 articles
    return filtered.length > 0 ? filtered.slice(0, 3) : articles.slice(0, 1);
  };

  const getFilteredArticlesFromAllCategories = () => {
    // If no filters selected, return empty array to show tab-specific content
    if (selectedFeedstock.length === 0 && selectedProducts.length === 0 && selectedApplications.length === 0) {
      return [];
    }

    const allArticles = Object.values(newsContent).flat();
    
    // Get articles for each category that match the filter criteria
    const feedstockArticles = allArticles.filter(article => {
      return article.feedstock.length > 0 && 
             (selectedFeedstock.length === 0 || selectedFeedstock.some(fs => article.feedstock.includes(fs))) &&
             (selectedProducts.length === 0 || selectedProducts.some(p => article.products.includes(p))) &&
             (selectedApplications.length === 0 || selectedApplications.some(app => article.applications.includes(app)));
    });

    const productArticles = allArticles.filter(article => {
      return article.products.length > 0 && 
             (selectedFeedstock.length === 0 || selectedFeedstock.some(fs => article.feedstock.includes(fs))) &&
             (selectedProducts.length === 0 || selectedProducts.some(p => article.products.includes(p))) &&
             (selectedApplications.length === 0 || selectedApplications.some(app => article.applications.includes(app)));
    });

    const applicationArticles = allArticles.filter(article => {
      return article.applications.length > 0 && 
             (selectedFeedstock.length === 0 || selectedFeedstock.some(fs => article.feedstock.includes(fs))) &&
             (selectedProducts.length === 0 || selectedProducts.some(p => article.products.includes(p))) &&
             (selectedApplications.length === 0 || selectedApplications.some(app => article.applications.includes(app)));
    });

    // Create a balanced mix: ensure at least 1 from each category if available
    const mixedArticles = [];
    
    // Add at least 1 feedstock article if available
    if (feedstockArticles.length > 0) {
      mixedArticles.push(feedstockArticles[0]);
    }
    
    // Add at least 1 product article if available
    if (productArticles.length > 0) {
      const productToAdd = productArticles.find(article => !mixedArticles.includes(article));
      if (productToAdd) {
        mixedArticles.push(productToAdd);
      }
    }
    
    // Add at least 1 application article if available
    if (applicationArticles.length > 0) {
      const applicationToAdd = applicationArticles.find(article => !mixedArticles.includes(article));
      if (applicationToAdd) {
        mixedArticles.push(applicationToAdd);
      }
    }
    
    // Fill remaining slots with more articles from each category
    const remainingSlots = 3 - mixedArticles.length;
    if (remainingSlots > 0) {
      // Get more articles from each category
      const moreArticles = [];
      
      // Add more feedstock articles
      const moreFeedstock = feedstockArticles.filter(article => !mixedArticles.includes(article)).slice(0, 2);
      moreArticles.push(...moreFeedstock);
      
      // Add more product articles  
      const moreProducts = productArticles.filter(article => !mixedArticles.includes(article) && !moreArticles.includes(article)).slice(0, 2);
      moreArticles.push(...moreProducts);
      
      // Add more application articles
      const moreApplications = applicationArticles.filter(article => !mixedArticles.includes(article) && !moreArticles.includes(article)).slice(0, 1);
      moreArticles.push(...moreApplications);
      
      mixedArticles.push(...moreArticles.slice(0, remainingSlots));
    }
    
    return mixedArticles.length > 0 ? mixedArticles.slice(0, 3) : allArticles.slice(0, 1);
  };

  // Function to check if a category has new content (latest article from today)
  const hasNewContent = (category: string) => {
    const articles = newsContent[category as keyof typeof newsContent];
    if (!articles || articles.length === 0) return false;
    
    // Check if the latest article is from today (2024-01-15 in our sample data)
    const latestDate = articles[0]?.date;
    return latestDate === "2024-01-15";
  };

  const getNewContentCount = (category: string) => {
    const articles = newsContent[category as keyof typeof newsContent];
    if (!articles) return 0;
    
    // Count articles from today
    return articles.filter(article => article.date === "2024-01-15").length;
  };

  return (
    <Card className="bg-gradient-to-br from-card to-card/90 border border-border/40 shadow-lg backdrop-blur-sm">
      <div className="p-3">
        {/* News Section Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-muted to-muted/60 shadow-inner border border-border/30">
              <Calendar className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-foreground tracking-tight">Latest News</h2>
              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-muted to-muted/80 text-muted-foreground border border-border/30 shadow-sm rounded-md">Today</Badge>
            </div>
          </div>
           <Button 
             variant="outline" 
             size="sm"
             className="text-muted-foreground border-border/40 bg-gradient-to-r from-background to-background/80 hover:from-muted/20 hover:to-muted/10 transition-all duration-300 shadow-sm"
             onClick={() => navigate('/analytics')}
           >
             View All News
           </Button>
        </div>
        
        <p className="text-muted-foreground mb-2 text-sm leading-relaxed">
          Market insights, regulations, partnerships & innovations to drive your next move.
        </p>

        {/* News Categories Tabs */}
        <Tabs defaultValue="Market" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-muted/60 to-muted/40 border border-border/30 shadow-inner">
             {Object.keys(newsContent).map(category => {
               const Icon = getCategoryIcon(category);
               const hasNew = hasNewContent(category);
               const newCount = getNewContentCount(category);
               
               return (
                 <TabsTrigger key={category} value={category} className="flex items-center gap-2 relative text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-background data-[state=active]:to-background/90 data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-border/40 font-medium tracking-tight">
                   <Icon className="w-4 h-4" />
                   <span className="hidden sm:inline">{category}</span>
                   {hasNew && (
                     <div className="absolute -top-1.5 -right-1.5 z-20">
                       <div className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md shadow-lg border-2 border-white w-5 h-5">
                         <span className="text-[10px] font-bold">{newCount}</span>
                       </div>
                     </div>
                   )}
                 </TabsTrigger>
               );
             })}
          </TabsList>
          
          {Object.entries(newsContent).map(([category, articles]) => {
            // Show filtered articles from all categories if user has active filters
            const hasActiveFilters = selectedFeedstock.length > 0 || selectedProducts.length > 0 || selectedApplications.length > 0;
            const articlesToShow = hasActiveFilters ? getFilteredArticlesFromAllCategories() : filterArticles(articles);
            
           return (
              <TabsContent key={category} value={category} className="mt-3">
                <div className="space-y-6">
                  {/* 3 column grid layout */}
                  <div className="grid grid-cols-3 gap-2">
                      {articlesToShow.slice(0, 3).map((article, index) => (
                         <div key={index} className="h-[100px] p-3 rounded-xl border border-border/40 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:border-border/60 hover:scale-[1.02] transition-all duration-300 cursor-pointer flex relative group backdrop-blur-sm overflow-hidden">
                            {/* External link icon - top right */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-primary/10 hover:text-primary opacity-70 hover:opacity-100 transition-all rounded-lg shadow-sm border border-border/20 z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("Opening news article:", article.title);
                              }}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                            
                            {/* Image on the left */}
                            <div className="w-20 h-full flex-shrink-0 mr-3">
                              <img 
                                src={getArticleImage(article)} 
                                alt={article.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                            
                            {/* Content on the right */}
                            <div className="flex-1 flex flex-col min-w-0 overflow-hidden pr-8 h-full">
                              <div className="mb-1 flex gap-1 flex-wrap">
                                {getArticleTags(article).map((tag, tagIndex) => (
                                   <Badge 
                                     key={tagIndex} 
                                     variant="secondary" 
                                     className={`text-[9px] px-1.5 py-0.5 rounded-sm ${tag.color} inline-block w-fit font-medium shadow-sm border border-opacity-30`}
                                   >
                                    {tag.value}
                                  </Badge>
                                ))}
                              </div>
                              <h4 className="font-semibold text-foreground mb-1 leading-tight text-xs group-hover:text-primary transition-colors tracking-tight line-clamp-1 overflow-hidden">{article.title}</h4>
                              <span className="text-[10px] text-muted-foreground block font-medium mb-1">{article.date}</span>
                              <p className="text-[10px] text-muted-foreground leading-tight overflow-hidden line-clamp-1 opacity-90">{article.excerpt}</p>
                            </div>
                         </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </Card>
  );
};

export default DashboardNewsWidget;