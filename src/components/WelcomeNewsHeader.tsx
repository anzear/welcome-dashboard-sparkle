import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, UserCheck, ArrowRight, Calendar } from "lucide-react";
import { useState } from "react";
import DashboardNewsWidget from "@/components/DashboardNewsWidget";

const WelcomeNewsHeader = () => {
  const [showNews, setShowNews] = useState(false);

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {/* Merged Welcome and News Header */}
      <Card className="relative overflow-hidden bg-gradient-welcome border-0 shadow-soft">
        <div className="absolute inset-0 bg-gradient-to-br from-welcome-green/10 via-transparent to-welcome-green-glow/10" />
        <div className="relative p-4 text-white">
          <div className="flex items-center justify-between">
            {/* Left side - Welcome Message */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-welcome-green border-2 border-white/30 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold mb-1">Welcome Jon 👋</h1>
                <p className="text-primary-foreground/80 text-xs">
                  VCG.AI empowers your value chain strategies with real-time data and deep analytics.
                </p>
              </div>
            </div>

            {/* Right side - See Latest News */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowNews(!showNews)}
                className="text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-300 group"
              >
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm">See Latest News</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/30 p-2 rounded-md bg-white/20 backdrop-blur-sm border border-white/30 w-9 h-9 flex items-center justify-center relative"
              >
                <Bell className="w-4 h-4 fill-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-white text-[10px] font-bold">1</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Expandable News Section */}
      {showNews && (
        <div className="animate-fade-in">
          <DashboardNewsWidget />
        </div>
      )}
    </div>
  );
};

export default WelcomeNewsHeader;