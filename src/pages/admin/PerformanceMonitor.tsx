import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { dashboardCache } from '@/utils/cache';

interface PerformanceMetric {
  endpoint: string;
  avgDuration: number;
  p95: number;
  p99: number;
  successRate: number;
  timestamp: Date;
}

export function PerformanceMonitor() {
  const [isLoadTesting, setIsLoadTesting] = useState(false);
  const [historicalData, setHistoricalData] = useState<PerformanceMetric[]>([]);
  const queryClient = useQueryClient();

  // Fetch current performance metrics
  const {
    data: currentMetrics,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/benchmark');
      if (!response.ok) throw new Error('Failed to fetch benchmarks');
      const data = await response.json();
      // Add current data to historical for chart
      setHistoricalData(prev => [...prev, { ...data.overall, timestamp: new Date() }].slice(-20)); // Keep last 20 data points
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch materialized view status
  const { data: viewStatus } = useQuery({
    queryKey: ['materialized-view-status'],
    queryFn: () => supabase.rpc('get_refresh_status'),
    refetchInterval: 60000,
  });

  // Fetch cache statistics
  const { data: cacheStats } = useQuery({
    queryKey: ['cache-stats'],
    queryFn: async () => {
      // In a real application, this would be an API call to get cache stats
      // For now, returning mock data or integrating with a cache monitoring tool
      return {
        hitRate: 85, // Example data
        size: Object.keys(dashboardCache['cache']).length, // Assuming cache is accessible or via getter
        memoryUsage: 'N/A', // Needs actual implementation to track memory
        requestsPerMinute: 'N/A', // Needs actual implementation to track requests
      };
    },
    refetchInterval: 10000,
  });

  const runLoadTest = async () => {
    setIsLoadTesting(true);
    try {
      const response = await fetch('/api/load-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concurrent: 20, iterations: 50 }),
      });
      if (!response.ok) throw new Error('Load test failed');
      const results = await response.json();

      console.log('Load test results:', results);

      // Refresh metrics after load test
      queryClient.invalidateQueries({ queryKey: ['performance-metrics'] });
    } catch (error) {
      console.error('Error running load test:', error);
    } finally {
      setIsLoadTesting(false);
    }
  };

  const getHealthStatus = (metric: any) => {
    if (!metric) return 'unknown';
    // Assuming overall metrics have avgDuration and successRate
    if (metric.avgDuration < 500 && metric.successRate > 99) return 'healthy';
    if (metric.avgDuration < 1000 && metric.successRate > 95) return 'warning';
    return 'critical';
  };

  // Effect to populate initial historical data if available
  useEffect(() => {
    if (currentMetrics?.overall && historicalData.length === 0) {
      setHistoricalData([{ ...currentMetrics.overall, timestamp: new Date() }]);
    }
  }, [currentMetrics, historicalData]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Performance Monitor</h1>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} disabled={isLoading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
