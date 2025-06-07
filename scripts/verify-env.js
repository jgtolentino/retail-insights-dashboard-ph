#!/usr/bin/env node

// Environment verification script for retail insights dashboard

const envVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('🔍 Verifying environment variables...');

let allValid = true;

envVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ Missing: ${varName}`);
    allValid = false;
  } else {
    console.log(`✅ Found: ${varName} (${value.substring(0, 10)}...)`);
  }
});

if (allValid) {
  console.log('✅ All environment variables verified');
  process.exit(0);
} else {
  console.log('❌ Environment verification failed');
  process.exit(1);
}