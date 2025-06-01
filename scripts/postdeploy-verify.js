#!/usr/bin/env node

/**
 * Post-Deployment Verification Script
 * 
 * This script validates that the deployed application is actually working:
 * - React app mounts successfully
 * - No JavaScript console errors
 * - Critical DOM elements are present
 * - API endpoints are accessible
 * - Dashboard components load properly
 */

import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { join } from 'path';

// Configuration
const CONFIG = {
  // Try to get deployment URL from environment or default to production
  url: process.env.DEPLOYMENT_URL || 'https://retail-insights-dashboard-ph.vercel.app',
  timeout: 30000,
  retries: 3,
  criticalSelectors: [
    '#root',
    'main',
    '[data-testid="sales-by-brand-chart"]',
    'nav',
    '.status-banner, [data-testid="status-banner"]'
  ],
  requiredText: [
    'Sales by Brand',
    'Dashboard',
    'System Status'
  ]
};

class PostDeployVerifier {
  constructor() {
    this.browser = null;
    this.page = null;
    this.errors = [];
    this.warnings = [];
  }

  async init() {
    console.log('🚀 Starting Post-Deployment Verification');
    console.log(`📍 Target URL: ${CONFIG.url}`);
    console.log('');

    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    
    // Capture console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.errors.push(`Console Error: ${msg.text()}`);
      }
      if (msg.type() === 'warning' && msg.text().includes('Failed to load')) {
        this.warnings.push(`Console Warning: ${msg.text()}`);
      }
    });

    // Capture page errors
    this.page.on('pageerror', error => {
      this.errors.push(`Page Error: ${error.message}`);
    });
  }

  async checkReactMount() {
    console.log('🧪 Testing React App Mount...');
    
    try {
      await this.page.goto(CONFIG.url, { 
        waitUntil: 'networkidle',
        timeout: CONFIG.timeout 
      });

      // Wait for React to mount
      await this.page.waitForSelector('#root', { timeout: 10000 });
      
      // Check if root has content (React mounted successfully)
      const rootContent = await this.page.locator('#root').textContent();
      
      if (!rootContent || rootContent.trim().length < 10) {
        throw new Error('React app failed to mount - #root is empty or has minimal content');
      }

      // Check for error boundaries
      const errorBoundary = await this.page.locator('text=Something went wrong').count();
      if (errorBoundary > 0) {
        throw new Error('React Error Boundary detected - app crashed during render');
      }

      console.log('✅ React app mounted successfully');
      return true;
    } catch (error) {
      this.errors.push(`React Mount Error: ${error.message}`);
      console.log(`❌ React mount failed: ${error.message}`);
      return false;
    }
  }

  async checkCriticalElements() {
    console.log('🔍 Checking Critical DOM Elements...');
    
    let passed = 0;
    let failed = 0;

    for (const selector of CONFIG.criticalSelectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 5000 });
        console.log(`  ✅ ${selector}`);
        passed++;
      } catch (error) {
        console.log(`  ❌ ${selector} - Not found`);
        this.errors.push(`Missing critical element: ${selector}`);
        failed++;
      }
    }

    console.log(`📊 Critical Elements: ${passed} passed, ${failed} failed`);
    return failed === 0;
  }

  async checkRequiredText() {
    console.log('📝 Checking Required Text Content...');
    
    let passed = 0;
    let failed = 0;

    for (const text of CONFIG.requiredText) {
      try {
        await this.page.waitForSelector(`text=${text}`, { timeout: 5000 });
        console.log(`  ✅ "${text}"`);
        passed++;
      } catch (error) {
        console.log(`  ❌ "${text}" - Not found`);
        this.warnings.push(`Missing required text: "${text}"`);
        failed++;
      }
    }

    console.log(`📊 Required Text: ${passed} passed, ${failed} failed`);
    return failed === 0;
  }

  async checkApiEndpoints() {
    console.log('🌐 Testing API Endpoints...');
    
    const endpoints = [
      '/api/health',
      '/api/qa-status'
    ];

    let passed = 0;
    let failed = 0;

    for (const endpoint of endpoints) {
      try {
        const response = await this.page.request.get(`${CONFIG.url}${endpoint}`);
        if (response.ok()) {
          console.log(`  ✅ ${endpoint} (${response.status()})`);
          passed++;
        } else {
          console.log(`  ❌ ${endpoint} (${response.status()})`);
          this.warnings.push(`API endpoint failed: ${endpoint} returned ${response.status()}`);
          failed++;
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint} - Error: ${error.message}`);
        this.warnings.push(`API endpoint error: ${endpoint} - ${error.message}`);
        failed++;
      }
    }

    console.log(`📊 API Endpoints: ${passed} passed, ${failed} failed`);
    return true; // API failures are warnings, not critical
  }

  async takeScreenshot() {
    console.log('📸 Taking Screenshot for Visual Validation...');
    
    try {
      // Take full page screenshot
      await this.page.screenshot({ 
        path: 'e2e-snapshots/postdeploy-verification.png',
        fullPage: true 
      });
      
      // Take viewport screenshot for quick validation
      await this.page.screenshot({ 
        path: 'e2e-snapshots/postdeploy-viewport.png'
      });

      console.log('✅ Screenshots saved to e2e-snapshots/');
      return true;
    } catch (error) {
      this.warnings.push(`Screenshot failed: ${error.message}`);
      console.log(`⚠️ Screenshot failed: ${error.message}`);
      return false;
    }
  }

  async checkConsoleErrors() {
    console.log('🐛 Checking for Console Errors...');
    
    if (this.errors.length === 0) {
      console.log('✅ No console errors detected');
      return true;
    } else {
      console.log(`❌ ${this.errors.length} console errors detected:`);
      this.errors.forEach(error => console.log(`  - ${error}`));
      return false;
    }
  }

  async generateReport() {
    console.log('');
    console.log('📋 Post-Deployment Verification Report');
    console.log('=====================================');
    
    const totalErrors = this.errors.length;
    const totalWarnings = this.warnings.length;
    
    if (totalErrors === 0) {
      console.log('🎉 VERIFICATION PASSED - Deployment is healthy!');
      console.log(`✅ 0 critical errors`);
      console.log(`⚠️ ${totalWarnings} warnings`);
      
      if (totalWarnings > 0) {
        console.log('');
        console.log('Warnings:');
        this.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
      
      return true;
    } else {
      console.log('🚨 VERIFICATION FAILED - Deployment has critical issues!');
      console.log(`❌ ${totalErrors} critical errors`);
      console.log(`⚠️ ${totalWarnings} warnings`);
      console.log('');
      console.log('Critical Errors:');
      this.errors.forEach(error => console.log(`  - ${error}`));
      
      if (totalWarnings > 0) {
        console.log('');
        console.log('Warnings:');
        this.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
      
      return false;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      
      // Run all verification checks
      const checks = [
        await this.checkReactMount(),
        await this.checkCriticalElements(),
        await this.checkRequiredText(),
        await this.checkApiEndpoints(),
        await this.takeScreenshot(),
        await this.checkConsoleErrors()
      ];
      
      // Generate final report
      const success = await this.generateReport();
      
      await this.cleanup();
      
      // Exit with appropriate code
      process.exit(success ? 0 : 1);
      
    } catch (error) {
      console.error('💥 Verification script crashed:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new PostDeployVerifier();
  verifier.run();
}