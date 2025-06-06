import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

const supabaseClient = createClient(
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

export interface AdvancedFilter {
  field: string;
  operator: string;
  value: any;
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
      const { data: brandCategories } = await supabaseClient
        .from('brands')
        .select('category')
        .not('category', 'is', null);

      const categories = [...new Set(brandCategories?.map(b => b.category) || [])];

      // Get brands with Client status
      const { data: allBrands } = await supabaseClient
        .from('brands')
        .select('id, name, category, is_client')
        .not('name', 'is', null)
        .order('name');

      // Get locations
      const { data: allStores } = await supabaseClient
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
      let query = supabase.from('transactions').select('id');

      filters.categories.forEach(category => {
        query = query.eq('transaction_items.products.brands.category', category);
      });

      if (filters.client_only !== null) {
        query = query.eq('transaction_items.products.brands.is_client', filters.client_only);
      }

      const { count, error } = await query.count();

      if (error) {
        logger.error('Error applying advanced filters:', error);
        setIsValid(false);
        setEstimatedResults(0);
        return;
      }

      setIsValid(true);
      setEstimatedResults(count || 0);
    } catch (error) {
      setIsValid(false);
      setEstimatedResults(0);
    }
  };

  const getBrandAnalysis = useCallback(
    async (category?: string, clientOnly?: boolean): Promise<BrandAnalysis | null> => {
      try {
        const { data, error } = await supabaseClient.rpc('get_brand_analysis_for_filters', {
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
        supabaseClient.rpc('get_brand_analysis_for_filters', { p_client_only: true }),
        supabaseClient.rpc('get_brand_analysis_for_filters', { p_client_only: false }),
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

export async function useAdvancedFilters(filters: AdvancedFilter[]): Promise<number> {
  try {
    let query = supabase.from('transactions').select('id');

    filters.forEach(filter => {
      switch (filter.operator) {
        case 'eq':
          query = query.eq(filter.field, filter.value);
          break;
        case 'neq':
          query = query.neq(filter.field, filter.value);
          break;
        case 'gt':
          query = query.gt(filter.field, filter.value);
          break;
        case 'gte':
          query = query.gte(filter.field, filter.value);
          break;
        case 'lt':
          query = query.lt(filter.field, filter.value);
          break;
        case 'lte':
          query = query.lte(filter.field, filter.value);
          break;
        case 'like':
          query = query.like(filter.field, `%${filter.value}%`);
          break;
        case 'ilike':
          query = query.ilike(filter.field, `%${filter.value}%`);
          break;
        case 'in':
          query = query.in(filter.field, filter.value);
          break;
        default:
          logger.warn(`Unknown operator: ${filter.operator}`);
      }
    });

    const { count, error } = await query.count();

    if (error) {
      logger.error('Error applying advanced filters:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error('Error in useAdvancedFilters:', error);
    return 0;
  }
}
