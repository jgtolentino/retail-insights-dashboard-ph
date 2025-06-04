
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DateRange {
  start: string;
  end: string;
}

export interface FilterState {
  selectedCategories: string[];
  selectedBrands: string[];
  selectedRegions: string[];
  selectedStores: string[];
  dateRange: DateRange;
  setSelectedCategories: (categories: string[]) => void;
  setSelectedBrands: (brands: string[]) => void;
  setSelectedRegions: (regions: string[]) => void;
  setSelectedStores: (stores: string[]) => void;
  setDateRange: (range: DateRange) => void;
  resetAllFilters: () => void;
}

const FilterContext = createContext<FilterState | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: '',
    end: ''
  });

  const resetAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedRegions([]);
    setSelectedStores([]);
    setDateRange({ start: '', end: '' });
  };

  const value: FilterState = {
    selectedCategories,
    selectedBrands,
    selectedRegions,
    selectedStores,
    dateRange,
    setSelectedCategories,
    setSelectedBrands,
    setSelectedRegions,
    setSelectedStores,
    setDateRange,
    resetAllFilters
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = (): FilterState => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
