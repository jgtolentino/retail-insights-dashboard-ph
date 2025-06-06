import { safe } from '@/utils/safe';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, RefreshCw, Calendar } from 'lucide-react';
import { useFilters, useFilterActions } from '@/stores/dashboardStore';

const FilterBarFixed = () => {
  const filters = useFilters();
  const { updateFilters, resetFilters } = useFilterActions();

  const removeItem = (type: 'categories' | 'brands' | 'regions' | 'stores', item: string) => {
    switch (type) {
      case 'categories':
        updateFilters({ categories: filters.categories.filter(cat => cat !== item) });
        break;
      case 'brands':
        updateFilters({ brands: filters.brands.filter(brand => brand !== item) });
        break;
      case 'regions':
        updateFilters({ regions: filters.regions.filter(region => region !== item) });
        break;
      case 'stores':
        updateFilters({ stores: filters.stores.filter(store => store !== item) });
        break;
    }
  };

  const clearDateRange = () => {
    updateFilters({ dateRange: { from: null, to: null } });
  };

  const hasFilters =
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.regions.length > 0 ||
    filters.stores.length > 0 ||
    (filters.dateRange.from && filters.dateRange.to);

  if (!hasFilters) {
    return null;
  }

  const filterSummary = `${filters.categories.length + filters.brands.length + filters.regions.length + filters.stores.length} filters`;
  const dateRangeText =
    filters.dateRange.from && filters.dateRange.to
      ? `${filters.dateRange.from.toDateString()} to ${filters.dateRange.to.toDateString()}`
      : '';

  return (
    <Card className="sticky top-0 z-10 mb-4 border-blue-200 bg-blue-50/50">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-900">
              Active: {filterSummary}
              {dateRangeText && (
                <span className="ml-2 text-blue-700">
                  <Calendar className="mr-1 inline h-3 w-3" />
                  {dateRangeText}
                </span>
              )}
            </span>

            <div className="flex flex-wrap gap-1">
              {filters.categories.map(category => (
                <Badge key={category} variant="secondary" className="gap-1 text-xs">
                  Cat: {safe(category)}
                  <button onClick={() => removeItem('categories', category)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              {filters.brands.map(brand => (
                <Badge key={brand} variant="secondary" className="gap-1 text-xs">
                  Brand: {safe(brand)}
                  <button onClick={() => removeItem('brands', brand)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              {filters.regions.map(region => (
                <Badge key={region} variant="secondary" className="gap-1 text-xs">
                  Region: {region}
                  <button onClick={() => removeItem('regions', region)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              {filters.stores.map(store => (
                <Badge key={store} variant="secondary" className="gap-1 text-xs">
                  Store: {safe(store)}
                  <button onClick={() => removeItem('stores', store)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              {dateRangeText && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  Date Range
                  <button onClick={clearDateRange}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="border-blue-300 text-blue-700 hover:text-blue-800"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterBarFixed;
