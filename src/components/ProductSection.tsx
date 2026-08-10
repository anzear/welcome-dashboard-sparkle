import React from 'react';

interface ProductItem {
  name: string;
  trl: string;
}

interface ProductSectionProps {
  items: ProductItem[];
}

const ProductSection: React.FC<ProductSectionProps> = ({ items }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Product</h3>
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                {item.trl}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-800">
              {item.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSection;