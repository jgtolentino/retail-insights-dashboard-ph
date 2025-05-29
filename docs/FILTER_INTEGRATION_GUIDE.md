# 🎯 Advanced Filter Integration Guide

## 🎉 Overview

Your retail insights dashboard now has **enterprise-grade filter synchronization** with 5 powerful RPC functions that ensure filters always show valid, real-time data combinations.

## 📋 Available Functions

### 1. `get_filter_options()` - Master Filter Data
**Purpose**: Get all available filter options with usage statistics

```javascript
const { data } = await supabase.rpc('get_filter_options');

// Returns:
{
  "categories": [
    {"value": "Snacks", "label": "Snacks", "count": 645},
    {"value": "Dairy", "label": "Dairy", "count": 523},
    // ... more categories
  ],
  "brands": [
    {
      "value": "12", 
      "label": "Hi-Ho", 
      "category": "Snacks", 
      "is_tbwa": true, 
      "count": 64
    },
    // ... more brands
  ],
  "locations": [
    {"value": "Manila Central", "label": "Manila Central", "transaction_count": 4500},
    // ... more locations
  ],
  "tbwa_stats": {
    "total_brands": 89,
    "tbwa_brands": 67,
    "competitor_brands": 22
  }
}
```

### 2. `validate_filter_combination()` - Real-time Validation
**Purpose**: Check if filter combination will return data before applying

```javascript
const { data } = await supabase.rpc('validate_filter_combination', {
  p_categories: ['Dairy', 'Snacks'],
  p_brands: ['12', '63'],
  p_tbwa_only: true
});

// Returns:
{
  "is_valid": true,
  "transaction_count": 143,
  "filters_applied": {
    "categories": 2,
    "brands": 2,
    "tbwa_only": true
  },
  "message": "Filter combination is valid"
}
```

### 3. `get_cascading_filter_options()` - Smart Cascading
**Purpose**: Get available options based on current selections

```javascript
const { data } = await supabase.rpc('get_cascading_filter_options', {
  p_selected_categories: ['Snacks'],
  p_tbwa_only: true
});

// Returns only brands/products/locations that exist with Snacks + TBWA
{
  "available_categories": ["Snacks"],
  "available_brands": [
    {"id": "12", "name": "Hi-Ho", "category": "Snacks", "is_tbwa": true},
    // ... only brands that have transactions in Snacks category
  ],
  "available_products": [...],
  "available_locations": [...],
  "tbwa_breakdown": {
    "tbwa_transactions": 645,
    "competitor_transactions": 0,
    "total_transactions": 645
  }
}
```

### 4. `check_filter_data_health()` - Health Monitoring
**Purpose**: Monitor data quality for filters

```javascript
const { data } = await supabase.rpc('check_filter_data_health');

// Returns array of health checks:
[
  {
    "check_name": "orphaned_records",
    "status": "OK",
    "details": {"orphaned_transaction_items": 0}
  },
  {
    "check_name": "tbwa_distribution", 
    "status": "EXCELLENT",
    "details": {"tbwa_brands": 67, "competitor_brands": 22}
  }
]
```

### 5. `get_brand_analysis_for_filters()` - Deep Brand Insights
**Purpose**: Detailed brand performance for specific categories/filters

```javascript
const { data } = await supabase.rpc('get_brand_analysis_for_filters', {
  p_category: 'Snacks',
  p_tbwa_only: true
});

// Returns detailed brand metrics:
{
  "brands": [
    {
      "id": 12,
      "name": "Hi-Ho",
      "category": "Snacks",
      "is_tbwa": true,
      "metrics": {
        "transactions": 64,
        "items": 64, 
        "revenue": 3494,
        "products": 2
      }
    }
  ],
  "summary": {
    "total_brands": 10,
    "total_revenue": 23545,
    "avg_revenue_per_brand": 2354.5,
    "top_brand": "Hi-Ho"
  }
}
```

---

## 🎯 Implementation Patterns

### Pattern 1: Smart Filter Initialization
```javascript
// Initialize filters with real data
const initializeFilters = async () => {
  const { data } = await supabase.rpc('get_filter_options');
  
  // Populate category dropdown
  setCategoryOptions(data.categories);
  
  // Populate brand dropdown (with TBWA indicators)
  setBrandOptions(data.brands.map(brand => ({
    ...brand,
    label: `${brand.label} ${brand.is_tbwa ? '✨' : '🏢'}`
  })));
  
  // Show TBWA stats in UI
  setTBWAStats(data.tbwa_stats);
};
```

### Pattern 2: Cascading Filter Updates
```javascript
// Update available options when filters change
const handleFilterChange = async (selectedFilters) => {
  const { data } = await supabase.rpc('get_cascading_filter_options', {
    p_selected_categories: selectedFilters.categories,
    p_selected_brands: selectedFilters.brands,
    p_tbwa_only: selectedFilters.tbwaOnly
  });
  
  // Update available options (disable unavailable ones)
  setAvailableBrands(data.available_brands);
  setAvailableProducts(data.available_products);
  setAvailableLocations(data.available_locations);
  
  // Show TBWA breakdown
  setTBWABreakdown(data.tbwa_breakdown);
};
```

### Pattern 3: Real-time Validation
```javascript
// Validate before applying filters
const applyFilters = async (filterConfig) => {
  const { data: validation } = await supabase.rpc('validate_filter_combination', filterConfig);
  
  if (!validation.is_valid) {
    showWarning(`No data matches this combination. ${validation.message}`);
    return;
  }
  
  // Show preview of results
  showPreview(`Will show ${validation.transaction_count} transactions`);
  
  // Apply filters to main query
  setActiveFilters(filterConfig);
};
```

### Pattern 4: TBWA Toggle Integration
```javascript
// Smart TBWA/Competitor toggle
const TBWAToggle = () => {
  const [mode, setMode] = useState('all'); // 'all', 'tbwa', 'competitors'
  
  const handleModeChange = async (newMode) => {
    const tbwaOnly = newMode === 'tbwa' ? true : newMode === 'competitors' ? false : null;
    
    // Get available options for this mode
    const { data } = await supabase.rpc('get_cascading_filter_options', {
      ...currentFilters,
      p_tbwa_only: tbwaOnly
    });
    
    setMode(newMode);
    updateAvailableOptions(data);
  };
  
  return (
    <ToggleGroup value={mode} onValueChange={handleModeChange}>
      <ToggleButton value="all">All Brands</ToggleButton>
      <ToggleButton value="tbwa">✨ TBWA Clients</ToggleButton>
      <ToggleButton value="competitors">🏢 Competitors</ToggleButton>
    </ToggleGroup>
  );
};
```

---

## 🏗️ React Hook Example

```javascript
// Custom hook for filter management
export const useAdvancedFilters = () => {
  const [filters, setFilters] = useState({
    categories: [],
    brands: [],
    products: [],
    locations: [],
    tbwaOnly: null
  });
  
  const [availableOptions, setAvailableOptions] = useState({});
  const [isValid, setIsValid] = useState(true);
  
  // Load initial options
  useEffect(() => {
    const loadOptions = async () => {
      const { data } = await supabase.rpc('get_filter_options');
      setAvailableOptions(data);
    };
    loadOptions();
  }, []);
  
  // Validate and update cascading options when filters change
  useEffect(() => {
    const updateCascading = async () => {
      // Validate current combination
      const { data: validation } = await supabase.rpc('validate_filter_combination', filters);
      setIsValid(validation.is_valid);
      
      // Get cascading options
      const { data: cascading } = await supabase.rpc('get_cascading_filter_options', filters);
      setAvailableOptions(prev => ({
        ...prev,
        available_brands: cascading.available_brands,
        available_products: cascading.available_products,
        available_locations: cascading.available_locations
      }));
    };
    
    updateCascading();
  }, [filters]);
  
  return {
    filters,
    setFilters,
    availableOptions,
    isValid,
    // Helper methods
    updateFilter: (key, value) => setFilters(prev => ({...prev, [key]: value})),
    clearFilters: () => setFilters({categories: [], brands: [], products: [], locations: [], tbwaOnly: null})
  };
};
```

---

## 🎨 UI Component Examples

### Smart Category Filter
```javascript
const CategoryFilter = ({ value, onChange, availableCategories }) => {
  return (
    <MultiSelect
      value={value}
      onValueChange={onChange}
      placeholder="Select categories..."
    >
      {availableCategories?.map(category => (
        <MultiSelectItem 
          key={category.value} 
          value={category.value}
          disabled={category.count === 0}
        >
          {category.label} ({category.count})
        </MultiSelectItem>
      ))}
    </MultiSelect>
  );
};
```

### TBWA Brand Filter with Icons
```javascript
const BrandFilter = ({ value, onChange, availableBrands, showTBWAIcons = true }) => {
  return (
    <MultiSelect value={value} onValueChange={onChange}>
      {availableBrands?.map(brand => (
        <MultiSelectItem key={brand.value} value={brand.value}>
          <div className="flex items-center gap-2">
            {showTBWAIcons && (
              <span>{brand.is_tbwa ? '✨' : '🏢'}</span>
            )}
            <span>{brand.label}</span>
            <span className="text-gray-500">({brand.count})</span>
          </div>
        </MultiSelectItem>
      ))}
    </MultiSelect>
  );
};
```

---

## 📊 Performance Tips

1. **Cache filter options** - They don't change frequently
2. **Debounce cascading calls** - Avoid excessive API calls during typing
3. **Show loading states** - Validation can take 100-300ms
4. **Progressive disclosure** - Show advanced filters only when needed
5. **Preload common combinations** - Cache popular filter sets

---

## 🔧 Error Handling

```javascript
const handleFilterError = (error, filterName) => {
  console.error(`Filter ${filterName} error:`, error);
  
  // Graceful degradation
  if (error.message.includes('function') && error.message.includes('does not exist')) {
    // Fallback to basic filtering
    return useFallbackFilter();
  }
  
  // Show user-friendly message
  toast.error(`Filter temporarily unavailable. Using cached options.`);
};
```

---

## 🎯 Next Steps

1. **✅ All functions deployed and tested**
2. **🔄 Integrate into existing filter components**
3. **✨ Add TBWA vs competitor toggle**
4. **📊 Implement real-time validation**
5. **🎨 Add filter preview with counts**
6. **⚡ Add performance monitoring**

Your dashboard now has **enterprise-grade filter intelligence** that ensures users always see valid, relevant options! 🚀