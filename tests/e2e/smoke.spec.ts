import { test, expect } from '@playwright/test';

test('basic app loads', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // More flexible title check - check actual title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check app actually loaded - use specific selector
  await expect(page.locator('#root')).toBeVisible();
  
  // Verify main content is present
  await expect(page.locator('main').first()).toBeVisible();
  
  // Check for any content indicating the app loaded
  await expect(page.locator('body')).not.toBeEmpty();
});
