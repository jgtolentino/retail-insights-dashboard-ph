import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { debounce } from 'lodash-es';
import type { GlobalFilters } from '@/types/filters';
import { defaultGlobalFilters } from '@/types/filters';

interface FilterContextValue {
  filters: GlobalFilters;
  setFilters: (updater: Partial<GlobalFilters> | ((prev: GlobalFilters) => GlobalFilters)) => void;
  resetFilters: () => void;
  updateDateRange: (start: string, end: string) => void;
  updateFilter: (key: keyof GlobalFilters, value: any) => void;
  isFilterRelevant: (filterName: keyof GlobalFilters) => boolean;
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

// LocalStorage key
const FILTER_STORAGE_KEY = 'retail-dashboard-filters';

// Page-specific filter relevance
const filterRelevance: Record<string, (keyof GlobalFilters)[]> = {
  '/': ['dateRange', 'location'], // Transaction Trends
  '/product-mix': ['dateRange', 'category', 'brand', 'location'], // Product Mix
  '/consumer-insights': ['dateRange', 'category', 'brand', 'location', 'weekdayWeekend'], // Consumer Insights
};

export function EnhancedFilterProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  // Initialize filters from URL params, then localStorage, then defaults
  const initializeFilters = (): GlobalFilters => {
    // 1. Try URL params first
    const urlFilters: Partial<GlobalFilters> = {};
    
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    if (startDate && endDate) {
      urlFilters.dateRange = { start: startDate, end: endDate };
    }
    
    const category = searchParams.get('category');
    if (category) urlFilters.category = category;
    
    const brand = searchParams.get('brand');
    if (brand) urlFilters.brand = brand;
    
    const location = searchParams.get('location');
    if (location) urlFilters.location = location;
    
    const dayType = searchParams.get('dayType') as 'all' | 'weekday' | 'weekend';
    if (dayType) urlFilters.weekdayWeekend = dayType;
    
    // 2. Try localStorage next
    let savedFilters: Partial<GlobalFilters> = {};
    try {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY);
      if (saved) {
        savedFilters = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading filters from localStorage:', error);
    }
    
    // 3. Merge: URL > localStorage > defaults
    return {
      ...defaultGlobalFilters,
      ...savedFilters,
      ...urlFilters,
    };
  };
  
  const [filters, setFiltersState] = useState<GlobalFilters>(initializeFilters);
  
  // Sync filters to URL (debounced)
  const syncToURL = useCallback(
    debounce((newFilters: GlobalFilters) => {
      const params = new URLSearchParams();
      
      if (newFilters.dateRange.start && newFilters.dateRange.end) {
        params.set('start', newFilters.dateRange.start);
        params.set('end', newFilters.dateRange.end);
      }
      
      if (newFilters.category !== 'All') {
        params.set('category', newFilters.category);
      }
      
      if (newFilters.brand !== 'All') {
        params.set('brand', newFilters.brand);
      }
      
      if (newFilters.location !== 'All') {
        params.set('location', newFilters.location);
      }
      
      if (newFilters.weekdayWeekend !== 'all') {
        params.set('dayType', newFilters.weekdayWeekend);
      }
      
      setSearchParams(params, { replace: true });
    }, 300),
    [setSearchParams]
  );
  
  // Sync filters to localStorage
  const syncToLocalStorage = useCallback((newFilters: GlobalFilters) => {
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(newFilters));
    } catch (error) {
      console.error('Error saving filters to localStorage:', error);
    }
  }, []);
  
  // Update filters and sync
  const setFilters = useCallback((updater: Partial<GlobalFilters> | ((prev: GlobalFilters) => GlobalFilters)) => {
    setFiltersState(prev => {
      const newFilters = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      
      // Sync to URL and localStorage
      syncToURL(newFilters);
      syncToLocalStorage(newFilters);
      
      return newFilters;
    });
  }, [syncToURL, syncToLocalStorage]);
  
  const resetFilters = useCallback(() => {
    setFilters(defaultGlobalFilters);
    localStorage.removeItem(FILTER_STORAGE_KEY);
  }, [setFilters]);
  
  const updateDateRange = useCallback((start: string, end: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start, end }
    }));
  }, [setFilters]);
  
  const updateFilter = useCallback((key: keyof GlobalFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, [setFilters]);
  
  // Check if a filter is relevant for the current page
  const isFilterRelevant = useCallback((filterName: keyof GlobalFilters): boolean => {
    const relevantFilters = filterRelevance[location.pathname] || Object.keys(defaultGlobalFilters);
    return relevantFilters.includes(filterName);
  }, [location.pathname]);
  
  // Listen for browser back/forward
  useEffect(() => {
    const newFilters = initializeFilters();
    setFiltersState(newFilters);
  }, [searchParams]);
  
  const value: FilterContextValue = {
    filters,
    setFilters,
    resetFilters,
    updateDateRange,
    updateFilter,
    isFilterRelevant,
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

// Alias for backwards compatibility
export const useEnhancedFilters = useFilters;