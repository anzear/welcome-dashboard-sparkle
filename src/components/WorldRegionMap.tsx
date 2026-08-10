import React, { memo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const COUNTRY_REGION: Record<string, string> = {
  "Afghanistan":"Asia","Albania":"Europe","Algeria":"Africa","Angola":"Africa","Antarctica":"Antarctica","Argentina":"South America","Armenia":"Asia","Australia":"Oceania","Austria":"Europe","Azerbaijan":"Asia","Bahamas":"North America","Bangladesh":"Asia","Belarus":"Europe","Belgium":"Europe","Belize":"North America","Benin":"Africa","Bhutan":"Asia","Bolivia":"South America","Bosnia and Herz.":"Europe","Botswana":"Africa","Brazil":"South America","Brunei":"Asia","Bulgaria":"Europe","Burkina Faso":"Africa","Burundi":"Africa","Cambodia":"Asia","Cameroon":"Africa","Canada":"North America","Central African Rep.":"Africa","Chad":"Africa","Chile":"South America","China":"Asia","Colombia":"South America","Congo":"Africa","Costa Rica":"North America","Croatia":"Europe","Cuba":"North America","Cyprus":"Europe","Czechia":"Europe","Côte d'Ivoire":"Africa","Dem. Rep. Congo":"Africa","Denmark":"Europe","Djibouti":"Africa","Dominican Rep.":"North America","Ecuador":"South America","Egypt":"Africa","El Salvador":"North America","Eq. Guinea":"Africa","Eritrea":"Africa","Estonia":"Europe","Ethiopia":"Africa","Falkland Is.":"South America","Fiji":"Oceania","Finland":"Europe","Fr. S. Antarctic Lands":"Antarctica","France":"Europe","Gabon":"Africa","Gambia":"Africa","Georgia":"Asia","Germany":"Europe","Ghana":"Africa","Greece":"Europe","Greenland":"North America","Guatemala":"North America","Guinea":"Africa","Guinea-Bissau":"Africa","Guyana":"South America","Haiti":"North America","Honduras":"North America","Hungary":"Europe","Iceland":"Europe","India":"Asia","Indonesia":"Asia","Iran":"Asia","Iraq":"Asia","Ireland":"Europe","Israel":"Asia","Italy":"Europe","Jamaica":"North America","Japan":"Asia","Jordan":"Asia","Kazakhstan":"Asia","Kenya":"Africa","Kosovo":"Europe","Kuwait":"Asia","Kyrgyzstan":"Asia","Laos":"Asia","Latvia":"Europe","Lebanon":"Asia","Lesotho":"Africa","Liberia":"Africa","Libya":"Africa","Lithuania":"Europe","Luxembourg":"Europe","Macedonia":"Europe","Madagascar":"Africa","Malawi":"Africa","Malaysia":"Asia","Mali":"Africa","Mauritania":"Africa","Mexico":"North America","Moldova":"Europe","Mongolia":"Asia","Montenegro":"Europe","Morocco":"Africa","Mozambique":"Africa","Myanmar":"Asia","N. Cyprus":"Asia","Namibia":"Africa","Nepal":"Asia","Netherlands":"Europe","New Caledonia":"Oceania","New Zealand":"Oceania","Nicaragua":"North America","Niger":"Africa","Nigeria":"Africa","North Korea":"Asia","Norway":"Europe","Oman":"Asia","Pakistan":"Asia","Palestine":"Asia","Panama":"North America","Papua New Guinea":"Oceania","Paraguay":"South America","Peru":"South America","Philippines":"Asia","Poland":"Europe","Portugal":"Europe","Puerto Rico":"North America","Qatar":"Asia","Romania":"Europe","Russia":"Europe","Rwanda":"Africa","S. Sudan":"Africa","Saudi Arabia":"Asia","Senegal":"Africa","Serbia":"Europe","Sierra Leone":"Africa","Slovakia":"Europe","Slovenia":"Europe","Solomon Is.":"Oceania","Somalia":"Africa","Somaliland":"Africa","South Africa":"Africa","South Korea":"Asia","Spain":"Europe","Sri Lanka":"Asia","Sudan":"Africa","Suriname":"South America","Sweden":"Europe","Switzerland":"Europe","Syria":"Asia","Taiwan":"Asia","Tajikistan":"Asia","Tanzania":"Africa","Thailand":"Asia","Timor-Leste":"Asia","Togo":"Africa","Trinidad and Tobago":"North America","Tunisia":"Africa","Turkey":"Asia","Turkmenistan":"Asia","Uganda":"Africa","Ukraine":"Europe","United Arab Emirates":"Asia","United Kingdom":"Europe","United States of America":"North America","Uruguay":"South America","Uzbekistan":"Asia","Vanuatu":"Oceania","Venezuela":"South America","Vietnam":"Asia","W. Sahara":"Africa","Yemen":"Asia","Zambia":"Africa","Zimbabwe":"Africa","eSwatini":"Africa",
};

export interface WorldRegionMapProps {
  regionCounts: Record<string, number>;
  hoveredRegion?: string | null;
  onHoverRegion?: (region: string | null) => void;
}

const shadeFor = (count: number, max: number): string => {
  if (!count) return '#e2e8f0';
  const t = count / Math.max(1, max);
  if (t >= 0.85) return '#047857';
  if (t >= 0.6)  return '#059669';
  if (t >= 0.4)  return '#10b981';
  if (t >= 0.2)  return '#34d399';
  return '#a7f3d0';
};

const WorldRegionMap: React.FC<WorldRegionMapProps> = ({ regionCounts, hoveredRegion, onHoverRegion }) => {
  const max = Math.max(1, ...Object.values(regionCounts));
  return (
    <ComposableMap
      projection="geoEqualEarth"
      projectionConfig={{ scale: 165, center: [10, 25] }}
      width={900}
      height={360}
      style={{ width: '100%', height: 'auto', display: 'block', background: '#f8fafc', borderRadius: 6 }}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const name = geo.properties.name as string;
            const region = COUNTRY_REGION[name] || 'Asia';
            if (region === 'Antarctica') {
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 0.3, outline: 'none' },
                    hover:   { fill: '#f1f5f9', outline: 'none' },
                    pressed: { fill: '#f1f5f9', outline: 'none' },
                  }}
                />
              );
            }
            const count = regionCounts[region] || 0;
            const fill = shadeFor(count, max);
            const dim = hoveredRegion && hoveredRegion !== region;
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onMouseEnter={() => count && onHoverRegion?.(region)}
                onMouseLeave={() => onHoverRegion?.(null)}
                style={{
                  default: {
                    fill,
                    stroke: '#ffffff',
                    strokeWidth: 0.4,
                    outline: 'none',
                    opacity: dim ? 0.55 : 1,
                    cursor: count ? 'pointer' : 'default',
                    transition: 'opacity 150ms, fill 150ms',
                  },
                  hover: {
                    fill,
                    stroke: '#ffffff',
                    strokeWidth: 0.6,
                    outline: 'none',
                    opacity: 1,
                    cursor: count ? 'pointer' : 'default',
                  },
                  pressed: { fill, outline: 'none' },
                }}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
};

export default memo(WorldRegionMap);
