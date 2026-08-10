
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, X, ExternalLink } from "lucide-react";
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
  technology?: string[];
  products: string[];
  applications: string[];
  publication: string;
}

interface NewsContentProps {
  articles: NewsArticle[];
  selectedFeedstock: string[];
  selectedTechnology: string[];
  selectedProducts: string[];
  selectedApplications: string[];
  layout?: 'grid' | 'horizontal';
  onArticleClick?: (articleTitle: string) => void;
}

const NewsContent = ({ articles, selectedFeedstock, selectedTechnology, selectedProducts, selectedApplications, layout = 'grid', onArticleClick }: NewsContentProps) => {
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

  const technologyOptions = [{
    id: "biochemical",
    name: "Biochemical",
    description: "Biological and enzymatic conversion processes"
  }, {
    id: "chemical",
    name: "Chemical",
    description: "Catalytic and chemical conversion processes"
  }, {
    id: "thermochemical",
    name: "Thermochemical",
    description: "Heat-based thermal conversion processes"
  }, {
    id: "thermo-mechanical",
    name: "Thermo-mechanical",
    description: "Combined thermal and mechanical processing methods"
  }, {
    id: "mechanical",
    name: "Mechanical",
    description: "Physical separation and extraction methods"
  }, {
    id: "physical",
    name: "Physical",
    description: "Physical transformation and processing techniques"
  }, {
    id: "hybrid-integrated",
    name: "Hybrid/Integrated",
    description: "Combined processing technologies and integrated approaches"
  }];

  const getDisplayName = (id: string, type: 'feedstock' | 'product' | 'application' | 'technology') => {
    const options = type === 'feedstock' ? feedstockOptions : 
                   type === 'product' ? productOptions : 
                   type === 'application' ? applicationOptions :
                   technologyOptions;
    return options.find(option => option.id === id)?.name || id;
  };

  const getArticleImage = (article: NewsArticle) => {
    // Return appropriate image based on article category and content
    if (article.products.includes("energy-fuels") || article.applications.includes("energy-power")) {
      return renewableEnergyImage;
    }
    if (article.products.includes("materials-polymers") || article.applications.includes("automotive-aerospace-materials")) {
      return sustainableMaterialsImage;
    }
    if (article.category.includes("Partnership") || article.category.includes("Alliance")) {
      return businessPartnershipImage;
    }
    // Default to biotech for other articles
    return biotechImage;
  };

  const getArticleTags = (article: NewsArticle) => {
    const tags = [];
    const availableTypes = [];
    
    // Collect available tag types for this article
    if (article.feedstock.length > 0) availableTypes.push('feedstock');
    if (article.technology && article.technology.length > 0) availableTypes.push('technology');
    if (article.products.length > 0) availableTypes.push('products');
    if (article.applications.length > 0) availableTypes.push('applications');
    
    // Create a deterministic but varied selection based on article content
    const seed = article.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const selectedTypeIndex = seed % availableTypes.length;
    const selectedType = availableTypes[selectedTypeIndex];
    
    // Add tags based on the selected type for variety
    if (selectedType === 'feedstock') {
      tags.push(
        { type: 'category', value: 'Feedstock', color: 'bg-success text-success-foreground' },
        { type: 'item', value: getDisplayName(article.feedstock[0], 'feedstock'), color: 'bg-success/10 text-success border border-success/20' }
      );
    } else if (selectedType === 'technology') {
      tags.push(
        { type: 'category', value: 'Technology', color: 'bg-product-blue text-product-blue-foreground' },
        { type: 'item', value: getDisplayName(article.technology[0], 'technology'), color: 'bg-product-blue/10 text-product-blue border border-product-blue/20' }
      );
    } else if (selectedType === 'applications') {
      tags.push(
        { type: 'category', value: 'Market Application', color: 'bg-market-orange text-market-orange-foreground' },
        { type: 'item', value: getDisplayName(article.applications[0], 'application'), color: 'bg-market-orange/10 text-market-orange border border-market-orange/20' }
      );
    } else if (selectedType === 'products') {
      tags.push(
        { type: 'category', value: 'Product', color: 'bg-application-purple text-application-purple-foreground' },
        { type: 'item', value: getDisplayName(article.products[0], 'product'), color: 'bg-application-purple/10 text-application-purple border border-application-purple/20' }
      );
    }
    
    return tags.slice(0, 2);
  };

  const filterArticles = (articles: NewsArticle[]) => {
    if (selectedFeedstock.length === 0 && selectedTechnology.length === 0 && selectedProducts.length === 0 && selectedApplications.length === 0) {
      return []; // Show empty state when no filters are selected
    }
    
    const filtered = articles.filter(article => {
      // Check if article matches any of the selected filters (OR logic)
      const feedstockMatch = selectedFeedstock.length > 0 && selectedFeedstock.some(fs => article.feedstock.includes(fs));
      const technologyMatch = selectedTechnology.length > 0 && article.technology && selectedTechnology.some(tech => article.technology.includes(tech));
      const productMatch = selectedProducts.length > 0 && selectedProducts.some(p => article.products.includes(p));
      const applicationMatch = selectedApplications.length > 0 && selectedApplications.some(app => article.applications.includes(app));
      
      // Return true if article matches ANY of the selected filter categories
      return feedstockMatch || technologyMatch || productMatch || applicationMatch;
    });
    
    return filtered; // Show all filtered articles
  };

  const filteredArticles = filterArticles(articles).slice(0, 20);

  const hasActiveFilters = selectedFeedstock.length > 0 || selectedTechnology.length > 0 || selectedProducts.length > 0 || selectedApplications.length > 0;

  if (!hasActiveFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground max-w-md">
          Select at least one of the topics to filter through the latest global news on markets, regulations, partnerships and innovation.
        </p>
      </div>
    );
  }

  if (layout === 'horizontal') {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {filteredArticles.map((article, index) => (
            <div 
              key={index} 
              className="min-h-[120px] p-3 rounded-lg border border-border bg-card hover:shadow-sm transition-all duration-200 flex overflow-hidden"
            >
              {/* Content layout */}
              <div className="flex gap-3 w-full">
                {/* Image on the left - more square shape */}
                <div className="w-28 flex-shrink-0 flex">
                  <img 
                    src={getArticleImage(article)} 
                    alt={article.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                
                {/* Content on the right */}
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                  {/* Tags aligned with title */}
                  <div className="flex gap-1 flex-wrap mb-2">
                     {getArticleTags(article).map((tag, tagIndex) => (
                       <Badge 
                         key={tagIndex} 
                         variant="secondary" 
                         className={`text-xs px-1.5 py-0.5 rounded-sm ${tag.color}`}
                       >
                         {tag.value}
                       </Badge>
                     ))}
                  </div>
                  
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-semibold leading-tight text-sm text-foreground line-clamp-2 overflow-hidden">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{article.date}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0 hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          onArticleClick?.(article.title);
                          console.log("Opening news article:", article.title);
                        }}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 overflow-hidden mb-1">{article.excerpt}</p>
                  <p className="text-xs text-muted-foreground italic truncate">{article.publication}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
          {filteredArticles.slice(0, 4).map((article, index) => (
              <div 
               key={index} 
               className="min-h-[140px] p-4 rounded-lg border border-border bg-card hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
             >
                <div>
                 <div className="mb-2 flex gap-1 flex-wrap">
                 {getArticleTags(article).map((tag, tagIndex) => (
                   <Badge 
                     key={tagIndex} 
                     variant="secondary" 
                     className={`text-xs px-1.5 py-0.5 rounded-sm ${tag.color}`}
                   >
                     {tag.value}
                   </Badge>
                 ))}
                </div>
                
                {/* Image */}
                <div className="w-full h-16 mb-2">
                  <img 
                    src={getArticleImage(article)} 
                    alt={article.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                
               <h4 className="font-semibold mb-2 leading-snug text-sm text-foreground line-clamp-2">
                 {article.title}
               </h4>
               <div className="flex justify-between items-start mb-2">
                 <span className="text-xs text-muted-foreground">{article.date}</span>
                 <span className="text-xs text-muted-foreground italic">{article.publication}</span>
               </div>
             </div>
             <p className="text-xs text-muted-foreground leading-tight overflow-hidden line-clamp-2">{article.excerpt}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsContent;
