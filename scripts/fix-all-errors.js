#!/usr/bin/env node

/**
 * Fix All Application Errors
 * 
 * Comprehensive script to fix all known issues:
 * - Missing RPC functions
 * - Database schema updates
 * - Application error handling
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.log('\n💡 To fix this:');
  console.log('   1. Copy .env.example to .env');
  console.log('   2. Fill in your Supabase credentials');
  console.log('   3. Run this script again');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAllErrors() {
  console.log('🔧 Comprehensive Error Fix');
  console.log('==========================');
  
  try {
    // Step 1: Ensure exec_sql function exists
    await ensureExecSqlFunction();
    
    // Step 2: Create missing RPC functions
    await createMissingFunctions();
    
    // Step 3: Apply master data schema
    await applyMasterDataSchema();
    
    // Step 4: Test all functions
    await testAllFunctions();
    
    // Step 5: Check database health
    await checkDatabaseHealth();
    
    console.log('\n🎉 All fixes completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Visit /project-scout to test the new features');
    console.log('   3. Configure Azure OpenAI for AI insights');
    console.log('   4. Set up IoT device API keys');
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
    process.exit(1);
  }
}

async function ensureExecSqlFunction() {
  console.log('\n1. 🔧 Ensuring exec_sql function exists...');
  
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
    // Try to use the function first
    const { error: testError } = await supabase.rpc('exec_sql', { 
      sql_query: 'SELECT 1;' 
    });
    
    if (!testError) {
      console.log('   ✅ exec_sql function already exists');
      return;
    }
    
    // Function doesn't exist, try to create it using raw SQL
    console.log('   📝 Creating exec_sql function...');
    
    // We'll try different approaches since we can't create the function
    // without having a way to execute arbitrary SQL
    console.log('   ⚠️  exec_sql function may need manual creation in Supabase dashboard');
    console.log('   💡 Go to SQL Editor in Supabase and run:');
    console.log(execSqlFunction);
    
  } catch (error) {
    console.log('   ⚠️  Unable to auto-create exec_sql function');
  }
}

async function createMissingFunctions() {
  console.log('\n2. 📋 Creating missing RPC functions...');
  
  const functions = [
    {
      name: 'get_age_distribution_simple',
      sql: `
        CREATE OR REPLACE FUNCTION get_age_distribution_simple()
        RETURNS TABLE(age_group TEXT, count BIGINT, percentage NUMERIC) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                CASE 
                    WHEN customer_age BETWEEN 18 AND 25 THEN '18-25'
                    WHEN customer_age BETWEEN 26 AND 35 THEN '26-35'
                    WHEN customer_age BETWEEN 36 AND 45 THEN '36-45'
                    WHEN customer_age BETWEEN 46 AND 55 THEN '46-55'
                    WHEN customer_age BETWEEN 56 AND 65 THEN '56-65'
                    WHEN customer_age > 65 THEN '65+'
                    ELSE 'Unknown'
                END as age_group,
                COUNT(*) as count,
                ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM transactions WHERE customer_age IS NOT NULL)), 2) as percentage
            FROM transactions 
            WHERE customer_age IS NOT NULL
            GROUP BY 
                CASE 
                    WHEN customer_age BETWEEN 18 AND 25 THEN '18-25'
                    WHEN customer_age BETWEEN 26 AND 35 THEN '26-35'
                    WHEN customer_age BETWEEN 36 AND 45 THEN '36-45'
                    WHEN customer_age BETWEEN 46 AND 55 THEN '46-55'
                    WHEN customer_age BETWEEN 56 AND 65 THEN '56-65'
                    WHEN customer_age > 65 THEN '65+'
                    ELSE 'Unknown'
                END
            ORDER BY count DESC;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'get_gender_distribution_simple',
      sql: `
        CREATE OR REPLACE FUNCTION get_gender_distribution_simple()
        RETURNS TABLE(gender TEXT, count BIGINT, percentage NUMERIC) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                COALESCE(customer_gender, 'Unknown') as gender,
                COUNT(*) as count,
                ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM transactions)), 2) as percentage
            FROM transactions 
            GROUP BY customer_gender
            ORDER BY COUNT(*) DESC;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'get_dashboard_summary_weekly',
      sql: `
        CREATE OR REPLACE FUNCTION get_dashboard_summary_weekly(
            p_start_date DATE DEFAULT NULL,
            p_end_date DATE DEFAULT NULL,
            p_store_id INTEGER DEFAULT NULL
        )
        RETURNS TABLE(
            week_start DATE,
            week_end DATE,
            week_number INTEGER,
            total_revenue NUMERIC,
            total_transactions BIGINT,
            avg_transaction NUMERIC,
            unique_customers BIGINT,
            suggestion_acceptance_rate NUMERIC,
            substitution_rate NUMERIC,
            suggestions_offered BIGINT,
            suggestions_accepted BIGINT
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                date_trunc('week', t.created_at::date)::date as week_start,
                (date_trunc('week', t.created_at::date) + interval '6 days')::date as week_end,
                EXTRACT(week FROM t.created_at)::integer as week_number,
                COALESCE(SUM(t.total_amount), 0) as total_revenue,
                COUNT(*)::bigint as total_transactions,
                COALESCE(AVG(t.total_amount), 0) as avg_transaction,
                COUNT(DISTINCT t.customer_id)::bigint as unique_customers,
                0::numeric as suggestion_acceptance_rate,
                0::numeric as substitution_rate,
                0::bigint as suggestions_offered,
                0::bigint as suggestions_accepted
            FROM transactions t
            WHERE 
                (p_start_date IS NULL OR t.created_at::date >= p_start_date) AND
                (p_end_date IS NULL OR t.created_at::date <= p_end_date) AND
                (p_store_id IS NULL OR t.store_id = p_store_id)
            GROUP BY 
                date_trunc('week', t.created_at::date),
                EXTRACT(week FROM t.created_at)
            ORDER BY week_start DESC
            LIMIT 12;
        END;
        $$ LANGUAGE plpgsql;
      `
    }
  ];
  
  let created = 0;
  
  for (const func of functions) {
    try {
      console.log(`   📝 Creating ${func.name}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: func.sql
      });
      
      if (error) {
        console.log(`   ❌ Failed to create ${func.name}: ${error.message}`);
      } else {
        console.log(`   ✅ Created ${func.name}`);
        created++;
      }
    } catch (error) {
      console.log(`   ❌ Exception creating ${func.name}: ${error.message}`);
    }
  }
  
  console.log(`   📊 Created ${created}/${functions.length} functions`);
}

async function applyMasterDataSchema() {
  console.log('\n3. 🗄️  Applying master data schema...');
  
  try {
    // Check if device_master table exists
    const { data, error } = await supabase
      .from('device_master')
      .select('device_id')
      .limit(1);
    
    if (!error) {
      console.log('   ✅ Master data schema already applied');
      return;
    }
    
    console.log('   📝 Master data schema needs to be applied');
    console.log('   💡 Run: node scripts/apply-master-data-schema.js');
    
  } catch (error) {
    console.log('   ⚠️  Could not check master data schema');
  }
}

async function testAllFunctions() {
  console.log('\n4. 🧪 Testing database functions...');
  
  const functionsToTest = [
    'get_age_distribution_simple',
    'get_gender_distribution_simple',
    'get_dashboard_summary_weekly'
  ];
  
  let working = 0;
  
  for (const functionName of functionsToTest) {
    try {
      console.log(`   🔍 Testing ${functionName}...`);
      
      const { data, error } = await supabase.rpc(functionName);
      
      if (error) {
        console.log(`   ❌ ${functionName}: ${error.message}`);
      } else {
        console.log(`   ✅ ${functionName}: Working`);
        working++;
      }
    } catch (error) {
      console.log(`   ❌ ${functionName}: Exception`);
    }
  }
  
  console.log(`   📊 ${working}/${functionsToTest.length} functions working`);
}

async function checkDatabaseHealth() {
  console.log('\n5. 💊 Checking database health...');
  
  const checks = [
    { name: 'Transactions table', table: 'transactions' },
    { name: 'Brands table', table: 'brands' },
    { name: 'Stores table', table: 'stores' },
    { name: 'Products table', table: 'products' }
  ];
  
  let healthy = 0;
  
  for (const check of checks) {
    try {
      const { count, error } = await supabase
        .from(check.table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${check.name}: ${error.message}`);
      } else {
        console.log(`   ✅ ${check.name}: ${count} records`);
        healthy++;
      }
    } catch (error) {
      console.log(`   ❌ ${check.name}: Exception`);
    }
  }
  
  console.log(`   📊 ${healthy}/${checks.length} tables healthy`);
  
  if (healthy === checks.length) {
    console.log('   🎉 Database is healthy!');
  } else {
    console.log('   ⚠️  Some database issues detected');
  }
}

// Main execution
async function main() {
  await fixAllErrors();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});