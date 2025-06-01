import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Building2, Star, Package, Users } from 'lucide-react';

interface BrandData {
  id: string;
  name: string;
  sales: number;
  category: string;
  is_tbwa: boolean;
}

interface SmartBrandFilterProps {
  brands: BrandData[];
  onFilteredDataChange: (filteredBrands: BrandData[]) => void;
  className?: string;
}

type FilterMode = 'top10' | 'tbwa' | 'category' | 'performance' | 'all';

export function SmartBrandFilter({
  brands,
  onFilteredDataChange,
  className,
}: SmartBrandFilterProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('top10');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [performanceThreshold, setPerformanceThreshold] = useState<'high' | 'medium' | 'low'>(
    'high'
  );

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(brands.map(b => b.category))).sort();
    return [{ value: 'all', label: 'All Categories' }].concat(
      uniqueCategories.map(cat => ({ value: cat, label: cat }))
    );
  }, [brands]);

  // Calculate performance thresholds
  const performanceThresholds = useMemo(() => {
    const sortedSales = brands.map(b => b.sales).sort((a, b) => b - a);
    return {
      high: sortedSales[Math.floor(sortedSales.length * 0.2)], // Top 20%
      medium: sortedSales[Math.floor(sortedSales.length * 0.5)], // Top 50%
      low: 0,
    };
  }, [brands]);

  // Filter brands based on current settings
  const filteredBrands = useMemo(() => {
    let filtered = [...brands];

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(b => b.category === selectedCategory);
    }

    // Apply mode-specific filters
    switch (filterMode) {
      case 'top10':
        return filtered.sort((a, b) => b.sales - a.sales).slice(0, 10);

      case 'tbwa':
        return filtered.filter(b => b.is_tbwa).sort((a, b) => b.sales - a.sales);

      case 'performance':
        const threshold = performanceThresholds[performanceThreshold];
        return filtered.filter(b => b.sales >= threshold).sort((a, b) => b.sales - a.sales);

      case 'category':
        return filtered.sort((a, b) => b.sales - a.sales).slice(0, 15); // Show more for category view

      default:
        return filtered.sort((a, b) => b.sales - a.sales);
    }
  }, [brands, filterMode, selectedCategory, performanceThreshold, performanceThresholds]);

  // Update parent component when filtered data changes
  useMemo(() => {
    onFilteredDataChange(filteredBrands);
  }, [filteredBrands, onFilteredDataChange]);

  const getFilterStats = () => {
    const total = brands.length;
    const filtered = filteredBrands.length;
    const tbwaCount = filteredBrands.filter(b => b.is_tbwa).length;
    const totalRevenue = filteredBrands.reduce((sum, b) => sum + b.sales, 0);

    return { total, filtered, tbwaCount, totalRevenue };
  };

  const stats = getFilterStats();

  const filterOptions = [
    {
      mode: 'top10' as FilterMode,
      label: 'Top 10',
      icon: TrendingUp,
      description: 'Best performing brands',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      mode: 'tbwa' as FilterMode,
      label: 'TBWA Clients',
      icon: Star,
      description: 'TBWA client brands only',
      color: 'bg-green-100 text-green-800',
    },
    {
      mode: 'category' as FilterMode,
      label: 'By Category',
      icon: Package,
      description: 'Filter by product category',
      color: 'bg-purple-100 text-purple-800',
    },
    {
      mode: 'performance' as FilterMode,
      label: 'Performance',
      icon: Building2,
      description: 'Filter by performance tier',
      color: 'bg-orange-100 text-orange-800',
    },
    {
      mode: 'all' as FilterMode,
      label: 'All Brands',
      icon: Users,
      description: 'Show all brands',
      color: 'bg-gray-100 text-gray-800',
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Mode Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map(option => {
          const Icon = option.icon;
          return (
            <Button
              key={option.mode}
              variant={filterMode === option.mode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMode(option.mode)}
              className={filterMode === option.mode ? '' : 'hover:bg-gray-50'}
            >
              <Icon className="mr-1 h-4 w-4" />
              {option.label}
            </Button>
          );
        })}
      </div>

      {/* Additional Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Category Filter */}
        {(filterMode === 'category' || filterMode === 'all') && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Category:</span>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Performance Threshold */}
        {filterMode === 'performance' && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Tier:</span>
            <Select
              value={performanceThreshold}
              onValueChange={(value: 'high' | 'medium' | 'low') => setPerformanceThreshold(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High (Top 20%)</SelectItem>
                <SelectItem value="medium">Medium (Top 50%)</SelectItem>
                <SelectItem value="low">All Performers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Filter Stats */}
      <div className="flex flex-wrap gap-4 rounded-lg bg-gray-50 p-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {stats.filtered} of {stats.total} brands
          </Badge>
        </div>

        {stats.tbwaCount > 0 && (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">
              {stats.tbwaCount} TBWA client{stats.tbwaCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-700">
            ₱{stats.totalRevenue.toLocaleString()} total revenue
          </span>
        </div>

        {selectedCategory !== 'all' && (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-purple-700">{selectedCategory} category</span>
          </div>
        )}
      </div>

      {/* Active Filter Description */}
      <div className="text-sm text-gray-600">
        {(() => {
          const activeFilter = filterOptions.find(opt => opt.mode === filterMode);
          return (
            <div className="flex items-center gap-2">
              <Badge className={activeFilter?.color}>{activeFilter?.label}</Badge>
              <span>{activeFilter?.description}</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
