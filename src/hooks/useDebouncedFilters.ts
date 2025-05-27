import { useEffect, useState, useRef } from 'react';
import { debounce } from 'lodash-es';
import type { GlobalFilters } from '@/types/filters';

interface UseDebouncedFiltersOptions {
  delay?: number;
  onFiltersChange?: (filters: GlobalFilters) => void;
}

export function useDebouncedFilters(
  filters: GlobalFilters,
  options: UseDebouncedFiltersOptions = {}
) {
  const { delay = 300, onFiltersChange } = options;
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [isDebouncing, setIsDebouncing] = useState(false);
  
  // Create debounced function
  const debouncedUpdate = useRef(
    debounce((newFilters: GlobalFilters) => {
      setDebouncedFilters(newFilters);
      setIsDebouncing(false);
      onFiltersChange?.(newFilters);
    }, delay)
  ).current;
  
  useEffect(() => {
    setIsDebouncing(true);
    debouncedUpdate(filters);
    
    return () => {
      debouncedUpdate.cancel();
    };
  }, [filters, debouncedUpdate]);
  
  return {
    debouncedFilters,
    isDebouncing
  };
}