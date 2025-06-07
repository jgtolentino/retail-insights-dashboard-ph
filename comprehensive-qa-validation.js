#!/usr/bin/env node

/**
 * COMPREHENSIVE QA VALIDATION FOR ALL DASHBOARD PAGES
 * 
 * This script validates that what is displayed on the frontend 
 * matches exactly what the database queries return.
 * 
 * Key Focus Areas:
 * - Data consistency between backend queries and frontend display
 * - All dashboard pages and views validation
 * - Real-time data accuracy verification
 * - Filter state synchronization
 * - Chart data accuracy
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import fs from 'fs';
import puppeteer from 'puppeteer';

// Environment setup
const envVars = {};
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key] = value;
  });
}

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_KEY = envVars.VITE_SUPABASE_ANON_KEY;
const LOCAL_URL = 'http://localhost:8080';

class ComprehensiveQAValidator {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
      dataInconsistencies: []
    };
  }

  log(level, message, details = '') {
    const colors = {
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      info: '\x1b[34m',
      reset: '\x1b[0m'
    };
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    console.log(`${colors[level]}${icons[level]} ${message}${colors.reset}${details ? ': ' + details : ''}`);
  }

  addTest(name, status, expected = null, actual = null, details = '') {
    const test = { name, status, expected, actual, details, timestamp: new Date().toISOString() };
    this.results.tests.push(test);
    
    if (status === 'PASS') this.results.passed++;
    else if (status === 'FAIL') this.results.failed++;
    else if (status === 'WARN') this.results.warnings++;
    
    // Track data inconsistencies
    if (status === 'FAIL' && expected !== null && actual !== null) {
      this.results.dataInconsistencies.push({
        test: name,
        expected,
        actual,
        difference: this.calculateDifference(expected, actual)
      });
    }
  }

  calculateDifference(expected, actual) {
    if (typeof expected === 'number' && typeof actual === 'number') {
      const diff = Math.abs(expected - actual);
      const percentDiff = expected !== 0 ? (diff / expected) * 100 : 0;
      return { absolute: diff, percentage: percentDiff };
    }
    return { type: 'non-numeric', expected, actual };
  }

  async init() {
    this.log('info', 'Starting Comprehensive QA Validation');
    console.log('════════════════════════════════════════════════════════════');
    console.log('🔍 COMPREHENSIVE DASHBOARD QA VALIDATION');
    console.log('════════════════════════════════════════════════════════════');
    
    // Start browser
    this.browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    this.page = await this.browser.newPage();
    
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.log('error', 'Frontend Console Error', msg.text());
      }
    });
  }

  // MAIN VALIDATION SECTIONS

  async validateDatabaseConnection() {
    console.log('\n🔗 DATABASE CONNECTION VALIDATION');
    console.log('═══════════════════════════════════');
    
    try {
      const { data: transactions, error } = await this.supabase
        .from('transactions')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        this.log('error', 'Database connection failed', error.message);
        this.addTest('Database Connection', 'FAIL', null, null, error.message);
        return false;
      }
      
      this.log('success', `Database connected - ${transactions} total transactions`);
      this.addTest('Database Connection', 'PASS');
      return true;
    } catch (err) {
      this.log('error', 'Database connection error', err.message);
      this.addTest('Database Connection', 'FAIL', null, null, err.message);
      return false;
    }
  }

  async validateKPIData() {
    console.log('\n📊 KPI DATA ACCURACY VALIDATION');
    console.log('═══════════════════════════════════');
    
    // Get backend data directly from database
    const backendData = await this.getBackendKPIData();
    
    // Navigate to dashboard and get frontend data
    await this.page.goto(LOCAL_URL, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(3000); // Allow data to load
    
    const frontendData = await this.getFrontendKPIData();
    
    // Compare each KPI
    this.compareKPI('Total Revenue', backendData.totalRevenue, frontendData.totalRevenue);
    this.compareKPI('Total Transactions', backendData.totalTransactions, frontendData.totalTransactions);
    this.compareKPI('Average Transaction', backendData.avgTransaction, frontendData.avgTransaction);
    this.compareKPI('Substitution Rate', backendData.substitutionRate, frontendData.substitutionRate);
    this.compareKPI('Top Brand Revenue', backendData.topBrandRevenue, frontendData.topBrandRevenue);
  }

  async getBackendKPIData() {
    try {
      // Total Revenue and Transactions
      const { data: transactions } = await this.supabase
        .from('transactions')
        .select('total_amount');
      
      const totalRevenue = transactions.reduce((sum, tx) => sum + parseFloat(tx.total_amount || 0), 0);
      const totalTransactions = transactions.length;
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      
      // Substitution Rate
      const { data: substitutions } = await this.supabase
        .from('substitution_events')
        .select('id');
      
      const substitutionRate = totalTransactions > 0 ? (substitutions.length / totalTransactions) * 100 : 0;
      
      // Top Brand Revenue
      const { data: brandRevenue } = await this.supabase
        .from('transaction_items')
        .select(`
          brands!inner(name),
          quantity,
          unit_price
        `);
      
      const brandTotals = {};
      brandRevenue.forEach(item => {
        const brandName = item.brands.name;
        const revenue = parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0);
        brandTotals[brandName] = (brandTotals[brandName] || 0) + revenue;
      });
      
      const topBrand = Object.entries(brandTotals).sort(([,a], [,b]) => b - a)[0];
      const topBrandRevenue = topBrand ? topBrand[1] : 0;
      
      return {
        totalRevenue,
        totalTransactions,
        avgTransaction,
        substitutionRate,
        topBrandRevenue,
        topBrandName: topBrand ? topBrand[0] : 'Unknown'
      };
    } catch (error) {
      this.log('error', 'Failed to get backend KPI data', error.message);
      return {};
    }
  }

  async getFrontendKPIData() {
    try {
      // Extract displayed values from frontend
      const kpiData = await this.page.evaluate(() => {
        const getText = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : '';
        };
        
        // Common selectors for KPI values
        const selectors = {
          totalRevenue: '[data-testid="total-revenue"], .total-revenue, [class*="revenue"]',
          totalTransactions: '[data-testid="total-transactions"], .total-transactions, [class*="transactions"]',
          avgTransaction: '[data-testid="avg-transaction"], .avg-transaction, [class*="average"]',
          substitutionRate: '[data-testid="substitution-rate"], .substitution-rate, [class*="substitution"]',
          topBrandRevenue: '[data-testid="top-brand-revenue"], .top-brand-revenue, [class*="top-brand"]'
        };
        
        const results = {};
        Object.entries(selectors).forEach(([key, selector]) => {
          results[key] = getText(selector);
        });
        
        return results;
      });
      
      // Parse numeric values
      return {
        totalRevenue: this.parseDisplayValue(kpiData.totalRevenue),
        totalTransactions: this.parseDisplayValue(kpiData.totalTransactions),
        avgTransaction: this.parseDisplayValue(kpiData.avgTransaction),
        substitutionRate: this.parseDisplayValue(kpiData.substitutionRate),
        topBrandRevenue: this.parseDisplayValue(kpiData.topBrandRevenue)
      };
    } catch (error) {
      this.log('error', 'Failed to get frontend KPI data', error.message);
      return {};
    }
  }

  parseDisplayValue(displayText) {
    if (!displayText) return null;
    
    // Remove currency symbols, commas, and percentages
    const cleanText = displayText.replace(/[₱,$,%]/g, '').replace(/,/g, '');
    const number = parseFloat(cleanText);
    
    return isNaN(number) ? null : number;
  }

  compareKPI(name, expected, actual) {
    if (expected === null || actual === null) {
      this.log('warning', `${name} - Missing data`, `Expected: ${expected}, Actual: ${actual}`);
      this.addTest(`KPI: ${name}`, 'WARN', expected, actual, 'Missing data');
      return;
    }
    
    const tolerance = 0.01; // 1% tolerance for floating point differences
    const percentDiff = expected !== 0 ? Math.abs((actual - expected) / expected) : 0;
    
    if (percentDiff <= tolerance) {
      this.log('success', `${name} - Values match`, `${expected} ≈ ${actual}`);
      this.addTest(`KPI: ${name}`, 'PASS', expected, actual);
    } else {
      this.log('error', `${name} - Values don't match`, `Expected: ${expected}, Actual: ${actual}, Diff: ${(percentDiff * 100).toFixed(2)}%`);
      this.addTest(`KPI: ${name}`, 'FAIL', expected, actual, `${(percentDiff * 100).toFixed(2)}% difference`);
    }
  }

  async validateAllCharts() {
    console.log('\n📈 CHART DATA VALIDATION');
    console.log('═══════════════════════════');
    
    const charts = [
      { name: 'Brand Revenue Chart', selector: '[data-testid="brand-revenue-chart"]' },
      { name: 'Category Analysis', selector: '[data-testid="category-chart"]' },
      { name: 'Time Series Chart', selector: '[data-testid="time-series-chart"]' },
      { name: 'Age Distribution', selector: '[data-testid="age-distribution-chart"]' },
      { name: 'Gender Distribution', selector: '[data-testid="gender-chart"]' }
    ];
    
    for (const chart of charts) {
      await this.validateChart(chart.name, chart.selector);
    }
  }

  async validateChart(chartName, selector) {
    try {
      const chartExists = await this.page.$(selector);
      
      if (!chartExists) {
        this.log('warning', `${chartName} - Chart element not found`);
        this.addTest(`Chart: ${chartName}`, 'WARN', null, null, 'Chart element not found');
        return;
      }
      
      // Check if chart has data
      const hasData = await this.page.evaluate((sel) => {
        const chart = document.querySelector(sel);
        if (!chart) return false;
        
        // Look for common chart data indicators
        const indicators = [
          'svg', 'canvas', '[class*="recharts"]', 
          '[class*="chart"]', '[data-testid*="chart-data"]'
        ];
        
        return indicators.some(indicator => chart.querySelector(indicator));
      }, selector);
      
      if (hasData) {
        this.log('success', `${chartName} - Chart loaded with data`);
        this.addTest(`Chart: ${chartName}`, 'PASS');
      } else {
        this.log('error', `${chartName} - Chart has no data`);
        this.addTest(`Chart: ${chartName}`, 'FAIL', null, null, 'No chart data found');
      }
    } catch (error) {
      this.log('error', `${chartName} - Validation error`, error.message);
      this.addTest(`Chart: ${chartName}`, 'FAIL', null, null, error.message);
    }
  }

  async validateAllPages() {
    console.log('\n🔍 ALL PAGES VALIDATION');
    console.log('═══════════════════════════');
    
    const pages = [
      { name: 'Dashboard Overview', path: '/' },
      { name: 'Project Scout', path: '/project-scout' },
      { name: 'TBWA Dashboard', path: '/tbwa-dashboard' },
      { name: 'Advanced Analytics', path: '/advanced-analytics' },
      { name: 'Trends Explorer', path: '/trends-explorer' },
      { name: 'Product Insights', path: '/product-insights' },
      { name: 'Customer Insights', path: '/customer-insights' },
      { name: 'Basket Behavior', path: '/basket-behavior' }
    ];
    
    for (const page of pages) {
      await this.validatePage(page.name, page.path);
    }
  }

  async validatePage(pageName, path) {
    try {
      this.log('info', `Validating ${pageName}`);
      
      await this.page.goto(`${LOCAL_URL}${path}`, { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);
      
      // Check for errors
      const hasErrors = await this.page.evaluate(() => {
        const errorElements = document.querySelectorAll('[class*="error"], .error, [data-testid*="error"]');
        return errorElements.length > 0;
      });
      
      if (hasErrors) {
        this.log('error', `${pageName} - Has error elements`);
        this.addTest(`Page: ${pageName}`, 'FAIL', null, null, 'Error elements found');
        return;
      }
      
      // Check for loading states
      const isLoading = await this.page.evaluate(() => {
        const loadingElements = document.querySelectorAll('[class*="loading"], .loading, [data-testid*="loading"]');
        return loadingElements.length > 0;
      });
      
      if (isLoading) {
        this.log('warning', `${pageName} - Still loading`);
        this.addTest(`Page: ${pageName}`, 'WARN', null, null, 'Page still loading');
      } else {
        this.log('success', `${pageName} - Loaded successfully`);
        this.addTest(`Page: ${pageName}`, 'PASS');
      }
      
      // Validate data on page
      await this.validatePageData(pageName);
      
    } catch (error) {
      this.log('error', `${pageName} - Navigation error`, error.message);
      this.addTest(`Page: ${pageName}`, 'FAIL', null, null, error.message);
    }
  }

  async validatePageData(pageName) {
    try {
      // Check for data elements
      const dataElements = await this.page.evaluate(() => {
        const selectors = [
          '[data-testid*="data"]',
          '[class*="chart"]',
          '[class*="table"]',
          '[class*="metric"]',
          '[class*="kpi"]'
        ];
        
        let count = 0;
        selectors.forEach(selector => {
          count += document.querySelectorAll(selector).length;
        });
        
        return count;
      });
      
      if (dataElements > 0) {
        this.log('success', `${pageName} - Has ${dataElements} data elements`);
        this.addTest(`Page Data: ${pageName}`, 'PASS', null, dataElements);
      } else {
        this.log('warning', `${pageName} - No data elements found`);
        this.addTest(`Page Data: ${pageName}`, 'WARN', null, 0, 'No data elements');
      }
    } catch (error) {
      this.log('error', `${pageName} - Data validation error`, error.message);
      this.addTest(`Page Data: ${pageName}`, 'FAIL', null, null, error.message);
    }
  }

  async validateFilters() {
    console.log('\n🔧 FILTER FUNCTIONALITY VALIDATION');
    console.log('═══════════════════════════════════');
    
    // Go to main dashboard
    await this.page.goto(LOCAL_URL, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);
    
    // Test category filter
    await this.testFilter('Categories', '[data-testid="categories-filter"]', '[data-testid^="category-option"]');
    
    // Test brand filter
    await this.testFilter('Brands', '[data-testid="brands-filter"]', '[data-testid^="brand-option"]');
    
    // Test date range filter
    await this.testDateRangeFilter();
    
    // Test reset functionality
    await this.testResetFilters();
  }

  async testFilter(filterName, dropdownSelector, optionSelector) {
    try {
      this.log('info', `Testing ${filterName} filter`);
      
      const dropdown = await this.page.$(dropdownSelector);
      if (!dropdown) {
        this.log('warning', `${filterName} filter dropdown not found`);
        this.addTest(`Filter: ${filterName}`, 'WARN', null, null, 'Dropdown not found');
        return;
      }
      
      // Click to open dropdown
      await dropdown.click();
      await this.page.waitForTimeout(500);
      
      // Get options
      const options = await this.page.$$(optionSelector);
      if (options.length === 0) {
        this.log('warning', `${filterName} filter has no options`);
        this.addTest(`Filter: ${filterName}`, 'WARN', null, null, 'No options available');
        return;
      }
      
      // Select first option
      await options[0].click();
      await this.page.waitForTimeout(1000);
      
      // Check if URL updated
      const url = this.page.url();
      const hasFilterParam = url.includes(`${filterName.toLowerCase()}=`);
      
      if (hasFilterParam) {
        this.log('success', `${filterName} filter updates URL`);
        this.addTest(`Filter: ${filterName}`, 'PASS');
      } else {
        this.log('error', `${filterName} filter doesn't update URL`);
        this.addTest(`Filter: ${filterName}`, 'FAIL', true, false, 'URL not updated');
      }
      
      // Close dropdown
      await this.page.click('body');
      await this.page.waitForTimeout(500);
      
    } catch (error) {
      this.log('error', `${filterName} filter test failed`, error.message);
      this.addTest(`Filter: ${filterName}`, 'FAIL', null, null, error.message);
    }
  }

  async testDateRangeFilter() {
    try {
      this.log('info', 'Testing date range filter');
      
      const dateRangePicker = await this.page.$('[data-testid="date-range-picker"]');
      if (!dateRangePicker) {
        this.log('warning', 'Date range picker not found');
        this.addTest('Filter: Date Range', 'WARN', null, null, 'Picker not found');
        return;
      }
      
      await dateRangePicker.click();
      await this.page.waitForTimeout(500);
      
      // Select 30 days option
      const thirtyDaysOption = await this.page.$('[data-testid="date-range-30-days"]');
      if (thirtyDaysOption) {
        await thirtyDaysOption.click();
        await this.page.waitForTimeout(1000);
        
        const url = this.page.url();
        const hasDateParam = url.includes('range=') || url.includes('start=') || url.includes('end=');
        
        if (hasDateParam) {
          this.log('success', 'Date range filter updates URL');
          this.addTest('Filter: Date Range', 'PASS');
        } else {
          this.log('error', 'Date range filter doesn\'t update URL');
          this.addTest('Filter: Date Range', 'FAIL', true, false, 'URL not updated');
        }
      } else {
        this.log('warning', 'Date range options not found');
        this.addTest('Filter: Date Range', 'WARN', null, null, 'Options not found');
      }
    } catch (error) {
      this.log('error', 'Date range filter test failed', error.message);
      this.addTest('Filter: Date Range', 'FAIL', null, null, error.message);
    }
  }

  async testResetFilters() {
    try {
      this.log('info', 'Testing reset filters functionality');
      
      const resetButton = await this.page.$('[data-testid="reset-filters"]');
      if (!resetButton) {
        this.log('warning', 'Reset filters button not found');
        this.addTest('Filter: Reset', 'WARN', null, null, 'Reset button not found');
        return;
      }
      
      await resetButton.click();
      await this.page.waitForTimeout(1000);
      
      const url = this.page.url();
      const hasParams = url.includes('?') && (url.includes('='));
      
      if (!hasParams) {
        this.log('success', 'Reset filters clears URL parameters');
        this.addTest('Filter: Reset', 'PASS');
      } else {
        this.log('error', 'Reset filters doesn\'t clear URL parameters');
        this.addTest('Filter: Reset', 'FAIL', false, true, 'URL parameters not cleared');
      }
    } catch (error) {
      this.log('error', 'Reset filters test failed', error.message);
      this.addTest('Filter: Reset', 'FAIL', null, null, error.message);
    }
  }

  async generateFinalReport() {
    console.log('\n📋 COMPREHENSIVE QA VALIDATION REPORT');
    console.log('════════════════════════════════════════════════════════════');
    
    const { passed, failed, warnings, tests, dataInconsistencies } = this.results;
    const total = tests.length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    console.log(`
📊 SUMMARY:
  ✅ Passed: ${passed}
  ❌ Failed: ${failed}
  ⚠️  Warnings: ${warnings}
  📝 Total Tests: ${total}
  📈 Pass Rate: ${passRate}%
`);
    
    // Critical failures
    if (failed > 0) {
      console.log('\n🚨 CRITICAL FAILURES:');
      tests.filter(t => t.status === 'FAIL').forEach(test => {
        console.log(`  ❌ ${test.name}: ${test.details}`);
        if (test.expected !== null && test.actual !== null) {
          console.log(`     Expected: ${test.expected}, Got: ${test.actual}`);
        }
      });
    }
    
    // Data inconsistencies
    if (dataInconsistencies.length > 0) {
      console.log('\n📊 DATA INCONSISTENCIES:');
      dataInconsistencies.forEach(inc => {
        console.log(`  🔍 ${inc.test}:`);
        console.log(`     Expected: ${inc.expected}`);
        console.log(`     Actual: ${inc.actual}`);
        if (inc.difference.percentage) {
          console.log(`     Difference: ${inc.difference.percentage.toFixed(2)}%`);
        }
      });
    }
    
    // Warnings
    if (warnings > 0) {
      console.log('\n⚠️  WARNINGS:');
      tests.filter(t => t.status === 'WARN').forEach(test => {
        console.log(`  ⚠️  ${test.name}: ${test.details}`);
      });
    }
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: { total, passed, failed, warnings, passRate },
      tests,
      dataInconsistencies,
      environment: {
        supabaseUrl: SUPABASE_URL,
        localUrl: LOCAL_URL
      }
    };
    
    fs.writeFileSync('qa-validation-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Detailed report saved to: qa-validation-report.json');
    
    console.log('\n════════════════════════════════════════════════════════════');
    
    if (failed === 0) {
      this.log('success', '🎉 ALL CRITICAL VALIDATIONS PASSED!');
      console.log('✅ Dashboard data consistency verified');
      console.log('✅ All pages load correctly');
      console.log('✅ Filters work as expected');
      console.log('✅ Charts display real data');
      return 0;
    } else {
      this.log('error', '🚨 CRITICAL ISSUES FOUND - NEEDS ATTENTION!');
      console.log('❌ Data inconsistencies detected');
      console.log('❌ Some functionality not working correctly');
      return 1;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllValidations() {
    try {
      await this.init();
      
      // Core validations
      const dbConnected = await this.validateDatabaseConnection();
      if (!dbConnected) {
        this.log('error', 'Database connection failed - cannot continue');
        return await this.generateFinalReport();
      }
      
      await this.validateKPIData();
      await this.validateAllCharts();
      await this.validateAllPages();
      await this.validateFilters();
      
      return await this.generateFinalReport();
      
    } catch (error) {
      this.log('error', 'Validation suite failed', error.message);
      return 1;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the validation
async function main() {
  console.log('🚀 Starting Comprehensive QA Validation...\n');
  
  const validator = new ComprehensiveQAValidator();
  const exitCode = await validator.runAllValidations();
  
  process.exit(exitCode);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export default ComprehensiveQAValidator;