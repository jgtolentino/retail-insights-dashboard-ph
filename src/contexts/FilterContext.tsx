import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  ConsumerFilters, 
  ProductMixFilters, 
  DEFAULT_CONSUMER_FILTERS, 
  DEFAULT_PRODUCT_MIX_FILTERS 
} from '@/types/filters';

interface FilterContextType {
  // Consumer Insights filters
  consumerFilters: ConsumerFilters;
  setConsumerFilters: (filters: ConsumerFilters) => void;
  updateConsumerFilters: (updates: Partial<ConsumerFilters>) => void;
  resetConsumerFilters: () => void;
  
  // Product Mix filters
  productMixFilters: ProductMixFilters;
  setProductMixFilters: (filters: ProductMixFilters) => void;
  updateProductMixFilters: (updates: Partial<ProductMixFilters>) => void;
  resetProductMixFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [consumerFilters, setConsumerFilters] = useState<ConsumerFilters>(DEFAULT_CONSUMER_FILTERS);
  const [productMixFilters, setProductMixFilters] = useState<ProductMixFilters>(DEFAULT_PRODUCT_MIX_FILTERS);

  const updateConsumerFilters = (updates: Partial<ConsumerFilters>) => {
    setConsumerFilters(prev => ({ ...prev, ...updates }));
  };

  const resetConsumerFilters = () => {
    setConsumerFilters(DEFAULT_CONSUMER_FILTERS);
  };

  const updateProductMixFilters = (updates: Partial<ProductMixFilters>) => {
    setProductMixFilters(prev => ({ ...prev, ...updates }));
  };

  const resetProductMixFilters = () => {
    setProductMixFilters(DEFAULT_PRODUCT_MIX_FILTERS);
  };

  const value: FilterContextType = {
    consumerFilters,
    setConsumerFilters,
    updateConsumerFilters,
    resetConsumerFilters,
    productMixFilters,
    setProductMixFilters,
    updateProductMixFilters,
    resetProductMixFilters,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

// Convenience hooks for specific filter types
export function useConsumerFilters() {
  const { consumerFilters, setConsumerFilters, updateConsumerFilters, resetConsumerFilters } = useFilters();
  return { consumerFilters, setConsumerFilters, updateConsumerFilters, resetConsumerFilters };
}

export function useProductMixFilters() {
  const { productMixFilters, setProductMixFilters, updateProductMixFilters, resetProductMixFilters } = useFilters();
  return { productMixFilters, setProductMixFilters, updateProductMixFilters, resetProductMixFilters };
}