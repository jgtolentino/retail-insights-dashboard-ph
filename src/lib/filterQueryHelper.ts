import { supabase } from '@/integrations/supabase/client';

// Legacy interface for compatibility with existing hooks
export interface GlobalFilterState {
  dateRange?: { start: string | null; end: string | null };
  selectedBrands: string[];
  selectedCategories: string[];
  selectedRegions: string[];
  selectedStores: string[];
}

export interface FilterOptions {
  dateRange?: { start: string | null; end: string | null };
  selectedBrands?: string[];
  selectedCategories?: string[];
  selectedRegions?: string[];
  selectedStores?: string[];
}

/**
 * Central helper function that builds a Supabase query object
 * with all current global filters applied.
 * Every data-fetching hook should use this as the starting point.
 */
export function buildFilterQuery(filters: GlobalFilterState) {
  let query = supabase.from('transactions').select('*');

  // Apply date range filter
  if (filters.dateRange?.start && filters.dateRange?.end) {
    query = query
      .gte('created_at', `${filters.dateRange.start}T00:00:00Z`)
      .lte('created_at', `${filters.dateRange.end}T23:59:59Z`);
  }

  // Apply store filter first (most direct)
  if (filters.selectedStores && filters.selectedStores.length > 0) {
    query = query.in('store_id', filters.selectedStores);
  }

  // Apply region filter via stores (if no specific stores selected)
  if (
    filters.selectedRegions &&
    filters.selectedRegions.length > 0 &&
    (!filters.selectedStores || filters.selectedStores.length === 0)
  ) {
    // Get store IDs for selected regions
    query = query.in(
      'store_id',
      supabase.from('stores').select('id').in('region', filters.selectedRegions)
    );
  }

  return query;
}

/**
 * For brand and category filters, we need to filter at the transaction_items level
 * since brands/categories are properties of products, not transactions directly.
 * This function returns transaction IDs that match the product filters.
 */
export async function getFilteredTransactionIds(filters: GlobalFilterState) {
  // If no product-level filters, return null (no filtering needed)
  if (
    (!filters.selectedBrands || filters.selectedBrands.length === 0) &&
    (!filters.selectedCategories || filters.selectedCategories.length === 0)
  ) {
    return null;
  }

  let itemQuery = supabase
    .from('transaction_items')
    .select('transaction_id, product_id, brand_id, category');

  // Apply brand filter
  if (filters.selectedBrands && filters.selectedBrands.length > 0) {
    itemQuery = itemQuery.in(
      'brand_id',
      filters.selectedBrands.map(b => parseInt(b))
    );
  }

  // Apply category filter
  if (filters.selectedCategories && filters.selectedCategories.length > 0) {
    itemQuery = itemQuery.in('category', filters.selectedCategories);
  }

  const { data: filteredItems, error } = await itemQuery;

  if (error) {
    return null;
  }

  // Extract unique transaction IDs
  const transactionIds = [...new Set(filteredItems?.map(item => item.transaction_id))];
  return transactionIds;
}

/**
 * Enhanced version that applies all filters including product-level ones
 */
export async function buildCompleteFilterQuery(filters: GlobalFilterState) {
  let query = buildFilterQuery(filters);

  // Get transaction IDs that match product filters
  const filteredTransactionIds = await getFilteredTransactionIds(filters);

  if (filteredTransactionIds !== null) {
    query = query.in('id', filteredTransactionIds);
  }

  return query;
}

/**
 * Alternative version that accepts filters as parameters
 * instead of reading from global state. Useful for testing
 * or local filter scenarios.
 */
export function buildFilterQueryWithOptions(filterOptions: FilterOptions) {
  let query = supabase.from('transactions').select('*');

  // Apply date range filter
  if (filterOptions.dateRange?.start && filterOptions.dateRange?.end) {
    query = query
      .gte('created_at', filterOptions.dateRange.start)
      .lte('created_at', filterOptions.dateRange.end);
  }

  // Apply brand filter
  if (filterOptions.selectedBrands && filterOptions.selectedBrands.length > 0) {
    // Note: This is a simplified version - actual implementation
    // would need proper joins based on your schema
    query = query.in('brand_id', filterOptions.selectedBrands);
  }

  // Apply category filter
  if (filterOptions.selectedCategories && filterOptions.selectedCategories.length > 0) {
    query = query.in('category', filterOptions.selectedCategories);
  }

  // Apply region filter
  if (filterOptions.selectedRegions && filterOptions.selectedRegions.length > 0) {
    query = query.in('region', filterOptions.selectedRegions);
  }

  // Apply store filter
  if (filterOptions.selectedStores && filterOptions.selectedStores.length > 0) {
    query = query.in('store_id', filterOptions.selectedStores);
  }

  return query;
}

/**
 * Utility function to get filter options for dropdowns
 */
export async function getFilterOptions() {
  // Fetch brands
  const { data: brands, error: brandsError } = await supabase
    .from('brands')
    .select('id, name')
    .order('name');

  if (brandsError) {
  } else {
  }

  // Fetch categories
  const { data: categoriesRaw } = await supabase
    .from('brands')
    .select('category')
    .not('category', 'is', null)
    .order('category');

  const categories = [...new Set(categoriesRaw?.map(item => item.category))];

  // Fetch regions
  const { data: regionsRaw } = await supabase
    .from('stores')
    .select('region')
    .not('region', 'is', null)
    .order('region');

  const regions = [...new Set(regionsRaw?.map(item => item.region))];

  // Fetch stores
  const { data: stores } = await supabase.from('stores').select('id, name, city').order('name');

  return {
    brandOptions:
      brands?.map(brand => ({
        value: brand.id.toString(),
        label: brand.name,
      })) || [],
    categoryOptions: categories.map(category => ({
      value: category,
      label: category.charAt(0).toUpperCase() + category.slice(1),
    })),
    regionOptions: regions.map(region => ({
      value: region,
      label: region,
    })),
    storeOptions:
      stores?.map(store => ({
        value: store.id.toString(),
        label: `${store.name} (${store.city})`,
      })) || [],
  };
}
