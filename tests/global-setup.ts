/**
 * Global Setup for Playwright Tests
 * Runs once before all tests
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    const baseURL = config.webServer?.url || process.env.TEST_URL || 'http://localhost:4173';
    
    console.log(`📡 Checking application health at ${baseURL}`);
    
    // Health check
    await page.goto(`${baseURL}/api/health`);
    const healthResponse = await page.textContent('body');
    
    if (healthResponse && healthResponse.includes('"status":"healthy"')) {
      console.log('✅ Application is healthy and ready for testing');
    } else {
      console.warn('⚠️ Application health check returned non-healthy status');
    }
    
    // Warm up the application
    console.log('🔥 Warming up application...');
    await page.goto(baseURL);
    await page.waitForSelector('[data-testid="dashboard-loaded"]', { timeout: 30000 });
    
    // Pre-populate any test data if needed
    await setupTestData(page);
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestData(page: any) {
  // Add any test data setup here
  console.log('📊 Setting up test data...');
  
  try {
    // You could add test data creation here
    // For now, we'll just verify the dashboard loads
    await page.waitForLoadState('networkidle');
    console.log('✅ Test data setup completed');
  } catch (error) {
    console.warn('⚠️ Test data setup encountered issues:', error);
  }
}

export default globalSetup;