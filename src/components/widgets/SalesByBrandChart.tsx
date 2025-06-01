import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useSalesByBrand } from '@/hooks/useSalesByBrand';

interface SalesByBrandChartProps {
  className?: string;
  height?: number;
}

function SalesByBrandChartComponent({ className = '', height = 400 }: SalesByBrandChartProps) {
  const { data, isLoading, error, isError } = useSalesByBrand();

  if (isError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            Sales by Brand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-red-500">
            Error loading data: {error?.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="sales-by-brand-chart">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4" />
          Sales by Brand
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent data-testid="chart-data">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-gray-500">
            No data available for current filter selection
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="brand_name" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis tickFormatter={value => `₱${(value / 1000).toFixed(0)}k`} fontSize={12} />
              <Tooltip
                formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']}
                labelFormatter={label => `Brand: ${label}`}
              />
              <Legend />
              <Bar
                dataKey="total_revenue"
                fill="#3b82f6"
                name="Total Revenue"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Summary Information */}
        {data && data.length > 0 && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              <div>
                <span className="text-gray-600">Top Brand:</span>
                <div className="font-semibold">{data[0].brand_name}</div>
                <div className="text-xs text-gray-500">
                  ₱{data[0].total_revenue.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Total Brands:</span>
                <div className="font-semibold">{data.length}</div>
              </div>
              <div>
                <span className="text-gray-600">Combined Revenue:</span>
                <div className="font-semibold">
                  ₱{data.reduce((sum, brand) => sum + brand.total_revenue, 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export memoized component
const SalesByBrandChart = React.memo(SalesByBrandChartComponent);
export default SalesByBrandChart;
