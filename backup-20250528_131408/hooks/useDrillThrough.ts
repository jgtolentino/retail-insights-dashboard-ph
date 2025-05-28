import { useNavigate } from 'react-router-dom';
import { useEnhancedFilters } from '@/contexts/EnhancedFilterContext';
import { useCallback } from 'react';

/**
 * Custom hook for consistent drill-through navigation patterns
 * Provides standardized methods for navigating between dashboard pages with filters
 */
export const useDrillThrough = () => {
  const navigate = useNavigate();
  const { setFilters } = useEnhancedFilters();

  /**
   * Navigate to Consumer Insights with demographic filters
   */
  const drillToConsumerInsights = useCallback((filters: {
    ageGroups?: string[];
    genders?: string[];
    locations?: string[];
    categories?: string[];
    brands?: string[];
  }) => {
    setFilters(prev => ({
      ...prev,
      ...filters
    }));
    navigate('/consumer-insights');
  }, [setFilters, navigate]);

  /**
   * Navigate to Product Mix with product/brand filters
   */
  const drillToProductMix = useCallback((filters: {
    brands?: string[];
    categories?: string[];
    locations?: string[];
  }) => {
    setFilters(prev => ({
      ...prev,
      ...filters
    }));
    navigate('/product-mix');
  }, [setFilters, navigate]);

  /**
   * Navigate to main dashboard with applied filters
   */
  const drillToDashboard = useCallback((filters: {
    dateRange?: { start: string; end: string };
    locations?: string[];
  }) => {
    setFilters(prev => ({
      ...prev,
      ...filters
    }));
    navigate('/');
  }, [setFilters, navigate]);

  /**
   * Age Distribution chart drill-through
   */
  const drillThroughAge = useCallback((ageGroup: string) => {
    drillToConsumerInsights({ ageGroups: [ageGroup] });
  }, [drillToConsumerInsights]);

  /**
   * Gender Distribution chart drill-through
   */
  const drillThroughGender = useCallback((gender: string) => {
    drillToConsumerInsights({ genders: [gender] });
  }, [drillToConsumerInsights]);

  /**
   * Location Distribution chart drill-through
   */
  const drillThroughLocation = useCallback((location: string) => {
    drillToConsumerInsights({ locations: [location] });
  }, [drillToConsumerInsights]);

  /**
   * Brand Performance chart drill-through
   */
  const drillThroughBrand = useCallback((brand: string) => {
    drillToProductMix({ brands: [brand] });
  }, [drillToProductMix]);

  /**
   * Category drill-through
   */
  const drillThroughCategory = useCallback((category: string, targetPage: 'consumer-insights' | 'product-mix' = 'product-mix') => {
    if (targetPage === 'consumer-insights') {
      drillToConsumerInsights({ categories: [category] });
    } else {
      drillToProductMix({ categories: [category] });
    }
  }, [drillToConsumerInsights, drillToProductMix]);

  /**
   * Generic drill-through with custom filters and target
   */
  const drillThrough = useCallback((
    target: '/' | '/consumer-insights' | '/product-mix',
    filters: Record<string, any>
  ) => {
    setFilters(prev => ({ ...prev, ...filters }));
    navigate(target);
  }, [setFilters, navigate]);

  /**
   * Back navigation that preserves filter context
   */
  const navigateBack = useCallback(() => {
    // Use browser history but maintain filter context
    window.history.back();
  }, []);

  return {
    // Specific drill-through methods
    drillThroughAge,
    drillThroughGender,
    drillThroughLocation,
    drillThroughBrand,
    drillThroughCategory,
    
    // Page-specific navigation
    drillToConsumerInsights,
    drillToProductMix,
    drillToDashboard,
    
    // Generic navigation
    drillThrough,
    navigateBack,
  };
};

/**
 * Hook for tracking drill-through navigation history
 * Useful for breadcrumbs and back navigation
 */
export const useDrillThroughHistory = () => {
  // This could be expanded to track navigation history
  // for more sophisticated breadcrumb navigation
  
  return {
    // Future: implement navigation history tracking
    history: [],
    canGoBack: false,
  };
};

/**
 * Pre-configured drill-through handlers for common chart types
 */
export const useDrillThroughHandlers = () => {
  const { drillThroughAge, drillThroughGender, drillThroughLocation, drillThroughBrand } = useDrillThrough();

  return {
    // Recharts click handlers
    handleAgeChartClick: (data: any) => {
      if (data && data.activePayload && data.activePayload[0]) {
        const ageGroup = data.activePayload[0].payload.age_bucket;
        drillThroughAge(ageGroup);
      }
    },

    handleGenderChartClick: (data: any) => {
      if (data && data.name) {
        drillThroughGender(data.name);
      }
    },

    handleLocationChartClick: (data: any) => {
      if (data && data.activePayload && data.activePayload[0]) {
        const location = data.activePayload[0].payload.location;
        drillThroughLocation(location);
      }
    },

    handleBrandClick: (brandName: string) => {
      drillThroughBrand(brandName);
    },

    // Generic click handler
    handleChartClick: (chartType: 'age' | 'gender' | 'location' | 'brand', value: string | any) => {
      switch (chartType) {
        case 'age':
          if (typeof value === 'string') drillThroughAge(value);
          else if (value?.activePayload?.[0]?.payload?.age_bucket) {
            drillThroughAge(value.activePayload[0].payload.age_bucket);
          }
          break;
        case 'gender':
          if (typeof value === 'string') drillThroughGender(value);
          else if (value?.name) drillThroughGender(value.name);
          break;
        case 'location':
          if (typeof value === 'string') drillThroughLocation(value);
          else if (value?.activePayload?.[0]?.payload?.location) {
            drillThroughLocation(value.activePayload[0].payload.location);
          }
          break;
        case 'brand':
          if (typeof value === 'string') drillThroughBrand(value);
          break;
      }
    }
  };
};