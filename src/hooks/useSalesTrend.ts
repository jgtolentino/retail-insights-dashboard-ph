import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buildCompleteFilterQuery } from '@/lib/filterQueryHelper';
import { useFilterStore } from '@/stores/filterStore';
import { shallow } from 'zustand/shallow';

export interface SalesTrendData {
  date: string;
  total_revenue: number;
  transaction_count: number;
  avg_transaction_value: number;
}

export type GroupBy = 'hour' | 'day' | 'week' | 'month';

export function useSalesTrend(groupBy: GroupBy = 'day') {
  // Subscribe to individual filter properties to avoid object creation
  const dateRange = useFilterStore(state => state.dateRange, shallow);
  const selectedBrands = useFilterStore(state => state.selectedBrands, shallow);
  const selectedCategories = useFilterStore(state => state.selectedCategories, shallow);
  const selectedRegions = useFilterStore(state => state.selectedRegions, shallow);
  const selectedStores = useFilterStore(state => state.selectedStores, shallow);

  // Create stable filters object only when needed
  const filters = useMemo(
    () => ({
      dateRange,
      selectedBrands,
      selectedCategories,
      selectedRegions,
      selectedStores,
    }),
    [dateRange, selectedBrands, selectedCategories, selectedRegions, selectedStores]
  );

  // Stabilize the query key to prevent unnecessary re-renders
  const stableQueryKey = useMemo(
    () => ['salesTrend', JSON.stringify(filters), groupBy],
    [filters, groupBy]
  );

  return useQuery({
    queryKey: stableQueryKey,
    queryFn: async (): Promise<SalesTrendData[]> => {
      // Build the complete filtered query using current filters
      const filteredQuery = await buildCompleteFilterQuery(filters);

      const { data: transactions, error } = await filteredQuery
        .select('id, total_amount, created_at')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      if (!transactions || transactions.length === 0) {
        return [];
      }

      // Group data by time period
      const timeSeriesMap = new Map<
        string,
        {
          total_revenue: number;
          transaction_count: number;
        }
      >();

      transactions.forEach(transaction => {
        if (!transaction.created_at) return;

        const date = new Date(transaction.created_at);
        let key: string;

        switch (groupBy) {
          case 'hour':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
            break;
          case 'day':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          default:
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }

        const existing = timeSeriesMap.get(key) || { total_revenue: 0, transaction_count: 0 };
        existing.transaction_count += 1;
        existing.total_revenue += transaction.total_amount || 0;
        timeSeriesMap.set(key, existing);
      });

      // Convert to array and calculate averages
      const timeSeriesData: SalesTrendData[] = Array.from(timeSeriesMap.entries())
        .map(([date, data]) => ({
          date,
          total_revenue: Math.round(data.total_revenue * 100) / 100,
          transaction_count: data.transaction_count,
          avg_transaction_value:
            data.transaction_count > 0
              ? Math.round((data.total_revenue / data.transaction_count) * 100) / 100
              : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return timeSeriesData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    keepPreviousData: true,
  });
}
