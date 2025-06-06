/**
 * Product Trends Page
 *
 * "What can be done?" - Product performance insights and trend analysis
 * Deep dive into product categories, brand performance, and emerging trends
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Filter,
  Download,
  Package,
  Layers,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ProductMixDashboard } from '@/components/ProductMixDashboard';

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

interface BrandData {
  brand_id: number;
  brand_name: string;
  category: string;
  is_tbwa: boolean;
  total_revenue: number;
  total_transactions: number;
  total_quantity: number;
  avg_price: number;
  market_share: number;
}

export default function ProductTrends() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');

  // Fetch brand analytics data
  const {
    data: brandData,
    isLoading: brandLoading,
    error: brandError,
  } = useQuery({
    queryKey: ['brand-analytics', selectedCategory, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('brand_analytics')
        .select('*')
        .order('total_revenue', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BrandData[];
    },
  });

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brand_analytics').select('category').distinct();
      if (error) throw error;
      return data.map(item => item.category);
    },
  });

  const brandMetrics = useMemo(() => {
    if (!brandData) return null;

    const totalRevenue = brandData.reduce((sum, brand) => sum + brand.total_revenue, 0);
    const totalTransactions = brandData.reduce((sum, brand) => sum + brand.total_transactions, 0);
    const tbwaBrands = brandData.filter(brand => brand.is_tbwa);
    const tbwaRevenue = tbwaBrands.reduce((sum, brand) => sum + brand.total_revenue, 0);

    return {
      totalBrands: brandData.length,
      totalRevenue,
      totalTransactions,
      tbwaBrands: tbwaBrands.length,
      tbwaShare: ((tbwaRevenue / totalRevenue) * 100).toFixed(1),
      avgTransactionValue: totalRevenue / totalTransactions,
    };
  }, [brandData]);

  const chartData = useMemo(() => {
    if (!brandData) return [];
    return brandData.slice(0, 10).map(brand => ({
      name:
        brand.brand_name.length > 15 ? brand.brand_name.substring(0, 15) + '...' : brand.brand_name,
      revenue: brand.total_revenue,
      transactions: brand.total_transactions,
      marketShare: brand.market_share,
      isTbwa: brand.is_tbwa,
    }));
  }, [brandData]);

  const categoryData = useMemo(() => {
    if (!brandData) return [];
    const categoryMap = brandData.reduce(
      (acc, brand) => {
        if (!acc[brand.category]) {
          acc[brand.category] = { revenue: 0, transactions: 0, brands: 0 };
        }
        acc[brand.category].revenue += brand.total_revenue;
        acc[brand.category].transactions += brand.total_transactions;
        acc[brand.category].brands += 1;
        return acc;
      },
      {} as Record<string, { revenue: number; transactions: number; brands: number }>
    );

    return Object.entries(categoryMap)
      .map(([category, data]) => ({
        name: category,
        revenue: data.revenue,
        transactions: data.transactions,
        brands: data.brands,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [brandData]);

  if (brandError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Product Data</h3>
          <p className="mt-1 text-sm text-gray-500">Please check your database connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Power BI Style Header - "What can be done?" Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Lightbulb className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">What Can Be Done?</h1>
            <p className="text-lg font-medium text-green-600">Product Trends & Opportunities</p>
          </div>
        </div>
        <p className="max-w-2xl text-gray-600">
          Identify growth opportunities, optimize product mix, and understand market trends to drive
          strategic decisions. Discover which products are performing well and where to focus your
          efforts for maximum impact.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Key Metrics */}
      {brandMetrics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Brands</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{brandMetrics.totalBrands}</div>
              <p className="text-xs text-blue-700">Brands in portfolio</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                ₱{brandMetrics.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-green-700">Across all products</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TBWA Brands</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{brandMetrics.tbwaBrands}</div>
              <p className="text-xs text-purple-700">{brandMetrics.tbwaShare}% market share</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
              <Award className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                ₱{Math.round(brandMetrics.avgTransactionValue)}
              </div>
              <p className="text-xs text-orange-700">Per transaction value</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Strategic Insights */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Lightbulb className="h-5 w-5" />
                Strategic Product Opportunities
              </CardTitle>
              <p className="mt-1 text-sm text-green-700">
                Actionable insights to optimize your product portfolio and drive growth
              </p>
            </div>
            <ArrowRight className="h-8 w-8 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-green-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-green-900">🚀 Growth Accelerators</h4>
              <ul className="space-y-1 text-sm text-green-800">
                <li>• Focus marketing on top 3 performing categories</li>
                <li>• Increase inventory for high-velocity products</li>
                <li>• Bundle slow-moving items with bestsellers</li>
                <li>• Target premium product segments</li>
              </ul>
            </div>

            <div className="rounded-lg border border-blue-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-blue-900">💡 Innovation Areas</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Develop private label alternatives</li>
                <li>• Explore emerging product categories</li>
                <li>• Test seasonal product variations</li>
                <li>• Consider eco-friendly alternatives</li>
              </ul>
            </div>

            <div className="rounded-lg border border-purple-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-purple-900">⚡ Quick Wins</h4>
              <ul className="space-y-1 text-sm text-purple-800">
                <li>• Optimize shelf placement for top brands</li>
                <li>• Implement cross-selling strategies</li>
                <li>• Adjust pricing for price-sensitive items</li>
                <li>• Streamline slow-moving inventory</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Brand Overview</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <Layers className="h-4 w-4" />
            <span>Categories</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Trends</span>
          </TabsTrigger>
          <TabsTrigger value="mix" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Product Mix</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Brand Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Top Brand Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {brandLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        fontSize={12}
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis
                        fontSize={12}
                        tickFormatter={value => `₱${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? `₱${value.toLocaleString()}` : value,
                          name === 'revenue' ? 'Revenue' : 'Transactions',
                        ]}
                      />
                      <Bar
                        dataKey="revenue"
                        fill={(entry: any) => (entry.isTbwa ? '#10b981' : '#3b82f6')}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Market Share Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Market Share Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {brandLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, marketShare }) => `${name}: ${marketShare?.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="marketShare"
                      >
                        {chartData.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Market Share']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Brand Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Brand Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Brand</th>
                      <th className="p-2 text-left">Category</th>
                      <th className="p-2 text-right">Revenue</th>
                      <th className="p-2 text-right">Transactions</th>
                      <th className="p-2 text-right">Market Share</th>
                      <th className="p-2 text-center">TBWA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brandData?.slice(0, 10).map((brand, index) => (
                      <tr key={brand.brand_id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{brand.brand_name}</td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {brand.category}
                          </Badge>
                        </td>
                        <td className="p-2 text-right">₱{brand.total_revenue.toLocaleString()}</td>
                        <td className="p-2 text-right">
                          {brand.total_transactions.toLocaleString()}
                        </td>
                        <td className="p-2 text-right">{brand.market_share.toFixed(1)}%</td>
                        <td className="p-2 text-center">
                          {brand.is_tbwa ? (
                            <Badge className="bg-green-100 text-green-800">TBWA</Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Layers className="h-5 w-5" />
                <span>Category Performance Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={value => `₱${(value / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" width={120} fontSize={12} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `₱${value.toLocaleString()}` : value,
                      name === 'revenue'
                        ? 'Revenue'
                        : name === 'transactions'
                          ? 'Transactions'
                          : 'Brands',
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Product Trend Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Trend analysis coming soon. This section will show:
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Time-series revenue trends by product</li>
                  <li>• Seasonal performance patterns</li>
                  <li>• Growth/decline trajectories</li>
                  <li>• Predictive trend forecasting</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mix">
          <ProductMixDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
