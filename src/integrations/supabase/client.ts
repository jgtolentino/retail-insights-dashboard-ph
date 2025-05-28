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

// Read from environment variables with temporary fallback for development
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';

// Show warning if using fallback values
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Using fallback Supabase configuration.');
  console.warn('For production, set these environment variables in Vercel:');
  console.warn('- VITE_SUPABASE_URL');
  console.warn('- VITE_SUPABASE_ANON_KEY');
  
  if (import.meta.env.PROD) {
    console.error('❌ Environment variables MUST be set in production!');
  }
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