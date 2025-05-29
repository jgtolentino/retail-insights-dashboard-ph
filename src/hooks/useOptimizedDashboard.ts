import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays } from 'date-fns';

interface DashboardMetrics {
  totalRevenue: number;
  totalTransactions: number;
  uniqueCustomers: number;
  avgTransaction: number;
  revenueGrowth24h: number;
  revenueGrowth7d: number;
  topBrands: BrandPerformance[];
  hourlyMetrics: HourlyMetric[];
  customerSegments: CustomerSegment[];
}

interface BrandPerformance {
  brandId: string;
  brandName: string;
  revenue: number;
  unitsSOld: number;
  transactionCount: number;
  performanceTier: 'Top 5' | 'Top 10' | 'Other';
}

interface HourlyMetric {
  hour: string;
  revenue: number;
  transactions: number;
  avgTransaction: number;
  trafficAnomaly: 'High' | 'Normal' | 'Low';
}

interface CustomerSegment {
  segment: string;
  count: number;
  totalValue: number;
  avgValue: number;
}

export function useOptimizedDashboard(dateRange: { start: Date; end: Date }) {
  return useQuery({
    queryKey: ['optimized-dashboard', dateRange],
    queryFn: async () => {
      // Use materialized views for instant response
      const [kpisResult, brandsResult, segmentsResult, timeSeriesResult] = await Promise.all([
        // KPI Metrics from materialized view
        supabase
          .from('mv_dashboard_kpis')
          .select('*')
          .gte('hour', dateRange.start.toISOString())
          .lte('hour', dateRange.end.toISOString())
          .order('hour', { ascending: false })
          .limit(1),
        
        // Top Brands from materialized view
        supabase
          .from('mv_brand_performance')
          .select('*')
          .gte('date', dateRange.start.toISOString())
          .lte('date', dateRange.end.toISOString())
          .eq('performance_tier', 'Top 5')
          .order('revenue', { ascending: false })
          .limit(5),
        
        // Customer Segments
        supabase
          .from('mv_customer_segments')
          .select('customer_segment, COUNT(*) as count, SUM(total_spent) as total_value')
          .select()
          .limit(1000) // Process client-side for now
          .then(({ data }) => {
            // Group by segment client-side
            const segments = data?.reduce((acc, customer) => {
              const segment = customer.customer_segment;
              if (!acc[segment]) {
                acc[segment] = { count: 0, totalValue: 0 };
              }
              acc[segment].count++;
              acc[segment].totalValue += customer.total_spent;
              return acc;
            }, {} as Record<string, any>);
            
            return Object.entries(segments || {}).map(([segment, data]) => ({
              segment,
              count: data.count,
              totalValue: data.totalValue,
              avgValue: data.totalValue / data.count
            }));
          }),
        
        // Time series metrics
        supabase
          .from('mv_time_series_metrics')
          .select('*')
          .gte('hour', dateRange.start.toISOString())
          .lte('hour', dateRange.end.toISOString())
          .order('hour', { ascending: true })
      ]);

      // Process results
      const latestKpi = kpisResult.data?.[0];
      
      const metrics: DashboardMetrics = {
        totalRevenue: latestKpi?.revenue || 0,
        totalTransactions: latestKpi?.transaction_count || 0,
        uniqueCustomers: latestKpi?.unique_customers || 0,
        avgTransaction: latestKpi?.avg_transaction || 0,
        revenueGrowth24h: calculateGrowth(latestKpi?.revenue, latestKpi?.revenue_24h_ago),
        revenueGrowth7d: calculateGrowth(latestKpi?.revenue, latestKpi?.revenue_7d_ago),
        topBrands: brandsResult.data?.map(brand => ({
          brandId: brand.brand_id,
          brandName: brand.brand_name,
          revenue: brand.revenue,
          unitsSOld: brand.units_sold,
          transactionCount: brand.transaction_count,
          performanceTier: brand.performance_tier
        })) || [],
        hourlyMetrics: timeSeriesResult.data?.map(metric => ({
          hour: metric.hour,
          revenue: metric.revenue,
          transactions: metric.transaction_count,
          avgTransaction: metric.avg_transaction,
          trafficAnomaly: metric.traffic_anomaly
        })) || [],
        customerSegments: segmentsResult || []
      };

      return metrics;
    },
    staleTime: 30000, // Data is fresh for 30 seconds
    cacheTime: 300000, // Cache for 5 minutes
    refetchInterval: 60000 // Refetch every minute
  });
}

function calculateGrowth(current: number | null, previous: number | null): number {
  if (!current || !previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Hook for real-time updates using streaming
export function useRealtimeDashboard() {
  const { data, refetch } = useOptimizedDashboard({
    start: subDays(new Date(), 30),
    end: new Date()
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions'
      }, () => {
        // Debounce refetch to avoid too many requests
        debounceRefetch();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const debounceRefetch = useMemo(
    () => debounce(() => refetch(), 5000),
    [refetch]
  );

  return data;
}

// Hook for specific brand performance
export function useBrandPerformance(brandId: string, days: number = 30) {
  return useQuery({
    queryKey: ['brand-performance', brandId, days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mv_brand_performance')
        .select('*')
        .eq('brand_id', brandId)
        .gte('date', subDays(new Date(), days).toISOString())
        .order('date', { ascending: true });

      if (error) throw error;

      return {
        dailyMetrics: data || [],
        totalRevenue: data?.reduce((sum, day) => sum + day.revenue, 0) || 0,
        totalUnits: data?.reduce((sum, day) => sum + day.units_sold, 0) || 0,
        avgDailyRevenue: (data?.reduce((sum, day) => sum + day.revenue, 0) || 0) / days,
        trend: calculateTrend(data || [])
      };
    },
    staleTime: 60000 // 1 minute
  });
}

function calculateTrend(data: any[]): 'up' | 'down' | 'stable' {
  if (data.length < 2) return 'stable';
  
  const recent = data.slice(-7).reduce((sum, d) => sum + d.revenue, 0);
  const previous = data.slice(-14, -7).reduce((sum, d) => sum + d.revenue, 0);
  
  if (recent > previous * 1.05) return 'up';
  if (recent < previous * 0.95) return 'down';
  return 'stable';
}

// Hook for customer segment analysis
export function useCustomerSegments() {
  return useQuery({
    queryKey: ['customer-segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mv_customer_segments')
        .select('*')
        .order('total_spent', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Aggregate by segment
      const segments = data?.reduce((acc, customer) => {
        const segment = customer.customer_segment;
        if (!acc[segment]) {
          acc[segment] = {
            name: segment,
            count: 0,
            totalValue: 0,
            customers: []
          };
        }
        acc[segment].count++;
        acc[segment].totalValue += customer.total_spent;
        acc[segment].customers.push(customer);
        return acc;
      }, {} as Record<string, any>);

      return Object.values(segments || {}).map((segment: any) => ({
        ...segment,
        avgValue: segment.totalValue / segment.count,
        topCustomers: segment.customers
          .sort((a: any, b: any) => b.total_spent - a.total_spent)
          .slice(0, 5)
      }));
    },
    staleTime: 300000 // 5 minutes
  });
}

// Export utility functions
export { calculateGrowth, calculateTrend };