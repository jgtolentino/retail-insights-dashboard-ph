import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, BarChart3, Download, Filter, RefreshCw } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface TrendData {
  period: string;
  value: number;
  category?: string;
  brand?: string;
  region?: string;
}

export default function Trends() {
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');
  const [selectedDimension, setSelectedDimension] = useState<string>('time');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30');
  const [selectedChartType, setSelectedChartType] = useState<string>('line');

  // Metric options
  const metrics = [
    { value: 'revenue', label: 'Revenue', icon: '₱' },
    { value: 'transactions', label: 'Transactions', icon: '#' },
    { value: 'units', label: 'Units Sold', icon: '📦' },
    { value: 'avg_transaction', label: 'Avg Transaction', icon: '💰' },
    { value: 'customers', label: 'Unique Customers', icon: '👥' }
  ];

  // Dimension options
  const dimensions = [
    { value: 'time', label: 'Time Period' },
    { value: 'category', label: 'Product Category' },
    { value: 'brand', label: 'Brand' },
    { value: 'region', label: 'Region' },
    { value: 'hour', label: 'Hour of Day' },
    { value: 'dayofweek', label: 'Day of Week' }
  ];

  // Chart type options
  const chartTypes = [
    { value: 'line', label: 'Line Chart' },
    { value: 'area', label: 'Area Chart' },
    { value: 'bar', label: 'Bar Chart' }
  ];

  // Fetch trend data
  const { data: trendData, isLoading: trendLoading, refetch } = useQuery({
    queryKey: ['trends', selectedMetric, selectedDimension, selectedTimeframe],
    queryFn: async () => {
      console.log('Fetching trend data for:', { selectedMetric, selectedDimension, selectedTimeframe });
      
      let query = supabase
        .from('transaction_items')
        .select(`
          quantity,
          price,
          products!inner(
            name,
            brand_id,
            brands!inner(
              id,
              name,
              category
            )
          ),
          transactions!inner(
            created_at,
            store_location,
            customer_age
          )
        `);

      // Apply time filter
      const daysAgo = parseInt(selectedTimeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      query = query.gte('transactions.created_at', startDate.toISOString());

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching trend data:', error);
        throw error;
      }

      if (!data) return [];

      // Process data based on selected dimension
      const processedData = new Map<string, { 
        value: number; 
        count: number; 
        customers: Set<string>;
        total_quantity: number;
      }>();

      data.forEach((item: any) => {
        let key: string;
        const createdAt = new Date(item.transactions.created_at);
        
        switch (selectedDimension) {
          case 'time':
            key = createdAt.toISOString().split('T')[0]; // Daily
            break;
          case 'category':
            key = item.products.brands.category || 'Other';
            break;
          case 'brand':
            key = item.products.brands.name;
            break;
          case 'region':
            // Extract region from store_location (assuming format includes region)
            key = item.transactions.store_location || 'Unknown';
            break;
          case 'hour':
            key = createdAt.getHours().toString().padStart(2, '0') + ':00';
            break;
          case 'dayofweek':
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            key = days[createdAt.getDay()];
            break;
          default:
            key = 'Unknown';
        }

        const revenue = (item.quantity || 0) * (item.price || 0);
        const customerId = `customer_${item.transactions.customer_age || Math.random()}`;
        
        if (!processedData.has(key)) {
          processedData.set(key, { 
            value: 0, 
            count: 0, 
            customers: new Set(),
            total_quantity: 0
          });
        }

        const existing = processedData.get(key)!;
        existing.value += revenue;
        existing.count += 1;
        existing.customers.add(customerId);
        existing.total_quantity += item.quantity || 0;
      });

      // Convert to final format based on selected metric
      const result = Array.from(processedData.entries()).map(([key, data]) => {
        let value: number;
        
        switch (selectedMetric) {
          case 'revenue':
            value = data.value;
            break;
          case 'transactions':
            value = data.count;
            break;
          case 'units':
            value = data.total_quantity;
            break;
          case 'avg_transaction':
            value = data.count > 0 ? data.value / data.count : 0;
            break;
          case 'customers':
            value = data.customers.size;
            break;
          default:
            value = data.value;
        }

        return {
          period: key,
          value: value,
          category: selectedDimension === 'category' ? key : undefined,
          brand: selectedDimension === 'brand' ? key : undefined,
          region: selectedDimension === 'region' ? key : undefined
        };
      });

      // Sort data appropriately
      if (selectedDimension === 'time') {
        result.sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
      } else if (selectedDimension === 'hour') {
        result.sort((a, b) => parseInt(a.period) - parseInt(b.period));
      } else {
        result.sort((a, b) => b.value - a.value);
      }

      return result.slice(0, 20); // Limit to top 20 for non-time dimensions
    }
  });

  // Calculate trend indicators
  const trendIndicators = useMemo(() => {
    if (!trendData || trendData.length < 2) return null;

    const recent = trendData.slice(-7); // Last 7 data points
    const previous = trendData.slice(-14, -7); // Previous 7 data points

    if (recent.length === 0 || previous.length === 0) return null;

    const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
    const previousAvg = previous.reduce((sum, item) => sum + item.value, 0) / previous.length;
    
    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    const isPositive = change > 0;

    return {
      change: Math.abs(change),
      isPositive,
      recentAvg,
      previousAvg
    };
  }, [trendData]);

  // Export functionality
  const handleExport = () => {
    if (!trendData) return;
    
    const csvContent = [
      ['Period', 'Value'].join(','),
      ...trendData.map(item => [item.period, item.value].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trends-${selectedMetric}-${selectedDimension}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderChart = () => {
    if (!trendData) return null;

    const formatValue = (value: number) => {
      if (selectedMetric === 'revenue' || selectedMetric === 'avg_transaction') {
        return formatCurrency(value);
      }
      return value.toLocaleString();
    };

    const commonProps = {
      data: trendData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (selectedChartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                angle={selectedDimension === 'time' ? -45 : 0}
                textAnchor={selectedDimension === 'time' ? 'end' : 'middle'}
                height={selectedDimension === 'time' ? 80 : 60}
              />
              <YAxis tickFormatter={formatValue} />
              <Tooltip formatter={(value: number) => [formatValue(value), metrics.find(m => m.value === selectedMetric)?.label]} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={COLORS[0]}
                fill={COLORS[0]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                angle={selectedDimension === 'time' ? -45 : 0}
                textAnchor={selectedDimension === 'time' ? 'end' : 'middle'}
                height={selectedDimension === 'time' ? 80 : 60}
              />
              <YAxis tickFormatter={formatValue} />
              <Tooltip formatter={(value: number) => [formatValue(value), metrics.find(m => m.value === selectedMetric)?.label]} />
              <Bar dataKey="value" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        );
        
      default: // line
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                angle={selectedDimension === 'time' ? -45 : 0}
                textAnchor={selectedDimension === 'time' ? 'end' : 'middle'}
                height={selectedDimension === 'time' ? 80 : 60}
              />
              <YAxis tickFormatter={formatValue} />
              <Tooltip formatter={(value: number) => [formatValue(value), metrics.find(m => m.value === selectedMetric)?.label]} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={COLORS[0]}
                strokeWidth={3}
                dot={{ fill: COLORS[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: COLORS[0], strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trends Explorer</h1>
            <p className="text-muted-foreground">
              Analyze trends across different dimensions and metrics
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!trendData}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Analysis Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Metric</label>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {metrics.map(metric => (
                      <SelectItem key={metric.value} value={metric.value}>
                        {metric.icon} {metric.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Dimension</label>
                <Select value={selectedDimension} onValueChange={setSelectedDimension}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dimension" />
                  </SelectTrigger>
                  <SelectContent>
                    {dimensions.map(dimension => (
                      <SelectItem key={dimension.value} value={dimension.value}>
                        {dimension.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Timeframe</label>
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Chart Type</label>
                <Select value={selectedChartType} onValueChange={setSelectedChartType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chart type" />
                  </SelectTrigger>
                  <SelectContent>
                    {chartTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Badge variant="outline" className="text-xs">
                  {trendData?.length || 0} data points
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trend Indicators */}
        {trendIndicators && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                {trendIndicators.isPositive ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Trend Direction</p>
                  <p className={`text-2xl font-bold ${trendIndicators.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {trendIndicators.isPositive ? '+' : '-'}{trendIndicators.change.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Current Average</p>
                  <p className="text-2xl font-bold">
                    {selectedMetric === 'revenue' || selectedMetric === 'avg_transaction' 
                      ? formatCurrency(trendIndicators.recentAvg)
                      : Math.round(trendIndicators.recentAvg).toLocaleString()
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Recent period</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Previous Average</p>
                  <p className="text-2xl font-bold">
                    {selectedMetric === 'revenue' || selectedMetric === 'avg_transaction' 
                      ? formatCurrency(trendIndicators.previousAvg)
                      : Math.round(trendIndicators.previousAvg).toLocaleString()
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Previous period</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              {metrics.find(m => m.value === selectedMetric)?.label} by {dimensions.find(d => d.value === selectedDimension)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : trendData && trendData.length > 0 ? (
              renderChart()
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                No data available for the selected criteria
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Table */}
        {trendData && trendData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Data Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-gray-700">
                        {dimensions.find(d => d.value === selectedDimension)?.label}
                      </th>
                      <th className="text-right p-2 font-medium text-gray-700">
                        {metrics.find(m => m.value === selectedMetric)?.label}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.slice(0, 10).map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{item.period}</td>
                        <td className="text-right p-2 font-medium">
                          {selectedMetric === 'revenue' || selectedMetric === 'avg_transaction' 
                            ? formatCurrency(item.value)
                            : item.value.toLocaleString()
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {trendData.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Showing top 10 of {trendData.length} results
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}