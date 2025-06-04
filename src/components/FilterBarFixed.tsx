import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, RefreshCw, Calendar } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';

const FilterBarFixed = () => {
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

  const removeItem = (type: 'categories' | 'brands' | 'regions' | 'stores', item: string) => {
    switch (type) {
      case 'categories':
        setSelectedCategories(selectedCategories.filter(cat => cat !== item));
        break;
      case 'brands':
        setSelectedBrands(selectedBrands.filter(brand => brand !== item));
        break;
      case 'regions':
        setSelectedRegions(selectedRegions.filter(region => region !== item));
        break;
      case 'stores':
        setSelectedStores(selectedStores.filter(store => store !== item));
        break;
    }
  };

  const clearDateRange = () => {
    setDateRange({ start: '', end: '' });
  };

  const hasFilters =
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    selectedRegions.length > 0 ||
    selectedStores.length > 0 ||
    (dateRange.start && dateRange.end);

  if (!hasFilters) {
    return null;
  }

  const filterSummary = `${selectedCategories.length + selectedBrands.length + selectedRegions.length + selectedStores.length} filters`;
  const dateRangeText =
    dateRange.start && dateRange.end ? `${dateRange.start} to ${dateRange.end}` : '';

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
              {selectedCategories.map(category => (
                <Badge key={category} variant="secondary" className="gap-1 text-xs">
                  Cat: {category}
                  <button onClick={() => removeItem('categories', category)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              {selectedBrands.map(brand => (
                <Badge key={brand} variant="secondary" className="gap-1 text-xs">
                  Brand: {brand}
                  <button onClick={() => removeItem('brands', brand)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              {selectedRegions.map(region => (
                <Badge key={region} variant="secondary" className="gap-1 text-xs">
                  Region: {region}
                  <button onClick={() => removeItem('regions', region)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              {selectedStores.map(store => (
                <Badge key={store} variant="secondary" className="gap-1 text-xs">
                  Store: {store}
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
            onClick={resetAllFilters}
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
