# Drill-Through Navigation Guide

This document explains the drill-through navigation patterns implemented in the Retail Insights Dashboard PH.

## Overview

Drill-through navigation allows users to click on data points in charts to navigate to related pages with pre-applied filters. This creates a seamless analytical flow where users can explore data relationships intuitively.

## Architecture

### 1. AppShell Component
The `AppShell` component provides persistent navigation and filter state across all dashboard pages:

```tsx
// src/components/AppShell.tsx
export function AppShell() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
```

### 2. Enhanced Filter Context
The `EnhancedFilterContext` manages global filter state with:
- URL synchronization
- LocalStorage persistence  
- Debounced updates
- Page-specific filter relevance

## Implemented Drill-Through Features

### 1. Age Distribution Chart
**Location**: `src/components/charts/AgeDistribution.tsx`

**Behavior**: 
- Click on any age group bar
- Navigates to Consumer Insights page
- Applies selected age group filter

**Example**:
```tsx
const handleBarClick = (data: any) => {
  if (data && data.activePayload && data.activePayload[0]) {
    const ageGroup = data.activePayload[0].payload.age_bucket;
    setFilters(prev => ({ ...prev, ageGroups: [ageGroup] }));
    navigate('/consumer-insights');
  }
};
```

### 2. Gender Distribution Chart
**Location**: `src/components/charts/GenderDistribution.tsx`

**Behavior**:
- Click on any gender pie slice
- Navigates to Consumer Insights page
- Applies selected gender filter

### 3. Location Distribution Chart
**Location**: `src/components/charts/LocationDistribution.tsx`

**Behavior**:
- Click on any location bar
- Navigates to Consumer Insights page
- Currently navigates without location filter (TODO: Add location filter support)

### 4. Brand Performance Chart
**Location**: `src/pages/Index.tsx`

**Behavior**:
- Click on any brand bar
- Navigates to Product Mix page
- Applies selected brand filter

**Visual Feedback**:
```css
- Hover state with background color change
- Text color change on hover
- Cursor pointer indicator
```

## Implementation Pattern

### Basic Click Handler Pattern
```tsx
const handleChartClick = (data: any) => {
  // Extract the clicked value
  const clickedValue = data.activePayload[0].payload.dataKey;
  
  // Update global filters
  setFilters(prev => ({
    ...prev,
    filterKey: [clickedValue]
  }));
  
  // Navigate to target page
  navigate('/target-page');
};
```

### Adding Visual Feedback
1. **For Recharts Bar/Line Charts**:
   ```tsx
   <Bar cursor="pointer" onClick={handleClick} />
   ```

2. **For Custom HTML Elements**:
   ```tsx
   <div className="cursor-pointer hover:bg-gray-50 transition-colors">
     {/* Content */}
   </div>
   ```

## Filter Persistence

Filters are persisted across navigation through:

1. **URL Query Parameters**:
   ```
   /consumer-insights?ageGroups=30-40&genders=Male
   ```

2. **LocalStorage**:
   ```json
   {
     "retail-insights-filters": {
       "ageGroups": ["30-40"],
       "genders": ["Male"],
       "dateRange": { "from": "2025-05-01", "to": "2025-05-30" }
     }
   }
   ```

3. **Debouncing**:
   - 300ms debounce on filter updates
   - Prevents excessive API calls during rapid clicks

## Adding New Drill-Through Features

To add drill-through to a new chart:

1. **Import Required Hooks**:
   ```tsx
   import { useNavigate } from 'react-router-dom';
   import { useEnhancedFilters } from '@/contexts/EnhancedFilterContext';
   ```

2. **Add Click Handler**:
   ```tsx
   const navigate = useNavigate();
   const { setFilters } = useEnhancedFilters();
   
   const handleClick = (data) => {
     setFilters(prev => ({ ...prev, yourFilter: [data.value] }));
     navigate('/target-page');
   };
   ```

3. **Add Visual Feedback**:
   - Set `cursor="pointer"` on chart elements
   - Add hover states with CSS classes

## Testing Drill-Through

### Manual Testing
1. Click on a chart element
2. Verify navigation to correct page
3. Check that filters are applied
4. Verify URL contains filter parameters
5. Navigate back and check filter persistence

### Automated Tests
See `src/tests/drill-through.smoke.test.ts` for test examples.

## Performance Considerations

1. **Debouncing**: All filter updates are debounced by 300ms
2. **Memoization**: Filter context uses React.memo and useMemo
3. **Lazy Loading**: Charts load data only when visible

## Future Enhancements

1. **Location Filter Support**: Add province/city filtering capability
2. **Multi-Select Drill-Through**: Allow Ctrl+Click for multiple selections
3. **Breadcrumb Navigation**: Show drill-through path
4. **Filter Preview**: Show tooltip with filter preview before clicking
5. **Undo/Redo**: Add ability to undo filter navigation

## Troubleshooting

### Filters Not Persisting
- Check that `EnhancedFilterProvider` wraps your app
- Verify URL parameters are being set
- Check browser console for localStorage errors

### Navigation Not Working
- Ensure routes are properly configured in App.tsx
- Check that `useNavigate` is called within Router context
- Verify target page exists and is imported

### Click Events Not Firing
- Check z-index of chart elements
- Verify no overlapping transparent elements
- Ensure chart library supports click events on specific element type