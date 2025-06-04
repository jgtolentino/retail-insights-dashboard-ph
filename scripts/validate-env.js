#!/usr/bin/env node

const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const optional = [
  'VITE_SUPABASE_MCP_URL'  // MCP URL for managed connections
];

console.log('🔍 Validating environment variables...');

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`   - ${key}`));
  console.error('\nPlease set these variables in your .env file or deployment platform.');
  process.exit(1);
}

// Check for problematic settings
if (process.env.USE_MOCK_DATA === 'true') {
  console.warn('⚠️  WARNING: Mock data is enabled! This should be false in production.');
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Mock data cannot be enabled in production!');
    process.exit(1);
  }
}

// Validate URLs
try {
  const supabaseUrl = new URL(process.env.VITE_SUPABASE_URL);
  if (!supabaseUrl.hostname.includes('supabase')) {
    console.warn('⚠️  WARNING: SUPABASE_URL doesn\'t look like a Supabase URL');
  }
} catch (error) {
  console.error('❌ Invalid SUPABASE_URL format');
  process.exit(1);
}

// Check for MCP configuration
if (process.env.VITE_SUPABASE_MCP_URL) {
  console.log('🔗 MCP (Managed Connection Proxy) detected');
  try {
    const mcpUrl = new URL(process.env.VITE_SUPABASE_MCP_URL);
    console.log(`   MCP URL: ${mcpUrl.origin}`);
  } catch (error) {
    console.error('❌ Invalid MCP URL format');
    process.exit(1);
  }
} else {
  console.log('📝 Using standard Supabase connection (no MCP)');
}

console.log('✅ Environment validation passed!');

// Additional checks for production
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Production environment detected - running additional checks...');
  
  // Check for development dependencies in production
  try {
    require('typescript');
    console.warn('⚠️  TypeScript detected in production bundle - this might increase bundle size');
  } catch (e) {
    // TypeScript not in runtime, which is good
  }
  
  console.log('✅ Production validation completed!');
}