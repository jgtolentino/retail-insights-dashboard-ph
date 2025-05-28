import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { debounce } from 'lodash-es';
import type { GlobalFilters } from '@/types/filters';
import { defaultGlobalFilters } from '@/types/filters';
import { safeSplit, safeJoin } from '@/utils/safeArray';

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
  '/product-mix': ['dateRange', 'category', 'brand', 'location', 'categories', 'brands'], // Product Mix
  '/consumer-insights': ['dateRange', 'category', 'brand', 'location', 'weekdayWeekend', 'categories', 'brands', 'genders', 'ageGroups'], // Consumer Insights
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
    
    // Array-based filters from URL - using safe parsing
    const ageGroups = searchParams.get('ageGroups');
    if (ageGroups) urlFilters.ageGroups = safeSplit(ageGroups);
    
    const genders = searchParams.get('genders');
    if (genders) urlFilters.genders = safeSplit(genders);
    
    const brands = searchParams.get('brands');
    if (brands) urlFilters.brands = safeSplit(brands);
    
    const categories = searchParams.get('categories');
    if (categories) urlFilters.categories = safeSplit(categories);
    
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
    const mergedFilters = {
      ...defaultGlobalFilters,
      ...savedFilters,
      ...urlFilters,
    };
    
    // 4. Ensure all array fields are properly initialized
    return {
      ...mergedFilters,
      categories: mergedFilters.categories || [],
      brands: mergedFilters.brands || [],
      genders: mergedFilters.genders || [],
      ageGroups: mergedFilters.ageGroups || [],
      locations: mergedFilters.locations || [],
      products: mergedFilters.products || [],
      incomeRanges: mergedFilters.incomeRanges || [],
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
      
      // Array-based filters - using safe join
      if (newFilters.ageGroups && (newFilters.ageGroups?.length ?? 0) > 0) {
        params.set('ageGroups', safeJoin(newFilters.ageGroups));
      }
      
      if (newFilters.genders && (newFilters.genders?.length ?? 0) > 0) {
        params.set('genders', safeJoin(newFilters.genders));
      }
      
      if (newFilters.brands && (newFilters.brands?.length ?? 0) > 0) {
        params.set('brands', safeJoin(newFilters.brands));
      }
      
      if (newFilters.categories && (newFilters.categories?.length ?? 0) > 0) {
        params.set('categories', safeJoin(newFilters.categories));
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
      // Ensure prev is always properly initialized
      const safePrev = {
        ...defaultGlobalFilters,
        ...prev,
        categories: prev.categories || [],
        brands: prev.brands || [],
        genders: prev.genders || [],
        ageGroups: prev.ageGroups || [],
        locations: prev.locations || [],
        products: prev.products || [],
        incomeRanges: prev.incomeRanges || [],
      };
      
      const newFilters = typeof updater === 'function' ? updater(safePrev) : { ...safePrev, ...updater };
      
      // Ensure newFilters also has safe arrays
      const safeNewFilters = {
        ...newFilters,
        categories: newFilters.categories || [],
        brands: newFilters.brands || [],
        genders: newFilters.genders || [],
        ageGroups: newFilters.ageGroups || [],
        locations: newFilters.locations || [],
        products: newFilters.products || [],
        incomeRanges: newFilters.incomeRanges || [],
      };
      
      // Sync to URL and localStorage
      syncToURL(safeNewFilters);
      syncToLocalStorage(safeNewFilters);
      
      return safeNewFilters;
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