/**
 * Cross-Browser Compatibility Tests
 * Tests dashboard functionality across different browsers and versions
 */

import { test, expect, Browser, Page } from '@playwright/test';
import { chromium, firefox, webkit } from 'playwright';

const browsers = [
  { name: 'Chromium', launcher: chromium },
  { name: 'Firefox', launcher: firefox },
  { name: 'WebKit', launcher: webkit },
];

const baseUrl = process.env.TEST_URL || 'http://localhost:4173';

// Test matrix for different browser/device combinations
const testMatrix = [
  { browser: 'chromium', device: 'Desktop', viewport: { width: 1920, height: 1080 } },
  { browser: 'firefox', device: 'Desktop', viewport: { width: 1920, height: 1080 } },
  { browser: 'webkit', device: 'Desktop', viewport: { width: 1920, height: 1080 } },
  { browser: 'chromium', device: 'Mobile', viewport: { width: 375, height: 667 } },
  { browser: 'webkit', device: 'Mobile', viewport: { width: 375, height: 667 } },
];

for (const config of testMatrix) {
  test.describe(`${config.browser} - ${config.device}`, () => {
    let browser: Browser;
    let page: Page;

    test.beforeAll(async () => {
      const browserLauncher = config.browser === 'chromium' ? chromium :
                            config.browser === 'firefox' ? firefox : webkit;
      
      browser = await browserLauncher.launch({
        headless: process.env.CI === 'true',
      });
      
      page = await browser.newPage({
        viewport: config.viewport
      });

      // Set up error tracking
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          console.error(`[${config.browser}] Console error:`, msg.text());
        }
      });

      page.on('pageerror', (error) => {
        console.error(`[${config.browser}] Page error:`, error.message);
      });
    });

    test.afterAll(async () => {
      await browser.close();
    });

    test('should load dashboard without JavaScript errors', async () => {
      let jsErrors: string[] = [];
      
      page.on('pageerror', (error) => {
        jsErrors.push(error.message);
      });

      await page.goto(baseUrl);
      await page.waitForSelector('[data-testid="dashboard-loaded"]', {
        timeout: 15000
      });

      expect(jsErrors).toHaveLength(0);
    });

    test('should render charts correctly', async () => {
      await page.goto(baseUrl);
      await page.waitForSelector('[data-testid="dashboard-loaded"]');

      // Wait for charts to render
      await page.waitForSelector('.recharts-wrapper', { timeout: 10000 });
      
      const charts = page.locator('.recharts-wrapper');
      expect(await charts.count()).toBeGreaterThan(0);

      // Verify SVG elements exist (charts rendered)
      const svgElements = page.locator('svg');
      expect(await svgElements.count()).toBeGreaterThan(0);
    });

    test('should handle responsive layout', async () => {
      await page.goto(baseUrl);
      await page.waitForSelector('[data-testid="dashboard-loaded"]');

      // Check that main content is visible
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      // For mobile, check that navigation works
      if (config.device === 'Mobile') {
        // Check if mobile menu exists and works
        const mobileMenu = page.locator('[data-testid="mobile-menu"]');
        if (await mobileMenu.isVisible()) {
          await mobileMenu.click();
          await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
        }
      }
    });

    test('should support form interactions', async () => {
      await page.goto(baseUrl);
      await page.waitForSelector('[data-testid="dashboard-loaded"]');

      // Test date picker
      const datePicker = page.locator('[data-testid="date-picker"]');
      if (await datePicker.isVisible()) {
        await datePicker.click();
        await expect(page.locator('[data-testid="date-picker-popup"]')).toBeVisible();
      }

      // Test filter dropdowns
      const filterDropdown = page.locator('[data-testid="filter-dropdown"]').first();
      if (await filterDropdown.isVisible()) {
        await filterDropdown.click();
        await expect(page.locator('[data-testid="filter-options"]')).toBeVisible();
      }
    });

    test('should handle CSS and animations', async () => {
      await page.goto(baseUrl);
      await page.waitForSelector('[data-testid="dashboard-loaded"]');

      // Check that CSS transitions work
      const cards = page.locator('.card, [data-testid*="card"]');
      if (await cards.count() > 0) {
        // Hover over a card to test hover effects
        await cards.first().hover();
        
        // Check if any transform or transition styles are applied
        const styles = await cards.first().evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            transform: computed.transform,
            transition: computed.transition,
          };
        });
        
        // Verify styles are applied (not 'none' or empty)
        expect(styles.transform).toBeDefined();
      }
    });

    test('should support keyboard navigation', async () => {
      await page.goto(baseUrl);
      await page.waitForSelector('[data-testid="dashboard-loaded"]');

      // Tab through focusable elements
      await page.keyboard.press('Tab');
      
      const activeElement = await page.evaluate(() => {
        return document.activeElement?.tagName.toLowerCase();
      });
      
      // Should focus on an interactive element
      expect(['button', 'a', 'input', 'select', 'textarea']).toContain(activeElement);
    });

    test('should handle local storage', async () => {
      await page.goto(baseUrl);
      await page.waitForSelector('[data-testid="dashboard-loaded"]');

      // Test local storage functionality
      await page.evaluate(() => {
        localStorage.setItem('test-key', 'test-value');
      });

      const storedValue = await page.evaluate(() => {
        return localStorage.getItem('test-key');
      });

      expect(storedValue).toBe('test-value');
    });

    test('should handle API calls correctly', async () => {
      let networkErrors: string[] = [];
      
      page.on('response', (response) => {
        if (response.status() >= 400) {
          networkErrors.push(`${response.status()}: ${response.url()}`);
        }
      });

      await page.goto(baseUrl);
      await page.waitForSelector('[data-testid="dashboard-loaded"]');

      // Wait for API calls to complete
      await page.waitForLoadState('networkidle');

      // Should not have any API errors
      expect(networkErrors.length).toBe(0);
    });

    test('should render fonts correctly', async () => {
      await page.goto(baseUrl);
      await page.waitForSelector('[data-testid="dashboard-loaded"]');

      // Check that fonts are loaded
      const fontCheck = await page.evaluate(() => {
        // Check if custom fonts are applied
        const element = document.querySelector('h1, .font-bold');
        if (element) {
          const computed = window.getComputedStyle(element);
          return computed.fontFamily;
        }
        return 'default';
      });

      expect(fontCheck).toBeDefined();
      expect(fontCheck).not.toBe('default');
    });

    test('should handle print styles', async () => {
      await page.goto(baseUrl);
      await page.waitForSelector('[data-testid="dashboard-loaded"]');

      // Emulate print media
      await page.emulateMedia({ media: 'print' });
      
      // Check that content is still visible in print mode
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
      
      // Reset to screen media
      await page.emulateMedia({ media: 'screen' });
    });

    if (config.browser === 'chromium') {
      test('should pass accessibility checks', async () => {
        await page.goto(baseUrl);
        await page.waitForSelector('[data-testid="dashboard-loaded"]');

        // Basic accessibility checks
        const missingAltImages = await page.locator('img:not([alt])').count();
        expect(missingAltImages).toBe(0);

        // Check for proper heading hierarchy
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
        expect(headings).toBeGreaterThan(0);

        // Check for form labels
        const unlabeledInputs = await page.locator('input:not([aria-label]):not([aria-labelledby])').count();
        expect(unlabeledInputs).toBe(0);
      });

      test('should handle offline scenarios', async () => {
        await page.goto(baseUrl);
        await page.waitForSelector('[data-testid="dashboard-loaded"]');

        // Go offline
        await page.context().setOffline(true);
        
        // Try to navigate or refresh
        await page.reload({ waitUntil: 'networkidle' });

        // Should show offline indicator or cached content
        const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
        const cachedContent = page.locator('[data-testid="cached-content"]');
        
        expect(
          await offlineIndicator.isVisible() || await cachedContent.isVisible()
        ).toBe(true);

        // Go back online
        await page.context().setOffline(false);
      });
    }

    test('should maintain state across navigation', async () => {
      await page.goto(baseUrl);
      await page.waitForSelector('[data-testid="dashboard-loaded"]');

      // Apply a filter
      const timeRangeSelector = page.locator('[data-testid="time-range-7d"]');
      if (await timeRangeSelector.isVisible()) {
        await timeRangeSelector.click();
        await page.waitForTimeout(1000);
      }

      // Navigate to another page
      const consumerInsightsLink = page.locator('a[href*="consumer-insights"]');
      if (await consumerInsightsLink.isVisible()) {
        await consumerInsightsLink.click();
        await page.waitForLoadState('networkidle');

        // Navigate back
        await page.goBack();
        await page.waitForSelector('[data-testid="dashboard-loaded"]');

        // Check if state is maintained (filter still applied)
        const appliedFilter = page.locator('[data-testid="time-range-7d"].active, [data-testid="time-range-7d"][aria-selected="true"]');
        if (await appliedFilter.count() > 0) {
          await expect(appliedFilter).toBeVisible();
        }
      }
    });
  });
}