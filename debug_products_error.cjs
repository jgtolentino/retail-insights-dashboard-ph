const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk';

async function debugProductsError() {
  console.log('🔍 Debugging products API error...');
  
  try {
    // Check if products table exists and what columns it has
    const basicResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    
    console.log('Basic products query status:', basicResponse.status);
    
    if (basicResponse.ok) {
      const data = await basicResponse.json();
      console.log('✅ Products table exists');
      if (data.length > 0) {
        console.log('📋 Available columns:', Object.keys(data[0]));
        console.log('📦 Sample product:', data[0]);
      } else {
        console.log('⚠️  Products table is empty');
      }
    } else {
      console.log('❌ Products table query failed');
      const error = await basicResponse.text();
      console.log('Error:', error);
    }
    
    // Test the specific failing query
    console.log('');
    console.log('🔍 Testing specific failing query: products?select=category&category=neq.null');
    
    const categoryResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?select=category&category=neq.null`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    
    console.log('Category query status:', categoryResponse.status);
    
    if (categoryResponse.ok) {
      const categoryData = await categoryResponse.json();
      console.log('✅ Category query works');
      console.log('📊 Categories found:', categoryData.length);
    } else {
      console.log('❌ Category query failed');
      const categoryError = await categoryResponse.text();
      console.log('Category error:', categoryError);
      
      // Check if category column exists
      console.log('');
      console.log('🔍 Checking if category column exists...');
      const schemaResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?select=name&limit=1`, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      });
      
      if (schemaResponse.ok) {
        console.log('✅ Products table accessible, category column might be missing');
      }
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugProductsError();