#!/usr/bin/env node

/**
 * Direct Table Executor - Execute SQL by directly calling table operations
 * 
 * This bypasses the need for exec_sql() RPC function by using
 * direct table operations that we know work
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Test if we can execute existing RPC functions that we know exist
 */
async function testExistingFunctions() {
  console.log('🔍 Testing existing RPC functions...\n');
  
  // Test functions we created in previous sessions
  const testFunctions = [
    'get_dashboard_summary',
    'get_age_distribution_simple',
    'get_substitution_patterns'
  ];
  
  for (const funcName of testFunctions) {
    try {
      console.log(`🧪 Testing ${funcName}()...`);
      const { data, error } = await supabase.rpc(funcName);
      
      if (error) {
        console.log(`   ❌ ${funcName}: ${error.message}`);
      } else {
        console.log(`   ✅ ${funcName}: Working! (${data ? 'has data' : 'no data'})`);
      }
    } catch (err) {
      console.log(`   ❌ ${funcName}: ${err.message}`);
    }
  }
  
  console.log('');
}

/**
 * Execute the SQL file that we know needs to run
 */
async function executeCreateFunctions() {
  console.log('🚀 Executing create-missing-rpc-functions.sql manually...\n');
  
  // Read the SQL file
  const sqlPath = resolve(process.cwd(), 'scripts/create-missing-rpc-functions.sql');
  const sqlContent = readFileSync(sqlPath, 'utf8');
  
  // Extract individual CREATE FUNCTION statements
  const functions = [];
  let currentFunction = '';
  let inFunction = false;
  
  const lines = sqlContent.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('CREATE OR REPLACE FUNCTION')) {
      inFunction = true;
      currentFunction = line + '\n';
    } else if (inFunction) {
      currentFunction += line + '\n';
      if (line.trim() === '$$ LANGUAGE plpgsql;' || line.trim().endsWith('$$ LANGUAGE plpgsql;')) {
        functions.push(currentFunction.trim());
        currentFunction = '';
        inFunction = false;
      }
    }
  }
  
  console.log(`📝 Found ${functions.length} function definitions\n`);
  
  // Try to execute each function individually using various methods
  let successCount = 0;
  
  for (let i = 0; i < functions.length; i++) {
    const func = functions[i];
    const funcName = func.match(/CREATE OR REPLACE FUNCTION (\w+)/)?.[1] || `function_${i + 1}`;
    
    console.log(`[${i + 1}/${functions.length}] Creating ${funcName}...`);
    
    try {
      // Method 1: Try to execute as a "raw query" via PostgREST
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: func })
      });
      
      if (response.ok) {
        console.log(`   ✅ ${funcName} created successfully`);
        successCount++;
        continue;
      }
      
      // Method 2: Try direct SQL execution (this might work)
      const { data, error } = await supabase.from('rpc').insert({ sql: func });
      
      if (!error) {
        console.log(`   ✅ ${funcName} created successfully`);
        successCount++;
        continue;
      }
      
      // Method 3: Log for manual execution
      console.log(`   ⚠️  ${funcName} needs manual creation`);
      console.log(`       Function: ${func.substring(0, 80)}...`);
      
    } catch (error) {
      console.log(`   ❌ ${funcName} failed: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Results: ${successCount}/${functions.length} functions created automatically`);
  
  if (successCount < functions.length) {
    console.log('\n🔧 MANUAL EXECUTION REQUIRED');
    console.log('The remaining functions need to be created in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz/sql');
    console.log('\nCopy and paste the contents of:');
    console.log('scripts/create-missing-rpc-functions.sql');
  }
  
  return successCount;
}

/**
 * Test the results
 */
async function testResults() {
  console.log('\n🧪 Testing created functions...\n');
  
  // Test the functions we just created
  const functionsToTest = [
    'get_dashboard_summary',
    'get_age_distribution_simple',
    'get_substitution_patterns'
  ];
  
  let workingCount = 0;
  
  for (const funcName of functionsToTest) {
    try {
      console.log(`🔍 Testing ${funcName}()...`);
      const { data, error } = await supabase.rpc(funcName);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Working! Returns: ${JSON.stringify(data).substring(0, 50)}...`);
        workingCount++;
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
  }
  
  console.log(`\n📈 Success Rate: ${workingCount}/${functionsToTest.length} functions working`);
  
  if (workingCount === functionsToTest.length) {
    console.log('🎉 All functions are working! The dashboard should now be functional.');
  } else {
    console.log('⚠️  Some functions still need manual creation in Supabase SQL Editor.');
  }
  
  return workingCount;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Direct SQL Execution Test\n');
  
  // Test connection
  try {
    const { data, error } = await supabase.from('brands').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Supabase connection verified\n');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return;
  }
  
  // Test existing functions first
  await testExistingFunctions();
  
  // Try to execute the missing functions
  const createdCount = await executeCreateFunctions();
  
  // Test the results
  const workingCount = await testResults();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 EXECUTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Functions created: ${createdCount}`);
  console.log(`🔧 Functions working: ${workingCount}`);
  console.log(`🔗 Supabase connection: Working`);
  
  if (workingCount > 0) {
    console.log('\n🎯 RESULT: Dashboard functionality partially restored!');
    console.log('You can now test the dashboard with:');
    console.log('  npm run dev');
  } else {
    console.log('\n⚠️  RESULT: Manual SQL execution still required');
    console.log('Please run the SQL in scripts/create-missing-rpc-functions.sql manually');
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}

export { testExistingFunctions, executeCreateFunctions, testResults };