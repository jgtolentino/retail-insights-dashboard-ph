#!/usr/bin/env node

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// Supabase Management API approach
// Note: This requires a Supabase access token, not just the service key

const PROJECT_REF = 'lcoxtanyckjzyxxcsjzz';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk';

async function executeViaManagementAPI() {
  console.log('🚀 Sprint 4 Migration via Supabase Management API\n');
  
  // Note: The Supabase Management API requires authentication via Supabase Dashboard
  // The service key alone isn't sufficient for management operations
  
  console.log('⚠️  Important: Direct SQL execution via API requires additional authentication.\n');
  console.log('📋 Here are your options to apply the Sprint 4 migrations:\n');
  
  console.log('1️⃣  RECOMMENDED - Supabase SQL Editor (Web UI):');
  console.log('   a. Open: https://app.supabase.com/project/' + PROJECT_REF + '/sql/new');
  console.log('   b. Copy the content from: migrations/sprint4_combined.sql');
  console.log('   c. Paste into the SQL editor');
  console.log('   d. Click "Run" button\n');
  
  console.log('2️⃣  Using the migration script with password:');
  console.log('   a. Get your database password from:');
  console.log('      https://app.supabase.com/project/' + PROJECT_REF + '/settings/database');
  console.log('   b. Run: ./scripts/apply-sprint4-final.sh');
  console.log('   c. Enter the password when prompted\n');
  
  console.log('3️⃣  Using environment variable:');
  console.log('   export SUPABASE_DB_PASSWORD="your-database-password"');
  console.log('   ./scripts/apply-sprint4-final.sh\n');
  
  // Create a verification script
  const verifyScript = `
// Verification script to check if migrations were applied
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://${PROJECT_REF}.supabase.co',
  '${SERVICE_KEY}'
);

async function verifyMigrations() {
  console.log('🔍 Verifying Sprint 4 migrations...\\n');
  
  // Check if new tables exist
  const { data: tables, error: tablesError } = await supabase
    .from('substitutions')
    .select('count')
    .limit(1);
  
  if (tablesError && tablesError.code === '42P01') {
    console.log('❌ Table "substitutions" not found - migrations not applied yet');
  } else if (!tablesError) {
    console.log('✅ Table "substitutions" exists');
  }
  
  // Check if new columns exist in transactions
  const { data: transaction, error: transError } = await supabase
    .from('transactions')
    .select('payment_method, checkout_time, request_type')
    .limit(1);
  
  if (transError) {
    console.log('❌ New columns not found in transactions table');
  } else {
    console.log('✅ New columns exist in transactions table');
  }
  
  // Test one of the new functions
  const { data: funcTest, error: funcError } = await supabase
    .rpc('get_payment_method_analysis');
  
  if (funcError) {
    console.log('❌ New functions not found');
  } else {
    console.log('✅ New analytics functions are available');
  }
  
  console.log('\\n📊 Migration verification complete!');
}

verifyMigrations().catch(console.error);
`;

  // Save verification script
  const verifyPath = path.join(__dirname, 'verify-sprint4-migrations.js');
  await fs.writeFile(verifyPath, verifyScript.trim());
  console.log('💾 Created verification script: ' + verifyPath);
  console.log('   Run after applying migrations: node ' + verifyPath + '\n');
  
  // Show migration summary
  console.log('📊 Sprint 4 Migration Summary:');
  console.log('================================');
  console.log('• New Tables: substitutions, request_behaviors');
  console.log('• New Columns: payment_method, checkout_time, request_type, etc.');
  console.log('• New Functions: 7 advanced analytics functions');
  console.log('• Performance: 7 new indexes + 1 materialized view');
  console.log('• Sample Data: ~2,500 records for testing\n');
  
  console.log('🎯 Quick Start:');
  console.log('1. Copy this URL: https://app.supabase.com/project/' + PROJECT_REF + '/sql/new');
  console.log('2. Open in your browser');
  console.log('3. Paste content from migrations/sprint4_combined.sql');
  console.log('4. Click Run\n');
}

// Run the script
executeViaManagementAPI().catch(console.error);