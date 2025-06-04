const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk';

async function checkColumns() {
  try {
    console.log('🔍 Checking transactions table columns...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=*&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        console.log('📋 Available columns:');
        Object.keys(data[0]).forEach(col => {
          console.log(`   - ${col}: ${data[0][col]}`);
        });
      }
    } else {
      console.log('❌ Failed to fetch columns');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkColumns();