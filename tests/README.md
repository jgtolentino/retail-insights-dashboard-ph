# Filter QA Testing Guide

This directory contains comprehensive testing tools for the Retail Insights Dashboard filter functionality.

## Files

1. **`filter-qa-checklist.html`** - Interactive manual QA checklist
2. **`filter-qa-automated.js`** - Automated browser console test script
3. **`sprint2-browser-test.html`** - Basic connection test
4. **`sprint2-validation.js`** - Sprint 2 validation script

## How to Use

### Manual Testing with Checklist

1. Open `filter-qa-checklist.html` in your browser
2. Set the test URL (your deployment URL)
3. Go through each test item systematically
4. Check off completed tests
5. Add notes for any issues found
6. Export results as JSON when complete

### Automated Testing

1. Navigate to your dashboard deployment
2. Open browser console (F12)
3. Copy and paste the contents of `filter-qa-automated.js`
4. Run `FilterQATester.runAllTests()`
5. Review the console output for test results
6. Access full report with `window.qaReport`

### Test Coverage

The tests cover:

1. **Global Setup** - Default state validation
2. **Multi-Select Dropdowns** - Categories, Brands, Products, Locations
3. **Single-Select Controls** - Date range, view options
4. **Reset Functionality** - Clear all filters
5. **Cross-Page Persistence** - Filter state across navigation
6. **Data Validation** - Charts/tables update with filters
7. **Accessibility** - Keyboard navigation
8. **Mobile/Responsive** - Small viewport behavior

## Expected Behavior

### URL Parameter Format
- Multi-select: `?categories=Cigarettes,Snacks&brands=Marlboro,Mevius`
- Date range: `?start=2024-01-01&end=2024-01-31`
- Combined: `?categories=Cigarettes&start=2024-01-01&end=2024-01-31`

### localStorage Structure
```json
{
  "retail-dashboard-filters": {
    "categories": ["Cigarettes", "Snacks"],
    "brands": ["Marlboro", "Mevius"],
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    }
  }
}
```

### Filter Chips
- Each selected filter shows as a chip with an "×" button
- Clicking "×" removes that specific filter
- "Reset All" clears all filters at once

## Troubleshooting

### Common Issues

1. **Filters don't persist on reload**
   - Check if localStorage is being set
   - Verify URL parameters are correct
   - Check for console errors

2. **Data doesn't update with filters**
   - Verify API calls include filter parameters
   - Check network tab for correct requests
   - Ensure backend supports filtering

3. **Cross-page persistence fails**
   - Check if filters are read from URL on page load
   - Verify localStorage sync across pages
   - Check for navigation method (client-side vs full reload)

### Debug Commands

Run these in the console:

```javascript
// Check current filters
localStorage.getItem('retail-dashboard-filters')

// Check URL params
new URLSearchParams(window.location.search).toString()

// Find filter elements
document.querySelectorAll('[data-testid*="filter"]')

// Trigger filter reset
document.querySelector('[data-testid="reset-filters"]')?.click()
```

## Reporting Issues

When reporting filter issues, include:

1. Browser and version
2. Deployment URL
3. Steps to reproduce
4. Expected vs actual behavior
5. Console errors (if any)
6. Network requests (HAR file if possible)
7. Screenshots/recordings

## Next Steps

After completing QA:

1. Fix any identified issues
2. Re-run tests on fixes
3. Document any known limitations
4. Update test cases for new features
5. Consider adding E2E tests with Playwright/Cypress