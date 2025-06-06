#!/usr/bin/env node

/**
 * Apply Master Data Schema to Supabase
 * 
 * Applies the Project Scout master data architecture to our existing database
 * Implements IoT device management and health monitoring tables
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

async function applyMasterDataSchema() {
  try {
    console.log('🚀 Applying Project Scout Master Data Schema...');
    
    // Read the schema file
    const schemaPath = join(__dirname, '../database/master-data-schema.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          // Check if it's a harmless "already exists" error
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('relation') && error.message.includes('already exists')) {
            console.log(`⏭️  Skipping (already exists): ${getStatementType(statement)}`);
            successCount++;
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.error(`   Statement: ${statement.substring(0, 100)}...`);
            errorCount++;
          }
        } else {
          console.log(`✅ Successfully executed: ${getStatementType(statement)}`);
          successCount++;
        }
        
      } catch (error) {
        console.error(`❌ Exception in statement ${i + 1}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Schema Application Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${statements.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Master Data Schema applied successfully!');
      
      // Verify key tables exist
      await verifySchema();
      
    } else {
      console.log('\n⚠️  Schema applied with some errors. Please review the output above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Failed to apply schema:', error);
    process.exit(1);
  }
}

async function verifySchema() {
  console.log('\n🔍 Verifying schema installation...');
  
  const tablesToCheck = [
    'device_master',
    'store_master_enhanced',
    'device_installations',
    'session_matches',
    'transaction_items_enhanced',
    'request_methods',
    'device_health_metrics',
    'device_alerts',
    'substitution_events',
    'unbranded_commodities',
    'local_product_terms'
  ];
  
  let verifiedCount = 0;
  
  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${tableName}' not accessible: ${error.message}`);
      } else {
        console.log(`✅ Table '${tableName}' verified`);
        verifiedCount++;
      }
    } catch (error) {
      console.log(`❌ Table '${tableName}' verification failed: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Verification Summary: ${verifiedCount}/${tablesToCheck.length} tables verified`);
  
  // Check views
  const viewsToCheck = [
    'v_device_health_summary',
    'v_substitution_analytics',
    'v_store_device_performance'
  ];
  
  let viewsVerified = 0;
  
  for (const viewName of viewsToCheck) {
    try {
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ View '${viewName}' not accessible: ${error.message}`);
      } else {
        console.log(`✅ View '${viewName}' verified`);
        viewsVerified++;
      }
    } catch (error) {
      console.log(`❌ View '${viewName}' verification failed: ${error.message}`);
    }
  }
  
  console.log(`📊 Views Verification: ${viewsVerified}/${viewsToCheck.length} views verified`);
  
  if (verifiedCount === tablesToCheck.length && viewsVerified === viewsToCheck.length) {
    console.log('\n🎉 All schema components verified successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Register your first IoT device using the auto-registration system');
    console.log('   2. Set up device health monitoring endpoints');
    console.log('   3. Test the real-time device status updates');
    console.log('   4. Configure Azure OpenAI for AI insights');
  } else {
    console.log('\n⚠️  Some schema components could not be verified. Please check the errors above.');
  }
}

function getStatementType(statement) {
  const upperStmt = statement.toUpperCase().trim();
  
  if (upperStmt.startsWith('CREATE TABLE')) {
    const match = statement.match(/CREATE TABLE[^(]*([^\s(]+)/i);
    return `CREATE TABLE ${match ? match[1] : 'unknown'}`;
  } else if (upperStmt.startsWith('CREATE OR REPLACE VIEW')) {
    const match = statement.match(/CREATE OR REPLACE VIEW[^(]*([^\s(]+)/i);
    return `CREATE VIEW ${match ? match[1] : 'unknown'}`;
  } else if (upperStmt.startsWith('CREATE INDEX')) {
    const match = statement.match(/CREATE INDEX[^(]*([^\s(]+)/i);
    return `CREATE INDEX ${match ? match[1] : 'unknown'}`;
  } else if (upperStmt.startsWith('CREATE OR REPLACE FUNCTION')) {
    const match = statement.match(/CREATE OR REPLACE FUNCTION[^(]*([^\s(]+)/i);
    return `CREATE FUNCTION ${match ? match[1] : 'unknown'}`;
  } else if (upperStmt.startsWith('CREATE TRIGGER')) {
    const match = statement.match(/CREATE TRIGGER[^(]*([^\s(]+)/i);
    return `CREATE TRIGGER ${match ? match[1] : 'unknown'}`;
  } else {
    return upperStmt.substring(0, 30) + '...';
  }
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
      // Try creating the function directly if RPC fails
      console.log('📝 Creating exec_sql function...');
    }
  } catch (error) {
    console.log('⚠️  Using alternative execution method...');
  }
}

// Main execution
async function main() {
  console.log('🔧 Project Scout Master Data Schema Application');
  console.log('================================================');
  
  await ensureExecSqlFunction();
  await applyMasterDataSchema();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});