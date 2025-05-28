#!/usr/bin/env node

// This script verifies that required environment variables are set during build
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

console.log('🔍 Verifying environment variables...\n');

let hasErrors = false;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value.trim() !== '') {
    console.log(`✅ ${varName} is set`);
    // Log first 30 chars for debugging (safe for URLs)
    if (varName === 'VITE_SUPABASE_URL') {
      console.log(`   Value: ${value.substring(0, 30)}...`);
      // Additional validation for URL format
      if (!value.startsWith('https://')) {
        console.warn(`   ⚠️  Warning: URL should start with https://`);
      }
    } else {
      console.log(`   Value: [REDACTED - ${value.length} chars]`);
      // Additional validation for anon key format
      if (value.length < 100) {
        console.warn(`   ⚠️  Warning: Anon key seems unusually short`);
      }
    }
  } else {
    console.error(`❌ ${varName} is NOT set or is empty`);
    if (value === '') {
      console.error(`   (Variable exists but is empty string)`);
    }
    hasErrors = true;
  }
});

console.log('\n📋 Build environment:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   VERCEL: ${process.env.VERCEL || 'not set'}`);
console.log(`   VERCEL_ENV: ${process.env.VERCEL_ENV || 'not set'}`);
console.log(`   VERCEL_GIT_COMMIT_REF: ${process.env.VERCEL_GIT_COMMIT_REF || 'not set'}`);

// Additional debugging for troubleshooting
console.log('\n🔧 Debug information:');
console.log(`   Total env vars: ${Object.keys(process.env).length}`);
const viteVars = Object.keys(process.env).filter(key => key.startsWith('VITE_'));
console.log(`   VITE_ prefixed vars: ${viteVars.length} (${viteVars.join(', ') || 'none'})`);

// Skip validation in CI environments (like GitHub Actions)
const isCI = process.env.CI === 'true';

if (hasErrors && !isCI) {
  console.error('\n❌ Environment validation failed! Some required variables are missing.');
  process.exit(1);
} else if (hasErrors && isCI) {
  console.warn('\n⚠️  Running in CI without env vars - skipping validation');
  console.log('ℹ️  Environment variables should be set in Vercel, not in GitHub Actions');
} else {
  console.log('\n✅ All environment variables are properly set!');
}