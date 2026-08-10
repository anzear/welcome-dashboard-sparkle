import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Beaker } from "lucide-react";

const MaterialInventory = () => {
  const navigate = useNavigate();
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 pb-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-[11px] text-muted-foreground hover:text-foreground h-7 px-2 gap-1 mb-3"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-3 h-3" />
          Back to portfolio
        </Button>
        <div className="bg-card border border-border/40 rounded-xl p-10 text-center">
          <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center mx-auto mb-3">
            <Beaker className="w-5 h-5 text-success" />
          </div>
          <h1 className="text-base font-bold text-foreground mb-1">Material Inventory</h1>
          <p className="text-xs text-muted-foreground">
            Material Prioritization workspace — coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaterialInventory;
