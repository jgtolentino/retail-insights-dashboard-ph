#!/usr/bin/env node
/**
 * Data Display Validation - Compares displayed metrics with actual database queries
 * Ensures what users see matches real data
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
);

async function validateDisplayedMetrics() {
  console.log('🔍 Validating displayed data vs database reality...\n');
  
  const results = [];
  
  // Test 1: Total Transactions
  try {
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total Transactions: ${count} (displayed: 18,000)`);
    results.push({
      metric: 'Total Transactions',
      actual: count,
      displayed: 18000,
      match: count === 18000
    });
  } catch (err) {
    console.log(`❌ Error checking transactions: ${err.message}`);
  }

  // Test 2: Total Revenue
  try {
    const { data } = await supabase
      .from('transactions')
      .select('total_amount');
    
    const totalRevenue = data?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
    const displayedRevenue = 4713281;
    
    console.log(`💰 Total Revenue: ₱${totalRevenue.toLocaleString()} (displayed: ₱${displayedRevenue.toLocaleString()})`);
    results.push({
      metric: 'Total Revenue',
      actual: totalRevenue,
      displayed: displayedRevenue,
      match: Math.abs(totalRevenue - displayedRevenue) < 1000
    });
  } catch (err) {
    console.log(`❌ Error checking revenue: ${err.message}`);
  }

  // Test 3: Unique Customers
  try {
    const { data } = await supabase
      .from('transactions')
      .select('customer_id');
    
    const uniqueCustomers = new Set(data?.map(t => t.customer_id) || []).size;
    
    console.log(`👥 Unique Customers: ${uniqueCustomers} (displayed: 18,000)`);
    results.push({
      metric: 'Unique Customers',
      actual: uniqueCustomers,
      displayed: 18000,
      match: uniqueCustomers === 18000
    });
  } catch (err) {
    console.log(`❌ Error checking customers: ${err.message}`);
  }

  // Summary
  const passing = results.filter(r => r.match).length;
  const total = results.length;
  
  console.log(`\n📈 Validation Summary: ${passing}/${total} metrics match`);
  
  if (passing === total) {
    console.log('✅ All displayed metrics match database reality!');
  } else {
    console.log('⚠️  Some metrics need adjustment:');
    results.filter(r => !r.match).forEach(r => {
      console.log(`  • ${r.metric}: Actual=${r.actual}, Displayed=${r.displayed}`);
    });
  }
  
  return { results, success: passing === total };
}

// Run validation
if (require.main === module) {
  validateDisplayedMetrics()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(err => {
      console.error('❌ Validation failed:', err.message);
      process.exit(1);
    });
}

module.exports = { validateDisplayedMetrics };