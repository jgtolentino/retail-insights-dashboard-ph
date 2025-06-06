import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface DateRange {
  start: string;
  end: string;
  preset?: '7d' | '30d' | '90d' | 'custom';
}

export interface GlobalFiltersState {
  // Filter values
  dateRange: DateRange;
  selectedBrands: string[];
  selectedRegions: string[];
  selectedCategories: string[];
  selectedStores: string[];
  
  // UI state
  isFilterDrawerOpen: boolean;
  isDarkMode: boolean;
  activeChart: string | null;
  
  // Actions
  setDateRange: (range: DateRange) => void;
  toggleBrand: (brand: string) => void;
  toggleRegion: (region: string) => void;
  toggleCategory: (category: string) => void;
  toggleStore: (store: string) => void;
  
  // Bulk operations
  setBrands: (brands: string[]) => void;
  setRegions: (regions: string[]) => void;
  setCategories: (categories: string[]) => void;
  
  // UI actions
  toggleFilterDrawer: () => void;
  closeFilterDrawer: () => void;
  toggleDarkMode: () => void;
  setActiveChart: (chartId: string | null) => void;
  
  // Reset
  resetFilters: () => void;
  resetAllFilters: () => void;
  
  // Computed values
  hasActiveFilters: () => boolean;
  getFilterSummary: () => string;
}

export const useGlobalFilters = create<GlobalFiltersState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      preset: '30d'
    },
    selectedBrands: [],
    selectedRegions: [],
    selectedCategories: [],
    selectedStores: [],
    
    // UI state
    isFilterDrawerOpen: false,
    isDarkMode: false,
    activeChart: null,
    
    // Filter actions
    setDateRange: (range) => set({ dateRange: range }),
    
    toggleBrand: (brand) => set((state) => ({
      selectedBrands: state.selectedBrands.includes(brand)
        ? state.selectedBrands.filter(b => b !== brand)
        : [...state.selectedBrands, brand]
    })),
    
    toggleRegion: (region) => set((state) => ({
      selectedRegions: state.selectedRegions.includes(region)
        ? state.selectedRegions.filter(r => r !== region)
        : [...state.selectedRegions, region]
    })),
    
    toggleCategory: (category) => set((state) => ({
      selectedCategories: state.selectedCategories.includes(category)
        ? state.selectedCategories.filter(c => c !== category)
        : [...state.selectedCategories, category]
    })),
    
    toggleStore: (store) => set((state) => ({
      selectedStores: state.selectedStores.includes(store)
        ? state.selectedStores.filter(s => s !== store)
        : [...state.selectedStores, store]
    })),
    
    // Bulk operations
    setBrands: (brands) => set({ selectedBrands: brands }),
    setRegions: (regions) => set({ selectedRegions: regions }),
    setCategories: (categories) => set({ selectedCategories: categories }),
    
    // UI actions
    toggleFilterDrawer: () => set((state) => ({ 
      isFilterDrawerOpen: !state.isFilterDrawerOpen 
    })),
    
    closeFilterDrawer: () => set({ isFilterDrawerOpen: false }),
    
    toggleDarkMode: () => set((state) => ({ 
      isDarkMode: !state.isDarkMode 
    })),
    
    setActiveChart: (chartId) => set({ activeChart: chartId }),
    
    // Reset functions
    resetFilters: () => set({
      selectedBrands: [],
      selectedRegions: [],
      selectedCategories: [],
      selectedStores: []
    }),
    
    resetAllFilters: () => set({
      selectedBrands: [],
      selectedRegions: [],
      selectedCategories: [],
      selectedStores: [],
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        preset: '30d'
      }
    }),
    
    // Computed values
    hasActiveFilters: () => {
      const state = get();
      return state.selectedBrands.length > 0 ||
             state.selectedRegions.length > 0 ||
             state.selectedCategories.length > 0 ||
             state.selectedStores.length > 0;
    },
    
    getFilterSummary: () => {
      const state = get();
      const parts = [];
      
      if (state.selectedBrands.length > 0) {
        parts.push(`${state.selectedBrands.length} brand${state.selectedBrands.length !== 1 ? 's' : ''}`);
      }
      
      if (state.selectedRegions.length > 0) {
        parts.push(`${state.selectedRegions.length} region${state.selectedRegions.length !== 1 ? 's' : ''}`);
      }
      
      if (state.selectedCategories.length > 0) {
        parts.push(`${state.selectedCategories.length} categor${state.selectedCategories.length !== 1 ? 'ies' : 'y'}`);
      }
      
      return parts.length > 0 ? parts.join(', ') : 'No filters applied';
    }
  }))
);

// Export selectors for performance
export const useDateRange = () => useGlobalFilters(state => state.dateRange);
export const useSelectedBrands = () => useGlobalFilters(state => state.selectedBrands);
export const useSelectedRegions = () => useGlobalFilters(state => state.selectedRegions);
export const useFilterActions = () => useGlobalFilters(state => ({
  toggleBrand: state.toggleBrand,
  toggleRegion: state.toggleRegion,
  toggleCategory: state.toggleCategory,
  resetFilters: state.resetFilters
}));

// Hook for cross-filtering effects
export const useCrossFilterEffect = (callback: () => void) => {
  useGlobalFilters.subscribe(
    (state) => [state.selectedBrands, state.selectedRegions, state.selectedCategories, state.dateRange],
    callback
  );
};