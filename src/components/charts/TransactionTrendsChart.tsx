import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, Clock } from 'lucide-react';
import { useTransactionTrends } from '@/hooks/useTransactionTrends';

interface TransactionTrendsChartProps {
  region?: string;
  period?: number;
  className?: string;
}

export function TransactionTrendsChart({
  region = 'All Regions',
  period = 7,
  className = '',
}: TransactionTrendsChartProps) {
  const { data, summary, loading, error } = useTransactionTrends(region, period);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Transaction Trends</span>
          </CardTitle>
          <CardDescription>Loading hourly transaction patterns...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <TrendingUp className="h-5 w-5" />
            <span>Transaction Trends</span>
          </CardTitle>
          <CardDescription>Failed to load trend data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-red-500">
            <p>Error: {error}</p>
            <p className="mt-2 text-sm text-gray-500">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Transaction Trends</span>
          </CardTitle>
          <CardDescription>No trend data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            <p>No transaction data found for the selected filters</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="font-semibold text-gray-900">{`Time: ${label}`}</p>
          <p className="text-blue-600">
            <span className="mr-2 inline-block h-3 w-3 rounded-full bg-blue-600"></span>
            {`Transactions: ${payload[0].value.toLocaleString()}`}
          </p>
          <p className="text-yellow-600">
            <span className="mr-2 inline-block h-3 w-3 rounded-full bg-yellow-600"></span>
            {`Avg Amount: ₱${payload[1].value.toLocaleString()}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Transaction Trends</span>
            </CardTitle>
            <CardDescription>
              Hourly patterns for {region} • Last {period} days
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <Activity className="mr-1 h-3 w-3" />
              Live Data
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        {summary && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {summary.totalTransactions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ₱{summary.totalAmount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                ₱{summary.avgTransaction.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Avg Transaction</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-2xl font-bold text-purple-600">
                <Clock className="mr-1 h-5 w-5" />
                {summary.peakHour}
              </div>
              <div className="text-sm text-gray-500">Peak Hour</div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                label={{ value: 'Transactions', angle: -90, position: 'insideLeft' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                label={{ value: 'Amount (₱)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="line" />

              <Line
                yAxisId="left"
                type="monotone"
                dataKey="transactionCount"
                stroke="#0B74DE"
                strokeWidth={3}
                name="Transaction Count"
                dot={{ fill: '#0B74DE', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#0B74DE', strokeWidth: 2 }}
              />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgAmount"
                stroke="#F2C80F"
                strokeWidth={3}
                name="Average Amount (₱)"
                dot={{ fill: '#F2C80F', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#F2C80F', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Last updated: {new Date().toLocaleString()} • Peak: {summary?.peakTransactions}{' '}
          transactions at {summary?.peakHour}
        </div>
      </CardContent>
    </Card>
  );
}
