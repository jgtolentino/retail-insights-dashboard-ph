#!/usr/bin/env node

// Supabase configuration verification script

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Verifying Supabase configuration...');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  process.exit(1);
}

try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test basic connection
  const { data, error } = await supabase
    .from('brands')
    .select('count')
    .limit(1);
    
  if (error) {
    console.log('❌ Supabase connection failed:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Supabase connection verified');
  console.log(`📊 Database accessible (brands table found)`);
  process.exit(0);
} catch (error) {
  console.log('❌ Supabase verification failed:', error.message);
  process.exit(1);
}