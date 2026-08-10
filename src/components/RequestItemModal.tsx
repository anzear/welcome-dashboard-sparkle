import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings2, Beaker, Package, Activity, Search, Plus, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RequestItemModalProps {
  category: string;
  trigger: React.ReactNode;
}

const RequestItemModal = ({ category, trigger }: RequestItemModalProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Available items for each category
  const availableItems = {
    Feedstock: [
      { name: "Cellulose Biorefinery", description: "High-cellulose biomass from wood" },
      { name: "Sugar Beet", description: "Sugar-rich agricultural crop" },
      { name: "Fructose", description: "Natural sugar from fruits" },
      { name: "Spent Grain", description: "Brewery waste material" },
      { name: "Digestate", description: "Biogas production residue" },
      { name: "Apple Pomace", description: "Apple processing waste" },
      { name: "Brewery Spent Grain", description: "Malted barley residue" },
      { name: "Corn Stover", description: "Corn stalks and leaves" },
      { name: "Wheat Straw", description: "Agricultural residue from wheat" },
      { name: "Rice Husk", description: "Protective coating of rice grain" },
      { name: "Sugarcane Bagasse", description: "Fibrous sugarcane residue" },
      { name: "Eucalyptus Wood", description: "Fast-growing hardwood" },
      { name: "Pine Wood Chips", description: "Softwood processing material" },
      { name: "Cotton Stalks", description: "Post-harvest cotton waste" },
      { name: "Bamboo", description: "Fast-growing woody grass" },
      { name: "Algae Biomass", description: "Aquatic microorganisms" },
    ],
    Product: [
      { name: "Xylose", description: "5-carbon sugar from hemicellulose" },
      { name: "Succinic Acid", description: "Platform chemical intermediate" },
      { name: "Polyphenols", description: "Plant-derived antioxidants" },
      { name: "Olefins", description: "Building block chemicals" },
      { name: "Cocoa bean husk", description: "Chocolate production byproduct" },
      { name: "Glucose", description: "6-carbon sugar" },
      { name: "Furfural", description: "Sugar-derived chemical" },
      { name: "Lignin", description: "Complex aromatic polymer" },
      { name: "Cellulose Nanofibers", description: "Nano-scale cellulose" },
      { name: "Bioethanol", description: "Renewable alcohol fuel" },
      { name: "Biodiesel", description: "Renewable diesel fuel" },
      { name: "Lactic Acid", description: "Bio-based chemical" },
      { name: "Acetic Acid", description: "Organic acid chemical" },
      { name: "Vanillin", description: "Flavoring compound" },
      { name: "Levulinic Acid", description: "Platform chemical" },
    ],
    Application: [
      { name: "Industrial Chemicals", description: "Bulk chemical production" },
      { name: "Bio-Based Solvents", description: "Sustainable cleaning agents" },
      { name: "Pharmaceuticals", description: "Medical compounds" },
      { name: "Food & Beverages", description: "Edible applications" },
      { name: "Cosmetics", description: "Personal care products" },
      { name: "Textiles", description: "Fabric and fiber applications" },
      { name: "Construction Materials", description: "Building components" },
      { name: "Agriculture", description: "Farming applications" },
      { name: "Automotive", description: "Vehicle components" },
      { name: "Electronics", description: "Electronic components" },
      { name: "Packaging", description: "Container materials" },
      { name: "Energy Storage", description: "Battery and storage systems" },
      { name: "Water Treatment", description: "Purification systems" },
      { name: "Adhesives", description: "Bonding materials" },
    ],
  };

  const items = availableItems[category as keyof typeof availableItems] || [];

  // Filter items based on search
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get category-specific icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Feedstock":
        return Settings2;
      case "Process":
        return Beaker;
      case "Product":
        return Package;
      case "Application":
        return Activity;
      default:
        return Plus;
    }
  };

  // Get category-specific colors
  const getCategoryColors = (category: string) => {
    switch (category) {
      case "Feedstock":
        return {
          bg: "bg-success/5",
          hoverBg: "hover:bg-success/10",
          border: "border-success/30",
          text: "text-success",
          buttonBg: "bg-success hover:bg-success/90",
          buttonText: "text-success-foreground"
        };
      case "Product":
        return {
          bg: "bg-application-purple/5",
          hoverBg: "hover:bg-application-purple/10",
          border: "border-application-purple/30",
          text: "text-application-purple",
          buttonBg: "bg-application-purple hover:bg-application-purple/90",
          buttonText: "text-white"
        };
      case "Application":
        return {
          bg: "bg-application-orange/5",
          hoverBg: "hover:bg-application-orange/10",
          border: "border-application-orange/30",
          text: "text-application-orange",
          buttonBg: "bg-application-orange hover:bg-application-orange/90",
          buttonText: "text-white"
        };
      default:
        return {
          bg: "bg-muted/5",
          hoverBg: "hover:bg-muted/10",
          border: "border-border",
          text: "text-foreground",
          buttonBg: "bg-primary hover:bg-primary/90",
          buttonText: "text-primary-foreground"
        };
    }
  };

  const colors = getCategoryColors(category);
  const CategoryIcon = getCategoryIcon(category);

  const handleItemSelect = (itemName: string) => {
    // Get existing items from localStorage
    const storageKey = `portfolio_${category.toLowerCase()}`;
    const existingItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Check if item already exists
    if (!existingItems.includes(itemName)) {
      // Add new item to the top of the list
      const updatedItems = [itemName, ...existingItems];
      localStorage.setItem(storageKey, JSON.stringify(updatedItems));
      
      // Track timestamp for new items
      const timestampKey = `portfolio_${category.toLowerCase()}_timestamps`;
      const timestamps = JSON.parse(localStorage.getItem(timestampKey) || '{}');
      timestamps[itemName] = Date.now();
      localStorage.setItem(timestampKey, JSON.stringify(timestamps));
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('portfolioUpdated', { 
        detail: { category, itemName } 
      }));
    }
    
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CategoryIcon className={`w-5 h-5 ${colors.text}`} />
            Add New Materials
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${category.toLowerCase()}s...`}
              className="pl-10"
            />
          </div>

          {/* Items List */}
          <ScrollArea className="flex-1 h-[400px] -mx-6 px-6">
            <div className="space-y-2 pr-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleItemSelect(item.name)}
                    className={`w-full text-left p-4 rounded-lg border ${colors.border} ${colors.bg} ${colors.hoverBg} transition-all duration-200 group`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground mb-1 group-hover:underline">
                          {item.name}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${colors.text} flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-2">No {category.toLowerCase()}s found</p>
                  <p className="text-sm text-muted-foreground">Try a different search term</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} {category.toLowerCase()}{filteredItems.length !== 1 ? 's' : ''} available
            </p>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestItemModal;
