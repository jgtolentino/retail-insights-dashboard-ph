#!/usr/bin/env node

/**
 * Supabase Configuration Verification Script
 * 
 * This script ensures the Supabase client always uses environment variables
 * and prevents the recurring issue of hardcoded credentials.
 */

import fs from 'fs';
import path from 'path';

const CLIENT_FILE = 'src/integrations/supabase/client.ts';

function verifySupabaseConfig() {
  console.log('🔍 Verifying Supabase configuration...');
  
  if (!fs.existsSync(CLIENT_FILE)) {
    console.error(`❌ Supabase client file not found: ${CLIENT_FILE}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(CLIENT_FILE, 'utf8');
  
  // Check for hardcoded credentials (bad patterns)
  const badPatterns = [
    /const SUPABASE_URL = ['"`]https:\/\/[^'"`]+['"`]/,
    /const SUPABASE.*KEY = ['"`]eyJ[^'"`]+['"`]/,
    /= ['"`]https:\/\/.*\.supabase\.co['"`]/,
    /createClient\(['"`]https:\/\//
  ];
  
  // Check for good patterns (environment variables)
  const goodPatterns = [
    /import\.meta\.env\.VITE_SUPABASE_URL/,
    /import\.meta\.env\.VITE_SUPABASE_ANON_KEY/
  ];
  
  const issues = [];
  
  // Check for bad patterns
  badPatterns.forEach((pattern, index) => {
    if (pattern.test(content)) {
      issues.push(`❌ Found hardcoded credentials (pattern ${index + 1})`);
    }
  });
  
  // Check for good patterns
  goodPatterns.forEach((pattern, index) => {
    if (!pattern.test(content)) {
      issues.push(`❌ Missing environment variable usage (pattern ${index + 1})`);
    }
  });
  
  // Check for auto-generation comment (should be removed)
  if (content.includes('automatically generated')) {
    issues.push('❌ File still marked as auto-generated');
  }
  
  if (issues.length > 0) {
    console.error('\n💥 Supabase Configuration Issues Found:');
    issues.forEach(issue => console.error(`  ${issue}`));
    console.error('\n📝 The Supabase client must use environment variables:');
    console.error('  - VITE_SUPABASE_URL');
    console.error('  - VITE_SUPABASE_ANON_KEY');
    console.error('\n🔧 Run this to fix:');
    console.error('  npm run fix:supabase-config');
    process.exit(1);
  }
  
  console.log('✅ Supabase configuration is correct');
  console.log('✅ Uses environment variables');
  console.log('✅ No hardcoded credentials found');
  
  return true;
}

// Check if environment variables are set
function checkEnvironmentVariables() {
  console.log('\n🔍 Checking environment variables...');
  
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Missing environment variables (may be set in Vercel):');
    missingVars.forEach(varName => console.warn(`  - ${varName}`));
    console.warn('\n📋 Make sure these are set in:');
    console.warn('  - .env file (for local development)');
    console.warn('  - Vercel dashboard (for deployments)');
  } else {
    console.log('✅ All required environment variables are set');
  }
}

// Main function
function main() {
  console.log('🚀 Supabase Configuration Verification\n');
  
  try {
    verifySupabaseConfig();
    checkEnvironmentVariables();
    
    console.log('\n🎉 Verification complete - Configuration is secure!');
  } catch (error) {
    console.error('\n💥 Verification failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { verifySupabaseConfig, checkEnvironmentVariables };