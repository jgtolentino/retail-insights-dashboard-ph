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
  // This comment is misleading, the subsequent hook calls are still conditional.
  // The fix is to call hooks unconditionally at the top level.
  // Call useFilterState unconditionally for each expected filter type.
  // Pass the config directly, providing a default if not present.
  const brandFilter = useFilterState(filterConfigs.brands || { key: 'brands', defaultValue: [] });
  const categoryFilter = useFilterState(
    filterConfigs.categories || { key: 'categories', defaultValue: [] }
  );
  const locationFilter = useFilterState(
    filterConfigs.locations || { key: 'locations', defaultValue: [] }
  );
  const regionFilter = useFilterState(
    filterConfigs.regions || { key: 'regions', defaultValue: [] }
  );

  // Build filters object - only include filters that were originally configured
  // This object's structure depends on input, but the hook calls are static.
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
