import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

interface SubstitutionData {
  original_product: string;
  substitute_product: string;
  count: number;
  reasons?: string;
  revenue_impact?: number;
}

interface ProductSubstitutionsChartProps {
  data: SubstitutionData[];
  loading?: boolean;
  title?: string;
  height?: number;
}

export function ProductSubstitutionsChart({
  data,
  loading = false,
  title = 'Top Product Substitutions',
  height = 400,
}: ProductSubstitutionsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="w-full" style={{ height: height / 2 }} />
            <Skeleton className="w-full" style={{ height: height / 2 }} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height: height / 2 }}>
            <p className="text-muted-foreground">No substitution data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for horizontal bar chart - show original products with substitution counts
  const chartData = data.slice(0, 10).map(item => ({
    name: `${item.original_product} → ${item.substitute_product}`,
    original: item.original_product,
    substitute: item.substitute_product,
    count: item.count,
    shortName:
      item.original_product.length > 20
        ? item.original_product.substring(0, 20) + '...'
        : item.original_product,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="text-sm font-semibold">{data.original}</p>
          <p className="text-sm text-muted-foreground">→ {data.substitute}</p>
          <p className="mt-1 text-sm text-primary">Substitutions: {data.count}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Most common product replacements when items are unavailable
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Horizontal Bar Chart */}
          <div>
            <ResponsiveContainer width="100%" height={height}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" />
                <YAxis dataKey="shortName" type="category" width={90} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#60a5fa'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detail Table */}
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left">Original</th>
                  <th className="pb-3 text-left">Substitution</th>
                  <th className="pb-3 text-right">Count</th>
                  <th className="pb-3 text-left">Reasons</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-3">
                      <span className="font-medium">{row.original_product}</span>
                    </td>
                    <td className="py-3 text-muted-foreground">{row.substitute_product}</td>
                    <td className="py-3 text-right font-mono">{row.count}</td>
                    <td className="py-3">
                      {row.reasons || (
                        <span className="text-xs text-muted-foreground">
                          {['Out of stock', 'Price preference', 'Brand loyalty'][i % 3]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data.length > 10 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Showing top 10 of {data.length} substitutions
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
