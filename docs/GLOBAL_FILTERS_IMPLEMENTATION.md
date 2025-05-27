# Global Filters Implementation Guide

## Overview
This guide shows how to implement the global filter system across all dashboard pages.

## 1. Update Transaction Trends Page (Index.tsx)

```tsx
import { useEffect, useState } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { dashboardService } from '@/services/dashboard';
// ... other imports

export default function Index() {
  const { filters } = useFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filters]); // Re-fetch when ANY filter changes

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use filters that are relevant for transaction trends
      const timeSeriesData = await dashboardService.getTimeSeriesDataByDateRange(
        filters.dateRange.start,
        filters.dateRange.end
      );
      
      // For dashboard data, we might only care about date range
      const dashboardData = await dashboardService.getDashboardData('custom');
      
      setData({ timeSeriesData, dashboardData });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Your existing transaction trends content */}
    </DashboardLayout>
  );
}
```

## 2. Update Product Mix Page

```tsx
import { useEffect, useState } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { dashboardService } from '@/services/dashboard';

export default function ProductMix() {
  const { filters } = useFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Product mix might care about category and brand filters
      const productMixData = await dashboardService.getProductMix(
        filters.dateRange.start,
        filters.dateRange.end,
        filters.category !== 'All' ? filters.category : null,
        filters.brand !== 'All' ? filters.brand : null
      );
      
      setData(productMixData);
    } catch (error) {
      console.error('Error fetching product mix data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Your product mix content */}
    </DashboardLayout>
  );
}
```

## 3. Update Consumer Insights Page

```tsx
import { useEffect, useState } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { dashboardService } from '@/services/dashboard';

export default function ConsumerInsights() {
  const { filters } = useFilters();
  const [ageData, setAgeData] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filters]); // ALL filters affect consumer insights

  const fetchData = async () => {
    setLoading(true);
    try {
      const [age, gender, location, patterns] = await Promise.all([
        dashboardService.getAgeDistribution(
          filters.dateRange.start,
          filters.dateRange.end,
          10,
          filters
        ),
        dashboardService.getGenderDistribution(
          filters.dateRange.start,
          filters.dateRange.end,
          filters
        ),
        dashboardService.getLocationDistribution(
          filters.dateRange.start,
          filters.dateRange.end,
          filters
        ),
        dashboardService.getPurchasePatternsByTime(
          filters.dateRange.start,
          filters.dateRange.end,
          filters
        )
      ]);

      setAgeData(age);
      setGenderData(gender);
      setLocationData(location);
      // ... set other data
    } catch (error) {
      console.error('Error fetching consumer insights:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Your existing consumer insights content */}
    </DashboardLayout>
  );
}
```

## 4. Update Service Methods

Add these new methods to `services/dashboard.ts`:

```typescript
// Product Mix specific method
async getProductMix(
  startDate: string,
  endDate: string,
  categoryFilter: string | null,
  brandFilter: string | null
): Promise<any[]> {
  const { data, error } = await supabase
    .rpc('get_product_mix', {
      start_date: startDate + 'T00:00:00Z',
      end_date: endDate + 'T23:59:59Z',
      category_filter: categoryFilter,
      brand_filter: brandFilter
    });
  
  if (error) throw error;
  return data || [];
}

// SKU Performance method
async getSKUPerformance(
  startDate: string,
  endDate: string,
  categoryFilter: string | null,
  brandFilter: string | null,
  locationFilter: string | null
): Promise<any[]> {
  const { data, error } = await supabase
    .rpc('get_sku_performance', {
      start_date: startDate + 'T00:00:00Z',
      end_date: endDate + 'T23:59:59Z',
      category_filter: categoryFilter,
      brand_filter: brandFilter,
      location_filter: locationFilter
    });
  
  if (error) throw error;
  return data || [];
}
```

## 5. SQL Functions to Support Filters

You'll need to update your Supabase RPC functions to accept filter parameters:

```sql
-- Example: Update get_age_distribution to accept filters
CREATE OR REPLACE FUNCTION get_age_distribution(
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  bucket_size INT DEFAULT 10,
  category_filter TEXT DEFAULT NULL,
  brand_filter TEXT DEFAULT NULL,
  location_filter TEXT DEFAULT NULL,
  weekday_weekend TEXT DEFAULT NULL
)
RETURNS TABLE(
  age_bucket TEXT,
  customer_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CONCAT(
      FLOOR(t.customer_age / bucket_size) * bucket_size, 
      '-', 
      FLOOR(t.customer_age / bucket_size) * bucket_size + bucket_size - 1
    ) as age_bucket,
    COUNT(DISTINCT t.customer_id) as customer_count
  FROM transactions t
  JOIN transaction_items ti ON t.id = ti.transaction_id
  JOIN products p ON ti.product_id = p.id
  JOIN brands b ON p.brand_id = b.id
  LEFT JOIN stores s ON t.store_id = s.id
  WHERE t.created_at BETWEEN start_date AND end_date
    AND (category_filter IS NULL OR p.category = category_filter)
    AND (brand_filter IS NULL OR b.name = brand_filter)
    AND (location_filter IS NULL OR s.province = location_filter)
    AND (
      weekday_weekend IS NULL OR
      (weekday_weekend = 'weekday' AND EXTRACT(DOW FROM t.created_at) BETWEEN 1 AND 5) OR
      (weekday_weekend = 'weekend' AND EXTRACT(DOW FROM t.created_at) IN (0, 6))
    )
  GROUP BY age_bucket
  ORDER BY age_bucket;
END;
$$ LANGUAGE plpgsql;
```

## 6. Benefits of This Architecture

1. **Single Source of Truth**: All pages share the same filter state
2. **Consistent UX**: Filters persist across page navigation
3. **DRY Code**: No duplicate filter logic
4. **Easy to Extend**: Add new filters by updating the GlobalFilters type
5. **Performance**: Pages only fetch data relevant to their needs
6. **Maintainable**: Clear separation of concerns

## 7. Testing the Implementation

```typescript
// Example test for filter context
describe('FilterContext', () => {
  it('should update filters correctly', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: FilterProvider
    });

    act(() => {
      result.current.setFilters({ category: 'Cigarettes' });
    });

    expect(result.current.filters.category).toBe('Cigarettes');
  });

  it('should reset all filters', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: FilterProvider
    });

    act(() => {
      result.current.setFilters({ 
        category: 'Cigarettes',
        brand: 'Marlboro' 
      });
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters).toEqual(defaultGlobalFilters);
  });
});
```