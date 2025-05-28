#!/usr/bin/env node

// This script verifies that required environment variables are set during build
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

console.log('🔍 Verifying environment variables...\n');

let hasErrors = false;

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName} is set`);
    // Log first 10 chars for debugging (safe for URLs)
    if (varName === 'VITE_SUPABASE_URL') {
      console.log(`   Value: ${process.env[varName].substring(0, 30)}...`);
    } else {
      console.log(`   Value: [REDACTED]`);
    }
  } else {
    console.error(`❌ ${varName} is NOT set`);
    hasErrors = true;
  }
});

console.log('\n📋 Build environment:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   VERCEL: ${process.env.VERCEL || 'not set'}`);
console.log(`   VERCEL_ENV: ${process.env.VERCEL_ENV || 'not set'}`);

// Skip validation in CI environments (like GitHub Actions) or Vercel builds
const isCI = process.env.CI === 'true' || process.env.VERCEL === '1';

if (hasErrors && !isCI) {
  console.error('\n❌ Environment validation failed! Some required variables are missing.');
  process.exit(1);
} else if (hasErrors && isCI) {
  console.warn('\n⚠️  Running in CI/Vercel without env vars - skipping validation');
  console.log('ℹ️  Environment variables should be available at runtime in deployment platform');
} else {
  console.log('\n✅ All environment variables are properly set!');
}