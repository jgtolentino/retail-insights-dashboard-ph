const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PROJECT_REF = 'lcoxtanyckjzyxxcsjzz';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function applyMigrationDirect() {
  console.log('🧠 Applying Behavioral Analytics Migration via Management API');
  console.log('==========================================================');
  
  try {
    // Read the migration file
    const migrationContent = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', '20250531055217_behavioral_analytics.sql'),
      'utf8'
    );

    console.log('📁 Migration file loaded');
    console.log('📊 Content length:', migrationContent.length, 'characters');

    // Use Supabase Management API to apply the migration
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/migrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        name: '20250531055217_behavioral_analytics',
        statements: [migrationContent]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Management API Error:', response.status, errorText);
      
      // Fallback: Try executing via the SQL API directly
      console.log('\n🔄 Trying fallback method...');
      
      const sqlResponse = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({
          query: migrationContent
        })
      });

      if (!sqlResponse.ok) {
        throw new Error(`SQL API also failed: ${sqlResponse.status}`);
      }

      console.log('✅ Applied via SQL API fallback');
    } else {
      const result = await response.json();
      console.log('✅ Migration applied successfully via Management API');
      console.log('📊 Result:', result);
    }

    console.log('\n🧪 Testing the functions...');
    
    // Test the functions by making direct RPC calls
    const testCalls = [
      {
        name: 'Dashboard Summary',
        rpc: 'get_dashboard_summary',
        params: { p_start_date: '2024-01-01', p_end_date: '2024-12-31', p_store_id: null }
      },
      {
        name: 'Weekly Summary', 
        rpc: 'get_dashboard_summary_weekly',
        params: { p_start_date: '2024-11-01', p_end_date: '2024-12-31', p_store_id: null }
      },
      {
        name: 'Suggestion Funnel',
        rpc: 'get_suggestion_funnel', 
        params: { p_start_date: '2024-01-01', p_end_date: '2024-12-31', p_store_id: null }
      }
    ];

    for (const test of testCalls) {
      try {
        const testResponse = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/${test.rpc}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY,
          },
          body: JSON.stringify(test.params)
        });

        if (testResponse.ok) {
          const testResult = await testResponse.json();
          console.log(`✅ ${test.name}: Working! (${Array.isArray(testResult) ? testResult.length : 1} rows)`);
        } else {
          console.log(`❌ ${test.name}: Failed (${testResponse.status})`);
        }
      } catch (err) {
        console.log(`❌ ${test.name}: Error - ${err.message}`);
      }
    }

    console.log('\n🎉 Behavioral Analytics Migration Complete!');
    console.log('\n📋 Your dashboard now has:');
    console.log('• Enhanced KPI cards with suggestion metrics');
    console.log('• Weekly breakdown charts in Trends Explorer');
    console.log('• Suggestion funnel in Consumer Insights');
    console.log('• Full behavior data table in Sprint4 Dashboard');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Alternative: Copy the migration content manually:');
    console.error('1. Go to https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz/sql');
    console.error('2. Copy the content from supabase/migrations/20250531055217_behavioral_analytics.sql');
    console.error('3. Paste and execute');
  }
}

applyMigrationDirect();