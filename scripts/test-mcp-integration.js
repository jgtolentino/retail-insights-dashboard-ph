// Test script for MCP integration
// Run this in browser console to test MCP functionality

async function testMCPIntegration() {
  console.log('🧪 Testing MCP Integration...\n');

  // Test 1: Check environment variables
  console.log('1. Environment Variables:');
  console.log('   VITE_SUPABASE_MCP_URL:', import.meta.env.VITE_SUPABASE_MCP_URL || 'Not set');
  
  // Test 2: Test MCP token endpoint
  console.log('\n2. Testing /api/getMcpToken endpoint:');
  try {
    const response = await fetch('/api/getMcpToken', { method: 'POST' });
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ MCP token endpoint working');
      console.log('   Token received:', data.token ? 'Yes' : 'No');
      console.log('   Expires in:', data.expiresIn, 'seconds');
    } else {
      console.log('   ❌ MCP token endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('   ❌ MCP token endpoint error:', error.message);
  }

  // Test 3: Test Supabase client creation
  console.log('\n3. Testing Supabase client creation:');
  try {
    // Import the getSupabaseClient function
    const { getSupabaseClient } = await import('/src/integrations/supabase/client.ts');
    const client = await getSupabaseClient();
    console.log('   ✅ Supabase client created successfully');
    
    // Test a simple query
    const { data, error } = await client.from('brands').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('   ❌ Query failed:', error.message);
    } else {
      console.log('   ✅ Query successful, brands count:', data);
    }
  } catch (error) {
    console.log('   ❌ Client creation failed:', error.message);
  }

  // Test 4: Monitor network requests
  console.log('\n4. Monitor Network Requests:');
  console.log('   Check Network tab for requests to:');
  console.log('   - MCP URL: https://lcoxtanyckjzyxxcsjzz.mcp.supabase.co (if MCP enabled)');
  console.log('   - Standard URL: https://lcoxtanyckjzyxxcsjzz.supabase.co (fallback)');

  console.log('\n🏁 MCP Integration Test Complete!');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  testMCPIntegration();
}

export { testMCPIntegration };