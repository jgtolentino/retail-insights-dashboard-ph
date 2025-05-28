import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';
import { dashboardServiceWithFilters } from '@/services/dashboardWithFilters';
import { logDataFetchError } from '@/lib/sentry';

interface UseDashboardDataOptions {
  timeRange: string;
  filters?: Record<string, string[]>;
  enabled?: boolean;
}

export function useDashboardData({ timeRange, filters, enabled = true }: UseDashboardDataOptions) {
  const hasActiveFilters = filters && Object.values(filters).some(arr => arr.length > 0);

  return useQuery({
    queryKey: ['dashboard-data', timeRange, filters],
    queryFn: async () => {
      try {
        if (hasActiveFilters) {
          return await dashboardServiceWithFilters.getDashboardData(timeRange, filters);
        } else {
          return await dashboardService.getDashboardData(timeRange);
        }
      } catch (error) {
        logDataFetchError('dashboard_data_hook', error as Error, { timeRange, filters });
        throw error;
      }
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTimeSeriesData({ 
  timeRange, 
  startDate, 
  endDate, 
  filters, 
  enabled = true 
}: {
  timeRange: string;
  startDate?: string;
  endDate?: string;
  filters?: Record<string, string[]>;
  enabled?: boolean;
}) {
  const hasActiveFilters = filters && Object.values(filters).some(arr => arr.length > 0);

  return useQuery({
    queryKey: ['time-series-data', timeRange, startDate, endDate, filters],
    queryFn: async () => {
      try {
        if (timeRange === 'custom' && startDate && endDate) {
          if (hasActiveFilters) {
            return await dashboardServiceWithFilters.getTimeSeriesData('30d', filters);
          } else {
            return await dashboardService.getTimeSeriesDataByDateRange(startDate, endDate);
          }
        } else {
          if (hasActiveFilters) {
            return await dashboardServiceWithFilters.getTimeSeriesData(timeRange, filters);
          } else {
            return await dashboardService.getTimeSeriesData(timeRange);
          }
        }
      } catch (error) {
        logDataFetchError('time_series_data_hook', error as Error, { 
          timeRange, 
          startDate, 
          endDate, 
          filters 
        });
        throw error;
      }
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}