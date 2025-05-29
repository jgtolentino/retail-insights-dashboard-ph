import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TBWACompetitiveToggle, MarketShareWidget } from './TBWACompetitiveToggle';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Sparkles, Building2, TrendingUp, Award } from 'lucide-react';

export const EnhancedBrandsPage: React.FC = () => {
  const {
    filters,
    filterOptions,
    isLoading,
    getBrandAnalysis,
    getMarketShare,
    getCategoryPerformance,
    setTBWAOnly
  } = useAdvancedFilters();

  const [marketShare, setMarketShare] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topBrands, setTopBrands] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load market share data
  useEffect(() => {
    const loadMarketShare = async () => {
      const data = await getMarketShare();
      setMarketShare(data);
    };
    loadMarketShare();
  }, [getMarketShare]);

  // Load category performance data
  useEffect(() => {
    const loadCategoryData = async () => {
      const data = await getCategoryPerformance();
      setCategoryData(data);
    };
    loadCategoryData();
  }, [getCategoryPerformance]);

  // Load top brands based on current filter
  useEffect(() => {
    const loadTopBrands = async () => {
      const data = await getBrandAnalysis(selectedCategory || undefined, filters.tbwa_only);
      if (data?.brands) {
        const sorted = data.brands
          .sort((a, b) => b.metrics.revenue - a.metrics.revenue)
          .slice(0, 10);
        setTopBrands(sorted);
      }
    };
    loadTopBrands();
  }, [getBrandAnalysis, selectedCategory, filters.tbwa_only]);

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

  const COLORS = ['#fbbf24', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading brand analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Intelligence</h1>
          <p className="text-gray-600 mt-1">TBWA competitive analysis and market insights</p>
        </div>
        
        {/* TBWA Toggle */}
        <div className="w-96">
          <TBWACompetitiveToggle
            value={filters.tbwa_only}
            onValueChange={setTBWAOnly}
            tbwaStats={filterOptions?.tbwa_stats}
            size="md"
          />
        </div>
      </div>

      {/* Market Share Overview */}
      {marketShare && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MarketShareWidget
              tbwaShare={marketShare.tbwa_share}
              tbwaRevenue={marketShare.tbwa_revenue}
              competitorRevenue={marketShare.competitor_revenue}
            />
          </div>
          
          {/* Quick Stats */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Sparkles className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">TBWA Revenue</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {formatCurrency(marketShare.tbwa_revenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Competitor Revenue</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(marketShare.competitor_revenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}K`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'tbwa_revenue' ? 'TBWA Revenue' : 'Competitor Revenue'
                  ]}
                />
                <Bar dataKey="tbwa_revenue" fill="#fbbf24" name="TBWA" />
                <Bar dataKey="competitor_revenue" fill="#3b82f6" name="Competitors" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Market Share by Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              TBWA Market Dominance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="tbwa_share"
                  label={({ category, tbwa_share }) => `${category}: ${tbwa_share.toFixed(1)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Market Share']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Category Analysis</CardTitle>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedCategory === null 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {filterOptions?.categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === category.value 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Top Brands Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Top Performing Brands
            {selectedCategory && (
              <Badge variant="secondary">
                {selectedCategory}
              </Badge>
            )}
            {filters.tbwa_only === true && (
              <Badge className="bg-yellow-100 text-yellow-800">
                TBWA Clients Only
              </Badge>
            )}
            {filters.tbwa_only === false && (
              <Badge className="bg-blue-100 text-blue-800">
                Competitors Only
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Rank</th>
                  <th className="text-left p-3">Brand</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-right p-3">Revenue</th>
                  <th className="text-right p-3">Transactions</th>
                  <th className="text-right p-3">Products</th>
                </tr>
              </thead>
              <tbody>
                {topBrands.map((brand, index) => (
                  <tr key={brand.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-600">#{index + 1}</span>
                        {index < 3 && (
                          <span className="text-yellow-500">🏆</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-medium">{brand.name}</td>
                    <td className="p-3">
                      <Badge variant="outline">{brand.category}</Badge>
                    </td>
                    <td className="p-3">
                      {brand.is_tbwa ? (
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-yellow-600" />
                          <span className="text-yellow-600 font-medium">TBWA</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-600 font-medium">Competitor</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right font-bold">
                      {formatCurrency(brand.metrics.revenue)}
                    </td>
                    <td className="p-3 text-right">
                      {brand.metrics.transactions.toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      {brand.metrics.products}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBrandsPage;