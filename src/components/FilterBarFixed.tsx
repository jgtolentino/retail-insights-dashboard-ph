import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Filter, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useFilterStore, loadFiltersFromURL, persistFiltersToURL } from '@/stores/filterStore';
import { getFilterOptions } from '@/lib/filterQueryHelper';
import MultiSelect from './MultiSelect';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

interface FilterBarProps {
  className?: string;
  compact?: boolean;
  sticky?: boolean;
}

export default function FilterBarFixed({ 
  className = '', 
  compact = false, 
  sticky = true 
}: FilterBarProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use the store directly instead of selectors to avoid re-render loops
  const dateRange = useFilterStore(state => state.dateRange);
  const selectedBrands = useFilterStore(state => state.selectedBrands);
  const selectedCategories = useFilterStore(state => state.selectedCategories);
  const selectedRegions = useFilterStore(state => state.selectedRegions);
  const selectedStores = useFilterStore(state => state.selectedStores);
  
  const setDateRange = useFilterStore(state => state.setDateRange);
  const setSelectedBrands = useFilterStore(state => state.setSelectedBrands);
  const setSelectedCategories = useFilterStore(state => state.setSelectedCategories);
  const setSelectedRegions = useFilterStore(state => state.setSelectedRegions);
  const setSelectedStores = useFilterStore(state => state.setSelectedStores);
  const resetAllFilters = useFilterStore(state => state.resetAllFilters);

  // Calculate active filters count
  const activeFiltersCount = [
    selectedBrands.length > 0,
    selectedCategories.length > 0,
    selectedRegions.length > 0,
    selectedStores.length > 0,
    dateRange.start && dateRange.end
  ].filter(Boolean).length;

  // Build filter summary
  const filterSummary: string[] = [];
  if (dateRange.start && dateRange.end) {
    filterSummary.push(`Date: ${dateRange.start} to ${dateRange.end}`);
  }
  if (selectedBrands.length > 0) {
    filterSummary.push(`${selectedBrands.length} brands`);
  }
  if (selectedCategories.length > 0) {
    filterSummary.push(`${selectedCategories.length} categories`);
  }
  if (selectedRegions.length > 0) {
    filterSummary.push(`${selectedRegions.length} regions`);
  }
  if (selectedStores.length > 0) {
    filterSummary.push(`${selectedStores.length} stores`);
  }

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
  }, [dateRange, selectedBrands, selectedCategories, selectedRegions, selectedStores, isInitialized]);

  // Fetch filter options
  const { data: filterOptions, isLoading: optionsLoading } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: getFilterOptions,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Handle date range change
  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    if (dateRange?.from && dateRange?.to) {
      setDateRange({
        start: dateRange.from.toISOString().split('T')[0],
        end: dateRange.to.toISOString().split('T')[0],
      });
    } else {
      setDateRange({
        start: null,
        end: null,
      });
    }
  };

  // Convert date strings back to DateRange for the picker
  const getDateRange = (): DateRange | undefined => {
    if (dateRange.start && dateRange.end) {
      return {
        from: new Date(dateRange.start),
        to: new Date(dateRange.end),
      };
    }
    return undefined;
  };

  const handleReset = () => {
    resetAllFilters();
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
          value={selectedBrands}
          onChange={setSelectedBrands}
          placeholder="All Brands"
          searchPlaceholder="Search brands..."
          disabled={optionsLoading}
        />

        <MultiSelect
          label="Categories"
          options={filterOptions?.categoryOptions || []}
          value={selectedCategories}
          onChange={setSelectedCategories}
          placeholder="All Categories"
          searchPlaceholder="Search categories..."
          disabled={optionsLoading}
        />

        <MultiSelect
          label="Regions"
          options={filterOptions?.regionOptions || []}
          value={selectedRegions}
          onChange={setSelectedRegions}
          placeholder="All Regions"
          searchPlaceholder="Search regions..."
          disabled={optionsLoading}
        />

        <MultiSelect
          label="Stores"
          options={filterOptions?.storeOptions || []}
          value={selectedStores}
          onChange={setSelectedStores}
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