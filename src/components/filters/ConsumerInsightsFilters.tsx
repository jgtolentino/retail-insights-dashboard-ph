import { useEffect } from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterWidget } from './FilterWidget';
import { useFilterState } from '@/hooks/useFilterState';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AGE_GROUP_OPTIONS,
  GENDER_OPTIONS,
  LOCATION_OPTIONS,
  INCOME_RANGE_OPTIONS,
} from '@/types/filters';

interface ConsumerInsightsFiltersProps {
  onFiltersChange?: (filters: Record<string, string[]>) => void;
  className?: string;
}

export function ConsumerInsightsFilters({
  onFiltersChange,
  className,
}: ConsumerInsightsFiltersProps) {
  // Filter states with URL persistence
  const filters = {
    categories: useFilterState({ key: 'ci_categories' }),
    brands: useFilterState({ key: 'ci_brands' }),
    products: useFilterState({ key: 'ci_products' }),
    ageGroups: useFilterState({ key: 'ci_age_groups' }),
    genders: useFilterState({ key: 'ci_genders' }),
    locations: useFilterState({ key: 'ci_locations' }),
    incomeRanges: useFilterState({ key: 'ci_income_ranges' }),
  };

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('brands')
        .select('category')
        .not('category', 'is', null);
      
      const uniqueCategories = [...new Set(data?.map(b => b.category) || [])];
      return uniqueCategories.sort();
    },
  });

  // Fetch brands
  const { data: brandsData, isLoading: brandsLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data } = await supabase
        .from('brands')
        .select('id, name')
        .order('name');
      return data || [];
    },
  });

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name')
        .order('name');
      return data || [];
    },
  });

  // Transform data for FilterWidget
  const categoryOptions = (categoriesData || []).map(cat => ({
    label: cat,
    value: cat,
  }));

  const brandOptions = (brandsData || []).map(brand => ({
    label: brand.name,
    value: brand.id.toString(),
  }));

  const productOptions = (productsData || []).map(product => ({
    label: product.name,
    value: product.id.toString(),
  }));

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    filter => filter.value.length > 0
  );

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
        products: filters.products.debouncedValue,
        ageGroups: filters.ageGroups.debouncedValue,
        genders: filters.genders.debouncedValue,
        locations: filters.locations.debouncedValue,
        incomeRanges: filters.incomeRanges.debouncedValue,
      };
      onFiltersChange(filterValues);
    }
  }, [
    filters.categories.debouncedValue,
    filters.brands.debouncedValue,
    filters.products.debouncedValue,
    filters.ageGroups.debouncedValue,
    filters.genders.debouncedValue,
    filters.locations.debouncedValue,
    filters.incomeRanges.debouncedValue,
    onFiltersChange,
  ]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className || ''}`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
          Consumer Segment Filters
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Product Filters */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Product Filters</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
              title="Products"
              options={productOptions}
              selectedValues={filters.products.value}
              onSelectionChange={filters.products.setValue}
              placeholder="All products"
              searchPlaceholder="Search products..."
              loading={productsLoading}
            />
          </div>
        </div>

        {/* Demographic Filters */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Demographic Filters</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <FilterWidget
              title="Age Groups"
              options={AGE_GROUP_OPTIONS}
              selectedValues={filters.ageGroups.value}
              onSelectionChange={filters.ageGroups.setValue}
              placeholder="All age groups"
              searchPlaceholder="Search age groups..."
            />

            <FilterWidget
              title="Genders"
              options={GENDER_OPTIONS}
              selectedValues={filters.genders.value}
              onSelectionChange={filters.genders.setValue}
              placeholder="All genders"
            />

            <FilterWidget
              title="Locations"
              options={LOCATION_OPTIONS}
              selectedValues={filters.locations.value}
              onSelectionChange={filters.locations.setValue}
              placeholder="All locations"
              searchPlaceholder="Search locations..."
            />

            <FilterWidget
              title="Income Ranges"
              options={INCOME_RANGE_OPTIONS}
              selectedValues={filters.incomeRanges.value}
              onSelectionChange={filters.incomeRanges.setValue}
              placeholder="All income ranges"
            />
          </div>
        </div>
      </div>
    </div>
  );
}