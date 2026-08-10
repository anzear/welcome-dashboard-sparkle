
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronsUpDown, MapPin, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FilterOption {
  id: string;
  name: string;
  description: string;
}

interface FilterSectionProps {
  title: string;
  options: FilterOption[];
  selectedItems: string[];
  onToggleSelection: (itemId: string) => void;
  onClose: () => void;
}

const FilterSection = ({ title, options, selectedItems, onToggleSelection, onClose }: FilterSectionProps) => {
  const navigate = useNavigate();
  
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

  const handleTopicClick = (option: FilterOption) => {
    setActionPopup({
      isOpen: true,
      itemName: option.name,
      category: title
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
    
    if (action === "landscape") {
      navigate(`/landscape/${encodeURIComponent(actionPopup.category)}/${encodeURIComponent(actionPopup.itemName)}`);
    } else if (action === "value-chain") {
      // Navigate to value chain opportunities page
      console.log("Navigate to value chain opportunities");
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

  const categoryColors = getCategoryColors(title);
  return (
    <div className="border border-border rounded-lg bg-background p-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">Select {title} Topics</h4>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ChevronsUpDown className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
        {options.map(option => {
          const isSelected = selectedItems.includes(option.id);
          return (
            <div 
              key={option.id} 
              className={`border rounded-md p-2 transition-all text-sm ${
                isSelected 
                  ? `${categoryColors.borderColor} ${categoryColors.backgroundColor}` 
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={isSelected} 
                  onChange={() => {}} 
                  className="flex-shrink-0 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelection(option.id);
                  }}
                />
                <div 
                  className="flex-1 min-w-0 cursor-pointer hover:text-primary hover:underline transition-all p-1 -m-1 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Topic clicked:', option.name);
                    handleTopicClick(option);
                  }}
                >
                  <h5 className="font-medium text-xs leading-tight">{option.name}</h5>
                  <p className="text-xs text-muted-foreground opacity-75">Click to view landscape</p>
                </div>
              </div>
            </div>
          );
        })}
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
                className={`group relative p-6 rounded-lg border-2 border-dashed ${getCategoryColors(actionPopup.category).borderColor} ${getCategoryColors(actionPopup.category).backgroundColor} ${getCategoryColors(actionPopup.category).hoverBackgroundColor} ${getCategoryColors(actionPopup.category).hoverBorderColor} transition-all duration-300 cursor-pointer text-center`}
                onClick={() => handleActionSelect("value-chain")}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`p-3 rounded-full ${getCategoryColors(actionPopup.category).iconBackgroundColor} ${getCategoryColors(actionPopup.category).hoverIconBackgroundColor} transition-colors`}>
                    <Users className={`w-6 h-6 ${getCategoryColors(actionPopup.category).iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1 text-sm">Value Chain</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">Find partnerships</p>
                  </div>
                </div>
                <div className={`absolute inset-0 rounded-lg bg-gradient-to-t ${getCategoryColors(actionPopup.category).gradientColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilterSection;
