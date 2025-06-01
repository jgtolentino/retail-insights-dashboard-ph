const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = 'lcoxtanyckjzyxxcsjzz';

async function executeSql(sqlContent, description) {
  console.log(`\n🚀 Executing: ${description}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });

    if (!response.ok) {
      // Try alternative approach using the Management API
      const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          query: sqlContent
        })
      });

      if (!mgmtResponse.ok) {
        const errorText = await mgmtResponse.text();
        throw new Error(`Management API failed: ${mgmtResponse.status} - ${errorText}`);
      }

      const result = await mgmtResponse.json();
      console.log(`✅ Success via Management API:`, result);
      return result;
    }

    const result = await response.json();
    console.log(`✅ Success:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Error executing ${description}:`, error.message);
    throw error;
  }
}

async function runMigrations() {
  console.log('🧠 Applying Behavioral Analytics Migrations\n');
  console.log('Project:', PROJECT_REF);
  console.log('URL:', SUPABASE_URL);
  console.log('Service Role Key:', SERVICE_ROLE_KEY ? '✓ Found' : '✗ Missing');

  try {
    // 1. Apply field fixes
    const fixFieldsSql = fs.readFileSync(
      path.join(__dirname, '..', 'migrations', 'fix_behavioral_analytics_tables.sql'),
      'utf8'
    );
    await executeSql(fixFieldsSql, 'Fix Missing Fields');

    // 2. Apply behavioral analytics functions
    const functionsSql = fs.readFileSync(
      path.join(__dirname, '..', 'migrations', 'behavioral_analytics_functions.sql'),
      'utf8'
    );
    await executeSql(functionsSql, 'Behavioral Analytics Functions');

    // 3. Test the functions
    console.log('\n🧪 Testing Functions...\n');
    
    const testQueries = [
      {
        name: 'Dashboard Summary',
        sql: "SELECT * FROM get_dashboard_summary('2024-01-01'::date, '2024-12-31'::date, NULL);"
      },
      {
        name: 'Weekly Summary (Last Row)',
        sql: "SELECT * FROM get_dashboard_summary_weekly('2024-01-01'::date, '2024-12-31'::date, NULL) LIMIT 1;"
      },
      {
        name: 'Suggestion Funnel',
        sql: "SELECT * FROM get_suggestion_funnel('2024-01-01'::date, '2024-12-31'::date, NULL);"
      },
      {
        name: 'Behavior Suggestions View',
        sql: "SELECT COUNT(*) as total_rows FROM v_behavior_suggestions;"
      }
    ];

    for (const test of testQueries) {
      try {
        await executeSql(test.sql, `Test: ${test.name}`);
      } catch (error) {
        console.warn(`⚠️  Test failed for ${test.name}, but continuing...`);
      }
    }

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