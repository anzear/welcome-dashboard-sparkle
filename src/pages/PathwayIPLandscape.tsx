import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, FileText, Filter, Download, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartTooltip } from "@/components/ui/chart";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Tooltip } from "recharts";
import worldPatentMap from '@/assets/world-patent-map.png';
import IPHolderPatentsModal from '@/components/IPHolderPatentsModal';
import PatentDetailModal from '@/components/PatentDetailModal';

const dataByView = {
  production: {
    trend: [
      { year: '2019', Filed: 40, Granted: 30, Total: 70 },
      { year: '2020', Filed: 52, Granted: 38, Total: 90 },
      { year: '2021', Filed: 68, Granted: 52, Total: 120 },
      { year: '2022', Filed: 82, Granted: 65, Total: 147 },
      { year: '2023', Filed: 95, Granted: 80, Total: 175 },
    ],
    developers: [
      { org: "Novozymes A/S", total: 87, granted: 64, filed: 23 },
      { org: "BASF SE", total: 72, granted: 48, filed: 24 },
      { org: "Valmet Corp.", total: 55, granted: 38, filed: 17 },
      { org: "UPM-Kymmene Oyj", total: 43, granted: 31, filed: 12 },
      { org: "DuPont de Nemours", total: 38, granted: 25, filed: 13 },
      { org: "Borregaard ASA", total: 33, granted: 21, filed: 12 },
      { org: "Lenzing AG", total: 29, granted: 19, filed: 10 },
      { org: "Stora Enso", total: 24, granted: 15, filed: 9 },
      { org: "Arkema S.A.", total: 20, granted: 13, filed: 7 },
      { org: "Corbion N.V.", total: 17, granted: 11, filed: 6 },
    ],
    geo: [
      { location: "North America", countries: "3 countries", total: 44250, granted: 7180, filed: 37070 },
      { location: "Asia", countries: "12 countries", total: 41890, granted: 6920, filed: 34970 },
      { location: "Europe", countries: "18 countries", total: 26780, granted: 6950, filed: 19830 },
      { location: "Oceania", countries: "4 countries", total: 890, granted: 178, filed: 712 },
      { location: "South America", countries: "5 countries", total: 1950, granted: 365, filed: 1585 },
    ],
    cpc: [
      { code: "A", name: "Human Necessities", count: 38420, color: "bg-purple-500" },
      { code: "B", name: "Performing Operations; Transporting", count: 19850, color: "bg-orange-500" },
      { code: "C", name: "Chemistry; Metallurgy", count: 76530, color: "bg-pink-400" },
      { code: "D", name: "Textiles; Paper", count: 4180, color: "bg-gray-800" },
      { code: "E", name: "Fixed Constructions", count: 1120, color: "bg-sky-500" },
      { code: "F", name: "Mechanical Engineering; Lighting; Heating; Weapons; Blasting", count: 2640, color: "bg-blue-600" },
      { code: "G", name: "Physics", count: 11290, color: "bg-orange-400" },
      { code: "H", name: "Electricity", count: 9870, color: "bg-red-700" },
      { code: "Y", name: "General Tagging of New Technological Developments; General Tagging of Cross-...", count: 1450, color: "bg-yellow-400" },
    ],
    pie: [
      { name: "A", value: 38420, fill: "#8b5cf6" },
      { name: "B", value: 19850, fill: "#f97316" },
      { name: "C", value: 76530, fill: "#f472b6" },
      { name: "D", value: 4180, fill: "#1f2937" },
      { name: "E", value: 1120, fill: "#0ea5e9" },
      { name: "F", value: 2640, fill: "#2563eb" },
      { name: "G", value: 11290, fill: "#fb923c" },
      { name: "H", value: 9870, fill: "#b91c1c" },
      { name: "Y", value: 1450, fill: "#facc15" },
    ],
    patents: [
      { title: "Methods for Enhancing Microbial Production of Specific Length Fatty Alcohols", company: "Genomatica, Inc.", filingYear: 2022, grantedYear: 2023, status: "Granted", jurisdiction: 12 },
      { title: "Lactic Bacterium With Modified Galactokinase Expression for Texturizing Food Products", company: "Chr. Hansen A/s", filingYear: 2022, grantedYear: 2023, status: "Granted", jurisdiction: 15 },
      { title: "Process for Obtaining Nanocomposite Food Packages", company: "Universitatea Tehnica Din Cluj-napoca", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 4 },
      { title: "Pyrimidinyloxy Benzene Derivatives as Herbicidal Compounds", company: "BASF SE", filingYear: 2021, grantedYear: 2022, status: "Granted", jurisdiction: 9 },
      { title: "Improved Fermentation Process for Lactic Acid Production from Lignocellulosic Biomass", company: "Novozymes A/S", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 7 },
      { title: "Continuous Crystallisation Method for High-Purity L-Lactic Acid", company: "Corbion N.V.", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 11 },
    ],
    totalAll: 6421, totalFiled: 4832, totalGranted: 1589,
  },
  application: {
    trend: [
      { year: '2019', Filed: 35, Granted: 25, Total: 60 },
      { year: '2020', Filed: 48, Granted: 32, Total: 80 },
      { year: '2021', Filed: 65, Granted: 48, Total: 113 },
      { year: '2022', Filed: 80, Granted: 62, Total: 142 },
      { year: '2023', Filed: 95, Granted: 75, Total: 170 },
    ],
    developers: [
      { org: "NatureWorks LLC", total: 92, granted: 68, filed: 24 },
      { org: "Total Energies Corbion", total: 78, granted: 52, filed: 26 },
      { org: "Teijin Ltd.", total: 61, granted: 44, filed: 17 },
      { org: "Toray Industries", total: 49, granted: 35, filed: 14 },
      { org: "BASF SE", total: 41, granted: 28, filed: 13 },
      { org: "Novamont S.p.A.", total: 36, granted: 24, filed: 12 },
      { org: "Mitsubishi Chemical", total: 31, granted: 20, filed: 11 },
      { org: "Danimer Scientific", total: 26, granted: 17, filed: 9 },
      { org: "Futerro S.A.", total: 22, granted: 14, filed: 8 },
      { org: "Synbra Technology", total: 18, granted: 12, filed: 6 },
    ],
    geo: [
      { location: "Asia", countries: "14 countries", total: 48320, granted: 8150, filed: 40170 },
      { location: "North America", countries: "3 countries", total: 38750, granted: 6420, filed: 32330 },
      { location: "Europe", countries: "20 countries", total: 29450, granted: 7280, filed: 22170 },
      { location: "Oceania", countries: "3 countries", total: 1120, granted: 210, filed: 910 },
      { location: "South America", countries: "6 countries", total: 2340, granted: 430, filed: 1910 },
    ],
    cpc: [
      { code: "B", name: "Performing Operations; Transporting", count: 42150, color: "bg-orange-500" },
      { code: "C", name: "Chemistry; Metallurgy", count: 35820, color: "bg-pink-400" },
      { code: "A", name: "Human Necessities", count: 28340, color: "bg-purple-500" },
      { code: "D", name: "Textiles; Paper", count: 12680, color: "bg-gray-800" },
      { code: "G", name: "Physics", count: 8920, color: "bg-orange-400" },
      { code: "F", name: "Mechanical Engineering; Lighting; Heating; Weapons; Blasting", count: 5410, color: "bg-blue-600" },
      { code: "H", name: "Electricity", count: 3780, color: "bg-red-700" },
      { code: "E", name: "Fixed Constructions", count: 2140, color: "bg-sky-500" },
      { code: "Y", name: "General Tagging of New Technological Developments; General Tagging of Cross-...", count: 980, color: "bg-yellow-400" },
    ],
    pie: [
      { name: "B", value: 42150, fill: "#f97316" },
      { name: "C", value: 35820, fill: "#f472b6" },
      { name: "A", value: 28340, fill: "#8b5cf6" },
      { name: "D", value: 12680, fill: "#1f2937" },
      { name: "G", value: 8920, fill: "#fb923c" },
      { name: "F", value: 5410, fill: "#2563eb" },
      { name: "H", value: 3780, fill: "#b91c1c" },
      { name: "E", value: 2140, fill: "#0ea5e9" },
      { name: "Y", value: 980, fill: "#facc15" },
    ],
    patents: [
      { title: "Preservative System for Emulsion-based Therapeutic Topical Formulations", company: "Arbor Pharmaceuticals, Llc", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 8 },
      { title: "Hard Capsule Formulation Using Polylactic Acid Blends", company: "Capsugel Belgium Nv", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 5 },
      { title: "Biodegradable Packaging Film with Enhanced Barrier Properties", company: "NatureWorks LLC", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 14 },
      { title: "PLA-Based Composite Material for Automotive Interior Components", company: "Toray Industries", filingYear: 2022, grantedYear: 2023, status: "Granted", jurisdiction: 10 },
      { title: "3D Printing Filament from Recycled Polylactic Acid", company: "Total Energies Corbion", filingYear: 2022, grantedYear: 2023, status: "Granted", jurisdiction: 8 },
      { title: "Antimicrobial Wound Dressing Incorporating Lactic Acid Derivatives", company: "Teijin Ltd.", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 6 },
    ],
    totalAll: 5284, totalFiled: 3910, totalGranted: 1374,
  },
};

const PathwayIPLandscape = () => {
  const { category, topic, pathwayId } = useParams<{category: string;topic: string;pathwayId: string;}>();
  const navigate = useNavigate();
  const decodedTopic = decodeURIComponent(topic || "");
  const pathwayNumber = parseInt(pathwayId || "0") + 1;
  const [activeView, setActiveView] = useState<'production' | 'application'>('production');
  const [patentSearchTerm, setPatentSearchTerm] = useState('');
  const [trendChartMode, setTrendChartMode] = useState<'spot' | 'benchmark'>('spot');
  const [trendTimeRange, setTrendTimeRange] = useState('5');
  const [selectedIPHolder, setSelectedIPHolder] = useState<{org: string; total: number; granted: number; filed: number} | null>(null);
  const [selectedPatentDetail, setSelectedPatentDetail] = useState<{title: string; company: string; filingYear: number; grantedYear: number | null; status: string; jurisdiction: number} | null>(null);

  const data = dataByView[activeView];
  const developers = data.developers;
  const geoData = data.geo;
  const latestPatents = data.patents;

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 pb-3 flex-shrink-0">
        <Button variant="outline" size="sm" onClick={() => navigate(`/landscape/${category}/${topic}/value-chain/pathways/${pathwayId}`)} className="gap-1.5 h-7 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-6 pb-6 flex-1 min-h-0 flex flex-col">
        <div className="mb-2 flex-shrink-0">
          <h1 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pathway IP Landscape: <span className="text-primary">Pathway {pathwayNumber} for {decodedTopic} Production</span></h1>
        </div>

        <Card className="bg-card border border-border/60 shadow-sm flex-1 min-w-0 flex flex-col">
          <CardContent className="px-4 py-3 flex flex-col h-full">
            {/* Production / Application Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-0.5 mb-3 flex-shrink-0 self-start">
              <button
                onClick={() => setActiveView('production')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${activeView === 'production' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Production
              </button>
              <button
                onClick={() => setActiveView('application')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${activeView === 'application' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Application
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="space-y-3">
                {/* Patent Trend + Leading Developers */}
                <div className="space-y-3">
                <div className="grid grid-cols-[150px_1fr] gap-2">
                  {/* Legend / Filter Panel */}
                  <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col">
                    <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Filters</h4>
                    <div className="space-y-2.5">
                      <div>
                        <h4 className="text-[9px] font-bold text-foreground uppercase tracking-wider mb-1.5">Patent Status</h4>
                        <div className="space-y-1">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <Checkbox defaultChecked className="h-3 w-3 border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background" />
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#3b82f6' }} />
                            <span className="text-[9px] text-foreground">Filed</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <Checkbox defaultChecked className="h-3 w-3 border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="text-[9px] text-foreground">Granted</span>
                          </label>
                        </div>
                      </div>
                      <div className="border-t border-border/40 pt-2.5">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Checkbox defaultChecked className="h-3 w-3 border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background" />
                          <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
                          <span className="text-[9px] text-foreground font-medium">Total patents</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Trend Chart */}
                  <div className="bg-muted/30 border border-border/40 rounded-xl p-3">
                    <div className="mb-1.5">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Patent Trends</h3>
                      <p className="text-xs text-muted-foreground leading-tight">This view highlights innovation intensity across key regions, helping you identify technological hotspots, potential IP barriers, and market leaders in {activeView} development.</p>
                    </div>
                    <div className="flex items-center justify-end mb-1.5">
                      <Select value={trendTimeRange} onValueChange={setTrendTimeRange}>
                        <SelectTrigger className="h-5 w-auto gap-1 px-1.5 text-[9px] border-border bg-background text-muted-foreground [&>svg]:h-2.5 [&>svg]:w-2.5">
                          <Calendar className="w-2.5 h-2.5" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5" className="text-[10px]">Last 5 years</SelectItem>
                          <SelectItem value="10" className="text-[10px]">Last 10 years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.trend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                          <XAxis dataKey="year" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
                          <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ fontSize: 9, borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', padding: '4px 8px' }} />
                          <Line type="monotone" dataKey="Total" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2.5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 1 }} name="Total" />
                          <Line type="monotone" dataKey="Granted" stroke="hsl(142 71% 45%)" strokeWidth={1.5} dot={{ r: 2.5, fill: 'hsl(142, 71%, 45%)', stroke: '#fff', strokeWidth: 1 }} name="Granted" />
                          <Line type="monotone" dataKey="Filed" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2.5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1 }} name="Filed" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>


                   {/* Leading IP Holders */}
                   <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                     <div className="mb-2">
                       <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Leading IP Holders</h3>
                      <p className="text-xs text-muted-foreground">Organisations with the largest IP portfolios for this pathway.</p>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
                      {[developers.slice(0, 5), developers.slice(5, 10)].map((col, colIdx) =>
                      <React.Fragment key={colIdx}>
                          {colIdx === 1 && <div className="w-px bg-border/60" />}
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-[3px] text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">Organization</th>
                                <th className="text-center py-[3px] text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">Total</th>
                                <th className="text-center py-[3px] text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">Granted</th>
                                <th className="text-center py-[3px] text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">Filed</th>
                              </tr>
                            </thead>
                            <tbody>
                              {col.map((dev, i) => {
                              const rank = colIdx * 5 + i + 1;
                              return (
                                <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedIPHolder({ org: dev.org, total: dev.total, granted: dev.granted, filed: dev.filed })}>
                                    <td className="py-[3px]"><div className="flex items-center gap-1.5"><span className="text-[9px] text-muted-foreground w-3 font-medium">{rank}</span><span className="font-medium text-foreground text-[10px] hover:text-primary transition-colors">{dev.org}</span></div></td>
                                    <td className="text-center py-[3px]"><div className="flex items-center justify-center gap-1"><div className="w-10 h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-foreground/60 rounded-full" style={{ width: `${dev.total / 100 * 100}%` }}></div></div><span className="text-[10px] font-medium">{dev.total}</span></div></td>
                                    <td className="text-center py-[3px]"><div className="flex items-center justify-center gap-1"><div className="w-10 h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${dev.granted / dev.total * 100}%` }}></div></div><span className="text-[10px] text-primary font-medium">{dev.granted}</span></div></td>
                                    <td className="text-center py-[3px]"><div className="flex items-center justify-center gap-1"><div className="w-10 h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-muted-foreground/50 rounded-full" style={{ width: `${dev.filed / dev.total * 100}%` }}></div></div><span className="text-[10px] text-muted-foreground font-medium">{dev.filed}</span></div></td>
                                  </tr>);

                            })}
                            </tbody>
                          </table>
                        </React.Fragment>
                      )}
                    </div>
                  </div>
                </div>

                {/* Geographic Distribution */}
                <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                  <div className="mb-3">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Geographic Patent Distribution</h3>
                    <p className="text-[10px] text-muted-foreground">Where production and extraction IP is being filed across this pathway.</p>
                  </div>
                  <div className="grid gap-4 items-stretch" style={{ gridTemplateColumns: '2fr 1fr' }}>
                    <div className="flex flex-col">
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-1">Interactive patent intensity map</h4>
                      <div className="rounded-lg flex items-center justify-center relative overflow-hidden border border-border/40 flex-1">
                        <img src={worldPatentMap} alt="World Patent Intensity Map" className="w-full h-full object-cover rounded-lg" />
                        <div className="absolute top-4 left-4 w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
                        <div className="absolute top-12 right-1/3 w-2 h-2 bg-primary rounded-full animate-pulse delay-300"></div>
                        <div className="absolute bottom-1/3 left-1/4 w-4 h-4 bg-primary rounded-full animate-pulse delay-700"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-background/5 to-transparent pointer-events-none"></div>
                      </div>
                    </div>
                    <div className="space-y-2 overflow-y-auto">
                      {geoData.map((item, index) =>
                      <div key={index} className="bg-background rounded-lg px-3 py-3 border border-border/40">
                          <h5 className="font-bold text-[12px] text-foreground mb-1.5">{item.location}</h5>
                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            <div>
                              <div className="text-muted-foreground font-medium">Total Patents</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-muted-foreground">♀</span>
                                <span className="font-semibold text-foreground text-[11px]">{item.total.toLocaleString()}</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground font-medium">Granted</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-primary">✓</span>
                                <span className="font-semibold text-foreground text-[11px]">{item.granted.toLocaleString()}</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground font-medium">Filed</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <FileText className="w-2.5 h-2.5 text-muted-foreground" />
                                <span className="font-semibold text-foreground text-[11px]">{item.filed.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>



                {/* Latest Patents */}
                <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                  <div className="mb-3">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Latest Patents</h3>
                    <p className="text-[10px] text-muted-foreground">Most recent patent filings related to this pathway.</p>
                  </div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <button className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-foreground text-background shadow-sm">
                        <span>ALL</span>
                        <span className="opacity-70">{data.totalAll.toLocaleString()}</span>
                      </button>
                      <Button variant="outline" size="sm" className="text-[10px] h-6 px-2.5 border-border/60">
                        <FileText className="w-2.5 h-2.5 mr-1" />
                        Filed
                        <span className="ml-1.5 text-[10px] text-muted-foreground">{data.totalFiled.toLocaleString()}</span>
                      </Button>
                      <Button variant="outline" size="sm" className="text-[10px] h-6 px-2.5 border-border/60">
                        <span className="text-primary mr-1">✓</span>
                        Granted
                        <span className="ml-1.5 text-[10px] text-muted-foreground">{data.totalGranted.toLocaleString()}</span>
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-52">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground" />
                        <Input
                          placeholder="Search patents..."
                          value={patentSearchTerm}
                          onChange={e => setPatentSearchTerm(e.target.value)}
                          className="pl-6 pr-6 h-6 !text-[9px] border-border w-full"
                        />
                        {patentSearchTerm && (
                          <Button variant="ghost" size="sm" onClick={() => setPatentSearchTerm('')} className="absolute right-0.5 top-1/2 -translate-y-1/2 h-4 w-4 p-0 hover:bg-muted">
                            <X className="h-2 w-2" />
                          </Button>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="text-[10px] h-6 px-2.5 border-border/60">
                        <Filter className="w-2.5 h-2.5 mr-1" />
                        Filter
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground" style={{ width: '45%' }}>Patents and Applications</th>
                          <th className="text-center py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Filing Year</th>
                          <th className="text-center py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Granted Year</th>
                          <th className="text-center py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
                          <th className="text-center py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Jurisdiction</th>
                         </tr>
                      </thead>
                      <tbody>
                        {latestPatents.map((patent, index) =>
                        <tr key={index} className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedPatentDetail(patent)}>
                            <td className="py-1.5" style={{ maxWidth: '300px' }}>
                              <div>
                                <div className="font-medium text-[10px] text-foreground line-clamp-2">{patent.title}</div>
                                <div className="text-[9px] text-muted-foreground mt-0.5">Applicant: {patent.company}</div>
                              </div>
                            </td>
                            <td className="text-center py-1.5 text-[11px] text-muted-foreground">{patent.filingYear}</td>
                            <td className="text-center py-1.5 text-[11px] text-muted-foreground">{patent.grantedYear || ""}</td>
                            <td className="text-center py-1.5">
                              {patent.status === "Granted" ?
                            <div className="inline-flex items-center gap-0.5 text-primary text-[10px] font-medium"><span>✓</span><span>Granted</span></div> :
                            <div className="text-muted-foreground text-[10px]">Filed</div>
                            }
                            </td>
                            <td className="text-center py-1.5"><span className="text-[10px] text-muted-foreground">{patent.jurisdiction}</span></td>
                            
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <IPHolderPatentsModal
          open={!!selectedIPHolder}
          onOpenChange={(open) => { if (!open) setSelectedIPHolder(null); }}
          organization={selectedIPHolder?.org || ''}
          totalPatents={selectedIPHolder?.total || 0}
          grantedCount={selectedIPHolder?.granted || 0}
          filedCount={selectedIPHolder?.filed || 0}
          patents={[]}
          topic={decodedTopic}
        />

        <PatentDetailModal
          open={!!selectedPatentDetail}
          onOpenChange={(open) => { if (!open) setSelectedPatentDetail(null); }}
          patent={selectedPatentDetail}
          topic={decodedTopic}
        />
      </div>
    </div>);

};

export default PathwayIPLandscape;