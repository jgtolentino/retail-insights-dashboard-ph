console.log('🔍 VERIFYING BOTH SQL EXECUTIONS COMPLETE');
console.log('========================================');

const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk';

async function verifyBoth() {
  try {
    console.log('📊 Checking Sprint 4 migration...');
    
    // Check Sprint 4 columns
    const sprint4Response = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=id,payment_method,request_type&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    
    let sprint4Complete = false;
    if (sprint4Response.ok) {
      const data = await sprint4Response.json();
      if (data.length > 0 && data[0].payment_method !== null) {
        console.log('✅ Sprint 4 migration: COMPLETE');
        console.log(`📋 Sample: Payment=${data[0].payment_method}, Type=${data[0].request_type}`);
        sprint4Complete = true;
      } else {
        console.log('❌ Sprint 4 migration: NOT COMPLETE');
      }
    } else {
      console.log('❌ Sprint 4 migration: FAILED');
    }
    
    console.log('');
    console.log('👥 Checking customers table...');
    
    // Check customers table
    const customersResponse = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=customer_id,name,region&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    
    let customersComplete = false;
    if (customersResponse.ok) {
      const customers = await customersResponse.json();
      if (customers.length > 0) {
        console.log('✅ Customers table: COMPLETE');
        console.log(`📋 Sample: ${customers[0].name} from ${customers[0].region}`);
        customersComplete = true;
      } else {
        console.log('⚠️  Customers table exists but empty');
      }
    } else if (customersResponse.status === 404) {
      console.log('❌ Customers table: NOT CREATED');
    } else {
      console.log('❌ Customers table: ERROR', customersResponse.status);
    }
    
    console.log('');
    console.log('🎯 OVERALL STATUS:');
    if (sprint4Complete && customersComplete) {
      console.log('✅ BOTH MIGRATIONS COMPLETE!');
      console.log('🚀 Dashboard should now work without errors');
      console.log('🔗 Production URL: https://retail-insights-dashboard-jndcigqnx-jakes-projects-e9f46c30.vercel.app');
    } else {
      console.log('❌ Some migrations incomplete:');
      if (!sprint4Complete) console.log('   - Sprint 4 migration needed');
      if (!customersComplete) console.log('   - Customers table needed');
    }
    
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
  }
}

verifyBoth();