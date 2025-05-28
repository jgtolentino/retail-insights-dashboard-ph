
// Filter types for multi-select functionality across dashboards

export interface BaseFilters {
  startDate: Date;
  endDate: Date;
}

export interface GlobalFilters {
  startDate: Date;
  endDate: Date;
  categories: string[];
  brands: string[];
  products: string[];
  ageGroups: string[];
  genders: string[];
  locations: string[];
  incomeRanges: string[];
}

export interface ProductMixFilters extends BaseFilters {
  categories: string[];
  brands: string[];
  products: string[];
}

export interface ConsumerFilters extends BaseFilters {
  categories: string[];
  brands: string[];
  products: string[];
  ageGroups: string[];
  genders: string[];
  locations: string[];
  incomeRanges: string[];
}

// Age group options for consistent use across components
export const AGE_GROUP_OPTIONS = [
  { label: "18-24", value: "18-24" },
  { label: "25-34", value: "25-34" },
  { label: "35-44", value: "35-44" },
  { label: "45-54", value: "45-54" },
  { label: "55-64", value: "55-64" },
  { label: "65+", value: "65+" },
];

// Gender options
export const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
  { label: "Prefer not to say", value: "Unknown" },
];

// Income range options (in PHP)
export const INCOME_RANGE_OPTIONS = [
  { label: "Under ₱15,000", value: "0-15000" },
  { label: "₱15,000 - ₱30,000", value: "15000-30000" },
  { label: "₱30,000 - ₱50,000", value: "30000-50000" },
  { label: "₱50,000 - ₱75,000", value: "50000-75000" },
  { label: "₱75,000 - ₱100,000", value: "75000-100000" },
  { label: "Over ₱100,000", value: "100000+" },
];

// Location options (major Philippine cities)
export const LOCATION_OPTIONS = [
  { label: "Metro Manila", value: "metro-manila" },
  { label: "Cebu City", value: "cebu" },
  { label: "Davao City", value: "davao" },
  { label: "Iloilo City", value: "iloilo" },
  { label: "Bacolod City", value: "bacolod" },
  { label: "Cagayan de Oro", value: "cagayan-de-oro" },
  { label: "Zamboanga City", value: "zamboanga" },
  { label: "Other", value: "other" },
];

// Category options
export const CATEGORY_OPTIONS = [
  { label: "Cigarettes", value: "Cigarettes" },
  { label: "Beverages", value: "Beverages" },
  { label: "Snacks", value: "Snacks" },
  { label: "Personal Care", value: "Personal Care" },
  { label: "Candy", value: "Candy" },
  { label: "Household", value: "Household" },
];

// Brand options
export const BRAND_OPTIONS = [
  { label: "Marlboro", value: "Marlboro" },
  { label: "Philip Morris", value: "Philip Morris" },
  { label: "Fortune", value: "Fortune" },
  { label: "Hope", value: "Hope" },
  { label: "More", value: "More" },
  { label: "Champion", value: "Champion" },
];

// Product options
export const PRODUCT_OPTIONS = [
  { label: "Marlboro Red", value: "Marlboro Red" },
  { label: "Philip Morris Blue", value: "Philip Morris Blue" },
  { label: "Fortune Green", value: "Fortune Green" },
  { label: "Hope Lights", value: "Hope Lights" },
  { label: "More Menthol", value: "More Menthol" },
  { label: "Champion Gold", value: "Champion Gold" },
];

// Default filter values
export const DEFAULT_GLOBAL_FILTERS: GlobalFilters = {
  startDate: new Date('2025-04-30'),
  endDate: new Date('2025-05-30'),
  categories: [],
  brands: [],
  products: [],
  ageGroups: [],
  genders: [],
  locations: [],
  incomeRanges: [],
};

export const DEFAULT_PRODUCT_MIX_FILTERS: ProductMixFilters = {
  startDate: new Date('2025-04-30'),
  endDate: new Date('2025-05-30'),
  categories: [],
  brands: [],
  products: [],
};

export const DEFAULT_CONSUMER_FILTERS: ConsumerFilters = {
  startDate: new Date('2025-04-30'),
  endDate: new Date('2025-05-30'),
  categories: [],
  brands: [],
  products: [],
  ageGroups: [],
  genders: [],
  locations: [],
  incomeRanges: [],
};

// Utility functions
export function formatDateForQuery(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getActiveFiltersCount(filters: ConsumerFilters | ProductMixFilters | GlobalFilters): number {
  let count = 0;
  if ('categories' in filters && filters.categories.length > 0) count++;
  if ('brands' in filters && filters.brands.length > 0) count++;
  if ('products' in filters && filters.products.length > 0) count++;
  if ('ageGroups' in filters && filters.ageGroups.length > 0) count++;
  if ('genders' in filters && filters.genders.length > 0) count++;
  if ('locations' in filters && filters.locations.length > 0) count++;
  if ('incomeRanges' in filters && filters.incomeRanges.length > 0) count++;
  return count;
}

export function getFilterSummary(filters: ConsumerFilters | ProductMixFilters | GlobalFilters): string[] {
  const summary: string[] = [];
  
  if ('categories' in filters && filters.categories.length > 0) {
    summary.push(`${filters.categories.length} categories`);
  }
  if ('brands' in filters && filters.brands.length > 0) {
    summary.push(`${filters.brands.length} brands`);
  }
  if ('products' in filters && filters.products.length > 0) {
    summary.push(`${filters.products.length} products`);
  }
  if ('ageGroups' in filters && filters.ageGroups.length > 0) {
    summary.push(`${filters.ageGroups.length} age groups`);
  }
  if ('genders' in filters && filters.genders.length > 0) {
    summary.push(`${filters.genders.length} genders`);
  }
  if ('locations' in filters && filters.locations.length > 0) {
    summary.push(`${filters.locations.length} locations`);
  }
  if ('incomeRanges' in filters && filters.incomeRanges.length > 0) {
    summary.push(`${filters.incomeRanges.length} income ranges`);
  }
  
  return summary;
}
