import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface FilterOptions {
  categories: Array<{ value: string; label: string; count: number }>;
  brands: Array<{
    value: string;
    label: string;
    category: string;
    is_client: boolean;
    count?: number;
  }>;
  locations: Array<{ value: string; label: string }>;
  client_stats: {
    total_brands: number;
    client_brands: number;
    competitor_brands: number;
  };
}

export interface FilterState {
  categories: string[];
  brands: string[];
  locations: string[];
  client_only: boolean | null; // null = all, true = Client only, false = competitors only
}

export interface ValidationResult {
  is_valid: boolean;
  transaction_count: number;
  estimated: boolean;
}

export interface MarketShare {
  client_revenue: number;
  competitor_revenue: number;
  total_revenue: number;
  client_share: number;
}

export interface BrandAnalysis {
  brands: Array<{
    id: number;
    name: string;
    category: string;
    is_client: boolean;
    metrics: {
      transactions: number;
      items: number;
      revenue: number;
      products: number;
    };
  }>;
  summary: {
    total_brands: number;
    total_revenue: number;
    total_transactions: number;
    avg_revenue_per_brand: number;
    top_brand: string;
  };
}

export const useAdvancedFilters = () => {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    brands: [],
    locations: [],
    client_only: null,
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [estimatedResults, setEstimatedResults] = useState<number>(0);

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Validate filters when they change
  useEffect(() => {
    if (filters.categories.length > 0 || filters.brands.length > 0 || filters.client_only !== null) {
      validateFilters();
    } else {
      setIsValid(true);
      setEstimatedResults(18000); // Total transactions
    }
  }, [filters]);

  const loadFilterOptions = async () => {
    setIsLoading(true);
    try {
      // Get categories
      const { data: brandCategories } = await supabase
        .from('brands')
        .select('category')
        .not('category', 'is', null);

      const categories = [...new Set(brandCategories?.map(b => b.category) || [])];

      // Get brands with Client status
      const { data: allBrands } = await supabase
        .from('brands')
        .select('id, name, category, is_client')
        .not('name', 'is', null)
        .order('name');

      // Get locations
      const { data: allStores } = await supabase
        .from('stores')
        .select('location')
        .not('location', 'is', null);

      const locations = [...new Set(allStores?.map(s => s.location) || [])];

      const options: FilterOptions = {
        categories: categories.map(cat => ({
          value: cat,
          label: cat,
          count: allBrands?.filter(b => b.category === cat).length || 0,
        })),
        brands:
          allBrands?.map(brand => ({
            value: brand.id.toString(),
            label: brand.name,
            category: brand.category,
            is_client: brand.is_client || false,
          })) || [],
        locations: locations.map(loc => ({
          value: loc,
          label: loc,
        })),
        client_stats: {
          total_brands: allBrands?.length || 0,
          client_brands: allBrands?.filter(b => b.is_client === true).length || 0,
          competitor_brands: allBrands?.filter(b => b.is_client === false).length || 0,
        },
      };

      setFilterOptions(options);
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  const validateFilters = async () => {
    try {
      // Sample-based validation for performance
      const sampleSize = 100;
      const { data: sampleTransactions } = await supabase
        .from('transactions')
        .select(
          `
          id,
          transaction_items(
            products(
              brands(category, is_client)
            )
          )
        `
        )
        .limit(sampleSize);

      let matchingCount = 0;
      sampleTransactions?.forEach(transaction => {
        const items = transaction.transaction_items || [];

        // Check category filter
        const matchesCategory =
          filters.categories.length === 0 ||
          items.some(item => filters.categories.includes(item.products?.brands?.category));

        // Check Client filter
        const matchesClient =
          filters.client_only === null ||
          items.some(item => item.products?.brands?.is_client === filters.client_only);

        if (matchesCategory && matchesClient) {
          matchingCount++;
        }
      });

      const estimatedTotal = Math.round((matchingCount / sampleSize) * 18000);
      const isValid = matchingCount > 0;

      setIsValid(isValid);
      setEstimatedResults(estimatedTotal);
    } catch (error) {
      setIsValid(true); // Fail gracefully
    }
  };

  const getBrandAnalysis = useCallback(
    async (category?: string, clientOnly?: boolean): Promise<BrandAnalysis | null> => {
      try {
        const { data, error } = await supabase.rpc('get_brand_analysis_for_filters', {
          p_category: category || null,
          p_client_only: clientOnly ?? null,
        });

        if (error) throw error;
        return data;
      } catch (error) {
        return null;
      }
    },
    []
  );

  const getMarketShare = useCallback(async (): Promise<MarketShare | null> => {
    try {
      const [clientData, compData] = await Promise.all([
        supabase.rpc('get_brand_analysis_for_filters', { p_client_only: true }),
        supabase.rpc('get_brand_analysis_for_filters', { p_client_only: false }),
      ]);

      if (clientData.error || compData.error) {
        throw new Error('Error fetching market share data');
      }

      const clientRevenue = clientData.data?.summary?.total_revenue || 0;
      const compRevenue = compData.data?.summary?.total_revenue || 0;
      const totalRevenue = clientRevenue + compRevenue;

      return {
        client_revenue: clientRevenue,
        competitor_revenue: compRevenue,
        total_revenue: totalRevenue,
        client_share: totalRevenue > 0 ? (clientRevenue / totalRevenue) * 100 : 0,
      };
    } catch (error) {
      return null;
    }
  }, []);

  const getCategoryPerformance = useCallback(async () => {
    if (!filterOptions) return [];

    try {
      const categoryData = await Promise.all(
        filterOptions.categories.map(async category => {
          const [clientData, compData] = await Promise.all([
            getBrandAnalysis(category.value, true),
            getBrandAnalysis(category.value, false),
          ]);

          const clientRevenue = clientData?.summary?.total_revenue || 0;
          const compRevenue = compData?.summary?.total_revenue || 0;
          const totalRevenue = clientRevenue + compRevenue;

          return {
            category: category.value,
            client_revenue: clientRevenue,
            competitor_revenue: compRevenue,
            total_revenue: totalRevenue,
            client_share: totalRevenue > 0 ? (clientRevenue / totalRevenue) * 100 : 0,
            client_brands: clientData?.summary?.total_brands || 0,
            competitor_brands: compData?.summary?.total_brands || 0,
          };
        })
      );

      return categoryData.sort((a, b) => b.total_revenue - a.total_revenue);
    } catch (error) {
      return [];
    }
  }, [filterOptions, getBrandAnalysis]);

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      categories: [],
      brands: [],
      locations: [],
      client_only: null,
    });
  }, []);

  const getAvailableBrands = useCallback(
    (selectedCategories?: string[]) => {
      if (!filterOptions) return [];

      const categoriesToFilter = selectedCategories || filters.categories;

      if (categoriesToFilter.length === 0) {
        return filterOptions.brands;
      }

      return filterOptions.brands.filter(brand => categoriesToFilter.includes(brand.category));
    },
    [filterOptions, filters.categories]
  );

  return {
    // State
    filters,
    filterOptions,
    isLoading,
    isValid,
    estimatedResults,

    // Actions
    updateFilter,
    clearFilters,
    loadFilterOptions,

    // Data functions
    getBrandAnalysis,
    getMarketShare,
    getCategoryPerformance,
    getAvailableBrands,

    // Helper functions
    setClientOnly: (value: boolean | null) => updateFilter('client_only', value),
    addCategory: (category: string) => {
      if (!filters.categories.includes(category)) {
        updateFilter('categories', [...filters.categories, category]);
      }
    },
    removeCategory: (category: string) => {
      updateFilter(
        'categories',
        filters.categories.filter(c => c !== category)
      );
    },
  };
};
