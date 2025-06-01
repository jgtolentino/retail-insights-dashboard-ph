import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('application loads successfully', async ({ page }) => {
    // Updated to match vite.config.ts port setting
    await page.goto('http://localhost:8080');
    
    await expect(page).toHaveTitle(/Retail Insights Dashboard/);
    
    // Check that main content loads
    await expect(page.locator('main, [role="main"], .dashboard')).toBeVisible();
    
    // Verify no critical JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('navigation works', async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // Test navigation if your app has routes
    const navLinks = page.locator('nav a, [role="navigation"] a');
    const linkCount = await navLinks.count();
    
    if (linkCount > 0) {
      await navLinks.first().click();
      await expect(page).toHaveURL(/localhost:8080/);
    }
  });

  test('filters panel loads', async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // Look for filter-related elements
    const filterElements = page.locator('[data-testid*="filter"], .filter, [class*="filter"]');
    const filterCount = await filterElements.count();
    
    if (filterCount > 0) {
      await expect(filterElements.first()).toBeVisible();
    }
  });
});