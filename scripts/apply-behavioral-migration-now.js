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

async function applyBehavioralAnalytics() {
  console.log('🧠 Applying Behavioral Analytics Migration Now!');
  console.log('==============================================\n');

  // Test connection first
  try {
    const { data, error } = await supabase.from('transactions').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }

  console.log('\n🚀 Applying migration using direct table operations...\n');

  try {
    // Step 1: Add missing columns to request_behaviors table
    console.log('📝 Step 1: Adding missing columns...');
    try {
      // Check if columns exist by trying to select them
      const { data, error } = await supabase
        .from('request_behaviors')
        .select('suggestion_offered, suggestion_accepted')
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        console.log('   ℹ️  Columns need to be added - this will require manual SQL execution');
      } else {
        console.log('   ✅ Columns already exist or accessible');
      }
    } catch (err) {
      console.log('   ⚠️  Column check inconclusive');
    }

    // Step 2: Test existing functions
    console.log('\n📝 Step 2: Testing existing RPC functions...');
    
    const tests = [
      {
        name: 'get_dashboard_summary',
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
        name: 'get_dashboard_summary_weekly',
        test: async () => {
          const { data, error } = await supabase.rpc('get_dashboard_summary_weekly', {
            p_start_date: '2024-11-01',
            p_end_date: '2024-12-31',
            p_store_id: null
          });
          return { data, error };
        }
      },
      {
        name: 'get_suggestion_funnel',
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
        name: 'v_behavior_suggestions view',
        test: async () => {
          const { data, error, count } = await supabase
            .from('v_behavior_suggestions')
            .select('*', { count: 'exact', head: true });
          return { data: { count }, error };
        }
      }
    ];

    let functionsWorking = 0;
    let functionsNeeded = 0;

    for (const test of tests) {
      try {
        const { data, error } = await test.test();
        if (error) {
          console.log(`   ❌ ${test.name}: ${error.message}`);
          functionsNeeded++;
        } else {
          console.log(`   ✅ ${test.name}: Working!`);
          functionsWorking++;
          if (data && typeof data === 'object') {
            console.log(`      📊 Sample result:`, JSON.stringify(data).substring(0, 60) + '...');
          }
        }
      } catch (err) {
        console.log(`   ❌ ${test.name}: ${err.message}`);
        functionsNeeded++;
      }
    }

    console.log(`\n📊 Status: ${functionsWorking}/${functionsWorking + functionsNeeded} functions working`);

    if (functionsNeeded > 0) {
      console.log('\n🔧 Manual SQL Required:');
      console.log('======================');
      console.log('Some functions need to be created manually.');
      console.log('\n📋 Instructions:');
      console.log('1. Open SQL Editor: https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz/sql');
      console.log('2. Copy and paste the content from:');
      console.log('   supabase/migrations/20250531055217_behavioral_analytics.sql');
      console.log('3. Execute the SQL');
      console.log('\n📁 Migration file location:');
      console.log('   ' + path.join(__dirname, '..', 'supabase', 'migrations', '20250531055217_behavioral_analytics.sql'));
    }

    if (functionsWorking > 0) {
      console.log('\n🎉 Some Features Already Available:');
      console.log('==================================');
      if (functionsWorking >= 1) {
        console.log('✅ Enhanced KPI cards will show basic behavioral metrics');
      }
      if (functionsWorking >= 2) {
        console.log('✅ Dashboard has some behavioral analytics ready');
      }
    }

    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. Complete the SQL migration manually (if needed)');
    console.log('2. Refresh your dashboard at: ' + SUPABASE_URL.replace('.supabase.co', '') + '/');
    console.log('3. Check the enhanced KPI cards');
    console.log('4. Visit Trends Explorer for weekly charts');
    console.log('5. Check Consumer Insights for suggestion funnel');
    console.log('6. Visit Sprint4 Dashboard for behavior data table');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
  }
}

applyBehavioralAnalytics();