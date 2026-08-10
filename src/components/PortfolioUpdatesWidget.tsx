import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Shield, FlaskConical, Building2, TrendingUp, ArrowRight, Calendar, ExternalLink } from "lucide-react";

type UpdateCategory = "all" | "research" | "patents" | "rni_projects" | "commercial" | "market";

interface UpdateItem {
  title: string;
  source: string;
  date: string;
  topic: string;
  topicType: "feedstock" | "product";
  summary: string;
}

const categoryConfig: Record<UpdateCategory, { label: string; icon: typeof FileText; color: string; badgeClass: string }> = {
  all: { label: "All", icon: FileText, color: "text-foreground", badgeClass: "bg-muted text-foreground border-border" },
  patents: { label: "IP", icon: Shield, color: "text-amber-500", badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  research: { label: "Research Papers", icon: FileText, color: "text-blue-500", badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  rni_projects: { label: "Publicly Funded Projects", icon: FlaskConical, color: "text-violet-500", badgeClass: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
  commercial: { label: "Commercial Projects", icon: Building2, color: "text-emerald-500", badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  market: { label: "Market Activity", icon: TrendingUp, color: "text-rose-500", badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
};

type DataCategory = Exclude<UpdateCategory, "all">;

const mockUpdates: Record<DataCategory, UpdateItem[]> = {
  research: [
    { title: "Efficient lactic acid production from fructose-rich syrups via engineered Lactobacillus", source: "Biotechnology Advances", date: "Mar 12, 2026", topic: "Lactic Acid", topicType: "product", summary: "Engineered strain achieves 95% lactic acid yield from high-fructose corn syrup at pilot scale." },
    { title: "Fructose dehydration pathways: kinetic modeling and catalyst design", source: "Green Chemistry", date: "Mar 10, 2026", topic: "Fructose", topicType: "feedstock", summary: "Comprehensive kinetic study of fructose conversion routes with novel zeolite catalysts." },
    { title: "Stereoselective L-lactic acid synthesis from fructose using immobilized enzymes", source: "ACS Sustainable Chem.", date: "Mar 7, 2026", topic: "Lactic Acid", topicType: "product", summary: "Immobilized enzyme system produces optically pure L-lactic acid at 1.5 g/L/h from fructose." },
    { title: "Fructose as a versatile platform for bio-based chemical production", source: "Chemical Reviews", date: "Mar 4, 2026", topic: "Fructose", topicType: "feedstock", summary: "Review of catalytic and fermentative routes converting fructose to lactic acid, HMF, and levulinic acid." },
    { title: "Bio-based sulphuric acid production via microbial sulphur oxidation", source: "Bioresource Technology", date: "Mar 11, 2026", topic: "Sulphuric Acid", topicType: "product", summary: "Acidithiobacillus strain achieves 180 g/L sulphuric acid from elemental sulphur in continuous reactor." },
    { title: "Low-carbon sulphuric acid synthesis using renewable hydrogen", source: "Journal of Cleaner Production", date: "Mar 6, 2026", topic: "Sulphuric Acid", topicType: "product", summary: "Process integration study shows 65% GHG reduction vs. conventional contact process at industrial scale." },
  ],
  patents: [
    { title: "Continuous fermentation process for lactic acid from fructose feedstock", source: "EP 4,298,112 — Corbion NV", date: "Mar 11, 2026", topic: "Lactic Acid", topicType: "product", summary: "Membrane-integrated continuous fermentation achieving >98% optical purity of L-lactic acid from fructose." },
    { title: "Method for high-purity fructose extraction from fruit processing waste", source: "US 11,945,201 — ADM", date: "Mar 8, 2026", topic: "Fructose", topicType: "feedstock", summary: "Chromatographic separation process yielding >99% pure fructose from mixed sugar streams." },
    { title: "Polylactic acid production with enhanced crystallinity from fructose-derived lactic acid", source: "WO 2026/031456 — TotalEnergies Corbion", date: "Mar 5, 2026", topic: "Lactic Acid", topicType: "product", summary: "Novel polymerization process producing high-crystallinity PLA from bio-based lactic acid." },
    { title: "Catalytic regeneration of spent sulphuric acid from alkylation units", source: "US 11,987,433 — DuPont", date: "Mar 10, 2026", topic: "Sulphuric Acid", topicType: "product", summary: "Vanadium-cesium catalyst system enables 99.5% recovery of acid strength with reduced SO2 emissions." },
    { title: "Wet-gas sulphuric acid plant with integrated heat recovery", source: "WO 2026/028944 — Topsoe", date: "Mar 2, 2026", topic: "Sulphuric Acid", topicType: "product", summary: "Compact WSA design cuts capex 20% and recovers high-pressure steam from SO2-rich off-gases." },
  ],
  rni_projects: [
    { title: "FructoLact — Integrated Fructose-to-Lactic Acid Biorefinery", source: "Horizon Europe", date: "Mar 13, 2026", topic: "Lactic Acid", topicType: "product", summary: "€9.5M project developing a zero-waste biorefinery converting fructose to lactic acid and PLA." },
    { title: "SweetCarbon — Valorization of Fructose Side-Streams", source: "EIT Food", date: "Mar 9, 2026", topic: "Fructose", topicType: "feedstock", summary: "Pilot project for cascading use of fructose-rich agricultural residues for chemicals and materials." },
    { title: "LactiScale — Scale-Up of Fermentative Lactic Acid Production", source: "BBI JU", date: "Mar 3, 2026", topic: "Lactic Acid", topicType: "product", summary: "TRL 6→8 demonstration of lactic acid fermentation at 10,000 t/a capacity using fructose feedstock." },
    { title: "GreenSulph — Decarbonising Industrial Sulphuric Acid Production", source: "Horizon Europe", date: "Mar 12, 2026", topic: "Sulphuric Acid", topicType: "product", summary: "€7.2M consortium piloting renewable-H2 contact process with full heat integration." },
    { title: "AcidLoop — Closed-Loop Sulphuric Acid Recycling for Battery Recycling", source: "Innovation Fund", date: "Mar 5, 2026", topic: "Sulphuric Acid", topicType: "product", summary: "Pilot recovers 95% of sulphuric acid leachate from Li-ion battery hydrometallurgy streams." },
  ],
  commercial: [
    { title: "Corbion opens new lactic acid plant in Thailand using fructose feedstock", source: "Chemical Week", date: "Mar 12, 2026", topic: "Lactic Acid", topicType: "product", summary: "75,000 t/a facility using locally sourced fructose for PLA and lactate ester production." },
    { title: "ADM expands fructose production capacity for bio-chemicals market", source: "Biofuels Digest", date: "Mar 9, 2026", topic: "Fructose", topicType: "feedstock", summary: "New 200,000 t/a crystalline fructose line dedicated to chemical and fermentation customers." },
    { title: "NatureWorks signs fructose-based lactic acid supply agreement", source: "Plastics Today", date: "Mar 6, 2026", topic: "Lactic Acid", topicType: "product", summary: "Long-term offtake agreement securing fructose-derived lactic acid for Ingeo PLA production." },
    { title: "Aurubis commissions 600,000 t/a sulphuric acid plant in Hamburg", source: "Chemical Week", date: "Mar 13, 2026", topic: "Sulphuric Acid", topicType: "product", summary: "New double-contact unit captures metallurgical off-gas SO2 and supplies regional fertiliser producers." },
    { title: "BASF secures long-term sulphuric acid supply for battery-grade nickel", source: "Argus Media", date: "Mar 8, 2026", topic: "Sulphuric Acid", topicType: "product", summary: "Multi-year deal covers 250,000 t/a of high-purity acid for EV battery precursor production." },
  ],
  market: [
    { title: "Global lactic acid market to exceed $5.2B by 2030, fructose route gains share", source: "Markets & Markets", date: "Mar 14, 2026", topic: "Lactic Acid", topicType: "product", summary: "9.8% CAGR driven by PLA demand; fructose-based production now accounts for 22% of capacity." },
    { title: "Fructose prices firm as bio-chemical demand rises alongside food sector", source: "Agri Investor", date: "Mar 11, 2026", topic: "Fructose", topicType: "feedstock", summary: "Industrial fructose demand up 12% YoY as lactic acid and HMF producers compete with food applications." },
    { title: "PLA packaging sector drives lactic acid demand growth in Europe", source: "ICIS", date: "Mar 7, 2026", topic: "Lactic Acid", topicType: "product", summary: "EU single-use plastics directive accelerates PLA adoption; lactic acid demand up 15% in H1 2026." },
    { title: "Lactic acid spot prices rise to €1,420/t amid tight supply", source: "Tecnon OrbiChem", date: "Mar 4, 2026", topic: "Lactic Acid", topicType: "product", summary: "Supply constraints from plant turnarounds push prices up 8%; fructose-based producers benefit from margin expansion." },
    { title: "Sulphuric acid spot prices climb to $145/t on tight smelter supply", source: "Argus Media", date: "Mar 13, 2026", topic: "Sulphuric Acid", topicType: "product", summary: "FOB Tampa prices up 18% YoY as copper smelter outages tighten merchant market." },
    { title: "Battery-grade sulphuric acid demand to triple by 2030", source: "Wood Mackenzie", date: "Mar 9, 2026", topic: "Sulphuric Acid", topicType: "product", summary: "EV-driven nickel and cobalt leaching pushes high-purity acid demand past 4 Mt/a by decade end." },
    { title: "Phosphate fertiliser rebound lifts sulphuric acid consumption in Asia", source: "CRU Group", date: "Mar 5, 2026", topic: "Sulphuric Acid", topicType: "product", summary: "India and Indonesia drive 6% YoY growth in merchant sulphuric acid trade flows." },
  ],
};

const PortfolioUpdatesWidget = () => {
  const [activeTab, setActiveTab] = useState<UpdateCategory>("all");
  const [portfolioTopics, setPortfolioTopics] = useState<string[]>([]);

  useEffect(() => {
    const loadTopics = () => {
      const feedstock = JSON.parse(localStorage.getItem("portfolio_feedstock") || '["Fructose"]');
      const products = JSON.parse(localStorage.getItem("portfolio_product") || '["Lactic Acid","Sulphuric Acid"]');
      const toName = (item: any) => typeof item === "string" ? item : item?.name;
      setPortfolioTopics([...feedstock, ...products].map(toName).filter(Boolean));
    };
    loadTopics();
    window.addEventListener("portfolioUpdated", loadTopics);
    return () => window.removeEventListener("portfolioUpdated", loadTopics);
  }, []);

  const categories = Object.keys(categoryConfig) as UpdateCategory[];

  const dataCats = (Object.keys(mockUpdates) as (Exclude<UpdateCategory, "all">)[]);

  const getUpdatesForTab = (cat: UpdateCategory) => {
    if (cat === "all") {
      return dataCats.flatMap(c => mockUpdates[c].filter(u => portfolioTopics.includes(u.topic)))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return mockUpdates[cat].filter((u) => portfolioTopics.includes(u.topic));
  };

  const totalCount = dataCats.reduce((sum, cat) => sum + getUpdatesForTab(cat).length, 0);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Latest Updates</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {totalCount} new updates across your portfolio topics
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground hover:text-foreground h-6 px-2">
          View all →
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UpdateCategory)}>
        <TabsList className="bg-muted/50 h-9 p-0.5 gap-0.5 w-full justify-start">
          {categories.map((cat) => {
            const cfg = categoryConfig[cat];
            const Icon = cfg.icon;
            const count = getUpdatesForTab(cat).length;
            return (
              <TabsTrigger
                key={cat}
                value={cat}
                className="text-xs gap-1.5 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                {cfg.label}
                {count > 0 && (
                  <span className="ml-1 text-[10px] bg-muted-foreground/10 text-muted-foreground rounded-full px-1.5 py-0.5 leading-none">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((cat) => {
          const cfg = categoryConfig[cat];
          const items = getUpdatesForTab(cat);
          return (
            <TabsContent key={cat} value={cat} className="mt-3">
              {items.length === 0 ? (
                <Card className="p-6 text-center text-sm text-muted-foreground border-dashed">
                  No recent {cfg.label.toLowerCase()} for your portfolio topics.
                </Card>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <Card
                      key={idx}
                      className="p-3 hover:bg-muted/30 transition-colors cursor-pointer border-border/50 group"
                    >
                      <div className="flex items-start gap-2.5">
                        {(() => {
                          const itemCat = cat === "all" ? dataCats.find(c => mockUpdates[c].some(u => u.title === item.title)) : undefined;
                          const iconCfg = itemCat ? categoryConfig[itemCat] : cfg;
                          return (
                            <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconCfg.badgeClass}`}>
                              <iconCfg.icon className="w-3.5 h-3.5" />
                            </div>
                          );
                        })()}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-xs font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                              {item.title}
                            </h3>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 mt-0.5 transition-colors" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.summary}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 h-5 ${
                                item.topicType === "feedstock"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : "bg-violet-500/10 text-violet-600 border-violet-500/20"
                              }`}
                            >
                              {item.topic}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground/60">·</span>
                            <span className="text-[10px] text-muted-foreground">{item.source}</span>
                            <span className="text-[10px] text-muted-foreground/60">·</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {item.date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default PortfolioUpdatesWidget;
