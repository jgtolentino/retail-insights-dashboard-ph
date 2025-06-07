import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { handleApiError } from '@/stores/errorStore';
import { useFilterStore } from '@/stores/filterStore';
import { shallow } from 'zustand/traditional';

// Query key factory for consistent caching
export const queryKeys = {
  all: ['dashboard'] as const,

  // Brands
  brands: () => [...queryKeys.all, 'brands'] as const,
  brand: (id: string) => [...queryKeys.brands(), id] as const,

  // Transactions
  transactions: (filters?: any) => [...queryKeys.all, 'transactions', filters] as const,
  transactionsSummary: (filters?: any) => [...queryKeys.transactions(filters), 'summary'] as const,

  // Sales
  sales: (filters?: any) => [...queryKeys.all, 'sales', filters] as const,
  salesByBrand: (filters?: any) => [...queryKeys.sales(filters), 'by-brand'] as const,
  salesByRegion: (filters?: any) => [...queryKeys.sales(filters), 'by-region'] as const,

  // Analytics
  analytics: (filters?: any) => [...queryKeys.all, 'analytics', filters] as const,
  customerDensity: (level: string, filters?: any) =>
    [...queryKeys.analytics(filters), 'customer-density', level] as const,
  storePerformance: (filters?: any) =>
    [...queryKeys.analytics(filters), 'store-performance'] as const,

  // Filters
  filterOptions: () => [...queryKeys.all, 'filter-options'] as const,
} as const;

// Generic API functions with error handling
const apiCall = async <T>(fn: () => Promise<{ data: T | null; error: any }>): Promise<T> => {
  try {
    const { data, error } = await fn();

    if (error) {
      handleApiError(error);
      throw new Error(error.message || 'Database query failed');
    }

    if (data === null) {
      throw new Error('No data returned from query');
    }

    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Brands API
export const brandsApi = {
  getAll: () =>
    apiCall(() => supabase.from('brands').select('id, name, category, is_client').order('name')),

  getById: (id: string) => apiCall(() => supabase.from('brands').select('*').eq('id', id).single()),
};

// Transactions API with filters
export const transactionsApi = {
  getFiltered: async (filters: any) => {
    let query = supabase.from('transactions').select(`
      id,
      created_at,
      store_id,
      customer_id,
      total_amount,
      stores (
        id,
        name,
        city,
        region
      )
    `);

    // Apply date range filter
    if (filters.dateRange?.start && filters.dateRange?.end) {
      query = query
        .gte('created_at', `${filters.dateRange.start}T00:00:00Z`)
        .lte('created_at', `${filters.dateRange.end}T23:59:59Z`);
    }

    if (filters.selectedStores?.length > 0) {
      query = query.in('store_id', filters.selectedStores);
    }

    // Add brand/category filtering through transaction_items
    if (filters.selectedBrands?.length > 0 || filters.selectedCategories?.length > 0) {
      // First get transaction IDs that match product filters
      let itemQuery = supabase.from('transaction_items').select('transaction_id');

      if (filters.selectedBrands?.length > 0) {
        itemQuery = itemQuery.in(
          'brand_id',
          filters.selectedBrands.map((b: string) => parseInt(b))
        );
      }

      if (filters.selectedCategories?.length > 0) {
        itemQuery = itemQuery.in('category', filters.selectedCategories);
      }

      // Add null checks with correct syntax
      itemQuery = itemQuery
        .not('transaction_id', 'is', null)
        .not('brand_id', 'is', null);

      const { data: filteredItems, error: itemsError } = await itemQuery;

      if (itemsError) {
        handleApiError(itemsError);
        throw itemsError;
      }

      const transactionIds = [...new Set(filteredItems?.map(item => item.transaction_id))];

      if (transactionIds.length > 0) {
        query = query.in('id', transactionIds);
      } else {
        // No matching transactions
        return [];
      }
    }

    // Process all transactions without limit);

    return apiCall(() => finalQuery);
  },

  getSummary: async (filters: any) => {
    const transactions = await transactionsApi.getFiltered(filters);

    return {
      totalTransactions: transactions.length,
      totalRevenue: transactions.reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0),
      avgTransactionValue:
        transactions.length > 0
          ? transactions.reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0) /
            transactions.length
          : 0,
      uniqueStores: new Set(transactions.map((t: any) => t.store_id)).size,
    };
  },
};

// Sales API
export const salesApi = {
  getByBrand: (filters: any) =>
    apiCall(async () => {
      let query = supabase.from('transaction_items').select(`
        quantity,
        price,
        brand_id,
        brands (
          id,
          name,
          category,
          is_client
        )
      `);

      if (filters.selectedBrands?.length > 0) {
        query = query.in(
          'brand_id',
          filters.selectedBrands.map((b: string) => parseInt(b))
        );
      }

      if (filters.selectedCategories?.length > 0) {
        query = query.in('category', filters.selectedCategories);
      }

      return query.order('brand_id');
    }),

  getByRegion: (filters: any) =>
    apiCall(() =>
      supabase.rpc('get_sales_by_region', {
        start_date: filters.dateRange?.start,
        end_date: filters.dateRange?.end,
      })
    ),
};

// Analytics API
export const analyticsApi = {
  getCustomerDensity: (level: 'barangay' | 'city' | 'province', filters: any) =>
    apiCall(() =>
      supabase.rpc('get_customer_density', {
        aggregation_level: level,
        start_date: filters.dateRange?.start,
        end_date: filters.dateRange?.end,
      })
    ),

  getStorePerformance: (filters: any) =>
    apiCall(() =>
      supabase.rpc('get_store_performance', {
        start_date: filters.dateRange?.start,
        end_date: filters.dateRange?.end,
      })
    ),
};

// Filter options API
export const filterOptionsApi = {
  getAll: async () => {
    const [brands, categories, regions, stores] = await Promise.all([
      apiCall(() => supabase.from('brands').select('id, name').order('name')),
      apiCall(() => supabase.from('brands').select('category').not('category', 'is', null)),
      apiCall(() => supabase.from('stores').select('region').not('region', 'is', null)),
      apiCall(() => supabase.from('stores').select('id, name, city').order('name')),
    ]);

    return {
      brandOptions: brands.map((brand: any) => ({
        value: brand.id.toString(),
        label: brand.name,
      })),
      categoryOptions: [...new Set(categories.map((c: any) => c.category))].map(
        (category: string) => ({
          value: category,
          label: category.charAt(0).toUpperCase() + category.slice(1),
        })
      ),
      regionOptions: [...new Set(regions.map((r: any) => r.region))].map((region: string) => ({
        value: region,
        label: region,
      })),
      storeOptions: stores.map((store: any) => ({
        value: store.id.toString(),
        label: `${store.name} (${store.city})`,
      })),
    };
  },
};

// Custom hooks using React Query
export const useApiQuery = <T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 400-499 errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
};

// Specific hooks with filters integration
export const useBrands = (options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) => {
  return useApiQuery(queryKeys.brands(), brandsApi.getAll, options);
};

export const useTransactions = (options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) => {
  const filters = useFilterStore(
    state => ({
      dateRange: state.dateRange,
      selectedBrands: state.selectedBrands,
      selectedCategories: state.selectedCategories,
      selectedRegions: state.selectedRegions,
      selectedStores: state.selectedStores,
    }),
    shallow
  );

  return useApiQuery(
    queryKeys.transactions(filters),
    () => transactionsApi.getFiltered(filters),
    options
  );
};

export const useTransactionsSummary = (
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) => {
  const filters = useFilterStore(
    state => ({
      dateRange: state.dateRange,
      selectedBrands: state.selectedBrands,
      selectedCategories: state.selectedCategories,
      selectedRegions: state.selectedRegions,
      selectedStores: state.selectedStores,
    }),
    shallow
  );

  return useApiQuery(
    queryKeys.transactionsSummary(filters),
    () => transactionsApi.getSummary(filters),
    {
      staleTime: 30 * 1000, // 30 seconds for summary data
      ...options,
    }
  );
};

export const useFilterOptions = (options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) => {
  return useApiQuery(queryKeys.filterOptions(), filterOptionsApi.getAll, {
    staleTime: 15 * 60 * 1000, // 15 minutes - filter options don't change often
    cacheTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
};

// Mutation helpers
export const useApiMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onError: error => {
      handleApiError(error);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
    ...options,
  });
};

// Cache invalidation helpers
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: queryKeys.all }),
    invalidateBrands: () => queryClient.invalidateQueries({ queryKey: queryKeys.brands() }),
    invalidateTransactions: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() }),
    invalidateSales: () => queryClient.invalidateQueries({ queryKey: queryKeys.sales() }),
    invalidateAnalytics: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics() }),
  };
};
