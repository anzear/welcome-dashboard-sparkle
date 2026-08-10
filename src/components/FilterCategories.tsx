import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import FilterSection from "./FilterSection";

interface FilterCategoriesProps {
  selectedFeedstock: string[];
  selectedTechnology: string[];
  selectedProducts: string[];
  selectedApplications: string[];
  openSection: string | null;
  onFeedstockChange: (items: string[]) => void;
  onTechnologyChange: (items: string[]) => void;
  onProductsChange: (items: string[]) => void;
  onApplicationsChange: (items: string[]) => void;
  onOpenSectionChange: (section: string | null) => void;
  feedstockOptions: Array<{ id: string; name: string; description: string }>;
  technologyOptions: Array<{ id: string; name: string; description: string }>;
  productOptions: Array<{ id: string; name: string; description: string }>;
  applicationOptions: Array<{ id: string; name: string; description: string }>;
}

const FilterCategories = ({
  selectedFeedstock,
  selectedTechnology,
  selectedProducts,
  selectedApplications,
  openSection,
  onFeedstockChange,
  onTechnologyChange,
  onProductsChange,
  onApplicationsChange,
  onOpenSectionChange,
  feedstockOptions,
  technologyOptions,
  productOptions,
  applicationOptions
}: FilterCategoriesProps) => {
  const filterCategories = ["Feedstock", "Process", "Product", "Market Application"];

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
      case "Process":
        return technologyOptions;
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
      case "Process":
        return selectedTechnology;
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
        return onFeedstockChange;
      case "Process":
        return onTechnologyChange;
      case "Product":
        return onProductsChange;
      case "Market Application":
        return onApplicationsChange;
      default:
        return () => {};
    }
  };

  return (
    <>
      {/* Filter Categories */}
      <div className="mb-1">
        <h3 className="text-base font-semibold text-foreground mb-2">Select Category & Topics</h3>
        
        {/* Category Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
          {filterCategories.map(category => {
            const selectedCount = getSelectedItems(category).length;
            const isSelected = selectedCount > 0;
            const isOpen = openSection === category;
            return (
              <Button
                key={category}
                variant="ghost"
                onClick={() => onOpenSectionChange(openSection === category ? null : category)}
                className={`h-16 flex flex-col items-center justify-center text-center border relative ${
                  isSelected
                    ? category === "Process"
                      ? "!bg-product-blue !text-product-blue-foreground hover:!bg-product-blue/90 !border-product-blue"
                      : category === "Product"
                      ? "!bg-application-purple !text-application-purple-foreground hover:!bg-application-purple/90 !border-application-purple"
                      : category === "Market Application"
                      ? "!bg-orange-500 !text-white hover:!bg-orange-600 !border-orange-500"
                      : "!bg-success !text-success-foreground hover:!bg-success/90 !border-success"
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <div className="font-medium text-sm leading-tight">{category === "Product" ? "Material" : category}</div>
                <div className="text-xs opacity-75 leading-tight -mt-0.5">
                  {selectedCount} selected
                </div>
                <div className="absolute top-2 right-2">
                  {!isOpen && (
                    <ChevronDown className="w-3 h-3 opacity-75" />
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {/* Expanded Filter Section */}
        {openSection && (
          <FilterSection
            title={openSection}
            options={getFilterOptions(openSection)}
            selectedItems={getSelectedItems(openSection)}
            onToggleSelection={(itemId) => toggleSelection(itemId, getSelectedItems(openSection), getSetter(openSection))}
            onClose={() => onOpenSectionChange(null)}
          />
        )}
      </div>

    </>
  );
};

export default FilterCategories;