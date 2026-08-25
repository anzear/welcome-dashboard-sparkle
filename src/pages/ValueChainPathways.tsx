import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, GitBranch, Zap, Factory, Leaf, ChevronRight, ChevronDown, ArrowRight, Star, Bookmark, ThumbsDown, Package, Target, Plus, Download, ArrowRight as ArrowRightIcon, Clock, Network, FolderKanban, Search, SlidersHorizontal, ArrowUpDown, ExternalLink, Info, MessageSquare, Rows3, AlignJustify, ListTree } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import VCGScoreBadge from '@/components/VCGScoreBadge';
import PageCommentsSidebar from '@/components/PageCommentsSidebar';
import { useTopicComments } from '@/components/TopicCommentsPopover';
import { usePageCommentsUnread } from '@/hooks/usePageCommentsUnread';
import { supabase } from "@/integrations/supabase/client";

interface CustomPathway {
  feedstock: string;
  technology: string;
  product: string;
  application: string;
  trl: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
  patents?: string;
  isCustom?: boolean;
}

export const PREDEFINED_PATHWAYS: CustomPathway[] = [
  { feedstock: "Corn Starch", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "PLA Packaging", trl: "TRL 9", patents: "45 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Packaging" },
  { feedstock: "Sugarcane Molasses", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Food Acidulant", trl: "TRL 9", patents: "38 Patents", category1: "Industrial side-streams", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Whey Permeate", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Skin Care (AHA)", trl: "TRL 9", patents: "22 Patents", category1: "Industrial side-streams", category2: "Fermentation", category3: "Chemicals", category4: "Personal Care" },
  { feedstock: "Corn Stover", technology: "Simultaneous Saccharification & Fermentation", product: "Lactic Acid", application: "Green Solvents", trl: "TRL 7", patents: "18 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Chemical Industry" },
  { feedstock: "Cassava Starch", technology: "Heterofermentation", product: "Lactic Acid", application: "PLA Fiber", trl: "TRL 8", patents: "12 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Textiles" },
  { feedstock: "Glucose Syrup", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Pharmaceutical Excipient", trl: "TRL 9", patents: "28 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Pharma & Healthcare" },
  { feedstock: "Rice Bran", technology: "Solid-State Fermentation", product: "Lactic Acid", application: "Animal Feed Additive", trl: "TRL 6", patents: "8 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Agriculture" },
  { feedstock: "Corn Starch", technology: "Ring-Opening Polymerization", product: "PLA Polymer", application: "3D Printing Filament", trl: "TRL 8", patents: "32 Patents", category1: "Bio-based primary feedstocks", category2: "Polymerization", category3: "Materials", category4: "Advanced Manufacturing" },
  { feedstock: "Potato Starch", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Food Preservative", trl: "TRL 9", patents: "15 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Wheat Bran", technology: "Heterofermentation", product: "Lactic Acid", application: "Descaling Agent", trl: "TRL 7", patents: "6 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Chemical Industry" },
  { feedstock: "Sugarcane Molasses", technology: "Continuous Fermentation (CSTR)", product: "Lactic Acid", application: "PLA Film", trl: "TRL 7", patents: "14 Patents", category1: "Industrial side-streams", category2: "Fermentation", category3: "Chemicals", category4: "Packaging" },
  { feedstock: "Whey Permeate", technology: "Membrane Separation", product: "L-Lactic Acid (Purified)", application: "Dialysis Solution", trl: "TRL 8", patents: "19 Patents", category1: "Industrial side-streams", category2: "Purification", category3: "Chemicals", category4: "Pharma & Healthcare" },
  { feedstock: "Corn Stover", technology: "Enzymatic Hydrolysis + Fermentation", product: "Lactic Acid", application: "Bio-based Solvent", trl: "TRL 6", patents: "11 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Chemical Industry" },
  { feedstock: "Sugar Beet Pulp", technology: "Solid-State Fermentation", product: "Lactic Acid", application: "Silage Preservative", trl: "TRL 7", patents: "7 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Agriculture" },
  { feedstock: "Corn Starch", technology: "Direct Polycondensation", product: "Low-MW PLA", application: "Compostable Cutlery", trl: "TRL 8", patents: "21 Patents", category1: "Bio-based primary feedstocks", category2: "Polymerization", category3: "Materials", category4: "Packaging" },
  { feedstock: "Glucose Syrup", technology: "Reactive Distillation", product: "Lactide", application: "Medical Implants", trl: "TRL 8", patents: "35 Patents", category1: "Bio-based primary feedstocks", category2: "Purification", category3: "Chemicals", category4: "Pharma & Healthcare" },
  { feedstock: "Cassava Starch", technology: "Engineered Yeast Fermentation", product: "D-Lactic Acid", application: "Stereocomplex PLA", trl: "TRL 5", patents: "9 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Advanced Manufacturing" },
  { feedstock: "Food Waste", technology: "Mixed-Culture Fermentation", product: "Lactic Acid", application: "Green Cleaning Products", trl: "TRL 5", patents: "5 Patents", category1: "Waste streams", category2: "Fermentation", category3: "Chemicals", category4: "Household" },
  { feedstock: "Microalgae Biomass", technology: "Photofermentation", product: "Lactic Acid", application: "Cosmetic Peel", trl: "TRL 3", patents: "3 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Personal Care" },
  { feedstock: "Corn Stover", technology: "Gas Fermentation (CO₂)", product: "Lactic Acid", application: "Carbon-Negative PLA", trl: "TRL 2", patents: "2 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Materials", category4: "Packaging" },
  { feedstock: "Bagasse", technology: "Alkaline Pretreatment + Fermentation", product: "Lactic Acid", application: "Textile Finishing", trl: "TRL 6", patents: "7 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Textiles" },
  { feedstock: "Sorghum Grain", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Beverage Acidulant", trl: "TRL 8", patents: "10 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Barley Straw", technology: "Cell-Recycled Fermentation", product: "Lactic Acid", application: "Biodegradable Mulch Film", trl: "TRL 4", patents: "4 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Materials", category4: "Agriculture" },
  { feedstock: "Potato Starch", technology: "Ion Exchange Chromatography", product: "Ultra-Pure Lactic Acid", application: "IV Solution Grade", trl: "TRL 9", patents: "25 Patents", category1: "Bio-based primary feedstocks", category2: "Purification", category3: "Chemicals", category4: "Pharma & Healthcare" },
  { feedstock: "Sugarcane Molasses", technology: "Electrodialysis", product: "Sodium Lactate", application: "Meat Preservative", trl: "TRL 7", patents: "11 Patents", category1: "Industrial side-streams", category2: "Purification", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Whey Permeate", technology: "Crystallization", product: "Calcium Lactate", application: "Calcium Supplement", trl: "TRL 8", patents: "16 Patents", category1: "Industrial side-streams", category2: "Purification", category3: "Chemicals", category4: "Pharma & Healthcare" },
  { feedstock: "Corn Starch", technology: "Azeotropic Dehydration", product: "High-MW PLA", application: "Automotive Parts", trl: "TRL 6", patents: "13 Patents", category1: "Bio-based primary feedstocks", category2: "Polymerization", category3: "Materials", category4: "Automotive" },
  { feedstock: "Glucose Syrup", technology: "Molecular Distillation", product: "Heat-Sensitive Lactic Acid", application: "Dermal Filler", trl: "TRL 5", patents: "8 Patents", category1: "Bio-based primary feedstocks", category2: "Purification", category3: "Chemicals", category4: "Personal Care" },
  { feedstock: "Rice Straw", technology: "Simultaneous Saccharification & Fermentation", product: "Lactic Acid", application: "Paper Coating", trl: "TRL 5", patents: "6 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Packaging" },
  { feedstock: "Food Waste", technology: "Anaerobic Fermentation", product: "Lactic Acid", application: "pH Regulator", trl: "TRL 6", patents: "9 Patents", category1: "Waste streams", category2: "Fermentation", category3: "Chemicals", category4: "Chemical Industry" },
  { feedstock: "Corn Starch", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Probiotic Ingredient", trl: "TRL 9", patents: "20 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Sugarcane Molasses", technology: "Heterofermentation", product: "Lactic Acid + Ethanol", application: "Dual-Product Biorefinery", trl: "TRL 6", patents: "7 Patents", category1: "Industrial side-streams", category2: "Fermentation", category3: "Chemicals", category4: "Chemical Industry" },
  { feedstock: "Cassava Starch", technology: "Reactive Distillation", product: "Ethyl Lactate", application: "Green Solvent (Electronics)", trl: "TRL 7", patents: "15 Patents", category1: "Bio-based primary feedstocks", category2: "Purification", category3: "Chemicals", category4: "Chemical Industry" },
  { feedstock: "Wheat Straw", technology: "Organosolv Pretreatment + Fermentation", product: "Lactic Acid", application: "Biodegradable Coating", trl: "TRL 4", patents: "5 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Materials", category4: "Packaging" },
  { feedstock: "Corn Stover", technology: "Continuous Fermentation (CSTR)", product: "Lactic Acid", application: "Brewery Acidulant", trl: "TRL 7", patents: "8 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Sugar Beet Pulp", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Dairy Starter Culture", trl: "TRL 9", patents: "30 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Whey Permeate", technology: "Engineered Yeast Fermentation", product: "Optically Pure L-LA", application: "Chiral Synthesis", trl: "TRL 4", patents: "6 Patents", category1: "Industrial side-streams", category2: "Fermentation", category3: "Chemicals", category4: "Pharma & Healthcare" },
  { feedstock: "Glucose Syrup", technology: "Ring-Opening Polymerization", product: "PLA-PEG Copolymer", application: "Drug Delivery System", trl: "TRL 5", patents: "18 Patents", category1: "Bio-based primary feedstocks", category2: "Polymerization", category3: "Materials", category4: "Pharma & Healthcare" },
  { feedstock: "Potato Starch", technology: "Direct Polycondensation", product: "PLA Oligomer", application: "Biodegradable Lubricant", trl: "TRL 4", patents: "4 Patents", category1: "Bio-based primary feedstocks", category2: "Polymerization", category3: "Materials", category4: "Chemical Industry" },
  { feedstock: "Corn Starch", technology: "Membrane Separation", product: "Concentrated Lactic Acid", application: "Industrial Descaler", trl: "TRL 8", patents: "14 Patents", category1: "Bio-based primary feedstocks", category2: "Purification", category3: "Chemicals", category4: "Chemical Industry" },
  { feedstock: "Food Waste", technology: "Solid-State Fermentation", product: "Lactic Acid", application: "Compost Accelerator", trl: "TRL 5", patents: "3 Patents", category1: "Waste streams", category2: "Fermentation", category3: "Chemicals", category4: "Agriculture" },
  { feedstock: "Bagasse", technology: "Steam Explosion + Fermentation", product: "Lactic Acid", application: "Construction Additive", trl: "TRL 5", patents: "6 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Construction" },
  { feedstock: "Microalgae Biomass", technology: "Cell-Recycled Fermentation", product: "Lactic Acid", application: "Algae-Based Skin Serum", trl: "TRL 3", patents: "2 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Personal Care" },
  { feedstock: "Rice Bran", technology: "Heterofermentation", product: "Lactic Acid", application: "Rice Wine Fermentation", trl: "TRL 7", patents: "5 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Corn Stover", technology: "Electrodialysis", product: "Ammonium Lactate", application: "Moisturizer Active", trl: "TRL 6", patents: "9 Patents", category1: "Agricultural residues", category2: "Purification", category3: "Chemicals", category4: "Personal Care" },
  { feedstock: "Sugarcane Molasses", technology: "Crystallization", product: "Zinc Lactate", application: "Oral Care Ingredient", trl: "TRL 7", patents: "8 Patents", category1: "Industrial side-streams", category2: "Purification", category3: "Chemicals", category4: "Personal Care" },
  { feedstock: "Wheat Straw", technology: "Simultaneous Saccharification & Fermentation", product: "Lactic Acid", application: "Biodegradable Adhesive", trl: "TRL 4", patents: "3 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Materials", category4: "Advanced Manufacturing" },
  { feedstock: "Corn Starch", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Textile Dyeing Aid", trl: "TRL 8", patents: "11 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Textiles" },
  { feedstock: "Cassava Starch", technology: "Continuous Fermentation (CSTR)", product: "Lactic Acid", application: "Leather Tanning", trl: "TRL 6", patents: "5 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Textiles" },
  { feedstock: "Glucose Syrup", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Confectionery Acidulant", trl: "TRL 9", patents: "17 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Whey Permeate", technology: "Reactive Distillation", product: "Butyl Lactate", application: "Paint Solvent", trl: "TRL 6", patents: "7 Patents", category1: "Industrial side-streams", category2: "Purification", category3: "Chemicals", category4: "Chemical Industry" },
  { feedstock: "Food Waste", technology: "Engineered E. coli Fermentation", product: "Lactic Acid", application: "Water Treatment Agent", trl: "TRL 3", patents: "4 Patents", category1: "Waste streams", category2: "Fermentation", category3: "Chemicals", category4: "Environmental" },
  { feedstock: "Sorghum Grain", technology: "Direct Polycondensation", product: "PLA Wax", application: "Candle Making", trl: "TRL 5", patents: "2 Patents", category1: "Bio-based primary feedstocks", category2: "Polymerization", category3: "Materials", category4: "Household" },
  { feedstock: "Corn Starch", technology: "Ring-Opening Polymerization", product: "PLGA Copolymer", application: "Tissue Engineering Scaffold", trl: "TRL 4", patents: "24 Patents", category1: "Bio-based primary feedstocks", category2: "Polymerization", category3: "Materials", category4: "Pharma & Healthcare" },
  { feedstock: "Potato Starch", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Bakery Preservative", trl: "TRL 9", patents: "13 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Sugar Beet Pulp", technology: "Cell-Recycled Fermentation", product: "Lactic Acid", application: "Biodegradable Straw", trl: "TRL 5", patents: "4 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Materials", category4: "Packaging" },
  { feedstock: "Corn Stover", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Detergent Builder", trl: "TRL 7", patents: "10 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Household" },
  { feedstock: "Sugarcane Molasses", technology: "Solid-State Fermentation", product: "Lactic Acid", application: "Ensilage Inoculant", trl: "TRL 8", patents: "9 Patents", category1: "Industrial side-streams", category2: "Fermentation", category3: "Chemicals", category4: "Agriculture" },
  { feedstock: "Glucose Syrup", technology: "Electrodialysis", product: "Potassium Lactate", application: "Fire Suppressant", trl: "TRL 7", patents: "6 Patents", category1: "Bio-based primary feedstocks", category2: "Purification", category3: "Chemicals", category4: "Chemical Industry" },
  { feedstock: "Corn Starch", technology: "Azeotropic Dehydration", product: "Stereocomplex PLA", application: "Heat-Resistant Packaging", trl: "TRL 5", patents: "11 Patents", category1: "Bio-based primary feedstocks", category2: "Polymerization", category3: "Materials", category4: "Packaging" },
  { feedstock: "Whey Permeate", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Yogurt Production", trl: "TRL 9", patents: "33 Patents", category1: "Industrial side-streams", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Rice Straw", technology: "Alkaline Pretreatment + Fermentation", product: "Lactic Acid", application: "Fertilizer Chelator", trl: "TRL 4", patents: "3 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Agriculture" },
  { feedstock: "Food Waste", technology: "Continuous Fermentation (CSTR)", product: "Lactic Acid", application: "Bioplastic Pellets", trl: "TRL 4", patents: "5 Patents", category1: "Waste streams", category2: "Fermentation", category3: "Materials", category4: "Packaging" },
  { feedstock: "Cassava Starch", technology: "Membrane Separation", product: "Purified Lactic Acid", application: "Semiconductor Cleaning", trl: "TRL 6", patents: "8 Patents", category1: "Bio-based primary feedstocks", category2: "Purification", category3: "Chemicals", category4: "Advanced Manufacturing" },
  { feedstock: "Barley Straw", technology: "Simultaneous Saccharification & Fermentation", product: "Lactic Acid", application: "Animal Hygiene Product", trl: "TRL 5", patents: "3 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Agriculture" },
  { feedstock: "Corn Starch", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Infant Formula Acidulant", trl: "TRL 9", patents: "26 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Sugarcane Molasses", technology: "Ion Exchange Chromatography", product: "Pharma-Grade Lactic Acid", application: "Wound Healing Gel", trl: "TRL 7", patents: "14 Patents", category1: "Industrial side-streams", category2: "Purification", category3: "Chemicals", category4: "Pharma & Healthcare" },
  { feedstock: "Wheat Bran", technology: "Heterofermentation", product: "Lactic Acid + Acetic Acid", application: "Natural Pickling Agent", trl: "TRL 8", patents: "7 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Corn Stover", technology: "Gas Fermentation (CO₂)", product: "Lactic Acid", application: "Carbon-Capture Chemical", trl: "TRL 2", patents: "1 Patent", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Environmental" },
  { feedstock: "Microalgae Biomass", technology: "Engineered Yeast Fermentation", product: "Lactic Acid", application: "Sustainable Aviation Additive", trl: "TRL 2", patents: "1 Patent", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Automotive" },
  { feedstock: "Glucose Syrup", technology: "Crystallization", product: "Manganese Lactate", application: "Dietary Supplement", trl: "TRL 6", patents: "5 Patents", category1: "Bio-based primary feedstocks", category2: "Purification", category3: "Chemicals", category4: "Pharma & Healthcare" },
  { feedstock: "Corn Starch", technology: "Reactive Distillation", product: "Methyl Lactate", application: "Green Propellant", trl: "TRL 3", patents: "4 Patents", category1: "Bio-based primary feedstocks", category2: "Purification", category3: "Chemicals", category4: "Chemical Industry" },
  { feedstock: "Food Waste", technology: "Solid-State Fermentation", product: "Lactic Acid", application: "Soil pH Amendment", trl: "TRL 6", patents: "4 Patents", category1: "Waste streams", category2: "Fermentation", category3: "Chemicals", category4: "Agriculture" },
  { feedstock: "Potato Starch", technology: "Continuous Fermentation (CSTR)", product: "Lactic Acid", application: "Dishwasher Rinse Aid", trl: "TRL 6", patents: "5 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Household" },
  { feedstock: "Whey Permeate", technology: "Molecular Distillation", product: "Ultra-Pure L-LA", application: "Ophthalmic Solution", trl: "TRL 5", patents: "10 Patents", category1: "Industrial side-streams", category2: "Purification", category3: "Chemicals", category4: "Pharma & Healthcare" },
  { feedstock: "Bagasse", technology: "Heterofermentation", product: "Lactic Acid", application: "Cement Retarder", trl: "TRL 5", patents: "3 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Construction" },
  { feedstock: "Sorghum Grain", technology: "Membrane Separation", product: "Concentrated Lactic Acid", application: "Pool pH Control", trl: "TRL 7", patents: "6 Patents", category1: "Bio-based primary feedstocks", category2: "Purification", category3: "Chemicals", category4: "Household" },
  { feedstock: "Corn Starch", technology: "Direct Polycondensation", product: "PLA Coating", application: "Paper Cup Lining", trl: "TRL 7", patents: "16 Patents", category1: "Bio-based primary feedstocks", category2: "Polymerization", category3: "Materials", category4: "Packaging" },
  { feedstock: "Rice Bran", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Noodle Processing Aid", trl: "TRL 8", patents: "8 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Cassava Starch", technology: "Azeotropic Dehydration", product: "PLA Blend", application: "Compostable Bag", trl: "TRL 6", patents: "9 Patents", category1: "Bio-based primary feedstocks", category2: "Polymerization", category3: "Materials", category4: "Packaging" },
  { feedstock: "Sugarcane Molasses", technology: "Engineered Yeast Fermentation", product: "D-Lactic Acid", application: "Optical Materials", trl: "TRL 3", patents: "5 Patents", category1: "Industrial side-streams", category2: "Fermentation", category3: "Chemicals", category4: "Advanced Manufacturing" },
  { feedstock: "Corn Stover", technology: "Electrodialysis", product: "Lithium Lactate", application: "Battery Electrolyte", trl: "TRL 2", patents: "2 Patents", category1: "Agricultural residues", category2: "Purification", category3: "Chemicals", category4: "Advanced Manufacturing" },
  { feedstock: "Food Waste", technology: "Gas Fermentation (CO₂)", product: "Lactic Acid", application: "Carbon-Capture Polymer", trl: "TRL 1", patents: "1 Patent", category1: "Waste streams", category2: "Fermentation", category3: "Materials", category4: "Environmental" },
  { feedstock: "Wheat Straw", technology: "Cell-Recycled Fermentation", product: "Lactic Acid", application: "Herbicide Adjuvant", trl: "TRL 3", patents: "2 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Agriculture" },
  { feedstock: "Corn Starch", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Sports Drink Acidulant", trl: "TRL 9", patents: "12 Patents", category1: "Bio-based primary feedstocks", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Glucose Syrup", technology: "Ring-Opening Polymerization", product: "PLA Microspheres", application: "Controlled Drug Release", trl: "TRL 4", patents: "20 Patents", category1: "Bio-based primary feedstocks", category2: "Polymerization", category3: "Materials", category4: "Pharma & Healthcare" },
  { feedstock: "Whey Permeate", technology: "Ion Exchange Chromatography", product: "Food-Grade Lactic Acid", application: "Sauerkraut Production", trl: "TRL 9", patents: "14 Patents", category1: "Industrial side-streams", category2: "Purification", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Barley Straw", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Bio-based Ink", trl: "TRL 4", patents: "3 Patents", category1: "Agricultural residues", category2: "Fermentation", category3: "Chemicals", category4: "Advanced Manufacturing" },
  { feedstock: "Fructose", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "PLA Packaging", trl: "TRL 9", patents: "30 Patents", category1: "Intermediates/precursors", category2: "Fermentation", category3: "Chemicals", category4: "Packaging" },
  { feedstock: "Fructose", technology: "Homofermentation (Lactobacillus)", product: "Lactic Acid", application: "Food Acidulant", trl: "TRL 9", patents: "25 Patents", category1: "Intermediates/precursors", category2: "Fermentation", category3: "Chemicals", category4: "Food & Beverage" },
  { feedstock: "Fructose", technology: "Continuous Fermentation (CSTR)", product: "Lactic Acid", application: "Green Solvents", trl: "TRL 7", patents: "12 Patents", category1: "Intermediates/precursors", category2: "Fermentation", category3: "Chemicals", category4: "Chemical Industry" },
  { feedstock: "Fructose", technology: "Engineered Yeast Fermentation", product: "D-Lactic Acid", application: "Stereocomplex PLA", trl: "TRL 5", patents: "8 Patents", category1: "Intermediates/precursors", category2: "Fermentation", category3: "Chemicals", category4: "Advanced Manufacturing" },
  { feedstock: "Fructose", technology: "Membrane Separation", product: "Purified Lactic Acid", application: "Pharmaceutical Excipient", trl: "TRL 8", patents: "18 Patents", category1: "Intermediates/precursors", category2: "Purification", category3: "Chemicals", category4: "Pharma & Healthcare" },
];

const ValueChainPathways = () => {
  const { category, topic } = useParams<{ category: string; topic: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Parse opportunity map filter from URL params
  const urlParams = new URLSearchParams(location.search);
  const opportunityFilterType = urlParams.get('filterType') as 'feedstock' | 'technology' | 'product' | 'application' | null;
  const opportunityFilterValues = urlParams.get('filterValues')?.split('||').filter(Boolean) || [];
  const feedstockFromUrl = urlParams.get('feedstock') || '';
  const trlStageFromUrl = urlParams.get('trlStage') || '';
  // Transition state
  const [transitioningPathway, setTransitioningPathway] = useState<number | null>(null);
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [savedPathways, setSavedPathways] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('savedPathways');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [favoritedPathways, setFavoritedPathways] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('favoritedPathways');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [pathwayLikeCounts, setPathwayLikeCounts] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem('pathwayLikeCounts');
    return saved ? JSON.parse(saved) : {};
  });
  const [dislikedPathways, setDislikedPathways] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('dislikedPathways');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [shortlistNotes, setShortlistNotes] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('shortlistNotes');
    return saved ? JSON.parse(saved) : {};
  });
  const [shortlistDialogOpen, setShortlistDialogOpen] = useState(false);
  const [shortlistDialogIndex, setShortlistDialogIndex] = useState<number | null>(null);
  const [shortlistDialogNote, setShortlistDialogNote] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'normal' | 'compressed'>('normal');
  const [compressedGroupBy, setCompressedGroupBy] = useState<'feedstock' | 'technology' | 'application'>('feedstock');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (k: string) => setExpandedGroups(prev => {
    const next = new Set(prev);
    if (next.has(k)) next.delete(k); else next.add(k);
    return next;
  });
  // Per-feedstock display mode inside the Compressed view.
  const [groupDisplay, setGroupDisplay] = useState<Record<string, 'list' | 'tree'>>({});
  // Tree-view: which process is expanded to show its applications (per feedstock).
  const [treeExpandedProc, setTreeExpandedProc] = useState<Record<string, string | null>>({});
  // Tree-view: 'single' shows one tech at a time, 'all' spreads every tech and its apps.
  const [treeMode, setTreeMode] = useState<Record<string, 'single' | 'all'>>({});
  // Tree-view: which pathway (by originalIndex) is selected per feedstock, to show a bottom-right "Go to profile" CTA.
  const [treeSelectedPathway, setTreeSelectedPathway] = useState<Record<string, number | null>>({});
  // Tree-view ('all' mode): which tech is hovered / selected (per feedstock) to green-tint its apps.
  const [treeHoveredProc, setTreeHoveredProc] = useState<Record<string, string | null>>({});
  const [treeSelectedProc, setTreeSelectedProc] = useState<Record<string, string | null>>({});
  // Tracks which feedstock trees have already played their entrance animation so switching
  // processes doesn't cause static nodes (feedstock/material) to re-fade in.
  const treeMountedRef = useRef<Set<string>>(new Set());

  const [rightSidebarTab, setRightSidebarTab] = useState<'filters' | 'comments'>('filters');
  const topicCtx = useTopicComments();
  const currentPagePath = typeof window !== 'undefined' ? window.location.pathname : '';
  const pageCommentsCount = (topicCtx?.comments ?? []).filter((c) => c.page_path === currentPagePath).length;
  const unreadComments = usePageCommentsUnread(topicCtx?.topicKey ?? null, currentPagePath, rightSidebarTab === 'comments');
  useEffect(() => {
    topicCtx?.setPinsVisible(rightSidebarTab === 'comments');
    return () => topicCtx?.setPinsVisible(false);
  }, [rightSidebarTab, topicCtx?.setPinsVisible]);
  const [showAllPathways, setShowAllPathways] = useState(false);
  const [timelineValue, setTimelineValue] = useState<number[]>([0]);
  const [technologyFilter, setTechnologyFilter] = useState<string>('all');
  const [feedstockFilter, setFeedstockFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [applicationFilter, setApplicationFilter] = useState<string>('all');
  const [feedstockValueFilter, setFeedstockValueFilter] = useState<string>(feedstockFromUrl || 'all');
  const [processValueFilter, setProcessValueFilter] = useState<string>('all');
  const [productValueFilter, setProductValueFilter] = useState<string>('all');
  const [applicationValueFilter, setApplicationValueFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync feedstock filter when URL param changes (e.g., arriving from Feedstock Snapshot)
  useEffect(() => {
    if (feedstockFromUrl) setFeedstockValueFilter(feedstockFromUrl);
  }, [feedstockFromUrl]);
  const [viabilityFilter, setViabilityFilter] = useState<string | null>(
    ['Commercial', 'Pilot', 'Lab', 'Research'].includes(trlStageFromUrl) ? trlStageFromUrl : null,
  );
  useEffect(() => {
    if (['Commercial', 'Pilot', 'Lab', 'Research'].includes(trlStageFromUrl)) {
      setViabilityFilter(trlStageFromUrl);
    }
  }, [trlStageFromUrl]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'vcg' | 'research' | 'ip' | 'trl'>('vcg');
  const [vcgMinFilter, setVcgMinFilter] = useState<string>('all');
  const [feedstockQtyMin, setFeedstockQtyMin] = useState<number>(0);
  const [seasonalityFilter, setSeasonalityFilter] = useState<string>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [maturityFilter, setMaturityFilter] = useState<string>('all');
  const [customPathways, setCustomPathways] = useState<CustomPathway[]>(() => {
    const saved = localStorage.getItem('customPathways');
    return saved ? JSON.parse(saved) : [];
  });

  // Get timeline label based on slider value
  const getTimelineLabel = (value: number) => {
    const labels = ['0 years', '2 years', '4 years', '6 years', '8 years', '10+ years'];
    return labels[value] || '0 years';
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pathwayToDelete, setPathwayToDelete] = useState<number | null>(null);
  const [newPathway, setNewPathway] = useState<CustomPathway>({
    feedstock: '',
    technology: '',
    product: '',
    application: '',
    trl: 'TRL 6',
    category1: '',
    category2: '',
    category3: '',
    category4: ''
  });
  const [newProject, setNewProject] = useState({
    name: '',
    owner: '',
    goal: ''
  });
  
  // State for existing projects
  const [existingProjects, setExistingProjects] = useState<Array<{id: string; name: string; pathways: any[]}>>([]);
  const [isAddingToExisting, setIsAddingToExisting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  
  // Fetch existing projects
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase.from('projects').select('id, name, pathways');
      if (data && !error) {
        setExistingProjects(data.map(p => ({
          id: p.id,
          name: p.name,
          pathways: Array.isArray(p.pathways) ? p.pathways : []
        })));
      }
    };
    fetchProjects();
  }, [isProjectDialogOpen]);

  const isProductRoute = category === 'Product';
  const decodedTopic = decodeURIComponent(topic || "");
  
  // Helper: get TRL number
  const getTRLNumber = (trl: string) => parseInt(trl.replace('TRL ', ''));
  
  // Helper: get viability category
  const getViability = (trl: string) => {
    const n = getTRLNumber(trl);
    if (n >= 8) return 'Commercial';
    if (n >= 6) return 'Pilot';
    if (n >= 4) return 'Lab';
    return 'Research';
  };

  const getViabilityColor = (viability: string) => {
    switch (viability) {
      case 'Commercial': return { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500' };
      case 'Pilot': return { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', bar: 'bg-blue-500' };
      case 'Lab': return { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' };
      case 'Research': return { dot: 'bg-red-400', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-400' };
      default: return { dot: 'bg-muted-foreground', text: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', bar: 'bg-muted-foreground' };
    }
  };
  
  // Helper function to get TRL stage label
  const getTRLStageLabel = (trl: string) => {
    const trlNumber = parseInt(trl.replace('TRL ', ''));
    if (trlNumber >= 8) return 'Commercial';
    if (trlNumber >= 6) return 'Pilot';
    if (trlNumber >= 4) return 'Lab';
    return 'Research';
  };

  // Feedstock profile data for pathway cards
  const getFeedstockProfile = (feedstockName: string) => {
    const profiles: Record<string, { category: string; price: string; quantity: string; description: string }> = {
      'Corn Starch': { category: 'Bio-based primary', price: '€280–350/t', quantity: '85M t/yr', description: 'Primary starch feedstock for lactic acid fermentation. High glucose yield upon hydrolysis.' },
      'Sugarcane Molasses': { category: 'Industrial side-stream', price: '€80–120/t', quantity: '65M t/yr', description: 'Sugar-rich byproduct of cane processing. Cost-effective carbon source for Lactobacillus fermentation.' },
      'Whey Permeate': { category: 'Industrial side-stream', price: '€50–90/t', quantity: '40M t/yr', description: 'Lactose-rich dairy byproduct, ideal substrate for lactic acid bacteria with minimal pretreatment.' },
      'Corn Stover': { category: 'Agricultural residue', price: '€25–40/t', quantity: '60M t/yr', description: 'Lignocellulosic residue requiring pretreatment before fermentation to lactic acid.' },
      'Cassava Starch': { category: 'Bio-based primary', price: '€200–280/t', quantity: '35M t/yr', description: 'Tropical starch crop with high fermentable sugar content for lactic acid production.' },
      'Glucose Syrup': { category: 'Bio-based primary', price: '€350–450/t', quantity: '30M t/yr', description: 'Refined glucose solution providing consistent, high-purity substrate for fermentation.' },
      'Food Waste': { category: 'Waste stream', price: '€0–15/t', quantity: '88M t/yr', description: 'Mixed organic waste suitable for mixed-culture lactic acid fermentation processes.' },
      'Potato Starch': { category: 'Bio-based primary', price: '€300–380/t', quantity: '12M t/yr', description: 'European starch crop providing clean glucose for food-grade lactic acid production.' },
      'Microalgae Biomass': { category: 'Bio-based primary', price: '€200–500/t', quantity: '0.5M t/yr', description: 'Novel photosynthetic feedstock for CO₂-based lactic acid pathways. Early-stage.' },
    };
    return profiles[feedstockName] || {
      category: 'Biomass Feedstock',
      price: '€15–400/t',
      quantity: 'Variable',
      description: `${feedstockName} is a feedstock suitable for lactic acid production via fermentation.`
    };
  };

  // Generate a mock description for pathways
  const getPathwayDescription = (pathway: CustomPathway, index: number) => {
    const descriptions = [
      `Strongest pathway — established tech meeting massive demand in ${pathway.category4}.`,
      `Well-established conversion route with proven scalability. Multiple commercial references.`,
      `Growing market demand with competitive positioning. Key players already scaling.`,
      `Emerging technology with strong IP position. EU policy tailwinds support adoption.`,
      `Novel approach combining ${pathway.technology.toLowerCase()} with ${pathway.application.toLowerCase()}. Early but promising.`,
      `Circular economy pathway leveraging ${pathway.feedstock.toLowerCase()} waste streams effectively.`,
      `Cost-competitive route with established supply chain for ${pathway.product.toLowerCase()}.`,
      `High-value application in ${pathway.category4.toLowerCase()} with growing green premium.`,
    ];
    return descriptions[index % descriptions.length];
  };
  
  // Handle card click with transition animation
  const handleCardClick = (pathwayIndex: number) => {
    setTransitioningPathway(pathwayIndex);
    setTimeout(() => {
      navigate(`/landscape/${category}/${topic}/value-chain/pathways/${pathwayIndex}`);
    }, 400);
  };
  
  // Combine predefined and custom pathways
  const allPathways = [...PREDEFINED_PATHWAYS, ...customPathways.map(p => ({...p, isCustom: true}))];

  // Apply opportunity map pre-filter from URL params (acts as the new "scope" for counts/tabs)
  const scopedPathways = useMemo(() => {
    if (!opportunityFilterType || opportunityFilterValues.length === 0) return allPathways;
    return allPathways.filter(pathway => {
      if (opportunityFilterType === 'feedstock') return opportunityFilterValues.includes(pathway.feedstock);
      if (opportunityFilterType === 'technology') return opportunityFilterValues.includes(pathway.technology);
      if (opportunityFilterType === 'product') return opportunityFilterValues.includes(pathway.product);
      if (opportunityFilterType === 'application') return opportunityFilterValues.includes(pathway.application);
      return true;
    });
  }, [allPathways, opportunityFilterType, opportunityFilterValues.join(',')]);

  // Viability counts (respect opportunity scope)
  const viabilityCounts = useMemo(() => {
    const counts = { Commercial: 0, Pilot: 0, Lab: 0, 'Research': 0 };
    scopedPathways.forEach(p => {
      const v = getViability(p.trl);
      counts[v as keyof typeof counts]++;
    });
    return counts;
  }, [scopedPathways]);

  // Filtered pathways
  const filteredPathways = useMemo(() => {
    let filtered = allPathways.map((pathway, index) => ({ pathway, originalIndex: index }));

    // Apply opportunity map pre-filter from URL params
    if (opportunityFilterType && opportunityFilterValues.length > 0) {
      filtered = filtered.filter(({ pathway }) => {
        if (opportunityFilterType === 'feedstock') return opportunityFilterValues.includes(pathway.feedstock);
        if (opportunityFilterType === 'technology') return opportunityFilterValues.includes(pathway.technology);
        if (opportunityFilterType === 'product') return opportunityFilterValues.includes(pathway.product);
        if (opportunityFilterType === 'application') return opportunityFilterValues.includes(pathway.application);
        return true;
      });
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(({ pathway }) =>
        pathway.feedstock.toLowerCase().includes(q) ||
        pathway.technology.toLowerCase().includes(q) ||
        pathway.product.toLowerCase().includes(q) ||
        pathway.application.toLowerCase().includes(q)
      );
    }

    if (viabilityFilter) {
      filtered = filtered.filter(({ pathway }) => getViability(pathway.trl) === viabilityFilter);
    }

    if (feedstockFilter !== 'all') {
      filtered = filtered.filter(({ pathway }) => pathway.category1 === feedstockFilter);
    }

    if (technologyFilter !== 'all') {
      filtered = filtered.filter(({ pathway }) => pathway.category2 === technologyFilter);
    }

    if (applicationFilter !== 'all') {
      filtered = filtered.filter(({ pathway }) => pathway.category4 === applicationFilter);
    }

    if (feedstockValueFilter !== 'all') {
      filtered = filtered.filter(({ pathway }) => pathway.feedstock === feedstockValueFilter);
    }
    if (processValueFilter !== 'all') {
      filtered = filtered.filter(({ pathway }) => pathway.technology === processValueFilter);
    }
    if (productValueFilter !== 'all') {
      filtered = filtered.filter(({ pathway }) => pathway.product === productValueFilter);
    }
    if (applicationValueFilter !== 'all') {
      filtered = filtered.filter(({ pathway }) => pathway.application === applicationValueFilter);
    }

    // VCG min filter (computed VCG = max(20, 95 - originalIndex*3))
    if (vcgMinFilter !== 'all') {
      const min = parseInt(vcgMinFilter);
      filtered = filtered.filter(({ originalIndex }) => Math.max(20, 95 - originalIndex * 3) >= min);
    }

    // Feedstock quantity slider (M t/yr)
    if (feedstockQtyMin > 0) {
      filtered = filtered.filter(({ pathway }) => {
        const qtyStr = getFeedstockProfile(pathway.feedstock).quantity;
        const m = qtyStr.match(/(\d+(?:\.\d+)?)/);
        const qty = m ? parseFloat(m[1]) : 0;
        return qty >= feedstockQtyMin;
      });
    }

    // Seasonality (derive from feedstock category)
    if (seasonalityFilter !== 'all') {
      filtered = filtered.filter(({ pathway }) => {
        const cat = pathway.category1;
        const seasonality = cat === 'Agricultural residues' ? 'high'
          : cat === 'Bio-based primary feedstocks' ? 'medium'
          : 'low';
        return seasonality === seasonalityFilter;
      });
    }

    // Product category (category3)
    if (productCategoryFilter !== 'all') {
      filtered = filtered.filter(({ pathway }) => pathway.category3 === productCategoryFilter);
    }

    // Application maturity (derive from TRL)
    if (maturityFilter !== 'all') {
      filtered = filtered.filter(({ pathway }) => {
        const trl = getTRLNumber(pathway.trl);
        const maturity = trl >= 8 ? 'mature' : trl >= 6 ? 'growing' : trl >= 4 ? 'emerging' : 'nascent';
        return maturity === maturityFilter;
      });
    }

    if (activeTab === 'saved') {
      filtered = filtered.filter(({ originalIndex }) => savedPathways.has(originalIndex));
    }

    // Sort: disliked at bottom, then by selected metric
    filtered.sort((a, b) => {
      const aDisliked = dislikedPathways.has(a.originalIndex);
      const bDisliked = dislikedPathways.has(b.originalIndex);
      if (aDisliked && !bDisliked) return 1;
      if (!aDisliked && bDisliked) return -1;

      const aVcg = Math.max(20, 95 - a.originalIndex * 3);
      const bVcg = Math.max(20, 95 - b.originalIndex * 3);
      const aResearch = Math.min(100, Math.round(aVcg * 0.95 + (a.originalIndex % 5) * 2));
      const bResearch = Math.min(100, Math.round(bVcg * 0.95 + (b.originalIndex % 5) * 2));
      const aIp = Math.max(0, Math.min(100, Math.round(100 - aVcg + (a.originalIndex % 7) * 3)));
      const bIp = Math.max(0, Math.min(100, Math.round(100 - bVcg + (b.originalIndex % 7) * 3)));

      if (sortBy === 'vcg') return bVcg - aVcg;
      if (sortBy === 'research') return bResearch - aResearch;
      if (sortBy === 'ip') return aIp - bIp; // lower IP = better
      if (sortBy === 'trl') return getTRLNumber(b.pathway.trl) - getTRLNumber(a.pathway.trl);
      return 0;
    });

    return filtered;
  }, [allPathways.length, searchQuery, viabilityFilter, feedstockFilter, technologyFilter, applicationFilter, feedstockValueFilter, processValueFilter, productValueFilter, applicationValueFilter, vcgMinFilter, feedstockQtyMin, seasonalityFilter, productCategoryFilter, maturityFilter, activeTab, savedPathways, dislikedPathways, sortBy, opportunityFilterType, opportunityFilterValues.join(',')]);

  // Key extractor for compressed grouping (respects current groupBy)
  const groupKeyOf = (p: { feedstock: string; technology: string; application: string }) =>
    compressedGroupBy === 'feedstock' ? p.feedstock
    : compressedGroupBy === 'technology' ? p.technology
    : p.application;

  // Number of groups shown in compressed view (filtered to current product only)
  const compressedGroupCount = useMemo(() => {
    const set = new Set<string>();
    filteredPathways.forEach(({ pathway }) => {
      if (pathway.product === 'Lactic Acid') set.add(groupKeyOf(pathway));
    });
    return set.size;
  }, [filteredPathways, compressedGroupBy]);

  // Total groups available in the current opportunity scope
  const scopedGroupCount = useMemo(() => {
    const set = new Set<string>();
    scopedPathways.forEach((pathway) => {
      if (pathway.product === 'Lactic Acid') set.add(groupKeyOf(pathway));
    });
    return set.size;
  }, [scopedPathways, compressedGroupBy]);

  // Unique values for column filters
  const uniqueFeedstocks = useMemo(() => [...new Set(allPathways.map(p => p.feedstock))].sort(), [allPathways]);
  const uniqueProcesses = useMemo(() => [...new Set(allPathways.map(p => p.technology))].sort(), [allPathways]);
  const uniqueProducts = useMemo(() => [...new Set(allPathways.map(p => p.product))].sort(), [allPathways]);
  const uniqueApplications = useMemo(() => [...new Set(allPathways.map(p => p.application))].sort(), [allPathways]);
  useEffect(() => {
    localStorage.setItem('savedPathways', JSON.stringify(Array.from(savedPathways)));
  }, [savedPathways]);

  useEffect(() => {
    localStorage.setItem('customPathways', JSON.stringify(customPathways));
  }, [customPathways]);

  useEffect(() => {
    localStorage.setItem('favoritedPathways', JSON.stringify(Array.from(favoritedPathways)));
  }, [favoritedPathways]);

  useEffect(() => {
    localStorage.setItem('pathwayLikeCounts', JSON.stringify(pathwayLikeCounts));
  }, [pathwayLikeCounts]);

  useEffect(() => {
    localStorage.setItem('dislikedPathways', JSON.stringify(Array.from(dislikedPathways)));
  }, [dislikedPathways]);

  useEffect(() => {
    localStorage.setItem('shortlistNotes', JSON.stringify(shortlistNotes));
  }, [shortlistNotes]);

  const toggleSavePathway = (index: number) => {
    if (savedPathways.has(index)) {
      // Remove from shortlist
      setSavedPathways(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
      setShortlistNotes(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    } else {
      // Open dialog to add note
      setShortlistDialogIndex(index);
      setShortlistDialogNote('');
      setShortlistDialogOpen(true);
    }
  };

  const confirmShortlist = () => {
    if (shortlistDialogIndex === null) return;
    setSavedPathways(prev => {
      const newSet = new Set(prev);
      newSet.add(shortlistDialogIndex);
      return newSet;
    });
    if (shortlistDialogNote.trim()) {
      setShortlistNotes(prev => ({ ...prev, [shortlistDialogIndex]: shortlistDialogNote.trim() }));
    }
    setShortlistDialogOpen(false);
    setShortlistDialogIndex(null);
  };

  const toggleFavorite = (index: number) => {
    setFavoritedPathways(prev => {
      const newSet = new Set(prev);
      const isCurrentlyFavorited = newSet.has(index);
      
      if (isCurrentlyFavorited) {
        newSet.delete(index);
        // Decrease count
        setPathwayLikeCounts(prevCounts => ({
          ...prevCounts,
          [index]: Math.max((prevCounts[index] || 0) - 1, 0)
        }));
      } else {
        newSet.add(index);
        // Increase count
        setPathwayLikeCounts(prevCounts => ({
          ...prevCounts,
          [index]: (prevCounts[index] || 0) + 1
        }));
      }
      return newSet;
    });
  };

  const toggleDislike = (index: number) => {
    setDislikedPathways(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
        toast({
          title: "Removed from disliked",
          description: "Pathway preference updated",
        });
      } else {
        newSet.add(index);
        toast({
          title: "Marked as don't like",
          description: "Pathway moved to bottom of list",
        });
      }
      return newSet;
    });
  };

  const handleDeleteClick = (index: number) => {
    setPathwayToDelete(index);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (pathwayToDelete !== null) {
      // Remove from custom pathways if it's a custom pathway
      const pathway = allPathways[pathwayToDelete];
      if (pathway.isCustom) {
        const customIndex = customPathways.findIndex(p => 
          p.feedstock === pathway.feedstock && 
          p.technology === pathway.technology && 
          p.product === pathway.product
        );
        if (customIndex !== -1) {
          setCustomPathways(prev => prev.filter((_, i) => i !== customIndex));
        }
      }
      
      // Remove from saved pathways
      setSavedPathways(prev => {
        const newSet = new Set(prev);
        newSet.delete(pathwayToDelete);
        return newSet;
      });
      
      // Remove from favorited pathways
      setFavoritedPathways(prev => {
        const newSet = new Set(prev);
        newSet.delete(pathwayToDelete);
        return newSet;
      });
      
      // Remove from like counts
      setPathwayLikeCounts(prev => {
        const newCounts = {...prev};
        delete newCounts[pathwayToDelete];
        return newCounts;
      });
      
      toast({
        title: "Pathway Deleted",
        description: "The pathway has been removed",
      });
    }
    setDeleteDialogOpen(false);
    setPathwayToDelete(null);
  };

  const handleCreatePathway = () => {
    if (!newPathway.feedstock || !newPathway.technology || !newPathway.product || !newPathway.application) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setCustomPathways(prev => [...prev, newPathway]);
    setIsDialogOpen(false);
    setNewPathway({
      feedstock: '',
      technology: '',
      product: '',
      application: '',
      trl: 'TRL 6',
      category1: '',
      category2: '',
      category3: '',
      category4: ''
    });
    
    toast({
      title: "Pathway Created",
      description: "Your custom pathway has been added successfully"
    });
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="h-full bg-background flex flex-col">
        <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 pb-3 flex items-center gap-3 flex-shrink-0">
           <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => {
             const fromPage = urlParams.get('from');
             if (fromPage === 'patents') {
               navigate(`/landscape/${category}/${topic}/patents`);
             } else {
               navigate(`/landscape/${category}/${topic}/value-chain`);
             }
           }}>
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>
          <div className="flex items-center bg-muted rounded-lg p-0.5 ml-auto">
            <button
              onClick={() => setActiveTab(activeTab === 'saved' ? 'all' : 'saved')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${activeTab === 'saved' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Bookmark className="w-3 h-3" />
              Shortlisted ({savedPathways.size})
            </button>
          </div>

        </div>



        <div className="max-w-[1400px] w-full mx-auto px-6 pb-6 flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Title row */}
        <div className="grid gap-5 items-center mb-3 flex-shrink-0" style={{ gridTemplateColumns: '1fr 280px' }}>
          <div>
            <h1 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pathway Explorer</h1>
          </div>
          <div>
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Knowledge Base</h2>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid gap-5 flex-1 min-h-0" style={{ gridTemplateColumns: '1fr 280px' }}>
          {/* LEFT: Main page card */}
          <div className="border border-border rounded-lg bg-card p-5 shadow-sm min-w-0 overflow-y-auto h-full">
              <div className="flex items-start justify-between gap-4 mb-3">
                <p className="text-[10px] text-muted-foreground max-w-2xl leading-relaxed">
                  Every pathway from <span className="font-bold text-foreground">{decodedTopic}</span> to a market application, scored for viability. Compare, shortlist, and decide which pathways deserve your attention.
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>
                    Showing <span className="font-bold text-foreground">{viewMode === 'compressed' ? compressedGroupCount : filteredPathways.length}</span> of {viewMode === 'compressed' ? scopedGroupCount : scopedPathways.length} {viewMode === 'compressed' ? 'groups' : 'pathways'}
                  </span>
                </div>
              </div>

              {/* Opportunity Map filter banner */}
              {opportunityFilterType && opportunityFilterValues.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 mb-2">
                  <span className="text-[10px] text-muted-foreground">Filtered by {opportunityFilterType}:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {opportunityFilterValues.map((v) => (
                      <span key={v} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                        {v}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => navigate(`/landscape/${category}/${topic}/value-chain/pathways`, { replace: true })} className="ml-auto text-[10px] text-muted-foreground hover:text-foreground underline">
                    Clear filter
                  </button>
                </div>
              )}

              {/* Feedstock chip filter (e.g., from Feedstock Snapshot) */}
              {feedstockValueFilter !== 'all' && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 mb-2">
                  <span className="text-[10px] text-muted-foreground">Filtered by feedstock:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                    {feedstockValueFilter}
                  </span>
                  <button
                    onClick={() => {
                      setFeedstockValueFilter('all');
                      if (feedstockFromUrl) {
                        navigate(`/landscape/${category}/${topic}/value-chain/pathways`, { replace: true });
                      }
                    }}
                    className="ml-auto text-[10px] text-muted-foreground hover:text-foreground underline"
                  >
                    Clear filter
                  </button>
                </div>
              )}


            {/* Viability Summary Cards */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {(['Commercial', 'Pilot', 'Lab', 'Research'] as const).map((level) => {
                const colors = getViabilityColor(level);
                const count = viabilityCounts[level];
                const pct = scopedPathways.length > 0 ? Math.round((count / scopedPathways.length) * 100) : 0;
                const isActive = viabilityFilter === level;
                return (
                  <button
                    key={level}
                    onClick={() => setViabilityFilter(viabilityFilter === level ? null : level)}
                    className={`text-left border rounded-md px-2.5 py-2 transition-all ${
                      isActive ? `${colors.border} ${colors.bg} border-2 shadow-sm` : 'border-border bg-background hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${colors.text}`}>{level}</span>
                      <span className="text-[8px] text-muted-foreground ml-auto">
                        {level === 'Commercial' ? 'TRL 8–9' : level === 'Pilot' ? 'TRL 5–7' : level === 'Lab' ? 'TRL 3–4' : 'TRL 1–2'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-foreground">{count}</span>
                      <span className="text-[9px] text-muted-foreground">({pct}%)</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Toolbar: view mode + per-tab filter on the right */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-1">
                {([
                  { key: 'normal', label: 'Normal', Icon: Rows3, count: filteredPathways.length },
                  { key: 'compressed', label: 'Compressed', Icon: AlignJustify, count: compressedGroupCount },
                ] as const).map(({ key, label, Icon, count }) => (
                  <button
                    key={key}
                    onClick={() => setViewMode(key)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all border ${
                      viewMode === key
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-background text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                    <span className="ml-0.5 tabular-nums opacity-80">({count})</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {viewMode === 'normal' && (
                  <>
                    <div className="relative flex-1 max-w-[200px]">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="pl-7 h-7 !text-[10px] bg-background rounded-md"
                      />
                    </div>

                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'vcg' | 'research' | 'ip' | 'trl')}>
                      <SelectTrigger className="h-7 w-auto text-[10px] text-muted-foreground gap-1 px-2.5 border-border rounded-md">
                        <ArrowUpDown className="w-3 h-3 shrink-0" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vcg" className="text-[10px]">VCG Score</SelectItem>
                        <SelectItem value="research" className="text-[10px]">Research Score</SelectItem>
                        <SelectItem value="ip" className="text-[10px]">IP Score (low first)</SelectItem>
                        <SelectItem value="trl" className="text-[10px]">TRL Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}

                {viewMode === 'compressed' && (
                  <Select value={compressedGroupBy} onValueChange={(v) => setCompressedGroupBy(v as 'feedstock' | 'technology' | 'application')}>
                    <SelectTrigger className="h-7 w-auto text-[10px] text-muted-foreground gap-1 px-2.5 border-border rounded-md">
                      <span className="text-muted-foreground/70">Group by:</span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feedstock" className="text-[10px]">Feedstock</SelectItem>
                      <SelectItem value="technology" className="text-[10px]">Technology</SelectItem>
                      <SelectItem value="application" className="text-[10px]">Application</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>





            {/* Table Header */}
            {viewMode !== 'compressed' && (
            <div className="border border-border rounded-t-lg bg-muted/50 px-4 py-2.5 grid grid-cols-[28px_50px_minmax(0,1.8fr)_minmax(0,1.8fr)_minmax(0,1.8fr)_minmax(0,1.5fr)_65px_55px_75px] items-center gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"></span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-0.5 cursor-help hover:text-foreground transition-colors w-full">
                    VCG Score
                    <Info className="w-2.5 h-2.5 text-muted-foreground/50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" side="bottom" align="start">
                  <div className="space-y-2.5">
                    <div>
                      <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">VCG Score Methodology</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        The VCG Score evaluates pathways by blending three positive performance indicators and subtracting one negative indicator.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { label: 'Research', weight: '25%', value: 65, color: 'bg-blue-500' },
                        { label: 'TRL', weight: '40%', value: 70, color: 'bg-emerald-500' },
                        { label: 'Market Size', weight: '35%', value: 60, color: 'bg-amber-500' },
                        { label: 'IP Score', weight: '−20%', value: 40, color: 'bg-red-400', negative: true },
                      ].map((w) => (
                        <div key={w.label} className="flex items-center gap-2">
                          <span className="text-[9px] font-medium text-foreground w-16 shrink-0">{w.label}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${w.color} rounded-full`} style={{ width: `${w.value}%` }} />
                          </div>
                          <span className={`text-[9px] font-semibold w-8 text-right ${w.negative ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {w.weight}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border pt-2">
                      <p className="text-[9px] text-muted-foreground leading-relaxed">
                        A <span className="font-semibold text-foreground">high score</span> means strong research, high technical readiness, and a large market — with low patent saturation (more room to operate).
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {category === 'Feedstock' ? (
                <span className="text-[8px] font-bold text-primary uppercase tracking-widest text-center">Feedstock</span>
              ) : (
                <Select value={feedstockValueFilter} onValueChange={setFeedstockValueFilter}>
                  <SelectTrigger className="h-5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-0 bg-transparent p-0 shadow-none gap-0.5 w-full justify-center">
                    <SelectValue placeholder="Feedstocks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[10px]">Feedstocks</SelectItem>
                    {uniqueFeedstocks.map(f => <SelectItem key={f} value={f} className="text-[10px]">{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Select value={processValueFilter} onValueChange={setProcessValueFilter}>
                <SelectTrigger className="h-5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-0 bg-transparent p-0 shadow-none gap-0.5 w-full justify-center">
                  <SelectValue placeholder="Processes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[10px]">Processes</SelectItem>
                  {uniqueProcesses.map(p => <SelectItem key={p} value={p} className="text-[10px]">{p}</SelectItem>)}
                </SelectContent>
              </Select>
              {isProductRoute ? (
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider text-center">Material</span>
              ) : (
                <Select value={productValueFilter} onValueChange={setProductValueFilter}>
                  <SelectTrigger className="h-5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-0 bg-transparent p-0 shadow-none gap-0.5 w-full justify-center">
                    <SelectValue placeholder="Material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[10px]">Materials</SelectItem>
                    {uniqueProducts.map(p => <SelectItem key={p} value={p} className="text-[10px]">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Select value={applicationValueFilter} onValueChange={setApplicationValueFilter}>
                <SelectTrigger className="h-5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-0 bg-transparent p-0 shadow-none gap-0.5 w-full justify-center">
                  <SelectValue placeholder="Applications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[10px]">Applications</SelectItem>
                  {uniqueApplications.map(a => <SelectItem key={a} value={a} className="text-[10px]">{a}</SelectItem>)}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-0.5 cursor-help hover:text-foreground transition-colors w-full">
                    Research
                    <Info className="w-3 h-3 text-muted-foreground/70" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2.5" side="bottom" align="start">
                  <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">Research Score</h4>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">
                    Measures the volume and quality of scientific publications supporting this pathway. Based on publication count.
                  </p>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-0.5 cursor-help hover:text-foreground transition-colors w-full">
                    IP
                    <Info className="w-3 h-3 text-muted-foreground/70" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2.5" side="bottom" align="start">
                  <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">IP Score</h4>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">
                    Indicates patent saturation. A high IP score means dense patent coverage — less room to operate. A low score signals open IP space and greater freedom to innovate.
                  </p>
                </PopoverContent>
              </Popover>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">TRL</span>
            </div>
            )}

            {/* Table Rows */}
            <div className={viewMode === 'compressed' ? 'space-y-4' : 'border-x border-b border-border rounded-b-lg divide-y divide-border/50'}>
              {(() => {
                const isCompressed = viewMode === 'compressed';
                const rowPad = isCompressed ? 'px-4 py-1' : 'px-4 py-3';
                const chipCls = (extra: string = '') => isCompressed
                  ? `text-[10px] font-medium truncate text-center ${extra}`
                  : `text-[10px] font-medium truncate border border-border rounded px-2 py-1.5 bg-muted/20 text-center ${extra}`;

                const renderRow = ({ pathway, originalIndex }: { pathway: any; originalIndex: number }) => {
                  const viability = getViability(pathway.trl);
                  const colors = getViabilityColor(viability);
                  const vcgScore = Math.max(20, 95 - originalIndex * 3);
                  const researchScore = Math.min(100, Math.round(vcgScore * 0.95 + (originalIndex % 5) * 2));
                  const ipScore = Math.max(0, Math.min(100, Math.round(100 - vcgScore + (originalIndex % 7) * 3)));
                  const trlLabel = getTRLStageLabel(pathway.trl);
                  return (
                    <div
                      key={originalIndex}
                      className={`cursor-pointer hover:bg-muted/30 transition-all duration-200 ${
                        transitioningPathway === originalIndex ? 'animate-fade-out scale-95 opacity-50' : ''
                      } ${dislikedPathways.has(originalIndex) ? 'opacity-40' : ''}`}
                      onClick={() => handleCardClick(originalIndex)}
                    >
                      <div className={`${rowPad} grid grid-cols-[28px_50px_minmax(0,1.8fr)_minmax(0,1.8fr)_minmax(0,1.8fr)_minmax(0,1.5fr)_65px_55px_75px] items-center gap-2`}>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSavePathway(originalIndex); }}
                          className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                          title={savedPathways.has(originalIndex) ? 'Remove from shortlist' : 'Add to shortlist'}
                        >
                          <Bookmark className={`w-4 h-4 ${savedPathways.has(originalIndex) ? 'fill-primary text-primary' : ''}`} />
                        </button>
                        <div className="text-xs font-bold text-foreground text-center">{vcgScore}</div>
                        <div className={chipCls(!isProductRoute && category === 'Feedstock' ? (isCompressed ? 'text-primary' : 'border-primary/40 bg-primary/5 text-primary') : 'text-foreground')}>
                          {pathway.feedstock}
                        </div>
                        <div className={chipCls('text-foreground')}>
                          {pathway.technology}
                        </div>
                        <div className={chipCls(isProductRoute ? (isCompressed ? 'text-primary' : 'border-primary/40 bg-primary/5 text-primary') : 'text-foreground')}>
                          {pathway.product}
                        </div>
                        <div className={isCompressed ? 'text-[10px] text-muted-foreground truncate text-center' : 'text-[10px] text-muted-foreground truncate border border-border rounded px-2 py-1.5 bg-muted/20 text-center'}>
                          {pathway.application}
                        </div>
                        <div className="text-xs font-medium text-blue-600 text-center">{researchScore}</div>
                        <div className={`text-xs font-medium text-center ${ipScore > 60 ? 'text-red-500' : ipScore > 30 ? 'text-amber-600' : 'text-green-600'}`}>{ipScore}</div>
                        <div className="text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {trlLabel}
                          </span>
                        </div>
                      </div>
                      {activeTab === 'saved' && savedPathways.has(originalIndex) && shortlistNotes[originalIndex] && (
                        <div className="px-4 pb-3 -mt-1">
                          <div className="relative rounded-md bg-muted/40 border border-border/60 pl-3 pr-3 py-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <MessageSquare className="w-2.5 h-2.5 text-primary" />
                              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Shortlist Note</span>
                            </div>
                            <p className="text-[10px] text-foreground/85 leading-relaxed">
                              {shortlistNotes[originalIndex]}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                };

                if (viewMode === 'compressed') {
                  // Group by the selected dimension — only pathways producing Lactic Acid (this analysis).
                  type Row = typeof filteredPathways[number];
                  const groups = new Map<string, Row[]>();
                  filteredPathways
                    .filter((row) => row.pathway.product === 'Lactic Acid')
                    .forEach((row) => {
                      const k = groupKeyOf(row.pathway);
                      if (!groups.has(k)) groups.set(k, []);
                      groups.get(k)!.push(row);
                    });
                  const groupByLabel = compressedGroupBy === 'feedstock' ? 'Feedstock'
                    : compressedGroupBy === 'technology' ? 'Technology' : 'Application';

                  // Tree flowchart primitives (used per-group when display === 'tree').
                  const materialName = 'Lactic Acid';
                  const PROC_H = 34;
                  const APP_H = 34;
                  const PAD = 20;
                  const COL = { fs: 90, proc: 320, mat: 540, app: 780, trl: 950 };
                  const W = { fs: 140, proc: 220, mat: 150, app: 220, trl: 90 };
                  const curve = (x1: number, y1: number, x2: number, y2: number) => {
                    const mx = (x1 + x2) / 2;
                    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
                  };
                  const Node = ({
                    x, y, w, h = 28, children, tone = 'default', onClick, className, style,
                  }: {
                    x: number; y: number; w: number; h?: number;
                    children: React.ReactNode;
                    tone?: 'default' | 'feedstock' | 'material' | 'trl-hi' | 'trl-mid' | 'trl-lo';
                    onClick?: () => void;
                    className?: string;
                    style?: React.CSSProperties;
                  }) => {
                    const toneCls =
                      tone === 'feedstock' ? 'border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-700 dark:text-emerald-300 font-semibold'
                      : tone === 'material' ? 'border-primary/50 bg-primary/10 text-primary font-bold'
                      : tone === 'trl-hi' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : tone === 'trl-mid' ? 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                      : tone === 'trl-lo' ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      : 'border-border bg-card text-foreground hover:border-primary/40';
                    return (
                      <foreignObject x={x - w / 2} y={y - h / 2} width={w} height={h} className={className} style={{ transformOrigin: 'center', ...style }}>
                        <div
                          onClick={onClick}
                          className={`w-full h-full rounded-md border ${toneCls} px-2 flex items-center justify-center text-[10px] font-medium text-center leading-tight ${onClick ? 'cursor-pointer hover:shadow-sm' : ''} transition-all shadow-sm`}
                        >
                          <span className="truncate">{children}</span>
                        </div>
                      </foreignObject>
                    );
                  };

                  return Array.from(groups.entries()).map(([feedstockName, rows], groupIdx) => {
                    const expanded = expandedGroups.has(`c:${feedstockName}`);
                    const display = groupDisplay[feedstockName] ?? 'list';
                    const treeKey = `t:${feedstockName}`;
                    const firstMount = !treeMountedRef.current.has(treeKey);
                    if (expanded && display === 'tree') treeMountedRef.current.add(treeKey);
                    const enterNode = firstMount ? 'animate-tree-node-in opacity-0' : '';
                    const enterPath = firstMount ? 'animate-draw-path opacity-0' : '';

                    // Fixed column order: feedstock → tech → material → application.
                    // Depending on which dimension the group is keyed by, the "single group node",
                    // the "branching column" and the "leaf column" occupy different fixed positions.
                    type ColKey = 'fs' | 'proc' | 'app';
                    const singleColKey: ColKey =
                      compressedGroupBy === 'feedstock' ? 'fs'
                      : compressedGroupBy === 'technology' ? 'proc'
                      : 'app';
                    const branchColKey: ColKey =
                      compressedGroupBy === 'feedstock' ? 'proc' : 'fs';
                    const leafColKey: ColKey =
                      compressedGroupBy === 'application' ? 'proc' : 'app';
                    const singleX = COL[singleColKey];
                    const singleW = W[singleColKey];
                    const branchX = COL[branchColKey];
                    const branchW = W[branchColKey];
                    const leafX = COL[leafColKey];
                    const leafW = W[leafColKey];
                    const singleTone: 'feedstock' | 'material' | 'default' =
                      compressedGroupBy === 'feedstock' ? 'feedstock' : 'default';
                    // The branching dimension = whatever is NOT the group and NOT the leaf.
                    // Feedstock group → branch = tech, leaf = app
                    // Technology group → branch = feedstock, leaf = app
                    // Application group → branch = feedstock, leaf = tech
                    const secondaryKeyOf = (pw: { feedstock: string; technology: string; application: string }) =>
                      compressedGroupBy === 'feedstock' ? pw.technology : pw.feedstock;
                    const appLabelOf = (pw: { feedstock: string; technology: string; application: string }) =>
                      compressedGroupBy === 'application' ? pw.technology : pw.application;
                    const procMap = new Map<string, Row[]>();
                    rows.forEach((r) => {
                      const p = secondaryKeyOf(r.pathway);
                      if (!procMap.has(p)) procMap.set(p, []);
                      procMap.get(p)!.push(r);
                    });
                    const procList = Array.from(procMap.entries());
                    const mode: 'single' | 'all' = treeMode[feedstockName] ?? 'single';
                    const activeProcName = treeExpandedProc[feedstockName] ?? procList[0]?.[0] ?? null;
                    const activeRows = activeProcName ? (procMap.get(activeProcName) ?? []) : [];

                    // Per-branch row layout (used for 'all' mode and shared with 'single' as fallback).
                    const techRows = procList.map(([name, rs]) => {
                      const appCount = rs.length;
                      const rowH = Math.max(PROC_H + 8, appCount * APP_H);
                      return { name, rows: rs, appCount, rowH };
                    });

                    let svgH: number;
                    let centerY: number;
                    let procPositions: { name: string; y: number; count: number }[];
                    let allAppPositions: { row: Row; y: number; procY: number; procName: string }[];

                    if (mode === 'all') {
                      const totalH = techRows.reduce((s, r) => s + r.rowH, 0);
                      svgH = totalH + PAD * 2;
                      centerY = svgH / 2;
                      procPositions = [];
                      allAppPositions = [];
                      let cursor = PAD;
                      techRows.forEach((tr) => {
                        const rowCenter = cursor + tr.rowH / 2;
                        procPositions.push({ name: tr.name, y: rowCenter, count: tr.appCount });
                        const appH = tr.appCount * APP_H;
                        const appStart = rowCenter - appH / 2 + APP_H / 2;
                        tr.rows.forEach((r, i) => {
                          allAppPositions.push({ row: r, y: appStart + i * APP_H, procY: rowCenter, procName: tr.name });
                        });
                        cursor += tr.rowH;
                      });
                    } else {
                      const procH = procList.length * PROC_H;
                      const appH = activeRows.length * APP_H;
                      const innerH = Math.max(procH, appH, 60);
                      svgH = innerH + PAD * 2;
                      centerY = svgH / 2;
                      const procStart = centerY - procH / 2 + PROC_H / 2;
                      procPositions = procList.map(([name], i) => ({
                        name,
                        y: procStart + i * PROC_H,
                        count: procMap.get(name)!.length,
                      }));
                      const appStart = centerY - appH / 2 + APP_H / 2;
                      allAppPositions = activeRows.map((r, i) => ({ row: r, y: appStart + i * APP_H, procY: centerY, procName: activeProcName! }));
                    }

                    const hoveredProc = treeHoveredProc[feedstockName] ?? null;
                    const selectedProc = treeSelectedProc[feedstockName] ?? null;
                    const selectedPathwayIdx = treeSelectedPathway[feedstockName] ?? null;
                    const selectedPathwayRow = selectedPathwayIdx != null ? rows.find((r) => r.originalIndex === selectedPathwayIdx) : null;
                    const lockedProc = selectedPathwayRow ? secondaryKeyOf(selectedPathwayRow.pathway) : (selectedProc ?? null);
                    const highlightedProc = hoveredProc ?? selectedProc;
                    const isProcActive = (name: string) => {
                      if (mode === 'single') return name === activeProcName;
                      return highlightedProc == null ? false : name === highlightedProc;
                    };
                    const isProcAllowed = (_name: string) => true;
                    const isAppAllowed = (procName: string) => mode !== 'all' || lockedProc == null || procName === lockedProc;



                    const paths: React.ReactNode[] = [];
                    let pk = 0;
                    if (compressedGroupBy === 'application') {
                      // fs(branches) → proc(leaves per branch) → mat(single line) → app(single)
                      allAppPositions.forEach((a, i) => {
                        const branchY = procPositions.find(p => p.name === a.procName)?.y ?? centerY;
                        const isActive = isProcActive(a.procName);
                        const stroke = isActive ? 'hsl(var(--primary) / 0.45)' : 'hsl(var(--muted-foreground) / 0.35)';
                        paths.push(<path key={`fl-${pk++}`} d={curve(COL.fs + W.fs / 2, branchY, COL.proc - W.proc / 2, a.y)} fill="none" stroke={stroke} strokeWidth={isActive ? 1.5 : 1} pathLength="1" strokeDasharray="1" className={enterPath} style={{ animationDelay: `${200 + i * 40}ms` }} />);
                      });
                      allAppPositions.forEach((a, i) => {
                        const appActive = mode === 'single' || isProcActive(a.procName);
                        paths.push(<path key={`lm-${i}`} d={curve(COL.proc + W.proc / 2, a.y, COL.mat - W.mat / 2, centerY)} fill="none" stroke={appActive ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--muted-foreground) / 0.35)'} strokeWidth={1.25} pathLength="1" strokeDasharray="1" className="animate-draw-path opacity-0" style={{ animationDelay: `${500 + i * 40}ms` }} />);
                      });
                      paths.push(<path key={`ms-single`} d={curve(COL.mat + W.mat / 2, centerY, COL.app - W.app / 2, centerY)} fill="none" stroke="hsl(var(--primary) / 0.5)" strokeWidth={1.5} pathLength="1" strokeDasharray="1" className="animate-draw-path opacity-0" style={{ animationDelay: `800ms` }} />);
                    } else if (compressedGroupBy === 'technology') {
                      // fs(branches) → proc(single) → mat → app(leaves)
                      procPositions.forEach((p, i) => {
                        const isActive = isProcActive(p.name);
                        const stroke = isActive ? 'hsl(var(--primary) / 0.45)' : 'hsl(var(--muted-foreground) / 0.35)';
                        const baseDelay = 200 + i * 100;
                        paths.push(<path key={`fp-${pk++}`} d={curve(COL.fs + W.fs / 2, p.y, COL.proc - W.proc / 2, centerY)} fill="none" stroke={stroke} strokeWidth={isActive ? 1.5 : 1} pathLength="1" strokeDasharray="1" className={enterPath} style={{ animationDelay: `${baseDelay}ms` }} />);
                      });
                      paths.push(<path key={`pm-single`} d={curve(COL.proc + W.proc / 2, centerY, COL.mat - W.mat / 2, centerY)} fill="none" stroke="hsl(var(--primary) / 0.5)" strokeWidth={1.5} pathLength="1" strokeDasharray="1" className={enterPath} style={{ animationDelay: `500ms` }} />);
                      allAppPositions.forEach((a, i) => {
                        const appActive = mode === 'single' || isProcActive(a.procName);
                        paths.push(<path key={`ma-${i}`} d={curve(COL.mat + W.mat / 2, centerY, COL.app - W.app / 2, a.y)} fill="none" stroke={appActive ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--muted-foreground) / 0.35)'} strokeWidth={1.25} pathLength="1" strokeDasharray="1" className="animate-draw-path opacity-0" style={{ animationDelay: `${600 + i * 60}ms` }} />);
                        paths.push(<path key={`at-${i}`} d={curve(COL.app + W.app / 2, a.y, COL.trl - W.trl / 2, a.y)} fill="none" stroke="hsl(var(--muted-foreground) / 0.35)" strokeWidth={1} pathLength="1" strokeDasharray="1" className="animate-draw-path opacity-0" style={{ animationDelay: `${740 + i * 60}ms` }} />);
                      });
                    } else {
                      // feedstock (original): fs(single) → proc(branches) → mat → app(leaves)
                      procPositions.forEach((p, i) => {
                        const isActive = isProcActive(p.name);
                        const stroke = isActive ? 'hsl(var(--primary) / 0.45)' : 'hsl(var(--border))';
                        const baseDelay = 200 + i * 100;
                        paths.push(<path key={`fp-${pk++}`} d={curve(COL.fs + W.fs / 2, centerY, COL.proc - W.proc / 2, p.y)} fill="none" stroke={stroke} strokeWidth={isActive ? 1.5 : 1} pathLength="1" strokeDasharray="1" className={enterPath} style={{ animationDelay: `${baseDelay}ms` }} />);
                        paths.push(<path key={`pm-${pk++}`} d={curve(COL.proc + W.proc / 2, p.y, COL.mat - W.mat / 2, centerY)} fill="none" stroke={stroke} strokeWidth={isActive ? 1.5 : 1} pathLength="1" strokeDasharray="1" className={enterPath} style={{ animationDelay: `${baseDelay + 180}ms` }} />);
                      });
                      allAppPositions.forEach((a, i) => {
                        const appActive = mode === 'single' || isProcActive(a.procName);
                        paths.push(<path key={`ma-${i}`} d={curve(COL.mat + W.mat / 2, centerY, COL.app - W.app / 2, a.y)} fill="none" stroke={appActive ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'} strokeWidth={1.25} pathLength="1" strokeDasharray="1" className="animate-draw-path opacity-0" style={{ animationDelay: `${600 + i * 60}ms` }} />);
                        paths.push(<path key={`at-${i}`} d={curve(COL.app + W.app / 2, a.y, COL.trl - W.trl / 2, a.y)} fill="none" stroke="hsl(var(--border))" strokeWidth={1} pathLength="1" strokeDasharray="1" className="animate-draw-path opacity-0" style={{ animationDelay: `${740 + i * 60}ms` }} />);
                      });
                    }

                    return (
                    <div key={feedstockName} className="space-y-2">
                      {/* Feedstock header — click to expand; inline List/Tree toggle when open */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleGroup(`c:${feedstockName}`)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGroup(`c:${feedstockName}`); } }}
                        className={`group w-full border rounded px-3 py-2.5 bg-background flex items-center justify-between gap-3 shadow-sm transition-all duration-200 text-left cursor-pointer ${
                          expanded ? 'border-primary bg-muted/30' : 'border-border hover:border-primary/40 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-90 text-primary' : 'text-muted-foreground group-hover:text-primary group-hover:rotate-90'}`} strokeWidth={2.5} />
                          <span className={`font-mono text-[9px] tracking-tighter tabular-nums ${expanded ? 'text-primary/60' : 'text-muted-foreground'}`}>
                            {String(groupIdx + 1).padStart(2, '0')}
                          </span>
                          <span className={`text-[11px] font-bold uppercase tracking-[0.12em] truncate transition-colors ${expanded ? 'text-foreground' : 'text-foreground/85 group-hover:text-foreground'}`}>
                            {feedstockName}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium shrink-0">({rows.length} pathways)</span>
                        </div>
                        {expanded && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-0.5 p-0.5 rounded-md bg-muted border border-border shrink-0"
                          >
                            {([
                              { key: 'list', label: 'List', Icon: AlignJustify },
                              { key: 'tree', label: 'Tree', Icon: ListTree },
                            ] as const).map(({ key, label, Icon }) => (
                              <button
                                key={key}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setGroupDisplay((prev) => ({ ...prev, [feedstockName]: key })); }}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                                  display === key
                                    ? 'bg-foreground text-background shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                <Icon className="w-3 h-3" />
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Body — either the sub-branch list or the flowchart */}
                      {expanded && display === 'list' && (
                      <div className="relative pl-8 ml-6 space-y-1.5 pb-1">
                        <div className="absolute left-0 top-0 bottom-4 w-px border-l border-dashed border-muted-foreground/30 animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }} />
                        {rows.map(({ pathway, originalIndex }, idx) => {
                          const viability = getViability(pathway.trl);
                          const colors = getViabilityColor(viability);
                          const vcgScore = Math.max(20, 95 - originalIndex * 3);
                          const researchScore = Math.min(100, Math.round(vcgScore * 0.95 + (originalIndex % 5) * 2));
                          const ipScore = Math.max(0, Math.min(100, Math.round(100 - vcgScore + (originalIndex % 7) * 3)));
                          const trlLabel = getTRLStageLabel(pathway.trl);
                          const isLast = idx === rows.length - 1;
                          return (
                            <div
                              key={originalIndex}
                              className="relative animate-scale-in-subtle opacity-0"
                              style={{ animationDelay: `${idx * 90}ms` }}
                            >
                              <div className="absolute -left-8 top-1/2 w-8 h-px border-t border-dashed border-muted-foreground/30" />
                              <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-sm bg-primary/50" />
                              {isLast && <div className="absolute -left-8 top-1/2 bottom-0 w-px bg-background" />}
                              <div
                                onClick={() => handleCardClick(originalIndex)}
                                className={`cursor-pointer border border-border rounded-lg pl-3 pr-4 py-1.5 grid grid-cols-[28px_36px_minmax(0,1.6fr)_minmax(0,1.6fr)_minmax(0,1.6fr)_minmax(0,1.4fr)_45px_40px_70px] items-center gap-2 hover:bg-muted/30 transition-colors bg-background ${dislikedPathways.has(originalIndex) ? 'opacity-40' : ''}`}
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleSavePathway(originalIndex); }}
                                  className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                                  title={savedPathways.has(originalIndex) ? 'Remove from shortlist' : 'Add to shortlist'}
                                >
                                  <Bookmark className={`w-3.5 h-3.5 ${savedPathways.has(originalIndex) ? 'fill-primary text-primary' : ''}`} />
                                </button>
                                <div className="text-xs font-bold text-foreground text-center">{vcgScore}</div>
                                <div className="text-[10px] font-medium text-foreground truncate text-center">{pathway.feedstock}</div>
                                <div className="text-[10px] font-medium text-foreground truncate text-center">{pathway.technology}</div>
                                <div className={`text-[10px] font-medium truncate text-center ${isProductRoute ? 'text-primary' : 'text-foreground'}`}>{pathway.product}</div>
                                <div className="text-[10px] text-muted-foreground truncate text-center">{pathway.application}</div>
                                <div className="text-xs font-medium text-blue-600 text-center">{researchScore}</div>
                                <div className={`text-xs font-medium text-center ${ipScore > 60 ? 'text-red-500' : ipScore > 30 ? 'text-amber-600' : 'text-green-600'}`}>{ipScore}</div>
                                <div className="text-center">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
                                    {trlLabel}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      )}
                      {expanded && display === 'tree' && (
                        <div className="rounded-lg border border-border bg-card/40 px-3 py-3 overflow-x-auto animate-fade-in">
                          <div className="min-w-[880px]">
                            <div className="flex items-center justify-between mb-1.5 gap-3">
                              <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-muted border border-border">
                                {([
                                  { key: 'single', label: 'Single' },
                                  { key: 'all', label: 'All' },
                                ] as const).map(({ key, label }) => (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => setTreeMode((prev) => ({ ...prev, [feedstockName]: key }))}
                                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                                      mode === key
                                        ? 'bg-foreground text-background shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-3">
                                {mode === 'single' && activeProcName && (
                                  <span className="text-[9px] text-muted-foreground">
                                    Showing <span className="text-primary font-semibold">{activeProcName}</span> · {activeRows.length} app{activeRows.length === 1 ? '' : 's'}
                                  </span>
                                )}
                                {mode === 'all' && (
                                  <span className="text-[9px] text-muted-foreground">
                                    Showing all <span className="text-foreground font-semibold">{procList.length}</span> technologies · {rows.length} apps
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground mb-1.5">
                              {mode === 'single'
                                ? "Select one technology at a time to view its compatible applications, or click an application to open its pathway profile."
                                : "View every technology and application. Click a technology to highlight its compatible applications, or click an application to open its pathway profile."}
                            </p>
                            <div className="w-full overflow-x-auto">
                            <svg viewBox={`0 0 1000 ${svgH}`} width="100%" height={svgH} preserveAspectRatio="xMidYMid meet" style={{ minWidth: 900 }} className="block">

                              {paths}
                              <Node x={singleX} y={centerY} w={singleW} tone={singleTone} className={enterNode} style={{ animationDelay: '80ms' }}>{feedstockName}</Node>
                              {procPositions.map((p, i) => (
                                <foreignObject
                                  key={`p-${p.name}`}
                                  x={branchX - branchW / 2}
                                  y={p.y - 14}
                                  width={branchW}
                                  height={28}
                                  className={enterNode}
                                  style={{ transformOrigin: 'center', animationDelay: `${300 + i * 100}ms` }}
                                >
                                  <button
                                    onMouseEnter={() => {
                                      if (mode !== 'all') return;
                                      setTreeHoveredProc((prev) => ({ ...prev, [feedstockName]: p.name }));
                                    }}
                                    onMouseLeave={() => {
                                      if (mode !== 'all') return;
                                      setTreeHoveredProc((prev) => ({ ...prev, [feedstockName]: null }));
                                    }}
                                    onClick={() => {
                                      if (mode === 'all') {
                                        if (!isProcAllowed(p.name)) return;
                                        setTreeSelectedPathway((prev) => ({ ...prev, [feedstockName]: null }));
                                        setTreeSelectedProc((prev) => ({
                                          ...prev,
                                          [feedstockName]: prev[feedstockName] === p.name ? null : p.name,
                                        }));
                                        return;
                                      }
                                      setTreeSelectedPathway((prev) => ({ ...prev, [feedstockName]: null }));
                                      setTreeExpandedProc((prev) => ({
                                        ...prev,
                                        [feedstockName]: prev[feedstockName] === p.name ? null : p.name,
                                      }));
                                    }}
                                    className={`w-full h-full rounded-md border px-2 flex items-center justify-between text-[10px] leading-tight shadow-sm transition-all focus:outline-none focus-visible:outline-none ${
                                      mode === 'all' && selectedProc === p.name
                                        ? 'border-emerald-700 bg-emerald-600 text-white font-semibold shadow-md ring-1 ring-emerald-700/40'
                                        : isProcActive(p.name)
                                          ? 'border-emerald-500/50 bg-emerald-500/[0.10] text-emerald-700 dark:text-emerald-300'
                                          : 'border-border bg-card text-foreground hover:border-emerald-500/40 hover:shadow-md'
                                    } ${isProcAllowed(p.name) ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                  >
                                    <span className="truncate flex-1 text-left">{p.name}</span>
                                    <span className={`ml-1.5 shrink-0 text-[9px] tabular-nums px-1.5 py-0.5 rounded-full ${
                                      mode === 'all' && selectedProc === p.name
                                        ? 'bg-emerald-700 text-white'
                                        : isProcActive(p.name)
                                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                          : 'bg-muted text-muted-foreground'
                                    }`}>{p.count}</span>
                                  </button>


                                </foreignObject>
                              ))}
                              <Node x={COL.mat} y={centerY} w={W.mat} tone="material" className={enterNode} style={{ animationDelay: '500ms' }}>{materialName}</Node>
                              {allAppPositions.map((a, i) => {
                                const trlLabel = getTRLStageLabel(a.row.pathway.trl);
                                const trlNum = getTRLNumber(a.row.pathway.trl);
                                const tone: 'trl-hi' | 'trl-mid' | 'trl-lo' =
                                  trlNum >= 8 ? 'trl-hi' : trlNum >= 5 ? 'trl-mid' : 'trl-lo';
                                const selected = treeSelectedPathway[feedstockName] === a.row.originalIndex;
                                const procHighlighted = mode === 'all' && isProcActive(a.procName);
                                return (
                                  <g key={`${a.procName}-${a.row.originalIndex}`}>
                                    <foreignObject
                                      x={leafX - leafW / 2}
                                      y={a.y - 14}
                                      width={leafW}
                                      height={28}
                                      className="animate-tree-node-in opacity-0"
                                      style={{ transformOrigin: 'center', animationDelay: `${720 + i * 60}ms` }}
                                    >
                                      {!isAppAllowed(a.procName) ? (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              type="button"
                                              onMouseEnter={() => {
                                                if (mode !== 'all') return;
                                                setTreeHoveredProc((prev) => ({ ...prev, [feedstockName]: a.procName }));
                                              }}
                                              onMouseLeave={() => {
                                                if (mode !== 'all') return;
                                                setTreeHoveredProc((prev) => ({ ...prev, [feedstockName]: null }));
                                              }}
                                              onClick={() => {
                                                if (!isAppAllowed(a.procName)) return;
                                                setTreeSelectedPathway((prev) => ({
                                                  ...prev,
                                                  [feedstockName]: prev[feedstockName] === a.row.originalIndex ? null : a.row.originalIndex,
                                                }));
                                              }}
                                              className={`w-full h-full rounded-md border px-2 flex items-center justify-center text-[10px] font-medium text-center leading-tight transition-all shadow-sm focus:outline-none focus-visible:outline-none ${
                                                selected
                                                  ? 'border-emerald-700 bg-emerald-600 text-white font-semibold shadow-md ring-1 ring-emerald-700/40'
                                                  : procHighlighted
                                                    ? 'border-emerald-500/50 bg-emerald-500/[0.10] text-emerald-700 dark:text-emerald-300'
                                                    : 'border-border bg-card text-foreground hover:border-emerald-500/40 hover:shadow-md'
                                              } ${isAppAllowed(a.procName) ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                            >
                                             <span className="truncate">{appLabelOf(a.row.pathway)}</span>
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" className="max-w-[200px] text-xs text-center">
                                            This application is not compatible with the selected technology
                                          </TooltipContent>
                                        </Tooltip>
                                      ) : (
                                        <button
                                          type="button"
                                          onMouseEnter={() => {
                                            if (mode !== 'all') return;
                                            setTreeHoveredProc((prev) => ({ ...prev, [feedstockName]: a.procName }));
                                          }}
                                          onMouseLeave={() => {
                                            if (mode !== 'all') return;
                                            setTreeHoveredProc((prev) => ({ ...prev, [feedstockName]: null }));
                                          }}
                                          onClick={() => {
                                            if (!isAppAllowed(a.procName)) return;
                                            setTreeSelectedPathway((prev) => ({
                                              ...prev,
                                              [feedstockName]: prev[feedstockName] === a.row.originalIndex ? null : a.row.originalIndex,
                                            }));
                                          }}
                                          className={`w-full h-full rounded-md border px-2 flex items-center justify-center text-[10px] font-medium text-center leading-tight transition-all shadow-sm focus:outline-none focus-visible:outline-none ${
                                            selected
                                              ? 'border-emerald-700 bg-emerald-600 text-white font-semibold shadow-md ring-1 ring-emerald-700/40'
                                              : procHighlighted
                                                ? 'border-emerald-500/50 bg-emerald-500/[0.10] text-emerald-700 dark:text-emerald-300'
                                                : 'border-border bg-card text-foreground hover:border-emerald-500/40 hover:shadow-md'
                                          } ${isAppAllowed(a.procName) ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                        >
                                          <span className="truncate">{appLabelOf(a.row.pathway)}</span>
                                        </button>
                                      )}


                                    </foreignObject>
                                    {compressedGroupBy !== 'application' && (
                                      <Node x={COL.trl} y={a.y} w={W.trl} tone={tone} className="animate-tree-node-in opacity-0" style={{ animationDelay: `${820 + i * 60}ms` }}>{trlLabel}</Node>
                                    )}
                                  </g>
                                );
                              })}
                            </svg>
                            </div>

                            {/* Bottom-right CTA — visible once a pathway is selected */}
                            <div className="flex items-center justify-end gap-2 mt-2 min-h-[28px]">
                              {(() => {
                                const selIdx = treeSelectedPathway[feedstockName];
                                if (selIdx == null) return (
                                  <span className="text-[9px] text-muted-foreground italic">Click a pathway to select it</span>
                                );
                                const selRow = rows.find((r) => r.originalIndex === selIdx);
                                if (!selRow) return null;
                                const isSaved = savedPathways.has(selIdx);
                                return (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => toggleSavePathway(selIdx)}
                                      title={isSaved ? 'Remove from shortlist' : 'Shortlist this pathway'}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-[10px] font-semibold transition-colors shadow-sm animate-scale-in-subtle ${
                                        isSaved
                                          ? 'border-primary bg-primary/10 text-primary hover:bg-primary/15'
                                          : 'border-border bg-card text-foreground hover:bg-muted'
                                      }`}
                                    >
                                      <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-primary text-primary' : ''}`} />
                                      {isSaved ? 'Shortlisted' : 'Shortlist this pathway'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCardClick(selIdx)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-foreground bg-foreground text-background text-[10px] font-semibold hover:bg-foreground/90 transition-colors shadow-sm animate-scale-in-subtle"
                                    >
                                      Go to pathway profile <ArrowRight className="w-3 h-3" />
                                    </button>
                                  </>
                                );
                              })()}
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                    );
                  });
                }










                return pagedPathways.map(renderRow);
              })()}
            {filteredPathways.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No pathways match your current filters.</p>
                <Button variant="link" size="sm" className="text-xs" onClick={() => { setSearchQuery(''); setViabilityFilter(null); setActiveTab('all'); }}>
                  Clear filters
                </Button>
              </div>
            )}
            </div>
          </div>

          {/* RIGHT: Filter Sidebar */}
          {showRightPanel && (
          <div className="flex h-full min-h-0 flex-col gap-1.5 pr-1">

            <div className="flex items-center gap-0 bg-muted/30 rounded-lg p-0.5">
              <button
                onClick={() => setRightSidebarTab('filters')}
                className={`flex-1 text-[10px] font-medium px-3 py-1.5 rounded-md transition-all ${
                  rightSidebarTab === 'filters'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-sm'
                }`}
              >
                Advanced Filters
              </button>
              <button
                onClick={() => setRightSidebarTab('comments')}
                className={`relative flex-1 text-[10px] font-medium px-3 py-1.5 rounded-md transition-all ${
                  rightSidebarTab === 'comments'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-sm'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  All Comments
                  <span className={`tabular-nums text-[9px] px-1.5 py-0 rounded-full ${
                    rightSidebarTab === 'comments'
                      ? 'bg-background/20 text-background'
                      : 'bg-muted-foreground/15 text-muted-foreground'
                  }`}>
                    {pageCommentsCount}
                  </span>
                </span>
                {unreadComments > 0 && rightSidebarTab !== 'comments' && (
                  <span className="absolute top-1 right-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                  </span>
                )}
              </button>
            </div>
            <div className="flex-1 min-h-0">
              {rightSidebarTab === 'filters' ? (
                <div className="h-full rounded-lg border border-border bg-card shadow-sm px-3 py-3">
                  {/* Header strip */}
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/60">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Filters</span>
                      <span className="text-[10px] text-muted-foreground">
                        · <span className="font-bold text-primary tabular-nums">{filteredPathways.length}</span> match
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setFeedstockFilter('all');
                        setTechnologyFilter('all');
                        setApplicationFilter('all');
                        setProductCategoryFilter('all');
                        setVcgMinFilter('all');
                        setSeasonalityFilter('all');
                        setMaturityFilter('all');
                        setFeedstockQtyMin(0);
                        setSearchQuery('');
                        setViabilityFilter(null);
                      }}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="space-y-2">
                    {/* Pathway */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1 h-1 rounded-full bg-foreground" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Pathway</span>
                      </div>
                      <div className="space-y-1">
                        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                          <label className="text-[10px] text-muted-foreground">VCG Score</label>
                          <Select value={vcgMinFilter} onValueChange={setVcgMinFilter}>
                            <SelectTrigger className={`h-6 w-[120px] text-[10px] bg-background border-border/60 ${vcgMinFilter !== 'all' ? 'border-primary/50 text-foreground font-medium' : ''}`}><SelectValue placeholder="Any" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any</SelectItem>
                              <SelectItem value="90">90+</SelectItem>
                              <SelectItem value="75">75+</SelectItem>
                              <SelectItem value="50">50+</SelectItem>
                              <SelectItem value="25">25+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                          <label className="text-[10px] text-muted-foreground">TRL Stage</label>
                          <Select value={viabilityFilter ?? 'all'} onValueChange={(v) => setViabilityFilter(v === 'all' ? null : v)}>
                            <SelectTrigger className={`h-6 w-[120px] text-[10px] bg-background border-border/60 ${viabilityFilter ? 'border-primary/50 text-foreground font-medium' : ''}`}><SelectValue placeholder="Any" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any</SelectItem>
                              <SelectItem value="Commercial">Commercial (8–9)</SelectItem>
                              <SelectItem value="Pilot">Pilot (5–7)</SelectItem>
                              <SelectItem value="Lab">Lab (3–4)</SelectItem>
                              <SelectItem value="Research">Research (1–2)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                          <label className="text-[10px] text-muted-foreground">Sort by</label>
                          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'vcg' | 'research' | 'ip' | 'trl')}>
                            <SelectTrigger className="h-6 w-[120px] text-[10px] bg-background border-border/60"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vcg">VCG Score</SelectItem>
                              <SelectItem value="research">Research</SelectItem>
                              <SelectItem value="ip">IP Score</SelectItem>
                              <SelectItem value="trl">TRL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {category !== 'Feedstock' && (
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-1 h-1 rounded-full bg-success" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Feedstock</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="pt-0.5">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[10px] text-muted-foreground">Quantity (M t/yr)</label>
                              <span className={`text-[9px] tabular-nums ${feedstockQtyMin > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{feedstockQtyMin}+</span>
                            </div>
                            <Slider value={[feedstockQtyMin]} onValueChange={(v) => setFeedstockQtyMin(v[0])} max={100} step={10} className="w-full" />
                          </div>
                          <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                            <label className="text-[10px] text-muted-foreground">Category</label>
                            <Select value={feedstockFilter} onValueChange={setFeedstockFilter}>
                              <SelectTrigger className={`h-6 w-[120px] text-[10px] bg-background border-border/60 ${feedstockFilter !== 'all' ? 'border-primary/50 text-foreground font-medium' : ''}`}><SelectValue placeholder="Any" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Any</SelectItem>
                                {[...new Set(allPathways.map(p => p.category1))].sort().map(c => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                            <label className="text-[10px] text-muted-foreground">Seasonality</label>
                            <Select value={seasonalityFilter} onValueChange={setSeasonalityFilter}>
                              <SelectTrigger className={`h-6 w-[120px] text-[10px] bg-background border-border/60 ${seasonalityFilter !== 'all' ? 'border-primary/50 text-foreground font-medium' : ''}`}><SelectValue placeholder="Any" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Any</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1 h-1 rounded-full bg-product-blue" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Process</span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                        <label className="text-[10px] text-muted-foreground">Category</label>
                        <Select value={technologyFilter} onValueChange={setTechnologyFilter}>
                          <SelectTrigger className={`h-6 w-[120px] text-[10px] bg-background border-border/60 ${technologyFilter !== 'all' ? 'border-primary/50 text-foreground font-medium' : ''}`}><SelectValue placeholder="Any" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any</SelectItem>
                            {[...new Set(allPathways.map(p => p.category2))].sort().map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {category === 'Feedstock' && (
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-1 h-1 rounded-full bg-application-purple" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Material</span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                          <label className="text-[10px] text-muted-foreground">Category</label>
                          <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                            <SelectTrigger className={`h-6 w-[120px] text-[10px] bg-background border-border/60 ${productCategoryFilter !== 'all' ? 'border-primary/50 text-foreground font-medium' : ''}`}><SelectValue placeholder="Any" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any</SelectItem>
                              {[...new Set(allPathways.map(p => p.category3))].sort().map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1 h-1 rounded-full bg-application-orange" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Application</span>
                      </div>
                      <div className="space-y-1">
                        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                          <label className="text-[10px] text-muted-foreground">Category</label>
                          <Select value={applicationFilter} onValueChange={setApplicationFilter}>
                            <SelectTrigger className={`h-6 w-[120px] text-[10px] bg-background border-border/60 ${applicationFilter !== 'all' ? 'border-primary/50 text-foreground font-medium' : ''}`}><SelectValue placeholder="Any" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any</SelectItem>
                              {[...new Set(allPathways.map(p => p.category4))].sort().map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                          <label className="text-[10px] text-muted-foreground">Maturity</label>
                          <Select value={maturityFilter} onValueChange={setMaturityFilter}>
                            <SelectTrigger className={`h-6 w-[120px] text-[10px] bg-background border-border/60 ${maturityFilter !== 'all' ? 'border-primary/50 text-foreground font-medium' : ''}`}><SelectValue placeholder="Any" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any</SelectItem>
                              <SelectItem value="mature">Mature</SelectItem>
                              <SelectItem value="growing">Growing</SelectItem>
                              <SelectItem value="emerging">Emerging</SelectItem>
                              <SelectItem value="nascent">Nascent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto pr-1">
                  <PageCommentsSidebar />
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Dialogs - Create Pathway */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Pathway</DialogTitle>
            <DialogDescription>Define a new pathway by specifying each step in the value chain.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Feedstock *</Label>
              <Input value={newPathway.feedstock} onChange={(e) => setNewPathway({...newPathway, feedstock: e.target.value})} placeholder="e.g., Corn Cobs" />
            </div>
            <div className="space-y-2">
              <Label>Technology *</Label>
              <Input value={newPathway.technology} onChange={(e) => setNewPathway({...newPathway, technology: e.target.value})} placeholder="e.g., Acid Hydrolysis" />
            </div>
            <div className="space-y-2">
              <Label>Product *</Label>
              <Input value={newPathway.product} onChange={(e) => setNewPathway({...newPathway, product: e.target.value})} placeholder="e.g., Xylose" />
            </div>
            <div className="space-y-2">
              <Label>Application *</Label>
              <Input value={newPathway.application} onChange={(e) => setNewPathway({...newPathway, application: e.target.value})} placeholder="e.g., Food Sweetener" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePathway}>Create Pathway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save to Project Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{isAddingToExisting ? "Add to Project" : "Create New Project"}</DialogTitle>
            <DialogDescription>
              {isAddingToExisting ? "Select a project to add your pathways to." : "Create a new project to organize your pathways."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="flex rounded-lg bg-muted p-1">
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${isAddingToExisting ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setIsAddingToExisting(true)}
              >
                <FolderKanban className="w-4 h-4 inline-block mr-2" />
                Existing Project
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${!isAddingToExisting ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setIsAddingToExisting(false)}
              >
                <Plus className="w-4 h-4 inline-block mr-2" />
                New Project
              </button>
            </div>

            {isAddingToExisting ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Choose a project</Label>
                {existingProjects.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <FolderKanban className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">No projects yet</p>
                    <Button size="sm" variant="outline" onClick={() => setIsAddingToExisting(false)}>
                      <Plus className="w-3 h-3 mr-1" />
                      Create your first project
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {existingProjects.map(project => (
                      <div
                        key={project.id}
                        onClick={() => setSelectedProjectId(project.id)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedProjectId === project.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
                        }`}
                      >
                        <div className="text-sm font-medium text-foreground">{project.name}</div>
                        <div className="text-xs text-muted-foreground">{project.pathways.length} pathways</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Project Name *</Label>
                  <Input value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} placeholder="e.g., Xylose Valorisation Study" />
                </div>
                <div className="space-y-2">
                  <Label>Project Owner *</Label>
                  <Input value={newProject.owner} onChange={(e) => setNewProject({...newProject, owner: e.target.value})} placeholder="e.g., John Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Project Goal *</Label>
                  <textarea
                    value={newProject.goal}
                    onChange={(e) => setNewProject({...newProject, goal: e.target.value})}
                    placeholder="e.g., Explore commercial pathways for xylose conversion..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>
              </div>
            )}

            {savedPathways.size > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Pathways to add</Label>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{savedPathways.size} selected</span>
                </div>
                <div className="bg-muted rounded-lg p-3 text-sm max-h-28 overflow-y-auto">
                  {Array.from(savedPathways).map((idx) => {
                    const pathway = allPathways[idx];
                    return (
                      <div key={idx} className="py-1.5 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2">
                          <Bookmark className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="text-xs truncate">{pathway ? `${pathway.feedstock} → ${pathway.product}` : `Pathway ${idx + 1}`}</span>
                        </div>
                        {shortlistNotes[idx] && (
                          <p className="text-[10px] text-muted-foreground ml-5.5 mt-0.5 italic leading-snug">"{shortlistNotes[idx]}"</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                const pathwayDetails = Array.from(savedPathways).map((idx) => {
                  const pathway = allPathways[idx];
                  return { index: idx, feedstock: pathway?.feedstock || '', technology: pathway?.technology || '', product: pathway?.product || '', application: pathway?.application || '', trl: pathway?.trl || '', topic: decodedTopic };
                });

                if (isAddingToExisting) {
                  if (!selectedProjectId) {
                    toast({ title: "Select a Project", description: "Please select a project.", variant: "destructive" });
                    return;
                  }
                  const project = existingProjects.find(p => p.id === selectedProjectId);
                  if (!project) return;
                  const { error } = await supabase.from('projects').update({ pathways: [...project.pathways, ...pathwayDetails] }).eq('id', selectedProjectId);
                  if (error) { toast({ title: "Error", description: "Failed to add pathways.", variant: "destructive" }); return; }
                  toast({ title: "Pathways Added", description: `${savedPathways.size} pathway(s) added to "${project.name}".` });
                } else {
                  const { error } = await supabase.from('projects').insert({ name: newProject.name, owner: newProject.owner, goal: newProject.goal, pathways: pathwayDetails, topic: decodedTopic, category: category });
                  if (error) { toast({ title: "Error", description: "Failed to create project.", variant: "destructive" }); return; }
                  toast({ title: "Project Created", description: `Project "${newProject.name}" created with ${savedPathways.size} pathway(s).` });
                  setNewProject({ name: '', owner: '', goal: '' });
                }
                setIsProjectDialogOpen(false);
                setSelectedProjectId("");
              }}
              disabled={isAddingToExisting ? !selectedProjectId : (!newProject.name || !newProject.owner || !newProject.goal)}
            >
              {isAddingToExisting ? "Add Pathways" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pathway</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Shortlist Note Dialog */}
      <Dialog open={shortlistDialogOpen} onOpenChange={(open) => { if (!open) { setShortlistDialogOpen(false); setShortlistDialogIndex(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Shortlist Pathway</DialogTitle>
            <DialogDescription className="text-xs">
              {shortlistDialogIndex !== null && allPathways[shortlistDialogIndex] && (
                <span className="font-medium text-foreground">
                  {allPathways[shortlistDialogIndex].feedstock} → {allPathways[shortlistDialogIndex].product}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Why are you shortlisting this pathway? <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              value={shortlistDialogNote}
              onChange={(e) => setShortlistDialogNote(e.target.value)}
              placeholder="e.g. Strong commercial potential, aligns with our feedstock strategy..."
              className="text-xs min-h-[80px] resize-none"
              maxLength={500}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) { e.preventDefault(); confirmShortlist(); } }}
            />
            <p className="text-[9px] text-muted-foreground text-right">{shortlistDialogNote.length}/500</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShortlistDialogOpen(false); setShortlistDialogIndex(null); }}>Cancel</Button>
            <Button size="sm" onClick={confirmShortlist}>
              <Bookmark className="w-3 h-3 mr-1" />
              Shortlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default ValueChainPathways;