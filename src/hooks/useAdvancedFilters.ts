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
    is_tbwa: boolean;
    count?: number;
  }>;
  locations: Array<{ value: string; label: string }>;
  tbwa_stats: {
    total_brands: number;
    tbwa_brands: number;
    competitor_brands: number;
  };
}

export interface FilterState {
  categories: string[];
  brands: string[];
  locations: string[];
  tbwa_only: boolean | null; // null = all, true = TBWA only, false = competitors only
}

export interface ValidationResult {
  is_valid: boolean;
  transaction_count: number;
  estimated: boolean;
}

export interface MarketShare {
  tbwa_revenue: number;
  competitor_revenue: number;
  total_revenue: number;
  tbwa_share: number;
}

export interface BrandAnalysis {
  brands: Array<{
    id: number;
    name: string;
    category: string;
    is_tbwa: boolean;
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
    tbwa_only: null
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
    if (filters.categories.length > 0 || filters.brands.length > 0 || filters.tbwa_only !== null) {
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

      // Get brands with TBWA status
      const { data: allBrands } = await supabase
        .from('brands')
        .select('id, name, category, is_tbwa')
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
          count: allBrands?.filter(b => b.category === cat).length || 0
        })),
        brands: allBrands?.map(brand => ({
          value: brand.id.toString(),
          label: brand.name,
          category: brand.category,
          is_tbwa: brand.is_tbwa || false
        })) || [],
        locations: locations.map(loc => ({
          value: loc,
          label: loc
        })),
        tbwa_stats: {
          total_brands: allBrands?.length || 0,
          tbwa_brands: allBrands?.filter(b => b.is_tbwa === true).length || 0,
          competitor_brands: allBrands?.filter(b => b.is_tbwa === false).length || 0
        }
      };

      setFilterOptions(options);
    } catch (error) {
      console.error('Error loading filter options:', error);
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
        .select(`
          id,
          transaction_items(
            products(
              brands(category, is_tbwa)
            )
          )
        `)
        .limit(sampleSize);

      let matchingCount = 0;
      sampleTransactions?.forEach(transaction => {
        const items = transaction.transaction_items || [];
        
        // Check category filter
        const matchesCategory = filters.categories.length === 0 || 
          items.some(item => 
            filters.categories.includes(item.products?.brands?.category)
          );

        // Check TBWA filter
        const matchesTBWA = filters.tbwa_only === null ||
          items.some(item => 
            item.products?.brands?.is_tbwa === filters.tbwa_only
          );

        if (matchesCategory && matchesTBWA) {
          matchingCount++;
        }
      });

      const estimatedTotal = Math.round((matchingCount / sampleSize) * 18000);
      const isValid = matchingCount > 0;

      setIsValid(isValid);
      setEstimatedResults(estimatedTotal);
    } catch (error) {
      console.error('Error validating filters:', error);
      setIsValid(true); // Fail gracefully
    }
  };

  const getBrandAnalysis = useCallback(async (
    category?: string, 
    tbwaOnly?: boolean
  ): Promise<BrandAnalysis | null> => {
    try {
      const { data, error } = await supabase.rpc('get_brand_analysis_for_filters', {
        p_category: category || null,
        p_tbwa_only: tbwaOnly ?? null
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting brand analysis:', error);
      return null;
    }
  }, []);

  const getMarketShare = useCallback(async (): Promise<MarketShare | null> => {
    try {
      const [tbwaData, compData] = await Promise.all([
        supabase.rpc('get_brand_analysis_for_filters', { p_tbwa_only: true }),
        supabase.rpc('get_brand_analysis_for_filters', { p_tbwa_only: false })
      ]);

      if (tbwaData.error || compData.error) {
        throw new Error('Error fetching market share data');
      }

      const tbwaRevenue = tbwaData.data?.summary?.total_revenue || 0;
      const compRevenue = compData.data?.summary?.total_revenue || 0;
      const totalRevenue = tbwaRevenue + compRevenue;

      return {
        tbwa_revenue: tbwaRevenue,
        competitor_revenue: compRevenue,
        total_revenue: totalRevenue,
        tbwa_share: totalRevenue > 0 ? (tbwaRevenue / totalRevenue * 100) : 0
      };
    } catch (error) {
      console.error('Error getting market share:', error);
      return null;
    }
  }, []);

  const getCategoryPerformance = useCallback(async () => {
    if (!filterOptions) return [];

    try {
      const categoryData = await Promise.all(
        filterOptions.categories.map(async (category) => {
          const [tbwaData, compData] = await Promise.all([
            getBrandAnalysis(category.value, true),
            getBrandAnalysis(category.value, false)
          ]);

          const tbwaRevenue = tbwaData?.summary?.total_revenue || 0;
          const compRevenue = compData?.summary?.total_revenue || 0;
          const totalRevenue = tbwaRevenue + compRevenue;

          return {
            category: category.value,
            tbwa_revenue: tbwaRevenue,
            competitor_revenue: compRevenue,
            total_revenue: totalRevenue,
            tbwa_share: totalRevenue > 0 ? (tbwaRevenue / totalRevenue * 100) : 0,
            tbwa_brands: tbwaData?.summary?.total_brands || 0,
            competitor_brands: compData?.summary?.total_brands || 0
          };
        })
      );

      return categoryData.sort((a, b) => b.total_revenue - a.total_revenue);
    } catch (error) {
      console.error('Error getting category performance:', error);
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
      tbwa_only: null
    });
  }, []);

  const getAvailableBrands = useCallback((selectedCategories?: string[]) => {
    if (!filterOptions) return [];

    const categoriesToFilter = selectedCategories || filters.categories;
    
    if (categoriesToFilter.length === 0) {
      return filterOptions.brands;
    }

    return filterOptions.brands.filter(brand => 
      categoriesToFilter.includes(brand.category)
    );
  }, [filterOptions, filters.categories]);

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
    setTBWAOnly: (value: boolean | null) => updateFilter('tbwa_only', value),
    addCategory: (category: string) => {
      if (!filters.categories.includes(category)) {
        updateFilter('categories', [...filters.categories, category]);
      }
    },
    removeCategory: (category: string) => {
      updateFilter('categories', filters.categories.filter(c => c !== category));
    }
  };
};