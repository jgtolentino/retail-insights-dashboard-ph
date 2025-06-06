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
  realtime: {
    enabled: false
  }
});

// Environment variables - these should be set in Vercel or your deployment platform
const MCP_URL = import.meta.env.VITE_SUPABASE_MCP_URL;

// Cache for MCP token
let cachedMcpToken: string | null = null;
let mcpTokenExpiry: number | null = null;

// Function to fetch the short-lived MCP token from our serverless endpoint
const fetchMcpToken = async () => {
  // Check cache first
  if (cachedMcpToken && mcpTokenExpiry && Date.now() < mcpTokenExpiry) {
    console.log('ℹ️ Using cached MCP token.');
    return cachedMcpToken;
  }

  console.log('ℹ️ Fetching new MCP token...');
  try {
    const resp = await fetch('/api/getMcpToken', { method: 'POST' });
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error(`Failed to fetch MCP token: ${resp.status} - ${errorText}`);
      // Don't throw here, allow fallback or retry if applicable by the caller
      return null;
    }
    const tokenData = await resp.json();

    if (tokenData.access_token && tokenData.expires_in) {
      cachedMcpToken = tokenData.access_token;
      // expires_in is in seconds, convert to milliseconds for Date.now() comparison
      // Add a small buffer (e.g., 60 seconds) to ensure token is valid when used
      const bufferSeconds = 60;
      mcpTokenExpiry = Date.now() + (tokenData.expires_in - bufferSeconds) * 1000;
      console.log('✅ New MCP token fetched and cached.');
      return cachedMcpToken;
    } else {
      console.error('❌ MCP token response did not include access_token or expires_in:', tokenData);
      return null;
    }
  } catch (error) {
    console.error('🚨 Error fetching MCP token:', error);
    return null; // Return null to indicate failure, allowing caller to handle
  }
};

// Async function to get the Supabase client instance using the fetched token
export async function getSupabaseClient() {
  // If MCP is configured, use it
  if (MCP_URL) {
    const token = await fetchMcpToken();
    if (token) {
      // Create client with MCP URL and token
      return createClient<Database>(MCP_URL, token);
    } else {
      console.error('Error fetching MCP token, falling back to standard client.');
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
