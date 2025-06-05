import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardStore } from '@/stores/dashboardStore';
import { shallow } from 'zustand/shallow';

export interface RegionalSalesData {
  region: string;
  total_sales: number;
  transaction_count: number;
  unique_customers: number;
  avg_transaction_value: number;
}

export function useRegionalSales() {
  // Subscribe to filters from new Zustand store
  const filters = useDashboardStore(state => state.filters, shallow);

  // Filters are already memoized in the store
  const stableFilters = useMemo(
    () => ({
      dateRange: filters.dateRange,
      selectedBrands: filters.selectedBrands,
      selectedCategories: filters.selectedCategories,
      selectedRegions: filters.selectedRegions,
    }),
    [filters]
  );

  // Stabilize the query key to prevent unnecessary re-renders
  const stableQueryKey = useMemo(
    () => ['regionalSales', JSON.stringify(stableFilters)],
    [stableFilters]
  );

  return useQuery({
    queryKey: stableQueryKey,
    queryFn: async () => {
      // Start with base query for transactions
      let query = supabase.from('transactions').select(`
          id,
          total_amount,
          customer_age,
          store_location,
          created_at
        `);

      // Apply date range filter using created_at
      if (stableFilters.dateRange.start) {
        query = query.gte('created_at', stableFilters.dateRange.start);
      }
      if (stableFilters.dateRange.end) {
        query = query.lte('created_at', stableFilters.dateRange.end);
      }

      // Apply brand filter if needed (using direct column query)
      if (stableFilters.selectedBrands.length > 0) {
        // Query transaction_items directly without foreign key joins
        const { data: brandTransactions } = await supabase
          .from('transaction_items')
          .select('transaction_id, brand_id')
          .in(
            'brand_id',
            stableFilters.selectedBrands.map(b => parseInt(b))
          );

        if (brandTransactions) {
          const transactionIds = [...new Set(brandTransactions.map(bt => bt.transaction_id))];
          query = query.in('id', transactionIds);
        }
      }

      // Apply category filter similarly
      if (stableFilters.selectedCategories.length > 0) {
        const { data: categoryTransactions } = await supabase
          .from('transaction_items')
          .select('transaction_id, category')
          .in('category', stableFilters.selectedCategories);

        if (categoryTransactions) {
          const transactionIds = [...new Set(categoryTransactions.map(ct => ct.transaction_id))];
          query = query.in('id', transactionIds);
        }
      }

      // Note: Region filter is applied after fetching since we need to check the stores relationship

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching regional sales:', error);
        throw error;
      }

      if (!data) return [];

      // Group by region and calculate metrics
      const regionMap = new Map<
        string,
        {
          sales: number;
          transactions: number;
          customers: Set<number>;
        }
      >();

      // Parse region from store_location (format: "City, Region")
      data.forEach(transaction => {
        const locationParts = transaction.store_location?.split(',') || [];
        const region = locationParts.length > 1 ? locationParts[1].trim() : 'Unknown';

        // Apply region filter if needed
        if (
          stableFilters.selectedRegions.length > 0 &&
          !stableFilters.selectedRegions.includes(region)
        ) {
          return;
        }

        if (!regionMap.has(region)) {
          regionMap.set(region, {
            sales: 0,
            transactions: 0,
            customers: new Set(),
          });
        }

        const regionData = regionMap.get(region)!;
        regionData.sales += transaction.total_amount || 0;
        regionData.transactions += 1;
        // Use customer_age as a proxy for unique customer (not ideal but works with current schema)
        if (transaction.customer_age) {
          regionData.customers.add(transaction.id); // Use transaction id for uniqueness
        }
      });

      // Convert to array format
      const regionalSales: RegionalSalesData[] = Array.from(regionMap.entries()).map(
        ([region, data]) => ({
          region,
          total_sales: Math.round(data.sales * 100) / 100,
          transaction_count: data.transactions,
          unique_customers: data.customers.size,
          avg_transaction_value:
            data.transactions > 0 ? Math.round((data.sales / data.transactions) * 100) / 100 : 0,
        })
      );

      return regionalSales.sort((a, b) => b.total_sales - a.total_sales);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
