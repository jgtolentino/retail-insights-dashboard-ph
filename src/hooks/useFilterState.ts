import { useState, useEffect, useCallback } from 'react';
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

// Hook for managing multiple filters
export function useFilters(filterConfigs: Record<string, UseFilterStateOptions>) {
  const filters: Record<string, ReturnType<typeof useFilterState>> = {};

  Object.entries(filterConfigs).forEach(([key, config]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    filters[key] = useFilterState({ ...config, key });
  });

  const clearAllFilters = useCallback(() => {
    Object.values(filters).forEach(filter => filter.clearFilter());
  }, [filters]);

  const hasActiveFilters = Object.values(filters).some(filter => filter.value.length > 0);

  return {
    filters,
    clearAllFilters,
    hasActiveFilters,
  };
}
