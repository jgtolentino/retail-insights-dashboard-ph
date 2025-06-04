import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, RefreshCw } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';

const FilterBar = () => {
  const {
    selectedCategories,
    selectedBrands,
    selectedRegions,
    selectedStores,
    dateRange,
    setSelectedCategories,
    setSelectedBrands,
    setSelectedRegions,
    setSelectedStores,
    setDateRange,
    resetAllFilters,
  } = useFilters();

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    setDateRange({
      ...dateRange,
      [type]: value,
    });
  };

  const removeBrand = (brandToRemove: string) => {
    setSelectedBrands(selectedBrands.filter(brand => brand !== brandToRemove));
  };

  const removeCategory = (categoryToRemove: string) => {
    setSelectedCategories(selectedCategories.filter(cat => cat !== categoryToRemove));
  };

  const removeRegion = (regionToRemove: string) => {
    setSelectedRegions(selectedRegions.filter(region => region !== regionToRemove));
  };

  const removeStore = (storeToRemove: string) => {
    setSelectedStores(selectedStores.filter(store => store !== storeToRemove));
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    selectedRegions.length > 0 ||
    selectedStores.length > 0 ||
    dateRange.start ||
    dateRange.end;

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
            onClick={resetAllFilters}
            className="text-red-600 hover:text-red-700"
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Reset All
          </Button>
        </div>

        <div className="space-y-3">
          {/* Date Range */}
          {(dateRange.start || dateRange.end) && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Badge variant="secondary" className="gap-1">
                {dateRange.start} to {dateRange.end}
                <button
                  onClick={() => setDateRange({ start: '', end: '' })}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}

          {/* Selected Brands */}
          {selectedBrands.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Brands:</span>
              {selectedBrands.map(brand => (
                <Badge key={brand} variant="outline" className="gap-1">
                  {brand}
                  <button onClick={() => removeBrand(brand)} className="ml-1 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Selected Categories */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Categories:</span>
              {selectedCategories.map(category => (
                <Badge key={category} variant="outline" className="gap-1">
                  {category}
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
          {selectedRegions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Regions:</span>
              {selectedRegions.map(region => (
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
          {selectedStores.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Stores:</span>
              {selectedStores.map(store => (
                <Badge key={store} variant="outline" className="gap-1">
                  {store}
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
