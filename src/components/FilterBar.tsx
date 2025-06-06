import { safe } from '@/utils/safe';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, RefreshCw } from 'lucide-react';
import { useFilters, useFilterActions } from '@/stores/dashboardStore';

const FilterBar = () => {
  const filters = useFilters();
  const { updateFilters, resetFilters } = useFilterActions();

  const handleDateChange = (type: 'from' | 'to', value: Date) => {
    updateFilters({
      dateRange: {
        ...filters.dateRange,
        [type]: value,
      },
    });
  };

  const removeBrand = (brandToRemove: string) => {
    updateFilters({
      brands: filters.brands.filter(brand => brand !== brandToRemove),
    });
  };

  const removeCategory = (categoryToRemove: string) => {
    updateFilters({
      categories: filters.categories.filter(cat => cat !== categoryToRemove),
    });
  };

  const removeRegion = (regionToRemove: string) => {
    updateFilters({
      regions: filters.regions.filter(region => region !== regionToRemove),
    });
  };

  const removeStore = (storeToRemove: string) => {
    updateFilters({
      stores: filters.stores.filter(store => store !== storeToRemove),
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.regions.length > 0 ||
    filters.stores.length > 0 ||
    filters.dateRange.from ||
    filters.dateRange.to;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">Active Filters</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="text-red-600 hover:text-red-700"
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Reset All
          </Button>
        </div>

        <div className="space-y-3">
          {/* Date Range */}
          {(filters.dateRange.from || filters.dateRange.to) && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Badge variant="secondary" className="gap-1">
                {filters.dateRange.from?.toDateString()} to {filters.dateRange.to?.toDateString()}
                <button
                  onClick={() => updateFilters({ dateRange: { from: null, to: null } })}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}

          {/* Selected Brands */}
          {filters.brands.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Brands:</span>
              {filters.brands.map(brand => (
                <Badge key={brand} variant="outline" className="gap-1">
                  {safe(brand)}
                  <button onClick={() => removeBrand(brand)} className="ml-1 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Selected Categories */}
          {filters.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Categories:</span>
              {filters.categories.map(category => (
                <Badge key={category} variant="outline" className="gap-1">
                  {safe(category)}
                  <button
                    onClick={() => removeCategory(category)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Selected Regions */}
          {filters.regions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Regions:</span>
              {filters.regions.map(region => (
                <Badge key={region} variant="outline" className="gap-1">
                  {region}
                  <button onClick={() => removeRegion(region)} className="ml-1 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Selected Stores */}
          {filters.stores.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Stores:</span>
              {filters.stores.map(store => (
                <Badge key={store} variant="outline" className="gap-1">
                  {safe(store)}
                  <button onClick={() => removeStore(store)} className="ml-1 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterBar;
