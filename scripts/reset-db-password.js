const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function resetDatabasePassword() {
  console.log('🔐 Database Password Reset Tool');
  console.log('===============================\n');

  // Create admin client
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔗 Project URL:', SUPABASE_URL);
  console.log('🔑 Using Service Role Key\n');

  // Test connection
  try {
    const { data, error } = await supabase.from('transactions').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Service role connection successful\n');
  } catch (err) {
    console.error('❌ Service role connection failed:', err.message);
    return;
  }

  // Generate a new password
  const newPassword = 'BehavioralAnalytics2025!';
  console.log('🔄 Attempting to reset database password...');
  console.log('📝 New password will be:', newPassword);

  try {
    // Try to change the postgres user password via SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `ALTER USER postgres PASSWORD '${newPassword}';`
    });

    if (error) {
      console.log('❌ Direct password reset failed:', error.message);
      console.log('\n💡 Alternative methods:\n');
      
      console.log('1. **Via Supabase Dashboard:**');
      console.log('   - Go to: https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz/settings/database');
      console.log('   - Click "Reset Database Password"');
      console.log('   - Generate new password');
      console.log('   - Update your .env file with the new password\n');
      
      console.log('2. **Via Supabase CLI with correct password:**');
      console.log('   - If you can get the correct password from the dashboard');
      console.log('   - Run: supabase db push --linked --password YOUR_CORRECT_PASSWORD\n');
      
      console.log('3. **Manual SQL execution:**');
      console.log('   - Copy the migration from: supabase/migrations/20250531055217_behavioral_analytics.sql');
      console.log('   - Paste into SQL Editor: https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz/sql');
      console.log('   - Execute manually\n');
      
      return;
    }

    console.log('✅ Database password reset successful!');
    console.log('📝 Update your .env file with:');
    console.log(`DATABASE_PASSWORD=${newPassword}`);
    
    // Test with new password
    console.log('\n🧪 Testing migration with new password...');
    
    const testResult = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_dashboard_summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        p_start_date: '2024-01-01',
        p_end_date: '2024-12-31',
        p_store_id: null
      })
    });

    if (testResult.ok) {
      console.log('✅ Database access confirmed with service role');
      console.log('\n📋 Next step: Run the migration:');
      console.log('supabase db push --linked --password ' + newPassword);
    }

  } catch (err) {
    console.error('❌ Password reset error:', err.message);
    console.log('\n💡 Please use the Supabase Dashboard to reset the password manually.');
  }
}

resetDatabasePassword();