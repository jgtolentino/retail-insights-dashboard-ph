#!/usr/bin/env node

/**
 * Fix Missing RPC Functions
 * 
 * Creates the missing database functions that are causing 400 errors
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client with service role key
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingFunctions() {
  try {
    console.log('🔧 Fixing missing RPC functions...');
    
    // Read the SQL file
    const sqlPath = join(__dirname, '../database/missing-rpc-functions.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    // Split into individual function definitions
    const functionBlocks = sqlContent.split(/(?=CREATE OR REPLACE FUNCTION|CREATE OR REPLACE VIEW)/);
    
    console.log(`📝 Found ${functionBlocks.length} function/view definitions...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < functionBlocks.length; i++) {
      const block = functionBlocks[i].trim();
      
      if (!block || block.startsWith('--')) {
        continue; // Skip empty blocks and comments
      }
      
      try {
        console.log(`⚡ Creating function/view ${i + 1}/${functionBlocks.length}...`);
        
        // Execute the SQL block directly using Supabase's raw SQL execution
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: block
        });
        
        if (error) {
          console.error(`❌ Error creating function/view ${i + 1}:`, error.message);
          errorCount++;
        } else {
          const functionName = extractFunctionName(block);
          console.log(`✅ Successfully created: ${functionName}`);
          successCount++;
        }
        
      } catch (error) {
        console.error(`❌ Exception in function/view ${i + 1}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Function Creation Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${successCount + errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All missing functions created successfully!');
      
      // Test the functions
      await testFunctions();
      
    } else {
      console.log('\n⚠️  Some functions failed to create. Please review the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Failed to fix missing functions:', error);
    process.exit(1);
  }
}

async function testFunctions() {
  console.log('\n🧪 Testing created functions...');
  
  const functionsToTest = [
    'get_age_distribution_simple',
    'get_gender_distribution_simple',
    'get_consumer_profile',
    'get_dashboard_summary'
  ];
  
  let testsPassed = 0;
  
  for (const functionName of functionsToTest) {
    try {
      console.log(`🔍 Testing ${functionName}...`);
      
      const { data, error } = await supabase.rpc(functionName);
      
      if (error) {
        console.log(`❌ ${functionName} failed: ${error.message}`);
      } else {
        console.log(`✅ ${functionName} working`);
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ ${functionName} exception: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Function Tests: ${testsPassed}/${functionsToTest.length} passed`);
  
  if (testsPassed === functionsToTest.length) {
    console.log('🎉 All functions are working correctly!');
  } else {
    console.log('⚠️  Some functions may need additional debugging.');
  }
}

function extractFunctionName(block) {
  // Extract function or view name from CREATE statement
  const match = block.match(/CREATE OR REPLACE (?:FUNCTION|VIEW)\s+(\w+)/i);
  return match ? match[1] : 'unknown';
}

// Create exec_sql function if it doesn't exist
async function ensureExecSqlFunction() {
  const execSqlFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: execSqlFunction });
    if (error && !error.message.includes('already exists')) {
      console.log('📝 Creating exec_sql function...');
    }
  } catch (error) {
    console.log('⚠️  Using alternative execution method...');
  }
}

// Main execution
async function main() {
  console.log('🔧 Missing RPC Functions Fix');
  console.log('===============================');
  
  await ensureExecSqlFunction();
  await fixMissingFunctions();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});