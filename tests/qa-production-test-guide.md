# Production QA Test Guide

**Production URL**: https://retail-insights-dashboard-ph.vercel.app/  
**Date**: 2025-05-28  
**Environment**: Production (Vercel)

## Pre-Test Setup

1. Open Chrome/Safari in Incognito/Private mode
2. Clear any cached data for the domain
3. Open Developer Tools (F12)
4. Navigate to: https://retail-insights-dashboard-ph.vercel.app/

## Quick Test Script

Copy and paste this into the browser console:

```javascript
// Quick Filter State Check
console.log('=== FILTER STATE CHECK ===');
console.log('URL Params:', window.location.search);
console.log('LocalStorage:', localStorage.getItem('retail-dashboard-filters'));

// Find Filter Elements
const filterElements = {
    dropdowns: document.querySelectorAll('[role="combobox"], select, [data-filter]'),
    chips: document.querySelectorAll('[data-testid*="chip"], .chip, .tag'),
    resetButton: document.querySelector('button:has-text("Reset"), [aria-label*="reset"]'),
    dateInputs: document.querySelectorAll('input[type="date"], [data-testid*="date"]')
};

console.log('Filter Elements Found:');
console.log('- Dropdowns:', filterElements.dropdowns.length);
console.log('- Filter Chips:', filterElements.chips.length);
console.log('- Reset Button:', !!filterElements.resetButton);
console.log('- Date Inputs:', filterElements.dateInputs.length);

// Check Navigation
const navLinks = document.querySelectorAll('nav a, [role="navigation"] a');
console.log('\nNavigation Links:', Array.from(navLinks).map(a => a.textContent.trim()));

// Check for Errors
const errors = document.querySelectorAll('.error, [role="alert"], [data-error]');
console.log('\nErrors Found:', errors.length);
```

## Manual Test Checklist

### 1. Initial Load Tests ✅/❌

- [ ] Page loads without errors
- [ ] No filter parameters in URL (`?categories=...` etc.)
- [ ] No filter chips/badges visible
- [ ] Dashboard shows default date range (last 30 days)

### 2. Filter Dropdown Tests

#### Categories Filter
- [ ] Click Categories dropdown
- [ ] Select "Cigarettes"
- [ ] Select "Snacks" (multi-select)
- [ ] Verify URL updates to `?categories=Cigarettes,Snacks`
- [ ] Verify 2 filter chips appear
- [ ] Refresh page - selections persist

#### Brands Filter
- [ ] Click Brands dropdown
- [ ] Select "Marlboro"
- [ ] Select "Mevius" 
- [ ] Verify URL includes `&brands=Marlboro,Mevius`
- [ ] Verify chips show all 4 filters (2 categories + 2 brands)

### 3. Navigation Tests

- [ ] With filters applied, click "Product Mix"
- [ ] Verify filters persist (URL and chips)
- [ ] Click "Consumer Insights"
- [ ] Verify filters still active
- [ ] Return to "Dashboard"
- [ ] Verify no filter loss

### 4. Reset Tests

- [ ] Click "Reset All" or similar button
- [ ] Verify all chips disappear
- [ ] Verify URL returns to base (no params)
- [ ] Verify localStorage cleared

### 5. Data Validation

- [ ] With "Cigarettes" filter, verify charts show only cigarette data
- [ ] Remove all filters, verify full data returns
- [ ] Apply impossible filter combo (no results)
- [ ] Verify "No data" message appears gracefully

### 6. Mobile Test (DevTools)

- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Set to iPhone 12 (390x844)
- [ ] Verify filters still accessible
- [ ] Test touch interactions on dropdowns
- [ ] Verify chips wrap/scroll properly

## Console Commands for Testing

```javascript
// Apply test filters programmatically
function applyTestFilters() {
    const filters = {
        categories: ['Cigarettes', 'Snacks'],
        brands: ['Marlboro', 'Mevius'],
        dateRange: { start: '2024-01-01', end: '2024-01-31' }
    };
    localStorage.setItem('retail-dashboard-filters', JSON.stringify(filters));
    
    // Update URL
    const params = new URLSearchParams();
    params.set('categories', filters.categories.join(','));
    params.set('brands', filters.brands.join(','));
    params.set('start', filters.dateRange.start);
    params.set('end', filters.dateRange.end);
    
    window.history.pushState({}, '', '?' + params.toString());
    window.location.reload();
}

// Clear all filters
function clearAllFilters() {
    localStorage.removeItem('retail-dashboard-filters');
    window.history.pushState({}, '', window.location.pathname);
    window.location.reload();
}

// Check current filter state
function checkFilterState() {
    console.log('=== CURRENT FILTER STATE ===');
    console.log('URL:', window.location.search);
    console.log('LocalStorage:', localStorage.getItem('retail-dashboard-filters'));
    console.log('Chips visible:', document.querySelectorAll('[data-testid*="chip"]').length);
}
```

## Expected Results

### URL Format
- Single filter: `?categories=Cigarettes`
- Multiple same type: `?categories=Cigarettes,Snacks`
- Multiple types: `?categories=Cigarettes&brands=Marlboro`
- With dates: `?categories=Cigarettes&start=2024-01-01&end=2024-01-31`

### LocalStorage Format
```json
{
  "categories": ["Cigarettes", "Snacks"],
  "brands": ["Marlboro", "Mevius"],
  "products": [],
  "locations": [],
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}
```

## Bug Report Template

If you find issues, document them as:

```markdown
### Issue: [Brief Description]
**Page**: Dashboard / Product Mix / etc.
**Steps**:
1. 
2. 
3. 

**Expected**: 
**Actual**: 
**Screenshot**: [attach if applicable]
**Console Error**: [paste any errors]
```

## Quick Links

- Production: https://retail-insights-dashboard-ph.vercel.app/
- Dashboard: https://retail-insights-dashboard-ph.vercel.app/
- Product Mix: https://retail-insights-dashboard-ph.vercel.app/product-mix
- Consumer Insights: https://retail-insights-dashboard-ph.vercel.app/consumer-insights
- Brands: https://retail-insights-dashboard-ph.vercel.app/brands
- Trends: https://retail-insights-dashboard-ph.vercel.app/trends

---

**Next Steps**: Run through this checklist and document results in `qa-execution-report.md`