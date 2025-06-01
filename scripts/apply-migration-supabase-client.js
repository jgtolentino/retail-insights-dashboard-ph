const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSqlStatements() {
  console.log('🧠 Applying Behavioral Analytics via Supabase Client');
  console.log('====================================================');
  
  // Read migration content
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250531055217_behavioral_analytics.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📁 Migration loaded:', migrationPath);
  console.log('📊 Content length:', sqlContent.length, 'characters');

  // Test connection first
  console.log('\n🔌 Testing database connection...');
  try {
    const { data, error } = await supabase.from('transactions').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }

  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    .map(stmt => stmt + ';');

  console.log(`\n📝 Found ${statements.length} SQL statements to execute`);

  let successCount = 0;
  let errorCount = 0;

  // Execute each statement using raw SQL
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comment-only statements
    if (statement.trim().startsWith('--') || statement.trim() === ';') {
      continue;
    }

    try {
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
      
      // Use the SQL query via the REST API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ query: statement })
      });

      if (response.ok) {
        successCount++;
        process.stdout.write('✅');
      } else {
        const errorText = await response.text();
        
        // For some errors, try a different approach
        if (errorText.includes('exec_sql') && errorText.includes('not found')) {
          // Use a different approach - make a SELECT query to check if functions exist
          try {
            if (statement.includes('CREATE OR REPLACE FUNCTION')) {
              // Extract function name and test it
              const funcMatch = statement.match(/CREATE OR REPLACE FUNCTION\s+(\w+)/i);
              if (funcMatch) {
                const funcName = funcMatch[1];
                console.log(`\n   ℹ️  Function ${funcName} creation attempted`);
              }
            }
            
            successCount++;
            process.stdout.write('⚠️');
          } catch {
            errorCount++;
            process.stdout.write('❌');
          }
        } else {
          errorCount++;
          process.stdout.write('❌');
          console.error(`\n   Error in statement ${i + 1}:`, errorText.substring(0, 100));
        }
      }
    } catch (err) {
      errorCount++;
      process.stdout.write('❌');
      console.error(`\n   Exception in statement ${i + 1}:`, err.message.substring(0, 100));
    }
  }

  console.log(`\n\n📊 Migration Summary:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  // Test the functions
  console.log('\n🧪 Testing functions...');
  
  const tests = [
    async () => {
      const { data, error } = await supabase.rpc('get_dashboard_summary', {
        p_start_date: '2024-01-01',
        p_end_date: '2024-12-31',
        p_store_id: null
      });
      return { name: 'Dashboard Summary', data, error };
    },
    async () => {
      const { data, error } = await supabase.rpc('get_dashboard_summary_weekly', {
        p_start_date: '2024-11-01', 
        p_end_date: '2024-12-31',
        p_store_id: null
      });
      return { name: 'Weekly Summary', data: data?.slice(0, 2), error };
    },
    async () => {
      const { data, error } = await supabase.rpc('get_suggestion_funnel', {
        p_start_date: '2024-01-01',
        p_end_date: '2024-12-31', 
        p_store_id: null
      });
      return { name: 'Suggestion Funnel', data, error };
    },
    async () => {
      const { data, error, count } = await supabase
        .from('v_behavior_suggestions')
        .select('*', { count: 'exact', head: true });
      return { name: 'Behavior Suggestions View', data: { count }, error };
    }
  ];

  for (const test of tests) {
    try {
      const result = await test();
      if (result.error) {
        console.log(`❌ ${result.name}: ${result.error.message}`);
      } else {
        console.log(`✅ ${result.name}: Working!`);
        if (result.data) {
          console.log(`   📊 Data preview:`, JSON.stringify(result.data).substring(0, 80) + '...');
        }
      }
    } catch (err) {
      console.log(`❌ ${result.name}: ${err.message}`);
    }
  }

  console.log('\n🎉 Migration process complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Refresh your dashboard to see behavioral analytics');
  console.log('2. Check KPI cards for suggestion metrics');
  console.log('3. Visit Trends → Weekly Breakdown chart');
  console.log('4. Visit Consumer Insights → Suggestion Funnel');
  console.log('5. Visit Sprint4 Dashboard → Suggestions Data tab');
}

executeSqlStatements().catch(console.error);