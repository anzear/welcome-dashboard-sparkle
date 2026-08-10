import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Building2, Briefcase, Zap } from "lucide-react";
import FilterCategories from "./FilterCategories";
import NewsContent from "./NewsContent";
import { useNewsReadStatus } from "@/hooks/useNewsReadStatus";

const LatestNewsSection = () => {
  const [selectedFeedstock, setSelectedFeedstock] = useState<string[]>([]);
  const [selectedTechnology, setSelectedTechnology] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const { isRead, markAsRead, markAsUnread } = useNewsReadStatus();

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

  const newsContent = {
    Market: [{
      title: "Global Bio-Based Chemicals Market Reaches $89B",
      excerpt: "Strong growth driven by sustainable feedstock utilization and increasing demand for environmentally friendly alternatives. Industry analysts project continued expansion as manufacturing costs decline and regulatory support strengthens.",
      date: "2024-01-15",
      category: "Market Analysis",
      feedstock: ["primary-biomass"],
      products: ["chemicals"],
      applications: ["chemicals-speciality"],
      publication: "BioBusiness Today"
    }, {
      title: "Food Ingredients Market Expansion in Asia-Pacific",
      excerpt: "Plant-based proteins and natural additives see 15% growth year-over-year across Southeast Asian markets. Consumer preference for clean label products and health-conscious ingredients drives unprecedented market expansion.",
      date: "2024-01-14",
      category: "Regional Markets",
      feedstock: ["side-streams-waste"],
      products: ["food-food-ingredients"],
      applications: ["food-beverage"],
      publication: "Asia Food Industry Weekly"
    }, {
      title: "Sustainable Materials Pricing Achieves Parity",
      excerpt: "Bio-based polymers now cost-competitive with traditional plastics in key manufacturing segments. Breakthrough production technologies and economies of scale finally deliver the price points industry has been waiting for.",
      date: "2024-01-13",
      category: "Price Analysis",
      feedstock: ["intermediates"],
      products: ["materials"],
      applications: ["plastics-polymers-materials"],
      publication: "Green Materials Report"
    }, {
      title: "Renewable Energy Sector Drives Biofuel Demand",
      excerpt: "Advanced biofuels market projected to reach $45B by 2028 as energy companies invest heavily in sustainable alternatives. Government mandates and carbon pricing mechanisms accelerate adoption across transportation sectors.",
      date: "2024-01-12",
      category: "Energy Markets",
      feedstock: ["primary-biomass", "side-streams-waste"],
      products: ["fuels-energy"],
      applications: ["fuel-energy", "automotive"],
      publication: "Renewable Energy Journal"
    }, {
      title: "Personal Care Industry Embraces Natural Ingredients",
      excerpt: "Consumer preference for bio-based cosmetics drives 12% market growth as major brands reformulate product lines. Premium positioning and sustainability messaging resonate strongly with environmentally conscious consumers.",
      date: "2024-01-11",
      category: "Consumer Trends",
      feedstock: ["primary-biomass"],
      products: ["chemicals"],
      applications: ["personal-care"],
      publication: "Cosmetics & Toiletries Magazine"
    }],
    Regulations: [{
      title: "EU Passes Comprehensive Circular Economy Act",
      excerpt: "New legislation mandates waste-to-value conversion targets for all industries by 2027. The comprehensive framework includes incentives for bio-based material adoption and penalties for linear economy practices.",
      date: "2024-01-15",
      category: "Policy Update",
      feedstock: ["side-streams-waste"],
      products: ["materials", "chemicals"],
      applications: ["industrial-manufacturing"],
      publication: "European Environment Agency"
    }, {
      title: "FDA Approves Novel Protein Ingredients",
      excerpt: "Streamlined approval process for alternative protein sources from agricultural waste reduces time-to-market by 40%. New regulatory pathway encourages innovation while maintaining strict safety standards.",
      date: "2024-01-14",
      category: "Regulatory Approval",
      feedstock: ["side-streams-waste"],
      products: ["food-food-ingredients", "feed-feed-ingredients"],
      applications: ["food-beverage", "agriculture-aquaculture"],
      publication: "Food Safety Magazine"
    }, {
      title: "Carbon Tax Incentives for Bio-Based Materials",
      excerpt: "New tax framework provides substantial benefits for sustainable manufacturing with up to 30% tax credits. Policy designed to accelerate transition away from fossil-based materials across all sectors.",
      date: "2024-01-13",
      category: "Environmental Policy",
      feedstock: ["primary-biomass", "intermediates"],
      products: ["materials"],
      applications: ["construction", "automotive"],
      publication: "Environmental Policy Review"
    }, {
      title: "Organic Fertilizer Standards Updated",
      excerpt: "Enhanced quality requirements ensure better soil health outcomes while supporting agricultural productivity. New standards address heavy metal content and microbial safety for sustainable farming practices.",
      date: "2024-01-12",
      category: "Agricultural Policy",
      feedstock: ["side-streams-waste"],
      products: ["fertilisers"],
      applications: ["agriculture-aquaculture"],
      publication: "Agriculture Today"
    }, {
      title: "Textile Industry Sustainability Mandate",
      excerpt: "New regulations require 30% bio-based content in synthetic textiles by 2026 with progressive increases to 50% by 2030. Industry leaders welcome clarity while smaller manufacturers seek support programs.",
      date: "2024-01-11",
      category: "Industry Regulation",
      feedstock: ["primary-biomass"],
      products: ["materials"],
      applications: ["textiles-apparel"],
      publication: "Textile World"
    }],
    Partnerships: [{
      title: "Global Food Giants Partner on Waste Valorization",
      excerpt: "Major food processors collaborate to convert side-streams into valuable products, establishing shared infrastructure across three continents. Initiative aims to transform 2.5 million tons of food waste annually.",
      date: "2024-01-15",
      category: "Industry Alliance",
      feedstock: ["side-streams-waste"],
      products: ["food-food-ingredients", "chemicals"],
      applications: ["food-beverage", "nutraceuticals-supplements"],
      publication: "Food Industry News"
    }, {
      title: "Tech Companies Join Bio-Based Electronics Initiative",
      excerpt: "Leading electronics manufacturers invest $800M in sustainable component materials research and development. Partnership targets complete elimination of fossil-based plastics in consumer electronics by 2028.",
      date: "2024-01-14",
      category: "Technology Partnership",
      feedstock: ["primary-biomass"],
      products: ["materials"],
      applications: ["electronics"],
      publication: "Tech Industry Daily"
    }, {
      title: "Agricultural Cooperatives Form Biorefinery Network",
      excerpt: "Farmers unite to establish regional processing facilities for crop residues, creating new revenue streams while reducing waste. Network will process over 1 million tons of agricultural residues annually.",
      date: "2024-01-13",
      category: "Cooperative Partnership",
      feedstock: ["side-streams-waste"],
      products: ["fuels-energy", "chemicals"],
      applications: ["agriculture-aquaculture", "fuel-energy"],
      publication: "Agricultural Business Weekly"
    }, {
      title: "Automotive Industry Accelerates Bio-Material Adoption",
      excerpt: "Car manufacturers partner with bio-tech companies for sustainable components, targeting 40% bio-based content in new vehicles. Collaborative R&D focuses on performance materials for interior and exterior applications.",
      date: "2024-01-12",
      category: "Strategic Partnership",
      feedstock: ["intermediates"],
      products: ["materials"],
      applications: ["automotive"],
      publication: "Automotive Manufacturing Today"
    }, {
      title: "Household Goods Brands Collaborate on Green Chemistry",
      excerpt: "Consumer product companies develop bio-based cleaning formulations through shared research platform. Joint venture eliminates over 150 petrochemical ingredients from household product portfolios.",
      date: "2024-01-11",
      category: "Product Partnership",
      feedstock: ["primary-biomass"],
      products: ["chemicals"],
      applications: ["homecare", "household-goods"],
      publication: "Consumer Products Journal"
    }],
    Innovation: [{
      title: "Breakthrough in Cellulose-to-Chemical Conversion",
      excerpt: "New enzyme technology increases conversion efficiency by 40% while reducing processing time and energy requirements. Innovation could revolutionize how industrial waste streams are transformed into valuable chemicals.",
      date: "2024-01-15",
      category: "Biotechnology",
      feedstock: ["side-streams-waste"],
      products: ["chemicals"],
      applications: ["chemicals-speciality", "plastics-polymers-materials"],
      publication: "BioTech Innovation Quarterly"
    }, {
      title: "AI-Powered Biorefinery Operations",
      excerpt: "Machine learning optimizes multi-product output from single feedstock streams, improving yield by 25% across diverse product portfolios. Advanced algorithms predict optimal processing conditions in real-time.",
      date: "2024-01-14",
      category: "Technology Innovation",
      feedstock: ["intermediates"],
      products: ["fuels-energy", "chemicals"],
      applications: ["industrial-manufacturing"],
      publication: "AI in Manufacturing Today"
    }, {
      title: "Revolutionary Protein Extraction Method",
      excerpt: "Novel process doubles protein yield from plant-based sources while maintaining functional properties and nutritional value. Technology enables cost-effective production of high-quality protein ingredients.",
      date: "2024-01-13",
      category: "Process Innovation",
      feedstock: ["primary-biomass"],
      products: ["food-food-ingredients"],
      applications: ["food-beverage", "nutraceuticals-supplements"],
      publication: "Food Processing Technology"
    }, {
      title: "Modular Bioprocessing Platform Launched",
      excerpt: "Scalable technology enables on-site conversion of agricultural waste into multiple products simultaneously. Plug-and-play system allows farmers to process diverse feedstocks without major infrastructure investment.",
      date: "2024-01-12",
      category: "Equipment Innovation",
      feedstock: ["side-streams-waste"],
      products: ["fertilisers", "feed-feed-ingredients"],
      applications: ["agriculture-aquaculture"],
      publication: "AgriTech Innovations"
    }, {
      title: "Smart Textiles from Bio-Based Fibers",
      excerpt: "Innovative spinning technology creates high-performance sustainable fabrics with embedded sensors and self-healing properties. Bio-derived materials match or exceed synthetic fiber performance characteristics.",
      date: "2024-01-11",
      category: "Material Innovation",
      feedstock: ["primary-biomass"],
      products: ["materials"],
      applications: ["textiles-apparel", "personal-care"],
      publication: "Advanced Materials Review"
    }]
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Process":
        return Zap;
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

  // Count unread articles for each category
  const getUnreadCount = (articles: any[]) => {
    return articles.filter(article => !isRead(article.title)).length;
  };

  return (
    <Card className="bg-card border-border/50 shadow-none">
      <div className="p-6">

        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">Stay Updated With Latest Developments</h2>
          <p className="text-muted-foreground text-sm mt-1">Choose your topics of interest to filter the latest market, regulatory, partnership and innovation news</p>
        </div>

        <Card className="bg-muted/30 border-border/50 shadow-none mb-6">
          <div className="p-4">
            <FilterCategories
              selectedFeedstock={selectedFeedstock}
              selectedTechnology={selectedTechnology}
              selectedProducts={selectedProducts}
              selectedApplications={selectedApplications}
              openSection={openSection}
              onFeedstockChange={setSelectedFeedstock}
              onTechnologyChange={setSelectedTechnology}
              onProductsChange={setSelectedProducts}
              onApplicationsChange={setSelectedApplications}
              onOpenSectionChange={setOpenSection}
              feedstockOptions={feedstockOptions}
              technologyOptions={technologyOptions}
              productOptions={productOptions}
              applicationOptions={applicationOptions}
            />
          </div>
        </Card>

        {/* News Categories Tabs */}
        <Tabs defaultValue="Market" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(newsContent).map(([category, articles]) => {
              const Icon = getCategoryIcon(category);
              const unreadCount = getUnreadCount(articles);
              return (
                <TabsTrigger key={category} value={category} className="flex items-center gap-2 relative">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{category}</span>
                  {unreadCount > 0 && (
                    <Badge 
                      variant="default" 
                      className="ml-1 bg-blue-500 hover:bg-blue-600 text-white text-xs min-w-[1.25rem] h-5 rounded-full flex items-center justify-center p-0"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {Object.entries(newsContent).map(([category, articles]) => (
            <TabsContent key={category} value={category} className="mt-6">
              <NewsContent
                articles={articles}
                selectedFeedstock={selectedFeedstock}
                selectedTechnology={selectedTechnology}
                selectedProducts={selectedProducts}
                selectedApplications={selectedApplications}
                layout="horizontal"
                onArticleClick={markAsRead}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Card>
  );
};

export default LatestNewsSection;
