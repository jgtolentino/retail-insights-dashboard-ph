const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Create admin client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSqlFile(filePath, description) {
  console.log(`\n🚀 Executing: ${description}`);
  console.log(`📁 File: ${filePath}`);
  
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split by statements, handling functions specially
    const statements = [];
    let currentStatement = '';
    let inFunction = false;
    
    sqlContent.split('\n').forEach(line => {
      currentStatement += line + '\n';
      
      if (line.includes('CREATE OR REPLACE FUNCTION') || line.includes('CREATE OR REPLACE VIEW')) {
        inFunction = true;
      }
      
      if (!inFunction && line.trim().endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      } else if (inFunction && line.trim() === '$$ LANGUAGE plpgsql;') {
        statements.push(currentStatement.trim());
        currentStatement = '';
        inFunction = false;
      }
    });
    
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Skip empty statements and comments
      if (!stmt || stmt.startsWith('--') && !stmt.includes('\n')) {
        continue;
      }
      
      try {
        // Use a raw SQL query approach
        const { data, error } = await supabase
          .from('_sql_executor')
          .insert({ query: stmt })
          .select()
          .single();
          
        if (error) {
          // Fallback: Try using RPC if available
          const { error: rpcError } = await supabase.rpc('exec_sql', { query: stmt });
          
          if (rpcError) {
            throw rpcError;
          }
        }
        
        successCount++;
        process.stdout.write('.');
      } catch (error) {
        errorCount++;
        console.error(`\n❌ Statement ${i + 1} failed:`, error.message);
        
        // Show the beginning of the failed statement
        const preview = stmt.substring(0, 100).replace(/\n/g, ' ');
        console.error(`   Statement preview: ${preview}...`);
        
        // For missing tables/columns, continue anyway
        if (error.message.includes('does not exist') || error.message.includes('already exists')) {
          console.log('   ℹ️  Continuing despite error...');
        }
      }
    }
    
    console.log(`\n✅ Completed: ${successCount} successful, ${errorCount} errors`);
    return { success: errorCount === 0, successCount, errorCount };
    
  } catch (error) {
    console.error(`❌ Failed to read or execute ${filePath}:`, error.message);
    return { success: false, error };
  }
}

async function testFunctions() {
  console.log('\n🧪 Testing Behavioral Analytics Functions...\n');
  
  const tests = [
    {
      name: 'Test get_dashboard_summary',
      fn: async () => {
        const { data, error } = await supabase.rpc('get_dashboard_summary', {
          p_start_date: '2024-01-01',
          p_end_date: '2024-12-31',
          p_store_id: null
        });
        return { data, error };
      }
    },
    {
      name: 'Test get_dashboard_summary_weekly',
      fn: async () => {
        const { data, error } = await supabase.rpc('get_dashboard_summary_weekly', {
          p_start_date: '2024-01-01',
          p_end_date: '2024-12-31',
          p_store_id: null
        });
        return { data: data?.slice(0, 2), error }; // Just show first 2 weeks
      }
    },
    {
      name: 'Test get_suggestion_funnel',
      fn: async () => {
        const { data, error } = await supabase.rpc('get_suggestion_funnel', {
          p_start_date: '2024-01-01',
          p_end_date: '2024-12-31',
          p_store_id: null
        });
        return { data, error };
      }
    },
    {
      name: 'Test v_behavior_suggestions view',
      fn: async () => {
        const { data, error, count } = await supabase
          .from('v_behavior_suggestions')
          .select('*', { count: 'exact', head: true });
        return { data: { row_count: count }, error };
      }
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}...`);
      const { data, error } = await test.fn();
      
      if (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      } else {
        console.log(`   ✅ Success!`);
        if (data) {
          console.log(`   📊 Result:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
        }
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }
  }
}

async function main() {
  console.log('🧠 Behavioral Analytics Migration Tool');
  console.log('=====================================\n');
  console.log('🔗 Supabase URL:', SUPABASE_URL);
  console.log('🔑 Service Role Key:', SERVICE_ROLE_KEY.substring(0, 20) + '...');
  
  // Check connection
  console.log('\n🔌 Testing connection...');
  try {
    const { data, error } = await supabase.from('transactions').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Connection successful!\n');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nPlease check your environment variables and try again.');
    process.exit(1);
  }
  
  // Run migrations
  const migrations = [
    {
      file: path.join(__dirname, '..', 'migrations', 'fix_behavioral_analytics_tables.sql'),
      description: 'Fix Missing Fields in request_behaviors Table'
    },
    {
      file: path.join(__dirname, '..', 'migrations', 'behavioral_analytics_functions.sql'),
      description: 'Create Behavioral Analytics Functions and Views'
    }
  ];
  
  let allSuccess = true;
  
  for (const migration of migrations) {
    const result = await executeSqlFile(migration.file, migration.description);
    if (!result.success && result.errorCount > 0) {
      allSuccess = false;
    }
  }
  
  // Test functions
  await testFunctions();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(allSuccess ? '✅ Migration completed!' : '⚠️  Migration completed with some errors');
  console.log('='.repeat(50) + '\n');
  
  console.log('📋 Next Steps:');
  console.log('1. Refresh your dashboard to see the new KPIs');
  console.log('2. Check Trends Explorer for the Weekly Breakdown chart');
  console.log('3. Visit Consumer Insights → Purchase Behavior for Suggestion Funnel');
  console.log('4. Go to Sprint4 Dashboard → Suggestions Data tab');
  console.log('\n🎉 Your behavioral analytics features are ready to use!');
}

// Run the migration
main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});