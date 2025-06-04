import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from './useDebounce';

interface UseFilterStateOptions {
  key: string;
  defaultValue?: string[];
  localStorage?: boolean;
  debounceMs?: number;
}

export function useFilterState({
  key,
  defaultValue = [],
  localStorage: useLocalStorage = true,
  debounceMs = 300,
}: UseFilterStateOptions) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL params first, then localStorage, then default
  const getInitialValue = (): string[] => {
    // 1. Check URL params
    const urlValue = searchParams.get(key);
    if (urlValue) {
      return urlValue.split(',').filter(Boolean);
    }

    // 2. Check localStorage
    if (useLocalStorage) {
      try {
        const stored = window.localStorage.getItem(`filter_${key}`);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.warn(`Failed to parse localStorage filter_${key}:`, error);
      }
    }

    // 3. Use default
    return defaultValue;
  };

  const [value, setValue] = useState<string[]>(getInitialValue);
  const debouncedValue = useDebounce(value, debounceMs);

  // Sync to URL params
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams);

    if (debouncedValue.length === 0) {
      currentParams.delete(key);
    } else {
      currentParams.set(key, debouncedValue.join(','));
    }

    setSearchParams(currentParams, { replace: true });
  }, [debouncedValue, key, searchParams, setSearchParams]);

  // Sync to localStorage
  useEffect(() => {
    if (useLocalStorage) {
      try {
        if (value.length === 0) {
          window.localStorage.removeItem(`filter_${key}`);
        } else {
          window.localStorage.setItem(`filter_${key}`, JSON.stringify(value));
        }
      } catch (error) {
        console.warn(`Failed to save filter_${key} to localStorage:`, error);
      }
    }
  }, [value, key, useLocalStorage]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const newValue = getInitialValue();
      setValue(newValue);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [searchParams]);

  const clearFilter = useCallback(() => {
    setValue([]);
  }, []);

  const setFilter = useCallback((newValue: string[] | ((prev: string[]) => string[])) => {
    setValue(newValue);
  }, []);

  return {
    value,
    setValue: setFilter,
    clearFilter,
    debouncedValue,
  };
}

// Hook for managing multiple filters - FIXED to follow Rules of Hooks
export function useFilters(filterConfigs: Record<string, UseFilterStateOptions>) {
  // CRITICAL FIX: Calculate all filter keys at top level to avoid calling hooks in loops
  const filterKeys = useMemo(() => Object.keys(filterConfigs), [filterConfigs]);

  // Call hooks at the top level for each filter (fixed number based on keys)
  const filterStates = useMemo(() => {
    return filterKeys.map(key => {
      const config = filterConfigs[key];
      return { key, config };
    });
  }, [filterKeys, filterConfigs]);

  // Create individual hook calls at top level
  const brandFilter = useFilterState(
    filterStates.find(f => f.key === 'brands')?.config || { defaultValue: [] }
  );
  const categoryFilter = useFilterState(
    filterStates.find(f => f.key === 'categories')?.config || { defaultValue: [] }
  );
  const locationFilter = useFilterState(
    filterStates.find(f => f.key === 'locations')?.config || { defaultValue: [] }
  );
  const regionFilter = useFilterState(
    filterStates.find(f => f.key === 'regions')?.config || { defaultValue: [] }
  );

  // Build filters object
  const filters = useMemo(() => {
    const result: Record<string, ReturnType<typeof useFilterState>> = {};
    if (filterConfigs.brands) result.brands = brandFilter;
    if (filterConfigs.categories) result.categories = categoryFilter;
    if (filterConfigs.locations) result.locations = locationFilter;
    if (filterConfigs.regions) result.regions = regionFilter;
    return result;
  }, [filterConfigs, brandFilter, categoryFilter, locationFilter, regionFilter]);

  const clearAllFilters = useCallback(() => {
    Object.values(filters).forEach(filter => filter.clearFilter());
  }, [filters]);

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some(filter => filter.value.length > 0),
    [filters]
  );

  return {
    filters,
    clearAllFilters,
    hasActiveFilters,
  };
}
