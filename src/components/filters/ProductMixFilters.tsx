import { useEffect } from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterWidget } from './FilterWidget';
import { useFilterState } from '@/hooks/useFilterState';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProductMixFiltersProps {
  onFiltersChange?: (filters: Record<string, string[]>) => void;
  className?: string;
}

export function ProductMixFilters({ onFiltersChange, className }: ProductMixFiltersProps) {
  // Filter states with URL persistence
  const filters = {
    categories: useFilterState({ key: 'pm_categories' }),
    brands: useFilterState({ key: 'pm_brands' }),
    stores: useFilterState({ key: 'pm_stores' }),
    priceRanges: useFilterState({ key: 'pm_price_ranges' }),
  };

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('brands').select('category').not('category', 'is', null);

      const uniqueCategories = [...new Set(data?.map(b => b.category) || [])];
      return uniqueCategories.sort();
    },
  });

  // Fetch brands
  const { data: brandsData, isLoading: brandsLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data } = await supabase.from('brands').select('id, name').order('name');
      return data || [];
    },
  });

  // Fetch stores
  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ['stores-locations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('store_location')
        .not('store_location', 'is', null);

      const uniqueStores = [...new Set(data?.map(t => t.store_location) || [])];
      return uniqueStores.sort();
    },
  });

  // Define price ranges
  const priceRangeOptions = [
    { label: 'Under ₱50', value: '0-50' },
    { label: '₱50 - ₱100', value: '50-100' },
    { label: '₱100 - ₱200', value: '100-200' },
    { label: '₱200 - ₱500', value: '200-500' },
    { label: 'Over ₱500', value: '500+' },
  ];

  // Transform data for FilterWidget
  const categoryOptions = (categoriesData || []).map(cat => ({
    label: cat,
    value: cat,
  }));

  const brandOptions = (brandsData || []).map(brand => ({
    label: brand.name,
    value: brand.id.toString(),
  }));

  const storeOptions = (storesData || []).map(store => ({
    label: store,
    value: store,
  }));

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(filter => filter.value.length > 0);

  // Clear all filters
  const clearAllFilters = () => {
    Object.values(filters).forEach(filter => filter.setValue([]));
  };

  // Update parent component when filters change
  useEffect(() => {
    if (onFiltersChange) {
      const filterValues = {
        categories: filters.categories.debouncedValue,
        brands: filters.brands.debouncedValue,
        stores: filters.stores.debouncedValue,
        priceRanges: filters.priceRanges.debouncedValue,
      };
      onFiltersChange(filterValues);
    }
  }, [
    filters.categories.debouncedValue,
    filters.brands.debouncedValue,
    filters.stores.debouncedValue,
    filters.priceRanges.debouncedValue,
    onFiltersChange,
  ]);

  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm ${className || ''}`}>
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <h3 className="flex items-center gap-2 text-base font-semibold sm:text-lg">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
          Product Mix Filters
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs">
            <RefreshCw className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
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
          title="Brands"
          options={brandOptions}
          selectedValues={filters.brands.value}
          onSelectionChange={filters.brands.setValue}
          placeholder="All brands"
          searchPlaceholder="Search brands..."
          loading={brandsLoading}
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

        <FilterWidget
          title="Price Ranges"
          options={priceRangeOptions}
          selectedValues={filters.priceRanges.value}
          onSelectionChange={filters.priceRanges.setValue}
          placeholder="All price ranges"
        />
      </div>
    </div>
  );
}
