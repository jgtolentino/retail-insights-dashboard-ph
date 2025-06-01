import { supabase } from '@/integrations/supabase/client';
import { useFilterStore, type GlobalFilterState } from '@/stores/filterStore';

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
export function buildFilterQuery() {
  // Get the current filter state from Zustand store
  const state = useFilterStore.getState();
  
  let query = supabase.from('transactions').select('*');

  // Apply date range filter
  if (state.dateRange?.start && state.dateRange?.end) {
    query = query
      .gte('created_at', state.dateRange.start)
      .lte('created_at', state.dateRange.end);
  }

  // Apply store filter first (most direct)
  if (state.selectedStores && state.selectedStores.length > 0) {
    query = query.in('store_id', state.selectedStores);
  }

  // Apply region filter via stores (if no specific stores selected)
  if (state.selectedRegions && state.selectedRegions.length > 0 && 
      (!state.selectedStores || state.selectedStores.length === 0)) {
    // Get store IDs for selected regions
    query = query.in('store_id',
      supabase
        .from('stores')
        .select('id')
        .in('region', state.selectedRegions)
    );
  }

  return query;
}

/**
 * For brand and category filters, we need to filter at the transaction_items level
 * since brands/categories are properties of products, not transactions directly.
 * This function returns transaction IDs that match the product filters.
 */
export async function getFilteredTransactionIds() {
  const state = useFilterStore.getState();
  
  // If no product-level filters, return null (no filtering needed)
  if ((!state.selectedBrands || state.selectedBrands.length === 0) &&
      (!state.selectedCategories || state.selectedCategories.length === 0)) {
    return null;
  }

  let itemQuery = supabase
    .from('transaction_items')
    .select(`
      transaction_id,
      products!inner (
        id,
        brand_id,
        brands!inner (
          id,
          name,
          category
        )
      )
    `);

  // Apply brand filter
  if (state.selectedBrands && state.selectedBrands.length > 0) {
    itemQuery = itemQuery.in('products.brand_id', state.selectedBrands);
  }

  // Apply category filter
  if (state.selectedCategories && state.selectedCategories.length > 0) {
    itemQuery = itemQuery.in('products.brands.category', state.selectedCategories);
  }

  const { data: filteredItems, error } = await itemQuery;
  
  if (error) {
    console.error('Error filtering by products:', error);
    return null;
  }

  // Extract unique transaction IDs
  const transactionIds = [...new Set(filteredItems?.map(item => item.transaction_id))];
  return transactionIds;
}

/**
 * Enhanced version that applies all filters including product-level ones
 */
export async function buildCompleteFilterQuery() {
  let query = buildFilterQuery();
  
  // Get transaction IDs that match product filters
  const filteredTransactionIds = await getFilteredTransactionIds();
  
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
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name')
    .order('name');

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
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, city')
    .order('name');

  return {
    brandOptions: brands?.map(brand => ({
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
    storeOptions: stores?.map(store => ({
      value: store.id.toString(),
      label: `${store.name} (${store.city})`,
    })) || [],
  };
}