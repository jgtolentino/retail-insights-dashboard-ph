import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Target, Award, Filter, Download, Package, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { ProductMixDashboard } from '@/components/ProductMixDashboard';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

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

export default function ProductInsights() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');

  // Fetch brand analytics data
  const { data: brandData, isLoading: brandLoading, error: brandError } = useQuery({
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
    }
  });

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_analytics')
        .select('category')
        .distinct();
      if (error) throw error;
      return data.map(item => item.category);
    }
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
      tbwaShare: (tbwaRevenue / totalRevenue * 100).toFixed(1),
      avgTransactionValue: totalRevenue / totalTransactions
    };
  }, [brandData]);

  const chartData = useMemo(() => {
    if (!brandData) return [];
    return brandData.slice(0, 10).map(brand => ({
      name: brand.brand_name.length > 15 ? brand.brand_name.substring(0, 15) + '...' : brand.brand_name,
      revenue: brand.total_revenue,
      transactions: brand.total_transactions,
      marketShare: brand.market_share,
      isTbwa: brand.is_tbwa
    }));
  }, [brandData]);

  const categoryData = useMemo(() => {
    if (!brandData) return [];
    const categoryMap = brandData.reduce((acc, brand) => {
      if (!acc[brand.category]) {
        acc[brand.category] = { revenue: 0, transactions: 0, brands: 0 };
      }
      acc[brand.category].revenue += brand.total_revenue;
      acc[brand.category].transactions += brand.total_transactions;
      acc[brand.category].brands += 1;
      return acc;
    }, {} as Record<string, { revenue: number; transactions: number; brands: number }>);

    return Object.entries(categoryMap).map(([category, data]) => ({
      category,
      ...data
    })).sort((a, b) => b.revenue - a.revenue);
  }, [brandData]);

  if (brandLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading product insights...</p>
        </div>
      </div>
    );
  }

  if (brandError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error loading data: {brandError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Product Insights</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive analysis of product performance, brand analytics, and market share insights
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Brand Analytics
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product Mix
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Category Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Metrics Cards */}
            {brandMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{brandMetrics.totalBrands}</div>
                    <Badge variant="secondary" className="mt-1">
                      {brandMetrics.tbwaBrands} TBWA Clients
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₱{brandMetrics.totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      TBWA Share: {brandMetrics.tbwaShare}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{brandMetrics.totalTransactions.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Avg: ₱{brandMetrics.avgTransactionValue.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Categories</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{categoryData.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Active categories
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Brands by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          name === 'revenue' ? `₱${value.toLocaleString()}` : value.toLocaleString(),
                          name === 'revenue' ? 'Revenue' : 'Transactions'
                        ]}
                        labelStyle={{ color: '#000' }}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill={(entry: any) => entry?.isTbwa ? '#3b82f6' : '#94a3b8'}
                        name="revenue"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Share Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="marketShare"
                        nameKey="name"
                        label={({ name, marketShare }) => `${name}: ${marketShare}%`}
                      >
                        {chartData.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${value}%`, 'Market Share']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <ProductMixDashboard />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? `₱${value.toLocaleString()}` : value.toLocaleString(),
                        name === 'revenue' ? 'Revenue' : name === 'transactions' ? 'Transactions' : 'Brands'
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" name="revenue" />
                    <Bar dataKey="transactions" fill="#10b981" name="transactions" />
                    <Bar dataKey="brands" fill="#f59e0b" name="brands" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}