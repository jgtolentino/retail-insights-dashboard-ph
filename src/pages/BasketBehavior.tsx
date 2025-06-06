import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShoppingCart, Users, Target, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
} from 'recharts';
import { logger } from '@/utils/logger';

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

interface BasketData {
  basket_size: number;
  transaction_count: number;
  avg_value: number;
  total_revenue: number;
}

export default function BasketBehavior() {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30');

  // Fetch basket size distribution
  const { data: basketData, error } = useQuery({
    queryKey: ['basket-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('basket_analysis')
        .select('*')
        .order('frequency', { ascending: false });

      if (error) {
        logger.error('Error fetching basket analysis:', error);
        throw error;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (error) {
    logger.error('Error fetching basket analysis:', error);
  }

  const totalRevenue = basketData?.reduce((sum, item) => sum + item.revenue, 0) || 0;
  const totalTransactions = basketData?.reduce((sum, item) => sum + item.frequency, 0) || 0;
  const weightedAvgBasketSize = basketData?.reduce((sum, item) => sum + (item.avg_items * item.frequency), 0) / totalTransactions || 0;

  // Mock co-purchase data (would come from market basket analysis)
  const coPurchaseData = [
    { product1: 'Marlboro Red', product2: 'Lucky Strike', frequency: 85, lift: 2.4 },
    { product1: 'Coca Cola', product2: 'Pepsi', frequency: 72, lift: 1.8 },
    { product1: 'Red Horse', product2: 'San Miguel', frequency: 68, lift: 2.1 },
    { product1: 'Yosi Brand A', product2: 'Max Energy', frequency: 45, lift: 3.2 },
    { product1: 'Coffee Brand X', product2: 'Sugar', frequency: 38, lift: 1.9 },
  ];

  const basketMetrics = useMemo(() => {
    if (!basketData) return null;

    const totalTransactions = basketData.reduce((sum, item) => sum + item.transaction_count, 0);
    const totalRevenue = basketData.reduce((sum, item) => sum + item.total_revenue, 0);
    const weightedAvgBasketSize =
      basketData.reduce((sum, item) => {
        const size = typeof item.basket_size === 'number' ? item.basket_size : 6;
        return sum + size * item.transaction_count;
      }, 0) / totalTransactions;

    return {
      totalTransactions,
      totalRevenue,
      avgBasketSize: weightedAvgBasketSize.toFixed(1),
      avgBasketValue: (totalRevenue / totalTransactions).toFixed(2),
      singleItemTransactions: (
        ((basketData.find(item => item.basket_size === 1)?.transaction_count || 0) /
          totalTransactions) *
        100
      ).toFixed(1),
    };
  }, [basketData]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading basket behavior analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Basket Behavior Analysis</h1>
          <p className="mt-2 text-muted-foreground">
            Understanding consumer shopping patterns, basket composition, and product associations
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Analysis Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="ncr">NCR</SelectItem>
                  <SelectItem value="region3">Region 3</SelectItem>
                  <SelectItem value="region4a">Region 4A</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        {basketMetrics && (
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {basketMetrics.totalTransactions.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Basket Size</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{basketMetrics.avgBasketSize}</div>
                <p className="text-xs text-muted-foreground">items per transaction</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Basket Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱{basketMetrics.avgBasketValue}</div>
                <p className="text-xs text-muted-foreground">per transaction</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Single Item %</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{basketMetrics.singleItemTransactions}%</div>
                <p className="text-xs text-muted-foreground">of all transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₱{basketMetrics.totalRevenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basket Size Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">Number of items per transaction</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={basketData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="basket_size" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      value.toLocaleString(),
                      name === 'transaction_count' ? 'Transactions' : 'Avg Value',
                    ]}
                  />
                  <Bar dataKey="transaction_count" fill="#3b82f6" name="transaction_count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basket Value vs Size</CardTitle>
              <p className="text-sm text-muted-foreground">
                Relationship between basket size and transaction value
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={basketData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="basket_size" name="Basket Size" />
                  <YAxis dataKey="avg_value" name="Avg Value" />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      name === 'avg_value' ? `₱${value}` : value,
                      name === 'avg_value' ? 'Avg Value' : 'Basket Size',
                    ]}
                  />
                  <Scatter dataKey="avg_value" fill="#10b981">
                    {basketData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Co-purchase Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Frequent Product Associations</CardTitle>
            <p className="text-sm text-muted-foreground">
              Products commonly purchased together (Market Basket Analysis)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {coPurchaseData.map((pair, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {pair.product1} + {pair.product2}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Co-purchased {pair.frequency} times
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        pair.lift > 2.5 ? 'default' : pair.lift > 2.0 ? 'secondary' : 'outline'
                      }
                    >
                      Lift: {pair.lift}x
                    </Badge>
                    <Badge variant="outline">{pair.frequency} times</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
