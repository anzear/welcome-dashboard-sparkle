import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, RefreshCw, Euro, Users, ExternalLink, Calendar, Building2, X, Settings2, MapPin, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Partner {
  name: string;
  country: string;
  type: string;
}

interface Project {
  id: number;
  title: string;
  acronym: string;
  funding: number;
  partners: number;
  startDate: string;
  endDate: string;
  status: string;
  source: string;
  country: string;
  coordinator: string;
  overview: string;
  partnerList: Partner[];
}

// Compute a relevance score for ranking (higher = better)
const computeScore = (p: Project): number => {
  let score = 0;
  score += p.status === 'Active' ? 30 : 0;
  score += p.funding * 3;
  score += p.partners * 1.5;
  // Prefer Horizon Europe / BBI-JU
  if (p.source === 'Horizon Europe') score += 10;
  if (p.source === 'BBI-JU') score += 15;
  return score;
};

const mockProjects: Project[] = [
  {
    id: 1,
    title: "Production of functional innovative ingredients from paper and agro-food side-streams through sustainable and efficient tailor-made biotechnological processes for food, feed, pharma and cosmetics",
    acronym: "INGREEN",
    funding: 8.78,
    partners: 17,
    startDate: "01/01/2020",
    endDate: "30/06/2024",
    status: "Completed",
    source: "Horizon 2020",
    country: "Italy",
    coordinator: "Università degli Studi di Milano",
    overview: "INGREEN aims to develop sustainable biotechnological processes for the production of functional innovative ingredients from paper and agro-food side-streams. The project focuses on tailor-made enzymatic and microbial conversion processes to transform lignocellulosic and agro-food residues into high-value compounds for food, feed, pharmaceutical and cosmetic applications. Through an integrated biorefinery approach, INGREEN will demonstrate the technical and economic viability of converting waste streams into functional ingredients such as oligosaccharides, organic acids, and bioactive peptides. The consortium brings together academic partners, technology providers, and end-users across Europe to validate the processes at pilot scale and assess market potential.",
    partnerList: [
      { name: "UNIVERSITÀ DEGLI STUDI DI MILANO", country: "Italy", type: "Large Enterprise" },
      { name: "NOVAMONT SPA", country: "Italy", type: "Large Enterprise" },
      { name: "BIOPOLIS SL", country: "Spain", type: "SME" },
      { name: "WAGENINGEN UNIVERSITY", country: "Netherlands", type: "Research" },
      { name: "FRAUNHOFER GESELLSCHAFT", country: "Germany", type: "Research" },
      { name: "SMURFIT KAPPA GROUP", country: "Ireland", type: "Large Enterprise" },
      { name: "TECNOALIMENTI S.C.P.A.", country: "Italy", type: "SME" },
      { name: "VTT TECHNICAL RESEARCH CENTRE", country: "Finland", type: "Research" },
      { name: "AINIA CENTRO TECNOLÓGICO", country: "Spain", type: "Research" },
      { name: "UNIVERSITAT AUTÒNOMA DE BARCELONA", country: "Spain", type: "Research" },
      { name: "CLEA TECHNOLOGIES BV", country: "Netherlands", type: "SME" },
      { name: "BIOTREND SA", country: "Portugal", type: "SME" },
      { name: "GIVAUDAN SA", country: "Switzerland", type: "Large Enterprise" },
      { name: "DSM-FIRMENICH AG", country: "Netherlands", type: "Large Enterprise" },
      { name: "LUND UNIVERSITY", country: "Sweden", type: "Research" },
      { name: "NATUREX SA", country: "France", type: "Large Enterprise" },
      { name: "TECHNISCHE UNIVERSITÄT WIEN", country: "Austria", type: "Research" },
    ],
  },
  {
    id: 2,
    title: "Value chains for disruptive transformation of urban biowaste into biobased products in the city context",
    acronym: "WaysTUP!",
    funding: 11.76,
    partners: 29,
    startDate: "01/09/2019",
    endDate: "31/08/2023",
    status: "Completed",
    source: "Horizon 2020",
    country: "Spain",
    coordinator: "Universitat Autònoma de Barcelona",
    overview: "WaysTUP! aims to demonstrate the establishment of new value chains for urban biowaste utilisation to produce higher value purpose products (i.e. biobased products, including food and feed ingredients), through a multi-stakeholder approach in line with circular economy. The project will showcase a portfolio of new urban biowaste to biobased products' processes starting from different feedstocks i.e. fish and meat waste, spent coffee grounds, household source separated biowaste, used cooking oils, cellulosic waste derived from municipal wastewater and waste treatment plants and sewage sludge. Pilot demonstration will take place in several European cities i.e. Valencia (Spain), London (UK), Alicante (Spain), Prague (Czech Republic), Athens (Greece), L'Alcdia (Spain), Terni (Italy) and Crete (Greece). The processes will result in the production of food and feed additives, flavours, insect protein, coffee oil, bioethanol, biosolvents, polyxydroxyalkanoates, ethyl lactate, long chain dicarboxylic acid, bioplastics and biochar.",
    partnerList: [
      { name: "SOCIEDAD ANONIMA AGRICULTORES DE LAVEGA DE VALENCIA", country: "Spain", type: "Large Enterprise" },
      { name: "BIOPOLIS SL", country: "Spain", type: "SME" },
      { name: "NOVAMONT SPA", country: "Italy", type: "Large Enterprise" },
      { name: "METSA TISSUE OYI", country: "Finland", type: "Large Enterprise" },
      { name: "NUTRITION SCIENCES", country: "Belgium", type: "Large Enterprise" },
      { name: "ADM WILD VALENCIA, SA", country: "Spain", type: "Large Enterprise" },
      { name: "TERRA I XUFA SOCIEDAD LIMITADA", country: "Spain", type: "SME" },
      { name: "HAYAT KIMYA SANAYI ANONIM SIRKETI", country: "Turkey", type: "Large Enterprise" },
      { name: "BIOFLYTECH SL", country: "Spain", type: "SME" },
      { name: "UNIVERSITAT AUTÒNOMA DE BARCELONA", country: "Spain", type: "Research" },
      { name: "ARISTOTELIO PANEPISTIMIO THESSALONIKIS", country: "Greece", type: "Research" },
      { name: "IMPERIAL COLLEGE LONDON", country: "United Kingdom", type: "Research" },
      { name: "TECHNISCHE UNIVERSITÄT MÜNCHEN", country: "Germany", type: "Research" },
      { name: "VYSOKA SKOLA CHEMICKO-TECHNOLOGICKA V PRAZE", country: "Czech Republic", type: "Research" },
      { name: "CENTRO NACIONAL DE TECNOLOGÍA Y SEGURIDAD ALIMENTARIA", country: "Spain", type: "Research" },
      { name: "FUNDACIÓN CEAM", country: "Spain", type: "Research" },
      { name: "AITEX TEXTIL RESEARCH INSTITUTE", country: "Spain", type: "Research" },
      { name: "INGELIA SL", country: "Spain", type: "SME" },
      { name: "BIOSTART SRL", country: "Italy", type: "SME" },
      { name: "FERTINAGRO BIOTECH SL", country: "Spain", type: "SME" },
      { name: "EXELISIS SA", country: "Greece", type: "SME" },
      { name: "EUROQUALITY SARL", country: "France", type: "SME" },
      { name: "MUNICIPALITY OF ATHENS", country: "Greece", type: "Public Body" },
      { name: "AYUNTAMIENTO DE VALENCIA", country: "Spain", type: "Public Body" },
      { name: "LONDON BOROUGH OF CAMDEN", country: "United Kingdom", type: "Public Body" },
      { name: "PRAGUE CITY HALL", country: "Czech Republic", type: "Public Body" },
      { name: "REGION OF CRETE", country: "Greece", type: "Public Body" },
      { name: "TERNI MUNICIPALITY", country: "Italy", type: "Public Body" },
      { name: "ALCUDIA DE CRESPINS", country: "Spain", type: "Public Body" },
    ],
  },
  {
    id: 3,
    title: "Integrated bio-refinery for conversion of agricultural residues to lactic acid and downstream PLA production",
    acronym: "BioLACTIA",
    funding: 5.42,
    partners: 12,
    startDate: "01/03/2022",
    endDate: "28/02/2026",
    status: "Active",
    source: "Horizon Europe",
    country: "Germany",
    coordinator: "Fraunhofer Institute for Interfacial Engineering",
    overview: "BioLACTIA addresses the challenge of establishing economically viable and environmentally sustainable production of lactic acid from agricultural residues. The project develops an integrated biorefinery concept combining advanced pretreatment, enzymatic hydrolysis, and fermentation to produce high-purity L-lactic acid suitable for PLA polymerisation. Key innovations include novel thermotolerant microbial strains, continuous in-situ product recovery, and process intensification through membrane bioreactors. The consortium will demonstrate the full value chain from field residue collection to PLA pellet production at pilot scale.",
    partnerList: [
      { name: "FRAUNHOFER INSTITUTE FOR INTERFACIAL ENGINEERING", country: "Germany", type: "Research" },
      { name: "TOTAL CORBION PLA BV", country: "Netherlands", type: "Large Enterprise" },
      { name: "CLARIANT AG", country: "Switzerland", type: "Large Enterprise" },
      { name: "NOVA-INSTITUT GMBH", country: "Germany", type: "SME" },
      { name: "CHALMERS TEKNISKA HÖGSKOLA", country: "Sweden", type: "Research" },
      { name: "POLITECNICO DI TORINO", country: "Italy", type: "Research" },
      { name: "BIOÖKONOMIE CLUSTER GMBH", country: "Germany", type: "SME" },
      { name: "SÜDZUCKER AG", country: "Germany", type: "Large Enterprise" },
      { name: "INRAE", country: "France", type: "Research" },
      { name: "UNIVERSITY OF YORK", country: "United Kingdom", type: "Research" },
      { name: "PROCESSUM AB", country: "Sweden", type: "SME" },
      { name: "AGROENERGIE SRL", country: "Italy", type: "SME" },
    ],
  },
  {
    id: 4,
    title: "Sustainable lactic acid production from lignocellulosic biomass via consolidated bioprocessing",
    acronym: "LACTOBIO",
    funding: 3.95,
    partners: 8,
    startDate: "01/01/2023",
    endDate: "31/12/2026",
    status: "Active",
    source: "Horizon Europe",
    country: "Netherlands",
    coordinator: "Wageningen University & Research",
    overview: "LACTOBIO develops a consolidated bioprocessing (CBP) approach for direct conversion of lignocellulosic biomass to lactic acid, eliminating the need for separate enzymatic hydrolysis steps. The project engineers novel microbial cell factories capable of producing cellulolytic enzymes and fermenting both C5 and C6 sugars to optically pure L-lactic acid in a single reactor. Through metabolic engineering, adaptive laboratory evolution, and process optimisation, LACTOBIO aims to reduce production costs by 40% compared to conventional two-step processes.",
    partnerList: [
      { name: "WAGENINGEN UNIVERSITY & RESEARCH", country: "Netherlands", type: "Research" },
      { name: "DSM-FIRMENICH AG", country: "Netherlands", type: "Large Enterprise" },
      { name: "TECHNICAL UNIVERSITY OF DENMARK", country: "Denmark", type: "Research" },
      { name: "UNIVERSITY OF NOTTINGHAM", country: "United Kingdom", type: "Research" },
      { name: "CORBION NV", country: "Netherlands", type: "Large Enterprise" },
      { name: "NOVAMONT SPA", country: "Italy", type: "Large Enterprise" },
      { name: "GREEN BIOLOGICS LTD", country: "United Kingdom", type: "SME" },
      { name: "BIOBASE EUROPE PILOT PLANT", country: "Belgium", type: "Research" },
    ],
  },
  {
    id: 5,
    title: "Novel enzyme cocktails for enhanced saccharification and fermentation of second-generation feedstocks",
    acronym: "ENZYFERM",
    funding: 6.20,
    partners: 14,
    startDate: "01/09/2021",
    endDate: "31/08/2025",
    status: "Active",
    source: "Horizon Europe",
    country: "Denmark",
    coordinator: "Novozymes A/S",
    overview: "ENZYFERM develops next-generation enzyme cocktails specifically optimised for the saccharification of diverse second-generation feedstocks including wheat straw, corn stover, and hardwood. The project combines computational enzyme design, directed evolution, and high-throughput screening to create synergistic enzyme mixtures that achieve higher sugar yields at lower enzyme loadings. Integration with simultaneous saccharification and fermentation (SSF) processes will be demonstrated for lactic acid production at pilot scale across three European demonstration sites.",
    partnerList: [
      { name: "NOVOZYMES A/S", country: "Denmark", type: "Large Enterprise" },
      { name: "TECHNICAL UNIVERSITY OF DENMARK", country: "Denmark", type: "Research" },
      { name: "ETH ZÜRICH", country: "Switzerland", type: "Research" },
      { name: "UNIVERSITY OF CAMBRIDGE", country: "United Kingdom", type: "Research" },
      { name: "INRAE", country: "France", type: "Research" },
      { name: "CLARIANT AG", country: "Switzerland", type: "Large Enterprise" },
      { name: "IFP ENERGIES NOUVELLES", country: "France", type: "Research" },
      { name: "BETA RENEWABLES SPA", country: "Italy", type: "Large Enterprise" },
      { name: "BORREGAARD ASA", country: "Norway", type: "Large Enterprise" },
      { name: "GENENCOR INTERNATIONAL BV", country: "Netherlands", type: "Large Enterprise" },
      { name: "RISE RESEARCH INSTITUTES OF SWEDEN", country: "Sweden", type: "Research" },
      { name: "METGEN OY", country: "Finland", type: "SME" },
      { name: "DIREVO INDUSTRIAL BIOTECHNOLOGY GMBH", country: "Germany", type: "SME" },
      { name: "C5 LIGNO TECHNOLOGIES", country: "Denmark", type: "SME" },
    ],
  },
  {
    id: 6,
    title: "Circular bioeconomy pilot plant for PLA packaging from agricultural waste streams",
    acronym: "CircPLA",
    funding: 9.30,
    partners: 21,
    startDate: "01/06/2022",
    endDate: "31/05/2026",
    status: "Active",
    source: "Horizon Europe",
    country: "France",
    coordinator: "INRAE",
    overview: "CircPLA establishes a circular bioeconomy pilot plant demonstrating the full chain from agricultural waste collection to PLA-based packaging production. The project integrates decentralised feedstock preprocessing, centralised lactic acid fermentation, and PLA polymerisation with end-of-life composting and chemical recycling loops. Life cycle assessment and techno-economic analysis guide process optimisation to achieve carbon-negative packaging solutions competitive with fossil-based alternatives.",
    partnerList: [
      { name: "INRAE", country: "France", type: "Research" },
      { name: "TOTAL CORBION PLA BV", country: "Netherlands", type: "Large Enterprise" },
      { name: "NOVAMONT SPA", country: "Italy", type: "Large Enterprise" },
      { name: "TEREOS SA", country: "France", type: "Large Enterprise" },
      { name: "SUEZ ENVIRONNEMENT", country: "France", type: "Large Enterprise" },
      { name: "SAPPI LIMITED", country: "South Africa", type: "Large Enterprise" },
      { name: "NATUREWORKS LLC", country: "United States", type: "Large Enterprise" },
      { name: "WAGENINGEN UNIVERSITY", country: "Netherlands", type: "Research" },
      { name: "UNIVERSITÄT STUTTGART", country: "Germany", type: "Research" },
      { name: "POLITECNICO DI MILANO", country: "Italy", type: "Research" },
      { name: "AGROPARISTECH", country: "France", type: "Research" },
      { name: "TNO", country: "Netherlands", type: "Research" },
      { name: "CREMENT SAS", country: "France", type: "SME" },
      { name: "BIOME TECHNOLOGIES PLC", country: "United Kingdom", type: "SME" },
      { name: "LACTIPS SAS", country: "France", type: "SME" },
      { name: "CARBIOLICE SAS", country: "France", type: "SME" },
      { name: "ERCROS SA", country: "Spain", type: "Large Enterprise" },
      { name: "ARKEMA SA", country: "France", type: "Large Enterprise" },
      { name: "SULZER CHEMTECH AG", country: "Switzerland", type: "Large Enterprise" },
      { name: "BIO-MI DOO", country: "Croatia", type: "SME" },
      { name: "EUROPEAN BIOPLASTICS EV", country: "Germany", type: "Association" },
    ],
  },
  {
    id: 7,
    title: "High-purity lactic acid extraction using membrane-integrated continuous fermentation",
    acronym: "PURELACT",
    funding: 2.85,
    partners: 6,
    startDate: "01/04/2023",
    endDate: "31/03/2026",
    status: "Active",
    source: "Horizon Europe",
    country: "Finland",
    coordinator: "VTT Technical Research Centre of Finland",
    overview: "PURELACT develops an innovative membrane-integrated continuous fermentation process for high-purity lactic acid production. By coupling in-situ electrodialysis with bipolar membranes to continuous fermentation, the project eliminates the need for gypsum-generating neutralisation steps and reduces downstream purification costs. The technology targets optical purity >99.5% for polymer-grade lactic acid at significantly reduced energy consumption and wastewater generation.",
    partnerList: [
      { name: "VTT TECHNICAL RESEARCH CENTRE OF FINLAND", country: "Finland", type: "Research" },
      { name: "AALTO UNIVERSITY", country: "Finland", type: "Research" },
      { name: "FUTERRO SA", country: "Belgium", type: "Large Enterprise" },
      { name: "MEMBRANE INNOVATION BV", country: "Netherlands", type: "SME" },
      { name: "LUND UNIVERSITY", country: "Sweden", type: "Research" },
      { name: "KEMIRA OYJ", country: "Finland", type: "Large Enterprise" },
    ],
  },
  {
    id: 8,
    title: "Demonstration of industrial-scale D-lactic acid production for stereocomplex PLA applications",
    acronym: "D-LACTO",
    funding: 14.50,
    partners: 18,
    startDate: "01/01/2021",
    endDate: "30/06/2025",
    status: "Active",
    source: "BBI-JU",
    country: "Belgium",
    coordinator: "Galactic S.A.",
    overview: "D-LACTO demonstrates the industrial-scale production of D-lactic acid, enabling the manufacture of stereocomplex PLA with superior thermal and mechanical properties. The project scales up an engineered microbial strain for D-lactic acid fermentation from pilot to demonstration plant (10,000 tonnes/year). Key innovations include a proprietary purification train achieving >99.9% optical purity and a continuous polymerisation process for stereocomplex PLA blends targeting automotive and electronics applications.",
    partnerList: [
      { name: "GALACTIC SA", country: "Belgium", type: "Large Enterprise" },
      { name: "TOTAL CORBION PLA BV", country: "Netherlands", type: "Large Enterprise" },
      { name: "PURAC BIOCHEM BV", country: "Netherlands", type: "Large Enterprise" },
      { name: "SULZER CHEMTECH AG", country: "Switzerland", type: "Large Enterprise" },
      { name: "UNIVERSITY OF GHENT", country: "Belgium", type: "Research" },
      { name: "KU LEUVEN", country: "Belgium", type: "Research" },
      { name: "RWTH AACHEN UNIVERSITY", country: "Germany", type: "Research" },
      { name: "FRAUNHOFER ICT", country: "Germany", type: "Research" },
      { name: "TOYOTA MOTOR EUROPE NV", country: "Belgium", type: "Large Enterprise" },
      { name: "FAURECIA CLEAN MOBILITY", country: "France", type: "Large Enterprise" },
      { name: "SCHNEIDER ELECTRIC SE", country: "France", type: "Large Enterprise" },
      { name: "SYNBRA TECHNOLOGY BV", country: "Netherlands", type: "Large Enterprise" },
      { name: "PLAXICA LTD", country: "United Kingdom", type: "SME" },
      { name: "NATUREPLAST SAS", country: "France", type: "SME" },
      { name: "BIO-FED GMBH", country: "Germany", type: "SME" },
      { name: "BIOBASE EUROPE PILOT PLANT", country: "Belgium", type: "Research" },
      { name: "NOVA-INSTITUT GMBH", country: "Germany", type: "SME" },
      { name: "EUROPEAN BIOPLASTICS EV", country: "Germany", type: "Association" },
    ],
  },
  {
    id: 9,
    title: "Waste-to-lactic-acid biorefinery integrating anaerobic digestion and microbial conversion",
    acronym: "W2LA",
    funding: 4.10,
    partners: 9,
    startDate: "01/10/2022",
    endDate: "30/09/2025",
    status: "Active",
    source: "Horizon Europe",
    country: "Sweden",
    coordinator: "Lund University",
    overview: "W2LA develops an innovative two-stage biorefinery integrating anaerobic digestion with microbial lactic acid production from organic waste streams. The first stage produces volatile fatty acids (VFAs) from mixed organic waste via anaerobic fermentation, while the second stage converts these VFAs to lactic acid using engineered Bacillus coagulans strains. This approach valorises low-quality waste streams that are difficult to process via conventional sugar-platform routes.",
    partnerList: [
      { name: "LUND UNIVERSITY", country: "Sweden", type: "Research" },
      { name: "RISE RESEARCH INSTITUTES OF SWEDEN", country: "Sweden", type: "Research" },
      { name: "AALBORG UNIVERSITY", country: "Denmark", type: "Research" },
      { name: "UNIVERSITY OF BATH", country: "United Kingdom", type: "Research" },
      { name: "SCANDINAVIAN BIOGAS AB", country: "Sweden", type: "Large Enterprise" },
      { name: "VEOLIA ENVIRONNEMENT SA", country: "France", type: "Large Enterprise" },
      { name: "AFYREN SA", country: "France", type: "SME" },
      { name: "BIOPLASTECH LTD", country: "Ireland", type: "SME" },
      { name: "MUNICIPAL WASTE EUROPE", country: "Belgium", type: "Association" },
    ],
  },
  {
    id: 10,
    title: "Techno-economic assessment of bio-based lactic acid supply chains across European regions",
    acronym: "TEA-LACT",
    funding: 1.95,
    partners: 5,
    startDate: "01/07/2023",
    endDate: "31/12/2025",
    status: "Active",
    source: "Horizon Europe",
    country: "Austria",
    coordinator: "Technische Universität Wien",
    overview: "TEA-LACT conducts comprehensive techno-economic and life cycle assessments of bio-based lactic acid supply chains across diverse European agricultural regions. The project models different feedstock-process-product combinations to identify optimal configurations considering regional biomass availability, logistics costs, and market proximity. Results feed into a decision-support tool for investors and policymakers to guide strategic investments in European lactic acid biorefinery infrastructure.",
    partnerList: [
      { name: "TECHNISCHE UNIVERSITÄT WIEN", country: "Austria", type: "Research" },
      { name: "NOVA-INSTITUT GMBH", country: "Germany", type: "SME" },
      { name: "CHALMERS TEKNISKA HÖGSKOLA", country: "Sweden", type: "Research" },
      { name: "BOKU VIENNA", country: "Austria", type: "Research" },
      { name: "JRC EUROPEAN COMMISSION", country: "Belgium", type: "Public Body" },
    ],
  },
  {
    id: 11,
    title: "Optimised microbial cell factories for optically pure L-lactic acid from C5 and C6 sugars",
    acronym: "OptiLACT",
    funding: 3.60,
    partners: 7,
    startDate: "01/06/2020",
    endDate: "31/05/2024",
    status: "Completed",
    source: "Horizon 2020",
    country: "United Kingdom",
    coordinator: "University of Nottingham",
    overview: "OptiLACT engineers microbial cell factories for the efficient co-utilisation of C5 (xylose, arabinose) and C6 (glucose) sugars derived from lignocellulosic biomass hydrolysates. Through rational metabolic engineering and systems biology approaches, the project eliminates carbon catabolite repression in Lactobacillus strains, enabling simultaneous sugar consumption and high lactic acid titres. The optimised strains achieve >95% theoretical yield and >99.5% optical purity of L-lactic acid from real biomass hydrolysates.",
    partnerList: [
      { name: "UNIVERSITY OF NOTTINGHAM", country: "United Kingdom", type: "Research" },
      { name: "TECHNICAL UNIVERSITY OF DENMARK", country: "Denmark", type: "Research" },
      { name: "WAGENINGEN UNIVERSITY", country: "Netherlands", type: "Research" },
      { name: "CORBION NV", country: "Netherlands", type: "Large Enterprise" },
      { name: "GREEN BIOLOGICS LTD", country: "United Kingdom", type: "SME" },
      { name: "BIOCATALYSTS LTD", country: "United Kingdom", type: "SME" },
      { name: "UNIVERSITÄT GREIFSWALD", country: "Germany", type: "Research" },
    ],
  },
  {
    id: 12,
    title: "Green chemistry routes to polylactic acid composites with enhanced barrier properties",
    acronym: "GreenPLA+",
    funding: 7.80,
    partners: 16,
    startDate: "01/03/2021",
    endDate: "28/02/2025",
    status: "Active",
    source: "BBI-JU",
    country: "Italy",
    coordinator: "Novamont S.p.A.",
    overview: "GreenPLA+ develops green chemistry routes to produce PLA-based composite materials with enhanced gas barrier and mechanical properties for food packaging applications. The project combines reactive extrusion, nanocellulose reinforcement, and bio-based coating technologies to create multilayer PLA packaging that matches the performance of conventional fossil-based materials while remaining fully compostable. Industrial-scale demonstration includes production of modified-atmosphere packaging for fresh produce and dairy products.",
    partnerList: [
      { name: "NOVAMONT SPA", country: "Italy", type: "Large Enterprise" },
      { name: "TOTAL CORBION PLA BV", country: "Netherlands", type: "Large Enterprise" },
      { name: "SAPPI LIMITED", country: "South Africa", type: "Large Enterprise" },
      { name: "TAGHLEEF INDUSTRIES SPA", country: "Italy", type: "Large Enterprise" },
      { name: "POLITECNICO DI TORINO", country: "Italy", type: "Research" },
      { name: "KTH ROYAL INSTITUTE OF TECHNOLOGY", country: "Sweden", type: "Research" },
      { name: "UNIVERSITY OF BOLOGNA", country: "Italy", type: "Research" },
      { name: "CNRS", country: "France", type: "Research" },
      { name: "VTT TECHNICAL RESEARCH CENTRE", country: "Finland", type: "Research" },
      { name: "BIO-MI DOO", country: "Croatia", type: "SME" },
      { name: "CELABOR SCRL", country: "Belgium", type: "SME" },
      { name: "CREMENT SAS", country: "France", type: "SME" },
      { name: "SUKANO AG", country: "Switzerland", type: "SME" },
      { name: "European BIOPLASTICS EV", country: "Germany", type: "Association" },
      { name: "DANONE SA", country: "France", type: "Large Enterprise" },
      { name: "LIDL STIFTUNG & CO KG", country: "Germany", type: "Large Enterprise" },
    ],
  },
  {
    id: 13,
    title: "AI-driven bioprocess optimisation for lactic acid fermentation at pilot scale",
    acronym: "AI-FERM",
    funding: 2.40,
    partners: 4,
    startDate: "01/01/2024",
    endDate: "30/06/2027",
    status: "Active",
    source: "Horizon Europe",
    country: "Germany",
    coordinator: "RWTH Aachen University",
    overview: "AI-FERM applies machine learning and digital twin technologies to optimise lactic acid fermentation processes in real time. The project develops physics-informed neural network models trained on pilot-scale fermentation data to predict and control process parameters for maximum productivity and product quality. An automated feedback control system adjusts feeding strategies, pH, temperature, and aeration based on soft-sensor predictions, achieving 15-25% improvements in volumetric productivity compared to conventional control approaches.",
    partnerList: [
      { name: "RWTH AACHEN UNIVERSITY", country: "Germany", type: "Research" },
      { name: "SIEMENS AG", country: "Germany", type: "Large Enterprise" },
      { name: "EVONIK INDUSTRIES AG", country: "Germany", type: "Large Enterprise" },
      { name: "HELMHOLTZ CENTRE FOR INFECTION RESEARCH", country: "Germany", type: "Research" },
    ],
  },
  {
    id: 14,
    title: "Marine biomass valorisation for lactic acid and bioplastics via seaweed biorefinery",
    acronym: "SeaLACT",
    funding: 5.15,
    partners: 11,
    startDate: "01/09/2023",
    endDate: "31/08/2027",
    status: "Active",
    source: "Horizon Europe",
    country: "Norway",
    coordinator: "SINTEF Ocean",
    overview: "SeaLACT develops a marine biorefinery concept for the production of lactic acid from cultivated seaweed biomass. The project addresses the entire value chain from sustainable seaweed aquaculture, through biomass fractionation and hydrolysis, to fermentative lactic acid production and PLA synthesis. Novel aspects include the use of seaweed-derived sugars (mannitol, laminarin) as fermentation substrates and the valorisation of co-products including alginate, fucoidan, and mineral-rich residues for agriculture.",
    partnerList: [
      { name: "SINTEF OCEAN", country: "Norway", type: "Research" },
      { name: "NTNU", country: "Norway", type: "Research" },
      { name: "UNIVERSITY OF THE HIGHLANDS AND ISLANDS", country: "United Kingdom", type: "Research" },
      { name: "WAGENINGEN UNIVERSITY", country: "Netherlands", type: "Research" },
      { name: "SEAWEED SOLUTIONS AS", country: "Norway", type: "SME" },
      { name: "ALGAIA SA", country: "France", type: "SME" },
      { name: "CARGILL INC", country: "United States", type: "Large Enterprise" },
      { name: "TOTAL CORBION PLA BV", country: "Netherlands", type: "Large Enterprise" },
      { name: "IRISH SEAWEED CONSULTANCY", country: "Ireland", type: "SME" },
      { name: "LEBESGUE SAS", country: "France", type: "SME" },
      { name: "EUROPEAN ALGAE BIOMASS ASSOCIATION", country: "Italy", type: "Association" },
    ],
  },
  {
    id: 15,
    title: "Scale-up of electrochemical lactic acid recovery from fermentation broth",
    acronym: "E-LACT",
    funding: 3.25,
    partners: 8,
    startDate: "01/11/2022",
    endDate: "31/10/2025",
    status: "Active",
    source: "Horizon Europe",
    country: "Netherlands",
    coordinator: "Delft University of Technology",
    overview: "E-LACT scales up an electrochemical process for direct recovery of lactic acid from fermentation broth, replacing conventional calcium lactate crystallisation and acidification steps. The technology uses bipolar membrane electrodialysis (BMED) to simultaneously acidify lactate and regenerate the base used for pH control during fermentation. At pilot scale (1 m³/h), the process demonstrates 90% lactate recovery, >99% purity, and 60% reduction in chemical consumption compared to the gypsum process.",
    partnerList: [
      { name: "DELFT UNIVERSITY OF TECHNOLOGY", country: "Netherlands", type: "Research" },
      { name: "UNIVERSITY OF TWENTE", country: "Netherlands", type: "Research" },
      { name: "FUJIFILM MANUFACTURING EUROPE BV", country: "Netherlands", type: "Large Enterprise" },
      { name: "CORBION NV", country: "Netherlands", type: "Large Enterprise" },
      { name: "EURODIA INDUSTRIE SA", country: "France", type: "Large Enterprise" },
      { name: "WETSUS", country: "Netherlands", type: "Research" },
      { name: "MEMBRANE POTENTIAL BV", country: "Netherlands", type: "SME" },
      { name: "PAQUES BV", country: "Netherlands", type: "SME" },
    ],
  },
];

const InnovationProjects = () => {
  const { pathwayId, category, topic } = useParams<{ pathwayId: string; category: string; topic: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const decodedTopic = decodeURIComponent(topic || "");

  const handleBack = () => {
    navigate(`/landscape/${category}/${topic}/value-chain/pathways/${pathwayId}`);
  };

  const filteredProjects = mockProjects.filter(p => {
    const matchesSearch = !searchTerm || 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.acronym.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.coordinator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesBudget = budgetFilter === 'all' 
      || (budgetFilter === '<1' && p.funding < 1) 
      || (budgetFilter === '1-5' && p.funding >= 1 && p.funding <= 5) 
      || (budgetFilter === '5-10' && p.funding > 5 && p.funding <= 10) 
      || (budgetFilter === '>10' && p.funding > 10);
    return matchesSearch && matchesStatus && matchesBudget;
  }).sort((a, b) => computeScore(b) - computeScore(a));

  

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
          <h1 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Pathway Innovation Projects: <span className="text-primary">Pathway {pathwayId} for {decodedTopic}</span>
          </h1>
        </div>

        <Card className="bg-card border border-border/60 shadow-sm flex-1 min-w-0 flex flex-col">
          <CardContent className="px-4 py-3 flex flex-col h-full">
            {/* Header */}
            <div className="mb-2 flex-shrink-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-xs font-semibold text-foreground">
                  Research & Innovation Projects ({filteredProjects.length})
                </h3>
              </div>
              <p className="text-[9px] text-muted-foreground">
                Discover Innovation & Research Projects related to this value chain. Access detailed project information, partnership data, funding details, and key outcomes.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-7 text-[10px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[110px] h-7 text-[10px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[10px]">All Status</SelectItem>
                  <SelectItem value="Active" className="text-[10px]">Active</SelectItem>
                  <SelectItem value="Completed" className="text-[10px]">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                <SelectTrigger className="w-[120px] h-7 text-[10px]">
                  <SelectValue placeholder="Budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[10px]">All Budgets</SelectItem>
                  <SelectItem value="<1" className="text-[10px]">&lt; €1M</SelectItem>
                  <SelectItem value="1-5" className="text-[10px]">€1M – €5M</SelectItem>
                  <SelectItem value="5-10" className="text-[10px]">€5M – €10M</SelectItem>
                  <SelectItem value=">10" className="text-[10px]">&gt; €10M</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 px-2.5">
                <RefreshCw className="w-3 h-3" />
                Refresh
              </Button>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto border border-border/40 rounded-lg">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/60 z-10 backdrop-blur-sm">
                  <tr className="border-b border-border">
                    <th className="text-center py-2 px-2 text-[8px] font-semibold uppercase tracking-widest text-muted-foreground w-10">#</th>
                    <th className="text-left py-2 px-3 text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">Project</th>
                    <th className="text-center py-2 px-2 text-[8px] font-semibold uppercase tracking-widest text-muted-foreground w-24">Acronym</th>
                    <th className="text-center py-2 px-2 text-[8px] font-semibold uppercase tracking-widest text-muted-foreground w-20">Status</th>
                    <th className="text-left py-2 px-2 text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">Coordinator</th>
                    <th className="text-right py-2 px-3 text-[8px] font-semibold uppercase tracking-widest text-muted-foreground w-24">Budget</th>
                    <th className="text-center py-2 px-2 text-[8px] font-semibold uppercase tracking-widest text-muted-foreground w-16">Partners</th>
                    <th className="text-left py-2 px-2 text-[8px] font-semibold uppercase tracking-widest text-muted-foreground w-24">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project, index) => {
                    const maxBudget = Math.max(...filteredProjects.map(p => p.funding));
                    const budgetPct = (project.funding / maxBudget) * 100;
                    return (
                      <tr
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className={`border-b border-border/20 hover:bg-primary/[0.03] cursor-pointer transition-colors group ${index % 2 === 0 ? 'bg-background' : 'bg-muted/15'}`}
                      >
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[9px] font-bold ${index < 3 ? 'bg-primary/15 text-primary border border-primary/20' : 'bg-muted/50 text-muted-foreground'}`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">{project.title}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <Badge variant="outline" className="text-[8px] px-1.5 py-0.5 font-mono font-semibold bg-muted/30">{project.acronym}</Badge>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <Badge variant="outline" className={`text-[8px] px-1.5 py-0.5 ${project.status === 'Active' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border'}`}>
                            {project.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                            <Building2 className="w-2.5 h-2.5 flex-shrink-0 text-muted-foreground/60" />
                            <span className="truncate max-w-[180px]">{project.coordinator}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] font-bold text-foreground">€{project.funding.toFixed(1)}M</span>
                            <div className="w-14 h-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary/40 rounded-full transition-all" style={{ width: `${budgetPct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <Users className="w-2.5 h-2.5 text-muted-foreground/50" />
                            <span className="text-[9px] font-semibold text-foreground">{project.partners}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <Badge variant="secondary" className="text-[8px] px-1.5 py-0.5 font-normal">{project.source}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredProjects.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No projects found matching your filters.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Detail Modal */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-[750px] max-h-[85vh] p-0 gap-0 overflow-hidden">
          {selectedProject && (
            <>
              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-border/60">
                <h2 className="text-base font-bold text-foreground leading-snug pr-8">
                  {selectedProject.title}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-semibold">
                    {selectedProject.acronym}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0.5 ${
                      selectedProject.status === 'Active'
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {selectedProject.status}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground">
                    {selectedProject.source}
                  </Badge>
                </div>
              </div>

              <ScrollArea className="flex-1 max-h-[calc(85vh-100px)]">
                <div className="px-6 py-5 space-y-5">
                  {/* Project Overview */}
                  <div className="bg-muted/30 border border-border/40 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings2 className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-bold text-foreground">Project Overview</h3>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {selectedProject.overview}
                    </p>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        Project Start Date
                      </div>
                      <p className="text-xs font-semibold text-foreground pl-5">{selectedProject.startDate}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5" />
                        Lead Partner
                      </div>
                      <p className="text-xs font-semibold text-foreground pl-5">{selectedProject.coordinator}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Euro className="w-3.5 h-3.5" />
                        Project Budget
                      </div>
                      <p className="text-xs font-semibold text-foreground pl-5">€{selectedProject.funding.toFixed(2)} Million</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        Project End Date
                      </div>
                      <p className="text-xs font-semibold text-foreground pl-5">{selectedProject.endDate}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        Number of Partners
                      </div>
                      <p className="text-xs font-semibold text-foreground pl-5">{selectedProject.partnerList.length}</p>
                    </div>
                  </div>

                  {/* View Project Button */}
                  <div className="flex justify-end">
                    <Button size="sm" className="gap-1.5 text-xs rounded-full px-5">
                      View Project
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Project Partners */}
                  <div className="border-t border-border/60 pt-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-bold text-foreground">Project Partners</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {selectedProject.partnerList.map((partner, idx) => (
                        <div
                          key={idx}
                          className="border border-border/60 rounded-lg p-3 bg-background hover:border-primary/30 transition-colors"
                        >
                          <h4 className="text-[10px] font-bold text-foreground mb-2 leading-snug">
                            {partner.name}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {partner.country}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                              <BarChart3 className="w-2.5 h-2.5" />
                              {partner.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InnovationProjects;
