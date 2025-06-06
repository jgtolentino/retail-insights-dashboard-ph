import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables for Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export standard client for immediate compatibility (uses environment variables)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response;
        })
        .catch(error => {
          throw error;
        });
    },
  },
});

// Environment variables - these should be set in Vercel or your deployment platform
const MCP_URL = import.meta.env.VITE_SUPABASE_MCP_URL;

// Function to fetch the short-lived MCP token from our serverless endpoint
const fetchMcpToken = async () => {
  const resp = await fetch('/api/getMcpToken', { method: 'POST' });
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Failed to fetch MCP token: ${resp.status} - ${errorText}`);
  }
  const { token } = await resp.json();
  return token;
};

// Async function to get the Supabase client instance using the fetched token
export async function getSupabaseClient() {
  // If MCP is configured, use it
  if (MCP_URL) {
    try {
      const token = await fetchMcpToken();
      // Create client with MCP URL and token
      return createClient<Database>(MCP_URL, token);
    } catch (error) {
      // Fallback to standard client using environment variables
      const standardSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const standardSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!standardSupabaseUrl || !standardSupabaseAnonKey) {
        throw new Error('Supabase environment variables not set for fallback.');
      }
      return createClient<Database>(standardSupabaseUrl, standardSupabaseAnonKey);
    }
  } else {
    // If MCP is not configured, use standard client with environment variables
    const standardSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const standardSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!standardSupabaseUrl || !standardSupabaseAnonKey) {
      throw new Error('Supabase environment variables not set.');
    }
    return createClient<Database>(standardSupabaseUrl, standardSupabaseAnonKey);
  }
}

// Note: Components and hooks should prefer using the async getSupabaseClient() function
// for data fetching that requires RLS or benefits from the MCP setup.
// The exported 'supabase' client can be used for immediate access if needed,
// but relies on environment variables being set at load time.
