import { Settings, ChevronDown, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface TopicItem {
  name: string;
  count: number;
}

const feedstockItems: TopicItem[] = [
  { name: "Fructose", count: 5 },
  { name: "Corn Starch", count: 3 },
  { name: "Sugarcane Molasses", count: 2 },
  { name: "Whey Permeate", count: 1 },
];

const productItems: TopicItem[] = [
  { name: "Lactic Acid", count: 4 },
  { name: "HMF", count: 2 },
  { name: "Levulinic Acid", count: 1 },
  { name: "Ethanol", count: 1 },
  { name: "Succinic Acid", count: 1 },
];


const INITIAL_VISIBLE = 5;

const AnalysisSectionWidget = () => {
  const navigate = useNavigate();
  const [showAllProducts, setShowAllProducts] = useState(false);
  const totalCount = feedstockItems.length + productItems.length;
  const visibleProducts = showAllProducts ? productItems : productItems.slice(0, INITIAL_VISIBLE);
  const hiddenCount = productItems.length - INITIAL_VISIBLE;

  const handleItemClick = (itemName: string, category: string) => {
    navigate(`/landscape/${encodeURIComponent(category)}/${encodeURIComponent(itemName)}/value-chain`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">My Analysis section</h2>
          <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 rounded-full border-border text-muted-foreground">
            {totalCount}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs border-border/60">
            Edit
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs border-border/60">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Request New Topics
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Feedstock Column */}
        <div className="bg-card border border-border/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-primary">Feedstock</span>
            </div>
            <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 rounded-full border-border text-muted-foreground">
              {feedstockItems.length}
            </Badge>
          </div>
          <div className="space-y-0">
            {feedstockItems.map((item) => (
              <div
                key={item.name}
                onClick={() => handleItemClick(item.name, "Feedstock")}
                className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors cursor-pointer ${
                  item.count > 0
                    ? "bg-primary/5 hover:bg-primary/10"
                    : "hover:bg-muted/30 text-muted-foreground"
                }`}
              >
                <span className={`text-sm font-medium ${item.count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.name}
                </span>
                <span className={`text-sm font-medium ${item.count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Products Column */}
        <div className="bg-card border border-border/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-application-purple/10 flex items-center justify-center">
                <Settings className="w-3.5 h-3.5 text-application-purple" />
              </div>
              <span className="text-sm font-semibold text-application-purple">Materials</span>
            </div>
            <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 rounded-full border-border text-muted-foreground">
              {productItems.length}
            </Badge>
          </div>
          <div className="space-y-0">
            {visibleProducts.map((item) => (
              <div
                key={item.name}
                onClick={() => handleItemClick(item.name, "Product")}
                className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors cursor-pointer ${
                  item.count > 0
                    ? "bg-application-purple/5 hover:bg-application-purple/10"
                    : "hover:bg-muted/30 text-muted-foreground"
                }`}
              >
                <span className={`text-sm font-medium ${item.count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.name}
                </span>
                <span className={`text-sm font-medium ${item.count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
          {hiddenCount > 0 && !showAllProducts && (
            <button
              onClick={() => setShowAllProducts(true)}
              className="flex items-center justify-center gap-1 w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              Show {hiddenCount} More
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default AnalysisSectionWidget;
