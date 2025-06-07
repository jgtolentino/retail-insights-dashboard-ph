import { createWithEqualityFn } from 'zustand/traditional';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DashboardFilters {
  dateRange: DateRange;
  categories: string[];
  brands: string[];
  stores: string[];
  regions: string[];
  ageGroups: string[];
  genders: string[];
  incomeRanges: string[];
  priceRanges: string[];
}

export interface DashboardState {
  // Core filters state
  filters: DashboardFilters;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions - No callback dependencies!
  updateFilters: (updates: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors - Memoized automatically by Zustand
  getActiveFilterCount: () => number;
  getFilterSummary: () => string[];
  hasActiveFilters: () => boolean;
}

const initialFilters: DashboardFilters = {
  dateRange: { from: null, to: null },
  categories: [],
  brands: [],
  stores: [],
  regions: [],
  ageGroups: [],
  genders: [],
  incomeRanges: [],
  priceRanges: [],
};

export const useDashboardStore = createWithEqualityFn<DashboardState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      filters: initialFilters,
      isLoading: false,
      error: null,

      // Actions - Pure, no side effects
      updateFilters: updates =>
        set(state => {
          Object.assign(state.filters, updates);
        }),

      resetFilters: () =>
        set(state => {
          state.filters = { ...initialFilters };
        }),

      setLoading: loading =>
        set(state => {
          state.isLoading = loading;
        }),

      setError: error =>
        set(state => {
          state.error = error;
        }),

      // Selectors - No re-renders unless actual data changes
      getActiveFilterCount: () => {
        const { filters } = get();
        let count = 0;

        if (filters.categories.length > 0) count++;
        if (filters.brands.length > 0) count++;
        if (filters.stores.length > 0) count++;
        if (filters.regions.length > 0) count++;
        if (filters.ageGroups.length > 0) count++;
        if (filters.genders.length > 0) count++;
        if (filters.incomeRanges.length > 0) count++;
        if (filters.priceRanges.length > 0) count++;
        if (filters.dateRange.from && filters.dateRange.to) count++;

        return count;
      },

      getFilterSummary: () => {
        const { filters } = get();
        const summary: string[] = [];

        if (filters.dateRange.from && filters.dateRange.to) {
          summary.push(
            `Date: ${filters.dateRange.from.toDateString()} to ${filters.dateRange.to.toDateString()}`
          );
        }

        if (filters.categories.length > 0) {
          summary.push(`${filters.categories.length} categories`);
        }

        if (filters.brands.length > 0) {
          summary.push(`${filters.brands.length} brands`);
        }

        if (filters.stores.length > 0) {
          summary.push(`${filters.stores.length} stores`);
        }

        if (filters.regions.length > 0) {
          summary.push(`${filters.regions.length} regions`);
        }

        return summary;
      },

      hasActiveFilters: () => {
        return get().getActiveFilterCount() > 0;
      },
    })),
    {
      name: 'dashboard-store', // For Redux DevTools
    }
  )
);

// Selector hooks for optimal re-render control
export const useFilters = () => useDashboardStore(state => state.filters);
export const useFilterActions = () =>
  useDashboardStore(state => ({
    updateFilters: state.updateFilters,
    resetFilters: state.resetFilters,
  }));
export const useActiveFilterCount = () => useDashboardStore(state => state.getActiveFilterCount());
export const useHasActiveFilters = () => useDashboardStore(state => state.hasActiveFilters());
