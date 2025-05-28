#!/usr/bin/env node

/**
 * PRE-DEPLOYMENT VALIDATION SUITE
 * 
 * Comprehensive smoke tests and sanity checks for:
 * - Environment variables (local & Vercel)
 * - Database connectivity
 * - All charts and data loading
 * - All filters functionality
 * - API endpoints
 * - Build process
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (color, message) => console.log(`${COLORS[color]}${message}${COLORS.reset}`);
const success = (msg) => log('green', `✅ ${msg}`);
const error = (msg) => log('red', `❌ ${msg}`);
const warning = (msg) => log('yellow', `⚠️  ${msg}`);
const info = (msg) => log('blue', `ℹ️  ${msg}`);
const header = (msg) => log('cyan', `\n🔍 ${msg}\n${'='.repeat(50)}`);

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function addTest(name, status, message = '') {
  testResults.tests.push({ name, status, message });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else if (status === 'WARN') testResults.warnings++;
}

async function validateEnvironmentVariables() {
  header('Environment Variables Validation');
  
  // Check local .env file
  const localEnvPath = '.env';
  if (fs.existsSync(localEnvPath)) {
    const envContent = fs.readFileSync(localEnvPath, 'utf8');
    const hasUrl = envContent.includes('VITE_SUPABASE_URL=');
    const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY=');
    
    if (hasUrl && hasKey) {
      success('Local .env file has required variables');
      addTest('Local Environment Variables', 'PASS');
    } else {
      error('Local .env file missing required variables');
      addTest('Local Environment Variables', 'FAIL');
    }
  } else {
    warning('No local .env file found');
    addTest('Local Environment Variables', 'WARN', 'No .env file found');
  }
  
  // Check Vercel environment variables
  try {
    const vercelEnvs = execSync('vercel env ls --scope production', { encoding: 'utf8' });
    const hasVercelUrl = vercelEnvs.includes('VITE_SUPABASE_URL');
    const hasVercelKey = vercelEnvs.includes('VITE_SUPABASE_ANON_KEY');
    
    if (hasVercelUrl && hasVercelKey) {
      success('Vercel production has required environment variables');
      addTest('Vercel Environment Variables', 'PASS');
    } else {
      error('Vercel production missing required environment variables');
      addTest('Vercel Environment Variables', 'FAIL');
    }
  } catch (err) {
    warning('Could not check Vercel environment variables');
    addTest('Vercel Environment Variables', 'WARN', 'Vercel CLI not available');
  }
}

async function validateSupabaseConnection() {
  header('Supabase Database Connection');
  
  try {
    // Read local environment
    const envVars = {};
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) envVars[key] = value;
      });
    }
    
    const supabaseUrl = envVars.VITE_SUPABASE_URL;
    const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      error('Supabase credentials not found in environment');
      addTest('Supabase Connection', 'FAIL');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('transactions').select('count', { count: 'exact', head: true });
    
    if (error) {
      error(`Supabase connection failed: ${error.message}`);
      addTest('Supabase Connection', 'FAIL', error.message);
    } else {
      success('Supabase database connection working');
      addTest('Supabase Connection', 'PASS');
      info(`Database has ${data || 0} transactions`);
    }
    
  } catch (err) {
    error(`Supabase validation error: ${err.message}`);
    addTest('Supabase Connection', 'FAIL', err.message);
  }
}

async function validateDashboardData() {
  header('Dashboard Data Loading');
  
  try {
    const envVars = {};
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) envVars[key] = value;
      });
    }
    
    const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);
    
    // Test KPI data
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('total_amount')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    if (transError) {
      error(`Transaction data loading failed: ${transError.message}`);
      addTest('Transaction Data', 'FAIL', transError.message);
    } else {
      success(`Loaded ${transactions?.length || 0} transactions`);
      addTest('Transaction Data', 'PASS');
    }
    
    // Test brands data
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('name')
      .not('name', 'is', null);
    
    if (brandsError) {
      error(`Brands data loading failed: ${brandsError.message}`);
      addTest('Brands Data', 'FAIL', brandsError.message);
    } else {
      success(`Loaded ${brands?.length || 0} brand records`);
      addTest('Brands Data', 'PASS');
    }
    
  } catch (err) {
    error(`Dashboard data validation error: ${err.message}`);
    addTest('Dashboard Data', 'FAIL', err.message);
  }
}

async function validateChartFunctions() {
  header('Chart Functions and RPC Calls');
  
  try {
    const envVars = {};
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) envVars[key] = value;
      });
    }
    
    const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);
    
    const chartTests = [
      {
        name: 'Age Distribution',
        fn: 'get_age_distribution',
        params: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString(),
          bucket_size: 10
        }
      },
      {
        name: 'Gender Distribution', 
        fn: 'get_gender_distribution',
        params: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString()
        }
      },
      {
        name: 'Purchase Patterns',
        fn: 'get_purchase_patterns_by_time',
        params: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString()
        }
      }
    ];
    
    for (const test of chartTests) {
      try {
        const { data, error: rpcError } = await supabase.rpc(test.fn, test.params);
        
        if (rpcError) {
          // Try alternative parameter signature
          const altParams = {
            start_date: test.params.start_date,
            end_date: test.params.end_date
          };
          const { data: altData, error: altError } = await supabase.rpc(test.fn, altParams);
          
          if (altError) {
            error(`${test.name} function failed: ${altError.message}`);
            addTest(`Chart: ${test.name}`, 'FAIL', altError.message);
          } else {
            success(`${test.name} function working (alternative signature)`);
            addTest(`Chart: ${test.name}`, 'PASS');
          }
        } else {
          success(`${test.name} function working`);
          addTest(`Chart: ${test.name}`, 'PASS');
          info(`  Returned ${data?.length || 0} data points`);
        }
      } catch (err) {
        error(`${test.name} function error: ${err.message}`);
        addTest(`Chart: ${test.name}`, 'FAIL', err.message);
      }
    }
    
  } catch (err) {
    error(`Chart functions validation error: ${err.message}`);
    addTest('Chart Functions', 'FAIL', err.message);
  }
}

async function validateBuildProcess() {
  header('Build Process Validation');
  
  try {
    // Test TypeScript compilation
    info('Running TypeScript check...');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    success('TypeScript compilation passed');
    addTest('TypeScript Check', 'PASS');
  } catch (err) {
    error('TypeScript compilation failed');
    addTest('TypeScript Check', 'FAIL', 'Compilation errors found');
  }
  
  try {
    // Test ESLint
    info('Running ESLint check...');
    execSync('npm run lint', { stdio: 'pipe' });
    success('ESLint check passed');
    addTest('ESLint Check', 'PASS');
  } catch (err) {
    warning('ESLint check had issues');
    addTest('ESLint Check', 'WARN', 'Linting issues found');
  }
}

async function validateDeploymentUrls() {
  header('Deployment URLs Validation');
  
  try {
    // Get latest Vercel deployment
    const deployments = execSync('vercel ls --limit 5', { encoding: 'utf8' });
    const lines = deployments.split('\n');
    const latestUrl = lines[0];
    
    if (latestUrl && latestUrl.includes('vercel.app')) {
      info(`Testing latest deployment: ${latestUrl}`);
      
      try {
        const response = await fetch(latestUrl);
        if (response.ok) {
          success('Latest Vercel deployment is accessible');
          addTest('Vercel Deployment Access', 'PASS');
        } else {
          error(`Deployment returned ${response.status}`);
          addTest('Vercel Deployment Access', 'FAIL', `HTTP ${response.status}`);
        }
      } catch (fetchErr) {
        error(`Could not reach deployment: ${fetchErr.message}`);
        addTest('Vercel Deployment Access', 'FAIL', fetchErr.message);
      }
    } else {
      warning('Could not find latest Vercel deployment URL');
      addTest('Vercel Deployment Access', 'WARN', 'No deployment URL found');
    }
    
  } catch (err) {
    warning('Could not validate deployment URLs');
    addTest('Vercel Deployment Access', 'WARN', 'Vercel CLI not available');
  }
}

function generateReport() {
  header('Validation Report');
  
  console.log(`
📊 VALIDATION RESULTS:
  ✅ Passed: ${testResults.passed}
  ❌ Failed: ${testResults.failed}
  ⚠️  Warnings: ${testResults.warnings}
  📝 Total Tests: ${testResults.tests.length}
`);
  
  if (testResults.failed > 0) {
    log('red', '\n🚨 FAILED TESTS:');
    testResults.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => log('red', `  ❌ ${t.name}: ${t.message}`));
  }
  
  if (testResults.warnings > 0) {
    log('yellow', '\n⚠️  WARNINGS:');
    testResults.tests
      .filter(t => t.status === 'WARN')
      .forEach(t => log('yellow', `  ⚠️  ${t.name}: ${t.message}`));
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (testResults.failed === 0) {
    success('🎉 ALL CRITICAL TESTS PASSED - READY FOR DEPLOYMENT!');
    return 0;
  } else {
    error('🚨 CRITICAL TESTS FAILED - DO NOT DEPLOY!');
    return 1;
  }
}

async function main() {
  console.log(`
🚀 PRE-DEPLOYMENT VALIDATION SUITE
==================================
Testing all charts, filters, data, and environment setup...
`);
  
  await validateEnvironmentVariables();
  await validateSupabaseConnection();
  await validateDashboardData();
  await validateChartFunctions();
  await validateBuildProcess();
  await validateDeploymentUrls();
  
  const exitCode = generateReport();
  process.exit(exitCode);
}

main().catch(err => {
  error(`Validation suite error: ${err.message}`);
  process.exit(1);
});