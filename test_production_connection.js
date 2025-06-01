// Test production connection to diagnose live dashboard issues
import { createClient } from '@supabase/supabase-js';

console.log('🔍 TESTING PRODUCTION DASHBOARD CONNECTION');
console.log('🌐 Testing: https://retail-insights-dashboard-ph.vercel.app/\n');

// Test both possible Supabase configurations
const configs = [
  {
    name: 'Local .env config',
    url: 'https://lcoxtanyckjzyxxcsjzz.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA'
  },
  {
    name: 'Production config (detected earlier)',
    url: 'https://smdpkvysqnsjwxmldfcx.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZHBrdnlzcW5zand4bWxkZmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQxNTc1NzMsImV4cCI6MjAyOTczMzU3M30.CUtW2TGdKvtAZqc4Ak3jjAOd1nAA1x-Yb7RBJnGGnxA'
  }
];

async function testConfig(config) {
  try {
    console.log(`📊 Testing: ${config.name}`);
    console.log(`🔗 URL: ${config.url}`);
    
    const supabase = createClient(config.url, config.key);
    
    // Test basic connection
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ Success! Found ${count} transactions`);
    
    // Test sample data
    const { data: sampleData } = await supabase
      .from('transactions')
      .select('*')
      .limit(3);
    
    console.log(`📋 Sample data:`, sampleData?.map(t => ({
      id: t.id,
      amount: t.total_amount,
      location: t.store_location
    })));
    
    return { success: true, count, sampleData };
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting production connection tests...\n');
  
  for (const config of configs) {
    const result = await testConfig(config);
    console.log('─'.repeat(60));
    
    if (result.success) {
      console.log(`🎉 SUCCESS with ${config.name}!`);
      console.log(`📊 Found ${result.count} transactions in database`);
      
      if (result.count === 18000) {
        console.log('🎯 PERFECT! This is your 18,000 transaction dataset');
      } else if (result.count > 15000) {
        console.log('✅ Good! Large dataset available');
      } else {
        console.log('⚠️  Smaller dataset than expected');
      }
      
      break; // Found working config
    }
  }
  
  console.log('\n🔧 PRODUCTION DASHBOARD DIAGNOSIS:');
  console.log('If connection test succeeds but dashboard shows minimal content:');
  console.log('1. JavaScript build issue in production');
  console.log('2. Environment variables not set in Vercel');
  console.log('3. Build/deployment errors');
  console.log('4. Client-side routing issues');
}

runTests().catch(console.error);