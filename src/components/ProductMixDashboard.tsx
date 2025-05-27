import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Filter } from 'lucide-react';
import { SankeyDiagram } from './charts/SankeyDiagram';
import { ParetoChart } from './charts/ParetoChart';
import { productMixService, ProductMixFilters } from '@/services/productMix';
import { SprintDashboard } from './SprintDashboard';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#14b8a6', '#f97316'];

export function ProductMixDashboard() {
  const [filters, setFilters] = useState<ProductMixFilters>({
    startDate: new Date('2025-04-30'),
    endDate: new Date('2025-05-30'),
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [paretoGroupBy, setParetoGroupBy] = useState<'product' | 'category' | 'brand'>('product');

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('brands')
        .select('category')
        .not('category', 'is', null);
      
      const uniqueCategories = [...new Set(data?.map(b => b.category) || [])];
      return uniqueCategories.sort();
    }
  });

  // Fetch brands
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data } = await supabase
        .from('brands')
        .select('id, name')
        .order('name');
      return data || [];
    }
  });

  // Update filters when selections change
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      brandId: selectedBrand === 'all' ? undefined : selectedBrand
    }));
  }, [selectedCategory, selectedBrand]);

  // Fetch substitution data
  const { data: substitutionData, isLoading: substitutionLoading } = useQuery({
    queryKey: ['substitutions', filters],
    queryFn: () => productMixService.getProductSubstitutions(filters),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch Pareto data
  const { data: paretoData, isLoading: paretoLoading } = useQuery({
    queryKey: ['pareto', filters, paretoGroupBy],
    queryFn: () => productMixService.getParetoAnalysis(filters, paretoGroupBy),
    staleTime: 5 * 60 * 1000
  });

  // Fetch category breakdown
  const { data: categoryBreakdown, isLoading: categoryLoading } = useQuery({
    queryKey: ['categoryBreakdown', filters],
    queryFn: () => productMixService.getCategoryBreakdown(filters),
    staleTime: 5 * 60 * 1000
  });

  // Export functionality
  const handleExport = (type: 'substitutions' | 'pareto' | 'categories') => {
    let data: any;
    let filename: string;

    switch (type) {
      case 'substitutions':
        data = substitutionData;
        filename = 'product-substitutions.json';
        break;
      case 'pareto':
        data = paretoData;
        filename = `pareto-analysis-${paretoGroupBy}.csv`;
        break;
      case 'categories':
        data = categoryBreakdown;
        filename = 'category-breakdown.csv';
        break;
    }

    if (!data) return;

    // Convert to CSV for non-substitution data
    if (type !== 'substitutions') {
      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map((row: any) => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Export JSON for substitution data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const pieData = categoryBreakdown?.map(item => ({
    name: item.category,
    value: item.revenue
  })) || [];

  return (
    <SprintDashboard sprint={2}>
      <div className="space-y-6">
        {/* Header with Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Product Mix & SKU Analysis</span>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-normal">Filters</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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

              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands?.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paretoGroupBy} onValueChange={(v) => setParetoGroupBy(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pareto grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">By Product</SelectItem>
                  <SelectItem value="category">By Category</SelectItem>
                  <SelectItem value="brand">By Brand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="substitutions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="substitutions">Product Substitutions</TabsTrigger>
            <TabsTrigger value="pareto">Pareto Analysis</TabsTrigger>
            <TabsTrigger value="categories">Category Mix</TabsTrigger>
          </TabsList>

          <TabsContent value="substitutions" className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('substitutions')}
                disabled={!substitutionData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
            <SankeyDiagram
              nodes={substitutionData?.nodes || []}
              links={substitutionData?.links || []}
              loading={substitutionLoading}
              title="Product Substitution Patterns"
              height={600}
            />
          </TabsContent>

          <TabsContent value="pareto" className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pareto')}
                disabled={!paretoData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            <ParetoChart
              data={paretoData || []}
              loading={paretoLoading}
              title={`Revenue Analysis by ${paretoGroupBy.charAt(0).toUpperCase() + paretoGroupBy.slice(1)}`}
              height={500}
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('categories')}
                disabled={!categoryBreakdown}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Category Revenue Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryLoading ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Category Metrics Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoryBreakdown?.map((category, index) => (
                      <div
                        key={category.category}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{category.category}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(category.revenue)}</p>
                          <p className="text-sm text-muted-foreground">{category.units} units</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SprintDashboard>
  );
}