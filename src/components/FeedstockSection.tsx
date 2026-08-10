import React from 'react';

interface FeedstockItem {
  name: string;
  trl: string;
}

interface FeedstockSectionProps {
  items: FeedstockItem[];
}

const FeedstockSection: React.FC<FeedstockSectionProps> = ({ items }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Feedstock</h3>
      
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={index} className="w-full h-2 bg-green-500 rounded-sm hover:bg-green-600 transition-all cursor-pointer" />
        ))}
      </div>

      {/* 12 Mini Rectangles */}
      <div className="flex gap-2 justify-center pt-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div 
            key={index} 
            className="w-6 h-3 bg-green-500 rounded-sm"
          />
        ))}
      </div>
    </div>
  );
};

export default FeedstockSection;