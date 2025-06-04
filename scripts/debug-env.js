#!/usr/bin/env node

console.log('🔍 Environment Variables Debug Tool');
console.log('===================================\n');

// Check for required variables
const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const optional = [
  'VITE_SUPABASE_MCP_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_PASSWORD',
  'NODE_ENV',
  'USE_MOCK_DATA'
];

console.log('📋 REQUIRED Environment Variables:');
required.forEach(key => {
  const value = process.env[key];
  const status = value ? '✅' : '❌';
  const display = value ? 
    (key.includes('KEY') ? `${value.substring(0, 20)}...` : value) : 
    'NOT SET';
  console.log(`   ${status} ${key}: ${display}`);
});

console.log('\n📋 OPTIONAL Environment Variables:');
optional.forEach(key => {
  const value = process.env[key];
  const status = value ? '✅' : '⚪';
  const display = value ? 
    (key.includes('KEY') ? `${value.substring(0, 20)}...` : value) : 
    'not set';
  console.log(`   ${status} ${key}: ${display}`);
});

// Check for common issues
console.log('\n🔧 DIAGNOSTIC CHECKS:');

// Check if running in correct environment
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`   🌍 Environment: ${nodeEnv}`);

// Check if variables are properly prefixed
const viteVars = Object.keys(process.env).filter(key => key.startsWith('VITE_'));
console.log(`   🔧 VITE_ prefixed vars found: ${viteVars.length}`);
if (viteVars.length > 0) {
  viteVars.forEach(key => {
    console.log(`      - ${key}`);
  });
}

// Check missing required variables
const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.log('\n❌ MISSING REQUIRED VARIABLES:');
  missing.forEach(key => {
    console.log(`   - ${key}`);
  });
  
  console.log('\n🔧 QUICK FIX FOR LOVABLE:');
  console.log('   1. Go to your Lovable project settings');
  console.log('   2. Find "Environment Variables" section');
  console.log('   3. Add these variables:');
  console.log('   VITE_SUPABASE_URL=https://lcoxtanyckjzyxxcsjzz.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA');
  console.log('   4. Save and redeploy');
  
  process.exit(1);
}

// Test Supabase URL validity
const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    if (url.hostname.includes('supabase.co')) {
      console.log('   ✅ Supabase URL format is valid');
    } else {
      console.log('   ⚠️ URL doesn\'t look like a Supabase URL');
    }
  } catch (error) {
    console.log('   ❌ Invalid URL format');
  }
}

// Check MCP configuration
const mcpUrl = process.env.VITE_SUPABASE_MCP_URL;
if (mcpUrl) {
  console.log('   🔗 MCP (Managed Connection Proxy) is configured');
  try {
    const url = new URL(mcpUrl);
    console.log(`      MCP endpoint: ${url.origin}`);
  } catch (error) {
    console.log('   ❌ Invalid MCP URL format');
  }
} else {
  console.log('   📝 Using standard Supabase connection (no MCP)');
}

console.log('\n✅ Environment debug complete!');
console.log('\n📖 For detailed setup instructions, see:');
console.log('   - ENVIRONMENT_SETUP.md');
console.log('   - DEPLOYMENT_CHECKLIST.md');