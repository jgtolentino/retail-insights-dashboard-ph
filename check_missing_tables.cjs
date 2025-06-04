const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk';

async function checkTables() {
  console.log('🔍 Checking for missing database tables...');
  
  const tables = ['customers', 'products', 'stores', 'brands', 'transactions'];
  
  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${table}: ${data.length > 0 ? 'Has data' : 'Empty'}`);
      } else if (response.status === 404) {
        console.log(`❌ ${table}: Table does not exist`);
      } else if (response.status === 400) {
        console.log(`⚠️  ${table}: Bad request (might be schema issue)`);
      } else {
        console.log(`❌ ${table}: Error ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
}

checkTables();