import { useQuery } from '@tanstack/react-query';
import { buildCompleteFilterQuery } from '@/lib/filterQueryHelper';
import { useFilterSelectors } from '@/stores/filterStore';

export interface SalesTrendData {
  date: string;
  total_revenue: number;
  transaction_count: number;
  avg_transaction_value: number;
}

export type GroupBy = 'hour' | 'day' | 'week' | 'month';

export function useSalesTrend(groupBy: GroupBy = 'day') {
  const filters = useFilterSelectors.allFilters();
  
  return useQuery({
    queryKey: ['salesTrend', filters, groupBy],
    queryFn: async (): Promise<SalesTrendData[]> => {
      // Build the complete filtered query
      const filteredQuery = await buildCompleteFilterQuery();
      
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
      const timeSeriesMap = new Map<string, { 
        total_revenue: number; 
        transaction_count: number; 
      }>();

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
          avg_transaction_value: data.transaction_count > 0 
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