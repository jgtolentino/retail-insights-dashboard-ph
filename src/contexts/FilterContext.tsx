import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { GlobalFilters } from '@/types/filters';
import { defaultGlobalFilters } from '@/types/filters';

interface FilterContextValue {
  filters: GlobalFilters;
  setFilters: (updater: Partial<GlobalFilters> | ((prev: GlobalFilters) => GlobalFilters)) => void;
  resetFilters: () => void;
  updateDateRange: (start: string, end: string) => void;
  updateFilter: (key: keyof GlobalFilters, value: any) => void;
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<GlobalFilters>(defaultGlobalFilters);
  
  const setFilters = useCallback((updater: Partial<GlobalFilters> | ((prev: GlobalFilters) => GlobalFilters)) => {
    if (typeof updater === 'function') {
      setFiltersState(updater);
    } else {
      setFiltersState(prev => ({ ...prev, ...updater }));
    }
  }, []);
  
  const resetFilters = useCallback(() => {
    setFiltersState(defaultGlobalFilters);
  }, []);

  const updateDateRange = useCallback((start: string, end: string) => {
    setFiltersState(prev => ({
      ...prev,
      dateRange: { start, end }
    }));
  }, []);

  const updateFilter = useCallback((key: keyof GlobalFilters, value: any) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const value: FilterContextValue = {
    filters,
    setFilters,
    resetFilters,
    updateDateRange,
    updateFilter
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}