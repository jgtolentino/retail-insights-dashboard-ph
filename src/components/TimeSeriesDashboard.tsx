import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, TrendingUp, Calendar, Package, DollarSign } from 'lucide-react';
import { TransactionTimeSeriesProcessor } from '@/services/TransactionTimeSeriesProcessor';
import { useQuery } from '@tanstack/react-query';

interface TimeSeriesData {
  daily: any[];
  weekly: any[];
  monthly: any[];
  byProduct: any[];
  totalProcessed: number;
  dateRange: { start: string; end: string };
}

interface ProcessingProgress {
  processed: number;
  total: number;
  percentage: number;
}

export function TimeSeriesDashboard() {
  const [selectedView, setSelectedView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [progress, setProgress] = useState<ProcessingProgress>({
    processed: 0,
    total: 0,
    percentage: 0,
  });

  const processor = useMemo(
    () =>
      new TransactionTimeSeriesProcessor(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      ),
    []
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['timeSeriesData'],
    queryFn: async () => {
      const result = await processor.processAllTransactions(prog => {
        setProgress(prog);
      });
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const stats = useMemo(() => {
    if (!data) return null;
    return processor.generateSummaryStats(data);
  }, [data, processor]);

  const exportToCSV = useCallback(() => {
    if (!data) return;

    const csvData = data[selectedView].map(point => ({
      Date: point.date,
      Revenue: point.revenue,
      Transactions: point.transactionCount,
      'Avg Transaction Value': point.avgTransactionValue,
      Quantity: point.quantity,
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-series-${selectedView}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [data, selectedView]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value);
  }, []);

  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('en-PH').format(value);
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Processing Transactions</CardTitle>
            <CardDescription>Analyzing time series data across all transactions...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  Progress: {formatNumber(progress.processed)} / {formatNumber(progress.total)}
                </span>
                <span>{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data || !stats) {
    return (
      <div className="mx-auto w-full max-w-7xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Data</CardTitle>
            <CardDescription>
              {error ? 'Failed to load time series data' : 'No data available'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {/* Header with Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {formatNumber(stats.totalTransactions)} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgTransactionValue)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalQuantity)}</div>
            <p className="text-xs text-muted-foreground">Units sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Date Range</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.dateRange.start}</div>
            <p className="text-xs text-muted-foreground">to {data.dateRange.end}</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction Time Series Analysis</CardTitle>
              <CardDescription>
                Analyzing {formatNumber(data.totalProcessed)} transactions across time periods
              </CardDescription>
            </div>
            <Button onClick={exportToCSV} size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedView} onValueChange={v => setSelectedView(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={date =>
                      new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
                    }
                  />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === 'Revenue') return formatCurrency(value);
                      return formatNumber(value);
                    }}
                    labelFormatter={date => new Date(date).toLocaleDateString('en-PH')}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    name="Revenue"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="transactionCount"
                    stroke="#82ca9d"
                    name="Transactions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.weekly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={date =>
                      `Week of ${new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`
                    }
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === 'Revenue') return formatCurrency(value);
                      return formatNumber(value);
                    }}
                    labelFormatter={date =>
                      `Week starting ${new Date(date).toLocaleDateString('en-PH')}`
                    }
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                  <Bar dataKey="avgTransactionValue" fill="#82ca9d" name="Avg Transaction Value" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={date =>
                      new Date(date).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                      })
                    }
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === 'Revenue' || name === 'Avg Transaction Value')
                        return formatCurrency(value);
                      return formatNumber(value);
                    }}
                    labelFormatter={date =>
                      new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    name="Revenue"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgTransactionValue"
                    stroke="#82ca9d"
                    name="Avg Transaction Value"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="quantity"
                    stroke="#ffc658"
                    name="Quantity"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Top Products by Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Products by Revenue</CardTitle>
          <CardDescription>Product performance over the entire time period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.byProduct.slice(0, 10).map((product, index) => (
              <div
                key={product.productId}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold text-muted-foreground">#{index + 1}</div>
                  <div>
                    <p className="font-medium">
                      {product.productName || `Product ${product.productId}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(product.totalQuantity)} units sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(product.totalRevenue)}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.series.length} days of activity
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
