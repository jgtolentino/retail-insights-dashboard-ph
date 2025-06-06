import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { behavioralDashboardService } from '@/services/behavioral-dashboard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface WeeklyBreakdownProps {
  startDate?: string;
  endDate?: string;
  storeId?: number;
}

export function WeeklyBreakdown({ startDate, endDate, storeId }: WeeklyBreakdownProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [metric, setMetric] = useState<'revenue' | 'transactions' | 'acceptance'>('revenue');

  useEffect(() => {
    fetchWeeklyData();
  }, [startDate, endDate, storeId]);

  const fetchWeeklyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const weeklyData = await behavioralDashboardService.getWeeklySummary(
        startDate,
        endDate,
        storeId
      );

      // Format data for chart
      const formattedData = weeklyData.map(week => ({
        week: `Week ${week.weekNumber}`,
        weekStart: new Date(week.weekStart).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        revenue: week.totalRevenue,
        transactions: week.totalTransactions,
        avgTransaction: week.avgTransaction,
        acceptanceRate: week.suggestionAcceptanceRate,
        substitutionRate: week.substitutionRate,
        customers: week.uniqueCustomers,
      }));

      setData(formattedData);
    } catch (err) {
      console.error('Error fetching weekly data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load weekly data');
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = () => {
    switch (metric) {
      case 'revenue':
        return 'Weekly Revenue (₱)';
      case 'transactions':
        return 'Weekly Transactions';
      case 'acceptance':
        return 'Suggestion Acceptance Rate (%)';
    }
  };

  const getMetricValue = (item: any) => {
    switch (metric) {
      case 'revenue':
        return item.revenue;
      case 'transactions':
        return item.transactions;
      case 'acceptance':
        return item.acceptanceRate;
    }
  };

  const formatTooltipValue = (value: number) => {
    switch (metric) {
      case 'revenue':
        return `₱${value.toLocaleString()}`;
      case 'transactions':
        return value.toLocaleString();
      case 'acceptance':
        return `${(value || 0).toFixed(1)}%`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Weekly Breakdown Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button variant="outline" onClick={fetchWeeklyData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Performance Breakdown
          </CardTitle>
          <div className="flex gap-2">
            <div className="flex rounded-lg border p-1">
              <Button
                variant={metric === 'revenue' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMetric('revenue')}
              >
                Revenue
              </Button>
              <Button
                variant={metric === 'transactions' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMetric('transactions')}
              >
                Transactions
              </Button>
              <Button
                variant={metric === 'acceptance' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMetric('acceptance')}
              >
                Acceptance %
              </Button>
            </div>
            <div className="flex rounded-lg border p-1">
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('bar')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="weekStart"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={value => {
                    if (metric === 'revenue') return `₱${((value / 1000) || 0).toFixed(0)}K`;
                    if (metric === 'acceptance') return `${value}%`;
                    return value.toLocaleString();
                  }}
                />
                <Tooltip
                  formatter={(value: number) => formatTooltipValue(value)}
                  labelFormatter={label => `Week starting ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={
                    metric === 'revenue'
                      ? 'revenue'
                      : metric === 'transactions'
                        ? 'transactions'
                        : 'acceptanceRate'
                  }
                  stroke={
                    metric === 'revenue'
                      ? '#3B82F6'
                      : metric === 'transactions'
                        ? '#10B981'
                        : '#F59E0B'
                  }
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={getMetricLabel()}
                />
                {metric === 'acceptance' && (
                  <Line
                    type="monotone"
                    dataKey="substitutionRate"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                    name="Substitution Rate (%)"
                  />
                )}
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="weekStart"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={value => {
                    if (metric === 'revenue') return `₱${((value / 1000) || 0).toFixed(0)}K`;
                    if (metric === 'acceptance') return `${value}%`;
                    return value.toLocaleString();
                  }}
                />
                <Tooltip
                  formatter={(value: number) => formatTooltipValue(value)}
                  labelFormatter={label => `Week starting ${label}`}
                />
                <Legend />
                <Bar
                  dataKey={
                    metric === 'revenue'
                      ? 'revenue'
                      : metric === 'transactions'
                        ? 'transactions'
                        : 'acceptanceRate'
                  }
                  fill={
                    metric === 'revenue'
                      ? '#3B82F6'
                      : metric === 'transactions'
                        ? '#10B981'
                        : '#F59E0B'
                  }
                  name={getMetricLabel()}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Average Weekly</p>
            <p className="text-lg font-semibold">
              {metric === 'revenue'
                ? `₱${((data.reduce((sum, d) => sum + d.revenue, 0) / data.length) || 0).toFixed(0).toLocaleString()}`
                : metric === 'transactions'
                  ? ((data.reduce((sum, d) => sum + d.transactions, 0) / data.length) || 0).toFixed(0)
                  : `${((data.reduce((sum, d) => sum + d.acceptanceRate, 0) / data.length) || 0).toFixed(1)}%`}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Peak Week</p>
            <p className="text-lg font-semibold">
              {data.length > 0
                ? data.reduce((max, d) => (getMetricValue(d) > getMetricValue(max) ? d : max)).week
                : 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Growth Rate</p>
            <p className="text-lg font-semibold">
              {data.length > 1
                ? `${((((getMetricValue(data[data.length - 1]) - getMetricValue(data[0])) / getMetricValue(data[0])) * 100) || 0).toFixed(1)}%`
                : 'N/A'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
