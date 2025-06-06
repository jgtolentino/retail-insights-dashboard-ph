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
import { BarChart3, TrendingUp, Target, Award, Filter, Download } from 'lucide-react';
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

export default function Brands() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');

  // Fetch brand performance data
  const { data: brandData, isLoading: brandLoading } = useQuery({
    queryKey: ['brand-performance', selectedCategory, dateRange],
    queryFn: async () => {
      console.log('Fetching brand performance data...');

      // Get comprehensive brand data
      const query = supabase.from('transaction_items').select(
        `
          quantity,
          price,
          products!inner(
            brand_id,
            brands!inner(
              id,
              name,
              category,
              is_tbwa
            )
          ),
          transactions!inner(
            created_at
          )
        `
      );

      // Process all transactions without limit

      // Apply date filter
      const daysAgo = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await finalQuery
        .gte('transactions.created_at', startDate.toISOString())
        .lte('transactions.created_at', new Date().toISOString());

      if (error) {
        console.error('Error fetching brand data:', error);
        throw error;
      }

      // Process brand data
      const brandMap = new Map<number, BrandData>();

      data?.forEach((item: any) => {
        const brand = item.products.brands;
        const revenue = item.quantity * item.price;

        // Skip if category filter is applied and doesn't match
        if (selectedCategory !== 'all' && brand.category !== selectedCategory) {
          return;
        }

        if (brandMap.has(brand.id)) {
          const existing = brandMap.get(brand.id)!;
          existing.total_revenue += revenue;
          existing.total_transactions += 1;
          existing.total_quantity += item.quantity;
        } else {
          brandMap.set(brand.id, {
            brand_id: brand.id,
            brand_name: brand.name,
            category: brand.category,
            is_tbwa: brand.is_tbwa,
            total_revenue: revenue,
            total_transactions: 1,
            total_quantity: item.quantity,
            avg_price: item.price,
            market_share: 0, // Will calculate after
          });
        }
      });

      const brands = Array.from(brandMap.values());
      const totalRevenue = brands.reduce((sum, brand) => sum + brand.total_revenue, 0);

      // Calculate market share and average price
      brands.forEach(brand => {
        brand.market_share = totalRevenue > 0 ? (brand.total_revenue / totalRevenue) * 100 : 0;
        brand.avg_price = brand.total_quantity > 0 ? brand.total_revenue / brand.total_quantity : 0;
      });

      return brands.sort((a, b) => b.total_revenue - a.total_revenue);
    },
  });

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('brands').select('category').not('category', 'is', null);

      const uniqueCategories = [...new Set(data?.map(b => b.category) || [])];
      return uniqueCategories.sort();
    },
  });

  // Calculate growth trends (simulated)
  const brandTrends = useMemo(() => {
    if (!brandData) return [];

    return brandData.slice(0, 10).map(brand => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
      return {
        brand: brand.brand_name,
        data: months.map(month => ({
          month,
          revenue: (brand.total_revenue * (0.8 + Math.random() * 0.4)) / 5,
        })),
      };
    });
  }, [brandData]);

  // Category share data
  const categoryShareData = useMemo(() => {
    if (!brandData) return [];

    const categoryMap = new Map<string, number>();
    brandData.forEach(brand => {
      const existing = categoryMap.get(brand.category) || 0;
      categoryMap.set(brand.category, existing + brand.total_revenue);
    });

    return Array.from(categoryMap.entries()).map(([category, revenue]) => ({
      name: category,
      value: revenue,
      percentage:
        brandData.length > 0
          ? (revenue / brandData.reduce((sum, b) => sum + b.total_revenue, 0)) * 100
          : 0,
    }));
  }, [brandData]);

  // Export functionality
  const handleExport = (type: string) => {
    if (!brandData) return;

    const csvContent = [
      ['Brand', 'Category', 'TBWA Client', 'Revenue', 'Transactions', 'Market Share %'].join(','),
      ...brandData.map(brand =>
        [
          brand.brand_name,
          brand.category,
          brand.is_tbwa ? 'Yes' : 'No',
          brand.total_revenue.toFixed(2),
          brand.total_transactions,
          brand.market_share.toFixed(2),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-analysis-${type}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (brandLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-64 items-center justify-center">
            <div className="animate-pulse text-gray-500">Loading brand analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brand Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive brand performance analysis and competitive insights
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
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
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('overview')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Award className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Brands</p>
                <p className="text-2xl font-bold">{brandData?.length || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Active brands</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">TBWA Brands</p>
                <p className="text-2xl font-bold">
                  {brandData?.filter(b => b.is_tbwa).length || 0}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Client brands</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Top Brand</p>
                <p className="text-2xl font-bold">
                  {brandData?.[0]?.brand_name?.slice(0, 8) || 'N/A'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">By revenue</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories?.length || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Product types</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Brand Performance</TabsTrigger>
            <TabsTrigger value="trends">Growth Trends</TabsTrigger>
            <TabsTrigger value="categories">Category Share</TabsTrigger>
            <TabsTrigger value="competitive">Competitive Analysis</TabsTrigger>
          </TabsList>

          {/* Brand Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Brands by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brandData?.slice(0, 15).map((brand, index) => (
                    <div
                      key={brand.brand_id}
                      className="flex items-center gap-4 rounded-lg border p-3"
                    >
                      <div className="w-8 flex-shrink-0 text-center">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900">{brand.brand_name}</h4>
                          {brand.is_tbwa && (
                            <Badge variant="default" className="text-xs">
                              TBWA
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{brand.category}</p>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ₱{brand.total_revenue.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {brand.market_share.toFixed(1)}% • {brand.total_transactions}tx
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Growth Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Brand Growth Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={brandTrends[0]?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={value => `₱${(value / 1000).toFixed(0)}K`} />
                    <Tooltip
                      formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']}
                    />
                    {brandTrends.slice(0, 5).map((brand, index) => (
                      <Line
                        key={brand.brand}
                        type="monotone"
                        dataKey="revenue"
                        data={brand.data}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        name={brand.brand}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Category Share Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={categoryShareData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percentage }) =>
                          percentage > 5 ? `${name} ${percentage.toFixed(0)}%` : ''
                        }
                      >
                        {categoryShareData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryShareData.map((category, index) => (
                      <div key={category.name} className="flex items-center gap-4">
                        <div
                          className="h-4 w-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{category.name}</span>
                            <span className="text-sm text-gray-500">
                              ₱{category.value.toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${category.percentage}%`,
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Competitive Analysis Tab */}
          <TabsContent value="competitive" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>TBWA vs Competitors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4">
                      <div>
                        <h4 className="font-medium text-blue-900">TBWA Clients</h4>
                        <p className="text-sm text-blue-700">
                          {brandData?.filter(b => b.is_tbwa).length || 0} brands
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-900">
                          ₱
                          {(
                            brandData
                              ?.filter(b => b.is_tbwa)
                              .reduce((sum, b) => sum + b.total_revenue, 0) || 0
                          ).toLocaleString()}
                        </div>
                        <p className="text-sm text-blue-700">Total revenue</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                      <div>
                        <h4 className="font-medium text-gray-900">Competitors</h4>
                        <p className="text-sm text-gray-700">
                          {brandData?.filter(b => !b.is_tbwa).length || 0} brands
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          ₱
                          {(
                            brandData
                              ?.filter(b => !b.is_tbwa)
                              .reduce((sum, b) => sum + b.total_revenue, 0) || 0
                          ).toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-700">Total revenue</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Leaders by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories?.map(category => {
                      const categoryBrands = brandData?.filter(b => b.category === category) || [];
                      const leader = categoryBrands[0];

                      if (!leader) return null;

                      return (
                        <div
                          key={category}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <h4 className="font-medium">{category}</h4>
                            <p className="text-sm text-gray-500">{leader.brand_name}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              ₱{leader.total_revenue.toLocaleString()}
                            </div>
                            {leader.is_tbwa && (
                              <Badge variant="default" className="mt-1 text-xs">
                                TBWA
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
