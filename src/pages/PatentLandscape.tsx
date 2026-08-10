import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, Calendar, FileText, Filter, Download, Globe, FlaskConical, ShoppingBag, Leaf, Cpu, ChevronRight, ChevronDown, Search, X, Beaker, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter, ZAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import worldPatentMap from '@/assets/world-patent-map.png';
import IPHolderPatentsModal from '@/components/IPHolderPatentsModal';
import CategoryPatentsModal from '@/components/CategoryPatentsModal';
import PatentDetailModal from '@/components/PatentDetailModal';

type PatentView = 'feedstock' | 'technology' | 'production' | 'applications' | 'products';

// ── View Configurations ──
const viewConfigs: Record<PatentView, {
  label: string;
  icon: typeof FlaskConical;
  description: (topic: string) => string;
  trendData: {year: string;Filed: number;Granted: number;Total: number;}[];
  cpcData: {code: string;name: string;count: number;color: string;}[];
  pieData: {name: string;value: number;fill: string;}[];
  patents: {title: string;company: string;filingYear: number;grantedYear: number | null;status: string;jurisdiction: number;}[];
  geoData: {location: string;countries: string;total: number;granted: number;filed: number;}[];
  developers: {org: string;total: number;granted: number;filed: number;}[];
  trendDescription: (topic: string) => string;
  developerLabel: string;
  developerDescription: string;
  geoDescription: string;
  cpcDescription: string;
  patentDescription: string;
  totalPatents: string;
  filedCount: string;
  grantedCount: string;
  sectors?: {name: string;patents: number;share: string;cagr: string;borderColor: string;cagrColor: string;shareColor: string;subs: {n: string;v: number;}[];}[][];
  productionSectorGroups?: {label: string; sectors: {name: string;patents: number;share: string;cagr: string;borderColor: string;cagrColor: string;shareColor: string;subs: {n: string;v: number;}[];}[];}[];
  sectorTitle: string;
  heatMatrixTitle: string;
  heatMatrixRows?: {name: string;total: number;values: number[];children?: {name: string;total: number;values: number[];}[];}[];
  feedstockHeatMatrixRows?: {name: string;total: number;values: number[];children?: {name: string;total: number;values: number[];}[];}[];
  bubbleTitle: string;
  bubbleSubtitle: string;
  bubbleData?: {name: string;patentVolume: number;hhi: number;growth: number;fill: string;}[];
  concentration?: {hhi: string;hhiLabel: string;top5: string;top10: string;gini: string;};
}> = {
  feedstock: {
    label: "Feedstock & Biomass",
    icon: Leaf,
    description: (topic) => `Patents related to the sourcing, preprocessing, and supply of biomass feedstocks for ${topic} production.`,
    trendData: [
    { year: '2014', Filed: 4, Granted: 3, Total: 7 },
    { year: '2015', Filed: 5, Granted: 4, Total: 9 },
    { year: '2016', Filed: 6, Granted: 5, Total: 11 },
    { year: '2017', Filed: 8, Granted: 6, Total: 14 },
    { year: '2018', Filed: 10, Granted: 7, Total: 17 },
    { year: '2019', Filed: 12, Granted: 8, Total: 20 },
    { year: '2020', Filed: 14, Granted: 10, Total: 24 },
    { year: '2021', Filed: 17, Granted: 12, Total: 29 },
    { year: '2022', Filed: 20, Granted: 15, Total: 35 },
    { year: '2023', Filed: 24, Granted: 16, Total: 40 }],

    cpcData: [
    { code: "A", name: "Human Necessities", count: 68, color: "bg-purple-500" },
    { code: "B", name: "Performing Operations; Transporting", count: 16, color: "bg-orange-500" },
    { code: "C", name: "Chemistry; Metallurgy", count: 94, color: "bg-pink-400" },
    { code: "D", name: "Textiles; Paper", count: 4, color: "bg-gray-800" },
    { code: "E", name: "Fixed Constructions", count: 3, color: "bg-sky-500" },
    { code: "F", name: "Mechanical Engineering; Lighting; Heating; Weapons; Blasting", count: 3, color: "bg-blue-600" },
    { code: "G", name: "Physics", count: 14, color: "bg-orange-400" },
    { code: "H", name: "Electricity", count: 15, color: "bg-red-700" },
    { code: "Y", name: "General Tagging of New Technological Developments; General Tagging of Cross-...", count: 2, color: "bg-yellow-400" }],

    pieData: [
    { name: "A", value: 68, fill: "#8b5cf6" },
    { name: "B", value: 16, fill: "#f97316" },
    { name: "C", value: 94, fill: "#f472b6" },
    { name: "D", value: 4, fill: "#1f2937" },
    { name: "E", value: 3, fill: "#0ea5e9" },
    { name: "F", value: 3, fill: "#2563eb" },
    { name: "G", value: 14, fill: "#fb923c" },
    { name: "H", value: 15, fill: "#b91c1c" },
    { name: "Y", value: 2, fill: "#facc15" }],

    patents: [
    { title: "High-Yield Corn Stover Harvesting Method", company: "Deere & Company", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 7 },
    { title: "Lignocellulosic Biomass Quality Grading System", company: "ANDRITZ AG", filingYear: 2022, grantedYear: 2023, status: "Granted", jurisdiction: 12 },
    { title: "Sugar Beet Pulp Pre-treatment for Pentose Recovery", company: "Südzucker AG", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 5 },
    { title: "Automated Biomass Moisture Content Analyser", company: "Metso Outotec", filingYear: 2022, grantedYear: 2023, status: "Granted", jurisdiction: 9 },
    { title: "Integrated Crop-Biorefinery Logistics Platform", company: "ADM", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 4 }],

    geoData: [
    { location: "North America", countries: "3 countries", total: 82, granted: 28, filed: 54 },
    { location: "Asia", countries: "12 countries", total: 74, granted: 22, filed: 52 },
    { location: "Europe", countries: "16 countries", total: 62, granted: 18, filed: 44 },
    { location: "Oceania", countries: "4 countries", total: 14, granted: 4, filed: 10 },
    { location: "South America", countries: "6 countries", total: 14, granted: 4, filed: 10 }],

    developers: [
    { org: "Deere & Company", total: 18, granted: 12, filed: 6 },
    { org: "ANDRITZ AG", total: 15, granted: 10, filed: 5 },
    { org: "Südzucker AG", total: 12, granted: 8, filed: 4 },
    { org: "ADM", total: 10, granted: 6, filed: 4 },
    { org: "Metso Outotec", total: 9, granted: 6, filed: 3 },
    { org: "Bühler Group", total: 8, granted: 5, filed: 3 },
    { org: "Cargill Inc.", total: 7, granted: 4, filed: 3 },
    { org: "POET LLC", total: 6, granted: 4, filed: 2 },
    { org: "Raízen S.A.", total: 5, granted: 3, filed: 2 },
    { org: "Verbio AG", total: 4, granted: 3, filed: 1 }],

    trendDescription: (topic) => `Filing trends for patents covering biomass feedstock sourcing, preprocessing, and supply chain innovations for ${topic}.`,
    developerLabel: "Feedstock",
    developerDescription: "Top organisations filing patents for biomass feedstock sourcing and preprocessing technologies.",
    geoDescription: "Where feedstock and biomass sourcing IP is being filed. Explore regional patent intensity for supply chain innovations.",
    cpcDescription: "CPC classification breakdown for feedstock-related patents. Agriculture & Human Necessities dominates biomass sourcing IP.",
    patentDescription: "Most recent patent filings for feedstock sourcing and biomass preprocessing.",
    totalPatents: '246',
    filedCount: '170',
    grantedCount: '76',
    sectorTitle: "Feedstock Sectors",
    heatMatrixTitle: "Feedstock Heat Matrix",
    bubbleTitle: "Feedstock Concentration & Supply Map",
    bubbleSubtitle: "Patent volume × HHI · Bubble size = growth rate",
    sectors: [
    [
    { name: 'Lignocellulosic', patents: 75, share: '30.5%', cagr: '+18.4%', borderColor: 'border-l-[hsl(142,60%,40%)]', cagrColor: 'text-[hsl(142,60%,40%)]', shareColor: 'text-[hsl(142,60%,40%)]', subs: [{ n: 'Corn Stover', v: 28 }, { n: 'Wheat Straw', v: 23 }, { n: 'Wood Chips', v: 16 }] },
    { name: 'Sugar Crops', patents: 58, share: '23.6%', cagr: '+14.2%', borderColor: 'border-l-[hsl(36,95%,54%)]', cagrColor: 'text-[hsl(36,95%,54%)]', shareColor: 'text-[hsl(36,95%,54%)]', subs: [{ n: 'Sugar Beet Pulp', v: 25 }, { n: 'Sugarcane Bagasse', v: 20 }, { n: 'Sweet Sorghum', v: 13 }] },
    { name: 'Forestry Residues', patents: 42, share: '17.1%', cagr: '+11.8%', borderColor: 'border-l-[hsl(25,80%,50%)]', cagrColor: 'text-[hsl(25,80%,50%)]', shareColor: 'text-[hsl(25,80%,50%)]', subs: [{ n: 'Hardwood', v: 18 }, { n: 'Softwood', v: 14 }, { n: 'Bark & Branches', v: 10 }] }],

    [
    { name: 'Agricultural Waste', patents: 32, share: '13.0%', cagr: '+21.3%', borderColor: 'border-l-[hsl(262,83%,58%)]', cagrColor: 'text-[hsl(262,83%,58%)]', shareColor: 'text-[hsl(262,83%,58%)]', subs: [{ n: 'Rice Husks', v: 12 }, { n: 'Coconut Shells', v: 11 }, { n: 'Palm EFB', v: 9 }] },
    { name: 'Algae & Aquatic', patents: 22, share: '8.9%', cagr: '+28.5%', borderColor: 'border-l-[hsl(195,70%,50%)]', cagrColor: 'text-[hsl(195,70%,50%)]', shareColor: 'text-[hsl(195,70%,50%)]', subs: [{ n: 'Microalgae', v: 11 }, { n: 'Seaweed', v: 7 }, { n: 'Duckweed', v: 4 }] },
    { name: 'Municipal Waste', patents: 17, share: '6.9%', cagr: '+16.7%', borderColor: 'border-l-[hsl(340,50%,55%)]', cagrColor: 'text-[hsl(340,50%,55%)]', shareColor: 'text-[hsl(340,50%,55%)]', subs: [{ n: 'Food Waste', v: 8 }, { n: 'Paper Waste', v: 5 }, { n: 'Garden Waste', v: 4 }] }]],


    heatMatrixRows: [
    { name: 'Lignocellulosic', total: 75, values: [12, 14, 16, 17, 16] },
    { name: 'Sugar Crops', total: 58, values: [10, 11, 12, 13, 12] },
    { name: 'Forestry Residues', total: 42, values: [7, 8, 9, 10, 8] },
    { name: 'Agricultural Waste', total: 32, values: [5, 6, 7, 8, 6] },
    { name: 'Algae & Aquatic', total: 22, values: [3, 4, 5, 5, 5] },
    { name: 'Municipal Waste', total: 17, values: [3, 3, 3, 4, 4] }],

    bubbleData: [
    { name: 'Lignocellulosic', patentVolume: 75, hhi: 0.035, growth: 18.4, fill: 'hsl(142 60% 40%)' },
    { name: 'Sugar Crops', patentVolume: 58, hhi: 0.042, growth: 14.2, fill: 'hsl(36 95% 54%)' },
    { name: 'Forestry', patentVolume: 42, hhi: 0.058, growth: 11.8, fill: 'hsl(25 80% 50%)' },
    { name: 'Agri Waste', patentVolume: 32, hhi: 0.088, growth: 21.3, fill: 'hsl(262 83% 58%)' },
    { name: 'Algae', patentVolume: 22, hhi: 0.105, growth: 28.5, fill: 'hsl(195 70% 50%)' },
    { name: 'Municipal', patentVolume: 17, hhi: 0.12, growth: 16.7, fill: 'hsl(340 50% 55%)' }],

    concentration: { hhi: '0.098', hhiLabel: 'Fragmented', top5: '54.8%', top10: '74.2%', gini: '0.48' }
  },
  technology: {
    label: "Process & Engineering",
    icon: Cpu,
    description: (topic) => `Patents related to conversion technologies, process engineering, and novel methods for ${topic} manufacturing.`,
    trendData: [
    { year: '2014', Filed: 5, Granted: 3, Total: 8 },
    { year: '2015', Filed: 6, Granted: 4, Total: 10 },
    { year: '2016', Filed: 7, Granted: 5, Total: 12 },
    { year: '2017', Filed: 9, Granted: 6, Total: 15 },
    { year: '2018', Filed: 11, Granted: 8, Total: 19 },
    { year: '2019', Filed: 13, Granted: 9, Total: 22 },
    { year: '2020', Filed: 16, Granted: 11, Total: 27 },
    { year: '2021', Filed: 19, Granted: 14, Total: 33 },
    { year: '2022', Filed: 23, Granted: 17, Total: 40 },
    { year: '2023', Filed: 26, Granted: 19, Total: 45 }],

    cpcData: [
    { code: "A", name: "Human Necessities", count: 42, color: "bg-purple-500" },
    { code: "B", name: "Performing Operations; Transporting", count: 22, color: "bg-orange-500" },
    { code: "C", name: "Chemistry; Metallurgy", count: 82, color: "bg-pink-400" },
    { code: "D", name: "Textiles; Paper", count: 3, color: "bg-gray-800" },
    { code: "E", name: "Fixed Constructions", count: 4, color: "bg-sky-500" },
    { code: "F", name: "Mechanical Engineering; Lighting; Heating; Weapons; Blasting", count: 6, color: "bg-blue-600" },
    { code: "G", name: "Physics", count: 18, color: "bg-orange-400" },
    { code: "H", name: "Electricity", count: 12, color: "bg-red-700" },
    { code: "Y", name: "General Tagging of New Technological Developments; General Tagging of Cross-...", count: 2, color: "bg-yellow-400" }],

    pieData: [
    { name: "A", value: 42, fill: "#8b5cf6" },
    { name: "B", value: 22, fill: "#f97316" },
    { name: "C", value: 82, fill: "#f472b6" },
    { name: "D", value: 3, fill: "#1f2937" },
    { name: "E", value: 4, fill: "#0ea5e9" },
    { name: "F", value: 6, fill: "#2563eb" },
    { name: "G", value: 18, fill: "#fb923c" },
    { name: "H", value: 12, fill: "#b91c1c" },
    { name: "Y", value: 2, fill: "#facc15" }],

    patents: [
    { title: "Continuous Flow Enzymatic Reactor Design", company: "Novozymes A/S", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 14 },
    { title: "AI-Optimised Fermentation Control System", company: "Siemens AG", filingYear: 2022, grantedYear: 2023, status: "Granted", jurisdiction: 11 },
    { title: "Membrane Electrodialysis for Sugar Separation", company: "Nouryon", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 6 },
    { title: "Supercritical CO₂ Extraction of Hemicellulose", company: "Linde plc", filingYear: 2022, grantedYear: 2023, status: "Granted", jurisdiction: 9 },
    { title: "Catalytic Dehydration Process for Furfural", company: "Clariant AG", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 8 }],

    geoData: [
    { location: "North America", countries: "3 countries", total: 78, granted: 26, filed: 52 },
    { location: "Asia", countries: "14 countries", total: 72, granted: 22, filed: 50 },
    { location: "Europe", countries: "19 countries", total: 68, granted: 24, filed: 44 },
    { location: "Oceania", countries: "4 countries", total: 15, granted: 5, filed: 10 },
    { location: "South America", countries: "5 countries", total: 13, granted: 4, filed: 9 }],

    developers: [
    { org: "Novozymes A/S", total: 19, granted: 13, filed: 6 },
    { org: "Siemens AG", total: 16, granted: 10, filed: 6 },
    { org: "Clariant AG", total: 13, granted: 9, filed: 4 },
    { org: "Nouryon", total: 11, granted: 7, filed: 4 },
    { org: "Linde plc", total: 9, granted: 6, filed: 3 },
    { org: "Genomatica Inc.", total: 8, granted: 5, filed: 3 },
    { org: "DSM-Firmenich", total: 7, granted: 4, filed: 3 },
    { org: "Evonik Industries", total: 6, granted: 4, filed: 2 },
    { org: "Haldor Topsøe", total: 5, granted: 3, filed: 2 },
    { org: "Johnson Matthey", total: 4, granted: 3, filed: 1 }],

    trendDescription: (topic) => `Filing trends for patents covering conversion technologies, process engineering, and manufacturing methods for ${topic}.`,
    developerLabel: "Process",
    developerDescription: "Top organisations filing patents for conversion technologies and process innovations.",
    geoDescription: "Where technology and process engineering IP is being filed. Explore regional patent intensity for manufacturing innovations.",
    cpcDescription: "CPC classification breakdown for technology-related patents. Chemistry & Metallurgy dominates process innovation IP.",
    patentDescription: "Most recent patent filings for conversion technologies and process engineering.",
    totalPatents: '246',
    filedCount: '162',
    grantedCount: '84',
    sectorTitle: "Technology Sectors",
    heatMatrixTitle: "Technology Heat Matrix",
    bubbleTitle: "Technology Concentration & Process Map",
    bubbleSubtitle: "Patent volume × HHI · Bubble size = growth rate",
    sectors: [
    [
    { name: 'Enzymatic Hydrolysis', patents: 63, share: '25.6%', cagr: '+19.2%', borderColor: 'border-l-[hsl(152,60%,40%)]', cagrColor: 'text-[hsl(152,60%,40%)]', shareColor: 'text-[hsl(152,60%,40%)]', subs: [{ n: 'Cellulase Systems', v: 25 }, { n: 'Hemicellulase', v: 21 }, { n: 'Enzyme Engineering', v: 17 }] },
    { name: 'Chemical Catalysis', patents: 51, share: '20.7%', cagr: '+15.4%', borderColor: 'border-l-[hsl(217,91%,60%)]', cagrColor: 'text-[hsl(217,91%,60%)]', shareColor: 'text-[hsl(217,91%,60%)]', subs: [{ n: 'Acid Catalysis', v: 20 }, { n: 'Metal Catalysts', v: 17 }, { n: 'Ionic Liquids', v: 15 }] },
    { name: 'Fermentation', patents: 40, share: '16.3%', cagr: '+22.8%', borderColor: 'border-l-[hsl(262,83%,58%)]', cagrColor: 'text-[hsl(262,83%,58%)]', shareColor: 'text-[hsl(262,83%,58%)]', subs: [{ n: 'Yeast Engineering', v: 17 }, { n: 'Bacterial Pathways', v: 14 }, { n: 'Co-fermentation', v: 10 }] }],

    [
    { name: 'Separation & Purification', patents: 34, share: '13.8%', cagr: '+17.1%', borderColor: 'border-l-[hsl(36,95%,54%)]', cagrColor: 'text-[hsl(36,95%,54%)]', shareColor: 'text-[hsl(36,95%,54%)]', subs: [{ n: 'Membrane Tech', v: 14 }, { n: 'Chromatography', v: 11 }, { n: 'Crystallisation', v: 9 }] },
    { name: 'Pretreatment', patents: 30, share: '12.2%', cagr: '+13.5%', borderColor: 'border-l-[hsl(340,50%,55%)]', cagrColor: 'text-[hsl(340,50%,55%)]', shareColor: 'text-[hsl(340,50%,55%)]', subs: [{ n: 'Steam Explosion', v: 12 }, { n: 'Organosolv', v: 10 }, { n: 'Ammonia Fibre', v: 8 }] },
    { name: 'Process Integration', patents: 28, share: '11.4%', cagr: '+25.6%', borderColor: 'border-l-[hsl(160,50%,45%)]', cagrColor: 'text-[hsl(160,50%,45%)]', shareColor: 'text-[hsl(160,50%,45%)]', subs: [{ n: 'Biorefinery Design', v: 11 }, { n: 'Heat Integration', v: 9 }, { n: 'Water Recycling', v: 7 }] }]],


    heatMatrixRows: [
    { name: 'Enzymatic Hydrolysis', total: 63, values: [10, 12, 13, 15, 13] },
    { name: 'Chemical Catalysis', total: 51, values: [9, 10, 11, 12, 10] },
    { name: 'Fermentation', total: 40, values: [7, 8, 8, 9, 8] },
    { name: 'Separation', total: 34, values: [6, 6, 7, 8, 7] },
    { name: 'Pretreatment', total: 30, values: [5, 6, 6, 7, 6] },
    { name: 'Process Integration', total: 28, values: [5, 5, 6, 6, 6] }],

    bubbleData: [
    { name: 'Enzymatic', patentVolume: 63, hhi: 0.032, growth: 19.2, fill: 'hsl(152 60% 40%)' },
    { name: 'Catalysis', patentVolume: 51, hhi: 0.038, growth: 15.4, fill: 'hsl(217 91% 60%)' },
    { name: 'Fermentation', patentVolume: 40, hhi: 0.055, growth: 22.8, fill: 'hsl(262 83% 58%)' },
    { name: 'Separation', patentVolume: 34, hhi: 0.072, growth: 17.1, fill: 'hsl(36 95% 54%)' },
    { name: 'Pretreatment', patentVolume: 30, hhi: 0.085, growth: 13.5, fill: 'hsl(340 50% 55%)' },
    { name: 'Integration', patentVolume: 28, hhi: 0.098, growth: 25.6, fill: 'hsl(160 50% 45%)' }],

    concentration: { hhi: '0.112', hhiLabel: 'Moderately Fragmented', top5: '58.2%', top10: '77.8%', gini: '0.51' }
  },
  production: {
    label: "Production & Extraction",
    icon: FlaskConical,
    description: (topic) => `Patents related to the production, extraction, and purification of ${topic} from biomass feedstocks.`,
    trendData: [
    { year: '2014', Filed: 4, Granted: 2, Total: 6 },
    { year: '2015', Filed: 5, Granted: 3, Total: 8 },
    { year: '2016', Filed: 6, Granted: 4, Total: 10 },
    { year: '2017', Filed: 8, Granted: 5, Total: 13 },
    { year: '2018', Filed: 9, Granted: 6, Total: 15 },
    { year: '2019', Filed: 11, Granted: 7, Total: 18 },
    { year: '2020', Filed: 13, Granted: 8, Total: 21 },
    { year: '2021', Filed: 15, Granted: 10, Total: 25 },
    { year: '2022', Filed: 17, Granted: 12, Total: 29 },
    { year: '2023', Filed: 19, Granted: 14, Total: 33 }],

    cpcData: [
    { code: "A", name: "Human Necessities", count: 56, color: "bg-purple-500" },
    { code: "B", name: "Performing Operations; Transporting", count: 28, color: "bg-orange-500" },
    { code: "C", name: "Chemistry; Metallurgy", count: 88, color: "bg-pink-400" },
    { code: "D", name: "Textiles; Paper", count: 5, color: "bg-gray-800" },
    { code: "E", name: "Fixed Constructions", count: 3, color: "bg-sky-500" },
    { code: "F", name: "Mechanical Engineering; Lighting; Heating; Weapons; Blasting", count: 5, color: "bg-blue-600" },
    { code: "G", name: "Physics", count: 16, color: "bg-orange-400" },
    { code: "H", name: "Electricity", count: 14, color: "bg-red-700" },
    { code: "Y", name: "General Tagging of New Technological Developments; General Tagging of Cross-...", count: 3, color: "bg-yellow-400" }],

    pieData: [
    { name: "A", value: 56, fill: "#8b5cf6" },
    { name: "B", value: 28, fill: "#f97316" },
    { name: "C", value: 88, fill: "#f472b6" },
    { name: "D", value: 5, fill: "#1f2937" },
    { name: "E", value: 3, fill: "#0ea5e9" },
    { name: "F", value: 5, fill: "#2563eb" },
    { name: "G", value: 16, fill: "#fb923c" },
    { name: "H", value: 14, fill: "#b91c1c" },
    { name: "Y", value: 3, fill: "#facc15" }],

    patents: [
    { title: "Preservative System for Emulsion-based Therapeutic Topical Formulations", company: "Arbor Pharmaceuticals, Llc", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 8 },
    { title: "Lactic Bacterium With Modified Galactokinase Expression for Texturizing Food Products by Overexpression of Exopolysaccharide", company: "Chr. Hansen A/s", filingYear: 2022, grantedYear: 2023, status: "Granted", jurisdiction: 15 },
    { title: "Hard Capsule Formulation", company: "Capsugel Belgium Nv", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 5 },
    { title: "Methods for Enhancing Microbial Production of Specific Length Fatty Alcohols in the Presence of Methanol", company: "Genomatica, Inc.", filingYear: 2022, grantedYear: 2023, status: "Granted", jurisdiction: 12 },
    { title: "Process for Obtaining Nanocomposite Food Packages", company: "Universitatea Tehnica Din Cluj-napoca, Centrul Universitar Nord Din Baia Mare", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 4 },
    { title: "Pyrimidinyloxy Benzene Derivatives as Herbicidal Compounds", company: "BASF SE", filingYear: 2021, grantedYear: 2022, status: "Granted", jurisdiction: 9 }],

    geoData: [
    { location: "North America", countries: "3 countries", total: 76, granted: 24, filed: 52 },
    { location: "Asia", countries: "12 countries", total: 70, granted: 20, filed: 50 },
    { location: "Europe", countries: "18 countries", total: 72, granted: 22, filed: 50 },
    { location: "Oceania", countries: "4 countries", total: 14, granted: 4, filed: 10 },
    { location: "South America", countries: "5 countries", total: 14, granted: 4, filed: 10 }],

    developers: [
    { org: "Novozymes A/S", total: 20, granted: 14, filed: 6 },
    { org: "BASF SE", total: 17, granted: 11, filed: 6 },
    { org: "Valmet Corp.", total: 14, granted: 9, filed: 5 },
    { org: "UPM-Kymmene Oyj", total: 11, granted: 7, filed: 4 },
    { org: "DuPont de Nemours", total: 10, granted: 6, filed: 4 },
    { org: "Borregaard ASA", total: 8, granted: 5, filed: 3 },
    { org: "Lenzing AG", total: 7, granted: 5, filed: 2 },
    { org: "Stora Enso", total: 6, granted: 4, filed: 2 },
    { org: "Arkema S.A.", total: 5, granted: 3, filed: 2 },
    { org: "Corbion N.V.", total: 4, granted: 3, filed: 1 }],

    trendDescription: (topic) => `Filing trends for patents covering ${topic} production processes, extraction methods, and purification technologies.`,
    developerLabel: "Process",
    developerDescription: "Organisations with the largest IP portfolios",
    geoDescription: "Where production and extraction IP is being filed. Explore regional patent intensity for manufacturing technologies.",
    cpcDescription: "CPC classification breakdown for production-related patents. Chemistry & Metallurgy dominates extraction IP.",
    patentDescription: "Most recent patent filings for production and extraction processes.",
    totalPatents: '178',
    filedCount: '124',
    grantedCount: '54',
    sectorTitle: "IP HOTSPOTS",
    heatMatrixTitle: "IP HEAT MATRIX",
    bubbleTitle: "Production Concentration & Process Map",
    bubbleSubtitle: "Patent volume × HHI · Bubble size = growth rate",
    sectors: [
    [
    { name: 'Fermentation', patents: 70, share: '28.5%', cagr: '+20.1%', borderColor: 'border-l-[hsl(142,60%,40%)]', cagrColor: 'text-[hsl(142,60%,40%)]', shareColor: 'text-[hsl(142,60%,40%)]', subs: [{ n: 'Batch Fermentation', v: 28 }, { n: 'Continuous Fermentation', v: 22 }, { n: 'Fed-batch Systems', v: 20 }] },
    { name: 'Catalytic Conversion', patents: 51, share: '20.7%', cagr: '+16.5%', borderColor: 'border-l-[hsl(217,91%,60%)]', cagrColor: 'text-[hsl(217,91%,60%)]', shareColor: 'text-[hsl(217,91%,60%)]', subs: [{ n: 'Heterogeneous Catalysis', v: 20 }, { n: 'Homogeneous Catalysis', v: 17 }, { n: 'Biocatalysis', v: 15 }] },
    { name: 'Extraction & Separation', patents: 41, share: '16.7%', cagr: '+18.7%', borderColor: 'border-l-[hsl(262,83%,58%)]', cagrColor: 'text-[hsl(262,83%,58%)]', shareColor: 'text-[hsl(262,83%,58%)]', subs: [{ n: 'Membrane Separation', v: 16 }, { n: 'Solvent Extraction', v: 14 }, { n: 'Distillation', v: 11 }] }],
    [
    { name: 'Purification', patents: 34, share: '13.8%', cagr: '+14.3%', borderColor: 'border-l-[hsl(36,95%,54%)]', cagrColor: 'text-[hsl(36,95%,54%)]', shareColor: 'text-[hsl(36,95%,54%)]', subs: [{ n: 'Crystallisation', v: 13 }, { n: 'Chromatography', v: 11 }, { n: 'Ion Exchange', v: 10 }] },
    { name: 'Enzymatic Hydrolysis', patents: 28, share: '11.4%', cagr: '+22.4%', borderColor: 'border-l-[hsl(195,70%,50%)]', cagrColor: 'text-[hsl(195,70%,50%)]', shareColor: 'text-[hsl(195,70%,50%)]', subs: [{ n: 'Cellulase Systems', v: 11 }, { n: 'Hemicellulase', v: 9 }, { n: 'Enzyme Cocktails', v: 7 }] },
    { name: 'Thermochemical', patents: 22, share: '8.9%', cagr: '+12.8%', borderColor: 'border-l-[hsl(340,50%,55%)]', cagrColor: 'text-[hsl(340,50%,55%)]', shareColor: 'text-[hsl(340,50%,55%)]', subs: [{ n: 'Pyrolysis', v: 9 }, { n: 'Gasification', v: 7 }, { n: 'Hydrothermal', v: 6 }] }]],

    productionSectorGroups: [
      {
        label: 'Feedstock',
        sectors: [
          { name: 'Lignocellulosic Biomass', patents: 54, share: '22.0%', cagr: '+17.8%', borderColor: 'border-l-[hsl(142,60%,40%)]', cagrColor: 'text-[hsl(142,60%,40%)]', shareColor: 'text-[hsl(142,60%,40%)]', subs: [{ n: 'Corn Stover', v: 20 }, { n: 'Wheat Straw', v: 18 }, { n: 'Wood Chips', v: 17 }] },
          { name: 'Sugar Crops', patents: 45, share: '18.3%', cagr: '+14.6%', borderColor: 'border-l-[hsl(36,95%,54%)]', cagrColor: 'text-[hsl(36,95%,54%)]', shareColor: 'text-[hsl(36,95%,54%)]', subs: [{ n: 'Sugar Beet Pulp', v: 19 }, { n: 'Sugarcane Bagasse', v: 15 }, { n: 'Sweet Sorghum', v: 12 }] },
          { name: 'Starch Sources', patents: 33, share: '13.4%', cagr: '+11.2%', borderColor: 'border-l-[hsl(262,83%,58%)]', cagrColor: 'text-[hsl(262,83%,58%)]', shareColor: 'text-[hsl(262,83%,58%)]', subs: [{ n: 'Corn Starch', v: 14 }, { n: 'Potato Starch', v: 11 }, { n: 'Cassava Starch', v: 8 }] },
          { name: 'Food Waste', patents: 26, share: '10.6%', cagr: '+24.3%', borderColor: 'border-l-[hsl(195,70%,50%)]', cagrColor: 'text-[hsl(195,70%,50%)]', shareColor: 'text-[hsl(195,70%,50%)]', subs: [{ n: 'Bread Waste', v: 11 }, { n: 'Fruit Pomace', v: 8 }, { n: 'Coffee Grounds', v: 7 }] },
          { name: 'Algal Biomass', patents: 21, share: '8.5%', cagr: '+28.1%', borderColor: 'border-l-[hsl(170,60%,45%)]', cagrColor: 'text-[hsl(170,60%,45%)]', shareColor: 'text-[hsl(170,60%,45%)]', subs: [{ n: 'Microalgae', v: 10 }, { n: 'Macroalgae', v: 6 }, { n: 'Cyanobacteria', v: 5 }] },
          { name: 'Oilseed Crops', patents: 16, share: '6.5%', cagr: '+9.8%', borderColor: 'border-l-[hsl(45,90%,50%)]', cagrColor: 'text-[hsl(45,90%,50%)]', shareColor: 'text-[hsl(45,90%,50%)]', subs: [{ n: 'Rapeseed', v: 7 }, { n: 'Soybean', v: 5 }, { n: 'Palm Kernel', v: 4 }] },
        ]
      },
      {
        label: 'Process',
        sectors: [
          { name: 'Fermentation', patents: 70, share: '28.5%', cagr: '+20.1%', borderColor: 'border-l-[hsl(217,91%,60%)]', cagrColor: 'text-[hsl(217,91%,60%)]', shareColor: 'text-[hsl(217,91%,60%)]', subs: [{ n: 'Batch Fermentation', v: 28 }, { n: 'Continuous Fermentation', v: 22 }, { n: 'Fed-batch Systems', v: 20 }] },
          { name: 'Catalytic Conversion', patents: 51, share: '20.7%', cagr: '+16.5%', borderColor: 'border-l-[hsl(195,70%,50%)]', cagrColor: 'text-[hsl(195,70%,50%)]', shareColor: 'text-[hsl(195,70%,50%)]', subs: [{ n: 'Heterogeneous Catalysis', v: 20 }, { n: 'Homogeneous Catalysis', v: 17 }, { n: 'Biocatalysis', v: 15 }] },
          { name: 'Extraction & Separation', patents: 41, share: '16.7%', cagr: '+18.7%', borderColor: 'border-l-[hsl(340,50%,55%)]', cagrColor: 'text-[hsl(340,50%,55%)]', shareColor: 'text-[hsl(340,50%,55%)]', subs: [{ n: 'Membrane Separation', v: 16 }, { n: 'Solvent Extraction', v: 14 }, { n: 'Distillation', v: 11 }] },
          { name: 'Purification', patents: 34, share: '13.8%', cagr: '+14.3%', borderColor: 'border-l-[hsl(36,95%,54%)]', cagrColor: 'text-[hsl(36,95%,54%)]', shareColor: 'text-[hsl(36,95%,54%)]', subs: [{ n: 'Crystallisation', v: 13 }, { n: 'Chromatography', v: 11 }, { n: 'Ion Exchange', v: 10 }] },
          { name: 'Enzymatic Hydrolysis', patents: 28, share: '11.4%', cagr: '+22.4%', borderColor: 'border-l-[hsl(262,83%,58%)]', cagrColor: 'text-[hsl(262,83%,58%)]', shareColor: 'text-[hsl(262,83%,58%)]', subs: [{ n: 'Cellulase Systems', v: 11 }, { n: 'Hemicellulase', v: 9 }, { n: 'Enzyme Cocktails', v: 7 }] },
          { name: 'Thermochemical', patents: 22, share: '8.9%', cagr: '+12.8%', borderColor: 'border-l-[hsl(340,50%,55%)]', cagrColor: 'text-[hsl(340,50%,55%)]', shareColor: 'text-[hsl(340,50%,55%)]', subs: [{ n: 'Pyrolysis', v: 9 }, { n: 'Gasification', v: 7 }, { n: 'Hydrothermal', v: 6 }] },
        ]
      }
    ],

    heatMatrixRows: [
    { name: 'Fermentation', total: 70, values: [12, 13, 14, 16, 15], children: [
      { name: 'Microbial Fermentation', total: 30, values: [5, 6, 6, 7, 6] },
      { name: 'SSF (Simultaneous Saccharification)', total: 20, values: [3, 4, 4, 5, 4] },
      { name: 'Consolidated Bioprocessing', total: 12, values: [2, 2, 2, 3, 3] },
      { name: 'Continuous Fermentation', total: 8, values: [2, 1, 2, 1, 2] },
    ]},
    { name: 'Catalytic Conversion', total: 51, values: [9, 10, 11, 12, 10], children: [
      { name: 'Heterogeneous Catalysis', total: 22, values: [4, 4, 5, 5, 4] },
      { name: 'Homogeneous Catalysis', total: 17, values: [3, 3, 3, 4, 4] },
      { name: 'Biocatalysis', total: 12, values: [2, 3, 3, 3, 2] },
    ]},
    { name: 'Extraction & Separation', total: 41, values: [7, 8, 9, 10, 8], children: [
      { name: 'Membrane Separation', total: 18, values: [3, 3, 4, 4, 4] },
      { name: 'Solvent Extraction', total: 14, values: [3, 3, 3, 3, 2] },
      { name: 'Distillation', total: 9, values: [1, 2, 2, 3, 2] },
    ]},
    { name: 'Purification', total: 34, values: [6, 6, 7, 8, 7], children: [
      { name: 'Crystallisation', total: 15, values: [3, 3, 3, 3, 3] },
      { name: 'Ion Exchange', total: 11, values: [2, 2, 2, 3, 2] },
      { name: 'Electrodialysis', total: 8, values: [1, 1, 2, 2, 2] },
    ]},
    { name: 'Enzymatic Hydrolysis', total: 28, values: [5, 5, 6, 7, 6], children: [
      { name: 'Cellulase Cocktails', total: 13, values: [2, 2, 3, 3, 3] },
      { name: 'Hemicellulase Systems', total: 9, values: [2, 2, 2, 2, 1] },
      { name: 'Laccase Treatment', total: 6, values: [1, 1, 1, 2, 2] },
    ]},
    { name: 'Thermochemical', total: 22, values: [4, 4, 5, 5, 4], children: [
      { name: 'Pyrolysis', total: 9, values: [2, 2, 2, 2, 2] },
      { name: 'Gasification', total: 7, values: [1, 1, 2, 2, 1] },
      { name: 'Hydrothermal', total: 6, values: [1, 1, 1, 1, 1] },
    ]}],

    feedstockHeatMatrixRows: [
    { name: 'Lignocellulosic Biomass', total: 54, values: [9, 10, 11, 13, 11], children: [
      { name: 'Corn Stover', total: 22, values: [4, 4, 4, 5, 5] },
      { name: 'Wheat Straw', total: 18, values: [3, 3, 4, 4, 4] },
      { name: 'Wood Chips', total: 14, values: [2, 3, 3, 4, 2] },
    ]},
    { name: 'Sugar Crops', total: 45, values: [8, 8, 9, 11, 9], children: [
      { name: 'Sugar Beet Pulp', total: 19, values: [3, 4, 4, 4, 4] },
      { name: 'Sugarcane Bagasse', total: 15, values: [3, 3, 3, 4, 3] },
      { name: 'Sweet Sorghum', total: 11, values: [2, 1, 2, 3, 2] },
    ]},
    { name: 'Starch Sources', total: 33, values: [6, 6, 7, 8, 6], children: [
      { name: 'Corn Starch', total: 14, values: [2, 3, 3, 3, 3] },
      { name: 'Potato Starch', total: 11, values: [2, 2, 2, 3, 2] },
      { name: 'Cassava Starch', total: 8, values: [2, 1, 2, 2, 1] },
    ]},
    { name: 'Food Waste', total: 26, values: [4, 5, 5, 6, 6], children: [
      { name: 'Bread Waste', total: 10, values: [2, 2, 2, 2, 2] },
      { name: 'Fruit Pomace', total: 9, values: [1, 2, 2, 2, 2] },
      { name: 'Coffee Grounds', total: 7, values: [1, 1, 1, 2, 2] },
    ]},
    { name: 'Algal Biomass', total: 21, values: [3, 4, 4, 5, 5], children: [
      { name: 'Microalgae', total: 12, values: [2, 2, 3, 3, 2] },
      { name: 'Macroalgae', total: 9, values: [1, 2, 1, 2, 3] },
    ]}],

    bubbleData: [
    { name: 'Fermentation', patentVolume: 70, hhi: 0.030, growth: 20.1, fill: 'hsl(142 60% 40%)' },
    { name: 'Catalytic', patentVolume: 51, hhi: 0.040, growth: 16.5, fill: 'hsl(217 91% 60%)' },
    { name: 'Extraction', patentVolume: 41, hhi: 0.052, growth: 18.7, fill: 'hsl(262 83% 58%)' },
    { name: 'Purification', patentVolume: 34, hhi: 0.068, growth: 14.3, fill: 'hsl(36 95% 54%)' },
    { name: 'Enzymatic', patentVolume: 28, hhi: 0.082, growth: 22.4, fill: 'hsl(195 70% 50%)' },
    { name: 'Thermochemical', patentVolume: 22, hhi: 0.095, growth: 12.8, fill: 'hsl(340 50% 55%)' }],

    concentration: { hhi: '0.105', hhiLabel: 'Moderately Fragmented', top5: '56.4%', top10: '76.1%', gini: '0.49' }
  },
  applications: {
    label: "Applications & Off-take",
    icon: ShoppingBag,
    description: (topic) => `Patents related to the downstream use of ${topic} in end-market applications such as food, pharma, and materials.`,
    trendData: [
    { year: '2014', Filed: 6, Granted: 5, Total: 11 },
    { year: '2015', Filed: 8, Granted: 6, Total: 14 },
    { year: '2016', Filed: 11, Granted: 8, Total: 19 },
    { year: '2017', Filed: 14, Granted: 11, Total: 25 },
    { year: '2018', Filed: 17, Granted: 13, Total: 30 },
    { year: '2019', Filed: 21, Granted: 16, Total: 37 },
    { year: '2020', Filed: 26, Granted: 19, Total: 45 },
    { year: '2021', Filed: 31, Granted: 23, Total: 54 },
    { year: '2022', Filed: 37, Granted: 28, Total: 65 },
    { year: '2023', Filed: 44, Granted: 33, Total: 77 }],

    cpcData: [
    { code: "A", name: "Human Necessities", count: 72, color: "bg-purple-500" },
    { code: "B", name: "Performing Operations; Transporting", count: 16, color: "bg-orange-500" },
    { code: "C", name: "Chemistry; Metallurgy", count: 68, color: "bg-pink-400" },
    { code: "D", name: "Textiles; Paper", count: 5, color: "bg-gray-800" },
    { code: "E", name: "Fixed Constructions", count: 2, color: "bg-sky-500" },
    { code: "F", name: "Mechanical Engineering; Lighting; Heating; Weapons; Blasting", count: 3, color: "bg-blue-600" },
    { code: "G", name: "Physics", count: 18, color: "bg-orange-400" },
    { code: "H", name: "Electricity", count: 14, color: "bg-red-700" },
    { code: "Y", name: "General Tagging of New Technological Developments; General Tagging of Cross-...", count: 3, color: "bg-yellow-400" }],

    pieData: [
    { name: "A", value: 72, fill: "#8b5cf6" },
    { name: "B", value: 16, fill: "#f97316" },
    { name: "C", value: 68, fill: "#f472b6" },
    { name: "D", value: 5, fill: "#1f2937" },
    { name: "E", value: 2, fill: "#0ea5e9" },
    { name: "F", value: 3, fill: "#2563eb" },
    { name: "G", value: 18, fill: "#fb923c" },
    { name: "H", value: 14, fill: "#b91c1c" },
    { name: "Y", value: 3, fill: "#facc15" }],

    patents: [
    { title: "Xylose-based Bioplastic Formulation", company: "NatureWorks LLC", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 6 },
    { title: "Xylitol Production via Catalytic Hydrogenation", company: "Danisco / IFF", filingYear: 2022, grantedYear: 2023, status: "Granted", jurisdiction: 18 },
    { title: "Xylose-derived Surfactants for Cosmetics", company: "Evonik Industries", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 4 },
    { title: "Furfural Synthesis from Pentose Sugars", company: "Avantium N.V.", filingYear: 2021, grantedYear: 2022, status: "Granted", jurisdiction: 11 },
    { title: "Dietary Fibre Supplements from Xylan", company: "Cargill Inc.", filingYear: 2023, grantedYear: 2023, status: "Granted", jurisdiction: 7 }],

    geoData: [
    { location: "North America", countries: "3 countries", total: 68, granted: 24, filed: 44 },
    { location: "Asia", countries: "15 countries", total: 78, granted: 26, filed: 52 },
    { location: "Europe", countries: "21 countries", total: 74, granted: 28, filed: 46 },
    { location: "Oceania", countries: "4 countries", total: 13, granted: 4, filed: 9 },
    { location: "South America", countries: "6 countries", total: 13, granted: 4, filed: 9 }],

    developers: [
    { org: "Danisco / IFF", total: 21, granted: 15, filed: 6 },
    { org: "Cargill Inc.", total: 16, granted: 10, filed: 6 },
    { org: "Avantium N.V.", total: 13, granted: 8, filed: 5 },
    { org: "NatureWorks LLC", total: 10, granted: 7, filed: 3 },
    { org: "Evonik Industries", total: 9, granted: 5, filed: 4 },
    { org: "TotalEnergies Corbion", total: 8, granted: 5, filed: 3 },
    { org: "Novamont S.p.A.", total: 7, granted: 4, filed: 3 },
    { org: "Eastman Chemical", total: 5, granted: 3, filed: 2 },
    { org: "Mitsubishi Chemical", total: 5, granted: 3, filed: 2 },
    { org: "Plantic Technologies", total: 4, granted: 2, filed: 2 }],

    trendDescription: (topic) => `Filing trends for patents covering downstream ${topic} applications, formulations, and end-use innovations.`,
    developerLabel: "Application",
    developerDescription: "Top organisations filing patents for downstream applications and formulations.",
    geoDescription: "Where application and off-take IP is concentrated. See which markets are driving downstream innovation.",
    cpcDescription: "CPC classification breakdown for application-related patents. Human Necessities leads in off-take innovation.",
    patentDescription: "Most recent patent filings for downstream applications and market use-cases.",
    totalPatents: '312',
    filedCount: '198',
    grantedCount: '114',
    sectorTitle: "Application Sectors",
    heatMatrixTitle: "Application Heat Matrix",
    bubbleTitle: "Assignee Concentration & Off-Taker Map",
    bubbleSubtitle: "Patent volume × HHI · Bubble size = growth rate",
    sectors: [
    [
    { name: 'Packaging', patents: 73, share: '29.7%', cagr: '+22.1%', borderColor: 'border-l-[hsl(217,91%,60%)]', cagrColor: 'text-[hsl(217,91%,60%)]', shareColor: 'text-[hsl(217,91%,60%)]', subs: [{ n: 'Food Containers', v: 26 }, { n: 'Film & Wrap', v: 19 }, { n: 'Rigid Packaging', v: 15 }] },
    { name: 'Biomedical', patents: 50, share: '20.3%', cagr: '+15.8%', borderColor: 'border-l-[hsl(262,83%,58%)]', cagrColor: 'text-[hsl(262,83%,58%)]', shareColor: 'text-[hsl(262,83%,58%)]', subs: [{ n: 'Drug Delivery', v: 17 }, { n: 'Tissue Engineering', v: 14 }, { n: 'Surgical Sutures', v: 11 }] },
    { name: 'Textiles', patents: 35, share: '14.2%', cagr: '+24.6%', borderColor: 'border-l-[hsl(152,60%,40%)]', cagrColor: 'text-[hsl(152,60%,40%)]', shareColor: 'text-[hsl(152,60%,40%)]', subs: [{ n: 'Nonwoven Fabrics', v: 14 }, { n: 'Fiber Blends', v: 11 }, { n: 'Technical Textiles', v: 10 }] }],

    [
    { name: '3D Printing', patents: 25, share: '10.2%', cagr: '+31.2%', borderColor: 'border-l-[hsl(36,95%,54%)]', cagrColor: 'text-[hsl(36,95%,54%)]', shareColor: 'text-[hsl(36,95%,54%)]', subs: [{ n: 'FDM Filaments', v: 12 }, { n: 'SLA Resins', v: 7 }, { n: 'Composites', v: 5 }] },
    { name: 'Agriculture', patents: 19, share: '7.7%', cagr: '+12.3%', borderColor: 'border-l-[hsl(340,50%,55%)]', cagrColor: 'text-[hsl(340,50%,55%)]', shareColor: 'text-[hsl(340,50%,55%)]', subs: [{ n: 'Mulch Films', v: 9 }, { n: 'Controlled Release', v: 6 }, { n: 'Seed Coatings', v: 4 }] },
    { name: 'Electronics', patents: 16, share: '6.5%', cagr: '+19.7%', borderColor: 'border-l-[hsl(160,50%,45%)]', cagrColor: 'text-[hsl(160,50%,45%)]', shareColor: 'text-[hsl(160,50%,45%)]', subs: [{ n: 'Flexible Substrates', v: 6 }, { n: 'Encapsulation', v: 5 }, { n: 'Disposable Sensors', v: 4 }] }]],


    heatMatrixRows: [
    { name: 'Packaging', total: 73, values: [12, 14, 16, 18, 13], children: [
      { name: 'Food Packaging', total: 30, values: [5, 6, 7, 7, 5] },
      { name: 'Industrial Packaging', total: 24, values: [4, 5, 5, 6, 4] },
      { name: 'Consumer Goods Packaging', total: 19, values: [3, 3, 4, 5, 4] },
    ]},
    { name: 'Biomedical', total: 50, values: [8, 10, 11, 12, 9], children: [
      { name: 'Drug Delivery Systems', total: 20, values: [3, 4, 5, 5, 3] },
      { name: 'Tissue Engineering', total: 16, values: [3, 3, 3, 4, 3] },
      { name: 'Surgical Implants', total: 14, values: [2, 3, 3, 3, 3] },
    ]},
    { name: 'Textiles', total: 35, values: [6, 7, 7, 8, 7], children: [
      { name: 'Technical Textiles', total: 15, values: [3, 3, 3, 3, 3] },
      { name: 'Apparel Fibres', total: 12, values: [2, 2, 2, 3, 3] },
      { name: 'Non-woven Fabrics', total: 8, values: [1, 2, 2, 2, 1] },
    ]},
    { name: '3D Printing', total: 25, values: [4, 5, 5, 6, 5], children: [
      { name: 'Filament Materials', total: 11, values: [2, 2, 2, 3, 2] },
      { name: 'Bioprinting', total: 8, values: [1, 2, 2, 2, 1] },
      { name: 'Resin Formulations', total: 6, values: [1, 1, 1, 1, 2] },
    ]},
    { name: 'Agriculture', total: 19, values: [3, 4, 4, 4, 4], children: [
      { name: 'Mulch Films', total: 8, values: [1, 2, 2, 2, 1] },
      { name: 'Controlled Release', total: 6, values: [1, 1, 1, 1, 2] },
      { name: 'Seed Coatings', total: 5, values: [1, 1, 1, 1, 1] },
    ]},
    { name: 'Electronics', total: 16, values: [3, 3, 3, 4, 3], children: [
      { name: 'Flexible Substrates', total: 7, values: [1, 1, 2, 2, 1] },
      { name: 'Biodegradable Circuits', total: 5, values: [1, 1, 1, 1, 1] },
      { name: 'Encapsulation', total: 4, values: [1, 1, 0, 1, 1] },
    ]}],

    bubbleData: [
    { name: 'Packaging', patentVolume: 73, hhi: 0.028, growth: 22.1, fill: 'hsl(230 40% 60%)' },
    { name: 'Biomedical', patentVolume: 50, hhi: 0.032, growth: 15.8, fill: 'hsl(195 70% 72%)' },
    { name: 'Textiles', patentVolume: 35, hhi: 0.065, growth: 24.6, fill: 'hsl(270 50% 65%)' },
    { name: '3D Printing', patentVolume: 25, hhi: 0.12, growth: 31.2, fill: 'hsl(160 50% 65%)' },
    { name: 'Electronics', patentVolume: 16, hhi: 0.115, growth: 19.7, fill: 'hsl(340 50% 70%)' },
    { name: 'Agriculture', patentVolume: 19, hhi: 0.092, growth: 12.3, fill: 'hsl(35 70% 65%)' }],

    concentration: { hhi: '0.128', hhiLabel: 'Moderately Fragmented', top5: '62.4%', top10: '81.2%', gini: '0.54' }
  },
  products: {
    label: "Products & Derivatives",
    icon: ShoppingBag,
    description: (topic) => `Patents related to the products and chemical derivatives produced from ${topic} through various conversion pathways.`,
    trendData: [
    { year: '2014', Filed: 4, Granted: 3, Total: 7 },
    { year: '2015', Filed: 5, Granted: 4, Total: 9 },
    { year: '2016', Filed: 7, Granted: 5, Total: 12 },
    { year: '2017', Filed: 9, Granted: 6, Total: 15 },
    { year: '2018', Filed: 10, Granted: 8, Total: 18 },
    { year: '2019', Filed: 12, Granted: 9, Total: 21 },
    { year: '2020', Filed: 15, Granted: 11, Total: 26 },
    { year: '2021', Filed: 19, Granted: 14, Total: 33 },
    { year: '2022', Filed: 23, Granted: 17, Total: 40 },
    { year: '2023', Filed: 27, Granted: 19, Total: 46 }],

    cpcData: [
    { code: "A", name: "Human Necessities", count: 58, color: "bg-purple-500" },
    { code: "B", name: "Performing Operations; Transporting", count: 20, color: "bg-orange-500" },
    { code: "C", name: "Chemistry; Metallurgy", count: 96, color: "bg-pink-400" },
    { code: "D", name: "Textiles; Paper", count: 4, color: "bg-gray-800" },
    { code: "E", name: "Fixed Constructions", count: 2, color: "bg-sky-500" },
    { code: "F", name: "Mechanical Engineering; Lighting; Heating; Weapons; Blasting", count: 3, color: "bg-blue-600" },
    { code: "G", name: "Physics", count: 16, color: "bg-orange-400" },
    { code: "H", name: "Electricity", count: 13, color: "bg-red-700" },
    { code: "Y", name: "General Tagging of New Technological Developments; General Tagging of Cross-...", count: 2, color: "bg-yellow-400" }],

    pieData: [
    { name: "A", value: 58, fill: "#8b5cf6" },
    { name: "B", value: 20, fill: "#f97316" },
    { name: "C", value: 96, fill: "#f472b6" },
    { name: "D", value: 4, fill: "#1f2937" },
    { name: "E", value: 2, fill: "#0ea5e9" },
    { name: "F", value: 3, fill: "#2563eb" },
    { name: "G", value: 16, fill: "#fb923c" },
    { name: "H", value: 13, fill: "#b91c1c" },
    { name: "Y", value: 2, fill: "#facc15" }],

    patents: [
    { title: "High-Purity Lactic Acid Production from Fructose Streams", company: "Corbion N.V.", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 11 },
    { title: "Succinic Acid Crystallisation and Purification Process", company: "BioAmber Inc.", filingYear: 2022, grantedYear: 2023, status: "Granted", jurisdiction: 8 },
    { title: "Furfural Derivatives for Specialty Chemicals", company: "Avantium N.V.", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 6 },
    { title: "Bio-based Adipic Acid Synthesis from Sugar Feedstocks", company: "Verdezyne Inc.", filingYear: 2022, grantedYear: 2023, status: "Granted", jurisdiction: 14 },
    { title: "Levulinic Acid Extraction from Hexose-Pentose Mixtures", company: "GFBiochemicals", filingYear: 2023, grantedYear: null, status: "Filed", jurisdiction: 5 }],

    geoData: [
    { location: "North America", countries: "3 countries", total: 74, granted: 24, filed: 50 },
    { location: "Asia", countries: "13 countries", total: 72, granted: 22, filed: 50 },
    { location: "Europe", countries: "20 countries", total: 70, granted: 24, filed: 46 },
    { location: "Oceania", countries: "4 countries", total: 15, granted: 5, filed: 10 },
    { location: "South America", countries: "5 countries", total: 15, granted: 5, filed: 10 }],

    developers: [
    { org: "Corbion N.V.", total: 18, granted: 12, filed: 6 },
    { org: "NatureWorks LLC", total: 15, granted: 10, filed: 5 },
    { org: "Avantium N.V.", total: 12, granted: 8, filed: 4 },
    { org: "BASF SE", total: 11, granted: 7, filed: 4 },
    { org: "Cargill Inc.", total: 9, granted: 6, filed: 3 },
    { org: "GFBiochemicals", total: 8, granted: 5, filed: 3 },
    { org: "DuPont de Nemours", total: 7, granted: 4, filed: 3 },
    { org: "Evonik Industries", total: 6, granted: 4, filed: 2 },
    { org: "Genomatica Inc.", total: 5, granted: 3, filed: 2 },
    { org: "DSM-Firmenich", total: 4, granted: 3, filed: 1 }],

    trendDescription: (topic) => `Filing trends for patents covering products and chemical derivatives produced from ${topic}.`,
    developerLabel: "Products",
    developerDescription: "Top organisations filing patents for product synthesis and derivative manufacturing.",
    geoDescription: "Where product and derivative IP is being filed globally.",
    cpcDescription: "CPC classification breakdown for product-related patents. Chemistry & Metallurgy dominates product innovation.",
    patentDescription: "Most recent patent filings for products and derivatives.",
    totalPatents: '246',
    filedCount: '165',
    grantedCount: '81',
    sectorTitle: "Product Sectors",
    heatMatrixTitle: "Product Heat Matrix",
    bubbleTitle: "Product Concentration & Innovation Map",
    bubbleSubtitle: "Patent volume × HHI · Bubble size = growth rate",
    sectors: [
    [
    { name: 'Organic Acids', patents: 66, share: '26.8%', cagr: '+18.5%', borderColor: 'border-l-[hsl(152,60%,40%)]', cagrColor: 'text-[hsl(152,60%,40%)]', shareColor: 'text-[hsl(152,60%,40%)]', subs: [{ n: 'Lactic Acid', v: 26 }, { n: 'Succinic Acid', v: 22 }, { n: 'Levulinic Acid', v: 18 }] },
    { name: 'Platform Chemicals', patents: 52, share: '21.1%', cagr: '+21.3%', borderColor: 'border-l-[hsl(217,91%,60%)]', cagrColor: 'text-[hsl(217,91%,60%)]', shareColor: 'text-[hsl(217,91%,60%)]', subs: [{ n: 'Furfural', v: 20 }, { n: 'HMF', v: 18 }, { n: 'Glycerol', v: 14 }] },
    { name: 'Biopolymers', patents: 41, share: '16.7%', cagr: '+24.1%', borderColor: 'border-l-[hsl(262,83%,58%)]', cagrColor: 'text-[hsl(262,83%,58%)]', shareColor: 'text-[hsl(262,83%,58%)]', subs: [{ n: 'PLA', v: 18 }, { n: 'PBS', v: 13 }, { n: 'PHA', v: 10 }] }],

    [
    { name: 'Sugar Alcohols', patents: 34, share: '13.8%', cagr: '+16.8%', borderColor: 'border-l-[hsl(36,95%,54%)]', cagrColor: 'text-[hsl(36,95%,54%)]', shareColor: 'text-[hsl(36,95%,54%)]', subs: [{ n: 'Xylitol', v: 14 }, { n: 'Sorbitol', v: 12 }, { n: 'Mannitol', v: 8 }] },
    { name: 'Amino Acids', patents: 28, share: '11.4%', cagr: '+14.2%', borderColor: 'border-l-[hsl(340,50%,55%)]', cagrColor: 'text-[hsl(340,50%,55%)]', shareColor: 'text-[hsl(340,50%,55%)]', subs: [{ n: 'L-Lysine', v: 12 }, { n: 'L-Glutamic Acid', v: 9 }, { n: 'L-Threonine', v: 8 }] },
    { name: 'Specialty Chemicals', patents: 25, share: '10.2%', cagr: '+19.7%', borderColor: 'border-l-[hsl(160,50%,45%)]', cagrColor: 'text-[hsl(160,50%,45%)]', shareColor: 'text-[hsl(160,50%,45%)]', subs: [{ n: 'Flavours', v: 10 }, { n: 'Fragrances', v: 8 }, { n: 'Surfactants', v: 7 }] }]],

    heatMatrixRows: [
    { name: 'Organic Acids', total: 66, values: [11, 12, 14, 15, 14] },
    { name: 'Platform Chemicals', total: 52, values: [9, 10, 11, 12, 10] },
    { name: 'Biopolymers', total: 41, values: [7, 8, 9, 10, 8] },
    { name: 'Sugar Alcohols', total: 34, values: [6, 7, 7, 8, 6] },
    { name: 'Amino Acids', total: 28, values: [5, 5, 6, 7, 5] },
    { name: 'Specialty Chemicals', total: 25, values: [4, 5, 5, 6, 5] }],

    bubbleData: [
    { name: 'Organic Acids', patentVolume: 66, hhi: 0.030, growth: 18.5, fill: 'hsl(152 60% 40%)' },
    { name: 'Platform Chem', patentVolume: 52, hhi: 0.035, growth: 21.3, fill: 'hsl(217 91% 60%)' },
    { name: 'Biopolymers', patentVolume: 41, hhi: 0.058, growth: 24.1, fill: 'hsl(262 83% 58%)' },
    { name: 'Sugar Alcohols', patentVolume: 34, hhi: 0.075, growth: 16.8, fill: 'hsl(36 95% 54%)' },
    { name: 'Amino Acids', patentVolume: 28, hhi: 0.088, growth: 14.2, fill: 'hsl(340 50% 55%)' },
    { name: 'Specialty', patentVolume: 25, hhi: 0.095, growth: 19.7, fill: 'hsl(160 50% 45%)' }],

    concentration: { hhi: '0.105', hhiLabel: 'Fragmented', top5: '56.8%', top10: '76.4%', gini: '0.49' }
  }
};

const productViewOrder: PatentView[] = ['production', 'feedstock', 'technology', 'applications'];
const feedstockViewOrder: PatentView[] = ['production', 'products', 'technology', 'applications'];

const PatentLandscape = () => {
  const { category, topic } = useParams<{category: string;topic: string;}>();
  const navigate = useNavigate();
  const [view, setView] = useState<PatentView>('production');
  const [generalSubView, setGeneralSubView] = useState<'production' | 'applications'>('production');
  const [expandedHeatRows, setExpandedHeatRows] = useState<Set<string>>(new Set());
  const [heatMatrixSubView, setHeatMatrixSubView] = useState<'technology' | 'feedstock'>('feedstock');
  const [patentSearchTerm, setPatentSearchTerm] = useState('');
  const [trendChartMode] = useState<'spot'>('spot');
  const [trendTimeRange, setTrendTimeRange] = useState<string>('5');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedTechInPopup, setSelectedTechInPopup] = useState<string | null>(null);
  const [selectedIPHolder, setSelectedIPHolder] = useState<{org: string; total: number; granted: number; filed: number} | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{name: string; patents: number; share: string; cagr: string; subs: {n: string; v: number}[]} | null>(null);
  const [selectedPatentDetail, setSelectedPatentDetail] = useState<{title: string; company: string; filingYear: number; grantedYear: number | null; status: string; jurisdiction: number} | null>(null);

  // Mock data for subcategory detail popups - patents grouped by technology
  const subcategoryDetails: Record<string, { technologies: { name: string; patents: number; trend: string; trendColor: string; patentList: { title: string; company: string; year: number; status: string }[] }[] }> = {
    'Corn Stover': {
      technologies: [
        { name: 'Enzymatic Hydrolysis', patents: 42, trend: '+24%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [
          { title: 'High-Yield Cellulose Extraction from Corn Stover via Enzymatic Cascade', company: 'Novozymes A/S', year: 2024, status: 'Filed' },
          { title: 'Optimised Lignin Recovery from Corn Stover Hydrolysis Residue', company: 'Clariant AG', year: 2023, status: 'Granted' },
        ]},
        { name: 'Steam Explosion Pretreatment', patents: 35, trend: '+18%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [
          { title: 'Integrated Steam Explosion and Fermentation Process for Corn Stover', company: 'POET LLC', year: 2023, status: 'Granted' },
        ]},
        { name: 'Dilute Acid Hydrolysis', patents: 28, trend: '+12%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [
          { title: 'Continuous Dilute Acid Pretreatment Reactor for Corn Stover Biomass', company: 'ADM', year: 2023, status: 'Filed' },
        ]},
        { name: 'Simultaneous Saccharification', patents: 22, trend: '+31%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [
          { title: 'AI-Driven Feedstock Quality Grading for Corn Stover Supply Chains', company: 'Deere & Company', year: 2024, status: 'Filed' },
        ]},
      ],
    },
    'Wheat Straw': {
      technologies: [
        { name: 'Organosolv Fractionation', patents: 38, trend: '+22%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [
          { title: 'Organosolv Process for High-Purity Cellulose from Wheat Straw', company: 'ANDRITZ AG', year: 2024, status: 'Filed' },
        ]},
        { name: 'Alkaline Pretreatment', patents: 30, trend: '+15%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [
          { title: 'Alkaline Pretreatment Method for Wheat Straw Hemicellulose Extraction', company: 'Südzucker AG', year: 2023, status: 'Granted' },
        ]},
        { name: 'Pyrolysis', patents: 24, trend: '+19%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [
          { title: 'Fast Pyrolysis of Wheat Straw for Bio-Oil Production', company: 'BTG Bioliquids', year: 2023, status: 'Filed' },
        ]},
        { name: 'Enzymatic Saccharification', patents: 20, trend: '+28%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [
          { title: 'Continuous Enzymatic Hydrolysis System for Wheat Straw', company: 'DSM-Firmenich', year: 2024, status: 'Filed' },
        ]},
      ],
    },
    'Wood Chips': {
      technologies: [
        { name: 'Kraft Pulping Modified', patents: 32, trend: '+14%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [
          { title: 'Modified Kraft Process for Nanocellulose from Softwood Chips', company: 'Stora Enso', year: 2024, status: 'Filed' },
        ]},
        { name: 'Hydrothermal Treatment', patents: 26, trend: '+20%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [
          { title: 'Subcritical Water Treatment of Wood Chips for Sugar Release', company: 'UPM-Kymmene', year: 2023, status: 'Granted' },
        ]},
        { name: 'Mechanical Refining', patents: 21, trend: '+11%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [
          { title: 'High-Efficiency Disc Refiner for Wood Chip Fibrillation', company: 'Valmet', year: 2023, status: 'Filed' },
        ]},
        { name: 'Torrefaction', patents: 18, trend: '+16%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [] },
      ],
    },
  };

  const getSubcategoryData = (name: string) => {
    if (subcategoryDetails[name]) return subcategoryDetails[name];
    return {
      technologies: [
        { name: 'Enzymatic Processing', patents: 28, trend: '+18%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [
          { title: `Advanced Valorisation Process for ${name}`, company: 'Novozymes A/S', year: 2024, status: 'Filed' },
        ]},
        { name: 'Chemical Conversion', patents: 22, trend: '+14%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [
          { title: `Integrated Biorefinery Approach for ${name} Conversion`, company: 'BASF SE', year: 2023, status: 'Granted' },
        ]},
        { name: 'Thermal Processing', patents: 16, trend: '+21%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [
          { title: `Novel Catalyst System for ${name} Upgrading`, company: 'Clariant AG', year: 2023, status: 'Filed' },
        ]},
        { name: 'Biological Treatment', patents: 12, trend: '+25%', trendColor: 'text-[hsl(142,60%,40%)]', patentList: [] },
      ],
    };
  };

  const decodedTopic = decodeURIComponent(topic || "");
  const decodedCategory = decodeURIComponent(category || "");
  const isFeedstockRoute = decodedCategory === 'Feedstock';
  const viewOrder = isFeedstockRoute ? feedstockViewOrder : productViewOrder;

  const handleBack = () => {
    navigate(`/landscape/${category}/${topic}/value-chain`);
  };

  const activeConfig = view === 'production' ? viewConfigs[generalSubView] : viewConfigs[view];
  const allTrendData = activeConfig.trendData;
  const trendData = trendTimeRange === '5' ? allTrendData.slice(-5) : allTrendData;
  const cpcCategories = activeConfig.cpcData;
  const pieData = activeConfig.pieData;
  const allPatents = activeConfig.patents;
  const latestPatents = patentSearchTerm
    ? allPatents.filter(p => p.title.toLowerCase().includes(patentSearchTerm.toLowerCase()) || p.company.toLowerCase().includes(patentSearchTerm.toLowerCase()))
    : allPatents;
  const geoData = activeConfig.geoData;
  const developers = activeConfig.developers;
  const hasDetailedSections = !!activeConfig.sectors;

  const toggleBtn = (active: boolean) =>
  `flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
  active ?
  'bg-foreground text-background shadow-sm' :
  'text-muted-foreground hover:text-foreground'}`;


  return (
    <div className="h-full bg-background flex flex-col">
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
        <Button variant="outline" size="sm" onClick={handleBack} className="gap-1.5 h-7 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
        <div />
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-6 pb-6 flex-1 min-h-0 flex flex-col">
        <div className="mb-2 flex-shrink-0">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">IP Landscape: <span className="text-primary">{decodedTopic}</span></h2>
        </div>

        <Card className="bg-card border border-border/60 shadow-sm flex-1 min-w-0 flex flex-col">
          <CardContent className="px-5 py-4 pb-2 flex flex-col h-full">


            {/* Sub-toggle for General Overview */}
            {view === 'production' && (
              <div className="flex items-center bg-muted rounded-lg p-0.5 mb-2 flex-shrink-0 self-start">
                <button onClick={() => setGeneralSubView('production')} className={toggleBtn(generalSubView === 'production')}>
                  <FlaskConical className="w-3 h-3" />
                  Production
                </button>
                <button onClick={() => setGeneralSubView('applications')} className={toggleBtn(generalSubView === 'applications')}>
                  <ShoppingBag className="w-3 h-3" />
                  Application
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-2 flex-shrink-0">{activeConfig.description(decodedTopic)}</p>

            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
               <div className="space-y-3">

                <div className="grid grid-cols-[150px_1fr] gap-2">
                  {/* Legend / Filter Panel */}
                  <div className="space-y-2 flex-shrink-0">
                    <div className="rounded-lg border border-border/40 bg-background p-3 text-center">
                      <div className="text-[8px] text-muted-foreground uppercase tracking-wide">Total Patents</div>
                      <div className="text-lg font-bold text-foreground mt-0.5">{Number(activeConfig.totalPatents).toLocaleString()}</div>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-background p-2.5">
                      <div className="text-[8px] text-muted-foreground uppercase tracking-wide mb-1.5 text-center">Chart Legend</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-[2px] rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                          <span className="text-[9px] text-foreground">Total</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-[2px] rounded-full" style={{ backgroundColor: 'hsl(142, 71%, 45%)' }} />
                          <span className="text-[9px] text-foreground">Granted</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-[2px] rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                          <span className="text-[9px] text-foreground">Filed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trend Chart */}
                  <div className="bg-muted/30 border border-border/40 rounded-xl p-3">
                    <div className="mb-1.5">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Patent Trends</h3>
                      <p className="text-xs text-muted-foreground leading-tight">This view highlights innovation intensity across key regions, helping you identify technological hotspots, potential IP barriers, and market leaders in circular feedstock development.</p>
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
                          <LineChart data={trendData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis dataKey="year" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
                            <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} label={{ value: 'Number of patents', angle: -90, position: 'center', dx: -18, style: { fontSize: 7, fill: 'hsl(var(--muted-foreground))' } }} />
                            <Tooltip contentStyle={{ fontSize: 9, borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', padding: '4px 8px' }} />
                            <Line type="monotone" dataKey="Total" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2.5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 1 }} name="Total" />
                            <Line type="monotone" dataKey="Granted" stroke="hsl(142 71% 45%)" strokeWidth={1.5} dot={{ r: 2.5, fill: 'hsl(142, 71%, 45%)', stroke: '#fff', strokeWidth: 1 }} name="Granted" />
                            <Line type="monotone" dataKey="Filed" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2.5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1 }} name="Filed" />
                          </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Leading Developers */}
                {(
                <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                  <div className="mb-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Leading IP Holders</h3>
                    <p className="text-xs text-muted-foreground">{activeConfig.developerDescription}</p>
                  </div>
                   <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
                     {[developers.slice(0, 5), developers.slice(5, 10)].map((col, colIdx) => (
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
                      ))}
                   </div>
                </div>
                )}


                {/* Sectors + Market Concentration (for feedstock, technology, applications) */}
                {hasDetailedSections && activeConfig.sectors && activeConfig.concentration &&
                <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 bg-muted/30 border border-border/40 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                         <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{activeConfig.sectorTitle}</h3>
                         <p className="text-[9px] text-muted-foreground">Share of total patents</p>
                       </div>

                      {/* Production tab: split into Feedstock (left) / Technology (right) */}
                      {activeConfig.productionSectorGroups ? (
                        <div className="grid grid-cols-2 gap-4">
                          {activeConfig.productionSectorGroups.map((group) => (
                            <div key={group.label} className={`rounded-xl p-3 ${group.label === 'Feedstock' ? 'bg-[hsl(142,60%,40%,0.06)] border border-[hsl(142,60%,40%,0.15)]' : 'bg-[hsl(217,91%,60%,0.06)] border border-[hsl(217,91%,60%,0.15)]'}`}>
                              <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${group.label === 'Feedstock' ? 'bg-[hsl(142,60%,40%)]' : 'bg-[hsl(217,91%,60%)]'}`}></span>
                                {group.label}
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {group.sectors.map((sector) =>
                                  <div key={sector.name} onClick={() => setSelectedCategory({ name: sector.name, patents: sector.patents, share: sector.share, cagr: sector.cagr, subs: sector.subs })} className={`border-l-4 ${sector.borderColor} bg-background rounded-lg p-3 cursor-pointer hover:bg-muted/40 transition-colors shadow-sm`}>
                                    <div className="flex items-start justify-between mb-0.5">
                                      <div>
                                        <div className="font-bold text-[11px] text-foreground">{sector.name}</div>
                                        <div className="text-[9px] text-muted-foreground">{sector.patents.toLocaleString()} patents</div>
                                      </div>
                                      <span className={`text-sm font-bold ${sector.shareColor}`}>{sector.share}</span>
                                    </div>
                                    <div className={`text-[9px] font-semibold ${sector.cagrColor} mb-2`}>{sector.cagr} YoY</div>
                                    <div className="space-y-1">
                                      {sector.subs.map((s) =>
                                        <div key={s.n} className="flex justify-between text-[9px]">
                                          <span className="text-muted-foreground">{s.n}</span>
                                          <span className="font-medium text-foreground">{s.v}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Default: flat rows for other tabs */
                        activeConfig.sectors.map((row, rowIdx) =>
                          <div key={rowIdx} className={`grid grid-cols-3 gap-2 ${rowIdx < activeConfig.sectors!.length - 1 ? 'mb-2' : ''}`}>
                            {row.map((sector) =>
                              <div key={sector.name} onClick={() => setSelectedCategory({ name: sector.name, patents: sector.patents, share: sector.share, cagr: sector.cagr, subs: sector.subs })} className={`border-l-4 ${sector.borderColor} bg-muted/20 rounded-lg p-3 cursor-pointer hover:bg-muted/40 transition-colors`}>
                                <div className="flex items-start justify-between mb-0.5">
                                  <div>
                                    <div className="font-bold text-[11px] text-foreground">{sector.name}</div>
                                    <div className="text-[9px] text-muted-foreground">{sector.patents.toLocaleString()} patents</div>
                                  </div>
                                  <span className={`text-sm font-bold ${sector.shareColor}`}>{sector.share}</span>
                                </div>
                                <div className={`text-[9px] font-semibold ${sector.cagrColor} mb-2`}>{sector.cagr} YoY</div>
                                <div className="space-y-1">
                                  {sector.subs.map((s) =>
                                    <div key={s.n} className="flex justify-between text-[9px]">
                                      <span className="text-muted-foreground">{s.n}</span>
                                      <span className="font-medium text-foreground">{s.v}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                }




                {/* Geographic Distribution + CPC side by side */}
                <div className="space-y-3">
                  <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                    <div className="mb-3">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Geographic Patent Distribution</h3>
                      <p className="text-[10px] text-muted-foreground">{activeConfig.geoDescription}</p>
                    </div>
                    <div className="mb-1">
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-foreground">Interactive patent intensity map</h4>
                    </div>
                    <div className="grid gap-4 items-start" style={{ gridTemplateColumns: '2fr 1fr' }}>
                      <div>
                        <div className="rounded-lg flex items-center justify-center relative overflow-hidden border border-border/40" style={{ minHeight: '320px' }}>
                          <img src={worldPatentMap} alt="World Patent Intensity Map" className="w-full h-full object-cover rounded-lg" />
                          <div className="absolute top-4 left-4 w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
                          <div className="absolute top-12 right-1/3 w-2 h-2 bg-primary rounded-full animate-pulse delay-300"></div>
                          <div className="absolute bottom-1/3 left-1/4 w-4 h-4 bg-primary rounded-full animate-pulse delay-700"></div>
                          <div className="absolute inset-0 bg-gradient-to-t from-background/5 to-transparent pointer-events-none"></div>
                        </div>
                      </div>
                      <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '340px' }}>
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

                  <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                    <div className="mb-4">
                       <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Patent Distribution by CPC – {activeConfig.label}</h3>
                       <p className="text-[10px] text-muted-foreground">{activeConfig.cpcDescription}</p>
                    </div>
                    <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 220px' }}>
                      <div className="space-y-0">
                        {cpcCategories.map((cat, index) => {
                          const maxCount = Math.max(...cpcCategories.map(c => c.count));
                          const barWidth = Math.max(4, (cat.count / maxCount) * 100);
                          const bgColorMap: Record<string, string> = {
                            'bg-purple-500': 'hsl(270, 70%, 60%)',
                            'bg-orange-500': 'hsl(25, 95%, 53%)',
                            'bg-pink-500': 'hsl(330, 80%, 60%)',
                            'bg-gray-800': 'hsl(var(--foreground))',
                            'bg-blue-500': 'hsl(210, 80%, 55%)',
                            'bg-blue-600': 'hsl(220, 80%, 50%)',
                            'bg-cyan-500': 'hsl(185, 80%, 50%)',
                            'bg-red-500': 'hsl(0, 80%, 55%)',
                            'bg-yellow-500': 'hsl(45, 95%, 55%)',
                          };
                          const barColor = bgColorMap[cat.color] || 'hsl(var(--primary))';
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/20 last:border-b-0 group"
                              onClick={() => setSelectedCategory({ name: `${cat.code} – ${cat.name}`, patents: cat.count, share: `${Math.round(cat.count / Number(activeConfig.totalPatents) * 100)}%`, cagr: '', subs: [{ n: cat.name, v: cat.count }] })}
                            >
                              <span className="text-[10px] font-bold text-muted-foreground w-[18px] text-center shrink-0">{cat.code}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[11px] text-foreground group-hover:text-primary transition-colors truncate pr-2">{cat.name}</span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[11px] font-semibold text-foreground">{cat.count}</span>
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: barColor }}></div>
                                  </div>
                                </div>
                                <div className="w-full h-1 bg-muted/60 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: barColor, opacity: 0.7 }}></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={90} dataKey="value" strokeWidth={2} stroke="hsl(var(--background))">
                                {pieData.map((entry, i) => (
                                  <Cell key={i} fill={entry.fill} />
                                ))}
                              </Pie>
                              <ChartTooltip />
                            </PieChart>
                          </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Latest Patents */}
                <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                  <div className="mb-3">
                     <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Latest Patents – {activeConfig.label}</h3>
                     <p className="text-[10px] text-muted-foreground">{activeConfig.patentDescription}</p>
                  </div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <button className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-foreground text-background shadow-sm">
                        <span>ALL</span>
                        <span className="opacity-70">{activeConfig.totalPatents}</span>
                      </button>
                      <Button variant="outline" size="sm" className="text-[10px] h-6 px-2.5 border-border/60">
                        <FileText className="w-2.5 h-2.5 mr-1" />
                        Filed
                        <span className="ml-1.5 text-[10px] text-muted-foreground">{activeConfig.filedCount}</span>
                      </Button>
                      <Button variant="outline" size="sm" className="text-[10px] h-6 px-2.5 border-border/60">
                        <span className="text-primary mr-1">✓</span>
                        Granted
                        <span className="ml-1.5 text-[10px] text-muted-foreground">{activeConfig.grantedCount}</span>
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

        <CategoryPatentsModal
          open={!!selectedCategory}
          onOpenChange={(open) => { if (!open) setSelectedCategory(null); }}
          categoryName={selectedCategory?.name || ''}
          totalPatents={selectedCategory?.patents || 0}
          share={selectedCategory?.share || ''}
          cagr={selectedCategory?.cagr || ''}
          subcategories={selectedCategory?.subs || []}
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

export default PatentLandscape;