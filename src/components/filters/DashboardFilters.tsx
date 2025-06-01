import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FilterWidget } from './FilterWidget';
import { useFilters } from '@/hooks/useFilterState';
import { Button } from '@/components/ui/button';
import { RefreshCw, Filter, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

interface DashboardFiltersProps {
  onFiltersChange?: (filters: Record<string, string[]>) => void;
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
}

export function DashboardFilters({ onFiltersChange, onDateRangeChange }: DashboardFiltersProps) {
  // Initialize filters with URL/localStorage persistence
  const { filters, clearAllFilters, hasActiveFilters } = useFilters({
    brands: { defaultValue: [] },
    categories: { defaultValue: [] },
    regions: { defaultValue: [] },
    stores: { defaultValue: [] },
  });

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  // Fetch filter options from database
  const { data: brandOptions = [], isLoading: brandsLoading } = useQuery({
    queryKey: ['filter-brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brands').select('id, name').order('name');

      if (error) throw error;

      return data.map(brand => ({
        value: brand.id.toString(),
        label: brand.name,
      }));
    },
  });

  const { data: categoryOptions = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['filter-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('category')
        .not('category', 'is', null)
        .order('category');

      if (error) throw error;

      // Get unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category))];

      return uniqueCategories.map(category => ({
        value: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
      }));
    },
  });

  const { data: regionOptions = [], isLoading: regionsLoading } = useQuery({
    queryKey: ['filter-regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('region')
        .not('region', 'is', null)
        .order('region');

      if (error) throw error;

      // Get unique regions
      const uniqueRegions = [...new Set(data.map(item => item.region))];

      return uniqueRegions.map(region => ({
        value: region,
        label: region,
      }));
    },
  });

  const { data: storeOptions = [], isLoading: storesLoading } = useQuery({
    queryKey: ['filter-stores'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stores').select('id, name, city').order('name');

      if (error) throw error;

      return data.map(store => ({
        value: store.id.toString(),
        label: `${store.name} (${store.city})`,
      }));
    },
  });

  // Handle date range change
  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
    if (onDateRangeChange) {
      onDateRangeChange(newDateRange);
    }
  };

  // Notify parent of filter changes
  useEffect(() => {
    if (onFiltersChange) {
      const filterValues = {
        brands: filters.brands.debouncedValue,
        categories: filters.categories.debouncedValue,
        regions: filters.regions.debouncedValue,
        stores: filters.stores.debouncedValue,
      };
      onFiltersChange(filterValues);
    }
  }, [
    filters.brands.debouncedValue,
    filters.categories.debouncedValue,
    filters.regions.debouncedValue,
    filters.stores.debouncedValue,
    onFiltersChange,
  ]);

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <h3 className="flex items-center gap-2 text-base font-semibold sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Filters
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <DatePickerWithRange date={dateRange} onDateChange={handleDateRangeChange} />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs">
                <RefreshCw className="mr-1 h-3 w-3" />
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <FilterWidget
            title="Brands"
            options={brandOptions}
            selectedValues={filters.brands.value}
            onSelectionChange={filters.brands.setValue}
            placeholder="All brands"
            searchPlaceholder="Search brands..."
            loading={brandsLoading}
          />

          <FilterWidget
            title="Categories"
            options={categoryOptions}
            selectedValues={filters.categories.value}
            onSelectionChange={filters.categories.setValue}
            placeholder="All categories"
            searchPlaceholder="Search categories..."
            loading={categoriesLoading}
          />

          <FilterWidget
            title="Regions"
            options={regionOptions}
            selectedValues={filters.regions.value}
            onSelectionChange={filters.regions.setValue}
            placeholder="All regions"
            searchPlaceholder="Search regions..."
            loading={regionsLoading}
          />

          <FilterWidget
            title="Stores"
            options={storeOptions}
            selectedValues={filters.stores.value}
            onSelectionChange={filters.stores.setValue}
            placeholder="All stores"
            searchPlaceholder="Search stores..."
            loading={storesLoading}
          />
        </div>
      </div>
    </div>
  );
}
