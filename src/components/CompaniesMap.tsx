import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import mapEurope from '@/assets/europe-map.png';

interface Company {
  id: string;
  company_name: string;
  company_type: string;
  country: string;
  fit: number;
}

interface CompaniesMapProps {
  companies: Company[];
  savedCompanies?: Set<string>;
  useSavedView?: boolean;
  hoveredCompanyId?: string | null;
  onPinHover?: (companyId: string | null) => void;
}

// Direct (x%, y%) pixel-percent positions on the cropped mapswire Europe map.
// Calibrated against the actual map image for accuracy.
const countryPositions: Record<string, { x: number; y: number }> = {
  'Iceland': { x: 18, y: 32 },
  'Ireland': { x: 21.5, y: 59 },
  'United Kingdom': { x: 27, y: 59 },
  'Norway': { x: 41.5, y: 47 },
  'Sweden': { x: 47, y: 48 },
  'Finland': { x: 55, y: 46 },
  'Denmark': { x: 41.5, y: 56 },
  'Netherlands': { x: 36, y: 61 },
  'Belgium': { x: 36.8, y: 64.1 },
  'Luxembourg': { x: 36.5, y: 64 },
  'Germany': { x: 41, y: 62 },
  'France': { x: 31, y: 73 },
  'Spain': { x: 22, y: 82 },
  'Portugal': { x: 13, y: 84 },
  'Italy': { x: 43, y: 80 },
  'Switzerland': { x: 38.5, y: 73 },
  'Austria': { x: 48.1, y: 71.5 },
  'Czech Republic': { x: 48.5, y: 68 },
  'Czechia': { x: 48.5, y: 68 },
  'Poland': { x: 54.5, y: 63 },
  'Hungary': { x: 53, y: 73 },
  'Romania': { x: 59.5, y: 79 },
  'Bulgaria': { x: 57, y: 83 },
  'Greece': { x: 55.5, y: 90 },
  'Turkey': { x: 65, y: 88 },
  'Ukraine': { x: 62, y: 66 },
  'Estonia': { x: 57.5, y: 53 },
  'Latvia': { x: 57, y: 56 },
  'Lithuania': { x: 57, y: 59 },
  'Slovakia': { x: 52, y: 71 },
  'Slovenia': { x: 47, y: 76 },
  'Croatia': { x: 49, y: 78 },
};

// City-level offsets relative to the country position (in % units of the map)
const citiesPerCountry: Record<string, { dx: number; dy: number; city: string }[]> = {
  'Germany': [
    { dx: 0, dy: -2, city: 'Berlin' },
    { dx: -1, dy: 1, city: 'Frankfurt' },
    { dx: 0, dy: 3, city: 'Munich' },
    { dx: 0, dy: -3, city: 'Hamburg' },
    { dx: -2, dy: 0, city: 'Cologne' },
  ],
  'France': [
    { dx: 2, dy: -5, city: 'Paris' },
    { dx: 3, dy: 0, city: 'Lyon' },
    { dx: 0, dy: 4, city: 'Toulouse' },
  ],
  'Netherlands': [
    { dx: 0.5, dy: 0, city: 'Amsterdam' },
    { dx: 0, dy: 0.8, city: 'The Hague' },
  ],
  'United Kingdom': [
    { dx: 0.5, dy: 1, city: 'London' },
    { dx: -1, dy: -1, city: 'Birmingham' },
    { dx: -2, dy: -3, city: 'Manchester' },
  ],
  'Italy': [
    { dx: -1, dy: -3, city: 'Milan' },
    { dx: 1, dy: 0, city: 'Rome' },
    { dx: 2, dy: 4, city: 'Naples' },
  ],
  'Spain': [
    { dx: 0, dy: 0, city: 'Madrid' },
    { dx: 4, dy: -1, city: 'Barcelona' },
    { dx: -2, dy: 2, city: 'Seville' },
  ],
  'Sweden': [
    { dx: 1, dy: -1, city: 'Stockholm' },
    { dx: -2, dy: 4, city: 'Malmö' },
  ],
  'Poland': [
    { dx: 1, dy: -1, city: 'Warsaw' },
    { dx: -2, dy: 2, city: 'Krakow' },
  ],
  'Belgium': [
    { dx: -0.3, dy: 0.3, city: 'Brussels' },
    { dx: 0.2, dy: -0.6, city: 'Antwerp' },
  ],
  'Switzerland': [
    { dx: 1, dy: -0.5, city: 'Zurich' },
    { dx: -1, dy: 0.5, city: 'Geneva' },
  ],
  'Austria': [
    { dx: 1.4, dy: -1.0, city: 'Vienna' },
  ],
  'Norway': [
    { dx: 0, dy: 0.5, city: 'Oslo' },
  ],
  'Finland': [
    { dx: 0, dy: 1, city: 'Helsinki' },
  ],
  'Denmark': [
    { dx: 0, dy: 0, city: 'Copenhagen' },
  ],
  'Ireland': [
    { dx: 0, dy: 0, city: 'Dublin' },
  ],
  'Greece': [
    { dx: 1, dy: 1, city: 'Athens' },
  ],
  'Portugal': [
    { dx: 0, dy: 1, city: 'Lisbon' },
  ],
};

// Assign a stable position to each company
const getCompanyPosition = (company: Company, index: number): { x: number; y: number; city: string } | null => {
  const base = countryPositions[company.country];
  if (!base) return null;
  const cities = citiesPerCountry[company.country];
  if (cities && cities.length > 0) {
    const c = cities[index % cities.length];
    return { x: base.x + c.dx, y: base.y + c.dy, city: c.city };
  }
  return { x: base.x, y: base.y, city: company.country };
};

export const CompaniesMap = ({ companies, savedCompanies = new Set(), useSavedView = false, hoveredCompanyId = null, onPinHover }: CompaniesMapProps) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 0.5));

  // Build per-company pins.
  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return h;
  };
  const companyPins = companies
    .map((company, idx) => {
      const pos = getCompanyPosition(company, idx);
      if (!pos) return null;
      const h = hash(company.id || company.company_name);
      // Tiny jitter so overlapping pins separate slightly (in % units)
      const jitterScale = company.country === 'Austria'
        ? { x: 0.18, y: 0.12 }
        : { x: 1.2, y: 1.0 };
      const jx = (((h % 1000) / 1000) - 0.5) * jitterScale.x;
      const jy = ((((h >> 10) % 1000) / 1000) - 0.5) * jitterScale.y;
      return {
        company,
        pos: { x: pos.x + jx, y: pos.y + jy },
        city: pos.city,
      };
    })
    .filter((p): p is { company: Company; pos: { x: number; y: number }; city: string } => p !== null);

  return (
    <div
      className="relative w-full h-full min-h-0 border border-border rounded-lg overflow-hidden"
      onMouseLeave={() => onPinHover?.(null)}
    >
      <div className="relative w-full h-full" style={{ 
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'center',
        transition: 'transform 0.3s ease',
      }}>
        <img 
          src={mapEurope} 
          alt="Company locations map" 
          className="w-full h-full"
          style={{ objectFit: 'fill' }}
        />
        {/* Company pins */}
        {companyPins.map(({ company, pos, city }) => {
          const isHovered = hoveredCompanyId === company.id;
          return (
            <div
              key={company.id}
              className={`absolute flex items-center justify-center transition-all duration-200 cursor-pointer ${
                isHovered 
                  ? 'z-20' 
                  : hoveredCompanyId ? 'z-0 opacity-30' : 'z-10 opacity-70'
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.4)' : 'scale(1)'}`,
              }}
              onMouseEnter={() => onPinHover?.(company.id)}
              onMouseLeave={() => onPinHover?.(null)}
            >
              {/* Pin dot */}
              <div className={`flex flex-col items-center ${isHovered ? 'drop-shadow-md' : ''}`}>
                <div className={`w-2.5 h-2.5 rounded-full border border-white shadow-md ${
                  isHovered ? 'bg-orange-600' : 'bg-slate-900'
                }`} />
                {isHovered && (
                  <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 bg-foreground text-background text-[8px] font-normal px-1.5 py-0.5 rounded whitespace-nowrap shadow-md z-30">
                    {company.company_name} · {city}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          className="h-9 w-9 p-0 bg-background hover:bg-muted shadow-md border-border"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          className="h-9 w-9 p-0 bg-background hover:bg-muted shadow-md border-border"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
