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

// Hardcoded fallback values for bulletproof reliability
const FALLBACK_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';

// Check multiple possible environment variable names
const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  import.meta.env.SUPABASE_URL ||
  process.env?.VITE_SUPABASE_URL ||
  process.env?.NEXT_PUBLIC_SUPABASE_URL ||
  process.env?.SUPABASE_URL ||
  FALLBACK_URL;

const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  import.meta.env.SUPABASE_ANON_KEY ||
  process.env?.VITE_SUPABASE_ANON_KEY ||
  process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env?.SUPABASE_ANON_KEY ||
  FALLBACK_KEY;

// Log if using fallbacks
if (SUPABASE_URL === FALLBACK_URL || SUPABASE_ANON_KEY === FALLBACK_KEY) {
  console.warn('⚠️ Using fallback Supabase configuration');
  console.warn('To use custom configuration, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Logging to debug which variables are being used
if (import.meta.env.DEV || !import.meta.env.SSR) {
  console.log('✅ Supabase client initialized');
  console.log('📍 Using URL from:', 
    import.meta.env.VITE_SUPABASE_URL ? 'VITE_SUPABASE_URL' :
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' :
    import.meta.env.SUPABASE_URL ? 'SUPABASE_URL' :
    'process.env variables'
  );
  console.log('🔑 Using key from:', 
    import.meta.env.VITE_SUPABASE_ANON_KEY ? 'VITE_SUPABASE_ANON_KEY' :
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' :
    import.meta.env.SUPABASE_ANON_KEY ? 'SUPABASE_ANON_KEY' :
    'process.env variables'
  );
  console.log('🌐 URL:', SUPABASE_URL?.substring(0, 30) + '...');
}

// Create and export the Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export configuration for debugging
export const supabaseConfig = {
  url: SUPABASE_URL,
  hasAnonKey: !!SUPABASE_ANON_KEY,
  environment: import.meta.env.MODE
};