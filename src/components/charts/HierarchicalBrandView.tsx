import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Package, TrendingUp, Building2 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';

interface BrandData {
  id: string;
  name: string;
  sales: number;
  category: string;
  is_tbwa: boolean;
}

interface HierarchicalBrandViewProps {
  brands: BrandData[];
  className?: string;
}

type ViewLevel = 'category' | 'brand' | 'product';

const COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
];

export function HierarchicalBrandView({ brands, className }: HierarchicalBrandViewProps) {
  const [currentLevel, setCurrentLevel] = useState<ViewLevel>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // Aggregate brands by category
  const categoryData = useMemo(() => {
    const categoryMap = new Map<
      string,
      { name: string; sales: number; brandCount: number; tbwaCount: number }
    >();

    brands.forEach(brand => {
      const existing = categoryMap.get(brand.category) || {
        name: brand.category,
        sales: 0,
        brandCount: 0,
        tbwaCount: 0,
      };

      existing.sales += brand.sales;
      existing.brandCount += 1;
      if (brand.is_tbwa) existing.tbwaCount += 1;

      categoryMap.set(brand.category, existing);
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8); // Top 8 categories for clean display
  }, [brands]);

  // Get brands for selected category
  const categoryBrands = useMemo(() => {
    if (!selectedCategory) return [];

    return brands
      .filter(brand => brand.category === selectedCategory)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10); // Top 10 brands in category
  }, [brands, selectedCategory]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setCurrentLevel('brand');
  };

  const handleBrandClick = (brandId: string) => {
    setSelectedBrand(brandId);
    setCurrentLevel('product');
  };

  const goBack = () => {
    if (currentLevel === 'product') {
      setCurrentLevel('brand');
      setSelectedBrand(null);
    } else if (currentLevel === 'brand') {
      setCurrentLevel('category');
      setSelectedCategory(null);
    }
  };

  const getBreadcrumbs = () => {
    const crumbs = [
      {
        label: 'Categories',
        level: 'category' as ViewLevel,
        onClick: () => setCurrentLevel('category'),
      },
    ];

    if (selectedCategory) {
      crumbs.push({
        label: selectedCategory,
        level: 'brand' as ViewLevel,
        onClick: () => setCurrentLevel('brand'),
      });
    }

    if (selectedBrand) {
      const brand = brands.find(b => b.id === selectedBrand);
      crumbs.push({
        label: brand?.name || '',
        level: 'product' as ViewLevel,
        onClick: () => setCurrentLevel('product'),
      });
    }

    return crumbs;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Revenue Analysis
          </CardTitle>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            {getBreadcrumbs().map((crumb, index) => (
              <div key={crumb.level} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="h-4 w-4" />}
                <button
                  onClick={crumb.onClick}
                  className={`transition-colors hover:text-blue-600 ${
                    index === getBreadcrumbs().length - 1
                      ? 'font-medium text-blue-600'
                      : 'text-gray-500 hover:text-blue-600'
                  }`}
                >
                  {crumb.label}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        {currentLevel !== 'category' && (
          <Button variant="outline" size="sm" onClick={goBack} className="w-fit">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {/* Category Level - Pie Chart */}
        {currentLevel === 'category' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4" />
              Click on a category to drill down to brands
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Pie Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="sales"
                      onClick={data => handleCategoryClick(data.name)}
                      className="cursor-pointer"
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']}
                      labelFormatter={label => `Category: ${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category List */}
              <div className="space-y-2">
                {categoryData.map((category, index) => (
                  <div
                    key={category.name}
                    onClick={() => handleCategoryClick(category.name)}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-gray-500">
                          {category.brandCount} brands • {category.tbwaCount} TBWA clients
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₱{category.sales.toLocaleString()}</div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Brand Level - Bar Chart */}
        {currentLevel === 'brand' && selectedCategory && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              Top brands in {selectedCategory} • Click to see product details
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryBrands}
                  margin={{ left: 20, right: 20, top: 20, bottom: 60 }}
                >
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis tickFormatter={value => `₱${(value / 1000).toFixed(0)}k`} fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']}
                    labelFormatter={label => `Brand: ${label}`}
                  />
                  <Bar
                    dataKey="sales"
                    fill="#3B82F6"
                    onClick={data => handleBrandClick(data.id)}
                    className="cursor-pointer"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Brand Summary Cards */}
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
              {categoryBrands.slice(0, 5).map(brand => (
                <div
                  key={brand.id}
                  onClick={() => handleBrandClick(brand.id)}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-50 ${
                    brand.is_tbwa ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="truncate text-sm font-medium">{brand.name}</div>
                  <div className="text-xs text-gray-500">₱{(brand.sales / 1000).toFixed(0)}k</div>
                  {brand.is_tbwa && (
                    <div className="text-xs font-medium text-blue-600">TBWA Client</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Level - Detailed View */}
        {currentLevel === 'product' && selectedBrand && (
          <div className="space-y-4">
            {(() => {
              const brand = brands.find(b => b.id === selectedBrand);
              return (
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{brand?.name}</h3>
                      <p className="text-sm text-gray-600">Category: {brand?.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        ₱{brand?.sales.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Total Revenue</div>
                    </div>
                  </div>

                  {brand?.is_tbwa && (
                    <div className="mt-3 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      TBWA Client
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="py-8 text-center text-gray-500">
              <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p>Product-level details would be displayed here.</p>
              <p className="text-sm">
                This could include SKU performance, trends, and substitution data.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
