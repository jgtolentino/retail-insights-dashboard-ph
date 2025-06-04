const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk';

async function checkAllAPIs() {
  console.log('🔍 CHECKING ALL API ENDPOINTS FOR ERRORS');
  console.log('========================================');
  
  const tests = [
    {
      name: 'Basic transactions',
      url: `${SUPABASE_URL}/rest/v1/transactions?select=*&limit=1`
    },
    {
      name: 'Products with category (should fail)',
      url: `${SUPABASE_URL}/rest/v1/products?select=category&category=neq.null`
    },
    {
      name: 'Products basic',
      url: `${SUPABASE_URL}/rest/v1/products?select=*&limit=1`
    },
    {
      name: 'Brands with category',
      url: `${SUPABASE_URL}/rest/v1/brands?select=category&category=neq.null`
    },
    {
      name: 'Customers basic',
      url: `${SUPABASE_URL}/rest/v1/customers?select=*&limit=1`
    },
    {
      name: 'Customers regions',
      url: `${SUPABASE_URL}/rest/v1/customers?select=region&region=neq.null`
    },
    {
      name: 'Stores',
      url: `${SUPABASE_URL}/rest/v1/stores?select=name&name=neq.null`
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n📊 Testing: ${test.name}`);
      
      const response = await fetch(test.url, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name}: OK (${data.length} records)`);
      } else {
        console.log(`❌ ${test.name}: ERROR ${response.status}`);
        const error = await response.text();
        console.log(`   Error: ${error.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: EXCEPTION - ${error.message}`);
    }
  }
  
  console.log('\n🎯 SUMMARY OF ISSUES TO FIX:');
  console.log('============================');
}

checkAllAPIs();