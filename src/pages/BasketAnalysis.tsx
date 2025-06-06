/**
 * Basket Analysis Page
 *
 * "What can be done?" - Shopping cart analysis and optimization opportunities
 * Deep insights into purchase patterns, basket composition, and cross-selling opportunities
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  Users,
  Target,
  TrendingUp,
  Package,
  Lightbulb,
  ArrowUpRight,
} from 'lucide-react';
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
  LineChart,
  Line,
} from 'recharts';

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

export default function BasketAnalysis() {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30');

  // Fetch basket size distribution
  const { data: basketData, isLoading } = useQuery({
    queryKey: ['basket-analysis', selectedRegion, selectedTimeframe],
    queryFn: async () => {
      const daysAgo = parseInt(selectedTimeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      let query = supabase
        .from('transaction_items')
        .select(
          `
          transaction_id,
          quantity,
          price,
          transactions!inner(
            total_amount,
            created_at,
            store_location
          )
        `
        )
        .gte('transactions.created_at', startDate.toISOString());

      if (selectedRegion !== 'all') {
        query = query.ilike('transactions.store_location', `%${selectedRegion}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by transaction to calculate basket sizes
      const basketMap = new Map<string, { items: number; value: number }>();

      data?.forEach(item => {
        const transactionId = item.transaction_id;
        if (!basketMap.has(transactionId)) {
          basketMap.set(transactionId, { items: 0, value: 0 });
        }
        const basket = basketMap.get(transactionId)!;
        basket.items += item.quantity || 1;
        basket.value += (item.quantity || 1) * (item.price || 0);
      });

      // Aggregate by basket size
      const sizeDistribution = new Map<number, { count: number; totalValue: number }>();

      basketMap.forEach(({ items, value }) => {
        if (!sizeDistribution.has(items)) {
          sizeDistribution.set(items, { count: 0, totalValue: 0 });
        }
        const dist = sizeDistribution.get(items)!;
        dist.count += 1;
        dist.totalValue += value;
      });

      return Array.from(sizeDistribution.entries())
        .map(([size, { count, totalValue }]) => ({
          basket_size: size,
          transaction_count: count,
          avg_value: totalValue / count,
          total_revenue: totalValue,
        }))
        .sort((a, b) => a.basket_size - b.basket_size);
    },
  });

  // Calculate key metrics
  const basketMetrics = useMemo(() => {
    if (!basketData) return null;

    const totalTransactions = basketData.reduce((sum, b) => sum + b.transaction_count, 0);
    const totalRevenue = basketData.reduce((sum, b) => sum + b.total_revenue, 0);
    const weightedBasketSize = basketData.reduce(
      (sum, b) => sum + b.basket_size * b.transaction_count,
      0
    );

    return {
      avgBasketSize: weightedBasketSize / totalTransactions,
      avgBasketValue: totalRevenue / totalTransactions,
      totalTransactions,
      totalRevenue,
      largestBasket: Math.max(...basketData.map(b => b.basket_size)),
    };
  }, [basketData]);

  // Fetch regions for filter
  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('store_location')
        .not('store_location', 'is', null);

      if (error) throw error;

      const uniqueRegions = Array.from(
        new Set(data.map(t => t.store_location?.split(',')[1]?.trim()).filter(Boolean))
      );

      return uniqueRegions;
    },
  });

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Power BI Style Header - "What can be done?" Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <ShoppingCart className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">What Can Be Done?</h1>
            <p className="text-lg font-medium text-indigo-600">Basket Analysis & Cross-Selling</p>
          </div>
        </div>
        <p className="max-w-2xl text-gray-600">
          Optimize shopping cart performance through detailed basket analysis. Identify
          cross-selling opportunities, understand purchase patterns, and implement strategies to
          increase average order value and customer satisfaction.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions?.map(region => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      {basketMetrics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Basket Size</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {basketMetrics.avgBasketSize.toFixed(1)}
              </div>
              <p className="text-xs text-blue-700">Items per transaction</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Basket Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                ₱{Math.round(basketMetrics.avgBasketValue).toLocaleString()}
              </div>
              <p className="text-xs text-green-700">Per transaction</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {basketMetrics.totalTransactions.toLocaleString()}
              </div>
              <p className="text-xs text-purple-700">Shopping sessions</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Largest Basket</CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {basketMetrics.largestBasket}
              </div>
              <p className="text-xs text-orange-700">Items in single purchase</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cross-Selling Opportunities */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Lightbulb className="h-5 w-5" />
                Cross-Selling & Upselling Opportunities
              </CardTitle>
              <p className="mt-1 text-sm text-indigo-700">
                Strategic recommendations to increase basket value and customer satisfaction
              </p>
            </div>
            <ArrowUpRight className="h-8 w-8 text-indigo-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-indigo-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-indigo-900">🛒 Basket Building</h4>
              <ul className="space-y-1 text-sm text-indigo-800">
                <li>• Promote complementary products at checkout</li>
                <li>• Create product bundles for popular combinations</li>
                <li>• Offer quantity discounts for bulk purchases</li>
                <li>• Strategic product placement near high-traffic items</li>
              </ul>
            </div>

            <div className="rounded-lg border border-green-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-green-900">💰 Value Enhancement</h4>
              <ul className="space-y-1 text-sm text-green-800">
                <li>• Free shipping thresholds to increase basket size</li>
                <li>• "Buy 2, get 1 free" promotions for categories</li>
                <li>• Loyalty points for multi-item purchases</li>
                <li>• Premium product recommendations</li>
              </ul>
            </div>

            <div className="rounded-lg border border-purple-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-purple-900">🎯 Targeted Suggestions</h4>
              <ul className="space-y-1 text-sm text-purple-800">
                <li>• AI-powered product recommendations</li>
                <li>• Category-based cross-selling alerts</li>
                <li>• Customer behavior-driven suggestions</li>
                <li>• Seasonal and trending item highlights</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="distribution">Size Distribution</TabsTrigger>
          <TabsTrigger value="value">Value Analysis</TabsTrigger>
          <TabsTrigger value="patterns">Purchase Patterns</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Basket Size Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                </div>
              ) : basketData && basketData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={basketData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="basket_size"
                      label={{
                        value: 'Basket Size (Items)',
                        position: 'insideBottom',
                        offset: -10,
                      }}
                    />
                    <YAxis
                      label={{
                        value: 'Number of Transactions',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        typeof value === 'number' ? value.toLocaleString() : value,
                        name === 'transaction_count' ? 'Transactions' : 'Value',
                      ]}
                      labelFormatter={label => `Basket Size: ${label} items`}
                    />
                    <Bar dataKey="transaction_count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-64 items-center justify-center text-gray-500">
                  No basket data available for the selected filters
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="value">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Basket Value vs Size Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                </div>
              ) : basketData && basketData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart data={basketData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="basket_size"
                      label={{
                        value: 'Basket Size (Items)',
                        position: 'insideBottom',
                        offset: -10,
                      }}
                    />
                    <YAxis
                      dataKey="avg_value"
                      label={{ value: 'Average Value (₱)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={value => `₱${Math.round(value)}`}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'avg_value'
                          ? `₱${Math.round(Number(value)).toLocaleString()}`
                          : value,
                        name === 'avg_value' ? 'Avg Value' : 'Basket Size',
                      ]}
                    />
                    <Scatter dataKey="avg_value" fill="#10b981">
                      {basketData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-64 items-center justify-center text-gray-500">
                  No value analysis data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Shopping Pattern Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Basket Composition Patterns</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Single-item purchases</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: '45%' }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Small baskets (2-3 items)</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{ width: '35%' }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">35%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Medium baskets (4-6 items)</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-purple-500"
                            style={{ width: '15%' }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Large baskets (7+ items)</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-orange-500"
                            style={{ width: '5%' }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Cross-Category Purchases</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      <span>Food + Beverages: 78% co-occurrence</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      <span>Personal Care + Health: 56% together</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                      <span>Household + Cleaning: 67% bundled</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                      <span>Snacks + Beverages: 89% correlation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>Basket Optimization Strategies</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4">
                  <h4 className="mb-2 font-medium text-blue-900">📈 Increase Basket Size</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• Implement "Frequently Bought Together" displays</li>
                    <li>• Create themed product bundles</li>
                    <li>• Offer progressive discounts for more items</li>
                    <li>• Place complementary items near checkout</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-green-50 p-4">
                  <h4 className="mb-2 font-medium text-green-900">💰 Boost Basket Value</h4>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>• Suggest premium alternatives</li>
                    <li>• Highlight value packs and family sizes</li>
                    <li>• Implement minimum order thresholds</li>
                    <li>• Offer free shipping for higher totals</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-purple-50 p-4">
                  <h4 className="mb-2 font-medium text-purple-900">🎯 Smart Recommendations</h4>
                  <ul className="space-y-1 text-sm text-purple-800">
                    <li>• Use AI for personalized suggestions</li>
                    <li>• Display customer purchase history</li>
                    <li>• Show trending items in category</li>
                    <li>• Highlight seasonal and promotional items</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
