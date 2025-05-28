/**
 * Integration Tests for Dashboard Components
 * Tests end-to-end functionality with real data
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { dashboardService } from '../../src/services/dashboard';

describe('Dashboard Integration Tests', () => {
  let browser: Browser;
  let page: Page;
  const baseUrl = process.env.TEST_URL || 'http://localhost:4173';

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: process.env.CI === 'true',
    });
    page = await browser.newPage();
    
    // Set up monitoring for test failures
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });

    page.on('pageerror', (error) => {
      console.error('Page error:', error.message);
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Dashboard Loading', () => {
    it('should load main dashboard within performance budget', async () => {
      const startTime = Date.now();
      
      await page.goto(baseUrl);
      
      // Wait for dashboard to be interactive
      await page.waitForSelector('[data-testid="dashboard-loaded"]', {
        timeout: 10000
      });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // 5 second budget
      
      // Check for critical elements
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-transactions"]')).toBeVisible();
    });

    it('should handle loading states gracefully', async () => {
      await page.goto(baseUrl);
      
      // Check that loading states are shown initially
      const loadingSpinners = page.locator('.animate-spin');
      expect(await loadingSpinners.count()).toBeGreaterThan(0);
      
      // Wait for loading to complete
      await page.waitForFunction(() => {
        const spinners = document.querySelectorAll('.animate-spin');
        return spinners.length === 0;
      }, { timeout: 15000 });
    });
  });

  describe('Data Visualization', () => {
    beforeAll(async () => {
      await page.goto(baseUrl);
      await page.waitForSelector('[data-testid="dashboard-loaded"]');
    });

    it('should render charts with real data', async () => {
      // Check for chart containers
      const charts = page.locator('.recharts-wrapper');
      expect(await charts.count()).toBeGreaterThan(0);
      
      // Verify charts have data
      const chartBars = page.locator('.recharts-bar');
      expect(await chartBars.count()).toBeGreaterThan(0);
    });

    it('should update charts when filters are applied', async () => {
      // Apply a date filter
      await page.click('[data-testid="date-picker"]');
      await page.click('[data-testid="last-7-days"]');
      
      // Wait for charts to update
      await page.waitForTimeout(2000);
      
      // Verify charts updated (new data loaded)
      const updatedCharts = page.locator('.recharts-wrapper');
      expect(await updatedCharts.count()).toBeGreaterThan(0);
    });

    it('should handle empty data states', async () => {
      // Navigate to a date range with no data
      await page.goto(`${baseUrl}?startDate=2020-01-01&endDate=2020-01-02`);
      
      // Should show empty state messages
      await expect(page.locator('text=No data available')).toBeVisible();
    });
  });

  describe('Consumer Insights Page', () => {
    beforeAll(async () => {
      await page.goto(`${baseUrl}/consumer-insights`);
      await page.waitForLoadState('networkidle');
    });

    it('should load age distribution chart', async () => {
      await expect(page.locator('[data-testid="age-distribution-chart"]')).toBeVisible();
      
      // Verify chart has data
      const ageBars = page.locator('.recharts-bar');
      expect(await ageBars.count()).toBeGreaterThan(0);
    });

    it('should load gender distribution chart', async () => {
      await expect(page.locator('[data-testid="gender-distribution-chart"]')).toBeVisible();
    });

    it('should handle error boundaries', async () => {
      // Simulate an error by manipulating the DOM
      await page.evaluate(() => {
        // Force an error in a component
        const element = document.querySelector('[data-testid="age-distribution-chart"]');
        if (element) {
          element.innerHTML = 'Invalid content';
        }
      });

      // Should show error boundary fallback
      await expect(page.locator('text=Something went wrong')).toBeVisible();
    });
  });

  describe('Performance Tests', () => {
    it('should meet Core Web Vitals thresholds', async () => {
      await page.goto(baseUrl);
      
      // Measure First Contentful Paint
      const fcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                resolve(entry.startTime);
              }
            }
          });
          observer.observe({ entryTypes: ['paint'] });
        });
      });
      
      expect(fcp).toBeLessThan(2500); // 2.5s threshold
    });

    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      // Navigate to a view with large dataset
      await page.goto(`${baseUrl}?timeRange=90d`);
      await page.waitForSelector('[data-testid="dashboard-loaded"]');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(8000); // 8 second budget for large data
    });
  });

  describe('API Integration', () => {
    it('should successfully fetch dashboard data', async () => {
      const data = await dashboardService.getDashboardData('7d');
      
      expect(data).toBeDefined();
      expect(data.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(data.totalTransactions).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(data.topBrands)).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      // Mock network failure
      await page.route('**/api/**', (route) => {
        route.abort('failed');
      });

      await page.goto(baseUrl);
      
      // Should show error states instead of crashing
      await expect(page.locator('text=Unable to load')).toBeVisible();
    });

    it('should retry failed requests', async () => {
      let requestCount = 0;
      
      await page.route('**/api/dashboard**', (route) => {
        requestCount++;
        if (requestCount < 3) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });

      await page.goto(baseUrl);
      await page.waitForSelector('[data-testid="dashboard-loaded"]');
      
      expect(requestCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      await page.goto(baseUrl);
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT']).toContain(firstFocused);
    });

    it('should have proper ARIA labels', async () => {
      await page.goto(baseUrl);
      
      const charts = page.locator('[role="img"]');
      expect(await charts.count()).toBeGreaterThan(0);
      
      // Check for alt text or aria-labels
      const chartWithLabel = page.locator('[aria-label*="chart"], [aria-labelledby]').first();
      await expect(chartWithLabel).toBeVisible();
    });
  });

  describe('Responsive Design', () => {
    const viewports = [
      { width: 320, height: 568, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      it(`should render properly on ${viewport.name}`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(baseUrl);
        await page.waitForSelector('[data-testid="dashboard-loaded"]');
        
        // Verify content is visible and properly laid out
        const mainContent = page.locator('main');
        await expect(mainContent).toBeVisible();
        
        // Take screenshot for visual regression testing
        await page.screenshot({
          path: `tests/screenshots/${viewport.name.toLowerCase()}-dashboard.png`,
          fullPage: true
        });
      });
    }
  });

  describe('Data Validation', () => {
    it('should validate data integrity', async () => {
      const timeSeriesData = await dashboardService.getTimeSeriesData('30d');
      
      expect(Array.isArray(timeSeriesData)).toBe(true);
      
      if (timeSeriesData.length > 0) {
        const sample = timeSeriesData[0];
        expect(sample.date).toBeDefined();
        expect(typeof sample.transactions).toBe('number');
        expect(typeof sample.revenue).toBe('number');
        expect(sample.transactions).toBeGreaterThanOrEqual(0);
        expect(sample.revenue).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle edge cases in data processing', async () => {
      // Test with extreme date ranges
      const futureData = await dashboardService.getTimeSeriesDataByDateRange(
        '2030-01-01',
        '2030-01-02'
      );
      
      expect(Array.isArray(futureData)).toBe(true);
      expect(futureData.length).toBe(0);
    });
  });
});