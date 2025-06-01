import { test, expect } from '@playwright/test';

test.describe('Filter Behavior Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('brand filter loads dynamic data from Supabase', async ({ page }) => {
    // Wait for brand filter to load
    const brandSelect = page.locator('[data-testid="brand-filter"]').first();
    await expect(brandSelect).toBeVisible();
    
    // Click to open dropdown
    await brandSelect.click();
    
    // Wait for options to load
    await page.waitForTimeout(2000);
    
    // Check that we have more than 4 brands (proving it's not hardcoded)
    const brandOptions = page.locator('[data-testid="brand-option"]');
    const optionCount = await brandOptions.count();
    
    console.log(`Found ${optionCount} brand options`);
    expect(optionCount).toBeGreaterThan(4); // Should be 15+ from Supabase
    
    // Verify specific brands exist (from QA-confirmed dataset)
    await expect(page.locator('text=Del Monte')).toBeVisible();
    await expect(page.locator('text=Alaska')).toBeVisible();
  });

  test('selecting brand filter triggers chart update', async ({ page }) => {
    // Wait for initial chart to load
    await expect(page.locator('[data-testid="sales-by-brand-chart"]')).toBeVisible();
    
    // Get initial chart data
    const initialChartData = await page.locator('[data-testid="chart-data"]').textContent();
    
    // Select a specific brand
    const brandSelect = page.locator('[data-testid="brand-filter"]').first();
    await brandSelect.click();
    await page.locator('text=Del Monte').click();
    
    // Wait for chart to update
    await page.waitForTimeout(3000);
    
    // Verify chart data has changed
    const updatedChartData = await page.locator('[data-testid="chart-data"]').textContent();
    expect(updatedChartData).not.toBe(initialChartData);
    
    // Verify chart shows filtered brand
    await expect(page.locator('[data-testid="sales-by-brand-chart"]')).toContainText('Del Monte');
  });

  test('category filter loads dynamic options', async ({ page }) => {
    const categorySelect = page.locator('[data-testid="category-filter"]').first();
    await expect(categorySelect).toBeVisible();
    
    await categorySelect.click();
    await page.waitForTimeout(1000);
    
    // Should have multiple categories from products table
    const categoryOptions = page.locator('[data-testid="category-option"]');
    const optionCount = await categoryOptions.count();
    
    expect(optionCount).toBeGreaterThan(2);
    
    // Verify expected categories exist
    await expect(page.locator('text=Beverages')).toBeVisible();
    await expect(page.locator('text=Snacks')).toBeVisible();
  });

  test('filter reset clears all selections', async ({ page }) => {
    // Select some filters
    const brandSelect = page.locator('[data-testid="brand-filter"]').first();
    await brandSelect.click();
    await page.locator('text=Alaska').click();
    
    const categorySelect = page.locator('[data-testid="category-filter"]').first();
    await categorySelect.click();
    await page.locator('text=Beverages').click();
    
    // Click reset button
    await page.locator('button:has-text("Reset All")').click();
    
    // Verify filters are cleared
    await expect(brandSelect).toHaveText(/All brands/);
    await expect(categorySelect).toHaveText(/All categories/);
  });

  test('multiple filter selections work together', async ({ page }) => {
    // Select brand and category
    const brandSelect = page.locator('[data-testid="brand-filter"]').first();
    await brandSelect.click();
    await page.locator('text=Del Monte').click();
    
    const categorySelect = page.locator('[data-testid="category-filter"]').first();
    await categorySelect.click();
    await page.locator('text=Beverages').click();
    
    // Wait for chart to update with combined filters
    await page.waitForTimeout(3000);
    
    // Verify chart reflects both filters
    const chartContent = await page.locator('[data-testid="sales-by-brand-chart"]').textContent();
    expect(chartContent).toContain('Del Monte');
    
    // Verify filter summary shows active filters
    await expect(page.locator('[data-testid="filter-summary"]')).toContainText('1 brands');
    await expect(page.locator('[data-testid="filter-summary"]')).toContainText('1 categories');
  });
});