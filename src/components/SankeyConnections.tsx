import React from 'react';

interface SankeyConnectionsProps {
  fromColumn: number; // 0=feedstock, 1=technology, 2=product, 3=market
  itemsCount: {
    feedstock: number;
    technology: number;
    product: number;
    market: number;
  };
  color: string;
  selectedItems?: string[];
  showFullLandscape?: boolean;
  activePathway?: {
    type: 'feedstock' | 'technology' | 'market' | null;
    item: string | null;
  };
  pathwayConnections?: any;
}

const SankeyConnections: React.FC<SankeyConnectionsProps> = ({ 
  fromColumn, 
  itemsCount,
  color,
  selectedItems = [],
  showFullLandscape = false,
  activePathway = { type: null, item: null },
  pathwayConnections = {}
}) => {
  const feedstocks = ['Sugar Beet', 'Corn Stover', 'Wheat Straw', 'Bagasse', 'Rice Husk', 'Wood Chips', 'Algae', 'Switchgrass', 'Miscanthus', 'Hemp', 'Sorghum', 'Cassava'];
  const technologies = ['Fermentation', 'Hydrolysis', 'Gasification', 'Pyrolysis', 'Catalysis', 'Extraction', 'Purification', 'Synthesis'];
  const markets = ['Pharmaceuticals', 'Food & Beverage', 'Cosmetics', 'Biofuels', 'Chemicals', 'Animal Feed', 'Packaging', 'Textiles', 'Agriculture', 'Construction', 'Energy', 'Transportation'];
  const width = 60;
  const height = 280;
  const itemHeight = 26; // Actual rendered height including padding (h-6 with padding)
  const gap = 4; // Gap between items (gap-1)
  
  // Calculate positions for items in source and target columns
  const getItemPositions = (count: number) => {
    const positions: number[] = [];
    const totalContentHeight = count * itemHeight + (count - 1) * gap;
    const startY = (height - totalContentHeight) / 2;
    
    for (let i = 0; i < count; i++) {
      // Position at the center of each box
      positions.push(startY + i * (itemHeight + gap) + itemHeight / 2);
    }
    return positions;
  };

  let sourceCount = 0;
  let targetCount = 0;
  
  if (fromColumn === 0) {
    sourceCount = itemsCount.feedstock;
    targetCount = itemsCount.technology;
  } else if (fromColumn === 1) {
    sourceCount = itemsCount.technology;
    targetCount = 1; // Product is single
  } else if (fromColumn === 2) {
    sourceCount = 1; // Product is single
    targetCount = itemsCount.market;
  }

  const sourcePositions = getItemPositions(sourceCount);
  const targetPositions = getItemPositions(targetCount);

  // Check if a connection should be shown based on active pathway
  const shouldShowConnection = (sourceItem: string, targetItem: string, columnType: string): boolean => {
    if (!activePathway.type || !activePathway.item) return true;

    if (columnType === 'feedstock-technology') {
      if (activePathway.type === 'feedstock') {
        return sourceItem === activePathway.item && pathwayConnections.feedstock?.[activePathway.item]?.includes(targetItem);
      }
      if (activePathway.type === 'technology') {
        const connectedFeedstocks = Object.entries(pathwayConnections.feedstock || {})
          .filter(([_, techs]) => (techs as string[]).includes(activePathway.item))
          .map(([feedstock, _]) => feedstock);
        return connectedFeedstocks.includes(sourceItem) && targetItem === activePathway.item;
      }
      if (activePathway.type === 'market') {
        const connectedTechs = pathwayConnections.market?.[activePathway.item] || [];
        if (!connectedTechs.includes(targetItem)) return false;
        return pathwayConnections.feedstock?.[sourceItem]?.includes(targetItem);
      }
    }

    if (columnType === 'technology-product') {
      if (activePathway.type === 'feedstock') {
        return pathwayConnections.feedstock?.[activePathway.item]?.includes(sourceItem);
      }
      if (activePathway.type === 'technology') {
        return sourceItem === activePathway.item;
      }
      if (activePathway.type === 'market') {
        return pathwayConnections.market?.[activePathway.item]?.includes(sourceItem);
      }
    }

    if (columnType === 'product-market') {
      if (activePathway.type === 'feedstock') {
        const connectedTechs = pathwayConnections.feedstock?.[activePathway.item] || [];
        return connectedTechs.some((tech: string) => pathwayConnections.technology?.[tech]?.includes(targetItem));
      }
      if (activePathway.type === 'technology') {
        return pathwayConnections.technology?.[activePathway.item]?.includes(targetItem);
      }
      if (activePathway.type === 'market') {
        return targetItem === activePathway.item;
      }
    }

    return true;
  };

  // Generate paths - simplified and clearer flow
  const generatePaths = () => {
    const paths: JSX.Element[] = [];
    
    if (fromColumn === 2) {
      // From single product to markets - fan out to all markets
      const sourceY = height / 2;
      targetPositions.forEach((targetY, index) => {
        const market = markets[index];
        const isTopConnection = index < 3;
        const shouldShow = shouldShowConnection('Product', market, 'product-market');
        
        if (!shouldShow) return;
        
        const shouldShowColor = (showFullLandscape ? false : isTopConnection) || (activePathway.type !== null);
        const pathD = `M 0 ${sourceY} C ${width * 0.5} ${sourceY}, ${width * 0.5} ${targetY}, ${width} ${targetY}`;
        
        paths.push(
          <path
            key={`path-${index}`}
            d={pathD}
            stroke={shouldShowColor ? color : "#D1D5DB"}
            strokeWidth={shouldShowColor ? "3" : "1.5"}
            fill="none"
            opacity={shouldShowColor ? "0.8" : "0.2"}
            className="transition-all duration-300"
          />
        );
      });
    } else if (fromColumn === 1) {
      // From technologies to single product - converge all to center
      const targetY = height / 2;
      sourcePositions.forEach((sourceY, index) => {
        const technology = technologies[index];
        const isTopConnection = index < 3;
        const shouldShow = shouldShowConnection(technology, 'Product', 'technology-product');
        
        if (!shouldShow) return;
        
        const shouldShowColor = (showFullLandscape ? false : isTopConnection) || (activePathway.type !== null);
        const pathD = `M 0 ${sourceY} C ${width * 0.5} ${sourceY}, ${width * 0.5} ${targetY}, ${width} ${targetY}`;
        
        paths.push(
          <path
            key={`path-${index}`}
            d={pathD}
            stroke={shouldShowColor ? color : "#D1D5DB"}
            strokeWidth={shouldShowColor ? "3" : "1.5"}
            fill="none"
            opacity={shouldShowColor ? "0.8" : "0.2"}
            className="transition-all duration-300"
          />
        );
      });
    } else {
      // From feedstocks to technologies - dynamic connections based on pathway data
      sourcePositions.forEach((sourceY, sourceIndex) => {
        const feedstock = feedstocks[sourceIndex];
        const isTopFeedstock = sourceIndex < 3;
        
        if (activePathway.type) {
          // When a pathway is active, only show relevant connections
          const connectedTechs = pathwayConnections.feedstock?.[feedstock] || [];
          connectedTechs.forEach((tech: string) => {
            const targetIndex = technologies.indexOf(tech);
            if (targetIndex !== -1 && targetIndex < targetPositions.length) {
              const shouldShow = shouldShowConnection(feedstock, tech, 'feedstock-technology');
              if (!shouldShow) return;
              
              const targetY = targetPositions[targetIndex];
              const pathD = `M 0 ${sourceY} C ${width * 0.5} ${sourceY}, ${width * 0.5} ${targetY}, ${width} ${targetY}`;
              
              paths.push(
                <path
                  key={`path-${sourceIndex}-${targetIndex}`}
                  d={pathD}
                  stroke={color}
                  strokeWidth="3"
                  fill="none"
                  opacity="0.8"
                  className="transition-all duration-300"
                />
              );
            }
          });
        } else if (isTopFeedstock && !showFullLandscape) {
          // Top 3 feedstocks in normal view: connect each to 2-3 technologies with color
          const techConnections = sourceIndex === 0 ? [0, 1] : sourceIndex === 1 ? [1, 2] : [0, 2, 3];
          
          techConnections.forEach((targetIndex) => {
            if (targetIndex < targetPositions.length) {
              const targetY = targetPositions[targetIndex];
              const pathD = `M 0 ${sourceY} C ${width * 0.5} ${sourceY}, ${width * 0.5} ${targetY}, ${width} ${targetY}`;
              
              paths.push(
                <path
                  key={`path-${sourceIndex}-${targetIndex}`}
                  d={pathD}
                  stroke={color}
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.6"
                  className="transition-all duration-300"
                />
              );
            }
          });
        } else {
          // In full landscape mode OR non-top feedstocks: show grey connections
          const targetIndices = [(sourceIndex * 2) % targetPositions.length, ((sourceIndex * 2) + 1) % targetPositions.length];
          
          targetIndices.forEach((targetIndex) => {
            const targetY = targetPositions[targetIndex];
            const pathD = `M 0 ${sourceY} C ${width * 0.5} ${sourceY}, ${width * 0.5} ${targetY}, ${width} ${targetY}`;
            
            paths.push(
              <path
                key={`path-${sourceIndex}-${targetIndex}`}
                d={pathD}
                stroke="#D1D5DB"
                strokeWidth="1.5"
                fill="none"
                opacity="0.2"
                className="transition-all duration-300"
              />
            );
          });
        }
      });
    }
    
    return paths;
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      style={{ minWidth: width }}
    >
      <g>
        {generatePaths()}
      </g>
    </svg>
  );
};

export default SankeyConnections;
