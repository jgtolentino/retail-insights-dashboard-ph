import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

export interface GlobalFilterState {
  // Date range
  dateRange: {
    start: string | null;
    end: string | null;
  };

  // Multi-select filters
  selectedBrands: string[];
  selectedCategories: string[];
  selectedRegions: string[];
  selectedStores: string[];

  // Additional demographic filters
  selectedAgeGroups: string[];
  selectedGenders: string[];
  selectedIncomeRanges: string[];
}

interface FilterActions {
  // Date range actions
  setDateRange: (range: { start: string | null; end: string | null }) => void;

  // Multi-select actions
  setSelectedBrands: (brands: string[]) => void;
  setSelectedCategories: (categories: string[]) => void;
  setSelectedRegions: (regions: string[]) => void;
  setSelectedStores: (stores: string[]) => void;
  setSelectedAgeGroups: (ageGroups: string[]) => void;
  setSelectedGenders: (genders: string[]) => void;
  setSelectedIncomeRanges: (incomeRanges: string[]) => void;

  // Bulk actions
  updateFilters: (updates: Partial<GlobalFilterState>) => void;
  resetAllFilters: () => void;

  // Utility actions
  getActiveFiltersCount: () => number;
  getFilterSummary: () => string[];
}

type FilterStore = GlobalFilterState & FilterActions;

// Default state
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

export const useFilterStore = create<FilterStore>()(
  subscribeWithSelector((set, get) => ({
    ...defaultState,

    // Date range actions
    setDateRange: range => set({ dateRange: range }),

    // Multi-select actions
    setSelectedBrands: brands => set({ selectedBrands: brands }),

    setSelectedCategories: categories => set({ selectedCategories: categories }),

    setSelectedRegions: regions => set({ selectedRegions: regions }),

    setSelectedStores: stores => set({ selectedStores: stores }),

    setSelectedAgeGroups: ageGroups => set({ selectedAgeGroups: ageGroups }),

    setSelectedGenders: genders => set({ selectedGenders: genders }),

    setSelectedIncomeRanges: incomeRanges => set({ selectedIncomeRanges: incomeRanges }),

    // Bulk update
    updateFilters: updates => set(state => ({ ...state, ...updates })),

    // Reset all filters
    resetAllFilters: () => set(defaultState),

    // Utility functions
    getActiveFiltersCount: () => {
      const state = get();
      let count = 0;

      if (state.selectedBrands.length > 0) count++;
      if (state.selectedCategories.length > 0) count++;
      if (state.selectedRegions.length > 0) count++;
      if (state.selectedStores.length > 0) count++;
      if (state.selectedAgeGroups.length > 0) count++;
      if (state.selectedGenders.length > 0) count++;
      if (state.selectedIncomeRanges.length > 0) count++;

      // Check if date range is set
      if (state.dateRange.start && state.dateRange.end) count++;

      return count;
    },

    getFilterSummary: () => {
      const state = get();
      const summary: string[] = [];

      if (state.dateRange.start && state.dateRange.end) {
        summary.push(`Date: ${state.dateRange.start} to ${state.dateRange.end}`);
      }

      if (state.selectedBrands.length > 0) {
        summary.push(`${state.selectedBrands.length} brands`);
      }

      if (state.selectedCategories.length > 0) {
        summary.push(`${state.selectedCategories.length} categories`);
      }

      if (state.selectedRegions.length > 0) {
        summary.push(`${state.selectedRegions.length} regions`);
      }

      if (state.selectedStores.length > 0) {
        summary.push(`${state.selectedStores.length} stores`);
      }

      if (state.selectedAgeGroups.length > 0) {
        summary.push(`${state.selectedAgeGroups.length} age groups`);
      }

      if (state.selectedGenders.length > 0) {
        summary.push(`${state.selectedGenders.length} genders`);
      }

      if (state.selectedIncomeRanges.length > 0) {
        summary.push(`${state.selectedIncomeRanges.length} income ranges`);
      }

      return summary;
    },
  }))
);

// Hook selectors for better performance - these are actual React hooks
export const useDateRangeFilter = () => useFilterStore(state => state.dateRange, shallow);
export const useSelectedBrands = () => useFilterStore(state => state.selectedBrands, shallow);
export const useSelectedCategories = () =>
  useFilterStore(state => state.selectedCategories, shallow);
export const useSelectedRegions = () => useFilterStore(state => state.selectedRegions, shallow);
export const useSelectedStores = () => useFilterStore(state => state.selectedStores, shallow);

export const useAllFilters = () =>
  useFilterStore(
    state => ({
      dateRange: state.dateRange,
      selectedBrands: state.selectedBrands,
      selectedCategories: state.selectedCategories,
      selectedRegions: state.selectedRegions,
      selectedStores: state.selectedStores,
      selectedAgeGroups: state.selectedAgeGroups,
      selectedGenders: state.selectedGenders,
      selectedIncomeRanges: state.selectedIncomeRanges,
    }),
    shallow
  );

export const useFilterActions = () =>
  useFilterStore(
    state => ({
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
    }),
    shallow
  );

export const useActiveFiltersCount = () => useFilterStore(state => state.getActiveFiltersCount());

export const useFilterSummary = () => useFilterStore(state => state.getFilterSummary());

// URL persistence helper
export const persistFiltersToURL = () => {
  const state = useFilterStore.getState();
  const params = new URLSearchParams();

  if (state.dateRange.start && state.dateRange.end) {
    params.set('start', state.dateRange.start);
    params.set('end', state.dateRange.end);
  }

  if (state.selectedBrands.length > 0) {
    params.set('brands', state.selectedBrands.join(','));
  }

  if (state.selectedCategories.length > 0) {
    params.set('categories', state.selectedCategories.join(','));
  }

  if (state.selectedRegions.length > 0) {
    params.set('regions', state.selectedRegions.join(','));
  }

  if (state.selectedStores.length > 0) {
    params.set('stores', state.selectedStores.join(','));
  }

  // Update URL without refresh
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, '', newUrl);
};

// Load filters from URL helper
export const loadFiltersFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const updates: Partial<GlobalFilterState> = {};

  if (params.get('start') && params.get('end')) {
    updates.dateRange = {
      start: params.get('start'),
      end: params.get('end'),
    };
  }

  if (params.get('brands')) {
    updates.selectedBrands = params.get('brands')!.split(',').filter(Boolean);
  }

  if (params.get('categories')) {
    updates.selectedCategories = params.get('categories')!.split(',').filter(Boolean);
  }

  if (params.get('regions')) {
    updates.selectedRegions = params.get('regions')!.split(',').filter(Boolean);
  }

  if (params.get('stores')) {
    updates.selectedStores = params.get('stores')!.split(',').filter(Boolean);
  }

  if (Object.keys(updates).length > 0) {
    useFilterStore.getState().updateFilters(updates);
  }
};
