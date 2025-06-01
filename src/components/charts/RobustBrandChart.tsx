import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BrandData {
  name: string;
  sales: number;
  count?: number;
}

interface RobustBrandChartProps {
  data?: BrandData[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  title?: string;
  subtitle?: string;
  height?: number;
  showCount?: boolean;
  maxBrands?: number;
}

const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function RobustBrandChart({
  data = [],
  loading = false,
  error = null,
  onRefresh,
  title = 'Brand Performance',
  subtitle = 'Revenue by brand',
  height = 400,
  showCount = false,
  maxBrands = 10
}: RobustBrandChartProps) {
  
  // Validate and prepare chart data
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      console.warn('RobustBrandChart: Invalid data format', data);
      return [];
    }
    
    return data
      .filter(item => {
        // Validate each item
        if (!item || typeof item !== 'object') return false;
        if (!item.name || typeof item.sales !== 'number') return false;
        if (isNaN(item.sales) || item.sales < 0) return false;
        return true;
      })
      .slice(0, maxBrands) // Limit number of brands
      .map((item, index) => ({
        name: item.name.length > 15 ? `${item.name.substring(0, 15)}...` : item.name,
        fullName: item.name,
        sales: Number(item.sales) || 0,
        count: item.count || 0,
        displayValue: `₱${(item.sales || 0).toLocaleString('en-PH')}`,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }));
  }, [data, maxBrands]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const totalRevenue = chartData.reduce((sum, item) => sum + item.sales, 0);
    const avgRevenue = totalRevenue / chartData.length;
    const topBrand = chartData[0];
    
    return {
      totalRevenue,
      avgRevenue,
      topBrand,
      brandCount: chartData.length
    };
  }, [chartData]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {title}
              </CardTitle>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <div className="animate-spin">
              <RefreshCw className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className={`h-[${height}px] w-full`} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load chart data: {error.message}</span>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </CardHeader>
        <CardContent>
          <div className={`h-[${height}px] flex flex-col items-center justify-center text-muted-foreground space-y-3`}>
            <BarChart3 className="h-12 w-12 text-gray-300" />
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-sm">No brand data found for the selected period.</p>
              {onRefresh && (
                <Button variant="outline" className="mt-3" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state with data
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {title}
            </CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Summary stats */}
        {stats && (
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary">
              {stats.brandCount} brands
            </Badge>
            <Badge variant="outline">
              Total: {stats.totalRevenue.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
            </Badge>
            {stats.topBrand && (
              <Badge variant="outline">
                Top: {stats.topBrand.fullName}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className={`h-[${height}px] w-full`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `₱${value.toLocaleString('en-PH')}`,
                  'Revenue'
                ]}
                labelFormatter={(label: string, payload: any) => {
                  const item = payload?.[0]?.payload;
                  return (
                    <div>
                      <div className="font-medium">{item?.fullName || label}</div>
                      {showCount && item?.count && (
                        <div className="text-sm text-muted-foreground">
                          {item.count} transactions
                        </div>
                      )}
                    </div>
                  );
                }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Bar 
                dataKey="sales" 
                radius={[4, 4, 0, 0]}
                stroke="#e5e7eb"
                strokeWidth={1}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}