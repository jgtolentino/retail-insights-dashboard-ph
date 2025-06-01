import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '@/stores/filterStore';
import { shallow } from 'zustand/shallow';

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
  const filters = useFilterStore(state => ({
    dateRange: state.dateRange,
    selectedBrands: state.selectedBrands,
    selectedCategories: state.selectedCategories,
    selectedRegions: state.selectedRegions
  }), shallow);

  return useQuery({
    queryKey: ['storePerformance', filters],
    queryFn: async () => {
      // First get stores data
      const { data: stores } = await supabase
        .from('stores')
        .select('*');

      if (!stores || stores.length === 0) return [];

      // Build transaction query with filters
      let query = supabase
        .from('transactions')
        .select(`
          id,
          store_location,
          total_amount,
          customer_age,
          created_at
        `);

      // Apply date range filter
      if (filters.dateRange.start) {
        query = query.gte('created_at', filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        query = query.lte('created_at', filters.dateRange.end);
      }

      // Get filtered transactions
      const { data: transactions, error } = await query;

      if (error) {
        console.error('Error fetching store performance:', error);
        throw error;
      }

      if (!transactions) return [];

      // Apply brand/category filters if needed
      let filteredTransactionIds = transactions.map(t => t.id);

      if (filters.selectedBrands.length > 0 || filters.selectedCategories.length > 0) {
        let itemsQuery = supabase
          .from('transaction_items')
          .select('transaction_id, products!inner(brand_id, category)');

        if (filters.selectedBrands.length > 0) {
          itemsQuery = itemsQuery.in('products.brand_id', filters.selectedBrands.map(b => parseInt(b)));
        }

        if (filters.selectedCategories.length > 0) {
          itemsQuery = itemsQuery.in('products.category', filters.selectedCategories);
        }

        const { data: filteredItems } = await itemsQuery;
        
        if (filteredItems) {
          filteredTransactionIds = [...new Set(filteredItems.map(item => item.transaction_id))];
        }
      }

      // Filter transactions by filtered IDs
      const relevantTransactions = transactions.filter(t => filteredTransactionIds.includes(t.id));

      // Group by store location and calculate metrics
      const storeMap = new Map<string, {
        revenue: number;
        transactions: number;
        customers: Set<number>;
      }>();

      relevantTransactions.forEach(transaction => {
        if (!transaction.store_location) return;

        if (!storeMap.has(transaction.store_location)) {
          storeMap.set(transaction.store_location, {
            revenue: 0,
            transactions: 0,
            customers: new Set()
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
          // Apply region filter
          if (filters.selectedRegions.length > 0) {
            return filters.selectedRegions.includes(store.region);
          }
          return true;
        })
        .map(store => {
          // Try to match store by location string
          const performanceData = storeMap.get(store.location || store.name) || {
            revenue: 0,
            transactions: 0,
            customers: new Set()
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
            avg_transaction_value: performanceData.transactions > 0
              ? Math.round((performanceData.revenue / performanceData.transactions) * 100) / 100
              : 0,
            growth_rate: Math.random() * 40 - 10 // Mock growth rate for demo
          };
        })
        .filter(store => store.transaction_count > 0); // Only show stores with transactions

      return storePerformance.sort((a, b) => b.total_revenue - a.total_revenue);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}