import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '../stores/filterStore'; // Changed 'store' to 'stores'
import { buildCompleteFilterQuery } from '../utils/buildCompleteFilterQuery';
import { shallow } from 'zustand/shallow';

export interface RegionalSalesData {
  region: string;
  total_sales: number;
  transaction_count: number;
  unique_customers: number;
  avg_transaction_value: number;
}

export function useRegionalSales() {
  const filterSelector = (s: ReturnType<typeof useFilterStore>) => ({
    startDate: s.startDate,
    endDate: s.endDate,
    selectedBrands: s.selectedBrands,
    selectedRegions: s.selectedRegions,
    minConfidence: s.minConfidence,
  });

  const filters = useFilterStore(filterSelector, shallow);
  const query = useMemo(() => buildCompleteFilterQuery(filters), [filters]);
  const stableQueryKey = useMemo(() => ['regionalSales', query], [filters]);

  return useQuery({
    queryKey: stableQueryKey,
    queryFn: async () => {
      let query = supabase.from('transactions').select(`
          id,
          total_amount,
          customer_age,
          store_location,
          created_at
        `);

      // Apply date range filter using interaction_date
      if (filters.startDate && filters.endDate) {
        query = query
          .gte('interaction_date', filters.startDate)
          .lte('interaction_date', filters.endDate);
      }
      // Apply confidence filter
      if (filters.minConfidence !== undefined) {
        query = query.gte('nlp_confidence_score', filters.minConfidence);
      }

      // Apply brand filter if needed (using existing logic with new `filters` object)
      if (filters.selectedBrands && filters.selectedBrands.length > 0) {
        const { data: brandTransactions } = await supabase
          .from('transaction_items')
          .select('transaction_id, brand_id')
          .in(
            'brand_id',
            filters.selectedBrands.map(b => parseInt(b)) // Assuming brand_id is number
          );

        if (brandTransactions) {
          const transactionIds = [...new Set(brandTransactions.map(bt => bt.transaction_id))];
          query = query.in('id', transactionIds);
        }
      }

      // Apply category filter similarly (using existing logic with new `filters` object)
      // Note: filters.selectedCategories might not be populated if not in standard filterSelector
      if (filters.selectedCategories && filters.selectedCategories.length > 0) {
        const { data: categoryTransactions } = await supabase
          .from('transaction_items')
          .select('transaction_id, category')
          .in('category', filters.selectedCategories);

        if (categoryTransactions) {
          const transactionIds = [...new Set(categoryTransactions.map(ct => ct.transaction_id))];
          query = query.in('id', transactionIds);
        }
      }

      const { data, error } = await query;

      if (error) {
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

        // Apply region filter if needed (using new `filters` object)
        if (
          filters.selectedRegions &&
          filters.selectedRegions.length > 0 && // Ensure filters.selectedRegions is checked
          !filters.selectedRegions.includes(region)
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
