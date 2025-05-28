
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  ConsumerFilters, 
  ProductMixFilters,
  GlobalFilters,
  DEFAULT_CONSUMER_FILTERS, 
  DEFAULT_PRODUCT_MIX_FILTERS,
  DEFAULT_GLOBAL_FILTERS
} from '@/types/filters';

interface FilterContextType {
  // Global filters
  globalFilters: GlobalFilters;
  setGlobalFilters: (filters: GlobalFilters) => void;
  updateGlobalFilters: (updates: Partial<GlobalFilters>) => void;
  resetGlobalFilters: () => void;
  
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
  const [globalFilters, setGlobalFilters] = useState<GlobalFilters>(DEFAULT_GLOBAL_FILTERS);
  const [consumerFilters, setConsumerFilters] = useState<ConsumerFilters>(DEFAULT_CONSUMER_FILTERS);
  const [productMixFilters, setProductMixFilters] = useState<ProductMixFilters>(DEFAULT_PRODUCT_MIX_FILTERS);

  const updateGlobalFilters = (updates: Partial<GlobalFilters>) => {
    setGlobalFilters(prev => ({ ...prev, ...updates }));
  };

  const resetGlobalFilters = () => {
    setGlobalFilters(DEFAULT_GLOBAL_FILTERS);
  };

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
    globalFilters,
    setGlobalFilters,
    updateGlobalFilters,
    resetGlobalFilters,
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
export function useGlobalFilters() {
  const { globalFilters, setGlobalFilters, updateGlobalFilters, resetGlobalFilters } = useFilters();
  return { globalFilters, setGlobalFilters, updateGlobalFilters, resetGlobalFilters };
}

export function useConsumerFilters() {
  const { consumerFilters, setConsumerFilters, updateConsumerFilters, resetConsumerFilters } = useFilters();
  return { consumerFilters, setConsumerFilters, updateConsumerFilters, resetConsumerFilters };
}

export function useProductMixFilters() {
  const { productMixFilters, setProductMixFilters, updateProductMixFilters, resetProductMixFilters } = useFilters();
  return { productMixFilters, setProductMixFilters, updateProductMixFilters, resetProductMixFilters };
}
