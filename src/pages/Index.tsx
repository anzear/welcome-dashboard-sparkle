import VCGWelcomeWidget from "@/components/VCGWelcomeWidget";
import PortfolioUpdatesWidget from "@/components/PortfolioUpdatesWidget";
import { Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 pt-4 pb-6 max-w-[1400px] w-full mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-card via-card to-success/8 border border-border/40 rounded-xl px-5 py-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-4 h-4 rounded-md bg-success/20 flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-success" />
          </div>
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Welcome back!</span>
        </div>
        <h1 className="text-base font-bold text-foreground tracking-tight mb-1">
          Hello, <span className="text-success">Jon!</span>
        </h1>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          VCG.AI helps you make <span className="bg-success/10 text-success font-medium px-1 py-0.5 rounded text-[11px]">smarter value chain decisions</span> with real-time data, science, technology & market insights.
        </p>
      </div>

      {/* OUR PORTFOLIO Section */}
      <VCGWelcomeWidget />

      {/* Latest Updates Section */}
      <PortfolioUpdatesWidget />
      </div>
    </div>
  );
};

export default Index;
