# Enhanced Global Filters - Complete Implementation Example

## Consumer Insights Page with All Features

```tsx
import { useEffect, useState } from 'react';
import { useFilters } from '@/contexts/EnhancedFilterContext';
import { useDebouncedFilters } from '@/hooks/useDebouncedFilters';
import { DashboardLayout } from '@/components/DashboardLayout';
import { dashboardService } from '@/services/dashboard';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ConsumerInsights() {
  const { filters, isFilterRelevant } = useFilters();
  const [data, setData] = useState<any>({
    ageData: [],
    genderData: [],
    locationData: [],
    purchasePatterns: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce filter changes to avoid excessive API calls
  const { debouncedFilters, isDebouncing } = useDebouncedFilters(filters, {
    delay: 500,
    onFiltersChange: (newFilters) => {
      console.log('Filters changed:', newFilters);
    }
  });

  useEffect(() => {
    fetchData();
  }, [debouncedFilters]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Only pass filters that are relevant to this page
      const relevantFilters = {
        category: isFilterRelevant('category') ? debouncedFilters.category : 'All',
        brand: isFilterRelevant('brand') ? debouncedFilters.brand : 'All',
        location: isFilterRelevant('location') ? debouncedFilters.location : 'All',
        weekdayWeekend: isFilterRelevant('weekdayWeekend') ? debouncedFilters.weekdayWeekend : 'all',
        dateRange: debouncedFilters.dateRange
      };

      const [age, gender, location, patterns] = await Promise.all([
        dashboardService.getAgeDistribution(
          relevantFilters.dateRange.start,
          relevantFilters.dateRange.end,
          10,
          relevantFilters
        ),
        dashboardService.getGenderDistribution(
          relevantFilters.dateRange.start,
          relevantFilters.dateRange.end,
          relevantFilters
        ),
        dashboardService.getLocationDistribution(
          relevantFilters.dateRange.start,
          relevantFilters.dateRange.end,
          relevantFilters
        ),
        dashboardService.getPurchasePatternsByTime(
          relevantFilters.dateRange.start,
          relevantFilters.dateRange.end,
          relevantFilters
        )
      ]);

      setData({
        ageData: age,
        genderData: gender,
        locationData: location,
        purchasePatterns: patterns
      });
    } catch (err) {
      console.error('Error fetching consumer insights:', err);
      setError('Failed to load consumer insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading indicator while debouncing
  const showLoadingOverlay = isDebouncing || loading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Consumer Insights</h1>
          {showLoadingOverlay && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isDebouncing ? 'Updating filters...' : 'Loading data...'}
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Age Distribution Chart */}
          <Card className={showLoadingOverlay ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Your chart component */}
            </CardContent>
          </Card>

          {/* Gender Distribution Chart */}
          <Card className={showLoadingOverlay ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Your chart component */}
            </CardContent>
          </Card>

          {/* Location Distribution Chart */}
          <Card className={showLoadingOverlay ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle>Location Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Your chart component */}
            </CardContent>
          </Card>

          {/* Purchase Patterns Chart */}
          <Card className={showLoadingOverlay ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle>Purchase Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Your chart component */}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

## Key Features Demonstrated

### 1. **URL Synchronization**
- Filters automatically sync to URL query parameters
- Users can bookmark or share specific filter states
- Browser back/forward navigation works correctly

Example URL:
```
/consumer-insights?start=2025-04-01&end=2025-04-30&category=Cigarettes&brand=Marlboro&dayType=weekend
```

### 2. **LocalStorage Persistence**
- Filter selections persist between browser sessions
- Users return to their last used filters
- Explicit reset clears both URL and localStorage

### 3. **Debounced Updates**
- Filter changes are debounced to prevent API spam
- Visual feedback shows when filters are updating
- Configurable delay per component needs

### 4. **Page-Specific Filter Relevance**
- Filters show visual indicators when not relevant
- Disabled state prevents unnecessary selections
- Tooltips explain why filters are disabled

### 5. **Loading States**
- Separate indicators for debouncing vs data loading
- Content opacity reduces during updates
- Error states with user-friendly messages

## Testing the Implementation

```typescript
// Test URL sync
describe('URL Filter Sync', () => {
  it('should update URL when filters change', () => {
    const { result } = renderHook(() => useFilters());
    
    act(() => {
      result.current.setFilters({ category: 'Beverages' });
    });
    
    expect(window.location.search).toContain('category=Beverages');
  });
  
  it('should restore filters from URL on load', () => {
    window.history.pushState({}, '', '?category=Snacks&brand=Oishi');
    
    const { result } = renderHook(() => useFilters());
    
    expect(result.current.filters.category).toBe('Snacks');
    expect(result.current.filters.brand).toBe('Oishi');
  });
});

// Test localStorage persistence
describe('LocalStorage Persistence', () => {
  it('should save filters to localStorage', () => {
    const { result } = renderHook(() => useFilters());
    
    act(() => {
      result.current.setFilters({ location: 'Manila' });
    });
    
    const saved = JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY)!);
    expect(saved.location).toBe('Manila');
  });
});

// Test debouncing
describe('Debounced Filters', () => {
  it('should debounce rapid filter changes', async () => {
    const onFiltersChange = jest.fn();
    const { result } = renderHook(() => 
      useDebouncedFilters(filters, { delay: 100, onFiltersChange })
    );
    
    // Make rapid changes
    act(() => {
      updateFilters({ category: 'A' });
      updateFilters({ category: 'B' });
      updateFilters({ category: 'C' });
    });
    
    expect(onFiltersChange).not.toHaveBeenCalled();
    
    // Wait for debounce
    await waitFor(() => {
      expect(onFiltersChange).toHaveBeenCalledTimes(1);
      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'C' })
      );
    });
  });
});
```