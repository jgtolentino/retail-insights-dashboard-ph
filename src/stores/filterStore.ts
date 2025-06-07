// LEGACY COMPATIBILITY LAYER - DO NOT USE FOR NEW CODE
// This file exists only to prevent build failures while migrating to dashboardStore.ts
// All new code should use @/stores/dashboardStore

import { createWithEqualityFn } from 'zustand/traditional';

export interface GlobalFilterState {
  dateRange: {
    start: string | null;
    end: string | null;
  };
  selectedBrands: string[];
  selectedCategories: string[];
  selectedRegions: string[];
  selectedStores: string[];
  selectedAgeGroups: string[];
  selectedGenders: string[];
  selectedIncomeRanges: string[];
}

interface FilterActions {
  setDateRange: (range: { start: string | null; end: string | null }) => void;
  setSelectedBrands: (brands: string[]) => void;
  setSelectedCategories: (categories: string[]) => void;
  setSelectedRegions: (regions: string[]) => void;
  setSelectedStores: (stores: string[]) => void;
  setSelectedAgeGroups: (ageGroups: string[]) => void;
  setSelectedGenders: (genders: string[]) => void;
  setSelectedIncomeRanges: (incomeRanges: string[]) => void;
  updateFilters: (updates: Partial<GlobalFilterState>) => void;
  resetAllFilters: () => void;
  getActiveFiltersCount: () => number;
  getFilterSummary: () => string[];
}

type FilterStore = GlobalFilterState & FilterActions;

const defaultState: GlobalFilterState = {
  dateRange: {
    start: null,
    end: null,
  },
  selectedBrands: [],
  selectedCategories: [],
  selectedRegions: [],
  selectedStores: [],
  selectedAgeGroups: [],
  selectedGenders: [],
  selectedIncomeRanges: [],
};

export const useFilterStore = createWithEqualityFn<FilterStore>()((set, get) => ({
  ...defaultState,

  setDateRange: range => set({ dateRange: range }),
  setSelectedBrands: brands => set({ selectedBrands: brands }),
  setSelectedCategories: categories => set({ selectedCategories: categories }),
  setSelectedRegions: regions => set({ selectedRegions: regions }),
  setSelectedStores: stores => set({ selectedStores: stores }),
  setSelectedAgeGroups: ageGroups => set({ selectedAgeGroups: ageGroups }),
  setSelectedGenders: genders => set({ selectedGenders: genders }),
  setSelectedIncomeRanges: incomeRanges => set({ selectedIncomeRanges: incomeRanges }),

  updateFilters: updates => set(updates),
  resetAllFilters: () => set(defaultState),

  getActiveFiltersCount: () => {
    const state = get();
    let count = 0;
    if (state.selectedCategories.length > 0) count++;
    if (state.selectedBrands.length > 0) count++;
    if (state.selectedRegions.length > 0) count++;
    if (state.selectedStores.length > 0) count++;
    if (state.selectedAgeGroups.length > 0) count++;
    if (state.selectedGenders.length > 0) count++;
    if (state.selectedIncomeRanges.length > 0) count++;
    if (state.dateRange.start && state.dateRange.end) count++;
    return count;
  },

  getFilterSummary: () => {
    const state = get();
    const summary: string[] = [];
    if (state.dateRange.start && state.dateRange.end) {
      summary.push(`Date: ${state.dateRange.start} to ${state.dateRange.end}`);
    }
    if (state.selectedCategories.length > 0) {
      summary.push(`${state.selectedCategories.length} categories`);
    }
    if (state.selectedBrands.length > 0) {
      summary.push(`${state.selectedBrands.length} brands`);
    }
    if (state.selectedRegions.length > 0) {
      summary.push(`${state.selectedRegions.length} regions`);
    }
    if (state.selectedStores.length > 0) {
      summary.push(`${state.selectedStores.length} stores`);
    }
    return summary;
  },
}));

export const useFilterActions = () =>
  useFilterStore(state => ({
    setDateRange: state.setDateRange,
    setSelectedBrands: state.setSelectedBrands,
    setSelectedCategories: state.setSelectedCategories,
    setSelectedRegions: state.setSelectedRegions,
    setSelectedStores: state.setSelectedStores,
    setSelectedAgeGroups: state.setSelectedAgeGroups,
    setSelectedGenders: state.setSelectedGenders,
    setSelectedIncomeRanges: state.setSelectedIncomeRanges,
    updateFilters: state.updateFilters,
    resetAllFilters: state.resetAllFilters,
  }));

export const useAllFilters = () => useFilterStore(state => state);
