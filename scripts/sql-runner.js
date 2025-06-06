#!/usr/bin/env node

/**
 * Automated SQL Script Runner for Supabase
 * 
 * Usage:
 * node scripts/sql-runner.js <sql-file>
 * npm run sql <sql-file>
 * 
 * Examples:
 * node scripts/sql-runner.js scripts/create-missing-rpc-functions.sql
 * npm run sql scripts/fix-views-correct-schema.sql
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';

// Create Supabase client with elevated permissions
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Execute SQL script on Supabase database
 */
async function executeSqlScript(sqlFilePath) {
  try {
    console.log('🚀 Starting SQL Script Execution...\n');
    
    // Resolve file path
    const fullPath = resolve(process.cwd(), sqlFilePath);
    console.log(`📁 File: ${fullPath}`);
    
    // Check if file exists
    if (!existsSync(fullPath)) {
      throw new Error(`SQL file not found: ${fullPath}`);
    }
    
    // Read SQL content
    const sqlContent = readFileSync(fullPath, 'utf8');
    console.log(`📄 File size: ${sqlContent.length} characters`);
    console.log(`📝 Preview: ${sqlContent.substring(0, 100)}...`);
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`\n🔧 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing statement...`);
      
      try {
        // Use RPC call to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          // If exec_sql RPC doesn't exist, try direct execution
          if (error.message.includes('function "exec_sql" does not exist')) {
            console.log('⚠️  exec_sql function not found, trying direct execution...');
            
            // Try to execute using Supabase's SQL execution
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify({ sql_query: statement + ';' })
            });
            
            if (!response.ok) {
              // Fallback: Try to parse and execute specific statement types
              await executeStatementFallback(statement);
            }
          } else {
            throw error;
          }
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
        successCount++;
        
      } catch (statementError) {
        console.error(`❌ Error in statement ${i + 1}:`, statementError.message);
        console.error(`   SQL: ${statement.substring(0, 100)}...`);
        errorCount++;
        
        // Continue with next statement instead of failing completely
        continue;
      }
    }
    
    // Summary
    console.log('\n📊 Execution Summary:');
    console.log(`✅ Successful: ${successCount} statements`);
    console.log(`❌ Failed: ${errorCount} statements`);
    console.log(`📈 Success rate: ${Math.round((successCount / statements.length) * 100)}%`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All SQL statements executed successfully!');
      return true;
    } else {
      console.log(`\n⚠️  Completed with ${errorCount} errors. Check output above for details.`);
      return false;
    }
    
  } catch (error) {
    console.error('🚨 Fatal error executing SQL script:', error.message);
    return false;
  }
}

/**
 * Fallback method to execute specific types of SQL statements
 */
async function executeStatementFallback(statement) {
  const upperStatement = statement.toUpperCase().trim();
  
  if (upperStatement.startsWith('CREATE OR REPLACE FUNCTION')) {
    // Extract function details and create using Supabase
    console.log('📝 Creating function using fallback method...');
    // This would need more sophisticated parsing for production use
    throw new Error('Function creation requires manual execution or custom RPC');
  } else if (upperStatement.startsWith('CREATE OR REPLACE VIEW')) {
    // Extract view details
    console.log('📝 Creating view using fallback method...');
    throw new Error('View creation requires manual execution or custom RPC');
  } else {
    // Try generic execution
    throw new Error('Statement type not supported in fallback mode');
  }
}

/**
 * Create the exec_sql helper function if it doesn't exist
 */
async function createExecSqlFunction() {
  console.log('🔧 Creating exec_sql helper function...');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
    RETURNS JSON AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN json_build_object('success', true, 'message', 'Query executed successfully');
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    // This would need to be executed manually once to bootstrap the system
    console.log('⚠️  exec_sql function needs to be created manually in Supabase SQL Editor:');
    console.log(createFunctionSQL);
    return false;
  } catch (error) {
    console.error('Failed to create exec_sql function:', error);
    return false;
  }
}

// Main execution
async function main() {
  const sqlFile = process.argv[2];
  
  if (!sqlFile) {
    console.error('❌ Error: Please provide a SQL file path');
    console.log('\nUsage:');
    console.log('  node scripts/sql-runner.js <sql-file>');
    console.log('  npm run sql <sql-file>');
    console.log('\nExamples:');
    console.log('  node scripts/sql-runner.js scripts/create-missing-rpc-functions.sql');
    console.log('  npm run sql scripts/fix-views-correct-schema.sql');
    process.exit(1);
  }
  
  console.log('🔍 Testing Supabase connection...');
  
  // Test connection
  try {
    const { data, error } = await supabase.from('brands').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Supabase connection successful\n');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.log('🔧 Make sure SUPABASE_SERVICE_KEY environment variable is set');
    process.exit(1);
  }
  
  // Execute the SQL script
  const success = await executeSqlScript(sqlFile);
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('🚨 Unhandled error:', error);
    process.exit(1);
  });
}

export { executeSqlScript };