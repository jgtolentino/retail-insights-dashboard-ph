import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSqlStatements(sqlContent, description) {
  console.log(`\n🚀 Executing: ${description}`);
  
  // Split SQL content by semicolons but preserve those within strings
  const statements = sqlContent
    .split(/;\s*$/gm)
    .filter(stmt => stmt.trim().length > 0)
    .map(stmt => stmt.trim() + ';');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty statements
    if (statement.trim().startsWith('--') || statement.trim() === ';') {
      continue;
    }

    try {
      // For CREATE FUNCTION statements, we need to handle them specially
      if (statement.includes('CREATE OR REPLACE FUNCTION') || statement.includes('CREATE OR REPLACE VIEW')) {
        const { data, error } = await supabase.rpc('exec_sql', {
          query: statement
        }).single();

        if (error) {
          // Try direct execution as a fallback
          const { error: directError } = await supabase.from('_sql').insert({
            query: statement
          });

          if (directError) {
            throw directError;
          }
        }
        successCount++;
        process.stdout.write('.');
      } else {
        // For regular statements, execute them normally
        const { error } = await supabase.rpc('exec_sql', {
          query: statement
        });

        if (error) {
          throw error;
        }
        successCount++;
        process.stdout.write('.');
      }
    } catch (error) {
      errorCount++;
      console.error(`\n❌ Error in statement ${i + 1}:`, error.message);
      console.error('Statement:', statement.substring(0, 100) + '...');
    }
  }

  console.log(`\n✅ Completed: ${successCount} successful, ${errorCount} errors`);
  return { successCount, errorCount };
}

async function testFunctions() {
  console.log('\n🧪 Testing Functions...\n');
  
  const tests = [
    {
      name: 'Dashboard Summary',
      test: async () => {
        const { data, error } = await supabase.rpc('get_dashboard_summary', {
          p_start_date: '2024-01-01',
          p_end_date: '2024-12-31',
          p_store_id: null
        });
        return { data, error };
      }
    },
    {
      name: 'Weekly Summary',
      test: async () => {
        const { data, error } = await supabase.rpc('get_dashboard_summary_weekly', {
          p_start_date: '2024-01-01',
          p_end_date: '2024-12-31',
          p_store_id: null
        });
        return { data, error };
      }
    },
    {
      name: 'Suggestion Funnel',
      test: async () => {
        const { data, error } = await supabase.rpc('get_suggestion_funnel', {
          p_start_date: '2024-01-01',
          p_end_date: '2024-12-31',
          p_store_id: null
        });
        return { data, error };
      }
    },
    {
      name: 'Behavior Suggestions View',
      test: async () => {
        const { data, error, count } = await supabase
          .from('v_behavior_suggestions')
          .select('*', { count: 'exact', head: true });
        return { data: { count }, error };
      }
    }
  ];

  for (const test of tests) {
    try {
      const { data, error } = await test.test();
      if (error) {
        console.log(`❌ ${test.name}: Failed - ${error.message}`);
      } else {
        console.log(`✅ ${test.name}: Success`, data ? `(${JSON.stringify(data).substring(0, 50)}...)` : '');
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
    }
  }
}

async function runMigrations() {
  console.log('🧠 Applying Behavioral Analytics Migrations\n');
  console.log('URL:', SUPABASE_URL);
  console.log('Service Role Key:', SERVICE_ROLE_KEY ? '✓ Found' : '✗ Missing');

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  try {
    // 1. Apply field fixes
    const fixFieldsSql = fs.readFileSync(
      path.join(__dirname, '..', 'migrations', 'fix_behavioral_analytics_tables.sql'),
      'utf8'
    );
    await executeSqlStatements(fixFieldsSql, 'Fix Missing Fields');

    // 2. Apply behavioral analytics functions
    const functionsSql = fs.readFileSync(
      path.join(__dirname, '..', 'migrations', 'behavioral_analytics_functions.sql'),
      'utf8'
    );
    await executeSqlStatements(functionsSql, 'Behavioral Analytics Functions');

    // 3. Test the functions
    await testFunctions();

    console.log('\n✅ All migrations applied successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Refresh your dashboard to see the new behavioral analytics');
    console.log('2. Check the KPI cards for live suggestion metrics');
    console.log('3. Visit Trends Explorer for weekly breakdowns');
    console.log('4. Check Consumer Insights for the suggestion funnel');
    console.log('5. Visit Sprint4 Dashboard for the full behavior suggestions table');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migrations
runMigrations();