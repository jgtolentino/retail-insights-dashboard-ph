import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '../stores/filterStore'; // Changed 'store' to 'stores'
import { buildCompleteFilterQuery } from '../utils/buildCompleteFilterQuery';
import { shallow } from 'zustand/shallow';
import { logger } from '@/utils/logger';

export interface StorePerformanceData {
  id: number;
  name: string;
  location: string;
  region: string;
  latitude?: number;
  longitude?: number;
  total_revenue: number;
  transaction_count: number;
  unique_customers: number;
  avg_transaction_value: number;
  growth_rate?: number;
}

export function useStorePerformance() {
  const filterSelector = (s: ReturnType<typeof useFilterStore>) => ({
    startDate: s.startDate,
    endDate: s.endDate,
    selectedBrands: s.selectedBrands,
    selectedRegions: s.selectedRegions,
    minConfidence: s.minConfidence,
    // selectedCategories is not in the standard selector
  });

  const filters = useFilterStore(filterSelector, shallow);
  const query = useMemo(() => buildCompleteFilterQuery(filters), [filters]);
  const stableQueryKey = useMemo(() => ['storePerformance', query], [filters]);

  return useQuery({
    queryKey: stableQueryKey,
    queryFn: async () => {
      // First get stores data
      const { data: stores } = await supabase.from('stores').select('*');

      if (!stores || stores.length === 0) return [];

      // Build transaction query with filters
      let transactionsQuery = supabase.from('transactions').select(`
          id,
          store_location,
          total_amount,
          customer_age,
          created_at
        `);

      // Apply date range filter from new `filters` object
      if (filters.startDate && filters.endDate) {
        transactionsQuery = transactionsQuery
          .gte('interaction_date', filters.startDate)
          .lte('interaction_date', filters.endDate);
      }
      // Apply confidence filter
      if (filters.minConfidence !== undefined) {
        transactionsQuery = transactionsQuery.gte('nlp_confidence_score', filters.minConfidence);
      }

      // Get initially filtered transactions
      const { data: transactions, error } = await transactionsQuery;

      if (error) {
        throw error;
      }

      if (!transactions) return [];

      // Apply brand/category filters if needed
      let filteredTransactionIds = transactions.map(t => t.id); // Assuming transactions is not null due to check below

      // Apply brand/category filters if needed (using new `filters` object)
      // Note: filters.selectedCategories might not be populated if not in standard filterSelector
      if (
        (filters.selectedBrands && filters.selectedBrands.length > 0) ||
        (filters.selectedCategories && filters.selectedCategories.length > 0)
      ) {
        let itemsQuery = supabase
          .from('transaction_items')
          .select('transaction_id, brand_id, category');

        if (filters.selectedBrands && filters.selectedBrands.length > 0) {
          itemsQuery = itemsQuery.in(
            'brand_id',
            filters.selectedBrands.map(b => parseInt(b)) // Assuming brand_id is number
          );
        }

        if (filters.selectedCategories && filters.selectedCategories.length > 0) {
          itemsQuery = itemsQuery.in('category', filters.selectedCategories);
        }

        const { data: filteredItems } = await itemsQuery;

        if (filteredItems) {
          filteredTransactionIds = [...new Set(filteredItems.map(item => item.transaction_id))];
        }
      }

      // Filter transactions by filtered IDs
      const relevantTransactions = transactions.filter(t => filteredTransactionIds.includes(t.id));

      // Group by store location and calculate metrics
      const storeMap = new Map<
        string,
        {
          revenue: number;
          transactions: number;
          customers: Set<number>;
        }
      >();

      relevantTransactions.forEach(transaction => {
        if (!transaction.store_location) return;

        if (!storeMap.has(transaction.store_location)) {
          storeMap.set(transaction.store_location, {
            revenue: 0,
            transactions: 0,
            customers: new Set(),
          });
        }

        const storeData = storeMap.get(transaction.store_location)!;
        storeData.revenue += transaction.total_amount || 0;
        storeData.transactions += 1;
        // Use transaction id as proxy for unique customers
        if (transaction.id) {
          storeData.customers.add(transaction.id);
        }
      });

      // Combine with store information
      const storePerformance: StorePerformanceData[] = stores
        .filter(store => {
          // Apply region filter (using new `filters` object)
          if (filters.selectedRegions && filters.selectedRegions.length > 0) {
            return filters.selectedRegions.includes(store.region);
          }
          return true;
        })
        .map(store => {
          // Try to match store by location string
          const performanceData = storeMap.get(store.location || store.name) || {
            revenue: 0,
            transactions: 0,
            customers: new Set(),
          };

          return {
            id: store.id,
            name: store.name,
            location: store.location || store.name,
            region: store.region || 'Unknown',
            latitude: store.latitude,
            longitude: store.longitude,
            total_revenue: Math.round(performanceData.revenue * 100) / 100,
            transaction_count: performanceData.transactions,
            unique_customers: performanceData.customers.size,
            avg_transaction_value:
              performanceData.transactions > 0
                ? Math.round((performanceData.revenue / performanceData.transactions) * 100) / 100
                : 0,
            growth_rate: Math.random() * 40 - 10, // Mock growth rate for demo
          };
        })
        .filter(store => store.transaction_count > 0); // Only show stores with transactions

      const { data: storeData, error: storeError } = await supabase
        .from('store_performance')
        .select('*')
        .order('revenue', { ascending: false });

      if (storeError) {
        logger.error('Error fetching store performance:', storeError);
        return [];
      }

      return storeData?.map(store => ({
        ...store,
        growth_rate: store.growth_rate || 0 // Use actual growth rate from database
      })) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
