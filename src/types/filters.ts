export interface ConsumerFilters {
  category: string;
  brand: string;
  location: string;
  weekdayWeekend: 'all' | 'weekday' | 'weekend';
  // Array-based filters for drill-through navigation
  categories?: string[];
  brands?: string[];
  genders?: string[];
  ageGroups?: string[];
  locations?: string[];
  products?: string[];
  incomeRanges?: string[];
}

export interface DateRange {
  start: string;
  end: string;
}

export interface GlobalFilters extends ConsumerFilters {
  dateRange: DateRange;
}

// Safe array creation with defensive programming
const createSafeArray = <T>(): T[] => {
  try {
    return [] as T[];
  } catch (error) {
    console.error('Failed to create safe array:', error);
    return [] as T[];
  }
};

export const defaultConsumerFilters: ConsumerFilters = Object.freeze({
  category: 'All',
  brand: 'All',
  location: 'All',
  weekdayWeekend: 'all' as const,
  // Array-based filters for drill-through navigation - safely initialized
  categories: createSafeArray<string>(),
  brands: createSafeArray<string>(),
  genders: createSafeArray<string>(),
  ageGroups: createSafeArray<string>(),
  locations: createSafeArray<string>(),
  products: createSafeArray<string>(),
  incomeRanges: createSafeArray<string>()
});

export const defaultGlobalFilters: GlobalFilters = Object.freeze({
  ...defaultConsumerFilters,
  dateRange: Object.freeze({
    start: '2025-04-30',
    end: '2025-05-30'
  })
});

// Helper to check if any filters are active
export const hasActiveFilters = (filters: ConsumerFilters | GlobalFilters): boolean => {
  return filters.category !== 'All' || 
         filters.brand !== 'All' || 
         filters.location !== 'All' || 
         filters.weekdayWeekend !== 'all';
};

// Helper to count active filters
export const countActiveFilters = (filters: ConsumerFilters | GlobalFilters): number => {
  let count = 0;
  if (filters.category !== 'All') count++;
  if (filters.brand !== 'All') count++;
  if (filters.location !== 'All') count++;
  if (filters.weekdayWeekend !== 'all') count++;
  return count;
};

// Alias for backward compatibility
export const getActiveFiltersCount = countActiveFilters;

// Helper to get filter summary
export const getFilterSummary = (filters: ConsumerFilters | GlobalFilters): string[] => {
  const summary: string[] = [];
  if (filters.category !== 'All') summary.push(`Category: ${filters.category}`);
  if (filters.brand !== 'All') summary.push(`Brand: ${filters.brand}`);
  if (filters.location !== 'All') summary.push(`Location: ${filters.location}`);
  if (filters.weekdayWeekend !== 'all') summary.push(`Days: ${filters.weekdayWeekend}`);
  return summary;
};

// Product Mix specific filters
export interface ProductMixFilters extends ConsumerFilters {
  // Add any product mix specific filters here
}

// Default filter constants
export const DEFAULT_CONSUMER_FILTERS = defaultConsumerFilters;

// Filter options
export const AGE_GROUP_OPTIONS = [
  { value: 'All', label: 'All Ages' },
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55+', label: '55+' }
];

export const GENDER_OPTIONS = [
  { value: 'All', label: 'All Genders' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' }
];

export const LOCATION_OPTIONS = [
  { value: 'All', label: 'All Locations' },
  { value: 'Manila', label: 'Manila' },
  { value: 'Cebu', label: 'Cebu' },
  { value: 'Davao', label: 'Davao' },
  { value: 'Makati', label: 'Makati' },
  { value: 'Quezon City', label: 'Quezon City' }
];

export const INCOME_RANGE_OPTIONS = [
  { value: 'All', label: 'All Income Levels' },
  { value: '0-20k', label: '₱0 - ₱20k' },
  { value: '20k-50k', label: '₱20k - ₱50k' },
  { value: '50k-100k', label: '₱50k - ₱100k' },
  { value: '100k+', label: '₱100k+' }
];

// Helper to format date for queries
export const formatDateForQuery = (date: string | Date): string => {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
};