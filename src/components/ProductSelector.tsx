'use client';

import { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { ShopifyProductEnhanced } from '@/types';
import { filterProductsByQuery, getProductTypeSuggestions } from '@/lib/product-ranking';

interface ProductSelectorProps {
  products: ShopifyProductEnhanced[];
  selectedProducts: string[]; // Product IDs
  onSelectionChange: (selectedIds: string[]) => void;
  disabled?: boolean;
  minSelection?: number;
  maxSelection?: number;
}

export const ProductSelector = memo(function ProductSelector({
  products,
  selectedProducts,
  onSelectionChange,
  disabled = false,
  minSelection = 3,
  maxSelection = 10
}: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, _setFilterType] = useState<string>('all');
  const [showLimit, setShowLimit] = useState(100); // Initially show 100 products

  // Filter products based on search and type
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filterProductsByQuery(filtered, searchQuery);
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.product_type === filterType);
    }
    
    return filtered;
  }, [products, searchQuery, filterType]);

  // Get products to display (with limit)
  const productsToDisplay = useMemo(() => {
    return filteredProducts.slice(0, showLimit);
  }, [filteredProducts, showLimit]);

  const hasMore = filteredProducts.length > showLimit;

  // Get unique product types for filter dropdown
  const _productTypes = useMemo(() => getProductTypeSuggestions(products), [products]);

  // Auto-select first 5 products from mapped list, ignoring parent selections
  useEffect(() => {
    if (products.length > 0) {
      // Always select the first 5 products from the displayed list, regardless of parent selections
      const autoSelectIds = productsToDisplay
        .slice(0, Math.min(5, maxSelection))
        .map(product => product.id);
      
      if (autoSelectIds.length > 0 && autoSelectIds.join(',') !== selectedProducts.join(',')) {
        onSelectionChange(autoSelectIds);
      }
    }
  }, [products.length]); // Only depend on products.length to run once when products are loaded

  const handleProductToggle = useCallback((productId: string) => {
    if (disabled) return;
    
    const isSelected = selectedProducts.includes(productId);
    let newSelection: string[];
    
    if (isSelected) {
      // Deselect (but enforce minimum)
      if (selectedProducts.length > minSelection) {
        newSelection = selectedProducts.filter(id => id !== productId);
      } else {
        return; // Don't allow deselection below minimum
      }
    } else {
      // Select (but enforce maximum)
      if (selectedProducts.length < maxSelection) {
        newSelection = [...selectedProducts, productId];
      } else {
        return; // Don't allow selection above maximum
      }
    }
    
    onSelectionChange(newSelection);
  }, [disabled, selectedProducts, minSelection, maxSelection, onSelectionChange]);

  const _handleSelectAll = () => {
    if (disabled) return;
    const visibleIds = productsToDisplay.slice(0, maxSelection).map(p => p.id);
    onSelectionChange(visibleIds);
  };

  const handleShowMore = useCallback(() => {
    setShowLimit(prev => prev + 100);
  }, []);

  const _handleClearAll = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  const selectedCount = selectedProducts.length;
  const isMinReached = selectedCount >= minSelection;
  const isMaxReached = selectedCount >= maxSelection;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Select Products ({selectedCount}/{maxSelection})
          </h2>
          <p className="text-white/70">
            Choose {minSelection}-{maxSelection} products to feature in your social media posts
          </p>
        </div>
        
        {/* Selection Status
        <div className="inline-flex items-center">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            !isMinReached 
              ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
              : isMaxReached 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          }`}>
            {!isMinReached ? `Need ${minSelection - selectedCount} more` : 
             isMaxReached ? 'Maximum reached' : 
             `${maxSelection - selectedCount} remaining`}
          </span>
        </div> */}
      </div>

      {/* Product Selector Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-xl">
        {/* Search Section */}
        <div className="p-4 bg-white/5 border-b border-white/10">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={disabled}
              className={`
                w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                placeholder:text-gray-500
                ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
              `}
            />
          </div>
        </div>

        {/* Product List */}
        <div className="bg-white rounded-b-2xl">
          {filteredProducts.length > 50 && (
            <div className="bg-blue-50 border-b border-blue-200 p-3 text-sm text-blue-700">
              💡 Tip: Use the search above to find products more easily ({filteredProducts.length} products found, showing {productsToDisplay.length})
            </div>
          )}
          
          <div className="max-h-80 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchQuery || filterType !== 'all' 
                  ? 'No products match your filters' 
                  : 'No products available'
                }
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {productsToDisplay.map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
                  const canSelect = !isSelected && !isMaxReached;
                  const canDeselect = isSelected && selectedCount > minSelection;
                  const isClickable = !disabled && (canSelect || canDeselect);

                  return (
                    <div
                      key={product.id}
                      className={`p-4 flex items-center space-x-3 transition-colors ${isSelected ? 'bg-blue-50' : 'bg-white'} ${isClickable ? 'hover:bg-gray-50 cursor-pointer' : ''} ${!isClickable && !isSelected ? 'opacity-50' : ''}`}
                      onClick={() => isClickable && handleProductToggle(product.id)}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by div click
                        disabled={!isClickable}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </h4>
                          <span className="text-sm font-medium text-gray-900 ml-2">
                            {product.price}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          {product.product_type && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {product.product_type}
                            </span>
                          )}
                          {product.rank && (
                            <span className="text-xs text-gray-500">
                              Rank #{product.rank}
                            </span>
                          )}
                        </div>
                        
                        {product.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {hasMore && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={handleShowMore}
                      disabled={disabled}
                      className={`
                        w-full px-4 py-2 text-sm rounded-md border
                        ${disabled
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                        }
                      `}
                    >
                      Show More Products ({filteredProducts.length - showLimit} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center space-y-2">
        <div className="text-xs text-white/50 space-y-1">
          <p>• Products are automatically ranked by bestseller potential</p>
          <p>• Selected products will be featured across your 7-day calendar</p>
          <p>• You can modify selection anytime before generating</p>
        </div>
      </div>
    </div>
  );
});

export default ProductSelector;