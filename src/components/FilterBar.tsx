import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Filter, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useFilterStore, useFilterSelectors, loadFiltersFromURL, persistFiltersToURL } from '@/stores/filterStore';
import { getFilterOptions } from '@/lib/filterQueryHelper';
import MultiSelect from './MultiSelect';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

interface FilterBarProps {
  className?: string;
  compact?: boolean;
  sticky?: boolean;
}

export default function FilterBar({ 
  className = '', 
  compact = false, 
  sticky = true 
}: FilterBarProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get filter state and actions
  const filters = useFilterSelectors.allFilters();
  const actions = useFilterSelectors.actions();
  const activeFiltersCount = useFilterSelectors.activeFiltersCount();
  const filterSummary = useFilterSelectors.filterSummary();

  // Load filters from URL on mount
  useEffect(() => {
    if (!isInitialized) {
      loadFiltersFromURL();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Persist filters to URL when they change
  useEffect(() => {
    if (isInitialized) {
      persistFiltersToURL();
    }
  }, [filters, isInitialized]);

  // Fetch filter options
  const { data: filterOptions, isLoading: optionsLoading } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: getFilterOptions,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Handle date range change
  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    if (dateRange?.from && dateRange?.to) {
      actions.setDateRange({
        start: dateRange.from.toISOString().split('T')[0],
        end: dateRange.to.toISOString().split('T')[0],
      });
    } else {
      actions.setDateRange({
        start: null,
        end: null,
      });
    }
  };

  // Convert date strings back to DateRange for the picker
  const getDateRange = (): DateRange | undefined => {
    if (filters.dateRange.start && filters.dateRange.end) {
      return {
        from: new Date(filters.dateRange.start),
        to: new Date(filters.dateRange.end),
      };
    }
    return undefined;
  };

  const handleReset = () => {
    actions.resetAllFilters();
  };

  const FilterContent = () => (
    <div className="space-y-4">
      {/* Date Range */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <DatePickerWithRange
          date={getDateRange()}
          onDateChange={handleDateRangeChange}
        />
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MultiSelect
          label="Brands"
          options={filterOptions?.brandOptions || []}
          value={filters.selectedBrands}
          onChange={actions.setSelectedBrands}
          placeholder="All Brands"
          searchPlaceholder="Search brands..."
          disabled={optionsLoading}
        />

        <MultiSelect
          label="Categories"
          options={filterOptions?.categoryOptions || []}
          value={filters.selectedCategories}
          onChange={actions.setSelectedCategories}
          placeholder="All Categories"
          searchPlaceholder="Search categories..."
          disabled={optionsLoading}
        />

        <MultiSelect
          label="Regions"
          options={filterOptions?.regionOptions || []}
          value={filters.selectedRegions}
          onChange={actions.setSelectedRegions}
          placeholder="All Regions"
          searchPlaceholder="Search regions..."
          disabled={optionsLoading}
        />

        <MultiSelect
          label="Stores"
          options={filterOptions?.storeOptions || []}
          value={filters.selectedStores}
          onChange={actions.setSelectedStores}
          placeholder="All Stores"
          searchPlaceholder="Search stores..."
          disabled={optionsLoading}
        />
      </div>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t">
          <span className="text-sm text-gray-600">Active filters:</span>
          <div className="flex flex-wrap gap-1">
            {filterSummary.map((summary, index) => (
              <Badge key={index} variant="default" className="text-xs">
                {summary}
              </Badge>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="ml-auto text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset All
          </Button>
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <Card className={`${sticky ? 'sticky top-4 z-10' : ''} ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="default">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FilterContent />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${sticky ? 'sticky top-4 z-10' : ''} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="default">{activeFiltersCount}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FilterContent />
      </CardContent>
    </Card>
  );
}