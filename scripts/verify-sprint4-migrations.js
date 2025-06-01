// Verification script to check if migrations were applied
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lcoxtanyckjzyxxcsjzz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk'
);

async function verifyMigrations() {
  console.log('🔍 Verifying Sprint 4 migrations...\n');
  
  // Check if new tables exist
  const { data: tables, error: tablesError } = await supabase
    .from('substitutions')
    .select('count')
    .limit(1);
  
  if (tablesError && tablesError.code === '42P01') {
    console.log('❌ Table "substitutions" not found - migrations not applied yet');
  } else if (!tablesError) {
    console.log('✅ Table "substitutions" exists');
  }
  
  // Check if new columns exist in transactions
  const { data: transaction, error: transError } = await supabase
    .from('transactions')
    .select('payment_method, checkout_time, request_type')
    .limit(1);
  
  if (transError) {
    console.log('❌ New columns not found in transactions table');
  } else {
    console.log('✅ New columns exist in transactions table');
  }
  
  // Test one of the new functions
  const { data: funcTest, error: funcError } = await supabase
    .rpc('get_payment_method_analysis');
  
  if (funcError) {
    console.log('❌ New functions not found');
  } else {
    console.log('✅ New analytics functions are available');
  }
  
  console.log('\n📊 Migration verification complete!');
}

verifyMigrations().catch(console.error);