/**
 * SUPABASE CLIENT CONFIGURATION
 * 
 * ⚠️  IMPORTANT: DO NOT AUTO-GENERATE THIS FILE
 * 
 * This file MUST always use environment variables to prevent
 * the recurring issue of hardcoded credentials being deployed.
 * 
 * Environment variables required:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ALWAYS use environment variables - NEVER hardcode credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables are present
if (!SUPABASE_URL) {
  throw new Error('❌ VITE_SUPABASE_URL environment variable is required');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('❌ VITE_SUPABASE_ANON_KEY environment variable is required');
}

// Development logging
if (import.meta.env.DEV) {
  console.log('✅ Supabase client initialized with environment variables');
  console.log('📍 Supabase URL:', SUPABASE_URL);
  console.log('🔑 Anon Key configured:', SUPABASE_ANON_KEY ? 'Yes' : 'No');
}

// Create and export the Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export configuration for debugging
export const supabaseConfig = {
  url: SUPABASE_URL,
  hasAnonKey: !!SUPABASE_ANON_KEY,
  environment: import.meta.env.MODE
};