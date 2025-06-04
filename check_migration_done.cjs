const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk';

async function checkMigration() {
  try {
    console.log('🔍 Checking if Sprint 4 migration is complete...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=id,payment_method&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.length > 0 && data[0].payment_method !== null) {
        console.log('🎉 SPRINT 4 MIGRATION COMPLETED!');
        console.log('✅ Payment method column exists and has data');
        
        // Get count
        const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=id&payment_method=neq.null`, {
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Prefer': 'count=exact'
          }
        });
        
        if (countResponse.ok) {
          const countHeader = countResponse.headers.get('content-range');
          if (countHeader) {
            const totalCount = countHeader.split('/')[1];
            console.log(`📊 Enhanced transactions: ${totalCount}`);
            console.log('🚀 Dashboard is now fully enhanced!');
          }
        }
        
      } else {
        console.log('❌ Migration not complete yet');
        console.log('👆 Execute the manual SQL steps above');
      }
    } else {
      console.log('❌ Migration not complete - columns do not exist');
      console.log('👆 Execute the manual SQL steps above');
    }
    
  } catch (error) {
    console.log('❌ Check failed:', error.message);
  }
}

checkMigration();