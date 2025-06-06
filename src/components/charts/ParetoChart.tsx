import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

interface ParetoData {
  name: string;
  value: number;
  percentage: number;
  cumulativePercentage: number;
}

interface ParetoChartProps {
  data: ParetoData[];
  loading?: boolean;
  title?: string;
  valueLabel?: string;
  height?: number;
  threshold?: number; // e.g., 80 for 80/20 rule
}

export function ParetoChart({
  data,
  loading = false,
  title = 'Revenue Analysis (Pareto)',
  valueLabel = 'Revenue',
  height = 400,
  threshold = 80,
}: ParetoChartProps) {
  // Find the index where cumulative percentage crosses the threshold
  const thresholdIndex = data.findIndex(item => item.cumulativePercentage >= threshold);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
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
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-primary">
            {valueLabel}: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage: {(payload[0].payload.percentage || 0).toFixed(1)}%
          </p>
          <p className="text-sm text-orange-600">Cumulative: {(payload[1].value || 0).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {thresholdIndex !== -1 && (
          <p className="text-sm text-muted-foreground">
            {thresholdIndex + 1} of {data.length} items (
            {(((thresholdIndex + 1) / data.length) * 100) || 0).toFixed(0)}%) contribute to {threshold}%
            of {valueLabel.toLowerCase()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tickFormatter={value => formatCurrency(value, true)}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={value => `${value}%`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="rect" />

            {/* Bar chart for values */}
            <Bar yAxisId="left" dataKey="value" name={valueLabel} radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index <= thresholdIndex ? '#3b82f6' : '#94a3b8'}
                />
              ))}
            </Bar>

            {/* Line chart for cumulative percentage */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulativePercentage"
              name="Cumulative %"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: '#f97316', r: 4 }}
              activeDot={{ r: 6 }}
            />

            {/* Threshold line */}
            {threshold && (
              <Line
                yAxisId="right"
                dataKey={() => threshold}
                stroke="#ef4444"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                name={`${threshold}% Line`}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
