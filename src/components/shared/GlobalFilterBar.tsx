import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X, RefreshCw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface GlobalFilterBarProps {
  categories?: FilterOption[];
  brands?: FilterOption[];
  regions?: FilterOption[];
  timeRanges?: FilterOption[];
  onFiltersChange?: (filters: FilterState) => void;
  onReset?: () => void;
  enabledFilters?: ('category' | 'brand' | 'region' | 'timeRange')[];
  compact?: boolean;
  sticky?: boolean;
  className?: string;
}

export interface FilterState {
  category: string;
  brand: string;
  region: string;
  timeRange: string;
}

const defaultTimeRanges: FilterOption[] = [
  { value: 'all', label: 'All Time' },
  { value: '1d', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
];

const defaultCategories: FilterOption[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'cigarettes', label: 'Cigarettes', count: 120 },
  { value: 'beverages', label: 'Beverages', count: 85 },
  { value: 'snacks', label: 'Snacks', count: 65 },
  { value: 'personal-care', label: 'Personal Care', count: 45 },
];

const defaultBrands: FilterOption[] = [
  { value: 'all', label: 'All Brands' },
  { value: 'marlboro', label: 'Marlboro', count: 45 },
  { value: 'ufc', label: 'UFC', count: 32 },
  { value: 'alaska', label: 'Alaska', count: 28 },
  { value: 'max', label: 'Max Energy', count: 22 },
];

const defaultRegions: FilterOption[] = [
  { value: 'all', label: 'All Regions' },
  { value: 'ncr', label: 'NCR', count: 150 },
  { value: 'region3', label: 'Region 3', count: 89 },
  { value: 'region4a', label: 'Region 4A', count: 67 },
];

export function GlobalFilterBar({
  categories = defaultCategories,
  brands = defaultBrands,
  regions = defaultRegions,
  timeRanges = defaultTimeRanges,
  onFiltersChange,
  onReset,
  enabledFilters = ['category', 'brand', 'region', 'timeRange'],
  compact = false,
  sticky = true,
  className = '',
}: GlobalFilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    brand: 'all',
    region: 'all',
    timeRange: '30d',
  });
  const [isCollapsed, setIsCollapsed] = useState(compact);

  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    const resetFilters = {
      category: 'all',
      brand: 'all',
      region: 'all',
      timeRange: '30d',
    };
    setFilters(resetFilters);
    if (onReset) {
      onReset();
    }
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== 'all').length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const FilterContent = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {enabledFilters.includes('timeRange') && (
          <div className="min-w-[160px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">Time Period</label>
            <Select
              value={filters.timeRange}
              onValueChange={value => handleFilterChange('timeRange', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {enabledFilters.includes('category') && (
          <div className="min-w-[160px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <Select
              value={filters.category}
              onValueChange={value => handleFilterChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex w-full items-center justify-between">
                      {option.label}
                      {option.count && (
                        <Badge variant="secondary" className="ml-2">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {enabledFilters.includes('brand') && (
          <div className="min-w-[160px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">Brand</label>
            <Select
              value={filters.brand}
              onValueChange={value => handleFilterChange('brand', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex w-full items-center justify-between">
                      {option.label}
                      {option.count && (
                        <Badge variant="secondary" className="ml-2">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {enabledFilters.includes('region') && (
          <div className="min-w-[160px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">Region</label>
            <Select
              value={filters.region}
              onValueChange={value => handleFilterChange('region', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex w-full items-center justify-between">
                      {option.label}
                      {option.count && (
                        <Badge variant="secondary" className="ml-2">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {Object.entries(filters).map(([key, value]) => {
            if (value === 'all') return null;

            const labelMap: Record<string, string> = {
              category: categories.find(c => c.value === value)?.label || value,
              brand: brands.find(b => b.value === value)?.label || value,
              region: regions.find(r => r.value === value)?.label || value,
              timeRange: timeRanges.find(t => t.value === value)?.label || value,
            };

            return (
              <Badge key={key} variant="default" className="flex items-center gap-1">
                {labelMap[key]}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange(key as keyof FilterState, 'all')}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <Card className={`${sticky ? 'sticky top-4 z-10' : ''} ${className}`}>
        <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer transition-colors hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && <Badge variant="default">{activeFiltersCount}</Badge>}
                </CardTitle>
                <div className="text-xs text-gray-500">{isCollapsed ? 'Show' : 'Hide'}</div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <FilterContent />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  return (
    <Card className={`${sticky ? 'sticky top-4 z-10' : ''} ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && <Badge variant="default">{activeFiltersCount}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FilterContent />
      </CardContent>
    </Card>
  );
}
