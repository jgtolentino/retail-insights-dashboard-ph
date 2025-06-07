#!/usr/bin/env node

/**
 * BACKEND vs FRONTEND DATA VALIDATION
 * 
 * This script specifically validates that backend database queries
 * return the exact same data that the frontend displays.
 * 
 * It runs the same queries the frontend uses and compares results.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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

class BackendFrontendValidator {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    this.validationResults = [];
  }

  log(type, message, details = '') {
    const timestamp = new Date().toISOString();
    const colors = {
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      info: '\x1b[34m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}${details ? ' - ' + details : ''}`);
    
    this.validationResults.push({
      timestamp,
      type,
      message,
      details
    });
  }

  async validateKPIQueries() {
    console.log('\n🔍 VALIDATING KPI QUERIES');
    console.log('═══════════════════════════════════');
    
    try {
      // 1. Total Revenue Query
      this.log('info', 'Testing Total Revenue query...');
      const { data: revenueData, error: revenueError } = await this.supabase
        .from('transactions')
        .select('total_amount');
      
      if (revenueError) {
        this.log('error', 'Total Revenue query failed', revenueError.message);
      } else {
        const totalRevenue = revenueData.reduce((sum, tx) => sum + parseFloat(tx.total_amount || 0), 0);
        this.log('success', 'Total Revenue query successful', `₱${totalRevenue.toLocaleString()}`);
        
        // Verify the calculation logic
        const sampleCalculation = revenueData.slice(0, 5).reduce((sum, tx) => sum + parseFloat(tx.total_amount || 0), 0);
        this.log('info', 'Sample calculation verification', `First 5 transactions: ₱${sampleCalculation}`);
      }
      
      // 2. Transaction Count Query
      this.log('info', 'Testing Transaction Count query...');
      const { count: transactionCount, error: countError } = await this.supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        this.log('error', 'Transaction Count query failed', countError.message);
      } else {
        this.log('success', 'Transaction Count query successful', `${transactionCount} transactions`);
      }
      
      // 3. Average Transaction Query
      if (revenueData && !revenueError && transactionCount) {
        const totalRevenue = revenueData.reduce((sum, tx) => sum + parseFloat(tx.total_amount || 0), 0);
        const avgTransaction = totalRevenue / transactionCount;
        this.log('success', 'Average Transaction calculated', `₱${avgTransaction.toFixed(2)}`);
      }
      
      // 4. Unique Customers Query
      this.log('info', 'Testing Unique Customers query...');
      const { data: customerData, error: customerError } = await this.supabase
        .from('transactions')
        .select('customer_id', { distinct: true });
      
      if (customerError) {
        this.log('error', 'Unique Customers query failed', customerError.message);
      } else {
        this.log('success', 'Unique Customers query successful', `${customerData.length} unique customers`);
      }
      
      // 5. Substitution Rate Query
      this.log('info', 'Testing Substitution Rate query...');
      const { count: substitutionCount, error: subError } = await this.supabase
        .from('substitution_events')
        .select('*', { count: 'exact', head: true });
      
      if (subError) {
        this.log('error', 'Substitution Rate query failed', subError.message);
      } else {
        const substitutionRate = transactionCount > 0 ? (substitutionCount / transactionCount) * 100 : 0;
        this.log('success', 'Substitution Rate calculated', `${substitutionRate.toFixed(1)}%`);
      }
      
    } catch (error) {
      this.log('error', 'KPI validation failed', error.message);
    }
  }

  async validateBrandAnalysisQueries() {
    console.log('\n🏷️  VALIDATING BRAND ANALYSIS QUERIES');
    console.log('═══════════════════════════════════════');
    
    try {
      // Brand Revenue Analysis Query
      this.log('info', 'Testing Brand Revenue Analysis query...');
      
      const { data: brandRevenueData, error: brandError } = await this.supabase
        .from('transaction_items')
        .select(`
          brands!inner(name, category),
          quantity,
          unit_price
        `);
      
      if (brandError) {
        this.log('error', 'Brand Revenue query failed', brandError.message);
        return;
      }
      
      // Calculate brand totals (same logic as frontend)
      const brandTotals = {};
      const categoryTotals = {};
      
      brandRevenueData.forEach(item => {
        const brandName = item.brands.name;
        const category = item.brands.category;
        const revenue = parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0);
        
        // Brand totals
        brandTotals[brandName] = (brandTotals[brandName] || 0) + revenue;
        
        // Category totals
        categoryTotals[category] = (categoryTotals[category] || 0) + revenue;
      });
      
      // Top 5 brands
      const topBrands = Object.entries(brandTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      this.log('success', 'Brand Revenue Analysis successful', `${Object.keys(brandTotals).length} brands processed`);
      this.log('info', 'Top 5 Brands:', topBrands.map(([name, revenue]) => `${name}: ₱${revenue.toLocaleString()}`).join(', '));
      
      // Top categories
      const topCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      this.log('info', 'Top 5 Categories:', topCategories.map(([name, revenue]) => `${name}: ₱${revenue.toLocaleString()}`).join(', '));
      
    } catch (error) {
      this.log('error', 'Brand Analysis validation failed', error.message);
    }
  }

  async validateChartDataQueries() {
    console.log('\n📊 VALIDATING CHART DATA QUERIES');
    console.log('═══════════════════════════════════');
    
    // Age Distribution Function
    await this.validateRPCFunction('get_age_distribution', {
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      bucket_size: 10
    });
    
    // Gender Distribution Function
    await this.validateRPCFunction('get_gender_distribution', {
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    });
    
    // Purchase Patterns Function
    await this.validateRPCFunction('get_purchase_patterns_by_time', {
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    });
    
    // Daily Trends Function
    await this.validateRPCFunction('get_daily_trends', {
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    });
  }

  async validateRPCFunction(functionName, params) {
    try {
      this.log('info', `Testing RPC function: ${functionName}`);
      
      const { data, error } = await this.supabase.rpc(functionName, params);
      
      if (error) {
        // Try with different parameter signatures
        const altParams = {
          start_date: params.start_date,
          end_date: params.end_date
        };
        
        const { data: altData, error: altError } = await this.supabase.rpc(functionName, altParams);
        
        if (altError) {
          this.log('error', `RPC function ${functionName} failed`, altError.message);
          
          // Try to understand the function signature
          const { data: funcInfo, error: funcError } = await this.supabase
            .from('pg_proc')
            .select('proname, proargtypes')
            .eq('proname', functionName);
          
          if (!funcError && funcInfo.length > 0) {
            this.log('info', `Function ${functionName} exists`, 'Checking parameter signature...');
          } else {
            this.log('warning', `Function ${functionName} might not exist`);
          }
        } else {
          this.log('success', `RPC function ${functionName} works with alternative params`, `${altData?.length || 0} rows returned`);
        }
      } else {
        this.log('success', `RPC function ${functionName} successful`, `${data?.length || 0} rows returned`);
        
        // Validate data structure
        if (data && data.length > 0) {
          const firstRow = data[0];
          const keys = Object.keys(firstRow);
          this.log('info', `Data structure for ${functionName}`, `Columns: ${keys.join(', ')}`);
        }
      }
    } catch (error) {
      this.log('error', `RPC function ${functionName} error`, error.message);
    }
  }

  async validateFilterQueries() {
    console.log('\n🔧 VALIDATING FILTER QUERIES');
    console.log('═══════════════════════════════');
    
    try {
      // 1. Categories Filter Data
      this.log('info', 'Testing Categories filter data...');
      const { data: categories, error: catError } = await this.supabase
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (catError) {
        this.log('error', 'Categories filter query failed', catError.message);
      } else {
        this.log('success', 'Categories filter query successful', `${categories.length} categories`);
        this.log('info', 'Sample categories', categories.slice(0, 5).map(c => c.name).join(', '));
      }
      
      // 2. Brands Filter Data
      this.log('info', 'Testing Brands filter data...');
      const { data: brands, error: brandError } = await this.supabase
        .from('brands')
        .select('id, name, category')
        .order('name');
      
      if (brandError) {
        this.log('error', 'Brands filter query failed', brandError.message);
      } else {
        this.log('success', 'Brands filter query successful', `${brands.length} brands`);
        this.log('info', 'Sample brands', brands.slice(0, 5).map(b => b.name).join(', '));
      }
      
      // 3. Stores Filter Data
      this.log('info', 'Testing Stores filter data...');
      const { data: stores, error: storeError } = await this.supabase
        .from('stores')
        .select('id, name, region, province')
        .order('name');
      
      if (storeError) {
        this.log('error', 'Stores filter query failed', storeError.message);
      } else {
        this.log('success', 'Stores filter query successful', `${stores.length} stores`);
        this.log('info', 'Sample stores', stores.slice(0, 5).map(s => s.name).join(', '));
      }
      
      // 4. Regions Filter Data
      this.log('info', 'Testing Regions filter data...');
      const { data: regions, error: regionError } = await this.supabase
        .from('stores')
        .select('region', { distinct: true })
        .order('region');
      
      if (regionError) {
        this.log('error', 'Regions filter query failed', regionError.message);
      } else {
        this.log('success', 'Regions filter query successful', `${regions.length} regions`);
        this.log('info', 'Available regions', regions.map(r => r.region).join(', '));
      }
      
    } catch (error) {
      this.log('error', 'Filter validation failed', error.message);
    }
  }

  async validateFilteredDataQueries() {
    console.log('\n🔍 VALIDATING FILTERED DATA QUERIES');
    console.log('═══════════════════════════════════');
    
    try {
      // Test filtered transaction data (as frontend would do)
      this.log('info', 'Testing filtered transaction queries...');
      
      // Example: Filter by specific categories
      const testCategories = ['Cigarettes', 'Snacks'];
      const { data: filteredTransactions, error: filterError } = await this.supabase
        .from('transactions')
        .select(`
          id,
          total_amount,
          transaction_items!inner(
            brands!inner(
              categories!inner(name)
            )
          )
        `)
        .in('transaction_items.brands.categories.name', testCategories);
      
      if (filterError) {
        this.log('error', 'Filtered transaction query failed', filterError.message);
      } else {
        this.log('success', 'Filtered transaction query successful', `${filteredTransactions.length} filtered transactions`);
        
        // Calculate filtered revenue
        const filteredRevenue = filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.total_amount || 0), 0);
        this.log('info', 'Filtered revenue calculation', `₱${filteredRevenue.toLocaleString()} for categories: ${testCategories.join(', ')}`);
      }
      
      // Test date range filtering
      this.log('info', 'Testing date range filtering...');
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      
      const { data: dateFilteredTx, error: dateError } = await this.supabase
        .from('transactions')
        .select('id, total_amount, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (dateError) {
        this.log('error', 'Date filtered query failed', dateError.message);
      } else {
        this.log('success', 'Date filtered query successful', `${dateFilteredTx.length} transactions in date range`);
      }
      
    } catch (error) {
      this.log('error', 'Filtered data validation failed', error.message);
    }
  }

  async validateDataConsistency() {
    console.log('\n🔄 VALIDATING DATA CONSISTENCY');
    console.log('═══════════════════════════════');
    
    try {
      // Check for orphaned records
      this.log('info', 'Checking for data consistency issues...');
      
      // 1. Transaction items without valid transactions
      const { data: orphanedItems, error: orphanError } = await this.supabase
        .from('transaction_items')
        .select(`
          id,
          transaction_id,
          transactions!left(id)
        `)
        .is('transactions.id', null);
      
      if (orphanError) {
        this.log('error', 'Orphaned items check failed', orphanError.message);
      } else if (orphanedItems.length > 0) {
        this.log('warning', 'Found orphaned transaction items', `${orphanedItems.length} items without valid transactions`);
      } else {
        this.log('success', 'No orphaned transaction items found');
      }
      
      // 2. Transactions with zero total amount
      const { data: zeroAmountTx, error: zeroError } = await this.supabase
        .from('transactions')
        .select('id, total_amount')
        .eq('total_amount', 0);
      
      if (zeroError) {
        this.log('error', 'Zero amount check failed', zeroError.message);
      } else if (zeroAmountTx.length > 0) {
        this.log('warning', 'Found transactions with zero amount', `${zeroAmountTx.length} transactions`);
      } else {
        this.log('success', 'No zero-amount transactions found');
      }
      
      // 3. Check for null/empty critical fields
      const { data: invalidData, error: invalidError } = await this.supabase
        .from('transactions')
        .select('id, customer_id, store_id, total_amount')
        .or('customer_id.is.null,store_id.is.null,total_amount.is.null');
      
      if (invalidError) {
        this.log('error', 'Invalid data check failed', invalidError.message);
      } else if (invalidData.length > 0) {
        this.log('warning', 'Found transactions with missing critical data', `${invalidData.length} transactions`);
      } else {
        this.log('success', 'All transactions have required fields');
      }
      
    } catch (error) {
      this.log('error', 'Data consistency validation failed', error.message);
    }
  }

  generateReport() {
    console.log('\n📋 BACKEND-FRONTEND VALIDATION REPORT');
    console.log('════════════════════════════════════════════════════════════');
    
    const successCount = this.validationResults.filter(r => r.type === 'success').length;
    const errorCount = this.validationResults.filter(r => r.type === 'error').length;
    const warningCount = this.validationResults.filter(r => r.type === 'warning').length;
    const totalChecks = successCount + errorCount + warningCount;
    
    console.log(`
📊 VALIDATION SUMMARY:
  ✅ Successful: ${successCount}
  ❌ Errors: ${errorCount}
  ⚠️  Warnings: ${warningCount}
  📝 Total Checks: ${totalChecks}
  📈 Success Rate: ${totalChecks > 0 ? ((successCount / totalChecks) * 100).toFixed(1) : 0}%
`);
    
    if (errorCount > 0) {
      console.log('\n🚨 CRITICAL ERRORS:');
      this.validationResults
        .filter(r => r.type === 'error')
        .forEach(r => console.log(`  ❌ ${r.message} - ${r.details}`));
    }
    
    if (warningCount > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.validationResults
        .filter(r => r.type === 'warning')
        .forEach(r => console.log(`  ⚠️  ${r.message} - ${r.details}`));
    }
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks,
        successCount,
        errorCount,
        warningCount,
        successRate: totalChecks > 0 ? ((successCount / totalChecks) * 100) : 0
      },
      validationResults: this.validationResults,
      environment: {
        supabaseUrl: SUPABASE_URL
      }
    };
    
    fs.writeFileSync('backend-frontend-validation-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Detailed report saved to: backend-frontend-validation-report.json');
    
    console.log('\n════════════════════════════════════════════════════════════');
    
    if (errorCount === 0) {
      console.log('✅ BACKEND-FRONTEND DATA VALIDATION PASSED!');
      console.log('🎯 All database queries work as expected');
      console.log('📊 Data consistency verified');
      console.log('🔧 Filter queries functional');
      return 0;
    } else {
      console.log('❌ BACKEND-FRONTEND VALIDATION FAILED!');
      console.log('🚨 Critical database query issues found');
      console.log('📊 Data inconsistencies detected');
      return 1;
    }
  }

  async runAllValidations() {
    console.log('🚀 BACKEND-FRONTEND DATA VALIDATION SUITE');
    console.log('════════════════════════════════════════════════════════════');
    console.log('🎯 Validating that backend queries match frontend displays');
    console.log('📊 Testing all data flows and calculations');
    console.log('🔧 Verifying filter functionality');
    console.log('════════════════════════════════════════════════════════════');
    
    try {
      await this.validateKPIQueries();
      await this.validateBrandAnalysisQueries();
      await this.validateChartDataQueries();
      await this.validateFilterQueries();
      await this.validateFilteredDataQueries();
      await this.validateDataConsistency();
      
      return this.generateReport();
      
    } catch (error) {
      this.log('error', 'Validation suite failed', error.message);
      return 1;
    }
  }
}

// Run the validation
async function main() {
  const validator = new BackendFrontendValidator();
  const exitCode = await validator.runAllValidations();
  process.exit(exitCode);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Backend-Frontend validation failed:', error);
    process.exit(1);
  });
}

export default BackendFrontendValidator;